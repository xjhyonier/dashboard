import { useState, useCallback } from 'react'
import { type QueueTask, type TaskType } from '../mock'
import expertMock from '../mock'
import { AiEvaluationModal } from '../components/AiEvaluationModal'

const TYPE_LABELS: Record<TaskType, string> = {
  risk_check: '风险核对',
  ai_evaluation: 'AI评估',
  task: '隐患与待办',
}

const SOURCE_TAG_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  ai_push: { label: 'AI推送', bg: 'bg-violet-50', text: 'text-violet-600' },
  manual: { label: '手动创建', bg: 'bg-blue-50', text: 'text-blue-600' },
  external_sync: { label: '平台同步', bg: 'bg-amber-50', text: 'text-amber-600' },
  gov_platform: { label: '政府平台', bg: 'bg-emerald-50', text: 'text-emerald-600' },
}

const RISK_LEVEL_COLORS: Record<string, string> = {
  '重大风险': 'text-red-600 bg-red-50',
  '较大风险': 'text-orange-600 bg-orange-50',
  '一般风险': 'text-amber-600 bg-amber-50',
  '低风险': 'text-green-600 bg-green-50',
}

// 根据风险评分换算风险等级
function scoreToRiskLevel(score: number): string {
  if (score < 30) return '重大风险'
  if (score < 60) return '较大风险'
  if (score < 85) return '一般风险'
  return '低风险'
}

// 获取任务的风险等级（优先用任务自己的，否则查企业评分）
function getTaskRiskLevel(task: QueueTask): string | undefined {
  if (task.riskLevel) return task.riskLevel
  // 兜底：根据 enterpriseId 查找企业评分
  const enterprise = expertMock.enterprises.find(e => e.id === task.enterpriseId)
  if (enterprise?.riskScore !== undefined) {
    return scoreToRiskLevel(enterprise.riskScore)
  }
  return undefined
}

const PRIORITY = {
  urgent: { label: '紧急', dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  today: { label: '今日', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  later: { label: '稍后', dot: 'bg-zinc-400', text: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-200' },
} as const

interface Props { onSelectTask: (task: QueueTask) => void }

export function ExpertQueue({ onSelectTask }: Props) {
  const [tab, setTab] = useState<'queue' | 'performance'>('queue')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')
  const [aiEvalTask, setAiEvalTask] = useState<QueueTask | null>(null)
  const [aiEvalOpen, setAiEvalOpen] = useState(false)

  const all = expertMock.queueTasks
  const pending = all.filter(t => t.status === 'pending')
  const completed = all.filter(t => t.status === 'completed')

  const visible = all
    .filter(t => filter === 'all' ? true : t.status === filter)
    .filter(t => typeFilter === 'all' ? true : t.type === typeFilter)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
      const order = { urgent: 0, today: 1, later: 2 }
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
    })

  return (
    <div className="h-full flex flex-col">

      {/* 顶部Tab切换 */}
      <div className="px-6 py-3 bg-white border-b border-zinc-200/70 flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('queue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === 'queue'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            任务队列
          </button>
          <button
            onClick={() => setTab('performance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              tab === 'performance'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            今日成效
          </button>
        </div>
        <div className="ml-auto text-xs text-zinc-400">
          {tab === 'queue' ? '等待处理的任务清单' : '今天实际工作完成情况'}
        </div>
      </div>

      {tab === 'queue' ? (
      <>
      {/* 工具栏 */}
      <div className="px-6 py-4 bg-white border-b border-zinc-200/70 flex items-center gap-5 flex-shrink-0">
        {/* 状态切换 */}
        <div className="flex items-center bg-zinc-100 rounded-lg p-1 gap-0.5">
          {([
            { key: 'all', label: `全部`, count: all.length },
            { key: 'pending', label: `待处理`, count: pending.length },
            { key: 'completed', label: `已完成`, count: completed.length },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150
                ${filter === f.key ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              {f.label}
              <span className={`ml-1.5 text-[11px] font-mono ${filter === f.key ? 'text-zinc-400' : 'text-zinc-400'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* 类型筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">类型</span>
          <div className="flex gap-1">
            {([
              { key: 'all', label: '全部' },
              { key: 'risk_check', label: '风险核对' },
              { key: 'ai_evaluation', label: 'AI评估' },
              { key: 'task', label: '隐患与待办' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key as TaskType | 'all')}
                className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors duration-150
                  ${typeFilter === f.key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 统计 */}
        <div className="ml-auto flex items-center gap-4 text-[12px]">
          {([
            { dot: 'bg-red-500', label: '紧急', count: pending.filter(t => t.priority === 'urgent').length },
            { dot: 'bg-amber-500', label: '今日', count: pending.filter(t => t.priority === 'today').length },
            { dot: 'bg-zinc-400', label: '稍后', count: pending.filter(t => t.priority === 'later').length },
          ] as const).map(s => (
            <span key={s.label} className="flex items-center gap-1.5 text-zinc-500">
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              <span className="font-mono">{s.count}</span>
              <span>{s.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[56px_1fr_1fr_80px_80px] px-6 py-2.5 bg-white border-b border-zinc-200/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex-shrink-0">
        <div>优先级</div>
        <div>企业</div>
        <div>任务</div>
        <div className="text-center">待处理</div>
        <div className="text-center">操作</div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-auto bg-zinc-50/60">
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map((task, idx) => {
            const p = PRIORITY[task.priority]
            const isCompleted = task.status === 'completed'
            const riskLevel = getTaskRiskLevel(task)
            const riskColor = riskLevel ? RISK_LEVEL_COLORS[riskLevel] : ''

            // 逾期提示
            const overdueDays = (task as any).overdueDays

            // 地点（优先用hazardLocation，其次用townStreet/villageCommunity）
            const location = task.hazardLocation
              || (task.townStreet && task.villageCommunity
                ? `${task.townStreet}/${task.villageCommunity}`
                : task.townStreet || '')

            return (
              <div
                key={task.id}
                className={`grid grid-cols-[56px_1fr_1fr_80px_80px] px-6 py-3 bg-white border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors duration-100 items-start
                  ${idx === 0 ? 'border-t border-zinc-200/40' : ''}
                  ${isCompleted ? 'opacity-55' : ''}`}
              >
                {/* 优先级 */}
                <div className="pt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-semibold ${p.bg} ${p.text} border ${p.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.label}
                  </span>
                </div>

                {/* 企业列 */}
                <div className="pl-4 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-zinc-800 truncate">{task.enterpriseName}</span>
                    {riskLevel && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${riskColor}`}>
                        {riskLevel}
                      </span>
                    )}
                  </div>
                  {location && (
                    <div className="text-[11px] text-zinc-400 truncate">{location}</div>
                  )}
                </div>

                {/* 任务列 */}
                <div className="pr-4">
                  <div className="text-[13px] font-medium text-zinc-700 mb-0.5">{task.title}</div>
                  <div className="text-[11px] text-zinc-500 line-clamp-1">{task.description}</div>
                  {task.type === 'risk_check' && task.aiLevel && (
                    <div className="text-[11px] text-zinc-400 mt-0.5">AI: {task.aiLevel}（{task.aiScore}分）</div>
                  )}
                </div>

                {/* 待处理天数 */}
                <div className="flex items-center justify-center pt-1">
                  {isCompleted ? (
                    <span className="text-[11px] text-zinc-400">—</span>
                  ) : overdueDays ? (
                    <span className="px-2 py-1 rounded text-[11px] font-semibold text-red-600 bg-red-50">
                      逾期{overdueDays}天
                    </span>
                  ) : task.daysPending ? (
                    <span className="px-2 py-1 rounded text-[11px] font-medium text-zinc-500 bg-zinc-100">
                      {task.daysPending}天
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400">—</span>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex justify-center pt-0.5">
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[12px] text-emerald-600 font-medium">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      完成
                    </span>
                  ) : task.type === 'ai_evaluation' ? (
                    <button
                      onClick={() => { setAiEvalTask(task); setAiEvalOpen(true) }}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 active:scale-[0.97] text-white text-[12px] font-medium rounded-lg transition-all duration-150 whitespace-nowrap"
                    >
                      {task.actionLabel}
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectTask(task)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 active:scale-[0.97] text-white text-[12px] font-medium rounded-lg transition-all duration-150 whitespace-nowrap"
                    >
                      {task.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底栏 */}
      <div className="px-6 py-3 bg-white border-t border-zinc-200/70 flex items-center justify-between flex-shrink-0">
        <span className="text-[12px] text-zinc-400">
          共 <span className="font-mono font-semibold text-zinc-600">{pending.length}</span> 件待处理 /
          已完成 <span className="font-mono font-semibold text-zinc-600">{completed.length}</span> 件
        </span>
        <span className="text-[12px] text-zinc-400">
          队列总计 <span className="font-mono font-semibold text-zinc-600">{all.length}</span> 件
        </span>
      </div>
      </>)

      /* ===== 今日成效 Tab ===== */
      : (
        <PerformanceBoard onGotoQueue={() => setTab('queue')} />
      )}

      {/* AI评估详情浮层 */}
      <AiEvaluationModal
        task={aiEvalTask}
        isOpen={aiEvalOpen}
        onClose={() => setAiEvalOpen(false)}
        onRecordIssue={(dimension, issue) => {
          console.log('记录问题:', dimension, issue)
        }}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
      <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" className="mb-4 opacity-40">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
      <p className="text-sm font-medium text-zinc-400">暂无任务</p>
      <p className="text-xs text-zinc-400 mt-1">当前筛选条件下没有待处理的任务</p>
    </div>
  )
}

// ==================== 企业状态路径图 → 已提取至共享组件 ====================
// src/components/shared/EnterpriseStatePath.tsx
// ===========================================================================

// 以下原始实现已删除，直接使用顶部 import 的 EnterpriseStatePath

// ─── 保留：本文件内 PerformanceBoard 使用的辅助函数占位 ─────────────────────
function PerformanceBoard({ onGotoQueue }: { onGotoQueue: () => void }) {
  // ===== 专家全局资产概览数据（来自专家责任池统计） =====
  const expertSummary = {
    totalEnterprises: 10,
    enterpriseRiskBreakdown: [
      { level: '重大风险', count: 4, color: 'bg-red-500' },
      { level: '较大风险', count: 3, color: 'bg-amber-500' },
      { level: '一般风险', count: 2, color: 'bg-blue-400' },
      { level: '低风险', count: 1, color: 'bg-emerald-400' },
    ],
    openHazards: 16,
    pendingVerifications: 4,
    pendingRiskChecks: 6,
    pendingAiEvaluations: 3,
    overdueTasks: 2,
  }

  // ===== 对标绩效考核7维度的效果指标数据 =====
  const performanceMetrics = [
    {
      id: 'hazard_close_rate',
      label: '隐患闭环率',
      subLabel: '远程监管效能度',
      weight: '30%',
      current: 89,
      target: 85,
      unit: '%',
      trend: '+4pt',
      trendUp: true,
      color: 'emerald',
    },
    {
      id: 'hazard_complete_rate',
      label: '隐患整改完成率',
      subLabel: '隐患闭环治理度',
      weight: '15%',
      current: 76,
      target: 80,
      unit: '%',
      trend: '-4pt',
      trendUp: false,
      color: 'amber',
    },
    {
      id: 'self_check_rate',
      label: '企业自查执行率',
      subLabel: '自查执行活跃度',
      weight: '15%',
      current: 92,
      target: 90,
      unit: '%',
      trend: '+2pt',
      trendUp: true,
      color: 'emerald',
    },
    {
      id: 'risk_accuracy',
      label: '风险核对准确率',
      subLabel: '风险识别精准度',
      weight: '10%',
      current: 100,
      target: 90,
      unit: '%',
      trend: '0pt',
      trendUp: true,
      color: 'emerald',
    },
    {
      id: 'inspect_coverage',
      label: '例行检查覆盖率',
      subLabel: '检查计划科学度',
      weight: '10%',
      current: 60,
      target: 75,
      unit: '%',
      trend: '-15pt',
      trendUp: false,
      color: 'red',
    },
    {
      id: 'visit_rate',
      label: '责任池企业走访率',
      subLabel: '企业基础覆盖度',
      weight: '10%',
      current: 45,
      target: 60,
      unit: '%',
      trend: '+5pt',
      trendUp: true,
      color: 'amber',
    },
    {
      id: 'record_completeness',
      label: '服务记录完整率',
      subLabel: '制度数字化完善度',
      weight: '10%',
      current: 88,
      target: 85,
      unit: '%',
      trend: '+3pt',
      trendUp: true,
      color: 'emerald',
    },
  ]

  // ===== 今日行为活动数据 =====
  const activityMetrics = [
    {
      id: 'risk_annotated',
      label: '风险标注',
      desc: '完成风险评级核对',
      count: 3,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
      ),
      color: 'blue',
    },
    {
      id: 'hazard_created',
      label: '隐患下发',
      desc: '检查中发现并下发隐患',
      count: 1,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      color: 'red',
    },
    {
      id: 'hazard_verified',
      label: '隐患复核',
      desc: '验收企业整改结果',
      count: 4,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#16a34a" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
      color: 'emerald',
    },
    {
      id: 'onsite_inspect',
      label: '现场巡查',
      desc: '到企业现场检查',
      count: 2,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#d97706" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
      color: 'amber',
    },
    {
      id: 'video_inspect',
      label: '视频巡查',
      desc: '远程视频检查',
      count: 3,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#7c3aed" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ),
      color: 'violet',
    },
    {
      id: 'consult_replied',
      label: '咨询回复',
      desc: '回复企业提问',
      count: 2,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#0891b2" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8 9-8s9 3.444 9 8z" />
        </svg>
      ),
      color: 'cyan',
    },
    {
      id: 'ledger_updated',
      label: '台账更新',
      desc: '服务记录写入台账',
      count: 5,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#64748b" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: 'slate',
    },
    {
      id: 'enterprise_contact',
      label: '企业互动',
      desc: '电话/微信/平台联系',
      count: 8,
      unit: '次',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#0ea5e9" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
      color: 'sky',
    },
  ]



  return (
    <div className="flex-1 overflow-auto bg-zinc-50/60 p-6">
      {/* 标题区 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-800">今日工作成效</h2>
        <p className="text-sm text-zinc-500 mt-1">对标考核目标 · 权重最高优先 | 2026年4月5日</p>
      </div>

      {/* ===== 7维度环形进度指标面板 ===== */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {performanceMetrics.map(metric => {
          const pctColor = metric.current >= metric.target
            ? 'text-emerald-600'
            : metric.current >= metric.target * 0.8
              ? 'text-amber-600'
              : 'text-red-600'
          const ringBg = metric.current >= metric.target
            ? 'stroke-emerald-100'
            : metric.current >= metric.target * 0.8
              ? 'stroke-amber-100'
              : 'stroke-red-100'
          const ringFg = metric.current >= metric.target
            ? 'stroke-emerald-500'
            : metric.current >= metric.target * 0.8
              ? 'stroke-amber-500'
              : 'stroke-red-500'

          // 环形进度：半径36，中心(40,40)，周长=2*π*36≈226
          const radius = 36
          const circumference = 2 * Math.PI * radius
          const offset = circumference - (metric.current / 100) * circumference

          return (
            <div key={metric.id} className="bg-white rounded-xl border border-zinc-200/60 p-4 flex flex-col items-center">
              {/* 环形进度 */}
              <div className="relative w-20 h-20 mb-3">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="6" className={ringBg} />
                  <circle
                    cx="40" cy="40" r={radius}
                    fill="none" strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`transition-all duration-700 ${ringFg}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-lg font-bold font-mono ${pctColor}`}>{metric.current}</span>
                  <span className="text-[10px] text-zinc-400 -mt-0.5">{metric.unit}</span>
                </div>
              </div>

              {/* 指标名称 */}
              <div className="text-[13px] font-semibold text-zinc-800 text-center mb-0.5">{metric.label}</div>
              <div className="text-[11px] text-zinc-400 text-center mb-2">{metric.subLabel}</div>

              {/* 目标值 + 趋势 */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">目标 {metric.target}{metric.unit}</span>
                <span className={`text-[11px] font-medium ${metric.trendUp ? 'text-emerald-600' : metric.trend === '0pt' ? 'text-zinc-400' : 'text-red-600'}`}>
                  {metric.trendUp ? '↑' : metric.trend === '0pt' ? '—' : '↓'} {metric.trend}
                </span>
              </div>

              {/* 权重标签 */}
              <div className="mt-2 px-2 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-400 font-medium">
                权重 {metric.weight}
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== 重点警示 ===== */}
      <div className="mb-6 bg-red-50 border border-red-200/60 rounded-xl px-4 py-3 flex items-start gap-3">
        <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="12" height="12" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-semibold text-red-700 mb-0.5">本月重点关注</div>
          <div className="text-[12px] text-red-600">
            例行检查覆盖率 <span className="font-semibold">60%</span>，低于目标 <span className="font-semibold">15pt</span>，需加快巡查节奏；
            隐患整改完成率 <span className="font-semibold">76%</span>，低于目标 4pt，请跟进待整改企业。
          </div>
        </div>
      </div>

      {/* ===== 行为活动面板 ===== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-zinc-700 flex items-center justify-center">
            <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-zinc-700">今日工作行为</h3>
          <span className="text-[11px] text-zinc-400 ml-1">做了多少次 · 各类功能使用次数</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {activityMetrics.map(m => {
            const colorMap = {
              blue:    { iconBg: 'bg-blue-50',    iconBorder: 'border-blue-100',    text: 'text-blue-600' },
              red:     { iconBg: 'bg-red-50',     iconBorder: 'border-red-100',     text: 'text-red-600' },
              emerald: { iconBg: 'bg-emerald-50',  iconBorder: 'border-emerald-100', text: 'text-emerald-600' },
              amber:   { iconBg: 'bg-amber-50',   iconBorder: 'border-amber-100',   text: 'text-amber-600' },
              violet:  { iconBg: 'bg-violet-50',  iconBorder: 'border-violet-100', text: 'text-violet-600' },
              cyan:    { iconBg: 'bg-cyan-50',    iconBorder: 'border-cyan-100',    text: 'text-cyan-600' },
              slate:   { iconBg: 'bg-slate-100',  iconBorder: 'border-slate-200',   text: 'text-slate-600' },
              sky:     { iconBg: 'bg-sky-50',     iconBorder: 'border-sky-100',     text: 'text-sky-600' },
            }
            const c = colorMap[m.color as keyof typeof colorMap] || colorMap.blue
            return (
              <div key={m.id} className="bg-white rounded-xl border border-zinc-200/60 p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border ${c.iconBg} ${c.iconBorder} flex items-center justify-center flex-shrink-0`}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-zinc-800">{m.label}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{m.desc}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-lg font-bold font-mono ${c.text}`}>{m.count}</span>
                  <span className="text-[11px] text-zinc-400 ml-0.5">{m.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function DeltaRow({ label, value, suffix, showSign, color, isChange }: {
  label: string
  value: number
  suffix: string
  showSign?: boolean
  color: 'emerald' | 'blue' | 'violet' | 'amber' | 'zinc'
  isChange?: boolean
}) {
  const colorMap = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    violet: 'text-violet-600',
    amber: 'text-amber-600',
    zinc: 'text-zinc-500',
  }
  const displayValue = showSign && value > 0 ? `+${value}` : value.toString()

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-semibold font-mono ${colorMap[color]}`}>
        {displayValue}{!isChange && suffix}
        {isChange && <span className="text-[10px] font-normal ml-0.5">{suffix}</span>}
      </span>
    </div>
  )
}

function StatCard({ label, value, sub, trend, trendValue, color }: {
  label: string
  value: string
  sub: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  color: 'emerald' | 'blue' | 'violet' | 'amber'
}) {
  const colorMap = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    violet: 'bg-violet-50 border-violet-200 text-violet-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200/60 p-4">
      <div className="text-xs text-zinc-500 font-medium mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-zinc-800">{value}</span>
        {trendValue && (
          <span className={`text-xs font-medium mb-1 ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-amber-600' : 'text-zinc-400'
          }`}>
            {trendValue}
          </span>
        )}
      </div>
      <div className="text-xs text-zinc-400 mt-1">{sub}</div>
    </div>
  )
}

function ProgressRow({ label, done, total, color }: {
  label: string
  done: number
  total: number
  color: 'emerald' | 'blue' | 'violet' | 'amber'
}) {
  const pct = total > 0 ? (done / total) * 100 : 0
  const colorMap = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    amber: 'bg-amber-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-zinc-600">{label}</span>
        <span className="text-zinc-500 font-mono">{done}/{total}</span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function TimelineItem({ time, title, desc, status }: {
  time: string
  title: string
  desc: string
  status: 'done' | 'in_progress' | 'pending'
}) {
  const statusMap = {
    done: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: '已完成' },
    in_progress: { dot: 'bg-amber-500 animate-pulse', text: 'text-amber-600', label: '进行中' },
    pending: { dot: 'bg-zinc-300', text: 'text-zinc-400', label: '待处理' },
  }
  const s = statusMap[status]

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
        <div className="w-px h-full bg-zinc-200 my-1" />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">{time}</span>
          <span className="text-sm font-medium text-zinc-700">{title}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <span className={`text-xs ${s.text}`}>{s.label}</span>
    </div>
  )
}

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
