// ============================================
// 组织与人员维度 - 配置
// ============================================

import type {
  WorkGroupTypeConfig,
  RiskLevelConfig,
  GradeConfig,
  WorkGroupType,
  WorkGroupRiskLevel,
  PerformanceGrade,
} from './types'

// ============================================
// 工作组类型配置
// ============================================

/** 工作组类型配置映射 */
export const WORK_GROUP_TYPE_CONFIG: Record<WorkGroupType, WorkGroupTypeConfig> = {
  enterprise: {
    code: 'enterprise',
    name: '企业安全组',
    icon: '🏭',
    description: '负责生产企业、工贸企业安全监管',
    color: '#4f46e5',
  },
  fire_safety: {
    code: 'fire_safety',
    name: '消防安全组',
    icon: '🚒',
    description: '负责场所消防安全检查',
    color: '#dc2626',
  },
  special: {
    code: 'special',
    name: '专项检查组',
    icon: '🔍',
    description: '负责危化品、特种设备等专项检查',
    color: '#d97706',
  },
  other: {
    code: 'other',
    name: '其他工作组',
    icon: '📋',
    description: '其他专项工作小组',
    color: '#6b7280',
  },
}

// ============================================
// 风险等级配置
// ============================================

/** 风险等级配置映射 */
export const RISK_LEVEL_CONFIG: Record<WorkGroupRiskLevel, RiskLevelConfig> = {
  major: {
    code: 'major',
    name: '重大风险',
    color: '#dc2626',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    emoji: '🔴',
  },
  high: {
    code: 'high',
    name: '较大风险',
    color: '#d97706',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    emoji: '🟠',
  },
  general: {
    code: 'general',
    name: '一般风险',
    color: '#16a34a',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
    emoji: '🟢',
  },
  safety: {
    code: 'safety',
    name: '安全风险',
    color: '#06b6d4',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    emoji: '🔵',
  },
}

// ============================================
// 绩效等级配置
// ============================================

/** 绩效等级配置映射 */
export const GRADE_CONFIG: Record<PerformanceGrade, GradeConfig> = {
  A: {
    code: 'A',
    name: '优秀',
    color: '#16a34a',
    bgColor: 'bg-emerald-50',
    description: '综合表现优异，超额完成指标',
  },
  B: {
    code: 'B',
    name: '良好',
    color: '#4f46e5',
    bgColor: 'bg-indigo-50',
    description: '表现良好，顺利完成工作',
  },
  C: {
    code: 'C',
    name: '合格',
    color: '#d97706',
    bgColor: 'bg-amber-50',
    description: '基本完成，存在改进空间',
  },
  D: {
    code: 'D',
    name: '不合格',
    color: '#dc2626',
    bgColor: 'bg-red-50',
    description: '未达标，需要重点关注',
  },
}

// ============================================
// 绩效维度配置
// ============================================

/** 默认绩效维度配置 */
export const DEFAULT_PERFORMANCE_DIMENSIONS = [
  { name: '企业基础覆盖度', weight: 10 },
  { name: '制度数字化完善度', weight: 10 },
  { name: '风险识别精准度', weight: 10 },
  { name: '检查计划科学度', weight: 10 },
  { name: '自查执行活跃度', weight: 15 },
  { name: '隐患闭环治理度', weight: 15 },
  { name: '远程监管效能度', weight: 30 },
]

// ============================================
// 样式配置
// ============================================

/** 等级徽章样式 */
export const getGradeBadgeStyle = (grade: PerformanceGrade) => {
  const config = GRADE_CONFIG[grade]
  return {
    bg: config.bgColor,
    text: config.textColor || config.color,
    border: `border-${config.color.split('#')[1]}`,
  }
}

/** 风险等级徽章样式 */
export const getRiskLevelBadgeStyle = (level: WorkGroupRiskLevel) => {
  const config = RISK_LEVEL_CONFIG[level]
  return {
    bg: config.bgColor,
    text: config.textColor,
    color: config.color,
  }
}

/** 完成率颜色 */
export const getCompletionRateColor = (rate: number) => {
  if (rate >= 90) return 'text-emerald-600'
  if (rate >= 80) return 'text-blue-600'
  if (rate >= 70) return 'text-amber-600'
  return 'text-red-600'
}

/** 绩效分颜色 */
export const getPerformanceScoreColor = (score: number) => {
  if (score >= 90) return 'text-emerald-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-amber-600'
  return 'text-red-600'
}

/** 趋势指示器 */
export const getTrendIcon = (value: number) => {
  if (value > 0) return '↑'
  if (value < 0) return '↓'
  return '→'
}

/** 趋势颜色 */
export const getTrendColor = (value: number) => {
  if (value > 0) return 'text-emerald-600'
  if (value < 0) return 'text-red-600'
  return 'text-zinc-400'
}

// ============================================
// 筛选器配置
// ============================================

/** 工作组类型筛选选项 */
export const WORK_GROUP_TYPE_OPTIONS = [
  { value: 'all' as const, label: '全部', icon: '📁' },
  { value: 'enterprise' as WorkGroupType, label: '企业安全组', icon: '🏭' },
  { value: 'fire_safety' as WorkGroupType, label: '消防安全组', icon: '🚒' },
  { value: 'special' as WorkGroupType, label: '专项检查组', icon: '🔍' },
  { value: 'other' as WorkGroupType, label: '其他工作组', icon: '📋' },
]

/** 风险等级筛选选项 */
export const RISK_LEVEL_OPTIONS = [
  { value: 'all' as const, label: '全部风险' },
  { value: 'major' as WorkGroupRiskLevel, label: '重大风险', emoji: '🔴' },
  { value: 'high' as WorkGroupRiskLevel, label: '较大风险', emoji: '🟠' },
  { value: 'general' as WorkGroupRiskLevel, label: '一般风险', emoji: '🟢' },
  { value: 'safety' as WorkGroupRiskLevel, label: '安全风险', emoji: '🔵' },
]

// ============================================
// 组件配置
// ============================================

/** 工作组卡片配置 */
export const WORK_GROUP_CARD_CONFIG = {
  /** 显示的指标字段 */
  displayMetrics: [
    { key: 'completionRate', label: '任务完成率', unit: '%' },
    { key: 'hazardFound', label: '发现隐患', unit: '处' },
    { key: 'closureRate', label: '整改率', unit: '%' },
    { key: 'coverageRate', label: '企业覆盖', unit: '%' },
  ] as const,
  /** 紧凑模式显示字段 */
  compactMetrics: [
    { key: 'completionRate', label: '完成率', unit: '%' },
    { key: 'hazardFound', label: '隐患', unit: '处' },
  ] as const,
}

/** 成员卡片配置 */
export const MEMBER_CARD_CONFIG = {
  /** 显示的指标 */
  displayMetrics: [
    { key: 'taskCompletionRate', label: '任务完成率' },
    { key: 'hazardFound', label: '发现隐患' },
    { key: 'rectificationRate', label: '整改率' },
  ] as const,
}

/** 专家卡片配置 */
export const EXPERT_CARD_CONFIG = {
  /** 显示的指标 */
  displayMetrics: [
    { key: 'totalTasks', label: '任务数' },
    { key: 'closureRate', label: '闭环率' },
    { key: 'avgClosureDays', label: '闭环天数' },
  ] as const,
}
