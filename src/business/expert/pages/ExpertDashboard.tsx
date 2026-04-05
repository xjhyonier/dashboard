import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, StatusCard, RankingCard } from '../../../components/widgets'
import expertMock from '../mock'
import type { OperationalNudge } from '../types'

export function ExpertDashboard() {
  const [timeRange, setTimeRange] = useState('today')
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set())
  const { enterprises, dashboardKpi, workProgress, taskProgress, todos, poolChanges, expertPerformance, operationalNudges, operationalMetrics } = expertMock

  const riskTop10 = [...enterprises]
    .sort((a, b) => a.riskScore - b.riskScore)
    .slice(0, 10)
    .map((ent, i) => ({
      rank: i + 1,
      label: ent.name,
      value: ent.riskScore,
      trend: (ent.aiInsight?.trend?.length ?? 0) >= 2
        ? (ent.aiInsight!.trend[ent.aiInsight!.trend.length - 1].score < ent.aiInsight!.trend[ent.aiInsight!.trend.length - 2].score ? 'up' : 'down')
        : 'same' as const,
    }))

  // 紧急任务队列
  const urgentTasks = todos
    .filter(t => t.status !== 'done' && t.status !== 'closed' && t.enterpriseId)
    .map(t => {
      const ent = enterprises.find(e => e.id === t.enterpriseId)
      return { ...t, riskScore: ent?.riskScore ?? 50 }
    })
    .sort((a, b) => a.riskScore - b.riskScore || new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 8)

  // 未忽略的运营指引
  const activeNudges = operationalNudges.filter(n => !dismissedNudges.has(n.id) && !n.dismissed)
  // 未读责任池变动
  const unreadChanges = poolChanges.filter(c => !c.read)
  // 待标注企业数（风险评级不一致）
  const pendingDiscrepancyCount = expertMock.riskDiscrepancies
    ? expertMock.riskDiscrepancies.filter(d => d.status === 'pending').length
    : 0

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500'
    if (progress >= 30) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-600'
  }

  const getDaysUntil = (isoString: string) => {
    const now = new Date()
    const target = new Date(isoString)
    const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAction = (taskType: string, enterpriseName: string) => {
    alert(`Demo: ${taskType} - ${enterpriseName}`)
  }

  const handleDismissNudge = (nudgeId: string) => {
    setDismissedNudges(prev => new Set(prev).add(nudgeId))
  }

  const workGroupNames = ['消防专项组', '化工巡查组', '园区日常组']
  const workGroupDistribution = workGroupNames.map(name => {
    const count = enterprises.filter(e => e.workGroups.includes(name)).length
    return { name, count }
  })

  const nudgeTypeConfig: Record<string, { label: string; bgClass: string; textClass: string }> = {
    warning: { label: '预警', bgClass: 'bg-orange-50', textClass: 'text-orange-700' },
    supervision: { label: '督导', bgClass: 'bg-blue-50', textClass: 'text-blue-700' },
    effectiveness: { label: '成效', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  }

  const metricGaugeColor = (value: number, highThreshold: number, midThreshold: number) => {
    if (value > highThreshold) return 'text-red-600 stroke-red-600'
    if (value > midThreshold) return 'text-amber-500 stroke-amber-500'
    return 'text-green-600 stroke-green-600'
  }

  return (
    <PageShell maxWidth="wide">
      <PageHeader
        title="工作驾驶舱"
        subtitle="一屏看全局，10秒知道今天该干什么"
        updateTime="2026-04-04 21:00"
      />

      {/* 时间范围筛选 */}
      <FilterBar filters={[
        {
          key: 'timeRange', label: '时间范围', type: 'tabs', value: timeRange,
          options: [
            { label: '今日', value: 'today' },
            { label: '本周', value: 'week' },
            { label: '本月', value: 'month' },
          ],
          onChange: setTimeRange,
        },
      ]} />

      {/* 今日待办概览 */}
      <SectionBlock>
        <GridLayout columns={4}>
          <KpiCard
            title="今日待办"
            value={dashboardKpi.todayTodoCount}
            unit="项"
            trend={{ value: 2, label: '较昨日', type: 'up' }}
            description="需要今日完成的任务"
          />
          <KpiCard
            title="本周到期"
            value={dashboardKpi.weekExpiringCount}
            unit="项"
            trend={{ value: 1, label: '较昨日', type: 'down' }}
            description="本周内需完成的任务"
          />
          <KpiCard
            title="逾期未处理"
            value={dashboardKpi.overdueCount}
            unit="项"
            description="超期未完成的任务"
          />
          <KpiCard
            title="本月已完成"
            value={dashboardKpi.monthCompletedCount}
            unit="项"
            trend={{ value: 15, label: '本月', type: 'neutral' }}
            description="本月已完成任务"
          />
        </GridLayout>
      </SectionBlock>

      {/* 运营指引区 */}
      {activeNudges.length > 0 && (
        <SectionBlock title="工作指引" description="系统根据运营数据自动生成的行动建议">
          <div className="space-y-3">
            {activeNudges.slice(0, 3).map(nudge => {
              const config = nudgeTypeConfig[nudge.type]
              return (
                <div key={nudge.id} className={`card ${config.bgClass} border border-opacity-30 flex items-start justify-between gap-4`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bgClass} ${config.textClass} border border-current border-opacity-20`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-text-tertiary">{nudge.relatedMetric}</span>
                    </div>
                    <p className="text-sm text-text leading-relaxed">{nudge.content}</p>
                    {nudge.relatedEnterpriseIds && nudge.relatedEnterpriseIds.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {nudge.relatedEnterpriseIds.map(eid => {
                          const ent = enterprises.find(e => e.id === eid)
                          return ent ? (
                            <button
                              key={eid}
                              onClick={() => handleAction('跳转企业面板', ent.name)}
                              className="text-xs px-2 py-0.5 bg-white/70 text-primary rounded-md hover:bg-white transition-colors border border-primary/20"
                            >
                              {ent.name}
                            </button>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismissNudge(nudge.id)}
                    className="text-xs text-text-tertiary hover:text-text-secondary transition-colors shrink-0 mt-1"
                  >
                    忽略
                  </button>
                </div>
              )
            })}
          </div>
        </SectionBlock>
      )}

      {/* 本周工作进度 + 绩效概览 */}
      <SectionBlock>
        <div className="grid grid-cols-2 gap-grid">
          <StatusCard
            title="本周工作进度"
            items={[
              {
                label: '走访覆盖率',
                status: workProgress.visitCoverageRate >= 80 ? 'success' : workProgress.visitCoverageRate >= 50 ? 'warning' : 'danger',
                count: `${workProgress.visitCoverageRate}%`,
              },
              { label: '隐患发现数', status: 'success', count: workProgress.hazardDiscoveryCount },
              { label: '整改推动数', status: 'success', count: workProgress.rectificationPushCount },
              {
                label: '台账完整度',
                status: workProgress.ledgerCompleteness >= 80 ? 'success' : workProgress.ledgerCompleteness >= 50 ? 'warning' : 'danger',
                count: `${workProgress.ledgerCompleteness}%`,
              },
            ]}
          />

          {/* 绩效概览 Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-text-secondary font-medium">我的绩效概览</div>
              <div className="text-xs text-text-tertiary">
                团队第 {expertPerformance.rankInTeam}/{expertPerformance.totalTeamMembers} 名
              </div>
            </div>
            {/* 综合得分 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    className={expertPerformance.overallScore >= 80 ? 'stroke-green-500' : expertPerformance.overallScore >= 60 ? 'stroke-amber-500' : 'stroke-red-500'}
                    strokeWidth="3"
                    strokeDasharray={`${expertPerformance.overallScore} ${100 - expertPerformance.overallScore}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${getScoreColor(expertPerformance.overallScore)}`}>
                  {expertPerformance.overallScore}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-tertiary mb-1">综合得分</div>
                <div className="text-xs text-text-secondary">
                  {expertPerformance.dimensions.filter(d => d.score < d.targetScore).length} 个维度低于目标
                </div>
              </div>
            </div>
            {/* 7维迷你进度条 */}
            <div className="space-y-2">
              {expertPerformance.dimensions
                .sort((a, b) => b.weight - a.weight)
                .map(dim => {
                  const isWeak = dim.score < dim.targetScore
                  return (
                    <div key={dim.id} className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary w-20 truncate shrink-0" title={dim.name}>{dim.name}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isWeak ? 'bg-amber-400' : 'bg-green-400'}`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-8 text-right ${isWeak ? 'text-amber-500' : 'text-green-600'}`}>
                        {dim.score}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {dim.trend === 'up' ? '\u2191' : dim.trend === 'down' ? '\u2193' : '\u2192'}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </SectionBlock>

      {/* 检查任务进度 + 运营指标 */}
      <SectionBlock>
        <div className="grid grid-cols-2 gap-grid">
          {/* 检查任务进度 */}
          <div className="card">
            <div className="text-sm text-text-secondary font-medium mb-4">检查任务进度</div>
            <div className="space-y-4">
              {/* 日常检查 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text">日常检查</span>
                  <span className="text-sm text-text-secondary">{taskProgress.dailyAvgProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(taskProgress.dailyAvgProgress)}`} style={{ width: `${taskProgress.dailyAvgProgress}%` }} />
                </div>
              </div>
              {/* 专项检查 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text">专项检查</span>
                    <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">紧急</span>
                  </div>
                  <span className="text-sm text-text-secondary">{taskProgress.specialAvgProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(taskProgress.specialAvgProgress)}`} style={{ width: `${taskProgress.specialAvgProgress}%` }} />
                </div>
              </div>
              {/* 最近截止 */}
              <div className="pt-2 border-t border-border">
                {(() => {
                  const days = getDaysUntil(taskProgress.nearestDeadline)
                  return days < 0
                    ? <span className="text-sm text-danger font-medium">已逾期 {Math.abs(days)} 天</span>
                    : <span className="text-sm text-text-secondary">距最近截止还有 {days} 天</span>
                })()}
              </div>
            </div>
          </div>

          {/* 运营指标 */}
          <div className="card">
            <div className="text-sm text-text-secondary font-medium mb-4">运营核心指标</div>
            <div className="grid grid-cols-2 gap-4">
              {/* 隐患整改逾期率 */}
              <div className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      className={metricGaugeColor(operationalMetrics.hazardRectificationOverdueRate, 30, 15)}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min(operationalMetrics.hazardRectificationOverdueRate, 100)} ${Math.max(100 - operationalMetrics.hazardRectificationOverdueRate, 0)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${metricGaugeColor(operationalMetrics.hazardRectificationOverdueRate, 30, 15)}`}>
                    {operationalMetrics.hazardRectificationOverdueRate}%
                  </div>
                </div>
                <div className="text-xs text-text-tertiary">隐患整改逾期率</div>
              </div>
              {/* 自查自纠逾期率 */}
              <div className="text-center">
                <div className="relative w-14 h-14 mx-auto mb-2">
                  <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      className={metricGaugeColor(operationalMetrics.selfCheckOverdueRate, 25, 10)}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min(operationalMetrics.selfCheckOverdueRate, 100)} ${Math.max(100 - operationalMetrics.selfCheckOverdueRate, 0)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${metricGaugeColor(operationalMetrics.selfCheckOverdueRate, 25, 10)}`}>
                    {operationalMetrics.selfCheckOverdueRate}%
                  </div>
                </div>
                <div className="text-xs text-text-tertiary">自查自纠逾期率</div>
              </div>
              {/* 从不自查率 */}
              <div className="text-center">
                <div className={`text-2xl font-bold mb-1 ${metricGaugeColor(operationalMetrics.neverSelfCheckRate, 15, 5)}`}>
                  {operationalMetrics.neverSelfCheckRate}%
                </div>
                <div className="text-xs text-text-tertiary">从不自查率</div>
                <div className="text-xs text-red-500 mt-0.5">红线指标</div>
              </div>
              {/* 趋势增长率 */}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  +{operationalMetrics.weeklyTrendGrowth}%
                </div>
                <div className="text-xs text-text-tertiary">周趋势增长</div>
                <div className="text-xs text-green-500 mt-0.5">
                  月增长 +{operationalMetrics.monthlyTrendGrowth}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionBlock>

      {/* 风险红榜 TOP 10 */}
      <SectionBlock>
        <div className="grid grid-cols-2 gap-grid">
          <RankingCard
            title="风险红榜 TOP 10"
            data={riskTop10.slice(0, 5)}
            maxItems={5}
          />
          <RankingCard
            title=""
            data={riskTop10.slice(5, 10).map(d => ({ ...d, rank: d.rank }))}
            maxItems={5}
          />
        </div>
      </SectionBlock>

      {/* 紧急任务队列 */}
      <SectionBlock title="紧急任务队列" description="按风险分值排序，最需要关注的任务在最前">
        <div className="space-y-3">
          {urgentTasks.map((task) => (
            <div key={task.id} className="card flex items-center gap-4">
              {/* 左侧色条 */}
              <div className={`w-1 self-stretch rounded-full ${task.riskScore < 30 ? 'bg-red-500' : task.riskScore < 60 ? 'bg-orange-500' : 'bg-amber-500'}`} />

              {/* 主内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text truncate">{task.enterpriseName}</span>
                  {task.workGroup && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">{task.workGroup}</span>
                  )}
                </div>
                <p className="text-sm text-text-secondary truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-text-tertiary rounded">{task.sourceLabel}</span>
                  <span className="text-xs text-text-tertiary">
                    截止: {new Date(task.deadline).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {new Date(task.deadline) < new Date() && (
                    <span className="text-xs text-danger font-medium">逾期</span>
                  )}
                </div>
              </div>

              {/* 右侧：风险分 + 操作 */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div className={`text-lg font-bold ${task.riskScore < 30 ? 'text-red-600' : task.riskScore < 60 ? 'text-orange-500' : 'text-amber-500'}`}>
                    {task.riskScore}
                  </div>
                  <div className="text-xs text-text-tertiary">风险分</div>
                </div>
                <button
                  onClick={() => handleAction(task.title, task.enterpriseName || '')}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {task.status === 'todo' ? '去处理' : '跟进'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionBlock>

      {/* 风险评级不一致提醒 */}
      {pendingDiscrepancyCount > 0 && (
        <div className="card border-red-200 bg-red-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm font-bold">
              {pendingDiscrepancyCount}
            </div>
            <div>
              <div className="text-sm font-medium text-text">风险评级待核对</div>
              <div className="text-sm text-text-secondary">有 {pendingDiscrepancyCount} 家企业的 AI 风险评级与专家评级不一致，需要您核对定级</div>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
            去核对
          </button>
        </div>
      )}

      {/* 责任池变动通知 */}
      {unreadChanges.length > 0 && (
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-text mb-1">责任池变动</div>
            <div className="text-sm text-text-secondary">
              {unreadChanges.slice(0, 2).map(c => {
                const typeLabels: Record<string, string> = { added: '新增', transferred_in: '接收' }
                return `${typeLabels[c.type] || c.type} ${c.enterpriseName}`
              }).join('；')}
              {unreadChanges.length > 2 && ' 等'}
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            查看全部
          </button>
        </div>
      )}
    </PageShell>
  )
}
