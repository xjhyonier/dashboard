// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────
import type { Enterprise10D } from '../mock/station-chief-v2'

export type SortDirection = 'asc' | 'desc' | null
export type RiskLevel = 'all' | 'major' | 'high' | 'medium' | 'low'
export type TimeRange = 'month' | 'quarter' | 'year' | 'custom'

export interface SortState<T> {
  key: keyof T | null
  direction: SortDirection
}

export interface SortableThProps {
  label: string
  sortKey: string
  sort: SortState<Enterprise10D>
  onSort: (key: string) => void
}

// 隐患维度跳转参数
export interface HazardNavigateParams {
  teamName?: string        // 按工作组筛选
  enterpriseName?: string  // 按企业筛选
  expertName?: string      // 按专家筛选
  riskLevel?: RiskLevel   // 按风险等级筛选
  status?: string         // 按状态筛选
}

export interface DutyDimensionProps {
  dateRange: { start: string; end: string }
  riskLevel: RiskLevel
  timeRange: TimeRange
  selectedKpi: string | null
  setSelectedKpi: (k: string | null) => void
  onNavigateToHazard?: (params: HazardNavigateParams) => void
  onNavigateToState?: (params: { teamName?: string; riskLevel?: RiskLevel }) => void
}

export interface DimensionTableProps {
  title: string
  data: {
    id: string
    name: string
    enterpriseCount: number
    hazardFound: number
    hazardSerious: number
    hazardClosed: number
    closureRate: number
    overdue: number
    inProgress: number
  }[]
  keyword: string
  onKeywordChange: (v: string) => void
  keywordPlaceholder: string
}

export interface StateDimensionProps {
  dateRange: { start: string; end: string }
  riskLevel: RiskLevel
  timeRange: TimeRange
  navigateParams?: {
    teamName?: string
    enterpriseName?: string
    expertName?: string
    riskLevel?: RiskLevel
  }
}

export interface HazardDimensionProps {
  dateRange: { start: string; end: string }
  riskLevel: RiskLevel
  timeRange: TimeRange
  selectedKpi: string | null
  setSelectedKpi: (k: string | null) => void
  // 导航参数（从其他维度跳转过来时携带的筛选条件）
  navigateParams?: HazardNavigateParams
}

export interface IndustryDimensionProps {
  dateRange: { start: string; end: string }
  riskLevel: RiskLevel
  timeRange: TimeRange
  selectedKpi: string | null
}

export interface SpecialDimensionProps {
  dateRange: { start: string; end: string }
  riskLevel: RiskLevel
  timeRange: TimeRange
  selectedKpi: string | null
}

export type Dimension = 'duty' | 'industry' | 'special' | 'state' | 'hazard'
