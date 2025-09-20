import { randomUUID } from 'node:crypto';
import {
  AnyBlock,
  type AnyBlockT,
  ImpactBlock,
  MediaBlock,
  TextBlock,
  TimelineBlock,
  ChartBlock,
} from '@portfolioforge/schemas';
import { db } from './storage.js';

const sortBlocks = (blocks: AnyBlockT[]) =>
  [...blocks].sort((a, b) => a.order - b.order).map((block, index) => ({
    ...block,
    order: index,
  }));

export class BlockService {
  list(projectId: string): AnyBlockT[] {
    return sortBlocks(db.blocks.get(projectId) ?? []);
  }

  save(projectId: string, blocks: AnyBlockT[]): AnyBlockT[] {
    const validated = blocks.map((block) => {
      const blockWithId = block.id ? block : { ...block, id: randomUUID() };
      switch (blockWithId.type) {
        case 'text':
          return TextBlock.parse(blockWithId);
        case 'media':
          return MediaBlock.parse(blockWithId);
        case 'timeline':
          return TimelineBlock.parse(blockWithId);
        case 'chart':
          return ChartBlock.parse(blockWithId);
        case 'impact':
          return ImpactBlock.parse(blockWithId);
        default:
          return AnyBlock.parse(blockWithId);
      }
    });

    const uniqueIds = new Set<string>();
    const deduped = validated.map((block) => {
      if (uniqueIds.has(block.id)) {
        return { ...block, id: randomUUID() };
      }
      uniqueIds.add(block.id);
      return block;
    });

    const ordered = sortBlocks(deduped);
    db.blocks.set(projectId, ordered);
    const project = db.projects.get(projectId);
    if (project) {
      db.projects.set(projectId, {
        ...project,
        blocks: ordered,
        updatedAt: new Date().toISOString(),
      });
    }
    return ordered;
  }
}

export const blockService = new BlockService();
