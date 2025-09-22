import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Plus,
  FileText,
  FolderOpen,
  HardDrive,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Calendar,
  AlertCircle,
  Eye,
  Download,
  Settings,
  Bell,
  Search
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useProjectData } from '../hooks/useProjectData'
import ProjectIntakeWizard from '../components/intake/ProjectIntakeWizard'
import AIDashboard from '../components/ai/AIDashboard'

interface MetricData {
  id: string
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: any
  description: string
  color: string
}

interface ProjectStatus {
  name: string
  count: number
  color: string
  icon: any
}

export default function EnhancedDashboard() {
  const { projects, stats, activities, loading, createProject } = useProjectData()
  const [showIntakeWizard, setShowIntakeWizard] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')


  // Filter projects based on search and status
  const filteredProjects = Array.isArray(projects) ? projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesStatus
  }) : []

  // Get recent projects (last 5)
  const recentProjects = filteredProjects.slice(0, 5)

  // Get projects by status
  const projectsByStatus = {
    'in-progress': projects.filter(p => p.status === 'in-progress').length,
    'review': projects.filter(p => p.status === 'review').length,
    'published': projects.filter(p => p.status === 'published').length,
    'draft': projects.filter(p => p.status === 'draft').length
  }

  // Get overdue projects
  const overdueProjects = projects.filter(project => {
    if (!project.endDate) return false
    return new Date(project.endDate) < new Date() && project.status !== 'published'
  })

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = projects.filter(project => {
    if (!project.endDate) return false
    const endDate = new Date(project.endDate)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0 && project.status !== 'published'
  })

  // Metrics data
  const metrics: MetricData[] = [
    {
      id: '1',
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      change: '+12%',
      changeType: 'positive',
      icon: FolderOpen,
      description: 'Active and completed projects',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: '2',
      title: 'Active Projects',
      value: stats?.activeProjects || 0,
      change: '+5%',
      changeType: 'positive',
      icon: Activity,
      description: 'Currently in progress',
      color: 'from-green-500 to-green-600'
    },
    {
      id: '3',
      title: 'Total Assets',
      value: stats?.totalAssets || 0,
      change: '+23%',
      changeType: 'positive',
      icon: HardDrive,
      description: 'Images, videos, and documents',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: '4',
      title: 'Team Members',
      value: projects.reduce((sum, p) => sum + p.teamSize, 0),
      change: '+2',
      changeType: 'positive',
      icon: Users,
      description: 'Active team members',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: '5',
      title: 'Total Budget',
      value: `$${(stats?.totalBudget || 0).toLocaleString()}`,
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      description: 'Combined project budgets',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: '6',
      title: 'Completion Rate',
      value: `${Math.round(((stats?.completedProjects || 0) / (stats?.totalProjects || 1)) * 100)}%`,
      change: '+3%',
      changeType: 'positive',
      icon: Target,
      description: 'Projects completed on time',
      color: 'from-purple-500 to-purple-600'
    }
  ]

  // Project status data
  const projectStatuses: ProjectStatus[] = [
    { name: 'In Progress', count: projectsByStatus['in-progress'], color: 'text-blue-500', icon: Activity },
    { name: 'In Review', count: projectsByStatus['review'], color: 'text-yellow-500', icon: Eye },
    { name: 'Published', count: projectsByStatus['published'], color: 'text-green-500', icon: CheckCircle2 },
    { name: 'Draft', count: projectsByStatus['draft'], color: 'text-gray-500', icon: FileText }
  ]

  // Quick actions
  const quickActions = [
    { 
      id: '1', 
      title: 'New Project', 
      description: 'Start a new project', 
      icon: Plus, 
      color: 'from-blue-500 to-purple-600', 
      action: () => setShowIntakeWizard(true) 
    },
    { 
      id: '2', 
      title: 'Upload Assets', 
      description: 'Add images and files', 
      icon: HardDrive, 
      color: 'from-green-500 to-teal-600', 
      action: () => window.location.href = '/assets' 
    },
    { 
      id: '3', 
      title: 'View Analytics', 
      description: 'Check project insights', 
      icon: BarChart3, 
      color: 'from-purple-500 to-pink-600', 
      action: () => window.location.href = '/analytics' 
    },
    { 
      id: '4', 
      title: 'Team Overview', 
      description: 'Manage team members', 
      icon: Users, 
      color: 'from-orange-500 to-red-600', 
      action: () => window.location.href = '/team' 
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening with your projects.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="published">Published</option>
              </select>

              <Button
                variant="primary"
                onClick={() => setShowIntakeWizard(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts */}
        {(overdueProjects.length > 0 || upcomingDeadlines.length > 0) && (
          <div className="mb-8 space-y-4">
            {overdueProjects.length > 0 && (
              <Card className="border-red-200 bg-red-50 p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-primary-800">AI Tools</h3>
                    <p className="text-sm text-primary-600">
                      {overdueProjects.length} AI-powered feature{overdueProjects.length > 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {upcomingDeadlines.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Upcoming Deadlines</h3>
                    <p className="text-sm text-yellow-600">
                      {upcomingDeadlines.length} project{upcomingDeadlines.length > 1 ? 's' : ''} due in the next 7 days
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Card
                key={action.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm"
                onClick={action.action}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {metrics.map((metric) => (
              <Card key={metric.id} className="p-4 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${metric.color} flex items-center justify-center`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'positive' ? 'text-green-600' : 
                    metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{metric.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Projects</h2>
                <Link to="/projects" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </Link>
              </div>

              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No projects found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery || filterStatus !== 'all' 
                      ? 'No projects match your current filters.' 
                      : 'Get started by creating your first project.'
                    }
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowIntakeWizard(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status.replace('-', ' ')}
                          </span>
                          <span className={`text-xs ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{project.client}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Progress: {project.progress}%</span>
                          <span>Due: {formatDate(project.endDate)}</span>
                          <span>Team: {project.teamSize}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link to={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Project Status & Activities */}
          <div className="space-y-6">
            {/* Project Status */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Status</h2>
              <div className="space-y-3">
                {projectStatuses.map((status) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <status.icon className={`w-5 h-5 ${status.color}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{status.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{status.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.user} • {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* AI Dashboard Section */}
        <div className="mt-8">
          <AIDashboard 
            assets={[]} // Mock data - in real app, this would come from props or context
            projects={[]} // Mock data - in real app, this would come from props or context
          />
        </div>
      </div>

      {/* Project Intake Wizard Modal */}
      {showIntakeWizard && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowIntakeWizard(false)} />
            <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              <ProjectIntakeWizard
                onComplete={(data) => {
                  console.log('Project created:', data)
                  setShowIntakeWizard(false)
                  // Here you would typically call createProject(data)
                }}
                onCancel={() => {
                  console.log('Project creation cancelled')
                  setShowIntakeWizard(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
