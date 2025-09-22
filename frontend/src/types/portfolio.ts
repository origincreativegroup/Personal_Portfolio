// ===== CORE TYPES =====
import { Project as SharedProject, ProjectAsset as SharedProjectAsset } from '@portfolioforge/shared'

export interface Portfolio {
  id: string
  title: string
  description: string
  slug: string
  coverImage?: string
  published: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
  settings: PortfolioSettings
  projects: Project[]
  caseStudies: CaseStudy[]
}

export interface Project extends Omit<SharedProject, 'tags'> {
  category: string
  tags: string[] // Frontend expects array, backend stores as string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  order: number
  assets: ProjectAsset[]
  caseStudy?: CaseStudy
  metadata: ProjectMetadata
}

export interface CaseStudy {
  id: string
  title: string
  description: string
  slug: string
  projectId: string
  coverImage?: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  order: number
  createdAt: string
  updatedAt: string
  content: CaseStudyContent
  metrics: CaseStudyMetrics
}

export interface ProjectAsset extends Omit<SharedProjectAsset, 'tags'> {
  tags: string[] // Frontend expects array, backend stores as string
  metadata?: AssetMetadata
}

// ===== SETTINGS & METADATA =====

export interface PortfolioSettings {
  theme: 'minimal' | 'creative' | 'professional' | 'bold'
  layout: 'grid' | 'masonry' | 'carousel' | 'timeline'
  showCategories: boolean
  showTags: boolean
  showDates: boolean
  showMetrics: boolean
  enableFiltering: boolean
  enableSearch: boolean
  customCSS?: string
  customDomain?: string
  seo: SEOSettings
}

export interface ProjectMetadata {
  client?: string
  role?: string
  duration?: string
  teamSize?: number
  technologies: string[]
  tools: string[]
  year: number
  location?: string
  budget?: string
  results?: string[]
  challenges?: string[]
  learnings?: string[]
}

export interface CaseStudyContent {
  problem: string
  solution: string
  process: CaseStudyProcess[]
  results: string
  impact: string
  gallery: ProjectAsset[]
  testimonials?: Testimonial[]
  links?: ExternalLink[]
}

export interface CaseStudyProcess {
  title: string
  description: string
  image?: string
  duration?: string
  tools?: string[]
  deliverables?: string[]
}

export interface CaseStudyMetrics {
  views: number
  likes: number
  shares: number
  comments: number
  timeOnPage: number
  conversionRate?: number
}

export interface AssetMetadata {
  alt?: string
  caption?: string
  location?: string
  photographer?: string
  license?: string
  colorPalette?: string[]
  dominantColor?: string
}

export interface SEOSettings {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  twitterCard?: string
  canonicalUrl?: string
}

// ===== DISPLAY COMPONENTS =====

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  avatar?: string
  rating?: number
  projectId: string
}

export interface ExternalLink {
  id: string
  title: string
  url: string
  type: 'website' | 'behance' | 'dribbble' | 'github' | 'figma' | 'other'
  description?: string
}

// ===== FILTER & SORT =====

export interface PortfolioFilter {
  category?: string
  tags?: string[]
  status?: string
  featured?: boolean
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface SortOption {
  field: 'title' | 'createdAt' | 'updatedAt' | 'order' | 'views' | 'likes'
  direction: 'asc' | 'desc'
}

// ===== LAYOUT TYPES =====

export type PortfolioLayout = 'grid' | 'masonry' | 'carousel' | 'timeline'
export type ProjectCardVariant = 'default' | 'minimal' | 'detailed' | 'hero'
export type CaseStudyVariant = 'full' | 'preview' | 'card' | 'featured'

// ===== RESPONSIVE BREAKPOINTS =====

export interface ResponsiveSettings {
  mobile: {
    columns: number
    cardVariant: ProjectCardVariant
    showDescription: boolean
  }
  tablet: {
    columns: number
    cardVariant: ProjectCardVariant
    showDescription: boolean
  }
  desktop: {
    columns: number
    cardVariant: ProjectCardVariant
    showDescription: boolean
  }
}

// ===== ANIMATION & INTERACTION =====

export interface AnimationSettings {
  enableAnimations: boolean
  staggerDelay: number
  hoverScale: number
  transitionDuration: number
  easing: string
}

export interface InteractionSettings {
  enableHover: boolean
  enableClick: boolean
  enableKeyboard: boolean
  enableTouch: boolean
  showOverlay: boolean
  overlayOpacity: number
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

// ===== EXPORT ALL TYPES =====
// Note: Types are already exported above, no need to re-export
