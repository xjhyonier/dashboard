import { useState, useMemo } from 'react'
import { PageShell, PageHeader, SectionBlock, GridLayout } from '../../../components/layout'
import { TrendCard, DistributionCard, RankingCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { EnterpriseStatePath } from '../../../components/shared/EnterpriseStatePath'
import {
  stationChiefMock,
  type DimensionScore,
  type ExpertMember,
} from './mock/station-chief'

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

type ExpertFilter = 'all' | string
type RiskLevelFilter = 'all' | 'major' | 'high' | 'medium' | 'low'

// ─────────────────────────────────────────────
// 1. 筛选器组件
// ─────────────────────────────────────────────

function ExpertFilterBar({
  selectedExpertId,
  onSelect,
}: {
  selectedExpertId: ExpertFilter
  onSelect: (id: ExpertFilter) => void
}) {
  const experts = stationChiefMock.expertTeam

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 mr-1">专家：</span>
      
      {/* 全部按钮 */}
      <button
        onClick={() => onSelect('all')}
        className={`
          px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
          ${selectedExpertId === 'all'
            ? 'bg-zinc-800 border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}
        `}
      >
        全部 ({experts.length}人)
      </button>

      {/* 专家列表 */}
      {experts.map(expert => {
        const isSelected = selectedExpertId === expert.id
        return (
          <button
            key={expert.id}
            onClick={() => onSelect(expert.id)}
            className={`
              px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${isSelected
                ? 'bg-zinc-700 border-zinc-700 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}
            `}
          >
            {expert.name}
          </button>
        )
      })}
    </div>
  )
}

function RiskLevelFilterBar({
  selectedRiskLevel,
  onSelect,
}: {
  selectedRiskLevel: RiskLevelFilter
  onSelect: (level: RiskLevelFilter) => void
}) {
  const riskOptions = [
    { value: 'all', label: '全部风险', count: 380, color: 'bg-zinc-800' },
    { value: 'major', label: '重大风险', count: 12, color: 'bg-red-500' },
    { value: 'high', label: '较大风险', count: 45, color: 'bg-orange-500' },
    { value: 'medium', label: '一般风险', count: 128, color: 'bg-amber-500' },
    { value: 'low', label: '低风险', count: 195, color: 'bg-emerald-500' },
  ] as const

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 mr-1">风险等级：</span>
      
      {riskOptions.map(option => {
        const isSelected = selectedRiskLevel === option.value
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value as RiskLevelFilter)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${isSelected
                ? 'bg-zinc-700 border-zinc-700 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}
            `}
          >
            <span className={`w-2 h-2 rounded-full ${option.color}`} />
            <span>{option.label}</span>
            <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
              ({option.count})
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// 2. 核心风险指标卡片（可点击筛选）
// ─────────────────────────────────────────────

function RiskMetricsCards({
  selectedRiskLevel,
  onSelectRiskLevel,
}: {
  selectedRiskLevel: RiskLevelFilter
  onSelectRiskLevel: (level: RiskLevelFilter) => void
}) {
  const metrics = [
    { key: 'all', label: '主体总数', value: 380, unit: '家', color: 'text-zinc-700', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200', activeBg: 'bg-zinc-800', activeText: 'text-white' },
    { key: 'major', label: '重大风险', value: 12, unit: '家', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', activeBg: 'bg-red-600', activeText: 'text-white' },
    { key: 'high', label: '较大风险', value: 45, unit: '家', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', activeBg: 'bg-orange-500', activeText: 'text-white' },
    { key: 'medium', label: '一般风险', value: 128, unit: '家', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', activeBg: 'bg-amber-500', activeText: 'text-white' },
    { key: 'low', label: '低风险', value: 195, unit: '家', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', activeBg: 'bg-emerald-500', activeText: 'text-white' },
    { key: null, label: '本月已检查', value: 286, unit: '家', color: 'text-zinc-700', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200', trend: '+12%', clickable: false },
    { key: null, label: '累计发现隐患', value: 1_247, unit: '项', color: 'text-zinc-700', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200', clickable: false },
    { key: null, label: '未整改隐患', value: 89, unit: '项', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', highlight: true, clickable: false },
  ] as const

  return (
    <div className="grid grid-cols-8 gap-3 mb-4">
      {metrics.map((m, idx) => {
        const isClickable = m.clickable !== false && m.key !== null
        const isActive = isClickable && selectedRiskLevel === m.key

        return (
          <button
            key={idx}
            onClick={() => isClickable && onSelectRiskLevel(m.key as RiskLevelFilter)}
            disabled={!isClickable}
            className={`
              p-3 rounded-xl border text-left transition-all
              ${isActive
                ? `${m.activeBg} ${m.activeText} border-transparent shadow-sm`
                : `${m.borderColor} ${m.bgColor} ${isClickable ? 'hover:shadow-sm hover:border-zinc-300 cursor-pointer' : 'cursor-default'}`
              }
              ${m.highlight && !isActive ? 'ring-1 ring-red-300' : ''}
            `}
          >
            <div className={`text-xs mb-1 ${isActive ? 'text-white/80' : 'text-zinc-500'}`}>
              {m.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold ${isActive ? 'text-white' : m.color}`}>
                {m.value.toLocaleString()}
              </span>
              <span className={`text-xs ${isActive ? 'text-white/70' : 'text-zinc-400'}`}>
                {m.unit}
              </span>
            </div>
            {m.trend && (
              <div className="text-[10px] text-emerald-600 mt-0.5">{m.trend}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// 3. 七维度治理效果（支持专家筛选）
// ─────────────────────────────────────────────

function DimensionCard({ dim }: { dim: DimensionScore }) {
  const trendColor = dim.trend === 'up' ? 'text-emerald-600' : dim.trend === 'down' ? 'text-red-500' : 'text-zinc-400'
  const trendIcon  = dim.trend === 'up' ? '▲' : dim.trend === 'down' ? '▼' : '─'
  const scoreColor = dim.score >= 80 ? '#16a34a' : dim.score >= 60 ? '#4f46e5' : dim.score >= 30 ? '#d97706' : '#dc2626'

  const maxH = 28, w = 72
  const vals  = dim.history.map(h => h.score)
  const minV  = Math.min(...vals) - 5
  const maxV  = Math.max(...vals) + 5
  const pts   = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w
    const y = maxH - ((v - minV) / (maxV - minV)) * maxH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const dangerCount  = dim.distribution[3].count
  const warningCount = dim.distribution[2].count

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border bg-white border-zinc-200/80">
      <span className="text-xs font-medium text-zinc-500">{dim.name}</span>

      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold tabular-nums" style={{ color: scoreColor }}>{dim.score}</span>
        <span className="text-xs text-zinc-400 mb-0.5">分</span>
        <span className={`ml-auto text-xs font-semibold ${trendColor}`}>
          {trendIcon}{dim.trendDelta > 0 ? dim.trendDelta : ''}
        </span>
      </div>

      {/* 迷你折线 */}
      <svg width={w} height={maxH + 4} viewBox={`0 0 ${w} ${maxH + 4}`} className="overflow-visible">
        <polyline
          points={pts}
          fill="none"
          stroke={dim.trend === 'down' ? '#ef4444' : '#6366f1'}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function SevenDimensionsSection({
  expertId,
  riskLevel,
}: {
  expertId: ExpertFilter
  riskLevel: RiskLevelFilter
}) {
  // 根据专家筛选和风险等级筛选返回对应数据
  const dimensions = useMemo(() => {
    let baseDimensions = stationChiefMock.governanceSevenDimensions

    // 专家筛选：选中具体专家时，基于专家绩效调整数据
    if (expertId !== 'all') {
      const expert = stationChiefMock.expertTeam.find(e => e.id === expertId)
      if (expert) {
        baseDimensions = expert.performanceDimensions.map((d) => ({
          name: d.name,
          score: d.score,
          prevScore: d.score - Math.floor(Math.random() * 10 - 5),
          trend: (Math.random() > 0.5 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
          trendDelta: Math.floor(Math.random() * 5),
          distribution: [
            { label: '优秀(≥80)', count: Math.floor(d.score * 3), color: '#16a34a' },
            { label: '良好(60-79)', count: Math.floor((100 - d.score) * 2), color: '#4f46e5' },
            { label: '关注(30-59)', count: Math.floor((100 - d.score) * 0.5), color: '#d97706' },
            { label: '危险(<30)', count: Math.floor((100 - d.score) * 0.2), color: '#dc2626' },
          ],
          bottomEnterprises: [],
          history: Array.from({ length: 6 }, (_, i) => ({
            month: `${i + 10}月`,
            score: Math.max(0, Math.min(100, d.score + Math.floor(Math.random() * 20 - 10))),
          })),
        })) as DimensionScore[]
      }
    }

    // 风险等级筛选：根据风险等级调整分值分布
    if (riskLevel !== 'all') {
      const riskMultipliers: Record<string, number> = {
        major: 0.7,   // 重大风险企业整体得分偏低
        high: 0.8,    // 较大风险
        medium: 0.9,  // 一般风险
        low: 1.05,    // 低风险企业得分偏高
      }
      const multiplier = riskMultipliers[riskLevel] || 1

      baseDimensions = baseDimensions.map(dim => {
        const adjustedScore = Math.min(100, Math.round(dim.score * multiplier))
        return {
          ...dim,
          score: adjustedScore,
          distribution: [
            { label: '优秀(≥80)', count: Math.floor(adjustedScore * 2.5), color: '#16a34a' },
            { label: '良好(60-79)', count: Math.floor((100 - adjustedScore) * 1.8), color: '#4f46e5' },
            { label: '关注(30-59)', count: Math.floor((100 - adjustedScore) * 0.8), color: '#d97706' },
            { label: '危险(<30)', count: Math.floor((100 - adjustedScore) * 0.4), color: '#dc2626' },
          ],
        }
      })
    }

    return baseDimensions
  }, [expertId, riskLevel])

  // 根据筛选条件动态生成描述
  const getDescription = () => {
    const parts: string[] = []
    if (expertId !== 'all') {
      const expert = stationChiefMock.expertTeam.find(e => e.id === expertId)
      if (expert) parts.push(`${expert.name}负责企业`)
    }
    if (riskLevel !== 'all') {
      const riskLabels: Record<string, string> = {
        major: '重大风险',
        high: '较大风险',
        medium: '一般风险',
        low: '低风险',
      }
      parts.push(riskLabels[riskLevel] || '')
    }
    if (parts.length > 0) {
      return `${parts.join(' · ')} · 各维度均分 · 分值段分布`
    }
    return '辖区各维度当月均分 · 迷你趋势 · 分值段分布'
  }

  return (
    <SectionBlock title="七维度治理效果" description={getDescription()}>
      <div className="grid grid-cols-7 gap-3">
        {dimensions.map((dim, idx) => (
          <DimensionCard key={idx} dim={dim as DimensionScore} />
        ))}
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 4. 企业状态路径 → 复用共享组件
// ─────────────────────────────────────────────
// 已提取至 src/components/shared/EnterpriseStatePath.tsx

// ─────────────────────────────────────────────
// 5. 专家详情面板（底部，与顶部筛选联动）
// ─────────────────────────────────────────────

function ExpertGradeBadge({ grade }: { grade: 'A' | 'B' | 'C' }) {
  const styles = { A: 'bg-emerald-100 text-emerald-700', B: 'bg-blue-100 text-blue-700', C: 'bg-red-100 text-red-600' }
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${styles[grade]}`}>
      {grade}
    </span>
  )
}

function MiniBar({ score, weight, name }: { score: number; weight: number; name: string }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#4f46e5' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-zinc-500 w-32 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono text-zinc-600 w-6 text-right">{score}</span>
      <span className="text-[10px] text-zinc-400 w-8">×{weight}%</span>
    </div>
  )
}

function WeeklySparkline({ data }: { data: { week: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count))
  const W = 160, H = 36
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (d.count / (max + 5)) * H,
    ...d,
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full" style={{ height: 44 }}>
      <path d={path} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(p => (
        <g key={p.week}>
          <circle cx={p.x} cy={p.y} r="2.5" fill="#6366f1" />
          <text x={p.x} y={H + 7} textAnchor="middle" fontSize="8" fill="#94a3b8">{p.week}</text>
        </g>
      ))}
    </svg>
  )
}

function ExpertDetailPanel({ expert }: { expert: ExpertMember }) {
  return (
    <div className="mt-4 p-5 bg-white border border-zinc-200 rounded-xl grid grid-cols-3 gap-6">
      {/* 核心KPI */}
      <div>
        <div className="text-xs font-medium text-zinc-500 mb-3">本月核心指标</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '处理任务',   value: `${expert.totalTasks}件`,    growth: expert.taskGrowth },
            { label: '闭环通过率', value: `${expert.closureRate}%`,    growth: expert.closureRateGrowth },
            { label: '平均闭环',   value: `${expert.avgClosureDays}天`, growth: 0 },
            { label: '风险精准度', value: `${expert.riskAccuracy}%`,   growth: 0 },
          ].map(k => (
            <div key={k.label} className="p-3 bg-zinc-50 rounded-lg">
              <div className="text-[10px] text-zinc-500 mb-1">{k.label}</div>
              <div className="text-base font-bold text-zinc-800">{k.value}</div>
              {k.growth !== 0 && (
                <div className={`text-[10px] mt-0.5 ${k.growth > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {k.growth > 0 ? `↑${k.growth}%` : `↓${Math.abs(k.growth)}%`} 较上月
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="text-[10px] text-zinc-400 mb-1">近6周任务量</div>
          <WeeklySparkline data={expert.weeklyTasks} />
        </div>
      </div>

      {/* 7维度绩效 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-zinc-500">绩效7维度</div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-zinc-800">{expert.performanceScore}</span>
            <span className="text-xs text-zinc-400">/ 100</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {expert.performanceDimensions.map(d => (
            <MiniBar key={d.name} score={d.score} weight={d.weight} name={d.name} />
          ))}
        </div>
      </div>

      {/* 企业池概况 */}
      <div>
        <div className="text-xs font-medium text-zinc-500 mb-3">企业责任池</div>
        <div className="p-4 bg-zinc-50 rounded-xl">
          <div className="text-3xl font-bold text-zinc-800">{expert.enterpriseCount}</div>
          <div className="text-xs text-zinc-500 mt-0.5">家企业</div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-zinc-500">综合绩效排名</span>
            <span className="font-medium text-zinc-700">
              #{stationChiefMock.expertTeam
                .slice()
                .sort((a, b) => b.performanceScore - a.performanceScore)
                .findIndex(e => e.id === expert.id) + 1}
              &nbsp;/&nbsp;{stationChiefMock.expertTeam.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-zinc-500">绩效等级</span>
            <ExpertGradeBadge grade={expert.grade} />
          </div>
        </div>
        {expert.grade === 'C' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-700 font-medium mb-1">⚠ 需要关注</div>
            <div className="text-[11px] text-red-600">
              该专家绩效连续下滑，建议及时约谈，重点加强自查执行与隐患闭环两个维度。
            </div>
            <button className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium underline">
              发起督办 →
            </button>
          </div>
        )}
        {expert.grade === 'A' && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="text-xs text-emerald-700 font-medium">优秀专家</div>
            <div className="text-[11px] text-emerald-600 mt-1">
              本月表现优异，可考虑分享工作方法给团队。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ExpertDetailSection({ selectedExpertId }: { selectedExpertId: ExpertFilter }) {
  if (selectedExpertId === 'all') {
    // 全部模式：展示所有专家的简要卡片
    return (
      <SectionBlock title="专家团队效能总览" description="查看所有专家的绩效表现，点击顶部筛选器可查看单个专家详情">
        <div className="grid grid-cols-4 gap-3">
          {stationChiefMock.expertTeam.map(expert => {
            const rank = stationChiefMock.expertTeam
              .slice()
              .sort((a, b) => b.performanceScore - a.performanceScore)
              .findIndex(e => e.id === expert.id) + 1
            return (
              <div key={expert.id} className="p-4 bg-white border border-zinc-200 rounded-xl hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                    ${expert.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : expert.grade === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}
                  `}>
                    {expert.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-800">{expert.name}</div>
                    <div className="text-xs text-zinc-400">排名 #{rank}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-zinc-50 rounded">
                    <div className="text-zinc-400">绩效分</div>
                    <div className="font-semibold text-zinc-800">{expert.performanceScore}</div>
                  </div>
                  <div className="p-2 bg-zinc-50 rounded">
                    <div className="text-zinc-400">处理任务</div>
                    <div className="font-semibold text-zinc-800">{expert.totalTasks}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </SectionBlock>
    )
  }

  // 单个专家模式
  const expert = stationChiefMock.expertTeam.find(e => e.id === selectedExpertId)
  if (!expert) return null

  return (
    <SectionBlock title={`${expert.name} - 专家效能详情`} description="该专家的完整绩效分析与核心指标">
      <ExpertDetailPanel expert={expert} />
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────

export function StationChiefDashboard() {
  const timeOptions = [
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '本季', value: 'quarter' },
  ]
  const [timeRange, setTimeRange] = useState('month')
  const [selectedExpertId, setSelectedExpertId] = useState<ExpertFilter>('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevelFilter>('all')

  return (
    <>
      <RoleIndicator
        title="应消站站长看板"
        description="作为应急消防管理站站长，您需要关注辖区整体安全状况和专家团队的工作成效。不仅要看隐患整改结果，还要看专家过程管理的实际成果。"
        goals={[
          '确保辖区重点隐患得到有效处理',
          '监督专家团队工作质量和效率',
          '推动隐患从发现到整改的全闭环',
          '提升辖区整体安全水平',
        ]}
        keyMetrics={['重点隐患数量', '隐患整改率', '专家任务完成率', '重大隐患跟进率', '企业覆盖率', '火灾事故数']}
      />

      <PageShell>
        <PageHeader
          title="应消站站长工作台"
          subtitle="辖区安全监管与专家管理"
          updateTime="2026-04-08 10:00"
        />

        {/* 过滤栏：专家筛选 + 时间筛选（同一行，专家优先） */}
        <div className="flex items-center gap-6 px-1 mb-4">
          {/* 专家筛选器 */}
          <ExpertFilterBar
            selectedExpertId={selectedExpertId}
            onSelect={setSelectedExpertId}
          />

          {/* 时间筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">时间：</span>
            <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-xs">
              {timeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    timeRange === opt.value ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-500 hover:text-zinc-700'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 核心风险指标卡片（点击可筛选风险等级） */}
        <RiskMetricsCards
          selectedRiskLevel={selectedRiskLevel}
          onSelectRiskLevel={setSelectedRiskLevel}
        />

        {/* M1.1 七维度治理效果（受专家和风险等级筛选影响） */}
        <SevenDimensionsSection expertId={selectedExpertId} riskLevel={selectedRiskLevel} />

        {/* M1.2 企业状态路径（受专家和风险等级筛选影响） */}
        <EnterpriseStatePath
          expertId={selectedExpertId === 'all' ? undefined : selectedExpertId}
          riskLevel={selectedRiskLevel === 'all' ? undefined : selectedRiskLevel}
        />

        {/* M1.3 专家效能详情（与顶部筛选联动） */}
        <ExpertDetailSection selectedExpertId={selectedExpertId} />

        {/* 隐患治理趋势 */}
        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="隐患数量趋势"
            currentValue={stationChiefMock.coreResults[0].value}
            data={stationChiefMock.hazardTrend}
            trend={{ value: -12.5, type: 'down' }}
          />
          <DistributionCard
            title="隐患等级分布"
            data={stationChiefMock.hazardDistribution}
            total={100}
          />
        </div>

        {/* 专家工作量排名 */}
        <div className="grid grid-cols-2 gap-grid">
          <RankingCard
            title="专家任务量 TOP 5"
            data={stationChiefMock.expertRanking}
            maxItems={5}
          />
          <StatusCard
            title="专家任务状态"
            items={stationChiefMock.expertTaskStatus}
          />
        </div>

        {/* 重点隐患清单 */}
        <SectionBlock title="重点隐患跟进情况">
          <TableCard
            title="重大隐患清单"
            columns={stationChiefMock.majorHazardColumns}
            data={stationChiefMock.majorHazards}
            maxRows={8}
          />
        </SectionBlock>

        {/* 辖区安全状况 */}
        <div className="grid grid-cols-2 gap-grid">
          <DistributionCard
            title="企业风险等级分布"
            data={stationChiefMock.enterpriseRiskDistribution}
            total={100}
          />
          <StatusCard
            title="辖区安全状态"
            items={stationChiefMock.districtSafetyStatus}
          />
        </div>
      </PageShell>
    </>
  )
}
