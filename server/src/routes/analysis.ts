import express from 'express';
import { PrismaClient } from '@prisma/client';
import { analysisQueue } from '../jobs/analysisQueue';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

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
      }
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const analysis = await prisma.projectAnalysis.findUnique({
      where: { projectId }
    });

    if (!analysis) {
      res.status(404).json({ error: 'No analysis found' });
      return;
    }

    const fileAnalyses = await prisma.fileAnalysis.findMany({
      where: {
        file: {
          projectId: projectId
        }
      },
      select: {
        status: true,
        fileId: true
      }
    });

    res.json({
      ...analysis,
      fileAnalyses
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
      confidence: analysis.confidence,
      processingTime: analysis.processingTime,
      filesAnalyzed: analysis.filesAnalyzed,
      insights: analysis.insightsFound,
      problem: {
        primary: analysis.primaryProblem,
        confidence: analysis.problemConfidence,
        evidence: analysis.problemEvidence,
        alternatives: analysis.problemAlternatives
      },
      solution: {
        primary: analysis.primarySolution,
        confidence: analysis.solutionConfidence,
        keyElements: analysis.solutionElements,
        designPatterns: analysis.designPatterns
      },
      impact: {
        primary: analysis.primaryImpact,
        confidence: analysis.impactConfidence,
        metrics: analysis.metrics,
        businessValue: analysis.businessValue
      },
      narrative: {
        story: analysis.story,
        challenges: analysis.challenges,
        process: analysis.process
      },
      suggestedTitle: analysis.suggestedTitle,
      suggestedCategory: analysis.suggestedCategory,
      tags: analysis.suggestedTags
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
