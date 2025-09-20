import { z } from 'zod';

export const BlockType = z.enum(['text', 'media', 'timeline', 'chart', 'impact']);

export const BaseBlock = z.object({
  id: z.string().uuid(),
  type: BlockType,
  order: z.number().int().nonnegative(),
});

export const TextBlock = BaseBlock.extend({
  type: z.literal('text'),
  content: z.string().min(1),
  variant: z.enum(['body', 'quote', 'heading']).default('body'),
});

export const MediaMeta = z.object({
  url: z.string().url(),
  kind: z.enum(['image', 'video', 'audio', 'document']),
  alt: z.string().default(''),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbUrl: z.string().url().optional(),
});

export const MediaBlock = BaseBlock.extend({
  type: z.literal('media'),
  media: MediaMeta,
  caption: z.string().default(''),
});

export const TimelineItem = z.object({
  label: z.string(),
  start: z.string(),
  end: z.string().optional(),
  note: z.string().optional(),
});

export const TimelineBlock = BaseBlock.extend({
  type: z.literal('timeline'),
  items: z.array(TimelineItem).min(1),
});

export const ChartSeries = z.object({
  name: z.string(),
  data: z.array(z.number()),
});

export const ChartBlock = BaseBlock.extend({
  type: z.literal('chart'),
  kind: z.enum(['line', 'bar', 'pie']),
  labels: z.array(z.string()),
  series: z.array(ChartSeries).min(1),
});

export const ImpactBlock = BaseBlock.extend({
  type: z.literal('impact'),
  problem: z.string(),
  solution: z.string(),
  outcomes: z.array(z.string()),
  metrics: z.record(z.string(), z.number()).optional(),
});

export const AnyBlock = z.discriminatedUnion('type', [
  TextBlock,
  MediaBlock,
  TimelineBlock,
  ChartBlock,
  ImpactBlock,
]);

export type AnyBlockT = z.infer<typeof AnyBlock>;
export type TextBlockT = z.infer<typeof TextBlock>;
export type MediaBlockT = z.infer<typeof MediaBlock>;
export type TimelineBlockT = z.infer<typeof TimelineBlock>;
export type ChartBlockT = z.infer<typeof ChartBlock>;
export type ImpactBlockT = z.infer<typeof ImpactBlock>;
