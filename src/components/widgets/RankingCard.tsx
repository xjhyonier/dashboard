interface RankingCardProps {
  title: string
  data: Array<{
    rank: number
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'same'
  }>
  maxItems?: number
}

export function RankingCard({ 
  title, 
  data,
  maxItems = 5 
}: RankingCardProps) {
  const displayData = data.slice(0, maxItems)
  
  const trendIcons = {
    up: '↑',
    down: '↓',
    same: '→'
  }
  
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    same: 'text-text-tertiary'
  }
  
  const rankColors = [
    'bg-amber-400 text-white',
    'bg-slate-400 text-white', 
    'bg-orange-400 text-white'
  ]

  return (
    <div className="card">
      <div className="text-sm text-text-secondary font-medium mb-4">
        {title}
      </div>
      
      <div className="space-y-3">
        {displayData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${index < 3 ? rankColors[index] : 'bg-slate-200 text-text-secondary'}
            `}>
              {item.rank}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text truncate">
                {item.label}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text">
                {item.value}
              </span>
              {item.trend && (
                <span className={`text-xs ${trendColors[item.trend]}`}>
                  {trendIcons[item.trend]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
