import { useState, useMemo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Grid3X3, 
  List, 
  Filter, 
  Search, 
  SortAsc, 
  SortDesc,
  Eye,
  Heart,
  Share2,
  Edit,
  Plus,
  X
} from 'lucide-react'
import { cn } from '../../shared/utils'
import ModernButton from '../ui/ModernButton'
import ModernInput from '../ui/ModernInput'
import ProjectCard from './ProjectCard'
import CaseStudyCard from './CaseStudyCard'
import { 
  Project, 
  CaseStudy, 
  PortfolioFilter, 
  SortOption, 
  PortfolioLayout,
  ProjectCardVariant,
  CaseStudyVariant 
} from '../../types/portfolio'

// ===== TYPES =====

interface PortfolioGridProps {
  projects: Project[]
  caseStudies: CaseStudy[]
  className?: string
  layout?: PortfolioLayout
  showFilters?: boolean
  showSearch?: boolean
  showSort?: boolean
  showActions?: boolean
  enableAnimations?: boolean
  itemsPerPage?: number
  onProjectView?: (project: Project) => void
  onProjectEdit?: (project: Project) => void
  onProjectLike?: (project: Project) => void
  onProjectShare?: (project: Project) => void
  onCaseStudyView?: (caseStudy: CaseStudy) => void
  onCaseStudyEdit?: (caseStudy: CaseStudy) => void
  onCaseStudyLike?: (caseStudy: CaseStudy) => void
  onCaseStudyShare?: (caseStudy: CaseStudy) => void
  onAddProject?: () => void
  onAddCaseStudy?: () => void
}

// ===== UTILITIES =====

const getLayoutClasses = (layout: PortfolioLayout, columns: number) => {
  switch (layout) {
    case 'grid':
      return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`
    case 'masonry':
      return 'columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'
    case 'carousel':
      return 'flex overflow-x-auto gap-6 pb-4'
    case 'timeline':
      return 'space-y-8'
    default:
      return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`
  }
}

const getCardVariant = (layout: PortfolioLayout): ProjectCardVariant => {
  switch (layout) {
    case 'masonry':
      return 'minimal'
    case 'carousel':
      return 'default'
    case 'timeline':
      return 'detailed'
    default:
      return 'default'
  }
}

const getCaseStudyVariant = (layout: PortfolioLayout): CaseStudyVariant => {
  switch (layout) {
    case 'masonry':
      return 'preview'
    case 'carousel':
      return 'card'
    case 'timeline':
      return 'full'
    default:
      return 'card'
  }
}

// ===== COMPONENT =====

export default function PortfolioGrid({
  projects,
  caseStudies,
  className,
  layout = 'grid',
  showFilters = true,
  showSearch = true,
  showSort = true,
  showActions = true,
  enableAnimations = true,
  itemsPerPage = 12,
  onProjectView,
  onProjectEdit,
  onProjectLike,
  onProjectShare,
  onCaseStudyView,
  onCaseStudyEdit,
  onCaseStudyLike,
  onCaseStudyShare,
  onAddProject,
  onAddCaseStudy,
}: PortfolioGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>({ field: 'createdAt', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // Get unique categories
  const categories = useMemo(() => {
    const projectCategories = projects.map(p => p.category)
    const caseStudyCategories = caseStudies.map(c => c.projectId) // Assuming case studies inherit project categories
    return Array.from(new Set([...projectCategories, ...caseStudyCategories]))
  }, [projects, caseStudies])

  // Get unique statuses
  const statuses = useMemo(() => {
    const projectStatuses = projects.map(p => p.status)
    const caseStudyStatuses = caseStudies.map(c => c.status)
    return Array.from(new Set([...projectStatuses, ...caseStudyStatuses]))
  }, [projects, caseStudies])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...projects, ...caseStudies]

    // Search filter
    if (searchTerm) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory) {
      items = items.filter(item => 
        'category' in item ? item.category === selectedCategory : true
      )
    }

    // Status filter
    if (selectedStatus) {
      items = items.filter(item => item.status === selectedStatus)
    }

    // Featured filter
    if (showFeaturedOnly) {
      items = items.filter(item => item.featured)
    }

    // Sort
    items.sort((a, b) => {
      const aValue = a[sortBy.field] as string | number
      const bValue = b[sortBy.field] as string | number
      
      if (sortBy.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return items
  }, [projects, caseStudies, searchTerm, selectedCategory, selectedStatus, showFeaturedOnly, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortOption['field']) => {
    setSortBy(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedStatus('')
    setShowFeaturedOnly(false)
    setCurrentPage(1)
  }

  const activeFiltersCount = [searchTerm, selectedCategory, selectedStatus, showFeaturedOnly].filter(Boolean).length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
            Portfolio
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark">
            {filteredItems.length} items • {projects.length} projects • {caseStudies.length} case studies
          </p>
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <ModernButton
              variant="outline"
              onClick={onAddProject}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Project
            </ModernButton>
            <ModernButton
              variant="outline"
              onClick={onAddCaseStudy}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Case Study
            </ModernButton>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        {showSearch && (
          <div className="flex-1">
            <ModernInput
              placeholder="Search projects and case studies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              className="w-full"
            />
          </div>
        )}

        {/* Layout Toggle */}
        <div className="flex items-center gap-2">
          <ModernButton
            variant={layout === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {/* Handle layout change */}}
          >
            <Grid3X3 size={16} />
          </ModernButton>
          <ModernButton
            variant={layout === 'masonry' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {/* Handle layout change */}}
          >
            <List size={16} />
          </ModernButton>
        </div>

        {/* Filters Toggle */}
        {showFilters && (
          <ModernButton
            variant="outline"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className="relative"
          >
            <Filter size={16} />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </ModernButton>
        )}

        {/* Sort */}
        {showSort && (
          <div className="flex items-center gap-2">
            <select
              value={`${sortBy.field}-${sortBy.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-') as [SortOption['field'], 'asc' | 'desc']
                setSortBy({ field, direction })
              }}
              className="px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="updatedAt-desc">Recently Updated</option>
            </select>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary dark:text-text-primary-dark">Filters</h3>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-text-tertiary dark:text-text-tertiary-dark"
                  >
                    Clear All
                  </ModernButton>
                )}
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFiltersPanel(false)}
                >
                  <X size={16} />
                </ModernButton>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Featured Filter */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured-only"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-surface dark:bg-surface-dark border-border dark:border-border-dark rounded focus:ring-primary-500"
                />
                <label htmlFor="featured-only" className="text-sm text-text-primary dark:text-text-primary-dark">
                  Featured Only
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className={getLayoutClasses(layout, 3)}>
        <AnimatePresence>
          {paginatedItems.map((item, index) => {
            const isProject = 'category' in item
            const animationDelay = enableAnimations ? index * 0.1 : 0

            if (isProject) {
              return (
                <ProjectCard
                  key={`project-${item.id}`}
                  project={item as Project}
                  variant={getCardVariant(layout)}
                  onView={onProjectView}
                  onEdit={onProjectEdit}
                  onLike={onProjectLike}
                  onShare={onProjectShare}
                  animationDelay={animationDelay}
                  enableHover={enableAnimations}
                  enableClick={true}
                />
              )
            } else {
              return (
                <CaseStudyCard
                  key={`casestudy-${item.id}`}
                  caseStudy={item as CaseStudy}
                  variant={getCaseStudyVariant(layout)}
                  onView={onCaseStudyView}
                  onEdit={onCaseStudyEdit}
                  onLike={onCaseStudyLike}
                  onShare={onCaseStudyShare}
                  animationDelay={animationDelay}
                  enableHover={enableAnimations}
                  enableClick={true}
                />
              )
            }
          })}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </ModernButton>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <ModernButton
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </ModernButton>
            ))}
          </div>

          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </ModernButton>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
            No items found
          </h3>
          <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
            {activeFiltersCount > 0 
              ? 'Try adjusting your filters to see more results.'
              : 'Start by adding your first project or case study.'
            }
          </p>
          {activeFiltersCount > 0 ? (
            <ModernButton variant="outline" onClick={clearFilters}>
              Clear Filters
            </ModernButton>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ModernButton variant="primary" onClick={onAddProject}>
                <Plus size={16} className="mr-2" />
                Add Project
              </ModernButton>
              <ModernButton variant="outline" onClick={onAddCaseStudy}>
                <Plus size={16} className="mr-2" />
                Add Case Study
              </ModernButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
