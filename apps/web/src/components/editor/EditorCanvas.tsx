import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { AnyBlockT } from '@portfolioforge/schemas';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

export type EditorCanvasHandle = {
  getEditor: () => grapesjs.Editor | null;
};

type EditorCanvasProps = {
  blocks: AnyBlockT[];
  onBlocksChange: (blocks: AnyBlockT[]) => void;
  onSelectBlock: (id: string | null) => void;
  selectedBlockId: string | null;
};

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  ({ blocks, onBlocksChange, onSelectBlock, selectedBlockId }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorRef = useRef<grapesjs.Editor | null>(null);
    const blocksRef = useRef<AnyBlockT[]>(blocks);

    useEffect(() => {
      blocksRef.current = blocks;
    }, [blocks]);

    useEffect(() => {
      if (!containerRef.current) return;
      const editor = grapesjs.init({
        container: containerRef.current,
        height: '100%',
        width: '100%',
        fromElement: false,
        storageManager: false,
        blockManager: { appendTo: '#block-manager', blocks: [] },
        selectorManager: { componentFirst: true },
        deviceManager: { devices: [] },
        layerManager: { appendTo: '#layer-manager' },
        styleManager: { appendTo: '#style-manager' },
        panels: { defaults: [] },
      });
      editorRef.current = editor;

      const updateOrder = () => {
        const wrapper = editor.getWrapper();
        const components = wrapper.components();
        const newBlocks: AnyBlockT[] = [];
        components.forEach((component, index) => {
          const id = component.getAttributes()['data-block-id'];
          const match = blocksRef.current.find((block) => block.id === id);
          if (match) {
            newBlocks.push({ ...match, order: index });
          }
        });
        if (newBlocks.length === blocksRef.current.length) {
          onBlocksChange(newBlocks);
        }
      };

      const handleSelect = (component: grapesjs.Component | null) => {
        if (!component) {
          onSelectBlock(null);
          return;
        }
        const id = component.getAttributes()['data-block-id'];
        onSelectBlock(id ?? null);
      };

      editor.on('component:drag:end', updateOrder);
      editor.on('component:remove', updateOrder);
      editor.on('component:selected', handleSelect);

      syncEditor(editor, blocksRef.current);

      return () => {
        editor.destroy();
        editorRef.current = null;
      };
    }, []);

    useEffect(() => {
      const editor = editorRef.current;
      if (!editor) return;
      syncEditor(editor, blocks);
      const component = editor
        .getWrapper()
        .find(`[data-block-id="${selectedBlockId}"]`)[0] as grapesjs.Component | undefined;
      if (component) {
        editor.select(component);
      }
    }, [blocks, selectedBlockId]);

    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editorRef.current,
      }),
      []
    );

    return <div className="h-full w-full" ref={containerRef} />;
  }
);
EditorCanvas.displayName = 'EditorCanvas';

const syncEditor = (editor: grapesjs.Editor, blocks: AnyBlockT[]) => {
  const wrapper = editor.getWrapper();
  const existing = new Map<string, grapesjs.Component>();
  wrapper.components().forEach((component) => {
    const id = component.getAttributes()['data-block-id'];
    if (id) existing.set(id, component);
  });

  const seen = new Set<string>();
  blocks
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((block, index) => {
      let component = existing.get(block.id);
      if (!component) {
        component = wrapper.append(blockToComponent(block))[0];
        existing.set(block.id, component);
      }
      component.addAttributes({ 'data-block-id': block.id });
      component.set('custom-name', `${block.type} block`);
      component.components(blockPreview(block));
      component.setDraggable(true);
      component.set({ removable: false, selectable: true });
      component.move(wrapper, { at: index });
      seen.add(block.id);
    });

  existing.forEach((component, id) => {
    if (!seen.has(id)) {
      component.remove();
    }
  });
};

const blockToComponent = (block: AnyBlockT) => {
  return {
    tagName: 'section',
    attributes: {
      'data-block-id': block.id,
      class: 'portfolioforge-block',
    },
    components: blockPreview(block),
  };
};

const blockPreview = (block: AnyBlockT) => {
  switch (block.type) {
    case 'text':
      return `<div class="pf-block pf-block-text"><strong>${block.variant}</strong><p>${escapeHtml(block.content)}</p></div>`;
    case 'media':
      return `<div class="pf-block pf-block-media"><span>${block.media.kind}</span><p>${escapeHtml(block.media.url)}</p></div>`;
    case 'timeline':
      return `<div class="pf-block pf-block-timeline">timeline (${block.items.length} entries)</div>`;
    case 'chart':
      return `<div class="pf-block pf-block-chart">${block.kind} chart (${block.labels.length} labels)</div>`;
    case 'impact':
      return `<div class="pf-block pf-block-impact">impact • ${escapeHtml(block.problem)}</div>`;
    default:
      return `<div class="pf-block">${block.type}</div>`;
  }
};

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
