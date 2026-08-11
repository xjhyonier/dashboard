import { ReactNode } from 'react'

interface FilterOption {
  label: string
  value: string
}

interface FilterItem {
  key: string
  label: string
  type: 'select' | 'date' | 'tabs'
  options?: FilterOption[]
  value?: string
  onChange?: (value: string) => void
}

interface FilterBarProps {
  filters?: FilterItem[]
  children?: ReactNode
}

export function FilterBar({ filters = [], children }: FilterBarProps) {
  return (
    <div className="card mb-6">
      <div className="flex items-center gap-6 flex-wrap">
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <span className="text-sm text-text-secondary font-medium">
              {filter.label}:
            </span>
            {filter.type === 'tabs' && filter.options ? (
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                {filter.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => filter.onChange?.(option.value)}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-all
                      ${filter.value === option.value 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-text-tertiary hover:text-text-secondary'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : filter.type === 'select' && filter.options ? (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white border border-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={filter.value}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white border border-border rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            )}
          </div>
        ))}
        {children}
      </div>
    </div>
  )
}
