import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import type { Dimension, HazardNavigateParams } from './components/types'

import { DutyDimension } from './components/DutyDimension'
import { StateDimension } from './components/StateDimension'
import { HazardDimension } from './components/HazardDimension'
import { IndustryDimension } from './components/IndustryDimension'
import { SpecialDimension } from './components/SpecialDimension'

import { initDatabase, getWorkGroups, getHazards, getEnterpriseStats } from '../../../db'
import type { WorkGroup, Hazard } from '../../../db/types'

const VALID_DIMENSIONS: Dimension[] = ['duty', 'industry', 'special', 'state', 'hazard']

// 日期工具
const TODAY = new Date()
const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
const monthEnd = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0)
const quarterMonth = Math.floor(TODAY.getMonth() / 3) * 3
const quarterStart = new Date(TODAY.getFullYear(), quarterMonth, 1)
const quarterEnd = new Date(TODAY.getFullYear(), quarterMonth + 3, 0)
const yearStart = new Date(TODAY.getFullYear(), 0, 1)
const yearEnd = new Date(TODAY.getFullYear(), 11, 31)

type TimeRange = 'month' | 'quarter' | 'year' | 'custom'

export function StationChiefV2Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 数据库数据状态
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [hazardRecords, setHazardRecords] = useState<Hazard[]>([])
  const [enterpriseCount, setEnterpriseCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        await initDatabase()
        const [groups, hazards, stats] = await Promise.all([
          getWorkGroups(),
          getHazards(),
          getEnterpriseStats()
        ])
        setWorkGroups(groups)
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

  // 日期筛选状态
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [customStart, setCustomStart] = useState<string>(fmtDate(monthStart))
  const [customEnd, setCustomEnd] = useState<string>(fmtDate(monthEnd))

  // 根据 timeRange 计算实际起止日期
  const dateRange = useMemo((): { start: string; end: string } => {
    switch (timeRange) {
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

  // KPI 汇总数据（全局，不受子维度筛选影响）
  const kpiTotals = useMemo(() => {
    const { start, end } = dateRange
    const inRange = hazardRecords.filter(h => {
      const discoveredAt = h.discovered_at || h.created_at
      return discoveredAt >= start && discoveredAt <= end
    })
    return {
      enterprise: enterpriseCount || workGroups.reduce((s, g) => s + g.enterprise_count, 0),
      hazard: workGroups.reduce((s, g) => s + g.enterprise_count * 2, 0) || hazardRecords.length,
      serious: hazardRecords.filter(h => h.level === 'major').length,
      closed: hazardRecords.filter(h => ['verified', 'closed'].includes(h.status)).length,
      inProgress: hazardRecords.filter(h => h.status === 'rectifying').length,
      deadline: hazardRecords.filter(h => h.status === 'pending' || h.status === 'rectifying').length,
      extended: hazardRecords.filter(h => h.status === 'overdue').length,
      overdue: hazardRecords.filter(h => h.status === 'overdue').length,
    }
  }, [dateRange, workGroups, hazardRecords, enterpriseCount])

  const handleDimensionChange = (key: Dimension) => {
    setSearchParams({ tab: key })
  }

  // 跳转到隐患维度并设置筛选条件
  const handleNavigateToHazard = (params: HazardNavigateParams) => {
    const newParams: Record<string, string> = { tab: 'hazard' }
    if (params.teamName) newParams.teamName = params.teamName
    if (params.enterpriseName) newParams.enterpriseName = params.enterpriseName
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
      <PageHeader title="应急消防管理站看板" />

      {/* KPI 卡片全局置顶 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 12,
        marginBottom: 16,
        padding: '16px',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 4,
      }}>
        {([
          { key: 'enterprise', label: '检查企业',  value: kpiTotals.enterprise, unit: '家', color: '#374151' },
          { key: 'hazard',    label: '隐患总数',  value: kpiTotals.hazard,    unit: '处', color: '#374151' },
          { key: 'serious',   label: '重大隐患',  value: kpiTotals.serious,   unit: '处', color: '#DC2626' },
          { key: 'closed',    label: '已整改',    value: kpiTotals.closed,    unit: '处', color: '#059669' },
          { key: 'inProgress',label: '整改中',   value: kpiTotals.inProgress,unit: '处', color: '#D97706' },
          { key: 'deadline', label: '限期整改数', value: kpiTotals.deadline,  unit: '处', color: '#7C3AED' },
          { key: 'extended',  label: '延期整改数', value: kpiTotals.extended,  unit: '处', color: '#DC2626' },
          { key: 'overdue',   label: '逾期未整改', value: kpiTotals.overdue,  unit: '处', color: '#DC2626' },
        ] as const).map(item => {
          const isActive = selectedKpi === item.key
          return (
            <div
              key={item.key}
              onClick={() => setSelectedKpi(isActive ? null : item.key)}
              style={{
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: 4,
                border: `1px solid ${isActive ? item.color : 'transparent'}`,
                background: isActive ? (item.key === 'enterprise' || item.key === 'hazard' ? '#F3F4F6' : '#FFF') : 'transparent',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.15s',
              }}
              title="点击筛选，切换维度查看详情"
            >
              <div style={{ fontSize: 11, color: isActive ? item.color : '#9CA3AF', marginBottom: 4, fontWeight: isActive ? 500 : 400 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
            </div>
          )
        })}
      </div>

      {/* 维度切换按钮 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'duty', label: '组织与人员' },
          { key: 'industry', label: '行业分析' },
          { key: 'special', label: '任务计划' },
          { key: 'state', label: '企业状态' },
          { key: 'hazard', label: '隐患详情' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleDimensionChange(tab.key as Dimension)}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: dimension === tab.key ? '#4F46E5' : '#D1D5DB',
              background: dimension === tab.key ? '#EEF2FF' : 'white',
              color: dimension === tab.key ? '#4F46E5' : '#6B7280',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 时间范围筛选 */}
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
            { key: 'month' as TimeRange, label: '本月' },
            { key: 'quarter' as TimeRange, label: '本季' },
            { key: 'year' as TimeRange, label: '本年' },
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
          <button
            onClick={() => setTimeRange('custom')}
            style={{
              padding: '2px 8px',
              borderRadius: 3,
              border: '1px solid',
              borderColor: timeRange === 'custom' ? '#4F46E5' : '#E5E7EB',
              background: timeRange === 'custom' ? '#EEF2FF' : 'white',
              color: timeRange === 'custom' ? '#4F46E5' : '#6B7280',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: timeRange === 'custom' ? 600 : 400,
            }}
          >
            自定义
          </button>
          {timeRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                style={{ padding: '2px 6px', border: '1px solid #E5E7EB', borderRadius: 3, fontSize: 12, color: '#374151', outline: 'none' }}
              />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>至</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                style={{ padding: '2px 6px', border: '1px solid #E5E7EB', borderRadius: 3, fontSize: 12, color: '#374151', outline: 'none' }}
              />
            </>
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

        {/* 当前筛选状态 */}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
          {dateRange.start} ~ {dateRange.end}
          {selectedKpi && (
            <span style={{ marginLeft: 8, padding: '1px 6px', background: '#F3F4F6', borderRadius: 3, color: '#7C3AED' }}>
              {{
                enterprise: '检查企业', hazard: '隐患总数', serious: '重大隐患',
                closed: '已整改', inProgress: '整改中', deadline: '限期整改',
                extended: '延期整改', overdue: '逾期未改',
              }[selectedKpi] || selectedKpi}
            </span>
          )}
        </div>
      </div>

      {dimension === 'duty' && <DutyDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} onNavigateToHazard={handleNavigateToHazard} onNavigateToState={handleNavigateToState} />}
      {dimension === 'industry' && <IndustryDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} />}
      {dimension === 'special' && <SpecialDimension dateRange={dateRange} riskLevel={riskLevel} timeRange={timeRange} selectedKpi={selectedKpi} />}
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
    </div>
  )
}
