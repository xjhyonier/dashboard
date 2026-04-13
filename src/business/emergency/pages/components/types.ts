// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────
import type { Enterprise10D } from '../mock/station-chief-v2'

export type SortDirection = 'asc' | 'desc' | null

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

export interface DutyDimensionProps {
  dateRange: { start: string; end: string }
  selectedKpi: string | null
  setSelectedKpi: (k: string | null) => void
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
}

export interface HazardDimensionProps {
  dateRange: { start: string; end: string }
  selectedKpi: string | null
  setSelectedKpi: (k: string | null) => void
}

export interface IndustryDimensionProps {
  dateRange: { start: string; end: string }
  selectedKpi: string | null
}

export interface SpecialDimensionProps {
  dateRange: { start: string; end: string }
  selectedKpi: string | null
}

export type Dimension = 'duty' | 'industry' | 'special' | 'state' | 'hazard'
