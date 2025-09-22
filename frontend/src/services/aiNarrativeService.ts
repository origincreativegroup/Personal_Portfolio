// ===== AI NARRATIVE GENERATION SERVICE =====

export interface NarrativePrompt {
  type: 'project' | 'casestudy' | 'portfolio' | 'asset'
  content: {
    title: string
    description?: string
    metadata?: Record<string, any>
    assets?: Array<{
      type: string
      name: string
      description?: string
    }>
    context?: {
      client?: string
      role?: string
      duration?: string
      technologies?: string[]
      challenges?: string[]
      results?: string[]
    }
  }
  tone?: 'professional' | 'creative' | 'casual' | 'technical'
  length?: 'short' | 'medium' | 'long'
  targetAudience?: 'client' | 'peer' | 'public' | 'recruiter'
}

export interface GeneratedNarrative {
  id: string
  type: string
  title: string
  content: {
    summary: string
    problem: string
    solution: string
    process: string
    results: string
    impact: string
    callToAction: string
  }
  metadata: {
    wordCount: number
    readingTime: number
    tone: string
    confidence: number
    generatedAt: string
    version: number
  }
  suggestions: {
    improvements: string[]
    alternativeTones: string[]
    keyPoints: string[]
  }
}

export interface NarrativeTemplate {
  id: string
  name: string
  description: string
  category: 'project' | 'casestudy' | 'portfolio' | 'asset'
  template: {
    structure: string[]
    prompts: Record<string, string>
    examples: Record<string, string>
  }
  settings: {
    defaultTone: string
    defaultLength: string
    requiredFields: string[]
  }
}

// ===== TEMPLATES =====

export const narrativeTemplates: NarrativeTemplate[] = [
  {
    id: 'project-showcase',
    name: 'Project Showcase',
    description: 'Highlight key achievements and technical details',
    category: 'project',
    template: {
      structure: ['summary', 'challenge', 'approach', 'technologies', 'results', 'impact'],
      prompts: {
        summary: 'Create a compelling 2-sentence summary of this project that highlights the main value proposition.',
        challenge: 'Describe the primary challenge or problem this project solved in 1-2 sentences.',
        approach: 'Explain the methodology and approach taken to solve the problem.',
        technologies: 'List and briefly explain the key technologies and tools used.',
        results: 'Quantify the results and outcomes achieved.',
        impact: 'Describe the broader impact and learnings from this project.'
      },
      examples: {
        summary: 'Developed a responsive e-commerce platform that increased conversion rates by 40% and reduced page load times by 60%.',
        challenge: 'The client needed a modern, mobile-first shopping experience that could handle high traffic during peak seasons.',
        approach: 'Implemented a headless commerce architecture with React and Node.js, focusing on performance optimization and user experience.',
        technologies: 'React, Node.js, MongoDB, Stripe API, AWS, Docker',
        results: '40% increase in conversion rates, 60% faster page loads, 99.9% uptime during Black Friday.',
        impact: 'This project established our team as the go-to solution for high-performance e-commerce platforms.'
      }
    },
    settings: {
      defaultTone: 'professional',
      defaultLength: 'medium',
      requiredFields: ['title', 'description', 'technologies', 'results']
    }
  },
  {
    id: 'casestudy-detailed',
    name: 'Detailed Case Study',
    description: 'Comprehensive story from problem to solution',
    category: 'casestudy',
    template: {
      structure: ['overview', 'problem', 'research', 'solution', 'process', 'results', 'learnings'],
      prompts: {
        overview: 'Create an engaging overview that sets the context and stakes for this case study.',
        problem: 'Detail the specific problem, pain points, and constraints faced.',
        research: 'Describe the research and discovery phase that informed the solution.',
        solution: 'Explain the solution design and key decisions made.',
        process: 'Walk through the implementation process and key milestones.',
        results: 'Present measurable results and outcomes achieved.',
        learnings: 'Share key insights and lessons learned from this project.'
      },
      examples: {
        overview: 'When a Fortune 500 company needed to modernize their legacy system, we delivered a solution that transformed their operations.',
        problem: 'The existing system was causing 40% data loss, 3-hour daily downtime, and customer complaints.',
        research: 'Conducted user interviews, system analysis, and competitive research to understand the full scope.',
        solution: 'Designed a microservices architecture with real-time data synchronization and automated failover.',
        process: 'Implemented in 4 phases over 6 months with continuous testing and stakeholder feedback.',
        results: '99.9% uptime, 95% reduction in data loss, 50% faster processing times.',
        learnings: 'Key insight: Legacy system integration requires careful data migration planning and user training.'
      }
    },
    settings: {
      defaultTone: 'professional',
      defaultLength: 'long',
      requiredFields: ['title', 'problem', 'solution', 'results']
    }
  },
  {
    id: 'portfolio-intro',
    name: 'Portfolio Introduction',
    description: 'Personal brand and professional story',
    category: 'portfolio',
    template: {
      structure: ['hook', 'background', 'expertise', 'approach', 'values', 'cta'],
      prompts: {
        hook: 'Create an attention-grabbing opening that immediately communicates your unique value.',
        background: 'Share your professional journey and key experiences.',
        expertise: 'Highlight your core skills and areas of specialization.',
        approach: 'Describe your methodology and working style.',
        values: 'Express your professional values and what drives you.',
        cta: 'End with a clear call-to-action for potential clients or employers.'
      },
      examples: {
        hook: 'I transform complex problems into elegant digital solutions that users love.',
        background: 'With 8+ years in UX/UI design, I\'ve helped 50+ companies create products that matter.',
        expertise: 'Specializing in mobile-first design, design systems, and user research.',
        approach: 'I believe in data-driven design, collaborative processes, and continuous iteration.',
        values: 'Passionate about creating inclusive, accessible, and sustainable digital experiences.',
        cta: 'Let\'s discuss how I can help bring your vision to life.'
      }
    },
    settings: {
      defaultTone: 'creative',
      defaultLength: 'medium',
      requiredFields: ['title', 'description']
    }
  },
  {
    id: 'asset-story',
    name: 'Asset Story',
    description: 'Narrative around individual creative assets',
    category: 'asset',
    template: {
      structure: ['inspiration', 'process', 'techniques', 'outcome', 'context'],
      prompts: {
        inspiration: 'Describe what inspired this creative work and the initial concept.',
        process: 'Explain the creative process and key decisions made.',
        techniques: 'Detail the techniques, tools, and methods used.',
        outcome: 'Describe the final result and how it met the objectives.',
        context: 'Provide context about how this asset fits into the larger project or portfolio.'
      },
      examples: {
        inspiration: 'Inspired by the client\'s mission to democratize education, I wanted to create something that felt both accessible and aspirational.',
        process: 'Started with mood boards, then created 20+ iterations before landing on the final concept.',
        techniques: 'Used Adobe Creative Suite, custom typography, and a carefully curated color palette.',
        outcome: 'The final design successfully communicated the brand\'s values while standing out in a crowded market.',
        context: 'This logo became the foundation for the entire brand identity system used across 15+ touchpoints.'
      }
    },
    settings: {
      defaultTone: 'creative',
      defaultLength: 'short',
      requiredFields: ['title', 'type']
    }
  }
]

// ===== AI SERVICE CLASS =====

export class AINarrativeService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  // Generate narrative from prompt
  async generateNarrative(prompt: NarrativePrompt): Promise<GeneratedNarrative> {
    const template = this.getTemplate(prompt.type)
    const structuredPrompt = this.buildStructuredPrompt(prompt, template)
    
    try {
      const response = await this.callAIAPI(structuredPrompt)
      return this.parseAIResponse(response, prompt, template)
    } catch (error) {
      console.error('Error generating narrative:', error)
      return this.generateFallbackNarrative(prompt)
    }
  }

  // Generate multiple narrative variations
  async generateVariations(prompt: NarrativePrompt, count: number = 3): Promise<GeneratedNarrative[]> {
    const variations = []
    const tones = ['professional', 'creative', 'casual', 'technical']
    
    for (let i = 0; i < count; i++) {
      const variationPrompt = {
        ...prompt,
        tone: tones[i % tones.length] as any
      }
      const narrative = await this.generateNarrative(variationPrompt)
      variations.push(narrative)
    }
    
    return variations
  }

  // Improve existing narrative
  async improveNarrative(narrative: GeneratedNarrative, improvements: string[]): Promise<GeneratedNarrative> {
    const improvementPrompt = this.buildImprovementPrompt(narrative, improvements)
    
    try {
      const response = await this.callAIAPI(improvementPrompt)
      return this.parseAIResponse(response, { type: narrative.type } as NarrativePrompt, this.getTemplate(narrative.type))
    } catch (error) {
      console.error('Error improving narrative:', error)
      return narrative
    }
  }

  // Generate narrative from project data
  async generateProjectNarrative(project: any): Promise<GeneratedNarrative> {
    const prompt: NarrativePrompt = {
      type: 'project',
      content: {
        title: project.title,
        description: project.description,
        metadata: project.metadata,
        assets: project.assets?.map((asset: any) => ({
          type: asset.type,
          name: asset.name,
          description: asset.description
        })),
        context: {
          client: project.metadata?.client,
          role: project.metadata?.role,
          duration: project.metadata?.duration,
          technologies: project.metadata?.technologies,
          challenges: project.metadata?.challenges,
          results: project.metadata?.results
        }
      },
      tone: 'professional',
      length: 'medium'
    }

    return this.generateNarrative(prompt)
  }

  // Generate narrative from case study data
  async generateCaseStudyNarrative(caseStudy: any): Promise<GeneratedNarrative> {
    const prompt: NarrativePrompt = {
      type: 'casestudy',
      content: {
        title: caseStudy.title,
        description: caseStudy.description,
        context: {
          client: caseStudy.project?.metadata?.client,
          role: caseStudy.project?.metadata?.role,
          duration: caseStudy.project?.metadata?.duration,
          technologies: caseStudy.project?.metadata?.technologies,
          challenges: caseStudy.content?.challenges,
          results: caseStudy.content?.results
        }
      },
      tone: 'professional',
      length: 'long'
    }

    return this.generateNarrative(prompt)
  }

  // Private methods
  private getTemplate(type: string): NarrativeTemplate {
    return narrativeTemplates.find(t => t.category === type) || narrativeTemplates[0]
  }

  private buildStructuredPrompt(prompt: NarrativePrompt, template: NarrativeTemplate): string {
    const { content, tone, length, targetAudience } = prompt
    const { prompts: templatePrompts } = template.template

    let structuredPrompt = `Generate a ${tone} ${length} narrative for a ${prompt.type} with the following details:\n\n`
    
    structuredPrompt += `Title: ${content.title}\n`
    if (content.description) structuredPrompt += `Description: ${content.description}\n`
    
    // Add context
    if (content.context) {
      structuredPrompt += `\nContext:\n`
      Object.entries(content.context).forEach(([key, value]) => {
        if (value) {
          structuredPrompt += `${key}: ${Array.isArray(value) ? value.join(', ') : value}\n`
        }
      })
    }

    // Add template prompts
    structuredPrompt += `\nPlease structure your response as follows:\n`
    Object.entries(templatePrompts).forEach(([key, promptText]) => {
      structuredPrompt += `\n${key.toUpperCase()}: ${promptText}\n`
    })

    if (targetAudience) {
      structuredPrompt += `\nTarget Audience: ${targetAudience}\n`
    }

    return structuredPrompt
  }

  private buildImprovementPrompt(narrative: GeneratedNarrative, improvements: string[]): string {
    return `Improve the following narrative based on these suggestions: ${improvements.join(', ')}\n\nCurrent narrative:\n${JSON.stringify(narrative.content, null, 2)}`
  }

  private async callAIAPI(prompt: string): Promise<any> {
    // This would be replaced with actual AI API call
    // For now, return mock response
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            summary: "Generated narrative content",
            problem: "Identified problem",
            solution: "Proposed solution",
            process: "Implementation process",
            results: "Achieved results",
            impact: "Project impact"
          })
        }
      }]
    }
  }

  private parseAIResponse(response: any, prompt: NarrativePrompt, template: NarrativeTemplate): GeneratedNarrative {
    const content = JSON.parse(response.choices[0].message.content)
    
    return {
      id: `narrative-${Date.now()}`,
      type: prompt.type,
      title: prompt.content.title,
      content: {
        summary: content.summary || '',
        problem: content.problem || '',
        solution: content.solution || '',
        process: content.process || '',
        results: content.results || '',
        impact: content.impact || '',
        callToAction: content.callToAction || ''
      },
      metadata: {
        wordCount: this.countWords(content),
        readingTime: this.calculateReadingTime(content),
        tone: prompt.tone || 'professional',
        confidence: 0.85,
        generatedAt: new Date().toISOString(),
        version: 1
      },
      suggestions: {
        improvements: this.generateImprovementSuggestions(content),
        alternativeTones: ['professional', 'creative', 'casual', 'technical'],
        keyPoints: this.extractKeyPoints(content)
      }
    }
  }

  private generateFallbackNarrative(prompt: NarrativePrompt): GeneratedNarrative {
    return {
      id: `narrative-${Date.now()}`,
      type: prompt.type,
      title: prompt.content.title,
      content: {
        summary: prompt.content.description || 'A compelling project that showcases creativity and technical expertise.',
        problem: 'Identified key challenges and opportunities for improvement.',
        solution: 'Developed an innovative solution that addresses the core requirements.',
        process: 'Implemented using best practices and modern methodologies.',
        results: 'Achieved significant improvements and positive outcomes.',
        impact: 'Created lasting value and meaningful impact.',
        callToAction: 'Explore more projects and case studies to see the full scope of work.'
      },
      metadata: {
        wordCount: 50,
        readingTime: 1,
        tone: prompt.tone || 'professional',
        confidence: 0.5,
        generatedAt: new Date().toISOString(),
        version: 1
      },
      suggestions: {
        improvements: ['Add specific metrics', 'Include more technical details', 'Expand on the creative process'],
        alternativeTones: ['professional', 'creative', 'casual', 'technical'],
        keyPoints: ['Problem identification', 'Solution design', 'Implementation', 'Results achieved']
      }
    }
  }

  private countWords(content: any): number {
    const text = Object.values(content).join(' ')
    return text.split(' ').length
  }

  private calculateReadingTime(content: any): number {
    const wordCount = this.countWords(content)
    return Math.ceil(wordCount / 200) // Average reading speed: 200 words per minute
  }

  private generateImprovementSuggestions(content: any): string[] {
    return [
      'Add specific metrics and data points',
      'Include more technical details about the implementation',
      'Expand on the creative process and decision-making',
      'Add client testimonials or feedback',
      'Include before/after comparisons'
    ]
  }

  private extractKeyPoints(content: any): string[] {
    const keyPoints = []
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 20) {
        keyPoints.push(`${key}: ${value.substring(0, 50)}...`)
      }
    })
    return keyPoints
  }
}

// ===== EXPORT =====

export default AINarrativeService
