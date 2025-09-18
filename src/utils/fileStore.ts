import type { ProjectMeta } from '../intake/schema'

const KEY = 'pf-projects-v1'

type Store = Record<string, ProjectMeta>

export function saveProject(meta: ProjectMeta) {
  const store: Store = JSON.parse(localStorage.getItem(KEY) || '{}')
  store[meta.slug] = meta
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function loadProject(slug: string): ProjectMeta | null {
  const store: Store = JSON.parse(localStorage.getItem(KEY) || '{}')
  return store[slug] || null
}
