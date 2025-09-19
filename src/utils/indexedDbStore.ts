// IndexedDB storage solution for larger capacity
import type { ProjectMeta } from '../intake/schema'

const DB_NAME = 'PortfolioForgeDB'
const DB_VERSION = 1
const STORE_NAME = 'projects'

class IndexedDBStore {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create projects store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'slug' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
        }
      }
    })
  }

  async saveProject(project: ProjectMeta): Promise<void> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(project)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async loadProject(slug: string): Promise<ProjectMeta | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(slug)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async listProjects(): Promise<ProjectMeta[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const projects = request.result || []
        // Sort by creation date (newest first)
        projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        resolve(projects)
      }
    })
  }

  async deleteProject(slug: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(slug)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearAllProjects(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getStorageUsage(): Promise<{used: number, available: number, percentage: number}> {
    try {
      // Try to get quota information (modern browsers)
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        const used = Math.round((estimate.usage || 0) / (1024 * 1024) * 100) / 100
        const available = Math.round((estimate.quota || 0) / (1024 * 1024) * 100) / 100
        const percentage = available > 0 ? Math.round((used / available) * 100) : 0
        
        return { used, available, percentage }
      }
    } catch (error) {
      console.warn('Could not get storage estimate:', error)
    }

    // Fallback: estimate based on project count and average size
    const projects = await this.listProjects()
    const avgProjectSize = 2 // Assume 2MB average per project
    const estimatedUsed = projects.length * avgProjectSize
    const estimatedAvailable = 50 // Conservative IndexedDB estimate
    
    return {
      used: estimatedUsed,
      available: estimatedAvailable,
      percentage: Math.round((estimatedUsed / estimatedAvailable) * 100)
    }
  }

  async getProjectSizes(): Promise<Array<{slug: string, title: string, size: number, sizeMB: string}>> {
    const projects = await this.listProjects()
    
    return projects.map(project => {
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
}

// Create singleton instance
export const indexedDbStore = new IndexedDBStore()

// Check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return 'indexedDB' in window
}