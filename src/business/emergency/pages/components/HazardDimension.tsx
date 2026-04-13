import { useState, useMemo } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { HazardDimensionProps } from './types'
import type { HazardStatus } from '../mock/station-chief-v2'
import { hazardRecords } from '../mock/station-chief-v2'

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

export function HazardDimension({ dateRange, selectedKpi, setSelectedKpi }: HazardDimensionProps) {
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState('')

  // selectedKpi 映射到对应的隐患状态
  const kpiToStatus: Record<string, HazardStatus | null> = {
    serious:   null,  // 重大隐患按等级不过滤
    closed:    'rectified',
    inProgress: 'rectifying',
    deadline:  'pending',
    extended: 'overdue',
    overdue:  'overdue',
  }

  const statusFilter = selectedKpi ? (kpiToStatus[selectedKpi] || 'all') : 'all'

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

  // 过滤后的隐患列表
  const filtered = useMemo(() => {
    return hazardRecords.filter(r => {
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
  }, [selectedKpi, statusFilter, industryFilter, teamFilter, keyword])

  const total = hazardRecords.length

  return (
    <div>
      {/* 筛选器 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* 状态筛选（受顶部 KPI 控制） */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>隐患状态 {selectedKpi && <span style={{ color: '#7C3AED' }}>（受顶部 KPI 控制）</span>}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'rectifying', 'rectified', 'overdue'] as const).map(s => {
              const cfg = s === 'all'
                ? { label: '全部', color: '#4F46E5', bg: '#EEF2FF', textColor: '#3730A3' }
                : STATUS_CONFIG[s]
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setSelectedKpi(null)}
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
            （{filtered.length} / {total} 条）
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr>
                {['序号', '企业名称', '行业', '负责工作组', '隐患描述', '隐患等级', '记录时间', '整改期限', '整改完成时间', '当前状态', '跟进专家'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>未找到匹配结果</td></tr>
              ) : filtered.map((r, i) => {
                const statusCfg = STATUS_CONFIG[r.status] || { label: '未知', color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' }
                const riskCfg = RISK_CONFIG[r.riskLevel] || RISK_CONFIG_FALLBACK
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937', minWidth: 160 }}>{r.enterpriseName}</td>
                    <td style={tdStyle}>{r.industry}</td>
                    <td style={tdStyle}>{r.teamName}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151', minWidth: 180 }}>{r.hazardDesc}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: riskCfg.color }}>{riskCfg.label}</td>
                    <td style={tdStyle}>{r.recordTime}</td>
                    <td style={{ ...tdStyle, color: r.status === 'overdue' ? '#DC2626' : '#374151' }}>{r.rectifyDeadline}</td>
                    <td style={{ ...tdStyle, color: '#059669' }}>{r.rectifyTime || '—'}</td>
                    <td style={{ ...tdStyle }}>
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
                    <td style={{ ...tdStyle, color: '#6B7280' }}>{r.expertName || '—'}</td>
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
