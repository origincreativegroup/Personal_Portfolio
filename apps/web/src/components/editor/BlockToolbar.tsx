import { component$ } from '@builder.io/qwik';
import type {
  AnyBlockT,
  ChartBlockT,
  ImpactBlockT,
  MediaBlockT,
  TextBlockT,
  TimelineBlockT,
} from '@portfolioforge/schemas';
import type { QRL } from '@builder.io/qwik';

export type BlockToolbarProps = {
  blocks: AnyBlockT[];
  selectedBlockId: string | null;
  onAddBlock$: QRL<(type: AnyBlockT['type']) => void>;
  onDuplicateBlock$: QRL<(blockId: string) => void>;
  onDeleteBlock$: QRL<(blockId: string) => void>;
  onUpdateBlock$: QRL<(block: AnyBlockT) => void>;
};

type BlockEditorProps = {
  block: AnyBlockT;
  onChange$: QRL<(block: AnyBlockT) => void>;
};

type TextBlockEditorProps = {
  block: TextBlockT;
  onChange$: QRL<(block: AnyBlockT) => void>;
};

type MediaBlockEditorProps = {
  block: MediaBlockT;
  onChange$: QRL<(block: AnyBlockT) => void>;
};

type TimelineBlockEditorProps = {
  block: TimelineBlockT;
  onChange$: QRL<(block: AnyBlockT) => void>;
};

type ChartBlockEditorProps = {
  block: ChartBlockT;
  onChange$: QRL<(block: AnyBlockT) => void>;
};

type ImpactBlockEditorProps = {
  block: ImpactBlockT;
  onChange$: QRL<(block: AnyBlockT) => void>;
};

export const BlockToolbar = component$<BlockToolbarProps>(({ blocks, selectedBlockId, onAddBlock$, onDeleteBlock$, onDuplicateBlock$, onUpdateBlock$ }) => {
  const selected = blocks.find((block) => block.id === selectedBlockId) ?? null;

  return (
    <aside class="grid gap-4">
      <div class="grid gap-2">
        <p class="text-xs uppercase text-[#333333]">add block</p>
        <div class="flex flex-wrap gap-2">
          {(['text', 'media', 'timeline', 'chart', 'impact'] as const).map((type) => (
            <button
              key={type}
              type="button"
              class="rounded-full border border-[#cbc0ff] px-3 py-1 text-xs lowercase text-[#1a1a1a] transition hover:bg-[#cbc0ff]"
              onClick$={async () => {
                await onAddBlock$(type);
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div class="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4">
          <header class="flex items-center justify-between">
            <h3 class="text-sm font-medium lowercase text-[#1a1a1a]">{selected.type} block</h3>
            <div class="flex gap-2 text-xs lowercase">
              <button
                class="text-[#5a3cf4] underline"
                onClick$={async () => {
                  await onDuplicateBlock$(selected.id);
                }}
                type="button"
              >
                duplicate
              </button>
              <button
                class="text-[#5a3cf4] underline"
                onClick$={async () => {
                  await onDeleteBlock$(selected.id);
                }}
                type="button"
              >
                delete
              </button>
            </div>
          </header>
          <BlockEditor block={selected} onChange$={onUpdateBlock$} />
        </div>
      ) : (
        <p class="text-xs text-[#333333]">Select a block to edit its content.</p>
      )}
    </aside>
  );
});

const BlockEditor = component$<BlockEditorProps>(({ block, onChange$ }) => {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onChange$={onChange$} />;
    case 'media':
      return <MediaBlockEditor block={block} onChange$={onChange$} />;
    case 'timeline':
      return <TimelineBlockEditor block={block} onChange$={onChange$} />;
    case 'chart':
      return <ChartBlockEditor block={block} onChange$={onChange$} />;
    case 'impact':
      return <ImpactBlockEditor block={block} onChange$={onChange$} />;
    default:
      return null;
  }
});

const TextBlockEditor = component$<TextBlockEditorProps>(({ block, onChange$ }) => {
  return (
    <div class="grid gap-3 text-sm">
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        variant
        <select
          class="rounded-md border border-[#cbc0ff] px-2 py-1 text-sm"
          value={block.variant}
          onChange$={async (event) => {
            const value = (event.target as HTMLSelectElement).value as TextBlockT['variant'];
            await onChange$({ ...block, variant: value });
          }}
        >
          <option value="body">body</option>
          <option value="quote">quote</option>
          <option value="heading">heading</option>
        </select>
      </label>
      <label class="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        content
        <textarea
          class="min-h-[120px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.content}
          onInput$={async (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            await onChange$({ ...block, content: value });
          }}
        />
      </label>
    </div>
  );
});

const MediaBlockEditor = component$<MediaBlockEditorProps>(({ block, onChange$ }) => {
  return (
    <div class="grid gap-3 text-sm">
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        kind
        <select
          class="rounded-md border border-[#cbc0ff] px-2 py-1 text-sm"
          value={block.media.kind}
          onChange$={async (event) => {
            const value = (event.target as HTMLSelectElement).value as MediaBlockT['media']['kind'];
            await onChange$({ ...block, media: { ...block.media, kind: value } });
          }}
        >
          <option value="image">image</option>
          <option value="video">video</option>
          <option value="audio">audio</option>
          <option value="document">document</option>
        </select>
      </label>
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        url
        <input
          class="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.media.url}
          required
          onInput$={async (event) => {
            const value = (event.target as HTMLInputElement).value;
            await onChange$({ ...block, media: { ...block.media, url: value } });
          }}
        />
      </label>
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        alt text
        <input
          class="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.media.alt ?? ''}
          onInput$={async (event) => {
            const value = (event.target as HTMLInputElement).value;
            await onChange$({ ...block, media: { ...block.media, alt: value } });
          }}
        />
      </label>
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        caption
        <input
          class="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.caption}
          onInput$={async (event) => {
            const value = (event.target as HTMLInputElement).value;
            await onChange$({ ...block, caption: value });
          }}
        />
      </label>
    </div>
  );
});

const TimelineBlockEditor = component$<TimelineBlockEditorProps>(({ block, onChange$ }) => {
  const toText = () =>
    block.items.map((item) => `${item.label}|${item.start}|${item.end ?? ''}|${item.note ?? ''}`).join('\n');

  return (
    <label class="grid gap-2 text-sm lowercase text-[#1a1a1a]">
      timeline items
      <textarea
        class="min-h-[120px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
        value={toText()}
        onInput$={async (event) => {
          const rows = (event.target as HTMLTextAreaElement)
            .value.split(/\n+/)
            .map((row) => row.trim())
            .filter(Boolean);
          const items = rows.map((row) => {
            const [label, start, end, note] = row.split('|');
            return {
              label: label ?? '',
              start: start ?? '',
              end: end || undefined,
              note: note || undefined,
            };
          });
          const filtered = items.filter((item) => item.label && item.start);
          await onChange$({ ...block, items: filtered });
        }}
        placeholder="label|2024-01-01|2024-02-01|note"
      />
    </label>
  );
});

const ChartBlockEditor = component$<ChartBlockEditorProps>(({ block, onChange$ }) => {
  return (
    <div class="grid gap-3 text-sm">
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        kind
        <select
          class="rounded-md border border-[#cbc0ff] px-2 py-1 text-sm"
          value={block.kind}
          onChange$={async (event) => {
            const value = (event.target as HTMLSelectElement).value as ChartBlockT['kind'];
            await onChange$({ ...block, kind: value });
          }}
        >
          <option value="line">line</option>
          <option value="bar">bar</option>
          <option value="pie">pie</option>
        </select>
      </label>
      <label class="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        labels (comma separated)
        <textarea
          class="min-h-[80px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={block.labels.join(', ')}
          onInput$={async (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            const labels = value
              .split(',')
              .map((label) => label.trim())
              .filter(Boolean);
            await onChange$({ ...block, labels });
          }}
        />
      </label>
      <label class="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        series (name: value, value)
        <textarea
          class="min-h-[120px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={block.series.map((series) => `${series.name}: ${series.data.join(', ')}`).join('\n')}
          onInput$={async (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            const rows = value
              .split(/\n+/)
              .map((row) => row.trim())
              .filter(Boolean);
            const series: ChartBlockT['series'] = rows.map((row) => {
              const [name, values] = row.split(':');
              const data = (values ?? '')
                .split(',')
                .map((item) => Number.parseFloat(item.trim()))
                .filter((item) => Number.isFinite(item));
              return { name: name?.trim() ?? 'series', data };
            });
            await onChange$({ ...block, series });
          }}
        />
      </label>
    </div>
  );
});

const ImpactBlockEditor = component$<ImpactBlockEditorProps>(({ block, onChange$ }) => {
  return (
    <div class="grid gap-3 text-sm">
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        problem
        <input
          class="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.problem}
          onInput$={async (event) => {
            const value = (event.target as HTMLInputElement).value;
            await onChange$({ ...block, problem: value });
          }}
        />
      </label>
      <label class="grid gap-1 text-xs uppercase text-[#333333]">
        solution
        <input
          class="rounded-md border border-[#cbc0ff] px-3 py-2 text-sm"
          value={block.solution}
          onInput$={async (event) => {
            const value = (event.target as HTMLInputElement).value;
            await onChange$({ ...block, solution: value });
          }}
        />
      </label>
      <label class="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        outcomes (comma separated)
        <textarea
          class="min-h-[80px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={block.outcomes.join(', ')}
          onInput$={async (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            const outcomes = value
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean);
            await onChange$({ ...block, outcomes });
          }}
        />
      </label>
      <label class="grid gap-2 text-sm lowercase text-[#1a1a1a]">
        metrics (name: value per line)
        <textarea
          class="min-h-[80px] rounded-xl border border-[#cbc0ff] px-3 py-2 text-xs"
          value={
            block.metrics
              ? Object.entries(block.metrics)
                  .map(([name, value]) => `${name}: ${value}`)
                  .join('\n')
              : ''
          }
          onInput$={async (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            const rows = value
              .split(/\n+/)
              .map((row) => row.trim())
              .filter(Boolean);
            const metrics = rows.reduce<Record<string, number>>((acc, row) => {
              const [key, raw] = row.split(':');
              const numeric = Number.parseFloat((raw ?? '').trim());
              if (key && Number.isFinite(numeric)) {
                acc[key.trim()] = Number(numeric.toFixed(2));
              }
              return acc;
            }, {});
            await onChange$({ ...block, metrics });
          }}
        />
      </label>
    </div>
  );
});
