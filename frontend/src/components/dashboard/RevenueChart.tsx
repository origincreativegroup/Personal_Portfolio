import { TrendingUp } from 'lucide-react'

export interface RevenueDataPoint {
  label: string
  revenue: number
  profit: number
}

export interface RevenueData {
  totalRevenue: number
  totalProfit: number
  averageMargin: number
  series: RevenueDataPoint[]
}

interface RevenueChartProps {
  data: RevenueData
  timeframe: string
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`
}

export default function RevenueChart({ data, timeframe }: RevenueChartProps) {
  const chartMax = data.series.length > 0
    ? Math.max(...data.series.map(point => point.revenue), 1)
    : 1

  return (
    <div className="surface">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="section-title">Revenue Overview</h2>
          <p className="section-subtitle">
            Revenue and profit trends for {timeframe.toLowerCase()} period
          </p>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Growing</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <span className="block text-sm text-gray-500 dark:text-gray-400">Total Revenue</span>
          <span className="block text-xl font-bold">
            {formatCurrency(data.totalRevenue)}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-500 dark:text-gray-400">Net Profit</span>
          <span className="block text-xl font-bold text-green-600">
            {formatCurrency(data.totalProfit)}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-sm text-gray-500 dark:text-gray-400">Average Margin</span>
          <span className="block text-xl font-bold text-blue-600">
            {formatPercentage(data.averageMargin)}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-2 h-32 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        {data.series.map((point, index) => {
          const revenueHeight = chartMax === 0 ? 0 : Math.round((point.revenue / chartMax) * 100)
          const profitHeight = point.revenue === 0 ? 0 : Math.round((point.profit / point.revenue) * 100)

          return (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className="bg-blue-500 rounded-t relative"
                  style={{ height: `${revenueHeight}%` }}
                  title={`Revenue: ${formatCurrency(point.revenue)}`}
                >
                  <div
                    className="bg-green-500 rounded-t absolute bottom-0 w-full"
                    style={{ height: `${profitHeight}%` }}
                    title={`Profit: ${formatCurrency(point.profit)}`}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 text-center">
                {point.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Profit</span>
        </div>
      </div>
    </div>
  )
}