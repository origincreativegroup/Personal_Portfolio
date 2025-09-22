import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'stub-key-for-development',
});

export interface NarrativeHooks {
  problem: string;
  challenge: string;
  solution: string;
  impact: string;
}

export interface ProjectAnalysisRequest {
  title: string;
  summary?: string;
  description?: string;
  narrativeHooks: NarrativeHooks;
  technologies?: string[];
  role?: string;
}

export interface ProjectAnalysisResult {
  suggestedTitle: string;
  suggestedCategory: string;
  suggestedTags: string[];
  primaryProblem: string;
  problemConfidence: number;
  primarySolution: string;
  solutionConfidence: number;
  primaryImpact: string;
  impactConfidence: number;
  story: string;
  challenges: string[];
  process: string[];
  designPatterns: string[];
  businessValue: string;
  metrics: string;
}

export interface FileAnalysisRequest {
  filename: string;
  mimeType: string;
  content?: string;
}

export interface FileAnalysisResult {
  contentType: string;
  extractedText: string;
  insights: string;
  metadata: string;
}

export class AIService {
  private static isConfigured(): boolean {
    return !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'stub-key-for-development')
  }

  private static async callOpenAI(messages: any[], maxTokens = 2000, temperature = 0.7) {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API not configured')
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature,
      max_tokens: maxTokens,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    return response
  }

  /**
   * Generate AI-powered project analysis
   */
  static async analyzeProject(request: ProjectAnalysisRequest): Promise<ProjectAnalysisResult> {
    if (!this.isConfigured()) {
      return this.getMockAnalysis(request);
    }

    try {
      const prompt = this.buildProjectAnalysisPrompt(request);

      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are an expert portfolio consultant and UX analyst. Analyze projects and provide structured insights for case studies. Respond only with valid JSON in the specified format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]);

      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return this.getMockAnalysis(request);
    }
  }

  /**
   * Generate narrative from project hooks
   */
  static async generateNarrative(narrativeHooks: NarrativeHooks, tone: 'professional' | 'casual' | 'technical' = 'professional'): Promise<string> {
    if (!this.isConfigured()) {
      return this.getMockNarrative(narrativeHooks, tone);
    }

    try {
      const prompt = this.buildNarrativePrompt(narrativeHooks, tone);

      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are a skilled technical writer specializing in compelling case studies and portfolio narratives.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], 1500, 0.8);

      return response;
    } catch (error) {
      console.error('OpenAI narrative error:', error);
      return this.getMockNarrative(narrativeHooks, tone);
    }
  }

  /**
   * Analyze uploaded file content
   */
  static async analyzeFile(request: FileAnalysisRequest): Promise<FileAnalysisResult> {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'stub-key-for-development') {
      return this.getMockFileAnalysis(request);
    }

    try {
      const prompt = this.buildFileAnalysisPrompt(request);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a document analyst. Extract key insights and information from uploaded files for portfolio projects.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return this.getMockFileAnalysis(request);
      }
      return this.parseFileAnalysisResponse(response, request);
    } catch (error) {
      console.error('OpenAI file analysis error:', error);
      return this.getMockFileAnalysis(request);
    }
  }

  /**
   * Generate executive summary
   */
  static async generateExecutiveSummary(content: string): Promise<string> {
    if (!this.isConfigured()) {
      return this.getMockExecutiveSummary(content);
    }

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are an executive assistant. Create concise, impactful executive summaries.'
        },
        {
          role: 'user',
          content: `Create a 2-3 sentence executive summary of this project content:\n\n${content}`
        }
      ], 200, 0.6);

      return response;
    } catch (error) {
      console.error('OpenAI executive summary error:', error);
      return this.getMockExecutiveSummary(content);
    }
  }

  /**
   * Analyze image content using Vision API
   */
  static async analyzeImage(imageUrl: string, prompt?: string): Promise<string> {
    if (!this.isConfigured()) {
      return 'Image analysis requires OpenAI API configuration.';
    }

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: 'You are an expert in visual design analysis. Analyze images and provide insights about composition, design elements, and visual impact for portfolio purposes.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt || 'Analyze this image for portfolio use. Describe the visual elements, composition, design quality, and suggest how it could be used effectively in a portfolio.'
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ] as any
        }
      ], 500);

      return response;
    } catch (error) {
      console.error('OpenAI image analysis error:', error);
      return 'Unable to analyze image at this time.';
    }
  }

  /**
   * Generate tags for content
   */
  static async generateTags(content: string, maxTags: number = 10): Promise<string[]> {
    if (!this.isConfigured()) {
      return ['portfolio', 'project', 'design'];
    }

    try {
      const response = await this.callOpenAI([
        {
          role: 'system',
          content: `You are a content tagging expert. Generate ${maxTags} relevant, specific tags for portfolio content. Return only a comma-separated list of tags.`
        },
        {
          role: 'user',
          content: `Generate tags for this content:\n\n${content}`
        }
      ], 100);

      return response.split(',').map(tag => tag.trim()).slice(0, maxTags);
    } catch (error) {
      console.error('OpenAI tag generation error:', error);
      return ['portfolio', 'project', 'design'];
    }
  }

  // Private helper methods

  private static buildProjectAnalysisPrompt(request: ProjectAnalysisRequest): string {
    return `
Analyze this portfolio project and provide structured insights:

Project: ${request.title}
Summary: ${request.summary || 'Not provided'}
Description: ${request.description || 'Not provided'}

Narrative Hooks:
- Problem: ${request.narrativeHooks.problem}
- Challenge: ${request.narrativeHooks.challenge}
- Solution: ${request.narrativeHooks.solution}
- Impact: ${request.narrativeHooks.impact}

Technologies: ${request.technologies?.join(', ') || 'Not specified'}
Role: ${request.role || 'Not specified'}

Please provide analysis in this JSON format:
{
  "suggestedTitle": "Improved title suggestion",
  "suggestedCategory": "Primary category",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "primaryProblem": "Main problem identified",
  "problemConfidence": 0.85,
  "primarySolution": "Core solution approach",
  "solutionConfidence": 0.90,
  "primaryImpact": "Key impact/outcome",
  "impactConfidence": 0.80,
  "story": "Compelling project story",
  "challenges": ["challenge1", "challenge2"],
  "process": ["step1", "step2", "step3"],
  "designPatterns": ["pattern1", "pattern2"],
  "businessValue": "Business value description",
  "metrics": "Key metrics and measurements"
}
    `.trim();
  }

  private static buildNarrativePrompt(narrativeHooks: NarrativeHooks, tone: string): string {
    const toneInstructions: Record<string, string> = {
      professional: 'Write in a professional, business-appropriate tone suitable for client presentations.',
      casual: 'Write in a conversational, approachable tone that feels personal and engaging.',
      technical: 'Write in a technical tone suitable for developer portfolios and technical audiences.'
    };

    return `
Create a compelling case study narrative using the following structure. Use a ${tone} tone.

Problem: ${narrativeHooks.problem}
Challenge: ${narrativeHooks.challenge}
Solution: ${narrativeHooks.solution}
Impact: ${narrativeHooks.impact}

${toneInstructions[tone] || toneInstructions.professional}

Structure the narrative as a cohesive story that flows from problem to solution to impact. Make it engaging and specific with concrete details where possible.
    `.trim();
  }

  private static buildFileAnalysisPrompt(request: FileAnalysisRequest): string {
    return `
Analyze this uploaded file for a portfolio project:

Filename: ${request.filename}
Mime Type: ${request.mimeType}
Content: ${request.content || 'No text content extracted'}

Extract:
1. Key insights and information
2. Relevant project details
3. Technical specifications (if applicable)
4. Design decisions or process notes
5. Any metrics or results mentioned

Provide a structured analysis focusing on portfolio-relevant information.
    `.trim();
  }

  private static parseAnalysisResponse(response: string): ProjectAnalysisResult {
    try {
      const parsed = JSON.parse(response);
      return {
        suggestedTitle: parsed.suggestedTitle || 'Project Analysis',
        suggestedCategory: parsed.suggestedCategory || 'Design',
        suggestedTags: parsed.suggestedTags || ['portfolio', 'project'],
        primaryProblem: parsed.primaryProblem || 'Problem analysis pending',
        problemConfidence: parsed.problemConfidence || 0.7,
        primarySolution: parsed.primarySolution || 'Solution analysis pending',
        solutionConfidence: parsed.solutionConfidence || 0.7,
        primaryImpact: parsed.primaryImpact || 'Impact analysis pending',
        impactConfidence: parsed.impactConfidence || 0.7,
        story: parsed.story || 'Story generation pending',
        challenges: parsed.challenges || ['Challenge analysis pending'],
        process: parsed.process || ['Process analysis pending'],
        designPatterns: parsed.designPatterns || ['Pattern analysis pending'],
        businessValue: parsed.businessValue || 'Business value analysis pending',
        metrics: parsed.metrics || 'Metrics analysis pending'
      };
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return this.getMockAnalysis({} as ProjectAnalysisRequest);
    }
  }

  private static parseFileAnalysisResponse(response: string, request: FileAnalysisRequest): FileAnalysisResult {
    return {
      contentType: request.mimeType,
      extractedText: request.content || '',
      insights: response || 'File analysis pending',
      metadata: `Filename: ${request.filename}, Size: ${request.content?.length || 0} characters`
    };
  }

  // Mock responses for development
  private static getMockAnalysis(request: ProjectAnalysisRequest): ProjectAnalysisResult {
    return {
      suggestedTitle: request.title + ' - Enhanced',
      suggestedCategory: 'UX Design',
      suggestedTags: ['ux-design', 'portfolio', 'case-study'],
      primaryProblem: request.narrativeHooks.problem,
      problemConfidence: 0.85,
      primarySolution: request.narrativeHooks.solution,
      solutionConfidence: 0.90,
      primaryImpact: request.narrativeHooks.impact,
      impactConfidence: 0.80,
      story: `This project addressed ${request.narrativeHooks.problem} through ${request.narrativeHooks.solution}, resulting in ${request.narrativeHooks.impact}.`,
      challenges: ['Technical constraints', 'Timeline pressure', 'Stakeholder alignment'],
      process: ['Research', 'Design', 'Prototype', 'Test', 'Implement'],
      designPatterns: ['User-centered design', 'Mobile-first approach'],
      businessValue: 'Improved user experience and business metrics',
      metrics: 'Key performance indicators and measurable outcomes'
    };
  }

  private static getMockNarrative(narrativeHooks: NarrativeHooks, tone: string): string {
    return `
## Project Overview

**The Challenge**
${narrativeHooks.problem}

**The Context**
${narrativeHooks.challenge}

**The Solution**
${narrativeHooks.solution}

**The Impact**
${narrativeHooks.impact}

*This narrative was generated in ${tone} tone for portfolio presentation.*
    `.trim();
  }

  private static getMockFileAnalysis(request: FileAnalysisRequest): FileAnalysisResult {
    return {
      contentType: request.mimeType,
      extractedText: request.content || '',
      insights: `Mock analysis of ${request.filename}. This file appears to contain project-related content suitable for portfolio documentation.`,
      metadata: `Filename: ${request.filename}, Type: ${request.mimeType}`
    };
  }

  private static getMockExecutiveSummary(content: string): string {
    return `Executive Summary: This project demonstrates significant value through strategic design and implementation, resulting in measurable improvements to user experience and business outcomes.`;
  }
}
