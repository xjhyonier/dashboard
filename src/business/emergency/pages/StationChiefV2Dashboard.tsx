import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import type { Dimension, HazardNavigateParams, RiskLevel } from './components/types'

import { DutyDimension } from './components/DutyDimension'
import { StateDimension } from './components/StateDimension'
import { HazardDimension } from './components/HazardDimension'
import { IndustryDimension } from './components/IndustryDimension'
import { SpecialDimension } from './components/SpecialDimension'
import { TrendDimension } from './components/TrendDimension'
import { YuzhiSyncDimension } from './components/YuzhiSyncDimension'

import { initDatabase, getWorkGroups, getHazards, getEnterpriseStats, getExperts, getEnterprises } from '../../../db'
import type { WorkGroup, Hazard, Expert, Enterprise } from '../../../db/types'

const VALID_DIMENSIONS: Dimension[] = ['duty', 'industry', 'special', 'state', 'hazard', 'trend', 'yuzhi']

// 顶级页面标识
type TopLevelPage = 'station' | 'yuzhi'

// 日期工具
const TODAY = new Date()
const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom'

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
  const topPage: TopLevelPage = searchParams.get('page') === 'yuzhi' ? 'yuzhi' : 'station'

  // 日期筛选状态
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [customStart, setCustomStart] = useState<string>(fmtDate(monthStart))
  const [customEnd, setCustomEnd] = useState<string>(fmtDate(monthEnd))

  // 根据 timeRange 计算实际起止日期
  const dateRange = useMemo((): { start: string; end: string } => {
    switch (timeRange) {
      case 'week':    return { start: fmtDate(weekStart),    end: fmtDate(weekEnd) }
      case 'month':   return { start: fmtDate(monthStart),   end: fmtDate(monthEnd) }
      case 'quarter': return { start: fmtDate(quarterStart), end: fmtDate(quarterEnd) }
      case 'year':    return { start: fmtDate(yearStart),    end: fmtDate(yearEnd) }
      case 'custom':  return { start: customStart, end: customEnd }
    }
  }, [timeRange, customStart, customEnd])

  // 全局 KPI 筛选状态
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null)

  // 风险等级筛选状态
  const [riskLevel, setRiskLevel] = useState<'all' | 'major' | 'high' | 'medium' | 'low'>('all')

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
    // 月同比：去年同月
    const lyStart = fmtDate(new Date(TODAY.getFullYear() - 1, TODAY.getMonth(), 1))
    const lyEnd = fmtDate(new Date(TODAY.getFullYear() - 1, TODAY.getMonth() + 1, 0))
    const lastYear = hazardRecords.filter(h => {
      const discoveredAt = h.discovered_at || h.created_at
      return discoveredAt >= lyStart && discoveredAt <= lyEnd
    })

    const currentHazard = closedCount + inProgressCount
    const currentSerious = seriousClosed + seriousInProgress

    const prevMonthHazard = prevMonth.length
    const prevMonthSerious = prevMonth.filter(h => h.level === '重大隐患').length
    const lastYearHazard = lastYear.length
    const lastYearSerious = lastYear.filter(h => h.level === '重大隐患').length

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
      // 月环比 / 月同比
      hazardMoM: calcChange(currentHazard, prevMonthHazard),
      hazardYoY: calcChange(currentHazard, lastYearHazard),
      seriousMoM: calcChange(currentSerious, prevMonthSerious),
      seriousYoY: calcChange(currentSerious, lastYearSerious),
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
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: compact ? 18 : 24, fontWeight: 700, color: item.color, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{item.value}</span>
          {hasComparison && (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, fontSize: compact ? 9 : 10, fontWeight: 500, lineHeight: 1.2 }}>
              {mom != null && (
                <span style={{ color: changeColor(mom), whiteSpace: 'nowrap' }}>
                  {changeArrow(mom)}{formatChange(mom)}
                  <span style={{ fontSize: compact ? 8 : 9, color: '#9CA3AF' }}> 环比</span>
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
        <div style={{ fontSize: compact ? 10 : 11, color: '#9CA3AF', marginTop: 2 }}>{item.unit}</div>
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
      </div>

      {topPage === 'yuzhi' ? (
        <YuzhiSyncDimension />
      ) : (
        <>
      <PageHeader title="应急消防管理站看板" />

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
          {([
            { key: 'week' as TimeRange, label: '本周' },
            { key: 'month' as TimeRange, label: '本月' },
            { key: 'quarter' as TimeRange, label: '本季' },
            { key: 'year' as TimeRange, label: '本年' },
            { key: 'custom' as TimeRange, label: '自定义' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeRange(opt.key)}
              style={{
                padding: '2px 8px',
                borderRadius: 3,
                border: '1px solid',
                borderColor: timeRange === opt.key ? '#4F46E5' : '#E5E7EB',
                background: timeRange === opt.key ? '#EEF2FF' : 'white',
                color: timeRange === opt.key ? '#4F46E5' : '#6B7280',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: timeRange === opt.key ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
          {/* 自定义日期输入 */}
          {timeRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{ padding: '1px 6px', border: '1px solid #D1D5DB', borderRadius: 3, fontSize: 12, color: '#374151', outline: 'none' }}
              />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>至</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{ padding: '1px 6px', border: '1px solid #D1D5DB', borderRadius: 3, fontSize: 12, color: '#374151', outline: 'none' }}
              />
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 风险等级筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>风险:</span>
          {([
            { key: 'all' as const, label: '全部' },
            { key: 'major' as const, label: '重大风险' },
            { key: 'high' as const, label: '较大风险' },
            { key: 'medium' as const, label: '一般风险' },
            { key: 'low' as const, label: '低风险' },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setRiskLevel(opt.key)}
              style={{
                padding: '2px 8px',
                borderRadius: 3,
                border: '1px solid',
                borderColor: riskLevel === opt.key ? '#4F46E5' : '#E5E7EB',
                background: riskLevel === opt.key ? '#EEF2FF' : 'white',
                color: riskLevel === opt.key ? '#4F46E5' : '#6B7280',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: riskLevel === opt.key ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 工作组筛选 */}
        <select
          value={filterTeam}
          onChange={e => { setFilterTeam(e.target.value); setFilterEnterprise('all') }}
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

        {/* 企业筛选 */}
        <select
          value={filterEnterprise}
          onChange={e => setFilterEnterprise(e.target.value)}
          style={{
            padding: '2px 8px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 12,
            color: filterEnterprise !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 160,
          }}
        >
          <option value="all">全部企业</option>
          {enterprises
            .filter(e => filterTeam === 'all' || e.work_group === filterTeam)
            .map(ent => (
              <option key={ent.id} value={ent.id}>{ent.name}</option>
            ))}
        </select>

        {/* 行业筛选 */}
        <select
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          style={{
            padding: '2px 8px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 12,
            color: filterIndustry !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 100,
          }}
        >
          <option value="all">全部行业</option>
          {[...new Set(enterprises.map(e => e.industry).filter(Boolean))].map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>

        {/* 重置筛选 */}
        {(filterTeam !== 'all' || filterExpert !== 'all' || filterEnterprise !== 'all' || filterIndustry !== 'all') && (
          <button
            onClick={() => { setFilterTeam('all'); setFilterExpert('all'); setFilterEnterprise('all'); setFilterIndustry('all') }}
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

      {/* KPI 指标卡片（在筛选区下方、tab 切换上方） */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 12,
        alignItems: 'stretch',
      }}>
        {/* 安全责任主体总数 */}
        <KpiCard
          selectedKpi={selectedKpi}
          setSelectedKpi={setSelectedKpi}
          item={{ key: 'safetySubject', label: '安全责任主体总数', value: enterprises.length, unit: '家', color: '#1D4ED8', tip: '纳入安全监管的企业（安全责任主体）总数' }}
          accentBar="#3B82F6"
        />
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
        <KpiCard
          selectedKpi={selectedKpi}
          setSelectedKpi={setSelectedKpi}
          item={{ key: 'enterprise', label: '覆盖户数', value: kpiTotals.enterprise, unit: '户', color: '#374151', tip: '远程监管户数（去除停业、虚拟注册等，共8900多）' }}
        />

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
            检查单统计
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
              item={{ key: 'hazard', label: '隐患总数', value: kpiTotals.hazard, unit: '处', color: '#374151', tip: '镇街监督检查发现的隐患总数' }}
              compact
              mom={kpiTotals.hazardMoM}
              yoy={kpiTotals.hazardYoY}
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'closed', label: '已整改', value: kpiTotals.closed, unit: '处', color: '#059669' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'inProgress', label: '整改中', value: kpiTotals.inProgress, unit: '处', color: '#D97706' }}
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
              item={{ key: 'serious', label: '重大隐患总数', value: kpiTotals.serious, unit: '处', color: '#DC2626' }}
              compact
              mom={kpiTotals.seriousMoM}
              yoy={kpiTotals.seriousYoY}
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'seriousClosed', label: '重大隐患已整改', value: kpiTotals.seriousClosed, unit: '处', color: '#059669' }}
              compact
            />
            <KpiCard
              selectedKpi={selectedKpi}
              setSelectedKpi={setSelectedKpi}
              item={{ key: 'seriousInProgress', label: '重大隐患整改中', value: kpiTotals.seriousInProgress, unit: '处', color: '#D97706' }}
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
            <button
              key={tab.key}
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
          )
        })}
      </div>

      {dimension === 'duty' && <DutyDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} onNavigateToHazard={handleNavigateToHazard} onNavigateToState={handleNavigateToState} />}
      {dimension === 'industry' && <IndustryDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} />}
      {dimension === 'special' && <SpecialDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} onNavigateToHazard={handleNavigateToHazard} />}
      {dimension === 'state' && <StateDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} navigateParams={{
        teamName: searchParams.get('teamName') || undefined,
        enterpriseName: searchParams.get('enterpriseName') || undefined,
      }} />}
      {dimension === 'hazard' && <HazardDimension
        dateRange={dateRange}
        riskLevel={searchParams.get('riskLevel') as any || riskLevel}
        timeRange={timeRange}
        selectedKpi={selectedKpi}
        setSelectedKpi={setSelectedKpi}
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
      />}
        </>
      )}
    </div>
  )
}
