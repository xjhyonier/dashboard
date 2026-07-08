import { useState } from 'react'
import { PageShell, PageHeader, SectionBlock } from '../../../components/layout'

// ─── 表2数据：14项已同步任务分析 ────────────────────────────────────────
interface SyncRow {
  status: string
  destination: string
  exception: string
  count: number
  percent: string
  isSubtotal?: boolean
  isTotal?: boolean
}

const SYNC_ROWS: SyncRow[] = [
  { status: '已创建', destination: '村社任务', exception: '无异常，余智护杭任务已同步至村社/镇街', count: 2664, percent: '19.21%' },
  { status: '检查完成', destination: '村社任务', exception: '无异常，余智护杭任务已同步至村社/镇街，并在一起安完成了检查', count: 2379, percent: '17.16%' },
  { status: '数据校验异常', destination: '村社任务', exception: '企业已开通一起安平台，但不在村社底数内，请在村社底数中录入', count: 1506, percent: '10.86%' },
  { status: '数据校验异常', destination: '村社任务', exception: '该企业所在部门没有检查人员', count: 314, percent: '2.26%' },
  { status: '数据校验异常', destination: '村社任务', exception: '任务明细未匹配到村社', count: 110, percent: '0.79%' },
  { status: '数据校验异常', destination: '村社任务', exception: '该企业所在部门有检查人员,但是不在浙政钉内,部门名称：亿丰时代网格', count: 24, percent: '0.17%' },
  { status: '数据校验异常', destination: '村社任务', exception: '该企业所在部门有检查人员,但是不在浙政钉内,部门名称：严村里网格', count: 8, percent: '0.06%' },
  { status: '', destination: '', exception: '小计', count: 7005, percent: '', isSubtotal: true },
  { status: '已创建', destination: '镇街任务', exception: '无异常，余智护杭任务已同步至村社/镇街', count: 195, percent: '1.41%' },
  { status: '数据校验异常', destination: '镇街任务', exception: '企业没在镇街组织：良渚应急消防管理站', count: 3, percent: '0.02%' },
  { status: '数据校验异常', destination: '镇街任务', exception: '镇街企业没有检查人员', count: 1, percent: '0.01%' },
  { status: '', destination: '', exception: '小计', count: 199, percent: '', isSubtotal: true },
  { status: '数据校验异常', destination: '未知分配去向', exception: '企业尚未开通一起安平台，请在村社底数中录入', count: 6661, percent: '48.04%' },
  { status: '', destination: '', exception: '小计', count: 6661, percent: '', isSubtotal: true },
  { status: '', destination: '', exception: '总计', count: 13865, percent: '', isTotal: true },
]

// ─── 通用样式 ─────────────────────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: '6px 8px',
  background: '#F3F4F6',
  fontWeight: 600,
  fontSize: 12,
  color: '#374151',
  borderBottom: '2px solid #E5E7EB',
  borderRight: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
  textAlign: 'center',
}

const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '5px 8px',
  fontSize: 12,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  borderRight: '1px solid #F3F4F6',
  verticalAlign: 'middle',
  ...extra,
})

export function YuzhiSyncDashboard() {
  const [syncTimeFilter, setSyncTimeFilter] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'>('thisYear')
  const [syncMonthFrom, setSyncMonthFrom] = useState(`${new Date().getFullYear()}-01`)
  const [syncMonthTo, setSyncMonthTo] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)

  const exportSyncDetail = () => {
    const header = '状态,任务去向,异常信息,任务数,占比'
    const dataRows = SYNC_ROWS
      .filter(r => !r.isSubtotal && !r.isTotal)
      .map(r => `"${r.status}","${r.destination}","${r.exception}",${r.count},"${r.percent}"`)
    const BOM = '\uFEFF'
    const csv = BOM + header + '\n' + dataRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `余智护杭任务同步明细_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageShell>
      <PageHeader
        title="三方同步任务看板"
        updateTime={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:00`}
      />

      {/* 时间筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>月份:</span>
        {([
          { key: 'thisMonth' as const, label: '本月' },
          { key: 'lastMonth' as const, label: '上月' },
          { key: 'thisYear' as const, label: '本年' },
          { key: 'lastYear' as const, label: '上年' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => {
              setSyncTimeFilter(opt.key)
              const now = new Date()
              let from: string, to: string
              switch (opt.key) {
                case 'thisMonth':
                  from = to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                  break
                case 'lastMonth': {
                  const d = new Date(now.getFullYear(), now.getMonth(), 0)
                  from = to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                  break
                }
                case 'thisYear':
                  from = `${now.getFullYear()}-01`
                  to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                  break
                case 'lastYear':
                  from = `${now.getFullYear() - 1}-01`
                  to = `${now.getFullYear() - 1}-12`
                  break
              }
              setSyncMonthFrom(from)
              setSyncMonthTo(to)
            }}
            style={{
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: syncTimeFilter === opt.key ? '#3B82F6' : '#E5E7EB',
              background: syncTimeFilter === opt.key ? '#EFF6FF' : 'white',
              color: syncTimeFilter === opt.key ? '#3B82F6' : '#6B7280',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: syncTimeFilter === opt.key ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
        <input
          type="month"
          value={syncMonthFrom}
          onChange={e => setSyncMonthFrom(e.target.value)}
          style={{
            padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', background: 'white', outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
        <input
          type="month"
          value={syncMonthTo}
          onChange={e => setSyncMonthTo(e.target.value)}
          style={{
            padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', background: 'white', outline: 'none',
          }}
        />
      </div>

      <SectionBlock title="">
        {/* 顶部统计栏 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 0',
        }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#D1FAE5' }} />
              <span style={{ color: '#374151' }}>正常同步 5,238（37.78%）</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FEE2E2' }} />
              <span style={{ color: '#374151' }}>数据校验异常 8,627（62.22%）</span>
            </div>
          </div>
          <button
            onClick={exportSyncDetail}
            style={{
              padding: '4px 14px',
              border: '1px solid #4F46E5',
              borderRadius: 4,
              background: 'white',
              color: '#4F46E5',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            导出明细
          </button>
        </div>

        {/* 数据表格 */}
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', width: 100 }}>任务来源</th>
                <th style={{ ...th, textAlign: 'left', width: 110 }}>任务去向</th>
                <th style={{ ...th, textAlign: 'left', width: 100 }}>状态</th>
                <th style={{ ...th, textAlign: 'left' }}>状态解释</th>
                <th style={{ ...th, width: 80 }}>任务数</th>
                <th style={{ ...th, width: 80, borderRight: 'none' }}>占比</th>
              </tr>
            </thead>
            <tbody>
              {SYNC_ROWS.filter(r => !r.isSubtotal).map((row, i) => {
                if (row.isTotal) {
                  return (
                    <tr key={i} style={{ background: '#F9FAFB', fontWeight: 700 }}>
                      <td colSpan={4} style={{ ...td({ fontWeight: 700, color: '#111827', fontSize: 13 }) }}>总计</td>
                      <td style={{ ...td({ textAlign: 'center', fontWeight: 700, color: '#111827', fontSize: 14 }) }}>{row.count.toLocaleString()}</td>
                      <td style={{ ...td({ borderRight: 'none' }) }}></td>
                    </tr>
                  )
                }

                const isAbnormal = row.status === '数据校验异常'
                const rowBg = isAbnormal ? '#FFFBFB' : '#FAFFFE'

                return (
                  <tr key={i} style={{ background: rowBg }}>
                    <td style={td({ whiteSpace: 'nowrap', color: '#374151', fontWeight: 500 })}>余智护杭</td>
                    <td style={td({ whiteSpace: 'nowrap', color: '#374151' })}>
                      {row.destination && (
                        <span style={{
                          display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 12,
                          background: row.destination === '镇街任务' ? '#EFF6FF' : row.destination === '未知分配去向' ? '#F3F4F6' : '#F0FDF4',
                          color: row.destination === '镇街任务' ? '#1E40AF' : row.destination === '未知分配去向' ? '#6B7280' : '#166534',
                        }}>
                          {row.destination}
                        </span>
                      )}
                    </td>
                    <td style={{ ...td({ verticalAlign: 'top', whiteSpace: 'nowrap' }) }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                          fontSize: 12, fontWeight: 600,
                          background: isAbnormal ? '#FEE2E2' : '#D1FAE5',
                          color: isAbnormal ? '#991B1B' : '#065F46',
                        }}>
                          {row.status}
                        </span>
                    </td>
                    <td style={td({ color: isAbnormal ? '#DC2626' : '#374151' })}>{row.exception}</td>
                    <td style={td({ textAlign: 'center', fontWeight: 600, color: isAbnormal ? '#DC2626' : '#059669' })}>
                      {row.count.toLocaleString()}
                    </td>
                    <td style={{ ...td({ textAlign: 'center', fontWeight: 600, color: isAbnormal ? '#EF4444' : '#059669', borderRight: 'none' }) }}>
                      {row.percent}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 任务来源说明 */}
        <div style={{ marginTop: 20, padding: '14px 18px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
            任务来源
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            余智护杭目前已同步任务清单：
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 12, color: '#6B7280', lineHeight: 1.8 }}>
            <div>1. 应急消防一般风险安全检查</div>
            <div>2. 应急消防较大风险安全检查</div>
            <div>3. 应急消防重大风险安全检查</div>
            <div>4. 九小场所安全检查（小网吧/电竞小站）</div>
            <div>5. 九小场所安全检查（小医院/小诊所/小托育机构）</div>
            <div>6. 低风险安全检查</div>
            <div>7. 九小场所安全检查（小餐饮场所）</div>
            <div>8. 九小场所安全检查（小美容洗浴场所）</div>
            <div>9. 九小场所安全检查（小生产加工企业）</div>
            <div>10. 九小场所安全检查（小歌舞娱乐场所）</div>
            <div>11. 九小场所安全检查（小旅馆）</div>
            <div>12. 九小场所安全检查（小学校、小幼儿园）</div>
            <div>13. 九小场所安全检查（小商店）</div>
            <div>14. 九小场所安全检查（其他）</div>
          </div>
        </div>
      </SectionBlock>
    </PageShell>
  )
}
