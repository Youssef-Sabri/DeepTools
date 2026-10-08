import request from 'supertest';
import { createApp } from '../../../app';
import { prisma } from '../../../config/database';
import { mockAdmin, mockUser, createToken } from '../../../test/test-helpers';

jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Admin Upload Review Endpoints (Task B-4)', () => {
  const app = createApp();
  const adminToken = createToken(mockAdmin);
  const userToken = createToken(mockUser);

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockAdmin.id) return Promise.resolve(mockAdmin);
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe('PATCH /api/v1/admin/uploads/:id/approve', () => {
    it('approves a pending product successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'upload-1',
        name: 'Pending Upload',
        status: 'pending',
      });

      const now = new Date();
      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: 'upload-1',
        name: 'Pending Upload',
        status: 'approved',
        reviewedAt: now,
        seller: { id: 'seller-1', name: 'Seller', email: 'seller@test.com' },
      });

      const res = await request(app)
        .patch('/api/v1/admin/uploads/upload-1/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('approved');
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'upload-1' },
          data: expect.objectContaining({ status: 'approved' }),
        }),
      );
    });

    it('returns 409 when approving already-approved product', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'upload-already',
        status: 'approved',
      });

      const res = await request(app)
        .patch('/api/v1/admin/uploads/upload-already/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already approved/i);
    });

    it('returns 403 when regular user token is used on admin route', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/uploads/upload-1/approve')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/admin/uploads/:id/reject', () => {
    it('rejects a product with reason successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'upload-2',
        status: 'pending',
      });

      const now = new Date();
      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: 'upload-2',
        status: 'rejected',
        rejectionNote: 'File contains prohibited libraries.',
        reviewedAt: now,
      });

      const res = await request(app)
        .patch('/api/v1/admin/uploads/upload-2/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'File contains prohibited libraries.' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('rejected');
    });

    it('returns 422 when rejecting without reason or reason is empty', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/uploads/upload-2/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(422);
    });

    it('returns 409 when rejecting already-rejected product', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'upload-already-rej',
        status: 'rejected',
      });

      const res = await request(app)
        .patch('/api/v1/admin/uploads/upload-already-rej/reject')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Duplicate rejection attempt.' });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already rejected/i);
    });
  });
});
