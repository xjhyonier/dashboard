// 布局组件类型
export interface PageHeaderProps {
  title: string
  subtitle?: string
  updateTime?: string
  actions?: React.ReactNode
}

export interface FilterBarProps {
  filters?: FilterItem[]
  onFilterChange?: (key: string, value: string) => void
}

export interface FilterItem {
  key: string
  label: string
  type: 'select' | 'date' | 'tabs'
  options?: { label: string; value: string }[]
  value?: string
}

export interface SectionBlockProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export interface GridLayoutProps {
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

// 看板组件类型
export interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: {
    value: number
    label: string
    type: 'up' | 'down' | 'neutral'
  }
  description?: string
}

export interface TrendCardProps {
  title: string
  currentValue: string | number
  data: Array<{ label: string; value: number }>
  trend?: {
    value: number
    type: 'up' | 'down' | 'neutral'
  }
}

export interface DistributionCardProps {
  title: string
  data: Array<{ label: string; value: number; color?: string }>
  total?: number
}

export interface RankingCardProps {
  title: string
  data: Array<{
    rank: number
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'same'
  }>
  maxItems?: number
}

export interface TableCardProps {
  title: string
  columns: Array<{ key: string; label: string; width?: string }>
  data: Array<Record<string, any>>
  maxRows?: number
}

export interface StatusCardProps {
  title: string
  items: Array<{
    label: string
    status: 'success' | 'warning' | 'danger' | 'neutral'
    count?: number
  }>
}

// 状态反馈组件类型
export interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
}

export interface LoadingStateProps {
  message?: string
}

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}
