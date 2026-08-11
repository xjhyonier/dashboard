import type { RiskLevelCode, CycleStatus } from './types'

// 获取当前周期
export function getCurrentCycle(
  riskLevel: RiskLevelCode,
  currentDate: Date = new Date()
): { cycleName: string; startDate: Date; endDate: Date } {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1 // 1-12

  switch (riskLevel) {
    case 'major': // 重大风险 - 3个月周期 (Q1-Q4)
      const quarter = Math.ceil(month / 3)
      return {
        cycleName: `Q${quarter}`,
        startDate: new Date(year, (quarter - 1) * 3, 1),
        endDate: new Date(year, quarter * 3, 0), // 季度最后一天
      }

    case 'high': // 较大风险 - 6个月周期 (H1-H2)
      const half = month <= 6 ? 1 : 2
      return {
        cycleName: `H${half}`,
        startDate: new Date(year, half === 1 ? 0 : 6, 1),
        endDate: new Date(year, half === 1 ? 6 : 12, 0),
      }

    case 'medium':
    case 'low': // 一般/低风险 - 12个月周期
      return {
        cycleName: `${year}`,
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31),
      }
  }
}

// 计算时间进度
export function calculateTimeProgress(
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): { progress: number; passedDays: number; totalDays: number } {
  const totalTime = endDate.getTime() - startDate.getTime()
  const passedTime = currentDate.getTime() - startDate.getTime()

  const totalDays = Math.ceil(totalTime / (1000 * 60 * 60 * 24))
  const passedDays = Math.floor(passedTime / (1000 * 60 * 60 * 24))

  const progress = Math.min(100, Math.max(0, (passedDays / totalDays) * 100))

  return { progress, passedDays, totalDays }
}

// 状态判断
export function getStatus(
  taskProgress: number,
  timeProgress: number
): { status: CycleStatus; diff: number } {
  const diff = taskProgress - timeProgress
  const ratio = timeProgress > 0 ? taskProgress / timeProgress : 1

  if (ratio >= 1.0) {
    return { status: 'ahead', diff }
  } else if (ratio >= 0.9) {
    return { status: 'normal', diff }
  } else if (ratio >= 0.8) {
    return { status: 'lagging', diff }
  } else {
    return { status: 'critical', diff }
  }
}

// 格式化日期为 MM-DD
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day}`
}
