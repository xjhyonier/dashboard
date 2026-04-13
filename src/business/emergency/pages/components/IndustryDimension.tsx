import { useState, useMemo } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { IndustryDimensionProps } from './types'
import { industryHazardAnalysis, enterprises10D } from '../mock/station-chief-v2'

export function IndustryDimension({ dateRange, riskLevel, timeRange, selectedKpi }: IndustryDimensionProps) {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    if (!keyword.trim()) return industryHazardAnalysis
    const kw = keyword.trim().toLowerCase()
    return industryHazardAnalysis.filter(d => d.industry.toLowerCase().includes(kw))
  }, [keyword])

  const total = {
    hazardCount: industryHazardAnalysis.reduce((s, d) => s + d.hazardCount, 0),
    majorHazardCount: industryHazardAnalysis.reduce((s, d) => s + d.majorHazardCount, 0),
    rectifiedCount: industryHazardAnalysis.reduce((s, d) => s + d.rectifiedCount, 0),
    deadlineCount: industryHazardAnalysis.reduce((s, d) => s + d.deadlineCount, 0),
  }

  // 责任主体类型汇总（从 Enterprise10D 按 enterprise_type 聚合）
  const subjectTypes = useMemo(() => {
    const map = new Map<string, { enterpriseCount: number; inspectedCount: number; hazardFound: number; seriousHazard: number; rectified: number; deadline: number; recheck: number; enforcement: number }>()
    enterprises10D.forEach(e => {
      const type = e.enterprise_type
      if (!map.has(type)) map.set(type, { enterpriseCount: 0, inspectedCount: 0, hazardFound: 0, seriousHazard: 0, rectified: 0, deadline: 0, recheck: 0, enforcement: 0 })
      const s = map.get(type)!
      s.enterpriseCount++
      s.inspectedCount += e.inspection_count || 0
      s.hazardFound += (e.hazard_self_check || 0) + (e.hazard_platform || 0)
      s.seriousHazard += e.hazard_major || 0
      if (e.hazard_rectify_status === 'completed') s.rectified++
      if (e.hazard_rectify_status === 'partial') s.deadline++
      if (e.hazard_rectify_status === 'rectifying') s.recheck++
      s.enforcement += e.enforcement_count || 0
    })
    return Array.from(map.entries()).map(([name, s]) => ({ name, ...s }))
  }, [])

  return (
    <div>
      {/* 责任主体类型汇总表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>责任主体类型统计表</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr>
                <th style={thStyle}>责任主体类型</th>
                <th style={thStyle}>企业总数</th>
                <th style={thStyle}>检查企业数</th>
                <th style={thStyle}>发现隐患数</th>
                <th style={thStyle}>重大隐患数</th>
                <th style={thStyle}>已整改数</th>
                <th style={thStyle}>限期整改数</th>
                <th style={thStyle}>复查整改数</th>
                <th style={thStyle}>整改指令书</th>
              </tr>
            </thead>
            <tbody>
              {subjectTypes.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#1F2937' }}>{s.name}</td>
                  <td style={tdStyle}>{s.enterpriseCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={{ ...tdStyle, color: s.hazardFound > 50 ? '#DC2626' : '#374151' }}>{s.hazardFound}</td>
                  <td style={{ ...tdStyle, color: '#DC2626', fontWeight: 600 }}>{s.seriousHazard}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{s.rectified}</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{s.deadline}</td>
                  <td style={tdStyle}>{s.recheck}</td>
                  <td style={tdStyle}>{s.enforcement}</td>
                </tr>
              ))}
              {subjectTypes.length > 0 && (
                <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                  <td style={tdStyle}>{subjectTypes.reduce((sum, s) => sum + s.enterpriseCount, 0)}</td>
                  <td style={tdStyle}>{subjectTypes.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                  <td style={tdStyle}>{subjectTypes.reduce((sum, s) => sum + s.hazardFound, 0)}</td>
                  <td style={{ ...tdStyle, color: '#DC2626' }}>{subjectTypes.reduce((sum, s) => sum + s.seriousHazard, 0)}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{subjectTypes.reduce((sum, s) => sum + s.rectified, 0)}</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{subjectTypes.reduce((sum, s) => sum + s.deadline, 0)}</td>
                  <td style={tdStyle}>{subjectTypes.reduce((sum, s) => sum + s.recheck, 0)}</td>
                  <td style={tdStyle}>{subjectTypes.reduce((sum, s) => sum + s.enforcement, 0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 行业隐患分析表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>行业隐患分析统计表</div>
          <input type="text" placeholder="搜索行业名称" value={keyword} onChange={e => setKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', '行业', '隐患数', '重大隐患', '已整改', '限期整改', '高频问题 Top3', '隐患反弹企业 Top3'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : filtered.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.industry}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: d.hazardCount > 150 ? '#DC2626' : d.hazardCount > 100 ? '#D97706' : '#374151' }}>{d.hazardCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#DC2626' }}>{d.majorHazardCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{d.rectifiedCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#D97706' }}>{d.deadlineCount}</td>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.topIssues.join('、')}</td>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.reboundEnterprises.join('、')}</td>
              </tr>
            ))}
            {filtered.length > 0 && filtered.length < industryHazardAnalysis.length && (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filtered.length} / {industryHazardAnalysis.length} 条</td></tr>
            )}
            {filtered.length === industryHazardAnalysis.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td colSpan={2} style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazardCount}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.majorHazardCount}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.rectifiedCount}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.deadlineCount}</td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
