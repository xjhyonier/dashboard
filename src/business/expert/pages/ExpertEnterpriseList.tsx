import { useState, useMemo } from 'react'
import expertMock from '../mock'

const CAT_LABELS: Record<string, string> = {
  production: '生产型企业',
  fire_key: '消防重点',
  general: '一般单位',
}

// AI评估状态
type AiStatus = 'normal' | 'abnormal' | 'no_data'
// 待办状态
type TodoStatus = 'none' | 'pending' | 'pending_review'

interface EnterpriseFilters {
  search: string
  catFilter: string
  riskFilter: string
  aiStatus: AiStatus | 'all'
  todoStatus: TodoStatus | 'all'
}

interface Props { onSelectEnterprise: (id: string) => void }

export function ExpertEnterpriseList({ onSelectEnterprise }: Props) {
  const [filters, setFilters] = useState<EnterpriseFilters>({
    search: '',
    catFilter: 'all',
    riskFilter: 'all',
    aiStatus: 'all',
    todoStatus: 'all',
  })

  // 计算每个企业的综合状态
  const enterpriseStatuses = useMemo(() => {
    const statuses: Record<string, { aiStatus: AiStatus; todoCount: number; pendingReviewCount: number }> = {}

    expertMock.enterprises.forEach(e => {
      // AI评估状态：基于 aiScore 判断
      let aiStatus: AiStatus = 'no_data'
      if (e.aiScore !== undefined) {
        // aiScore 低于70认为有异常
        aiStatus = e.aiScore < 70 ? 'abnormal' : 'normal'
      }

      // 待办数：统计该企业的待办（来自 todos）
      const todoCount = expertMock.todos.filter(
        t => t.enterpriseId === e.id && (t.status === 'todo' || t.status === 'in_progress')
      ).length

      // 待验收数：统计该企业的隐患中处于"待复核"状态的
      const pendingReviewCount = expertMock.hazards.filter(
        h => h.enterpriseId === e.id && h.status === 'pending_review'
      ).length

      statuses[e.id] = { aiStatus, todoCount, pendingReviewCount }
    })

    return statuses
  }, [])

  const enterprises = expertMock.enterprises

  const filtered = enterprises.filter(e => {
    const status = enterpriseStatuses[e.id]

    // 搜索过滤
    if (filters.search && !e.name.includes(filters.search) && !e.address?.includes(filters.search)) return false

    // 类型过滤
    if (filters.catFilter !== 'all' && e.category !== filters.catFilter) return false

    // 风险过滤
    if (filters.riskFilter !== 'all') {
      const score = e.aiScore ?? 0
      const level = score >= 70 ? 'low' : score >= 45 ? 'medium' : 'high'
      if (level !== filters.riskFilter) return false
    }

    // AI评估状态过滤
    if (filters.aiStatus !== 'all' && status.aiStatus !== filters.aiStatus) return false

    // 待办状态过滤
    if (filters.todoStatus !== 'all') {
      if (filters.todoStatus === 'none' && status.todoCount > 0) return false
      if (filters.todoStatus === 'pending' && status.todoCount === 0) return false
      if (filters.todoStatus === 'pending_review' && status.pendingReviewCount === 0) return false
    }

    return true
  })

  const riskBadge = (score?: number) => {
    if (score === undefined) return null
    if (score >= 70) return { label: '重大风险', cls: 'bg-red-500 text-white' }
    if (score >= 45) return { label: '较大风险', cls: 'bg-orange-500 text-white' }
    if (score >= 25) return { label: '一般风险', cls: 'bg-amber-500 text-white' }
    return { label: '低风险', cls: 'bg-emerald-500 text-white' }
  }

  const aiStatusBadge = (status: AiStatus) => {
    if (status === 'abnormal') return { label: '异常', cls: 'bg-red-100 text-red-700 border border-red-200' }
    if (status === 'normal') return { label: '正常', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
    return { label: '未评估', cls: 'bg-zinc-100 text-zinc-500 border border-zinc-200' }
  }

  return (
    <div className="h-full flex flex-col">

      {/* 搜索与筛选 */}
      <div className="px-6 py-4 bg-white border-b border-zinc-200/70 flex-shrink-0">
        {/* 第一行：搜索 + 统计 */}
        <div className="flex items-center gap-4 mb-3">
          {/* 搜索 */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.807 10.807z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="搜索企业名称 / 地址 / 安管员..."
              className="pl-9 pr-4 py-2 w-72 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px]
                placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400
                transition-colors duration-150"
            />
          </div>

          <span className="ml-auto text-[12px] text-zinc-400 tabular-nums">
            共 <span className="font-semibold text-zinc-700 font-mono">{filtered.length}</span> 家企业
          </span>
        </div>

        {/* 第二行：筛选条件组 */}
        <div className="flex items-center gap-6">
          {/* AI评估状态 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider w-8">AI</span>
            <div className="flex gap-1">
              {([
                { key: 'all', label: '全部' },
                { key: 'abnormal', label: '有异常' },
                { key: 'normal', label: '正常' },
              ] as const).map(s => (
                <button
                  key={s.key}
                  onClick={() => setFilters(f => ({ ...f, aiStatus: s.key }))}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-150
                    ${filters.aiStatus === s.key
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 待办状态 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider w-8">待办</span>
            <div className="flex gap-1">
              {([
                { key: 'all', label: '全部' },
                { key: 'pending', label: '有待办' },
                { key: 'pending_review', label: '待验收' },
              ] as const).map(s => (
                <button
                  key={s.key}
                  onClick={() => setFilters(f => ({ ...f, todoStatus: s.key }))}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-150
                    ${filters.todoStatus === s.key
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-5 bg-zinc-200" />

          {/* 类型 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider w-8">类型</span>
            <div className="flex gap-1">
              {(['all', 'production', 'fire_key', 'general'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setFilters(f => ({ ...f, catFilter: c }))}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-150
                    ${filters.catFilter === c
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                >
                  {c === 'all' ? '全部' : CAT_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* 风险 */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider w-8">风险</span>
            <div className="flex gap-1">
              {([
                { key: 'all', label: '全部' },
                { key: 'high', label: '重大' },
                { key: 'medium', label: '较大' },
                { key: 'low', label: '一般' },
              ] as const).map(r => (
                <button
                  key={r.key}
                  onClick={() => setFilters(f => ({ ...f, riskFilter: r.key }))}
                  className={`px-3 py-1.5 rounded text-[12px] font-medium transition-all duration-150
                    ${filters.riskFilter === r.key
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_100px_90px_90px_80px_80px_110px] px-6 py-2.5 bg-white border-b border-zinc-200/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex-shrink-0">
        <div>企业名称</div>
        <div>AI评估</div>
        <div>风险等级</div>
        <div>AI评分</div>
        <div className="text-center">待办</div>
        <div className="text-center">待验收</div>
        <div className="text-center">操作</div>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto bg-zinc-50/60">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" className="mb-4 opacity-40">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
            <p className="text-sm font-medium text-zinc-400">未找到匹配的企业</p>
          </div>
        ) : (
          filtered.map((ent, idx) => {
            const badge = riskBadge(ent.aiScore)
            const status = enterpriseStatuses[ent.id]
            const aiBadge = aiStatusBadge(status.aiStatus)

            return (
              <div
                key={ent.id}
                className={`grid grid-cols-[1fr_100px_90px_90px_80px_80px_110px] px-6 py-3.5 bg-white border-b border-zinc-100
                  hover:bg-zinc-50/70 transition-colors duration-100 items-center
                  ${idx === 0 ? 'border-t border-zinc-200/40' : ''}`}
              >
                {/* 企业名称 */}
                <div className="pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-zinc-800 truncate">{ent.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate">{ent.address}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    安管员：{ent.managerName}
                  </div>
                </div>

                {/* AI评估状态 */}
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${aiBadge.cls}`}>
                    {aiBadge.label}
                  </span>
                </div>

                {/* 风险等级 */}
                <div>
                  {badge && (
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>

                {/* AI评分 */}
                <div>
                  {ent.aiScore !== undefined ? (
                    <span className={`text-[13px] font-semibold font-mono ${
                      ent.aiScore >= 70 ? 'text-red-600' : ent.aiScore >= 45 ? 'text-orange-600' : 'text-zinc-600'
                    }`}>
                      {ent.aiScore}分
                    </span>
                  ) : '-'}
                </div>

                {/* 待办数 */}
                <div className="text-center">
                  {status.todoCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-blue-100 text-blue-700 rounded text-[12px] font-medium">
                      {status.todoCount}
                    </span>
                  ) : (
                    <span className="text-[12px] text-zinc-300">0</span>
                  )}
                </div>

                {/* 待验收数 */}
                <div className="text-center">
                  {status.pendingReviewCount > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-amber-100 text-amber-700 rounded text-[12px] font-medium">
                      {status.pendingReviewCount}
                    </span>
                  ) : (
                    <span className="text-[12px] text-zinc-300">0</span>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex justify-center">
                  <button
                    onClick={() => onSelectEnterprise(ent.id)}
                    className="px-3 py-1.5 text-[12px] font-medium text-zinc-600 border border-zinc-200
                      rounded-lg hover:bg-zinc-900 hover:text-white hover:border-zinc-900
                      active:scale-[0.97] transition-all duration-150"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}