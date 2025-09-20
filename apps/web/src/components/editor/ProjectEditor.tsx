import { useMemo, useRef, useState } from 'react';
import type { AnyBlockT, NarrativeDraftT, ProjectT, TemplateT } from '@portfolioforge/schemas';
import { BlockToolbar } from './BlockToolbar.js';
import { EditorCanvas, type EditorCanvasHandle } from './EditorCanvas.js';
import { PreviewPane } from './PreviewPane.js';
import { AIHelperPanel } from './AIHelperPanel.js';
import { ExportMenu } from './ExportMenu.js';
import { saveBlocks, updateProject } from '../../lib/api.js';

export type ProjectEditorProps = {
  project: ProjectT;
  templates: TemplateT[];
};

export const ProjectEditor = ({ project, templates }: ProjectEditorProps) => {
  const [blocks, setBlocks] = useState<AnyBlockT[]>([...project.blocks].sort((a, b) => a.order - b.order));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(blocks[0]?.id ?? null);
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg'>('lg');
  const [currentProject, setCurrentProject] = useState<ProjectT>(project);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(templates[0]?.id);
  const [narrative, setNarrative] = useState<NarrativeDraftT | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<EditorCanvasHandle | null>(null);

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId), [
    selectedTemplateId,
    templates,
  ]);

  const handleBlocksChange = (updated: AnyBlockT[]) => {
    setBlocks(updated);
  };

  const handleAddBlock = (type: AnyBlockT['type']) => {
    const block = createDefaultBlock(type, blocks.length);
    setBlocks((prev) => [...prev, block]);
    setSelectedBlockId(block.id);
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;
    const clone = { ...block, id: createId(), order: blocks.length } as AnyBlockT;
    setBlocks((prev) => [...prev, clone]);
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== blockId).map((block, index) => ({ ...block, order: index })));
    setSelectedBlockId(null);
  };

  const handleUpdateBlock = (updated: AnyBlockT) => {
    setBlocks((prev) => prev.map((block) => (block.id === updated.id ? updated : block)));
  };

  const handleSaveBlocks = async () => {
    try {
      setSaving(true);
      const saved = await saveBlocks(currentProject.id, blocks.map((block, index) => ({ ...block, order: index })));
      setBlocks(saved);
      setCurrentProject((prev) => ({ ...prev, blocks: saved }));
      alert('blocks saved');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'unable to save blocks');
    } finally {
      setSaving(false);
    }
  };

  const handleDraft = async (draft: NarrativeDraftT) => {
    setNarrative(draft);
    const updated = await updateProject(currentProject.id, { summary: draft.executiveSummary });
    setCurrentProject(updated);
  };

  const handleRewrite = (content: string) => {
    const selected = blocks.find((block) => block.id === selectedBlockId && block.type === 'text');
    if (!selected || selected.type !== 'text') return;
    handleUpdateBlock({ ...selected, content });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
      <BlockToolbar
        blocks={blocks}
        selectedBlockId={selectedBlockId}
        onAddBlock={handleAddBlock}
        onDeleteBlock={handleDeleteBlock}
        onDuplicateBlock={handleDuplicateBlock}
        onUpdateBlock={handleUpdateBlock}
      />
      <section className="grid gap-4">
        <div className="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium lowercase text-[#1a1a1a]">Editor canvas</h2>
            <button
              className="rounded-full bg-[#5a3cf4] px-4 py-2 text-xs text-white"
              onClick={handleSaveBlocks}
              disabled={saving}
            >
              {saving ? 'saving…' : 'Save blocks'}
            </button>
          </div>
          <div className="h-[560px] rounded-2xl border border-dashed border-[#cbc0ff]">
            <EditorCanvas
              ref={(instance) => (editorRef.current = instance)}
              blocks={blocks}
              onBlocksChange={handleBlocksChange}
              onSelectBlock={setSelectedBlockId}
              selectedBlockId={selectedBlockId}
            />
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border border-[#cbc0ff] px-4 py-4">
          <label className="flex items-center gap-2 text-xs uppercase text-[#333333]">
            template
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              className="rounded-md border border-[#cbc0ff] px-2 py-1 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <PreviewPane
            title={currentProject.title}
            summary={currentProject.summary}
            blocks={blocks}
            template={selectedTemplate}
            breakpoint={breakpoint}
            onBreakpointChange={setBreakpoint}
          />
        </div>
        {narrative && (
          <section className="grid gap-2 rounded-2xl border border-[#cbc0ff] px-4 py-4 text-sm text-[#1a1a1a]">
            <h3 className="text-sm font-medium lowercase text-[#1a1a1a]">Executive summary draft</h3>
            <p className="text-sm text-[#333333]">{narrative.executiveSummary}</p>
            <div>
              <h4 className="text-xs uppercase text-[#5a3cf4]">highlights</h4>
              <ul className="list-disc pl-4 text-xs text-[#333333]">
                {narrative.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase text-[#5a3cf4]">recommendations</h4>
              <ul className="list-disc pl-4 text-xs text-[#333333]">
                {narrative.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </section>
      <section className="grid gap-4">
        <AIHelperPanel projectId={currentProject.id} onDraft={handleDraft} onRewrite={handleRewrite} />
        <ExportMenu project={currentProject} template={selectedTemplate} />
      </section>
    </div>
  );
};

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
