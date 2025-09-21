import { $, component$, useComputed$, useSignal } from '@builder.io/qwik';
import type { AnyBlockT, NarrativeDraftT, ProjectT, TemplateT } from '@portfolioforge/schemas';
import { BlockToolbar } from './BlockToolbar.js';
import { EditorCanvas } from './EditorCanvas.js';
import { PreviewPane } from './PreviewPane.js';
import { AIHelperPanel } from './AIHelperPanel.js';
import { ExportMenu } from './ExportMenu.js';
import { saveBlocks, updateProject } from '../../lib/api.js';

export type ProjectEditorProps = {
  project: ProjectT;
  templates: TemplateT[];
};

export const ProjectEditor = component$<ProjectEditorProps>(({ project, templates }) => {
  const blocks = useSignal<AnyBlockT[]>([...project.blocks].sort((a, b) => a.order - b.order));
  const selectedBlockId = useSignal<string | null>(blocks.value[0]?.id ?? null);
  const breakpoint = useSignal<'sm' | 'md' | 'lg'>('lg');
  const currentProject = useSignal<ProjectT>(project);
  const selectedTemplateId = useSignal<string | undefined>(templates[0]?.id);
  const narrative = useSignal<NarrativeDraftT | null>(null);
  const saving = useSignal(false);

  const selectedTemplate = useComputed$(() =>
    templates.find((template) => template.id === selectedTemplateId.value)
  );

  const handleBlocksChange = $((updated: AnyBlockT[]) => {
    blocks.value = updated.map((block, index) => ({ ...block, order: index }));
  });

  const handleAddBlock = $((type: AnyBlockT['type']) => {
    const block = createDefaultBlock(type, blocks.value.length);
    blocks.value = [...blocks.value, block];
    selectedBlockId.value = block.id;
  });

  const handleDuplicateBlock = $((blockId: string) => {
    const block = blocks.value.find((item) => item.id === blockId);
    if (!block) return;
    const clone = { ...block, id: createId(), order: blocks.value.length } as AnyBlockT;
    blocks.value = [...blocks.value, clone];
  });

  const handleDeleteBlock = $((blockId: string) => {
    blocks.value = blocks.value
      .filter((block) => block.id !== blockId)
      .map((block, index) => ({ ...block, order: index }));
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null;
    }
  });

  const handleUpdateBlock = $((updated: AnyBlockT) => {
    blocks.value = blocks.value.map((block) => (block.id === updated.id ? updated : block));
  });

  const handleSaveBlocks = $(async () => {
    try {
      saving.value = true;
      const saved = await saveBlocks(
        currentProject.value.id,
        blocks.value.map((block, index) => ({ ...block, order: index }))
      );
      blocks.value = [...saved].sort((a, b) => a.order - b.order);
      currentProject.value = { ...currentProject.value, blocks: saved };
      alert('blocks saved');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'unable to save blocks');
    } finally {
      saving.value = false;
    }
  });

  const handleDraft = $(async (draft: NarrativeDraftT) => {
    narrative.value = draft;
    const updated = await updateProject(currentProject.value.id, {
      summary: draft.executiveSummary,
    });
    currentProject.value = updated;
  });

  const handleRewrite = $((content: string) => {
    const selected = blocks.value.find(
      (block) => block.id === selectedBlockId.value && block.type === 'text'
    );
    if (!selected || selected.type !== 'text') return;
    const updated = { ...selected, content } as AnyBlockT;
    blocks.value = blocks.value.map((block) => (block.id === updated.id ? updated : block));
  });

  const handleBreakpointChange = $((value: 'sm' | 'md' | 'lg') => {
    breakpoint.value = value;
  });

  const handleSelectBlock = $((id: string | null) => {
    selectedBlockId.value = id;
  });

  const handleTemplateChange = $((value: string) => {
    selectedTemplateId.value = value || undefined;
  });

  return (
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
      <BlockToolbar
        blocks={blocks.value}
        selectedBlockId={selectedBlockId.value}
        onAddBlock$={handleAddBlock}
        onDeleteBlock$={handleDeleteBlock}
        onDuplicateBlock$={handleDuplicateBlock}
        onUpdateBlock$={handleUpdateBlock}
      />
      <section class="grid gap-4">
        <div class="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-medium lowercase text-[#1a1a1a]">Editor canvas</h2>
            <button
              class="rounded-full bg-[#5a3cf4] px-4 py-2 text-xs text-white disabled:opacity-60"
              onClick$={handleSaveBlocks}
              disabled={saving.value}
              type="button"
            >
              {saving.value ? 'saving…' : 'Save blocks'}
            </button>
          </div>
          <div class="h-[560px] rounded-2xl border border-dashed border-[#cbc0ff]">
            <EditorCanvas
              blocks={blocks.value}
              onBlocksChange$={handleBlocksChange}
              onSelectBlock$={handleSelectBlock}
              selectedBlockId={selectedBlockId.value}
            />
          </div>
        </div>
        <div class="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4">
          <label class="flex items-center gap-2 text-xs uppercase text-[#333333]">
            template
            <select
              value={selectedTemplateId.value ?? ''}
              onChange$={(event) =>
                handleTemplateChange((event.target as HTMLSelectElement).value)
              }
              class="rounded-md border border-[#cbc0ff] px-2 py-1 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <PreviewPane
            title={currentProject.value.title}
            summary={currentProject.value.summary}
            blocks={blocks.value}
            template={selectedTemplate.value}
            breakpoint={breakpoint.value}
            onBreakpointChange$={handleBreakpointChange}
          />
        </div>
        {narrative.value && (
          <section class="grid gap-2 rounded-2xl border border-[#cbc0ff] px-4 py-4 text-sm text-[#1a1a1a]">
            <h3 class="text-sm font-medium lowercase text-[#1a1a1a]">Executive summary draft</h3>
            <p class="text-sm text-[#333333]">{narrative.value.executiveSummary}</p>
            <div>
              <h4 class="text-xs uppercase text-[#5a3cf4]">highlights</h4>
              <ul class="list-disc pl-4 text-xs text-[#333333]">
                {narrative.value.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 class="text-xs uppercase text-[#5a3cf4]">recommendations</h4>
              <ul class="list-disc pl-4 text-xs text-[#333333]">
                {narrative.value.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </section>
      <section class="grid gap-4">
        <AIHelperPanel
          projectId={currentProject.value.id}
          onDraft$={handleDraft}
          onRewrite$={handleRewrite}
        />
        <ExportMenu project={currentProject.value} template={selectedTemplate.value} />
      </section>
    </div>
  );
});

const createDefaultBlock = (type: AnyBlockT['type'], order: number): AnyBlockT => {
  switch (type) {
    case 'text':
      return {
        id: createId(),
        type,
        order,
        content: 'new text block',
        variant: 'body',
      };
    case 'media':
      return {
        id: createId(),
        type,
        order,
        media: {
          url: 'https://example.com/image.png',
          kind: 'image',
          alt: 'describe the media',
        },
        caption: '',
      };
    case 'timeline':
      return {
        id: createId(),
        type,
        order,
        items: [{ label: 'milestone', start: new Date().toISOString().slice(0, 10) }],
      };
    case 'chart':
      return {
        id: createId(),
        type,
        order,
        kind: 'line',
        labels: ['start', 'end'],
        series: [{ name: 'series a', data: [0, 1] }],
      };
    case 'impact':
      return {
        id: createId(),
        type,
        order,
        problem: 'describe the problem',
        solution: 'describe the solution',
        outcomes: ['list outcomes'],
        metrics: { impact: 1 },
      };
    default:
      throw new Error(`unsupported block type ${type}`);
  }
};

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
