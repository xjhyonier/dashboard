// ==================== 专家工作台全局类型定义 ====================

// ==================== 基础枚举类型 ====================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export type HazardStatus = 'pending_issue' | 'issued' | 'rectifying' | 'pending_review' | 'closed'

export type TodoStatus = 'todo' | 'in_progress' | 'done' | 'closed'

export type SubTaskStatus = 'pending' | 'in_progress' | 'completed'

export type TaskType = 'daily' | 'special'

export type ServiceRecordType = 'wechat' | 'phone' | 'onsite' | 'other'

export type ChangeType = 'added' | 'transferred_in' | 'transferred_out' | 'removed'

// ==================== 企业相关 ====================

export interface Enterprise {
  id: string
  name: string
  industry: string
  scale: string
  address: string
  contactName: string
  contactPhone: string
  safetyOfficer: string
  safetyOfficerPhone: string
  riskScore: number
  expertRating?: number
  workGroups: string[]
  lastCheckDate?: string
  openHazardCount: number
  boardScores: BoardScore[]
  aiInsight?: AiInsight
}

export interface BoardScore {
  board: string
  score: number
  anomalyCount: number
  anomalies: AnomalyItem[]
}

export interface AnomalyItem {
  id: string
  description: string
  severity: RiskLevel
  board: string
  detectedAt: string
}

// ==================== AI 洞察 ====================

export interface AiInsight {
  summary: string
  trend: TrendPoint[]
  suggestions: AiSuggestion[]
}

export interface TrendPoint {
  month: string
  score: number
}

export interface AiSuggestion {
  id: string
  priority: number
  action: string
  relatedBoard: string
  relatedAnomalyIds: string[]
}

// ==================== 标注记录 ====================

export interface AnnotationRecord {
  id: string
  enterpriseId: string
  enterpriseName: string
  board: string
  aiScore: number
  expertScore: number
  agreement: 'agree' | 'disagree'
  reason: string
  annotatedAt: string
}

// ==================== 隐患单 ====================

export interface Hazard {
  id: string
  enterpriseId: string
  enterpriseName: string
  description: string
  location: string
  level: 'general' | 'major'
  board: string
  photos: string[]
  status: HazardStatus
  assignedTo?: string
  rectifyDeadline?: string
  createdAt: string
  issuedAt?: string
  rectifyingAt?: string
  reviewAt?: string
  closedAt?: string
  reviewResult?: 'pass' | 'fail'
  reviewReason?: string
}

// ==================== 服务记录 ====================

export interface ServiceRecord {
  id: string
  enterpriseId: string
  enterpriseName: string
  type: ServiceRecordType
  content: string
  attachments: string[]
  relatedHazardId?: string
  createdAt: string
  creatorName: string
}

// ==================== 待办 ====================

export interface TodoItem {
  id: string
  title: string
  description: string
  enterpriseId?: string
  enterpriseName?: string
  source: 'ai_push' | 'manual' | 'external_sync' | 'task'
  sourceLabel: string
  workGroup?: string
  status: TodoStatus
  priority: RiskLevel
  deadline: string
  createdAt: string
  completedAt?: string
  groupId?: string
  groupSubItems?: GroupSubItem[]
}

export interface GroupSubItem {
  id: string
  title: string
  source: string
  workGroup: string
  status: TodoStatus
}

// ==================== 检查任务 ====================

export interface InspectionTask {
  id: string
  title: string
  type: TaskType
  urgency: RiskLevel
  description: string
  startDate: string
  deadline: string
  status: 'in_progress' | 'completed' | 'overdue'
  overallProgress: number
  totalSubTasks: number
  completedSubTasks: number
  assignedExpertCount: number
  mySubTasks: SubTask[]
}

export interface SubTask {
  id: string
  taskId: string
  title: string
  enterpriseId: string
  enterpriseName: string
  status: SubTaskStatus
  startedAt?: string
  completedAt?: string
}

// ==================== 工作组 ====================

export interface WorkGroup {
  id: string
  name: string
  enterpriseCount: number
  enterprises: WorkGroupEnterprise[]
}

export interface WorkGroupEnterprise {
  enterpriseId: string
  enterpriseName: string
  riskScore: number
  overlapGroups: string[]
}

// ==================== 责任池变动 ====================

export interface PoolChange {
  id: string
  type: ChangeType
  enterpriseId: string
  enterpriseName: string
  fromExpert?: string
  toExpert?: string
  workGroup: string
  pendingItems: {
    openHazards: number
    openTodos: number
    pendingReviews: number
  }
  changedAt: string
  read: boolean
}

// ==================== 沟通 ====================

export interface ChatEnterprise {
  enterpriseId: string
  enterpriseName: string
  safetyOfficerName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface ChatMessage {
  id: string
  enterpriseId: string
  senderType: 'expert' | 'officer' | 'system'
  senderName: string
  content: string
  type: 'text' | 'image' | 'system'
  imageUrl?: string
  relatedHazardId?: string
  sentAt: string
}

// ==================== 驾驶舱聚合数据 ====================

export interface DashboardKpi {
  todayTodoCount: number
  weekExpiringCount: number
  overdueCount: number
  monthCompletedCount: number
}

export interface WorkProgress {
  visitCoverageRate: number
  hazardDiscoveryCount: number
  rectificationPushCount: number
  ledgerCompleteness: number
}

export interface TaskProgressOverview {
  dailyTaskCount: number
  dailyAvgProgress: number
  specialTaskCount: number
  specialAvgProgress: number
  nearestDeadline: string
}
