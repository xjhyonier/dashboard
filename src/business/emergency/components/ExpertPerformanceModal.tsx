import { useEffect, useMemo, useCallback } from 'react'
import { GovernanceRadarChart } from './RadarChart'
import type { DimensionScore } from '../pages/mock/station-chief'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface WorkGroupExpert {
  id: string
  name: string
  avatar?: string
  role: 'leader' | 'deputy' | 'member'
  taskCount: number
  completedTasks: number
  completionRate: number
  avgProcessTime: number
  hazardFound: number
  overdueTasks: number
}

export interface ExpertPerformanceModalProps {
  expert: WorkGroupExpert
  onClose: () => void
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateDimensions(expert: WorkGroupExpert): DimensionScore[] {
  const base = expert.completionRate
  // Deterministic offsets per dimension based on expert metrics
  const offsets = [
    5,                                                          // 事故管理
    Math.round((expert.hazardFound / 20) * 5 - 2),             // 双重预防
    -expert.overdueTasks * 3,                                   // 应急管理
    Math.round((expert.completedTasks / expert.taskCount) * 5 - 3), // 机构职责
    expert.avgProcessTime <= 3 ? 6 : expert.avgProcessTime <= 5 ? -2 : -8, // 教育培训
    expert.taskCount >= 30 ? 4 : -3,                           // 安全投入
    1,                                                          // 安全制度
  ]
  const dimNames = ['事故管理', '双重预防', '应急管理', '机构职责', '教育培训', '安全投入', '安全制度']

  return dimNames.map((name, i) => {
    const score = Math.min(100, Math.max(20, Math.round(base + offsets[i])))
    const prevScore = Math.min(100, Math.max(20, score - offsets[i]))
    const trend: DimensionScore['trend'] = score > prevScore ? 'up' : score < prevScore ? 'down' : 'stable'

    return {
      name,
      score,
      prevScore,
      trend,
      trendDelta: Math.abs(score - prevScore),
      distribution: [
        { label: '优秀(≥80)', count: Math.floor(score * 2.5), color: '#16a34a' },
        { label: '良好(60-79)', count: Math.floor((100 - score) * 1.8), color: '#4f46e5' },
        { label: '关注(30-59)', count: Math.floor((100 - score) * 0.8), color: '#d97706' },
        { label: '危险(<30)', count: Math.floor((100 - score) * 0.4), color: '#dc2626' },
      ],
      bottomEnterprises: [],
      history: Array.from({ length: 6 }, (_, j) => ({
        month: `${j + 10}月`,
        score: Math.max(20, Math.min(100, score - (5 - j) * 2)),
      })),
    }
  })
}

function getRoleStyle(role: WorkGroupExpert['role']) {
  switch (role) {
    case 'leader': return { label: '组长', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }
    case 'deputy': return { label: '副组长', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
    case 'member': return { label: '组员', bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200' }
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 60) return '#4f46e5'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function ExpertPerformanceModal({ expert, onClose }: ExpertPerformanceModalProps) {
  const dimensions = useMemo(() => generateDimensions(expert), [expert])
  const roleStyle = getRoleStyle(expert.role)
  const avgScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length)

  // Close on Escape; lock background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {expert.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-zinc-800">{expert.name}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded ${roleStyle.bg} ${roleStyle.text} border ${roleStyle.border}`}>
                  {roleStyle.label}
                </span>
              </div>
              <span className="text-xs text-zinc-500">绩效综合评分: {avgScore}分</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Key stats row */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            <StatCard label="任务总数" value={String(expert.taskCount)} unit="件" />
            <StatCard label="已完成" value={String(expert.completedTasks)} unit="件" />
            <StatCard label="完成率" value={expert.completionRate.toFixed(1)} unit="%" />
            <StatCard label="发现隐患" value={String(expert.hazardFound)} unit="项" />
            <StatCard
              label="逾期任务"
              value={String(expert.overdueTasks)}
              unit="件"
              highlight={expert.overdueTasks > 0}
            />
          </div>

          {/* Radar + Dimension breakdown */}
          <div className="flex gap-6">
            {/* Left: Radar Chart */}
            <div className="w-[320px] shrink-0">
              <h4 className="text-sm font-semibold text-zinc-700 mb-3">七维度治理效能</h4>
              <div className="border border-zinc-200 rounded-xl p-3 bg-white">
                <GovernanceRadarChart dimensions={dimensions} height={280} />
              </div>
            </div>

            {/* Right: Dimension bars */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-semibold text-zinc-700 mb-3">各维度详细得分</h4>
                <div className="space-y-3">
                  {dimensions.map((dim) => {
                    const trendIcon = dim.trend === 'up' ? '▲' : dim.trend === 'down' ? '▼' : '─'
                    const trendColor =
                      dim.trend === 'up' ? 'text-emerald-600' : dim.trend === 'down' ? 'text-red-500' : 'text-zinc-400'
                    return (
                      <div key={dim.name} className="flex items-center gap-3">
                        <span className="text-xs text-zinc-600 w-20 shrink-0">{dim.name}</span>
                        <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${dim.score}%`, background: getScoreColor(dim.score) }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8 text-right" style={{ color: getScoreColor(dim.score) }}>
                          {dim.score}
                        </span>
                        <span className={`text-[10px] ${trendColor} w-10`}>
                          {trendIcon}{dim.trendDelta > 0 ? dim.trendDelta : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Avg process time */}
              <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">平均处理时长</span>
                  <span
                    className={`text-sm font-bold ${
                      expert.avgProcessTime <= 3
                        ? 'text-emerald-600'
                        : expert.avgProcessTime <= 5
                          ? 'text-zinc-700'
                          : 'text-amber-600'
                    }`}
                  >
                    {expert.avgProcessTime} 小时
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string
  value: string
  unit: string
  highlight?: boolean
}) {
  return (
    <div className={`p-3 rounded-xl border bg-zinc-50/50 ${highlight ? 'border-red-200 ring-1 ring-red-200' : 'border-zinc-200'}`}>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${highlight ? 'text-red-600' : 'text-zinc-800'}`}>{value}</span>
        <span className="text-xs text-zinc-400">{unit}</span>
      </div>
    </div>
  )
}
