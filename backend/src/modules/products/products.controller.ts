import { Request, Response } from 'express';
import { productsService, ProductsService } from './products.service';
import { CreateProductInput, UpdateProductInput } from './products.validator';

export class ProductsController {
  constructor(private readonly service: ProductsService = productsService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const lang =
      (req.query.lang as string) || (req.headers['accept-language'] as string);
    const products = await this.service.findAll(lang);
    res.status(200).json({ success: true, data: products });
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const lang =
      (req.query.lang as string) || (req.headers['accept-language'] as string);
    const product = await this.service.findOne(id, lang);
    res.status(200).json({ success: true, data: product });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const newProduct = await this.service.create(
      req.body as CreateProductInput,
    );
    res.status(201).json({ success: true, data: newProduct });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updated = await this.service.update(
      id,
      req.body as UpdateProductInput,
    );
    res.status(200).json({ success: true, data: updated });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const result = await this.service.remove(id);
    res.status(200).json({ success: true, data: result });
  };

  purchase = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const result = await this.service.purchase(userId, id);
    res.status(201).json({ success: true, data: result });
  };

  getMyLicenses = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const licenses = await this.service.findUserLicenses(userId);
    res.status(200).json({ success: true, data: licenses });
  };
}

export const productsController = new ProductsController();
