import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import './schemas';
import './paths';

export const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'DeepTools API Documentation',
    version: '1.0.0',
    description:
      'Bilingual AI & Database SaaS Platform REST API (Express.js + TypeScript + Prisma ORM + Zod)',
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and profile management' },
    { name: 'Products', description: 'AI agents and database utilities' },
    { name: 'Templates', description: 'Workflow automation templates' },
    {
      name: 'Admin',
      description: 'Administrative controls (requires admin role)',
    },
  ],
});

export default swaggerDocument;
