import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AssetMetadata {
  width?: number
  height?: number
  format?: string
  size: number
  checksum: string
  exif?: any
}

export interface ThumbnailConfig {
  width: number
  height: number
  quality: number
  format: 'webp' | 'jpeg' | 'png'
}

export class AssetService {
  private static thumbnailConfigs: Record<string, ThumbnailConfig> = {
    small: { width: 150, height: 150, quality: 80, format: 'webp' },
    medium: { width: 400, height: 300, quality: 85, format: 'webp' },
    large: { width: 800, height: 600, quality: 90, format: 'webp' }
  }

  /**
   * Process uploaded file and generate metadata
   */
  static async processAsset(filePath: string, originalName: string, mimeType: string): Promise<AssetMetadata> {
    const stats = fs.statSync(filePath)
    const checksum = await this.generateChecksum(filePath)

    const metadata: AssetMetadata = {
      size: stats.size,
      checksum,
      format: path.extname(originalName).toLowerCase().substring(1)
    }

    // Process images with Sharp
    if (mimeType.startsWith('image/')) {
      try {
        const image = sharp(filePath)
        const imageMetadata = await image.metadata()

        metadata.width = imageMetadata.width
        metadata.height = imageMetadata.height
        metadata.format = imageMetadata.format
        metadata.exif = imageMetadata.exif
      } catch (error) {
        console.error('Error processing image metadata:', error)
      }
    }

    return metadata
  }

  /**
   * Generate thumbnail for image assets
   */
  static async generateThumbnails(filePath: string, assetId: string): Promise<Record<string, string>> {
    const thumbnails: Record<string, string> = {}

    if (!this.isImageFile(filePath)) {
      return thumbnails
    }

    try {
      const image = sharp(filePath)
      const uploadDir = path.join(process.cwd(), 'uploads', 'thumbnails', assetId)

      // Create thumbnails directory
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      // Generate different sizes
      for (const [size, config] of Object.entries(this.thumbnailConfigs)) {
        const outputPath = path.join(uploadDir, `${size}.${config.format}`)

        await image
          .clone()
          .resize(config.width, config.height, {
            fit: 'cover',
            position: 'center'
          })
          .toFormat(config.format, { quality: config.quality })
          .toFile(outputPath)

        thumbnails[size] = `/uploads/thumbnails/${assetId}/${size}.${config.format}`
      }
    } catch (error) {
      console.error('Error generating thumbnails:', error)
    }

    return thumbnails
  }

  /**
   * Optimize image for web
   */
  static async optimizeImage(filePath: string, quality: number = 85): Promise<string> {
    if (!this.isImageFile(filePath)) {
      return filePath
    }

    try {
      const ext = path.extname(filePath)
      const optimizedPath = filePath.replace(ext, `_optimized${ext}`)

      const image = sharp(filePath)
      const metadata = await image.metadata()

      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        await image.jpeg({ quality, progressive: true }).toFile(optimizedPath)
      } else if (metadata.format === 'png') {
        await image.png({ quality, progressive: true }).toFile(optimizedPath)
      } else if (metadata.format === 'webp') {
        await image.webp({ quality }).toFile(optimizedPath)
      } else {
        // Convert other formats to WebP
        await image.webp({ quality }).toFile(optimizedPath.replace(ext, '.webp'))
        return optimizedPath.replace(ext, '.webp')
      }

      return optimizedPath
    } catch (error) {
      console.error('Error optimizing image:', error)
      return filePath
    }
  }

  /**
   * Extract color palette from image
   */
  static async extractColorPalette(filePath: string): Promise<string[]> {
    if (!this.isImageFile(filePath)) {
      return []
    }

    try {
      const image = sharp(filePath)
      const { data, info } = await image
        .resize(150, 150, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true })

      // Simple color extraction (this could be enhanced with a proper algorithm)
      const colors: Record<string, number> = {}
      const step = 4 // RGBA channels

      for (let i = 0; i < data.length; i += step * 10) { // Sample every 10th pixel
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
        colors[hex] = (colors[hex] || 0) + 1
      }

      // Return top 5 colors
      return Object.entries(colors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([color]) => color)
    } catch (error) {
      console.error('Error extracting color palette:', error)
      return []
    }
  }

  /**
   * Validate file type and size
   */
  static validateFile(mimeType: string, size: number, filename: string): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/mov', 'video/avi', 'video/webm',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ]

    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, error: 'File type not supported' }
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' }
    }

    // Check filename for security
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
    if (dangerousChars.test(filename)) {
      return { valid: false, error: 'Filename contains invalid characters' }
    }

    return { valid: true }
  }

  /**
   * Delete asset and all associated files
   */
  static async deleteAsset(assetId: string): Promise<void> {
    try {
      const asset = await prisma.projectAsset.findUnique({
        where: { id: assetId }
      })

      if (!asset) {
        throw new Error('Asset not found')
      }

      // Delete main file
      if (asset.dataUrl) {
        const mainFilePath = path.join(process.cwd(), asset.dataUrl)
        if (fs.existsSync(mainFilePath)) {
          fs.unlinkSync(mainFilePath)
        }
      }

      // Delete thumbnails
      const thumbnailDir = path.join(process.cwd(), 'uploads', 'thumbnails', assetId)
      if (fs.existsSync(thumbnailDir)) {
        fs.rmSync(thumbnailDir, { recursive: true, force: true })
      }

      // Delete from database
      await prisma.projectAsset.delete({
        where: { id: assetId }
      })
    } catch (error) {
      console.error('Error deleting asset:', error)
      throw error
    }
  }

  /**
   * Get asset usage statistics
   */
  static async getAssetStats() {
    try {
      const totalAssets = await prisma.projectAsset.count()
      const totalSize = await prisma.projectAsset.aggregate({
        _sum: { size: true }
      })

      const assetsByType = await prisma.projectAsset.groupBy({
        by: ['type'],
        _count: { type: true }
      })

      const recentAssets = await prisma.projectAsset.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })

      return {
        totalAssets,
        totalSize: totalSize._sum.size || 0,
        assetsByType: assetsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type
          return acc
        }, {} as Record<string, number>),
        recentAssets
      }
    } catch (error) {
      console.error('Error getting asset stats:', error)
      throw error
    }
  }

  // Private helper methods

  private static async generateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)

      stream.on('error', reject)
      stream.on('data', chunk => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
    })
  }

  private static isImageFile(filePath: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff']
    const ext = path.extname(filePath).toLowerCase()
    return imageExtensions.includes(ext)
  }

  private static getAssetType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'document'
  }
}