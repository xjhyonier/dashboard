/**
 * TrendDimension - 趋势维度组件
 * 
 * 展示多种趋势图表
 */

import { TrendCharts } from './TrendCharts'

interface TrendDimensionProps {
  filterTeam?: string
  filterExpert?: string
  filterEnterprise?: string
  filterIndustry?: string
}

export function TrendDimension(props: TrendDimensionProps) {
  return (
    <div>
      <TrendCharts {...props} />
    </div>
  )
}
