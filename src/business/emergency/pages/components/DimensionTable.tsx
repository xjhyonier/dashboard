import { useMemo } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { DimensionTableProps } from './types'

export function DimensionTable({ title, data, keyword, onKeywordChange, keywordPlaceholder }: DimensionTableProps) {
  const filtered = useMemo(() => {
    if (!keyword.trim()) return data
    const kw = keyword.trim().toLowerCase()
    return data.filter(d => d.name.toLowerCase().includes(kw))
  }, [keyword, data])

  const total = {
    enterpriseCount: data.reduce((s, d) => s + d.enterpriseCount, 0),
    hazardFound: data.reduce((s, d) => s + d.hazardFound, 0),
    hazardSerious: data.reduce((s, d) => s + d.hazardSerious, 0),
    hazardClosed: data.reduce((s, d) => s + d.hazardClosed, 0),
    overdue: data.reduce((s, d) => s + d.overdue, 0),
    inProgress: data.reduce((s, d) => s + d.inProgress, 0),
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 4 }}>
        {[
          { label: '行业数', value: data.length, unit: '个' },
          { label: '检查企业', value: total.enterpriseCount, unit: '家' },
          { label: '隐患总数', value: total.hazardFound, unit: '处' },
          { label: '重大隐患', value: total.hazardSerious, unit: '处' },
          { label: '已整改', value: total.hazardClosed, unit: '处' },
          { label: '逾期未整改', value: total.overdue, unit: '处' },
          { label: '整改中', value: total.inProgress, unit: '处' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{title}</div>
          <input type="text" placeholder={keywordPlaceholder} value={keyword} onChange={e => onKeywordChange(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['名称', '检查企业', '隐患总数', '重大隐患', '已整改', '整改完成率', '逾期未整改', '整改中'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : filtered.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.name}</td>
                <td style={tdStyle}>{d.enterpriseCount}</td>
                <td style={tdStyle}>{d.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{d.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{d.hazardClosed}</td>
                <td style={tdStyle}>{d.closureRate}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{d.overdue}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{d.inProgress}</td>
              </tr>
            ))}
            {filtered.length > 0 && filtered.length < data.length && (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filtered.length} / {data.length} 条</td></tr>
            )}
            {filtered.length === data.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.enterpriseCount}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.hazardClosed}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{Math.round(total.hazardClosed / total.hazardFound * 100)}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.overdue}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.inProgress}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
