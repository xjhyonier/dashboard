import { useState, useMemo } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { SpecialDimensionProps } from './types'
import { specialInspections } from '../mock/station-chief-v2'

export function SpecialDimension({ dateRange, selectedKpi }: SpecialDimensionProps) {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    if (!keyword.trim()) return specialInspections
    const kw = keyword.trim().toLowerCase()
    return specialInspections.filter(d => d.name.toLowerCase().includes(kw))
  }, [keyword])

  const total = {
    totalCount: specialInspections.reduce((s, d) => s + d.totalCount, 0),
    checkedCount: specialInspections.reduce((s, d) => s + d.checkedCount, 0),
    hazardCount: specialInspections.reduce((s, d) => s + d.hazardCount, 0),
    majorHazardCount: specialInspections.reduce((s, d) => s + d.majorHazardCount, 0),
    rectifiedCount: specialInspections.reduce((s, d) => s + d.rectifiedCount, 0),
    deadlineCount: specialInspections.reduce((s, d) => s + d.deadlineCount, 0),
  }

  return (
    <div>
      {/* 专项检查统计表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>专项检查进度统计表</div>
          <input type="text" placeholder="搜索专项名称" value={keyword} onChange={e => setKeyword(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 4 }}>
        {[
          { label: '专项数', value: specialInspections.length, unit: '个' },
          { label: '覆盖企业', value: total.totalCount, unit: '家' },
          { label: '已检查', value: total.checkedCount, unit: '家' },
          { label: '隐患总数', value: total.hazardCount, unit: '处' },
          { label: '重大隐患', value: total.majorHazardCount, unit: '处' },
          { label: '已整改', value: total.rectifiedCount, unit: '处' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>专项检查进度统计表</div>
          <input type="text" placeholder="搜索专项名称" value={keyword} onChange={e => setKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', '专项检查名称', '开始日期', '结束日期', '覆盖企业', '已检查', '覆盖率', '隐患数', '重大隐患', '已整改', '限期整改', '突出问题', '重点盯防'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={13} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : filtered.map((d, i) => {
              const coverageRate = d.totalCount > 0 ? Math.round((d.checkedCount / d.totalCount) * 100) : 0
              return (
                <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.name}</td>
                  <td style={tdStyle}>{d.startDate}</td>
                  <td style={tdStyle}>{d.endDate}</td>
                  <td style={tdStyle}>{d.totalCount}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{d.checkedCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: coverageRate >= 80 ? '#059669' : coverageRate >= 50 ? '#D97706' : '#DC2626' }}>{coverageRate}%</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: d.hazardCount > 80 ? '#DC2626' : d.hazardCount > 50 ? '#D97706' : '#374151' }}>{d.hazardCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#DC2626' }}>{d.majorHazardCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{d.rectifiedCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#D97706' }}>{d.deadlineCount}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.topIssues.join('、')}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.focusGroups.join('、')}</td>
                </tr>
              )
            })}
            {filtered.length > 0 && filtered.length < specialInspections.length && (
              <tr><td colSpan={13} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filtered.length} / {specialInspections.length} 条</td></tr>
            )}
            {filtered.length === specialInspections.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.totalCount}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.checkedCount}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{Math.round((total.checkedCount / total.totalCount) * 100)}%</td>
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
