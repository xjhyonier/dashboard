import { useState } from 'react'
import { expertMock } from '../mock'

// ==================== 类型 ====================
type ReportPeriod = 'day' | 'week' | 'month'

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  day: '日报',
  week: '周报',
  month: '月报',
}

// ==================== 辅助函数 ====================

/** 趋势箭头组件 */
function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up')
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px] font-medium">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 2L8.5 6H1.5L5 2Z" />
        </svg>
        上升
      </span>
    )
  if (trend === 'down')
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 text-[11px] font-medium">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 8L1.5 4H8.5L5 8Z" />
        </svg>
        下降
      </span>
    )
  return (
    <span className="inline-flex items-center gap-0.5 text-zinc-400 text-[11px] font-medium">持平</span>
  )
}

/** 进度条 */
function ScoreBar({ score, target, color = 'bg-emerald-500' }: { score: number; target: number; color?: string }) {
  const pct = Math.min((score / target) * 100, 100)
  const overTarget = score >= target
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${overTarget ? 'bg-emerald-500' : score / target > 0.8 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-zinc-500 w-20 text-right">
        {score}
        <span className="text-zinc-300">/{target}</span>
      </span>
    </div>
  )
}

/** 风险等级色 */
function RiskDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    重大风险: 'bg-red-500',
    较大风险: 'bg-amber-500',
    一般风险: 'bg-blue-400',
    低风险: 'bg-emerald-400',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[level] ?? 'bg-zinc-300'}`} />
}

// ==================== Mock 增强数据 ====================

const WEEKLY_REPORT_MOCK = {
  // 本周 vs 上周 对比
  weekVsLast: {
    // 隐患整改率: 本周 vs 上周 vs 目标
    hazardRectRate: { current: 65, last: 62, target: 85, trend: 'up' as const },
    // 自查提交率
    selfCheckRate: { current: 78, last: 66, target: 80, trend: 'up' as const },
    // 台账完整度
    ledgerRate: { current: 75, last: 73, target: 90, trend: 'up' as const },
    // 走访覆盖率
    visitRate: { current: 68, last: 70, target: 85, trend: 'down' as const },
    // 待办完成率
    todoCompletionRate: { current: 72, last: 68, target: 80, trend: 'up' as const },
    // 服务记录数
    serviceCount: { current: 15, last: 12, target: null as null },
  },
  // 逾期警告
  overdueAlerts: [
    { id: 1, type: 'hazard', level: '重大隐患', enterprise: '天成建材有限公司', desc: '消防器材老化过期', days: 5, urgent: true },
    { id: 2, type: 'hazard', level: '重大隐患', enterprise: '鑫达化工有限公司', desc: '消防通道被占用', days: 2, urgent: false },
    { id: 3, type: 'todo', level: '待办逾期', enterprise: '鑫达化工有限公司', desc: '应急预案修订', days: 6, urgent: true },
    { id: 4, type: 'risk', level: '风险待核对', enterprise: '天成建材有限公司', desc: 'AI判定重大风险，7天未标注', days: 7, urgent: true },
  ],
  // 风险分布
  riskDistribution: [
    { level: '重大风险', count: 3, trend: 'down', enterprises: ['鑫达化工', '天成建材', '鑫源金属'] },
    { level: '较大风险', count: 5, trend: 'stable', enterprises: ['恒盛食品', '华通物流', '永安制药', '万通木业', '宏基机械'] },
    { level: '一般/低风险', count: 4, trend: 'up', enterprises: ['瑞祥电子', '博远包装'] },
  ],
  // 本周服务记录汇总
  weeklyServices: [
    { type: '现场检查', count: 6, enterprises: ['鑫达化工', '宏基机械', '瑞祥电子', '万通木业', '永安制药'] },
    { type: '微信沟通', count: 5, enterprises: ['天成建材', '鑫源金属', '永安制药', '博远包装', '宏基机械'] },
    { type: '电话跟进', count: 4, enterprises: ['恒盛食品', '华通物流', '天成建材', '鑫达化工'] },
  ],
}

// ==================== 主组件 ====================

export function ExpertMy() {
  const [period, setPeriod] = useState<ReportPeriod>('week')
  const { perf, metrics, workProgress, dashboardKpi } = expertMock
  const weekly = WEEKLY_REPORT_MOCK

  // 薄弱维度（得分/目标 < 0.85 且权重 >= 10）
  const weakDims = (perf?.dimensions ?? []).filter(
    d => d.score / d.targetScore < 0.85 && d.weight >= 10,
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* ===== 报告标题栏 ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-zinc-800">我的报告</h2>
          <p className="text-[12px] text-zinc-400 mt-0.5">2026年4月6日 第14周</p>
        </div>
        {/* 报告类型切换 */}
        <div className="flex bg-zinc-100 rounded-lg p-0.5 gap-0.5">
          {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all duration-150 ${
                period === p
                  ? 'bg-white text-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 逾期警告 Banner ===== */}
      {weekly.overdueAlerts.filter(a => a.urgent).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-red-700 mb-1.5">本周需紧急处理</div>
              <div className="space-y-1">
                {weekly.overdueAlerts.filter(a => a.urgent).map(alert => (
                  <div key={alert.id} className="flex items-center gap-2 text-[12px] text-red-600">
                    <span className="text-red-400 font-mono w-5">{alert.days}天</span>
                    <span>{alert.enterprise}</span>
                    <span className="text-red-300">·</span>
                    <span>{alert.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-red-400 font-medium flex-shrink-0">
              {weekly.overdueAlerts.filter(a => a.urgent).length} 项紧急
            </div>
          </div>
        </div>
      )}

      {/* ===== KPI 卡片行（带趋势对比） ===== */}
      <div className="grid grid-cols-3 gap-4">
        {/* 综合得分 */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">综合得分</div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
              <path strokeLinecap="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div className="text-3xl font-bold font-mono text-zinc-900 leading-none">
            {perf?.overallScore ?? '-'}
            <span className="text-[14px] font-normal text-zinc-400 ml-1">/100</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <TrendArrow trend="up" />
            <span className="text-[11px] text-zinc-400">团队排名 第{perf?.rankInTeam ?? '-'}名</span>
          </div>
        </div>

        {/* 隐患整改率 */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">隐患整改率</div>
            <TrendArrow trend={weekly.weekVsLast.hazardRectRate.trend} />
          </div>
          <div className="text-3xl font-bold font-mono leading-none">
            <span className={weekly.weekVsLast.hazardRectRate.current >= weekly.weekVsLast.hazardRectRate.target ? 'text-emerald-600' : 'text-amber-600'}>
              {weekly.weekVsLast.hazardRectRate.current}
            </span>
            <span className="text-[14px] font-normal text-zinc-400 ml-1">%</span>
          </div>
          <div className="mt-2">
            <ScoreBar score={weekly.weekVsLast.hazardRectRate.current} target={weekly.weekVsLast.hazardRectRate.target} />
            <div className="text-[10px] text-zinc-400 mt-1">
              上周 <span className="text-zinc-600 font-medium">{weekly.weekVsLast.hazardRectRate.last}%</span>
              {weekly.weekVsLast.hazardRectRate.current >= weekly.weekVsLast.hazardRectRate.target ? (
                <span className="ml-2 text-emerald-500">已达标</span>
              ) : (
                <span className="ml-2 text-amber-500">距目标 {weekly.weekVsLast.hazardRectRate.target - weekly.weekVsLast.hazardRectRate.current}%</span>
              )}
            </div>
          </div>
        </div>

        {/* 自查执行率 */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">自查执行率</div>
            <TrendArrow trend={weekly.weekVsLast.selfCheckRate.trend} />
          </div>
          <div className="text-3xl font-bold font-mono leading-none">
            <span className={weekly.weekVsLast.selfCheckRate.current >= weekly.weekVsLast.selfCheckRate.target ? 'text-emerald-600' : 'text-amber-600'}>
              {weekly.weekVsLast.selfCheckRate.current}
            </span>
            <span className="text-[14px] font-normal text-zinc-400 ml-1">%</span>
          </div>
          <div className="mt-2">
            <ScoreBar score={weekly.weekVsLast.selfCheckRate.current} target={weekly.weekVsLast.selfCheckRate.target} />
            <div className="text-[10px] text-zinc-400 mt-1">
              上周 <span className="text-zinc-600 font-medium">{weekly.weekVsLast.selfCheckRate.last}%</span>
              <span className="ml-2 text-zinc-400">+{weekly.weekVsLast.selfCheckRate.current - weekly.weekVsLast.selfCheckRate.last}%</span>
            </div>
          </div>
        </div>

        {/* 本月服务 */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">本月服务</div>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
              <path strokeLinecap="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <div className="text-3xl font-bold font-mono text-zinc-900 leading-none">
            {metrics?.monthlyServiceCount ?? '-'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1.5">家企业</div>
        </div>

        {/* 待办完成率 */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">待办完成率</div>
            <TrendArrow trend={weekly.weekVsLast.todoCompletionRate.trend} />
          </div>
          <div className="text-3xl font-bold font-mono leading-none">
            <span className={weekly.weekVsLast.todoCompletionRate.current >= weekly.weekVsLast.todoCompletionRate.target ? 'text-emerald-600' : 'text-amber-600'}>
              {weekly.weekVsLast.todoCompletionRate.current}
            </span>
            <span className="text-[14px] font-normal text-zinc-400 ml-1">%</span>
          </div>
          <div className="mt-2">
            <ScoreBar score={weekly.weekVsLast.todoCompletionRate.current} target={weekly.weekVsLast.todoCompletionRate.target} />
            <div className="text-[10px] text-zinc-400 mt-1">
              本月已完成 <span className="text-zinc-600 font-medium">{dashboardKpi.monthCompletedCount} 项</span>
              <span className="ml-2">本周期 <span className="text-zinc-600 font-medium">{dashboardKpi.todayTodoCount} 项</span>待处理</span>
            </div>
          </div>
        </div>

        {/* 台账完整度 */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">台账完整度</div>
            <TrendArrow trend={weekly.weekVsLast.ledgerRate.trend} />
          </div>
          <div className="text-3xl font-bold font-mono leading-none">
            <span className={weekly.weekVsLast.ledgerRate.current >= weekly.weekVsLast.ledgerRate.target ? 'text-emerald-600' : 'text-amber-600'}>
              {weekly.weekVsLast.ledgerRate.current}
            </span>
            <span className="text-[14px] font-normal text-zinc-400 ml-1">%</span>
          </div>
          <div className="mt-2">
            <ScoreBar score={weekly.weekVsLast.ledgerRate.current} target={weekly.weekVsLast.ledgerRate.target} />
            <div className="text-[10px] text-zinc-400 mt-1">
              上周 <span className="text-zinc-600 font-medium">{weekly.weekVsLast.ledgerRate.last}%</span>
              <span className="ml-2">目标 {weekly.weekVsLast.ledgerRate.target}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 两栏布局 ===== */}
      <div className="grid grid-cols-5 gap-4">

        {/* ===== 左栏：七维绩效 ===== */}
        <div className="col-span-3 space-y-4">
          {/* 七维绩效面板 */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[13px] font-semibold text-zinc-800">七维绩效评估</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">权重得分 · 本周 vs 上周</div>
              </div>
              <div className="text-[12px] font-medium text-zinc-600 bg-zinc-50 px-2.5 py-1 rounded-md">
                综合 <span className="text-zinc-900 font-bold">{perf?.overallScore ?? '-'}</span>
              </div>
            </div>

            <div className="space-y-3">
              {(perf?.dimensions ?? []).map(dim => {
                const ratio = dim.score / dim.targetScore
                const isWeak = ratio < 0.85
                const isGood = ratio >= 1.0
                return (
                  <div key={dim.id} className={`rounded-lg p-3 ${isWeak ? 'bg-red-50/60' : isGood ? 'bg-emerald-50/40' : 'bg-zinc-50/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-medium ${isWeak ? 'text-red-700' : 'text-zinc-700'}`}>
                          {dim.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                          权重 {dim.weight}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendArrow trend={dim.trend} />
                        <span className={`text-[13px] font-bold font-mono ${isWeak ? 'text-red-600' : isGood ? 'text-emerald-600' : 'text-zinc-800'}`}>
                          {dim.score}
                          <span className="text-[11px] font-normal text-zinc-400">/{dim.targetScore}</span>
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-emerald-400' : isWeak ? 'bg-red-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 工作进展摘要 */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
            <div className="text-[13px] font-semibold text-zinc-800 mb-3">本周工作进展</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-[11px] text-zinc-400 mb-1">走访覆盖率</div>
                <div className="text-[20px] font-bold font-mono text-zinc-800">
                  {workProgress?.visitCoverageRate ?? '-'}
                  <span className="text-[12px] font-normal text-zinc-400">%</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  目标 85% · 差 {85 - (workProgress?.visitCoverageRate ?? 0)}%
                </div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-[11px] text-zinc-400 mb-1">隐患发现数</div>
                <div className="text-[20px] font-bold font-mono text-zinc-800">
                  {workProgress?.hazardDiscoveryCount ?? '-'}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">本周新发现</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-[11px] text-zinc-400 mb-1">整改推动数</div>
                <div className="text-[20px] font-bold font-mono text-zinc-800">
                  {workProgress?.rectificationPushCount ?? '-'}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">本周推动</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-3">
                <div className="text-[11px] text-zinc-400 mb-1">待响应咨询</div>
                <div className="text-[20px] font-bold font-mono text-red-500">
                  {metrics?.pendingConsultations ?? '-'}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">条待回复</div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== 右栏：风险分布 + 薄弱预警 + 服务汇总 ===== */}
        <div className="col-span-2 space-y-4">

          {/* 责任池风险分布 */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
            <div className="text-[13px] font-semibold text-zinc-800 mb-3">责任池风险分布</div>
            <div className="space-y-2.5">
              {weekly.riskDistribution.map(item => (
                <div key={item.level} className="flex items-center gap-3">
                  <RiskDot level={item.level} />
                  <span className="text-[12px] text-zinc-700 w-20 flex-shrink-0">{item.level}</span>
                  <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.level === '重大风险' ? 'bg-red-400' : item.level === '较大风险' ? 'bg-amber-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${(item.count / 12) * 100}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-bold font-mono text-zinc-800 w-5 text-right">{item.count}</span>
                  <TrendArrow trend={item.trend} />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>责任池企业总数</span>
                <span className="font-medium text-zinc-700">12 家</span>
              </div>
            </div>
          </div>

          {/* 薄弱维度预警 */}
          {weakDims.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="text-[13px] font-semibold text-amber-700">薄弱维度关注</span>
              </div>
              <div className="space-y-2">
                {weakDims.map(dim => (
                  <div key={dim.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2.5">
                    <div>
                      <div className="text-[12px] font-medium text-amber-800">{dim.name}</div>
                      <div className="text-[10px] text-amber-500 mt-0.5">权重 {dim.weight}% · 距目标差 {dim.targetScore - dim.score} 分</div>
                    </div>
                    <div className="text-[16px] font-bold font-mono text-amber-600">{dim.score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 本周服务记录 */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
            <div className="text-[13px] font-semibold text-zinc-800 mb-3">本周服务记录</div>
            <div className="space-y-2.5">
              {weekly.weeklyServices.map(svc => (
                <div key={svc.type} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    svc.type === '现场检查' ? 'bg-blue-50 text-blue-500' :
                    svc.type === '微信沟通' ? 'bg-emerald-50 text-emerald-500' :
                    'bg-amber-50 text-amber-500'
                  }`}>
                    {svc.type === '现场检查' ? (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    ) : svc.type === '微信沟通' ? (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    ) : (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-zinc-700">{svc.type}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{svc.enterprises.join('、')}</div>
                  </div>
                  <span className="text-[14px] font-bold font-mono text-zinc-800 flex-shrink-0">{svc.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">本周合计</span>
              <span className="text-[14px] font-bold text-zinc-800">{weekly.weeklyServices.reduce((a, b) => a + b.count, 0)} 条记录</span>
            </div>
          </div>

          {/* 待响应咨询 */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-zinc-800">待响应咨询</div>
              <span className="text-[11px] text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                {metrics?.pendingConsultations ?? 0} 条
              </span>
            </div>
            <div className="text-center py-4">
              <div className="text-[32px] font-bold font-mono text-red-500 leading-none">
                {metrics?.pendingConsultations ?? '-'}
              </div>
              <div className="text-[11px] text-zinc-400 mt-2">条待回复</div>
            </div>
            <div className="text-[10px] text-zinc-400 text-center">请及时回复企业安管员的问题</div>
          </div>

        </div>
      </div>

      {/* ===== 菜单列表 ===== */}
      <div className="bg-white rounded-xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {MENU_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-5 py-4 cursor-pointer group transition-colors duration-100
              hover:bg-zinc-50 ${i < MENU_ITEMS.length - 1 ? 'border-b border-zinc-100' : ''}`}
          >
            <div className="w-10 h-10 rounded-lg bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center flex-shrink-0 transition-colors duration-150">
              <span className="text-zinc-500 group-hover:text-zinc-700 transition-colors duration-150">{item.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-zinc-800">{item.title}</div>
              <div className="text-[12px] text-zinc-400 mt-0.5">{item.desc}</div>
            </div>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-zinc-300 group-hover:text-zinc-500 transition-colors duration-150 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        ))}
      </div>

    </div>
  )
}

// ==================== 菜单数据（保留） ====================

const MENU_ITEMS = [
  {
    title: '我的周报',
    desc: '日报 / 周报 / 月报',
    tag: null,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: '我的绩效',
    desc: '七维得分明细 / 历史趋势',
    tag: null,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: '责任池变动',
    desc: '企业新增 / 移出通知',
    tag: null,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    title: '通知偏好',
    desc: '消息推送 / 提醒方式',
    tag: null,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.765.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: '账号信息',
    desc: '个人信息 / 修改密码',
    tag: null,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]
