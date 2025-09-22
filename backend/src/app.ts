import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import { AIService, type ProjectAnalysisRequest, type NarrativeHooks } from './services/aiService.js';
import assetsRoutes from './routes/assets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma
const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

await fastify.register(staticFiles, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(assetsRoutes, { prefix: '/api/assets' });

// Projects routes
fastify.get('/api/projects', async (request, reply) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        assets: true,
        deliverables: true,
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { projects };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch projects' });
  }
});

fastify.get('/api/projects/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        assets: true,
        deliverables: true,
        files: true,
        analysis: true,
      },
    });
    
    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }
    
    return { project };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch project' });
  }
});

fastify.post('/api/projects', async (request, reply) => {
  try {
    const projectData = request.body as any;
    const project = await prisma.project.create({
      data: {
        ...projectData,
        slug: projectData.slug || projectData.title.toLowerCase().replace(/\s+/g, '-'),
      },
      include: {
        assets: true,
        deliverables: true,
        files: true,
      },
    });
    return { project };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to create project' });
  }
});

fastify.put('/api/projects/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;
    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        assets: true,
        deliverables: true,
        files: true,
      },
    });
    return { project };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to update project' });
  }
});

fastify.delete('/api/projects/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    await prisma.project.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to delete project' });
  }
});

// File upload route
fastify.post('/api/upload', async (request, reply) => {
  try {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // In a real app, you'd save to cloud storage
    // For now, we'll just return file info
    const fileInfo = {
      filename: data.filename,
      mimetype: data.mimetype,
      size: data.file.bytesRead,
    };

    return { file: fileInfo };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to upload file' });
  }
});

// AI-powered endpoints

// Analyze project with AI
fastify.post('/api/ai/analyze-project', async (request, reply) => {
  try {
    const analysisRequest = request.body as ProjectAnalysisRequest;
    
    const analysis = await AIService.analyzeProject(analysisRequest);
    
    // Save analysis to database if project ID is provided
    if (request.body && typeof request.body === 'object' && 'projectId' in request.body) {
      const projectId = (request.body as any).projectId;
      await prisma.projectAnalysis.upsert({
        where: { projectId },
        update: {
          status: 'completed',
          confidence: analysis.problemConfidence,
          primaryProblem: analysis.primaryProblem,
          problemConfidence: analysis.problemConfidence,
          primarySolution: analysis.primarySolution,
          solutionConfidence: analysis.solutionConfidence,
          primaryImpact: analysis.primaryImpact,
          impactConfidence: analysis.impactConfidence,
          story: analysis.story,
          challenges: analysis.challenges.join(','),
          process: analysis.process.join(','),
          designPatterns: analysis.designPatterns.join(','),
          businessValue: analysis.businessValue,
          metrics: analysis.metrics,
          suggestedTitle: analysis.suggestedTitle,
          suggestedCategory: analysis.suggestedCategory,
          suggestedTags: analysis.suggestedTags.join(','),
        },
        create: {
          projectId,
          status: 'completed',
          confidence: analysis.problemConfidence,
          primaryProblem: analysis.primaryProblem,
          problemConfidence: analysis.problemConfidence,
          primarySolution: analysis.primarySolution,
          solutionConfidence: analysis.solutionConfidence,
          primaryImpact: analysis.primaryImpact,
          impactConfidence: analysis.impactConfidence,
          story: analysis.story,
          challenges: analysis.challenges.join(','),
          process: analysis.process.join(','),
          designPatterns: analysis.designPatterns.join(','),
          businessValue: analysis.businessValue,
          metrics: analysis.metrics,
          suggestedTitle: analysis.suggestedTitle,
          suggestedCategory: analysis.suggestedCategory,
          suggestedTags: analysis.suggestedTags.join(','),
        },
      });
    }
    
    return { analysis };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to analyze project' });
  }
});

// Generate narrative
fastify.post('/api/ai/generate-narrative', async (request, reply) => {
  try {
    const { narrativeHooks, tone } = request.body as { 
      narrativeHooks: NarrativeHooks; 
      tone?: 'professional' | 'casual' | 'technical';
    };
    
    const narrative = await AIService.generateNarrative(narrativeHooks, tone);
    
    return { narrative };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate narrative' });
  }
});

// Analyze uploaded file
fastify.post('/api/ai/analyze-file', async (request, reply) => {
  try {
    const data = await request.file();
    
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    // Extract text content (simplified - in production you'd use proper text extraction)
    const buffer = await data.toBuffer();
    const content = buffer.toString('utf-8');
    
    const analysis = await AIService.analyzeFile({
      filename: data.filename,
      mimeType: data.mimetype,
      content: content.length > 10000 ? content.substring(0, 10000) : content, // Limit content size
    });
    
    return { analysis };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to analyze file' });
  }
});

// Generate executive summary
fastify.post('/api/ai/executive-summary', async (request, reply) => {
  try {
    const { content } = request.body as { content: string };
    
    if (!content) {
      return reply.status(400).send({ error: 'Content is required' });
    }
    
    const summary = await AIService.generateExecutiveSummary(content);
    
    return { summary };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate executive summary' });
  }
});

// Get project analysis
fastify.get('/api/projects/:id/analysis', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };

    const analysis = await prisma.projectAnalysis.findUnique({
      where: { projectId: id },
    });

    if (!analysis) {
      return reply.status(404).send({ error: 'Analysis not found' });
    }

    return { analysis };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch analysis' });
  }
});

// Analyze image with AI
fastify.post('/api/ai/analyze-image', async (request, reply) => {
  try {
    const { imageUrl, prompt } = request.body as { imageUrl: string; prompt?: string };

    if (!imageUrl) {
      return reply.status(400).send({ error: 'Image URL is required' });
    }

    const analysis = await AIService.analyzeImage(imageUrl, prompt);

    return { analysis };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to analyze image' });
  }
});

// Generate tags with AI
fastify.post('/api/ai/generate-tags', async (request, reply) => {
  try {
    const { content, maxTags } = request.body as { content: string; maxTags?: number };

    if (!content) {
      return reply.status(400).send({ error: 'Content is required' });
    }

    const tags = await AIService.generateTags(content, maxTags);

    return { tags };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Failed to generate tags' });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  await fastify.close();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    fastify.log.info('🚀 PortfolioForge Backend running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();