import { useState, useEffect } from 'react'
import { SectionBlock } from '../../../../components/layout'
import { CycleProgressCard } from './CycleProgressCard'
import { mockTaskCycleProgress } from './mock'
import type { TaskCycleProgressData, RiskLevelCode } from './types'

interface TaskCycleProgressPanelProps {
  className?: string
}

export function TaskCycleProgressPanel({ className }: TaskCycleProgressPanelProps) {
  const [data, setData] = useState<TaskCycleProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  const riskLevels: RiskLevelCode[] = ['major', 'high', 'medium', 'low']

  useEffect(() => {
    // 模拟数据加载
    const timer = setTimeout(() => {
      setData(mockTaskCycleProgress)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <SectionBlock
      title="任务周期进度监控"
      description={`当前时间：${new Date().toLocaleDateString('zh-CN')}`}
      className={className}
    >
      {/* 单行水平布局 - 四个卡片在一行内 */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {riskLevels.map((level) => (
          <div key={level} className="flex-1 min-w-[240px]">
            <CycleProgressCard
              riskLevel={level}
              data={data?.cycles[level]}
              loading={loading}
            />
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-end gap-4 mt-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          超前/正常
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          滞后
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          严重滞后
        </span>
      </div>
    </SectionBlock>
  )
}
