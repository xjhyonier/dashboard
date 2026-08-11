// ============================================
// 组织与人员维度 - 类型定义
// ============================================

/** 工作组风险等级 */
export type WorkGroupRiskLevel = 'major' | 'high' | 'general' | 'safety'

/** 工作组类型 */
export type WorkGroupType = 'enterprise' | 'fire_safety' | 'special' | 'other'

/** 组成员角色 */
export type GroupMemberRole = 'leader' | 'deputy' | 'member' | 'expert'

/** 履职等级评分 */
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D'

// ============================================
// 工作组类型
// ============================================

export interface WorkGroup {
  id: string
  /** 工作组名称 */
  name: string
  /** 所属区域 */
  area: string
  /** 工作组类型 */
  type: WorkGroupType
  /** 风险等级 */
  riskLevel: WorkGroupRiskLevel
  /** 组长 */
  leader: string
  /** 副组长 */
  deputy: string
  /** 组成员列表 */
  members: string[]
  /** 成员数量 */
  memberCount: number
  /** 核心指标 */
  // 任务指标
  totalTasks: number           // 总任务数
  completedTasks: number        // 已完成任务数
  completionRate: number       // 任务完成率 (%)
  avgClosureDays: number       // 平均闭环天数
  // 隐患指标
  hazardFound: number          // 发现隐患数
  hazardClosed: number         // 已整改隐患数
  closureRate: number          // 隐患整改率 (%)
  overdueTasks: number          // 逾期任务数
  // 企业覆盖
  enterpriseCount: number      // 负责企业数
  checkedEnterpriseCount: number // 已检查企业数
  coverageRate: number         // 企业覆盖率 (%)
  // 环比变化
  taskGrowth: number           // 任务量环比变化 (%)
  completionRateGrowth: number // 完成率环比变化 (百分点)
}

// ============================================
// 工作组成员类型
// ============================================

export interface GroupMember {
  id: string
  /** 姓名 */
  name: string
  /** 头像（首字母或图片URL） */
  avatar: string
  /** 职务/岗位 */
  position: string
  /** 所属工作组ID */
  workGroupId: string
  /** 角色 */
  role: GroupMemberRole
  /** 履职等级 */
  grade: PerformanceGrade
  // 履职指标
  /** 本月处理任务总数 */
  totalTasks: number
  /** 已完成任务数 */
  completedTasks: number
  /** 任务完成率 (%) */
  taskCompletionRate: number
  /** 负责企业数 */
  enterpriseCount: number
  /** 已走访企业数 */
  visitedCount: number
  /** 发现隐患数 */
  hazardFound: number
  /** 重大隐患数 */
  majorHazardFound: number
  /** 已整改隐患数 */
  hazardRectified: number
  /** 整改率 (%) */
  rectificationRate: number
  // 绩效评分
  /** 综合绩效分 (0-100) */
  performanceScore: number
  /** 绩效维度得分 */
  performanceDimensions: PerformanceDimension[]
  // 趋势
  /** 较上月任务量变化 (%) */
  taskGrowth: number
  /** 较上月闭环率变化 (百分点) */
  closureRateGrowth: number
  /** 工作量趋势（近6周） */
  weeklyTasks: WeeklyTask[]
}

/** 绩效维度 */
export interface PerformanceDimension {
  name: string
  score: number
  weight: number
}

/** 周任务数据 */
export interface WeeklyTask {
  week: string
  count: number
}

// ============================================
// 外部专家类型
// ============================================

export interface Expert {
  id: string
  /** 姓名 */
  name: string
  /** 头像 */
  avatar: string
  /** 所属领域/专业 */
  domain: string
  /** 履职等级 */
  grade: PerformanceGrade
  // 任务指标
  /** 本月处理任务总数 */
  totalTasks: number
  /** 平均闭环天数 */
  avgClosureDays: number
  /** 隐患一次性复核通过率 (%) */
  closureRate: number
  /** 风险评级准确率 (%) */
  riskAccuracy: number
  /** 负责企业数 */
  enterpriseCount: number
  // 绩效
  /** 综合绩效分 (0-100) */
  performanceScore: number
  /** 绩效维度得分 */
  performanceDimensions: PerformanceDimension[]
  // 趋势
  /** 较上月任务量变化 (%) */
  taskGrowth: number
  /** 较上月闭环率变化 (百分点) */
  closureRateGrowth: number
  /** 工作量趋势（近6周） */
  weeklyTasks: WeeklyTask[]
}

// ============================================
// 政府人员类型（组长、副站长）
// ============================================

export interface GovernmentMember {
  id: string
  /** 姓名 */
  name: string
  /** 角色 */
  role: 'leader' | 'deputy'
  /** 头像 */
  avatar: string
  /** 负责区域列表 */
  areas: string[]
  /** 负责的工作组名称列表 */
  workGroups: string[]
  // 履职指标
  /** 负责企业数 */
  enterprisesResponsible: number
  /** 已检查企业数 */
  enterprisesInspected: number
  /** 发现隐患数 */
  hazardsFound: number
  /** 重大隐患数 */
  majorHazards: number
  /** 已整改隐患数 */
  hazardsRectified: number
  /** 整改率 (%) */
  rectificationRate: number
  /** 整改中 */
  inProgress: number
  /** 逾期未整改 */
  overdueUnrectified: number
}

// ============================================
// 配置类型
// ============================================

/** 工作组类型配置 */
export interface WorkGroupTypeConfig {
  code: WorkGroupType
  name: string
  icon: string
  description: string
  color: string
}

/** 风险等级配置 */
export interface RiskLevelConfig {
  code: WorkGroupRiskLevel
  name: string
  color: string
  bgColor: string
  textColor: string
  emoji: string
}

/** 绩效等级配置 */
export interface GradeConfig {
  code: PerformanceGrade
  name: string
  color: string
  bgColor: string
  description: string
}

// ============================================
// 组件 Props 类型
// ============================================

export interface OrganizationPeoplePanelProps {
  /** 工作组数据 */
  workGroups: WorkGroup[]
  /** 工作组成员数据 */
  groupMembers: GroupMember[]
  /** 专家数据 */
  experts: Expert[]
  /** 政府人员数据 */
  governmentMembers: GovernmentMember[]
  /** 是否加载中 */
  loading?: boolean
  /** 是否展开专家组 */
  defaultExpandedExperts?: boolean
  /** 是否展开工作组详情 */
  defaultExpandedWorkGroups?: boolean
  /** 工作组类型筛选 */
  workGroupTypeFilter?: WorkGroupType | 'all'
  /** 区域筛选 */
  areaFilter?: string | 'all'
  /** 选中工作组回调 */
  onWorkGroupClick?: (workGroup: WorkGroup) => void
  /** 选中成员回调 */
  onMemberClick?: (member: GroupMember) => void
  /** 选中专家回调 */
  onExpertClick?: (expert: Expert) => void
  /** 选中政府人员回调 */
  onGovernmentMemberClick?: (member: GovernmentMember) => void
}

export interface WorkGroupCardProps {
  workGroup: WorkGroup
  onClick?: () => void
  compact?: boolean
}

export interface GroupMemberCardProps {
  member: GroupMember
  onClick?: () => void
  compact?: boolean
}

export interface ExpertCardProps {
  expert: Expert
  onClick?: () => void
}

export interface GovernmentMemberRowProps {
  member: GovernmentMember
  onClick?: () => void
}
