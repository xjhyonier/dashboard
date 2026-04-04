import { ReactNode, useState } from 'react'

interface TabItem {
  key: string
  label: string
  badge?: number | string
  children: ReactNode
}

interface TabPanelProps {
  tabs: TabItem[]
  defaultTab?: string
  onChange?: (key: string) => void
  className?: string
}

export function TabPanel({ tabs, defaultTab, onChange, className = '' }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '')

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    onChange?.(key)
  }

  const activeContent = tabs.find(t => t.key === activeTab)?.children

  return (
    <div className={className}>
      {/* Tab 栏 */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-colors
                ${isActive
                  ? 'text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.badge !== undefined && tab.badge !== null && (
                  <span className={`
                    inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                    text-xs font-medium rounded-full
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 text-text-tertiary'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab 内容 */}
      <div className="tab-content">
        {activeContent}
      </div>
    </div>
  )
}
