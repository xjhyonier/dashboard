import { useState } from 'react'
import { ExpertDashboard } from './pages/ExpertDashboard'
import { ExpertEnterprisePanel } from './pages/ExpertEnterprisePanel'
import { ExpertTodoCenter } from './pages/ExpertTodoCenter'
import { ExpertChatCenter } from './pages/ExpertChatCenter'
import { ExpertRiskCenter } from './pages/ExpertRiskCenter'
import { ExpertLedger } from './pages/ExpertLedger'
import { ExpertPoolManagement } from './pages/ExpertPoolManagement'
import { ExpertTaskManagement } from './pages/ExpertTaskManagement'
import expertMock from './mock'

interface NavItem {
  key: string
  label: string
  icon: string
  route: string
  badge?: number
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '工作驾驶舱', icon: '\u{1F4CA}', route: '/expert' },
  { key: 'todo', label: '待办中心', icon: '\u{1F4CB}', route: '/expert/todo' },
  { key: 'task', label: '任务管理', icon: '\u{1F3AF}', route: '/expert/task' },
  { key: 'risk', label: '风险研判', icon: '\u2696\uFE0F', route: '/expert/risk' },
  { key: 'pool', label: '责任池', icon: '\u{1F3E2}', route: '/expert/pool' },
  { key: 'chat', label: '沟通中心', icon: '\u{1F4AC}', route: '/expert/chat' },
  { key: 'ledger', label: '我的台账', icon: '\u{1F4D3}', route: '/expert/ledger' },
]

export function ExpertApp() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null)

  // 计算导航栏 badge 数
  const todoBadge = expertMock.todos.filter(t => t.status === 'todo').length
  const overdueBadge = expertMock.todos.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done' && t.status !== 'closed').length
  const chatBadge = expertMock.chatEnterprises.reduce((sum, e) => sum + e.unreadCount, 0)
  const poolBadge = expertMock.poolChanges.filter(c => !c.read).length

  const badges: Record<string, number> = {
    dashboard: overdueBadge,
    todo: todoBadge,
    chat: chatBadge,
    pool: poolBadge,
  }

  const navigate = (page: string) => {
    setCurrentPage(page)
    setSelectedEnterpriseId(null)
  }

  const openEnterprise = (enterpriseId: string) => {
    setSelectedEnterpriseId(enterpriseId)
    setCurrentPage('enterprise')
  }

  // 渲染当前页面
  const renderPage = () => {
    if (currentPage === 'enterprise' && selectedEnterpriseId) {
      return <ExpertEnterprisePanel enterpriseId={selectedEnterpriseId} onBack={() => navigate('dashboard')} />
    }

    switch (currentPage) {
      case 'dashboard': return <ExpertDashboard />
      case 'todo': return <ExpertTodoCenter />
      case 'chat': return <ExpertChatCenter />
      case 'risk': return <ExpertRiskCenter />
      case 'ledger': return <ExpertLedger />
      case 'pool': return <ExpertPoolManagement />
      case 'task': return <ExpertTaskManagement />
      default: return <ExpertDashboard />
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* 左侧固定导航栏 */}
      <div className="w-56 bg-white border-r border-border flex flex-col shrink-0 fixed top-[60px] bottom-0 left-0 z-10">
        {/* 专家信息 */}
        <div className="p-4 border-b border-border">
          <div className="text-sm font-semibold text-text">安全专家</div>
          <div className="text-xs text-text-tertiary mt-1">当前负责 {expertMock.enterprises.length} 家企业</div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = currentPage === item.key
            const badge = badges[item.key]

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                  ${isActive ? 'bg-primary/5 text-primary border-r-2 border-primary' : 'text-text-secondary hover:bg-slate-50 hover:text-text'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {badge !== undefined && badge > 0 && (
                  <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium rounded-full
                    ${item.key === 'dashboard' ? 'bg-red-500 text-white' : 'bg-slate-100 text-text-secondary'}`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* 底部信息 */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-text-tertiary text-center">QuickBI Expert Workbench</div>
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 ml-56">
        {renderPage()}
      </div>
    </div>
  )
}
