import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import type { Dimension, HazardNavigateParams, RiskLevel } from './components/types'

import { DutyDimension } from './components/DutyDimension'
import { DailySupervisionDimension } from './components/DailySupervisionDimension'
import { StateDimension } from './components/StateDimension'
import { HazardDimension } from './components/HazardDimension'
import { IndustryDimension } from './components/IndustryDimension'
import { SpecialDimension } from './components/SpecialDimension'
import { TrendDimension } from './components/TrendDimension'
import { YuzhiSyncDimension } from './components/YuzhiSyncDimension'
import { YuzhiSyncDashboard } from './YuzhiSyncDashboard'

import { initDatabase, getWorkGroups, getHazards, getEnterpriseStats, getExperts, getEnterprises } from '../../../db'
import type { WorkGroup, Hazard, Expert, Enterprise } from '../../../db/types'

const VALID_DIMENSIONS: Dimension[] = ['duty', 'industry', 'special', 'state', 'hazard', 'trend', 'yuzhi']

// 顶级页面标识
type TopLevelPage = 'station' | 'daily' | 'yuzhi' | 'yuzhi-sync'

// 日常监管筛选下拉统一样式
const dailySelectStyle = (active: boolean): React.CSSProperties => ({
  padding: '2px 8px',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
  fontSize: 12,
  color: active ? '#4F46E5' : '#6B7280',
  background: 'white',
  outline: 'none',
})

// 日期工具
const TODAY = new Date()
const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const weekDay = TODAY.getDay() === 0 ? 6 : TODAY.getDay() - 1  // 周一为起始（0=周一）
const weekStart = new Date(TODAY); weekStart.setDate(TODAY.getDate() - weekDay)
const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
const monthEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0)
const quarterMonth = Math.floor(TODAY.getMonth() / 3) * 3
const quarterStart = new Date(TODAY.getFullYear(), quarterMonth, 1)
const quarterEnd = new Date(TODAY.getFullYear(), quarterMonth + 3, 0)
const yearStart = new Date(TODAY.getFullYear(), 0, 1)
const yearEnd = new Date(TODAY.getFullYear(), 11, 31)
// 上月
const prevMonthStart = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1)
const prevMonthEnd = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0)
// 上季
const prevQuarterMonth = Math.floor(TODAY.getMonth() / 3) * 3 - 3
const prevQuarterYear = prevQuarterMonth < 0 ? TODAY.getFullYear() - 1 : TODAY.getFullYear()
const prevQuarterStartMonth = ((prevQuarterMonth % 12) + 12) % 12
const prevQuarterStart = new Date(prevQuarterYear, prevQuarterStartMonth, 1)
const prevQuarterEnd = new Date(prevQuarterYear, prevQuarterStartMonth + 3, 0)

type TimeRange = 'month' | 'quarter' | 'year' | 'prevMonth' | 'prevQuarter'

export function StationChiefV2Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 数据库数据状态
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [hazardRecords, setHazardRecords] = useState<Hazard[]>([])
  const [enterpriseCount, setEnterpriseCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 全局筛选状态（工作组、专家、企业、行业）
  const [filterTeam, setFilterTeam] = useState<string>('all')
  const [filterExpert, setFilterExpert] = useState<string>('all')
  const [filterEnterprise, setFilterEnterprise] = useState<string>('all')
  const [filterIndustry, setFilterIndustry] = useState<string>('all')

  // 日常监管页专属筛选状态
  const [dailyVillage, setDailyVillage] = useState<string>('all')
  const [dailyStatus, setDailyStatus] = useState<string>('all')
  // 村社选项（取自工作组所属区域）
  const villages = useMemo(
    () => Array.from(new Set(workGroups.map(w => w.area))).filter(Boolean).sort(),
    [workGroups],
  )

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        await initDatabase()
        const [groups, expertList, enterpriseList, hazards, stats] = await Promise.all([
          getWorkGroups(),
          getExperts(),
          getEnterprises(),
          getHazards(),
          getEnterpriseStats()
        ])
        setWorkGroups(groups)
        setExperts(expertList)
        setEnterprises(enterpriseList)
        setHazardRecords(hazards)
        setEnterpriseCount(stats.total)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 从 URL 读取 tab 参数，默认 'duty'
  const urlDimension = searchParams.get('tab')
  const dimension: Dimension = VALID_DIMENSIONS.includes(urlDimension as Dimension) ? urlDimension as Dimension : 'duty'

  // 顶级页面：station（应急消防管理站看板）或 yuzhi（村社数据看板）
  const pageParam = searchParams.get('page')
  const topPage: TopLevelPage = pageParam === 'daily' ? 'daily' : pageParam === 'yuzhi-sync' ? 'yuzhi-sync' : pageParam === 'yuzhi' ? 'yuzhi' : 'station'

  // 日期筛选状态
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [specificMonth, setSpecificMonth] = useState('')

  // 根据 timeRange 或 specificMonth 计算实际起止日期
  const dateRange = useMemo((): { start: string; end: string } => {
    if (specificMonth) {
      const d = new Date(Number(specificMonth.split('-')[0]), Number(specificMonth.split('-')[1]), 0)
      return { start: `${specificMonth}-01`, end: fmtDate(d) }
    }
    switch (timeRange) {
      case 'month':       return { start: fmtDate(monthStart),      end: fmtDate(monthEnd) }
      case 'quarter':     return { start: fmtDate(quarterStart),    end: fmtDate(quarterEnd) }
      case 'year':        return { start: fmtDate(yearStart),       end: fmtDate(yearEnd) }
      case 'prevMonth':   return { start: fmtDate(prevMonthStart),  end: fmtDate(prevMonthEnd) }
      case 'prevQuarter': return { start: fmtDate(prevQuarterStart), end: fmtDate(prevQuarterEnd) }
    }
  }, [timeRange, specificMonth])

  // 全局 KPI 筛选状态
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null)

  // 风险等级筛选状态
  const [riskLevel, setRiskLevel] = useState<'all' | 'major' | 'high' | 'medium' | 'low'>('all')

  // 责任主体类型筛选
  const [filterEntityType, setFilterEntityType] = useState<'all' | 'production' | 'venue'>('all')

  // 企业状态多选筛选
  const ENTERPRISE_STATUSES = ['正常', '托管', '歇业中', '未核实', '停业', '搬迁', '虚拟注册', '注销']
  const [filterStatuses, setFilterStatuses] = useState<string[]>(['正常', '托管', '歇业中', '未核实'])
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [filterFireType, setFilterFireType] = useState<'all' | 'fireKey' | 'nineSmall' | 'general'>('all')
  const [showChangelog, setShowChangelog] = useState(false)
  const changeLogDefault = useMemo(() => [
    {
      id: 9,
      date: '2026-07-17',
      location: '修改记录',
      content: '修改记录弹窗新增"在线新增"功能：点击"+ 新增"按钮可在顶部创建新记录（可编辑日期/模块/内容），保存后自动持久化到 localStorage',
      editing: false,
    },
    {
      id: 8,
      date: '2026-07-17',
      location: '全局筛选栏',
      content: '1. 时间筛选取消跨月(from~to输入框)和"自定义"选项，改为单月快捷下拉\n2. 企业状态筛选标签改为"状态"，默认显示"全部"\n3. "安全责任主体总数"和"覆盖户数"指标卡改用与其他指标卡统一的bordered卡片样式',
      editing: false,
    },
    {
      id: 7,
      date: '2026-07-17',
      location: '责任主体分析',
      content: '删除"监管隐患数/已整改"指标卡，移除对应统计变量',
      editing: false,
    },
    {
      id: 6,
      date: '2026-07-17',
      location: '日常监管',
      content: '日常监管页新增全局筛选条件：村社、风险等级、责任主体类型、消防类型、专家、工作组、状态；概览/五维分析/占比分析三模块改为按筛选条件动态计算',
      editing: false,
    },
    {
      id: 5,
      date: '2026-07-17',
      location: '维度页签',
      content: '将"日常监管"从维度页签升级为与"应急消防管理站看板"平级的顶级页签（位于其右侧），原维度页签区移除"日常监管"',
      editing: false,
    },
    {
      id: 0,
      date: '2026-07-16',
      location: '任务计划',
      content: '指标卡：隐患总数/已整改合并为双列卡片，重大事故隐患数/已整改合并为双列卡片，5个卡片统一风格样式\n表格：隐患总数/已整改合并同列显示，重大事故隐患数/已整改合并同列显示\n修改记录合并到看板主修改记录',
      editing: false,
    },
    {
      id: -1,
      date: '2026-07-16',
      location: '组织与人员',
      content: '（二）人员履职情况表，"所在工作组"字段增加排序功能',
      editing: false,
    },
    {
      id: 1,
      date: '2026-07-09',
      location: '责任主体分析',
      content: '新增指标卡：安全检查户数、教育培训户数、自查隐患数（已整改/总数）、监管隐患数（已整改/总数）、重大事故隐患数（已整改/总数）',
      editing: false,
    },
    {
      id: 2,
      date: '2026-07-09',
      location: '维度页签',
      content: '新增"日常监管"维度页签（位于"组织与人员"右侧），包含概览、五维分析、占比分析三个模块',
      editing: false,
    },
    {
      id: 3,
      date: '2026-07-09',
      location: '全局指标卡',
      content: '6个总指标卡的单位（家/次/户/张/项/个）从值下方移至值右侧同行显示',
      editing: false,
    },
    {
      id: 4,
      date: '2026-07-09',
      location: '全局筛选栏',
      content: '1. 全局筛选"主体" → "责任主体类型"\n2. 新增企业状态多选筛选，默认选中 正常/托管/歇业中/未核实\n3. 新增消防类型筛选（消防重点单位/九小场所/一般单位）\n4. 时间筛选支持跨月范围（from ~ to），快捷选项改为下拉框\n5. 风险等级、责任主体类型、消防类型改为下拉框，标签外置',
      editing: false,
    },
  ], [])

  const [changeLogItems, setChangeLogItems] = useState(() => {
    try {
      const saved = localStorage.getItem('stationChief_changeLogItems_v2')
      if (saved) {
        const items = JSON.parse(saved)
        // filter out any stale cross-tab entries
        const valid = items.filter((i: any) => !['一起安平台数据分析', '村社数据看板'].includes(i.location))
        return valid.length > 0 ? valid : changeLogDefault
      }
      return changeLogDefault
    } catch {
      return changeLogDefault
    }
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editLocation, setEditLocation] = useState('')

  const handleNewChangeLog = () => {
    const nextId = Math.max(...changeLogItems.map(i => i.id), 0) + 1
    const today = fmtDate(new Date())
    const newEntry = { id: nextId, date: today, location: '', content: '', editing: true }
    const updated = [newEntry, ...changeLogItems]
    setChangeLogItems(updated)
    setEditingId(nextId)
    setEditText('')
    setEditDate(today)
    setEditLocation('')
    localStorage.setItem('stationChief_changeLogItems_v2', JSON.stringify(updated))
  }

  const handleSaveChangeLog = (itemId: number) => {
    setChangeLogItems(prev => {
      const updated = prev.map(i =>
        i.id === itemId
          ? { ...i, date: editDate, location: editLocation, content: editText, editing: false }
          : i
      )
      localStorage.setItem('stationChief_changeLogItems_v2', JSON.stringify(updated))
      return updated
    })
    setEditingId(null)
  }

  const toggleStatus = (s: string) => {
    setFilterStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const kpiTotals = useMemo(() => {
    const { start, end } = dateRange
    const inRange = hazardRecords.filter(h => {
      const discoveredAt = h.discovered_at || h.created_at
      return discoveredAt >= start && discoveredAt <= end
    })
    const seriousAll = inRange.filter(h => h.level === '重大隐患')
    const closedCount = inRange.filter(h => ['verified', 'closed', 'rectified'].includes(h.status)).length
    const inProgressCount = inRange.filter(h => h.status === 'rectifying').length
    const seriousClosed = seriousAll.filter(h => ['verified', 'closed', 'rectified'].includes(h.status)).length
    const seriousInProgress = seriousAll.filter(h => h.status === 'rectifying').length

    // 月环比：上月同期
    const pmStart = fmtDate(new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1))
    const pmEnd = fmtDate(new Date(TODAY.getFullYear(), TODAY.getMonth(), 0))
    const prevMonth = hazardRecords.filter(h => {
      const discoveredAt = h.discovered_at || h.created_at
      return discoveredAt >= pmStart && discoveredAt <= pmEnd
    })
    const currentHazard = closedCount + inProgressCount
    const currentSerious = seriousClosed + seriousInProgress

    const prevMonthHazard = prevMonth.length
    const prevMonthSerious = prevMonth.filter(h => h.level === '重大隐患').length
    const prevMonthClosed = prevMonth.filter(h => ['verified', 'closed', 'rectified'].includes(h.status)).length
    const prevMonthSeriousClosed = prevMonth.filter(h => h.level === '重大隐患' && ['verified', 'closed', 'rectified'].includes(h.status)).length

    const calcChange = (current: number, base: number): number | null =>
      base > 0 ? ((current - base) / base * 100) : null

    // 检查单统计（从专家平台行为数据汇总）
    const allBehavior = experts.map(e => e.expert_platform_behavior).filter(Boolean)
    const todoPushEnterpriseCount = allBehavior.reduce((s, b) => s + (b.todo_push_enterprise_count || 0), 0)
    const todoPushCount = allBehavior.reduce((s, b) => s + (b.todo_push_count || 0), 0)
    const todoClosedCount = allBehavior.reduce((s, b) => s + (b.todo_closed_count || 0), 0)
    const todoClosureRate = allBehavior.length > 0
      ? Math.round(allBehavior.reduce((s, b) => s + (b.todo_closure_rate || 0), 0) / allBehavior.length)
      : 0

    return {
      enterprise: enterpriseCount || workGroups.reduce((s, g) => s + g.enterprise_count, 0),
      hazard: currentHazard,
      serious: currentSerious,
      seriousClosed,
      seriousInProgress,
      closed: closedCount,
      inProgress: inProgressCount,
      deadline: inRange.filter(h => h.status === 'pending' || h.status === 'rectifying').length,
      extended: inRange.filter(h => h.status === 'overdue').length,
      overdue: inRange.filter(h => h.status === 'overdue').length,
      // 检查单统计
      todoPushEnterpriseCount,
      todoPushCount,
      todoClosedCount,
      todoClosureRate,
      // 月环比
      hazardMoM: calcChange(currentHazard, prevMonthHazard),
      seriousMoM: calcChange(currentSerious, prevMonthSerious),
      closedMoM: calcChange(closedCount, prevMonthClosed),
      seriousClosedMoM: calcChange(seriousClosed, prevMonthSeriousClosed),
    }
  }, [dateRange, workGroups, hazardRecords, enterpriseCount, experts])

  const handleDimensionChange = (key: Dimension) => {
    setSearchParams({ tab: key })
  }

  // 跳转到隐患维度并设置筛选条件
  const handleNavigateToHazard = (params: HazardNavigateParams) => {
    const newParams: Record<string, string> = { tab: 'hazard' }
    if (params.teamName) newParams.teamName = params.teamName
    if (params.enterpriseName) newParams.enterpriseName = params.enterpriseName
    if (params.enterpriseIds && params.enterpriseIds.length > 0) newParams.enterpriseIds = params.enterpriseIds.join(',')
    if (params.expertName) newParams.expertName = params.expertName
    if (params.riskLevel && params.riskLevel !== 'all') newParams.riskLevel = params.riskLevel
    if (params.status) newParams.status = params.status
    setSearchParams(newParams)
  }

  // 跳转到企业状态维度并设置筛选条件
  const handleNavigateToState = (params: { teamName?: string; riskLevel?: RiskLevel }) => {
    const newParams: Record<string, string> = { tab: 'state' }
    if (params.teamName) newParams.teamName = params.teamName
    if (params.riskLevel && params.riskLevel !== 'all') newParams.riskLevel = params.riskLevel
    setSearchParams(newParams)
  }

  // KPI 卡片渲染组件
  const KpiCard = ({ selectedKpi, setSelectedKpi, item, accentBar, compact, mom, yoy }: {
    selectedKpi: string | null
    setSelectedKpi: (k: string | null) => void
    item: { key: string; label: string; value: number; unit: string; color: string; tip?: string }
    accentBar?: string
    compact?: boolean
    mom?: number | null
    yoy?: number | null
  }) => {
    const isActive = selectedKpi === item.key

    const formatChange = (val: number | null | undefined): string => {
      if (val == null) return ''
      const sign = val > 0 ? '+' : ''
      return `${sign}${val.toFixed(1)}%`
    }
    const changeColor = (val: number | null | undefined): string => {
      if (val == null) return '#9CA3AF'
      return val > 0 ? '#DC2626' : val < 0 ? '#059669' : '#9CA3AF'
    }
    const changeArrow = (val: number | null | undefined): string => {
      if (val == null) return ''
      return val > 0 ? '↑' : val < 0 ? '↓' : '→'
    }
    const hasComparison = mom != null || yoy != null

    return (
      <div
        key={item.key}
        onClick={() => setSelectedKpi(isActive ? null : item.key)}
        style={{
          flex: compact ? 1 : undefined,
          flexShrink: compact ? undefined : 0,
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          padding: compact ? '6px 6px' : '12px 16px',
          borderRadius: 6,
          border: `1px solid ${isActive ? item.color : 'transparent'}`,
          background: isActive ? '#F9FAFB' : 'transparent',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.15s',
          minWidth: compact ? 60 : 100,
        }}
        title={item.tip || item.label}
      >
        {accentBar && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentBar }} />
        )}
        <div style={{ fontSize: compact ? 10 : 11, color: isActive ? item.color : '#6B7280', marginBottom: compact ? 2 : 4, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {item.label}
          {item.tip && <span style={{ marginLeft: 3, color: '#9CA3AF', fontSize: 10 }}>ⓘ</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: compact ? 18 : 24, fontWeight: 700, color: item.color, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            {item.value}
            <span style={{ fontSize: compact ? 10 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{item.unit}</span>
          </span>
          {hasComparison && (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, fontSize: compact ? 9 : 10, fontWeight: 500, lineHeight: 1.2 }}>
              {mom != null && (
                <span style={{ color: changeColor(mom), whiteSpace: 'nowrap' }}>
                  {changeArrow(mom)}{formatChange(mom)}
                  <span style={{ fontSize: compact ? 8 : 9, color: '#9CA3AF' }}> 月环比</span>
                </span>
              )}
              {yoy != null && (
                <span style={{ color: changeColor(yoy), whiteSpace: 'nowrap' }}>
                  {changeArrow(yoy)}{formatChange(yoy)}
                  <span style={{ fontSize: compact ? 8 : 9, color: '#9CA3AF' }}> 同比</span>
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <PageHeader title="应急消防管理站看板" />
        <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
          加载数据中...
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 顶级页面切换 */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 16,
        borderBottom: '2px solid #E5E7EB',
        background: 'white',
      }}>
        <button
          onClick={() => setSearchParams({})}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: topPage === 'station' ? '2px solid #4F46E5' : '2px solid transparent',
            marginBottom: -2,
            background: 'transparent',
            color: topPage === 'station' ? '#4F46E5' : '#6B7280',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: topPage === 'station' ? 700 : 500,
            whiteSpace: 'nowrap',
          }}
        >
          应急消防管理站看板
        </button>
        <button
          onClick={() => setSearchParams({ page: 'daily' })}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: topPage === 'daily' ? '2px solid #4F46E5' : '2px solid transparent',
            marginBottom: -2,
            background: 'transparent',
            color: topPage === 'daily' ? '#4F46E5' : '#6B7280',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: topPage === 'daily' ? 700 : 500,
            whiteSpace: 'nowrap',
          }}
        >
          日常监管
        </button>
        <button
          onClick={() => setSearchParams({ page: 'yuzhi' })}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: topPage === 'yuzhi' ? '2px solid #4F46E5' : '2px solid transparent',
            marginBottom: -2,
            background: 'transparent',
            color: topPage === 'yuzhi' ? '#4F46E5' : '#6B7280',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: topPage === 'yuzhi' ? 700 : 500,
            whiteSpace: 'nowrap',
          }}
        >
          村社数据看板
        </button>
        <button
          onClick={() => setSearchParams({ page: 'yuzhi-sync' })}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: topPage === 'yuzhi-sync' ? '2px solid #4F46E5' : '2px solid transparent',
            marginBottom: -2,
            background: 'transparent',
            color: topPage === 'yuzhi-sync' ? '#4F46E5' : '#6B7280',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: topPage === 'yuzhi-sync' ? 700 : 500,
            whiteSpace: 'nowrap',
          }}
        >
          三方同步任务看板
        </button>
      </div>

      {topPage === 'daily' ? (
        <>
          <PageHeader title="日常监管" />
          {/* 日常监管 - 全局筛选条件 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            flexWrap: 'wrap',
          }}>
            {/* 村社筛选 */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>村社:</span>
              <select
                value={dailyVillage}
                onChange={e => setDailyVillage(e.target.value)}
                style={dailySelectStyle(dailyVillage !== 'all')}
              >
                <option value="all">全部</option>
                {villages.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

            {/* 风险等级筛选 */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>风险:</span>
              <select
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value as any)}
                style={dailySelectStyle(riskLevel !== 'all')}
              >
                <option value="all">全部</option>
                <option value="major">重大风险</option>
                <option value="high">较大风险</option>
                <option value="medium">一般风险</option>
                <option value="low">低风险</option>
              </select>
            </div>

            <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

            {/* 责任主体类型筛选 */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>责任主体类型:</span>
              <select
                value={filterEntityType}
                onChange={e => setFilterEntityType(e.target.value as any)}
                style={dailySelectStyle(filterEntityType !== 'all')}
              >
                <option value="all">全部</option>
                <option value="production">生产企业</option>
                <option value="venue">消防场所</option>
              </select>
            </div>

            <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

            {/* 消防类型筛选 */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>消防类型:</span>
              <select
                value={filterFireType}
                onChange={e => setFilterFireType(e.target.value as any)}
                style={dailySelectStyle(filterFireType !== 'all')}
              >
                <option value="all">全部</option>
                <option value="fireKey">消防重点单位</option>
                <option value="nineSmall">九小场所</option>
                <option value="general">一般单位</option>
              </select>
            </div>

            <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

            {/* 专家筛选 */}
            <select
              value={filterExpert}
              onChange={e => setFilterExpert(e.target.value)}
              style={{ ...dailySelectStyle(filterExpert !== 'all'), minWidth: 100 }}
            >
              <option value="all">全部专家</option>
              {experts.map(exp => (
                <option key={exp.id} value={exp.name}>{exp.name}</option>
              ))}
            </select>

            {/* 工作组筛选 */}
            <select
              value={filterTeam}
              onChange={e => setFilterTeam(e.target.value)}
              style={{ ...dailySelectStyle(filterTeam !== 'all'), minWidth: 120 }}
            >
              <option value="all">全部工作组</option>
              {workGroups.map(wg => (
                <option key={wg.id} value={wg.name}>{wg.name}</option>
              ))}
            </select>

            {/* 状态筛选 */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>状态:</span>
              <select
                value={dailyStatus}
                onChange={e => setDailyStatus(e.target.value)}
                style={dailySelectStyle(dailyStatus !== 'all')}
              >
                <option value="all">全部</option>
                <option value="在业">在业</option>
                <option value="停产">停产</option>
                <option value="注销">注销</option>
              </select>
            </div>

            {/* 重置筛选 */}
            {(dailyVillage !== 'all' || riskLevel !== 'all' || filterEntityType !== 'all' || filterFireType !== 'all' || filterExpert !== 'all' || filterTeam !== 'all' || dailyStatus !== 'all') && (
              <button
                onClick={() => { setDailyVillage('all'); setRiskLevel('all'); setFilterEntityType('all'); setFilterFireType('all'); setFilterExpert('all'); setFilterTeam('all'); setDailyStatus('all') }}
                style={{
                  padding: '2px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  background: 'white',
                  color: '#6B7280',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                重置
              </button>
            )}
          </div>
          <DailySupervisionDimension
            filters={{ village: dailyVillage, risk: riskLevel, entityType: filterEntityType, fireType: filterFireType, expert: filterExpert, team: filterTeam, status: dailyStatus }}
            options={{ villages, workGroups: workGroups.map(w => w.name), experts: experts.map(e => e.name) }}
          />
        </>
      ) : topPage === 'yuzhi' ? (
        <YuzhiSyncDimension />
      ) : topPage === 'yuzhi-sync' ? (
        <YuzhiSyncDashboard />
      ) : (
        <>
      <PageHeader
        title="应急消防管理站看板"
        actions={
          <button
            onClick={() => setShowChangelog(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB',
              background: '#F9FAFB', color: '#6B7280',
              fontSize: 12, cursor: 'pointer', fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            📝 修改记录
          </button>
        }
      />

      {/* 时间范围筛选（置顶，在指标卡片上方） */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        {/* 时间快捷筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>时间:</span>
          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as TimeRange)}
            style={{
              padding: '2px 8px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              fontSize: 12,
              color: '#6B7280',
              background: 'white',
              outline: 'none',
            }}
          >
            <option value="month">本月</option>
            <option value="prevMonth">上月</option>
            <option value="quarter">本季</option>
            <option value="prevQuarter">上季</option>
            <option value="year">本年</option>
          </select>
          <input
            type="month"
            value={specificMonth}
            onChange={e => setSpecificMonth(e.target.value)}
            style={{
              padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
              fontSize: 12, color: specificMonth ? '#4F46E5' : '#9CA3AF', background: 'white', outline: 'none',
            }}
          />
          {specificMonth && (
            <button
              onClick={() => setSpecificMonth('')}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
                background: 'white', color: '#9CA3AF', fontSize: 11, cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 风险等级筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>风险:</span>
          <select
            value={riskLevel}
            onChange={e => setRiskLevel(e.target.value as any)}
            style={{
              padding: '2px 8px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              fontSize: 12,
              color: riskLevel !== 'all' ? '#4F46E5' : '#6B7280',
              background: 'white',
              outline: 'none',
            }}
          >
            <option value="all">全部</option>
            <option value="major">重大风险</option>
            <option value="high">较大风险</option>
            <option value="medium">一般风险</option>
            <option value="low">低风险</option>
          </select>
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 责任主体类型筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>责任主体类型:</span>
          <select
            value={filterEntityType}
            onChange={e => setFilterEntityType(e.target.value as any)}
            style={{
              padding: '2px 8px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              fontSize: 12,
              color: filterEntityType !== 'all' ? '#4F46E5' : '#6B7280',
              background: 'white',
              outline: 'none',
            }}
          >
            <option value="all">全部</option>
            <option value="production">生产企业</option>
            <option value="venue">消防场所</option>
          </select>
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 状态多选筛选 */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>状态:</span>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{
                padding: '2px 8px',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                background: filterStatuses.length < ENTERPRISE_STATUSES.length ? '#EEF2FF' : 'white',
                color: filterStatuses.length < ENTERPRISE_STATUSES.length ? '#4F46E5' : '#6B7280',
                fontSize: 12,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minWidth: 80,
              }}
            >
              {filterStatuses.length === ENTERPRISE_STATUSES.length ? '全部' : `${filterStatuses.length}项`}
            </button>
          </div>
          {showStatusDropdown && (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setShowStatusDropdown(false)} />
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                background: 'white', border: '1px solid #E5E7EB', borderRadius: 6,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)', padding: '8px 12px', minWidth: 160,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingBottom: 6, borderBottom: '1px solid #F3F4F6' }}>
                  <button
                    onClick={() => setFilterStatuses([...ENTERPRISE_STATUSES])}
                    style={{ padding: '1px 6px', fontSize: 11, border: '1px solid #D1D5DB', borderRadius: 3, background: 'white', color: '#6B7280', cursor: 'pointer' }}
                  >
                    全选
                  </button>
                  <button
                    onClick={() => setFilterStatuses([])}
                    style={{ padding: '1px 6px', fontSize: 11, border: '1px solid #D1D5DB', borderRadius: 3, background: 'white', color: '#6B7280', cursor: 'pointer' }}
                  >
                    清空
                  </button>
                </div>
                {ENTERPRISE_STATUSES.map(s => (
                  <label
                    key={s}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 12, color: '#374151', cursor: 'pointer' }}
                    onClick={() => toggleStatus(s)}
                  >
                    <input type="checkbox" checked={filterStatuses.includes(s)} onChange={() => {}} style={{ width: 14, height: 14, cursor: 'pointer' }} />
                    {s}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 消防类型筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>消防类型:</span>
          <select
            value={filterFireType}
            onChange={e => setFilterFireType(e.target.value as any)}
            style={{
              padding: '2px 8px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              fontSize: 12,
              color: filterFireType !== 'all' ? '#4F46E5' : '#6B7280',
              background: 'white',
              outline: 'none',
            }}
          >
            <option value="all">全部</option>
            <option value="fireKey">消防重点单位</option>
            <option value="nineSmall">九小场所</option>
            <option value="general">一般单位</option>
          </select>
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 工作组筛选 */}
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          style={{
            padding: '2px 8px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 12,
            color: filterTeam !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 120,
          }}
        >
          <option value="all">全部工作组</option>
          {workGroups.map(wg => (
            <option key={wg.id} value={wg.name}>{wg.name}</option>
          ))}
        </select>

        {/* 专家筛选 */}
        <select
          value={filterExpert}
          onChange={e => setFilterExpert(e.target.value)}
          style={{
            padding: '2px 8px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 12,
            color: filterExpert !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 100,
          }}
        >
          <option value="all">全部专家</option>
          {experts.map(exp => (
            <option key={exp.id} value={exp.name}>{exp.name}</option>
          ))}
        </select>

        {/* 重置筛选 */}
        {(filterTeam !== 'all' || filterExpert !== 'all' || filterEntityType !== 'all' || filterFireType !== 'all' || filterStatuses.length < ENTERPRISE_STATUSES.length) && (
          <button
            onClick={() => { setFilterTeam('all'); setFilterExpert('all'); setFilterEntityType('all'); setFilterFireType('all'); setFilterStatuses(['正常', '托管', '歇业中', '未核实']) }}
            style={{
              padding: '2px 8px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              background: 'white',
              color: '#6B7280',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            重置
          </button>
        )}
      </div>

      {/* KPI 指标卡片 - 第一行：安全责任主体 / 检查次数 / 覆盖户数 / 检查单 */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 8,
        alignItems: 'stretch',
      }}>
        {/* 安全责任主体总数 */}
        <div style={{ flex: '0 0 auto', background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #9CA3AF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>安全责任主体总数 ⓘ</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1D4ED8', lineHeight: 1.2 }}>{enterprises.length.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}>家</span></div>
        </div>
        {/* 检查次数组 */}
        <div style={{
          flex: 1,
          border: '1px solid #FED7AA',
          borderRadius: 8,
          background: '#FFF7ED',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}>
          <div style={{ fontSize: 11, color: '#B45309', textAlign: 'center', fontWeight: 600, paddingBottom: 4, borderBottom: '1px dashed #FED7AA', whiteSpace: 'nowrap' }}>
            检查次数 = 日常监管次数 + 监督检查次数
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'checkCount', label: '检查次数', value: 8240, unit: '次', color: '#B45309' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'dailyCheckCount', label: '日常监管次数', value: 5120, unit: '次', color: '#D97706' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'inspectCheckCount', label: '监督检查次数', value: 3120, unit: '次', color: '#92400E' }}
              compact
            />
          </div>
        </div>
        {/* 覆盖户数 */}
        <div style={{ flex: '0 0 auto', background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #9CA3AF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>覆盖户数 ⓘ</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', lineHeight: 1.2 }}>{kpiTotals.enterprise.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}>户</span></div>
        </div>

        {/* 检查单统计组 */}
        <div style={{
          flex: 1,
          border: '1px solid #A7F3D0',
          borderRadius: 8,
          background: '#F0FDF4',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}>
          <div style={{ fontSize: 11, color: '#065F46', textAlign: 'center', fontWeight: 600, paddingBottom: 4, borderBottom: '1px dashed #A7F3D0', whiteSpace: 'nowrap' }}>
            日常监管隐患推送数据统计
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'todoPushEnterprise', label: '检查单推送户数', value: kpiTotals.todoPushEnterpriseCount, unit: '户', color: '#059669' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'todoPushCount', label: '检查单推送次数', value: kpiTotals.todoPushCount, unit: '次', color: '#047857' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'todoClosedCount', label: '检查单办结数量', value: kpiTotals.todoClosedCount, unit: '件', color: '#065F46' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'todoClosureRate', label: '检查单办结率', value: kpiTotals.todoClosureRate, unit: '%', color: '#064E3B' }}
              compact
            />
          </div>
        </div>
      </div>

      {/* KPI 指标卡片 - 第二行：隐患统计 / 重大隐患统计 */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 12,
        alignItems: 'stretch',
      }}>
        {/* 隐患统计组 */}
        <div style={{
          flex: 1,
          border: '1px solid #D1D5DB',
          borderRadius: 8,
          background: '#FAFAFA',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}>
          <div style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', fontWeight: 600, paddingBottom: 4, borderBottom: '1px dashed #E5E7EB', whiteSpace: 'nowrap' }}>
            隐患总数 = 已整改 + 整改中
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'hazard', label: '隐患总数', value: kpiTotals.hazard, unit: '条', color: '#374151', tip: '镇街监督检查发现的隐患总数' }}
              compact
              mom={kpiTotals.hazardMoM}
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'closed', label: '已整改', value: kpiTotals.closed, unit: '条', color: '#059669' }}
              compact
              mom={kpiTotals.closedMoM}
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'inProgress', label: '整改中', value: kpiTotals.inProgress, unit: '条', color: '#D97706' }}
              compact
            />
          </div>
        </div>

        {/* 重大隐患统计组 */}
        <div style={{
          flex: 1,
          border: '1px solid #FECACA',
          borderRadius: 8,
          background: '#FFF5F5',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}>
          <div style={{ fontSize: 11, color: '#991B1B', textAlign: 'center', fontWeight: 600, paddingBottom: 4, borderBottom: '1px dashed #FECACA', whiteSpace: 'nowrap' }}>
            重大隐患总数 = 已整改 + 整改中
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'serious', label: '重大隐患总数', value: kpiTotals.serious, unit: '条', color: '#DC2626' }}
              compact
              mom={kpiTotals.seriousMoM}
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'seriousClosed', label: '重大隐患已整改', value: kpiTotals.seriousClosed, unit: '条', color: '#059669' }}
              compact
              mom={kpiTotals.seriousClosedMoM}
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'seriousInProgress', label: '重大隐患整改中', value: kpiTotals.seriousInProgress, unit: '条', color: '#D97706' }}
              compact
            />
          </div>
        </div>
      </div>

      {/* 维度切换按钮（在筛选区下方） */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 16,
        borderBottom: '2px solid #E5E7EB',
        background: 'white',
      }}>
        {[
          { key: 'duty', label: '组织与人员' },
          { key: 'industry', label: '行业分析' },
          { key: 'special', label: '任务计划' },
          { key: 'state', label: '责任主体分析' },
          { key: 'hazard', label: '隐患详情' },
          { key: 'trend', label: '趋势分析' },
        ].map(tab => {
          const isActive = dimension === tab.key
          return (
            <div key={tab.key} style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => handleDimensionChange(tab.key as Dimension)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                  marginBottom: -2,
                  background: 'transparent',
                  color: isActive ? '#4F46E5' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: isActive ? 0.2 : 0,
                  transition: 'color 0.15s, border-color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
              {tab.key === 'special' && isActive && (
                <button
                  onClick={() => setShowChangelog(true)}
                  title="查看任务计划修改记录"
                  style={{
                    padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6,
                    background: 'white', color: '#9CA3AF', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', marginLeft: 4, marginBottom: -2,
                  }}
                >
                  📝
                </button>
              )}
            </div>
          )
        })}
      </div>

      {dimension === 'duty' && <DutyDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} onNavigateToHazard={handleNavigateToHazard} onNavigateToState={handleNavigateToState} filterEntityType={filterEntityType} />}
      {dimension === 'industry' && <IndustryDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} filterEntityType={filterEntityType} />}
      {dimension === 'special' && <SpecialDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} onNavigateToHazard={handleNavigateToHazard} filterEntityType={filterEntityType} />}
      {dimension === 'state' && <StateDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} filterEntityType={filterEntityType} navigateParams={{
        teamName: searchParams.get('teamName') || undefined,
        enterpriseName: searchParams.get('enterpriseName') || undefined,
      }} />}
      {dimension === 'hazard' && <HazardDimension
        dateRange={dateRange}
        riskLevel={searchParams.get('riskLevel') as any || riskLevel}
        timeRange={timeRange}
        selectedKpi={selectedKpi}
        setSelectedKpi={setSelectedKpi}
        filterEntityType={filterEntityType}
        navigateParams={{
          teamName: searchParams.get('teamName') || undefined,
          enterpriseName: searchParams.get('enterpriseName') || undefined,
          expertName: searchParams.get('expertName') || undefined,
        }}
      />}
      {dimension === 'trend' && <TrendDimension
        filterTeam={filterTeam}
        filterExpert={filterExpert}
        filterEnterprise={filterEnterprise}
        filterIndustry={filterIndustry}
        filterEntityType={filterEntityType}
      />}
        </>
      )}

      {/* ─── 应急消防管理站看板 - 修改记录弹窗 ──────────────────── */}
      {showChangelog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}
          onClick={() => { setShowChangelog(false); setEditingId(null) }}
        >
          <div style={{
            background: 'white', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            width: 520, maxHeight: '70vh', overflow: 'auto', padding: '24px 28px',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>📝 修改记录</div>
                <button
                  onClick={handleNewChangeLog}
                  style={{
                    padding: '3px 10px', fontSize: 12, borderRadius: 4, border: '1px solid #D1D5DB',
                    background: 'white', color: '#4F46E5', cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  + 新增
                </button>
              </div>
              <button
                onClick={() => { setShowChangelog(false); setEditingId(null) }}
                style={{ border: 'none', background: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {changeLogItems.map(item => (
                <div key={item.id} style={{
                  padding: '12px 14px', background: '#F9FAFB', borderRadius: 8,
                  borderLeft: '3px solid #4F46E5',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{item.date}</span>
                      <span style={{
                        fontSize: 11, padding: '1px 8px', borderRadius: 3,
                        background: '#EEF2FF', color: '#4F46E5', fontWeight: 500,
                      }}>
                        {item.location}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => {
                        if (editingId === item.id) {
                          handleSaveChangeLog(item.id)
                        } else {
                          setEditingId(item.id)
                          setEditText(item.content)
                          setEditDate(item.date)
                          setEditLocation(item.location)
                        }
                      }}
                      style={{
                        padding: '2px 8px', fontSize: 11, borderRadius: 4, border: 'none',
                        background: editingId === item.id ? '#4F46E5' : '#EEF2FF',
                        color: editingId === item.id ? 'white' : '#4F46E5',
                        cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      {editingId === item.id ? '保存' : '编辑'}
                    </button>
                    {editingId === item.id && (
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #D1D5DB',
                          background: 'white', color: '#6B7280', cursor: 'pointer', fontWeight: 400,
                        }}
                      >
                        取消
                      </button>
                    )}
                    </div>
                  </div>
                  {editingId === item.id ? (
                    <div>
                      {item.editing && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <input
                            value={editDate}
                            onChange={e => setEditDate(e.target.value)}
                            placeholder="日期 (YYYY-MM-DD)"
                            style={{
                              flex: 1, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4,
                              fontSize: 12, color: '#374151', outline: 'none', fontFamily: 'inherit',
                            }}
                          />
                          <input
                            value={editLocation}
                            onChange={e => setEditLocation(e.target.value)}
                            placeholder="模块名称"
                            style={{
                              flex: 1, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4,
                              fontSize: 12, color: '#374151', outline: 'none', fontFamily: 'inherit',
                            }}
                          />
                        </div>
                      )}
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        placeholder="输入修改内容..."
                        style={{
                          width: '100%', minHeight: 80, padding: '8px 10px',
                          border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13,
                          color: '#374151', lineHeight: 1.6, resize: 'vertical',
                          outline: 'none', fontFamily: 'inherit',
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => { setShowChangelog(false); setEditingId(null) }}
                style={{
                  padding: '6px 20px', border: 'none', borderRadius: 6,
                  background: '#4F46E5', color: 'white', fontSize: 13, cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
