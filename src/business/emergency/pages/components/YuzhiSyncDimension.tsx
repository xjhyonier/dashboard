import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from 'recharts'

// ─── 表2数据：14项已同步任务分析 ────────────────────────────────────────
interface SyncRow {
  status: string      // 状态（分组标题行）
  destination: string // 任务去向
  exception: string   // 异常信息
  count: number
  percent: string
  isSubtotal?: boolean
  isTotal?: boolean
}

const SYNC_ROWS: SyncRow[] = [
  // ========== 村社任务 ==========
  { status: '已创建', destination: '村社任务', exception: '无异常，余智护杭任务已同步至村社/镇街', count: 2664, percent: '19.21%' },
  { status: '检查完成', destination: '村社任务', exception: '无异常，余智护杭任务已同步至村社/镇街，并在一起安完成了检查', count: 2379, percent: '17.16%' },
  { status: '数据校验异常', destination: '村社任务', exception: '企业已开通一起安平台，但不在村社底数内，请在村社底数中录入', count: 1506, percent: '10.86%' },
  { status: '数据校验异常', destination: '村社任务', exception: '该企业所在部门没有检查人员', count: 314, percent: '2.26%' },
  { status: '数据校验异常', destination: '村社任务', exception: '任务明细未匹配到村社', count: 110, percent: '0.79%' },
  { status: '数据校验异常', destination: '村社任务', exception: '该企业所在部门有检查人员,但是不在浙政钉内,部门名称：亿丰时代网格', count: 24, percent: '0.17%' },
  { status: '数据校验异常', destination: '村社任务', exception: '该企业所在部门有检查人员,但是不在浙政钉内,部门名称：严村里网格', count: 8, percent: '0.06%' },
  { status: '', destination: '', exception: '小计', count: 7005, percent: '', isSubtotal: true },
  // ========== 镇街任务 ==========
  { status: '已创建', destination: '镇街任务', exception: '无异常，余智护杭任务已同步至村社/镇街', count: 195, percent: '1.41%' },
  { status: '数据校验异常', destination: '镇街任务', exception: '企业没在镇街组织：良渚应急消防管理站', count: 3, percent: '0.02%' },
  { status: '数据校验异常', destination: '镇街任务', exception: '镇街企业没有检查人员', count: 1, percent: '0.01%' },
  { status: '', destination: '', exception: '小计', count: 199, percent: '', isSubtotal: true },
  // ========== 未知分配去向 ==========
  { status: '数据校验异常', destination: '未知分配去向', exception: '企业尚未开通一起安平台，请在村社底数中录入', count: 6661, percent: '48.04%' },
  { status: '', destination: '', exception: '小计', count: 6661, percent: '', isSubtotal: true },
  // ========== 总计 ==========
  { status: '', destination: '', exception: '总计', count: 13865, percent: '', isTotal: true },
]

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
  sync141: TaskSub // 141同步
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
  const currentDone = currentMonth.reduce((s, r) => s + r.fzjz.newDone + r.rcjc.newDone + r.sync141.newDone, 0)
  const currentHazards = currentMonth.reduce((s, r) => s + r.fzjz.newHazard + r.rcjc.newHazard + r.sync141.newHazard, 0)
  const currentRectified = currentMonth.reduce((s, r) => s + r.fzjz.newRectified + r.rcjc.newRectified + r.sync141.newRectified, 0)

  // 日均值
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
    const done = Math.max(1, Math.round(dailyAvgDone * dayMult))
    const hazards = Math.max(1, Math.round(dailyAvgHazards * dayMult))
    const rectified = Math.max(0, Math.min(hazards - 1, Math.round(dailyAvgRectified * dayMult)))

    days.push({
      period,
      完成数: done,
      确认隐患数: hazards,
      已整改: rectified,
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
  const n = parseFloat(rate)
  const color = rateColor(rate)
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color }}>{rate}</span>
  )
}

// ─── 排序列类型 ───────────────────────────────────────────────────────────
type SortCol = 'village' |
  'fzjz_total' | 'fzjz_done' | 'fzjz_newTasks' | 'fzjz_newDone' | 'fzjz_hazard' | 'fzjz_newHazard' | 'fzjz_rectified' | 'fzjz_rectifying' | 'fzjz_majorHazard' | 'fzjz_newRectified' |
  'rcjc_total' | 'rcjc_done' | 'rcjc_newTasks' | 'rcjc_newDone' | 'rcjc_hazard' | 'rcjc_newHazard' | 'rcjc_rectified' | 'rcjc_rectifying' | 'rcjc_majorHazard' | 'rcjc_newRectified' |
  'sync141_total' | 'sync141_done' | 'sync141_newTasks' | 'sync141_newDone' | 'sync141_hazard' | 'sync141_newHazard' | 'sync141_rectified' | 'sync141_rectifying' | 'sync141_majorHazard' | 'sync141_newRectified'

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
  { key: '完成数', label: '完成数', unit: '', color: '#4F46E5' },
  { key: '确认隐患数', label: '确认隐患数', unit: '', color: '#DC2626' },
  { key: '已整改', label: '已整改', unit: '', color: '#059669' },
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
  const [sortBy, setSortBy] = useState<SortCol>('fzjz_done')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const pageSize = 10
  // 时间筛选
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [dateTo, setDateTo] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [quickRange, setQuickRange] = useState<'month' | 'lastMonth' | 'quarter' | 'year' | ''>('month')
  const [showNote, setShowNote] = useState(false)
  const [timeDimension, setTimeDimension] = useState<'12months' | '30days'>('12months')
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null)
  const [showTableHelp, setShowTableHelp] = useState(false) // 表1指标说明悬浮框
  const [selectedCard, setSelectedCard] = useState<'all' | 'rcjc' | 'sync141' | 'fzjz'>('all') // 卡片联动：总计/日常检查/141同步/防灾减灾
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

  // 导出表2明细为CSV
  const exportSyncDetail = () => {
    const header = '状态,任务去向,异常信息,任务数,占比'
    const dataRows = SYNC_ROWS
      .filter(r => !r.isSubtotal && !r.isTotal)
      .map(r => `"${r.status}","${r.destination}","${r.exception}",${r.count},"${r.percent}"`)
    // 添加BOM以支持Excel正确识别中文
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
        <td style={td({ textAlign: 'center', fontWeight: 600, color: sub.newDone > 0 ? '#4F46E5' : '#9CA3AF', background: subBg })}>
          {sub.newDone.toLocaleString()}
        </td>
        {/* 3.任务完成率 */}
        <td style={td({ textAlign: 'center', background: subBg })}>
          <RateText rate={taskRate} />
        </td>
        {/* 4.确认隐患数 */}
        <td style={td({ textAlign: 'center', color: sub.newHazard > 0 ? '#DC2626' : '#9CA3AF', fontWeight: sub.newHazard > 0 ? 600 : 400, background: subBg })}>
          {sub.newHazard.toLocaleString()}
        </td>
        {/* 5.重大事故隐患数 */}
        <td style={td({ textAlign: 'center', color: sub.majorHazard > 0 ? '#B91C1C' : '#9CA3AF', fontWeight: sub.majorHazard > 0 ? 600 : 400, background: subBg })}>
          {sub.majorHazard.toLocaleString()}
        </td>
        {/* 6.已整改 */}
        <td style={{ ...td({ textAlign: 'center', background: subBg }), color: sub.newRectified > 0 ? '#059669' : '#9CA3AF', fontWeight: sub.newRectified > 0 ? 600 : 400 }}>
          {sub.newRectified.toLocaleString()}
        </td>
        {/* 7.整改中 */}
        <td style={{ ...td({ textAlign: 'center', background: subBg }), color: pendingHazard > 0 ? '#F59E0B' : '#9CA3AF', fontWeight: pendingHazard > 0 ? 600 : 400 }}>
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
        for (const r of data) {
          ent += r.enterpriseCount
          ven += r.venueCount
          rent += r.rentalCount
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
            unit: '家',
            color: '#1D4ED8',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            icon: '🏢',
            registered: entReg,
            registeredRate: rate(entReg, ent),
          },
          {
            label: '场所数',
            value: ven,
            unit: '处',
            color: '#059669',
            bg: '#F0FDF4',
            border: '#A7F3D0',
            icon: '🏪',
            registered: venReg,
            registeredRate: rate(venReg, ven),
          },
          {
            label: '出租房数',
            value: rent,
            unit: '套',
            color: '#7C3AED',
            bg: '#FAF5FF',
            border: '#DDD6FE',
            icon: '🏠',
            registered: rentReg,
            registeredRate: rate(rentReg, rent),
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
                <span style={{ fontSize: 28, fontWeight: 700, color: '#B45309', lineHeight: 1 }}>{total.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: '#B45309', fontWeight: 500 }}>个</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, borderTop: '1px dashed #FDE68A', paddingTop: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>已注册数</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#B45309' }}>{totalReg.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2 }}>个</span></div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>注册率</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#B45309' }}>{rate(totalReg, total)}</div>
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
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* 顶部：图标 + 主指标 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: item.color, lineHeight: 1 }}>{item.value.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>{item.unit}</span>
                </div>
              </div>
            </div>
            {/* 底部：子指标 */}
            <div style={{ display: 'flex', gap: 16, borderTop: `1px dashed ${item.border}`, paddingTop: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>已注册数</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.registered.toLocaleString()}<span style={{ fontSize: 10, fontWeight: 500, marginLeft: 2 }}>{item.unit}</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>注册率</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.registeredRate}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
    })()}

        {/* ─── 工作量统计 + 本月进度 ──────────────────────── */}
        <div style={{ display: 'flex', gap: 12 }}>
          {/* 昨日工作量统计 */}
          {(() => {
            const data = selectedVillages.length > 0 ? filteredVillages : allVillages
            const periodNewTasks      = data.reduce((sum, r) => sum + r.fzjz.newTasks       + r.rcjc.newTasks       + r.sync141.newTasks, 0)
            const periodNewDone       = data.reduce((sum, r) => sum + r.fzjz.newDone        + r.rcjc.newDone        + r.sync141.newDone, 0)
            const periodNewHazard    = data.reduce((sum, r) => sum + r.fzjz.newHazard     + r.rcjc.newHazard     + r.sync141.newHazard, 0)
            const periodMajorHazard  = data.reduce((sum, r) => sum + r.fzjz.majorHazard   + r.rcjc.majorHazard   + r.sync141.majorHazard, 0)
            const periodNewRectified = data.reduce((sum, r) => sum + r.fzjz.newRectified  + r.rcjc.newRectified  + r.sync141.newRectified, 0)
            const yesterdayDate = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getMonth()+1}/${d.getDate()}` })()
            return (
              <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>昨日工作量统计</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{yesterdayDate}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>任务数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED', lineHeight: 1.1 }}>{Math.max(1, Math.round(periodNewTasks / 7)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>完成数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#4F46E5', lineHeight: 1.1 }}>{Math.max(1, Math.round(periodNewDone / 7)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>确认隐患数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', lineHeight: 1.1 }}>{Math.max(1, Math.round(periodNewHazard / 7)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>重大事故隐患数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#B91C1C', lineHeight: 1.1 }}>{Math.max(0, Math.round(periodMajorHazard / 7)).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>已整改</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#059669', lineHeight: 1.1 }}>{Math.max(0, Math.round(periodNewRectified / 7)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })()}
          {(() => {
            const now = new Date()
            const todayDay = now.getDay() === 0 ? 6 : now.getDay() - 1
            const weekStartDate = new Date(now); weekStartDate.setDate(now.getDate() - todayDay)
            const prevWeekStart = new Date(weekStartDate); prevWeekStart.setDate(weekStartDate.getDate() - 7)
            const fmtYm = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
            const weekStart = fmtYm(weekStartDate)
            const weekEnd = fmtYm(new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate() + 6))
            const prevStart = fmtYm(prevWeekStart)
            const prevEnd = fmtYm(new Date(prevWeekStart.getFullYear(), prevWeekStart.getMonth(), prevWeekStart.getDate() + 6))

            const thisWeekRows = allVillages.filter(r => r.date >= weekStart.substring(0,7) && r.date <= weekEnd.substring(0,7))
            const prevWeekRows = allVillages.filter(r => r.date >= prevStart.substring(0,7) && r.date <= prevEnd.substring(0,7))

            const sumField = (rows: VillageRow[], field: keyof TaskSub) =>
              rows.reduce((s,r) => s + r.fzjz[field] + r.rcjc[field] + r.sync141[field], 0)

            const thisWeekTasks = sumField(thisWeekRows, 'newTasks')
            const thisWeekDone = sumField(thisWeekRows, 'newDone')
            const thisWeekHazard = sumField(thisWeekRows, 'newHazard')
            const thisWeekMajor = sumField(thisWeekRows, 'majorHazard')
            const thisWeekRectified = sumField(thisWeekRows, 'newRectified')
            const prevWeekTasks = sumField(prevWeekRows, 'newTasks')
            const prevWeekDone = sumField(prevWeekRows, 'newDone')
            const prevWeekHazard = sumField(prevWeekRows, 'newHazard')
            const prevWeekMajor = sumField(prevWeekRows, 'majorHazard')
            const prevWeekRectified = sumField(prevWeekRows, 'newRectified')

            const wows = {
              tasks: prevWeekTasks > 0 ? `${(((thisWeekTasks-prevWeekTasks)/prevWeekTasks)*100).toFixed(1)}%` : '--',
              done: prevWeekDone > 0 ? `${(((thisWeekDone-prevWeekDone)/prevWeekDone)*100).toFixed(1)}%` : '--',
              hazard: prevWeekHazard > 0 ? `${(((thisWeekHazard-prevWeekHazard)/prevWeekHazard)*100).toFixed(1)}%` : '--',
              major: prevWeekMajor > 0 ? `${(((thisWeekMajor-prevWeekMajor)/prevWeekMajor)*100).toFixed(1)}%` : '--',
              rectified: prevWeekRectified > 0 ? `${(((thisWeekRectified-prevWeekRectified)/prevWeekRectified)*100).toFixed(1)}%` : '--',
            }
            const wowArrow = (cur: number, prev: number) => prev > 0 ? (cur >= prev ? '↑' : '↓') : ''
            const wowColor = (cur: number, prev: number) => prev > 0 ? (cur >= prev ? '#DC2626' : '#059669') : '#9CA3AF'

            const weekMetrics = [
              { label: '任务数', value: thisWeekTasks, color: '#7C3AED' },
              { label: '完成数', value: thisWeekDone, color: '#4F46E5' },
              { label: '确认隐患数', value: thisWeekHazard, color: '#DC2626' },
              { label: '重大事故隐患数', value: thisWeekMajor, color: '#B91C1C' },
              { label: '已整改', value: thisWeekRectified, color: '#059669' },
            ]

            return (
              <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>本周工作量统计</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{weekStart} ~ {weekEnd}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  {weekMetrics.map(m => (
                    <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{m.label}</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: m.color, lineHeight: 1.1 }}>{m.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* 上周工作量统计 */}
          {(() => {
            const data = selectedVillages.length > 0 ? filteredVillages : allVillages
            const periodNewTasks      = data.reduce((sum, r) => sum + r.fzjz.newTasks       + r.rcjc.newTasks       + r.sync141.newTasks, 0)
            const periodNewDone       = data.reduce((sum, r) => sum + r.fzjz.newDone        + r.rcjc.newDone        + r.sync141.newDone, 0)
            const periodNewHazard    = data.reduce((sum, r) => sum + r.fzjz.newHazard     + r.rcjc.newHazard     + r.sync141.newHazard, 0)
            const periodMajorHazard  = data.reduce((sum, r) => sum + r.fzjz.majorHazard   + r.rcjc.majorHazard   + r.sync141.majorHazard, 0)
            const periodNewRectified = data.reduce((sum, r) => sum + r.fzjz.newRectified  + r.rcjc.newRectified  + r.sync141.newRectified, 0)
            const now = new Date()
            const todayDay = now.getDay() === 0 ? 6 : now.getDay() - 1
            const prevStart = new Date(now); prevStart.setDate(now.getDate() - todayDay - 7)
            const prevEnd = new Date(prevStart); prevEnd.setDate(prevStart.getDate() + 6)
            const fmt = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`
            const prevWeekRange = `${fmt(prevStart)}-${fmt(prevEnd)}`
            return (
              <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>上周工作量统计</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{prevWeekRange}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>任务数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED', lineHeight: 1.1 }}>{periodNewTasks.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>完成数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#4F46E5', lineHeight: 1.1 }}>{periodNewDone.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>确认隐患数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#DC2626', lineHeight: 1.1 }}>{periodNewHazard.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>重大事故隐患数</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#B91C1C', lineHeight: 1.1 }}>{periodMajorHazard.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>已整改</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#059669', lineHeight: 1.1 }}>{periodNewRectified.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 本月任务整体进度 */}
          {(() => {
            const now = new Date()
            const curYm = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
            const curMonthRows = allVillages.filter(r => r.date.startsWith(curYm))

            const sumF = (rows: VillageRow[], field: keyof TaskSub) =>
              rows.reduce((s,r) => s + r.fzjz[field] + r.rcjc[field] + r.sync141[field], 0)

            const monthTasks = sumF(curMonthRows, 'newTasks')
            const monthDone = sumF(curMonthRows, 'newDone')
            const monthPending = Math.max(0, monthTasks - monthDone)
            const monthTaskRate = monthTasks > 0 ? Math.round((monthDone / monthTasks) * 100) : 0
            const monthHazards = sumF(curMonthRows, 'newHazard')
            const monthRectified = sumF(curMonthRows, 'newRectified')
            const monthMajorHazard = sumF(curMonthRows, 'majorHazard')
            const monthRectifying = Math.max(0, monthHazards - monthRectified)
            const monthRectifyRate = monthHazards > 0 ? Math.round((monthRectified / monthHazards) * 100) : 0

            const ringRadius = 50; const strokeW = 8; const cx = 58; const cy = 58
            const circumference = 2 * Math.PI * ringRadius
            const taskOffset = circumference * (1 - monthTaskRate / 100)
            const rectifyOffset = circumference * (1 - monthRectifyRate / 100)

            return (
              <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>本月任务整体进度</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{curYm}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                  <div style={{ textAlign: 'center' }}>
                    <svg width={120} height={120}>
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#4F46E5" strokeWidth={strokeW}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={taskOffset}
                        transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                      <text x={cx} y={cy-4} textAnchor="middle" fontSize={22} fontWeight={700} fill="#4F46E5">{monthTaskRate}%</text>
                      <text x={cx} y={cy+14} textAnchor="middle" fontSize={10} fill="#6B7280">任务完成率</text>
                    </svg>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                      <div style={{ marginBottom: 2 }}>总数 <b style={{ color: '#111827' }}>{monthTasks.toLocaleString()}</b></div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <span>已完成 <b style={{ color: '#059669' }}>{monthDone.toLocaleString()}</b></span>
                        <span>待完成 <b style={{ color: '#F59E0B' }}>{monthPending.toLocaleString()}</b></span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <svg width={120} height={120}>
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#F3F4F6" strokeWidth={strokeW} />
                      <circle cx={cx} cy={cy} r={ringRadius} fill="none" stroke="#059669" strokeWidth={strokeW}
                        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={rectifyOffset}
                        transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset 0.6s' }} />
                      <text x={cx} y={cy-4} textAnchor="middle" fontSize={22} fontWeight={700} fill="#059669">{monthRectifyRate}%</text>
                      <text x={cx} y={cy+14} textAnchor="middle" fontSize={10} fill="#6B7280">隐患整改率</text>
                    </svg>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                      <div style={{ marginBottom: 2 }}>
                        <span>总数 <b style={{ color: '#111827' }}>{monthHazards.toLocaleString()}</b></span>
                        <span style={{ marginLeft: 12 }}>重大 <b style={{ color: '#B91C1C' }}>{monthMajorHazard.toLocaleString()}</b></span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <span>已整改 <b style={{ color: '#059669' }}>{monthRectified.toLocaleString()}</b></span>
                        <span>整改中 <b style={{ color: '#F59E0B' }}>{monthRectifying.toLocaleString()}</b></span>
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
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>村社近期检查及隐患数据趋势</div>
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
                      { name: '完成数', color: '#4F46E5' },
                      { name: '确认隐患数', color: '#DC2626' },
                      { name: '已整改', color: '#059669' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: item.color, display: 'inline-block', borderRadius: 2 }} />
                        <span style={{ color: '#374151' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {/* Bar顺序已验证：声明[已整改,完成数,确认隐患数] → 视觉[完成数,确认隐患数,已整改] */}
              <Bar dataKey="已整改" fill="#059669" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="完成数" fill="#4F46E5" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="确认隐患数" fill="#DC2626" radius={[3, 3, 0, 0]} barSize={12} />
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
            <span style={{ fontSize: 12, color: '#6B7280' }}>
              共 {filteredVillages.length} 条
            </span>
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
                note: '总计=日常检查+141同步+防灾减灾',
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
                label: '141同步',
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
                  <span style={{ fontWeight: 700, textAlign: 'right', color: rateColor(card.newDoneRate) }}>{card.newDoneRate}</span>
                  <span style={{ color: '#6B7280' }}>确认隐患数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#DC2626' }}>{card.newHazard.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>重大事故隐患数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#B91C1C' }}>{card.majorHazard.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>整改完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: rateColor(card.newRectifiedRate) }}>{card.newRectifiedRate}</span>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* 图例 */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
          {selectedCard === 'all' ? (
            <span>📊 <b>总计任务</b> = 日常检查 + 141同步 + 防灾减灾（三个维度汇总）</span>
          ) : (
            <span style={{ color: '#4F46E5' }}>当前高亮：<b>{
              selectedCard === 'rcjc' ? '日常检查' : selectedCard === 'sync141' ? '141同步' : '防灾减灾'
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
                {(selectedCard === 'sync141') && <GroupTh label="141同步任务" colSpan={8} bg="#FAF5FF" />}
                {(selectedCard === 'fzjz') && <GroupTh label="防灾减灾任务" colSpan={8} bg="#EFF6FF" />}
                </>)}
              </tr>
              {/* 第二级表头：8个子列（以任务创建时间为准） */}
              <tr>
                {selectedCard === 'all' ? (<>
                {/* 总计 - 8个指标（三个维度汇总） */}
                <th style={{ ...th, background: '#F9FAFB', minWidth: 72 }}>任务数</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 72 }}>完成数</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 80 }}>任务完成率</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 88 }}>确认隐患数</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 120 }}>重大事故隐患数</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 72 }}>已整改</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 72 }}>整改中</th>
                <th style={{ ...th, background: '#F9FAFB', minWidth: 80, borderRight: 'none' }}>整改完成率</th>
                </>) : (<>
                {/* 日常检查 - 8个指标 */}
                {(selectedCard === 'rcjc') && (<>
                <SortTh col="rcjc_newTasks" label="任务数" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <SortTh col="rcjc_newDone" label="完成数" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <th style={{ ...th, background: '#F0FDF4', minWidth: 72 }}>任务完成率</th>
                <SortTh col="rcjc_newHazard" label="确认隐患数" extraStyle={{ background: '#F0FDF4', minWidth: 80 }} />
                <SortTh col="rcjc_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#F0FDF4', minWidth: 110 }} />
                <SortTh col="rcjc_newRectified" label="已整改" extraStyle={{ background: '#F0FDF4', minWidth: 64 }} />
                <th style={{ ...th, background: '#F0FDF4', minWidth: 64 }}>整改中</th>
                <th style={{ ...th, background: '#F0FDF4', minWidth: 72, borderRight: 'none' }}>整改完成率</th>
                </>)}
                {/* 141同步 - 8个指标 */}
                {(selectedCard === 'sync141') && (<>
                <SortTh col="sync141_newTasks" label="任务数" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <SortTh col="sync141_newDone" label="完成数" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <th style={{ ...th, background: '#FAF5FF', minWidth: 72 }}>任务完成率</th>
                <SortTh col="sync141_newHazard" label="确认隐患数" extraStyle={{ background: '#FAF5FF', minWidth: 80 }} />
                <SortTh col="sync141_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#FAF5FF', minWidth: 110 }} />
                <SortTh col="sync141_newRectified" label="已整改" extraStyle={{ background: '#FAF5FF', minWidth: 64 }} />
                <th style={{ ...th, background: '#FAF5FF', minWidth: 64 }}>整改中</th>
                <th style={{ ...th, background: '#FAF5FF', minWidth: 72, borderRight: 'none' }}>整改完成率</th>
                </>)}
                {/* 防灾减灾 - 8个指标 */}
                {(selectedCard === 'fzjz') && (<>
                <SortTh col="fzjz_newTasks" label="任务数" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <SortTh col="fzjz_newDone" label="完成数" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <th style={{ ...th, background: '#EFF6FF', minWidth: 72 }}>任务完成率</th>
                <SortTh col="fzjz_newHazard" label="确认隐患数" extraStyle={{ background: '#EFF6FF', minWidth: 80 }} />
                <SortTh col="fzjz_majorHazard" label="重大事故隐患数" extraStyle={{ background: '#EFF6FF', minWidth: 110 }} />
                <SortTh col="fzjz_newRectified" label="已整改" extraStyle={{ background: '#EFF6FF', minWidth: 64 }} />
                <th style={{ ...th, background: '#EFF6FF', minWidth: 64 }}>整改中</th>
                <th style={{ ...th, background: '#EFF6FF', minWidth: 72, borderRight: 'none' }}>整改完成率</th>
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

      {/* ─── 表2：14项已同步任务分析 ─────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>表2：余智护杭 14 项任务同步情况分析</span>
            {/* 备注感叹号 */}
            <span
              style={{ position: 'relative', display: 'inline-flex', marginLeft: 6, cursor: 'pointer', userSelect: 'none' }}
              onMouseEnter={() => setShowNote(true)}
              onMouseLeave={() => setShowNote(false)}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: '50%',
                background: '#4F46E5', color: 'white', fontSize: 11, fontWeight: 700,
              }}>!</span>
              {showNote && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, marginTop: 6,
                  background: 'white', border: '1px solid #E5E7EB', borderRadius: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '12px 16px',
                  zIndex: 1000, whiteSpace: 'nowrap', minWidth: 300,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                    已同步 14 项任务如下：
                  </div>
                  <ol style={{ margin: 0, paddingLeft: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.8, listStyle: 'none' }}>
                    <li>1. 应急消防一般风险安全检查</li>
                    <li>2. 应急消防较大风险安全检查</li>
                    <li>3. 应急消防重大风险安全检查</li>
                    <li>4. 九小场所安全检查（小网吧/电竞小站）</li>
                    <li>5. 九小场所安全检查（小医院/小诊所/小托育机构）</li>
                    <li>6. 低风险安全检查</li>
                    <li>7. 九小场所安全检查（小餐饮场所）</li>
                    <li>8. 九小场所安全检查（小美容洗浴场所）</li>
                    <li>9. 九小场所安全检查（小生产加工企业）</li>
                    <li>10. 九小场所安全检查（小歌舞娱乐场所）</li>
                    <li>11. 九小场所安全检查（小旅馆）</li>
                    <li>12. 九小场所安全检查（小学校、小幼儿园）</li>
                    <li>13. 九小场所安全检查（小商店）</li>
                    <li>14. 九小场所安全检查（其他）</li>
                  </ol>
                </div>
              )}
            </span>
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
              marginLeft: 12,
            }}
          >
            导出明细
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: 'left', width: 130 }}>任务去向</th>
                <th style={{ ...th, textAlign: 'left', width: 110 }}>状态</th>
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
                  return (
                    <tr key={i} style={{ background: '#F3F4F6' }}>
                      <td colSpan={3} style={{ ...td({ fontWeight: 600, color: '#374151', fontSize: 13 }) }}>
                        小计
                      </td>
                      <td style={{ ...td({ textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: 14 }) }}>
                        {row.count.toLocaleString()}
                      </td>
                      <td style={{ ...td({ borderRight: 'none' }) }}></td>
                    </tr>
                  )
                }

                // 普通行
                const isAbnormal = row.status === '数据校验异常'
                const rowBg = isAbnormal ? '#FFFBFB' : '#FAFFFE'

                return (
                  <tr key={i} style={{ background: rowBg }}>
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
      </div>
    </div>
  )
}
