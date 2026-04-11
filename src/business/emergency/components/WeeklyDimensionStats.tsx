/**
 * 企业每周使用情况总览 - 企业安全业务11维度
 * 每周一条数据，维度作为列
 * 展示：已建立 / 未建立 / 完善率
 */

import { useMemo, useState } from 'react'
import { SectionBlock } from '../../../components/layout'

interface DimensionStat {
  established: number
  notEstablished: number
  completionRate: number
}

interface WeeklyData {
  weekKey: string
  weekLabel: string
  stats: Record<string, DimensionStat>
}

const DIMENSIONS = [
  { key: 'info_collection', name: '信息采集', shortName: '信息采集' },
  { key: 'risk_points', name: '风险点识别', shortName: '风险点' },
  { key: 'safety_system', name: '安全制度建立', shortName: '安全制度' },
  { key: 'inspection_task', name: '检查任务', shortName: '检查任务' },
  { key: 'planned_inspection', name: '计划检查', shortName: '计划检查' },
  { key: 'third_party_sync', name: '第三方同步', shortName: '第三方' },
  { key: 'patrol', name: '安全巡查', shortName: '安全巡查' },
  { key: 'training', name: '教育培训', shortName: '教育培训' },
  { key: 'work_permit', name: '作业票报备', shortName: '作业票' },
  { key: 'hazard_discovery', name: '发现隐患', shortName: '隐患发现' },
  { key: 'park_inspection', name: '园区检查', shortName: '园区检查' },
]

export interface DimensionFilter {
  dimension: string
  status: 'established' | 'notEstablished'
  weekLabel: string
}

interface WeeklyDimensionStatsProps {
  expertId?: string
  onDimensionClick?: (filter: DimensionFilter) => void
}

// 固定的随机种子，让数据保持一致
let seed = 12345
function seededRandom() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

export function WeeklyDimensionStats({ expertId, onDimensionClick }: WeeklyDimensionStatsProps) {
  // 重置随机种子确保数据稳定
  seed = 12345

  // 当前选中的筛选状态（用于高亮显示）
  const [activeFilter, setActiveFilter] = useState<DimensionFilter | null>(null)

  const weeklyData = useMemo(() => {
    const weeks = getRecentWeeks(8)
    return weeks.map((week, weekIndex) => {
      const stats: Record<string, DimensionStat> = {}

      DIMENSIONS.forEach((dim) => {
        // 基于维度的基础完成率 + 周的递增趋势
        const baseRate = getBaseRateByDimension(dim.key)
        const weekTrend = weekIndex * 0.5 // 每周递增 0.5%
        const variation = (seededRandom() - 0.5) * 8
        const completionRate = Math.max(0, Math.min(100, baseRate + weekTrend + variation))

        const totalEnterprises = 266
        const established = Math.round((totalEnterprises * completionRate) / 100)

        stats[dim.key] = {
          established,
          notEstablished: totalEnterprises - established,
          completionRate,
        }
      })

      return {
        weekKey: week.key,
        weekLabel: week.label,
        stats,
      }
    })
  }, [])

  // 计算平均完善率
  const avgCompletionRate = useMemo(() => {
    if (weeklyData.length === 0) return 0
    const lastWeek = weeklyData[weeklyData.length - 1]
    const sum = DIMENSIONS.reduce((s, d) => s + (lastWeek.stats[d.key]?.completionRate || 0), 0)
    return sum / DIMENSIONS.length
  }, [weeklyData])

  // 处理数字点击
  const handleNumberClick = (dimKey: string, status: 'established' | 'notEstablished', weekLabel: string) => {
    const filter: DimensionFilter = {
      dimension: dimKey,
      status,
      weekLabel
    }
    setActiveFilter(filter)
    onDimensionClick?.(filter)
  }

  // 判断是否当前单元格被选中
  const isActive = (dimKey: string, status: 'established' | 'notEstablished', weekLabel: string) => {
    return activeFilter?.dimension === dimKey && 
           activeFilter?.status === status && 
           activeFilter?.weekLabel === weekLabel
  }

  return (
    <SectionBlock
      title="企业每周使用情况总览"
      description="企业安全业务11维度每周完成情况（点击数字查看企业列表）"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-zinc-50">
              <th className="py-3 px-3 text-left font-medium text-zinc-700 sticky left-0 bg-zinc-50 z-10 border-b border-zinc-200 whitespace-nowrap" rowSpan={2} style={{ minWidth: 70 }}>
                周次
              </th>
              {DIMENSIONS.map((dim) => (
                <th
                  key={dim.key}
                  className="py-2 px-1 text-center font-medium text-zinc-700 border-b border-zinc-200"
                  colSpan={3}
                >
                  {dim.shortName}
                </th>
              ))}
            </tr>
            <tr className="bg-zinc-50/80">
              {DIMENSIONS.map((dim) => (
                <>
                  <th key={`${dim.key}-est`} className="py-1.5 px-1 text-center font-medium text-emerald-600 border-b border-zinc-200 text-[10px]">
                    已建立
                  </th>
                  <th key={`${dim.key}-not`} className="py-1.5 px-1 text-center font-medium text-zinc-500 border-b border-zinc-200 text-[10px]">
                    未建立
                  </th>
                  <th key={`${dim.key}-rate`} className="py-1.5 px-1 text-center font-medium text-zinc-500 border-b border-zinc-200 text-[10px]">
                    完善率
                  </th>
                </>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeklyData.map((week, weekIndex) => (
              <tr
                key={week.weekKey}
                className={weekIndex % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}
              >
                <td className="py-2.5 px-3 text-zinc-700 font-medium sticky left-0 bg-inherit border-b border-zinc-100 whitespace-nowrap" style={{ minWidth: 70 }}>
                  {week.weekLabel}
                </td>
                {DIMENSIONS.map((dim) => {
                  const stat = week.stats[dim.key]
                  const rate = stat?.completionRate || 0
                  return (
                    <>
                      <td key={`${dim.key}-est`} className="py-2 px-1 text-center border-b border-zinc-100">
                        <button
                          onClick={() => handleNumberClick(dim.key, 'established', week.weekLabel)}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            isActive(dim.key, 'established', week.weekLabel)
                              ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-400'
                              : 'hover:bg-emerald-50 text-emerald-600 font-medium'
                          }`}
                          title={`点击查看已建立${dim.name}的企业`}
                        >
                          {stat?.established || 0}
                        </button>
                      </td>
                      <td key={`${dim.key}-not`} className="py-2 px-1 text-center border-b border-zinc-100">
                        <button
                          onClick={() => handleNumberClick(dim.key, 'notEstablished', week.weekLabel)}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            isActive(dim.key, 'notEstablished', week.weekLabel)
                              ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                              : 'hover:bg-red-50 text-zinc-500'
                          }`}
                          title={`点击查看未建立${dim.name}的企业`}
                        >
                          {stat?.notEstablished || 0}
                        </button>
                      </td>
                      <td key={`${dim.key}-rate`} className="py-2 px-1 text-center border-b border-zinc-100">
                        <span
                          className={`font-medium ${
                            rate >= 80
                              ? 'text-emerald-600'
                              : rate >= 60
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {/* 趋势行：显示近8周的升降趋势 */}
          <tfoot>
            <tr className="bg-zinc-100/70">
              <td className="py-2.5 px-3 text-zinc-600 font-medium sticky left-0 bg-zinc-100/70 border-t border-zinc-200 whitespace-nowrap" style={{ minWidth: 70 }}>
                趋势
              </td>
              {DIMENSIONS.map((dim) => {
                const firstWeek = weeklyData[0]?.stats[dim.key]?.completionRate || 0
                const lastWeek = weeklyData[weeklyData.length - 1]?.stats[dim.key]?.completionRate || 0
                const diff = lastWeek - firstWeek
                const isUp = diff > 0
                const isStable = Math.abs(diff) < 2

                return (
                  <td
                    key={dim.key}
                    className="py-2.5 px-1 text-center border-t border-zinc-200"
                    colSpan={3}
                  >
                    {isStable ? (
                      <span className="text-zinc-400">—</span>
                    ) : isUp ? (
                      <span className="text-emerald-600 font-medium">↑{diff.toFixed(1)}%</span>
                    ) : (
                      <span className="text-red-600 font-medium">↓{Math.abs(diff).toFixed(1)}%</span>
                    )}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 底部汇总 */}
      <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-zinc-500">统计周期：近8周</span>
          <span className="text-zinc-500">企业总数：266家</span>
        </div>
        <div className="text-zinc-600">
          本周平均完善率：
          <span className="font-medium text-emerald-600 ml-1">
            {avgCompletionRate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ≥80% 达标
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          60-80% 预警
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          &lt;60% 不达标
        </span>
        <span className="flex items-center gap-1 ml-4">
          <span className="text-zinc-400">💡 点击数字可查看对应企业列表</span>
        </span>
      </div>
    </SectionBlock>
  )
}

// 获取最近N周
function getRecentWeeks(count: number): { key: string; label: string }[] {
  const weeks: { key: string; label: string }[] = []
  const today = new Date()

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i * 7 - date.getDay())
    const year = date.getFullYear()
    const weekNum = getWeekNumber(date)
    const month = date.getMonth() + 1

    weeks.push({
      key: `${year}-W${weekNum.toString().padStart(2, '0')}`,
      label: `${month}月第${getWeekOfMonth(date)}周`,
    })
  }

  return weeks
}

// 获取一年中的周数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// 获取是当月的第几周
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfWeek = firstDay.getDay()
  const dayOfMonth = date.getDate()
  return Math.ceil((dayOfMonth + dayOfWeek) / 7)
}

// 根据维度获取基础完成率
function getBaseRateByDimension(key: string): number {
  const rates: Record<string, number> = {
    info_collection: 96,
    risk_points: 85,
    safety_system: 46,
    inspection_task: 67,
    planned_inspection: 68,
    third_party_sync: 55,
    patrol: 72,
    training: 60,
    work_permit: 45,
    hazard_discovery: 78,
    park_inspection: 52,
  }
  return rates[key] || 60
}
