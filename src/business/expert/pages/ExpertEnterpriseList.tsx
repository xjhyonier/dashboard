import { useState } from 'react'
import expertMock from '../mock'

const CAT_LABELS: Record<string, string> = {
  production: '生产型企业',
  fire_key: '消防重点',
  general: '一般单位',
}

interface Props { onSelectEnterprise: (id: string) => void }

export function ExpertEnterpriseList({ onSelectEnterprise }: Props) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  const enterprises = expertMock.enterprises

  const filtered = enterprises.filter(e => {
    if (search && !e.name.includes(search) && !e.address?.includes(search)) return false
    if (catFilter !== 'all' && e.category !== catFilter) return false
    if (riskFilter !== 'all') {
      const score = e.aiScore ?? 0
      const level = score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low'
      if (level !== riskFilter) return false
    }
    return true
  })

  const riskBadge = (score?: number) => {
    if (score === undefined) return null
    if (score >= 70) return { label: '重大风险', cls: 'bg-red-500 text-white' }
    if (score >= 45) return { label: '较大风险', cls: 'bg-orange-500 text-white' }
    if (score >= 25) return { label: '一般风险', cls: 'bg-amber-500 text-white' }
    return { label: '较低风险', cls: 'bg-emerald-500 text-white' }
  }

  return (
    <div className="h-full flex flex-col">

      {/* 搜索与筛选 */}
      <div className="px-6 py-4 bg-white border-b border-zinc-200/70 flex items-center gap-4 flex-shrink-0">
        {/* 搜索 */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.807 10.807z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索企业名称 / 地址 / 安管员..."
            className="pl-9 pr-4 py-2 w-72 bg-zinc-50 border border-zinc-200 rounded-lg text-[13px]
              placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400
              transition-colors duration-150"
          />
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">类型</span>
          <div className="flex gap-1">
            {(['all', 'production', 'fire_key', 'general'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150
                  ${catFilter === c ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                {c === 'all' ? '全部' : CAT_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* 风险筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">风险</span>
          <div className="flex gap-1">
            {([
              { key: 'all', label: '全部' },
              { key: 'high', label: '重大' },
              { key: 'medium', label: '较大' },
              { key: 'low', label: '一般' },
            ] as const).map(r => (
              <button
                key={r.key}
                onClick={() => setRiskFilter(r.key)}
                className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150
                  ${riskFilter === r.key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <span className="ml-auto text-[12px] text-zinc-400 tabular-nums">
          <span className="font-semibold text-zinc-700 font-mono">{filtered.length}</span> 家企业
        </span>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_130px_110px_90px_90px_110px] px-6 py-2.5 bg-white border-b border-zinc-200/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex-shrink-0">
        <div>企业名称</div>
        <div>类型</div>
        <div>风险等级</div>
        <div>AI评分</div>
        <div>待整改</div>
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
            return (
              <div
                key={ent.id}
                className={`grid grid-cols-[1fr_130px_110px_90px_90px_110px] px-6 py-3.5 bg-white border-b border-zinc-100
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

                {/* 类型 */}
                <div>
                  <span className="text-[12px] text-zinc-500">
                    {ent.category ? CAT_LABELS[ent.category] : '-'}
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

                {/* 待整改 */}
                <div>
                  {ent.pendingRectification !== undefined ? (
                    <span className={`text-[13px] font-medium ${
                      ent.pendingRectification > 0 ? 'text-red-500' : 'text-zinc-400'
                    }`}>
                      {ent.pendingRectification}项
                    </span>
                  ) : '-'}
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
