import { useState, useMemo } from 'react'

// ─── 表1数据：14项已同步任务分析 ────────────────────────────────────────
interface SyncRow {
  status: string      // 状态（分组标题行）
  destination: string // 任务去向
  exception: string   // 异常信息
  count: number
  percent: string
  isSubtotal?: boolean
  isTotal?: boolean
  subtotalCount?: number
}

const SYNC_ROWS: SyncRow[] = [
  // 已创建
  { status: '已创建', destination: '村社任务', exception: '无异常', count: 2664, percent: '50.86%' },
  { status: '', destination: '镇街任务', exception: '无异常', count: 195, percent: '3.72%' },
  // 检查完成
  { status: '检查完成', destination: '村社任务', exception: '无异常', count: 2379, percent: '45.42%' },
  // 小计1
  { status: '', destination: '', exception: '小计', count: 5238, percent: '', isSubtotal: true, subtotalCount: 5238 },
  // 数据校验异常
  { status: '数据校验异常', destination: '未知分配去向', exception: '企业在底数中不存在', count: 6661, percent: '77.21%' },
  { status: '', destination: '村社任务', exception: '该社会信用代码不在承租单位内', count: 1506, percent: '17.46%' },
  { status: '', destination: '', exception: '该企业所在部门没有检查人员', count: 314, percent: '3.64%' },
  { status: '', destination: '', exception: '任务明细未匹配到村社', count: 110, percent: '1.28%' },
  { status: '', destination: '', exception: '该企业所在部门有检查人员,但是不在浙政钉内,部门名称：亿丰时代网格', count: 24, percent: '0.28%' },
  { status: '', destination: '', exception: '该企业所在部门有检查人员,但是不在浙政钉内,部门名称：严村里网格', count: 8, percent: '0.09%' },
  { status: '', destination: '镇街任务', exception: '企业没在镇街组织：良渚应急消防管理站', count: 3, percent: '0.03%' },
  { status: '', destination: '', exception: '镇街企业没有检查人员', count: 1, percent: '0.01%' },
  // 小计2
  { status: '', destination: '', exception: '小计', count: 8627, percent: '', isSubtotal: true, subtotalCount: 8627 },
  // 总计
  { status: '', destination: '', exception: '总计', count: 13865, percent: '', isTotal: true },
]

// ─── 表2数据：村社检查任务统计 ────────────────────────────────────────────
interface VillageRow {
  village: string
  total: number
  done: number
  rate: string
  isTotal?: boolean
}

const VILLAGE_ROWS: VillageRow[] = [
  { village: '安溪村', total: 31, done: 4, rate: '12.90%' },
  { village: '白洋里社区', total: 9, done: 0, rate: '0.00%' },
  { village: '北宸社区', total: 434, done: 151, rate: '34.79%' },
  { village: '北秀社区', total: 48, done: 0, rate: '0.00%' },
  { village: '博园社区', total: 61, done: 3, rate: '4.92%' },
  { village: '昌运社区', total: 55, done: 12, rate: '21.82%' },
  { village: '崇福社区', total: 73, done: 0, rate: '0.00%' },
  { village: '杜城村', total: 65, done: 0, rate: '0.00%' },
  { village: '杜甫村', total: 31, done: 0, rate: '0.00%' },
  { village: '港南村', total: 13, done: 12, rate: '92.31%' },
  { village: '勾庄村', total: 96, done: 0, rate: '0.00%' },
  { village: '管家塘社区', total: 105, done: 36, rate: '34.29%' },
  { village: '杭运社区', total: 16, done: 8, rate: '50.00%' },
  { village: '金家渡社区', total: 439, done: 0, rate: '0.00%' },
  { village: '聚贤社区', total: 162, done: 133, rate: '82.10%' },
  { village: '良港村', total: 54, done: 40, rate: '74.07%' },
  { village: '良渚文化村社区', total: 317, done: 225, rate: '70.98%' },
  { village: '米行桥社区', total: 81, done: 56, rate: '69.14%' },
  { village: '铭雅社区', total: 395, done: 106, rate: '26.84%' },
  { village: '南庄兜村', total: 15, done: 4, rate: '26.67%' },
  { village: '七贤桥村', total: 142, done: 38, rate: '26.76%' },
  { village: '亲亲家园社区', total: 87, done: 1, rate: '1.15%' },
  { village: '施家湾社区', total: 147, done: 56, rate: '38.10%' },
  { village: '石桥村', total: 35, done: 9, rate: '25.71%' },
  { village: '通运社区', total: 105, done: 30, rate: '28.57%' },
  { village: '万年桥社区', total: 59, done: 0, rate: '0.00%' },
  { village: '吴家厍社区', total: 56, done: 49, rate: '87.50%' },
  { village: '西塘河村', total: 26, done: 0, rate: '0.00%' },
  { village: '西塘雅苑社区', total: 26, done: 25, rate: '96.15%' },
  { village: '小洋坝社区', total: 55, done: 52, rate: '94.55%' },
  { village: '新港村', total: 13, done: 9, rate: '69.23%' },
  { village: '新桥社区', total: 22, done: 0, rate: '0.00%' },
  { village: '新溪社区', total: 34, done: 5, rate: '14.71%' },
  { village: '行宫塘村', total: 75, done: 4, rate: '5.33%' },
  { village: '荀山村', total: 147, done: 31, rate: '21.09%' },
  { village: '逸居城社区', total: 30, done: 7, rate: '23.33%' },
  { village: '玉创社区', total: 121, done: 114, rate: '94.21%' },
  { village: '玉鸟社区', total: 8, done: 6, rate: '75.00%' },
  { village: '玉泽社区', total: 73, done: 26, rate: '35.62%' },
  { village: '越秀社区', total: 134, done: 46, rate: '34.33%' },
  { village: '运河村', total: 54, done: 19, rate: '35.19%' },
  { village: '长桥社区', total: 77, done: 62, rate: '80.52%' },
  { village: '棕榈湾社区', total: 85, done: 68, rate: '80.00%' },
  { village: '大陆村', total: 13, done: 13, rate: '100.00%' },
  { village: '东莲村', total: 49, done: 49, rate: '100.00%' },
  { village: '东塘河村', total: 20, done: 20, rate: '100.00%' },
  { village: '勾庄治理中心', total: 440, done: 440, rate: '100.00%' },
  { village: '良渚治理中心', total: 360, done: 360, rate: '100.00%' },
  { village: '纤石村', total: 48, done: 48, rate: '100.00%' },
  { village: '小洋坝村', total: 2, done: 2, rate: '100.00%' },
  { village: '合计', total: 5043, done: 2379, rate: '47.18%', isTotal: true },
]

// ─── 通用样式 ─────────────────────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: '8px 12px',
  background: '#F3F4F6',
  fontWeight: 600,
  fontSize: 13,
  color: '#374151',
  borderBottom: '2px solid #E5E7EB',
  borderRight: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
  textAlign: 'center',
}
const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '7px 12px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  borderRight: '1px solid #F3F4F6',
  verticalAlign: 'middle',
  ...extra,
})

function rateColor(rate: string): string {
  const n = parseFloat(rate)
  if (n === 100) return '#059669'
  if (n >= 80) return '#10B981'
  if (n >= 50) return '#F59E0B'
  if (n >= 20) return '#EF4444'
  return '#DC2626'
}

// 进度条
function RateBar({ rate }: { rate: string }) {
  const n = parseFloat(rate)
  const color = rateColor(rate)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, minWidth: 60 }}>
        <div style={{ width: `${Math.min(n, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 44, textAlign: 'right' }}>{rate}</span>
    </div>
  )
}

export function YuzhiSyncDimension() {
  const [villageKeyword, setVillageKeyword] = useState('')
  const [sortBy, setSortBy] = useState<'village' | 'total' | 'done' | 'rate'>('village')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir(col === 'village' ? 'asc' : 'desc')
    }
  }

  const filteredVillages = useMemo(() => {
    const data = VILLAGE_ROWS.filter(r => !r.isTotal)
    const keyword = villageKeyword.trim()
    const matched = keyword ? data.filter(r => r.village.includes(keyword)) : data
    const sorted = [...matched].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'village') cmp = a.village.localeCompare(b.village, 'zh')
      else if (sortBy === 'total') cmp = a.total - b.total
      else if (sortBy === 'done') cmp = a.done - b.done
      else if (sortBy === 'rate') cmp = parseFloat(a.rate) - parseFloat(b.rate)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [villageKeyword, sortBy, sortDir])

  const totalRow = VILLAGE_ROWS.find(r => r.isTotal)!

  const SortTh = ({ col, label, align = 'center' }: { col: typeof sortBy; label: string; align?: 'left' | 'center' | 'right' }) => (
    <th
      style={{ ...th, cursor: 'pointer', textAlign: align, userSelect: 'none' }}
      onClick={() => handleSort(col)}
    >
      {label}
      <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>
        {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ─── 表1：14项已同步任务分析 ─────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>表1：余智护杭 14 项已同步任务分析</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6B7280' }}>总计 13,865 条任务</span>
          </div>
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
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', width: 110 }}>状态</th>
                <th style={{ ...th, textAlign: 'left', width: 130 }}>任务去向</th>
                <th style={{ ...th, textAlign: 'left' }}>异常信息</th>
                <th style={{ ...th, width: 80 }}>任务数</th>
                <th style={{ ...th, width: 80, borderRight: 'none' }}>占比</th>
              </tr>
            </thead>
            <tbody>
              {SYNC_ROWS.map((row, i) => {
                if (row.isTotal) {
                  return (
                    <tr key={i} style={{ background: '#F9FAFB', fontWeight: 700 }}>
                      <td colSpan={3} style={{ ...td({ fontWeight: 700, color: '#111827', fontSize: 13 }) }}>总计</td>
                      <td style={{ ...td({ textAlign: 'center', fontWeight: 700, color: '#111827', fontSize: 14 }) }}>{row.count.toLocaleString()}</td>
                      <td style={{ ...td({ borderRight: 'none' }) }}></td>
                    </tr>
                  )
                }
                if (row.isSubtotal) {
                  const isNormal = row.subtotalCount === 5238
                  return (
                    <tr key={i} style={{ background: isNormal ? '#D1FAE5' : '#FEE2E2' }}>
                      <td colSpan={3} style={{ ...td({ fontWeight: 600, color: isNormal ? '#065F46' : '#991B1B', fontSize: 13 }) }}>
                        {isNormal ? '✅ ' : '⚠️ '}小计
                      </td>
                      <td style={{ ...td({ textAlign: 'center', fontWeight: 700, color: isNormal ? '#065F46' : '#991B1B', fontSize: 14 }) }}>
                        {row.count.toLocaleString()}
                      </td>
                      <td style={{ ...td({ borderRight: 'none' }) }}></td>
                    </tr>
                  )
                }

                // 普通行
                const isAbnormal = row.status === '数据校验异常' || (row.status === '' && i > 3 && i < 12)
                const rowBg = isAbnormal ? '#FFFBFB' : '#FAFFFE'
                const statusIsNew = row.status !== ''

                return (
                  <tr key={i} style={{ background: rowBg }}>
                    <td style={{ ...td({ verticalAlign: 'top', whiteSpace: 'nowrap' }) }}>
                      {statusIsNew && (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          background: isAbnormal ? '#FEE2E2' : '#D1FAE5',
                          color: isAbnormal ? '#991B1B' : '#065F46',
                        }}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td style={td({ whiteSpace: 'nowrap', color: '#374151' })}>
                      {row.destination && (
                        <span style={{
                          display: 'inline-block',
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontSize: 12,
                          background: row.destination === '镇街任务' ? '#EFF6FF' : row.destination === '未知分配去向' ? '#F3F4F6' : '#F0FDF4',
                          color: row.destination === '镇街任务' ? '#1E40AF' : row.destination === '未知分配去向' ? '#6B7280' : '#166534',
                        }}>
                          {row.destination}
                        </span>
                      )}
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
      </div>

      {/* ─── 表2：村社检查任务统计 ─────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>表2：村社检查任务统计</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6B7280' }}>
              共 {VILLAGE_ROWS.filter(r => !r.isTotal).length} 个村社，合计 {totalRow.total.toLocaleString()} 任务，
              已完成 {totalRow.done.toLocaleString()}（{totalRow.rate}）
            </span>
          </div>
          <input
            type="text"
            value={villageKeyword}
            onChange={e => setVillageKeyword(e.target.value)}
            placeholder="搜索村社名称..."
            style={{
              padding: '4px 10px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              fontSize: 13,
              outline: 'none',
              minWidth: 160,
            }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortTh col="village" label="村社" align="left" />
                <SortTh col="total" label="任务数" />
                <SortTh col="done" label="已完成数" />
                <th style={{ ...th, borderRight: 'none', minWidth: 160 }}>
                  完成百分比
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVillages.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <td style={td({ fontWeight: 500 })}>{row.village}</td>
                  <td style={td({ textAlign: 'center' })}>{row.total.toLocaleString()}</td>
                  <td style={td({ textAlign: 'center', color: row.done === 0 ? '#9CA3AF' : '#111827', fontWeight: row.done > 0 ? 600 : 400 })}>
                    {row.done.toLocaleString()}
                  </td>
                  <td style={{ ...td({ borderRight: 'none' }) }}>
                    <RateBar rate={row.rate} />
                  </td>
                </tr>
              ))}
              {filteredVillages.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 }}>
                    未找到匹配的村社
                  </td>
                </tr>
              )}
              {/* 合计行 */}
              <tr style={{ background: '#F3F4F6', fontWeight: 700, borderTop: '2px solid #E5E7EB' }}>
                <td style={td({ fontWeight: 700, color: '#111827' })}>合计</td>
                <td style={td({ textAlign: 'center', fontWeight: 700 })}>{totalRow.total.toLocaleString()}</td>
                <td style={td({ textAlign: 'center', fontWeight: 700 })}>{totalRow.done.toLocaleString()}</td>
                <td style={{ ...td({ borderRight: 'none' }) }}>
                  <RateBar rate={totalRow.rate} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
