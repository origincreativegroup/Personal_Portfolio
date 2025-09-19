import express from 'express';
import { PrismaClient } from '@prisma/client';
import { analysisQueue } from '../jobs/analysisQueue';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (typeof item === 'number' || typeof item === 'boolean') {
        return String(item);
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        if (typeof record.content === 'string') {
          return record.content.trim();
        }
        if (typeof record.value === 'string') {
          return record.value.trim();
        }
        try {
          return JSON.stringify(record);
        } catch {
          return '';
        }
      }
      return '';
    })
    .filter((entry): entry is string => entry.length > 0);
};

const ensureEvidenceArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const type = typeof record.type === 'string' ? record.type.toUpperCase() : null;
        const content = typeof record.content === 'string'
          ? record.content.trim()
          : record.content != null
            ? JSON.stringify(record.content)
            : '';
        if (!content) {
          return '';
        }
        const confidence = typeof record.confidence === 'number'
          ? ` (confidence ${(record.confidence * 100).toFixed(0)}%)`
          : '';
        return type ? `[${type}] ${content}${confidence}` : `${content}${confidence}`;
      }
      try {
        return JSON.stringify(item);
      } catch {
        return '';
      }
    })
    .filter((entry): entry is string => entry.length > 0);
};

type MetricRecord = { metric: string; before: string; after: string; change: string };

const ensureMetricArray = (value: unknown): MetricRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const record = item as Record<string, unknown>;
      const metric = typeof record.metric === 'string' ? record.metric : '';
      const before = typeof record.before === 'string' ? record.before : '';
      const after = typeof record.after === 'string' ? record.after : '';
      const change = typeof record.change === 'string' ? record.change : '';

      if (!metric && !before && !after && !change) {
        return null;
      }

      return { metric, before, after, change };
    })
    .filter((entry): entry is MetricRecord => Boolean(entry));
};

type SerializedInsight = {
  content: string;
  type?: string;
  confidence?: number;
  source?: string;
};

const normalizeInsights = (value: unknown): SerializedInsight[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): SerializedInsight | null => {
      if (typeof item === 'string') {
        return { content: item };
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const contentRaw = record.content;
        const content = typeof contentRaw === 'string'
          ? contentRaw
          : contentRaw != null
            ? (() => {
              try {
                return JSON.stringify(contentRaw);
              } catch {
                return String(contentRaw);
              }
            })()
            : '';

        if (!content.trim()) {
          return null;
        }

        const type = typeof record.type === 'string' ? record.type : undefined;
        const confidenceValue = record.confidence;
        const confidence = typeof confidenceValue === 'number'
          ? confidenceValue
          : typeof confidenceValue === 'string'
            ? Number(confidenceValue)
            : undefined;
        const source = typeof record.source === 'string' ? record.source : undefined;

        return {
          content: content.trim(),
          type,
          confidence: Number.isFinite(confidence) ? confidence : undefined,
          source,
        };
      }
      if (item == null) {
        return null;
      }
      try {
        return { content: JSON.stringify(item) };
      } catch {
        return { content: String(item) };
      }
    })
    .filter((entry): entry is SerializedInsight => entry !== null);
};

const router = express.Router();
const prisma = new PrismaClient();

router.post('/projects/:projectId/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      },
      include: {
        files: true
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.files.length === 0) {
      res.status(400).json({ error: 'Project must have files to analyze' });
      return;
    }

    for (const file of project.files) {
      await analysisQueue.add('analyze-file', { fileId: file.id });
    }

    await analysisQueue.add('analyze-project', { projectId }, {
      delay: project.files.length * 5000
    });

    res.json({ 
      message: 'Analysis started',
      projectId,
      filesQueued: project.files.length
    });

  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/projects/:projectId/analysis', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      },
      include: {
        files: {
          include: {
            analysis: true
          }
        }
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const analysisRecord = await prisma.projectAnalysis.findUnique({
      where: { projectId }
    });

    const fileAnalyses = project.files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      status: file.analysis?.status ?? 'pending',
      insights: normalizeInsights(file.analysis?.insights ?? []),
      extractedText: typeof file.analysis?.extractedText === 'string' ? file.analysis.extractedText : null,
      metadata: file.analysis?.metadata ?? null,
      updatedAt: file.analysis?.updatedAt ?? file.updatedAt,
    }));

    const analysisPayload = analysisRecord
      ? {
          status: analysisRecord.status,
          confidence: analysisRecord.confidence ?? null,
          processingTime: analysisRecord.processingTime ?? null,
          filesAnalyzed: analysisRecord.filesAnalyzed,
          insightsFound: analysisRecord.insightsFound,
          suggestedTitle: analysisRecord.suggestedTitle ?? null,
          suggestedCategory: analysisRecord.suggestedCategory ?? null,
          suggestedTags: ensureStringArray(analysisRecord.suggestedTags ?? []),
          updatedAt: analysisRecord.updatedAt,
          startedAt: analysisRecord.createdAt,
        }
      : {
          status: 'pending',
          confidence: null,
          processingTime: null,
          filesAnalyzed: 0,
          insightsFound: 0,
          suggestedTitle: null,
          suggestedCategory: null,
          suggestedTags: [] as string[],
          updatedAt: null,
          startedAt: null,
        };

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        fileCount: project.files.length,
        updatedAt: project.updatedAt,
      },
      analysis: analysisPayload,
      fileAnalyses,
    });

  } catch (error) {
    console.error('Error getting analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/projects/:projectId/analysis/results', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const analysis = await prisma.projectAnalysis.findUnique({
      where: { projectId }
    });

    if (!analysis || analysis.status !== 'completed') {
      res.status(404).json({ error: 'Analysis not completed' });
      return;
    }

    const result = {
      confidence: analysis.confidence ?? null,
      processingTime: analysis.processingTime ?? null,
      filesAnalyzed: analysis.filesAnalyzed,
      insights: analysis.insightsFound,
      problem: {
        primary: analysis.primaryProblem ?? '',
        confidence: analysis.problemConfidence ?? null,
        evidence: ensureEvidenceArray(analysis.problemEvidence),
        alternatives: ensureStringArray(analysis.problemAlternatives),
      },
      solution: {
        primary: analysis.primarySolution ?? '',
        confidence: analysis.solutionConfidence ?? null,
        keyElements: ensureStringArray(analysis.solutionElements),
        designPatterns: ensureStringArray(analysis.designPatterns),
      },
      impact: {
        primary: analysis.primaryImpact ?? '',
        confidence: analysis.impactConfidence ?? null,
        metrics: ensureMetricArray(analysis.metrics),
        businessValue: analysis.businessValue ?? '',
      },
      narrative: {
        story: analysis.story ?? '',
        challenges: ensureStringArray(analysis.challenges),
        process: ensureStringArray(analysis.process),
      },
      suggestedTitle: analysis.suggestedTitle ?? '',
      suggestedCategory: analysis.suggestedCategory ?? '',
      tags: ensureStringArray(analysis.suggestedTags),
    };

    res.json(result);

  } catch (error) {
    console.error('Error getting analysis results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/projects/:projectId/analysis/apply', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const { suggestions } = req.body as { suggestions: { title?: string; category?: string; description?: string } };

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    
    if (suggestions?.title) updateData.name = suggestions.title;
    if (suggestions?.category) updateData.category = suggestions.category;
    if (suggestions?.description) updateData.description = suggestions.description;

    await prisma.project.update({
      where: { id: projectId },
      data: updateData
    });

    res.json({ message: 'Suggestions applied successfully' });

  } catch (error) {
    console.error('Error applying suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
