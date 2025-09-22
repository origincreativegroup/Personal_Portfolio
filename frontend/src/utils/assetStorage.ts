/**
 * Asset storage utilities for managing project assets efficiently
 * Avoids localStorage quota issues by using a more efficient storage approach
 */

export interface StoredAsset {
  id: string
  name: string
  type: string
  size: number
  mimeType: string
  addedAt: string
  description?: string
  tags?: string[]
  folder?: string
  featured: boolean
  visibility: string
  width?: number
  height?: number
  duration?: number
  // Note: dataUrl and thumbnailUrl are not stored to avoid quota issues
}

export class AssetStorage {
  private static readonly STORAGE_KEY = 'portfolio-assets'
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit

  static saveAsset(projectId: string, asset: StoredAsset): void {
    try {
      const key = `${this.STORAGE_KEY}-${projectId}`
      const existing = this.getAssets(projectId)
      const updated = [...existing.filter(a => a.id !== asset.id), asset]
      
      // Check if we're approaching storage limits
      const serialized = JSON.stringify(updated)
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn('Asset storage approaching limits, removing oldest assets')
        // Remove oldest assets to make room
        const sorted = updated.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
        const trimmed = sorted.slice(-10) // Keep only 10 most recent assets
        localStorage.setItem(key, JSON.stringify(trimmed))
      } else {
        localStorage.setItem(key, JSON.stringify(updated))
      }
      
      console.log(`Asset ${asset.name} saved to storage`)
    } catch (error) {
      console.error('Failed to save asset:', error)
    }
  }

  static getAssets(projectId: string): StoredAsset[] {
    try {
      const key = `${this.STORAGE_KEY}-${projectId}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load assets:', error)
      return []
    }
  }

  static removeAsset(projectId: string, assetId: string): void {
    try {
      const key = `${this.STORAGE_KEY}-${projectId}`
      const existing = this.getAssets(projectId)
      const updated = existing.filter(a => a.id !== assetId)
      localStorage.setItem(key, JSON.stringify(updated))
      console.log(`Asset ${assetId} removed from storage`)
    } catch (error) {
      console.error('Failed to remove asset:', error)
    }
  }

  static clearAssets(projectId: string): void {
    try {
      const key = `${this.STORAGE_KEY}-${projectId}`
      localStorage.removeItem(key)
      console.log(`All assets cleared for project ${projectId}`)
    } catch (error) {
      console.error('Failed to clear assets:', error)
    }
  }

  static getStorageUsage(): { used: number; limit: number; percentage: number } {
    try {
      let totalSize = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(this.STORAGE_KEY)) {
          const value = localStorage.getItem(key)
          if (value) {
            totalSize += value.length
          }
        }
      }
      
      return {
        used: totalSize,
        limit: this.MAX_STORAGE_SIZE,
        percentage: (totalSize / this.MAX_STORAGE_SIZE) * 100
      }
    } catch (error) {
      console.error('Failed to calculate storage usage:', error)
      return { used: 0, limit: this.MAX_STORAGE_SIZE, percentage: 0 }
    }
  }
}
