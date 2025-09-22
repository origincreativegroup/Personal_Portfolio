export type FreshnessState =
  | 'in-sync'
  | 'filesystem-updated'
  | 'metadata-updated'
  | 'brief-updated'
  | 'sync-needed'
  | 'never-synced'

interface ProjectMeta {
  lastSyncedAt?: string | null
  fsLastModified?: string | null
  metadataUpdatedAt?: string | null
  briefUpdatedAt?: string | null
  syncStatus?: string
}

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
  'in-sync': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'filesystem-updated': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'metadata-updated': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'brief-updated': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'sync-needed': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'never-synced': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
}

const parseDate = (value?: string | null): number | undefined => {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

type FreshnessUpdate = 'filesystem-updated' | 'metadata-updated' | 'brief-updated'

const getLatestUpdate = (project: ProjectMeta): { type: FreshnessUpdate; timestamp: number } | undefined => {
  const updates: Array<{ type: FreshnessUpdate; timestamp?: number }> = [
    { type: 'filesystem-updated', timestamp: parseDate(project.fsLastModified) },
    { type: 'metadata-updated', timestamp: parseDate(project.metadataUpdatedAt) },
    { type: 'brief-updated', timestamp: parseDate(project.briefUpdatedAt) },
  ]

  return updates
    .filter((update): update is { type: FreshnessUpdate; timestamp: number } => update.timestamp !== undefined)
    .sort((a, b) => b.timestamp - a.timestamp)[0]
}

export const computeFreshness = (project: ProjectMeta): FreshnessState => {
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

interface ProjectFreshnessBadgeProps {
  project: ProjectMeta
  className?: string
}

export default function ProjectFreshnessBadge({ project, className = '' }: ProjectFreshnessBadgeProps) {
  const state = computeFreshness(project)
  const copy = FRESHNESS_COPY[state]

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${FRESHNESS_TONE_CLASSES[state]} ${className}`}
      title={copy.description}
    >
      {copy.label}
    </span>
  )
}