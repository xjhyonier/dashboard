interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: {
    value: number
    label: string
    type: 'up' | 'down' | 'neutral'
  }
  description?: string
}

export function KpiCard({ 
  title, 
  value, 
  unit, 
  trend,
  description 
}: KpiCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-text-tertiary'
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→'
  }

  return (
    <div className="card">
      <div className="text-sm text-text-secondary font-medium mb-3">
        {title}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold text-text tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-text-tertiary">{unit}</span>
        )}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-sm ${trendColors[trend.type]}`}>
          <span>{trendIcons[trend.type]}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-text-tertiary">{trend.label}</span>
        </div>
      )}
      {description && !trend && (
        <div className="text-sm text-text-tertiary">
          {description}
        </div>
      )}
    </div>
  )
}
