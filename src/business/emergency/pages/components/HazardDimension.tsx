import { useState, useMemo } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { HazardDimensionProps } from './types'
import type { HazardStatus } from '../mock/station-chief-v2'
import { hazardRecords } from '../mock/station-chief-v2'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  pending:    { label: '待整改', color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' },
  rectifying: { label: '整改中', color: '#D97706', bg: '#FEF3C7', textColor: '#92400E' },
  rectified:  { label: '已整改', color: '#059669', bg: '#D1FAE5', textColor: '#065F46' },
  overdue:    { label: '已逾期', color: '#DC2626', bg: '#FEE2E2', textColor: '#991B1B' },
}

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  general: { label: '一般隐患', color: '#D97706' },
  safety:  { label: '安全风险', color: '#059669' },
  high:    { label: '较大隐患', color: '#D97706' },
  major:   { label: '重大隐患', color: '#DC2626' },
}

const RISK_CONFIG_FALLBACK = { label: '未知', color: '#6B7280' }

export function HazardDimension({ dateRange, riskLevel, timeRange, selectedKpi, setSelectedKpi, navigateParams }: HazardDimensionProps) {
  // 初始化时使用 navigateParams 作为默认值
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>(navigateParams?.teamName || 'all')
  const [keyword, setKeyword] = useState('')
  const [localStatusFilter, setLocalStatusFilter] = useState<HazardStatus | 'all'>('all')

  // selectedKpi 映射到对应的隐患状态
  const kpiToStatus: Record<string, HazardStatus | null> = {
    serious:   null,
    closed:    'rectified',
    inProgress: 'rectifying',
    deadline:  'pending',
    extended: 'overdue',
    overdue:  'overdue',
  }

  // 优先用局部状态筛选，否则用顶部 KPI 映射的状态
  const statusFilter = localStatusFilter !== 'all' 
    ? localStatusFilter 
    : (selectedKpi ? (kpiToStatus[selectedKpi] || 'all') : 'all')

  // 各状态统计
  const statusCounts = useMemo(() => {
    const counts: Record<HazardStatus, number> = { pending: 0, rectifying: 0, rectified: 0, overdue: 0 }
    hazardRecords.forEach(r => counts[r.status]++)
    return counts
  }, [])

  // 行业列表
  const industries = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.industry))
    return ['all', ...Array.from(set)]
  }, [])

  // 工作组列表
  const teams = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.teamName))
    return ['all', ...Array.from(set)]
  }, [])

  // 风险等级映射：筛选值 → 数据值
  const riskLevelMap: Record<string, string> = {
    major: 'major',
    high: 'high',
    medium: 'safety',
    low: 'general',
  }

  // 计算逾期天数
  const getOverdueDays = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diff = Math.floor((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // 过滤后的隐患列表
  const filtered = useMemo(() => {
    return hazardRecords.filter(r => {
      if (riskLevel !== 'all' && selectedKpi !== 'serious') {
        const mappedLevel = riskLevelMap[riskLevel]
        if (r.riskLevel !== mappedLevel) return false
      }
      if (selectedKpi === 'serious' && r.riskLevel !== 'major') return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (industryFilter !== 'all' && r.industry !== industryFilter) return false
      if (teamFilter !== 'all' && r.teamName !== teamFilter) return false
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        if (!r.enterpriseName.toLowerCase().includes(kw) &&
            !r.hazardDesc.toLowerCase().includes(kw) &&
            !(r.expertName?.toLowerCase().includes(kw))) return false
      }
      return true
    })
  }, [riskLevel, selectedKpi, statusFilter, industryFilter, teamFilter, keyword])

  // 复用排序 hook
  const { sortedData, sort, handleSort } = useSortableTable(filtered, 'recordTime', 'desc')

  const total = hazardRecords.length

  // 列定义
  const columns = [
    { key: 'hazardDesc', label: '隐患描述' },
    { key: 'riskLevel', label: '等级' },
    { key: 'source', label: '来源' },
    { key: 'enterpriseName', label: '企业' },
    { key: 'industry', label: '行业' },
    { key: 'status', label: '状态' },
    { key: 'recordTime', label: '记录时间' },
  ]

  return (
    <div>
      {/* 筛选器 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* 状态筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
            隐患状态 {localStatusFilter !== 'all' && <span style={{ color: '#4F46E5' }}>（已筛选）</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'rectifying', 'rectified', 'overdue'] as const).map(s => {
              const cfg = s === 'all'
                ? { label: '全部', color: '#4F46E5', bg: '#EEF2FF', textColor: '#3730A3' }
                : STATUS_CONFIG[s]
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => {
                    setLocalStatusFilter(s)
                    setSelectedKpi(null)
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${active ? cfg.color : '#D1D5DB'}`,
                    background: active ? cfg.bg : 'white',
                    color: active ? cfg.textColor : '#6B7280',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cfg.label} {s !== 'all' ? `(${statusCounts[s]})` : ''}
                </button>
              )
            })}
          </div>
        </div>

        {/* 行业筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>所属行业</div>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind === 'all' ? '全部行业' : ind}</option>
            ))}
          </select>
        </div>

        {/* 工作组筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>负责工作组</div>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {teams.map(t => (
              <option key={t} value={t}>{t === 'all' ? '全部工作组' : t}</option>
            ))}
          </select>
        </div>

        {/* 关键词搜索 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>关键词搜索</div>
          <input
            type="text"
            placeholder="企业名称 / 隐患描述 / 专家"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 隐患列表 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
          隐患明细列表
          <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
            （{sortedData.length} / {total} 条）
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 950 }}>
            <thead>
              <tr>
                <th style={thStyle}>序号</th>
                {columns.map(col => (
                  <SortableTh
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    sort={sort}
                    onSort={handleSort}
                  />
                ))}
                <th style={thStyle}>整改期限</th>
                <th style={thStyle}>逾期天数</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>未找到匹配结果</td></tr>
              ) : sortedData.map((r, i) => {
                const statusCfg = STATUS_CONFIG[r.status] || { label: '未知', color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' }
                const riskCfg = RISK_CONFIG[r.riskLevel] || RISK_CONFIG_FALLBACK
                const overdueDays = r.status === 'overdue' ? getOverdueDays(r.rectifyDeadline) : null
                const sourceLabel = r.source === 'expert' ? '专家提交' : '自查自纠'
                const sourceColor = r.source === 'expert' ? '#4F46E5' : '#059669'
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 11 }}>{i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151', minWidth: 180 }}>{r.hazardDesc}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: riskCfg.color }}>{riskCfg.label}</td>
                    <td style={{ ...tdStyle, color: sourceColor, fontWeight: 500, fontSize: 11 }}>{sourceLabel}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#6B7280', minWidth: 140 }}>{r.enterpriseName}</td>
                    <td style={tdStyle}>{r.industry}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: statusCfg.bg,
                        color: statusCfg.textColor,
                        fontWeight: 600,
                        fontSize: 11,
                      }}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={tdStyle}>{r.recordTime}</td>
                    <td style={{ ...tdStyle, color: r.status === 'overdue' ? '#DC2626' : '#374151' }}>{r.rectifyDeadline}</td>
                    <td style={{ ...tdStyle, fontWeight: overdueDays ? 600 : 400, color: overdueDays ? '#DC2626' : '#9CA3AF' }}>
                      {overdueDays ? `${overdueDays}天` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
