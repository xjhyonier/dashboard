import type { RiskLevelConfig, CycleStatus } from './types'

// 风险等级周期配置
export const RISK_LEVEL_CYCLE_CONFIG: Record<string, RiskLevelConfig> = {
  major: {
    code: 'major',
    name: '重大风险',
    color: 'red',
    emoji: '🔴',
    cycleMonths: 3,
    cycleName: '季度',
    description: '每3个月一个检查周期',
  },
  high: {
    code: 'high',
    name: '较大风险',
    color: 'orange',
    emoji: '🟠',
    cycleMonths: 6,
    cycleName: '半年',
    description: '每6个月一个检查周期',
  },
  medium: {
    code: 'medium',
    name: '一般风险',
    color: 'amber',
    emoji: '🟡',
    cycleMonths: 12,
    cycleName: '年度',
    description: '每12个月一个检查周期',
  },
  low: {
    code: 'low',
    name: '低风险',
    color: 'emerald',
    emoji: '🟢',
    cycleMonths: 12,
    cycleName: '年度/按需',
    description: '每年或按需检查',
  },
}

// 状态对应样式
export const STATUS_STYLES: Record<CycleStatus, { 
  color: 'emerald' | 'amber' | 'red'
  bg: string
  text: string
  label: string 
}> = {
  ahead: { 
    color: 'emerald', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600', 
    label: '🟢 超前' 
  },
  normal: { 
    color: 'emerald', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600', 
    label: '🟢 正常' 
  },
  lagging: { 
    color: 'amber', 
    bg: 'bg-amber-50', 
    text: 'text-amber-600', 
    label: '🟡 滞后' 
  },
  critical: { 
    color: 'red', 
    bg: 'bg-red-50', 
    text: 'text-red-600', 
    label: '🔴 严重滞后' 
  },
}
