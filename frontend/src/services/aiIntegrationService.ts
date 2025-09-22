import { ProjectAsset } from '../types/asset'
import { Project, GeneratedNarrative, CaseStudy } from '../types/portfolio'

// ===== AI INTEGRATION SERVICE =====

export interface AIAnalysisResult {
  id: string
  assetId: string
  analysis: {
    description: string
    tags: string[]
    category: string
    mood: string
    colors: string[]
    composition: string
    technical: {
      quality: 'excellent' | 'good' | 'fair' | 'poor'
      resolution: string
      format: string
      size: string
    }
    suggestions: string[]
  }
  confidence: number
  generatedAt: string
}

export interface AIPortfolioInsight {
  id: string
  type: 'trend' | 'recommendation' | 'optimization' | 'warning'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  actions?: string[]
  data?: any
}

export interface AIContentGeneration {
  id: string
  type: 'narrative' | 'description' | 'tag' | 'title' | 'summary'
  content: string
  metadata: {
    tone: string
    length: number
    confidence: number
    alternatives: string[]
  }
  generatedAt: string
}

class AIIntegrationService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:3001/api/ai'
    this.apiKey = import.meta.env.VITE_AI_API_KEY || 'demo-key'
  }

  // ===== ASSET ANALYSIS =====

  async analyzeAsset(asset: ProjectAsset): Promise<AIAnalysisResult> {
    try {
      // Simulate AI analysis for demo
      const analysis = await this.simulateAssetAnalysis(asset)
      return analysis
    } catch (error) {
      console.error('Error analyzing asset:', error)
      throw new Error('Failed to analyze asset')
    }
  }

  private async simulateAssetAnalysis(asset: ProjectAsset): Promise<AIAnalysisResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const mockAnalysis = {
      id: `analysis-${Date.now()}`,
      assetId: asset.id,
      analysis: {
        description: this.generateMockDescription(asset),
        tags: this.generateMockTags(asset),
        category: this.categorizeAsset(asset),
        mood: this.generateMood(asset),
        colors: this.extractColors(asset),
        composition: this.analyzeComposition(asset),
        technical: {
          quality: this.assessQuality(asset),
          resolution: this.getResolution(asset),
          format: asset.mimeType,
          size: this.formatFileSize(asset.size)
        },
        suggestions: this.generateSuggestions(asset)
      },
      confidence: 0.85 + Math.random() * 0.15,
      generatedAt: new Date().toISOString()
    }

    return mockAnalysis
  }

  private generateMockDescription(asset: ProjectAsset): string {
    const descriptions = {
      image: [
        'A professional photograph showcasing modern design principles',
        'High-quality visual content with excellent composition',
        'Engaging image that effectively communicates the intended message',
        'Well-composed visual element with strong visual hierarchy'
      ],
      video: [
        'Dynamic video content with smooth transitions and professional quality',
        'Engaging motion graphics that effectively tell a story',
        'High-quality video production with excellent pacing',
        'Professional video content with clear narrative structure'
      ],
      document: [
        'Comprehensive document with well-structured information',
        'Professional document with clear formatting and organization',
        'Detailed content that effectively communicates key points',
        'Well-written document with professional presentation'
      ]
    }

    const typeDescriptions = descriptions[asset.type as keyof typeof descriptions] || descriptions.document
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)]
  }

  private generateMockTags(asset: ProjectAsset): string[] {
    const baseTags = {
      image: ['photography', 'design', 'visual', 'creative', 'professional'],
      video: ['motion', 'animation', 'dynamic', 'engaging', 'storytelling'],
      document: ['content', 'information', 'professional', 'detailed', 'structured']
    }

    const typeTags = baseTags[asset.type as keyof typeof baseTags] || baseTags.document
    const additionalTags = ['modern', 'clean', 'high-quality', 'engaging']
    
    return [...typeTags, ...additionalTags].slice(0, 5)
  }

  private categorizeAsset(asset: ProjectAsset): string {
    const categories = {
      image: ['photography', 'illustration', 'graphic-design', 'ui-design'],
      video: ['animation', 'demo', 'tutorial', 'presentation'],
      document: ['report', 'proposal', 'guideline', 'specification']
    }

    const typeCategories = categories[asset.type as keyof typeof categories] || categories.document
    return typeCategories[Math.floor(Math.random() * typeCategories.length)]
  }

  private generateMood(asset: ProjectAsset): string {
    const moods = ['professional', 'creative', 'modern', 'minimalist', 'dynamic', 'elegant']
    return moods[Math.floor(Math.random() * moods.length)]
  }

  private extractColors(asset: ProjectAsset): string[] {
    const colorPalettes = [
      ['#3B82F6', '#1E40AF', '#60A5FA'],
      ['#10B981', '#047857', '#34D399'],
      ['#F59E0B', '#D97706', '#FBBF24'],
      ['#EF4444', '#DC2626', '#F87171'],
      ['#8B5CF6', '#7C3AED', '#A78BFA']
    ]
    return colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
  }

  private analyzeComposition(asset: ProjectAsset): string {
    const compositions = [
      'Rule of thirds with strong focal point',
      'Balanced composition with good visual flow',
      'Dynamic layout with effective use of space',
      'Clean composition with clear hierarchy'
    ]
    return compositions[Math.floor(Math.random() * compositions.length)]
  }

  private assessQuality(asset: ProjectAsset): 'excellent' | 'good' | 'fair' | 'poor' {
    const qualities = ['excellent', 'good', 'fair', 'poor'] as const
    return qualities[Math.floor(Math.random() * qualities.length)]
  }

  private getResolution(asset: ProjectAsset): string {
    if (asset.width && asset.height) {
      return `${asset.width}x${asset.height}`
    }
    return 'Unknown'
  }

  private generateSuggestions(asset: ProjectAsset): string[] {
    return [
      'Consider adding alt text for accessibility',
      'Optimize file size for web performance',
      'Add relevant metadata for better searchability',
      'Consider creating multiple sizes for responsive design'
    ]
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // ===== PORTFOLIO INSIGHTS =====

  async generatePortfolioInsights(assets: ProjectAsset[], projects: Project[]): Promise<AIPortfolioInsight[]> {
    try {
      // Simulate AI insights generation
      await new Promise(resolve => setTimeout(resolve, 1500))

      const insights: AIPortfolioInsight[] = [
        {
          id: 'insight-1',
          type: 'trend',
          title: 'Visual Consistency Trend',
          description: 'Your recent assets show strong visual consistency with a cohesive color palette and design language.',
          priority: 'medium',
          actionable: true,
          actions: ['Continue current design direction', 'Document style guidelines']
        },
        {
          id: 'insight-2',
          type: 'recommendation',
          title: 'Asset Organization',
          description: 'Consider organizing your assets into more specific folders to improve discoverability.',
          priority: 'high',
          actionable: true,
          actions: ['Create folder structure', 'Move assets to appropriate folders']
        },
        {
          id: 'insight-3',
          type: 'optimization',
          title: 'File Size Optimization',
          description: 'Some of your images could be optimized for better web performance.',
          priority: 'medium',
          actionable: true,
          actions: ['Compress large images', 'Convert to modern formats']
        }
      ]

      return insights
    } catch (error) {
      console.error('Error generating portfolio insights:', error)
      throw new Error('Failed to generate portfolio insights')
    }
  }

  // ===== CONTENT GENERATION =====

  async generateContent(
    type: 'narrative' | 'description' | 'tag' | 'title' | 'summary',
    context: { assets?: ProjectAsset[], project?: Project, prompt?: string }
  ): Promise<AIContentGeneration> {
    try {
      // Simulate content generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      const content = this.generateMockContent(type, context)
      
      return {
        id: `content-${Date.now()}`,
        type,
        content,
        metadata: {
          tone: 'professional',
          length: content.length,
          confidence: 0.8 + Math.random() * 0.2,
          alternatives: this.generateAlternatives(content)
        },
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error generating content:', error)
      throw new Error('Failed to generate content')
    }
  }

  private generateMockContent(type: string, context: any): string {
    const contentTemplates = {
      narrative: [
        'This project showcases innovative design thinking and technical excellence, delivering a solution that exceeds client expectations while maintaining the highest standards of quality and user experience.',
        'Through careful analysis and creative problem-solving, we developed a comprehensive solution that addresses the core challenges while providing an intuitive and engaging user experience.',
        'The project demonstrates our ability to combine technical expertise with creative vision, resulting in a product that is both functional and aesthetically pleasing.'
      ],
      description: [
        'A professional project that demonstrates expertise in modern design principles and technical implementation.',
        'An innovative solution that showcases creative problem-solving and technical excellence.',
        'A comprehensive project that highlights our ability to deliver high-quality results across multiple disciplines.'
      ],
      title: [
        'Innovative Design Solution',
        'Modern Web Application',
        'Creative Brand Identity',
        'User Experience Optimization'
      ],
      summary: [
        'This project successfully delivered a modern, user-friendly solution that exceeded client expectations.',
        'A comprehensive project that demonstrates our technical and creative capabilities.',
        'An innovative approach to solving complex design challenges with measurable results.'
      ]
    }

    const templates = contentTemplates[type as keyof typeof contentTemplates] || contentTemplates.description
    return templates[Math.floor(Math.random() * templates.length)]
  }

  private generateAlternatives(content: string): string[] {
    return [
      content.replace(/innovative/gi, 'creative'),
      content.replace(/modern/gi, 'contemporary'),
      content.replace(/professional/gi, 'expert')
    ]
  }

  // ===== BULK OPERATIONS =====

  async analyzeBulkAssets(assets: ProjectAsset[]): Promise<AIAnalysisResult[]> {
    try {
      const results: AIAnalysisResult[] = []
      
      for (const asset of assets) {
        const analysis = await this.analyzeAsset(asset)
        results.push(analysis)
      }

      return results
    } catch (error) {
      console.error('Error analyzing bulk assets:', error)
      throw new Error('Failed to analyze bulk assets')
    }
  }

  async generateBulkContent(
    type: 'narrative' | 'description' | 'tag' | 'title' | 'summary',
    contexts: any[]
  ): Promise<AIContentGeneration[]> {
    try {
      const results: AIContentGeneration[] = []
      
      for (const context of contexts) {
        const content = await this.generateContent(type, context)
        results.push(content)
      }

      return results
    } catch (error) {
      console.error('Error generating bulk content:', error)
      throw new Error('Failed to generate bulk content')
    }
  }

  // ===== SMART RECOMMENDATIONS =====

  async getSmartRecommendations(assets: ProjectAsset[], projects: Project[]): Promise<{
    assets: string[]
    projects: string[]
    general: string[]
  }> {
    try {
      // Simulate smart recommendations
      await new Promise(resolve => setTimeout(resolve, 1000))

      return {
        assets: [
          'Consider adding more video content to showcase dynamic projects',
          'Organize assets by project phases for better workflow',
          'Add alt text to images for accessibility compliance'
        ],
        projects: [
          'Include more case studies with detailed process documentation',
          'Add client testimonials to build credibility',
          'Create project timelines to show development process'
        ],
        general: [
          'Update your portfolio with recent work to maintain freshness',
          'Consider creating a blog to share insights and process',
          'Optimize images for faster loading times'
        ]
      }
    } catch (error) {
      console.error('Error getting smart recommendations:', error)
      throw new Error('Failed to get smart recommendations')
    }
  }
}

// Export singleton instance
export const aiIntegrationService = new AIIntegrationService()
export default aiIntegrationService
