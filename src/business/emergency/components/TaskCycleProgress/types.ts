// 风险等级代码
export type RiskLevelCode = 'major' | 'high' | 'medium' | 'low'

// 周期状态
export type CycleStatus = 'ahead' | 'normal' | 'lagging' | 'critical'

// 单个周期进度数据
export interface CycleProgress {
  // 周期基本信息
  riskLevel: RiskLevelCode
  cycleName: string           // "Q2", "H1", "2026"
  startDate: string           // "2026-03-01"
  endDate: string             // "2026-06-30"
  
  // 时间进度
  totalDays: number           // 周期总天数
  passedDays: number          // 已过天数
  remainingDays: number       // 剩余天数
  timeProgress: number        // 0-100
  
  // 任务进度
  totalEnterprises: number    // 该风险等级企业总数
  requiredTasks: number       // 应完成任务数
  completedTasks: number      // 已完成任务数
  pendingTasks: number        // 待完成任务数
  overdueTasks: number        // 逾期任务数
  taskProgress: number        // 0-100
  
  // 状态评估
  vsTimeProgress: number      // 相对于时间进度的差值 (+超前, -滞后)
  status: CycleStatus
  
  // 趋势
  monthOverMonth: number      // 环比变化 (+12%, -5%)
}

// 完整数据接口
export interface TaskCycleProgressData {
  currentDate: string
  cycles: Record<RiskLevelCode, CycleProgress>
}

// 风险等级配置
export interface RiskLevelConfig {
  code: RiskLevelCode
  name: string
  color: 'red' | 'orange' | 'amber' | 'emerald'
  emoji: string
  cycleMonths: number
  cycleName: string
  description: string
}
