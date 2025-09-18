export type ProjectAsset = {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
  addedAt: string
  description?: string
}

export type ProjectMeta = {
  title: string
  slug: string
  problem: string
  solution: string
  outcomes: string
  tags: string[]
  technologies?: string[]
  cover?: string    // relative path to 06_Exports/cover.jpg
  createdAt: string
  updatedAt?: string
  assets: ProjectAsset[]
}

export const defaultTags = [
  "branding","large-format","vehicle-wraps","catalog",
  "web","video","social","automation","ai","training"
]

export const newProject = (title: string): ProjectMeta => ({
  title,
  slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,''),
  problem: "",
  solution: "",
  outcomes: "",
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  assets: []
})
