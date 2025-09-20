export type DashboardTimeframe = 'week' | 'month' | 'quarter' | 'year'

type MetricUnit = 'currency' | 'count' | 'percentage'

type Metric = {
  id: string
  label: string
  value: number
  unit: MetricUnit
  change: number
  direction: 'up' | 'down'
  description: string
}

type RevenuePoint = {
  label: string
  revenue: number
  profit: number
}

type OrderStatus = 'Completed' | 'In review' | 'In progress' | 'At risk'

type PipelineItem = {
  id: string
  client: string
  project: string
  amount: number
  status: OrderStatus
  dueDate: string
  progress: number
}

type TeamMember = {
  id: string
  name: string
  role: string
  avatarColor: string
  contributions: number
  focus: string
  hours: number
}

type ChannelPerformance = {
  id: string
  channel: string
  leads: number
  opportunities: number
  conversionRate: number
  trend: number
}

type Announcement = {
  id: string
  title: string
  message: string
  date: string
}

export type DashboardSnapshot = {
  timeframe: DashboardTimeframe
  metrics: Metric[]
  revenue: RevenueSummary
  pipeline: PipelineItem[]
  team: TeamMember[]
  channels: ChannelPerformance[]
  highlights: Announcement[]
  channelSummary: ChannelSummary
}

type RevenueSummary = {
  series: RevenuePoint[]
  totalRevenue: number
  totalProfit: number
  averageMargin: number
}

type ChannelSummary = {
  totalLeads: number
  strongestChannel: ChannelPerformance
  averageConversion: number
}

export const DASHBOARD_TIMEFRAMES: DashboardTimeframe[] = [
  'week',
  'month',
  'quarter',
  'year',
]

const DEFAULT_TIMEFRAME: DashboardTimeframe = 'month'

const METRIC_DATA: Record<DashboardTimeframe, Metric[]> = {
  week: [
    {
      id: 'revenue',
      label: 'Revenue',
      value: 48250,
      unit: 'currency',
      change: 12.6,
      direction: 'up',
      description: 'vs last week',
    },
    {
      id: 'active-clients',
      label: 'Active clients',
      value: 28,
      unit: 'count',
      change: 3.2,
      direction: 'up',
      description: '9 projects delivered on time',
    },
    {
      id: 'conversion',
      label: 'Proposal win rate',
      value: 37.4,
      unit: 'percentage',
      change: 1.4,
      direction: 'up',
      description: 'Improved follow-up cadence',
    },
    {
      id: 'utilisation',
      label: 'Team utilisation',
      value: 76,
      unit: 'percentage',
      change: 4.3,
      direction: 'down',
      description: 'Capacity available for rush work',
    },
  ],
  month: [
    {
      id: 'revenue',
      label: 'Revenue',
      value: 192400,
      unit: 'currency',
      change: 18.2,
      direction: 'up',
      description: 'vs last month',
    },
    {
      id: 'active-clients',
      label: 'Active clients',
      value: 42,
      unit: 'count',
      change: 6.5,
      direction: 'up',
      description: '12 new retainers won',
    },
    {
      id: 'conversion',
      label: 'Proposal win rate',
      value: 41.2,
      unit: 'percentage',
      change: 5.1,
      direction: 'up',
      description: 'Automation in outreach workflow',
    },
    {
      id: 'utilisation',
      label: 'Team utilisation',
      value: 83,
      unit: 'percentage',
      change: 2.8,
      direction: 'down',
      description: 'Hiring pipeline opened',
    },
  ],
  quarter: [
    {
      id: 'revenue',
      label: 'Revenue',
      value: 562900,
      unit: 'currency',
      change: 11.4,
      direction: 'up',
      description: 'vs previous quarter',
    },
    {
      id: 'active-clients',
      label: 'Active clients',
      value: 65,
      unit: 'count',
      change: 8.1,
      direction: 'up',
      description: 'Enterprise pipeline growth',
    },
    {
      id: 'conversion',
      label: 'Proposal win rate',
      value: 44.3,
      unit: 'percentage',
      change: 3.9,
      direction: 'up',
      description: 'Improved discovery process',
    },
    {
      id: 'utilisation',
      label: 'Team utilisation',
      value: 88,
      unit: 'percentage',
      change: 1.5,
      direction: 'down',
      description: 'Increased tooling efficiency',
    },
  ],
  year: [
    {
      id: 'revenue',
      label: 'Revenue',
      value: 2104300,
      unit: 'currency',
      change: 24.7,
      direction: 'up',
      description: 'Year over year',
    },
    {
      id: 'active-clients',
      label: 'Active clients',
      value: 112,
      unit: 'count',
      change: 15.4,
      direction: 'up',
      description: 'Portfolio diversification',
    },
    {
      id: 'conversion',
      label: 'Proposal win rate',
      value: 46.1,
      unit: 'percentage',
      change: 6.2,
      direction: 'up',
      description: 'Advisory services introduced',
    },
    {
      id: 'utilisation',
      label: 'Team utilisation',
      value: 86,
      unit: 'percentage',
      change: 3.7,
      direction: 'down',
      description: 'Scaled creative operations',
    },
  ],
}

const REVENUE_DATA: Record<DashboardTimeframe, RevenuePoint[]> = {
  week: [
    { label: 'Mon', revenue: 5800, profit: 2100 },
    { label: 'Tue', revenue: 6400, profit: 2600 },
    { label: 'Wed', revenue: 7200, profit: 2900 },
    { label: 'Thu', revenue: 6900, profit: 2700 },
    { label: 'Fri', revenue: 5400, profit: 2100 },
    { label: 'Sat', revenue: 4300, profit: 1700 },
    { label: 'Sun', revenue: 3650, profit: 1400 },
  ],
  month: [
    { label: 'Week 1', revenue: 42000, profit: 16300 },
    { label: 'Week 2', revenue: 45800, profit: 17200 },
    { label: 'Week 3', revenue: 51800, profit: 19100 },
    { label: 'Week 4', revenue: 52700, profit: 19800 },
  ],
  quarter: [
    { label: 'Jan', revenue: 172000, profit: 61500 },
    { label: 'Feb', revenue: 186500, profit: 67100 },
    { label: 'Mar', revenue: 204400, profit: 74200 },
  ],
  year: [
    { label: 'Q1', revenue: 552000, profit: 196200 },
    { label: 'Q2', revenue: 512600, profit: 184300 },
    { label: 'Q3', revenue: 516800, profit: 182900 },
    { label: 'Q4', revenue: 524900, profit: 187600 },
  ],
}

const PIPELINE_DATA: Record<DashboardTimeframe, PipelineItem[]> = {
  week: [
    {
      id: 'PX-1024',
      client: 'Atlas Fintech',
      project: 'Mobile banking onboarding',
      amount: 18200,
      status: 'In progress',
      dueDate: '2025-01-18',
      progress: 64,
    },
    {
      id: 'PX-1011',
      client: 'Greenline Energy',
      project: 'Analytics portal redesign',
      amount: 26800,
      status: 'In review',
      dueDate: '2025-01-15',
      progress: 82,
    },
    {
      id: 'PX-1008',
      client: 'Northwind Labs',
      project: 'Product launch microsite',
      amount: 9400,
      status: 'In progress',
      dueDate: '2025-01-22',
      progress: 47,
    },
  ],
  month: [
    {
      id: 'PX-1036',
      client: 'Stellar Networks',
      project: 'Enterprise dashboard system',
      amount: 74200,
      status: 'In progress',
      dueDate: '2025-02-04',
      progress: 58,
    },
    {
      id: 'PX-1021',
      client: 'Helix Bio',
      project: 'Clinical research workspace',
      amount: 52300,
      status: 'In review',
      dueDate: '2025-01-28',
      progress: 76,
    },
    {
      id: 'PX-1014',
      client: 'Marble & Co.',
      project: 'Immersive showroom experience',
      amount: 38600,
      status: 'Completed',
      dueDate: '2024-12-19',
      progress: 100,
    },
    {
      id: 'PX-1009',
      client: 'Nimbus Aviation',
      project: 'Brand system expansion',
      amount: 24800,
      status: 'At risk',
      dueDate: '2025-02-11',
      progress: 35,
    },
  ],
  quarter: [
    {
      id: 'PX-1055',
      client: 'Silverline Logistics',
      project: 'Operations control tower',
      amount: 98200,
      status: 'In progress',
      dueDate: '2025-03-30',
      progress: 44,
    },
    {
      id: 'PX-1042',
      client: 'Cardinal Health',
      project: 'Supply planning suite',
      amount: 117400,
      status: 'In review',
      dueDate: '2025-04-12',
      progress: 61,
    },
    {
      id: 'PX-1031',
      client: 'Aurora Travel',
      project: 'Omnichannel booking platform',
      amount: 84600,
      status: 'Completed',
      dueDate: '2024-11-18',
      progress: 100,
    },
    {
      id: 'PX-1026',
      client: 'Brightwave Retail',
      project: 'Store analytics dashboard',
      amount: 58600,
      status: 'At risk',
      dueDate: '2025-03-14',
      progress: 28,
    },
  ],
  year: [
    {
      id: 'PX-1108',
      client: 'Blue Horizon',
      project: 'Customer intelligence platform',
      amount: 186400,
      status: 'In progress',
      dueDate: '2025-06-22',
      progress: 31,
    },
    {
      id: 'PX-1099',
      client: 'Vector Manufacturing',
      project: 'Predictive maintenance system',
      amount: 164800,
      status: 'In review',
      dueDate: '2025-07-09',
      progress: 48,
    },
    {
      id: 'PX-1084',
      client: 'Evergreen Foods',
      project: 'Supply chain visualisation',
      amount: 121900,
      status: 'Completed',
      dueDate: '2024-10-28',
      progress: 100,
    },
    {
      id: 'PX-1072',
      client: 'Harbor Insurance',
      project: 'Claims automation suite',
      amount: 143200,
      status: 'At risk',
      dueDate: '2025-05-17',
      progress: 39,
    },
  ],
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team-1',
    name: 'Nova Martinez',
    role: 'Design Lead',
    avatarColor: '#6366f1',
    contributions: 24,
    focus: 'Research synthesis',
    hours: 32,
  },
  {
    id: 'team-2',
    name: 'Mikael Chen',
    role: 'Product Strategist',
    avatarColor: '#ec4899',
    contributions: 18,
    focus: 'Roadmap planning',
    hours: 29,
  },
  {
    id: 'team-3',
    name: 'Priya Patel',
    role: 'Engineering Manager',
    avatarColor: '#22d3ee',
    contributions: 31,
    focus: 'Platform acceleration',
    hours: 36,
  },
  {
    id: 'team-4',
    name: 'Caleb Wright',
    role: 'Delivery Partner',
    avatarColor: '#f97316',
    contributions: 15,
    focus: 'Client onboarding',
    hours: 21,
  },
]

const CHANNEL_DATA: Record<DashboardTimeframe, ChannelPerformance[]> = {
  week: [
    { id: 'channel-1', channel: 'Referrals', leads: 28, opportunities: 14, conversionRate: 0.48, trend: 6.2 },
    { id: 'channel-2', channel: 'Newsletter', leads: 32, opportunities: 12, conversionRate: 0.37, trend: 3.8 },
    { id: 'channel-3', channel: 'LinkedIn', leads: 21, opportunities: 9, conversionRate: 0.42, trend: 4.9 },
  ],
  month: [
    { id: 'channel-1', channel: 'Referrals', leads: 132, opportunities: 68, conversionRate: 0.52, trend: 7.4 },
    { id: 'channel-2', channel: 'Webinars', leads: 96, opportunities: 42, conversionRate: 0.44, trend: 5.3 },
    { id: 'channel-3', channel: 'LinkedIn', leads: 84, opportunities: 33, conversionRate: 0.39, trend: 4.8 },
    { id: 'channel-4', channel: 'Newsletter', leads: 102, opportunities: 36, conversionRate: 0.35, trend: 3.6 },
  ],
  quarter: [
    { id: 'channel-1', channel: 'Referrals', leads: 384, opportunities: 182, conversionRate: 0.47, trend: 6.9 },
    { id: 'channel-2', channel: 'Enterprise events', leads: 266, opportunities: 121, conversionRate: 0.46, trend: 7.1 },
    { id: 'channel-3', channel: 'LinkedIn', leads: 218, opportunities: 84, conversionRate: 0.39, trend: 4.3 },
    { id: 'channel-4', channel: 'Advisory content', leads: 204, opportunities: 77, conversionRate: 0.38, trend: 4.9 },
  ],
  year: [
    { id: 'channel-1', channel: 'Referrals', leads: 1340, opportunities: 612, conversionRate: 0.46, trend: 6.2 },
    { id: 'channel-2', channel: 'Partnerships', leads: 986, opportunities: 418, conversionRate: 0.42, trend: 5.5 },
    { id: 'channel-3', channel: 'Thought leadership', leads: 842, opportunities: 307, conversionRate: 0.36, trend: 4.3 },
    { id: 'channel-4', channel: 'Paid media', leads: 764, opportunities: 268, conversionRate: 0.31, trend: 3.1 },
  ],
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'announce-1',
    title: 'January reporting window',
    message: 'Submit partner performance scorecards by 21 January. Templates are pre-filled with CRM metrics.',
    date: '2025-01-12',
  },
  {
    id: 'announce-2',
    title: 'Growth playbook 2.1',
    message: 'New discovery scripts and objection handling flows are now available in the enablement hub.',
    date: '2025-01-10',
  },
  {
    id: 'announce-3',
    title: 'Design asset refresh',
    message: 'Updated TailAdmin illustration set launched to marketing. Use v2 components for all paid channels.',
    date: '2025-01-08',
  },
]

const getValidTimeframe = (timeframe?: DashboardTimeframe | string | null): DashboardTimeframe => {
  if (timeframe && DASHBOARD_TIMEFRAMES.includes(timeframe as DashboardTimeframe)) {
    return timeframe as DashboardTimeframe
  }
  return DEFAULT_TIMEFRAME
}

const sumNumbers = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0)

const computeRevenueSummary = (series: RevenuePoint[]): RevenueSummary => {
  const totalRevenue = sumNumbers(series.map(point => point.revenue))
  const totalProfit = sumNumbers(series.map(point => point.profit))
  const averageMargin = series.length === 0 ? 0 : Math.round((totalProfit / totalRevenue) * 100)
  return {
    series,
    totalRevenue,
    totalProfit,
    averageMargin: Number.isFinite(averageMargin) ? averageMargin : 0,
  }
}

const computeChannelSummary = (channels: ChannelPerformance[]): ChannelSummary => {
  if (channels.length === 0) {
    return {
      totalLeads: 0,
      strongestChannel: {
        id: 'channel-empty',
        channel: 'No data',
        leads: 0,
        opportunities: 0,
        conversionRate: 0,
        trend: 0,
      },
      averageConversion: 0,
    }
  }

  const totalLeads = sumNumbers(channels.map(channel => channel.leads))
  const strongestChannel = [...channels].sort(
    (a, b) => b.conversionRate * b.opportunities - a.conversionRate * a.opportunities,
  )[0]
  const averageConversion =
    channels.reduce((total, channel) => total + channel.conversionRate, 0) / channels.length

  return {
    totalLeads,
    strongestChannel,
    averageConversion: Math.round(averageConversion * 1000) / 10,
  }
}

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value)

export const formatPercentage = (value: number): string => {
  const normalised = value > 1 ? value : value * 100
  return `${Math.round(normalised * 10) / 10}%`
}

export const buildDashboardSnapshot = (timeframe?: DashboardTimeframe | string | null): DashboardSnapshot => {
  const safeTimeframe = getValidTimeframe(timeframe)
  const metrics = METRIC_DATA[safeTimeframe]
  const revenueSeries = REVENUE_DATA[safeTimeframe]
  const pipeline = PIPELINE_DATA[safeTimeframe]
  const channels = CHANNEL_DATA[safeTimeframe]

  return {
    timeframe: safeTimeframe,
    metrics,
    revenue: computeRevenueSummary(revenueSeries),
    pipeline,
    team: TEAM_MEMBERS,
    channels,
    highlights: ANNOUNCEMENTS,
    channelSummary: computeChannelSummary(channels),
  }
}

export type { Metric, RevenuePoint, PipelineItem, TeamMember, ChannelPerformance, Announcement, RevenueSummary, ChannelSummary }
export { DEFAULT_TIMEFRAME as defaultDashboardTimeframe, ANNOUNCEMENTS as dashboardAnnouncements }
