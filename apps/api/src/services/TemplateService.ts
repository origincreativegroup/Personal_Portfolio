import { randomUUID } from 'node:crypto';
import type { TemplateT, ProjectT } from '@portfolioforge/schemas';
import { Template } from '@portfolioforge/schemas';
import { db } from './storage.js';

const baseTemplates: TemplateT[] = [
  Template.parse({
    id: randomUUID(),
    name: 'research-report',
    slots: ['hero', 'summary', 'details', 'timeline', 'outcomes'],
    rules: {
      requireBlocks: ['timeline', 'impact'],
    },
  }),
  Template.parse({
    id: randomUUID(),
    name: 'product-launch',
    slots: ['hero', 'problem', 'solution', 'metrics', 'media'],
    rules: {
      preferredTags: ['product', 'launch'],
    },
  }),
  Template.parse({
    id: randomUUID(),
    name: 'case-overview',
    slots: ['summary', 'evidence', 'impact'],
  }),
];

for (const template of baseTemplates) {
  db.templates.set(template.id, template);
}

export class TemplateService {
  list(): TemplateT[] {
    return Array.from(db.templates.values());
  }

  get(id: string): TemplateT | null {
    return db.templates.get(id) ?? null;
  }

  recommend(project: ProjectT): TemplateT[] {
    const tags = new Set(project.tags.map((tag) => tag.toLowerCase()));
    return this.list().sort((a, b) => scoreTemplate(b, tags, project.blocks) - scoreTemplate(a, tags, project.blocks));
  }
}

const scoreTemplate = (template: TemplateT, tags: Set<string>, blocks: ProjectT['blocks']) => {
  let score = 0;
  if (template.rules?.requireBlocks) {
    const required = template.rules.requireBlocks as string[];
    if (required.every((type) => blocks.some((block) => block.type === type))) {
      score += required.length * 5;
    }
  }
  if (template.rules?.preferredTags) {
    const preferred = template.rules.preferredTags as string[];
    preferred.forEach((tag) => {
      if (tags.has(tag)) score += 3;
    });
  }
  score += template.slots.length;
  return score;
};

export const templateService = new TemplateService();
