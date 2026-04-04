interface DistributionCardProps {
  title: string
  data: Array<{ label: string; value: number; color?: string }>
  total?: number
}

export function DistributionCard({ 
  title, 
  data,
  total 
}: DistributionCardProps) {
  const calculatedTotal = total || data.reduce((sum, item) => sum + item.value, 0)
  const defaultColors = ['#4f46e5', '#06b6d4', '#16a34a', '#d97706', '#dc2626', '#8b5cf6']
  
  return (
    <div className="card">
      <div className="text-sm text-text-secondary font-medium mb-4">
        {title}
      </div>
      
      <div className="flex items-center gap-6 mb-4">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {data.map((item, index) => {
              const prevItems = data.slice(0, index)
              const prevPercentage = prevItems.reduce((sum, i) => sum + (i.value / calculatedTotal) * 100, 0)
              const percentage = (item.value / calculatedTotal) * 100
              const color = item.color || defaultColors[index % defaultColors.length]
              
              const circumference = 2 * Math.PI * 16
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
              const strokeDashoffset = -(prevPercentage / 100) * circumference
              
              return (
                <circle
                  key={index}
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              )
            })}
          </svg>
        </div>
        
        <div className="flex-1 space-y-2">
          {data.slice(0, 5).map((item, index) => {
            const color = item.color || defaultColors[index % defaultColors.length]
            const percentage = ((item.value / calculatedTotal) * 100).toFixed(1)
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-text-secondary">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-text">
                  {percentage}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
