/**
 * 应急管理数据模型 - TypeScript 类型定义
 * 
 * 定义所有核心实体的类型，确保数据一致性和类型安全
 */

// ==================== 枚举定义 ====================

/** 企业风险等级 */
export type RiskLevel = '重大' | '较大' | '一般' | '低'

/** 企业状态 */
export type EnterpriseStatus = '在业' | '停产' | '注销'

/** 行业分类 */
export type Industry = '工业企业' | '仓储物流' | '小微企业' | '危化使用' | '九小场所' | '出租房' | '沿街店铺'

/** 责任主体类型 */
export type EnterpriseCategory = '生产型企业' | '经营型企业' | '储存型企业' | '使用型企业' | '场所类'

/** 政府人员职务 */
export type GovernmentPosition = '组长' | '副站长' | '组员'

/** 隐患等级 */
export type HazardLevel = '重大隐患' | '一般隐患'

/** 隐患状态 */
export type HazardStatus = 'pending' | 'rectifying' | 'rectified' | 'verified' | 'rejected' | 'overdue' | 'closed'

/** 隐患来源 */
export type HazardSource = 'expert' | 'enterprise'

/** 验收结果 */
export type VerifyResult = 'pass' | 'fail'

/** 风险点等级 */
export type RiskPointLevel = '重大' | '较大' | '一般' | '低'

/** 风险点类型 */
export type RiskPointType = '用电安全' | '消防安全' | '机械设备' | '危化品储存' | '有限空间' | '高处作业' | '动火作业' | '特种设备' | '职业卫生' | '其他'

/** 风险点管控状态 */
export type RiskPointControlStatus = '未管控' | '管控中' | '已消除' | '已失效'

/** 风险点检查频次 */
export type CheckFrequency = '每日' | '每周' | '每月' | '每季度' | '每年' | '不定期'

/** 检查计划类型 */
export type PlanType = 'weekly' | 'monthly' | 'quarterly' | 'none'

/** 任务类型 */
export type TaskType = '日常检查' | '专项检查' | '督查督办' | '抽检任务'

/** 任务状态 */
export type TaskStatus = '进行中' | '已完成' | '已过期'

/** 整改状态 */
export type RectifyStatus = 'completed' | 'uncompleted' | 'partial' | 'overdue'

/** 状态路径节点状态 */
export type StateNodeStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'not_applicable'

// ==================== 工作组 ====================

export interface WorkGroup {
  id: string
  name: string
  area: string
  risk_level: RiskLevel
  leader_id: string
  enterprise_count: number
  created_at: string
}

// ==================== 政府人员 ====================

export interface GovernmentMember {
  id: string
  name: string
  position: GovernmentPosition
  work_group: string
  work_group_id: string
  phone: string
  created_at: string
}

// ==================== 专家 ====================

export interface Expert {
  id: string
  name: string
  avatar: string
  work_group: string
  work_group_id: string
  grade: string
  enterprise_count: number
  phone: string
  created_at: string
}

/** 专家7维度绩效得分 */
export interface ExpertDimensionScore {
  expert_id: string
  enterprise_id: string
  dim_1_score: number  // 企业基础覆盖度
  dim_2_score: number  // 制度数字化完善度
  dim_3_score: number  // 风险识别精准度
  dim_4_score: number  // 检查计划科学度
  dim_5_score: number  // 自查执行活跃度
  dim_6_score: number  // 隐患闭环治理度
  dim_7_score: number  // 远程监管效能度
  updated_at: string
}

/** 专家平台行为统计 */
export interface ExpertPlatformBehavior {
  expert_id: string
  responsible: number           // 负责企业数
  check_count: number           // 检查次数
  hazard_found: number         // 发现隐患数
  hazard_serious: number       // 重大隐患数
  hazard_closed: number         // 已整改隐患数
  closure_rate: number          // 整改率 %
  risk_mark: number             // 风险标注数
  video_todo: number            // 视频待办数
  hazard_todo: number           // 隐患待办数
  info_complete: number         // 信息完善度 %
  im_chat: number               // IM咨询数
  service_log: number           // 服务日志数
  on_site_visit: number         // 现场查看数
  video_watch: number           // 视频查看数
  ai_watch: number              // AI巡查数
  enterprise_file: number        // 一企一档完成数
}

/** 专家工作量类型 */
export type ExpertWorkType = '现场检查' | '视频巡查' | 'AI巡查' | '隐患复查' | '专家会诊' | '安全培训' | '其他'

/** 专家工作量统计 */
export interface ExpertWorkload {
  expert_id: string
  month_key: string
  week_key: string
  work_type: ExpertWorkType
  count: number
  work_date: string
}

// ==================== 企业 ====================

export interface Enterprise {
  id: string
  name: string
  address: string
  industry: Industry
  category: EnterpriseCategory
  risk_level: RiskLevel
  status: EnterpriseStatus
  work_group: string
  work_group_id: string
  expert_id: string
  ai_score: number
  created_at: string
  updated_at: string
}

/** 企业多维度数据 */
export interface EnterpriseDimensions {
  enterprise_id: string
  
  // 一、信息采集
  info_collected: boolean
  
  // 二、数据授权
  data_authorized: boolean
  
  // 三、风险识别
  risk_identified: boolean
  
  // 四、安全制度建立（百分比）
  duty_rate: number      // 机构职责完善度 0-100%
  system_rate: number    // 安全制度完善度 0-100%
  invest_rate: number    // 安全投入完善度 0-100%
  
  // 五、检查执行
  plan_type: PlanType
  plan_executed: boolean
  third_party_sync: boolean
  patrol_used: boolean
  
  // 六、教育培训
  training_done: boolean
  training_record: boolean
  
  // 七、作业票
  work_permit: boolean
  
  // 八、隐患统计
  hazard_self: number     // 自查自纠隐患数
  hazard_monitor: number // 监管过程发现隐患数
  hazard_major: number   // 重大隐患数
  rectify_status: RectifyStatus
  
  // 九、巡查
  patrol_done: boolean
  
  updated_at: string
}

/** 企业状态路径节点 */
export interface StatePathNode {
  node_id: string
  node_name: string
  status: StateNodeStatus
  value?: string | number
}

/** 企业状态路径 */
export interface EnterpriseStatePath {
  enterprise_id: string
  nodes: StatePathNode[]
}

// ==================== 隐患 ====================

/** 主体责任类型（7个维度） */
export type HazardDimension = 
  | '机构职责'
  | '安全投入'
  | '教育培训'
  | '安全制度'
  | '双重预防'
  | '事故管理'
  | '应急管理'

/** 隐患来源详情 */
export type HazardSourceDetail = 
  | 'ai评估'
  | '一企一档'
  | '视频看'
  | '现场看'
  | '其他'

export interface Hazard {
  id: string
  enterprise_id: string
  // 关联信息
  enterprise_name?: string   // 企业名称
  enterprise_industry?: string  // 企业行业
  team_name?: string        // 工作组名称
  expert_id: string
  expert_name: string
  // 隐患内容
  title: string
  description: string
  // 维度信息
  dimension: HazardDimension  // 主体责任类型（必填）
  // 级别与状态
  level: HazardLevel
  status: HazardStatus
  source: HazardSource
  source_detail: HazardSourceDetail  // 来源详情
  // 时间
  discovered_at: string
  deadline_days: number
  deadline: string
  rectified_at?: string
  verified_at?: string
  verified_by?: string
  verify_result?: VerifyResult
  closed_at?: string
  created_at: string
  updated_at: string
}

/** 隐患状态变更历史 */
export interface HazardHistory {
  id: string
  hazard_id: string
  from_status?: HazardStatus
  to_status: HazardStatus
  operator_id: string
  operator_name: string
  operator_type: 'expert' | 'government' | 'enterprise' | 'system'
  operated_at: string
  note: string
}

// ==================== 风险点 ====================

export interface RiskPoint {
  id: string
  enterprise_id: string
  name: string
  level: RiskPointLevel
  type: RiskPointType
  status: RiskPointControlStatus
  identified_at: string
  last_check_at: string
  check_frequency: CheckFrequency
  plan_type: PlanType
  description: string
  created_at: string
  updated_at: string
}

/** 风险点管控措施 */
export interface RiskPointControl {
  id: string
  risk_point_id: string
  measure: string
  responsible: string
  responsible_phone: string
  frequency: string
  status: RiskPointControlStatus
  created_at: string
  updated_at: string
}

/** 管控记录执行结果 */
export type RecordResult = '正常' | '异常' | '未执行'

/** 风险点管控记录 */
export interface RiskPointRecord {
  id: string
  risk_point_id: string
  measure_id: string
  executed_by: string
  executed_at: string
  result: RecordResult
  note: string
}

// ==================== 任务 ====================

/**
 * 任务（日常检查/专项检查/抽检任务）
 */
export interface Task {
  id: string
  name: string                           // 任务名称
  type: TaskType                         // 任务类型: 日常检查 / 专项检查 / 抽检任务
  publish_unit: string                    // 发布单位: 良渚街道
  target: string                         // 走访对象: 企业
  total_count: number                    // 任务数量（覆盖企业数）
  completed_count: number                 // 已完成数
  completion_rate: number                // 完成率
  creator: string                         // 创建人
  start_date: string                     // 开始时间
  end_date: string                       // 结束时间
  status: TaskStatus                     // 状态: 进行中 / 已完成 / 已过期
  risk_level?: RiskLevel                // 关联风险等级（日常任务用）
  work_group?: string                    // 负责工作组
  enterprise_ids: string[]               // 覆盖企业ID列表
  hazard_count: number                    // 发现隐患数
  major_hazard_count: number             // 重大隐患数
  created_at: string
}

// ==================== 统计类型 ====================

/** 企业统计 */
export interface EnterpriseStats {
  total: number
  byIndustry: Record<Industry, number>
  byCategory: Record<EnterpriseCategory, number>
  byRiskLevel: Record<RiskLevel, number>
  byWorkGroup: Record<string, number>
}

/** 隐患统计 */
export interface HazardStats {
  total: number
  pending: number
  overdue: number
  major: number
  high: number
  general: number
  byStatus: Record<HazardStatus, number>
  byLevel: Record<HazardLevel, number>
  bySource: Record<HazardSource, number>
  closureRate: number
  overdueRate: number
}

/** 工作组统计 */
export interface WorkGroupStats {
  work_group_id: string
  work_group_name: string
  enterprise_count: number
  hazard_total: number
  hazard_major: number
  hazard_pending: number
  hazard_overdue: number
  closure_rate: number
}

/** 专家履职汇总 */
export interface ExpertPerformanceSummary {
  expert_id: string
  totalEnterprises: number
  totalHazards: number
  majorHazards: number
  closureRate: number
  dimensionScores: {
    dim_1: number
    dim_2: number
    dim_3: number
    dim_4: number
    dim_5: number
    dim_6: number
    dim_7: number
  }
}

// ==================== 筛选器类型 ====================

/** 企业筛选器 */
export interface EnterpriseFilters {
  industry?: Industry
  category?: EnterpriseCategory
  riskLevel?: RiskLevel
  workGroup?: string
  expertId?: string
  keyword?: string
}

/** 隐患筛选器 */
export interface HazardFilters {
  enterpriseId?: string
  riskPointId?: string
  level?: HazardLevel
  status?: HazardStatus
  source?: HazardSource
  expertId?: string
  workGroup?: string
  keyword?: string
  /** 按发现时间筛选 */
  discoveredAtRange?: { start: string; end: string }
  /** 按整改期限筛选 */
  deadlineRange?: { start: string; end: string }
  /** 按整改完成时间筛选 */
  rectifiedAtRange?: { start: string; end: string }
  /** 按验收时间筛选 */
  verifiedAtRange?: { start: string; end: string }
  /** 按闭环时间筛选 */
  closedAtRange?: { start: string; end: string }
  /** 按超期天数筛选 */
  overdueDays?: { min?: number; max?: number }
}

/** 专家筛选器 */
export interface ExpertFilters {
  workGroup?: string
}

/** 政府人员筛选器 */
export interface GovernmentMemberFilters {
  position?: GovernmentPosition
  workGroup?: string
}
