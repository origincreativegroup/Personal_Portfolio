import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  centered?: boolean
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
}

export default function LoadingSpinner({
  size = 'md',
  text,
  className = '',
  centered = false
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`loading-spinner ${centered ? 'loading-spinner--centered' : ''} ${className}`}>
      <Loader2 className={`loading-spinner__icon animate-spin ${sizeClasses[size]}`} />
      {text && <span className="loading-spinner__text">{text}</span>}
    </div>
  )

  return spinner
}