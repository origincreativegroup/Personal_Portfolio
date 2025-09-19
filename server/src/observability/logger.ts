import type { Job } from 'bull'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

const formatPayload = (level: LogLevel, message: string, context?: LogContext) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...context,
})

export const logStructured = (level: LogLevel, message: string, context?: LogContext): void => {
  const payload = formatPayload(level, message, context)
  const serialized = JSON.stringify(payload)
  if (level === 'error') {
    console.error(serialized)
    return
  }
  if (level === 'warn') {
    console.warn(serialized)
    return
  }
  console.log(serialized)
}

export const logQueueEvent = (level: LogLevel, message: string, job: Job, extra?: LogContext): void => {
  const context: LogContext = {
    queue: job.queue?.name ?? 'unknown',
    jobId: job.id,
    jobName: job.name,
    attemptsMade: job.attemptsMade,
    dataKeys: job.data ? Object.keys(job.data) : [],
    ...extra,
  }
  logStructured(level, message, context)
}
