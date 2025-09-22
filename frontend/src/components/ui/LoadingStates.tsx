import { ReactNode } from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
  lines?: number
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className="skeleton rounded h-4"
            style={{
              width: i === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
      </div>
    )
  }

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={{
        width: width || (variant === 'circular' ? height : undefined),
        height: height || (variant === 'text' ? '1rem' : undefined)
      }}
    />
  )
}

interface SkeletonCardProps {
  showAvatar?: boolean
  linesCount?: number
  className?: string
}

export function SkeletonCard({ showAvatar = false, linesCount = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-4">
        {showAvatar && (
          <Skeleton variant="circular" width={40} height={40} />
        )}
        <div className="flex-1">
          <Skeleton variant="text" className="mb-2" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="text" lines={linesCount} />
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
}

export function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'border-primary-500',
    secondary: 'border-text-secondary',
    white: 'border-white'
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        border-2 border-t-transparent rounded-full loading-spin
        ${className}
      `}
    />
  )
}

interface LoadingOverlayProps {
  children?: ReactNode
  loading?: boolean
  message?: string
  className?: string
}

export function LoadingOverlay({
  children,
  loading = false,
  message = 'Loading...',
  className = ''
}: LoadingOverlayProps) {
  if (!loading) return <>{children}</>

  return (
    <div className={`relative ${className}`}>
      {children && (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center space-y-3">
          <Spinner size="lg" />
          {message && (
            <p className="text-sm font-medium text-text-primary">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface PulseProps {
  children: ReactNode
  className?: string
}

export function Pulse({ children, className = '' }: PulseProps) {
  return (
    <div className={`loading-pulse ${className}`}>
      {children}
    </div>
  )
}

interface DotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary'
  className?: string
}

export function LoadingDots({ size = 'md', color = 'primary', className = '' }: DotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const colorClasses = {
    primary: 'bg-primary-500',
    secondary: 'bg-text-secondary'
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]}
            ${colorClasses[color]}
            rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  )
}