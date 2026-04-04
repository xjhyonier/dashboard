interface StatusCardProps {
  title: string
  items: Array<{
    label: string
    status: 'success' | 'warning' | 'danger' | 'neutral'
    count?: number
  }>
}

export function StatusCard({ title, items }: StatusCardProps) {
  const statusColors = {
    success: {
      bg: 'bg-success/10',
      dot: 'bg-success',
      text: 'text-success'
    },
    warning: {
      bg: 'bg-warning/10',
      dot: 'bg-warning',
      text: 'text-warning'
    },
    danger: {
      bg: 'bg-danger/10',
      dot: 'bg-danger',
      text: 'text-danger'
    },
    neutral: {
      bg: 'bg-slate-100',
      dot: 'bg-slate-400',
      text: 'text-text-secondary'
    }
  }

  return (
    <div className="card">
      <div className="text-sm text-text-secondary font-medium mb-4">
        {title}
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => {
          const colors = statusColors[item.status]
          return (
            <div 
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${colors.bg}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <span className="text-sm font-medium text-text">
                  {item.label}
                </span>
              </div>
              {item.count !== undefined && (
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {item.count}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
