import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import type { Express } from 'express'
import { slugify } from './projectSyncService'
import ProjectSyncService from './projectSyncService'
import type { SyncProjectResult } from '../types/projectSync'

export type IntakeCollaborator = {
  name: string
  role?: string
  company?: string
}

export type IntakeMetric = {
  label: string
  value: string
}

export type IntakeLink = {
  type?: string
  label?: string
  url: string
}

export type IntakeTimeframe = {
  start?: string
  end?: string
  duration?: string
  notes?: string
}

export type IntakeSubmission = {
  title: string
  summary?: string
  problem: string
  challenge?: string
  solution: string
  impact: string
  tags?: string[]
  tools?: string[]
  technologies?: string[]
  role?: string
  status?: string
  collaborators?: IntakeCollaborator[]
  timeframe?: IntakeTimeframe
  metrics?: IntakeMetric[]
  highlights?: string[]
  links?: IntakeLink[]
  autoGenerateNarrative?: boolean
  nda?: boolean
}

type IntakeFilePayload = {
  cover?: Express.Multer.File
  assets?: Express.Multer.File[]
}

export type IntakeCreationResult = {
  folder: string
  slug: string
  metadataPath: string
  narrativePath: string
  coverImage?: string
  metadata: Record<string, unknown>
  sync?: SyncProjectResult
}

type ProjectIntakeServiceOptions = {
  projectRoot: string
  syncService: ProjectSyncService
}

const ASSETS_DIR = '03_Assets'
const EXPORTS_DIR = '06_Exports'
const NARRATIVE_FILE = '01_Narrative.md'
const STRUCTURED_METADATA_FILE = '02_Metadata.json'
const LEGACY_METADATA_FILE = 'metadata.json'

const ensureDirectory = async (directoryPath: string) => {
  await fs.mkdir(directoryPath, { recursive: true })
}

const sanitiseFilename = (filename: string): { base: string; extension: string } => {
  const extension = path.extname(filename).toLowerCase()
  const base = path
    .basename(filename, extension)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset'
  return { base, extension }
}

const createUniqueFilename = async (directory: string, original: string): Promise<string> => {
  const { base, extension } = sanitiseFilename(original)
  let attempt = 0
  while (attempt < 1000) {
    const suffix = attempt === 0 ? '' : `-${attempt}`
    const candidate = `${base}${suffix}${extension}`
    try {
      await fs.access(path.join(directory, candidate))
    } catch {
      return candidate
    }
    attempt += 1
  }
  const fallback = `${base}-${Date.now()}${extension}`
  return fallback
}

const determineYear = (submission: IntakeSubmission): string => {
  const candidates = [
    submission.timeframe?.start,
    submission.timeframe?.end,
    submission.timeframe?.duration,
  ]
  for (const candidate of candidates) {
    if (!candidate) continue
    const match = candidate.match(/(19|20)\d{2}/)
    if (match) {
      return match[0]
    }
  }
  return String(new Date().getFullYear())
}

const inferAssetKind = (file: Express.Multer.File): string => {
  if (!file.mimetype) {
    return 'asset'
  }
  if (file.mimetype.startsWith('image/')) return 'image'
  if (file.mimetype.startsWith('video/')) return 'video'
  if (file.mimetype.startsWith('audio/')) return 'audio'
  if (file.mimetype === 'application/pdf') return 'document'
  if (file.mimetype.startsWith('application/')) return 'document'
  return 'asset'
}

const buildNarrative = (submission: IntakeSubmission, metadata: Record<string, unknown>): string => {
  const lines: string[] = []
  lines.push(`# ${submission.title.trim()}`)
  if (submission.summary?.trim()) {
    lines.push('', submission.summary.trim())
  }
  lines.push('', '## Problem', submission.problem.trim())
  if (submission.challenge?.trim()) {
    lines.push('', '## Challenge', submission.challenge.trim())
  }
  lines.push('', '## Solution', submission.solution.trim())
  lines.push('', '## Impact', submission.impact.trim())

  const snapshot: string[] = []
  if (submission.role) snapshot.push(`- **Role:** ${submission.role}`)
  if (submission.status) snapshot.push(`- **Status:** ${submission.status}`)
  if (submission.timeframe?.duration || submission.timeframe?.start || submission.timeframe?.end) {
    const parts: string[] = []
    if (submission.timeframe?.start) parts.push(`Start: ${submission.timeframe.start}`)
    if (submission.timeframe?.end) parts.push(`End: ${submission.timeframe.end}`)
    if (submission.timeframe?.duration) parts.push(`Duration: ${submission.timeframe.duration}`)
    snapshot.push(`- **Timeframe:** ${parts.join(' · ')}`)
  }
  if (submission.tools?.length) snapshot.push(`- **Tools:** ${submission.tools.join(', ')}`)
  if (submission.collaborators?.length) {
    const collaboratorNames = submission.collaborators.map(entry => entry.role ? `${entry.name} (${entry.role})` : entry.name)
    snapshot.push(`- **Collaborators:** ${collaboratorNames.join(', ')}`)
  }
  if (snapshot.length > 0) {
    lines.push('', '### Project Snapshot', ...snapshot)
  }

  const metrics = submission.metrics?.filter(entry => entry.label && entry.value)
  if (metrics && metrics.length > 0) {
    lines.push('', '### Outcomes & Metrics')
    metrics.forEach(metric => {
      lines.push(`- **${metric.label.trim()}** — ${metric.value.trim()}`)
    })
  }

  if (submission.links?.length) {
    lines.push('', '### Links & References')
    submission.links.forEach(link => {
      if (!link.url) return
      const label = link.label || link.type || 'Link'
      lines.push(`- [${label}](${link.url})`)
    })
  }

  return `${lines.join('\n')}\n`
}

export default class ProjectIntakeService {
  private readonly projectRoot: string
  private readonly syncService: ProjectSyncService

  constructor(options: ProjectIntakeServiceOptions) {
    this.projectRoot = options.projectRoot
    this.syncService = options.syncService
  }

  async createProject(submission: IntakeSubmission, files: IntakeFilePayload): Promise<IntakeCreationResult> {
    const title = submission.title?.trim()
    if (!title) {
      throw new Error('Project title is required')
    }

    if (!submission.problem?.trim() || !submission.solution?.trim() || !submission.impact?.trim()) {
      throw new Error('Problem, solution, and impact fields are required')
    }

    const slug = slugify(title)
    const year = determineYear(submission)
    const baseFolder = `${year}_${slug}`

    let folder = baseFolder
    let attempt = 1
    while (attempt < 50) {
      const candidatePath = path.join(this.projectRoot, folder)
      try {
        await fs.access(candidatePath)
        folder = `${baseFolder}-${attempt}`
        attempt += 1
      } catch {
        break
      }
    }

    const projectPath = path.join(this.projectRoot, folder)
    await ensureDirectory(projectPath)

    const assetsDir = path.join(projectPath, ASSETS_DIR)
    const exportsDir = path.join(projectPath, EXPORTS_DIR)

    await Promise.all([
      ensureDirectory(assetsDir),
      ensureDirectory(exportsDir),
    ])

    const createdAt = new Date().toISOString()
    const assets: Array<{ label: string; relative_path: string; type: string }> = []

    let coverImage: string | undefined
    const coverFile = files.cover
    if (coverFile) {
      const coverPath = path.join(exportsDir, 'cover.jpg')
      const coverBuffer = await sharp(coverFile.buffer)
        .rotate()
        .jpeg({ quality: 88 })
        .toBuffer()
      await fs.writeFile(coverPath, coverBuffer)
      coverImage = path.join(EXPORTS_DIR, 'cover.jpg')
      assets.push({
        label: 'Cover Image',
        relative_path: coverImage,
        type: 'image',
      })
    }

    if (files.assets && files.assets.length > 0) {
      for (const asset of files.assets) {
        const filename = await createUniqueFilename(assetsDir, asset.originalname || asset.fieldname)
        const targetPath = path.join(assetsDir, filename)
        await fs.writeFile(targetPath, asset.buffer)
        assets.push({
          label: asset.originalname || filename,
          relative_path: path.join(ASSETS_DIR, filename),
          type: inferAssetKind(asset),
        })
      }
    }

    const metadata = {
      schema_version: '3.0.0',
      title,
      summary: submission.summary ?? '',
      slug,
      tags: submission.tags ?? [],
      tools: submission.tools ?? submission.technologies ?? [],
      technologies: submission.technologies ?? submission.tools ?? [],
      role: submission.role ?? '',
      status: submission.status ?? 'draft',
      collaborators: submission.collaborators ?? [],
      timeframe: submission.timeframe ?? {},
      metrics: submission.metrics ?? [],
      highlights: submission.highlights ?? [],
      links: submission.links ?? [],
      nda: submission.nda ?? false,
      auto_generate_narrative: submission.autoGenerateNarrative ?? false,
      pcsi: {
        problem: submission.problem.trim(),
        challenge: submission.challenge?.trim() ?? '',
        solution: submission.solution.trim(),
        impact: submission.impact.trim(),
      },
      case: {
        problem: submission.problem.trim(),
        challenge: submission.challenge?.trim() ?? '',
        actions: submission.solution.trim(),
        results: submission.impact.trim(),
      },
      cover_image: coverImage ?? '',
      assets,
      created_at: createdAt,
      updated_at: createdAt,
    }

    const metadataPath = path.join(projectPath, STRUCTURED_METADATA_FILE)
    const legacyMetadataPath = path.join(projectPath, LEGACY_METADATA_FILE)
    await Promise.all([
      fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf-8'),
      fs.writeFile(legacyMetadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf-8'),
    ])

    const narrative = buildNarrative(submission, metadata)
    const narrativePath = path.join(projectPath, NARRATIVE_FILE)
    const legacyBriefPath = path.join(projectPath, 'brief.md')
    await Promise.all([
      fs.writeFile(narrativePath, narrative, 'utf-8'),
      fs.writeFile(legacyBriefPath, narrative, 'utf-8'),
    ])

    let sync: SyncProjectResult | undefined
    try {
      sync = await this.syncService.syncProject(folder)
    } catch (error) {
      console.warn(`Failed to sync new project ${folder}:`, error)
    }

    return {
      folder,
      slug,
      metadataPath,
      narrativePath,
      coverImage,
      metadata,
      sync,
    }
  }
}
