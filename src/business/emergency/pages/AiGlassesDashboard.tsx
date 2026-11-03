import { useState, useMemo } from 'react'
import { PageShell, PageHeader, SectionBlock } from '../../../components/layout'
import { exportToCSV, exportButtonStyle } from './components/exportUtils'

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

// 确定性哈希（mock 数据按 key 稳定生成）
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

// ─── 统计表行结构 ────────────────────────────────────────────────────────
interface StatRow {
  dept?: string        // 所属部门（按人员统计用，位于统计对象左侧）
  统计对象: string
  检查次数: number
  检查户数: number
  发现隐患: number
  已推送隐患: number
  重大隐患: number
  已整改隐患: number
  隐患整改率: string // 'xx.x%' 或 '-'
  indent?: number     // 缩进层级：0/缺省=一级，1=子项（如手机看/AR眼镜看属 AI巡查）
  isGroup?: boolean   // 组行（如 AI巡查，数值=子项之和）
}

// 按 key 生成一行统计（确定性）
function genStat(name: string): Omit<StatRow, '统计对象'> {
  const h = hashStr(name)
  const 检查次数 = 600 + (h % 1400)
  const 检查户数 = Math.round(检查次数 * (0.6 + ((h >> 3) % 30) / 100))
  const 发现隐患 = Math.round(检查次数 * (0.4 + ((h >> 5) % 25) / 100))
  const 已推送隐患 = Math.round(发现隐患 * (0.5 + ((h >> 7) % 40) / 100))
  const 重大隐患 = h % 18
  const 已整改隐患 = Math.round(发现隐患 * (0.6 + ((h >> 9) % 35) / 100))
  const 隐患整改率 = 发现隐患 === 0 ? '-' : `${((已整改隐患 / 发现隐患) * 100).toFixed(1)}%`
  return { 检查次数, 检查户数, 发现隐患, 已推送隐患, 重大隐患, 已整改隐患, 隐患整改率 }
}

// 合计行（加和；整改率由合计的 已整改/发现 重算）
function sumRows(rows: Omit<StatRow, '统计对象'>[]): Omit<StatRow, '统计对象'> {
  const r = rows.reduce(
    (acc, x) => ({
      检查次数: acc.检查次数 + x.检查次数,
      检查户数: acc.检查户数 + x.检查户数,
      发现隐患: acc.发现隐患 + x.发现隐患,
      已推送隐患: acc.已推送隐患 + x.已推送隐患,
      重大隐患: acc.重大隐患 + x.重大隐患,
      已整改隐患: acc.已整改隐患 + x.已整改隐患,
      隐患整改率: '',
    }),
    { 检查次数: 0, 检查户数: 0, 发现隐患: 0, 已推送隐患: 0, 重大隐患: 0, 已整改隐患: 0, 隐患整改率: '' }
  )
  r.隐患整改率 = r.发现隐患 === 0 ? '-' : `${((r.已整改隐患 / r.发现隐患) * 100).toFixed(1)}%`
  return r
}

// 整改率配色：高绿 / 中橙 / 低红 / 空灰
function rateColor(rate: string): string {
  if (rate === '-') return '#9CA3AF'
  const n = parseFloat(rate)
  if (n >= 80) return '#059669'
  if (n >= 60) return '#D97706'
  return '#DC2626'
}

// ─── 统计表组件（按检查方式 / 按人员 共用） ─────────────────────────────
function StatTable({ rows, firstColLabel = '统计对象', showDept = false }: { rows: StatRow[]; firstColLabel?: string; showDept?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {showDept && <th style={{ ...th, textAlign: 'left', minWidth: 110 }}>所属部门</th>}
            <th style={{ ...th, textAlign: 'left', minWidth: 130 }}>{firstColLabel}</th>
            <th style={th}>检查次数</th>
            <th style={th}>检查户数</th>
            <th style={th}>发现隐患</th>
            <th style={th}>已推送隐患</th>
            <th style={th}>重大隐患</th>
            <th style={th}>已整改隐患</th>
            <th style={{ ...th, borderRight: 'none' }}>隐患整改率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isTotal = r.统计对象 === '合计'
            const isSub = (r.indent ?? 0) > 0
            const namePadLeft = isSub ? 28 : 8
            const subPrefix = isSub ? '└ ' : ''
            return (
              <tr key={r.统计对象} style={{ background: isTotal ? '#F9FAFB' : i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                {showDept && <td style={{ ...td({ textAlign: 'left', fontWeight: isTotal ? 700 : 400, color: isTotal ? '#111827' : isSub ? '#9CA3AF' : '#6B7280' }) }}>{r.dept || '-'}</td>}
                <td style={{ ...td({ textAlign: 'left', fontWeight: isTotal ? 700 : r.isGroup ? 600 : isSub ? 400 : 500, color: isTotal ? '#111827' : isSub ? '#6B7280' : '#374151', paddingLeft: namePadLeft }) }}>{subPrefix}{r.统计对象}</td>
                <td style={td({ textAlign: 'center', fontWeight: isTotal ? 600 : r.isGroup ? 600 : 400, color: isSub ? '#6B7280' : '#374151' })}>{r.检查次数.toLocaleString()}</td>
                <td style={td({ textAlign: 'center', color: isSub ? '#6B7280' : '#374151' })}>{r.检查户数.toLocaleString()}</td>
                <td style={td({ textAlign: 'center', color: isSub ? '#F59E0B' : '#D97706' })}>{r.发现隐患.toLocaleString()}</td>
                <td style={td({ textAlign: 'center', color: isSub ? '#6B7280' : '#374151' })}>{r.已推送隐患.toLocaleString()}</td>
                <td style={{ ...td({ textAlign: 'center', color: r.重大隐患 > 0 ? '#DC2626' : isSub ? '#9CA3AF' : '#374151', fontWeight: r.重大隐患 > 0 ? 600 : 400 }) }}>{r.重大隐患.toLocaleString()}</td>
                <td style={td({ textAlign: 'center', color: isSub ? '#34D399' : '#059669' })}>{r.已整改隐患.toLocaleString()}</td>
                <td style={{ ...td({ textAlign: 'center', fontWeight: 600, color: rateColor(r.隐患整改率), borderRight: 'none' }) }}>{r.隐患整改率}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// 表头列定义（导出用；人员表含「所属部门」首列，首列标签按表切换：检查方式 / 检查人员）
const EXPORT_COLUMNS = (firstColLabel: string, showDept = false) => [
  ...(showDept ? [{ key: 'dept' as const, label: '所属部门' }] : []),
  { key: '统计对象' as const, label: firstColLabel },
  { key: '检查次数' as const, label: '检查次数' },
  { key: '检查户数' as const, label: '检查户数' },
  { key: '发现隐患' as const, label: '发现隐患' },
  { key: '已推送隐患' as const, label: '已推送隐患' },
  { key: '重大隐患' as const, label: '重大隐患' },
  { key: '已整改隐患' as const, label: '已整改隐患' },
  { key: '隐患整改率' as const, label: '隐患整改率' },
]

export function AiGlassesDashboard() {
  // ─── 部门筛选 ────────────────────────────────────────────
  const [deptFilter, setDeptFilter] = useState('全部')

  // ─── 时间筛选：快捷项 + 自定义日期 ─────────────────────────
  const [timeRange, setTimeRange] = useState<'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'>('thisWeek')
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const applyQuick = (key: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const now = new Date()
    let from: Date, to: Date
    if (key === 'thisWeek') {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1  // 周一=0
      from = new Date(now); from.setDate(now.getDate() - day)
      to = new Date(from); to.setDate(from.getDate() + 6)
    } else if (key === 'lastWeek') {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1
      to = new Date(now); to.setDate(now.getDate() - day - 1)
      from = new Date(to); from.setDate(to.getDate() - 6)
    } else if (key === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = new Date(now)
    } else {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      to = new Date(now.getFullYear(), now.getMonth(), 0)
    }
    setDateFrom(fmt(from))
    setDateTo(fmt(to))
    setTimeRange(key)
  }

  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date()
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const from = new Date(now); from.setDate(now.getDate() - day)
    return fmt(from)
  })
  const [dateTo, setDateTo] = useState(() => fmt(new Date()))

  // ─── 按检查方式统计（层级：AI巡查 = 手机看 + AR眼镜看；合计不含重复） ──────
  const methodRows = useMemo<StatRow[]>(() => {
    const suishoupai = genStat('随手拍')
    const shouji = genStat('手机看')
    const arYanjing = genStat('AR眼镜看')
    const lixian = genStat('离线报送')
    // AI巡查组行 = 两个子项之和
    const aiTotal = sumRows([shouji, arYanjing])
    // 合计 = 随手拍 + AI巡查(组) + 离线报送（不重复计子项）
    const grand = sumRows([suishoupai, aiTotal, lixian])
    return [
      { 统计对象: '随手拍', ...suishoupai },
      { 统计对象: 'AI巡查', ...aiTotal, isGroup: true },
      { 统计对象: '手机看', ...shouji, indent: 1 },
      { 统计对象: 'AR眼镜看', ...arYanjing, indent: 1 },
      { 统计对象: '离线报送', ...lixian },
      { 统计对象: '合计', ...grand },
    ]
  }, [])

  // ─── 按人员统计（含所属部门；合计随部门筛选重算） ────────────────
  const DEPTS = ['综合协调组', '监督检查组', '宣传培训组', '应急救援组']
  const PERSONNEL = [
    '雷重臣', '朱佳佳', '武佳恒', '林文', '曹维', '何纬乐', '刘思佳', '黑拉拉子',
    '陶检', '曹威', '余松霖', '徐伟', '李多海', '罗金元', '周济', '曹亚军',
    '王安睿', '田木基洛布', '刘亚磊', '刘瑞麟', '王科文', '于东旭', '贾义', '覃弘通', '李春',
  ]
  const personRows = useMemo<StatRow[]>(() => {
    const detail = PERSONNEL
      .map((name, idx) => ({ dept: DEPTS[idx % DEPTS.length], name, idx }))
      .filter(p => deptFilter === '全部' || p.dept === deptFilter)
      .map(p => ({ dept: p.dept, 统计对象: p.name, ...genStat(`${p.name}-${p.idx}`) }))
    const total = sumRows(detail.map(d => {
      const { dept, 统计对象, ...rest } = d
      return rest
    }))
    return [...detail, { dept: '—', 统计对象: '合计', ...total }]
  }, [deptFilter])

  return (
    <PageShell>
      <PageHeader title="AI眼镜检查看板" />

      {/* 数据时间筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>数据时间:</span>
        {([
          { key: 'thisWeek' as const, label: '本周' },
          { key: 'lastWeek' as const, label: '上周' },
          { key: 'thisMonth' as const, label: '本月' },
          { key: 'lastMonth' as const, label: '上月' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => applyQuick(opt.key)}
            style={{
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: timeRange === opt.key ? '#3B82F6' : '#E5E7EB',
              background: timeRange === opt.key ? '#EFF6FF' : 'white',
              color: timeRange === opt.key ? '#3B82F6' : '#6B7280',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: timeRange === opt.key ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>自定义:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setTimeRange('custom') }}
          style={{
            padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', background: 'white', outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setTimeRange('custom') }}
          style={{
            padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', background: 'white', outline: 'none',
          }}
        />
        <button
          onClick={() => applyQuick('thisWeek')}
          style={{
            padding: '3px 10px', borderRadius: 4, border: '1px solid #E5E7EB',
            background: 'white', color: '#6B7280', fontSize: 12, cursor: 'pointer',
          }}
        >
          清除
        </button>
        <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
          当前范围：{dateFrom} ~ {dateTo}
        </span>
        <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 12 }}>所属部门:</span>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{
            padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', background: 'white', outline: 'none', cursor: 'pointer',
          }}
        >
          {['全部', ...DEPTS].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* 模块一：按检查方式统计 */}
      <SectionBlock
        title="按检查方式统计"
        actions={
          <button
            style={exportButtonStyle}
            onClick={() => {
              // 导出时子项名前加「└ 」体现层级（合计已为去重后的口径）
              const exportRows = methodRows.map(r => (r.indent ? { ...r, 统计对象: `└ ${r.统计对象}` } : r))
              exportToCSV(exportRows, EXPORT_COLUMNS('检查方式'), '按检查方式统计')
            }}
          >
            导出
          </button>
        }
      >
        <StatTable rows={methodRows} firstColLabel="检查方式" />
      </SectionBlock>

      {/* 模块二：按人员统计 */}
      <SectionBlock
        title="按人员统计"
        actions={
          <button
            style={exportButtonStyle}
            onClick={() => exportToCSV(personRows, EXPORT_COLUMNS('检查人员', true), '按人员统计')}
          >
            导出
          </button>
        }
      >
        <StatTable rows={personRows} firstColLabel="检查人员" showDept />
      </SectionBlock>

      {/* 底部说明 */}
      <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
        说明：检查户数按统计周期去重；整改率 = 已整改隐患 ÷ 发现隐患。
      </div>
    </PageShell>
  )
}
