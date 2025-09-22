import { useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Heart, 
  Share2, 
  ExternalLink, 
  Calendar, 
  Tag, 
  User, 
  Clock,
  ArrowRight,
  Play,
  Image as ImageIcon,
  Video,
  FileText,
  Code,
  Palette
} from 'lucide-react'
import { cn } from '../../shared/utils'
import ModernCard from '../ui/ModernCard'
import ModernButton from '../ui/ModernButton'
import { Project, ProjectCardVariant, ProjectAsset } from '../../types/portfolio'

// ===== TYPES =====

interface ProjectCardProps {
  project: Project
  variant?: ProjectCardVariant
  className?: string
  onView?: (project: Project) => void
  onEdit?: (project: Project) => void
  onLike?: (project: Project) => void
  onShare?: (project: Project) => void
  showActions?: boolean
  showMetrics?: boolean
  showDescription?: boolean
  showTags?: boolean
  showMetadata?: boolean
  animationDelay?: number
  enableHover?: boolean
  enableClick?: boolean
}

// ===== UTILITIES =====

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <ImageIcon size={16} />
    case 'video':
      return <Video size={16} />
    case 'audio':
      return <Play size={16} />
    case 'document':
      return <FileText size={16} />
    case 'interactive':
      return <Code size={16} />
    default:
      return <ImageIcon size={16} />
  }
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'web design':
    case 'ui/ux':
      return <Code size={16} />
    case 'branding':
    case 'identity':
      return <Palette size={16} />
    case 'illustration':
    case 'graphic design':
      return <ImageIcon size={16} />
    case 'photography':
      return <ImageIcon size={16} />
    case 'video':
    case 'motion':
      return <Video size={16} />
    default:
      return <FileText size={16} />
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'text-green-500 bg-green-100 dark:bg-green-900'
    case 'draft':
      return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900'
    case 'archived':
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900'
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900'
  }
}

// ===== COMPONENT =====

export default function ProjectCard({
  project,
  variant = 'default',
  className,
  onView,
  onEdit,
  onLike,
  onShare,
  showActions = true,
  showMetrics = true,
  showDescription = true,
  showTags = true,
  showMetadata = true,
  animationDelay = 0,
  enableHover = true,
  enableClick = true,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handleClick = () => {
    if (enableClick && onView) {
      onView(project)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    if (onLike) {
      onLike(project)
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(project)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(project)
    }
  }

  // Get hero asset or first asset
  const heroAsset = project.assets.find(asset => asset.isHero) || project.assets[0]
  
  // Count assets by type
  const assetCounts = project.assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const cardVariants = {
    default: 'p-0 overflow-hidden',
    minimal: 'p-4',
    detailed: 'p-6',
    hero: 'p-0 overflow-hidden min-h-[400px]',
  }

  const imageVariants = {
    default: 'h-48',
    minimal: 'h-32',
    detailed: 'h-56',
    hero: 'h-64',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, duration: 0.5 }}
      className={cn('group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ModernCard
        className={cn(
          'relative cursor-pointer transition-all duration-300',
          cardVariants[variant],
          enableHover && 'hover:scale-[1.02] hover:shadow-xl',
          project.featured && 'ring-2 ring-primary-500 ring-opacity-50'
        )}
        onClick={handleClick}
        hover={enableHover}
      >
        {/* Cover Image */}
        {heroAsset && (
          <div className={cn('relative overflow-hidden', imageVariants[variant])}>
            <img
              src={heroAsset.thumbnailUrl || heroAsset.dataUrl}
              alt={heroAsset.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0, 
                  scale: isHovered ? 1 : 0.8 
                }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={handleClick}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <Eye size={16} className="mr-1" />
                  View Project
                </ModernButton>
              </motion.div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                getStatusColor(project.status)
              )}>
                {project.status}
              </span>
            </div>

            {/* Featured Badge */}
            {project.featured && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500 text-white">
                  Featured
                </span>
              </div>
            )}

            {/* Asset Type Indicators */}
            <div className="absolute bottom-3 right-3 flex gap-1">
              {Object.entries(assetCounts).map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full"
                >
                  {getAssetIcon(type)}
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'space-y-3',
          variant === 'minimal' ? 'p-4' : variant === 'detailed' ? 'p-6' : 'p-4'
        )}>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark line-clamp-2">
                {project.title}
              </h3>
              {showActions && (
                <div className="flex items-center gap-1 ml-2">
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={cn(
                      'p-1',
                      isLiked ? 'text-red-500' : 'text-text-tertiary dark:text-text-tertiary-dark'
                    )}
                  >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                  </ModernButton>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="p-1 text-text-tertiary dark:text-text-tertiary-dark"
                  >
                    <Share2 size={16} />
                  </ModernButton>
                </div>
              )}
            </div>

            {/* Description */}
            {showDescription && project.description && (
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark line-clamp-3">
                {project.description}
              </p>
            )}
          </div>

          {/* Metadata */}
          {showMetadata && (
            <div className="flex items-center gap-4 text-xs text-text-tertiary dark:text-text-tertiary-dark">
              <div className="flex items-center gap-1">
                {getCategoryIcon(project.category)}
                <span>{project.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(project.createdAt)}</span>
              </div>
              {project.metadata.client && (
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>{project.metadata.client}</span>
                </div>
              )}
              {project.metadata.duration && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{project.metadata.duration}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {showTags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-surface-secondary dark:bg-surface-secondary-dark text-text-secondary dark:text-text-secondary-dark rounded-full"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                  +{project.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Technologies */}
          {variant === 'detailed' && project.metadata.technologies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Technologies
              </h4>
              <div className="flex flex-wrap gap-1">
                {project.metadata.technologies.slice(0, 5).map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-100 rounded"
                  >
                    {tech}
                  </span>
                ))}
                {project.metadata.technologies.length > 5 && (
                  <span className="px-2 py-1 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                    +{project.metadata.technologies.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Metrics */}
          {showMetrics && (
            <div className="flex items-center justify-between pt-2 border-t border-border dark:border-border-dark">
              <div className="flex items-center gap-4 text-xs text-text-tertiary dark:text-text-tertiary-dark">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{Math.floor(Math.random() * 1000) + 100}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={14} />
                  <span>{Math.floor(Math.random() * 100) + 10}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary-500">
                <span className="text-sm font-medium">View Details</span>
                <ArrowRight size={14} />
              </div>
            </div>
          )}

          {/* Actions */}
          {variant === 'detailed' && showActions && (
            <div className="flex items-center gap-2 pt-2">
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleClick}
                className="flex-1"
              >
                <Eye size={16} className="mr-1" />
                View Project
              </ModernButton>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                Edit
              </ModernButton>
            </div>
          )}
        </div>
      </ModernCard>
    </motion.div>
  )
}
