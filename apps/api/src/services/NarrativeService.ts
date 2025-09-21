import type { ProjectT, AnyBlockT } from '@portfolioforge/schemas';
import { NarrativeDraft } from '@portfolioforge/schemas';
import { db } from './storage.js';

export type NarrativeMode = 'default' | 'client' | 'recruiter' | 'technical';

export type ToneLevel = 1 | 2 | 3 | 4 | 5;

export class NarrativeService {
  async generate(project: ProjectT, tone: ToneLevel = 3, mode: NarrativeMode = 'default') {
    const cached = db.narratives.get(project.id);
    const now = Date.now();
    if (cached && now - cached.updatedAt < 5 * 60 * 1000) {
      return cached;
    }

    const story = buildStory(project.blocks);
    const baseSummary = buildSummary(project, story, tone, mode);
    const draft = NarrativeDraft.parse({
      projectId: project.id,
      executiveSummary: baseSummary,
      highlights: buildHighlights(project.blocks, story),
      recommendations: buildRecommendations(project.blocks, story),
    });
    db.narratives.set(project.id, { ...draft, updatedAt: Date.now() });
    return draft;
  }

  async rewrite(blocks: AnyBlockT[], mode: NarrativeMode, tone: ToneLevel): Promise<string> {
    const story = buildStory(blocks);
    const lines: string[] = [];
    const toneLabel = toneToDescriptor(tone);
    const prefix = modeToPrefix(mode);
    if (story.problem) {
      lines.push(`${prefix} ${toneLabel} focus on the problem: ${story.problem}`.trim());
    }
    if (story.solution) {
      lines.push(`Solution: ${story.solution}.`);
    }
    if (story.impact) {
      lines.push(`Impact: ${story.impact}.`);
    }
    if (story.metrics.length) {
      lines.push(`Metrics: ${story.metrics.join(', ')}.`);
    }
    return lines.join(' ');
  }
}

const buildStory = (blocks: AnyBlockT[]) => {
  const story = {
    problem: '',
    context: '',
    solution: '',
    impact: '',
    metrics: [] as string[],
  };

  for (const block of blocks) {
    if (block.type === 'impact') {
      story.problem ||= block.problem;
      story.solution ||= block.solution;
      if (!story.impact) {
        story.impact = block.outcomes.join('; ');
      }
      if (block.metrics) {
        Object.entries(block.metrics).forEach(([name, value]) => {
          story.metrics.push(`${name}: ${value}`);
        });
      }
    }
    if (block.type === 'text' && block.variant === 'heading') {
      story.context ||= block.content;
    }
    if (block.type === 'timeline') {
      story.context ||= `Timeline spans ${block.items[0]?.start} to ${block.items.at(-1)?.end ?? 'present'}`;
    }
    if (block.type === 'chart') {
      story.metrics.push(`${block.series[0]?.name ?? 'Series'} across ${block.labels.length} points`);
    }
  }

  return story;
};

const buildSummary = (project: ProjectT, story: ReturnType<typeof buildStory>, tone: ToneLevel, mode: NarrativeMode) => {
  const toneDescriptor = toneToDescriptor(tone);
  const prefix = modeToPrefix(mode);
  const summaryParts = [
    `${prefix} ${toneDescriptor} overview of ${project.title}.`.trim(),
  ];
  if (project.summary) {
    summaryParts.push(`Context: ${project.summary}`);
  }
  if (story.problem) {
    summaryParts.push(`Problem: ${story.problem}.`);
  }
  if (story.solution) {
    summaryParts.push(`Solution: ${story.solution}.`);
  }
  if (story.impact) {
    summaryParts.push(`Impact: ${story.impact}.`);
  }
  if (story.metrics.length) {
    summaryParts.push(`Key metrics: ${story.metrics.join(', ')}.`);
  }
  return summaryParts.join(' ');
};

const buildHighlights = (blocks: AnyBlockT[], story: ReturnType<typeof buildStory>) => {
  const highlights: string[] = [];
  if (story.problem) highlights.push(`Clarified the problem: ${story.problem}`);
  if (story.solution) highlights.push(`Implemented solution: ${story.solution}`);
  if (story.impact) highlights.push(`Observed impact: ${story.impact}`);
  const mediaCount = blocks.filter((block) => block.type === 'media').length;
  if (mediaCount) highlights.push(`Attached ${mediaCount} supporting media assets`);
  const timeline = blocks.find((block) => block.type === 'timeline');
  if (timeline && timeline.type === 'timeline') {
    highlights.push(
      `Timeline covered ${timeline.items[0]?.label ?? 'kickoff'} to ${
        timeline.items.at(-1)?.label ?? 'delivery'
      }`
    );
  }
  return highlights.slice(0, 6);
};

const buildRecommendations = (blocks: AnyBlockT[], story: ReturnType<typeof buildStory>) => {
  const recs: string[] = [];
  if (story.problem && !story.impact) {
    recs.push('Document measurable outcomes once results are confirmed.');
  }
  if (!blocks.some((block) => block.type === 'chart')) {
    recs.push('Add a chart to visualise quantitative trends.');
  }
  recs.push('Share the published page with stakeholders for updates.');
  recs.push('Review tags to align with target audience.');
  return recs.slice(0, 6);
};

const toneToDescriptor = (tone: ToneLevel) => {
  switch (tone) {
    case 1:
      return 'straightforward';
    case 2:
      return 'confident';
    case 3:
      return 'balanced';
    case 4:
      return 'energetic';
    case 5:
      return 'executive-level';
    default:
      return 'balanced';
  }
};

const modeToPrefix = (mode: NarrativeMode) => {
  switch (mode) {
    case 'client':
      return 'Client pitch';
    case 'recruiter':
      return 'Recruiter-ready';
    case 'technical':
      return 'Technical deep dive';
    default:
      return 'Executive summary';
  }
};

export const narrativeService = new NarrativeService();
