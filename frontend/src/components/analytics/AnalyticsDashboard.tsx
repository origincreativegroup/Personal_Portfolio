import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Eye,BarChart3} from 'lucide-react'
import { cn } from '../../shared/utils'
import Card from '../ui/Card'
import Button from '../ui/Button'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

// ===== TYPES =====

interface AnalyticsData {
  overview: {
    totalViews: number
    totals: number
    totalUsers: number
    totalProjects: number
    viewsChange: number
    downloadsChange: number
    usersChange: number
    projectsChange: number
  }
  viewsOverTime: ChartData[]
  downloadsOverTime: ChartData[]
  topProjects: ChartData[]
  userActivity: ChartData[]
  deviceBreakdown: ChartData[]
  categoryBreakdown: ChartData[]
}

interface AnalyticsDashboardProps {
  className?: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
  onTimeRangeChange?: (range: string) => void
}

// ===== MOCK DATA =====

const generateMockData = (timeRange: string): AnalyticsData => {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
  const now = new Date()
  
  const viewsOverTime: ChartData[] = Array.from({ length: days }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (days - 1 - i))
    return {
      name: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 1000) + 500,
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 1000) + 500,
      uniqueViews: Math.floor(Math.random() * 800) + 300}
  })

  const downloadsOverTime: ChartData[] = Array.from({ length: days }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (days - 1 - i))
    return {
      name: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 200) + 50,
      date: date.toISOString().split('T')[0],
      downloads: Math.floor(Math.random() * 200) + 50,
      assets: Math.floor(Math.random() * 150) + 30}
  })

  const topProjects: ChartData[] = [
    { name: 'E-commerce Platform', value: 1250, views: 1250, downloads: 45, revenue: 2500 },
    { name: 'Mobile App Design', value: 980, views: 980, downloads: 32, revenue: 1800 },
    { name: 'Dashboard UI', value: 750, views: 750, downloads: 28, revenue: 1200 },
    { name: 'Brand Identity', value: 650, views: 650, downloads: 22, revenue: 900 },
    { name: 'Website Redesign', value: 520, views: 520, downloads: 18, revenue: 750 },
  ]

  const userActivity: ChartData[] = Array.from({ length: 24 }, (_, i) => ({
    name: `${i.toString().padStart(2, '0')}:00`,
    value: Math.floor(Math.random() * 50) + 10,
    hour: `${i.toString().padStart(2, '0')}:00`,
    activeUsers: Math.floor(Math.random() * 50) + 10,
    newUsers: Math.floor(Math.random() * 20) + 5}))

  const deviceBreakdown: ChartData[] = [
    { name: 'Desktop', value: 45, color: '#3b82f6' },
    { name: 'Mobile', value: 35, color: '#10b981' },
    { name: 'Tablet', value: 20, color: '#f59e0b' },
  ]

  const categoryBreakdown: ChartData[] = [
    { name: 'Web Design', value: 30, color: '#3b82f6' },
    { name: 'Mobile Apps', value: 25, color: '#10b981' },
    { name: 'Branding', value: 20, color: '#f59e0b' },
    { name: 'Illustration', value: 15, color: '#8b5cf6' },
    { name: 'Other', value: 10, color: '#06b6d4' },
  ]

  return {
    overview: {
      totalViews: 15420,
      totals: 1250,
      totalUsers: 890,
      totalProjects: 45,
      viewsChange: 12.5,
      downloadsChange: 8.3,
      usersChange: 15.2,
      projectsChange: 6.7},
    viewsOverTime,
    downloadsOverTime,
    topProjects,
    userActivity,
    deviceBreakdown,
    categoryBreakdown}
}

// ===== COMPONENT =====

export default function AnalyticsDashboard({
  className,
  timeRange = '30d',
  onTimeRangeChange}: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData(timeRange))
      setLoading(false)
    }, 1000)
  }, [timeRange])

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-surface dark:bg-surface-dark rounded-lg p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { overview } = data

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
  ]

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
            Analytics Dashboard
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            Track your portfolio performance and user engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={timeRange === option.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange?.(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Total Views</p>
                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                  {overview.totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <TrendingUp size={14} />
                  +{overview.viewsChange}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Eye size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">s</p>
                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                  {overview.totals.toLocaleString()}
                </p>
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <TrendingUp size={14} />
                  +{overview.downloadsChange}%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Users</p>
                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                  {overview.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <TrendingUp size={14} />
                  +{overview.usersChange}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Projects</p>
                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                  {overview.totalProjects}
                </p>
                <p className="text-sm text-green-500 flex items-center gap-1">
                  <TrendingUp size={14} />
                  +{overview.projectsChange}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <BarChart3 size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              Views Over Time
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Track your portfolio views and unique visitors
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Total Views" />
                  <Line type="monotone" dataKey="uniqueViews" stroke="#10b981" name="Unique Views" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/*s Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              Downloads Over Time
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Monitor asset downloads and engagement
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.downloadsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="downloads" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Downloads" />
                  <Area type="monotone" dataKey="assets" stackId="1" stroke="#10b981" fill="#10b981" name="Assets" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Top Projects */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              Top Performing Projects
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Your most popular projects by views and downloads
            </p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topProjects}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#3b82f6" name="Views" />
                  <Bar dataKey="downloads" fill="#10b981" name="Downloads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              Device Breakdown
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Traffic distribution across devices
            </p>
            <div className="h-[300px] flex items-center justify-center text-text-tertiary dark:text-text-tertiary-dark">
              Chart placeholder
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Full Width Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* UserHeatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              User Activity by Hour
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Track when your users are most active throughout the day
            </p>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="activeUsers" fill="#3b82f6" name="Active Users" />
                  <Bar dataKey="newUsers" fill="#10b981" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-2">
              Category Performance
            </h3>
            <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">
              Distribution of your work across different categories
            </p>
            <div className="h-[300px] flex items-center justify-center text-text-tertiary dark:text-text-tertiary-dark">
              Chart placeholder
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
