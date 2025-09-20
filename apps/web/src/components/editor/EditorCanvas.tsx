import { component$, useSignal, useTask$, useVisibleTask$ } from '@builder.io/qwik';
import type { AnyBlockT } from '@portfolioforge/schemas';
import type { QRL } from '@builder.io/qwik';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

type EditorCanvasProps = {
  blocks: AnyBlockT[];
  onBlocksChange$: QRL<(blocks: AnyBlockT[]) => void>;
  onSelectBlock$: QRL<(id: string | null) => void>;
  selectedBlockId: string | null;
};

export const EditorCanvas = component$<EditorCanvasProps>(({ blocks, onBlocksChange$, onSelectBlock$, selectedBlockId }) => {
  const containerRef = useSignal<HTMLDivElement>();
  const editorSignal = useSignal<grapesjs.Editor>();
  const blocksSignal = useSignal<AnyBlockT[]>(blocks);

  useTask$(({ track }) => {
    track(() => blocks);
    blocksSignal.value = blocks;
  });

  useVisibleTask$(({ track, cleanup }) => {
    const container = track(() => containerRef.value);
    if (!container) return;

    const editor = grapesjs.init({
      container,
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
    editorSignal.value = editor;

    const updateOrder = async () => {
      const wrapper = editor.getWrapper();
      const components = wrapper.components();
      const currentBlocks = blocksSignal.value;
      const newBlocks: AnyBlockT[] = [];
      components.forEach((component, index) => {
        const id = component.getAttributes()['data-block-id'];
        const match = currentBlocks.find((block) => block.id === id);
        if (match) {
          newBlocks.push({ ...match, order: index });
        }
      });
      if (newBlocks.length === currentBlocks.length) {
        blocksSignal.value = newBlocks;
        await onBlocksChange$(newBlocks);
      }
    };

    const handleSelect = async (component: grapesjs.Component | null) => {
      if (!component) {
        await onSelectBlock$(null);
        return;
      }
      const id = component.getAttributes()['data-block-id'];
      await onSelectBlock$(id ?? null);
    };

    editor.on('component:drag:end', () => {
      void updateOrder();
    });
    editor.on('component:remove', () => {
      void updateOrder();
    });
    editor.on('component:selected', (component) => {
      void handleSelect(component);
    });

    syncEditor(editor, blocksSignal.value);

    cleanup(() => {
      editor.destroy();
      editorSignal.value = undefined;
    });
  });

  useVisibleTask$(({ track }) => {
    const currentBlocks = track(() => blocksSignal.value);
    const currentSelected = track(() => selectedBlockId);
    const editor = editorSignal.value;
    if (!editor) return;

    syncEditor(editor, currentBlocks);

    if (currentSelected) {
      const component = editor
        .getWrapper()
        .find(`[data-block-id="${currentSelected}"]`)[0] as grapesjs.Component | undefined;
      if (component) {
        editor.select(component);
        return;
      }
    }
    editor.select(null);
  });

  return <div class="h-full w-full" ref={containerRef} />;
});

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

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
