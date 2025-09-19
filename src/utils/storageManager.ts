// Hybrid storage manager that handles both localStorage and IndexedDB
import type { ProjectMeta } from '../intake/schema'
import {
  indexedDbStore as defaultIndexedDbStore,
  isIndexedDBSupported as defaultIsIndexedDBSupported
} from './indexedDbStore'
import * as defaultFileStore from './fileStore'

type StorageDependencies = {
  indexedDbStore: typeof defaultIndexedDbStore
  fileStore: typeof defaultFileStore
  isIndexedDBSupported: typeof defaultIsIndexedDBSupported
}

let dependencies: StorageDependencies = {
  indexedDbStore: defaultIndexedDbStore,
  fileStore: defaultFileStore,
  isIndexedDBSupported: defaultIsIndexedDBSupported
}

export const setStorageDependencies = (overrides: Partial<StorageDependencies>) => {
  dependencies = { ...dependencies, ...overrides }
}

export const resetStorageDependencies = () => {
  dependencies = {
    indexedDbStore: defaultIndexedDbStore,
    fileStore: defaultFileStore,
    isIndexedDBSupported: defaultIsIndexedDBSupported
  }
}

export type StorageType = 'localStorage' | 'indexedDB'

class StorageManager {
  private currentStorage: StorageType = 'localStorage'
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    // Check which storage to use
    const { indexedDbStore, fileStore, isIndexedDBSupported } = dependencies

    if (isIndexedDBSupported()) {
      try {
        await indexedDbStore.init()

        // Check if we should migrate from localStorage
        const localProjects = fileStore.listProjects()
        const indexedProjects = await indexedDbStore.listProjects()
        
        if (localProjects.length > 0 && indexedProjects.length === 0) {
          console.log('Migrating projects from localStorage to IndexedDB...')
          await this.migrateFromLocalStorage()
        }
        
        this.currentStorage = 'indexedDB'
        console.log('Using IndexedDB for storage (larger capacity)')
      } catch (error) {
        console.warn('IndexedDB failed, falling back to localStorage:', error)
        this.currentStorage = 'localStorage'
      }
    } else {
      console.log('IndexedDB not supported, using localStorage')
      this.currentStorage = 'localStorage'
    }

    this.initialized = true
  }

  private async migrateFromLocalStorage(): Promise<void> {
    const { indexedDbStore, fileStore } = dependencies
    const projects = fileStore.listProjects()
    
    for (const project of projects) {
      try {
        await indexedDbStore.saveProject(project)
      } catch (error) {
        console.error(`Failed to migrate project ${project.slug}:`, error)
      }
    }
    
    console.log(`Migrated ${projects.length} projects to IndexedDB`)
  }

  async saveProject(project: ProjectMeta): Promise<void> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    if (this.currentStorage === 'indexedDB') {
      return indexedDbStore.saveProject(project)
    } else {
      return fileStore.saveProject(project)
    }
  }

  async loadProject(slug: string): Promise<ProjectMeta | null> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    if (this.currentStorage === 'indexedDB') {
      return indexedDbStore.loadProject(slug)
    } else {
      return fileStore.loadProject(slug)
    }
  }

  async listProjects(): Promise<ProjectMeta[]> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    if (this.currentStorage === 'indexedDB') {
      return indexedDbStore.listProjects()
    } else {
      return fileStore.listProjects()
    }
  }

  async deleteProject(slug: string): Promise<void> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    if (this.currentStorage === 'indexedDB') {
      return indexedDbStore.deleteProject(slug)
    } else {
      return fileStore.deleteProject(slug)
    }
  }

  async clearAllProjects(): Promise<void> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    if (this.currentStorage === 'indexedDB') {
      return indexedDbStore.clearAllProjects()
    } else {
      return fileStore.clearAllProjects()
    }
  }

  async getStorageUsage(): Promise<{used: number, available: number, percentage: number, type: StorageType}> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    let usage
    if (this.currentStorage === 'indexedDB') {
      usage = await indexedDbStore.getStorageUsage()
    } else {
      usage = fileStore.getStorageUsage()
    }
    
    return { ...usage, type: this.currentStorage }
  }

  async getProjectSizes(): Promise<Array<{slug: string, title: string, size: number, sizeMB: string}>> {
    await this.init()
    const { indexedDbStore, fileStore } = dependencies

    if (this.currentStorage === 'indexedDB') {
      return indexedDbStore.getProjectSizes()
    } else {
      return fileStore.getProjectSizes()
    }
  }

  getStorageType(): StorageType {
    return this.currentStorage
  }

  getCapacityInfo(): {type: StorageType, maxSize: string, features: string[]} {
    if (this.currentStorage === 'indexedDB') {
      return {
        type: 'indexedDB',
        maxSize: '50MB - 1GB+',
        features: [
          'Much larger storage capacity',
          'Better performance for large datasets',
          'Structured data storage',
          'Automatic migration from localStorage'
        ]
      }
    } else {
      return {
        type: 'localStorage',
        maxSize: '5-10MB',
        features: [
          'Simple key-value storage',
          'Synchronous API',
          'Universal browser support',
          'Limited capacity'
        ]
      }
    }
  }

  /**
   * Resets the manager so tests can start from a known state.
   */
  resetForTesting(): void {
    this.currentStorage = 'localStorage'
    this.initialized = false
  }
}

// Create singleton instance
export const storageManager = new StorageManager()

// Export convenience functions
export const saveProject = (project: ProjectMeta) => storageManager.saveProject(project)
export const loadProject = (slug: string) => storageManager.loadProject(slug)
export const listProjects = () => storageManager.listProjects()
export const deleteProject = (slug: string) => storageManager.deleteProject(slug)
export const clearAllProjects = () => storageManager.clearAllProjects()
export const getStorageUsage = () => storageManager.getStorageUsage()
export const getProjectSizes = () => storageManager.getProjectSizes()

export const resetStorageManagerForTesting = () => storageManager.resetForTesting()
