import type { ProjectMeta } from '../intake/schema'

const KEY = 'pf-projects-v1'

type Store = Record<string, ProjectMeta>

const readStore = (): Store => JSON.parse(localStorage.getItem(KEY) || '{}')
const writeStore = (store: Store) => localStorage.setItem(KEY, JSON.stringify(store))

export function saveProject(meta: ProjectMeta) {
  const store = readStore()
  store[meta.slug] = meta
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
