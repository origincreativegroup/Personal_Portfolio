import { z } from 'zod';
import { AnyBlock } from './block.js';

export const ProjectStatus = z.enum(['draft', 'published']);

export const Project = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: ProjectStatus.default('draft'),
  blocks: z.array(AnyBlock),
  coverUrl: z.string().url().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProjectT = z.infer<typeof Project>;
