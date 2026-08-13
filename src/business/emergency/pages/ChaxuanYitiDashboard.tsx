import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageShell, PageHeader, SectionBlock } from '../../../components/layout'

// ─── 通用样式 ─────────────────────────────────────────────────────────────
const cardBase: React.CSSProperties = {
  background: 'white', borderRadius: 8, border: '1px solid #E5E7EB',
  padding: '14px 16px', textAlign: 'center',
}

// 周环比标签（红涨绿跌）
function WeeklyMom({ pct }: { pct: number }) {
  const up = pct >= 0
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: up ? '#DC2626' : '#059669', marginTop: 6, whiteSpace: 'nowrap' }}>
      周环比 {up ? '+' : ''}{pct}%
    </div>
  )
}

// KPI 卡片：label + value + 周环比
function KpiCard({ label, value, unit, color, mom, sub }: {
  label: string; value: string | number; unit?: string; color?: string; mom: number; sub?: string
}) {
  return (
    <div style={cardBase}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || '#111827', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{sub}</div>}
      <WeeklyMom pct={mom} />
    </div>
  )
}

// 分组 KPI 框：一个框内放多个 `|` 分割的指标
function GroupKpiCard({ title, items }: {
  title: string
  items: { label: string; value: string | number; unit?: string; mom: number }[]
}) {
  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #E5E7EB' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 10 }}>
        {items.map(it => (
          <div key={it.label} style={{ textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {typeof it.value === 'number' ? it.value.toLocaleString() : it.value}
              {it.unit && <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{it.unit}</span>}
            </div>
            <WeeklyMom pct={it.mom} />
          </div>
        ))}
      </div>
    </div>
  )
}

// 平铺并排卡片：一个框内多个 `|` 分割的指标横向并排（样式与 GroupKpiCard 对齐，指标字体统一黑色）
function RowCard({ items }: {
  items: { label: string; value: string | number; unit?: string; mom: number }[]
}) {
  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '12px 14px', minWidth: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 10, alignItems: 'center' }}>
        {items.map(it => (
          <div key={it.label} style={{ textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {typeof it.value === 'number' ? it.value.toLocaleString() : it.value}
              {it.unit && <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{it.unit}</span>}
            </div>
            <WeeklyMom pct={it.mom} />
          </div>
        ))}
      </div>
    </div>
  )
}

// 趋势图序列元信息
const SERIES_META: Record<string, { name: string; color: string; dashed?: boolean }> = {
  pushUsers: { name: '推送人数', color: '#4F46E5' },
  pushCount: { name: '推送次数', color: '#06B6D4' },
  pushRate: { name: '推送点击率', color: '#A855F7', dashed: true },
  clickUsers: { name: '点击人数', color: '#059669' },
  clickCount: { name: '点击次数', color: '#0EA5E9' },
  playCount: { name: '播放次数', color: '#D97706' },
  avgPlayTime: { name: '人均播放时长', color: '#14B8A6', dashed: true },
  pointsIssued: { name: '积分发放数', color: '#7C3AED' },
  pointsConsumed: { name: '积分消耗数', color: '#DC2626' },
  checkCount: { name: '检查次数', color: '#4F46E5' },
  hazardFound: { name: '发现隐患数', color: '#DC2626' },
  rectified: { name: '已整改', color: '#059669' },
  rectifyRate: { name: '整改完成率', color: '#D97706' },
  majorHazard: { name: '重大事故隐患数', color: '#991B1B' },
  majorRectified: { name: '已整改', color: '#34D399' },
  majorRate: { name: '整改完成率', color: '#F59E0B' },
}

function TrendTooltip({ active, payload, order }: { active?: boolean; payload?: any[]; order: string[] }) {
  if (!active || !payload || payload.length === 0) return null
  const sorted = [...payload].sort((a, b) => order.indexOf(a.dataKey) - order.indexOf(b.dataKey))
  const label = payload[0]?.payload?.week
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12, minWidth: 150 }}>
      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>{label}</div>
      {sorted.map(item => {
        const meta = SERIES_META[item.dataKey]
        if (!meta) return null
        const isPct = item.dataKey === 'rectifyRate' || item.dataKey === 'pushRate' || item.dataKey === 'majorRate'
        const isMinute = item.dataKey === 'avgPlayTime'
        return (
          <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ width: 8, height: 2, borderRadius: 1, background: meta.color }} />
            <span style={{ color: '#6B7280' }}>{meta.name}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#111827' }}>
              {isPct ? `${item.value}%` : isMinute ? `${item.value} 分钟` : Number(item.value).toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function TrendLegend({ payload, order }: { payload?: any[]; order: string[] }) {
  const sorted = [...(payload || [])].sort((a, b) => order.indexOf(a.dataKey) - order.indexOf(b.dataKey))
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap', fontSize: 12 }}>
      {sorted.map(item => {
        const meta = SERIES_META[item.dataKey]
        if (!meta) return null
        // 图例线条与图中线型一致：dashed 序列显示明显虚线（足够长度+更大间隔）
        return (
          <span key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="32" height="6" style={{ display: 'block' }}>
              <line x1="0" y1="3" x2="32" y2="3" stroke={meta.color} strokeWidth={2.5} strokeLinecap="butt"
                strokeDasharray={meta.dashed ? '6 3' : 'none'} />
            </svg>
            <span style={{ color: '#374151' }}>{meta.name}</span>
          </span>
        )
      })}
    </div>
  )
}

// ─── Mock 数据 ─────────────────────────────────────────────────────────────
// 时间轴用「几月第几周」表示
const WEEKLY_TREND = [
  { week: '7月第1周', pushUsers: 9800, pushCount: 17800, pushRate: 68.1, clickUsers: 6200, clickCount: 11200, playCount: 9800, avgPlayTime: 11.8, pointsIssued: 32000, pointsConsumed: 21500, checkCount: 1250, hazardFound: 86, rectified: 62, rectifyRate: 72.4, majorHazard: 8, majorRectified: 6, majorRate: 75.0 },
  { week: '7月第2周', pushUsers: 10500, pushCount: 19200, pushRate: 68.3, clickUsers: 6900, clickCount: 12100, playCount: 10700, avgPlayTime: 12.0, pointsIssued: 34800, pointsConsumed: 22800, checkCount: 1310, hazardFound: 92, rectified: 68, rectifyRate: 73.8, majorHazard: 9, majorRectified: 7, majorRate: 77.8 },
  { week: '7月第3周', pushUsers: 11200, pushCount: 20500, pushRate: 68.4, clickUsers: 7400, clickCount: 13300, playCount: 11800, avgPlayTime: 12.1, pointsIssued: 37000, pointsConsumed: 24500, checkCount: 1380, hazardFound: 88, rectified: 66, rectifyRate: 75.1, majorHazard: 10, majorRectified: 7, majorRate: 70.0 },
  { week: '7月第4周', pushUsers: 11600, pushCount: 21400, pushRate: 68.5, clickUsers: 7800, clickCount: 14100, playCount: 12600, avgPlayTime: 12.3, pointsIssued: 39500, pointsConsumed: 26800, checkCount: 1440, hazardFound: 97, rectified: 74, rectifyRate: 76.4, majorHazard: 11, majorRectified: 8, majorRate: 72.7 },
  { week: '7月第5周', pushUsers: 12100, pushCount: 22100, pushRate: 68.3, clickUsers: 8200, clickCount: 14900, playCount: 13300, avgPlayTime: 12.4, pointsIssued: 41800, pointsConsumed: 28400, checkCount: 1520, hazardFound: 101, rectified: 78, rectifyRate: 77.2, majorHazard: 10, majorRectified: 8, majorRate: 80.0 },
  { week: '8月第1周', pushUsers: 12500, pushCount: 22900, pushRate: 68.6, clickUsers: 8500, clickCount: 15500, playCount: 13800, avgPlayTime: 12.5, pointsIssued: 43800, pointsConsumed: 29800, checkCount: 1600, hazardFound: 95, rectified: 75, rectifyRate: 78.5, majorHazard: 12, majorRectified: 9, majorRate: 75.0 },
  { week: '8月第2周', pushUsers: 12700, pushCount: 23200, pushRate: 68.4, clickUsers: 8700, clickCount: 15900, playCount: 14100, avgPlayTime: 12.5, pointsIssued: 45000, pointsConsumed: 30600, checkCount: 1680, hazardFound: 103, rectified: 82, rectifyRate: 79.3, majorHazard: 11, majorRectified: 8, majorRate: 72.7 },
  { week: '8月第3周', pushUsers: 12864, pushCount: 23540, pushRate: 68.5, clickUsers: 8812, clickCount: 16127, playCount: 14203, avgPlayTime: 12.6, pointsIssued: 45600, pointsConsumed: 31280, checkCount: 1750, hazardFound: 98, rectified: 79, rectifyRate: 80.1, majorHazard: 12, majorRectified: 9, majorRate: 75.0 },
]

// 宣教明细：按宣教内容列出推送/点击/播放数据
const PROMOTION_DETAIL = [
  { name: '电动自行车充电安全宣教', pushUsers: 3860, pushCount: 7200, pushRate: 71.2, clickUsers: 2745, clickCount: 5130, playCount: 4610, playDuration: 2766, avgPlayTime: 12.2, avgProgress: 81.5 },
  { name: '燃气使用安全须知', pushUsers: 3420, pushCount: 6550, pushRate: 69.8, clickUsers: 2388, clickCount: 4502, playCount: 4020, playDuration: 2412, avgPlayTime: 11.8, avgProgress: 79.3 },
  { name: '消防通道清理专项', pushUsers: 2980, pushCount: 5400, pushRate: 66.5, clickUsers: 1982, clickCount: 3720, playCount: 3310, playDuration: 1953, avgPlayTime: 12.6, avgProgress: 77.8 },
  { name: '有限空间作业安全', pushUsers: 2650, pushCount: 4680, pushRate: 70.1, clickUsers: 1857, clickCount: 3498, playCount: 3105, playDuration: 1863, avgPlayTime: 12.0, avgProgress: 80.2 },
  { name: '企业主体责任落实培训', pushUsers: 2310, pushCount: 4100, pushRate: 68.4, clickUsers: 1580, clickCount: 2950, playCount: 2612, playDuration: 1541, avgPlayTime: 12.4, avgProgress: 78.6 },
  { name: '消防安全知识答题', pushUsers: 1980, pushCount: 3520, pushRate: 65.9, clickUsers: 1305, clickCount: 2420, playCount: 2140, playDuration: 1284, avgPlayTime: 12.1, avgProgress: 76.4 },
  { name: '极端天气防范提醒', pushUsers: 1750, pushCount: 3080, pushRate: 67.2, clickUsers: 1176, clickCount: 2180, playCount: 1910, playDuration: 1146, avgPlayTime: 12.3, avgProgress: 79.0 },
  { name: '职业健康防护宣教', pushUsers: 1520, pushCount: 2650, pushRate: 64.8, clickUsers: 985, clickCount: 1820, playCount: 1588, playDuration: 953, avgPlayTime: 12.5, avgProgress: 75.9 },
]

export function ChaxuanYitiDashboard() {
  // ─── 时间筛选 ─────────────────────────────────────────────
  const [timeRange, setTimeRange] = useState<'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'>('thisWeek')
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date(); const day = now.getDay() === 0 ? 6 : now.getDay() - 1
    const d = new Date(now); d.setDate(now.getDate() - day)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [dateTo, setDateTo] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const applyQuick = (key: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const now = new Date()
    let from: Date, to: Date
    if (key === 'thisWeek') {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1
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
    setDateFrom(fmt(from)); setDateTo(fmt(to)); setTimeRange(key)
  }

  // ─── 趋势图维度切换 ──────────────────────────────────────
  const [trendDim, setTrendDim] = useState<'push' | 'click' | 'points'>('push')
  const [hazardDim, setHazardDim] = useState<'hazard' | 'major'>('hazard')

  // ─── 宣教明细表格排序 ──────────────────────────────────
  type DetailKey = keyof typeof PROMOTION_DETAIL[number]
  const [sortKey, setSortKey] = useState<DetailKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const handleSort = (key: DetailKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }
  const sortedDetail = useMemo(() => {
    const rows = [...PROMOTION_DETAIL]
    if (!sortKey) return rows
    rows.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [sortKey, sortDir])

  // 宣教明细表头列配置（key 对应数据字段，序号列单独渲染）
  const DETAIL_COLS: { key: DetailKey; label: string }[] = [
    { key: 'name', label: '宣教内容名称' },
    { key: 'pushUsers', label: '推送人数' },
    { key: 'pushCount', label: '推送次数' },
    { key: 'pushRate', label: '推送点击率' },
    { key: 'clickUsers', label: '点击人数' },
    { key: 'clickCount', label: '点击次数' },
    { key: 'playCount', label: '播放次数' },
    { key: 'playDuration', label: '播放时长' },
    { key: 'avgPlayTime', label: '人均播放时长' },
    { key: 'avgProgress', label: '平均播放进度' },
  ]

  // 宣教推送与学习：按 `、` 分组，组内 `|` 指标放同一个框
  const PROMO_GROUPS = useMemo(() => [
    {
      title: '推送',
      items: [
        { label: '推送人数', value: 12864, mom: 1.3 },
        { label: '推送次数', value: 23540, mom: 1.5 },
        { label: '人均推送次数', value: 1.83, mom: 0.2, unit: '次' },
        { label: '推送点击率', value: '68.5%', mom: 1.1 },
      ],
    },
    {
      title: '点击播放',
      items: [
        { label: '点击人数', value: 8812, mom: 1.3 },
        { label: '点击次数', value: 16127, mom: 1.4 },
        { label: '播放次数', value: 14203, mom: 0.7 },
        { label: '播放时长', value: 8456, mom: 0.9, unit: '分钟' },
        { label: '人均播放时长', value: 12.6, mom: -0.4, unit: '分钟' },
        { label: '平均播放进度', value: '78.2%', mom: 0.6 },
      ],
    },
    {
      title: '积分',
      items: [
        { label: '积分发放数', value: 45600, mom: 1.3 },
        { label: '积分消耗数', value: 31280, mom: 2.2 },
      ],
    },
  ], [])

  const HAZARD_KPIS = useMemo(() => [
    { label: '检查次数', value: 1750, mom: 4.2 },
    { label: '发现隐患数', value: 98, rectified: 79, rate: 80.6, color: '#DC2626', mom: -4.9 },
    { label: '重大事故隐患数', value: 12, rectified: 9, rate: 75.0, color: '#991B1B', mom: 9.1 },
  ], [])

  const trendOrder = trendDim === 'push' ? ['pushUsers', 'pushCount', 'pushRate'] : trendDim === 'click' ? ['clickUsers', 'clickCount', 'playCount', 'avgPlayTime'] : ['pointsIssued', 'pointsConsumed']

  return (
    <PageShell>
      <PageHeader title="查宣一体" />

      {/* 置顶时间筛选 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 40, background: '#F9FAFB', padding: '6px 0' }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>数据时间:</span>
        {([
          { key: 'thisWeek' as const, label: '本周' },
          { key: 'lastWeek' as const, label: '上周' },
          { key: 'thisMonth' as const, label: '本月' },
          { key: 'lastMonth' as const, label: '上月' },
        ]).map(opt => (
          <button key={opt.key} onClick={() => applyQuick(opt.key)} style={{
            padding: '3px 10px', borderRadius: 4, border: '1px solid',
            borderColor: timeRange === opt.key ? '#3B82F6' : '#E5E7EB',
            background: timeRange === opt.key ? '#EFF6FF' : 'white',
            color: timeRange === opt.key ? '#3B82F6' : '#6B7280',
            fontSize: 12, cursor: 'pointer', fontWeight: timeRange === opt.key ? 600 : 400,
          }}>
            {opt.label}
          </button>
        ))}
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>自定义:</span>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setTimeRange('custom') }} style={{ padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', background: 'white', outline: 'none' }} />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setTimeRange('custom') }} style={{ padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', background: 'white', outline: 'none' }} />
        <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>当前范围：{dateFrom} ~ {dateTo}</span>
      </div>

      {/* 模块1：宣教推送与学习 */}
      <SectionBlock title="1、宣教推送与学习">
        {/* 3 个分组框同一行，宽度按指标数比例分配（4fr : 6fr : 2fr），积分框自然收窄 */}
        <div style={{ display: 'grid', gridTemplateColumns: PROMO_GROUPS.map(g => `${g.items.length}fr`).join(' '), gap: 12, alignItems: 'stretch' }}>
          {PROMO_GROUPS.map(g => (
            <GroupKpiCard key={g.title} title={g.title} items={g.items} />
          ))}
        </div>
      </SectionBlock>

      {/* 模块2：每周变化趋势图（推送/点击/积分） */}
      <SectionBlock title="2、每周变化趋势（近两月）">
        <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', padding: 2, borderRadius: 6, width: 'fit-content', marginBottom: 12 }}>
          {([
            { key: 'push' as const, label: '推送' },
            { key: 'click' as const, label: '点击' },
            { key: 'points' as const, label: '积分' },
          ]).map(opt => (
            <button key={opt.key} onClick={() => setTrendDim(opt.key)} style={{
              padding: '4px 14px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer',
              background: trendDim === opt.key ? '#3B82F6' : 'transparent',
              color: trendDim === opt.key ? 'white' : '#6B7280',
              fontWeight: trendDim === opt.key ? 600 : 400,
            }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEEKLY_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="week" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="left" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <Tooltip content={<TrendTooltip order={trendOrder} />} />
              <Legend content={<TrendLegend order={trendOrder} />} />
              {trendDim === 'push' && (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="pushUsers" name="推送人数" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="pushCount" name="推送次数" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="pushRate" name="推送点击率" stroke="#A855F7" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                </>
              )}
              {trendDim === 'click' && (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="clickUsers" name="点击人数" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="clickCount" name="点击次数" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="playCount" name="播放次数" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="avgPlayTime" name="人均播放时长" stroke="#14B8A6" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                </>
              )}
              {trendDim === 'points' && (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="pointsIssued" name="积分发放数" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="pointsConsumed" name="积分消耗数" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionBlock>

      {/* 3、宣教明细数据：按宣教内容列出推送/点击/播放明细，每列可排序 */}
      <SectionBlock title="3、宣教明细数据">
        <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 8 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1120, fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap', borderRight: '1px solid #F3F4F6' }}>序号</th>
                {DETAIL_COLS.map(col => {
                  const active = sortKey === col.key
                  const isText = col.key === 'name'
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      title="点击排序"
                      style={{
                        padding: '9px 10px', textAlign: isText ? 'left' : 'center', fontWeight: 600,
                        color: active ? '#4F46E5' : '#374151', borderBottom: '1px solid #E5E7EB',
                        whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', borderRight: '1px solid #F3F4F6',
                      }}
                    >
                      {col.label}
                      <span style={{ marginLeft: 4, fontSize: 10, color: active ? '#4F46E5' : '#C4C8CF' }}>
                        {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sortedDetail.map((row, idx) => (
                <tr key={row.name} style={{ background: idx % 2 === 0 ? 'white' : '#FAFAFB' }}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#9CA3AF', whiteSpace: 'nowrap' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', color: '#111827', fontWeight: 500, whiteSpace: 'nowrap' }}>{row.name}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.pushUsers.toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.pushCount.toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.pushRate}%</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.clickUsers.toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.clickCount.toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.playCount.toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.playDuration.toLocaleString()} 分钟</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{row.avgPlayTime} 分钟</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap', borderRight: 'none' }}>{row.avgProgress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionBlock>

      {/* 模块4：隐患整改（宽度按指标数比例 1fr : 3fr : 3fr，同一行，指标字体黑色） */}
      <SectionBlock title="4、隐患整改">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 3fr', gap: 12, alignItems: 'stretch' }}>
          <KpiCard label="检查次数" value={1750} mom={4.2} />
          <RowCard items={[
            { label: '发现隐患数', value: 98, mom: -4.9 },
            { label: '已整改', value: 79, mom: 3.1 },
            { label: '整改完成率', value: '80.6%', mom: 2.4 },
          ]} />
          <RowCard items={[
            { label: '重大事故隐患数', value: 12, mom: 9.1 },
            { label: '已整改', value: 9, mom: 8.0 },
            { label: '整改完成率', value: '75.0%', mom: -1.5 },
          ]} />
        </div>
      </SectionBlock>

      {/* 模块5：隐患每周趋势图（维度切换：隐患总数 / 重大事故隐患数） */}
      <SectionBlock title="5、隐患每周变化趋势（近两月）">
        <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', padding: 2, borderRadius: 6, width: 'fit-content', marginBottom: 12 }}>
          {([
            { key: 'hazard' as const, label: '隐患总数' },
            { key: 'major' as const, label: '重大事故隐患数' },
          ]).map(opt => (
            <button key={opt.key} onClick={() => setHazardDim(opt.key)} style={{
              padding: '4px 14px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer',
              background: hazardDim === opt.key ? '#3B82F6' : 'transparent',
              color: hazardDim === opt.key ? 'white' : '#6B7280',
              fontWeight: hazardDim === opt.key ? 600 : 400,
            }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WEEKLY_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="week" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="left" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tick={{ fill: '#9CA3AF' }} unit="%" domain={[0, 100]} />
              {hazardDim === 'hazard' ? (
                <>
                  <Tooltip content={<TrendTooltip order={['hazardFound', 'rectified', 'rectifyRate']} />} />
                  <Legend content={<TrendLegend order={['hazardFound', 'rectified', 'rectifyRate']} />} />
                  <Line yAxisId="left" type="monotone" dataKey="hazardFound" name="发现隐患数" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="rectified" name="已整改" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="rectifyRate" name="整改完成率" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
                </>
              ) : (
                <>
                  <Tooltip content={<TrendTooltip order={['majorHazard', 'majorRectified', 'majorRate']} />} />
                  <Legend content={<TrendLegend order={['majorHazard', 'majorRectified', 'majorRate']} />} />
                  <Line yAxisId="left" type="monotone" dataKey="majorHazard" name="重大事故隐患数" stroke="#991B1B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="left" type="monotone" dataKey="majorRectified" name="已整改" stroke="#34D399" strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="majorRate" name="整改完成率" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionBlock>
    </PageShell>
  )
}
