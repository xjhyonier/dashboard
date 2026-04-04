import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, StatusCard, RankingCard } from '../../../components/widgets'
import expertMock from '../mock'

export function ExpertDashboard() {
  const [timeRange, setTimeRange] = useState('today')
  const { enterprises, dashboardKpi, workProgress, taskProgress, todos, poolChanges } = expertMock

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

  // 紧急任务队列：从待办中取待处理的，按风险分排序
  const urgentTasks = todos
    .filter(t => t.status !== 'done' && t.status !== 'closed' && t.enterpriseId)
    .map(t => {
      const ent = enterprises.find(e => e.id === t.enterpriseId)
      return { ...t, riskScore: ent?.riskScore ?? 50 }
    })
    .sort((a, b) => a.riskScore - b.riskScore || new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 8)

  // 未读责任池变动
  const unreadChanges = poolChanges.filter(c => !c.read)
  // 待标注企业数
  const pendingAnnotationCount = enterprises.filter(e => e.expertRating === undefined).length

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500'
    if (progress >= 30) return 'bg-amber-500'
    return 'bg-red-500'
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

  const workGroupNames = ['消防专项组', '化工巡查组', '园区日常组']
  const workGroupDistribution = workGroupNames.map(name => {
    const count = enterprises.filter(e => e.workGroups.includes(name)).length
    return { name, count }
  })

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

      {/* 今日待办概览 + 责任池统计 */}
      <SectionBlock>
        <div className="grid grid-cols-3 gap-grid">
          <div className="col-span-2">
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
          </div>

          {/* 责任池统计 Card */}
          <div className="card">
            <div className="text-sm text-text-secondary font-medium mb-3">责任池统计</div>
            <div className="text-3xl font-bold text-text mb-3">{enterprises.length} <span className="text-base font-normal text-text-tertiary">家</span></div>
            <div className="space-y-2">
              {workGroupDistribution.map(g => (
                <div key={g.name} className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-lg">
                    {g.name}
                  </span>
                  <span className="text-sm text-text-secondary">{g.count} 家</span>
                </div>
              ))}
            </div>
            {unreadChanges.length > 0 && (
              <button className="mt-3 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
                {unreadChanges.length} 条新变动 &rarr;
              </button>
            )}
          </div>
        </div>
      </SectionBlock>

      {/* 本周工作进度 + 检查任务进度 */}
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

      {/* 标注提醒 */}
      {pendingAnnotationCount > 0 && (
        <div className="card border-amber-200 bg-amber-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-sm font-bold">
              {pendingAnnotationCount}
            </div>
            <div>
              <div className="text-sm font-medium text-text">待标注企业</div>
              <div className="text-sm text-text-secondary">有 {pendingAnnotationCount} 家企业的 AI 评级与专家评级不一致，需要您标注</div>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors">
            去处理
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
