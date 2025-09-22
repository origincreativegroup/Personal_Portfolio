import { ReactNode } from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  animated?: boolean
  striped?: boolean
  label?: string | ReactNode
  showPercentage?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
}

const variantClasses = {
  default: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500'
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  animated = true,
  striped = false,
  label,
  showPercentage = false,
  className = ''
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-text-primary">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-text-secondary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div className={`progress-bar rounded-full ${sizeClasses[size]}`}>
        <div
          className={`
            progress-fill rounded-full
            ${variantClasses[variant]}
            ${animated ? 'transition-all duration-300 ease-out' : ''}
            ${striped ? 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_100%]' : ''}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={typeof label === 'string' ? label : 'Progress'}
        />
      </div>
    </div>
  )
}