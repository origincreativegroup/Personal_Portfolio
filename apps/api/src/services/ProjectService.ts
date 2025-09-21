import { randomUUID } from 'node:crypto';
import { db } from './storage.js';
import type { ProjectT } from '@portfolioforge/schemas';
import { Project } from '@portfolioforge/schemas';

export type CreateProjectInput = {
  title: string;
  summary?: string;
  tags?: string[];
  coverUrl?: string;
};

export type UpdateProjectInput = {
  title?: string;
  summary?: string;
  tags?: string[];
  coverUrl?: string;
};

export class ProjectService {
  async list(status?: ProjectT['status']): Promise<ProjectT[]> {
    const all = Array.from(db.projects.values()).map((project) => ({
      ...project,
      blocks: db.blocks.get(project.id) ?? [],
    }));
    if (status) {
      return all.filter((project) => project.status === status);
    }
    return all;
  }

  async create(input: CreateProjectInput): Promise<ProjectT> {
    const now = new Date().toISOString();
    const record: ProjectT = Project.parse({
      id: randomUUID(),
      title: input.title,
      summary: input.summary,
      tags: input.tags ?? [],
      status: 'draft',
      blocks: [],
      coverUrl: input.coverUrl,
      createdAt: now,
      updatedAt: now,
    });
    db.projects.set(record.id, record);
    db.blocks.set(record.id, []);
    return record;
  }

  async get(id: string): Promise<ProjectT | null> {
    const project = db.projects.get(id);
    if (!project) return null;
    return {
      ...project,
      blocks: db.blocks.get(id) ?? [],
    };
  }

  async update(id: string, input: UpdateProjectInput): Promise<ProjectT | null> {
    const current = db.projects.get(id);
    if (!current) return null;
    const next: ProjectT = Project.parse({
      ...current,
      title: input.title ?? current.title,
      summary: input.summary ?? current.summary,
      tags: input.tags ?? current.tags,
      coverUrl: input.coverUrl ?? current.coverUrl,
      updatedAt: new Date().toISOString(),
      blocks: db.blocks.get(id) ?? [],
    });
    db.projects.set(id, next);
    return next;
  }

  async publish(id: string): Promise<{ project: ProjectT; url: string; slug: string } | null> {
    const project = await this.get(id);
    if (!project) return null;
    const slug = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id.slice(0, 8)}`;
    const url = `https://portfolioforge.dev/projects/${slug}`;
    db.projects.set(id, {
      ...project,
      status: 'published',
      updatedAt: new Date().toISOString(),
    });
    db.published.set(id, {
      projectId: id,
      slug,
      url,
      createdAt: new Date().toISOString(),
    });
    return { project: { ...project, status: 'published' }, url, slug };
  }
}

export const projectService = new ProjectService();
