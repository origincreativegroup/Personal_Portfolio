import { EventEmitter } from 'events'

type JobStatus =
  | 'queued'
  | 'waiting'
  | 'processing'
  | 'progress'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'dead-lettered'

export type JobUpdateEvent = {
  projectId?: string | null
  fileId?: string | null
  jobId: string
  jobName: string
  queueName: string
  status: JobStatus
  progress?: number
  attempt?: number
  maxAttempts?: number
  nextRetryAt?: string | null
  message?: string
  hints?: string[]
  timestamp: string
}

const UPDATE_EVENT = 'job-update'

type Listener = (event: JobUpdateEvent) => void

class JobEventBus extends EventEmitter {
  publish(event: JobUpdateEvent): void {
    this.emit(UPDATE_EVENT, event)
  }

  subscribe(listener: Listener): () => void {
    this.on(UPDATE_EVENT, listener)
    return () => this.off(UPDATE_EVENT, listener)
  }
}

export const jobEventBus = new JobEventBus()
