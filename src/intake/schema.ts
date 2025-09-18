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
  createdAt: new Date().toISOString()
})
