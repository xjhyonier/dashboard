import { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageShell, PageHeader, SectionBlock } from '../../../components/layout'

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

// ─── 趋势图序列元信息（统一顺序：图例/浮窗/柱状图） ─────────────────
const SERIES_META: Record<string, { name: string; color: string }> = {
  checkEnt: { name: '检查企业数', color: '#4F46E5' },
  hazardEnt: { name: '有隐患企业数', color: '#F59E0B' },
  safeEnt: { name: '无隐患企业数', color: '#059669' },
  hazardTotal: { name: '隐患总数', color: '#DC2626' },
  hazardRectified: { name: '已整改数', color: '#34D399' },
  rectifyRate: { name: '整改完成率', color: '#F59E0B' },
}

// 自定义 Tooltip：按指定顺序排列浮窗数据
function TrendTooltip({ active, payload, order }: { active?: boolean; payload?: any[]; order: string[] }) {
  if (!active || !payload || payload.length === 0) return null
  const sorted = [...payload].sort((a, b) => order.indexOf(a.dataKey) - order.indexOf(b.dataKey))
  const month = payload[0]?.payload?.month
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12, minWidth: 150 }}>
      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>{month}</div>
      {sorted.map(item => {
        const meta = SERIES_META[item.dataKey]
        if (!meta) return null
        const isPct = item.dataKey === 'rectifyRate'
        return (
          <div key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color }} />
            <span style={{ color: '#6B7280' }}>{meta.name}</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: '#111827' }}>
              {isPct ? `${item.value}%` : Number(item.value).toLocaleString()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// 自定义图例：按指定顺序显示下方指标
function TrendLegend({ payload, order }: { payload?: any[]; order: string[] }) {
  const sorted = [...(payload || [])].sort((a, b) => order.indexOf(a.dataKey) - order.indexOf(b.dataKey))
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap', fontSize: 12 }}>
      {sorted.map(item => {
        const meta = SERIES_META[item.dataKey]
        if (!meta) return null
        return (
          <span key={item.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: meta.color }} />
            <span style={{ color: '#374151' }}>{meta.name}</span>
          </span>
        )
      })}
    </div>
  )
}

// ─── 单元格：一行指标 + 子指标（如 已整改/完成率） ─────────────────────
const MetricCell = ({ value, sub, subLabel, color }: {
  value: string
  sub?: string
  subLabel?: string
  color?: string
}) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 14, fontWeight: 700, color: color || '#111827', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
      {value}
    </div>
    {sub != null && (
      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, whiteSpace: 'nowrap' }}>
        {subLabel ? `${subLabel} ` : ''}{sub}
      </div>
    )}
  </div>
)

// ─── Mock 数据 ─────────────────────────────────────────────────────────────
const COVERAGE_ROWS = [
  { label: '检查企业数', app: '8,923', glasses: '3,176', total: '12,099' },
  { label: '有隐患的企业数', app: '2,134', glasses: '986', total: '3,120' },
  { label: '有隐患企业占比', app: '23.9%', glasses: '31.0%', total: '25.8%' },
  { label: '无隐患企业数', app: '6,789', glasses: '2,190', total: '8,979' },
]

const HAZARD_ROWS = [
  {
    label: '隐患总数/已整改数/整改完成率',
    app: '5,120 / 3,840 / 75.0%',
    glasses: '2,350 / 1,680 / 71.5%',
    total: '7,470 / 5,520 / 73.9%',
    color: '#111827',
  },
  {
    label: '一般隐患总数/已整改数/整改完成率',
    app: '4,300 / 3,380 / 78.6%',
    glasses: '1,980 / 1,470 / 74.2%',
    total: '6,280 / 4,850 / 77.2%',
    color: '#111827',
  },
  {
    label: '重大事故隐患总数/已整改数/整改完成率',
    app: '820 / 460 / 56.1%',
    glasses: '370 / 210 / 56.8%',
    total: '1,190 / 670 / 56.3%',
    color: '#DC2626',
  },
  {
    label: '平均检查时长',
    app: '12.5 分钟',
    glasses: '8.2 分钟',
    total: '11.4 分钟',
    color: '#111827',
  },
]

export function AiGlassesDashboard() {
  // ─── 趋势图：分类维度切换 + 月度数据 ─────────────────────
  const [trendCategory, setTrendCategory] = useState<'coverage' | 'hazard'>('coverage')

  // 近12个月月度趋势数据（mock，确定性）
  const MONTHLY_TREND = useMemo(() => {
    const months = ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']
    return months.map((m, i) => {
      const growth = i / 11
      return {
        month: m.slice(2).replace('-', '月') + '月',
        // 企业覆盖：检查企业数（合计）随月份增长
        checkEnt: Math.round(8500 + growth * 3600 + (i % 3) * 120),
        hazardEnt: Math.round(1900 + growth * 1220 + (i % 4) * 60),
        safeEnt: Math.round(6600 + growth * 2380 + (i % 3) * 80),
        // 隐患与整改：隐患总数 / 已整改数 / 完成率
        hazardTotal: Math.round(4800 + growth * 2670 + (i % 5) * 90),
        hazardRectified: Math.round(3300 + growth * 2220 + (i % 4) * 70),
        rectifyRate: Number((68 + growth * 6 + (i % 3) * 0.8).toFixed(1)),
      }
    })
  }, [])
  // ─── 时间筛选：快捷项 + 自定义日期 ─────────────────────────
  const [timeRange, setTimeRange] = useState<'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom'>('thisMonth')
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    return `${y}-${String(m + 1).padStart(2, '0')}-01`
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

  return (
    <PageShell>
      <PageHeader title="AI眼镜检查看板" />

      {/* 时间筛选 */}
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
        <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
          当前范围：{dateFrom} ~ {dateTo}
        </span>
      </div>

      {/* 顶部说明 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap',
        padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB',
        fontSize: 12, color: '#6B7280',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4F46E5' }} />
          一起安APP实时看：通过 APP 端实时巡查采集的数据
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#0EA5E9' }} />
          AI眼镜实时看：通过 AI 眼镜设备实时巡查采集的数据
        </span>
      </div>

      <SectionBlock title="">
        {/* 数据表格 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 110, textAlign: 'center' }}>分类</th>
                <th style={{ ...th, width: 270, textAlign: 'left' }}>指标</th>
                <th style={{ ...th, minWidth: 200 }}>一起安APP实时看</th>
                <th style={{ ...th, minWidth: 200 }}>AI眼镜实时看</th>
                <th style={{ ...th, minWidth: 200, borderRight: 'none' }}>合计</th>
              </tr>
            </thead>
            <tbody>
              {/* 分类一：企业覆盖（淡蓝） */}
              {COVERAGE_ROWS.map((row, idx) => (
                <tr key={row.label} style={{ background: '#EFF6FF' }}>
                  {idx === 0 && (
                    <td rowSpan={COVERAGE_ROWS.length} style={{
                      padding: '8px 10px', fontSize: 13, fontWeight: 700, color: '#1E40AF',
                      background: '#DBEAFE', textAlign: 'center', verticalAlign: 'middle',
                      borderRight: '1px solid #93C5FD', borderBottom: '1px solid #BFDBFE',
                    }}>
                      企业覆盖
                    </td>
                  )}
                  <td style={{ ...td({ textAlign: 'left', fontWeight: 500, color: '#374151' }) }}>{row.label}</td>
                  <td style={td({ textAlign: 'center' })}><MetricCell value={row.app} /></td>
                  <td style={td({ textAlign: 'center' })}><MetricCell value={row.glasses} /></td>
                  <td style={{ ...td({ textAlign: 'center', borderRight: 'none' }) }}><MetricCell value={row.total} /></td>
                </tr>
              ))}

              {/* 分类二：隐患与整改（淡黄） */}
              {HAZARD_ROWS.map((row, idx) => (
                <tr key={row.label} style={{ background: '#FFFBEB' }}>
                  {idx === 0 && (
                    <td rowSpan={HAZARD_ROWS.length} style={{
                      padding: '8px 10px', fontSize: 13, fontWeight: 700, color: '#92400E',
                      background: '#FEF3C7', textAlign: 'center', verticalAlign: 'middle',
                      borderRight: '1px solid #FCD34D', borderBottom: '1px solid #FDE68A',
                    }}>
                      隐患与整改
                    </td>
                  )}
                  <td style={{ ...td({ textAlign: 'left', fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }) }}>{row.label}</td>
                  <td style={td({ textAlign: 'center', fontSize: 13, fontWeight: 700, color: row.color, whiteSpace: 'nowrap' })}>{row.app}</td>
                  <td style={td({ textAlign: 'center', fontSize: 13, fontWeight: 700, color: row.color, whiteSpace: 'nowrap' })}>{row.glasses}</td>
                  <td style={{ ...td({ textAlign: 'center', fontSize: 13, fontWeight: 700, color: row.color, whiteSpace: 'nowrap', borderRight: 'none' }) }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 单位说明 */}
        <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
          注：平均检查时长为单次巡查耗时（分钟）；有隐患企业占比 = 有隐患的企业数 ÷ 检查企业数。
        </div>

        {/* 每月变化趋势图（按分类切换） */}
        <div style={{ background: 'white', border: '1px solid #9CA3AF', borderRadius: 8, padding: 14, marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>每月变化趋势（近12个月）</div>
            <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', padding: 2, borderRadius: 6 }}>
              <button
                onClick={() => setTrendCategory('coverage')}
                style={{
                  padding: '4px 14px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer',
                  background: trendCategory === 'coverage' ? '#3B82F6' : 'transparent',
                  color: trendCategory === 'coverage' ? 'white' : '#6B7280',
                  fontWeight: trendCategory === 'coverage' ? 600 : 400,
                }}
              >
                企业覆盖
              </button>
              <button
                onClick={() => setTrendCategory('hazard')}
                style={{
                  padding: '4px 14px', borderRadius: 4, border: 'none', fontSize: 12, cursor: 'pointer',
                  background: trendCategory === 'hazard' ? '#3B82F6' : 'transparent',
                  color: trendCategory === 'hazard' ? 'white' : '#6B7280',
                  fontWeight: trendCategory === 'hazard' ? 600 : 400,
                }}
              >
                隐患与整改
              </button>
            </div>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              {/* 关键：composedChart 加 key={trendCategory}，切换分类时整个图表实例重建，
                  每次都按"首次挂载"路径渲染，Bar 顺序稳定 = 左旋后视觉（紫绿橙）。 */}
              <ComposedChart
                key={trendCategory}
                data={MONTHLY_TREND}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" fontSize={11} tick={{ fill: '#9CA3AF' }} />
                {trendCategory === 'coverage' ? (
                  <YAxis fontSize={11} tick={{ fill: '#9CA3AF' }} />
                ) : (
                  <>
                    <YAxis yAxisId="left" fontSize={11} tick={{ fill: '#9CA3AF' }} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} tick={{ fill: '#9CA3AF' }} unit="%" />
                  </>
                )}
                <Tooltip content={
                  trendCategory === 'coverage'
                    ? <TrendTooltip order={['checkEnt', 'safeEnt', 'hazardEnt']} />
                    : <TrendTooltip order={['hazardTotal', 'hazardRectified', 'rectifyRate']} />
                } />
                <Legend content={
                  trendCategory === 'coverage'
                    ? <TrendLegend order={['checkEnt', 'safeEnt', 'hazardEnt']} />
                    : <TrendLegend order={['hazardTotal', 'hazardRectified', 'rectifyRate']} />
                } />
                {trendCategory === 'coverage' ? (
                  <>
                    {/* JSX 声明顺序 = 视觉顺序（实测无左旋）：紫(检查) → 绿(无隐患) → 橙(有隐患) */}
                    <Bar dataKey="checkEnt" name="检查企业数" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="safeEnt" name="无隐患企业数" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hazardEnt" name="有隐患企业数" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <>
                    {/* 红(隐患总数) → 绿(已整改数) → 黄线(整改完成率) */}
                    <Bar yAxisId="left" dataKey="hazardTotal" name="隐患总数" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="hazardRectified" name="已整改数" fill="#34D399" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="rectifyRate" name="整改完成率" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionBlock>
    </PageShell>
  )
}
