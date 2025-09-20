import type { AnyBlockT, ChartBlockT, ImpactBlockT, MediaBlockT, TextBlockT, TimelineBlockT } from '@portfolioforge/schemas';
import type { FC, ChangeEvent } from 'react';
import { Button, Input, Select } from '@portfolioforge/ui';

export type BlockToolbarProps = {
  blocks: AnyBlockT[];
  selectedBlockId: string | null;
  onAddBlock: (type: AnyBlockT['type']) => void;
  onDuplicateBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdateBlock: (block: AnyBlockT) => void;
};

export const BlockToolbar: FC<BlockToolbarProps> = ({
  blocks,
  selectedBlockId,
  onAddBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onUpdateBlock,
}) => {
  const selected = blocks.find((block) => block.id === selectedBlockId) ?? null;

  return (
    <aside className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-xs uppercase text-[#333333]">add block</p>
        <div className="flex flex-wrap gap-2">
          {['text', 'media', 'timeline', 'chart', 'impact'].map((type) => (
            <Button key={type} variant="ghost" onClick={() => onAddBlock(type as AnyBlockT['type'])}>
              {type}
            </Button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4">
          <header className="flex items-center justify-between">
            <h3 className="text-sm font-medium lowercase text-[#1a1a1a]">{selected.type} block</h3>
            <div className="flex gap-2 text-xs lowercase">
              <button
                className="text-[#5a3cf4] underline"
                onClick={() => onDuplicateBlock(selected.id)}
                type="button"
              >
                duplicate
              </button>
              <button className="text-[#5a3cf4] underline" onClick={() => onDeleteBlock(selected.id)} type="button">
                delete
              </button>
            </div>
          </header>
          <BlockEditor block={selected} onChange={onUpdateBlock} />
        </div>
      ) : (
        <p className="text-xs text-[#333333]">Select a block to edit its content.</p>
      )}
    </aside>
  );
};

type BlockEditorProps = {
  block: AnyBlockT;
  onChange: (block: AnyBlockT) => void;
};

const BlockEditor: FC<BlockEditorProps> = ({ block, onChange }) => {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onChange={onChange} />;
    case 'media':
      return <MediaBlockEditor block={block} onChange={onChange} />;
    case 'timeline':
      return <TimelineBlockEditor block={block} onChange={onChange} />;
    case 'chart':
      return <ChartBlockEditor block={block} onChange={onChange} />;
    case 'impact':
      return <ImpactBlockEditor block={block} onChange={onChange} />;
    default:
      return null;
  }
};

const TextBlockEditor: FC<{ block: TextBlockT; onChange: (block: AnyBlockT) => void }> = ({ block, onChange }) => {
  const update = (changes: Partial<TextBlockT>) => onChange({ ...block, ...changes });
  return (
    <div className="grid gap-3 text-sm">
      <Select
        label="variant"
        value={block.variant}
        onChange={(event) => update({ variant: event.target.value as TextBlockT['variant'] })}
      >
        <option value="body">body</option>
        <option value="quote">quote</option>
        <option value="heading">heading</option>
      </Select>
      <label className="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        content
        <textarea
          className="min-h-[120px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.content}
          onChange={(event) => update({ content: event.target.value })}
        />
      </label>
    </div>
  );
};

const MediaBlockEditor: FC<{ block: MediaBlockT; onChange: (block: AnyBlockT) => void }> = ({ block, onChange }) => {
  const updateMedia = (changes: Partial<MediaBlockT['media']>) => onChange({ ...block, media: { ...block.media, ...changes } });
  return (
    <div className="grid gap-3 text-sm">
      <Select label="kind" value={block.media.kind} onChange={(event) => updateMedia({ kind: event.target.value as MediaBlockT['media']['kind'] })}>
        <option value="image">image</option>
        <option value="video">video</option>
        <option value="audio">audio</option>
        <option value="document">document</option>
      </Select>
      <Input label="url" value={block.media.url} onChange={(event) => updateMedia({ url: event.target.value })} required />
      <Input label="alt text" value={block.media.alt ?? ''} onChange={(event) => updateMedia({ alt: event.target.value })} />
      <Input label="caption" value={block.caption} onChange={(event) => onChange({ ...block, caption: event.target.value })} />
    </div>
  );
};

const TimelineBlockEditor: FC<{ block: TimelineBlockT; onChange: (block: AnyBlockT) => void }> = ({ block, onChange }) => {
  const toText = () => block.items.map((item) => `${item.label}|${item.start}|${item.end ?? ''}|${item.note ?? ''}`).join('\n');
  const parse = (value: string) => {
    const rows = value
      .split(/\n+/)
      .map((row) => row.trim())
      .filter(Boolean);
    const items = rows.map((row) => {
      const [label, start, end, note] = row.split('|');
      return { label: label ?? '', start: start ?? '', end: end || undefined, note: note || undefined };
    });
    return items.filter((item) => item.label && item.start);
  };
  return (
    <label className="grid gap-2 text-sm lowercase text-[#1a1a1a]">
      timeline items
      <textarea
        className="min-h-[120px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
        value={toText()}
        onChange={(event) => onChange({ ...block, items: parse(event.target.value) })}
        placeholder="label|2024-01-01|2024-02-01|note"
      />
    </label>
  );
};

const ChartBlockEditor: FC<{ block: ChartBlockT; onChange: (block: AnyBlockT) => void }> = ({ block, onChange }) => {
  const update = (changes: Partial<ChartBlockT>) => onChange({ ...block, ...changes });
  const handleLabels = (event: ChangeEvent<HTMLTextAreaElement>) => update({ labels: event.target.value.split(',').map((label) => label.trim()).filter(Boolean) });
  const handleSeries = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const rows = event.target.value
      .split(/\n+/)
      .map((row) => row.trim())
      .filter(Boolean);
    const series: ChartBlockT['series'] = rows.map((row) => {
      const [name, values] = row.split(':');
      const data = (values ?? '')
        .split(',')
        .map((value) => Number.parseFloat(value.trim()))
        .filter((value) => Number.isFinite(value));
      return { name: name?.trim() ?? 'series', data };
    });
    update({ series });
  };
  return (
    <div className="grid gap-3 text-sm">
      <Select label="kind" value={block.kind} onChange={(event) => update({ kind: event.target.value as ChartBlockT['kind'] })}>
        <option value="line">line</option>
        <option value="bar">bar</option>
        <option value="pie">pie</option>
      </Select>
      <label className="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        labels (comma separated)
        <textarea
          className="min-h-[80px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={block.labels.join(', ')}
          onChange={handleLabels}
        />
      </label>
      <label className="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        series (name: value, value)
        <textarea
          className="min-h-[120px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={block.series.map((series) => `${series.name}: ${series.data.join(', ')}`).join('\n')}
          onChange={handleSeries}
        />
      </label>
    </div>
  );
};

const ImpactBlockEditor: FC<{ block: ImpactBlockT; onChange: (block: AnyBlockT) => void }> = ({ block, onChange }) => {
  const update = (changes: Partial<ImpactBlockT>) => onChange({ ...block, ...changes });
  const updateMetrics = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const rows = event.target.value
      .split(/\n+/)
      .map((row) => row.trim())
      .filter(Boolean);
    const metrics = rows.reduce<Record<string, number>>((acc, row) => {
      const [key, value] = row.split(':');
      const numeric = Number.parseFloat((value ?? '').trim());
      if (key && Number.isFinite(numeric)) {
        acc[key.trim()] = Number(numeric.toFixed(2));
      }
      return acc;
    }, {});
    update({ metrics });
  };
  return (
    <div className="grid gap-3 text-sm">
      <Input label="problem" value={block.problem} onChange={(event) => update({ problem: event.target.value })} />
      <Input label="solution" value={block.solution} onChange={(event) => update({ solution: event.target.value })} />
      <label className="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        outcomes (comma separated)
        <textarea
          className="min-h-[80px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={block.outcomes.join(', ')}
          onChange={(event) => update({ outcomes: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
        />
      </label>
      <label className="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        metrics (name: value per line)
        <textarea
          className="min-h-[80px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={
            block.metrics
              ? Object.entries(block.metrics)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join('\n')
              : ''
          }
          onChange={updateMetrics}
        />
      </label>
    </div>
  );
};
