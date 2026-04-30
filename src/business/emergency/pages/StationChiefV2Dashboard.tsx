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

import { initDatabase, getWorkGroups, getHazards, getEnterpriseStats, getExperts, getEnterprises } from '../../../db'
import type { WorkGroup, Hazard, Expert, Enterprise } from '../../../db/types'

const VALID_DIMENSIONS: Dimension[] = ['duty', 'industry', 'special', 'state', 'hazard', 'trend']

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
      serious: hazardRecords.filter(h => h.level === '重大隐患').length,
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
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
        marginBottom: 12,
        padding: '16px',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 4,
      }}>
        {([
          { key: 'totalEnterprise', label: '监管企业数', value: enterprises.length, unit: '家', color: '#374151', tip: '纳入监管的企业总数' },
          { key: 'enterprise', label: '检查企业',  value: kpiTotals.enterprise, unit: '家', color: '#374151', tip: '远程监管户数（去除停业、虚拟注册等，共8900多）' },
          { key: 'hazard',    label: '隐患总数',  value: kpiTotals.hazard,    unit: '处', color: '#374151', tip: '镇街监督检查过程中发现的隐患总数（日常监管+安全检查+三清三关）= 已整改+整改中' },
          { key: 'serious',   label: '重大隐患',  value: kpiTotals.serious,   unit: '处', color: '#DC2626', tip: '' },
          { key: 'closed',    label: '已整改',    value: kpiTotals.closed,    unit: '处', color: '#059669', tip: '' },
          { key: 'inProgress',label: '整改中',   value: kpiTotals.inProgress,unit: '处', color: '#D97706', tip: '' },
        ] as { key: string; label: string; value: number; unit: string; color: string; tip: string }[]).map(item => {
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
              title={item.tip ? item.tip : '点击筛选，切换维度查看详情'}
            >
              <div style={{ fontSize: 11, color: isActive ? item.color : '#9CA3AF', marginBottom: 4, fontWeight: isActive ? 500 : 400 }}>
                {item.label}
                {item.tip && <span style={{ marginLeft: 3, color: '#9CA3AF', fontSize: 10, cursor: 'help' }}>ⓘ</span>}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
            </div>
          )
        })}
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
          { key: 'state', label: '企业状态' },
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
    </div>
  )
}
