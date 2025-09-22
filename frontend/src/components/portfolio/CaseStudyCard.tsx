import { useState, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Heart, 
  Share2, 
  ExternalLink, 
  Calendar, 
  Clock,
  ArrowRight,
  Play,
  Image as ImageIcon,
  Video,
  FileText,
  Code,
  Palette,
  TrendingUp,
  Users,
  Target,
  Award
} from 'lucide-react'
import { cn } from '../../shared/utils'
import ModernCard from '../ui/ModernCard'
import ModernButton from '../ui/ModernButton'
import { CaseStudy, CaseStudyVariant, ProjectAsset } from '../../types/portfolio'

// ===== TYPES =====

interface CaseStudyCardProps {
  caseStudy: CaseStudy
  variant?: CaseStudyVariant
  className?: string
  onView?: (caseStudy: CaseStudy) => void
  onEdit?: (caseStudy: CaseStudy) => void
  onLike?: (caseStudy: CaseStudy) => void
  onShare?: (caseStudy: CaseStudy) => void
  showActions?: boolean
  showMetrics?: boolean
  showDescription?: boolean
  showProcess?: boolean
  showResults?: boolean
  animationDelay?: number
  enableHover?: boolean
  enableClick?: boolean
}

// ===== UTILITIES =====

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

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

// ===== COMPONENT =====

export default function CaseStudyCard({
  caseStudy,
  variant = 'card',
  className,
  onView,
  onEdit,
  onLike,
  onShare,
  showActions = true,
  showMetrics = true,
  showDescription = true,
  showProcess = false,
  showResults = false,
  animationDelay = 0,
  enableHover = true,
  enableClick = true,
}: CaseStudyCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handleClick = () => {
    if (enableClick && onView) {
      onView(caseStudy)
    }
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
    if (onLike) {
      onLike(caseStudy)
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShare) {
      onShare(caseStudy)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(caseStudy)
    }
  }

  // Get hero image or first gallery image
  const heroImage = caseStudy.coverImage || caseStudy.content.gallery[0]?.dataUrl

  const cardVariants = {
    card: 'p-0 overflow-hidden',
    preview: 'p-4',
    full: 'p-6',
    featured: 'p-0 overflow-hidden min-h-[500px]',
  }

  const imageVariants = {
    card: 'h-48',
    preview: 'h-32',
    full: 'h-64',
    featured: 'h-80',
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
          caseStudy.featured && 'ring-2 ring-primary-500 ring-opacity-50'
        )}
        onClick={handleClick}
        hover={enableHover}
      >
        {/* Cover Image */}
        {heroImage && (
          <div className={cn('relative overflow-hidden', imageVariants[variant])}>
            <img
              src={heroImage}
              alt={caseStudy.title}
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
                  Read Case Study
                </ModernButton>
              </motion.div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <span className={cn(
                'px-2 py-1 text-xs font-medium rounded-full',
                getStatusColor(caseStudy.status)
              )}>
                {caseStudy.status}
              </span>
            </div>

            {/* Featured Badge */}
            {caseStudy.featured && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500 text-white">
                  Featured
                </span>
              </div>
            )}

            {/* Gallery Count */}
            {caseStudy.content.gallery.length > 0 && (
              <div className="absolute bottom-3 right-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
                  <ImageIcon size={14} />
                  <span>{caseStudy.content.gallery.length} images</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'space-y-4',
          variant === 'preview' ? 'p-4' : variant === 'full' ? 'p-6' : 'p-4'
        )}>
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark line-clamp-2">
                {caseStudy.title}
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
            {showDescription && caseStudy.description && (
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark line-clamp-3">
                {caseStudy.description}
              </p>
            )}
          </div>

          {/* Problem & Solution Preview */}
          {(variant === 'full' || variant === 'featured') && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                  Problem
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400 line-clamp-2">
                  {caseStudy.content.problem}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Solution
                </h4>
                <p className="text-sm text-green-600 dark:text-green-400 line-clamp-2">
                  {caseStudy.content.solution}
                </p>
              </div>
            </div>
          )}

          {/* Process Steps */}
          {showProcess && caseStudy.content.process.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Process
              </h4>
              <div className="space-y-1">
                {caseStudy.content.process.slice(0, 3).map((step, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                    <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <span className="line-clamp-1">{step.title}</span>
                  </div>
                ))}
                {caseStudy.content.process.length > 3 && (
                  <div className="text-xs text-text-tertiary dark:text-text-tertiary-dark ml-8">
                    +{caseStudy.content.process.length - 3} more steps
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Preview */}
          {showResults && caseStudy.content.results && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                Results
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 line-clamp-2">
                {caseStudy.content.results}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary dark:text-text-tertiary-dark">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDate(caseStudy.createdAt)}</span>
            </div>
            {caseStudy.content.process.length > 0 && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{caseStudy.content.process.length} steps</span>
              </div>
            )}
            {caseStudy.content.gallery.length > 0 && (
              <div className="flex items-center gap-1">
                <ImageIcon size={14} />
                <span>{caseStudy.content.gallery.length} images</span>
              </div>
            )}
          </div>

          {/* Metrics */}
          {showMetrics && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border dark:border-border-dark">
              <div className="text-center">
                <div className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                  {formatNumber(caseStudy.metrics.views)}
                </div>
                <div className="text-xs text-text-tertiary dark:text-text-tertiary-dark">Views</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">
                  {formatNumber(caseStudy.metrics.likes)}
                </div>
                <div className="text-xs text-text-tertiary dark:text-text-tertiary-dark">Likes</div>
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2 pt-2">
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleClick}
                className="flex-1"
              >
                <Eye size={16} className="mr-1" />
                Read Case Study
              </ModernButton>
              {variant === 'full' && (
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  Edit
                </ModernButton>
              )}
            </div>
          )}

          {/* Call to Action */}
          {variant === 'featured' && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-primary-500">
                <span className="text-sm font-medium">Read Full Case Study</span>
                <ArrowRight size={14} />
              </div>
              <div className="flex items-center gap-1 text-text-tertiary dark:text-text-tertiary-dark">
                <TrendingUp size={14} />
                <span className="text-xs">Trending</span>
              </div>
            </div>
          )}
        </div>
      </ModernCard>
    </motion.div>
  )
}
