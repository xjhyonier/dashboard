import { ReactNode } from 'react'

interface NavItem {
  id: string
  label: string
  icon?: ReactNode
  description?: string
  isExtension?: boolean
}

interface SideNavigationProps {
  items: NavItem[]
  activeId: string | null
  onItemClick: (id: string) => void
  className?: string
}

export function SideNavigation({ 
  items, 
  activeId, 
  onItemClick,
  className = '' 
}: SideNavigationProps) {
  return (
    <div className={`w-48 flex-shrink-0 ${className}`}>
      <div className="sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto">
        {/* 导航标题 */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-2">
            快速导航
          </h3>
          <p className="text-xs text-zinc-500">
            点击跳转到对应维度
          </p>
        </div>

        {/* 导航列表 */}
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = activeId === item.id
            const isExtension = item.isExtension
            
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-all
                  flex items-center gap-2
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 pl-2.5' 
                    : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                  }
                  ${isExtension ? 'opacity-70' : ''}
                `}
              >
                {/* 图标 */}
                {item.icon && (
                  <span className="text-sm">
                    {item.icon}
                  </span>
                )}
                
                {/* 标签 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`
                      text-sm font-medium truncate
                      ${isExtension ? 'text-zinc-500' : ''}
                    `}>
                      {item.label}
                    </span>
                    
                    {/* 扩展标记 */}
                    {isExtension && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                        扩展
                      </span>
                    )}
                  </div>
                  
                  {/* 描述 */}
                  {item.description && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </nav>

        {/* 分隔线 */}
        <div className="my-6 border-t border-zinc-200"></div>

        {/* 筛选提示 */}
        <div className="text-xs text-zinc-500">
          <p className="mb-1">💡 提示：</p>
          <p>筛选功能已移至页面底部</p>
          <p className="mt-1">滚动到底部可使用筛选</p>
        </div>
      </div>
    </div>
  )
}