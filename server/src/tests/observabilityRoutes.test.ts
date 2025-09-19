import { after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'http'
import app from '../app'
import { jobHistoryService } from '../services/jobHistory'
import { analysisQueue } from '../jobs/analysisQueue'
import { deadLetterQueue } from '../jobs/deadLetterQueue'

type MockJob = {
  id: string
  name: string
  data: Record<string, unknown>
  opts: { attempts?: number }
  retry: () => Promise<void>
}

const originalGetProjectHistory = jobHistoryService.getProjectHistory
const originalRecordQueued = jobHistoryService.recordQueued
const originalGetRecentExecutions = jobHistoryService.getRecentExecutions
const originalGetSummary = jobHistoryService.getSummary

const originalGetJobCounts = analysisQueue.getJobCounts
const originalIsPaused = analysisQueue.isPaused
const originalGetWorkers = analysisQueue.getWorkers
const originalAdd = analysisQueue.add
const originalGetJob = analysisQueue.getJob

const originalDlqGetJob = deadLetterQueue.getJob

const startServer = async (): Promise<Server> => new Promise(resolve => {
  const server = app.listen(0, () => resolve(server))
})

const buildUrl = (server: Server, path: string): string => {
  const address = server.address()
  if (address && typeof address !== 'string') {
    return `http://127.0.0.1:${address.port}${path}`
  }
  return `${address}${path}`
}

beforeEach(() => {
  process.env.DEV_USER_ID = 'test-user'
})

after(async () => {
  jobHistoryService.getProjectHistory = originalGetProjectHistory
  jobHistoryService.recordQueued = originalRecordQueued
  jobHistoryService.getRecentExecutions = originalGetRecentExecutions
  jobHistoryService.getSummary = originalGetSummary

  analysisQueue.getJobCounts = originalGetJobCounts
  analysisQueue.isPaused = originalIsPaused
  analysisQueue.getWorkers = originalGetWorkers
  analysisQueue.add = originalAdd
  analysisQueue.getJob = originalGetJob

  deadLetterQueue.getJob = originalDlqGetJob

  delete process.env.DEV_USER_ID
  await analysisQueue.close().catch(() => {})
  await deadLetterQueue.close().catch(() => {})
})

test('GET /api/analysis/projects/:projectId/jobs/history returns persisted job entries', async () => {
  jobHistoryService.getProjectHistory = async () => [
    {
      jobId: 'job-1',
      queueName: 'analysis processing',
      jobName: 'analyze-file',
      status: 'completed',
      attempts: 1,
      maxAttempts: 5,
      retryAt: null,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: 1.2,
      lastError: null,
      fileId: 'file-1',
      events: [],
    },
  ]

  const server = await startServer()
  const response = await fetch(buildUrl(server, '/api/analysis/projects/proj-1/jobs/history'), {
    headers: { 'Accept': 'application/json' },
  })

  assert.equal(response.status, 200)
  const body = await response.json() as { jobs: Array<{ jobId: string }> }
  assert.ok(Array.isArray(body.jobs))
  assert.equal(body.jobs[0].jobId, 'job-1')
  server.close()
})

test('POST /api/analysis/jobs/:jobId/requeue requeues jobs from the dead-letter queue', async () => {
  analysisQueue.getJob = async () => null

  const removeCalls: string[] = []
  deadLetterQueue.getJob = (async () => ({
    data: {
      jobName: 'analyze-project',
      data: { projectId: 'proj-1' },
      projectId: 'proj-1',
    },
    async remove() {
      removeCalls.push('removed')
    },
  })) as any

  let queuedProject: string | null = null
  jobHistoryService.recordQueued = async ({ projectId }) => {
    queuedProject = projectId ?? null
  }

  analysisQueue.add = (async (jobName: string) => ({
    id: 'job-new',
    name: jobName,
    data: {},
    opts: { attempts: 5 },
    retry: async () => {}
  })) as any

  const server = await startServer()
  const response = await fetch(buildUrl(server, '/api/analysis/jobs/job-dead/requeue'), {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
  })

  assert.equal(response.status, 200)
  const body = await response.json() as { status: string; jobId: string }
  assert.equal(body.status, 'requeued')
  assert.equal(body.jobId, 'job-new')
  assert.deepEqual(removeCalls, ['removed'])
  assert.equal(queuedProject, 'proj-1')
  server.close()
})

test('GET /api/analysis/observability/summary aggregates queue metrics', async () => {
  jobHistoryService.getSummary = async () => ({ jobs: 5, failures: 1, avgDuration: 2 })
  analysisQueue.getJobCounts = (async () => ({
    waiting: 2,
    active: 1,
    delayed: 0,
    failed: 1,
    completed: 10,
    paused: 0,
  })) as any
  analysisQueue.isPaused = async () => false
  analysisQueue.getWorkers = async () => [{ id: 'worker-1' } as unknown as any]

  const server = await startServer()
  const response = await fetch(buildUrl(server, '/api/analysis/observability/summary'), {
    headers: { 'Accept': 'application/json' },
  })

  assert.equal(response.status, 200)
  const body = await response.json() as any
  assert.equal(body.workerHealth.workerCount, 1)
  assert.equal(body.queue.waiting, 2)
  server.close()
})

test('GET /api/analysis/observability/recent-jobs returns recent executions', async () => {
  jobHistoryService.getRecentExecutions = async () => ([
    {
      jobId: 'job-1',
      queueName: 'analysis processing',
      jobName: 'analyze-project',
      status: 'completed',
      attempts: 1,
      projectId: 'proj-1',
      fileId: null,
      lastEvent: null,
    },
  ])

  const server = await startServer()
  const response = await fetch(buildUrl(server, '/api/analysis/observability/recent-jobs'), {
    headers: { 'Accept': 'application/json' },
  })

  assert.equal(response.status, 200)
  const body = await response.json() as { jobs: Array<{ jobId: string }> }
  assert.equal(body.jobs[0].jobId, 'job-1')
  server.close()
})
