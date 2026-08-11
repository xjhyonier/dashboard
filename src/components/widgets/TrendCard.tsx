interface TrendCardProps {
  title: string
  currentValue: string | number
  data: Array<{ label: string; value: number }>
  trend?: {
    value: number
    type: 'up' | 'down' | 'neutral'
  }
}

export function TrendCard({ 
  title, 
  currentValue, 
  data,
  trend 
}: TrendCardProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-text-tertiary'
  }

  return (
    <div className="card">
      <div className="text-sm text-text-secondary font-medium mb-3">
        {title}
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-text tracking-tight">
          {currentValue}
        </span>
        {trend && (
          <span className={`text-sm ${trendColors[trend.type]}`}>
            {trend.value > 0 ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="h-16 flex items-end gap-1">
        {data.map((item, index) => {
          const height = ((item.value - minValue) / range) * 100
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/30 transition-colors"
                style={{ height: `${Math.max(height, 10)}%` }}
              />
              {data.length <= 12 && (
                <span className="text-xs text-text-tertiary transform -rotate-45 origin-left">
                  {item.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
