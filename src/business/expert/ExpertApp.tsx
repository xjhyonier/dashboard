import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ExpertQueue } from './pages/ExpertQueue'
import { ExpertEnterpriseList } from './pages/ExpertEnterpriseList'
import { ExpertEnterprisePanel } from './pages/ExpertEnterprisePanel'
import { ExpertMy } from './pages/ExpertMy'
import { ExpertExecutionDetail } from './components/ExpertExecutionDetail'
import expertMock, { type QueueTask } from './mock'

export type NavKey = 'queue' | 'enterprise' | 'my'

export function ExpertApp() {
  const location = useLocation()
  const navigate = useNavigate()

  const pendingTasks = expertMock.queueTasks.filter(t => t.status === 'pending')
  const completedTasks = expertMock.queueTasks.filter(t => t.status === 'completed')
  const totalTasks = completedTasks.length + pendingTasks.length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const openEnterprise = (id: string) => navigate(`/emergency/expert/enterprise/${id}`)
  const openTask = (task: QueueTask) => navigate(`/emergency/expert/task/${task.id}`)

  const activeNav: NavKey = location.pathname.includes('/enterprise')
    ? 'enterprise'
    : location.pathname.endsWith('/my')
      ? 'my'
      : 'queue'

  const NAV_CONFIG: { key: NavKey; label: string; badge?: number }[] = [
    { key: 'queue', label: '任务队列', badge: pendingTasks.length },
    { key: 'enterprise', label: '企业查询' },
    { key: 'my', label: '我的' },
  ]

  const navPathMap: Record<NavKey, string> = {
    queue: '/emergency/expert/queue',
    enterprise: '/emergency/expert/enterprise',
    my: '/emergency/expert/my',
  }

  return (
    <Routes>
      <Route index element={<Navigate to="queue" replace />} />
      <Route path="queue" element={
        <ExpertLayout
          activeNav={activeNav}
          completedTasks={completedTasks.length}
          totalTasks={totalTasks}
          pendingTasks={pendingTasks.length}
          progressPct={progressPct}
          navConfig={NAV_CONFIG}
          onNavigate={(key) => navigate(navPathMap[key])}
        >
          <ExpertQueue onSelectTask={openTask} />
        </ExpertLayout>
      } />
      <Route path="enterprise" element={
        <ExpertLayout
          activeNav={activeNav}
          completedTasks={completedTasks.length}
          totalTasks={totalTasks}
          pendingTasks={pendingTasks.length}
          progressPct={progressPct}
          navConfig={NAV_CONFIG}
          onNavigate={(key) => navigate(navPathMap[key])}
        >
          <ExpertEnterpriseList onSelectEnterprise={openEnterprise} />
        </ExpertLayout>
      } />
      <Route path="my" element={
        <ExpertLayout
          activeNav={activeNav}
          completedTasks={completedTasks.length}
          totalTasks={totalTasks}
          pendingTasks={pendingTasks.length}
          progressPct={progressPct}
          navConfig={NAV_CONFIG}
          onNavigate={(key) => navigate(navPathMap[key])}
        >
          <ExpertMy />
        </ExpertLayout>
      } />
      <Route path="task/:taskId" element={<ExpertTaskRoute />} />
      <Route path="enterprise/:enterpriseId" element={<ExpertEnterpriseRoute />} />
      <Route path="*" element={<Navigate to="queue" replace />} />
    </Routes>
  )
}

interface ExpertLayoutProps {
  activeNav: NavKey
  completedTasks: number
  totalTasks: number
  pendingTasks: number
  progressPct: number
  navConfig: { key: NavKey; label: string; badge?: number }[]
  onNavigate: (key: NavKey) => void
  children: React.ReactNode
}

function ExpertLayout({
  activeNav,
  completedTasks,
  totalTasks,
  pendingTasks,
  progressPct,
  navConfig,
  onNavigate,
  children,
}: ExpertLayoutProps) {
  return (
    <div className="h-screen flex bg-zinc-50 overflow-hidden font-sans">

      {/* ── 左侧边栏 ── */}
      <aside className="w-52 bg-zinc-900 flex flex-col flex-shrink-0">

        {/* Logo 区 */}
        <div className="px-5 pt-6 pb-5">
          <div className="text-zinc-100 font-semibold text-[15px] tracking-tight leading-none">派单平台</div>
          <div className="text-zinc-500 text-[11px] mt-1 font-normal">安全专家工作台</div>
        </div>

        {/* 进度概览 */}
        <div className="mx-4 px-4 py-4 bg-zinc-800/60 rounded-xl mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider">今日进度</span>
            <span className="text-zinc-300 text-[11px] font-mono">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-1 bg-zinc-700 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
            <span className="text-zinc-500 text-[11px]">{pendingTasks} 件待处理</span>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 px-3 pt-1 pb-4 space-y-0.5">
          {navConfig.map(({ key, label, badge }) => {
            const isActive = activeNav === key
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group relative
                  ${isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-500 rounded-r-full" />
                )}
                <NavIcon navKey={key} active={isActive} />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="ml-auto mr-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* 用户信息 */}
        <div className="mx-4 mb-5 px-4 py-3.5 bg-zinc-800/40 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0 shadow-sm">
              今
            </div>
            <div className="min-w-0">
              <div className="text-zinc-200 text-[13px] font-medium truncate">今卓</div>
              <div className="text-zinc-600 text-[11px] truncate">安全专家</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── 主内容区 ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-50">

        {/* 顶部栏 */}
        <header className="h-13 bg-white border-b border-zinc-200/80 flex items-center px-6 flex-shrink-0">
          <div className="text-sm font-medium text-zinc-400">{navConfig.find(n => n.key === activeNav)?.label}</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-mono tabular-nums">2026-04-05</span>
            <button className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 flex items-center justify-center transition-colors">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

function ExpertTaskRoute() {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const task = expertMock.queueTasks.find(item => item.id === taskId)

  if (!task) {
    return <Navigate to="/emergency/expert/queue" replace />
  }

  return (
    <ExpertExecutionDetail
      task={task}
      onBack={() => navigate('/emergency/expert/queue')}
      onComplete={() => navigate('/emergency/expert/queue')}
    />
  )
}

function ExpertEnterpriseRoute() {
  const navigate = useNavigate()
  const { enterpriseId } = useParams()

  if (!enterpriseId) {
    return <Navigate to="/emergency/expert/enterprise" replace />
  }

  return (
    <ExpertEnterprisePanel
      enterpriseId={enterpriseId}
      onBack={() => navigate('/emergency/expert/enterprise')}
    />
  )
}

function NavIcon({ navKey, active }: { navKey: NavKey; active: boolean }) {
  const cls = `w-4 h-4 flex-shrink-0 transition-colors duration-150 ${active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`
  if (navKey === 'queue') return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
  if (navKey === 'enterprise') return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}
