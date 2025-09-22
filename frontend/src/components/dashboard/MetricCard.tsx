import { TrendingUp, TrendingDown } from 'lucide-react'

export interface MetricData {
  label: string
  value: number | string
  change: number
  direction: 'up' | 'down'
  description: string
  unit?: 'currency' | 'percentage' | 'number' | 'custom'
  customUnit?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface MetricCardProps {
  metric: MetricData
  variant?: 'default' | 'success' | 'warning' | 'info'
}

const formatValue = (value: number | string, unit?: string, customUnit?: string) => {
  if (typeof value === 'string') return value

  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'percentage':
      return `${value}%`
    case 'custom':
      return `${value.toLocaleString()} ${customUnit || ''}`
    default:
      return value.toLocaleString()
  }
}

const formatChange = (change: number) => {
  return `${Math.abs(change)}%`
}

const variantStyles = {
  default: 'bg-gradient-to-br from-blue-500 to-blue-600',
  success: 'bg-gradient-to-br from-green-500 to-green-600',
  warning: 'bg-gradient-to-br from-amber-500 to-amber-600',
  info: 'bg-gradient-to-br from-purple-500 to-purple-600'
}

export default function MetricCard({ metric, variant = 'default' }: MetricCardProps) {
  const isPositive = metric.direction === 'up'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <div className={`stat-card text-white ${variantStyles[variant]}`}>
      <div className="stat-card__icon">
        {metric.icon ? (
          <metric.icon className="w-5 h-5 text-white" />
        ) : (
          <TrendIcon className="w-5 h-5 text-white" />
        )}
      </div>

      <span className="stat-card__label">{metric.label}</span>
      <span className="stat-card__value">
        {formatValue(metric.value, metric.unit, metric.customUnit)}
      </span>

      <div className="flex items-center justify-between">
        <p className="stat-card__description text-sm opacity-90">
          {metric.description}
        </p>
        <span className={`text-xs flex items-center gap-1 ${
          isPositive ? 'text-green-200' : 'text-red-200'
        }`}>
          <TrendIcon className="w-3 h-3" />
          {formatChange(metric.change)}
        </span>
      </div>
    </div>
  )
}