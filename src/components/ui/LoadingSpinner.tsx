import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  centered?: boolean
}

const SIZE_MAP: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: '1.1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '2.75rem',
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
  centered = false,
}) => {
  const iconStyle: React.CSSProperties = {
    width: SIZE_MAP[size],
    height: SIZE_MAP[size],
  }

  const containerClass = centered ? 'loading-spinner loading-spinner--centered' : 'loading-spinner'

  return (
    <div className={`${containerClass} ${className}`.trim()}>
      <Loader2 className="loading-spinner__icon" style={iconStyle} />
      {text ? <span className="loading-spinner__text">{text}</span> : null}
    </div>
  )
}

export default React.memo(LoadingSpinner)
