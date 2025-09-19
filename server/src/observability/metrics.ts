import type Bull from 'bull'

type QueueCounts = {
  waiting: number
  active: number
  delayed: number
  failed: number
  completed: number
  paused?: number
  waitingChildren?: number
}

type DurationKey = `${string}::${string}::${string}`

type DurationRecord = {
  sum: number
  count: number
  buckets: Map<number, number>
}

const QUEUE_STATES = ['waiting', 'delayed', 'active', 'failed', 'completed', 'paused'] as const
const DURATION_BUCKETS = [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300]

type BullQueue = Bull.Queue

const queueDepthState = new Map<string, Map<string, number>>()
const workerState = new Map<string, number>()
const durationState = new Map<DurationKey, DurationRecord>()
const failureState = new Map<string, number>()
const retryState = new Map<string, number>()

const escapeLabelValue = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\"')

const formatLabels = (labels: Record<string, string>): string => {
  const entries = Object.entries(labels).map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)
  return entries.length > 0 ? `{${entries.join(',')}}` : ''
}

const setGauge = (map: Map<string, Map<string, number>>, key: string, subKey: string, value: number) => {
  if (!map.has(key)) {
    map.set(key, new Map())
  }
  map.get(key)!.set(subKey, value)
}

export const setWorkerReady = (queueName: string, ready: boolean): void => {
  workerState.set(queueName, ready ? 1 : 0)
}

export const updateQueueDepth = (queueName: string, counts: QueueCounts): void => {
  setGauge(queueDepthState, queueName, 'waiting', counts.waiting + (counts.waitingChildren ?? 0))
  setGauge(queueDepthState, queueName, 'delayed', counts.delayed)
  setGauge(queueDepthState, queueName, 'active', counts.active)
  setGauge(queueDepthState, queueName, 'failed', counts.failed)
  setGauge(queueDepthState, queueName, 'completed', counts.completed)
  setGauge(queueDepthState, queueName, 'paused', counts.paused ?? 0)
}

export const observeJobDuration = (queueName: string, jobName: string, status: 'completed' | 'failed', durationSeconds: number): void => {
  const key: DurationKey = `${queueName}::${jobName}::${status}`
  if (!durationState.has(key)) {
    durationState.set(key, { sum: 0, count: 0, buckets: new Map() })
  }
  const record = durationState.get(key)!
  record.sum += durationSeconds
  record.count += 1
  for (const bucket of DURATION_BUCKETS) {
    if (durationSeconds <= bucket) {
      record.buckets.set(bucket, (record.buckets.get(bucket) ?? 0) + 1)
    }
  }
  record.buckets.set(Infinity, (record.buckets.get(Infinity) ?? 0) + 1)
}

export const incrementJobFailure = (queueName: string, jobName: string): void => {
  const key = `${queueName}::${jobName}`
  failureState.set(key, (failureState.get(key) ?? 0) + 1)
}

export const incrementJobRetry = (queueName: string, jobName: string): void => {
  const key = `${queueName}::${jobName}`
  retryState.set(key, (retryState.get(key) ?? 0) + 1)
}

export const collectQueueMetrics = async (queue: BullQueue): Promise<void> => {
  try {
    const counts = await queue.getJobCounts()
    updateQueueDepth(queue.name, counts)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Unable to collect queue metrics', error)
  }
}

export const getMetricsSnapshot = async (): Promise<string> => {
  const lines: string[] = []

  lines.push('# HELP analysis_queue_depth Number of jobs in the AI analysis queue by state')
  lines.push('# TYPE analysis_queue_depth gauge')
  for (const [queueName, states] of queueDepthState.entries()) {
    for (const state of QUEUE_STATES) {
      const value = states.get(state) ?? 0
      lines.push(`analysis_queue_depth${formatLabels({ queue: queueName, state })} ${value}`)
    }
  }

  lines.push('# HELP analysis_worker_ready Indicates if a worker is ready to receive jobs (1 ready, 0 not ready)')
  lines.push('# TYPE analysis_worker_ready gauge')
  for (const [queueName, value] of workerState.entries()) {
    lines.push(`analysis_worker_ready${formatLabels({ queue: queueName })} ${value}`)
  }

  lines.push('# HELP analysis_job_failures_total Total number of job failures by queue and job name')
  lines.push('# TYPE analysis_job_failures_total counter')
  for (const [key, value] of failureState.entries()) {
    const [queueName, jobName] = key.split('::')
    lines.push(`analysis_job_failures_total${formatLabels({ queue: queueName, job_name: jobName })} ${value}`)
  }

  lines.push('# HELP analysis_job_retries_total Total number of job retries scheduled by queue and job name')
  lines.push('# TYPE analysis_job_retries_total counter')
  for (const [key, value] of retryState.entries()) {
    const [queueName, jobName] = key.split('::')
    lines.push(`analysis_job_retries_total${formatLabels({ queue: queueName, job_name: jobName })} ${value}`)
  }

  lines.push('# HELP analysis_job_duration_seconds Job execution duration histogram by queue, job name, and status')
  lines.push('# TYPE analysis_job_duration_seconds histogram')
  for (const [key, record] of durationState.entries()) {
    const [queueName, jobName, status] = key.split('::')
    let cumulative = 0
    for (const bucket of DURATION_BUCKETS) {
      cumulative = record.buckets.get(bucket) ?? cumulative
      const labels = formatLabels({ queue: queueName, job_name: jobName, status, le: bucket.toString() })
      lines.push(`analysis_job_duration_seconds_bucket${labels} ${cumulative}`)
    }
    const total = record.buckets.get(Infinity) ?? record.count
    lines.push(`analysis_job_duration_seconds_bucket${formatLabels({ queue: queueName, job_name: jobName, status, le: '+Inf' })} ${total}`)
    lines.push(`analysis_job_duration_seconds_sum${formatLabels({ queue: queueName, job_name: jobName, status })} ${record.sum}`)
    lines.push(`analysis_job_duration_seconds_count${formatLabels({ queue: queueName, job_name: jobName, status })} ${record.count}`)
  }

  return lines.join('\n') + '\n'
}
