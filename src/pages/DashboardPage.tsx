import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRightCircle,
  Download,
  FileText,
  Folder,
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your projects..." centered />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <Folder className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Portfolio control centre</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Capture project details, manage files locally, and generate polished narratives.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Button as={Link} to="/portfolio" variant="outline" leftIcon={<Layers className="h-4 w-4" />}>
              View portfolio
            </Button>
            <Button as={Link} to="/create" variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              New project
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm dark:border-indigo-800/60 dark:bg-indigo-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Projects</p>
                <p className="mt-2 text-3xl font-semibold">{stats.totalProjects}</p>
              </div>
              <div className="rounded-full bg-white/70 p-2 dark:bg-indigo-900/60">
                <Folder className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-indigo-700/80 dark:text-indigo-200/80">
              All projects are saved locally in your browser.
            </p>
          </article>

          <article className="rounded-2xl border border-purple-100 bg-purple-50 p-6 shadow-sm dark:border-purple-900/50 dark:bg-purple-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Case studies ready</p>
                <p className="mt-2 text-3xl font-semibold">{stats.caseStudiesReady}</p>
              </div>
              <div className="rounded-full bg-white/70 p-2 dark:bg-purple-900/60">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-purple-700/80 dark:text-purple-200/80">
              AI-assisted narratives make these projects portfolio-ready.
            </p>
          </article>

          <article className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-sky-600 dark:text-sky-300">Assets</p>
                <p className="mt-2 text-3xl font-semibold">{stats.totalAssets}</p>
              </div>
              <div className="rounded-full bg-white/70 p-2 dark:bg-sky-900/60">
                <Upload className="h-5 w-5 text-sky-600 dark:text-sky-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-sky-700/80 dark:text-sky-200/80">
              Upload images and files directly into each project.
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Storage used</p>
                <p className="mt-2 text-3xl font-semibold">
                  {storageUsage ? `${storageUsage.used}MB` : '—'}
                </p>
              </div>
              <div className="rounded-full bg-white/70 p-2 dark:bg-emerald-900/60">
                <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-700/80 dark:text-emerald-200/80">
              {storageUsage
                ? `Approx. ${storageUsage.percentage}% of ${storageUsage.available}MB local capacity`
                : 'Storage usage unavailable'}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
          <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Local projects</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Search, export, or jump straight into the case study editor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Search projects"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                leftIcon={<ArrowRightCircle className="h-4 w-4 rotate-45" />}
              />
              <div className="flex items-center gap-2">
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
                  leftIcon={<Upload className="h-4 w-4" />}
                  loading={isImporting}
                >
                  Import
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => downloadJson('portfolio-projects.json', projects)}
                  leftIcon={<Download className="h-4 w-4" />}
                  disabled={projects.length === 0}
                >
                  Export all
                </Button>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              {projects.length === 0
                ? 'No projects yet. Start by creating your first project intake.'
                : 'No projects match your search.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredProjects.map(project => (
                <li key={project.slug} className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {project.title}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {project.status === 'draft' ? 'Draft' : project.status === 'cast' ? 'In review' : 'Published'}
                      </span>
                    </div>
                    {project.summary && (
                      <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-400">{project.summary}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <span>{project.assets.length} assets</span>
                      <span>Updated {formatDate(project.updatedAt)}</span>
                      <span>
                        {project.caseStudyContent?.overview
                          ? 'Narrative ready'
                          : 'Needs narrative'}
                      </span>
                    </div>
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.tags.slice(0, 5).map(tag => (
                          <span
                            key={tag}
                            className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      as={Link}
                      to={`/editor/${project.slug}`}
                      variant="primary"
                      size="sm"
                      leftIcon={<FileText className="h-4 w-4" />}
                    >
                      Case study
                    </Button>
                    <Button
                      onClick={() => handleExport(project)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="h-4 w-4" />}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => handleDelete(project.slug)}
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 text-sm text-indigo-900 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-100">
          <h3 className="text-base font-semibold">Workflow tips</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
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
