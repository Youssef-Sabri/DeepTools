import { Request, Response } from 'express';
import { uploadsService, UploadsService } from './uploads.service';
import {
  CreateUploadInput,
  UpdateUploadInput,
  listMyUploadsQuerySchema,
} from './uploads.validator';

export class UploadsController {
  constructor(private readonly service: UploadsService = uploadsService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const input = req.body as CreateUploadInput;
    const file = req.file;

    const product = await this.service.create(sellerId, input, file);
    res.status(201).json({
      success: true,
      data: product,
    });
  };

  getMyUploads = async (req: Request, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const query = listMyUploadsQuerySchema.parse(req.query);

    const result = await this.service.findMyUploads(sellerId, query);
    res.status(200).json({
      success: true,
      data: result,
    });
  };

  getMyUploadById = async (req: Request, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const id = req.params.id as string;

    const product = await this.service.findMyUploadById(sellerId, id);
    res.status(200).json({
      success: true,
      data: product,
    });
  };

  updateMyUpload = async (req: Request, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const id = req.params.id as string;
    const input = req.body as UpdateUploadInput;
    const file = req.file;

    const updated = await this.service.updateMyUpload(
      sellerId,
      id,
      input,
      file,
    );
    res.status(200).json({
      success: true,
      data: updated,
    });
  };

  deleteMyUpload = async (req: Request, res: Response): Promise<void> => {
    const sellerId = req.user!.id;
    const id = req.params.id as string;

    const result = await this.service.deleteMyUpload(sellerId, id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  };
}

export const uploadsController = new UploadsController();
