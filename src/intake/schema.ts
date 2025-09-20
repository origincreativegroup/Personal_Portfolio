export type ProjectAsset = {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  addedAt: string
  description?: string
  isHeroImage?: boolean // For thumbnail/hero image picker
  thumbnailUrl?: string | null
}

export type CaseStudyContent = {
  overview: string
  challenge: string
  approach: string[]
  results: string[]
  learnings: string
  callToAction?: string
}

export type ProjectBlockWidth = 'full' | 'two-thirds' | 'half' | 'third'
export type ProjectBlockAlignment = 'left' | 'center' | 'right'
export type ProjectBlockPadding = 'none' | 'small' | 'medium' | 'large'

export type ProjectBlockSettings = {
  width?: ProjectBlockWidth
  alignment?: ProjectBlockAlignment
  padding?: ProjectBlockPadding
  backgroundColor?: string
}

export type HeroBlockContent = {
  title?: string
  subtitle?: string
  assetId?: string | null
}

export type TextBlockContent = {
  title?: string
  text: string
  style?: 'section' | 'body' | 'quote'
}

export type ImageBlockContent = {
  assetId?: string | null
  alt?: string
  caption?: string
}

export type GalleryBlockContent = {
  title?: string
  items: Array<{
    assetId?: string | null
    caption?: string
  }>
}

export type VideoBlockContent = {
  assetId?: string | null
  caption?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

export type MetricsBlockContent = {
  title?: string
  metrics: Array<{ label: string; value: string }>
}

export type LinkBlockContent = {
  title?: string
  links: ProjectLink[]
}

export type ProjectLayoutBlock =
  | { id: string; type: 'hero'; order: number; settings: ProjectBlockSettings; content: HeroBlockContent }
  | { id: string; type: 'text'; order: number; settings: ProjectBlockSettings; content: TextBlockContent }
  | { id: string; type: 'image'; order: number; settings: ProjectBlockSettings; content: ImageBlockContent }
  | { id: string; type: 'gallery'; order: number; settings: ProjectBlockSettings; content: GalleryBlockContent }
  | { id: string; type: 'video'; order: number; settings: ProjectBlockSettings; content: VideoBlockContent }
  | { id: string; type: 'metrics'; order: number; settings: ProjectBlockSettings; content: MetricsBlockContent }
  | { id: string; type: 'link'; order: number; settings: ProjectBlockSettings; content: LinkBlockContent }

export type ProjectStatus = 'draft' | 'cast' | 'published'

export type ProjectRole =
  | 'designer'
  | 'developer'
  | 'director' 
  | 'project-manager'
  | 'researcher'
  | 'strategist'
  | 'other'

export type ProjectLink = {
  type: 'demo' | 'github' | 'behance' | 'youtube' | 'website' | 'other'
  url: string
  label?: string
}

export type ProjectCollaborator = {
  name: string
  role?: string
  company?: string
}

export type ProjectMetrics = {
  sales?: string // e.g., "$50K revenue increase"
  engagement?: string // e.g., "45% user engagement boost"
  awards?: string[] // e.g., ["Webby Award 2024", "Design Excellence"]
  other?: string
}

export type ProjectMeta = {
  // Core Project Info
  title: string
  slug: string
  summary?: string // 1-2 sentences
  
  // Narrative Hooks (the three key questions)
  problem: string // What was the problem you identified?
  solution: string // What solution did you create?
  outcomes: string // What were the outcomes/impact?
  
  // Classification
  tags: string[]
  technologies?: string[]
  status: ProjectStatus
  
  // Details for AI Resume/Profile Integration
  role: ProjectRole
  collaborators?: ProjectCollaborator[]
  timeframe?: {
    start?: string // ISO date or "Q1 2024"
    end?: string
    duration?: string // "3 months", "ongoing"
  }
  
  // Links & References
  links?: ProjectLink[]
  
  // Metrics & Impact
  metrics?: ProjectMetrics

  // System fields
  cover?: string // Hero image asset ID
  createdAt: string
  updatedAt?: string
  assets: ProjectAsset[]
  layout?: ProjectLayoutBlock[]
  caseStudyHtml?: string
  caseStudyCss?: string
  caseStudyContent?: CaseStudyContent

  // AI Integration
  autoGenerateNarrative?: boolean
  aiGeneratedSummary?: string
}

export const defaultTags = [
  "branding", "ui-design", "web-development", "mobile-app", "strategy",
  "research", "prototyping", "visual-design", "automation", "ai", 
  "data-visualization", "user-experience", "frontend", "backend", "full-stack"
]

export const defaultTechnologies = [
  "React", "TypeScript", "Node.js", "Python", "Figma", "Sketch", 
  "Adobe Creative Suite", "Vue.js", "Angular", "Next.js", "GraphQL",
  "PostgreSQL", "MongoDB", "AWS", "Docker", "Git"
]

export const projectRoleLabels: Record<ProjectRole, string> = {
  'designer': 'Designer',
  'developer': 'Developer', 
  'director': 'Creative Director',
  'project-manager': 'Project Manager',
  'researcher': 'Researcher',
  'strategist': 'Strategist',
  'other': 'Other'
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  'draft': 'Draft',
  'cast': 'Cast',
  'published': 'Published'
}

export const newProject = (title: string): ProjectMeta => ({
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,''),
  problem: "",
  solution: "",
  outcomes: "",
  tags: [],
  status: 'draft',
  role: 'other',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assets: [],
  layout: [],
  autoGenerateNarrative: false,
  caseStudyContent: {
    overview: '',
    challenge: '',
    approach: [],
    results: [],
    learnings: '',
    callToAction: undefined,
  },
})
