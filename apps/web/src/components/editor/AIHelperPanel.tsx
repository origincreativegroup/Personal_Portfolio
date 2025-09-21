import { $, component$, useSignal } from '@builder.io/qwik';
import type { NarrativeDraftT } from '@portfolioforge/schemas';
import type { QRL } from '@builder.io/qwik';
import { generateNarrative } from '../../lib/api.js';

export type AIHelperPanelProps = {
  projectId: string;
  onDraft$: QRL<(draft: NarrativeDraftT) => void>;
  onRewrite$: QRL<(content: string) => void>;
};

export const AIHelperPanel = component$<AIHelperPanelProps>(({ projectId, onDraft$, onRewrite$ }) => {
  const tone = useSignal(3);
  const mode = useSignal<'default' | 'client' | 'recruiter' | 'technical'>('default');
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);

  const runNarrative = $(async () => {
    try {
      loading.value = true;
      error.value = null;
      const draft = (await generateNarrative(projectId, {
        tone: tone.value,
        mode: mode.value,
        action: 'generate',
      })) as NarrativeDraftT;
      await onDraft$(draft);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'unable to generate summary';
    } finally {
      loading.value = false;
    }
  });

  const runRewrite = $(async (targetMode: 'client' | 'recruiter' | 'technical') => {
    try {
      loading.value = true;
      error.value = null;
      const rewrite = (await generateNarrative(projectId, {
        tone: tone.value,
        mode: targetMode,
        action: 'rewrite',
      })) as { content: string };
      await onRewrite$(rewrite.content);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'unable to rewrite';
    } finally {
      loading.value = false;
    }
  });

  return (
    <section class="grid gap-4 rounded-2xl border border-[#cbc0ff] px-4 py-4 text-sm text-[#1a1a1a]">
      <header class="flex items-center justify-between">
        <h3 class="text-sm font-medium lowercase text-[#1a1a1a]">AI helper</h3>
        {loading.value && <span class="text-xs lowercase text-[#5a3cf4]">generating…</span>}
      </header>
      <div class="grid gap-3">
        <label class="grid gap-2 text-xs uppercase text-[#333333]">
          tone {tone.value}
          <input
            type="range"
            min={1}
            max={5}
            value={tone.value}
            onInput$={(event) => {
              tone.value = Number((event.target as HTMLInputElement).value);
            }}
            class="accent-[#5a3cf4]"
          />
        </label>
        <label class="grid gap-2 text-xs uppercase text-[#333333]">
          mode
          <select
            value={mode.value}
            onChange$={(event) => {
              mode.value = (event.target as HTMLSelectElement).value as
                | 'default'
                | 'client'
                | 'recruiter'
                | 'technical';
            }}
            class="rounded-md border border-[#cbc0ff] px-2 py-2 text-sm"
          >
            <option value="default">balanced</option>
            <option value="client">client pitch</option>
            <option value="recruiter">recruiter-friendly</option>
            <option value="technical">technical deep dive</option>
          </select>
        </label>
        <button
          type="button"
          class="rounded-full bg-[#5a3cf4] px-4 py-2 text-sm text-white disabled:opacity-60"
          onClick$={runNarrative}
          disabled={loading.value}
        >
          Generate Executive Summary
        </button>
        <div class="grid gap-2">
          <p class="text-xs uppercase text-[#333333]">rewrite text</p>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-full border border-[#cbc0ff] px-4 py-2 text-xs lowercase text-[#1a1a1a] transition hover:bg-[#cbc0ff] disabled:opacity-60"
              onClick$={() => runRewrite('client')}
              disabled={loading.value}
            >
              Rewrite For Client
            </button>
            <button
              type="button"
              class="rounded-full border border-[#cbc0ff] px-4 py-2 text-xs lowercase text-[#1a1a1a] transition hover:bg-[#cbc0ff] disabled:opacity-60"
              onClick$={() => runRewrite('recruiter')}
              disabled={loading.value}
            >
              Recruiter-friendly
            </button>
            <button
              type="button"
              class="rounded-full border border-[#cbc0ff] px-4 py-2 text-xs lowercase text-[#1a1a1a] transition hover:bg-[#cbc0ff] disabled:opacity-60"
              onClick$={() => runRewrite('technical')}
              disabled={loading.value}
            >
              Technical Deep Dive
            </button>
          </div>
        </div>
        {error.value && <p class="text-xs text-red-600">{error.value}</p>}
      </div>
    </section>
  );
});
