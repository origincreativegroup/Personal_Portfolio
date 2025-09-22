import { CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react'

export interface ProjectStatus {
  id: string
  title: string
  status: 'completed' | 'in-progress' | 'at-risk' | 'draft'
  progress: number
  dueDate: string
  client?: string
  budget?: number
}

interface ProjectStatusCardProps {
  projects: ProjectStatus[]
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Completed'
  },
  'in-progress': {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'In Progress'
  },
  'at-risk': {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'At Risk'
  },
  draft: {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    label: 'Draft'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function ProjectStatusCard({ projects }: ProjectStatusCardProps) {
  const completedCount = projects.filter(p => p.status === 'completed').length

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Project Pipeline</h2>
          <p className="text-text-secondary">Active projects and delivery status</p>
        </div>
        <div className="flex items-center gap-2 text-success-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{completedCount} completed</span>
        </div>
      </div>

      <div className="space-y-4 h-full overflow-y-auto">
        {projects.map((project) => {
          const config = statusConfig[project.status]
          const Icon = config.icon

          return (
            <div key={project.id} className="p-4 border border-border rounded-xl hover:shadow-sm transition-all hover:bg-surface-elevated">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary truncate">{project.title}</h3>
                    {project.client && (
                      <p className="text-sm text-text-secondary truncate">{project.client}</p>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.bgColor} ${config.color}`}>
                    {config.label}
                  </span>
                  {project.budget && (
                    <p className="text-sm font-medium mt-1 text-text-primary">
                      {formatCurrency(project.budget)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Progress</span>
                  <span className="text-text-primary font-medium">{project.progress}%</span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="text-xs text-text-tertiary">
                  Due {formatDate(project.dueDate)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}