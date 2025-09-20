import { randomUUID } from 'node:crypto';
import type { AnyBlockT, ProjectT } from '@portfolioforge/schemas';

type ProjectRecord = ProjectT;

type BlockRecord = AnyBlockT;

type NarrativeRecord = {
  projectId: string;
  executiveSummary: string;
  highlights: string[];
  recommendations: string[];
  updatedAt: number;
};

type TemplateRecord = {
  id: string;
  name: string;
  slots: string[];
  rules?: Record<string, unknown>;
};

type PublishedRecord = {
  projectId: string;
  slug: string;
  url: string;
  createdAt: string;
};

export class InMemoryDatabase {
  projects = new Map<string, ProjectRecord>();
  blocks = new Map<string, BlockRecord[]>();
  narratives = new Map<string, NarrativeRecord>();
  templates = new Map<string, TemplateRecord>();
  published = new Map<string, PublishedRecord>();

  createProject(data: Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'blocks'> & { status?: ProjectRecord['status']; blocks?: BlockRecord[] }) {
    const id = data.id ?? randomUUID();
    const now = new Date().toISOString();
    const record: ProjectRecord = {
      id,
      title: data.title,
      summary: data.summary,
      tags: data.tags ?? [],
      status: data.status ?? 'draft',
      blocks: data.blocks ?? [],
      coverUrl: data.coverUrl,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, record);
    if (record.blocks.length) {
      this.blocks.set(id, record.blocks);
    }
    return record;
  }
}

export const db = new InMemoryDatabase();
