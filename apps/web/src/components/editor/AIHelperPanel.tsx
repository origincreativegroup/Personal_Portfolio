import { useState } from 'react';
import { Button } from '@portfolioforge/ui';
import { generateNarrative } from '../../lib/api.js';
import type { NarrativeDraftT } from '@portfolioforge/schemas';

export type AIHelperPanelProps = {
  projectId: string;
  onDraft: (draft: NarrativeDraftT) => void;
  onRewrite: (content: string) => void;
};

export const AIHelperPanel = ({ projectId, onDraft, onRewrite }: AIHelperPanelProps) => {
  const [tone, setTone] = useState(3);
  const [mode, setMode] = useState<'default' | 'client' | 'recruiter' | 'technical'>('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runNarrative = async () => {
    try {
      setLoading(true);
      setError(null);
      const draft = (await generateNarrative(projectId, { tone, mode, action: 'generate' })) as NarrativeDraftT;
      onDraft(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unable to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const runRewrite = async (mode: 'client' | 'recruiter' | 'technical') => {
    try {
      setLoading(true);
      setError(null);
      const rewrite = (await generateNarrative(projectId, { tone, mode, action: 'rewrite' })) as { content: string };
      onRewrite(rewrite.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unable to rewrite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-[#cbc0ff] px-4 py-4 text-sm text-[#1a1a1a]">
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-medium lowercase text-[#1a1a1a]">AI helper</h3>
        {loading && <span className="text-xs lowercase text-[#5a3cf4]">generating…</span>}
      </header>
      <div className="grid gap-3">
        <label className="grid gap-2 text-xs uppercase text-[#333333]">
          tone {tone}
          <input
            type="range"
            min={1}
            max={5}
            value={tone}
            onChange={(event) => setTone(Number(event.target.value))}
            className="accent-[#5a3cf4]"
          />
        </label>
        <label className="grid gap-2 text-xs uppercase text-[#333333]">
          mode
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as typeof mode)}
            className="rounded-md border border-[#cbc0ff] px-2 py-2 text-sm"
          >
            <option value="default">balanced</option>
            <option value="client">client pitch</option>
            <option value="recruiter">recruiter-friendly</option>
            <option value="technical">technical deep dive</option>
          </select>
        </label>
        <Button onClick={runNarrative} disabled={loading}>
          Generate Executive Summary
        </Button>
        <div className="grid gap-2">
          <p className="text-xs uppercase text-[#333333]">rewrite text</p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => runRewrite('client')} disabled={loading}>
              Rewrite For Client
            </Button>
            <Button variant="ghost" onClick={() => runRewrite('recruiter')} disabled={loading}>
              Recruiter-friendly
            </Button>
            <Button variant="ghost" onClick={() => runRewrite('technical')} disabled={loading}>
              Technical Deep Dive
            </Button>
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
};
