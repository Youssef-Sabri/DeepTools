import { Request, Response } from 'express';
import { templatesService, TemplatesService } from './templates.service';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
} from './templates.validator';

export class TemplatesController {
  constructor(private readonly service: TemplatesService = templatesService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const category = req.query.category as string | undefined;
    const lang =
      (req.query.lang as string) || (req.headers['accept-language'] as string);
    const templates = await this.service.findAll(category, lang);
    res.status(200).json({ success: true, data: templates });
  };

  getOne = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const lang =
      (req.query.lang as string) || (req.headers['accept-language'] as string);
    const template = await this.service.findOne(id, lang);
    res.status(200).json({ success: true, data: template });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const newTemplate = await this.service.create(
      req.body as CreateTemplateInput,
    );
    res.status(201).json({ success: true, data: newTemplate });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const updated = await this.service.update(
      id,
      req.body as UpdateTemplateInput,
    );
    res.status(200).json({ success: true, data: updated });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const result = await this.service.remove(id);
    res.status(200).json({ success: true, data: result });
  };

  download = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const result = await this.service.recordDownload(id);
    res.status(200).json({ success: true, data: result });
  };
}

export const templatesController = new TemplatesController();
