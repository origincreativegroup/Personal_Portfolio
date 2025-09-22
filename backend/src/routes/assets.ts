import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { AssetService } from '../services/assetService.js'
import { ValidationError, formatValidationError, formatError, commonSchemas } from '../utils/validation.js'

const prisma = new PrismaClient()

// File type validation
const isValidFileType = (mimetype: string, filename: string): boolean => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mp3|wav|pdf|doc|docx|txt/
  const extname = allowedTypes.test(path.extname(filename).toLowerCase())
  const mimetypeMatch = allowedTypes.test(mimetype)
  return mimetypeMatch && extname
}

// Create upload directory if it doesn't exist
const ensureUploadDir = (): string => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'assets')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  return uploadDir
}

// Fastify plugin for assets routes
async function assetsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/assets - Get all assets
  fastify.get('/', async (request, reply) => {
    try {
      const { page = 1, limit = 20, type, search, projectId } = request.query as any

      const where: any = {}

      if (type) {
        where.type = type
      }

      if (search) {
        where.OR = [
          { label: { contains: search as string, mode: 'insensitive' } },
          { relativePath: { contains: search as string, mode: 'insensitive' } }
        ]
      }

      if (projectId) {
        where.projectId = projectId
      }

      const assets = await prisma.projectAsset.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      })

      const total = await prisma.projectAsset.count({ where })

      return {
        assets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to fetch assets' })
    }
  })

  // GET /api/assets/:id - Get single asset
  fastify.get('/:id', async (request, reply) => {
    try {
      // Validate ID parameter
      const { id } = commonSchemas.id.parse((request.params as any).id) ?
        request.params as { id: string } :
        { id: '' }

      if (!id) {
        return reply.status(400).send(formatValidationError(new ValidationError('Invalid asset ID', 'id')))
      }

      const asset = await prisma.projectAsset.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          }
        }
      })

      if (!asset) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Asset not found',
          code: 'ASSET_NOT_FOUND'
        })
      }

      return asset
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.status(400).send(formatValidationError(error))
      }

      fastify.log.error(error)
      return reply.status(500).send(formatError(error as Error))
    }
  })

  // POST /api/assets - Upload new asset
  fastify.post('/', async (request, reply) => {
    try {
      const data = await request.file()

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' })
      }

      const buffer = await data.toBuffer()

      // Validate file
      const validation = AssetService.validateFile(data.mimetype, buffer.length, data.filename)
      if (!validation.valid) {
        return reply.status(400).send({ error: validation.error })
      }

      const uploadDir = ensureUploadDir()
      const uniqueName = `${uuidv4()}${path.extname(data.filename)}`
      const filePath = path.join(uploadDir, uniqueName)

      // Save file to disk
      fs.writeFileSync(filePath, buffer)

      // Process asset and extract metadata
      const metadata = await AssetService.processAsset(filePath, data.filename, data.mimetype)

      // Get additional fields from the request body
      const fields = data.fields as any
      const projectId = fields?.projectId?.value
      const description = fields?.description?.value
      const tags = fields?.tags?.value
      const folder = fields?.folder?.value

      // Determine asset type from file
      const getAssetType = (mimetype: string) => {
        if (mimetype.startsWith('image/')) return 'image'
        if (mimetype.startsWith('video/')) return 'video'
        if (mimetype.startsWith('audio/')) return 'audio'
        return 'document'
      }

      // Create asset record
      const asset = await prisma.projectAsset.create({
        data: {
          projectId: projectId || null,
          name: data.filename,
          relativePath: `/uploads/assets/${uniqueName}`,
          label: data.filename,
          type: getAssetType(data.mimetype),
          size: buffer.length,
          mimeType: data.mimetype,
          dataUrl: `/uploads/assets/${uniqueName}`,
          addedAt: new Date().toISOString(),
          description: description || null,
          tags: tags || null,
          folder: folder || null,
          featured: false,
          visibility: 'public',
          isHero: false,
          width: metadata.width,
          height: metadata.height,
          checksum: metadata.checksum,
          lastModifiedAt: new Date()
        }
      })

      // Generate thumbnails for images
      if (data.mimetype.startsWith('image/')) {
        try {
          const thumbnails = await AssetService.generateThumbnails(filePath, asset.id)

          // Update asset with thumbnail URL (using medium size as default)
          if (thumbnails.medium) {
            await prisma.projectAsset.update({
              where: { id: asset.id },
              data: { thumbnailUrl: thumbnails.medium }
            })
            ;(asset as any).thumbnailUrl = thumbnails.medium
          }
        } catch (error) {
          fastify.log.error(error, 'Error generating thumbnails:')
          // Continue without thumbnails
        }
      }

      return reply.status(201).send(asset)
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to upload asset' })
    }
  })

  // PUT /api/assets/:id - Update asset
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const { label, description } = request.body as any

      const updateData: any = {}

      if (label !== undefined) updateData.label = label
      if (description !== undefined) updateData.description = description

      const asset = await prisma.projectAsset.update({
        where: { id },
        data: updateData
      })

      return asset
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to update asset' })
    }
  })

  // DELETE /api/assets/:id - Delete asset
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      await AssetService.deleteAsset(id)

      return { message: 'Asset deleted successfully' }
    } catch (error) {
      if (error instanceof Error && error.message === 'Asset not found') {
        return reply.status(404).send({ error: 'Asset not found' })
      }

      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to delete asset' })
    }
  })

  // GET /api/assets/stats - Get asset statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = await AssetService.getAssetStats()
      return stats
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to get asset statistics' })
    }
  })
}

export default assetsRoutes
