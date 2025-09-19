import type {
  ProjectAsset,
  ProjectLayoutBlock,
  ProjectMeta,
  ProjectRole,
  ProjectStatus,
} from '../intake/schema'

const KEY = 'pf-projects-v1'

type Store = Record<string, ProjectMeta>

const isAssetArray = (value: unknown): value is ProjectAsset[] =>
  Array.isArray(value) &&
  value.every(asset =>
    asset &&
    typeof asset === 'object' &&
    'id' in asset &&
    typeof (asset as ProjectAsset).id === 'string',
  )

const isLayoutBlock = (value: unknown): value is ProjectLayoutBlock =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'id' in value &&
      typeof (value as { id?: unknown }).id === 'string' &&
      'type' in value &&
      typeof (value as { type?: unknown }).type === 'string',
  )

const normaliseLayout = (value: unknown): ProjectLayoutBlock[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined
  }

  const blocks = value.filter(isLayoutBlock) as ProjectLayoutBlock[]
  return blocks.length > 0 ? blocks : []
}

const normaliseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }

  if (typeof value === 'string') {
    return value
      .split(/[;,]+/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }

  return []
}

const readStore = (): Store => {
  const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, unknown>
  const normalised: Store = {}

  Object.entries(raw).forEach(([slug, entry]) => {
    if (!entry || typeof entry !== 'object') {
      return
    }

    const meta = entry as Partial<ProjectMeta> & Record<string, unknown>

    const tags = normaliseStringArray(meta.tags)
    const technologiesArray = normaliseStringArray(meta.technologies)
    const assets = isAssetArray(meta.assets) ? meta.assets : []

    const createdAt = typeof meta.createdAt === 'string' ? meta.createdAt : new Date().toISOString()
    const updatedAt = typeof meta.updatedAt === 'string' ? meta.updatedAt : createdAt

    normalised[slug] = {
      title: typeof meta.title === 'string' ? meta.title : slug,
      slug,
      summary: typeof meta.summary === 'string' ? meta.summary : undefined,
      problem: typeof meta.problem === 'string' ? meta.problem : '',
      solution: typeof meta.solution === 'string' ? meta.solution : '',
      outcomes: typeof meta.outcomes === 'string' ? meta.outcomes : '',
      tags,
      technologies: technologiesArray.length > 0 ? technologiesArray : undefined,
      status: (typeof meta.status === 'string' && ['draft', 'cast', 'published'].includes(meta.status)) 
        ? meta.status as ProjectStatus 
        : 'draft',
      role: (typeof meta.role === 'string' && ['designer', 'developer', 'director', 'project-manager', 'researcher', 'strategist', 'other'].includes(meta.role))
        ? meta.role as ProjectRole
        : 'other',
      collaborators: Array.isArray(meta.collaborators) ? meta.collaborators : undefined,
      timeframe: typeof meta.timeframe === 'object' ? meta.timeframe : undefined,
      links: Array.isArray(meta.links) ? meta.links : undefined,
      metrics: typeof meta.metrics === 'object' ? meta.metrics : undefined,
      cover: typeof meta.cover === 'string' ? meta.cover : undefined,
      createdAt,
      updatedAt,
      assets,
      layout: normaliseLayout(meta.layout),
      autoGenerateNarrative: typeof meta.autoGenerateNarrative === 'boolean' ? meta.autoGenerateNarrative : false,
      aiGeneratedSummary: typeof meta.aiGeneratedSummary === 'string' ? meta.aiGeneratedSummary : undefined,
    }
  })

  return normalised
}

const writeStore = (store: Store) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Storage quota exceeded - throw a more helpful error
      const usage = getStorageUsage()
      throw new Error(`Storage quota exceeded. Current usage: ${usage.used}MB / ${usage.available}MB. Consider deleting old projects or large assets.`)
    }
    throw error
  }
}

export function getStorageUsage() {
  let used = 0
  let available = 10 // Default localStorage limit in MB
  
  // Calculate current usage
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length
    }
  }
  
  // Convert bytes to MB
  used = Math.round((used * 2) / (1024 * 1024) * 100) / 100 // *2 for UTF-16 encoding
  
  return { used, available, percentage: Math.round((used / available) * 100) }
}

export function clearAllProjects() {
  localStorage.removeItem(KEY)
}

export function getProjectSizes(): Array<{slug: string, title: string, size: number, sizeMB: string}> {
  const store = readStore()
  return Object.values(store).map(project => {
    const size = JSON.stringify(project).length * 2 // UTF-16 encoding
    const sizeMB = Math.round((size / (1024 * 1024)) * 100) / 100
    return {
      slug: project.slug,
      title: project.title,
      size,
      sizeMB: `${sizeMB}MB`
    }
  }).sort((a, b) => b.size - a.size)
}

export function saveProject(meta: ProjectMeta) {
  const store = readStore()
  const timestamp = new Date().toISOString()
  store[meta.slug] = {
    ...meta,
    slug: meta.slug,
    createdAt: meta.createdAt,
    updatedAt: timestamp,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    technologies: Array.isArray(meta.technologies)
      ? meta.technologies.filter(Boolean)
      : undefined,
    assets: Array.isArray(meta.assets) ? meta.assets : [],
    layout: Array.isArray(meta.layout) ? meta.layout : undefined,
  }
  writeStore(store)
}

export function loadProject(slug: string): ProjectMeta | null {
  const store = readStore()
  return store[slug] || null
}

export function listProjects(): ProjectMeta[] {
  const store = readStore()
  return Object.values(store).sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime()
    const bDate = new Date(b.createdAt).getTime()
    return bDate - aDate
  })
}

export function deleteProject(slug: string) {
  const store = readStore()
  if (store[slug]) {
    delete store[slug]
    writeStore(store)
  }
}
