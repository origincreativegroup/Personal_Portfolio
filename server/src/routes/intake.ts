import express from 'express'
import type { Express } from 'express'
import type multer from 'multer'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth'
import ProjectIntakeService, { type IntakeSubmission } from '../services/projectIntakeService'

interface AppLocals {
  projectIntakeService?: ProjectIntakeService
}

const routerFactory = (upload: multer.Multer) => {
  const router = express.Router()
  const intakeUpload = upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'assets', maxCount: 20 },
  ])

  router.post('/projects', requireAuth, intakeUpload, async (req: AuthenticatedRequest, res) => {
    try {
      const { projectIntakeService } = req.app.locals as AppLocals
      if (!projectIntakeService) {
        res.status(500).json({ error: 'Project intake service not initialised' })
        return
      }

      const rawPayload = req.body?.payload
      if (!rawPayload || typeof rawPayload !== 'string') {
        res.status(400).json({ error: 'Missing intake payload' })
        return
      }

      let submission: IntakeSubmission
      try {
        submission = JSON.parse(rawPayload) as IntakeSubmission
      } catch (error) {
        console.error('Failed to parse intake payload', error)
        res.status(400).json({ error: 'Invalid intake payload JSON' })
        return
      }

      const files = req.files
      let cover: Express.Multer.File | undefined
      let assets: Express.Multer.File[] | undefined

      if (Array.isArray(files)) {
        assets = files
      } else if (files && typeof files === 'object') {
        const typed = files as Record<string, Express.Multer.File[]>
        cover = typed.cover?.[0]
        assets = typed.assets ?? []
      } else if (req.file) {
        cover = req.file
      }

      const result = await projectIntakeService.createProject(submission, {
        cover,
        assets,
      })

      res.status(201).json({ project: result })
    } catch (error) {
      console.error('Failed to process intake submission', error)
      if (error instanceof Error) {
        res.status(400).json({ error: error.message })
        return
      }
      res.status(500).json({ error: 'Unknown error processing intake submission' })
    }
  })

  return router
}

export default routerFactory
