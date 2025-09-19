import { useCallback, useEffect, useMemo, useState } from 'react'
import './AdminObservabilityDashboard.css'

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, '')

const resolveApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_BASE_URL
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return stripTrailingSlashes(configured.trim())
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '5173') {
      return 'http://localhost:3001'
    }
    return stripTrailingSlashes(window.location.origin)
  }
  return 'http://localhost:3001'
}

const API_BASE_URL = resolveApiBaseUrl()
const DEFAULT_USER_ID = import.meta.env.VITE_ANALYSIS_USER_ID ?? 'demo-user'

type ObservabilitySummary = {
  queue: Record<string, number>
  throughput: {
    hourly: { jobs: number; failures: number; avgDuration: number | null }
    daily: { jobs: number; failures: number; avgDuration: number | null }
  }
  failureRate: {
    hourly: number
    daily: number
  }
  workerHealth: {
    isReady: boolean
    isPaused: boolean
    workerCount: number
  }
}

type RecentJob = {
  jobId: string
  jobName: string
  status: string
  attempts: number
  projectId?: string | null
  fileId?: string | null
  lastEvent?: {
    status: string
    occurredAt: string
  } | null
}

type JobUpdateEventPayload = {
  jobId: string
  jobName: string
  queueName: string
  status: string
  projectId?: string | null
  fileId?: string | null
  progress?: number
  attempt?: number
  maxAttempts?: number
  nextRetryAt?: string | null
  message?: string
  hints?: string[]
  timestamp: string
}

const createBaseHeaders = (): HeadersInit => {
  const headers: HeadersInit = {}
  if (DEFAULT_USER_ID) {
    headers['x-user-id'] = DEFAULT_USER_ID
  }
  return headers
}

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`

const formatTimestamp = (value: string | undefined): string => {
  if (!value) {
    return '—'
  }
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return formatter.format(new Date(value))
  } catch {
    return value
  }
}

export default function AdminObservabilityDashboard() {
  const [summary, setSummary] = useState<ObservabilitySummary | null>(null)
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [events, setEvents] = useState<JobUpdateEventPayload[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const baseHeaders = useMemo(createBaseHeaders, [])

  const loadSummary = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/observability/summary`, {
      headers: baseHeaders,
    })
    if (!response.ok) {
      throw new Error(`Unable to load observability summary (${response.status})`)
    }
    const payload = await response.json() as ObservabilitySummary
    setSummary(payload)
  }, [baseHeaders])

  const loadRecentJobs = useCallback(async () => {
    const response = await fetch(`${API_BASE_URL}/api/analysis/observability/recent-jobs`, {
      headers: baseHeaders,
    })
    if (!response.ok) {
      throw new Error(`Unable to load recent jobs (${response.status})`)
    }
    const payload = await response.json() as { jobs: RecentJob[] }
    setRecentJobs(payload.jobs)
  }, [baseHeaders])

  useEffect(() => {
    const initialise = async () => {
      try {
        setIsLoading(true)
        await Promise.all([loadSummary(), loadRecentJobs()])
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load observability data.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }
    void initialise()
  }, [loadRecentJobs, loadSummary])

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/api/analysis/observability/stream`)
    source.onmessage = event => {
      if (!event.data) {
        return
      }
      try {
        const payload = JSON.parse(event.data) as JobUpdateEventPayload
        setEvents(previous => {
          const next = [payload, ...previous]
          return next.slice(0, 15)
        })
      } catch (err) {
        console.error('Unable to parse observability event', err)
      }
    }
    return () => {
      source.close()
    }
  }, [])

  const handleRefresh = () => {
    void (async () => {
      try {
        setIsLoading(true)
        await Promise.all([loadSummary(), loadRecentJobs()])
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to refresh observability data.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    })()
  }

  return (
    <div className="observability-page">
      <header className="observability-header">
        <div>
          <h1>Observability dashboard</h1>
          <p>Monitor queue health, worker readiness, and recent analysis activity.</p>
        </div>
        <div className="observability-header__actions">
          <button type="button" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {error ? <div className="observability-error">{error}</div> : null}

      {summary ? (
        <section className="observability-grid">
          <article className="observability-card">
            <h2>Worker health</h2>
            <ul>
              <li><strong>Status:</strong> {summary.workerHealth.isReady ? 'Ready' : 'Unavailable'}</li>
              <li><strong>Paused:</strong> {summary.workerHealth.isPaused ? 'Yes' : 'No'}</li>
              <li><strong>Active workers:</strong> {summary.workerHealth.workerCount}</li>
            </ul>
          </article>
          <article className="observability-card">
            <h2>Throughput</h2>
            <ul>
              <li><strong>Last hour:</strong> {summary.throughput.hourly.jobs} jobs ({summary.throughput.hourly.failures} failures)</li>
              <li><strong>Avg duration (hour):</strong> {summary.throughput.hourly.avgDuration ? `${summary.throughput.hourly.avgDuration.toFixed(2)}s` : '—'}</li>
              <li><strong>Last day:</strong> {summary.throughput.daily.jobs} jobs</li>
            </ul>
          </article>
          <article className="observability-card">
            <h2>Failure rate</h2>
            <ul>
              <li><strong>Last hour:</strong> {formatPercent(summary.failureRate.hourly)}</li>
              <li><strong>Last day:</strong> {formatPercent(summary.failureRate.daily)}</li>
            </ul>
          </article>
          <article className="observability-card">
            <h2>Queue depth</h2>
            <ul>
              {Object.entries(summary.queue).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      <section className="observability-section">
        <div className="observability-section__header">
          <h2>Recent jobs</h2>
        </div>
        <div className="observability-table-wrapper">
          <table className="observability-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Project</th>
                <th>File</th>
                <th>Last event</th>
              </tr>
            </thead>
            <tbody>
              {recentJobs.length > 0 ? recentJobs.map(job => (
                <tr key={job.jobId}>
                  <td>{job.jobName}</td>
                  <td>{job.status}</td>
                  <td>{job.attempts}</td>
                  <td>{job.projectId ?? '—'}</td>
                  <td>{job.fileId ?? '—'}</td>
                  <td>{job.lastEvent ? `${job.lastEvent.status} @ ${formatTimestamp(job.lastEvent.occurredAt)}` : '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="observability-empty">No jobs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="observability-section">
        <div className="observability-section__header">
          <h2>Live job events</h2>
        </div>
        <div className="observability-events">
          {events.length > 0 ? events.map(event => (
            <article key={`${event.jobId}-${event.timestamp}`} className="observability-event">
              <header>
                <strong>{event.jobName}</strong>
                <span>{formatTimestamp(event.timestamp)}</span>
              </header>
              <p className={`observability-event__status observability-event__status--${event.status.replace(/[^a-z-]/gi, '').toLowerCase()}`}>
                {event.status}
              </p>
              <dl>
                {event.projectId ? <div><dt>Project</dt><dd>{event.projectId}</dd></div> : null}
                {event.fileId ? <div><dt>File</dt><dd>{event.fileId}</dd></div> : null}
                {typeof event.progress === 'number' ? <div><dt>Progress</dt><dd>{Math.round(event.progress)}%</dd></div> : null}
                {event.nextRetryAt ? <div><dt>Next retry</dt><dd>{formatTimestamp(event.nextRetryAt)}</dd></div> : null}
                {event.message ? <div><dt>Message</dt><dd>{event.message}</dd></div> : null}
              </dl>
            </article>
          )) : (
            <p className="observability-empty">Waiting for live events…</p>
          )}
        </div>
      </section>
    </div>
  )
}
