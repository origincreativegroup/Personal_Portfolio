import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRightCircle,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Layers,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Input, LoadingSpinner } from '../components/ui'
import { useApp } from '../contexts/AppContext'
import {
  deleteProject,
  getStorageUsage,
  listProjects,
  saveProject,
} from '../utils/storageManager'
import type { ProjectMeta } from '../intake/schema'
import ThemeToggle from '../components/ThemeToggle'

export type ApiAssetPreview = {
  id: string
  label: string | null
  relativePath: string
  type: string | null
  updatedAt: string
}

export type ApiDeliverablePreview = {
  id: string
  label: string | null
  relativePath: string
  format: string | null
  updatedAt: string
}

export type ApiProject = {
  id: string
  slug: string
  title: string
  summary?: string | null
  organization?: string | null
  workType?: string | null
  year?: number | null
  tags: string[]
  highlights: string[]
  syncStatus: string
  lastSyncedAt?: string | null
  fsLastModified?: string | null
  metadataUpdatedAt?: string | null
  briefUpdatedAt?: string | null
  assetCount: number
  deliverableCount: number
  assetPreviews: ApiAssetPreview[]
  deliverablePreviews: ApiDeliverablePreview[]
}

const parseDate = (value?: string | null): number | undefined => {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

const formatDateTimeDisplay = (value?: string | null, fallback = 'Unknown') => {
  const timestamp = parseDate(value)
  if (timestamp === undefined) return fallback
  return new Date(timestamp).toLocaleString()
}

export type FreshnessState =
  | 'in-sync'
  | 'filesystem-updated'
  | 'metadata-updated'
  | 'brief-updated'
  | 'sync-needed'
  | 'never-synced'

type FreshnessUpdate = 'filesystem-updated' | 'metadata-updated' | 'brief-updated'

const FRESHNESS_COPY: Record<FreshnessState, { label: string; description: string; tone: 'neutral' | 'warning' | 'danger' | 'success' }> = {
  'in-sync': {
    label: 'Up to date',
    description: 'Project is synchronised with stored metadata.',
    tone: 'success',
  },
  'filesystem-updated': {
    label: 'Filesystem newer',
    description: 'Files changed on disk since the last sync',
    tone: 'warning',
  },
  'metadata-updated': {
    label: 'Metadata newer',
    description: 'Metadata has been edited locally',
    tone: 'warning',
  },
  'brief-updated': {
    label: 'Brief newer',
    description: 'Project brief changed since last sync',
    tone: 'warning',
  },
  'sync-needed': {
    label: 'Needs sync',
    description: 'Project reports pending changes',
    tone: 'danger',
  },
  'never-synced': {
    label: 'Never synced',
    description: 'Project has not been synchronised yet',
    tone: 'neutral',
  },
}

const FRESHNESS_TONE_CLASSES: Record<FreshnessState, string> = {
  'in-sync': 'bg-emerald-100/80 text-emerald-700',
  'filesystem-updated': 'bg-amber-100/80 text-amber-700',
  'metadata-updated': 'bg-amber-100/80 text-amber-700',
  'brief-updated': 'bg-amber-100/80 text-amber-700',
  'sync-needed': 'bg-rose-100/80 text-rose-700',
  'never-synced': 'bg-gray-100/80 text-gray-700',
}

const getLatestUpdate = (project: ApiProject): { type: FreshnessUpdate; timestamp: number } | undefined => {
  const updates: Array<{ type: FreshnessUpdate; timestamp?: number }> = [
    { type: 'filesystem-updated', timestamp: parseDate(project.fsLastModified) },
    { type: 'metadata-updated', timestamp: parseDate(project.metadataUpdatedAt) },
    { type: 'brief-updated', timestamp: parseDate(project.briefUpdatedAt) },
  ]

  return updates
    .filter((update): update is { type: FreshnessUpdate; timestamp: number } => update.timestamp !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp)[0]
}

export const computeFreshness = (project: ApiProject): FreshnessState => {
  const lastSynced = parseDate(project.lastSyncedAt)
  const latestUpdate = getLatestUpdate(project)

  if (project.syncStatus && project.syncStatus !== 'synced' && project.syncStatus !== 'clean') {
    return 'sync-needed'
  }

  if (!latestUpdate) {
    return lastSynced === undefined ? 'never-synced' : 'in-sync'
  }

  if (lastSynced === undefined) {
    return latestUpdate.type
  }

  if (latestUpdate.timestamp > lastSynced) {
    return latestUpdate.type
  }

  return 'in-sync'
}

export const FreshnessBadge: React.FC<{ project: ApiProject }> = ({ project }) => {
  const state = computeFreshness(project)
  const copy = FRESHNESS_COPY[state]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${FRESHNESS_TONE_CLASSES[state]}`}
      title={copy.description}
    >
      {copy.label}
    </span>
  )
}

export const AssetPreviewList: React.FC<{ assets: ApiAssetPreview[]; title?: string; emptyMessage?: string }> = ({ assets, title, emptyMessage = 'No assets available yet.' }) => (
  <section className="space-y-2">
    {title ? <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h5> : null}
    {assets.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    ) : (
      <ul className="space-y-2">
        {assets.map(asset => (
          <li key={asset.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{asset.label ?? asset.relativePath}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{asset.relativePath}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatDateTimeDisplay(asset.updatedAt)}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
)

export const DeliverablePreviewList: React.FC<{ deliverables: ApiDeliverablePreview[]; title?: string; emptyMessage?: string }> = ({ deliverables, title, emptyMessage = 'No deliverables available yet.' }) => (
  <section className="space-y-2">
    {title ? <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</h5> : null}
    {deliverables.length === 0 ? (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
    ) : (
      <ul className="space-y-2">
        {deliverables.map(deliverable => (
          <li key={deliverable.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/60 px-3 py-2 text-sm shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/40">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{deliverable.label ?? deliverable.relativePath}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {deliverable.format ? `${deliverable.format.toUpperCase()} • ` : ''}
                {deliverable.relativePath}
              </p>
            </div>
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatDateTimeDisplay(deliverable.updatedAt)}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
)

const formatDate = (value?: string) => {
  if (!value) {
    return 'Just created'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }
  return new Date(parsed).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

const countCaseStudiesReady = (projects: ProjectMeta[]) =>
  projects.filter(project => Boolean(project.caseStudyContent?.overview || project.caseStudyHtml)).length

const DashboardPage: React.FC = () => {
  const { addNotification } = useApp()

  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [storageUsage, setStorageUsage] = useState<{ used: number; available: number; percentage: number } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const refreshProjects = useCallback(async () => {
    setIsLoading(true)
    try {
      const [loadedProjects, usage] = await Promise.all([
        listProjects(),
        getStorageUsage(),
      ])
      setProjects(loadedProjects)
      setStorageUsage(usage)
    } catch (error) {
      console.error('Failed to load projects', error)
      addNotification('error', 'Unable to load portfolio projects from local storage.')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    void refreshProjects()
  }, [refreshProjects])

  const filteredProjects = useMemo(() => {
    if (!searchQuery) {
      return projects
    }
    const query = searchQuery.toLowerCase()
    return projects.filter(project =>
      project.title.toLowerCase().includes(query) ||
      project.summary?.toLowerCase().includes(query) ||
      project.tags.some(tag => tag.toLowerCase().includes(query)),
    )
  }, [projects, searchQuery])

  const stats = useMemo(() => {
    const totalAssets = projects.reduce((count, project) => count + project.assets.length, 0)
    return {
      totalProjects: projects.length,
      caseStudiesReady: countCaseStudiesReady(projects),
      totalAssets,
    }
  }, [projects])

  const handleDelete = async (slug: string) => {
    const project = projects.find(candidate => candidate.slug === slug)
    if (!project) {
      return
    }
    const confirmed = window.confirm(`Delete “${project.title}”? This only removes the local copy.`)
    if (!confirmed) {
      return
    }
    try {
      await deleteProject(slug)
      addNotification('success', 'Project deleted from local storage.')
      void refreshProjects()
    } catch (error) {
      console.error('Delete failed', error)
      addNotification('error', 'Unable to delete this project.')
    }
  }

  const handleExport = (project: ProjectMeta) => {
    downloadJson(`${project.slug || 'project'}.json`, project)
    addNotification('success', 'Project exported as JSON.')
  }

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async event => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    setIsImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as ProjectMeta | ProjectMeta[]
      const payload = Array.isArray(parsed) ? parsed : [parsed]
      let imported = 0
      for (const project of payload) {
        if (project && typeof project === 'object' && typeof project.slug === 'string') {
          await saveProject(project)
          imported += 1
        }
      }
      addNotification('success', `Imported ${imported} project${imported === 1 ? '' : 's'} successfully.`)
      void refreshProjects()
    } catch (error) {
      console.error('Import failed', error)
      addNotification('error', 'Import failed. Provide a JSON export created from this tool.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (isLoading) {
    return (
      <div className="app-page">
        <main
          className="app-page__body"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
        >
          <LoadingSpinner size="lg" text="Loading your projects..." centered />
        </main>
      </div>
    )
  }

  return (
    <div className="app-page">
      <header className="app-page__header">
        <div className="app-page__header-inner">
          <div className="dashboard-hero">
            <div className="dashboard-hero__icon">
              <Folder width={28} height={28} />
            </div>
            <div>
              <h1 className="dashboard-hero__title">Portfolio control centre</h1>
              <p className="section-subtitle">
                Capture project details, manage files locally, and generate polished narratives.
              </p>
            </div>
          </div>
          <div className="button-row">
            <ThemeToggle />
            <Button as={Link} to="/assets" variant="outline" leftIcon={<FolderOpen size={18} />}>
              Manage Assets
            </Button>
            <Button as={Link} to="/portfolio" variant="outline" leftIcon={<Layers size={18} />}>
              View portfolio
            </Button>
            <Button as={Link} to="/create" variant="primary" leftIcon={<Plus size={18} />}>
              New project
            </Button>
          </div>
        </div>
      </header>

      <main className="app-page__body">
        <section className="stats-grid">
          <article
            className="stat-card surface"
            style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)' }}
          >
            <div className="stat-card__icon">
              <Folder width={18} height={18} />
            </div>
            <span className="stat-card__label">Projects</span>
            <span className="stat-card__value">{stats.totalProjects}</span>
            <p className="stat-card__description">All projects are saved locally in your browser.</p>
          </article>

          <article
            className="stat-card surface"
            style={{ background: 'linear-gradient(135deg, #f3e8ff, #ede9fe)' }}
          >
            <div className="stat-card__icon">
              <FileText width={18} height={18} />
            </div>
            <span className="stat-card__label">Case studies ready</span>
            <span className="stat-card__value">{stats.caseStudiesReady}</span>
            <p className="stat-card__description">
              AI-assisted narratives make these projects portfolio-ready.
            </p>
          </article>

          <article
            className="stat-card surface"
            style={{ background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)' }}
          >
            <div className="stat-card__icon">
              <Upload width={18} height={18} />
            </div>
            <span className="stat-card__label">Assets</span>
            <span className="stat-card__value">{stats.totalAssets}</span>
            <p className="stat-card__description">Upload images and files directly into each project.</p>
          </article>

          <article
            className="stat-card surface"
            style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
          >
            <div className="stat-card__icon">
              <RefreshCw width={18} height={18} />
            </div>
            <span className="stat-card__label">Storage used</span>
            <span className="stat-card__value">
              {storageUsage ? `${storageUsage.used}MB` : '—'}
            </span>
            <p className="stat-card__description">
              {storageUsage
                ? `Approx. ${storageUsage.percentage}% of ${storageUsage.available}MB local capacity`
                : 'Storage usage unavailable'}
            </p>
          </article>
        </section>

        <section className="surface surface--raised">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 className="section-title">Local projects</h2>
              <p className="section-subtitle">Search, export, or jump straight into the case study editor.</p>
            </div>
            <div className="dashboard-toolbar">
              <div className="dashboard-toolbar__search">
                <Input
                  placeholder="Search projects"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  leftIcon={<ArrowRightCircle width={16} height={16} />}
                  fullWidth
                />
              </div>
              <div className="dashboard-toolbar__actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={handleImport}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload width={16} height={16} />}
                  loading={isImporting}
                >
                  Import
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => downloadJson('portfolio-projects.json', projects)}
                  leftIcon={<Download width={16} height={16} />}
                  disabled={projects.length === 0}
                >
                  Export all
                </Button>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="dashboard-empty">
              {projects.length === 0
                ? 'No projects yet. Start by creating your first project intake.'
                : 'No projects match your search.'}
            </div>
          ) : (
            <ul className="dashboard-list">
              {filteredProjects.map(project => (
                <li key={project.slug} className="dashboard-project">
                  <div>
                    <div className="button-row" style={{ justifyContent: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{project.title}</h3>
                      <span className="status-pill">
                        {project.status === 'draft' ? 'Draft' : project.status === 'cast' ? 'In review' : 'Published'}
                      </span>
                    </div>
                    {project.summary ? (
                      <p className="section-subtitle" style={{ marginTop: '0.5rem' }}>
                        {project.summary}
                      </p>
                    ) : null}
                    <div className="dashboard-project__meta">
                      <span>{project.assets.length} assets</span>
                      <span>Updated {formatDate(project.updatedAt)}</span>
                      <span>{project.caseStudyContent?.overview ? 'Narrative ready' : 'Needs narrative'}</span>
                    </div>
                    {project.tags.length > 0 ? (
                      <div className="dashboard-project__tags">
                        {project.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="dashboard-project__tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="button-row" style={{ justifyContent: 'flex-start' }}>
                    <Button
                      as={Link}
                      to={`/editor/${project.slug}`}
                      variant="primary"
                      size="sm"
                      leftIcon={<FileText width={16} height={16} />}
                    >
                      Case study
                    </Button>
                    <Button
                      onClick={() => handleExport(project)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Download width={16} height={16} />}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => handleDelete(project.slug)}
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 width={16} height={16} />}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-workflow">
          <h3 className="section-title" style={{ marginBottom: '0.75rem' }}>
            Workflow tips
          </h3>
          <ol>
            <li>Capture a project through the intake to gather narrative hooks and assets.</li>
            <li>Use the case study editor to refine copy, upload visuals, and generate AI narratives.</li>
            <li>Arrange your highlights in the portfolio editor before sharing or exporting.</li>
          </ol>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
