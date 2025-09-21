export type BlockType = 'text' | 'media' | 'timeline' | 'chart' | 'impact';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  variant: 'body' | 'quote' | 'heading';
}

export interface MediaMeta {
  url: string;
  kind: 'image' | 'video' | 'audio' | 'document';
  alt: string;
  width?: number;
  height?: number;
  thumbUrl?: string;
}

export interface MediaBlock extends BaseBlock {
  type: 'media';
  media: MediaMeta;
  caption: string;
}

export interface TimelineItem {
  label: string;
  start: string;
  end?: string;
  note?: string;
}

export interface TimelineBlock extends BaseBlock {
  type: 'timeline';
  items: TimelineItem[];
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  kind: 'line' | 'bar' | 'pie';
  labels: string[];
  series: ChartSeries[];
}

export interface ImpactBlock extends BaseBlock {
  type: 'impact';
  problem: string;
  solution: string;
  outcomes: string[];
  metrics?: Record<string, number>;
}

export type AnyBlock = TextBlock | MediaBlock | TimelineBlock | ChartBlock | ImpactBlock;

export interface Project {
  id: string;
  title: string;
  summary?: string;
  status: 'draft' | 'published';
  blocks: AnyBlock[];
  createdAt: string;
  updatedAt: string;
}