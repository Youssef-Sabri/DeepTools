import {
  templatesRepository,
  TemplatesRepository,
} from './templates.repository';
import { NotFoundError } from '../../utils/apiError';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
} from './templates.validator';
import { Template } from '@prisma/client';

export interface LocalizedTemplate extends Template {
  displayName: string;
  displayDescription: string;
}

export class TemplatesService {
  constructor(
    private readonly repo: TemplatesRepository = templatesRepository,
  ) {}

  private formatTemplate(t: Template, lang?: string): LocalizedTemplate {
    const isAr = lang?.toLowerCase().startsWith('ar');
    return {
      ...t,
      displayName: isAr && t.nameAr ? t.nameAr : t.name,
      displayDescription:
        isAr && t.descriptionAr ? t.descriptionAr : t.description,
    };
  }

  async findAll(
    category?: string,
    lang?: string,
  ): Promise<LocalizedTemplate[]> {
    const list = await this.repo.findAll(category);
    return list.map((t) => this.formatTemplate(t, lang));
  }

  async findOne(id: string, lang?: string): Promise<LocalizedTemplate> {
    const template = await this.repo.findById(id);
    if (!template) {
      throw new NotFoundError('Template not found');
    }
    return this.formatTemplate(template, lang);
  }

  async create(data: CreateTemplateInput) {
    return this.repo.create({
      ...data,
      nameAr: data.nameAr ?? null,
      descriptionAr: data.descriptionAr ?? null,
    });
  }

  async update(id: string, data: UpdateTemplateInput) {
    await this.findOne(id);
    return this.repo.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: 'Template deleted successfully' };
  }

  async recordDownload(id: string) {
    const template = await this.findOne(id);
    await this.repo.incrementDownloads(id);
    return {
      message: 'Download registered successfully',
      downloadUrl: template.downloadUrl || '#',
    };
  }
}

export const templatesService = new TemplatesService();
