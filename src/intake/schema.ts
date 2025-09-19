export type ProjectAsset = {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  addedAt: string
  description?: string
  isHeroImage?: boolean // For thumbnail/hero image picker
}

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
  autoGenerateNarrative: false
})
