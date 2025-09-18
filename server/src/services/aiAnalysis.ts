import OpenAI from 'openai';
import { PrismaClient, Project, ProjectFile, FileAnalysis } from '@prisma/client';
import { AnalysisResult, AnalysisInsight } from '../types/analysis';

type ProjectWithFiles = Project & {
  files: Array<ProjectFile & { analysis: FileAnalysis | null }>;
};

export class AIAnalysisService {
  private openai: OpenAI;
  private prisma: PrismaClient;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.prisma = new PrismaClient();
  }

  async analyzeProject(projectId: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      await this.prisma.projectAnalysis.upsert({
        where: { projectId },
        create: {
          projectId,
          status: 'analyzing'
        },
        update: {
          status: 'analyzing'
        }
      });

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          files: {
            include: {
              analysis: true
            }
          }
        }
      }) as ProjectWithFiles | null;

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const compiledData = this.compileAnalysisData(project);
      const analysis = await this.generateAIAnalysis(compiledData);

      const processingTime = (Date.now() - startTime) / 1000;
      const filesAnalyzed = project.files.length;
      const insightsFound = compiledData.allInsights.length;

      await this.prisma.projectAnalysis.update({
        where: { projectId },
        data: {
          status: 'completed',
          confidence: analysis.confidence,
          processingTime,
          filesAnalyzed,
          insightsFound,
          primaryProblem: analysis.problem.primary,
          problemConfidence: analysis.problem.confidence,
          problemEvidence: analysis.problem.evidence,
          problemAlternatives: analysis.problem.alternatives,
          primarySolution: analysis.solution.primary,
          solutionConfidence: analysis.solution.confidence,
          solutionElements: analysis.solution.keyElements,
          designPatterns: analysis.solution.designPatterns,
          primaryImpact: analysis.impact.primary,
          impactConfidence: analysis.impact.confidence,
          metrics: analysis.impact.metrics,
          businessValue: analysis.impact.businessValue,
          story: analysis.narrative.story,
          challenges: analysis.narrative.challenges,
          process: analysis.narrative.process,
          suggestedTitle: analysis.suggestedTitle,
          suggestedCategory: analysis.suggestedCategory,
          suggestedTags: analysis.tags
        }
      });

      return {
        confidence: analysis.confidence,
        processingTime,
        filesAnalyzed,
        insights: insightsFound,
        problem: analysis.problem,
        solution: analysis.solution,
        impact: analysis.impact,
        narrative: analysis.narrative,
        suggestedTitle: analysis.suggestedTitle,
        suggestedCategory: analysis.suggestedCategory,
        tags: analysis.tags
      };

    } catch (error) {
      console.error(`Error analyzing project ${projectId}:`, error);
      
      await this.prisma.projectAnalysis.update({
        where: { projectId },
        data: {
          status: 'failed',
          processingTime: (Date.now() - startTime) / 1000
        }
      });

      throw error;
    }
  }

  private compileAnalysisData(project: ProjectWithFiles) {
    const allInsights: AnalysisInsight[] = [];
    const extractedTexts: string[] = [];
    const fileMetadata: Array<{ filename: string; type: string; metadata: unknown }> = [];

    for (const file of project.files) {
      if (file.analysis?.insights) {
        const insights = file.analysis.insights as AnalysisInsight[];
        allInsights.push(...insights.map(insight => ({
          ...insight,
          source: file.name
        })));
      }

      if (file.analysis?.extractedText) {
        extractedTexts.push(file.analysis.extractedText);
      }

      if (file.analysis?.metadata) {
        fileMetadata.push({
          filename: file.name,
          type: file.mimeType,
          metadata: file.analysis.metadata
        });
      }
    }

    return {
      projectName: project.name,
      projectDescription: project.description,
      projectCategory: project.category,
      allInsights,
      extractedTexts,
      fileMetadata,
      fileCount: project.files.length
    };
  }

  private async generateAIAnalysis(data: ReturnType<typeof AIAnalysisService.prototype.compileAnalysisData>): Promise<any> {
    const prompt = this.buildAnalysisPrompt(data);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert design and product analyst. Your job is to analyze creative projects and reverse-engineer the problems they solved, the solutions they implemented, and the impact they created. 

          Respond with a JSON object containing:
          {
            "confidence": number (0-100),
            "problem": {
              "primary": "main problem statement",
              "confidence": number (0-100),
              "evidence": ["evidence1", "evidence2"],
              "alternatives": ["alternative1", "alternative2"]
            },
            "solution": {
              "primary": "main solution description",
              "confidence": number (0-100), 
              "keyElements": ["element1", "element2"],
              "designPatterns": ["pattern1", "pattern2"]
            },
            "impact": {
              "primary": "main impact statement",
              "confidence": number (0-100),
              "metrics": [{"metric": "name", "before": "value", "after": "value", "change": "percentage"}],
              "businessValue": "business impact description"
            },
            "narrative": {
              "story": "comprehensive project story",
              "challenges": ["challenge1", "challenge2"],
              "process": ["step1", "step2"]
            },
            "suggestedTitle": "compelling project title",
            "suggestedCategory": "project category",
            "tags": ["tag1", "tag2"]
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      throw new Error('Invalid AI response format');
    }
  }

  private buildAnalysisPrompt(data: ReturnType<typeof AIAnalysisService.prototype.compileAnalysisData>): string {
    const insightsSection = data.allInsights.map((insight, i) =>
      `${i + 1}. [${insight.type}] ${insight.content} (confidence: ${insight.confidence}) from ${insight.source}`
    ).join('\n');

    const textSection = data.extractedTexts.join('\n\n');
    const metadataSection = data.fileMetadata.map(meta =>
      `- ${meta.filename} (${meta.type}): ${JSON.stringify(meta.metadata)}`
    ).join('\n');

    return `
Please analyze this creative project and identify:

PROJECT CONTEXT:
- Name: ${data.projectName}
- Description: ${data.projectDescription || 'Not provided'}
- Category: ${data.projectCategory || 'Not specified'}
- Files: ${data.fileCount} files

EXTRACTED INSIGHTS:
${insightsSection}

EXTRACTED TEXT CONTENT:
${textSection}

FILE METADATA:
${metadataSection}

Based on this information, reverse-engineer:
1. What problem was this project trying to solve?
2. What solution approach was taken?
3. What impact/results were achieved?
4. What's the compelling story of this project?

Focus on extracting concrete, specific insights rather than generic statements. If you see metrics or before/after comparisons, include them. If you identify specific design patterns or methodologies, mention them.
    `.trim();
  }
}
