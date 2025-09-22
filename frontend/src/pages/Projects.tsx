import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  User, 
  Search,
  Filter,
  Eye,
  Edit3,
  MoreVertical,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react'
import Button from '../components/ui/Button'
import { PageHeader } from '../components/navigation/Breadcrumbs'
import MetricCard from '../components/dashboard/MetricCard'

// Enhanced mock projects data
const mockProjects = [
  {
    id: '1',
    slug: 'ecommerce-platform-redesign',
    title: 'E-commerce Platform Redesign',
    client: 'TechCorp Inc.',
    summary: 'Complete UX overhaul of the main shopping platform resulting in 40% increase in conversion rates and improved user satisfaction.',
    status: 'published',
    category: 'UX Design',
    tags: ['E-commerce', 'UX Design', 'React', 'Conversion Optimization'],
    lastModified: '2024-01-15T10:30:00Z',
    author: 'John Doe',
    assets: 12,
    caseStudyReady: true,
    featured: true
  },
  {
    id: '2', 
    slug: 'mobile-app-ux-research',
    title: 'Mobile App UX Research',
    client: 'StartupXYZ',
    summary: 'Comprehensive user research and usability testing for a fintech mobile application, leading to improved user flows.',
    status: 'in-progress',
    category: 'Research',
    tags: ['Research', 'Mobile', 'Fintech', 'User Testing'],
    lastModified: '2024-01-10T14:20:00Z',
    author: 'Jane Smith',
    assets: 8,
    caseStudyReady: false,
    featured: false
  },
  {
    id: '3',
    slug: 'brand-identity-system',
    title: 'Brand Identity System',
    client: 'CreativeCo',
    summary: 'Complete brand identity redesign including logo, color palette, typography, and brand guidelines for a creative agency.',
    status: 'review',
    category: 'Branding',
    tags: ['Branding', 'Logo Design', 'Identity', 'Creative'],
    lastModified: '2024-01-12T09:15:00Z',
    author: 'Mike Johnson',
    assets: 15,
    caseStudyReady: true,
    featured: false
  },
  {
    id: '4',
    slug: 'data-visualization-dashboard',
    title: 'Data Visualization Dashboard',
    client: 'DataCorp',
    summary: 'Interactive dashboard for business intelligence with real-time data visualization and custom reporting features.',
    status: 'draft',
    category: 'Development',
    tags: ['Dashboard', 'Data Viz', 'React', 'D3.js'],
    lastModified: '2024-01-08T16:45:00Z',
    author: 'Sarah Wilson',
    assets: 6,
    caseStudyReady: false,
    featured: false
  }
]

const statusConfig = {
  'published': { 
    label: 'Published', 
    icon: CheckCircle2, 
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50'
  },
  'in-progress': { 
    label: 'In Progress', 
    icon: Clock, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50'
  },
  'review': { 
    label: 'Review', 
    icon: AlertCircle, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgColor: 'bg-yellow-50'
  },
  'draft': { 
    label: 'Draft', 
    icon: FileText, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50'
  }
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return formatDate(dateString)
}

export default function Projects() {
  const [projects] = useState(mockProjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: projects.length,
    published: projects.filter(p => p.status === 'published').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    featured: projects.filter(p => p.featured).length
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Project Portfolio"
          subtitle="Manage your case studies and portfolio projects"
          actions={
            <>
              <Button
                as={Link}
                to="/assets"
                variant="outline"
                icon={<Tag className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Asset Library
              </Button>
              <Button
                as={Link}
                to="/projects/new"
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                New Project
              </Button>
            </>
          }
        />

        <div className="container-responsive py-6 lg:py-8">
          <main className="space-y-6 lg:space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  metric={{
                    label: 'Total Projects',
                    value: stats.total,
                    change: 12.5,
                    direction: 'up',
                    description: 'Portfolio projects',
                    icon: FolderOpen
                  }}
                  variant="default"
                />
                <MetricCard
                  metric={{
                    label: 'Published',
                    value: stats.published,
                    change: 8.3,
                    direction: 'up',
                    description: 'Live case studies',
                    icon: CheckCircle2
                  }}
                  variant="success"
                />
                <MetricCard
                  metric={{
                    label: 'In Progress',
                    value: stats.inProgress,
                    change: 15.2,
                    direction: 'up',
                    description: 'Active projects',
                    icon: Clock
                  }}
                  variant="warning"
                />
                <MetricCard
                  metric={{
                    label: 'Featured',
                    value: stats.featured,
                    change: 5.1,
                    direction: 'up',
                    description: 'Highlighted projects',
                    icon: Tag
                  }}
                  variant="info"
                />
              </div>

              {/* Search and Filters */}
              <div className="bg-surface border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">All Projects</h2>
                    <p className="text-text-secondary">{filteredProjects.length} of {projects.length} projects</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`px-4 py-2 rounded-lg border transition-all duration-200 font-medium flex items-center gap-2 interactive ${
                        showFilters
                          ? 'bg-primary-100 text-primary-700 border-primary-300'
                          : 'border-border hover:bg-surface-secondary hover:border-border-hover'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      Filters
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, clients, or tags..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors text-text-primary placeholder-text-tertiary"
                  />
                </div>

                {/* Filters Panel */}
                {showFilters && (
                  <div className="border border-border rounded-lg p-4 mb-6 bg-surface-elevated">
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface text-text-primary"
                        >
                          <option value="all">All Statuses</option>
                          <option value="published">Published</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setStatusFilter('all')
                        }}
                        className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium interactive"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Projects List */}
              <div className="space-y-4">
                {filteredProjects.length === 0 ? (
                  <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                      {searchQuery || statusFilter !== 'all' ? 'No matching projects' : 'No projects yet'}
                    </h3>
                    <p className="text-text-secondary mb-6">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters to find what you\'re looking for.'
                        : 'Get started by creating your first case study project.'
                      }
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button as={Link} to="/projects/new" variant="primary" icon={<Plus className="w-4 h-4" />}>
                        Create First Project
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredProjects.map((project) => {
                    const statusInfo = statusConfig[project.status as keyof typeof statusConfig]
                    const StatusIcon = statusInfo.icon

                    return (
                      <div key={project.id} className="bg-surface border border-border rounded-2xl p-6 hover:shadow-md transition-all duration-200 hover-lift">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-text-primary">{project.title}</h3>
                              {project.featured && (
                                <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-warning-400 to-warning-500 text-white rounded-full">
                                  Featured
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-text-secondary mb-3 leading-relaxed">{project.summary}</p>

                            <div className="flex items-center gap-6 text-sm text-text-tertiary mb-3">
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{project.client}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Updated {formatRelativeTime(project.lastModified)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>{project.assets} assets</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${project.caseStudyReady ? 'bg-success-500' : 'bg-warning-500'}`} />
                                <span>{project.caseStudyReady ? 'Case study ready' : 'Needs case study'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{project.category}</span>
                              <div className="flex flex-wrap gap-1">
                                {project.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-2 py-1 text-xs bg-surface-secondary text-text-secondary rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                                {project.tags.length > 3 && (
                                  <span className="px-2 py-1 text-xs bg-surface-secondary text-text-tertiary rounded-full">
                                    +{project.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-6">
                            <Button
                              as={Link}
                              to={`/projects/${project.slug}/view`}
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                            >
                              View
                            </Button>
                            <Button
                              as={Link}
                              to={`/projects/${project.slug}/edit`}
                              variant="outline"
                              size="sm"
                              icon={<Edit3 className="w-4 h-4" />}
                            >
                              Edit
                            </Button>
                            <button className="p-2 hover:bg-surface-secondary rounded-lg transition-colors interactive">
                              <MoreVertical className="w-4 h-4 text-text-secondary" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </main>
          </div>
        </div>
      </>
    )
}