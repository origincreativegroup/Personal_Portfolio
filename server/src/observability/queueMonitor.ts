import type Bull from 'bull'
import type { Job, ProcessPromiseFunction } from 'bull'
import { alertService } from './alerts'
import { jobEventBus } from './jobEventBus'
import { logQueueEvent, logStructured } from './logger'
import { collectQueueMetrics, incrementJobFailure, incrementJobRetry, observeJobDuration, setWorkerReady } from './metrics'
import { jobHistoryService } from '../services/jobHistory'

const METRICS_POLL_INTERVAL = Number(process.env.ANALYSIS_QUEUE_METRICS_INTERVAL_MS ?? 10000)

const nowSeconds = (): number => Date.now() / 1000

const computeNextRetry = (job: Job): Date | null => {
  const attemptsAllowed = job.opts?.attempts ?? 1
  if (job.attemptsMade >= attemptsAllowed) {
    return null
  }

  const backoff = job.opts?.backoff
  if (!backoff) {
    return null
  }

  if (typeof backoff === 'number') {
    return new Date(Date.now() + backoff)
  }

  if (typeof backoff === 'object' && typeof backoff.delay === 'number') {
    if (backoff.type === 'exponential') {
      const exponent = Math.max(job.attemptsMade - 1, 0)
      const delay = backoff.delay * Math.pow(2, exponent)
      return new Date(Date.now() + delay)
    }
    return new Date(Date.now() + backoff.delay)
  }

  return null
}

const buildHints = (job: Job, status: string): string[] => {
  const hints: string[] = []
  if (status === 'retrying') {
    hints.push('Job scheduled for retry. Monitor the countdown and check recent logs if it fails again.')
  }
  if (status === 'failed' || status === 'dead-lettered') {
    hints.push('Inspect job payload and recent logs. Consider requeueing from the dead-letter queue once the issue is resolved.')
  }
  if (status === 'processing' && job.name === 'analyze-project') {
    hints.push('AI analysis running — monitor OpenAI quota and latency if processing is slow.')
  }
  return hints
}

type BullQueue = Bull.Queue

export class QueueMonitor {
  private readonly startTimes = new Map<string, number>()
  private metricsInterval?: NodeJS.Timeout

  constructor(private readonly queue: BullQueue, private readonly deadLetterQueue: BullQueue) {
    this.attachEventListeners()
    this.scheduleMetricsCollection()
  }

  private attachEventListeners(): void {
    setWorkerReady(this.queue.name, true)

    this.queue.on('waiting', async (jobId: string) => {
      const job = await this.queue.getJob(jobId)
      if (!job) {
        return
      }
      jobEventBus.publish({
        jobId: String(job.id),
        jobName: job.name,
        queueName: this.queue.name,
        projectId: job.data?.projectId,
        fileId: job.data?.fileId,
        status: 'waiting',
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts?.attempts ?? 1,
        timestamp: new Date().toISOString(),
        hints: buildHints(job, 'waiting'),
      })
      await collectQueueMetrics(this.queue)
    })

    this.queue.on('active', async (job: Job) => {
      this.startTimes.set(String(job.id), nowSeconds())
      await jobHistoryService.markProcessing(job, job.data?.projectId, job.data?.fileId)
      logQueueEvent('info', 'Job started', job)
      jobEventBus.publish({
        jobId: String(job.id),
        jobName: job.name,
        queueName: this.queue.name,
        projectId: job.data?.projectId,
        fileId: job.data?.fileId,
        status: 'processing',
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts?.attempts ?? 1,
        timestamp: new Date().toISOString(),
        hints: buildHints(job, 'processing'),
      })
      await collectQueueMetrics(this.queue)
    })

    this.queue.on('progress', async (job: Job, progress: number | object) => {
      const numericProgress = typeof progress === 'number' ? progress : Number((progress as { value?: number }).value ?? 0)
      await jobHistoryService.recordProgress(job, { progress: numericProgress })
      jobEventBus.publish({
        jobId: String(job.id),
        jobName: job.name,
        queueName: this.queue.name,
        projectId: job.data?.projectId,
        fileId: job.data?.fileId,
        status: 'progress',
        progress: numericProgress,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts?.attempts ?? 1,
        timestamp: new Date().toISOString(),
      })
    })

    this.queue.on('completed', async (job: Job) => {
      const started = this.startTimes.get(String(job.id))
      const duration = started ? nowSeconds() - started : 0
      this.startTimes.delete(String(job.id))

      await jobHistoryService.markCompleted(job, duration)
      alertService.recordSuccess(job)
      observeJobDuration(this.queue.name, job.name, 'completed', duration)
      logQueueEvent('info', 'Job completed', job, { duration })
      jobEventBus.publish({
        jobId: String(job.id),
        jobName: job.name,
        queueName: this.queue.name,
        projectId: job.data?.projectId,
        fileId: job.data?.fileId,
        status: 'completed',
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts?.attempts ?? 1,
        timestamp: new Date().toISOString(),
        hints: buildHints(job, 'completed'),
      })
      await collectQueueMetrics(this.queue)
    })

    this.queue.on('failed', async (job: Job, error: Error) => {
      const started = this.startTimes.get(String(job.id))
      const duration = started ? nowSeconds() - started : 0
      this.startTimes.delete(String(job.id))

      observeJobDuration(this.queue.name, job.name, 'failed', duration)
      incrementJobFailure(this.queue.name, job.name)

      const attemptsAllowed = job.opts?.attempts ?? 1
      const attemptsRemaining = Math.max(attemptsAllowed - job.attemptsMade, 0)
      const nextRetryAt = attemptsRemaining > 0 ? computeNextRetry(job) : null
      const status = attemptsRemaining > 0 ? 'retrying' : 'failed'

      await jobHistoryService.markFailure(job, { error, nextRetryAt, status })

      const hints = buildHints(job, status)

      jobEventBus.publish({
        jobId: String(job.id),
        jobName: job.name,
        queueName: this.queue.name,
        projectId: job.data?.projectId,
        fileId: job.data?.fileId,
        status,
        attempt: job.attemptsMade,
        maxAttempts: attemptsAllowed,
        nextRetryAt: nextRetryAt?.toISOString() ?? null,
        timestamp: new Date().toISOString(),
        hints,
        message: error.message,
      })

      logQueueEvent('error', 'Job failed', job, {
        error: error.message,
        attemptsMade: job.attemptsMade,
        attemptsAllowed,
      })

      if (attemptsRemaining > 0 && nextRetryAt) {
        incrementJobRetry(this.queue.name, job.name)
      }

      if (attemptsRemaining <= 0) {
        await jobHistoryService.markDeadLetter(job, error)
        await this.deadLetterQueue.add('dead-letter', {
          originalQueue: this.queue.name,
          jobName: job.name,
          data: job.data,
          failedReason: error.message,
          projectId: job.data?.projectId,
          fileId: job.data?.fileId,
        })
        await alertService.recordFailure(job, error)
        jobEventBus.publish({
          jobId: String(job.id),
          jobName: job.name,
          queueName: this.queue.name,
          projectId: job.data?.projectId,
          fileId: job.data?.fileId,
          status: 'dead-lettered',
          attempt: job.attemptsMade,
          maxAttempts: attemptsAllowed,
          message: error.message,
          timestamp: new Date().toISOString(),
          hints: buildHints(job, 'dead-lettered'),
        })
      }

      await collectQueueMetrics(this.queue)
    })

    this.queue.on('stalled', async (job: Job) => {
      logQueueEvent('warn', 'Job stalled', job)
      jobEventBus.publish({
        jobId: String(job.id),
        jobName: job.name,
        queueName: this.queue.name,
        projectId: job.data?.projectId,
        fileId: job.data?.fileId,
        status: 'retrying',
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts?.attempts ?? 1,
        timestamp: new Date().toISOString(),
        hints: ['Job stalled — check worker resource usage and logs.'],
      })
    })

    this.queue.on('error', error => {
      logStructured('error', 'Queue error', { queue: this.queue.name, error: error.message })
      setWorkerReady(this.queue.name, false)
    })

    this.queue.on('ready', () => {
      logStructured('info', 'Queue connection ready', { queue: this.queue.name })
      setWorkerReady(this.queue.name, true)
    })
  }

  private scheduleMetricsCollection(): void {
    void collectQueueMetrics(this.queue)
    this.metricsInterval = setInterval(() => {
      void collectQueueMetrics(this.queue)
    }, METRICS_POLL_INTERVAL)
    this.metricsInterval.unref()
  }

  process(name: string, handler: ProcessPromiseFunction<unknown>): void
  process(name: string, concurrency: number, handler: ProcessPromiseFunction<unknown>): void
  process(name: string, concurrencyOrHandler: number | ProcessPromiseFunction<unknown>, maybeHandler?: ProcessPromiseFunction<unknown>): void {
    if (typeof concurrencyOrHandler === 'number' && maybeHandler) {
      this.queue.process(name, concurrencyOrHandler, maybeHandler)
      return
    }

    if (typeof concurrencyOrHandler === 'function') {
      this.queue.process(name, concurrencyOrHandler)
    }
  }

  // wrapHandler removed as it was unnecessary
}
