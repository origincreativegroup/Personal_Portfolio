import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'raised' | 'tinted'
  padding?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
  default: 'surface',
  raised: 'surface surface--raised',
  tinted: 'surface surface--tinted'
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md'
}: CardProps) {
  return (
    <div className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}