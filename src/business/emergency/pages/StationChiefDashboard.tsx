import { useState, useMemo, useEffect, useRef } from 'react'
import { PageShell, PageHeader, SectionBlock, GridLayout } from '../../../components/layout'
import { SideNavigation } from '../../../components/layout/SideNavigation'
import { TrendCard } from '../../../components/widgets'
import { EnterpriseStatePath } from '../../../components/shared/EnterpriseStatePath'
import { ExpertPerformanceModal } from '../components/ExpertPerformanceModal'
import { CreateTaskModal } from '../components/CreateTaskModal'
import { GovernmentStaffList } from '../components/GovernmentStaffList'
import { WeeklyDimensionStats, type DimensionFilter } from '../components/WeeklyDimensionStats'
import { TaskCycleProgressPanel } from '../components/TaskCycleProgress'
import { mockTaskCycleProgress } from '../components/TaskCycleProgress/mock'
import { getEnterprisesWithDimensions, getEnterpriseStats, initDatabase, resetDatabase } from '../../../db'
import {
  EnterpriseResponsibilityOverview,
  ABCClassificationTable,
  PlatformUsageAnalysis,
  RiskLevelControl,
  SelfInspectionManagement,
} from '../components/DimensionThreeComponents'
import {
  SafetySituationOverview,
  RiskCharacteristics,
  DistrictRiskHeatmap,
  CompletedWorkStats,
  NextStepsPlan,
} from '../components/DimensionFourComponents'
import {
  stationChiefMock,
  workGroups,
  type DimensionScore,
  type WorkGroup,
  type ExpertMember,
} from './mock/station-chief'

// ─────────────────────────────────────────────
// 通用排序 Hook
// ─────────────────────────────────────────────

type SortDirection = 'asc' | 'desc' | null

interface SortState<T> {
  key: keyof T | null
  direction: SortDirection
}

interface UseSortableTableOptions<T> {
  defaultSortKey?: keyof T
  defaultDirection?: 'asc' | 'desc'
}

function useSortableTable<T>(
  data: T[],
  options: UseSortableTableOptions<T> = {}
) {
  const { defaultSortKey, defaultDirection = 'desc' } = options
  const [sort, setSort] = useState<SortState<T>>({
    key: defaultSortKey || null,
    direction: defaultSortKey ? defaultDirection : null
  })

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data

    return [...data].sort((a, b) => {
      const aVal = a[sort.key!]
      const bVal = b[sort.key!]

      // 处理 undefined/null
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sort.direction === 'asc' ? -1 : 1
      if (bVal == null) return sort.direction === 'asc' ? 1 : -1

      // 字符串比较
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc'
          ? aVal.localeCompare(bVal, 'zh-CN')
          : bVal.localeCompare(aVal, 'zh-CN')
      }

      // 数字/布尔比较
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sort])

  const handleSort = (key: keyof T) => {
    setSort(prev => {
      if (prev.key !== key) {
        return { key, direction: 'desc' }
      }
      // 循环切换: desc -> asc -> null
      if (prev.direction === 'desc') return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key: null, direction: null }
      return { key, direction: 'desc' }
    })
  }

  const getSortIcon = (key: keyof T) => {
    if (sort.key !== key) return '⇅'
    if (sort.direction === 'desc') return '↓'
    return '↑'
  }

  return { sortedData, sort, handleSort, getSortIcon }
}

// 可排序表头组件
function SortableHeader<T>({
  label,
  sortKey,
  currentSort,
  onSort,
  width,
  className = ''
}: {
  label: string
  sortKey: keyof T
  currentSort: SortState<T>
  onSort: (key: keyof T) => void
  width?: number | string
  className?: string
}) {
  const isActive = currentSort.key === sortKey
  const icon = isActive
    ? currentSort.direction === 'desc'
      ? '↓'
      : '↑'
    : '⇅'

  return (
    <th
      className={`py-2.5 px-1 font-medium text-zinc-500 cursor-pointer select-none hover:bg-zinc-50 transition-colors ${className}`}
      style={{ width }}
      onClick={() => onSort(sortKey)}
      title={`点击排序${isActive ? (currentSort.direction === 'desc' ? '（当前降序）' : '（当前升序）') : ''}`}
    >
      <div className="flex items-center justify-center gap-0.5">
        <span>{label}</span>
        <span className={`text-[10px] ${isActive ? 'text-emerald-600 font-bold' : 'text-zinc-300'}`}>
          {icon}
        </span>
      </div>
    </th>
  )
}

// 企业类型（企业端安全业务活动维度 - 新版扩展）
interface Enterprise10D {
  id: string
  name: string
  risk_level: string
  ai_score: number
  work_group: string
  expert_id: string
  // 基础维度
  info_collection?: boolean
  data_authorized?: boolean
  risk_point_identified?: boolean
  // 安全制度3维度
  safety_org_duty_rate?: number
  safety_system_rate?: number
  safety_invest_rate?: number
  // 检查任务
  inspection_plan_type?: 'weekly' | 'monthly' | 'quarterly' | 'none'
  inspection_execution?: 'yes' | 'no' | 'forced'
  // 同步与巡查
  third_party_sync?: 'yes' | 'no' | 'optional'
  patrol_used?: 'yes' | 'no' | 'optional'
  // 教育培训
  training_done?: boolean
  training_has_record?: boolean
  // 作业票与隐患
  work_permit_count?: number
  hazard_self_check?: number
  hazard_platform?: number
  hazard_major?: number
  // 整改进展
  hazard_rectify_status?: 'completed' | 'uncompleted' | 'partial' | 'overdue'
  // 检查与执法
  inspection_count?: number      // 当月检查次数
  hazard_rectified?: number      // 已整改隐患数
  enforcement_count?: number     // 执法立案数
}

// ─────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────

type ExpertFilter = 'all' | string
type RiskLevelFilter = 'all' | 'major' | 'high' | 'medium' | 'low'
type OrgGroupFilter = 'all' | 'production' | 'venue'

// ─────────────────────────────────────────────
// 1. 筛选器组件
// ─────────────────────────────────────────────

function ExpertFilterBar({
  selectedExpertId,
  onSelect,
}: {
  selectedExpertId: ExpertFilter
  onSelect: (id: ExpertFilter) => void
}) {
  const experts = stationChiefMock.expertTeam

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 mr-1">专家：</span>
      
      {/* 全部按钮 */}
      <button
        onClick={() => onSelect('all')}
        className={`
          px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
          ${selectedExpertId === 'all'
            ? 'bg-zinc-800 border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}
        `}
      >
        全部 ({experts.length}人)
      </button>

      {/* 专家列表 */}
      {experts.map(expert => {
        const isSelected = selectedExpertId === expert.id
        return (
          <button
            key={expert.id}
            onClick={() => onSelect(expert.id)}
            className={`
              px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${isSelected
                ? 'bg-zinc-700 border-zinc-700 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}
            `}
          >
            {expert.name}
          </button>
        )
      })}
    </div>
  )
}

function RiskLevelFilterBar({
  selectedRiskLevel,
  onSelect,
}: {
  selectedRiskLevel: RiskLevelFilter
  onSelect: (level: RiskLevelFilter) => void
}) {
  const riskOptions = [
    { value: 'all', label: '全部风险', count: 380, color: 'bg-zinc-800' },
    { value: 'major', label: '重大风险', count: 12, color: 'bg-red-500' },
    { value: 'high', label: '较大风险', count: 45, color: 'bg-orange-500' },
    { value: 'medium', label: '一般风险', count: 128, color: 'bg-amber-500' },
    { value: 'low', label: '低风险', count: 195, color: 'bg-emerald-500' },
  ] as const

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 mr-1">风险等级：</span>
      
      {riskOptions.map(option => {
        const isSelected = selectedRiskLevel === option.value
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value as RiskLevelFilter)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${isSelected
                ? 'bg-zinc-700 border-zinc-700 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}
            `}
          >
            <span className={`w-2 h-2 rounded-full ${option.color}`} />
            <span>{option.label}</span>
            <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
              ({option.count})
            </span>
          </button>
        )
      })}
    </div>
  )
}

// 组织架构筛选器
function OrgGroupFilterBar({
  selectedGroup,
  onSelect,
}: {
  selectedGroup: OrgGroupFilter
  onSelect: (group: OrgGroupFilter) => void
}) {
  const groupOptions = [
    { value: 'all', label: '全部', icon: '🏢' },
    { value: 'production', label: '生产企业组', icon: '🏭', desc: '生产企业、工贸企业' },
    { value: 'venue', label: '场所安全组', icon: '🏪', desc: '商超、餐饮、娱乐场所等' },
  ] as const

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-500 mr-1">组织架构：</span>
      
      {groupOptions.map(option => {
        const isSelected = selectedGroup === option.value
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value as OrgGroupFilter)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}
            `}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
            {'desc' in option && (
              <span className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
                {option.desc}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// 2a. 维度分区标题组件
// ─────────────────────────────────────────────

interface DimensionSectionTitleProps {
  number: string
  title: string
  description?: string
  isExtension?: boolean
}

function DimensionSectionTitle({ number, title, description, isExtension }: DimensionSectionTitleProps) {
  return (
    <div className={`py-6 mt-4 mb-2 ${isExtension ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-4">
        {/* 维度编号 */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-lg">{number}</span>
        </div>
        
        {/* 标题和描述 */}
        <div className="flex-1">
          <h2 className="text-lg font-bold text-zinc-800">{title}</h2>
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
        
        {/* 装饰线 */}
        <div className="flex-1 h-px bg-gradient-to-r from-zinc-300 to-transparent"></div>
      </div>
    </div>
  )
}

// 2b. 电梯导航Tab组件
// ─────────────────────────────────────────────

interface DimensionTab {
  id: string
  number: string
  title: string
  isExtension?: boolean
}

// 维度子模块定义
interface DimensionModule {
  number: string
  title: string
}

interface DimensionData {
  id: string
  number: string
  title: string
  subtitle: string
  indicatorCount: number
  modules: DimensionModule[]
  isExtension?: boolean
  color: string
}

const dimensionsData: DimensionData[] = [
  {
    id: 'dimension-1',
    number: '一',
    title: '日常监管工作',
    subtitle: '计划执行、片区监管、专项检查、隐患闭环',
    indicatorCount: 42,
    color: 'indigo',
    modules: [
      { number: '（一）', title: '月度及年度累计情况' },
      { number: '（二）', title: '分片区监管情况' },
      { number: '（三）', title: '分行业与隐患结构分析' },
      { number: '（四）', title: '一般风险、低风险企业检查' },
      { number: '（五）', title: '危化使用企业专项检查' },
      { number: '（六）', title: '重点时段与隐患闭环管理' },
    ],
  },
  {
    id: 'dimension-2',
    number: '二',
    title: '人员履职情况',
    subtitle: '安全组、专家组履职统计与事故追溯',
    indicatorCount: 40,
    color: 'emerald',
    modules: [
      { number: '（一）', title: '企业安全组履职情况' },
      { number: '（二）', title: '消防安全组履职情况' },
      { number: '（三）', title: '组内工作人员年度计划' },
      { number: '（四）', title: '安全专家履职情况' },
      { number: '（五）', title: '事故倒查追溯' },
      { number: '（六）', title: '上级督查问题整改' },
    ],
  },
  {
    id: 'dimension-3',
    number: '三',
    title: '企业主体责任',
    subtitle: 'ABC分类、平台使用、风险分级管控',
    indicatorCount: 21,
    color: 'amber',
    isExtension: true,
    modules: [
      { number: '（一）', title: '总体情况' },
      { number: '（二）', title: '企业ABC分类管理' },
      { number: '（三）', title: '平台使用情况分析' },
      { number: '（四）', title: '风险分级管控（四色管理）' },
      { number: '（五）', title: '企业自查自报与基础管理' },
    ],
  },
  {
    id: 'dimension-4',
    number: '四',
    title: '辖区安全形势',
    subtitle: '风险特征、热力趋势、工作计划',
    indicatorCount: 18,
    color: 'rose',
    isExtension: true,
    modules: [
      { number: '（一）', title: '整体形势' },
      { number: '（二）', title: '主要风险特征' },
      { number: '（三）', title: '片区风险热力与趋势' },
      { number: '（四）', title: '已开展工作' },
      { number: '（五）', title: '下一步工作措施' },
    ],
  },
  {
    id: 'dimension-5',
    number: '五',
    title: '其他',
    subtitle: '扩展指标与自定义监控',
    indicatorCount: 12,
    color: 'zinc',
    isExtension: true,
    modules: [
      { number: '（一）', title: '七维度治理效果' },
      { number: '（二）', title: '工作组列表' },
      { number: '（三）', title: '监管工作实绩概览' },
    ],
  },
]



// 2b. 累计指标模块（月度/年度双行展示）
// ─────────────────────────────────────────────

function CumulativeStats({
  expertId,
  orgGroup,
}: {
  expertId: ExpertFilter
  orgGroup: OrgGroupFilter
}) {
  // 月份切换状态
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const currentYear = new Date().getFullYear()

  // 生成月份选项（最近6个月）
  const monthOptions = useMemo(() => {
    const options = []
    for (let i = 0; i < 6; i++) {
      const month = new Date().getMonth() + 1 - i
      const year = month <= 0 ? currentYear - 1 : currentYear
      const actualMonth = month <= 0 ? month + 12 : month
      options.push({
        value: actualMonth,
        label: `${year}年${actualMonth}月`,
        year: year
      })
    }
    return options
  }, [currentYear])

  // 根据专家、组织架构和月份筛选计算比例
  const ratio = useMemo(() => {
    let expertRatio = 1
    if (expertId !== 'all') {
      const expert = stationChiefMock.expertTeam.find(e => e.id === expertId)
      const totalEnterprises = stationChiefMock.expertTeam.reduce((sum, e) => sum + (e.enterpriseCount || 0), 0)
      expertRatio = totalEnterprises > 0 ? (expert?.enterpriseCount || 0) / totalEnterprises : 0
    }

    let orgRatio = 1
    if (orgGroup === 'production') orgRatio = 0.6
    else if (orgGroup === 'venue') orgRatio = 0.4

    // 月份系数（模拟不同月份数据变化）
    const monthFactors: Record<number, number> = {
      1: 0.9, 2: 0.85, 3: 1.0, 4: 0.95, 5: 0.92, 6: 0.88,
      7: 0.85, 8: 0.9, 9: 0.95, 10: 0.98, 11: 1.0, 12: 0.92
    }
    const monthRatio = monthFactors[selectedMonth] || 1.0

    return expertRatio * orgRatio * monthRatio
  }, [expertId, orgGroup, selectedMonth])

  // 累计指标数据（模拟数据，实际应从后端获取）
  const statsData = useMemo(() => {
    // 基础数据（来自文档示例）
    const monthlyBase = {
      checkedEnterprises: 428,
      hazardsFound: 1664,
      majorHazards: 18,
      rectified: 13,
      deadlineRectified: 5,
      recheckRectified: 539,
      rectifyOrders: 241,
      enforcements: 2,
      penaltyAmount: 1.2,
    }

    const yearlyBase = {
      checkedEnterprises: 1447,
      hazardsFound: 4934,
      majorHazards: 18,
      rectified: 15,
      deadlineRectified: 0,
      recheckRectified: 2957,
      rectifyOrders: 774,
      enforcements: 6,
      penaltyAmount: 7.5,
    }

    // 应用筛选比例
    const applyRatio = (data: typeof monthlyBase) => ({
      checkedEnterprises: Math.round(data.checkedEnterprises * ratio),
      hazardsFound: Math.round(data.hazardsFound * ratio),
      majorHazards: Math.round(data.majorHazards * ratio),
      rectified: Math.round(data.rectified * ratio),
      deadlineRectified: Math.round(data.deadlineRectified * ratio),
      recheckRectified: Math.round(data.recheckRectified * ratio),
      rectifyOrders: Math.round(data.rectifyOrders * ratio),
      enforcements: Math.round(data.enforcements * ratio),
      penaltyAmount: Math.round(data.penaltyAmount * ratio * 10) / 10,
    })

    return {
      monthly: applyRatio(monthlyBase),
      yearly: applyRatio(yearlyBase),
    }
  }, [ratio])

  // 9个指标配置
  const indicators = [
    { key: 'checkedEnterprises', label: '检查企业数', unit: '家' },
    { key: 'hazardsFound', label: '发现隐患数', unit: '处' },
    { key: 'majorHazards', label: '重大隐患数', unit: '处', highlight: true },
    { key: 'rectified', label: '已整改数', unit: '处' },
    { key: 'deadlineRectified', label: '限期整改数', unit: '处' },
    { key: 'recheckRectified', label: '复查整改数', unit: '处' },
    { key: 'rectifyOrders', label: '整改指令书', unit: '份' },
    { key: 'enforcements', label: '立案处罚数', unit: '家', highlight: true },
    { key: 'penaltyAmount', label: '处罚金额', unit: '万元' },
  ]

  return (
    <SectionBlock
      title="（一）月度及年度累计情况"
      description="本月及本年度监管工作核心数据汇总"
      className="mb-6"
      extra={
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">月份：</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs border border-zinc-200 rounded px-2 py-1 bg-white text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {/* 表格形式：横向指标，纵向月度/年度 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500" style={{ width: '60px' }}>周期</th>
              {indicators.map((ind) => (
                <th
                  key={ind.key}
                  className={`text-center py-2 px-1 font-medium ${
                    ind.highlight ? 'text-red-600' : 'text-zinc-500'
                  }`}
                  style={{ width: '90px' }}
                >
                  {ind.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 月度行 */}
            <tr className="border-b border-zinc-100 bg-zinc-50/50">
              <td className="py-2.5 px-2 font-medium text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  本月
                </span>
              </td>
              {indicators.map((ind) => {
                const value = statsData.monthly[ind.key as keyof typeof statsData.monthly]
                return (
                  <td key={ind.key} className="py-2.5 px-1 text-center">
                    <span className={`font-bold ${ind.highlight ? 'text-red-600' : 'text-zinc-700'}`}>
                      {value.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 ml-0.5">{ind.unit}</span>
                  </td>
                )
              })}
            </tr>
            {/* 年度行 */}
            <tr className="bg-white">
              <td className="py-2.5 px-2 font-medium text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  本年
                </span>
              </td>
              {indicators.map((ind) => {
                const value = statsData.yearly[ind.key as keyof typeof statsData.yearly]
                return (
                  <td key={ind.key} className="py-2.5 px-1 text-center">
                    <span className={`font-medium ${ind.highlight ? 'text-red-500' : 'text-zinc-600'}`}>
                      {value.toLocaleString()}
                    </span>
                    <span className="text-zinc-400 ml-0.5">{ind.unit}</span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 1.5 监管工作实绩概览（4个分组卡片）
// ─────────────────────────────────────────────

interface PerformanceMetric {
  label: string
  value: string | number
  unit?: string
  highlight?: boolean
  trend?: 'up' | 'down' | 'stable'
}

interface PerformanceGroup {
  title: string
  icon: string
  metrics: PerformanceMetric[]
}

// 监管工作实绩数据
const supervisionPerformanceData: PerformanceGroup[] = [
  {
    title: '计划执行与检查实绩',
    icon: '📋',
    metrics: [
      { label: '累计检查企业', value: 156, unit: '家', highlight: true },
      { label: '重大/较大风险覆盖率', value: 92.5, unit: '%', trend: 'up' },
      { label: '月度抽查完成率', value: 78.3, unit: '%', trend: 'stable' },
    ]
  },
  {
    title: '隐患排查与重大隐患管控',
    icon: '⚠️',
    metrics: [
      { label: '发现隐患', value: 324, unit: '处', highlight: true },
      { label: '重大隐患', value: 12, unit: '处', highlight: true },
      { label: '较大隐患', value: 45, unit: '处' },
      { label: '一般隐患', value: 267, unit: '处' },
      { label: '整改闭环率', value: 85.2, unit: '%', trend: 'up' },
    ]
  },
  {
    title: '指导服务',
    icon: '🎯',
    metrics: [
      { label: '安全指导', value: 89, unit: '家次', highlight: true },
      { label: '上门帮扶', value: 34, unit: '家次' },
      { label: '会诊服务', value: 12, unit: '家次' },
      { label: '指导完善风险辨识', value: 67, unit: '家' },
      { label: '指导完善台账预案', value: 45, unit: '家' },
    ]
  },
  {
    title: '执法与三违查处',
    icon: '⚖️',
    metrics: [
      { label: '开具指令书', value: 23, unit: '份', highlight: true },
      { label: '复查次数', value: 45, unit: '次' },
      { label: '立案处罚', value: 8, unit: '家', highlight: true },
      { label: '查处三违', value: 15, unit: '起' },
    ]
  },
]

function SupervisionPerformanceOverview() {
  return (
    <SectionBlock
      title="监管工作实绩概览"
      description="本月监管工作核心指标汇总"
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {supervisionPerformanceData.map((group, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-zinc-200 p-4 hover:shadow-md transition-shadow"
          >
            {/* 分组标题 */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
              <span className="text-lg">{group.icon}</span>
              <h3 className="text-sm font-semibold text-zinc-800">{group.title}</h3>
            </div>

            {/* 指标列表 */}
            <div className="space-y-2">
              {group.metrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{metric.label}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${
                      metric.highlight ? 'text-indigo-600' : 'text-zinc-700'
                    }`}>
                      {typeof metric.value === 'number' && metric.unit === '%'
                        ? metric.value.toFixed(1)
                        : metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-[10px] text-zinc-400">{metric.unit}</span>
                    )}
                    {metric.trend && (
                      <span className={`text-[10px] ${
                        metric.trend === 'up' ? 'text-emerald-500' :
                        metric.trend === 'down' ? 'text-red-500' : 'text-zinc-400'
                      }`}>
                        {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 2. 核心风险指标卡片（可点击筛选）
// ─────────────────────────────────────────────

function RiskMetricsCards({
  selectedRiskLevel,
  onSelectRiskLevel,
  expertId,
  orgGroup,
}: {
  selectedRiskLevel: RiskLevelFilter
  onSelectRiskLevel: (level: RiskLevelFilter) => void
  expertId: ExpertFilter
  orgGroup: OrgGroupFilter
}) {
  // 根据专家筛选动态计算指标
  const metrics = useMemo(() => {
    // 基础数据（与企业状态路径保持一致：总企业数500家）
    // 风险等级分布：重大+较大+一般+低风险 = 主体总数
    const baseMetrics = {
      total: stationChiefMock.enterpriseStatusPath.total, // 500家
      major: 15,
      high: 48,
      medium: 142,
      low: 295, // 500 - 15 - 48 - 142 = 295
      checked: 286,
      hazards: 1247,
      majorHazards: 200, // 重大隐患数
      unrectified: 89,
    }

    // 获取专家信息
    const expert = expertId !== 'all' ? stationChiefMock.expertTeam.find(e => e.id === expertId) : null

    // 计算专家比例
    let expertRatio = 1
    if (expert) {
      const totalEnterprises = stationChiefMock.expertTeam.reduce((sum, e) => sum + (e.enterpriseCount || 0), 0)
      expertRatio = totalEnterprises > 0 ? (expert.enterpriseCount || 0) / totalEnterprises : 0
    }

    // 计算风险等级比例和隐患权重
    let riskRatio = 1
    let hazardWeight = 1
    let unrectifiedWeight = 1
    switch (selectedRiskLevel) {
      case 'major':
        riskRatio = baseMetrics.major / baseMetrics.total
        hazardWeight = 4
        unrectifiedWeight = 3
        break
      case 'high':
        riskRatio = baseMetrics.high / baseMetrics.total
        hazardWeight = 2.5
        unrectifiedWeight = 2
        break
      case 'medium':
        riskRatio = baseMetrics.medium / baseMetrics.total
        hazardWeight = 1.5
        unrectifiedWeight = 1.2
        break
      case 'low':
        riskRatio = baseMetrics.low / baseMetrics.total
        hazardWeight = 0.6
        unrectifiedWeight = 0.5
        break
      case 'all':
      default:
        riskRatio = 1
        hazardWeight = 1
        unrectifiedWeight = 1
    }

    // 计算组织架构比例
    // 生产企业组约占60%，场所安全组约占40%
    let orgRatio = 1
    switch (orgGroup) {
      case 'production':
        orgRatio = 0.6
        break
      case 'venue':
        orgRatio = 0.4
        break
      case 'all':
      default:
        orgRatio = 1
    }

    // 综合比例 = 专家比例 × 风险等级比例 × 组织架构比例
    const combinedRatio = expertRatio * riskRatio * orgRatio

    // 计算筛选后的指标值
    const filteredTotal = selectedRiskLevel === 'all' && expertId === 'all'
      ? baseMetrics.total
      : selectedRiskLevel === 'all'
        ? Math.round(baseMetrics.total * expertRatio)
        : Math.round(baseMetrics.total * combinedRatio)

    const getRiskCount = (level: keyof typeof baseMetrics, baseValue: number) => {
      if (selectedRiskLevel === 'all') {
        return Math.max(0, Math.round(baseValue * expertRatio))
      }
      return selectedRiskLevel === level ? Math.max(0, Math.round(baseValue * combinedRatio)) : 0
    }

    const filteredChecked = Math.max(0, Math.round(baseMetrics.checked * combinedRatio))
    const filteredHazards = Math.max(0, Math.round(baseMetrics.hazards * combinedRatio * hazardWeight))
    const filteredMajorHazards = Math.max(0, Math.round(baseMetrics.majorHazards * combinedRatio * hazardWeight * 1.2))
    const filteredUnrectified = Math.max(0, Math.round(baseMetrics.unrectified * combinedRatio * unrectifiedWeight))

    // P0核心指标计算（基于现有mock数据）
    // 任务闭环率：假设有任务数据，这里用模拟计算
    const closedTasks = Math.round(156 * combinedRatio)  // 已归档任务
    const totalTasks = Math.round(186 * combinedRatio)   // 总任务数
    const taskClosureRate = totalTasks > 0 ? Math.round((closedTasks / totalTasks) * 100) : 0

    // 隐患整改率：已整改 / 总隐患（总隐患 = 已整改 + 未整改）
    const closedHazards = filteredHazards - filteredUnrectified
    const totalHazardsTracked = filteredHazards
    const hazardRectifyRate = totalHazardsTracked > 0 ? Math.round((closedHazards / totalHazardsTracked) * 100) : 0

    // 企业覆盖率：已检查 / 总数
    const coverageRate = filteredTotal > 0 ? Math.round((filteredChecked / filteredTotal) * 100) : 0

    // 平均闭环天数：P0新增指标
    const avgClosureDays = Math.round(5.2 + Math.random() * 2)

    // 根据数值确定颜色（绿/黄/红）
    const getRateColor = (rate: number, warningThreshold = 85, dangerThreshold = 60) => {
      if (rate >= warningThreshold) return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
      if (rate >= dangerThreshold) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    }

    const taskClosureColors = getRateColor(taskClosureRate)
    const hazardRectifyColors = getRateColor(hazardRectifyRate)
    const coverageColors = getRateColor(coverageRate)

    return [
      // 第一组：风险等级分布（可点击筛选）
      { key: 'all', label: '主体总数', value: filteredTotal, unit: '家', color: 'text-zinc-700', bgColor: 'bg-zinc-50', borderColor: 'border-zinc-200', activeBg: 'bg-zinc-800', activeText: 'text-white', group: 'risk' },
      { key: 'major', label: '重大风险', value: getRiskCount('major', baseMetrics.major), unit: '家', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', activeBg: 'bg-red-600', activeText: 'text-white', group: 'risk' },
      { key: 'high', label: '较大风险', value: getRiskCount('high', baseMetrics.high), unit: '家', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', activeBg: 'bg-orange-500', activeText: 'text-white', group: 'risk' },
      { key: 'medium', label: '一般风险', value: getRiskCount('medium', baseMetrics.medium), unit: '家', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', activeBg: 'bg-amber-500', activeText: 'text-white', group: 'risk' },
      { key: 'low', label: '低风险', value: getRiskCount('low', baseMetrics.low), unit: '家', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', activeBg: 'bg-emerald-500', activeText: 'text-white', group: 'risk' },

      // 第二组：P0核心考核指标（百分比）
      { key: null, label: '任务闭环率', value: taskClosureRate, unit: '%', color: taskClosureColors.color, bgColor: taskClosureColors.bg, borderColor: taskClosureColors.border, clickable: false, isPercentage: true, target: 85, group: 'p0' },
      { key: null, label: '隐患整改率', value: hazardRectifyRate, unit: '%', color: hazardRectifyColors.color, bgColor: hazardRectifyColors.bg, borderColor: hazardRectifyColors.border, clickable: false, isPercentage: true, target: 85, group: 'p0' },
      { key: null, label: '企业覆盖率', value: coverageRate, unit: '%', color: coverageColors.color, bgColor: coverageColors.bg, borderColor: coverageColors.border, clickable: false, isPercentage: true, target: 80, group: 'p0' },
      { key: null, label: '平均闭环天数', value: avgClosureDays, unit: '天', color: avgClosureDays <= 5 ? 'text-emerald-600' : avgClosureDays <= 7 ? 'text-amber-600' : 'text-red-600', bgColor: avgClosureDays <= 5 ? 'bg-emerald-50' : avgClosureDays <= 7 ? 'bg-amber-50' : 'bg-red-50', borderColor: avgClosureDays <= 5 ? 'border-emerald-200' : avgClosureDays <= 7 ? 'border-amber-200' : 'border-red-200', clickable: false, isPercentage: false, target: 7, group: 'p0' },

    ]
  }, [expertId, selectedRiskLevel, orgGroup])

  // 分组展示：风险等级、P0核心指标
  const riskMetrics = metrics.filter(m => m.group === 'risk')
  const p0Metrics = metrics.filter(m => m.group === 'p0')

  return (
    <div className="space-y-4 mb-6">
      {/* 第一组：风险等级分布 - 5列网格 */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-800">风险等级分布</h3>
          <span className="text-xs text-zinc-400">点击卡片可筛选</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {riskMetrics.map((m, idx) => {
            const isClickable = m.clickable !== false && m.key !== null
            const isActive = isClickable && selectedRiskLevel === m.key

            return (
              <button
                key={`risk-${idx}`}
                onClick={() => isClickable && onSelectRiskLevel(m.key as RiskLevelFilter)}
                disabled={!isClickable}
                className={`
                  p-4 rounded-lg border text-left transition-all
                  ${isActive
                    ? `${m.activeBg} ${m.activeText} border-transparent shadow-sm`
                    : `${m.borderColor} ${m.bgColor} ${isClickable ? 'hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`
                  }
                `}
              >
                <div className={`text-xs mb-1.5 ${isActive ? 'text-white/80' : 'text-zinc-500'}`}>
                  {m.label}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${isActive ? 'text-white' : m.color}`}>
                    {m.value.toLocaleString()}
                  </span>
                  <span className={`text-xs ${isActive ? 'text-white/70' : 'text-zinc-400'}`}>
                    {m.unit}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 第二组：P0核心考核指标 - 4列网格 */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-800">核心考核指标</h3>
          <span className="text-xs text-zinc-400">带进度条展示</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {p0Metrics.map((m, idx) => (
            <div 
              key={`p0-${idx}`} 
              className={`p-4 rounded-lg border ${m.borderColor} ${m.bgColor} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">{m.label}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className={`text-xl font-bold ${m.color}`}>{m.value}</span>
                  <span className="text-xs text-zinc-400">{m.unit}</span>
                </div>
              </div>
              {/* 进度条 */}
              <div className="w-full bg-white/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (m.value as number) >= (m.target || 85) 
                      ? 'bg-emerald-500' 
                      : (m.value as number) >= ((m.target || 85) - 15) 
                        ? 'bg-amber-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, m.value as number))}%` }}
                />
              </div>
              {/* 目标线标识 */}
              <div className="relative w-full h-0 mt-1">
                <div
                  className="absolute top-[-3px] w-0.5 h-2 bg-zinc-400/50"
                  style={{ left: `${m.target || 85}%` }}
                  title={`目标: ${m.target || 85}%`}
                />
              </div>
              <div className="text-[10px] text-zinc-400 mt-1.5">
                目标值: {m.target || 85}{m.unit}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────
// 3. 七维度治理效果（支持专家筛选）
// ─────────────────────────────────────────────

function DimensionCard({ dim }: { dim: DimensionScore }) {
  const trendColor = dim.trend === 'up' ? 'text-emerald-600' : dim.trend === 'down' ? 'text-red-500' : 'text-zinc-400'
  const trendIcon  = dim.trend === 'up' ? '▲' : dim.trend === 'down' ? '▼' : '─'
  const scoreColor = dim.score >= 80 ? '#16a34a' : dim.score >= 60 ? '#4f46e5' : dim.score >= 30 ? '#d97706' : '#dc2626'

  const maxH = 28, w = 72
  const vals  = dim.history.map(h => h.score)
  const minV  = Math.min(...vals) - 5
  const maxV  = Math.max(...vals) + 5
  const pts   = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w
    const y = maxH - ((v - minV) / (maxV - minV)) * maxH
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const dangerCount  = dim.distribution[3].count
  const warningCount = dim.distribution[2].count

  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border bg-white border-zinc-200/80 hover:border-zinc-300 hover:shadow-sm transition-all">
      <span className="text-xs font-medium text-zinc-500">{dim.name}</span>

      <div className="flex items-end gap-1.5">
        <span className="text-2xl font-bold tabular-nums" style={{ color: scoreColor }}>{dim.score}</span>
        <span className="text-xs text-zinc-400 mb-0.5">分</span>
        <span className={`ml-auto text-xs font-semibold ${trendColor}`}>
          {trendIcon}{dim.trendDelta > 0 ? dim.trendDelta : ''}
        </span>
      </div>

      {/* 迷你折线 */}
      <svg width={w} height={maxH + 4} viewBox={`0 0 ${w} ${maxH + 4}`} className="overflow-visible">
        <polyline
          points={pts}
          fill="none"
          stroke={dim.trend === 'down' ? '#ef4444' : '#6366f1'}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function SevenDimensionsSection({
  expertId,
  riskLevel,
  orgGroup,
}: {
  expertId: ExpertFilter
  riskLevel: RiskLevelFilter
  orgGroup: OrgGroupFilter
}) {
  // 根据专家筛选和风险等级筛选返回对应数据
  const dimensions = useMemo(() => {
    let baseDimensions = stationChiefMock.governanceSevenDimensions

    // 专家筛选：选中具体专家时，基于专家绩效调整数据
    if (expertId !== 'all') {
      const expert = stationChiefMock.expertTeam.find(e => e.id === expertId)
      if (expert) {
        baseDimensions = expert.performanceDimensions.map((d) => ({
          name: d.name,
          score: d.score,
          prevScore: d.score - Math.floor(Math.random() * 10 - 5),
          trend: (Math.random() > 0.5 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
          trendDelta: Math.floor(Math.random() * 5),
          distribution: [
            { label: '优秀(≥80)', count: Math.floor(d.score * 3), color: '#16a34a' },
            { label: '良好(60-79)', count: Math.floor((100 - d.score) * 2), color: '#4f46e5' },
            { label: '关注(30-59)', count: Math.floor((100 - d.score) * 0.5), color: '#d97706' },
            { label: '危险(<30)', count: Math.floor((100 - d.score) * 0.2), color: '#dc2626' },
          ],
          bottomEnterprises: [],
          history: Array.from({ length: 6 }, (_, i) => ({
            month: `${i + 10}月`,
            score: Math.max(0, Math.min(100, d.score + Math.floor(Math.random() * 20 - 10))),
          })),
        })) as DimensionScore[]
      }
    }

    // 风险等级筛选：根据风险等级调整分值分布
    if (riskLevel !== 'all') {
      const riskMultipliers: Record<string, number> = {
        major: 0.7,   // 重大风险企业整体得分偏低
        high: 0.8,    // 较大风险
        medium: 0.9,  // 一般风险
        low: 1.05,    // 低风险企业得分偏高
      }
      const multiplier = riskMultipliers[riskLevel] || 1

      baseDimensions = baseDimensions.map(dim => {
        const adjustedScore = Math.min(100, Math.round(dim.score * multiplier))
        return {
          ...dim,
          score: adjustedScore,
          distribution: [
            { label: '优秀(≥80)', count: Math.floor(adjustedScore * 2.5), color: '#16a34a' },
            { label: '良好(60-79)', count: Math.floor((100 - adjustedScore) * 1.8), color: '#4f46e5' },
            { label: '关注(30-59)', count: Math.floor((100 - adjustedScore) * 0.8), color: '#d97706' },
            { label: '危险(<30)', count: Math.floor((100 - adjustedScore) * 0.4), color: '#dc2626' },
          ],
        }
      })
    }

    // 组织架构筛选：根据组类型调整分值
    if (orgGroup !== 'all') {
      const orgMultipliers: Record<string, number> = {
        production: 0.95,  // 生产企业组整体得分略低（风险较高）
        venue: 1.02,       // 场所安全组得分略高
      }
      const multiplier = orgMultipliers[orgGroup] || 1

      baseDimensions = baseDimensions.map(dim => {
        const adjustedScore = Math.min(100, Math.round(dim.score * multiplier))
        return {
          ...dim,
          score: adjustedScore,
          distribution: [
            { label: '优秀(≥80)', count: Math.floor(adjustedScore * 2.5), color: '#16a34a' },
            { label: '良好(60-79)', count: Math.floor((100 - adjustedScore) * 1.8), color: '#4f46e5' },
            { label: '关注(30-59)', count: Math.floor((100 - adjustedScore) * 0.8), color: '#d97706' },
            { label: '危险(<30)', count: Math.floor((100 - adjustedScore) * 0.4), color: '#dc2626' },
          ],
        }
      })
    }

    return baseDimensions
  }, [expertId, riskLevel, orgGroup])

  // 根据筛选条件动态生成描述
  const getDescription = () => {
    const parts: string[] = []
    if (expertId !== 'all') {
      const expert = stationChiefMock.expertTeam.find(e => e.id === expertId)
      if (expert) parts.push(`${expert.name}负责企业`)
    }
    if (riskLevel !== 'all') {
      const riskLabels: Record<string, string> = {
        major: '重大风险',
        high: '较大风险',
        medium: '一般风险',
        low: '低风险',
      }
      parts.push(riskLabels[riskLevel] || '')
    }
    if (orgGroup !== 'all') {
      const orgLabels: Record<string, string> = {
        production: '生产企业组',
        venue: '场所安全组',
      }
      parts.push(orgLabels[orgGroup] || '')
    }
    if (parts.length > 0) {
      return `${parts.join(' · ')} · 各维度均分 · 分值段分布`
    }
    return '辖区各维度当月均分 · 迷你趋势 · 分值段分布'
  }

  return (
    <SectionBlock title="七维度治理效果" description={getDescription()}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {dimensions.map((dim, idx) => (
          <DimensionCard key={idx} dim={dim as DimensionScore} />
        ))}
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 4. 企业状态路径 → 复用共享组件
// ─────────────────────────────────────────────
// 已提取至 src/components/shared/EnterpriseStatePath.tsx

// ─────────────────────────────────────────────
// 5. 工作组对比模块（左右布局：工作组列表 + 专家列表）
// ─────────────────────────────────────────────

// 专家7维度得分
interface ExpertDimensionScores {
  remoteEffectiveness: number  // 远程监管效能度 30%
  hazardClosure: number        // 隐患闭环治理度 15%
  selfCheckActivity: number    // 自查执行活跃度 15%
  riskAccuracy: number         // 风险识别精准度 10%
  onsiteResponse: number       // 现场服务响应度 10%
  enterpriseSatisfaction: number // 企业满意信任度 10%
  knowledgeContribution: number // 安全知识贡献度 10%
}

// 专家数据结构
interface WorkGroupExpert {
  id: string
  name: string
  avatar?: string
  role: 'leader' | 'deputy' | 'member'
  taskCount: number
  completedTasks: number
  completionRate: number
  avgProcessTime: number // 小时
  // 7维度得分
  dimensionScores: ExpertDimensionScores
  totalScore: number // 加权总分
  // 关键指标
  enterpriseCount: number    // 负责企业数
  hazardFound: number        // 发现隐患数
  hazardCreated: number      // 创建隐患单数
  todoCreated: number        // 创建待办数
  consultReplied: number     // 咨询回复数
  onsiteServiceCount: number // 现场服务次数
  overdueTasks: number
  // 扩展指标（PRD 2.2）
  reviewPassRate: number      // 一次验收通过率 %
  reworkRate: number          // 返工率 %
  avgResponseTime: number     // 平均响应时间（小时）
  avgClosureDays: number      // 平均闭环天数
}

// 辅助函数：计算加权总分
function calculateTotalScore(scores: ExpertDimensionScores): number {
  return Math.round(
    scores.remoteEffectiveness * 0.30 +
    scores.hazardClosure * 0.15 +
    scores.selfCheckActivity * 0.15 +
    scores.riskAccuracy * 0.10 +
    scores.onsiteResponse * 0.10 +
    scores.enterpriseSatisfaction * 0.10 +
    scores.knowledgeContribution * 0.10
  )
}

// 模拟各工作组的专家数据
const workGroupExpertsMap: Record<string, WorkGroupExpert[]> = {
  'wg-001': [
    { id: 'e-001', name: '陈伟', role: 'leader', taskCount: 45, completedTasks: 42, completionRate: 93.3, avgProcessTime: 2.5, dimensionScores: { remoteEffectiveness: 88, hazardClosure: 92, selfCheckActivity: 85, riskAccuracy: 90, onsiteResponse: 87, enterpriseSatisfaction: 91, knowledgeContribution: 86 }, totalScore: 88, enterpriseCount: 48, hazardFound: 18, hazardCreated: 15, todoCreated: 23, consultReplied: 31, onsiteServiceCount: 12, overdueTasks: 0, reviewPassRate: 85, reworkRate: 8, avgResponseTime: 2.2, avgClosureDays: 5.5 },
    { id: 'e-002', name: '张义', role: 'deputy', taskCount: 38, completedTasks: 35, completionRate: 92.1, avgProcessTime: 2.8, dimensionScores: { remoteEffectiveness: 85, hazardClosure: 88, selfCheckActivity: 82, riskAccuracy: 87, onsiteResponse: 84, enterpriseSatisfaction: 89, knowledgeContribution: 83 }, totalScore: 85, enterpriseCount: 42, hazardFound: 15, hazardCreated: 12, todoCreated: 19, consultReplied: 26, onsiteServiceCount: 10, overdueTasks: 1, reviewPassRate: 82, reworkRate: 12, avgResponseTime: 2.8, avgClosureDays: 6.2 },
    { id: 'e-003', name: '洪涛', role: 'member', taskCount: 32, completedTasks: 29, completionRate: 90.6, avgProcessTime: 3.2, dimensionScores: { remoteEffectiveness: 82, hazardClosure: 85, selfCheckActivity: 78, riskAccuracy: 84, onsiteResponse: 80, enterpriseSatisfaction: 85, knowledgeContribution: 79 }, totalScore: 82, enterpriseCount: 38, hazardFound: 12, hazardCreated: 10, todoCreated: 16, consultReplied: 22, onsiteServiceCount: 8, overdueTasks: 1, reviewPassRate: 78, reworkRate: 15, avgResponseTime: 3.5, avgClosureDays: 7.0 },
    { id: 'e-004', name: '段晓辉', role: 'member', taskCount: 28, completedTasks: 25, completionRate: 89.3, avgProcessTime: 3.5, dimensionScores: { remoteEffectiveness: 80, hazardClosure: 83, selfCheckActivity: 76, riskAccuracy: 82, onsiteResponse: 78, enterpriseSatisfaction: 83, knowledgeContribution: 77 }, totalScore: 80, enterpriseCount: 35, hazardFound: 14, hazardCreated: 11, todoCreated: 14, consultReplied: 19, onsiteServiceCount: 7, overdueTasks: 1, reviewPassRate: 75, reworkRate: 18, avgResponseTime: 4.2, avgClosureDays: 8.5 },
    { id: 'e-005', name: '吴灿刚', role: 'member', taskCount: 13, completedTasks: 11, completionRate: 84.6, avgProcessTime: 4.1, dimensionScores: { remoteEffectiveness: 75, hazardClosure: 78, selfCheckActivity: 72, riskAccuracy: 76, onsiteResponse: 73, enterpriseSatisfaction: 78, knowledgeContribution: 74 }, totalScore: 75, enterpriseCount: 28, hazardFound: 9, hazardCreated: 7, todoCreated: 8, consultReplied: 12, onsiteServiceCount: 5, overdueTasks: 0, reviewPassRate: 70, reworkRate: 22, avgResponseTime: 5.5, avgClosureDays: 10.0 },
  ],
  'wg-002': [
    { id: 'e-006', name: '陈超', role: 'leader', taskCount: 38, completedTasks: 32, completionRate: 84.2, avgProcessTime: 4.5, dimensionScores: { remoteEffectiveness: 78, hazardClosure: 82, selfCheckActivity: 75, riskAccuracy: 80, onsiteResponse: 76, enterpriseSatisfaction: 81, knowledgeContribution: 77 }, totalScore: 78, enterpriseCount: 45, hazardFound: 14, hazardCreated: 11, todoCreated: 18, consultReplied: 24, onsiteServiceCount: 9, overdueTasks: 3, reviewPassRate: 72, reworkRate: 20, avgResponseTime: 4.8, avgClosureDays: 9.0 },
    { id: 'e-007', name: '张义', role: 'deputy', taskCount: 35, completedTasks: 30, completionRate: 85.7, avgProcessTime: 4.2, dimensionScores: { remoteEffectiveness: 80, hazardClosure: 83, selfCheckActivity: 77, riskAccuracy: 81, onsiteResponse: 78, enterpriseSatisfaction: 82, knowledgeContribution: 79 }, totalScore: 80, enterpriseCount: 40, hazardFound: 12, hazardCreated: 10, todoCreated: 16, consultReplied: 21, onsiteServiceCount: 8, overdueTasks: 2, reviewPassRate: 75, reworkRate: 16, avgResponseTime: 4.2, avgClosureDays: 7.5 },
    { id: 'e-008', name: '郑富彬', role: 'member', taskCount: 30, completedTasks: 25, completionRate: 83.3, avgProcessTime: 4.8, dimensionScores: { remoteEffectiveness: 76, hazardClosure: 79, selfCheckActivity: 73, riskAccuracy: 77, onsiteResponse: 74, enterpriseSatisfaction: 79, knowledgeContribution: 75 }, totalScore: 76, enterpriseCount: 36, hazardFound: 13, hazardCreated: 10, todoCreated: 14, consultReplied: 19, onsiteServiceCount: 7, overdueTasks: 2, reviewPassRate: 73, reworkRate: 18, avgResponseTime: 5.2, avgClosureDays: 8.8 },
    { id: 'e-009', name: '吴灿刚', role: 'member', taskCount: 25, completedTasks: 21, completionRate: 84.0, avgProcessTime: 5.2, dimensionScores: { remoteEffectiveness: 77, hazardClosure: 80, selfCheckActivity: 74, riskAccuracy: 78, onsiteResponse: 75, enterpriseSatisfaction: 80, knowledgeContribution: 76 }, totalScore: 77, enterpriseCount: 32, hazardFound: 13, hazardCreated: 10, todoCreated: 12, consultReplied: 16, onsiteServiceCount: 6, overdueTasks: 1, reviewPassRate: 74, reworkRate: 14, avgResponseTime: 4.5, avgClosureDays: 7.8 },
  ],
  'wg-003': [
    { id: 'e-010', name: '杨宇天', role: 'leader', taskCount: 42, completedTasks: 40, completionRate: 95.2, avgProcessTime: 2.2, dimensionScores: { remoteEffectiveness: 92, hazardClosure: 95, selfCheckActivity: 90, riskAccuracy: 93, onsiteResponse: 91, enterpriseSatisfaction: 94, knowledgeContribution: 89 }, totalScore: 92, enterpriseCount: 52, hazardFound: 16, hazardCreated: 14, todoCreated: 21, consultReplied: 28, onsiteServiceCount: 11, overdueTasks: 0, reviewPassRate: 90, reworkRate: 5, avgResponseTime: 1.8, avgClosureDays: 4.2 },
    { id: 'e-011', name: '张义', role: 'deputy', taskCount: 38, completedTasks: 36, completionRate: 94.7, avgProcessTime: 2.4, dimensionScores: { remoteEffectiveness: 90, hazardClosure: 93, selfCheckActivity: 88, riskAccuracy: 91, onsiteResponse: 89, enterpriseSatisfaction: 92, knowledgeContribution: 87 }, totalScore: 90, enterpriseCount: 46, hazardFound: 14, hazardCreated: 12, todoCreated: 19, consultReplied: 25, onsiteServiceCount: 10, overdueTasks: 1, reviewPassRate: 88, reworkRate: 7, avgResponseTime: 2.0, avgClosureDays: 4.8 },
    { id: 'e-012', name: '张平水', role: 'member', taskCount: 35, completedTasks: 33, completionRate: 94.3, avgProcessTime: 2.6, dimensionScores: { remoteEffectiveness: 89, hazardClosure: 92, selfCheckActivity: 87, riskAccuracy: 90, onsiteResponse: 88, enterpriseSatisfaction: 91, knowledgeContribution: 86 }, totalScore: 89, enterpriseCount: 43, hazardFound: 15, hazardCreated: 13, todoCreated: 17, consultReplied: 23, onsiteServiceCount: 9, overdueTasks: 0, reviewPassRate: 87, reworkRate: 8, avgResponseTime: 2.2, avgClosureDays: 5.0 },
    { id: 'e-013', name: '吴灿刚', role: 'member', taskCount: 27, completedTasks: 23, completionRate: 85.2, avgProcessTime: 3.8, dimensionScores: { remoteEffectiveness: 79, hazardClosure: 82, selfCheckActivity: 76, riskAccuracy: 80, onsiteResponse: 77, enterpriseSatisfaction: 82, knowledgeContribution: 78 }, totalScore: 79, enterpriseCount: 34, hazardFound: 13, hazardCreated: 10, todoCreated: 13, consultReplied: 17, onsiteServiceCount: 6, overdueTasks: 1, reviewPassRate: 76, reworkRate: 16, avgResponseTime: 4.0, avgClosureDays: 8.0 },
  ],
  'wg-004': [
    { id: 'e-014', name: '施伟奇', role: 'leader', taskCount: 30, completedTasks: 25, completionRate: 83.3, avgProcessTime: 5.0, dimensionScores: { remoteEffectiveness: 74, hazardClosure: 78, selfCheckActivity: 72, riskAccuracy: 76, onsiteResponse: 73, enterpriseSatisfaction: 77, knowledgeContribution: 75 }, totalScore: 75, enterpriseCount: 38, hazardFound: 12, hazardCreated: 9, todoCreated: 14, consultReplied: 18, onsiteServiceCount: 7, overdueTasks: 2 },
    { id: 'e-015', name: '张义', role: 'deputy', taskCount: 28, completedTasks: 24, completionRate: 85.7, avgProcessTime: 4.8, dimensionScores: { remoteEffectiveness: 76, hazardClosure: 80, selfCheckActivity: 74, riskAccuracy: 78, onsiteResponse: 75, enterpriseSatisfaction: 79, knowledgeContribution: 77 }, totalScore: 77, enterpriseCount: 35, hazardFound: 11, hazardCreated: 9, todoCreated: 13, consultReplied: 17, onsiteServiceCount: 6, overdueTasks: 2 },
    { id: 'e-016', name: '刘浩鑫', role: 'member', taskCount: 25, completedTasks: 20, completionRate: 80.0, avgProcessTime: 5.5, dimensionScores: { remoteEffectiveness: 72, hazardClosure: 75, selfCheckActivity: 70, riskAccuracy: 73, onsiteResponse: 71, enterpriseSatisfaction: 76, knowledgeContribution: 72 }, totalScore: 73, enterpriseCount: 30, hazardFound: 12, hazardCreated: 9, todoCreated: 11, consultReplied: 15, onsiteServiceCount: 5, overdueTasks: 1 },
    { id: 'e-017', name: '吴灿刚', role: 'member', taskCount: 15, completedTasks: 13, completionRate: 86.7, avgProcessTime: 4.2, dimensionScores: { remoteEffectiveness: 78, hazardClosure: 81, selfCheckActivity: 75, riskAccuracy: 79, onsiteResponse: 76, enterpriseSatisfaction: 80, knowledgeContribution: 77 }, totalScore: 78, enterpriseCount: 26, hazardFound: 10, hazardCreated: 8, todoCreated: 9, consultReplied: 11, onsiteServiceCount: 4, overdueTasks: 1 },
  ],
  'wg-005': [
    { id: 'e-018', name: '金锋永', role: 'leader', taskCount: 40, completedTasks: 38, completionRate: 95.0, avgProcessTime: 2.8, dimensionScores: { remoteEffectiveness: 91, hazardClosure: 94, selfCheckActivity: 89, riskAccuracy: 92, onsiteResponse: 90, enterpriseSatisfaction: 93, knowledgeContribution: 88 }, totalScore: 91, enterpriseCount: 50, hazardFound: 15, hazardCreated: 13, todoCreated: 20, consultReplied: 27, onsiteServiceCount: 10, overdueTasks: 1, reviewPassRate: 89, reworkRate: 6, avgResponseTime: 2.0, avgClosureDays: 4.5 },
    { id: 'e-019', name: '张义', role: 'deputy', taskCount: 37, completedTasks: 35, completionRate: 94.6, avgProcessTime: 2.9, dimensionScores: { remoteEffectiveness: 89, hazardClosure: 92, selfCheckActivity: 87, riskAccuracy: 90, onsiteResponse: 88, enterpriseSatisfaction: 91, knowledgeContribution: 86 }, totalScore: 89, enterpriseCount: 44, hazardFound: 13, hazardCreated: 11, todoCreated: 18, consultReplied: 24, onsiteServiceCount: 9, overdueTasks: 1, reviewPassRate: 86, reworkRate: 9, avgResponseTime: 2.2, avgClosureDays: 5.0 },
    { id: 'e-020', name: '李磊', role: 'member', taskCount: 33, completedTasks: 30, completionRate: 90.9, avgProcessTime: 3.5, dimensionScores: { remoteEffectiveness: 84, hazardClosure: 87, selfCheckActivity: 82, riskAccuracy: 85, onsiteResponse: 83, enterpriseSatisfaction: 86, knowledgeContribution: 81 }, totalScore: 84, enterpriseCount: 40, hazardFound: 12, hazardCreated: 10, todoCreated: 15, consultReplied: 20, onsiteServiceCount: 8, overdueTasks: 1, reviewPassRate: 81, reworkRate: 12, avgResponseTime: 3.2, avgClosureDays: 6.5 },
    { id: 'e-021', name: '吴灿刚', role: 'member', taskCount: 25, completedTasks: 22, completionRate: 88.0, avgProcessTime: 4.0, dimensionScores: { remoteEffectiveness: 81, hazardClosure: 84, selfCheckActivity: 79, riskAccuracy: 82, onsiteResponse: 80, enterpriseSatisfaction: 83, knowledgeContribution: 78 }, totalScore: 81, enterpriseCount: 33, hazardFound: 8, hazardCreated: 7, todoCreated: 11, consultReplied: 14, onsiteServiceCount: 5, overdueTasks: 1, reviewPassRate: 79, reworkRate: 14, avgResponseTime: 3.8, avgClosureDays: 7.2 },
  ],
}

// 收集所有专家并排序
// 辅助函数
function getRiskLevelStyle(level: WorkGroup['riskLevel']) {
  switch (level) {
    case 'major': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', label: '重大' }
    case 'high': return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', label: '较大' }
    case 'general': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', label: '一般' }
    case 'safety': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: '安全' }
  }
}

function getRoleStyle(role: WorkGroupExpert['role']) {
  switch (role) {
    case 'leader': return { label: '组长', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }
    case 'deputy': return { label: '副组长', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
    case 'member': return { label: '组员', bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200' }
  }
}

// 工作组统计数据类型（用于排序）
interface GroupStatsItem {
  group: typeof workGroups[0]
  enterpriseCount: number
  // 核心监管指标（放最前面）
  totalInspections: number      // 检查数
  totalHazards: number          // 隐患数（自查+平台）
  totalMajorHazards: number     // 重大隐患数
  totalRectified: number        // 整改数
  totalEnforcements: number     // 执法数
  // 其他维度
  infoCollectionCount: number
  dataAuthorizedCount: number
  riskPointIdentifiedCount: number
  avgSafetyOrgDutyRate: number
  avgSafetySystemRate: number
  avgSafetyInvestRate: number
  monthlyPlanCount: number
  quarterlyPlanCount: number
  execYesCount: number
  execForcedCount: number
  thirdPartyYesCount: number
  patrolYesCount: number
  trainingDoneCount: number
  trainingWithRecordCount: number
  totalWorkPermits: number
  totalSelfHazards: number
  totalPlatformHazards: number
  majorRiskCount: number
  highRiskCount: number
  avgAiScore: number
}

// ─────────────────────────────────────────────
// 6. 工作组数据对比模块（通栏表格，聚合企业维度）
// ─────────────────────────────────────────────
function WorkGroupComparison({ enterprises }: { enterprises: Enterprise10D[] }) {
  // 显示模式：compact（精简）| full（全量）
  const [displayMode, setDisplayMode] = useState<'compact' | 'full'>('compact')

  // 按工作组聚合企业数据
  const groupStats = useMemo(() => {
    const stats = new Map<string, GroupStatsItem>()

    workGroups.forEach(group => {
      // 找到该工作组的所有企业
      const groupEnterprises = enterprises.filter(e => e.work_group === group.name)

      if (groupEnterprises.length === 0) {
        stats.set(group.id, {
          group,
          enterpriseCount: 0,
          totalInspections: 0,
          totalHazards: 0,
          totalMajorHazards: 0,
          totalRectified: 0,
          totalEnforcements: 0,
          infoCollectionCount: 0,
          dataAuthorizedCount: 0,
          riskPointIdentifiedCount: 0,
          avgSafetyOrgDutyRate: 0,
          avgSafetySystemRate: 0,
          avgSafetyInvestRate: 0,
          monthlyPlanCount: 0,
          quarterlyPlanCount: 0,
          execYesCount: 0,
          execForcedCount: 0,
          thirdPartyYesCount: 0,
          patrolYesCount: 0,
          trainingDoneCount: 0,
          trainingWithRecordCount: 0,
          totalWorkPermits: 0,
          totalSelfHazards: 0,
          totalPlatformHazards: 0,
          majorRiskCount: 0,
          highRiskCount: 0,
          avgAiScore: 0,
        })
        return
      }

      const count = groupEnterprises.length
      const infoCollectionCount = groupEnterprises.filter(e => e.info_collection).length
      const dataAuthorizedCount = groupEnterprises.filter(e => e.data_authorized).length
      const riskPointIdentifiedCount = groupEnterprises.filter(e => e.risk_point_identified).length
      
      // 安全制度3维度平均值
      const avgSafetyOrgDutyRate = groupEnterprises.reduce((sum, e) => sum + (e.safety_org_duty_rate || 0), 0) / count
      const avgSafetySystemRate = groupEnterprises.reduce((sum, e) => sum + (e.safety_system_rate || 0), 0) / count
      const avgSafetyInvestRate = groupEnterprises.reduce((sum, e) => sum + (e.safety_invest_rate || 0), 0) / count
      
      // 检查计划类型统计
      const monthlyPlanCount = groupEnterprises.filter(e => e.inspection_plan_type === 'monthly').length
      const quarterlyPlanCount = groupEnterprises.filter(e => e.inspection_plan_type === 'quarterly').length
      
      // 检查执行统计
      const execYesCount = groupEnterprises.filter(e => e.inspection_execution === 'yes').length
      const execForcedCount = groupEnterprises.filter(e => e.inspection_execution === 'forced').length
      
      // 第三方同步和巡查统计
      const thirdPartyYesCount = groupEnterprises.filter(e => e.third_party_sync === 'yes').length
      const patrolYesCount = groupEnterprises.filter(e => e.patrol_used === 'yes').length
      
      // 教育培训统计
      const trainingDoneCount = groupEnterprises.filter(e => e.training_done).length
      const trainingWithRecordCount = groupEnterprises.filter(e => e.training_done && e.training_has_record).length
      
      // 作业票和隐患统计
      const totalWorkPermits = groupEnterprises.reduce((sum, e) => sum + (e.work_permit_count || 0), 0)
      const totalSelfHazards = groupEnterprises.reduce((sum, e) => sum + (e.hazard_self_check || 0), 0)
      const totalPlatformHazards = groupEnterprises.reduce((sum, e) => sum + (e.hazard_platform || 0), 0)
      const totalMajorHazards = groupEnterprises.reduce((sum, e) => sum + (e.hazard_major || 0), 0)
      
      // 风险等级统计
      const majorRiskCount = groupEnterprises.filter(e => e.risk_level === '重大风险').length
      const highRiskCount = groupEnterprises.filter(e => e.risk_level === '较大风险').length
      const avgAiScore = groupEnterprises.reduce((sum, e) => sum + (e.ai_score || 0), 0) / count

      // 检查与执法统计
      const totalInspections = groupEnterprises.reduce((sum, e) => sum + (e.inspection_count || 0), 0)
      const totalHazards = totalSelfHazards + totalPlatformHazards  // 总隐患数
      const totalRectified = groupEnterprises.reduce((sum, e) => sum + (e.hazard_rectified || 0), 0)
      const totalEnforcements = groupEnterprises.reduce((sum, e) => sum + (e.enforcement_count || 0), 0)

      stats.set(group.id, {
        group,
        enterpriseCount: count,
        // 核心监管指标（放最前面）
        totalInspections,
        totalHazards,
        totalMajorHazards,
        totalRectified,
        totalEnforcements,
        // 其他维度
        infoCollectionCount,
        dataAuthorizedCount,
        riskPointIdentifiedCount,
        avgSafetyOrgDutyRate,
        avgSafetySystemRate,
        avgSafetyInvestRate,
        monthlyPlanCount,
        quarterlyPlanCount,
        execYesCount,
        execForcedCount,
        thirdPartyYesCount,
        patrolYesCount,
        trainingDoneCount,
        trainingWithRecordCount,
        totalWorkPermits,
        totalSelfHazards,
        totalPlatformHazards,
        majorRiskCount,
        highRiskCount,
        avgAiScore,
      })
    })

    return stats
  }, [enterprises])

  // 使用排序 hook
  const statsArray = useMemo(() => {
    return workGroups.map(group => ({
      ...groupStats.get(group.id)!,
      group
    })).filter(item => item.group) as (GroupStatsItem & { group: typeof workGroups[0] })[]
  }, [groupStats])

  const { sortedData, sort, handleSort } = useSortableTable(statsArray, {
    defaultSortKey: 'enterpriseCount',
    defaultDirection: 'desc'
  })

  // 辅助组件
  const NumCell = ({ value, danger = 0 }: { value: number; danger?: number }) => {
    const cls = danger && value >= danger ? 'text-red-600 font-medium' : 'text-zinc-700'
    return <span className={cls}>{value}</span>
  }

  const PercentCell = ({ value }: { value: number }) => {
    const cls = value >= 80 ? 'text-emerald-600' : value >= 60 ? 'text-amber-600' : 'text-red-600'
    return <span className={`text-xs ${cls}`}>{value.toFixed(0)}%</span>
  }

  return (
    <SectionBlock
      title="工作组列表"
      description="各工作组辖区企业维度聚合数据"
    >
      {/* 模式切换 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500">
          当前排序: {sort.key ? `${String(sort.key)} (${sort.direction === 'desc' ? '降序' : '升序'})` : '默认'}
        </span>
        <div className="flex items-center gap-1 rounded-lg overflow-hidden border border-zinc-200 text-xs">
          <button
            onClick={() => setDisplayMode('compact')}
            className={`px-3 py-1 font-medium transition-colors ${
              displayMode === 'compact' ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            }`}
          >精简模式</button>
          <button
            onClick={() => setDisplayMode('full')}
            className={`px-3 py-1 font-medium transition-colors ${
              displayMode === 'full' ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            }`}
          >全量模式</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-white sticky top-0 z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500" style={{ width: 32 }}>#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500" style={{ width: 100 }}>工作组</th>
              <SortableHeader label="企业数" sortKey="enterpriseCount" currentSort={sort} onSort={handleSort} width={44} />
              {/* 核心监管指标 */}
              <SortableHeader label="检查数" sortKey="totalInspections" currentSort={sort} onSort={handleSort} width={44} />
              <SortableHeader label="隐患数" sortKey="totalHazards" currentSort={sort} onSort={handleSort} width={44} />
              <SortableHeader label="重大隐患" sortKey="totalMajorHazards" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="整改数" sortKey="totalRectified" currentSort={sort} onSort={handleSort} width={44} />
              <SortableHeader label="执法数" sortKey="totalEnforcements" currentSort={sort} onSort={handleSort} width={44} />
              {/* 全量模式：其他维度 */}
              {displayMode === 'full' && (
                <>
                  <SortableHeader label="信息采集" sortKey="infoCollectionCount" currentSort={sort} onSort={handleSort} width={44} />
                  <SortableHeader label="数据授权" sortKey="dataAuthorizedCount" currentSort={sort} onSort={handleSort} width={44} />
                  <SortableHeader label="风险点" sortKey="riskPointIdentifiedCount" currentSort={sort} onSort={handleSort} width={44} />
                  <SortableHeader label="机构职责" sortKey="avgSafetyOrgDutyRate" currentSort={sort} onSort={handleSort} width={40} />
                  <SortableHeader label="安全制度" sortKey="avgSafetySystemRate" currentSort={sort} onSort={handleSort} width={40} />
                  <SortableHeader label="安全投入" sortKey="avgSafetyInvestRate" currentSort={sort} onSort={handleSort} width={40} />
                  <SortableHeader label="月计划" sortKey="monthlyPlanCount" currentSort={sort} onSort={handleSort} width={44} />
                  <SortableHeader label="季计划" sortKey="quarterlyPlanCount" currentSort={sort} onSort={handleSort} width={44} />
                  <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 44 }}>检查<br/>执行</th>
                  <SortableHeader label="三方同步" sortKey="thirdPartyYesCount" currentSort={sort} onSort={handleSort} width={44} />
                  <SortableHeader label="安全巡查" sortKey="patrolYesCount" currentSort={sort} onSort={handleSort} width={44} />
                  <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 48 }}>教育<br/>培训</th>
                  <SortableHeader label="作业票" sortKey="totalWorkPermits" currentSort={sort} onSort={handleSort} width={44} />
                  <SortableHeader label="AI均分" sortKey="avgAiScore" currentSort={sort} onSort={handleSort} width={40} />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((stat, index) => {
              const group = stat.group
              if (!stat) return null

              return (
                <tr key={group.id} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all">
                  <td className="py-2 px-2 text-zinc-400" style={{ width: 32 }}>{index + 1}</td>
                  <td className="py-2 px-2 font-medium text-zinc-800 truncate" title={group.name} style={{ width: 100 }}>
                    {group.name}
                  </td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                    <span className="text-zinc-700 font-medium">{stat.enterpriseCount}</span>
                  </td>
                  {/* 核心监管指标 */}
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                    <NumCell value={stat.totalInspections} />
                  </td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                    <NumCell value={stat.totalHazards} />
                  </td>
                  <td className="py-2 px-1 text-center" style={{ width: 48 }}>
                    <NumCell value={stat.totalMajorHazards} danger={1} />
                  </td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                    <NumCell value={stat.totalRectified} />
                  </td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                    <NumCell value={stat.totalEnforcements} danger={1} />
                  </td>
                  {/* 全量模式：其他维度 */}
                  {displayMode === 'full' && (
                    <>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-500">{stat.infoCollectionCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-500">{stat.dataAuthorizedCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-500">{stat.riskPointIdentifiedCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 40 }}>
                        <PercentCell value={stat.avgSafetyOrgDutyRate} />
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 40 }}>
                        <PercentCell value={stat.avgSafetySystemRate} />
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 40 }}>
                        <PercentCell value={stat.avgSafetyInvestRate} />
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-700">{stat.monthlyPlanCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-700">{stat.quarterlyPlanCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-[10px] text-zinc-500">{stat.execYesCount}+{stat.execForcedCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-700">{stat.thirdPartyYesCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <span className="text-xs text-zinc-700">{stat.patrolYesCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 48 }}>
                        <span className="text-[10px] text-zinc-500">{stat.trainingDoneCount}+{stat.trainingWithRecordCount}</span>
                      </td>
                      <td className="py-2 px-1 text-center" style={{ width: 44 }}>
                        <NumCell value={stat.totalWorkPermits} />
                      </td>
                      <td className="py-2 px-1 text-center font-medium" style={{ width: 40 }}>
                        <span className={stat.avgAiScore < 60 ? 'text-red-600' : stat.avgAiScore < 80 ? 'text-amber-600' : 'text-emerald-600'}>
                          {stat.avgAiScore.toFixed(0)}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>总计 {workGroups.length} 个工作组</span>
        <span>辖区企业 {enterprises.length} 家</span>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 6b. 专项检查表模块
// ─────────────────────────────────────────────

interface SpecialInspection {
  id: string
  name: string                    // 专项检查名称
  totalCount: number              // 覆盖企业数
  checkedCount: number            // 已检查企业数
  startDate: string               // 开始日期
  endDate: string                 // 结束日期
  hazardCount: number             // 隐患数
  majorHazardCount: number        // 重大隐患数
  rectifiedCount: number          // 已整改数
  deadlineCount: number           // 限期整改数
  topIssues: string[]             // 突出问题top3
  focusGroups: string[]           // 重点盯防分组top3
}

// 专项检查模拟数据
const specialInspections: SpecialInspection[] = [
  {
    id: 'si-001',
    name: '危化使用企业专项检查',
    totalCount: 112,
    checkedCount: 57,
    startDate: '2026-03-01',
    endDate: '2026-05-01',
    hazardCount: 86,
    majorHazardCount: 12,
    rectifiedCount: 54,
    deadlineCount: 8,
    topIssues: ['储存不规范', '现场管理混乱', '应急器材不足'],
    focusGroups: ['勾庄小微园区', '物流片区', '良渚工业园区'],
  },
  {
    id: 'si-002',
    name: '消防重点单位专项检查',
    totalCount: 85,
    checkedCount: 72,
    startDate: '2026-03-15',
    endDate: '2026-04-15',
    hazardCount: 124,
    majorHazardCount: 8,
    rectifiedCount: 98,
    deadlineCount: 5,
    topIssues: ['消防通道堵塞', '灭火器过期', '疏散标识缺失'],
    focusGroups: ['物流片区', '勾庄片重大', '良渚片较大'],
  },
  {
    id: 'si-003',
    name: '粉尘涉爆企业专项检查',
    totalCount: 38,
    checkedCount: 25,
    startDate: '2026-04-01',
    endDate: '2026-06-01',
    hazardCount: 42,
    majorHazardCount: 5,
    rectifiedCount: 18,
    deadlineCount: 12,
    topIssues: ['除尘系统不规范', '防爆电气缺失', '积尘清理不及时'],
    focusGroups: ['良渚片重大', '勾庄片较大', '物流片区'],
  },
  {
    id: 'si-004',
    name: '有限空间作业专项检查',
    totalCount: 56,
    checkedCount: 48,
    startDate: '2026-02-15',
    endDate: '2026-04-15',
    hazardCount: 67,
    majorHazardCount: 3,
    rectifiedCount: 62,
    deadlineCount: 2,
    topIssues: ['警示标识缺失', '通风设备故障', '应急救援器材不足'],
    focusGroups: ['勾庄片重大', '良渚片较大', '物流片区'],
  },
]

function SpecialInspectionTable() {
  // 计算覆盖率
  const getCoverageRate = (item: SpecialInspection) => {
    if (item.totalCount === 0) return 0
    return Math.round((item.checkedCount / item.totalCount) * 100 * 10) / 10
  }

  // 计算时间进度
  const getTimeProgress = (item: SpecialInspection) => {
    const start = new Date(item.startDate).getTime()
    const end = new Date(item.endDate).getTime()
    const now = Date.now()
    if (now < start) return 0
    if (now > end) return 100
    return Math.round(((now - start) / (end - start)) * 100 * 10) / 10
  }

  // 判断是否逾期
  const isOverdue = (item: SpecialInspection) => {
    return Date.now() > new Date(item.endDate).getTime()
  }

  return (
    <SectionBlock
      title="（五）专项检查进度"
      description="当前进行中的专项检查任务完成情况"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 32 }}>#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ minWidth: 120 }}>专项检查名称</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 90 }}>开始日期</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 90 }}>结束日期</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>覆盖企业</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>已检查</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>覆盖率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>隐患数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>重大隐患</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>已整改</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>限期整改</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ minWidth: 160 }}>突出问题</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ minWidth: 140 }}>重点盯防</th>
            </tr>
          </thead>
          <tbody>
            {specialInspections.map((item, index) => {
              const coverageRate = getCoverageRate(item)
              const timeProgress = getTimeProgress(item)
              const overdue = isOverdue(item)
              const timeWarning = !overdue && coverageRate < timeProgress - 10 // 进度滞后预警

              return (
                <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all">
                  <td className="py-2.5 px-2 text-zinc-400">{index + 1}</td>
                  <td className="py-2.5 px-2">
                    <span className="font-medium text-zinc-800">{item.name}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-zinc-700">{item.startDate}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="text-zinc-700">{item.endDate}</span>
                    {overdue && <span className="text-[10px] text-red-500 ml-1">已逾期</span>}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-medium text-zinc-700">{item.totalCount}</span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">家</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-medium text-zinc-700">{item.checkedCount}</span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">家</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-medium ${timeWarning ? 'text-amber-600' : coverageRate >= 80 ? 'text-emerald-600' : 'text-zinc-700'}`}>
                        {coverageRate}%
                      </span>
                      {timeWarning && (
                        <span className="text-[10px] text-amber-500">进度滞后</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-medium text-zinc-700">{item.hazardCount}</span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`font-medium ${item.majorHazardCount > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                      {item.majorHazardCount}
                    </span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-medium text-emerald-600">{item.rectifiedCount}</span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`font-medium ${item.deadlineCount > 5 ? 'text-amber-600' : 'text-zinc-700'}`}>
                      {item.deadlineCount}
                    </span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {item.topIssues.slice(0, 3).map((issue, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] border border-red-100">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {item.focusGroups.slice(0, 3).map((group, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] border border-amber-100">
                          {group}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>共 {specialInspections.length} 项专项检查</span>
        <span>覆盖企业 {specialInspections.reduce((sum, i) => sum + i.totalCount, 0)} 家</span>
        <span>已检查 {specialInspections.reduce((sum, i) => sum + i.checkedCount, 0)} 家</span>
        <span>发现隐患 {specialInspections.reduce((sum, i) => sum + i.hazardCount, 0)} 处</span>
        <span className="text-red-600">重大隐患 {specialInspections.reduce((sum, i) => sum + i.majorHazardCount, 0)} 处</span>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 6c. 行业隐患分析表模块
// ─────────────────────────────────────────────

interface IndustryHazardAnalysis {
  id: string
  industry: string              // 行业名称
  hazardCount: number           // 隐患数
  majorHazardCount: number      // 重大隐患数
  rectifiedCount: number        // 已整改数
  deadlineCount: number         // 限期整改数
  topIssues: string[]           // 高频问题top3
  reboundEnterprises: string[]  // 隐患反弹企业top3
}

// 行业隐患分析模拟数据
const industryHazardAnalysis: IndustryHazardAnalysis[] = [
  {
    id: 'ind-001',
    industry: '工业企业',
    hazardCount: 245,
    majorHazardCount: 18,
    rectifiedCount: 198,
    deadlineCount: 12,
    topIssues: ['机械防护缺失', '电气线路老化', '安全标识不足'],
    reboundEnterprises: ['杭州鑫盛化工有限公司', '浙江华达机械制造厂', '余杭宏达建材厂'],
  },
  {
    id: 'ind-002',
    industry: '仓储物流',
    hazardCount: 178,
    majorHazardCount: 12,
    rectifiedCount: 145,
    deadlineCount: 8,
    topIssues: ['消防通道堵塞', '货物堆放超高', '叉车作业违规'],
    reboundEnterprises: ['良渚物流仓储中心', '勾庄货运站', '瓶窑快递分拣中心'],
  },
  {
    id: 'ind-003',
    industry: '小微企业',
    hazardCount: 156,
    majorHazardCount: 8,
    rectifiedCount: 118,
    deadlineCount: 15,
    topIssues: ['灭火器配置不足', '疏散通道不畅', '员工培训缺失'],
    reboundEnterprises: ['余杭小商品加工作坊', '良渚五金加工店', '勾庄服装加工厂'],
  },
  {
    id: 'ind-004',
    industry: '危化使用',
    hazardCount: 89,
    majorHazardCount: 15,
    rectifiedCount: 67,
    deadlineCount: 5,
    topIssues: ['储存不规范', '应急器材不足', '警示标识缺失'],
    reboundEnterprises: ['杭州化工原料公司', '浙江新材料科技', '余杭电镀厂'],
  },
  {
    id: 'ind-005',
    industry: '九小场所',
    hazardCount: 134,
    majorHazardCount: 6,
    rectifiedCount: 102,
    deadlineCount: 11,
    topIssues: ['电线私拉乱接', '安全出口锁闭', '消防器材过期'],
    reboundEnterprises: ['良渚小餐馆', '勾庄理发店', '瓶窑小旅馆'],
  },
  {
    id: 'ind-006',
    industry: '出租房',
    hazardCount: 112,
    majorHazardCount: 9,
    rectifiedCount: 85,
    deadlineCount: 7,
    topIssues: ['电动车违规充电', '疏散通道堵塞', '私拉电线'],
    reboundEnterprises: ['良渚群租房A栋', '勾庄公寓楼', '瓶窑农民房'],
  },
  {
    id: 'ind-007',
    industry: '沿街店铺',
    hazardCount: 98,
    majorHazardCount: 4,
    rectifiedCount: 76,
    deadlineCount: 9,
    topIssues: ['货物占用通道', '电气线路混乱', '住人现象'],
    reboundEnterprises: ['良渚商业街3号', '勾庄市场摊位', '瓶窑临街商铺'],
  },
]

function IndustryHazardTable() {
  return (
    <SectionBlock
      title="（三）行业隐患分析"
      description="分行业隐患结构分析，识别隐患高发行业与高频问题"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 32 }}>#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ minWidth: 100 }}>行业</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>隐患数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>重大隐患</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>已整改</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>限期整改</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ minWidth: 180 }}>高频问题 Top3</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ minWidth: 200 }}>隐患反弹企业 Top3</th>
            </tr>
          </thead>
          <tbody>
            {industryHazardAnalysis.map((item, index) => {
              return (
                <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all">
                  <td className="py-2.5 px-2 text-zinc-400">{index + 1}</td>
                  <td className="py-2.5 px-2">
                    <span className="font-medium text-zinc-800">{item.industry}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`font-medium ${item.hazardCount > 150 ? 'text-red-600' : item.hazardCount > 100 ? 'text-amber-600' : 'text-zinc-700'}`}>
                      {item.hazardCount}
                    </span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`font-medium ${item.majorHazardCount > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                      {item.majorHazardCount}
                    </span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="font-medium text-emerald-600">{item.rectifiedCount}</span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`font-medium ${item.deadlineCount > 10 ? 'text-amber-600' : 'text-zinc-700'}`}>
                      {item.deadlineCount}
                    </span>
                    <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {item.topIssues.map((issue, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] border border-orange-100">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {item.reboundEnterprises.map((enterprise, i) => (
                        <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] border border-red-100">
                          {enterprise}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>共 {industryHazardAnalysis.length} 个行业分类</span>
        <span>总隐患 {industryHazardAnalysis.reduce((sum, i) => sum + i.hazardCount, 0)} 处</span>
        <span className="text-red-600">重大隐患 {industryHazardAnalysis.reduce((sum, i) => sum + i.majorHazardCount, 0)} 处</span>
        <span className="text-emerald-600">已整改 {industryHazardAnalysis.reduce((sum, i) => sum + i.rectifiedCount, 0)} 处</span>
        <span className="text-amber-600">限期整改 {industryHazardAnalysis.reduce((sum, i) => sum + i.deadlineCount, 0)} 处</span>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 6d. 组履职情况表模块
// ─────────────────────────────────────────────

interface GroupPerformance {
  groupName: string
  // 计划执行与检查实绩
  inspectedEnterprises: number
  majorHighRiskCoverage: number
  monthlyInspectionRate: number
  // 隐患排查与重大隐患管控
  hazardCount: number
  majorHazard: number
  highHazard: number
  normalHazard: number
  rectifyRate: number
  // 指导服务
  safetyGuidance: number
  onsiteHelp: number
  diagnosis: number
  riskIdentify: number
  ledgerPlan: number
  // 执法与三违查处
  instructionBook: number
  reviewCount: number
  penaltyCount: number
  threeViolations: number
}

const groupPerformanceData: GroupPerformance[] = [
  {
    groupName: '企业安全组',
    inspectedEnterprises: 89,
    majorHighRiskCoverage: 95.2,
    monthlyInspectionRate: 82.5,
    hazardCount: 186,
    majorHazard: 15,
    highHazard: 38,
    normalHazard: 133,
    rectifyRate: 88.7,
    safetyGuidance: 56,
    onsiteHelp: 23,
    diagnosis: 8,
    riskIdentify: 42,
    ledgerPlan: 35,
    instructionBook: 15,
    reviewCount: 28,
    penaltyCount: 5,
    threeViolations: 9,
  },
  {
    groupName: '消防安全组',
    inspectedEnterprises: 67,
    majorHighRiskCoverage: 91.8,
    monthlyInspectionRate: 76.3,
    hazardCount: 142,
    majorHazard: 8,
    highHazard: 25,
    normalHazard: 109,
    rectifyRate: 82.4,
    safetyGuidance: 33,
    onsiteHelp: 11,
    diagnosis: 4,
    riskIdentify: 25,
    ledgerPlan: 10,
    instructionBook: 8,
    reviewCount: 17,
    penaltyCount: 3,
    threeViolations: 6,
  },
]

function GroupPerformanceTable() {
  return (
    <SectionBlock
      title="（一）（二）组履职情况表"
      description="企业安全组、消防安全组履职情况对比分析"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 100 }}>组名</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>检查企业</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>覆盖率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>抽查率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>隐患数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>重大</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>较大</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>一般</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>闭环率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>指导</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>帮扶</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>会诊</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>指令书</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>复查</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>立案</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>三违</th>
            </tr>
          </thead>
          <tbody>
            {groupPerformanceData.map((group, index) => (
              <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all">
                <td className="py-2.5 px-2">
                  <span className="font-medium text-zinc-800">{group.groupName}</span>
                </td>
                {/* 计划执行与检查实绩 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.inspectedEnterprises}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">家</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${group.majorHighRiskCoverage >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {group.majorHighRiskCoverage}%
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${group.monthlyInspectionRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {group.monthlyInspectionRate}%
                  </span>
                </td>
                {/* 隐患排查与重大隐患管控 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.hazardCount}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${group.majorHazard > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                    {group.majorHazard}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-amber-600">{group.highHazard}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.normalHazard}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${group.rectifyRate >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {group.rectifyRate}%
                  </span>
                </td>
                {/* 指导服务 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.safetyGuidance}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.onsiteHelp}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.diagnosis}</span>
                </td>
                {/* 执法与三违查处 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.instructionBook}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.reviewCount}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${group.penaltyCount > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                    {group.penaltyCount}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{group.threeViolations}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分组说明 */}
      <div className="mt-3 pt-3 border-t border-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="inline-block w-2 h-2 mt-1 rounded-full bg-blue-500"></span>
            <div>
              <div className="font-medium text-zinc-700">计划执行与检查实绩</div>
              <div className="text-zinc-500 mt-0.5">检查企业数、覆盖率、抽查率</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-2 h-2 mt-1 rounded-full bg-red-500"></span>
            <div>
              <div className="font-medium text-zinc-700">隐患排查与管控</div>
              <div className="text-zinc-500 mt-0.5">隐患数、分级统计、闭环率</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-2 h-2 mt-1 rounded-full bg-emerald-500"></span>
            <div>
              <div className="font-medium text-zinc-700">指导服务</div>
              <div className="text-zinc-500 mt-0.5">安全指导、帮扶、会诊服务</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="inline-block w-2 h-2 mt-1 rounded-full bg-amber-500"></span>
            <div>
              <div className="font-medium text-zinc-700">执法与三违查处</div>
              <div className="text-zinc-500 mt-0.5">指令书、复查、立案、三违</div>
            </div>
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 6e. 安全专家履职表模块
// ─────────────────────────────────────────────

interface ExpertPerformance {
  expertId: string
  expertName: string
  workGroup: string
  // 深度检查
  deepInspectionCount: number
  majorHazardFound: number
  keyIssueFound: number
  hazardDiscoveryRate: number
  // 专家服务
  diagnosis: number
  techGuidance: number
  safetyDiagnosis: number
  professionalOpinions: number
  // 隐患复核
  hazardReview: number
  hazardAcceptance: number
  hazardClose: number
  // 履职评定
  monthlyTarget: number  // 月度目标（重大隐患+重点问题）
  performance: 'excellent' | 'qualified' | 'unqualified'
}

const expertPerformanceData: ExpertPerformance[] = [
  {
    expertId: 'ep-001',
    expertName: '今卓',
    workGroup: '物流片安全组',
    deepInspectionCount: 23,
    majorHazardFound: 8,
    keyIssueFound: 15,
    hazardDiscoveryRate: 92.5,
    diagnosis: 12,
    techGuidance: 18,
    safetyDiagnosis: 6,
    professionalOpinions: 8,
    hazardReview: 15,
    hazardAcceptance: 12,
    hazardClose: 10,
    monthlyTarget: 23,
    performance: 'excellent',
  },
  {
    expertId: 'ep-002',
    expertName: '李雷',
    workGroup: '良渚片重大',
    deepInspectionCount: 18,
    majorHazardFound: 5,
    keyIssueFound: 8,
    hazardDiscoveryRate: 85.3,
    diagnosis: 8,
    techGuidance: 12,
    safetyDiagnosis: 4,
    professionalOpinions: 5,
    hazardReview: 10,
    hazardAcceptance: 8,
    hazardClose: 7,
    monthlyTarget: 13,
    performance: 'qualified',
  },
  {
    expertId: 'ep-003',
    expertName: '韩梅梅',
    workGroup: '良渚片较大',
    deepInspectionCount: 25,
    majorHazardFound: 6,
    keyIssueFound: 12,
    hazardDiscoveryRate: 88.7,
    diagnosis: 10,
    techGuidance: 15,
    safetyDiagnosis: 5,
    professionalOpinions: 7,
    hazardReview: 12,
    hazardAcceptance: 10,
    hazardClose: 9,
    monthlyTarget: 18,
    performance: 'excellent',
  },
  {
    expertId: 'ep-004',
    expertName: '张峰',
    workGroup: '勾庄片重大',
    deepInspectionCount: 15,
    majorHazardFound: 3,
    keyIssueFound: 5,
    hazardDiscoveryRate: 78.2,
    diagnosis: 5,
    techGuidance: 8,
    safetyDiagnosis: 3,
    professionalOpinions: 4,
    hazardReview: 8,
    hazardAcceptance: 6,
    hazardClose: 5,
    monthlyTarget: 8,
    performance: 'qualified',
  },
  {
    expertId: 'ep-005',
    expertName: '陈晨',
    workGroup: '勾庄片较大',
    deepInspectionCount: 20,
    majorHazardFound: 4,
    keyIssueFound: 9,
    hazardDiscoveryRate: 82.5,
    diagnosis: 7,
    techGuidance: 11,
    safetyDiagnosis: 4,
    professionalOpinions: 6,
    hazardReview: 9,
    hazardAcceptance: 7,
    hazardClose: 6,
    monthlyTarget: 13,
    performance: 'qualified',
  },
]

function ExpertPerformanceTable() {
  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium border border-emerald-100">优秀</span>
      case 'qualified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">合格</span>
      case 'unqualified':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium border border-red-100">不合格</span>
      default:
        return null
    }
  }

  return (
    <SectionBlock
      title="（四）安全专家履职情况表"
      description="专家履职情况统计，按每月重大隐患+重点问题不少于4条标准评定"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 32 }}>#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 80 }}>专家</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 100 }}>工作组</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>深度检查</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>重大隐患</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>重点问题</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>发现率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>会诊</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>指导</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>诊断</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>专业意见</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>复核</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>验收</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>销号</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 64 }}>月度目标</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 whitespace-nowrap" style={{ width: 56 }}>履职评定</th>
            </tr>
          </thead>
          <tbody>
            {expertPerformanceData.map((expert, index) => (
              <tr key={expert.expertId} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all">
                <td className="py-2.5 px-2 text-zinc-400">{index + 1}</td>
                <td className="py-2.5 px-2">
                  <span className="font-medium text-zinc-800">{expert.expertName}</span>
                </td>
                <td className="py-2.5 px-2">
                  <span className="text-zinc-600">{expert.workGroup}</span>
                </td>
                {/* 深度检查 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.deepInspectionCount}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">家</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${expert.majorHazardFound > 5 ? 'text-red-600' : 'text-zinc-700'}`}>
                    {expert.majorHazardFound}
                  </span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-amber-600">{expert.keyIssueFound}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">处</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${expert.hazardDiscoveryRate >= 90 ? 'text-emerald-600' : expert.hazardDiscoveryRate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                    {expert.hazardDiscoveryRate}%
                  </span>
                </td>
                {/* 专家服务 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.diagnosis}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.techGuidance}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.safetyDiagnosis}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.professionalOpinions}</span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">份</span>
                </td>
                {/* 隐患复核 */}
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.hazardReview}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-zinc-700">{expert.hazardAcceptance}</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className="font-medium text-emerald-600">{expert.hazardClose}</span>
                </td>
                {/* 履职评定 */}
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-medium ${expert.monthlyTarget >= 20 ? 'text-emerald-600' : expert.monthlyTarget >= 4 ? 'text-blue-600' : 'text-red-600'}`}>
                    {expert.monthlyTarget}
                  </span>
                  <span className="text-zinc-400 text-[10px] ml-0.5">条</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  {getPerformanceBadge(expert.performance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>共 {expertPerformanceData.length} 名专家</span>
        <span>深度检查 {expertPerformanceData.reduce((sum, e) => sum + e.deepInspectionCount, 0)} 家</span>
        <span className="text-red-600">重大隐患 {expertPerformanceData.reduce((sum, e) => sum + e.majorHazardFound, 0)} 处</span>
        <span className="text-amber-600">重点问题 {expertPerformanceData.reduce((sum, e) => sum + e.keyIssueFound, 0)} 处</span>
        <span className="text-emerald-600">优秀 {expertPerformanceData.filter(e => e.performance === 'excellent').length} 人</span>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// M1.8 事故倒查追溯表
// ─────────────────────────────────────────────

interface AccidentReview {
  id: string
  enterpriseName: string
  enterpriseType: string
  accidentType: string
  accidentDate: string
  inspectionCount: number
  lastInspectionDate: string
  inspector: string
  hazardPointsFound: number
  hazardPointsMissed: number
  reviewStatus: 'completed' | 'in_progress' | 'pending'
  similarCheckStatus: 'completed' | 'in_progress' | 'pending'
  reviewDate?: string
  similarCheckDate?: string
}

const accidentReviewData: AccidentReview[] = [
  {
    id: '1',
    enterpriseName: '杭州良渚木业加工厂',
    enterpriseType: '生产企业',
    accidentType: '火灾',
    accidentDate: '2026-03-15',
    inspectionCount: 3,
    lastInspectionDate: '2026-02-20',
    inspector: '李雷',
    hazardPointsFound: 12,
    hazardPointsMissed: 5,
    reviewStatus: 'completed',
    similarCheckStatus: 'completed',
    reviewDate: '2026-03-18',
    similarCheckDate: '2026-03-25',
  },
  {
    id: '2',
    enterpriseName: '良渚街道仓储物流中心',
    enterpriseType: '仓储物流',
    accidentType: '货物坍塌',
    accidentDate: '2026-03-08',
    inspectionCount: 2,
    lastInspectionDate: '2025-12-15',
    inspector: '今卓',
    hazardPointsFound: 8,
    hazardPointsMissed: 7,
    reviewStatus: 'completed',
    similarCheckStatus: 'in_progress',
    reviewDate: '2026-03-12',
  },
  {
    id: '3',
    enterpriseName: '勾庄化工原料公司',
    enterpriseType: '危化使用',
    accidentType: '泄漏',
    accidentDate: '2026-02-28',
    inspectionCount: 4,
    lastInspectionDate: '2026-01-10',
    inspector: '张峰',
    hazardPointsFound: 15,
    hazardPointsMissed: 3,
    reviewStatus: 'in_progress',
    similarCheckStatus: 'pending',
  },
  {
    id: '4',
    enterpriseName: '良渚机械制造有限公司',
    enterpriseType: '生产企业',
    accidentType: '机械伤害',
    accidentDate: '2026-02-15',
    inspectionCount: 1,
    lastInspectionDate: '2025-11-20',
    inspector: '韩梅梅',
    hazardPointsFound: 6,
    hazardPointsMissed: 9,
    reviewStatus: 'completed',
    similarCheckStatus: 'completed',
    reviewDate: '2026-02-20',
    similarCheckDate: '2026-02-28',
  },
]

function AccidentReviewTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium border border-emerald-100">已完成</span>
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-medium border border-blue-100">进行中</span>
      case 'pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 text-[10px] font-medium border border-zinc-200">未开始</span>
      default:
        return null
    }
  }

  const getAccidentTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      '火灾': 'bg-red-50 text-red-600 border-red-100',
      '泄漏': 'bg-orange-50 text-orange-600 border-orange-100',
      '爆炸': 'bg-red-50 text-red-600 border-red-100',
      '机械伤害': 'bg-amber-50 text-amber-600 border-amber-100',
      '中毒': 'bg-purple-50 text-purple-600 border-purple-100',
      '货物坍塌': 'bg-yellow-50 text-yellow-700 border-yellow-100',
    }
    return styles[type] || 'bg-zinc-50 text-zinc-600 border-zinc-200'
  }

  return (
    <SectionBlock
      title="（五）事故倒查追溯表"
      description="对发生事故企业追溯近一年检查情况、隐患点位覆盖情况，开展复盘并组织同类企业专项排查"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-8">#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 min-w-[140px]">企业名称</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">企业类型</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">事故类型</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">事故日期</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20" title="近一年检查次数">检查次数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">最近检查</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-16">检查人</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20" title="已发现隐患点位">已发现点位</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20" title="未覆盖隐患点位">未覆盖点位</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">复盘状态</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">复盘日期</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">同类企业排查</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">排查日期</th>
            </tr>
          </thead>
          <tbody>
            {accidentReviewData.map((item, index) => (
              <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                <td className="text-center py-2.5 px-1 text-zinc-400">{index + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="font-medium text-zinc-700">{item.enterpriseName}</div>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className="text-zinc-600">{item.enterpriseType}</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getAccidentTypeStyle(item.accidentType)}`}>
                    {item.accidentType}
                  </span>
                </td>
                <td className="text-center py-2.5 px-1 text-zinc-600">{item.accidentDate}</td>
                <td className="text-center py-2.5 px-1">
                  <span className={`font-medium ${item.inspectionCount < 2 ? 'text-red-600' : item.inspectionCount < 3 ? 'text-amber-600' : 'text-zinc-700'}`}>
                    {item.inspectionCount}
                  </span>
                </td>
                <td className="text-center py-2.5 px-1 text-zinc-600">{item.lastInspectionDate}</td>
                <td className="text-center py-2.5 px-1 text-zinc-600">{item.inspector}</td>
                <td className="text-center py-2.5 px-1">
                  <span className="text-emerald-600 font-medium">{item.hazardPointsFound}</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className={`font-medium ${item.hazardPointsMissed > 5 ? 'text-red-600' : item.hazardPointsMissed > 0 ? 'text-amber-600' : 'text-zinc-700'}`}>
                    {item.hazardPointsMissed}
                  </span>
                </td>
                <td className="text-center py-2.5 px-1">{getStatusBadge(item.reviewStatus)}</td>
                <td className="text-center py-2.5 px-1 text-zinc-500">{item.reviewDate || '—'}</td>
                <td className="text-center py-2.5 px-1">{getStatusBadge(item.similarCheckStatus)}</td>
                <td className="text-center py-2.5 px-1 text-zinc-500">{item.similarCheckDate || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>共 {accidentReviewData.length} 起事故</span>
        <span className="text-emerald-600">复盘完成 {accidentReviewData.filter(a => a.reviewStatus === 'completed').length} 起</span>
        <span className="text-blue-600">同类排查完成 {accidentReviewData.filter(a => a.similarCheckStatus === 'completed').length} 起</span>
        <span className="text-red-600">未覆盖点位 {accidentReviewData.reduce((sum, a) => sum + a.hazardPointsMissed, 0)} 处</span>
      </div>

      {/* 说明 */}
      <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded text-xs text-amber-700">
        <strong>说明：</strong>事故倒查追溯对发生事故企业，追溯近一年检查情况、隐患点位覆盖情况，开展复盘并组织同类企业专项排查。未覆盖隐患点位数较高的事故企业需重点关注检查质量。
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// M1.7b 分片区监管情况表（基于工作组逻辑演示）
// ─────────────────────────────────────────────

interface DistrictSupervision {
  id: string
  districtName: string
  // 模拟：基于工作组数据映射到片区
  mappedWorkGroups: string[]
  checkedEnterprises: number
  hazardsFound: number
  majorHazards: number
  rectified: number
  enforcements: number
  coverage: number
  trend: 'up' | 'down' | 'stable'
}

const districtSupervisionData: DistrictSupervision[] = [
  {
    id: '1',
    districtName: '良渚片区',
    mappedWorkGroups: ['企业安全组-良渚片', '消防安全组-良渚片'],
    checkedEnterprises: 156,
    hazardsFound: 612,
    majorHazards: 7,
    rectified: 589,
    enforcements: 3,
    coverage: 92,
    trend: 'up',
  },
  {
    id: '2',
    districtName: '勾庄片区',
    mappedWorkGroups: ['企业安全组-勾庄片', '消防安全组-勾庄片'],
    checkedEnterprises: 142,
    hazardsFound: 548,
    majorHazards: 6,
    rectified: 521,
    enforcements: 2,
    coverage: 88,
    trend: 'stable',
  },
  {
    id: '3',
    districtName: '物流片区',
    mappedWorkGroups: ['企业安全组-物流片', '消防安全组-物流片'],
    checkedEnterprises: 130,
    hazardsFound: 504,
    majorHazards: 5,
    rectified: 478,
    enforcements: 4,
    coverage: 85,
    trend: 'down',
  },
]

function DistrictSupervisionTable() {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-emerald-600 text-xs">↗ 上升</span>
      case 'down':
        return <span className="text-red-600 text-xs">↘ 下降</span>
      default:
        return <span className="text-zinc-400 text-xs">→ 持平</span>
    }
  }

  return (
    <SectionBlock
      title="（二）分片区监管情况表"
      description="基于工作组数据映射的片区监管情况（演示版）- 良渚/勾庄/物流三片区对比"
      className="mt-6"
    >
      {/* 说明提示 */}
      <div className="mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded text-xs text-blue-700">
        <strong>💡 业务说明：</strong>当前系统只有"工作组"概念，没有"片区"概念。此表基于工作组数据映射演示片区监管情况。
        <br />
        <strong>🤔 待讨论问题：</strong>是否需要为不同街道/街镇定制片区逻辑？各街道的片区划分可能不同（如有的按地理片区，有的按行业片区）。
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-8">#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 w-24">片区名称</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 min-w-[160px]">映射工作组</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">检查企业</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">隐患数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">重大隐患</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">已整改</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-16">执法数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">覆盖率</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">环比趋势</th>
            </tr>
          </thead>
          <tbody>
            {districtSupervisionData.map((item, index) => (
              <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                <td className="text-center py-2.5 px-1 text-zinc-400">{index + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="font-medium text-zinc-700">{item.districtName}</div>
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex flex-wrap gap-1">
                    {item.mappedWorkGroups.map((wg, i) => (
                      <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px]">
                        {wg}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className="font-medium text-zinc-700">{item.checkedEnterprises}</span>
                  <span className="text-zinc-400 text-[10px]">家</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className="font-medium text-zinc-700">{item.hazardsFound}</span>
                  <span className="text-zinc-400 text-[10px]">处</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className={`font-medium ${item.majorHazards > 5 ? 'text-red-600' : 'text-zinc-700'}`}>
                    {item.majorHazards}
                  </span>
                  <span className="text-zinc-400 text-[10px]">处</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className="font-medium text-emerald-600">{item.rectified}</span>
                  <span className="text-zinc-400 text-[10px]">处</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className={`font-medium ${item.enforcements > 0 ? 'text-red-600' : 'text-zinc-700'}`}>
                    {item.enforcements}
                  </span>
                  <span className="text-zinc-400 text-[10px]">起</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-16 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.coverage >= 90 ? 'bg-emerald-500' : item.coverage >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${item.coverage}%` }}
                      />
                    </div>
                    <span className={`text-[10px] ${item.coverage >= 90 ? 'text-emerald-600' : item.coverage >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {item.coverage}%
                    </span>
                  </div>
                </td>
                <td className="text-center py-2.5 px-1">{getTrendIcon(item.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>共 {districtSupervisionData.length} 个片区</span>
        <span>检查企业 {districtSupervisionData.reduce((sum, d) => sum + d.checkedEnterprises, 0)} 家</span>
        <span className="text-red-600">重大隐患 {districtSupervisionData.reduce((sum, d) => sum + d.majorHazards, 0)} 处</span>
        <span className="text-emerald-600">已整改 {districtSupervisionData.reduce((sum, d) => sum + d.rectified, 0)} 处</span>
        <span>平均覆盖率 {Math.round(districtSupervisionData.reduce((sum, d) => sum + d.coverage, 0) / districtSupervisionData.length)}%</span>
      </div>

      {/* 讨论提示 */}
      <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded text-xs text-amber-700">
        <strong>📋 待与业务方讨论的问题：</strong>
        <ol className="list-decimal list-inside mt-1 space-y-0.5">
          <li>各街道/街镇的片区划分标准是否统一？（地理片区 vs 行业片区 vs 混合划分）</li>
          <li>片区数据是否需要与工作组数据实时联动？</li>
          <li>是否需要支持自定义片区配置？（不同街道可能片区数量、名称都不同）</li>
          <li>片区层级的权限管理如何设计？（片区负责人、跨片区协作等）</li>
        </ol>
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// M1.9 逾期未改/虚假整改企业清单
// ─────────────────────────────────────────────

interface OverdueRectification {
  id: string
  enterpriseName: string
  enterpriseType: string
  hazardType: string
  hazardDescription: string
  overdueDays: number
  rectificationStatus: 'overdue' | 'fake' | 'repeated'
  deadline: string
  inspector: string
  supervisionMeasures: string
  priority: 'high' | 'medium' | 'low'
}

const overdueRectificationData: OverdueRectification[] = [
  {
    id: '1',
    enterpriseName: '杭州良渚木业加工厂',
    enterpriseType: '生产企业',
    hazardType: '消防设施',
    hazardDescription: '灭火器过期、消防通道堵塞',
    overdueDays: 45,
    rectificationStatus: 'overdue',
    deadline: '2026-02-15',
    inspector: '李雷',
    supervisionMeasures: '立案查处、停产整顿',
    priority: 'high',
  },
  {
    id: '2',
    enterpriseName: '勾庄化工原料公司',
    enterpriseType: '危化使用',
    hazardType: '危化品存储',
    hazardDescription: '危化品未分类存放、通风设施缺失',
    overdueDays: 32,
    rectificationStatus: 'fake',
    deadline: '2026-02-28',
    inspector: '张峰',
    supervisionMeasures: '重新整改、专家复核',
    priority: 'high',
  },
  {
    id: '3',
    enterpriseName: '良渚机械制造有限公司',
    enterpriseType: '生产企业',
    hazardType: '机械安全',
    hazardDescription: '防护装置缺失、操作规程未上墙',
    overdueDays: 28,
    rectificationStatus: 'repeated',
    deadline: '2026-03-05',
    inspector: '韩梅梅',
    supervisionMeasures: '约谈负责人、重点盯防',
    priority: 'medium',
  },
  {
    id: '4',
    enterpriseName: '物流园区仓储中心',
    enterpriseType: '仓储物流',
    hazardType: '用电安全',
    hazardDescription: '私拉乱接电线、配电箱未封闭',
    overdueDays: 21,
    rectificationStatus: 'overdue',
    deadline: '2026-03-10',
    inspector: '今卓',
    supervisionMeasures: '限期整改、复查验收',
    priority: 'medium',
  },
  {
    id: '5',
    enterpriseName: '良渚街道出租房',
    enterpriseType: '出租房',
    hazardType: '消防安全',
    hazardDescription: '电动车违规充电、逃生通道堵塞',
    overdueDays: 15,
    rectificationStatus: 'repeated',
    deadline: '2026-03-15',
    inspector: '陈晨',
    supervisionMeasures: '联合执法、强制清理',
    priority: 'high',
  },
  {
    id: '6',
    enterpriseName: '勾庄小微园区',
    enterpriseType: '小微企业',
    hazardType: '现场管理',
    hazardDescription: '作业现场混乱、安全标识缺失',
    overdueDays: 12,
    rectificationStatus: 'fake',
    deadline: '2026-03-18',
    inspector: '李雷',
    supervisionMeasures: '专家会诊、指导整改',
    priority: 'low',
  },
]

function OverdueRectificationTable() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium border border-red-100">逾期未改</span>
      case 'fake':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-medium border border-orange-100">虚假整改</span>
      case 'repeated':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-medium border border-amber-100">屡改屡犯</span>
      default:
        return null
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-medium">高</span>
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">中</span>
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium">低</span>
      default:
        return null
    }
  }

  const getHazardTypeStyle = (type: string) => {
    const styles: Record<string, string> = {
      '消防设施': 'bg-red-50 text-red-600 border-red-100',
      '危化品存储': 'bg-orange-50 text-orange-600 border-orange-100',
      '机械安全': 'bg-amber-50 text-amber-600 border-amber-100',
      '用电安全': 'bg-yellow-50 text-yellow-700 border-yellow-100',
      '消防安全': 'bg-red-50 text-red-600 border-red-100',
      '现场管理': 'bg-purple-50 text-purple-600 border-purple-100',
    }
    return styles[type] || 'bg-zinc-50 text-zinc-600 border-zinc-200'
  }

  return (
    <SectionBlock
      title="（六）逾期未改/虚假整改企业清单"
      description="重大隐患闭环管理 - 发现—交办—督办—复核—销号全链条监管"
      className="mt-6"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-8">#</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 min-w-[140px]">企业名称</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">企业类型</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">隐患类型</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 min-w-[180px]">隐患描述</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">逾期天数</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-20">整改状态</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-24">整改期限</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-16">督办人</th>
              <th className="text-left py-2 px-2 font-medium text-zinc-500 min-w-[140px]">监管措施</th>
              <th className="text-center py-2 px-1 font-medium text-zinc-500 w-12">优先级</th>
            </tr>
          </thead>
          <tbody>
            {overdueRectificationData.map((item, index) => (
              <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                <td className="text-center py-2.5 px-1 text-zinc-400">{index + 1}</td>
                <td className="py-2.5 px-2">
                  <div className="font-medium text-zinc-700">{item.enterpriseName}</div>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className="text-zinc-600">{item.enterpriseType}</span>
                </td>
                <td className="text-center py-2.5 px-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getHazardTypeStyle(item.hazardType)}`}>
                    {item.hazardType}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-zinc-600">{item.hazardDescription}</td>
                <td className="text-center py-2.5 px-1">
                  <span className={`font-medium ${item.overdueDays > 30 ? 'text-red-600' : item.overdueDays > 15 ? 'text-orange-600' : 'text-amber-600'}`}>
                    {item.overdueDays}天
                  </span>
                </td>
                <td className="text-center py-2.5 px-1">{getStatusBadge(item.rectificationStatus)}</td>
                <td className="text-center py-2.5 px-1 text-zinc-600">{item.deadline}</td>
                <td className="text-center py-2.5 px-1 text-zinc-600">{item.inspector}</td>
                <td className="py-2.5 px-2 text-zinc-600">{item.supervisionMeasures}</td>
                <td className="text-center py-2.5 px-1">{getPriorityBadge(item.priority)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center gap-4 pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span className="text-red-600">逾期未改 {overdueRectificationData.filter(a => a.rectificationStatus === 'overdue').length} 家</span>
        <span className="text-orange-600">虚假整改 {overdueRectificationData.filter(a => a.rectificationStatus === 'fake').length} 家</span>
        <span className="text-amber-600">屡改屡犯 {overdueRectificationData.filter(a => a.rectificationStatus === 'repeated').length} 家</span>
        <span className="text-red-600 font-medium">高优先级 {overdueRectificationData.filter(a => a.priority === 'high').length} 家</span>
        <span>平均逾期 {Math.round(overdueRectificationData.reduce((sum, a) => sum + a.overdueDays, 0) / overdueRectificationData.length)} 天</span>
      </div>

      {/* 说明 */}
      <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded text-xs text-red-700">
        <strong>警示：</strong>建立逾期未改、虚假整改、屡改屡犯企业清单，重大隐患实行"发现—交办—督办—复核—销号"全链条闭环管理。逾期超过30天的企业需启动立案查处程序。
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 5b. 专家列表模块（展示7维度得分与关键指标）
// ─────────────────────────────────────────────
function ExpertListPanel({ onExpertClick }: { onExpertClick?: (expert: WorkGroupExpert) => void }) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(workGroups[0]?.id || '')

  const selectedGroup = workGroups.find(g => g.id === selectedGroupId) || workGroups[0]
  const experts = selectedGroupId ? (workGroupExpertsMap[selectedGroupId] || []) : []

  // 使用排序 hook
  const { sortedData: sortedExperts, sort, handleSort } = useSortableTable(experts, {
    defaultSortKey: 'totalScore',
    defaultDirection: 'desc'
  })

  // 监听左侧工作组的选中变化
  useEffect(() => {
    const handler = (e: CustomEvent) => setSelectedGroupId(e.detail)
    window.addEventListener('workgroup-select', handler as EventListener)
    return () => window.removeEventListener('workgroup-select', handler as EventListener)
  }, [])

  return (
    <SectionBlock
      title="专家列表"
      description={`${selectedGroup.name} · 7维度绩效与关键指标`}
      className="mt-6"
    >
      {/* 表头工具栏 - 显示当前排序状态 */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-xs text-zinc-500">
          当前排序: {sort.key ? `${String(sort.key)} (${sort.direction === 'desc' ? '降序' : '升序'})` : '默认'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2.5 px-2 font-medium text-zinc-500 w-8">#</th>
              <th className="text-left py-2.5 px-2 font-medium text-zinc-500 w-20">专家</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-12">角色</th>
              {/* 7维度得分列 - 显示但不支持排序（嵌套对象） */}
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="远程监管效能度 30%">远程</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="隐患闭环治理度 15%">闭环</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="自查执行活跃度 15%">自查</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="风险识别精准度 10%">识别</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="现场服务响应度 10%">响应</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="企业满意信任度 10%">满意</th>
              <th className="text-center py-2.5 px-1 font-medium text-zinc-500 w-14" title="安全知识贡献度 10%">贡献</th>
              <SortableHeader label="总分" sortKey="totalScore" currentSort={sort} onSort={handleSort} width={56} className="bg-zinc-50/50" />
              {/* 关键指标列 */}
              <SortableHeader label="企业" sortKey="enterpriseCount" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="隐患" sortKey="hazardFound" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="创患" sortKey="hazardCreated" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="待办" sortKey="todoCreated" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="咨询" sortKey="consultReplied" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="现场" sortKey="onsiteServiceCount" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="逾期" sortKey="overdueTasks" currentSort={sort} onSort={handleSort} width={40} />
              {/* 新增指标列（PRD 2.2） */}
              <SortableHeader label="通过率" sortKey="reviewPassRate" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="返工率" sortKey="reworkRate" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="响应" sortKey="avgResponseTime" currentSort={sort} onSort={handleSort} width={56} />
              <SortableHeader label="逾期率" sortKey="overdueTasks" currentSort={sort} onSort={handleSort} width={48} />
              <SortableHeader label="闭环" sortKey="avgClosureDays" currentSort={sort} onSort={handleSort} width={56} />
            </tr>
          </thead>
          <tbody>
            {sortedExperts.map((expert, index) => {
              const roleStyle = getRoleStyle(expert.role)
              const isTop3 = index < 3
              const ds = expert.dimensionScores

              return (
                <tr
                  key={expert.id}
                  onClick={() => onExpertClick?.(expert)}
                  className="border-b border-zinc-100 hover:bg-zinc-50/80 hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] transition-all cursor-pointer"
                >
                  <td className="py-2 px-2 w-8">
                    <span className={`text-xs ${isTop3 ? 'font-bold text-amber-500' : 'text-zinc-400'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-2 px-2 w-20">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-medium">
                        {expert.name.charAt(0)}
                      </div>
                      <span className="font-medium text-zinc-800 truncate">{expert.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className={`text-[10px] px-1 py-0.5 rounded ${roleStyle.bg} ${roleStyle.text} border ${roleStyle.border}`}>
                      {roleStyle.label}
                    </span>
                  </td>
                  {/* 7维度得分 */}
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.remoteEffectiveness} />
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.hazardClosure} />
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.selfCheckActivity} />
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.riskAccuracy} />
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.onsiteResponse} />
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.enterpriseSatisfaction} />
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <DimensionScoreCell score={ds.knowledgeContribution} />
                  </td>
                  {/* 总得分 */}
                  <td className="py-2 px-2 text-center w-14 bg-zinc-50/30">
                    <TotalScoreBadge score={expert.totalScore} />
                  </td>
                  {/* 关键指标 */}
                  <td className="py-2 px-1 text-center w-12">
                    <span className="text-xs font-medium text-indigo-600">{expert.enterpriseCount}</span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className="text-xs text-zinc-700">{expert.hazardFound}</span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className="text-xs text-zinc-700">{expert.hazardCreated}</span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className="text-xs text-zinc-700">{expert.todoCreated}</span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className="text-xs text-zinc-700">{expert.consultReplied}</span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className="text-xs text-zinc-700">{expert.onsiteServiceCount}</span>
                  </td>
                  <td className="py-2 px-1 text-center w-10">
                    <span className={`text-xs font-medium ${expert.overdueTasks > 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                      {expert.overdueTasks}
                    </span>
                  </td>
                  {/* 新增指标数据（PRD 2.2） */}
                  <td className="py-2 px-1 text-center w-12">
                    <span className={`text-xs ${expert.reviewPassRate < 80 ? 'text-red-600 font-medium' : 'text-emerald-600'}`}>
                      {expert.reviewPassRate}%
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className={`text-xs ${expert.reworkRate > 15 ? 'text-red-600 font-medium' : 'text-zinc-600'}`}>
                      {expert.reworkRate}%
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <span className={`text-xs ${expert.avgResponseTime > 4 ? 'text-amber-600' : 'text-zinc-600'}`}>
                      {expert.avgResponseTime.toFixed(1)}h
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center w-12">
                    <span className={`text-xs ${expert.hazardCreated > 0 && (expert.overdueTasks / expert.hazardCreated) > 0.15 ? 'text-red-600 font-medium' : 'text-zinc-600'}`}>
                      {expert.hazardCreated > 0 ? Math.round((expert.overdueTasks / expert.hazardCreated) * 100) : 0}%
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center w-14">
                    <span className={`text-xs ${expert.avgClosureDays > 7 ? 'text-red-600 font-medium' : 'text-emerald-600'}`}>
                      {expert.avgClosureDays.toFixed(1)}天
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span>共 {sortedExperts.length} 人</span>
          <span>平均总分: <span className="font-medium text-zinc-700">{(sortedExperts.reduce((sum, e) => sum + e.totalScore, 0) / sortedExperts.length).toFixed(0)}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>隐患: <span className="font-medium text-zinc-700">{sortedExperts.reduce((sum, e) => sum + e.hazardFound, 0)}</span></span>
          <span>待办: <span className="font-medium text-zinc-700">{sortedExperts.reduce((sum, e) => sum + e.todoCreated, 0)}</span></span>
        </div>
      </div>

    </SectionBlock>
  )
}

// 维度得分单元格组件（纯文本，无进度条）
function DimensionScoreCell({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 90) return 'text-emerald-600'
    if (s >= 80) return 'text-blue-600'
    if (s >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <span className={`text-[11px] font-medium ${getColor(score)}`}>{score}</span>
  )
}

// 总得分徽章组件
function TotalScoreBadge({ score }: { score: number }) {
  const getStyle = (s: number) => {
    if (s >= 90) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
    if (s >= 80) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
    if (s >= 70) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
  }

  const style = getStyle(score)
  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold ${style.bg} ${style.text} border ${style.border}`}>
      {score}
    </span>
  )
}

// ─────────────────────────────────────────────
// 7. 专家详情面板（底部，与顶部筛选联动）
// ─────────────────────────────────────────────

function ExpertGradeBadge({ grade }: { grade: 'A' | 'B' | 'C' }) {
  const styles = { A: 'bg-emerald-100 text-emerald-700', B: 'bg-blue-100 text-blue-700', C: 'bg-red-100 text-red-600' }
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${styles[grade]}`}>
      {grade}
    </span>
  )
}

function MiniBar({ score, weight, name }: { score: number; weight: number; name: string }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#4f46e5' : score >= 40 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-zinc-500 w-32 shrink-0 truncate">{name}</span>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono text-zinc-600 w-6 text-right">{score}</span>
      <span className="text-[10px] text-zinc-400 w-8">×{weight}%</span>
    </div>
  )
}

// 专家工作行为统计组件
function ExpertWorkBehaviorSection({ expertId }: { expertId: ExpertFilter }) {
  // 根据筛选条件计算行为数据
  const behaviors = useMemo(() => {
    const baseData = stationChiefMock.expertWorkBehavior

    if (expertId === 'all') {
      // 全部专家：展示团队累计
      return baseData
    }

    // 单个专家：按比例分配（实际项目中应该从API获取该专家的真实数据）
    const expert = stationChiefMock.expertTeam.find(e => e.id === expertId)
    if (!expert) return baseData

    // 根据专家任务量占比来估算个人数据
    const totalTasks = stationChiefMock.expertTeam.reduce((sum, e) => sum + (e.totalTasks || 0), 0)
    if (totalTasks === 0) return baseData
    const ratio = (expert.totalTasks || 0) / totalTasks
    return baseData.map(item => ({
      ...item,
      count: Math.round(item.count * ratio),
    }))
  }, [expertId])

  const colorStyles: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    text: 'text-blue-600',    iconBg: 'bg-blue-100' },
    red:     { bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-600',     iconBg: 'bg-red-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-600',   iconBg: 'bg-amber-100' },
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  text: 'text-violet-600',  iconBg: 'bg-violet-100' },
    cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-100',    text: 'text-cyan-600',    iconBg: 'bg-cyan-100' },
    slate:   { bg: 'bg-slate-100',  border: 'border-slate-200',   text: 'text-slate-600',   iconBg: 'bg-slate-200' },
    sky:     { bg: 'bg-sky-50',     border: 'border-sky-100',     text: 'text-sky-600',     iconBg: 'bg-sky-100' },
  }

  const icons: Record<string, React.ReactNode> = {
    risk_annotated: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    hazard_created: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    hazard_verified: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    onsite_inspect: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    video_inspect: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    consult_replied: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.556 4.03-8 9-8s9 3.444 9 8z" />
      </svg>
    ),
    ledger_updated: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    enterprise_contact: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
  }

  // 根据筛选状态动态调整标题和描述
  const sectionTitle = expertId === 'all' ? '专家工作行为统计' : '专家工作行为'
  const sectionDesc = expertId === 'all'
    ? '团队累计工作量 · 各类功能使用次数'
    : `${stationChiefMock.expertTeam.find(e => e.id === expertId)?.name || '专家'} · 个人工作量统计`

  return (
    <SectionBlock
      title={sectionTitle}
      description={sectionDesc}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {behaviors.map(item => {
          const style = colorStyles[item.color] || colorStyles.blue
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-4 rounded-xl border ${style.bg} ${style.border} hover:shadow-sm hover:-translate-y-0.5 transition-all`}
            >
              <div className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0 ${style.text}`}>
                {icons[item.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${style.text}`}>{item.count}</span>
                  <span className="text-xs text-zinc-500">{item.unit}</span>
                </div>
                <div className="text-sm font-medium text-zinc-700 truncate">{item.label}</div>
                <div className="text-[11px] text-zinc-400 truncate">{item.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionBlock>
  )
}

// ─────────────────────────────────────────────
// 8. 企业列表（对照企业端安全业务活动10维度，支持多维度筛选）
// ─────────────────────────────────────────────

const PAGE_SIZE = 20

function HighRiskEnterpriseList({
  expertId,
  riskLevel,
  orgGroup,
  dimensionFilter,
  onClearDimensionFilter,
  enterprises,
  loading,
}: {
  expertId: ExpertFilter
  riskLevel: RiskLevelFilter
  orgGroup: OrgGroupFilter
  dimensionFilter: DimensionFilter | null
  onClearDimensionFilter: () => void
  enterprises: Enterprise10D[]
  loading?: boolean
}) {
  const [currentPage, setCurrentPage] = useState(1)

  // 根据筛选条件过滤企业
  const filteredEnterprises = useMemo(() => {
    let result = enterprises || []

    // 风险等级筛选
    if (riskLevel !== 'all') {
      const riskMap: Record<string, string> = {
        major: '重大风险',
        high: '较大风险',
        medium: '一般风险',
        low: '低风险',
      }
      const targetRisk = riskMap[riskLevel]
      result = result.filter(e => e.risk_level === targetRisk)
    }

    // 专家筛选
    if (expertId !== 'all') {
      result = result.filter(e => e.expert_id === expertId)
    }

    // 组织架构/工作组筛选
    if (orgGroup !== 'all') {
      result = result.filter(e => e.work_group === orgGroup)
    }

    // 维度筛选（从 WeeklyDimensionStats 点击触发）
    if (dimensionFilter) {
      const { dimension, status } = dimensionFilter
      const shouldBeEstablished = status === 'established'
      
      result = result.filter(e => {
        switch (dimension) {
          case 'info_collection':
            return !!e.info_collection === shouldBeEstablished
          case 'risk_points':
            return !!e.risk_point_identified === shouldBeEstablished
          case 'safety_system':
            // 安全制度建立：安全制度3维度平均分 >= 60 视为已建立
            const safetyAvg = ((e.safety_org_duty_rate || 0) + (e.safety_system_rate || 0) + (e.safety_invest_rate || 0)) / 3
            return (safetyAvg >= 60) === shouldBeEstablished
          case 'inspection_task':
            // 检查任务：有检查计划且不为 none
            return (e.inspection_plan_type && e.inspection_plan_type !== 'none') === shouldBeEstablished
          case 'planned_inspection':
            // 计划检查：检查执行状态为 yes 或 forced
            return (e.inspection_execution === 'yes' || e.inspection_execution === 'forced') === shouldBeEstablished
          case 'third_party_sync':
            return (e.third_party_sync === 'yes') === shouldBeEstablished
          case 'patrol':
            return (e.patrol_used === 'yes') === shouldBeEstablished
          case 'training':
            return !!e.training_done === shouldBeEstablished
          case 'work_permit':
            return (!!e.work_permit_count && e.work_permit_count > 0) === shouldBeEstablished
          case 'hazard_discovery':
            // 发现隐患：有自查隐患或监管隐患
            const hasHazard = (e.hazard_self_check && e.hazard_self_check > 0) || 
                             (e.hazard_platform && e.hazard_platform > 0) ||
                             (e.hazard_major && e.hazard_major > 0)
            return hasHazard === shouldBeEstablished
          case 'park_inspection':
            // 园区检查：暂无实际数据，根据 risk_level 或 category 推断
            // 简化处理：生产企业可能需要园区检查
            return (e.category === 'production') === shouldBeEstablished
          default:
            return true
        }
      })
    }

    return result
  }, [expertId, riskLevel, orgGroup, dimensionFilter, enterprises])

  // 筛选条件变化时重置到第1页
  useEffect(() => {
    setCurrentPage(1)
  }, [expertId, riskLevel, orgGroup, dimensionFilter])

  // 企业列表排序
  const { sortedData: sortedEnterprises, sort, handleSort } = useSortableTable(filteredEnterprises, {
    defaultSortKey: 'risk_level',
    defaultDirection: 'asc'
  })

  // 筛选或排序变化时重置到第1页
  useEffect(() => {
    setCurrentPage(1)
  }, [sort.key, sort.direction])

  const totalPages = Math.ceil(sortedEnterprises.length / PAGE_SIZE)
  const pagedEnterprises = sortedEnterprises.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // 布尔型维度 -> 是/否
  const BoolCell = ({ value }: { value?: boolean }) =>
    value ? (
      <span className="text-emerald-600">是</span>
    ) : (
      <span className="text-zinc-400">否</span>
    )

  // 数值型维度 -> 数字显示（危险值标红）
  const NumCell = ({ value, danger = 0, warn = 0 }: { value?: number; danger?: number; warn?: number }) => {
    if (value === undefined || value === null) return <span className="text-zinc-300">—</span>
    const cls =
      danger && value >= danger ? 'text-red-600 font-medium' :
      warn && value >= warn   ? 'text-amber-600 font-medium' :
      'text-zinc-700'
    return <span className={cls}>{value}</span>
  }

  // 百分比显示（安全制度3维度）
  const PercentCell = ({ value }: { value?: number }) => {
    if (value === undefined || value === null) return <span className="text-zinc-300">—</span>
    const cls = value >= 80 ? 'text-emerald-600' : value >= 60 ? 'text-amber-600' : 'text-red-600'
    return <span className={`text-xs ${cls}`}>{value}%</span>
  }

  // 检查计划类型 -> 中文
  const PlanTypeCell = ({ value }: { value?: 'weekly' | 'monthly' | 'quarterly' | 'none' }) => {
    if (!value || value === 'none') return <span className="text-zinc-400">否</span>
    const map: Record<string, string> = { weekly: '按周', monthly: '按月', quarterly: '按季' }
    return <span className="text-zinc-700">{map[value]}</span>
  }

  // 检查执行 -> 中文
  const ExecCell = ({ value }: { value?: 'yes' | 'no' | 'forced' }) => {
    if (!value || value === 'no') return <span className="text-zinc-400">否</span>
    if (value === 'yes') return <span className="text-emerald-600">是</span>
    return <span className="text-amber-600">强制</span>
  }

  // 第三方同步/巡查 -> 是否（简化展示，非强制视为否）
  const OptionalCell = ({ value }: { value?: 'yes' | 'no' | 'optional' }) => {
    if (value === 'yes') return <span className="text-emerald-600">是</span>
    return <span className="text-zinc-400">否</span>
  }

  // 教育培训 -> 是否开展+台账
  const TrainingCell = ({ done, hasRecord }: { done?: boolean; hasRecord?: boolean }) => {
    if (!done) return <span className="text-zinc-400">未开展</span>
    return (
      <div className="flex flex-col items-center">
        <span className="text-emerald-600">已开展</span>
        {hasRecord && <span className="text-[10px] text-zinc-500">有台账</span>}
      </div>
    )
  }

  // 整改进展 -> 中文标签
  const RectifyCell = ({ value }: { value?: 'completed' | 'uncompleted' | 'partial' | 'overdue' }) => {
    if (!value) return <span className="text-zinc-300">—</span>
    const map: Record<string, { text: string; cls: string }> = {
      completed: { text: '已整改', cls: 'text-emerald-600' },
      uncompleted: { text: '未整改', cls: 'text-zinc-500' },
      partial: { text: '部分整改', cls: 'text-amber-600' },
      overdue: { text: '逾期未整改', cls: 'text-red-600 font-medium' },
    }
    const { text, cls } = map[value]
    return <span className={cls}>{text}</span>
  }

  // 风险等级徽章
  const RiskBadge = ({ level }: { level?: string }) => {
    if (!level) return <span className="text-zinc-300">—</span>
    switch (level) {
      case '重大风险': return <span className="px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">{level}</span>
      case '较大风险': return <span className="px-1 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">{level}</span>
      case '一般风险': return <span className="px-1 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">{level}</span>
      case '低风险': return <span className="px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">{level}</span>
      default: return <span className="px-1 py-0.5 rounded text-xs bg-zinc-100 text-zinc-600">{level}</span>
    }
  }

  // 每行高度约 36px，20行 + 表头约 36px = 756px，固定高度保持稳定
  const TABLE_BODY_HEIGHT = PAGE_SIZE * 36

  // 维度名称映射
  const dimensionNameMap: Record<string, string> = {
    info_collection: '信息采集',
    risk_points: '风险点识别',
    safety_system: '安全制度建立',
    inspection_task: '检查任务',
    planned_inspection: '计划检查',
    third_party_sync: '第三方同步',
    patrol: '安全巡查',
    training: '教育培训',
    work_permit: '作业票报备',
    hazard_discovery: '发现隐患',
    park_inspection: '园区检查',
  }

  // 根据维度筛选条件生成描述
  const getDescription = () => {
    if (!dimensionFilter) return '企业端安全业务活动10维度筛选'
    const dimName = dimensionNameMap[dimensionFilter.dimension] || dimensionFilter.dimension
    const statusText = dimensionFilter.status === 'established' ? '已建立' : '未建立'
    return (
      <span className="flex items-center gap-2">
        <span className="text-indigo-600 font-medium">
          {dimensionFilter.weekLabel} · {dimName} · {statusText}
        </span>
        <button
          onClick={onClearDimensionFilter}
          className="text-xs px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
        >
          清除筛选
        </button>
      </span>
    )
  }

  return (
    <SectionBlock
      title="企业列表"
      description={getDescription()}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // 导出CSV（新版字段）
              const headers = ['序号', '企业名称', '信息采集', '数据授权', '风险点识别', '机构职责%', '安全制度%', '安全投入%', '检查计划', '检查执行', '三方同步', '安全巡查', '教育培训', '培训台账', '作业票', '自查隐患', '监管隐患', '重大隐患', '整改进展', '风险等级']
              const planTypeMap: Record<string, string> = { weekly: '按周', monthly: '按月', quarterly: '按季', none: '否' }
              const execMap: Record<string, string> = { yes: '是', no: '否', forced: '强制' }
              const optionalMap: Record<string, string> = { yes: '是', no: '否', optional: '否' }
              const rectifyMap: Record<string, string> = { completed: '已整改', uncompleted: '未整改', partial: '部分整改', overdue: '逾期未整改' }
              
              const rows = pagedEnterprises.map((ent, idx) => [
                (currentPage - 1) * PAGE_SIZE + idx + 1,
                ent.name,
                ent.info_collection ? '是' : '否',
                ent.data_authorized ? '是' : '否',
                ent.risk_point_identified ? '是' : '否',
                (ent.safety_org_duty_rate ?? 0) + '%',
                (ent.safety_system_rate ?? 0) + '%',
                (ent.safety_invest_rate ?? 0) + '%',
                planTypeMap[ent.inspection_plan_type || 'none'],
                execMap[ent.inspection_execution || 'no'],
                optionalMap[ent.third_party_sync || 'optional'],
                optionalMap[ent.patrol_used || 'optional'],
                ent.training_done ? '已开展' : '未开展',
                ent.training_has_record ? '有' : '无',
                (ent.work_permit_count ?? 0) > 0 ? '是' : '否',
                (ent.hazard_self_check ?? 0) > 0 ? '是' : '否',
                (ent.hazard_platform ?? 0) > 0 ? '是' : '否',
                (ent.hazard_major ?? 0) > 0 ? '是' : '否',
                rectifyMap[ent.hazard_rectify_status || 'uncompleted'],
                ent.risk_level,
              ])
              const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
              const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
              const link = document.createElement('a')
              link.href = URL.createObjectURL(blob)
              link.download = `企业列表_${new Date().toISOString().slice(0, 10)}.csv`
              link.click()
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium hover:bg-emerald-100 transition-colors"
            title="导出当前页数据为CSV"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出
          </button>
          <button
            onClick={async () => {
              if (confirm('确定要重置数据吗？将清除现有数据并重新生成300家企业。')) {
                resetDatabase()
                await initDatabase()
                window.location.reload()
              }
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-medium hover:bg-zinc-200 transition-colors"
            title="重置数据以更新企业名称"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新数据
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-zinc-400">
          <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          加载中...
        </div>
      ) : (
      <div className="overflow-x-auto">
        <div style={{ height: TABLE_BODY_HEIGHT, overflowY: 'auto' }}>
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-white sticky top-0 z-10">
              <tr className="border-b border-zinc-200">
                <th className="text-left py-2 px-2 font-medium text-zinc-500" style={{ width: 32 }}>#</th>
                <SortableHeader label="企业名称" sortKey="name" currentSort={sort} onSort={handleSort} width={160} className="text-left" />
                <SortableHeader label="信息采集" sortKey="info_collection" currentSort={sort} onSort={handleSort} width={44} />
                <SortableHeader label="数据授权" sortKey="data_authorized" currentSort={sort} onSort={handleSort} width={44} />
                <SortableHeader label="风险点" sortKey="risk_point_identified" currentSort={sort} onSort={handleSort} width={44} />
                <SortableHeader label="机构职责" sortKey="safety_org_duty_rate" currentSort={sort} onSort={handleSort} width={40} />
                <SortableHeader label="安全制度" sortKey="safety_system_rate" currentSort={sort} onSort={handleSort} width={40} />
                <SortableHeader label="安全投入" sortKey="safety_invest_rate" currentSort={sort} onSort={handleSort} width={40} />
                <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 44 }}>检查<br/>计划</th>
                <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 40 }}>检查<br/>执行</th>
                <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 40 }}>三方<br/>同步</th>
                <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 40 }}>安全<br/>巡查</th>
                <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 52 }}>教育培训</th>
                <SortableHeader label="作业票" sortKey="work_permit_count" currentSort={sort} onSort={handleSort} width={40} />
                <SortableHeader label="自查隐患" sortKey="hazard_self_check" currentSort={sort} onSort={handleSort} width={40} />
                <SortableHeader label="监管隐患" sortKey="hazard_platform" currentSort={sort} onSort={handleSort} width={40} />
                <SortableHeader label="重大隐患" sortKey="hazard_major" currentSort={sort} onSort={handleSort} width={40} />
                <th className="text-center py-2 px-1 font-medium text-zinc-500" style={{ width: 60 }}>整改进展</th>
                <SortableHeader label="风险等级" sortKey="risk_level" currentSort={sort} onSort={handleSort} width={56} />
              </tr>
            </thead>
            <tbody>
              {pagedEnterprises.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-8 text-center text-zinc-400">
                    暂无数据
                  </td>
                </tr>
              ) : pagedEnterprises.map((ent, index) => (
                <tr key={ent.id} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-all">
                  <td className="py-2 px-2 text-zinc-400" style={{ width: 32 }}>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                  <td className="py-2 px-2 font-medium text-zinc-800 truncate" title={ent.name} style={{ width: 160 }}>{ent.name}</td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}><BoolCell value={ent.info_collection} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}><BoolCell value={ent.data_authorized} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}><BoolCell value={ent.risk_point_identified} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><PercentCell value={ent.safety_org_duty_rate} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><PercentCell value={ent.safety_system_rate} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><PercentCell value={ent.safety_invest_rate} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 44 }}><PlanTypeCell value={ent.inspection_plan_type} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><ExecCell value={ent.inspection_execution} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><OptionalCell value={ent.third_party_sync} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><OptionalCell value={ent.patrol_used} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 52 }}><TrainingCell done={ent.training_done} hasRecord={ent.training_has_record} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><BoolCell value={!!ent.work_permit_count} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><BoolCell value={!!ent.hazard_self_check} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><BoolCell value={!!ent.hazard_platform} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 40 }}><BoolCell value={!!ent.hazard_major} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 60 }}><RectifyCell value={ent.hazard_rectify_status} /></td>
                  <td className="py-2 px-1 text-center" style={{ width: 56 }}><RiskBadge level={ent.risk_level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 底部：总数 + 分页 */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 text-xs text-zinc-500">
        <span>
          共 <span className="font-medium text-zinc-700">{filteredEnterprises.length}</span> 家企业
          {riskLevel !== 'all' && (
            <span className="ml-2 text-indigo-600">
              （{riskLevel === 'major' ? '重大风险' : riskLevel === 'high' ? '较大风险' : riskLevel === 'medium' ? '一般风险' : '低风险'}）
            </span>
          )}
          <span className="ml-2 text-zinc-400">
            第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredEnterprises.length)} 条
          </span>
        </span>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // 显示首页、尾页、当前页及左右各1页，其余用省略号
              const show =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              if (!show) {
                if (page === 2 || page === totalPages - 1) {
                  return <span key={page} className="px-1 text-zinc-400">…</span>
                }
                return null
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 rounded border transition-colors ${
                    page === currentPage
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {page}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border border-zinc-200 disabled:opacity-30 hover:bg-zinc-50 transition-colors"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </SectionBlock>
  )
}




// ─────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────

export function StationChiefDashboard() {
  const timeOptions = [
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '本季', value: 'quarter' },
  ]
  const [timeRange, setTimeRange] = useState('month')
  const [selectedExpertId, setSelectedExpertId] = useState<ExpertFilter>('all')
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevelFilter>('all')
  const [selectedOrgGroup, setSelectedOrgGroup] = useState<OrgGroupFilter>('all')
  const [selectedExpert, setSelectedExpert] = useState<WorkGroupExpert | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  
  // 维度筛选状态（从 WeeklyDimensionStats 点击触发）
  const [dimensionFilter, setDimensionFilter] = useState<DimensionFilter | null>(null)

  // 左侧导航状态
  const [activeNavId, setActiveNavId] = useState<string | null>('dimension-1')
  
  // 维度引用，用于滚动监听
  const dimensionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 数据库企业数据
  const [dbEnterprises, setDbEnterprises] = useState<Enterprise10D[]>([])
  const [dbLoading, setDbLoading] = useState(true)

  // 导航项定义
  const navItems = [
    {
      id: 'dimension-1',
      label: '一、日常监管',
      description: '月度数据、分片区、行业分析',
      isExtension: false
    },
    {
      id: 'dimension-2',
      label: '二、人员履职',
      description: '工作组、专家履职、事故倒查',
      isExtension: false
    },
    {
      id: 'dimension-3',
      label: '三、企业主体',
      description: '责任制、ABC分类、风险管控',
      isExtension: true
    },
    {
      id: 'dimension-4',
      label: '四、辖区形势',
      description: '整体形势、风险特征、热力图',
      isExtension: true
    },
    {
      id: 'dimension-5',
      label: '五、其他',
      description: '扩展监控、任务周期、辅助工具',
      isExtension: true
    }
  ]

  // 处理导航点击
  const handleNavClick = (id: string) => {
    setActiveNavId(id)
    const element = dimensionRefs.current[id]
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // 初始化数据库并加载数据（含10维度）
  useEffect(() => {
    async function loadDbData() {
      try {
        await initDatabase()
        let enterprises = await getEnterprisesWithDimensions()

        // 验证数据完整性：检查是否有企业的 work_group 字段有效，以及新增字段是否存在
        const validWorkGroups = ['物流片安全组', '良渚片重大', '良渚片较大', '勾庄片重大', '勾庄片较大']
        const hasValidWorkGroup = enterprises.length > 0 && enterprises.some(e => validWorkGroups.includes(e.work_group))
        const hasNewFields = enterprises.length > 0 && enterprises.some(e =>
          e.inspection_count !== undefined &&
          e.hazard_rectified !== undefined &&
          e.enforcement_count !== undefined
        )

        if (!hasValidWorkGroup || !hasNewFields) {
          console.log('数据不完整或缺少新字段，重新生成企业数据...')
          resetDatabase()
          await initDatabase()
          enterprises = await getEnterprisesWithDimensions()
        }
        
        setDbEnterprises(enterprises)
      } catch (error) {
        console.error('Failed to load database:', error)
      } finally {
        setDbLoading(false)
      }
    }
    loadDbData()
  }, [])

  // 滚动监听：更新激活的导航项
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100 // 稍微提前触发
      
      // 找到当前可见的维度
      let currentActiveId = 'dimension-1'
      
      for (const item of navItems) {
        const element = dimensionRefs.current[item.id]
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          
          if (scrollPosition >= elementTop) {
            currentActiveId = item.id
          }
        }
      }
      
      setActiveNavId(currentActiveId)
    }
    
    window.addEventListener('scroll', handleScroll)
    // 初始检查
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [navItems])

  // 重置数据库（清除缓存重新生成）
  const handleResetData = async () => {
    if (confirm('确定要重置数据库吗？这将清除现有数据并重新生成。')) {
      setDbLoading(true)
      resetDatabase()
      await initDatabase()
      const enterprises = await getEnterprisesWithDimensions()
      setDbEnterprises(enterprises)
      setDbLoading(false)
      alert(`数据已重置，当前共有 ${enterprises.length} 家企业`)
    }
  }

  return (
    <>
      <PageShell maxWidth="full">
        <div className="flex gap-8">
          {/* 左侧导航 - 窄栏 */}
          <SideNavigation
            items={navItems}
            activeId={activeNavId}
            onItemClick={handleNavClick}
          />
          
          {/* 主内容区域 */}
          <div className="flex-1 min-w-0">
            <PageHeader
              title="站长"
              subtitle="辖区安全监管与专家管理"
              updateTime="2026-04-08 10:00"
              actions={
                <>
                  <button
                    onClick={handleResetData}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-sm font-medium hover:bg-zinc-200 active:scale-[0.98] transition-all"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重置数据
                  </button>
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    创建专项任务
                  </button>
                </>
              }
            />

        {/* ═══════════════════════════════════════════════════════════
            维度一：日常监管工作
            ═══════════════════════════════════════════════════════════ */}
        <div 
          id="dimension-1"
          ref={el => dimensionRefs.current['dimension-1'] = el}
        >
          <DimensionSectionTitle
            number="一"
            title="日常监管工作"
            description="月度数据、分片区监管、行业分析、专项检查、隐患闭环管理"
          />
        </div>

        {/* （一）月度及年度累计情况 */}
        <CumulativeStats expertId={selectedExpertId} orgGroup={selectedOrgGroup} />

        {/* 任务周期进度概要卡（放在月度及年度累计之后，供领导快速查看） */}
        <SectionBlock title="任务周期进度概览" description="概要：显示总体任务进度与逾期情况" className="mb-4">
          <div className="flex gap-4 overflow-x-auto">
            {/* 汇总统计：合计应完成、已完成、逾期、总体完成率 */}
            {
              (() => {
                const cycles = mockTaskCycleProgress.cycles
                const required = Object.values(cycles).reduce((s, c) => s + (c.requiredTasks || 0), 0)
                const completed = Object.values(cycles).reduce((s, c) => s + (c.completedTasks || 0), 0)
                const overdue = Object.values(cycles).reduce((s, c) => s + (c.overdueTasks || 0), 0)
                const avgProgress = Math.round(Object.values(cycles).reduce((s, c) => s + (c.taskProgress || 0), 0) / 4)
                return (
                  <>
                    <div className="bg-white p-3 rounded shadow-sm min-w-[160px]">
                      <div className="text-xs text-zinc-500">应完成任务（合计）</div>
                      <div className="text-lg font-medium text-zinc-800">{required}</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm min-w-[160px]">
                      <div className="text-xs text-zinc-500">已完成</div>
                      <div className="text-lg font-medium text-emerald-600">{completed}</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm min-w-[160px]">
                      <div className="text-xs text-zinc-500">逾期任务</div>
                      <div className="text-lg font-medium text-red-600">{overdue}</div>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm min-w-[160px]">
                      <div className="text-xs text-zinc-500">总体完成率（平均）</div>
                      <div className="text-lg font-medium">{avgProgress}%</div>
                    </div>
                  </>
                )
              })()
            }
          </div>
        </SectionBlock>

        {/* （二）分片区监管情况 */}
        <DistrictSupervisionTable />

        {/* （三）分行业与隐患结构分析 */}
        <IndustryHazardTable />

        {/* （五）危化使用企业专项检查 */}
        <SpecialInspectionTable />

        {/* （六）重点时段与隐患闭环管理 - 含逾期未改企业清单 */}
        <OverdueRectificationTable />

        {/* ═══════════════════════════════════════════════════════════
            维度二：人员履职情况
            ═══════════════════════════════════════════════════════════ */}
        <div 
          id="dimension-2"
          ref={el => dimensionRefs.current['dimension-2'] = el}
        >
          <DimensionSectionTitle
            number="二"
            title="人员履职情况"
            description="企业安全组、消防安全组、安全专家履职统计及事故倒查追溯"
          />
        </div>

        {/* （一）（二）企业安全组、消防安全组履职情况 */}
        <GroupPerformanceTable />

        {/* （三）政府人员履职情况 */}
        <SectionBlock
          title="（三）政府人员履职情况表"
          description="组长、副站长履职情况统计"
          className="mt-6"
        >
          <GovernmentStaffList />
        </SectionBlock>

        {/* （四）安全专家履职情况 */}
        <ExpertPerformanceTable />

        {/* （五）事故倒查追溯 */}
        <AccidentReviewTable />

        {/* ═══════════════════════════════════════════════════════════
            维度三：企业主体责任（扩展）
            ═══════════════════════════════════════════════════════════ */}
        <div 
          id="dimension-3"
          ref={el => dimensionRefs.current['dimension-3'] = el}
        >
          <DimensionSectionTitle
            number="三"
            title="企业主体责任（扩展）"
            description="ABC分类、平台使用分析、风险分级管控"
            isExtension
          />
          
          {/* （一）总体情况 */}
          <EnterpriseResponsibilityOverview />
          
          {/* （二）ABC分类管理 */}
          <ABCClassificationTable />
          
          {/* （三）平台使用情况分析 */}
          <PlatformUsageAnalysis />
          
          {/* （四）风险分级管控（四色管理） */}
          <RiskLevelControl />
          
          {/* （五）企业自查自报与基础管理 */}
          <SelfInspectionManagement />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            维度四：辖区安全形势（扩展）
            ═══════════════════════════════════════════════════════════ */}
        <div 
          id="dimension-4"
          ref={el => dimensionRefs.current['dimension-4'] = el}
        >
          <DimensionSectionTitle
            number="四"
            title="辖区安全形势（扩展）"
            description="风险热力、辖区形势研判、扩展数据监控"
            isExtension
          />
          
          {/* （一）整体形势 */}
          <SafetySituationOverview />
          
          {/* （二）主要风险特征 */}
          <RiskCharacteristics />
          
          {/* （三）片区风险热力与趋势研判 */}
          <DistrictRiskHeatmap />
          
          {/* （四）已开展工作 */}
          <CompletedWorkStats />
          
          {/* （五）下一步工作措施 */}
          <NextStepsPlan />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            维度五：其他（扩展模块）
            ═══════════════════════════════════════════════════════════ */}
        <div 
          id="dimension-5"
          ref={el => dimensionRefs.current['dimension-5'] = el}
        >
          <DimensionSectionTitle
            number="五"
            title="其他"
            description="扩展数据监控、任务周期、辅助分析工具"
            isExtension
          />
        </div>

        {/* 过滤栏：专家筛选 + 时间筛选 + 组织架构筛选 */}
        <div className="flex items-center gap-4 lg:gap-6 px-1 mb-6 flex-wrap">
          {/* 专家筛选器 */}
          <ExpertFilterBar
            selectedExpertId={selectedExpertId}
            onSelect={setSelectedExpertId}
          />

          {/* 时间筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 shrink-0">时间：</span>
            <div className="flex rounded-lg overflow-hidden border border-zinc-200 text-xs">
              {timeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    timeRange === opt.value ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>

          {/* 组织架构筛选器 */}
          <OrgGroupFilterBar
            selectedGroup={selectedOrgGroup}
            onSelect={setSelectedOrgGroup}
          />
        </div>

        {/* 任务周期进度监控 - 四风险等级时间进度 vs 任务进度 */}
        <TaskCycleProgressPanel className="mb-6" />

        {/* 核心风险指标卡片（点击可筛选风险等级） */}
        <RiskMetricsCards
          selectedRiskLevel={selectedRiskLevel}
          onSelectRiskLevel={setSelectedRiskLevel}
          expertId={selectedExpertId}
          orgGroup={selectedOrgGroup}
        />

        {/* 监管工作实绩概览（4个分组卡片） */}
        <SupervisionPerformanceOverview />

        {/* 七维度治理效果 */}
        <SevenDimensionsSection expertId={selectedExpertId} riskLevel={selectedRiskLevel} orgGroup={selectedOrgGroup} />

        {/* 企业状态路径 */}
        <EnterpriseStatePath
          expertId={selectedExpertId === 'all' ? undefined : selectedExpertId}
          riskLevel={selectedRiskLevel === 'all' ? undefined : selectedRiskLevel}
        />

        {/* 工作组数据对比（通栏全宽） */}
        <WorkGroupComparison enterprises={dbEnterprises} />

        {/* 专家列表（通栏） */}
        <ExpertListPanel onExpertClick={(expert) => setSelectedExpert(expert)} />

        {/* 企业每周使用情况总览 */}
        <WeeklyDimensionStats 
          expertId={selectedExpertId === 'all' ? undefined : selectedExpertId} 
          onDimensionClick={(filter) => setDimensionFilter(filter)}
        />

        {/* 企业列表（受风险等级、专家、组织架构、维度筛选影响） */}
        <HighRiskEnterpriseList
          expertId={selectedExpertId}
          riskLevel={selectedRiskLevel}
          orgGroup={selectedOrgGroup}
          dimensionFilter={dimensionFilter}
          onClearDimensionFilter={() => setDimensionFilter(null)}
          enterprises={dbEnterprises}
          loading={dbLoading}
        />
          </div>
        </div>
      </PageShell>

      {selectedExpert && (
        <ExpertPerformanceModal
          expert={selectedExpert}
          onClose={() => setSelectedExpert(null)}
        />
      )}

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onSubmit={(data) => {
            console.log('[CreateTask] submitted:', data)
          }}
        />
      )}
    </>
  )
}
