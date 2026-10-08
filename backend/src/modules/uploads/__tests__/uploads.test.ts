import request from 'supertest';
import { createApp } from '../../../app';
import { prisma } from '../../../config/database';
import { storageService } from '../../../storage/storage.service';
import { mockUser, createToken } from '../../../test/test-helpers';

jest.mock('../../../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../../storage/storage.service', () => ({
  storageService: {
    save: jest.fn(),
    delete: jest.fn(),
    resolveKeyPath: jest.fn(),
    stream: jest.fn(),
  },
}));

describe('Seller Uploads Endpoints (Task B-2)', () => {
  const app = createApp();
  const userToken = createToken(mockUser);

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === mockUser.id) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  });

  describe('POST /api/v1/uploads', () => {
    it('creates pending product on successful upload', async () => {
      (storageService.save as jest.Mock).mockResolvedValue(
        'uploads/11111111-2222-3333-4444-555555555555.zip',
      );

      (prisma.product.create as jest.Mock).mockResolvedValue({
        id: 'p-1',
        sellerId: mockUser.id,
        name: 'Automation Script',
        description: 'Complete Python automation solution script',
        category: 'script',
        price: 2500,
        status: 'pending',
        fileKey: 'uploads/11111111-2222-3333-4444-555555555555.zip',
        fileSize: 1024,
        fileMime: 'application/zip',
        fileChecksum: 'abc123hash',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const fakeZip = Buffer.from('PK\x03\x04test content inside zip');

      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Automation Script')
        .field('description', 'Complete Python automation solution script')
        .field('category', 'script')
        .field('price', 2500)
        .attach('file', fakeZip, 'solution.zip');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.sellerId).toBe(mockUser.id);
    });

    it('returns 422 when required fields are missing', async () => {
      const fakeZip = Buffer.from('PK\x03\x04test content');

      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${userToken}`)
        .field('category', 'script')
        .attach('file', fakeZip, 'solution.zip');

      expect(res.status).toBe(422);
    });

    it('returns 422 when file is missing', async () => {
      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'No File Script')
        .field('description', 'Description of no file test')
        .field('category', 'script')
        .field('price', 1000);

      expect(res.status).toBe(422);
    });

    it('returns 422 when price is a float', async () => {
      const fakeZip = Buffer.from('PK\x03\x04test content');

      const res = await request(app)
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Float Price Script')
        .field('description', 'Description of float price test')
        .field('category', 'script')
        .field('price', '19.99')
        .attach('file', fakeZip, 'solution.zip');

      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/v1/uploads/mine', () => {
    it('returns only own uploads', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'p-1',
          sellerId: mockUser.id,
          name: 'My Upload',
          status: 'pending',
          price: 2500,
        },
      ]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/uploads/mine')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].sellerId).toBe(mockUser.id);
    });
  });

  describe('PUT /api/v1/uploads/mine/:id', () => {
    it('resets status to pending when editing a rejected upload', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p-rejected',
        sellerId: mockUser.id,
        name: 'Rejected Product',
        description: 'Old description here',
        status: 'rejected',
        rejectionNote: 'Fix the docs',
      });

      (prisma.product.update as jest.Mock).mockResolvedValue({
        id: 'p-rejected',
        sellerId: mockUser.id,
        name: 'Fixed Product',
        description: 'Updated description here',
        status: 'pending',
        rejectionNote: null,
      });

      const res = await request(app)
        .put('/api/v1/uploads/mine/p-rejected')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Fixed Product')
        .field('description', 'Updated description here');

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.rejectionNote).toBeNull();
    });
  });

  describe('DELETE /api/v1/uploads/mine/:id', () => {
    it('returns 403 when attempting to delete an approved product', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p-approved',
        sellerId: mockUser.id,
        status: 'approved',
      });

      const res = await request(app)
        .delete('/api/v1/uploads/mine/p-approved')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it('deletes pending product and removes file from disk', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'p-pending',
        sellerId: mockUser.id,
        status: 'pending',
        fileKey: 'uploads/file-to-delete.zip',
      });
      (prisma.product.delete as jest.Mock).mockResolvedValue({});
      (storageService.delete as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/v1/uploads/mine/p-pending')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(storageService.delete).toHaveBeenCalledWith(
        'uploads/file-to-delete.zip',
      );
    });
  });
});
