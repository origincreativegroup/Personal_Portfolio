import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { ForgeIcon } from '../icons/IconSystem'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

// Route mapping for automatic breadcrumb generation
const routeMap: Record<string, { label: string; icon?: string; parent?: string }> = {
  '/': { label: 'Dashboard', icon: 'dashboard' },
  '/projects': { label: 'Projects', icon: 'projects', parent: '/' },
  '/projects/new': { label: 'New Project', icon: 'new-project', parent: '/projects' },
  '/assets': { label: 'Assets', icon: 'assets', parent: '/' },
  '/portfolio/editor': { label: 'Portfolio Editor', icon: 'portfolio-editor', parent: '/' },
  '/settings': { label: 'Settings', icon: 'settings', parent: '/' },
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = []

  // Handle dynamic routes like /projects/:slug/edit
  const segments = pathname.split('/').filter(Boolean)
  let currentPath = ''

  // Always start with home if not on home page
  if (pathname !== '/') {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/',
      icon: 'dashboard'
    })
  }

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1

    // Check if we have a predefined route
    if (routeMap[currentPath]) {
      const route = routeMap[currentPath]
      breadcrumbs.push({
        label: route.label,
        href: isLast ? undefined : currentPath,
        icon: route.icon,
        current: isLast
      })
    } else {
      // Handle dynamic segments
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)

      // Replace common patterns
      if (segment === 'edit') label = 'Edit'
      if (segment === 'view') label = 'View'
      if (segment === 'new') label = 'New'

      // For project slugs, format them nicely
      if (segments[0] === 'projects' && index === 1 && segment !== 'new') {
        label = segment.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }

      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        current: isLast
      })
    }
  })

  return breadcrumbs
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const location = useLocation()

  // Use provided items or generate from current route
  const breadcrumbItems = items || generateBreadcrumbs(location.pathname)

  // Don't show breadcrumbs if there's only one item (usually just Dashboard)
  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1

          return (
            <li key={item.href || item.label} className="flex items-center space-x-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              )}

              <div className="flex items-center space-x-1.5">
                {item.icon && (
                  <ForgeIcon
                    name={item.icon as any}
                    size={16}
                    className={isLast ? 'text-text-primary' : 'text-text-secondary'}
                  />
                )}

                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="text-text-secondary hover:text-text-primary transition-colors interactive"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-text-primary font-medium' : 'text-text-secondary'}>
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Hook for getting breadcrumb items programmatically
export function useBreadcrumbs(pathname?: string) {
  const location = useLocation()
  const currentPath = pathname || location.pathname

  return generateBreadcrumbs(currentPath)
}

// Component for page headers with breadcrumbs
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = ''
}: PageHeaderProps) {
  return (
    <header className={`bg-surface border-b border-border sticky top-0 z-30 ${className}`}>
      <div className="container-responsive py-4 lg:py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-3 lg:mb-4" />

        {/* Header content */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="title-responsive font-bold text-text-primary leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-responsive text-text-secondary mt-2 max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}