import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, it } from 'node:test'
import type { Express } from 'express'
import ProjectIntakeService, { type IntakeSubmission } from '../server/src/services/projectIntakeService'
import type ProjectSyncService from '../server/src/services/projectSyncService'
import type { SyncProjectResult } from '../server/src/types/projectSync'

const pngPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X9WMAAAAASUVORK5CYII=',
  'base64',
)

const createUpload = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'upload.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: pngPixel.length,
  destination: '',
  filename: 'upload.png',
  path: '',
  buffer: pngPixel,
  stream: null as unknown as NodeJS.ReadableStream,
  ...overrides,
})

describe('ProjectIntakeService', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()!
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
    }
  })

  it('creates structured folders, metadata, and narrative files', async () => {
    const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'intake-service-'))
    tempDirs.push(projectRoot)

    const fakeSyncResult = { folder: 'fake', created: false, warnings: [], conflicts: [], metadataPath: '', briefPath: null } as unknown as SyncProjectResult
    const fakeSyncService = {
      syncProject: async () => fakeSyncResult,
    } as unknown as ProjectSyncService

    const service = new ProjectIntakeService({ projectRoot, syncService: fakeSyncService })

    const submission: IntakeSubmission = {
      title: 'Launch Campaign',
      summary: 'Relaunched the mobile experience with measurable impact.',
      problem: 'Retention dropped after a redesign.',
      challenge: 'Aggressive timeline and limited engineering support.',
      solution: 'Introduced a progressive rollout with cross-functional task force.',
      impact: 'Lifted retention by 18% and boosted NPS by 22 points.',
      tags: ['mobile', 'growth'],
      tools: ['Figma', 'Amplitude'],
      role: 'designer',
      status: 'draft',
      collaborators: [{ name: 'Sam Lopez', role: 'PM' }],
      timeframe: { start: 'Jan 2024', end: 'Mar 2024', duration: '12 weeks' },
      metrics: [{ label: 'Retention', value: '+18%' }],
      highlights: ['Retention: +18%', 'NPS: +22'],
      links: [{ type: 'other', url: 'https://example.com' }],
      autoGenerateNarrative: true,
    }

    const result = await service.createProject(submission, {
      cover: createUpload({ fieldname: 'cover', originalname: 'hero.png' }),
      assets: [
        createUpload({ originalname: 'dashboard.png' }),
        createUpload({ originalname: 'research.pdf', mimetype: 'application/pdf' }),
      ],
    })

    const projectPath = path.join(projectRoot, result.folder)
    const narrative = await fs.readFile(path.join(projectPath, '01_Narrative.md'), 'utf8')
    const metadata = JSON.parse(await fs.readFile(result.metadataPath, 'utf8')) as Record<string, unknown>

    assert.ok(narrative.includes('## Challenge'), 'narrative includes challenge section')
    assert.ok(narrative.includes('## Impact'), 'narrative includes impact section')
    assert.equal(metadata.pcsi && (metadata.pcsi as Record<string, unknown>).challenge, submission.challenge)
    assert.equal(metadata.cover_image, '06_Exports/cover.jpg')
    assert.equal(Array.isArray(metadata.assets) && (metadata.assets as unknown[]).length, 3)

    const exportsCover = await fs.stat(path.join(projectPath, '06_Exports/cover.jpg'))
    assert.ok(exportsCover.isFile(), 'cover image exists in exports folder')

    assert.equal(result.coverImage, '06_Exports/cover.jpg')
    assert.equal(result.sync, fakeSyncResult)
  })
})
