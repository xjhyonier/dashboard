import { RISK_LEVEL_CYCLE_CONFIG, STATUS_STYLES } from './config'
import { formatDate } from './utils'
import type { CycleProgress, RiskLevelCode } from './types'

interface CycleProgressCardProps {
  riskLevel: RiskLevelCode
  data?: CycleProgress
  loading?: boolean
}

export function CycleProgressCard({
  riskLevel,
  data,
  loading,
}: CycleProgressCardProps) {
  const config = RISK_LEVEL_CYCLE_CONFIG[riskLevel]

  if (loading) {
    return <CycleProgressCardSkeleton />
  }

  if (!data) {
    return null
  }

  const statusStyle = STATUS_STYLES[data.status]

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-3 hover:shadow-md transition-shadow h-full flex flex-col">
      {/* 头部：风险等级 + 周期 */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base">{config.emoji}</span>
            <span className="font-semibold text-sm text-zinc-800">{config.name}</span>
          </div>
          <div className="text-[10px] text-zinc-500">
            每{config.cycleMonths}月周期
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-zinc-700">
            {data.cycleName}
          </div>
          <div className="text-[9px] text-zinc-400">
            {formatDate(data.startDate)} ~ {formatDate(data.endDate)}
          </div>
        </div>
      </div>

      {/* 时间进度 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-zinc-500">时间进度</span>
          <span className="text-zinc-700 font-medium">
            {data.timeProgress.toFixed(1)}%
          </span>
        </div>
        <ProgressBar
          progress={data.timeProgress}
          color="zinc"
          size="sm"
        />
        <div className="text-[9px] text-zinc-400 mt-0.5">
          ({data.passedDays}/{data.totalDays}天)
        </div>
      </div>

      {/* 任务进度 */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-zinc-500">任务进度</span>
          <span className={`font-medium ${statusStyle.text}`}>
            {data.taskProgress.toFixed(1)}%
          </span>
        </div>
        <ProgressBar
          progress={data.taskProgress}
          color={statusStyle.color}
          size="sm"
        />
        <div className={`text-[9px] mt-0.5 ${statusStyle.text}`}>
          {statusStyle.label} {data.vsTimeProgress > 0 ? '+' : ''}{data.vsTimeProgress.toFixed(1)}%
        </div>
      </div>

      {/* 统计数字 */}
      <div className="flex items-center justify-between py-1.5 border-t border-zinc-100 mt-auto">
        <div className="text-center flex-1">
          <div className="text-sm font-bold text-zinc-800">
            {data.completedTasks}
          </div>
          <div className="text-[9px] text-zinc-400">已完成</div>
        </div>
        <div className="text-center flex-1">
          <div className="text-sm font-bold text-zinc-800">
            {data.pendingTasks}
          </div>
          <div className="text-[9px] text-zinc-400">待完成</div>
        </div>
        <div className="text-center flex-1">
          <div className={`text-sm font-bold ${data.overdueTasks > 0 ? 'text-red-600' : 'text-zinc-800'}`}>
            {data.overdueTasks}
          </div>
          <div className="text-[9px] text-zinc-400">逾期</div>
        </div>
      </div>

      {/* 环比 */}
      <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100">
        <span className="text-[10px] text-zinc-500">环比</span>
        <span className={`text-[10px] font-medium ${
          data.monthOverMonth >= 0 ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {data.monthOverMonth >= 0 ? '+' : ''}{data.monthOverMonth}%
          {data.monthOverMonth >= 0 ? '↑' : '↓'}
        </span>
      </div>
    </div>
  )
}

// 进度条组件
function ProgressBar({
  progress,
  color,
  size = 'sm',
}: {
  progress: number
  color: 'zinc' | 'emerald' | 'amber' | 'red'
  size?: 'sm' | 'md'
}) {
  const colorMap = {
    zinc: 'bg-zinc-400',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }

  const height = size === 'sm' ? 'h-1' : 'h-2'

  return (
    <div className={`w-full ${height} bg-zinc-100 rounded-full overflow-hidden`}>
      <div
        className={`${height} ${colorMap[color]} rounded-full transition-all duration-500`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// 骨架屏
function CycleProgressCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-3 animate-pulse h-full">
      <div className="h-8 bg-zinc-100 rounded mb-2"></div>
      <div className="h-3 bg-zinc-100 rounded mb-1"></div>
      <div className="h-6 bg-zinc-100 rounded mb-2"></div>
      <div className="h-3 bg-zinc-100 rounded mb-1"></div>
      <div className="h-6 bg-zinc-100 rounded"></div>
    </div>
  )
}
