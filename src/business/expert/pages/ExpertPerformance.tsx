import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock } from '../../../components/layout'
import { KpiCard } from '../../../components/widgets'
import expertMock from '../mock'
import type { PerformanceDimension } from '../types'

export function ExpertPerformance() {
  const [timeRange, setTimeRange] = useState('month')
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())
  const { expertPerformance } = expertMock

  const toggleDimension = (dimId: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev)
      if (next.has(dimId)) next.delete(dimId)
      else next.add(dimId)
      return next
    })
  }

  // 自动展开薄弱维度
  useState(() => {
    const weakDims = expertPerformance.dimensions
      .filter(d => d.score < d.targetScore)
      .map(d => d.id)
    if (weakDims.length > 0) {
      setExpandedDimensions(new Set(weakDims))
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-600'
  }

  const getProgressColor = (score: number, target: number) => {
    if (score >= target) return 'bg-green-500'
    if (score >= target * 0.8) return 'bg-amber-400'
    return 'bg-red-500'
  }

  const getRingColor = (score: number) => {
    if (score >= 80) return 'stroke-green-500'
    if (score >= 60) return 'stroke-amber-500'
    if (score >= 40) return 'stroke-orange-500'
    return 'stroke-red-500'
  }

  const getTrendDisplay = (trend: string) => {
    switch (trend) {
      case 'up': return { arrow: '\u2191', label: '上升中', color: 'text-green-500' }
      case 'down': return { arrow: '\u2193', label: '下降中', color: 'text-red-500' }
      default: return { arrow: '\u2192', label: '持平', color: 'text-slate-400' }
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900'
    if (rank === 2) return 'bg-slate-300 text-slate-700'
    if (rank === 3) return 'bg-amber-600 text-amber-100'
    return 'bg-slate-100 text-slate-500'
  }

  // 按权重降序排列维度
  const sortedDimensions = [...expertPerformance.dimensions].sort((a, b) => b.weight - a.weight)

  // 改善建议（基于薄弱维度生成）
  const weakDimensions = expertPerformance.dimensions.filter(d => d.score < d.targetScore)
  const improvementSuggestions = weakDimensions.map(dim => {
    const gap = dim.targetScore - dim.score
    switch (dim.id) {
      case 'check_activity':
        return { dimension: dim.name, content: `自查执行活跃度偏低（${dim.score}分），目标 ${dim.targetScore} 分。建议增加日常巡查频率，重点覆盖高风险企业，确保计划检查达标户数比例提升 ${gap} 分。`, priority: 1 }
      case 'systemization':
        return { dimension: dim.name, content: `制度数字化完善度不足（${dim.score}分）。建议督促责任池内企业完善安全制度文档录入，重点关注教育培训和安全制度板块。`, priority: 2 }
      case 'hazard_governance':
        return { dimension: dim.name, content: `隐患闭环治理度需提升（${dim.score}分）。建议加快隐患整改进度跟踪，对逾期隐患进行集中复核，推动整改完成率提升。`, priority: 3 }
      case 'plan_quality':
        return { dimension: dim.name, content: `检查计划科学度不足（${dim.score}分）。建议在制定检查计划时，优先覆盖重大/较大风险企业，避免只检查低风险企业。`, priority: 4 }
      case 'coverage':
        return { dimension: dim.name, content: `企业基础覆盖度偏低（${dim.score}分）。建议加快责任池内企业的账号开通和信息采集工作。`, priority: 5 }
      case 'remote_effectiveness':
        return { dimension: dim.name, content: `远程监管效能度（权重最高30%）需重点关注。建议提升远程监管覆盖率，并加强按户按项整改完成率的跟踪。`, priority: 6 }
      default:
        return { dimension: dim.name, content: `${dim.name}（${dim.score}分）低于目标 ${dim.targetScore} 分，需持续改进。`, priority: 7 }
    }
  }).sort((a, b) => a.priority - b.priority)

  return (
    <PageShell maxWidth="wide">
      <PageHeader
        title="我的绩效"
        subtitle="7 维评估模型 - 白皮书第 12 章"
        updateTime={new Date(expertPerformance.updatedAt).toLocaleString('zh-CN')}
      />

      {/* 时间范围筛选 */}
      <FilterBar filters={[
        {
          key: 'timeRange', label: '时间范围', type: 'tabs', value: timeRange,
          options: [
            { label: '本周', value: 'week' },
            { label: '本月', value: 'month' },
            { label: '本季度', value: 'quarter' },
            { label: '本年度', value: 'year' },
          ],
          onChange: setTimeRange,
        },
      ]} />

      {/* 综合绩效概览 */}
      <SectionBlock>
        <div className="grid grid-cols-3 gap-grid">
          {/* 环形得分 */}
          <div className="card flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  className={getRingColor(expertPerformance.overallScore)}
                  strokeWidth="2.5"
                  strokeDasharray={`${expertPerformance.overallScore} ${100 - expertPerformance.overallScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${getScoreColor(expertPerformance.overallScore)}`}>
                  {expertPerformance.overallScore}
                </span>
                <span className="text-xs text-text-tertiary">分</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-text-secondary font-medium mb-2">综合得分</div>
              {expertPerformance.rankInTeam && expertPerformance.totalTeamMembers && (
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getRankBadge(expertPerformance.rankInTeam)}`}>
                    {expertPerformance.rankInTeam}
                  </span>
                  <span className="text-sm text-text-secondary">
                    / 共 {expertPerformance.totalTeamMembers} 人
                  </span>
                </div>
              )}
              <div className="text-xs text-text-tertiary">
                {weakDimensions.length > 0
                  ? `${weakDimensions.length} 个维度低于目标`
                  : '所有维度均达标'}
              </div>
            </div>
          </div>

          {/* 得分分布 */}
          <div className="card">
            <div className="text-sm text-text-secondary font-medium mb-3">得分分布</div>
            <div className="space-y-2">
              {sortedDimensions.slice(0, 4).map(dim => (
                <div key={dim.id} className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary w-16 truncate shrink-0">{dim.name}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressColor(dim.score, dim.targetScore)}`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-6 text-right">{dim.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 快速统计 */}
          <div className="grid grid-cols-2 gap-grid">
            <KpiCard
              title="超额维度"
              value={expertPerformance.dimensions.filter(d => d.score >= d.targetScore).length}
              unit="个"
              description="达到或超过目标"
            />
            <KpiCard
              title="薄弱维度"
              value={weakDimensions.length}
              unit="个"
              description="低于目标值"
            />
          </div>
        </div>
      </SectionBlock>

      {/* 7 维评估详情 */}
      <SectionBlock title="7 维评估详情" description="基于白皮书专家绩效评估体系，按权重降序排列">
        <div className="space-y-3">
          {sortedDimensions.map(dim => {
            const isWeak = dim.score < dim.targetScore
            const isExpanded = expandedDimensions.has(dim.id)
            const trend = getTrendDisplay(dim.trend)

            return (
              <div key={dim.id} className={`card ${isWeak ? 'border-amber-200' : ''}`}>
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() => toggleDimension(dim.id)}
                >
                  {/* 维度名称 + 权重 */}
                  <div className="w-44 shrink-0">
                    <div className="text-sm font-medium text-text">{dim.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${dim.weight >= 20 ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-text-tertiary'}`}>
                        权重 {dim.weight}%
                      </span>
                      {isWeak && <span className="text-xs text-amber-500 font-medium">低于目标</span>}
                      {!isWeak && <span className="text-xs text-green-500 font-medium">达标</span>}
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-tertiary">{dim.formula}</span>
                      <span className="text-xs text-text-secondary">
                        得分 <span className={`font-semibold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                        / 目标 {dim.targetScore}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(dim.score, dim.targetScore)}`}
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>
                    {/* 目标线 */}
                    <div
                      className="relative h-0 -mt-2"
                      style={{ left: `${dim.targetScore}%` }}
                    >
                      <div className="absolute top-0 w-0.5 h-2 bg-text-tertiary/30 rounded" />
                    </div>
                  </div>

                  {/* 趋势 */}
                  <div className="text-center w-16 shrink-0">
                    <span className={`text-lg ${trend.color}`}>{trend.arrow}</span>
                    <div className="text-xs text-text-tertiary">{trend.label}</div>
                  </div>

                  {/* 展开箭头 */}
                  <div className={`text-text-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                    {'\u25B6'}
                  </div>
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">当前得分</div>
                        <div className={`text-xl font-bold ${getScoreColor(dim.score)}`}>{dim.score}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">目标得分</div>
                        <div className="text-xl font-bold text-text-secondary">{dim.targetScore}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">差距</div>
                        <div className={`text-xl font-bold ${isWeak ? 'text-red-500' : 'text-green-500'}`}>
                          {isWeak ? `${dim.targetScore - dim.score}` : `+${dim.score - dim.targetScore}`}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <div className="text-xs text-text-tertiary mb-1">计算逻辑</div>
                      <div className="text-sm text-text-secondary">{dim.formula}</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SectionBlock>

      {/* 改善建议 */}
      {improvementSuggestions.length > 0 && (
        <SectionBlock title="改善建议" description={`基于 ${weakDimensions.length} 个薄弱维度自动生成`}>
          <div className="space-y-3">
            {improvementSuggestions.map((suggestion, index) => (
              <div key={suggestion.dimension} className="card flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                      {suggestion.dimension}
                    </span>
                    <span className="text-xs text-text-tertiary">优先级 #{suggestion.priority}</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{suggestion.content}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      )}
    </PageShell>
  )
}
