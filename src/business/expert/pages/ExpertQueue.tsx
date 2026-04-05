import { useState } from 'react'
import { type QueueTask, type TaskType } from '../mock'
import expertMock from '../mock'

const TYPE_LABELS: Record<TaskType, string> = {
  risk_check: '风险核对',
  hazard_review: '隐患复核',
  consultation_reply: '咨询回复',
  routine_check: '例行检查',
}

const PRIORITY = {
  urgent: { label: '紧急', dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  today: { label: '今日', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  later: { label: '稍后', dot: 'bg-zinc-400', text: 'text-zinc-500', bg: 'bg-zinc-50', border: 'border-zinc-200' },
} as const

interface Props { onSelectTask: (task: QueueTask) => void }

export function ExpertQueue({ onSelectTask }: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all')

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
              { key: 'hazard_review', label: '隐患复核' },
              { key: 'consultation_reply', label: '咨询回复' },
              { key: 'routine_check', label: '例行检查' },
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
      <div className="grid grid-cols-[68px_96px_180px_1fr_72px_120px] px-6 py-2.5 bg-white border-b border-zinc-200/60 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest flex-shrink-0">
        <div>优先级</div>
        <div>任务类型</div>
        <div>企业</div>
        <div>摘要</div>
        <div>时间</div>
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
            return (
              <div
                key={task.id}
                className={`grid grid-cols-[68px_96px_180px_1fr_72px_120px] px-6 py-3.5 bg-white border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors duration-100 items-center
                  ${idx === 0 ? 'border-t border-zinc-200/40' : ''}
                  ${isCompleted ? 'opacity-55' : ''}`}
              >
                {/* 优先级 */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] font-semibold ${p.bg} ${p.text} border ${p.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.label}
                  </span>
                </div>

                {/* 任务类型 */}
                <div>
                  <span className="text-[13px] font-medium text-zinc-700">{TYPE_LABELS[task.type]}</span>
                </div>

                {/* 企业 */}
                <div className="pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-zinc-800 truncate">{task.enterpriseName}</span>
                    {task.enterpriseCategory && (
                      <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1 py-0.5 rounded shrink-0">
                        {task.enterpriseCategory}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 truncate">{task.title}</div>
                </div>

                {/* 摘要 */}
                <div className="text-[12px] text-zinc-500 leading-relaxed line-clamp-2 pr-4">
                  {task.description}
                </div>

                {/* 时间 */}
                <div className="pr-2">
                  {task.daysPending !== undefined && task.daysPending > 0 && (
                    <span className="text-[11px] text-red-500 font-semibold font-mono">+{task.daysPending}天</span>
                  )}
                  {task.overdueDays !== undefined && task.overdueDays > 0 && (
                    <span className="text-[11px] text-red-500 font-semibold font-mono">逾期{task.overdueDays}天</span>
                  )}
                  {((task.daysPending ?? 0) === 0 && (task.overdueDays ?? 0) === 0) && (
                    <span className="text-[11px] text-zinc-400">{fmtTime(task.createdAt)}</span>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex justify-center">
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[12px] text-emerald-600 font-medium">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      已完成
                    </span>
                  ) : (
                    <button
                      onClick={() => onSelectTask(task)}
                      className="w-full max-w-[96px] px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-700 active:scale-[0.97] text-white text-[12px] font-medium rounded-lg transition-all duration-150 whitespace-nowrap"
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

function fmtTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
