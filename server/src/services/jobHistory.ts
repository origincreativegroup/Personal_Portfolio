import type { Job } from 'bull'
import { logStructured } from '../observability/logger'
import { getPrismaClient } from '../utils/prismaClient'

type QueuedContext = {
  jobId: string
  jobName: string
  queueName: string
  projectId?: string | null
  fileId?: string | null
  data?: unknown
  maxAttempts?: number
}

type ProgressContext = {
  progress?: number
  message?: string
}

type FailureContext = {
  error: unknown
  nextRetryAt?: Date | null
  status: 'failed' | 'retrying'
}

const normalizeError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  try {
    return { message: JSON.stringify(error) }
  } catch {
    return { message: 'Unknown error' }
  }
}

export class JobHistoryService {
  async recordQueued(context: QueuedContext): Promise<void> {
    const prisma = getPrismaClient()
    const execution = await prisma.jobExecution.upsert({
      where: { jobId: context.jobId },
      update: {
        status: 'queued',
        projectId: context.projectId ?? undefined,
        fileId: context.fileId ?? undefined,
        metadata: context.data as any,
        maxAttempts: context.maxAttempts ?? 1,
      },
      create: {
        jobId: context.jobId,
        jobName: context.jobName,
        queueName: context.queueName,
        status: 'queued',
        projectId: context.projectId ?? undefined,
        fileId: context.fileId ?? undefined,
        metadata: context.data as any,
        maxAttempts: context.maxAttempts ?? 1,
      },
    })

    await prisma.jobEvent.create({
      data: {
        jobExecutionId: execution.id,
        status: 'queued',
        attempt: 0,
        message: 'Job enqueued',
        payload: context.data as any,
      },
    })
  }

  async markProcessing(job: Job, projectId?: string | null, fileId?: string | null): Promise<void> {
    const prisma = getPrismaClient()
    const execution = await prisma.jobExecution.update({
      where: { jobId: String(job.id) },
      data: {
        status: 'processing',
        attempts: job.attemptsMade + 1,
        startedAt: new Date(),
        retryAt: null,
        projectId: projectId ?? undefined,
        fileId: fileId ?? undefined,
        maxAttempts: job.opts?.attempts ?? 1,
      },
    })

    await prisma.jobEvent.create({
      data: {
        jobExecutionId: execution.id,
        status: 'processing',
        attempt: job.attemptsMade + 1,
        message: 'Job started processing',
        payload: job.data as any,
      },
    })
  }

  async recordProgress(job: Job, details: ProgressContext): Promise<void> {
    try {
      const prisma = getPrismaClient()
      const execution = await prisma.jobExecution.findUnique({ where: { jobId: String(job.id) } })
      if (!execution) {
        return
      }

      await prisma.jobEvent.create({
        data: {
          jobExecutionId: execution.id,
          status: 'progress',
          attempt: job.attemptsMade + 1,
          message: details.message ?? undefined,
          payload: { progress: details.progress },
        },
      })

      await prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          metadata: {
            ...((execution.metadata as Record<string, unknown> | null) ?? {}),
            lastProgress: details.progress,
          },
        },
      })
    } catch (error) {
      logStructured('error', 'Unable to persist job progress', { jobId: job.id, error: error instanceof Error ? error.message : error })
    }
  }

  async markCompleted(job: Job, durationSeconds: number): Promise<void> {
    const prisma = getPrismaClient()
    const execution = await prisma.jobExecution.update({
      where: { jobId: String(job.id) },
      data: {
        status: 'completed',
        completedAt: new Date(),
        duration: durationSeconds,
        lastError: null,
        errorStack: null,
        retryAt: null,
      },
    })

    await prisma.jobEvent.create({
      data: {
        jobExecutionId: execution.id,
        status: 'completed',
        attempt: job.attemptsMade + 1,
        message: 'Job completed successfully',
      },
    })
  }

  async markFailure(job: Job, context: FailureContext): Promise<void> {
    const normalized = normalizeError(context.error)
    const prisma = getPrismaClient()
    const execution = await prisma.jobExecution.update({
      where: { jobId: String(job.id) },
      data: {
        status: context.status,
        completedAt: new Date(),
        lastError: normalized.message,
        errorStack: normalized.stack,
        retryAt: context.nextRetryAt ?? null,
      },
    })

    await prisma.jobEvent.create({
      data: {
        jobExecutionId: execution.id,
        status: context.status,
        attempt: job.attemptsMade + 1,
        message: normalized.message,
        payload: {
          nextRetryAt: context.nextRetryAt?.toISOString() ?? null,
        },
      },
    })
  }

  async markDeadLetter(job: Job, error: unknown): Promise<void> {
    const normalized = normalizeError(error)
    const prisma = getPrismaClient()
    const execution = await prisma.jobExecution.update({
      where: { jobId: String(job.id) },
      data: {
        status: 'dead-lettered',
        completedAt: new Date(),
        lastError: normalized.message,
        errorStack: normalized.stack,
      },
    })

    await prisma.jobEvent.create({
      data: {
        jobExecutionId: execution.id,
        status: 'dead-lettered',
        attempt: job.attemptsMade + 1,
        message: normalized.message,
      },
    })
  }

  async getProjectHistory(projectId: string, limit = 25): Promise<unknown[]> {
    const prisma = getPrismaClient()
    const executions = await prisma.jobExecution.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 10,
        },
      },
    })

    return executions.map(execution => ({
      jobId: execution.jobId,
      queueName: execution.queueName,
      jobName: execution.jobName,
      status: execution.status,
      attempts: execution.attempts,
      maxAttempts: execution.maxAttempts,
      retryAt: execution.retryAt?.toISOString() ?? null,
      startedAt: execution.startedAt?.toISOString() ?? null,
      completedAt: execution.completedAt?.toISOString() ?? null,
      duration: execution.duration,
      lastError: execution.lastError,
      fileId: execution.fileId,
      events: execution.events.map(event => ({
        status: event.status,
        message: event.message,
        occurredAt: event.occurredAt.toISOString(),
        attempt: event.attempt,
        payload: event.payload,
      })),
    }))
  }

  async getRecentExecutions(limit = 20): Promise<unknown[]> {
    const prisma = getPrismaClient()
    const executions = await prisma.jobExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        events: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
    })

    return executions.map(execution => ({
      jobId: execution.jobId,
      queueName: execution.queueName,
      jobName: execution.jobName,
      status: execution.status,
      attempts: execution.attempts,
      projectId: execution.projectId,
      fileId: execution.fileId,
      lastEvent: execution.events[0]
        ? {
            status: execution.events[0].status,
            occurredAt: execution.events[0].occurredAt.toISOString(),
          }
        : null,
    }))
  }

  async getSummary(queueName: string, sinceMs: number): Promise<{ jobs: number; failures: number; avgDuration: number | null }> {
    const since = new Date(Date.now() - sinceMs)
    const prisma = getPrismaClient()
    const [jobs, failures, duration] = await Promise.all([
      prisma.jobExecution.count({ where: { queueName, createdAt: { gte: since } } }),
      prisma.jobExecution.count({ where: { queueName, status: { in: ['failed', 'dead-lettered'] }, createdAt: { gte: since } } }),
      prisma.jobExecution.aggregate({
        where: { queueName, status: 'completed', completedAt: { gte: since } },
        _avg: { duration: true },
      }),
    ])

    return {
      jobs,
      failures,
      avgDuration: duration._avg.duration ?? null,
    }
  }
}

export const jobHistoryService = new JobHistoryService()
