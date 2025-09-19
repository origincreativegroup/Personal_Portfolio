import type { Job } from 'bull'
import { logStructured } from './logger'

const ALERT_THRESHOLD = Number(process.env.ANALYSIS_ALERT_FAILURE_THRESHOLD ?? 3)
const ALERT_WEBHOOK = process.env.ANALYSIS_ALERT_WEBHOOK_URL
const ALERT_COOLDOWN_MS = Number(process.env.ANALYSIS_ALERT_COOLDOWN_MS ?? 15 * 60 * 1000)

type FailureRecord = {
  count: number
  lastNotified?: number
}

const keyForJob = (job: Job): string => {
  const projectId = typeof job.data?.projectId === 'string' ? job.data.projectId : 'unknown-project'
  return `${job.name}:${projectId}`
}

export class AlertService {
  private readonly failureStreaks = new Map<string, FailureRecord>()

  recordSuccess(job: Job): void {
    const key = keyForJob(job)
    this.failureStreaks.delete(key)
  }

  async recordFailure(job: Job, error: unknown): Promise<void> {
    const key = keyForJob(job)
    const existing = this.failureStreaks.get(key) ?? { count: 0 }
    existing.count += 1
    this.failureStreaks.set(key, existing)

    if (!ALERT_WEBHOOK || existing.count < ALERT_THRESHOLD) {
      return
    }

    const now = Date.now()
    if (existing.lastNotified && now - existing.lastNotified < ALERT_COOLDOWN_MS) {
      return
    }

    existing.lastNotified = now
    this.failureStreaks.set(key, existing)

    const payload = {
      text: `AI analysis job ${job.name} failed ${existing.count} times for project ${job.data?.projectId ?? 'unknown'}.`,
      job: {
        id: job.id,
        name: job.name,
        attemptsMade: job.attemptsMade,
        queue: job.queue?.name ?? 'analysis',
      },
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      timestamp: new Date().toISOString(),
    }

    try {
      await fetch(ALERT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      logStructured('warn', 'Sent alert webhook for repeated job failure', { jobId: job.id, jobName: job.name })
    } catch (sendError) {
      logStructured('error', 'Failed to send alert webhook', {
        jobId: job.id,
        jobName: job.name,
        error: sendError instanceof Error ? sendError.message : sendError,
      })
    }
  }
}

export const alertService = new AlertService()
