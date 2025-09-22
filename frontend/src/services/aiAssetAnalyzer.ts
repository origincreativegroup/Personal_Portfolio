// ===== AI ASSET ANALYZER SERVICE =====

export interface AssetAnalysis {
  id: string
  assetId: string
  type: 'image' | 'video' | 'audio' | 'document' | 'interactive'
  analysis: {
    visual?: VisualAnalysis
    content?: ContentAnalysis
    metadata?: MetadataAnalysis
    suggestions?: AssetSuggestions
  }
  confidence: number
  generatedAt: string
  version: number
}

export interface VisualAnalysis {
  colors: {
    dominant: string
    palette: string[]
    mood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted'
  }
  composition: {
    ruleOfThirds: boolean
    symmetry: 'horizontal' | 'vertical' | 'radial' | 'none'
    balance: 'balanced' | 'unbalanced'
    focalPoint: { x: number; y: number } | null
  }
  quality: {
    resolution: 'high' | 'medium' | 'low'
    sharpness: number
    brightness: number
    contrast: number
    saturation: number
  }
  style: {
    aesthetic: string[]
    genre: string[]
    mood: string[]
    technique: string[]
  }
}

export interface ContentAnalysis {
  objects: Array<{
    name: string
    confidence: number
    boundingBox: { x: number; y: number; width: number; height: number }
  }>
  text: Array<{
    content: string
    confidence: number
    language: string
    boundingBox: { x: number; y: number; width: number; height: number }
  }>
  faces: Array<{
    confidence: number
    age: number | null
    gender: string | null
    emotion: string | null
    boundingBox: { x: number; y: number; width: number; height: number }
  }>
  scenes: Array<{
    name: string
    confidence: number
    description: string
  }>
}

export interface MetadataAnalysis {
  technical: {
    format: string
    dimensions: { width: number; height: number }
    fileSize: number
    compression: string
    quality: number
  }
  creation: {
    software: string | null
    camera: string | null
    settings: Record<string, any>
    timestamp: string | null
  }
  usage: {
    suitableFor: string[]
    notSuitableFor: string[]
    recommendedSize: string[]
    licensing: string[]
  }
}

export interface AssetSuggestions {
  improvements: Array<{
    type: 'quality' | 'composition' | 'color' | 'content' | 'format'
    description: string
    priority: 'high' | 'medium' | 'low'
    action: string
  }>
  tags: string[]
  categories: string[]
  altText: string
  caption: string
  title: string
  description: string
  keywords: string[]
  usage: {
    portfolio: boolean
    social: boolean
    print: boolean
    web: boolean
  }
}

export interface AIAssetAnalyzerConfig {
  enableVisualAnalysis: boolean
  enableContentAnalysis: boolean
  enableMetadataAnalysis: boolean
  enableSuggestions: boolean
  confidenceThreshold: number
  maxObjects: number
  maxText: number
  maxFaces: number
}

export class AIAssetAnalyzer {
  private apiKey: string
  private baseUrl: string
  private config: AIAssetAnalyzerConfig

  constructor(
    apiKey: string, 
    config: Partial<AIAssetAnalyzerConfig> = {},
    baseUrl: string = 'https://api.openai.com/v1'
  ) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.config = {
      enableVisualAnalysis: true,
      enableContentAnalysis: true,
      enableMetadataAnalysis: true,
      enableSuggestions: true,
      confidenceThreshold: 0.7,
      maxObjects: 10,
      maxText: 5,
      maxFaces: 3,
      ...config
    }
  }

  // Analyze a single asset
  async analyzeAsset(asset: {
    id: string
    type: string
    dataUrl: string
    name: string
    size: number
    mimeType: string
  }): Promise<AssetAnalysis> {
    try {
      const analysis: AssetAnalysis = {
        id: `analysis-${Date.now()}`,
        assetId: asset.id,
        type: asset.type as any,
        analysis: {},
        confidence: 0,
        generatedAt: new Date().toISOString(),
        version: 1
      }

      // Visual Analysis
      if (this.config.enableVisualAnalysis && this.isVisualAsset(asset.type)) {
        analysis.analysis.visual = await this.analyzeVisual(asset)
      }

      // Content Analysis
      if (this.config.enableContentAnalysis) {
        analysis.analysis.content = await this.analyzeContent(asset)
      }

      // Metadata Analysis
      if (this.config.enableMetadataAnalysis) {
        analysis.analysis.metadata = await this.analyzeMetadata(asset)
      }

      // Generate Suggestions
      if (this.config.enableSuggestions) {
        analysis.analysis.suggestions = await this.generateSuggestions(asset, analysis.analysis)
      }

      // Calculate overall confidence
      analysis.confidence = this.calculateConfidence(analysis.analysis)

      return analysis
    } catch (error) {
      console.error('Error analyzing asset:', error)
      return this.generateFallbackAnalysis(asset)
    }
  }

  // Analyze multiple assets in batch
  async analyzeAssets(assets: Array<{
    id: string
    type: string
    dataUrl: string
    name: string
    size: number
    mimeType: string
  }>): Promise<AssetAnalysis[]> {
    const analyses = []
    
    for (const asset of assets) {
      try {
        const analysis = await this.analyzeAsset(asset)
        analyses.push(analysis)
      } catch (error) {
        console.error(`Error analyzing asset ${asset.id}:`, error)
        analyses.push(this.generateFallbackAnalysis(asset))
      }
    }
    
    return analyses
  }

  // Generate asset recommendations for portfolio use
  async generatePortfolioRecommendations(assets: AssetAnalysis[]): Promise<{
    heroAssets: AssetAnalysis[]
    galleryAssets: AssetAnalysis[]
    socialAssets: AssetAnalysis[]
    printAssets: AssetAnalysis[]
    improvements: Array<{
      asset: AssetAnalysis
      suggestions: AssetSuggestions
    }>
  }> {
    const heroAssets = assets
      .filter(a => a.analysis.visual?.quality.resolution === 'high')
      .filter(a => a.analysis.visual?.composition.ruleOfThirds)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)

    const galleryAssets = assets
      .filter(a => a.confidence > this.config.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20)

    const socialAssets = assets
      .filter(a => a.analysis.visual?.quality.resolution === 'high')
      .filter(a => a.analysis.visual?.composition.balance === 'balanced')
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)

    const printAssets = assets
      .filter(a => a.analysis.visual?.quality.resolution === 'high')
      .filter(a => a.analysis.metadata?.technical.dimensions.width >= 2000)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15)

    const improvements = assets
      .filter(a => a.analysis.suggestions?.improvements.some(i => i.priority === 'high'))
      .map(asset => ({
        asset,
        suggestions: asset.analysis.suggestions!
      }))

    return {
      heroAssets,
      galleryAssets,
      socialAssets,
      printAssets,
      improvements
    }
  }

  // Generate AI-powered alt text
  async generateAltText(asset: {
    id: string
    type: string
    dataUrl: string
    name: string
  }): Promise<string> {
    try {
      // This would call an actual AI API
      const prompt = `Generate descriptive alt text for this ${asset.type} asset named "${asset.name}". 
      Focus on accessibility and SEO. Keep it under 125 characters.`
      
      // Mock response for now
      return `Professional ${asset.type} showing creative design work`
    } catch (error) {
      console.error('Error generating alt text:', error)
      return `Image: ${asset.name}`
    }
  }

  // Generate AI-powered captions
  async generateCaption(asset: {
    id: string
    type: string
    dataUrl: string
    name: string
  }): Promise<string> {
    try {
      // This would call an actual AI API
      const prompt = `Generate an engaging caption for this ${asset.type} asset named "${asset.name}". 
      Make it suitable for social media and portfolio use.`
      
      // Mock response for now
      return `A stunning example of creative design work that showcases attention to detail and artistic vision.`
    } catch (error) {
      console.error('Error generating caption:', error)
      return `Creative work: ${asset.name}`
    }
  }

  // Generate AI-powered tags
  async generateTags(asset: {
    id: string
    type: string
    dataUrl: string
    name: string
  }): Promise<string[]> {
    try {
      // This would call an actual AI API
      const prompt = `Generate relevant tags for this ${asset.type} asset named "${asset.name}". 
      Include style, technique, subject matter, and mood tags.`
      
      // Mock response for now
      return ['design', 'creative', 'professional', 'modern', 'artistic']
    } catch (error) {
      console.error('Error generating tags:', error)
      return ['creative', 'design']
    }
  }

  // Private methods
  private isVisualAsset(type: string): boolean {
    return ['image', 'video'].includes(type)
  }

  private async analyzeVisual(asset: any): Promise<VisualAnalysis> {
    // Mock visual analysis
    return {
      colors: {
        dominant: '#3b82f6',
        palette: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        mood: 'vibrant'
      },
      composition: {
        ruleOfThirds: true,
        symmetry: 'none',
        balance: 'balanced',
        focalPoint: { x: 0.33, y: 0.33 }
      },
      quality: {
        resolution: 'high',
        sharpness: 0.85,
        brightness: 0.7,
        contrast: 0.8,
        saturation: 0.75
      },
      style: {
        aesthetic: ['modern', 'minimalist'],
        genre: ['digital', 'graphic'],
        mood: ['professional', 'creative'],
        technique: ['digital', 'vector']
      }
    }
  }

  private async analyzeContent(asset: any): Promise<ContentAnalysis> {
    // Mock content analysis
    return {
      objects: [
        {
          name: 'text',
          confidence: 0.9,
          boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.2 }
        }
      ],
      text: [
        {
          content: 'Sample Text',
          confidence: 0.85,
          language: 'en',
          boundingBox: { x: 0.1, y: 0.1, width: 0.8, height: 0.2 }
        }
      ],
      faces: [],
      scenes: [
        {
          name: 'office',
          confidence: 0.8,
          description: 'Professional office environment'
        }
      ]
    }
  }

  private async analyzeMetadata(asset: any): Promise<MetadataAnalysis> {
    return {
      technical: {
        format: asset.mimeType.split('/')[1],
        dimensions: { width: 1920, height: 1080 },
        fileSize: asset.size,
        compression: 'JPEG',
        quality: 85
      },
      creation: {
        software: 'Adobe Creative Suite',
        camera: null,
        settings: {},
        timestamp: new Date().toISOString()
      },
      usage: {
        suitableFor: ['web', 'portfolio', 'social'],
        notSuitableFor: ['print'],
        recommendedSize: ['1920x1080', '1280x720'],
        licensing: ['commercial', 'personal']
      }
    }
  }

  private async generateSuggestions(asset: any, analysis: any): Promise<AssetSuggestions> {
    return {
      improvements: [
        {
          type: 'quality',
          description: 'Consider increasing resolution for better print quality',
          priority: 'medium',
          action: 'Resize to 300 DPI for print use'
        }
      ],
      tags: ['design', 'creative', 'professional', 'modern'],
      categories: ['graphic-design', 'digital-art'],
      altText: `Professional ${asset.type} showing creative design work`,
      caption: `A stunning example of creative design work that showcases attention to detail.`,
      title: asset.name.replace(/\.[^/.]+$/, ''),
      description: `High-quality ${asset.type} asset suitable for portfolio and commercial use.`,
      keywords: ['design', 'creative', 'professional', 'modern', 'artistic'],
      usage: {
        portfolio: true,
        social: true,
        print: false,
        web: true
      }
    }
  }

  private calculateConfidence(analysis: any): number {
    let totalConfidence = 0
    let count = 0

    if (analysis.visual) {
      totalConfidence += 0.8
      count++
    }

    if (analysis.content) {
      totalConfidence += 0.7
      count++
    }

    if (analysis.metadata) {
      totalConfidence += 0.9
      count++
    }

    if (analysis.suggestions) {
      totalConfidence += 0.6
      count++
    }

    return count > 0 ? totalConfidence / count : 0.5
  }

  private generateFallbackAnalysis(asset: any): AssetAnalysis {
    return {
      id: `analysis-${Date.now()}`,
      assetId: asset.id,
      type: asset.type as any,
      analysis: {
        suggestions: {
          improvements: [],
          tags: ['creative', 'design'],
          categories: ['general'],
          altText: `Image: ${asset.name}`,
          caption: `Creative work: ${asset.name}`,
          title: asset.name.replace(/\.[^/.]+$/, ''),
          description: `Creative asset: ${asset.name}`,
          keywords: ['creative', 'design'],
          usage: {
            portfolio: true,
            social: true,
            print: false,
            web: true
          }
        }
      },
      confidence: 0.3,
      generatedAt: new Date().toISOString(),
      version: 1
    }
  }
}

// ===== EXPORT =====

export default AIAssetAnalyzer
