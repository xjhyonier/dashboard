import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'

// ─── 表1数据：村社检查任务统计 ────────────────────────────────────────────
interface TaskSub {
  total: number     // 总任务数（累计）
  done: number      // 已完成（累计，用于计算总完成率）
  hazard: number    // 总隐患数（累计）
  rectified: number // 已整改（累计）
  rectifying: number // 整改中（累计）
  // 查询期间字段（以任务创建时间为准）
  newTasks: number   // 任务数：查询期间创建的任务数量
  newDone: number    // 完成数：查询期间创建的任务中，已完成的数量
  newHazard: number  // 确认隐患数：查询期间创建的任务中，发现的隐患数量
  newRectified: number // 已整改：查询期间创建的任务中，已整改的隐患数量
  majorHazard: number  // 重大事故隐患数：查询期间创建的任务中，发现的隐患中属重大事故隐患的数量
}

interface VillageRow {
  village: string
  date: string      // 数据日期，格式 YYYY-MM-DD
  fzjz: TaskSub    // 防灾减灾
  rcjc: TaskSub    // 日常检查
  sync141: TaskSub // 三方同步任务
  isTotal?: boolean
  enterpriseCount: number
  venueCount: number
  rentalCount: number
}

// ─── 基于村社名称生成确定性哈希（用于生成独立模拟值）────────────────────
function hashVillage(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// ─── 企业/场所/出租房：独立模拟值（不依赖任务数）────────────────────────────
// 每个村社的独立模拟值 = 基础值 + 哈希偏移，确保不同村社有不同数值且刷新不变
function mockEnt(name: string): number {
  const h = hashVillage(name)
  return 8 + (h % 35)          // 8~42家
}
function mockVenue(name: string): number {
  const h = hashVillage(name + '_v')
  return 25 + (h % 90)         // 25~114家
}
function mockRental(name: string): number {
  const h = hashVillage(name + '_r')
  return 40 + (h % 220)        // 40~259家
}

// 风险等级分布 mock（企业/出租房）
function mockRiskLevels(name: string, total: number) {
  const h = hashVillage(name + '_risk')
  const major = Math.max(1, Math.round(total * (0.02 + (h % 8) / 100)))       // 2%~10%
  const upper = Math.max(2, Math.round(total * (0.05 + (h % 12) / 100)))      // 5%~17%
  const general = Math.max(3, Math.round(total * (0.1 + (h % 20) / 100)))     // 10%~30%
  const low = total - major - upper - general
  return { major, upper, general, low }
}
// 场所类型分布 mock（消防重点单位/一般单位/九小场所）
function mockVenueTypes(name: string, total: number) {
  const h = hashVillage(name + '_vtype')
  const key = Math.max(1, Math.round(total * (0.05 + (h % 10) / 100)))        // 5%~15%
  const general = Math.max(5, Math.round(total * (0.2 + (h % 25) / 100)))     // 20%~45%
  const nineSmall = total - key - general
  return { key, general, nineSmall }
}

// ─── 内联维度标签（紧凑版，放在数值右侧）────────────────────────────
function InlineDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 7px', borderRadius: 3,
      background: `${color}10`, border: `1px solid ${color}30`,
      fontSize: 10, color, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      {label}
      <span style={{ fontWeight: 700 }}>{count}</span>
    </span>
  )
}
// ─── 确认隐患数（期间）：基于时间周期的独立模拟 ─────────────────────────────
// 逻辑：每个村社有固定的"日均新发现隐患数"，期间隐患数 = 日均数 × 期间天数
// 用村社名称哈希生成固定的日均数，避免与总隐患数产生推导关系
function mockNewHazard(name: string, periodDays: number): number {
  const h = hashVillage(name + '_hz')
  const dailyNew = 0.3 + (h % 10) / 10   // 0.3~1.2 个/天（确定性）
  return Math.max(1, Math.round(dailyNew * periodDays))
}

// ─── 重大事故隐患数（期间）：基于确认隐患数的确定性比例 ───────────────────────
// 逻辑：重大事故隐患是确认隐患中的一个子集，比例由村社名称哈希决定（30%~55%）
function mockMajorHazard(name: string, newHazard: number): number {
  const h = hashVillage(name + '_mj')
  const ratio = 0.30 + (h % 26) / 100   // 0.30~0.55（确定性）
  return Math.max(0, Math.round(newHazard * ratio))
}

// 生成模拟数据：根据原 total/done 拆分到三类任务
// villageName：用于生成确定性的期间隐患数（不依赖 total/done）
function genMock(total: number, done: number, villageName: string, monthIdx: number = 0): Pick<VillageRow, 'fzjz' | 'rcjc' | 'sync141'> {
  const seed = villageName + '_m' + monthIdx  // 每月不同的随机种子
  // 按大约 3:4:3 比例拆分
  const t1 = Math.round(total * 0.3)
  const t2 = Math.round(total * 0.4)
  const t3 = total - t1 - t2
  const d1 = Math.round(done * 0.3)
  const d2 = Math.round(done * 0.4)
  const d3 = done - d1 - d2

  const sub = (t: number, d: number, suffix: string): TaskSub => {
    const hazard = Math.max(0, Math.round((t - d) * 0.6))
    const rectified = Math.max(0, Math.round(hazard * 0.7))
    const rectifying = hazard - rectified
    // 查询期间数据（以任务创建时间为准）
    // 任务数：期间创建的任务数，与任务规模成正比（5~25条）
    const newTasks = Math.max(1, Math.round(t * 0.12 + hashVillage(seed + suffix + '_nt') % 10 + 3))
    // 完成数：严格小于任务数（0.3~0.8倍任务数，保证完工数 < 任务数）
    const doneRatio = 0.30 + (hashVillage(seed + suffix + '_dr') % 51) / 100  // 0.30~0.80
    const newDone  = Math.min(newTasks - 1, Math.max(0, Math.round(newTasks * doneRatio)))
    // 确认隐患数（期间）：基于时间周期的独立模拟
    const newHazard = mockNewHazard(seed, 7)
    // 已整改：期间确认的隐患中，有一定比例在期间内完成整改
    const rectRatio = 0.30 + (hashVillage(seed + '_rc') % 41) / 100  // 0.30~0.70
    const newRectified = Math.round(newHazard * rectRatio)
    // 重大事故隐患数：确认隐患中的一个子集（30%~55%）
    const majorHazard = mockMajorHazard(seed, newHazard)
    return { total: t, done: d, hazard, rectified, rectifying, newTasks, newDone, newHazard, newRectified, majorHazard }
  }

  return {
    fzjz: sub(t1, d1, '_fzjz'),
    rcjc: sub(t2, d2, '_rcjc'),
    sync141: sub(t3, d3, '_sync'),
  }
}

// ─── 月份系数：12个月的业务增长模式（与趋势图一致） ──────────────────────────
const MONTHLY_GROWTH: number[] = [
  0.58, 0.63, 0.68, 0.73, 0.78, 0.83,  // 2025-07 ~ 2025-12
  0.88, 0.90, 0.93, 0.96, 0.98, 1.00,  // 2026-01 ~ 2026-06
]

// 近12月的月份标签（2025-07 ~ 2026-06）
const MONTH_LABELS: string[] = []
for (let m = 0; m < 12; m++) {
  const d = new Date(2026, 5 - (11 - m), 1)
  MONTH_LABELS.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
}

const VILLAGE_RAW: { village: string; total: number; done: number }[] = [
  { village: '安溪村', total: 31, done: 4 },
  { village: '白洋里社区', total: 9, done: 0 },
  { village: '北宸社区', total: 434, done: 151 },
  { village: '北秀社区', total: 48, done: 0 },
  { village: '博园社区', total: 61, done: 3 },
  { village: '昌运社区', total: 55, done: 12 },
  { village: '崇福社区', total: 73, done: 0 },
  { village: '杜城村', total: 65, done: 0 },
  { village: '杜甫村', total: 31, done: 0 },
  { village: '港南村', total: 13, done: 12 },
  { village: '勾庄村', total: 96, done: 0 },
  { village: '管家塘社区', total: 105, done: 36 },
  { village: '杭运社区', total: 16, done: 8 },
  { village: '金家渡社区', total: 439, done: 0 },
  { village: '聚贤社区', total: 162, done: 133 },
  { village: '良港村', total: 54, done: 40 },
  { village: '良渚文化村社区', total: 317, done: 225 },
  { village: '米行桥社区', total: 81, done: 56 },
  { village: '铭雅社区', total: 395, done: 106 },
  { village: '南庄兜村', total: 15, done: 4 },
  { village: '七贤桥村', total: 142, done: 38 },
  { village: '亲亲家园社区', total: 87, done: 1 },
  { village: '施家湾社区', total: 147, done: 56 },
  { village: '石桥村', total: 35, done: 9 },
  { village: '通运社区', total: 105, done: 30 },
  { village: '万年桥社区', total: 59, done: 0 },
  { village: '吴家厍社区', total: 56, done: 49 },
  { village: '西塘河村', total: 26, done: 0 },
  { village: '西塘雅苑社区', total: 26, done: 25 },
  { village: '小洋坝社区', total: 55, done: 52 },
  { village: '新港村', total: 13, done: 9 },
  { village: '新桥社区', total: 22, done: 0 },
  { village: '新溪社区', total: 34, done: 5 },
  { village: '行宫塘村', total: 75, done: 4 },
  { village: '荀山村', total: 147, done: 31 },
  { village: '逸居城社区', total: 30, done: 7 },
  { village: '玉创社区', total: 121, done: 114 },
  { village: '玉鸟社区', total: 8, done: 6 },
  { village: '玉泽社区', total: 73, done: 26 },
  { village: '越秀社区', total: 134, done: 46 },
  { village: '运河村', total: 54, done: 19 },
  { village: '长桥社区', total: 77, done: 62 },
  { village: '棕榈湾社区', total: 85, done: 68 },
  { village: '大陆村', total: 13, done: 13 },
  { village: '东莲村', total: 49, done: 49 },
  { village: '东塘河村', total: 20, done: 20 },
  { village: '勾庄治理中心', total: 440, done: 440 },
  { village: '良渚治理中心', total: 360, done: 360 },
  { village: '纤石村', total: 48, done: 48 },
  { village: '小洋坝村', total: 2, done: 2 },
]

// 展开为12个月数据：每个村社 × 12个月
const VILLAGE_ROWS: VillageRow[] = VILLAGE_RAW.flatMap(r =>
  MONTHLY_GROWTH.map((mult, monthIdx) => {
    const monthTasks = Math.max(1, Math.round(r.total * mult))
    const monthDone = Math.max(0, Math.min(monthTasks - 1, Math.round(r.done * mult)))
    return {
      village: r.village,
      date: MONTH_LABELS[monthIdx],
      ...genMock(monthTasks, monthDone, r.village, monthIdx),
      enterpriseCount: mockEnt(r.village),
      venueCount: mockVenue(r.village),
      rentalCount: mockRental(r.village),
    }
  })
)

// ─── 村社近期检查数据变化折线图数据 ────────────────────────────────────────────
// 支持近12月、近30天两种维度
interface TrendDataPoint {
  period: string      // 时间周期（月份或日期）
  // 通用维度
  任务数?: number
  完成数?: number
  任务完成率?: number   // 百分比，用于折线图
  确认隐患数?: number
  已整改?: number
  整改完成率?: number   // 百分比，用于折线图
}

// 生成近12月的趋势数据（基于表1 VILLAGE_ROWS 同源数据，按月汇总）
const generateMonthlyTrendData = (): TrendDataPoint[] => {
  const months: TrendDataPoint[] = []

  // 从 VILLAGE_ROWS 按月汇总（每个月份汇总50个村社的数据）
  const monthSums = new Map<string, { tasks: number; done: number; hazards: number; rectified: number }>()
  for (const r of VILLAGE_ROWS) {
    const ym = r.date.substring(0, 7) // YYYY-MM
    const curr = monthSums.get(ym) || { tasks: 0, done: 0, hazards: 0, rectified: 0 }
    curr.tasks += r.fzjz.newTasks + r.rcjc.newTasks + r.sync141.newTasks
    curr.done += r.fzjz.newDone + r.rcjc.newDone + r.sync141.newDone
    curr.hazards += r.fzjz.newHazard + r.rcjc.newHazard + r.sync141.newHazard
    curr.rectified += r.fzjz.newRectified + r.rcjc.newRectified + r.sync141.newRectified
    monthSums.set(ym, curr)
  }

  // 按月份排序输出
  const sortedMonths = [...monthSums.entries()].sort(([a], [b]) => a.localeCompare(b))
  for (const [period, sum] of sortedMonths) {
    const doneRate = sum.tasks > 0 ? parseFloat(((sum.done / sum.tasks) * 100).toFixed(1)) : 0
    const rectifyRate = sum.hazards > 0 ? parseFloat(((sum.rectified / sum.hazards) * 100).toFixed(1)) : 0
    months.push({
      period,
      任务数: sum.tasks,
      完成数: sum.done,
      任务完成率: doneRate,
      确认隐患数: sum.hazards,
      已整改: sum.rectified,
      整改完成率: rectifyRate,
    })
  }

  return months
}

// 生成近30天的趋势数据（使用确定性数据）
const generateDailyTrendData = (): TrendDataPoint[] => {
  const days: TrendDataPoint[] = []
  const now = new Date(2026, 5, 15) // 2026-06-15

  // 从 VILLAGE_ROWS 汇总当前月数据（与表1同源，仅2026-06）
  const currentMonth = VILLAGE_ROWS.filter(r => r.date.startsWith('2026-06'))
  const currentTasks = currentMonth.reduce((s, r) => s + r.fzjz.newTasks + r.rcjc.newTasks + r.sync141.newTasks, 0)
  const currentDone = currentMonth.reduce((s, r) => s + r.fzjz.newDone + r.rcjc.newDone + r.sync141.newDone, 0)
  const currentHazards = currentMonth.reduce((s, r) => s + r.fzjz.newHazard + r.rcjc.newHazard + r.sync141.newHazard, 0)
  const currentRectified = currentMonth.reduce((s, r) => s + r.fzjz.newRectified + r.rcjc.newRectified + r.sync141.newRectified, 0)

  // 日均值
  const dailyAvgTasks = Math.round(currentTasks / 30)
  const dailyAvgDone = Math.round(currentDone / 30)
  const dailyAvgHazards = Math.round(currentHazards / 30)
  const dailyAvgRectified = Math.round(currentRectified / 30)

  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    const month = date.getMonth() + 1
    const day = date.getDate()
    const period = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // 模拟每日波动（周末偏低）
    const weekDay = (29 - i) % 7
    const dayMult = weekDay >= 5 ? 0.5 : (0.8 + Math.sin(i * 0.5) * 0.2)
    const tasks = Math.max(1, Math.round(dailyAvgTasks * dayMult))
    const done = Math.max(1, Math.round(dailyAvgDone * dayMult))
    const hazards = Math.max(1, Math.round(dailyAvgHazards * dayMult))
    const rectified = Math.max(0, Math.min(hazards - 1, Math.round(dailyAvgRectified * dayMult)))

    days.push({
      period,
      每日新增任务数: tasks,
      每日完成任务数: done,
      每日确认隐患数: hazards,
      每日整改隐患数: rectified,
    })
  }

  return days
}

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

// 颜色：绿色(高)、黄色(中)、红色(低)
function rateColor(rate: string): string {
  const n = parseFloat(rate)
  if (n === 100) return '#059669'
  if (n >= 80) return '#10B981'
  if (n >= 50) return '#F59E0B'
  if (n >= 20) return '#EF4444'
  return '#DC2626'
}

// 完成率：只显示百分比文字
function RateText({ rate }: { rate: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{rate}</span>
  )
}

// ─── 排序列类型 ───────────────────────────────────────────────────────────
type SortCol = 'village' |
  'fzjz_total' | 'fzjz_done' | 'fzjz_newTasks' | 'fzjz_newDone' | 'fzjz_doneRate' | 'fzjz_hazard' | 'fzjz_newHazard' | 'fzjz_rectified' | 'fzjz_rectifying' | 'fzjz_majorHazard' | 'fzjz_newRectified' | 'fzjz_rectifiedRate' |
  'rcjc_total' | 'rcjc_done' | 'rcjc_newTasks' | 'rcjc_newDone' | 'rcjc_doneRate' | 'rcjc_hazard' | 'rcjc_newHazard' | 'rcjc_rectified' | 'rcjc_rectifying' | 'rcjc_majorHazard' | 'rcjc_newRectified' | 'rcjc_rectifiedRate' |
  'sync141_total' | 'sync141_done' | 'sync141_newTasks' | 'sync141_newDone' | 'sync141_doneRate' | 'sync141_hazard' | 'sync141_newHazard' | 'sync141_rectified' | 'sync141_rectifying' | 'sync141_majorHazard' | 'sync141_newRectified' | 'sync141_rectifiedRate' |
  // 总计视图（合并三个维度）
  'all_newTasks' | 'all_newDone' | 'all_doneRate' | 'all_newHazard' | 'all_majorHazard' | 'all_newRectified' | 'all_rectifying' | 'all_rectifiedRate'

function getSortValue(row: VillageRow, col: SortCol): number {
  switch (col) {
    case 'village': return 0
    // 防灾减灾
    case 'fzjz_total': return row.fzjz.total
    case 'fzjz_done': return row.fzjz.done
    case 'fzjz_newTasks': return row.fzjz.newTasks
    case 'fzjz_newDone': return row.fzjz.newDone
    case 'fzjz_hazard': return row.fzjz.hazard
    case 'fzjz_newHazard': return row.fzjz.newHazard
    case 'fzjz_rectified': return row.fzjz.rectified
    case 'fzjz_rectifying': return row.fzjz.rectifying
    case 'fzjz_majorHazard': return row.fzjz.majorHazard
    case 'fzjz_newRectified': return row.fzjz.newRectified
    case 'fzjz_doneRate': return row.fzjz.newTasks > 0 ? row.fzjz.newDone / row.fzjz.newTasks : 0
    case 'fzjz_rectifiedRate': return row.fzjz.newHazard > 0 ? row.fzjz.newRectified / row.fzjz.newHazard : 0
    // 日常检查
    case 'rcjc_total': return row.rcjc.total
    case 'rcjc_done': return row.rcjc.done
    case 'rcjc_newTasks': return row.rcjc.newTasks
    case 'rcjc_newDone': return row.rcjc.newDone
    case 'rcjc_hazard': return row.rcjc.hazard
    case 'rcjc_newHazard': return row.rcjc.newHazard
    case 'rcjc_rectified': return row.rcjc.rectified
    case 'rcjc_rectifying': return row.rcjc.rectifying
    case 'rcjc_majorHazard': return row.rcjc.majorHazard
    case 'rcjc_newRectified': return row.rcjc.newRectified
    case 'rcjc_doneRate': return row.rcjc.newTasks > 0 ? row.rcjc.newDone / row.rcjc.newTasks : 0
    case 'rcjc_rectifiedRate': return row.rcjc.newHazard > 0 ? row.rcjc.newRectified / row.rcjc.newHazard : 0
    // 141同步
    case 'sync141_total': return row.sync141.total
    case 'sync141_done': return row.sync141.done
    case 'sync141_newTasks': return row.sync141.newTasks
    case 'sync141_newDone': return row.sync141.newDone
    case 'sync141_hazard': return row.sync141.hazard
    case 'sync141_newHazard': return row.sync141.newHazard
    case 'sync141_rectified': return row.sync141.rectified
    case 'sync141_rectifying': return row.sync141.rectifying
    case 'sync141_majorHazard': return row.sync141.majorHazard
    case 'sync141_newRectified': return row.sync141.newRectified
    case 'sync141_doneRate': return row.sync141.newTasks > 0 ? row.sync141.newDone / row.sync141.newTasks : 0
    case 'sync141_rectifiedRate': return row.sync141.newHazard > 0 ? row.sync141.newRectified / row.sync141.newHazard : 0
    // 总计视图（合并三个维度）
    case 'all_newTasks': return row.rcjc.newTasks + row.sync141.newTasks + row.fzjz.newTasks
    case 'all_newDone': return row.rcjc.newDone + row.sync141.newDone + row.fzjz.newDone
    case 'all_doneRate': { const t = row.rcjc.newTasks + row.sync141.newTasks + row.fzjz.newTasks; return t > 0 ? (row.rcjc.newDone + row.sync141.newDone + row.fzjz.newDone) / t : 0 }
    case 'all_newHazard': return row.rcjc.newHazard + row.sync141.newHazard + row.fzjz.newHazard
    case 'all_majorHazard': return row.rcjc.majorHazard + row.sync141.majorHazard + row.fzjz.majorHazard
    case 'all_newRectified': return row.rcjc.newRectified + row.sync141.newRectified + row.fzjz.newRectified
    case 'all_rectifying': { const h = row.rcjc.newHazard + row.sync141.newHazard + row.fzjz.newHazard; const r = row.rcjc.newRectified + row.sync141.newRectified + row.fzjz.newRectified; return Math.max(0, h - r) }
    case 'all_rectifiedRate': { const h = row.rcjc.newHazard + row.sync141.newHazard + row.fzjz.newHazard; const r = row.rcjc.newRectified + row.sync141.newRectified + row.fzjz.newRectified; return h > 0 ? r / h : 0 }
  }
}

// 合并两个 TaskSub（用于多月聚合）
function mergeSub(a: TaskSub, b: TaskSub): TaskSub {
  return {
    total: a.total + b.total,
    done: a.done + b.done,
    hazard: a.hazard + b.hazard,
    rectified: a.rectified + b.rectified,
    rectifying: a.rectifying + b.rectifying,
    newTasks: a.newTasks + b.newTasks,
    newDone: a.newDone + b.newDone,
    newHazard: a.newHazard + b.newHazard,
    newRectified: a.newRectified + b.newRectified,
    majorHazard: a.majorHazard + b.majorHazard,
  }
}

function rateStr(done: number, total: number): string {
  if (total === 0) return '0.00%'
  return ((done / total) * 100).toFixed(2) + '%'
}

// ─── 自定义Tooltip：近12月（按Legend顺序展示，百分比加%） ─────────────────
const MONTHLY_TOOLTIP_ORDER = [
  { key: '任务数', label: '任务数', unit: '', color: '#7C3AED' },
  { key: '完成数', label: '完成数', unit: '', color: '#4F46E5' },
  { key: '确认隐患数', label: '确认隐患数', unit: '', color: '#DC2626' },
  { key: '已整改', label: '已整改', unit: '', color: '#059669' },
  { key: '任务完成率', label: '任务完成率', unit: '%', color: '#F59E0B' },
  { key: '整改完成率', label: '整改完成率', unit: '%', color: '#EC4899' },
]

const MonthlyTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]?.payload || {}
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #F3F4F6' }}>{label}</div>
      {MONTHLY_TOOLTIP_ORDER.map(({ key, label: itemLabel, unit, color }) => {
        const val = data[key]
        if (val == null) return null
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '2px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
              {itemLabel}
            </span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{val}{unit}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── 自定义Tooltip：近30天（按Legend顺序展示） ─────────────────
const DAILY_TOOLTIP_ORDER = [
  { key: '每日新增任务数', label: '每日新增任务数', unit: '', color: '#7C3AED' },
  { key: '每日完成任务数', label: '每日完成任务数', unit: '', color: '#4F46E5' },
  { key: '每日确认隐患数', label: '每日确认隐患数', unit: '', color: '#DC2626' },
  { key: '每日整改隐患数', label: '每日整改隐患数', unit: '', color: '#059669' },
]

const DailyTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]?.payload || {}
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #F3F4F6' }}>{label}</div>
      {DAILY_TOOLTIP_ORDER.map(({ key, label: itemLabel, unit, color }) => {
        const val = data[key]
        if (val == null) return null
        return (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '2px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
              {itemLabel}
            </span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{val}{unit}</span>
          </div>
        )
      })}
    </div>
  )
}

export function YuzhiSyncDimension() {
  const [selectedVillages, setSelectedVillages] = useState<string[]>([])
  const [draftSelected, setDraftSelected] = useState<string[]>([])
  const [showVillageDropdown, setShowVillageDropdown] = useState(false)
  const [workloadDimension, setWorkloadDimension] = useState<'yesterday' | 'week' | 'lastWeek' | 'month' | 'lastMonth'>('yesterday')
  const [progressDimension, setProgressDimension] = useState<'month' | 'lastMonth' | 'year' | 'lastYear'>('month')
  const [sortBy, setSortBy] = useState<SortCol>('fzjz_done')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 10
  // 时间筛选
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [dateTo, setDateTo] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [quickRange, setQuickRange] = useState<'month' | 'lastMonth' | 'quarter' | 'year' | ''>('month')
  const [timeDimension, setTimeDimension] = useState<'12months' | '30days'>('12months')
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null)
  const [showTableHelp, setShowTableHelp] = useState(false) // 表1指标说明悬浮框
  const [selectedCard, setSelectedCard] = useState<'all' | 'rcjc' | 'sync141' | 'fzjz'>('all') // 卡片联动：总计/日常检查/三方同步任务/防灾减灾
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!showVillageDropdown) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target) && triggerRef.current && !triggerRef.current.contains(target)) {
        setShowVillageDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showVillageDropdown])

  // ─── 导出 CSV ───────────────────────────────────────
  const handleExport = () => {
    const BOM = '\uFEFF'
    const subHeaders = ['任务数', '完成数', '任务完成率', '确认隐患数', '重大事故隐患数', '已整改', '整改中', '整改完成率']
    const csvRows: string[] = [
      ['村社', ...subHeaders].join(','),
    ]

    const rows = filteredVillages
    for (const row of rows) {
      const getVal = (key: keyof TaskSub) => {
        if (selectedCard === 'all') return row.rcjc[key] + row.sync141[key] + row.fzjz[key]
        return row[selectedCard][key]
      }
      const tasks = getVal('newTasks')
      const done = getVal('newDone')
      const hazard = getVal('newHazard')
      const major = getVal('majorHazard')
      const rectified = getVal('newRectified')
      const rectifying = Math.max(0, hazard - rectified)
      const calcRate = (d: number, t: number) => t > 0 ? `${((d / t) * 100).toFixed(2)}%` : '0.00%'
      csvRows.push([
        `"${row.village}"`,
        String(tasks), String(done), calcRate(done, tasks),
        String(hazard), String(major), String(rectified), String(rectifying), calcRate(rectified, hazard),
      ].join(','))
    }

    const csv = BOM + csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`
    a.download = `村社检查任务统计_${ts}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allVillages = VILLAGE_ROWS

  const filteredVillages = useMemo(() => {
    let matched = allVillages
    // 时间筛选（按年月匹配）
    if (dateFrom) {
      matched = matched.filter(r => r.date.substring(0, 7) >= dateFrom)
    }
    if (dateTo) {
      matched = matched.filter(r => r.date.substring(0, 7) <= dateTo)
    }
    // 村社筛选
    if (selectedVillages.length > 0) {
      matched = matched.filter(r => selectedVillages.includes(r.village))
    }
    // 多月筛选时，聚合相同村社的数据（本季/本年）
    const needsAggregation = dateFrom && dateTo && dateFrom !== dateTo
    if (needsAggregation) {
      const merged = new Map<string, VillageRow>()
      for (const r of matched) {
        const existing = merged.get(r.village)
        if (existing) {
          existing.fzjz = mergeSub(existing.fzjz, r.fzjz)
          existing.rcjc = mergeSub(existing.rcjc, r.rcjc)
          existing.sync141 = mergeSub(existing.sync141, r.sync141)
          // 保留最新的 date
          if (r.date > existing.date) existing.date = r.date
        } else {
          merged.set(r.village, { ...r, fzjz: { ...r.fzjz }, rcjc: { ...r.rcjc }, sync141: { ...r.sync141 } })
        }
      }
      matched = [...merged.values()]
    }
    const sorted = [...matched].sort((a, b) => {
      if (sortBy === 'village') {
        const cmp = a.village.localeCompare(b.village, 'zh')
        return sortDir === 'asc' ? cmp : -cmp
      }
      const cmp = getSortValue(a, sortBy) - getSortValue(b, sortBy)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [allVillages, selectedVillages, sortBy, sortDir, dateFrom, dateTo])

  // 截止日期：取筛选区间的最大值
  const displayDate = useMemo(() => {
    const today = (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()
    if (dateTo) {
      const [y, m] = dateTo.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      return `${dateTo}-${String(lastDay).padStart(2, '0')}`
    }
    if (dateFrom) {
      // 区间起点为 dateFrom，终点为今天，最大值为今天
      return today
    }
    return today
  }, [dateFrom, dateTo])

  // 分页
  const totalPages = Math.max(1, Math.ceil(filteredVillages.length / pageSize))
  const pagedVillages = useMemo(() => {
    return filteredVillages.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredVillages, page])

  // 筛选/排序变化时重置到第一页
  useEffect(() => {
    setPage(1)
  }, [selectedVillages, sortBy, sortDir, dateFrom, dateTo])

  // 快速筛选：本月/上月/本季/本年
  const applyQuickRange = (range: 'month' | 'lastMonth' | 'quarter' | 'year') => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() // 0-11
    let from = ''
    let to = ''
    const pad = (n: number) => String(n).padStart(2, '0')
    switch (range) {
      case 'month': {
        from = `${y}-${pad(m + 1)}`
        to = `${y}-${pad(m + 1)}`
        break
      }
      case 'lastMonth': {
        const lastMonth = m === 0 ? 11 : m - 1
        const lastYear = m === 0 ? y - 1 : y
        from = `${lastYear}-${pad(lastMonth + 1)}`
        to = `${lastYear}-${pad(lastMonth + 1)}`
        break
      }
      case 'quarter': {
        const qStartMonth = Math.floor(m / 3) * 3 // 0, 3, 6, 9
        const qEndMonth = qStartMonth + 2
        from = `${y}-${pad(qStartMonth + 1)}`
        to = `${y}-${pad(qEndMonth + 1)}`
        break
      }
      case 'year': {
        from = `${y}-01`
        to = `${y}-12`
        break
      }
    }
    setDateFrom(from)
    setDateTo(to)
    setQuickRange(range)
  }

  // 清除时间
  const clearDate = () => {
    setDateFrom('')
    setDateTo('')
    setQuickRange('')
  }

  const toggleVillage = (v: string) => {
    setDraftSelected(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
  }
  const confirmVillageFilter = () => {
    setSelectedVillages(draftSelected)
    setShowVillageDropdown(false)
  }
  const clearVillageFilter = () => {
    setDraftSelected([])
    setSelectedVillages([])
    setShowVillageDropdown(false)
  }

  // 全量汇总统计（用于表1顶部统计行 - 基于筛选后的数据）
  const overallStats = useMemo(() => {
    const zero: TaskSub = { total: 0, done: 0, hazard: 0, rectified: 0, rectifying: 0, newTasks: 0, newDone: 0, newHazard: 0, newRectified: 0, majorHazard: 0 }
    const data = filteredVillages // 使用筛选后的数据
    const sum = data.reduce((acc, r) => ({
      fzjz: {
        total: acc.fzjz.total + r.fzjz.total,
        done: acc.fzjz.done + r.fzjz.done,
        hazard: acc.fzjz.hazard + r.fzjz.hazard,
        rectified: acc.fzjz.rectified + r.fzjz.rectified,
        rectifying: acc.fzjz.rectifying + r.fzjz.rectifying,
        newTasks: acc.fzjz.newTasks + r.fzjz.newTasks,
        newDone: acc.fzjz.newDone + r.fzjz.newDone,
        newHazard: acc.fzjz.newHazard + r.fzjz.newHazard,
        newRectified: acc.fzjz.newRectified + r.fzjz.newRectified,
        majorHazard: acc.fzjz.majorHazard + r.fzjz.majorHazard,
      },
      rcjc: {
        total: acc.rcjc.total + r.rcjc.total,
        done: acc.rcjc.done + r.rcjc.done,
        hazard: acc.rcjc.hazard + r.rcjc.hazard,
        rectified: acc.rcjc.rectified + r.rcjc.rectified,
        rectifying: acc.rcjc.rectifying + r.rcjc.rectifying,
        newTasks: acc.rcjc.newTasks + r.rcjc.newTasks,
        newDone: acc.rcjc.newDone + r.rcjc.newDone,
        newHazard: acc.rcjc.newHazard + r.rcjc.newHazard,
        newRectified: acc.rcjc.newRectified + r.rcjc.newRectified,
        majorHazard: acc.rcjc.majorHazard + r.rcjc.majorHazard,
      },
      sync141: {
        total: acc.sync141.total + r.sync141.total,
        done: acc.sync141.done + r.sync141.done,
        hazard: acc.sync141.hazard + r.sync141.hazard,
        rectified: acc.sync141.rectified + r.sync141.rectified,
        rectifying: acc.sync141.rectifying + r.sync141.rectifying,
        newTasks: acc.sync141.newTasks + r.sync141.newTasks,
        newDone: acc.sync141.newDone + r.sync141.newDone,
        newHazard: acc.sync141.newHazard + r.sync141.newHazard,
        newRectified: acc.sync141.newRectified + r.sync141.newRectified,
        majorHazard: acc.sync141.majorHazard + r.sync141.majorHazard,
      },
    }), { fzjz: zero, rcjc: zero, sync141: zero })
    return sum
  }, [filteredVillages])

  const handleSort = (col: SortCol) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir(col === 'village' ? 'asc' : 'desc')
    }
  }

  // 可排序表头
  const SortTh = ({ col, label, extraStyle }: { col: SortCol; label: string; extraStyle?: React.CSSProperties }) => (
    <th
      style={{ ...th, cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      onClick={() => handleSort(col)}
    >
      {label}
      <span style={{ marginLeft: 2, fontSize: 9, opacity: 0.5 }}>
        {sortBy === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  )

  // 分组表头：类别名 + 子列
  const GroupTh = ({ label, colSpan, bg }: { label: string; colSpan: number; bg?: string }) => (
    <th colSpan={colSpan} style={{ ...th, background: bg || '#E5E7EB', fontWeight: 700, fontSize: 12, color: '#374151' }}>
      {label}
    </th>
  )

  // 表1列定义（8个指标，全部以任务创建时间为准）
  const subCols = ['任务数', '完成数', '任务完成率', '确认隐患数', '重大事故隐患数', '已整改', '整改中', '整改完成率'] as const
  // 指标说明（悬浮备注）
  const tableMetrics = [
    { name: '任务数', definition: '查询期间创建的任务数量' },
    { name: '完成数', definition: '查询期间创建的任务中，已完成的数量' },
    { name: '任务完成率', definition: '查询期间创建的任务中，完成数/任务数' },
    { name: '确认隐患数', definition: '查询期间创建的任务中，发现的隐患数量' },
    { name: '重大事故隐患数', definition: '查询期间创建的任务中，发现的隐患中属重大事故隐患的数量' },
    { name: '已整改', definition: '查询期间创建的任务中，已整改的隐患数量' },
    { name: '整改中', definition: '查询期间创建的任务中，整改中的隐患数量' },
    { name: '整改完成率', definition: '查询期间创建的任务中，已整改隐患数/确认隐患数' },
  ] as const

  // 渲染某个 TaskSub 的子列（8个指标，全部以任务创建时间为准），isLast 表示是否最后一类
  function renderSubCols(sub: TaskSub, subBg?: string, isLast = false) {
    const taskRate    = rateStr(sub.newDone, sub.newTasks)
    const hazardRate  = rateStr(sub.newRectified, sub.newHazard)
    const lastStyle: React.CSSProperties = isLast ? {} : { borderRight: '2px solid #D1D5DB' }
    const pendingHazard = Math.max(0, sub.newHazard - sub.newRectified)
    return (
      <>
        {/* 1.任务数 */}
        <td style={td({ textAlign: 'center', fontWeight: 600, color: '#111827', background: subBg })}>
          {sub.newTasks.toLocaleString()}
        </td>
        {/* 2.完成数 */}
        <td style={td({ textAlign: 'center', fontWeight: 600, color: '#111827', background: subBg })}>
          {sub.newDone.toLocaleString()}
        </td>
        {/* 3.任务完成率 */}
        <td style={td({ textAlign: 'center', background: subBg })}>
          <RateText rate={taskRate} />
        </td>
        {/* 4.确认隐患数 */}
        <td style={td({ textAlign: 'center', color: '#111827', fontWeight: sub.newHazard > 0 ? 600 : 400, background: subBg })}>
          {sub.newHazard.toLocaleString()}
        </td>
        {/* 5.重大事故隐患数 */}
        <td style={td({ textAlign: 'center', color: sub.majorHazard > 0 ? '#B91C1C' : '#9CA3AF', fontWeight: sub.majorHazard > 0 ? 600 : 400, background: subBg })}>
          {sub.majorHazard.toLocaleString()}
        </td>
        {/* 6.已整改 */}
        <td style={{ ...td({ textAlign: 'center', background: subBg }), color: '#111827', fontWeight: sub.newRectified > 0 ? 600 : 400 }}>
          {sub.newRectified.toLocaleString()}
        </td>
        {/* 7.整改中 */}
        <td style={{ ...td({ textAlign: 'center', background: subBg }), color: '#111827', fontWeight: pendingHazard > 0 ? 600 : 400 }}>
          {pendingHazard.toLocaleString()}
        </td>
        {/* 8.整改完成率 */}
        <td style={{ ...td({ textAlign: 'center', background: subBg, ...lastStyle }) }}>
          <RateText rate={hazardRate} />
        </td>
      </>
    )
  }

  const totalColSpan = selectedCard === 'all' ? (1 + 1 + 3 * 8) : (1 + 1 + 8) // 全部: #+村社+3类×8=26, 单个: #+村社+8=10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ─── 全局筛选栏 ─────────────────────────────────────── */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* 村社筛选 */}
        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>村社：</span>
        {selectedVillages.length > 0 && (
          <span style={{ fontSize: 12, color: '#6B7280' }}>已选 {selectedVillages.length} 个</span>
        )}
        <div style={{ position: 'relative' }}>
          <div
            ref={triggerRef}
            onClick={() => {
              if (!showVillageDropdown) {
                setDraftSelected([...selectedVillages])
                if (triggerRef.current) {
                  setDropdownStyle({
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: 260,
                    maxHeight: 360,
                    marginTop: 2,
                  })
                }
              }
              setShowVillageDropdown(!showVillageDropdown)
            }}
            style={{
              padding: '3px 10px', border: '1px solid #D1D5DB', borderRadius: 4,
              fontSize: 12, cursor: 'pointer', background: 'white',
              display: 'flex', alignItems: 'center', gap: 6, minWidth: 140, userSelect: 'none',
            }}
          >
            <span style={{ color: selectedVillages.length > 0 ? '#111827' : '#9CA3AF' }}>
              {selectedVillages.length > 0
                ? selectedVillages.length === 1
                  ? selectedVillages[0]
                  : `${selectedVillages[0]} 等${selectedVillages.length}个`
                : '全部村社'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF' }}>
              {showVillageDropdown ? '▲' : '▼'}
            </span>
          </div>
          {showVillageDropdown && (
            <div ref={dropdownRef} style={{
              ...dropdownStyle, background: 'white', border: '1px solid #E5E7EB',
              borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 1000,
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '6px 10px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={clearVillageFilter} style={{ border: 'none', background: '#F3F4F6', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 8px', color: '#6B7280' }}>清除</button>
                <button onClick={() => setDraftSelected(allVillages.map(v => v.village))} style={{ border: 'none', background: '#F3F4F6', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 8px', color: '#6B7280' }}>全选</button>
                <div style={{ flex: 1 }} />
                <button onClick={confirmVillageFilter} style={{ border: 'none', background: '#4F46E5', borderRadius: 3, cursor: 'pointer', fontSize: 11, padding: '2px 10px', color: 'white' }}>确定</button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {allVillages.map(v => {
                  const checked = draftSelected.includes(v.village)
                  return (
                    <label key={v.village} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 13, background: checked ? '#EFF6FF' : 'transparent' }}
                      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                      onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggleVillage(v.village)} style={{ accentColor: '#4F46E5' }} />
                      {v.village}
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 指标统计看板 ─────────────────────────────────────── */}
      {(() => {
        const data = selectedVillages.length > 0 ? filteredVillages : allVillages
        let ent = 0, ven = 0, rent = 0
        // 风险等级累加
        let riskLevelsEnt = { major: 0, upper: 0, general: 0, low: 0 }
        let riskLevelsRent = { major: 0, upper: 0, general: 0, low: 0 }
        let venueTypesVen = { key: 0, general: 0, nineSmall: 0 }
        for (const r of data) {
          ent += r.enterpriseCount
          ven += r.venueCount
          rent += r.rentalCount
        }
        // 汇总所有村社mock的风险/类型分布
        for (const r of data) {
          const eRisk = mockRiskLevels(r.village, r.enterpriseCount)
          riskLevelsEnt.major += eRisk.major
          riskLevelsEnt.upper += eRisk.upper
          riskLevelsEnt.general += eRisk.general
          riskLevelsEnt.low += eRisk.low
          const rRisk = mockRiskLevels(r.village + '_rent', r.rentalCount)
          riskLevelsRent.major += rRisk.major
          riskLevelsRent.upper += rRisk.upper
          riskLevelsRent.general += rRisk.general
          riskLevelsRent.low += rRisk.low
          const vType = mockVenueTypes(r.village, r.venueCount)
          venueTypesVen.key += vType.key
          venueTypesVen.general += vType.general
          venueTypesVen.nineSmall += vType.nineSmall
        }
        const entReg = Math.round(ent * 0.82)
        const venReg = Math.round(ven * 0.84)
        const rentReg = Math.round(rent * 0.82)
        const total = ent + ven + rent
        const totalReg = entReg + venReg + rentReg
        const rate = (v: number, base: number) => base > 0 ? `${((v / base) * 100).toFixed(2)}%` : '-'

        // 任务统计指标定义（用于第4个指标卡）—— 全部以任务创建时间为准
  const taskStatMetrics = [
    { name: '任务数', definition: '查询期间创建的任务数量' },
    { name: '任务完成率', definition: '查询期间创建的任务中，完成数/任务数' },
    { name: '确认隐患数', definition: '查询期间创建的任务中，发现的隐患数量' },
    { name: '重大事故隐患', definition: '查询期间创建的任务中，发现的隐患中属重大事故隐患的数量' },
    { name: '整改完成率', definition: '查询期间创建的任务中，已整改隐患数/确认隐患数' },
  ] as const

  // 生成任务统计数据（昨日 + 上周）—— 全部以任务创建时间为准
  const generateTaskStats = () => {
    const data = selectedVillages.length > 0 ? filteredVillages : allVillages

    // 期间数据：直接从数据的 newTasks/newDone/newHazard/newRectified/majorHazard 汇总
    const periodNewTasks      = data.reduce((sum, r) => sum + r.fzjz.newTasks       + r.rcjc.newTasks       + r.sync141.newTasks, 0)
    const periodNewDone       = data.reduce((sum, r) => sum + r.fzjz.newDone        + r.rcjc.newDone        + r.sync141.newDone, 0)
    const periodNewHazard    = data.reduce((sum, r) => sum + r.fzjz.newHazard     + r.rcjc.newHazard     + r.sync141.newHazard, 0)
    const periodMajorHazard  = data.reduce((sum, r) => sum + r.fzjz.majorHazard   + r.rcjc.majorHazard   + r.sync141.majorHazard, 0)
    const periodNewRectified = data.reduce((sum, r) => sum + r.fzjz.newRectified  + r.rcjc.newRectified  + r.sync141.newRectified, 0)

    // 昨日数据（模拟1天）：期间数据 ÷ 7 取日均值
    const yesterdayNew      = Math.max(1, Math.round(periodNewTasks / 7))
    const yesterdayDone     = Math.max(1, Math.round(periodNewDone / 7))
    const yesterdayHazard   = Math.max(1, Math.round(periodNewHazard / 7))
    const yesterdayMajor    = Math.max(0, Math.round(periodMajorHazard / 7))
    const yesterdayRectified = Math.max(0, Math.round(periodNewRectified / 7))
    const yesterdayTaskRate   = periodNewTasks > 0 ? Math.round((periodNewDone / periodNewTasks) * 100) : 0
    const yesterdayHazardRate = periodNewHazard > 0 ? Math.round((periodNewRectified / periodNewHazard) * 100) : 0

    // 上周数据（模拟7天）：直接用期间数据
    const lastWeekNew      = periodNewTasks
    const lastWeekDone     = periodNewDone
    const lastWeekHazard   = periodNewHazard
    const lastWeekMajor    = periodMajorHazard
    const lastWeekRectified = periodNewRectified
    const lastWeekTaskRate   = yesterdayTaskRate
    const lastWeekHazardRate = yesterdayHazardRate

    return {
      yesterday: [yesterdayNew, yesterdayTaskRate, yesterdayHazard, yesterdayMajor, yesterdayHazardRate],
      lastWeek:  [lastWeekNew,  lastWeekTaskRate,  lastWeekHazard,  lastWeekMajor,  lastWeekHazardRate],
    }
  }

        const cards = [
          {
            label: '企业数',
            value: ent,
            unit: '户',
            color: '#111827',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            icon: '🏢',
            registered: entReg,
            registeredRate: rate(entReg, ent),
            riskLevels: riskLevelsEnt,
          },
          {
            label: '场所数',
            value: ven,
            unit: '户',
            color: '#111827',
            bg: '#F0FDF4',
            border: '#A7F3D0',
            icon: '🏪',
            registered: venReg,
            registeredRate: rate(venReg, ven),
            venueTypes: venueTypesVen,
          },
          {
            label: '出租房数',
            value: rent,
            unit: '户',
            color: '#111827',
            bg: '#FAF5FF',
            border: '#DDD6FE',
            icon: '🏠',
            registered: rentReg,
            registeredRate: rate(rentReg, rent),
            riskLevels: riskLevelsRent,
          },
        ]

        return (
      <div style={{ display: 'flex', gap: 12 }}>
        {/* 责任主体总数 */}
        <div
          style={{
            flex: 1,
            background: '#FEFCE8',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>📋</div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>责任主体总数</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{total.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: '#111827', fontWeight: 500 }}>户</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, borderTop: '1px dashed #FDE68A', paddingTop: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>已注册数</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{totalReg.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2 }}>户</span></div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>注册率</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{rate(totalReg, total)}</div>
            </div>
          </div>
        </div>
        {cards.map(item => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: item.bg,
              border: `1px solid ${item.border}`,
              borderRadius: 8,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* 第一行：图标 + 标签 + 主数值 + 单位 + 维度分类 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 26, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>{item.unit}</span>
                  {/* 维度分类标签（内联到右侧） */}
                  {item.riskLevels && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginLeft: 4 }}>
                      <InlineDot color="#DC2626" label="重大风险" count={item.riskLevels.major} />
                      <InlineDot color="#EA580C" label="较大风险" count={item.riskLevels.upper} />
                      <InlineDot color="#D97706" label="一般风险" count={item.riskLevels.general} />
                      <InlineDot color="#3B82F6" label="低风险" count={item.riskLevels.low} />
                    </div>
                  )}
                  {item.venueTypes && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginLeft: 4 }}>
                      <InlineDot color="#DC2626" label="消防重点单位" count={item.venueTypes.key} />
                      <InlineDot color="#3B82F6" label="一般单位" count={item.venueTypes.general} />
                      <InlineDot color="#D97706" label="九小场所" count={item.venueTypes.nineSmall} />
                    </div>
                  )}
                </div>
                {/* 第二行：已注册 + 注册率 */}
                <div style={{ display: 'flex', gap: 16, marginTop: 6, borderTop: `1px dashed ${item.border}`, paddingTop: 6 }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>已注册 <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.registered.toLocaleString()}</span> <span style={{ fontSize: 9 }}>{item.unit}</span></div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>注册率 <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.registeredRate}</span></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
    })()}

        {/* ─── 工作量统计 + 本月进度 ──────────────────────── */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* 工作量统计（带昨日/本周/上周切换） */}
          {(() => {
            const data = selectedVillages.length > 0 ? filteredVillages : allVillages
            const periodNewTasks      = data.reduce((sum, r) => sum + r.fzjz.newTasks       + r.rcjc.newTasks       + r.sync141.newTasks, 0)
            const periodNewDone       = data.reduce((sum, r) => sum + r.fzjz.newDone        + r.rcjc.newDone        + r.sync141.newDone, 0)
            const periodNewHazard    = data.reduce((sum, r) => sum + r.fzjz.newHazard     + r.rcjc.newHazard     + r.sync141.newHazard, 0)
            const periodMajorHazard  = data.reduce((sum, r) => sum + r.fzjz.majorHazard   + r.rcjc.majorHazard   + r.sync141.majorHazard, 0)
            const periodNewRectified = data.reduce((sum, r) => sum + r.fzjz.newRectified  + r.rcjc.newRectified  + r.sync141.newRectified, 0)

            // 昨日数据（除以7模拟）
            const yesterdayVals = {
              tasks: Math.max(1, Math.round(periodNewTasks / 7)),
              done: Math.max(1, Math.round(periodNewDone / 7)),
              hazard: Math.max(1, Math.round(periodNewHazard / 7)),
              major: Math.max(0, Math.round(periodMajorHazard / 7)),
              rectified: Math.max(0, Math.round(periodNewRectified / 7)),
            }

            // 本周数据
            const now = new Date()
            const todayDay = now.getDay() === 0 ? 6 : now.getDay() - 1
            const ws = new Date(now); ws.setDate(now.getDate() - todayDay)
            const we = new Date(ws); we.setDate(ws.getDate() + 6)
            const fym = (d: Date) => d.toISOString().substring(0, 7)
            const thisWeekRows = allVillages.filter(r => r.date >= fym(ws) && r.date <= fym(we))
            const sf = (rows: VillageRow[], f: keyof TaskSub) => rows.reduce((s,r) => s + r.fzjz[f] + r.rcjc[f] + r.sync141[f], 0)
            const weekVals = {
              tasks: sf(thisWeekRows, 'newTasks'),
              done: sf(thisWeekRows, 'newDone'),
              hazard: sf(thisWeekRows, 'newHazard'),
              major: sf(thisWeekRows, 'majorHazard'),
              rectified: sf(thisWeekRows, 'newRectified'),
            }

            // 上周数值（等于期间数据）
            const lastWeekVals = {
              tasks: periodNewTasks,
              done: periodNewDone,
              hazard: periodNewHazard,
              major: periodMajorHazard,
              rectified: periodNewRectified,
            }

            // 本月/上月数据
            const curYmForWL = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
            const lastM = now.getMonth() === 0 ? 11 : now.getMonth() - 1
            const lastMY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
            const lastYm = `${lastMY}-${String(lastM+1).padStart(2,'0')}`
            const curMonthRowsWL = allVillages.filter(r => r.date.startsWith(curYmForWL))
            const lastMonthRowsWL = allVillages.filter(r => r.date.startsWith(lastYm))
            const monthVals = {
              tasks: sf(curMonthRowsWL, 'newTasks'),
              done: sf(curMonthRowsWL, 'newDone'),
              hazard: sf(curMonthRowsWL, 'newHazard'),
              major: sf(curMonthRowsWL, 'majorHazard'),
              rectified: sf(curMonthRowsWL, 'newRectified'),
            }
            const lastMonthVals = {
              tasks: sf(lastMonthRowsWL, 'newTasks'),
              done: sf(lastMonthRowsWL, 'newDone'),
              hazard: sf(lastMonthRowsWL, 'newHazard'),
              major: sf(lastMonthRowsWL, 'majorHazard'),
              rectified: sf(lastMonthRowsWL, 'newRectified'),
            }

            const current = workloadDimension === 'yesterday' ? yesterdayVals : workloadDimension === 'week' ? weekVals : workloadDimension === 'lastWeek' ? lastWeekVals : workloadDimension === 'month' ? monthVals : lastMonthVals
            const prefix = workloadDimension === 'yesterday' ? '昨日' : workloadDimension === 'week' ? '本周' : workloadDimension === 'lastWeek' ? '上周' : workloadDimension === 'month' ? '本月' : '上月'

            const metrics = [
              { label: `${prefix}新建任务数`, value: current.tasks, desc: `${prefix}创建的任务数量` },
              { label: `${prefix}完成任务数`, value: current.done, desc: `${prefix}完成的任务数量` },
              { label: `${prefix}确认隐患数`, value: current.hazard, desc: `${prefix}发现并确认的隐患数量` },
              { label: `${prefix}重大事故隐患数`, value: current.major, desc: `${prefix}确认隐患中属重大事故隐患的数量` },
              { label: `${prefix}整改隐患数`, value: current.rectified, desc: `${prefix}完成整改的隐患数量` },
            ]

            // 前2个指标（第一行），后3个指标（第二行）
            const topTwo = metrics.slice(0, 2)
            const bottomThree = metrics.slice(2, 5)

            const tabs: { key: typeof workloadDimension; label: string }[] = [
              { key: 'yesterday', label: '昨日' },
              { key: 'week', label: '本周' },
              { key: 'lastWeek', label: '上周' },
              { key: 'month', label: '本月' },
              { key: 'lastMonth', label: '上月' },
            ]

            // 当前维度时间展示
            const dimTime = (() => {
              const now = new Date()
              if (workloadDimension === 'yesterday') {
                const yd = new Date(now); yd.setDate(yd.getDate() - 1)
                return `${yd.getMonth()+1}/${yd.getDate()}`
              }
              const td = now.getDay() === 0 ? 6 : now.getDay() - 1
              const ms = new Date(now); ms.setDate(now.getDate() - td)
              const me = new Date(ms); me.setDate(ms.getDate() + 6)
              if (workloadDimension === 'week') {
                return `${ms.getMonth()+1}/${ms.getDate()}-${me.getMonth()+1}/${me.getDate()}`
              }
              if (workloadDimension === 'lastWeek') {
                const ls = new Date(ms); ls.setDate(ls.getDate() - 7)
                const le = new Date(me); le.setDate(le.getDate() - 7)
                return `${ls.getMonth()+1}/${ls.getDate()}-${le.getMonth()+1}/${le.getDate()}`
              }
              if (workloadDimension === 'month') return curYmForWL
              return lastYm
            })()

            return (
              <div style={{ flex: 2, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>工作量统计</span>
                  <div style={{ display: 'flex', gap: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid #D1D5DB' }}>
                    {tabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setWorkloadDimension(t.key)}
                        style={{
                          padding: '2px 10px', fontSize: 11, fontWeight: workloadDimension === t.key ? 600 : 400,
                          color: workloadDimension === t.key ? '#111827' : '#9CA3AF',
                          background: workloadDimension === t.key ? '#F3F4F6' : 'white',
                          border: 'none', cursor: 'pointer', borderRight: t.key !== 'lastMonth' ? '1px solid #D1D5DB' : 'none',
                        }}
                      >{t.label}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{dimTime}</span>
                  {/* 指标说明图标 */}
                  <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <span
                      onMouseEnter={() => setHoveredMetric(-2)}
                      onMouseLeave={() => setHoveredMetric(null)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid #9CA3AF', fontSize: 9, color: '#9CA3AF', cursor: 'help', fontWeight: 600, lineHeight: 1 }}
                    >?</span>
                    {hoveredMetric === -2 && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '8px 12px', zIndex: 1000, minWidth: 240 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 6 }}>指标说明</div>
                        {metrics.map((m, i) => (
                          <div key={i} style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{m.label}：</span>{m.desc}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* 第一行：新建任务数、完成任务数 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', padding: '10px 12px', background: '#FAFAFA', borderRadius: 6 }}>
                  {topTwo.map(m => (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{m.label}</span>
                      <span style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                        {m.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                {/* 第二行：确认隐患数、重大事故隐患数、整改隐患数 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 14px', padding: '10px 12px', background: '#FAFAFA', borderRadius: 6 }}>
                  {bottomThree.map(m => (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{m.label}</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: m.label.includes('重大事故') ? '#B91C1C' : '#111827', lineHeight: 1.1 }}>
                        {m.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* 任务整体进度 */}
          {(() => {
            const now = new Date()
            const curYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
            const curYear = `${now.getFullYear()}`
            const lastM = now.getMonth() === 0 ? 11 : now.getMonth() - 1
            const lastMY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
            const lastYm = `${lastMY}-${String(lastM+1).padStart(2,'0')}`
            const lastYear = `${now.getFullYear() - 1}`
            const curMonthRows = allVillages.filter(r => r.date.startsWith(curYm))
            const lastMonthRows = allVillages.filter(r => r.date.startsWith(lastYm))
            const curYearRows = allVillages.filter(r => r.date.startsWith(curYear))
            const lastYearRows = allVillages.filter(r => r.date.startsWith(lastYear))

            const sumF = (rows: VillageRow[], field: keyof TaskSub) =>
              rows.reduce((s,r) => s + r.fzjz[field] + r.rcjc[field] + r.sync141[field], 0)

            const rows = progressDimension === 'month' ? curMonthRows : progressDimension === 'lastMonth' ? lastMonthRows : progressDimension === 'year' ? curYearRows : lastYearRows
            const tasks = sumF(rows, 'newTasks')
            const done = sumF(rows, 'newDone')
            const pending = Math.max(0, tasks - done)
            const taskRate = tasks > 0 ? Math.round((done / tasks) * 100) : 0
            const hazards = sumF(rows, 'newHazard')
            const rectified = sumF(rows, 'newRectified')
            const majorHazard = sumF(rows, 'majorHazard')
            const rectifying = Math.max(0, hazards - rectified)
            const rectifyRate = hazards > 0 ? Math.round((rectified / hazards) * 100) : 0

            const ringRadius = 50; const strokeW = 8; const cx = 58; const cy = 58
            const circumference = 2 * Math.PI * ringRadius
            const taskOffset = circumference * (1 - taskRate / 100)
            const rectifyOffset = circumference * (1 - rectifyRate / 100)

            const progressTabs: { key: typeof progressDimension; label: string }[] = [
              { key: 'month', label: '本月' },
              { key: 'lastMonth', label: '上月' },
              { key: 'year', label: '本年' },
              { key: 'lastYear', label: '去年' },
            ]

            const dimLabel = progressDimension === 'month' ? curYm : progressDimension === 'lastMonth' ? lastYm : progressDimension === 'year' ? curYear : lastYear

            return (
              <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>任务整体进度</span>
                  <div style={{ display: 'flex', gap: 0, borderRadius: 4, overflow: 'hidden', border: '1px solid #D1D5DB' }}>
                    {progressTabs.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setProgressDimension(t.key)}
                        style={{
                          padding: '2px 10px', fontSize: 11, fontWeight: progressDimension === t.key ? 600 : 400,
                          color: progressDimension === t.key ? '#111827' : '#9CA3AF',
                          background: progressDimension === t.key ? '#F3F4F6' : 'white',
                          border: 'none', cursor: 'pointer', borderRight: t.key !== 'lastYear' ? '1px solid #D1D5DB' : 'none',
                        }}
                      >{t.label}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{dimLabel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                  <div style={{ textAlign: 'center' }}>
                    <svg width={120} height={120}>
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#4F46E5" strokeWidth={strokeW}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={taskOffset}
                        transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                      <text x={cx} y={cy-4} textAnchor="middle" fontSize={22} fontWeight={700} fill="#111827">{taskRate}%</text>
                      <text x={cx} y={cy+14} textAnchor="middle" fontSize={10} fill="#6B7280">任务完成率</text>
                    </svg>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                      <div style={{ marginBottom: 2 }}>总数 <b style={{ color: '#111827' }}>{tasks.toLocaleString()}</b></div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <span>已完成 <b style={{ color: '#111827' }}>{done.toLocaleString()}</b></span>
                        <span>待完成 <b style={{ color: '#111827' }}>{pending.toLocaleString()}</b></span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <svg width={120} height={120}>
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#059669" strokeWidth={strokeW}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={rectifyOffset}
                        transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                      <text x={cx} y={cy-4} textAnchor="middle" fontSize={22} fontWeight={700} fill="#111827">{rectifyRate}%</text>
                      <text x={cx} y={cy+14} textAnchor="middle" fontSize={10} fill="#6B7280">隐患整改率</text>
                    </svg>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                      <div style={{ marginBottom: 2 }}>
                        <span>总数 <b style={{ color: '#111827' }}>{hazards.toLocaleString()}</b></span>
                        <span style={{ marginLeft: 12 }}>重大 <b style={{ color: '#B91C1C' }}>{majorHazard.toLocaleString()}</b></span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <span>已整改 <b style={{ color: '#111827' }}>{rectified.toLocaleString()}</b></span>
                        <span>整改中 <b style={{ color: '#111827' }}>{rectifying.toLocaleString()}</b></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* ─── 村社近期检查数据变化 ─────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
        {/* 标题栏 + 维度切换 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
            村社任务数据统计--截止{(() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}` })()}数据
          </div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #D1D5DB' }}>
            {([
              { key: '12months', label: '近12月' },
              { key: '30days', label: '近30天' },
            ] as const).map(opt => {
              const isActive = timeDimension === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setTimeDimension(opt.key)}
                  style={{
                    padding: '6px 16px',
                    border: 'none',
                    background: isActive ? '#4F46E5' : 'white',
                    color: isActive ? 'white' : '#6B7280',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
        {/* 图表：近12月（柱状图+折线图混合）、近30天（仅柱状图） */}
        {timeDimension === '12months' ? (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart
              data={generateMonthlyTrendData()}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <Tooltip content={<MonthlyTooltip />} />
              <Legend
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 12, fontSize: 12, flexWrap: 'wrap' }}>
                    {[
                      { name: '任务数', color: '#7C3AED', type: 'bar' },
                      { name: '完成数', color: '#4F46E5', type: 'bar' },
                      { name: '确认隐患数', color: '#DC2626', type: 'bar' },
                      { name: '已整改', color: '#059669', type: 'bar' },
                      { name: '任务完成率', color: '#F59E0B', type: 'line' },
                      { name: '整改完成率', color: '#EC4899', type: 'line' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: item.type === 'bar' ? 12 : 16,
                          height: item.type === 'bar' ? 3 : 2,
                          background: item.color,
                          display: 'inline-block',
                          borderRadius: 2,
                          ...(item.type === 'line' ? { borderTop: `2px dashed ${item.color}` } : {}),
                        }} />
                        <span style={{ color: '#374151' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {/* 柱状图：4个Bar时声明顺序=视觉顺序 */}
              <Bar yAxisId="left" dataKey="任务数" fill="#7C3AED" radius={[3, 3, 0, 0]} barSize={8} />
              <Bar yAxisId="left" dataKey="完成数" fill="#4F46E5" radius={[3, 3, 0, 0]} barSize={8} />
              <Bar yAxisId="left" dataKey="确认隐患数" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={8} />
              <Bar yAxisId="left" dataKey="已整改" fill="#059669" radius={[3, 3, 0, 0]} barSize={8} />
              {/* 折线图：任务完成率、整改完成率（右轴，百分比） */}
              <Line yAxisId="right" type="monotone" dataKey="任务完成率" stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }} />
              <Line yAxisId="right" type="monotone" dataKey="整改完成率" stroke="#EC4899" strokeWidth={2.5} strokeDasharray="6 3" dot={{ r: 4, fill: '#EC4899', strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={generateDailyTrendData()}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                interval={4}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <Tooltip content={<DailyTooltip />} />
              <Legend
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 12, fontSize: 12 }}>
                    {[
                      { name: '每日新增任务数', color: '#7C3AED' },
                      { name: '每日完成任务数', color: '#4F46E5' },
                      { name: '每日确认隐患数', color: '#DC2626' },
                      { name: '每日整改隐患数', color: '#059669' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: item.color, display: 'inline-block', borderRadius: 2 }} />
                        <span style={{ color: '#374151' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {/* 近30天柱状图：recharts左旋渲染，声明顺序=最终左移1位 */}
              <Bar dataKey="每日整改隐患数" fill="#059669" radius={[2, 2, 0, 0]} barSize={4} />
              <Bar dataKey="每日新增任务数" fill="#7C3AED" radius={[2, 2, 0, 0]} barSize={4} />
              <Bar dataKey="每日完成任务数" fill="#4F46E5" radius={[2, 2, 0, 0]} barSize={4} />
              <Bar dataKey="每日确认隐患数" fill="#DC2626" radius={[2, 2, 0, 0]} barSize={4} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── 表1：村社检查任务统计 ─────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {/* 标题栏 */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>表1：村社检查任务统计</span>
            {/* 指标说明图标：悬浮显示所有指标解释 */}
            <div style={{ position: 'relative' }}>
              <span
                onMouseEnter={() => setShowTableHelp(true)}
                onMouseLeave={() => setShowTableHelp(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '1px solid #9CA3AF',
                  fontSize: 10,
                  color: '#9CA3AF',
                  cursor: 'help',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                ?
              </span>
              {showTableHelp && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 6,
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  padding: '12px 16px',
                  zIndex: 1000,
                  minWidth: 320,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>指标说明</div>
                  {tableMetrics.map((m, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{m.name}：</span>
                      {m.definition}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* 任务创建时间筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>任务创建时间：</span>
            {(['month', 'lastMonth', 'quarter', 'year'] as const).map(range => {
              const labels: Record<string, string> = { month: '本月', lastMonth: '上月', quarter: '本季', year: '本年' }
              const active = quickRange === range
              return (
                <button
                  key={range}
                  onClick={() => applyQuickRange(range)}
                  style={{
                    padding: '1px 8px',
                    border: active ? '1px solid #4F46E5' : '1px solid #D1D5DB',
                    borderRadius: 3,
                    background: active ? '#EEF2FF' : 'white',
                    color: active ? '#4F46E5' : '#6B7280',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {labels[range]}
                </button>
              )
            })}
            <input
              type="month"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setQuickRange('') }}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 3,
                fontSize: 11, color: '#374151', width: 120,
              }}
            />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>至</span>
            <input
              type="month"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setQuickRange('') }}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 3,
                fontSize: 11, color: '#374151', width: 120,
              }}
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={clearDate}
                style={{
                  padding: '2px 6px', border: '1px solid #FCA5A5', borderRadius: 3,
                  background: '#FEF2F2', color: '#DC2626', fontSize: 10, cursor: 'pointer',
                }}
              >
                清除
              </button>
            )}
            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              style={{
                padding: '3px 10px', border: '1px solid #059669', borderRadius: 4,
                background: '#F0FDF4', color: '#059669', fontSize: 11, cursor: 'pointer',
                fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              📥 导出
            </button>
          </div>
        </div>
        {/* 统计分析 - 卡片式 */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFBFC' }}>
          <div style={{ fontWeight: 600, color: '#111827', marginBottom: 10, fontSize: 13 }}>
            查询期间，良渚街道{filteredVillages.length}个村社任务检查数据如下：
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {([
              {
                key: 'all' as const,
                label: '总计',
                color: '#111827',
                bg: '#F9FAFB',
                border: '#D1D5DB',
                note: '总计=日常检查+三方同步任务+防灾减灾',
                newTasks: overallStats.rcjc.newTasks + overallStats.sync141.newTasks + overallStats.fzjz.newTasks,
                newDoneRate: rateStr(overallStats.rcjc.newDone + overallStats.sync141.newDone + overallStats.fzjz.newDone, overallStats.rcjc.newTasks + overallStats.sync141.newTasks + overallStats.fzjz.newTasks),
                newHazard: overallStats.rcjc.newHazard + overallStats.sync141.newHazard + overallStats.fzjz.newHazard,
                majorHazard: overallStats.rcjc.majorHazard + overallStats.sync141.majorHazard + overallStats.fzjz.majorHazard,
                newRectifiedRate: rateStr(overallStats.rcjc.newRectified + overallStats.sync141.newRectified + overallStats.fzjz.newRectified, overallStats.rcjc.newHazard + overallStats.sync141.newHazard + overallStats.fzjz.newHazard),
              },
              {
                key: 'rcjc' as const,
                label: '日常检查',
                color: '#059669',
                bg: '#F0FDF4',
                border: '#A7F3D0',
                note: '包含自身安全检查和村社创建的监管对象检查',
                newTasks: overallStats.rcjc.newTasks,
                newDoneRate: rateStr(overallStats.rcjc.newDone, overallStats.rcjc.newTasks),
                newHazard: overallStats.rcjc.newHazard,
                majorHazard: overallStats.rcjc.majorHazard,
                newRectifiedRate: rateStr(overallStats.rcjc.newRectified, overallStats.rcjc.newHazard),
              },
              {
                key: 'sync141' as const,
                label: '三方同步任务',
                color: '#7C3AED',
                bg: '#FAF5FF',
                border: '#DDD6FE',
                newTasks: overallStats.sync141.newTasks,
                newDoneRate: rateStr(overallStats.sync141.newDone, overallStats.sync141.newTasks),
                newHazard: overallStats.sync141.newHazard,
                majorHazard: overallStats.sync141.majorHazard,
                newRectifiedRate: rateStr(overallStats.sync141.newRectified, overallStats.sync141.newHazard),
              },
              {
                key: 'fzjz' as const,
                label: '防灾减灾',
                color: '#1E40AF',
                bg: '#EFF6FF',
                border: '#BFDBFE',
                newTasks: overallStats.fzjz.newTasks,
                newDoneRate: rateStr(overallStats.fzjz.newDone, overallStats.fzjz.newTasks),
                newHazard: overallStats.fzjz.newHazard,
                majorHazard: overallStats.fzjz.majorHazard,
                newRectifiedRate: rateStr(overallStats.fzjz.newRectified, overallStats.fzjz.newHazard),
              },
            ] as const).map(card => {
              const isActive = selectedCard === card.key
              return (
              <div
                key={card.label}
                onClick={() => setSelectedCard(isActive ? 'all' : card.key)}
                style={{
                  background: isActive ? card.bg : '#FFFFFF',
                  border: `2px solid ${isActive ? card.color : card.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? `0 0 0 1px ${card.color}` : 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: card.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {card.label}
                  {'note' in card && card.note && (
                    <span title={card.note} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid #9CA3AF', fontSize: 9, color: '#9CA3AF', cursor: 'help', fontWeight: 600, lineHeight: 1 }}>!</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, color: '#374151' }}>
                  <span style={{ color: '#6B7280' }}>任务数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right' }}>{card.newTasks.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>任务完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#111827' }}>{card.newDoneRate}</span>
                  <span style={{ color: '#6B7280' }}>确认隐患数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#111827' }}>{card.newHazard.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>重大事故隐患数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#B91C1C' }}>{card.majorHazard.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>整改完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#111827' }}>{card.newRectifiedRate}</span>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* 图例 */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
          {selectedCard === 'all' ? (
            <span>📊 <b>总计任务</b> = 日常检查 + 三方同步任务 + 防灾减灾（三个维度汇总）</span>
          ) : (
            <span style={{ color: '#4F46E5' }}>当前高亮：<b>{
              selectedCard === 'rcjc' ? '日常检查' : selectedCard === 'sync141' ? '三方同步任务' : '防灾减灾'
            }</b> 维度数据 （点击"总计"恢复全部视图）</span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: selectedCard === 'all' ? 1000 : 1200, tableLayout: 'fixed' }}>
            <thead>
              {/* 第一级表头：类别分组 */}
              <tr>
                <th rowSpan={2} style={{ ...th, width: 48, position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 3, boxSizing: 'border-box' }}>#</th>
                <th rowSpan={2} style={{ ...th, textAlign: 'left', minWidth: 160, position: 'sticky', left: 49, background: '#F9FAFB', zIndex: 3, boxSizing: 'border-box' }}>村社</th>
                {selectedCard === 'all' ? (
                  <GroupTh label="总计任务" colSpan={8} bg="#F9FAFB" />
                ) : (<>
                {(selectedCard === 'rcjc') && <GroupTh label="日常检查任务" colSpan={8} bg="#F0FDF4" />}
                {(selectedCard === 'sync141') && <GroupTh label="三方同步任务" colSpan={8} bg="#FAF5FF" />}
                {(selectedCard === 'fzjz') && <GroupTh label="防灾减灾任务" colSpan={8} bg="#EFF6FF" />}
                </>)}
              </tr>
              {/* 第二级表头：8个子列（以任务创建时间为准） */}
              <tr>
                {selectedCard === 'all' ? (<>
                {/* 总计 - 8个指标（三个维度汇总） */}
                <SortTh col="all_newTasks" label="任务数" extraStyle={{ background: '#F9FAFB', minWidth: 72 }} />
                <SortTh col="all_newDone" label="完成数" extraStyle={{ background: '#F9FAFB', minWidth: 72 }} />
                <SortTh col="all_doneRate" label="任务完成率" extraStyle={{ background: '#F9FAFB', minWidth: 80 }} />
                <SortTh col="all_newHazard" label="确认隐患数" extraStyle={{ background: '#F9FAFB', minWidth: 88 }} />
                <SortTh col="all_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#F9FAFB', minWidth: 120 }} />
                <SortTh col="all_newRectified" label="已整改" extraStyle={{ background: '#F9FAFB', minWidth: 72 }} />
                <SortTh col="all_rectifying" label="整改中" extraStyle={{ background: '#F9FAFB', minWidth: 72 }} />
                <SortTh col="all_rectifiedRate" label="整改完成率" extraStyle={{ background: '#F9FAFB', minWidth: 80, borderRight: 'none' }} />
                </>) : (<>
                {/* 日常检查 - 8个指标 */}
                {(selectedCard === 'rcjc') && (<>
                <SortTh col="rcjc_newTasks" label="任务数" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <SortTh col="rcjc_newDone" label="完成数" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <SortTh col="rcjc_doneRate" label="任务完成率" extraStyle={{ background: '#F0FDF4', minWidth: 72 }} />
                <SortTh col="rcjc_newHazard" label="确认隐患数" extraStyle={{ background: '#F0FDF4', minWidth: 80 }} />
                <SortTh col="rcjc_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#F0FDF4', minWidth: 110 }} />
                <SortTh col="rcjc_newRectified" label="已整改" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <SortTh col="rcjc_rectifying" label="整改中" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <SortTh col="rcjc_rectifiedRate" label="整改完成率" extraStyle={{ background: '#F0FDF4', minWidth: 72, borderRight: 'none' }} />
                </>)}
                {/* 141同步 - 8个指标 */}
                {(selectedCard === 'sync141') && (<>
                <SortTh col="sync141_newTasks" label="任务数" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <SortTh col="sync141_newDone" label="完成数" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <SortTh col="sync141_doneRate" label="任务完成率" extraStyle={{ background: '#FAF5FF', minWidth: 72 }} />
                <SortTh col="sync141_newHazard" label="确认隐患数" extraStyle={{ background: '#FAF5FF', minWidth: 80 }} />
                <SortTh col="sync141_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#FAF5FF', minWidth: 110 }} />
                <SortTh col="sync141_newRectified" label="已整改" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <SortTh col="sync141_rectifying" label="整改中" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <SortTh col="sync141_rectifiedRate" label="整改完成率" extraStyle={{ background: '#FAF5FF', minWidth: 72, borderRight: 'none' }} />
                </>)}
                {/* 防灾减灾 - 8个指标 */}
                {(selectedCard === 'fzjz') && (<>
                <SortTh col="fzjz_newTasks" label="任务数" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <SortTh col="fzjz_newDone" label="完成数" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <SortTh col="fzjz_doneRate" label="任务完成率" extraStyle={{ background: '#EFF6FF', minWidth: 72 }} />
                <SortTh col="fzjz_newHazard" label="确认隐患数" extraStyle={{ background: '#EFF6FF', minWidth: 80 }} />
                <SortTh col="fzjz_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#EFF6FF', minWidth: 110 }} />
                <SortTh col="fzjz_newRectified" label="已整改" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <SortTh col="fzjz_rectifying" label="整改中" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <SortTh col="fzjz_rectifiedRate" label="整改完成率" extraStyle={{ background: '#EFF6FF', minWidth: 72, borderRight: 'none' }} />
                </>)}
                </>)}
              </tr>
            </thead>
            <tbody>
              {pagedVillages.map((row, i) => {
                // 总计视图：合并三个维度的数据
                const mergedTotal: TaskSub = {
                  total: row.rcjc.total + row.sync141.total + row.fzjz.total,
                  done: row.rcjc.done + row.sync141.done + row.fzjz.done,
                  hazard: row.rcjc.hazard + row.sync141.hazard + row.fzjz.hazard,
                  rectified: row.rcjc.rectified + row.sync141.rectified + row.fzjz.rectified,
                  rectifying: row.rcjc.rectifying + row.sync141.rectifying + row.fzjz.rectifying,
                  newTasks: row.rcjc.newTasks + row.sync141.newTasks + row.fzjz.newTasks,
                  newDone: row.rcjc.newDone + row.sync141.newDone + row.fzjz.newDone,
                  newHazard: row.rcjc.newHazard + row.sync141.newHazard + row.fzjz.newHazard,
                  newRectified: row.rcjc.newRectified + row.sync141.newRectified + row.fzjz.newRectified,
                  majorHazard: row.rcjc.majorHazard + row.sync141.majorHazard + row.fzjz.majorHazard,
                }
                return (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <td style={{ ...td({ textAlign: 'center', color: '#9CA3AF', fontSize: 11, fontWeight: 500 }), position: 'sticky', left: 0, background: i % 2 === 0 ? 'white' : '#FAFAFA', zIndex: 2, boxSizing: 'border-box' }}>{(page - 1) * pageSize + i + 1}</td>
                  <td style={{ ...td({ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }), position: 'sticky', left: 49, background: i % 2 === 0 ? 'white' : '#FAFAFA', zIndex: 2, boxSizing: 'border-box' }}>{row.village}</td>
                  {selectedCard === 'all' ? (
                    // 总计：展示三个维度汇总数据
                    renderSubCols(mergedTotal, '#FAFBFC', true)
                  ) : (<>
                    {/* 日常检查 */}
                    {selectedCard === 'rcjc' && renderSubCols(row.rcjc, '#FAFFFC', true)}
                    {/* 141同步 */}
                    {selectedCard === 'sync141' && renderSubCols(row.sync141, '#FDFAFF', true)}
                    {/* 防灾减灾 */}
                    {selectedCard === 'fzjz' && renderSubCols(row.fzjz, '#FAFCFF', true)}
                  </>)}
                </tr>
                )
              })}
              {pagedVillages.length === 0 && (
                <tr>
                  <td colSpan={totalColSpan} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 }}>
                    未找到匹配的村社
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页器 */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
          <span style={{ color: '#6B7280' }}>
            共 {filteredVillages.length} 条，第 {page}/{totalPages} 页
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              style={{ padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#D1D5DB' : '#374151', fontSize: 12 }}
            >
              首页
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#D1D5DB' : '#374151', fontSize: 12 }}
            >
              上一页
            </button>
            {(() => {
              const pages: number[] = []
              let start = Math.max(1, page - 2)
              let end = Math.min(totalPages, page + 2)
              if (end - start < 4) {
                if (start === 1) end = Math.min(totalPages, start + 4)
                else start = Math.max(1, end - 4)
              }
              for (let p = start; p <= end; p++) pages.push(p)
              return pages.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12,
                    background: p === page ? '#4F46E5' : 'white',
                    color: p === page ? 'white' : '#374151',
                    cursor: p === page ? 'default' : 'pointer',
                    fontWeight: p === page ? 600 : 400,
                  }}
                >
                  {p}
                </button>
              ))
            })()}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#D1D5DB' : '#374151', fontSize: 12 }}
            >
              下一页
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              style={{ padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#D1D5DB' : '#374151', fontSize: 12 }}
            >
              末页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
