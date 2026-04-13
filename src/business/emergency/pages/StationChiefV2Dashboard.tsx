import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import type { Dimension } from './components/types'

import { DutyDimension } from './components/DutyDimension'
import { StateDimension } from './components/StateDimension'
import { HazardDimension } from './components/HazardDimension'
import { IndustryDimension } from './components/IndustryDimension'
import { SpecialDimension } from './components/SpecialDimension'

import {
  workGroups,
  hazardRecords,
} from './mock/station-chief-v2'

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

  // KPI 汇总数据（全局，不受子维度筛选影响）
  const kpiTotals = useMemo(() => {
    const { start, end } = dateRange
    const inRange = hazardRecords.filter(r => r.recordTime >= start && r.recordTime <= end)
    return {
      enterprise: workGroups.reduce((s, g) => s + g.enterpriseCount, 0),
      hazard: workGroups.reduce((s, g) => s + g.hazardFound, 0),
      serious: workGroups.reduce((s, g) => s + g.hazardSerious, 0),
      closed: inRange.filter(r => r.status === 'rectified').length,
      inProgress: workGroups.reduce((s, g) => s + g.inProgress, 0),
      deadline: inRange.filter(r => r.status === 'pending' || r.status === 'rectifying').length,
      extended: inRange.filter(r => r.status === 'overdue').length,
      overdue: workGroups.reduce((s, g) => s + g.overdueUnrectified, 0),
    }
  }, [dateRange])

  const handleDimensionChange = (key: Dimension) => {
    setSearchParams({ tab: key })
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
          { key: 'duty', label: '履职' },
          { key: 'industry', label: '行业' },
          { key: 'special', label: '专项' },
          { key: 'state', label: '状态' },
          { key: 'hazard', label: '隐患' },
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
            { key: 'all', label: '全部' },
            { key: 'major', label: '重大' },
            { key: 'high', label: '较大' },
            { key: 'medium', label: '一般' },
            { key: 'low', label: '低' },
          ] as const).map(opt => (
            <button
              key={opt.key}
              onClick={() => {}}
              style={{
                padding: '2px 8px',
                borderRadius: 3,
                border: '1px solid',
                borderColor: '#E5E7EB',
                background: 'white',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: 12,
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

      {dimension === 'duty' && <DutyDimension dateRange={dateRange} selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} />}
      {dimension === 'industry' && <IndustryDimension dateRange={dateRange} selectedKpi={selectedKpi} />}
      {dimension === 'special' && <SpecialDimension dateRange={dateRange} selectedKpi={selectedKpi} />}
      {dimension === 'state' && <StateDimension dateRange={dateRange} />}
      {dimension === 'hazard' && <HazardDimension dateRange={dateRange} selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} />}
    </div>
  )
}
