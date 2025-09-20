import type { AnyBlockT, TemplateT } from '@portfolioforge/schemas';
import type { FC } from 'react';
import { TextBlockPreview } from './blocks/TextBlock.js';
import { MediaBlockPreview } from './blocks/MediaBlock.js';
import { TimelineBlockPreview } from './blocks/TimelineBlock.js';
import { ChartBlockPreview } from './blocks/ChartBlock.js';
import { ImpactBlockPreview } from './blocks/ImpactBlock.js';

export type PreviewPaneProps = {
  title: string;
  summary?: string;
  blocks: AnyBlockT[];
  template?: TemplateT;
  breakpoint: 'sm' | 'md' | 'lg';
  onBreakpointChange: (breakpoint: 'sm' | 'md' | 'lg') => void;
};

export const PreviewPane: FC<PreviewPaneProps> = ({
  title,
  summary,
  blocks,
  template,
  breakpoint,
  onBreakpointChange,
}) => {
  const width = breakpoint === 'sm' ? 360 : breakpoint === 'md' ? 640 : 960;
  return (
    <section className="grid gap-4">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium lowercase text-[#1a1a1a]">preview</h3>
        <div className="flex gap-2 text-xs lowercase text-[#5a3cf4]">
          {(['sm', 'md', 'lg'] as const).map((bp) => (
            <button
              key={bp}
              onClick={() => onBreakpointChange(bp)}
              className={`rounded-full px-3 py-1 ${bp === breakpoint ? 'bg-[#5a3cf4] text-white' : 'bg-[#cbc0ff] text-[#1a1a1a]'}`}
            >
              {bp}
            </button>
          ))}
        </div>
      </header>
      <div className="overflow-auto rounded-2xl border border-[#cbc0ff] bg-white" style={{ width }}>
        <div className="flex flex-col gap-4 p-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold lowercase text-[#5a3cf4]">{title}</h1>
            {summary && <p className="text-sm text-[#333333]">{summary}</p>}
          </header>
          <div className="grid gap-4">
            {blocks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((block) => (
                <article key={block.id} className="rounded-2xl border border-[#cbc0ff] px-4 py-3">
                  {renderPreview(block)}
                </article>
              ))}
          </div>
          {template && (
            <footer className="rounded-2xl border border-dashed border-[#cbc0ff] px-4 py-3 text-xs text-[#333333]">
              template {template.name} • slots: {template.slots.join(', ')}
            </footer>
          )}
        </div>
      </div>
    </section>
  );
};

const renderPreview = (block: AnyBlockT) => {
  switch (block.type) {
    case 'text':
      return <TextBlockPreview block={block} />;
    case 'media':
      return <MediaBlockPreview block={block} />;
    case 'timeline':
      return <TimelineBlockPreview block={block} />;
    case 'chart':
      return <ChartBlockPreview block={block} />;
    case 'impact':
      return <ImpactBlockPreview block={block} />;
    default:
      return null;
  }
};
