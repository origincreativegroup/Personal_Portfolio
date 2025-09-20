import { type ComponentType, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import './App.css'
import {
  DASHBOARD_TIMEFRAMES,
  buildDashboardSnapshot,
  defaultDashboardTimeframe,
  formatCurrency,
  formatNumber,
  formatPercentage,
} from './dashboardData'
import type {
  Announcement,
  ChannelPerformance,
  DashboardSnapshot,
  DashboardTimeframe,
  Metric,
  PipelineItem,
  TeamMember,
} from './dashboardData'

const NAVIGATION_ITEMS: Array<{ label: string; icon: ComponentType<{ size?: number }> }> = [
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

const MetricCard = ({ metric }: MetricCardProps) => {
  const isPositive = metric.direction === 'up'
  const formattedValue =
    metric.unit === 'currency'
      ? formatCurrency(metric.value)
      : metric.unit === 'percentage'
        ? formatPercentage(metric.value)
        : formatNumber(metric.value)

  return (
    <article className="metric-card" aria-label={`${metric.label} summary`}>
      <header className="metric-card__header">
        <span className="metric-card__title">{metric.label}</span>
        <span
          className={`metric-card__trend metric-card__trend--${isPositive ? 'positive' : 'negative'}`}
          aria-label={`Change ${metric.direction === 'up' ? 'upward' : 'downward'} ${formatPercentage(metric.change)}`}
        >
          {isPositive ? '▲' : '▼'} {formatPercentage(metric.change)}
        </span>
      </header>
      <p className="metric-card__value">{formattedValue}</p>
      <p className="metric-card__description">{metric.description}</p>
    </article>
  )
}

type RevenuePanelProps = {
  snapshot: DashboardSnapshot
}

const RevenuePanel = ({ snapshot }: RevenuePanelProps) => {
  const revenueMetric = snapshot.metrics.find(metric => metric.id === 'revenue')
  const trendLabel = revenueMetric
    ? `${revenueMetric.direction === 'up' ? '+' : '−'}${formatPercentage(revenueMetric.change)}`
    : null
  const chartMax = Math.max(...snapshot.revenue.series.map(point => point.revenue), 1)

  return (
    <section className="card revenue-card" aria-labelledby="revenue-heading">
      <header className="card__header">
        <div>
          <h2 id="revenue-heading">Revenue overview</h2>
          <p className="card__subtitle">Revenue and profit trends for the selected timeframe.</p>
        </div>
        <div className="card__trend">
          <TrendingUp size={16} aria-hidden="true" />
          <span>{trendLabel ?? 'Stable vs previous period'}</span>
        </div>
      </header>

      <div className="revenue-summary">
        <div>
          <span className="revenue-summary__label">Total revenue</span>
          <span className="revenue-summary__value">{formatCurrency(snapshot.revenue.totalRevenue)}</span>
        </div>
        <div>
          <span className="revenue-summary__label">Net profit</span>
          <span className="revenue-summary__value">{formatCurrency(snapshot.revenue.totalProfit)}</span>
        </div>
        <div>
          <span className="revenue-summary__label">Average margin</span>
          <span className="revenue-summary__value">{formatPercentage(snapshot.revenue.averageMargin)}</span>
        </div>
      </div>

      <div className="revenue-chart" role="list" aria-label="Revenue trend chart">
        {snapshot.revenue.series.map(point => {
          const revenueHeight = Math.round((point.revenue / chartMax) * 100)
          const profitHeight = Math.round((point.profit / point.revenue) * 100)
          return (
            <div key={point.label} className="revenue-chart__column" role="listitem">
              <div className="revenue-chart__bar" aria-hidden="true">
                <span
                  className="revenue-chart__bar-total"
                  style={{ height: `${revenueHeight}%` }}
                >
                  <span
                    className="revenue-chart__bar-profit"
                    style={{ height: `${profitHeight}%` }}
                  />
                </span>
              </div>
              <span className="revenue-chart__label">{point.label}</span>
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

const statusTone: Record<PipelineItem['status'], 'positive' | 'warning' | 'danger' | 'neutral'> = {
  Completed: 'positive',
  'In review': 'warning',
  'In progress': 'neutral',
  'At risk': 'danger',
}

const PipelineTable = ({ items }: PipelineTableProps) => (
  <section className="card pipeline-card" aria-labelledby="pipeline-heading">
    <header className="card__header">
      <div>
        <h2 id="pipeline-heading">Project pipeline</h2>
        <p className="card__subtitle">Active client engagements across discovery, delivery, and QA.</p>
      </div>
      <div className="card__hint">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>{formatNumber(items.filter(item => item.status === 'Completed').length)} completed</span>
      </div>
    </header>

    <div className="table-scroll">
      <table className="pipeline-table">
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Client</th>
            <th scope="col">Status</th>
            <th scope="col">Progress</th>
            <th scope="col" className="align-right">Budget</th>
            <th scope="col">Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td data-title="Project">
                <div className="pipeline-project">
                  <span className="pipeline-project__code">{item.id}</span>
                  <span className="pipeline-project__name">{item.project}</span>
                </div>
              </td>
              <td data-title="Client">{item.client}</td>
              <td data-title="Status">
                <span className={`status-badge status-badge--${statusTone[item.status]}`}>{item.status}</span>
              </td>
              <td data-title="Progress">
                <div className="progress">
                  <span className="progress__track">
                    <span className="progress__bar" style={{ width: `${item.progress}%` }} />
                  </span>
                  <span className="progress__value">{item.progress}%</span>
                </div>
              </td>
              <td data-title="Budget" className="align-right">{formatCurrency(item.amount)}</td>
              <td data-title="Due">{formatDate(item.dueDate)}</td>
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

const TeamList = ({ members }: TeamListProps) => {
  const maxContribution = Math.max(...members.map(member => member.contributions), 1)

  return (
    <section className="card team-card" aria-labelledby="team-heading">
      <header className="card__header">
        <div>
          <h2 id="team-heading">Team focus</h2>
          <p className="card__subtitle">Allocation, contributions, and current focus areas.</p>
        </div>
        <div className="card__hint">
          <Users size={16} aria-hidden="true" />
          <span>{formatNumber(members.length)} key contributors</span>
        </div>
      </header>
      <ul className="team-list">
        {members.map(member => (
          <li key={member.id} className="team-list__item">
            <span className="team-list__avatar" style={{ backgroundColor: member.avatarColor }} aria-hidden="true">
              {initials(member.name)}
            </span>
            <div className="team-list__content">
              <div className="team-list__heading">
                <span className="team-list__name">{member.name}</span>
                <span className="team-list__role">{member.role}</span>
              </div>
              <p className="team-list__focus">Current focus: {member.focus}</p>
              <div className="team-list__progress" aria-label={`${member.contributions} contributions`}>
                <span
                  className="team-list__progress-bar"
                  style={{ width: `${Math.round((member.contributions / maxContribution) * 100)}%` }}
                />
              </div>
            </div>
            <div className="team-list__metrics">
              <span className="team-list__metric-label">Contributions</span>
              <span className="team-list__metric-value">{formatNumber(member.contributions)}</span>
              <span className="team-list__metric-label">Hours</span>
              <span className="team-list__metric-value">{formatNumber(member.hours)}</span>
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

const ChannelList = ({ channels, summary }: ChannelListProps) => (
  <section className="card channel-card" aria-labelledby="channel-heading">
    <header className="card__header">
      <div>
        <h2 id="channel-heading">Growth channels</h2>
        <p className="card__subtitle">Lead generation and conversion performance.</p>
      </div>
      <div className="channel-summary">
        <div>
          <span className="channel-summary__label">Leads</span>
          <span className="channel-summary__value">{formatNumber(summary.totalLeads)}</span>
        </div>
        <div>
          <span className="channel-summary__label">Top channel</span>
          <span className="channel-summary__value">{summary.strongestChannel.channel}</span>
        </div>
        <div>
          <span className="channel-summary__label">Avg. conversion</span>
          <span className="channel-summary__value">{formatPercentage(summary.averageConversion)}</span>
        </div>
      </div>
    </header>
    <ul className="channel-list">
      {channels.map(channel => (
        <li key={channel.id} className="channel-list__item">
          <div>
            <span className="channel-list__name">{channel.channel}</span>
            <span className="channel-list__details">
              {formatNumber(channel.leads)} leads • {formatNumber(channel.opportunities)} opportunities
            </span>
          </div>
          <div className="channel-list__metrics">
            <span className="channel-list__rate">{formatPercentage(channel.conversionRate)}</span>
            <span className="channel-list__trend">
              +{formatPercentage(channel.trend)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  </section>
)

type AnnouncementListProps = {
  items: Announcement[]
}

const AnnouncementList = ({ items }: AnnouncementListProps) => (
  <section className="card announcement-card" aria-labelledby="announcement-heading">
    <header className="card__header">
      <div>
        <h2 id="announcement-heading">Updates</h2>
        <p className="card__subtitle">Operational updates and enablement highlights for the team.</p>
      </div>
    </header>
    <ul className="announcement-list">
      {items.map(item => (
        <li key={item.id} className="announcement-list__item">
          <div className="announcement-list__icon" aria-hidden="true">
            <Sparkles size={16} />
          </div>
          <div className="announcement-list__content">
            <div className="announcement-list__heading">
              <span className="announcement-list__title">{item.title}</span>
              <span className="announcement-list__date">{formatDate(item.date)}</span>
            </div>
            <p className="announcement-list__message">{item.message}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
)

const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const initials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) {
    return 'T'
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase()
  }
  return `${parts[0]!.charAt(0)}${parts[parts.length - 1]!.charAt(0)}`.toUpperCase()
}

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>(defaultDashboardTimeframe)
  const snapshot = useMemo<DashboardSnapshot>(() => buildDashboardSnapshot(timeframe), [timeframe])

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

  const isSidebarVisible = isDesktop || isSidebarOpen

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

  return (
    <div className="app-shell">
      {!isDesktop && isSidebarOpen && (
        <button type="button" className="sidebar-overlay" onClick={closeSidebar} aria-label="Close navigation" />
      )}
      <aside
        id="primary-navigation"
        className={[
          'sidebar',
          isDesktop ? 'sidebar--desktop' : 'sidebar--mobile',
          isSidebarVisible ? 'sidebar--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="Primary navigation"
        aria-hidden={!isDesktop && !isSidebarOpen}
      >
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__mark" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="sidebar__title">TailAdmin</span>
              <span className="sidebar__subtitle">React edition</span>
            </div>
          </div>
          {!isDesktop && (
            <button type="button" className="sidebar__close" onClick={closeSidebar} aria-label="Close navigation">
              <X size={18} />
            </button>
          )}
        </div>
        <nav>
          <ul className="sidebar__nav">
            {NAVIGATION_ITEMS.map(item => (
              <li key={item.label}>
                <a
                  className={`sidebar__link${item.label === 'Overview' ? ' is-active' : ''}`}
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
        <div className="sidebar__footer">
          <div className="sidebar__footer-heading">
            <Target size={16} aria-hidden="true" />
            <span>Quarterly target</span>
          </div>
          <p className="sidebar__footer-body">
            Tracking ahead of plan. Maintain inbound cadence and delivery velocity.
          </p>
          <button type="button" className="sidebar__footer-action">
            <ArrowUpRight size={16} aria-hidden="true" />
            View playbook
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="topbar__menu"
            aria-label="Toggle navigation"
            aria-controls="primary-navigation"
            aria-expanded={isDesktop ? true : isSidebarOpen}
            onClick={toggleSidebar}
          >
            <Menu size={18} />
          </button>
          <div className="topbar__search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Search projects, clients, and docs" aria-label="Search dashboard" />
          </div>
          <div className="topbar__actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="user-pill" role="button" tabIndex={0} aria-label="Account menu">
              <div className="user-pill__avatar" aria-hidden="true">
                <Users size={16} />
              </div>
              <div className="user-pill__meta">
                <span className="user-pill__name">Nova Martinez</span>
                <span className="user-pill__role">Operations lead</span>
              </div>
              <ChevronDown size={16} aria-hidden="true" />
            </div>
          </div>
        </header>

        <main className="workspace__content">
          <section className="page-heading">
            <div>
              <span className="page-heading__eyebrow">TailAdmin React</span>
              <h1 className="page-heading__title">Control centre</h1>
              <p className="page-heading__description">{TIMEFRAME_DESCRIPTION[timeframe]}</p>
            </div>
            <div className="timeframe-toggle" role="group" aria-label="Select timeframe">
              {DASHBOARD_TIMEFRAMES.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`timeframe-toggle__button${option === timeframe ? ' is-active' : ''}`}
                  onClick={() => setTimeframe(option)}
                  aria-pressed={option === timeframe}
                >
                  {TIMEFRAME_LABELS[option]}
                </button>
              ))}
            </div>
          </section>

          <section className="metrics-grid">
            {snapshot.metrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </section>

          <div className="primary-grid">
            <RevenuePanel snapshot={snapshot} />
            <TeamList members={snapshot.team} />
          </div>

          <div className="secondary-grid">
            <PipelineTable items={snapshot.pipeline} />
            <div className="secondary-grid__column">
              <ChannelList channels={snapshot.channels} summary={snapshot.channelSummary} />
              <AnnouncementList items={snapshot.highlights} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
