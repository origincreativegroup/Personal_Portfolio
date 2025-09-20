import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  Layers,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, LoadingSpinner } from '../components/ui'
import { useApp } from '../contexts/AppContext'
import {
  deleteProject,
  getStorageUsage,
  listProjects,
  saveProject,
} from '../utils/storageManager'
import type { ProjectMeta } from '../intake/schema'
import ThemeToggle from '../components/ThemeToggle'
import {
  DASHBOARD_TIMEFRAMES,
  buildDashboardSnapshot,
  defaultDashboardTimeframe,
  formatCurrency,
  formatNumber,
  formatPercentage,
  type Announcement,
  type ChannelPerformance,
  type DashboardSnapshot,
  type DashboardTimeframe,
  type Metric,
  type PipelineItem,
  type TeamMember,
} from '../utils/dashboardData'
import './DashboardPage.css'

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

const formatProjectDate = (value?: string) => {
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

const NAVIGATION_ITEMS: Array<{ label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Projects', icon: Activity },
  { label: 'Team', icon: Users },
  { label: 'Settings', icon: Settings },
]

const TIMEFRAME_LABELS: Record<DashboardTimeframe, string> = {
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly',
}

const TIMEFRAME_DESCRIPTION: Record<DashboardTimeframe, string> = {
  week: 'A real-time look at momentum across the current sprint.',
  month: 'A strategic overview of performance across the current month.',
  quarter: 'Quarterly health across pipeline, revenue, and delivery.',
  year: 'An annual perspective on growth, retention, and utilisation.',
}

type MetricCardProps = {
  metric: Metric
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const isPositive = metric.direction === 'up'
  const formattedValue =
    metric.unit === 'currency'
      ? formatCurrency(metric.value)
      : metric.unit === 'percentage'
        ? formatPercentage(metric.value)
        : formatNumber(metric.value)

  return (
    <article className="dashboard-metric-card" aria-label={`${metric.label} summary`}>
      <header className="dashboard-metric-card__header">
        <span className="dashboard-metric-card__title">{metric.label}</span>
        <span
          className={`dashboard-metric-card__trend dashboard-metric-card__trend--${isPositive ? 'positive' : 'negative'}`}
          aria-label={`Change ${metric.direction === 'up' ? 'upward' : 'downward'} ${formatPercentage(metric.change)}`}
        >
          {isPositive ? '▲' : '▼'} {formatPercentage(metric.change)}
        </span>
      </header>
      <p className="dashboard-metric-card__value">{formattedValue}</p>
      <p className="dashboard-metric-card__description">{metric.description}</p>
    </article>
  )
}

type RevenuePanelProps = {
  snapshot: DashboardSnapshot
}

const RevenuePanel: React.FC<RevenuePanelProps> = ({ snapshot }) => {
  const revenueMetric = snapshot.metrics.find(candidate => candidate.id === 'revenue')
  const trendLabel = revenueMetric
    ? `${revenueMetric.direction === 'up' ? '+' : '−'}${formatPercentage(revenueMetric.change)}`
    : 'Stable vs previous period'
  const chartMax = snapshot.revenue.series.length > 0
    ? Math.max(...snapshot.revenue.series.map(point => point.revenue), 1)
    : 1

  return (
    <section className="dashboard-card dashboard-revenue-card" aria-labelledby="dashboard-revenue-heading">
      <header className="dashboard-card__header">
        <div>
          <h2 id="dashboard-revenue-heading">Revenue overview</h2>
          <p className="dashboard-card__subtitle">Revenue and profit trends for the selected timeframe.</p>
        </div>
        <div className="dashboard-card__trend">
          <TrendingUp size={16} aria-hidden="true" />
          <span>{trendLabel}</span>
        </div>
      </header>

      <div className="dashboard-revenue-summary">
        <div>
          <span className="dashboard-revenue-summary__label">Total revenue</span>
          <span className="dashboard-revenue-summary__value">{formatCurrency(snapshot.revenue.totalRevenue)}</span>
        </div>
        <div>
          <span className="dashboard-revenue-summary__label">Net profit</span>
          <span className="dashboard-revenue-summary__value">{formatCurrency(snapshot.revenue.totalProfit)}</span>
        </div>
        <div>
          <span className="dashboard-revenue-summary__label">Average margin</span>
          <span className="dashboard-revenue-summary__value">{formatPercentage(snapshot.revenue.averageMargin)}</span>
        </div>
      </div>

      <div className="dashboard-revenue-chart" role="list" aria-label="Revenue trend chart">
        {snapshot.revenue.series.map(point => {
          const revenueHeight = chartMax === 0 ? 0 : Math.round((point.revenue / chartMax) * 100)
          const profitHeight = point.revenue === 0 ? 0 : Math.round((point.profit / point.revenue) * 100)
          return (
            <div key={point.label} className="dashboard-revenue-chart__column" role="listitem">
              <div className="dashboard-revenue-chart__bar" aria-hidden="true">
                <span
                  className="dashboard-revenue-chart__bar-total"
                  style={{ height: `${revenueHeight}%` }}
                >
                  <span
                    className="dashboard-revenue-chart__bar-profit"
                    style={{ height: `${profitHeight}%` }}
                  />
                </span>
              </div>
              <span className="dashboard-revenue-chart__label">{point.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type PipelineTableProps = {
  items: PipelineItem[]
}

const pipelineStatusTone: Record<PipelineItem['status'], 'positive' | 'warning' | 'danger' | 'neutral'> = {
  Completed: 'positive',
  'In review': 'warning',
  'In progress': 'neutral',
  'At risk': 'danger',
}

const PipelineTable: React.FC<PipelineTableProps> = ({ items }) => (
  <section className="dashboard-card dashboard-pipeline-card" aria-labelledby="dashboard-pipeline-heading">
    <header className="dashboard-card__header">
      <div>
        <h2 id="dashboard-pipeline-heading">Project pipeline</h2>
        <p className="dashboard-card__subtitle">Active client engagements across discovery, delivery, and QA.</p>
      </div>
      <div className="dashboard-card__hint">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>{formatNumber(items.filter(item => item.status === 'Completed').length)} completed</span>
      </div>
    </header>

    <div className="dashboard-table-scroll">
      <table className="dashboard-pipeline-table">
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Client</th>
            <th scope="col">Status</th>
            <th scope="col">Progress</th>
            <th scope="col" className="dashboard-align-right">Budget</th>
            <th scope="col">Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td data-title="Project">
                <div className="dashboard-pipeline-project">
                  <span className="dashboard-pipeline-project__code">{item.id}</span>
                  <span className="dashboard-pipeline-project__name">{item.project}</span>
                </div>
              </td>
              <td data-title="Client">{item.client}</td>
              <td data-title="Status">
                <span className={`dashboard-status-badge dashboard-status-badge--${pipelineStatusTone[item.status]}`}>
                  {item.status}
                </span>
              </td>
              <td data-title="Progress">
                <div className="dashboard-progress">
                  <span className="dashboard-progress__track">
                    <span className="dashboard-progress__bar" style={{ width: `${item.progress}%` }} />
                  </span>
                  <span className="dashboard-progress__value">{item.progress}%</span>
                </div>
              </td>
              <td data-title="Budget" className="dashboard-align-right">{formatCurrency(item.amount)}</td>
              <td data-title="Due">{formatShortDate(item.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)

type TeamListProps = {
  members: TeamMember[]
}

const TeamList: React.FC<TeamListProps> = ({ members }) => {
  const maxContribution = members.length > 0 ? Math.max(...members.map(member => member.contributions), 1) : 1

  return (
    <section className="dashboard-card dashboard-team-card" aria-labelledby="dashboard-team-heading">
      <header className="dashboard-card__header">
        <div>
          <h2 id="dashboard-team-heading">Team focus</h2>
          <p className="dashboard-card__subtitle">Allocation, contributions, and current focus areas.</p>
        </div>
        <div className="dashboard-card__hint">
          <Users size={16} aria-hidden="true" />
          <span>{formatNumber(members.length)} key contributors</span>
        </div>
      </header>
      <ul className="dashboard-team-list">
        {members.map(member => (
          <li key={member.id} className="dashboard-team-list__item">
            <span className="dashboard-team-list__avatar" style={{ backgroundColor: member.avatarColor }} aria-hidden="true">
              {getInitials(member.name)}
            </span>
            <div className="dashboard-team-list__content">
              <div className="dashboard-team-list__heading">
                <span className="dashboard-team-list__name">{member.name}</span>
                <span className="dashboard-team-list__role">{member.role}</span>
              </div>
              <p className="dashboard-team-list__focus">Current focus: {member.focus}</p>
              <div className="dashboard-team-list__progress" aria-label={`${member.contributions} contributions`}>
                <span
                  className="dashboard-team-list__progress-bar"
                  style={{ width: `${Math.round((member.contributions / maxContribution) * 100)}%` }}
                />
              </div>
            </div>
            <div className="dashboard-team-list__metrics">
              <span className="dashboard-team-list__metric-label">Contributions</span>
              <span className="dashboard-team-list__metric-value">{formatNumber(member.contributions)}</span>
              <span className="dashboard-team-list__metric-label">Hours</span>
              <span className="dashboard-team-list__metric-value">{formatNumber(member.hours)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

type ChannelListProps = {
  channels: ChannelPerformance[]
  summary: DashboardSnapshot['channelSummary']
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, summary }) => (
  <section className="dashboard-card dashboard-channel-card" aria-labelledby="dashboard-channel-heading">
    <header className="dashboard-card__header">
      <div>
        <h2 id="dashboard-channel-heading">Growth channels</h2>
        <p className="dashboard-card__subtitle">Lead generation and conversion performance.</p>
      </div>
      <div className="dashboard-channel-summary">
        <div>
          <span className="dashboard-channel-summary__label">Leads</span>
          <span className="dashboard-channel-summary__value">{formatNumber(summary.totalLeads)}</span>
        </div>
        <div>
          <span className="dashboard-channel-summary__label">Top channel</span>
          <span className="dashboard-channel-summary__value">{summary.strongestChannel.channel}</span>
        </div>
        <div>
          <span className="dashboard-channel-summary__label">Avg. conversion</span>
          <span className="dashboard-channel-summary__value">{formatPercentage(summary.averageConversion)}</span>
        </div>
      </div>
    </header>
    <ul className="dashboard-channel-list">
      {channels.map(channel => (
        <li key={channel.id} className="dashboard-channel-list__item">
          <div>
            <span className="dashboard-channel-list__name">{channel.channel}</span>
            <span className="dashboard-channel-list__details">
              {formatNumber(channel.leads)} leads • {formatNumber(channel.opportunities)} opportunities
            </span>
          </div>
          <div className="dashboard-channel-list__metrics">
            <span className="dashboard-channel-list__rate">{formatPercentage(channel.conversionRate)}</span>
            <span className="dashboard-channel-list__trend">+{formatPercentage(channel.trend)}</span>
          </div>
        </li>
      ))}
    </ul>
  </section>
)

type AnnouncementListProps = {
  items: Announcement[]
}

const AnnouncementList: React.FC<AnnouncementListProps> = ({ items }) => (
  <section className="dashboard-card dashboard-announcement-card" aria-labelledby="dashboard-announcement-heading">
    <header className="dashboard-card__header">
      <div>
        <h2 id="dashboard-announcement-heading">Updates</h2>
        <p className="dashboard-card__subtitle">Operational updates and enablement highlights for the team.</p>
      </div>
    </header>
    <ul className="dashboard-announcement-list">
      {items.map(item => (
        <li key={item.id} className="dashboard-announcement-list__item">
          <div className="dashboard-announcement-list__icon" aria-hidden="true">
            <Sparkles size={16} />
          </div>
          <div className="dashboard-announcement-list__content">
            <div className="dashboard-announcement-list__heading">
              <span className="dashboard-announcement-list__title">{item.title}</span>
              <span className="dashboard-announcement-list__date">{formatShortDate(item.date)}</span>
            </div>
            <p className="dashboard-announcement-list__message">{item.message}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
)

const formatShortDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) {
    return 'T'
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
}

type PortfolioProjectsCardProps = {
  projects: ProjectMeta[]
  totalProjects: number
  stats: { totalProjects: number; caseStudiesReady: number; totalAssets: number }
  storageUsage: { used: number; available: number; percentage: number } | null
  onImportClick: () => void
  onExportAll: () => void
  onExportProject: (project: ProjectMeta) => void
  onDeleteProject: (slug: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  onImportChange: React.ChangeEventHandler<HTMLInputElement>
  isImporting: boolean
  searchQuery: string
  isLoading: boolean
}

const PortfolioProjectsCard: React.FC<PortfolioProjectsCardProps> = ({
  projects,
  totalProjects,
  stats,
  storageUsage,
  onImportClick,
  onExportAll,
  onExportProject,
  onDeleteProject,
  fileInputRef,
  onImportChange,
  isImporting,
  searchQuery,
  isLoading,
}) => {
  const hasProjects = totalProjects > 0
  const emptyMessage = hasProjects
    ? searchQuery
      ? `No projects match “${searchQuery}”.`
      : 'No projects match your filters.'
    : 'No projects yet. Start by creating your first project intake.'

  return (
    <section className="dashboard-card dashboard-portfolio-card" aria-labelledby="dashboard-portfolio-heading">
      <header className="dashboard-card__header">
        <div>
          <h2 id="dashboard-portfolio-heading">Portfolio projects</h2>
          <p className="dashboard-card__subtitle">
            Manage local case studies, imports, and exports from your browser.
          </p>
        </div>
        <div className="dashboard-portfolio-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={onImportChange}
          />
          <Button
            variant="outline"
            onClick={onImportClick}
            leftIcon={<Upload size={16} />}
            loading={isImporting}
          >
            Import JSON
          </Button>
          <Button
            variant="ghost"
            onClick={onExportAll}
            leftIcon={<Download size={16} />}
            disabled={!hasProjects}
          >
            Export all
          </Button>
        </div>
      </header>

      <div className="dashboard-portfolio-stats" role="list">
        <div role="listitem">
          <span className="dashboard-portfolio-stat-label">Projects</span>
          <span className="dashboard-portfolio-stat-value">{stats.totalProjects}</span>
        </div>
        <div role="listitem">
          <span className="dashboard-portfolio-stat-label">Case studies ready</span>
          <span className="dashboard-portfolio-stat-value">{stats.caseStudiesReady}</span>
        </div>
        <div role="listitem">
          <span className="dashboard-portfolio-stat-label">Assets</span>
          <span className="dashboard-portfolio-stat-value">{stats.totalAssets}</span>
        </div>
        <div role="listitem">
          <span className="dashboard-portfolio-stat-label">Storage</span>
          <span className="dashboard-portfolio-stat-value">
            {storageUsage
              ? `${storageUsage.used}MB • ${storageUsage.percentage}% of ${storageUsage.available}MB`
              : 'Unavailable'}
          </span>
        </div>
      </div>

      <div className="dashboard-portfolio-list">
        {isLoading ? (
          <div className="dashboard-portfolio-empty">
            <LoadingSpinner size="md" text="Loading your projects..." />
          </div>
        ) : projects.length === 0 ? (
          <div className="dashboard-portfolio-empty">{emptyMessage}</div>
        ) : (
          <ul className="dashboard-portfolio-items">
            {projects.map(project => (
              <li key={project.slug} className="dashboard-portfolio-project">
                <div className="dashboard-portfolio-project__header">
                  <div>
                    <h3 className="dashboard-portfolio-project__title">{project.title}</h3>
                    <span className="dashboard-portfolio-status">
                      {project.status === 'draft'
                        ? 'Draft'
                        : project.status === 'cast'
                          ? 'In review'
                          : 'Published'}
                    </span>
                  </div>
                  <div className="dashboard-portfolio-project__actions button-row">
                    <Button
                      as={Link}
                      to={`/editor/${project.slug}`}
                      variant="primary"
                      size="sm"
                      leftIcon={<FileText size={16} />}
                    >
                      Case study
                    </Button>
                    <Button
                      onClick={() => onExportProject(project)}
                      variant="outline"
                      size="sm"
                      leftIcon={<Download size={16} />}
                    >
                      Export
                    </Button>
                    <Button
                      onClick={() => onDeleteProject(project.slug)}
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {project.summary ? (
                  <p className="dashboard-portfolio-summary">{project.summary}</p>
                ) : null}
                <div className="dashboard-portfolio-meta">
                  <span>{project.assets.length} assets</span>
                  <span>Updated {formatProjectDate(project.updatedAt)}</span>
                  <span>{project.caseStudyContent?.overview ? 'Narrative ready' : 'Needs narrative'}</span>
                </div>
                {project.tags.length > 0 ? (
                  <div className="dashboard-portfolio-tags">
                    {project.tags.slice(0, 5).map(tag => (
                      <span key={tag} className="dashboard-portfolio-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

const DashboardPage: React.FC = () => {
  const { addNotification } = useApp()

  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [storageUsage, setStorageUsage] = useState<{ used: number; available: number; percentage: number } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>(defaultDashboardTimeframe)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const snapshot = useMemo(() => buildDashboardSnapshot(timeframe), [timeframe])

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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 960px)')

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
      if (event.matches) {
        setSidebarOpen(false)
      }
    }

    setIsDesktop(mediaQuery.matches)
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

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

  const toggleSidebar = () => {
    if (isDesktop) {
      return
    }
    setSidebarOpen(previous => !previous)
  }

  const closeSidebar = () => {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  const handleNavigation = () => {
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  const isSidebarVisible = isDesktop || isSidebarOpen

  return (
    <div className="dashboard-app-shell">
      {!isDesktop && isSidebarOpen ? (
        <button type="button" className="dashboard-sidebar-overlay" onClick={closeSidebar} aria-label="Close navigation" />
      ) : null}
      <aside
        id="dashboard-primary-navigation"
        className={[
          'dashboard-sidebar',
          isDesktop ? 'dashboard-sidebar--desktop' : 'dashboard-sidebar--mobile',
          isSidebarVisible ? 'dashboard-sidebar--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Primary navigation"
        aria-hidden={!isDesktop && !isSidebarOpen}
      >
        <div className="dashboard-sidebar__header">
          <div className="dashboard-sidebar__brand">
            <div className="dashboard-sidebar__mark" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="dashboard-sidebar__title">PortfolioForge</span>
              <span className="dashboard-sidebar__subtitle">Control centre</span>
            </div>
          </div>
          {!isDesktop && (
            <button type="button" className="dashboard-sidebar__close" onClick={closeSidebar} aria-label="Close navigation">
              <X size={18} />
            </button>
          )}
        </div>
        <nav>
          <ul className="dashboard-sidebar__nav">
            {NAVIGATION_ITEMS.map(item => (
              <li key={item.label}>
                <a
                  className={`dashboard-sidebar__link${item.label === 'Overview' ? ' is-active' : ''}`}
                  href="#"
                  onClick={event => {
                    event.preventDefault()
                    handleNavigation()
                  }}
                >
                  <item.icon size={16} aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="dashboard-sidebar__footer">
          <div className="dashboard-sidebar__footer-heading">
            <Target size={16} aria-hidden="true" />
            <span>Quarterly target</span>
          </div>
          <p className="dashboard-sidebar__footer-body">
            Tracking ahead of plan. Maintain inbound cadence and delivery velocity.
          </p>
          <button type="button" className="dashboard-sidebar__footer-action">
            <ArrowUpRight size={16} aria-hidden="true" />
            View playbook
          </button>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-topbar__menu"
            aria-label="Toggle navigation"
            aria-controls="dashboard-primary-navigation"
            aria-expanded={isDesktop ? true : isSidebarOpen}
            onClick={toggleSidebar}
          >
            <Menu size={18} />
          </button>
          <div className="dashboard-topbar__search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search projects, clients, and docs"
              aria-label="Search dashboard"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="dashboard-topbar__actions">
            <button type="button" className="dashboard-icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <ThemeToggle />
            <div className="dashboard-user-pill" role="button" tabIndex={0} aria-label="Account menu">
              <div className="dashboard-user-pill__avatar" aria-hidden="true">
                <Users size={16} />
              </div>
              <div className="dashboard-user-pill__meta">
                <span className="dashboard-user-pill__name">Nova Martinez</span>
                <span className="dashboard-user-pill__role">Operations lead</span>
              </div>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
            <Button as={Link} to="/portfolio" variant="outline" leftIcon={<Layers size={16} />}>
              View portfolio
            </Button>
            <Button as={Link} to="/create" variant="primary" leftIcon={<Plus size={16} />}>
              New project
            </Button>
          </div>
        </header>

        <main className="dashboard-workspace__content">
          <section className="dashboard-page-heading">
            <div>
              <span className="dashboard-page-heading__eyebrow">PortfolioForge</span>
              <h1 className="dashboard-page-heading__title">Control centre</h1>
              <p className="dashboard-page-heading__description">{TIMEFRAME_DESCRIPTION[timeframe]}</p>
            </div>
            <div className="dashboard-timeframe-toggle" role="group" aria-label="Select timeframe">
              {DASHBOARD_TIMEFRAMES.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`dashboard-timeframe-toggle__button${option === timeframe ? ' is-active' : ''}`}
                  onClick={() => setTimeframe(option)}
                  aria-pressed={option === timeframe}
                >
                  {TIMEFRAME_LABELS[option]}
                </button>
              ))}
            </div>
          </section>

          <section className="dashboard-metrics-grid">
            {snapshot.metrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </section>

          <div className="dashboard-primary-grid">
            <RevenuePanel snapshot={snapshot} />
            <TeamList members={snapshot.team} />
          </div>

          <div className="dashboard-secondary-grid">
            <PipelineTable items={snapshot.pipeline} />
            <div className="dashboard-secondary-grid__column">
              <ChannelList channels={snapshot.channels} summary={snapshot.channelSummary} />
              <AnnouncementList items={snapshot.highlights} />
            </div>
          </div>

          <PortfolioProjectsCard
            projects={filteredProjects}
            totalProjects={projects.length}
            stats={stats}
            storageUsage={storageUsage}
            onImportClick={() => fileInputRef.current?.click()}
            onExportAll={() => downloadJson('portfolio-projects.json', projects)}
            onExportProject={handleExport}
            onDeleteProject={handleDelete}
            fileInputRef={fileInputRef}
            onImportChange={handleImport}
            isImporting={isImporting}
            searchQuery={searchQuery}
            isLoading={isLoading}
          />
        </main>
      </div>
    </div>
  )
}

export default DashboardPage

