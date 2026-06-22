import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
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
  total: number     // 总任务数
  done: number      // 已完成（用于计算总完成率）
  hazard: number    // 总隐患数
  rectified: number // 已整改
  rectifying: number // 整改中
  // 查询期间新增字段
  newTasks: number   // 新增任务数
  newDone: number    // 新增完成数
  newHazard: number  // 确认隐患数（查询期间新增）
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

// 生成模拟数据：根据原 total/done 拆分到三类任务
function genMock(total: number, done: number): Pick<VillageRow, 'fzjz' | 'rcjc' | 'sync141'> {
  // 按大约 3:4:3 比例拆分
  const t1 = Math.round(total * 0.3)
  const t2 = Math.round(total * 0.4)
  const t3 = total - t1 - t2
  const d1 = Math.round(done * 0.3)
  const d2 = Math.round(done * 0.4)
  const d3 = done - d1 - d2

  const sub = (t: number, d: number): TaskSub => {
    const hazard = Math.max(0, Math.round((t - d) * 0.6))
    const rectified = Math.max(0, Math.round(hazard * 0.7))
    const rectifying = hazard - rectified
    // 查询期间数据（模拟：新增任务数约10-20% of total，新增完成数约10-20% of done）
    const newTasks = Math.round(t * (0.1 + Math.random() * 0.1))
    const newDone = Math.round(d * (0.1 + Math.random() * 0.1))
    const newHazard = Math.round(hazard * (0.1 + Math.random() * 0.1))
    return { total: t, done: d, hazard, rectified, rectifying, newTasks, newDone, newHazard }
  }

  return {
    fzjz: sub(t1, d1),
    rcjc: sub(t2, d2),
    sync141: sub(t3, d3),
  }
}

const VILLAGE_RAW: { village: string; date: string; total: number; done: number }[] = [
  { village: '安溪村', date: '2026-05-01', total: 31, done: 4 },
  { village: '白洋里社区', date: '2026-05-02', total: 9, done: 0 },
  { village: '北宸社区', date: '2026-05-03', total: 434, done: 151 },
  { village: '北秀社区', date: '2026-05-04', total: 48, done: 0 },
  { village: '博园社区', date: '2026-05-05', total: 61, done: 3 },
  { village: '昌运社区', date: '2026-05-06', total: 55, done: 12 },
  { village: '崇福社区', date: '2026-05-07', total: 73, done: 0 },
  { village: '杜城村', date: '2026-05-08', total: 65, done: 0 },
  { village: '杜甫村', date: '2026-05-09', total: 31, done: 0 },
  { village: '港南村', date: '2026-05-10', total: 13, done: 12 },
  { village: '勾庄村', date: '2026-05-11', total: 96, done: 0 },
  { village: '管家塘社区', date: '2026-05-12', total: 105, done: 36 },
  { village: '杭运社区', date: '2026-05-13', total: 16, done: 8 },
  { village: '金家渡社区', date: '2026-05-14', total: 439, done: 0 },
  { village: '聚贤社区', date: '2026-05-15', total: 162, done: 133 },
  { village: '良港村', date: '2026-05-16', total: 54, done: 40 },
  { village: '良渚文化村社区', date: '2026-05-17', total: 317, done: 225 },
  { village: '米行桥社区', date: '2026-05-18', total: 81, done: 56 },
  { village: '铭雅社区', date: '2026-05-19', total: 395, done: 106 },
  { village: '南庄兜村', date: '2026-05-20', total: 15, done: 4 },
  { village: '七贤桥村', date: '2026-05-21', total: 142, done: 38 },
  { village: '亲亲家园社区', date: '2026-05-22', total: 87, done: 1 },
  { village: '施家湾社区', date: '2026-05-23', total: 147, done: 56 },
  { village: '石桥村', date: '2026-05-24', total: 35, done: 9 },
  { village: '通运社区', date: '2026-05-25', total: 105, done: 30 },
  { village: '万年桥社区', date: '2026-05-26', total: 59, done: 0 },
  { village: '吴家厍社区', date: '2026-05-27', total: 56, done: 49 },
  { village: '西塘河村', date: '2026-05-28', total: 26, done: 0 },
  { village: '西塘雅苑社区', date: '2026-05-01', total: 26, done: 25 },
  { village: '小洋坝社区', date: '2026-05-02', total: 55, done: 52 },
  { village: '新港村', date: '2026-05-03', total: 13, done: 9 },
  { village: '新桥社区', date: '2026-05-04', total: 22, done: 0 },
  { village: '新溪社区', date: '2026-05-05', total: 34, done: 5 },
  { village: '行宫塘村', date: '2026-05-06', total: 75, done: 4 },
  { village: '荀山村', date: '2026-05-07', total: 147, done: 31 },
  { village: '逸居城社区', date: '2026-05-08', total: 30, done: 7 },
  { village: '玉创社区', date: '2026-05-09', total: 121, done: 114 },
  { village: '玉鸟社区', date: '2026-05-10', total: 8, done: 6 },
  { village: '玉泽社区', date: '2026-05-11', total: 73, done: 26 },
  { village: '越秀社区', date: '2026-05-12', total: 134, done: 46 },
  { village: '运河村', date: '2026-05-13', total: 54, done: 19 },
  { village: '长桥社区', date: '2026-05-14', total: 77, done: 62 },
  { village: '棕榈湾社区', date: '2026-05-15', total: 85, done: 68 },
  { village: '大陆村', date: '2026-05-16', total: 13, done: 13 },
  { village: '东莲村', date: '2026-05-17', total: 49, done: 49 },
  { village: '东塘河村', date: '2026-05-18', total: 20, done: 20 },
  { village: '勾庄治理中心', date: '2026-05-19', total: 440, done: 440 },
  { village: '良渚治理中心', date: '2026-05-20', total: 360, done: 360 },
  { village: '纤石村', date: '2026-05-21', total: 48, done: 48 },
  { village: '小洋坝村', date: '2026-05-22', total: 2, done: 2 },
]

// 按任务数比例分配企业/场所/出租房总数（保持原硬编码总量大致不变）
const TOTAL_TASKS = VILLAGE_RAW.reduce((sum, r) => sum + r.total, 0)
const R_ENT = 1286 / TOTAL_TASKS
const R_VENUE = 3452 / TOTAL_TASKS
const R_RENTAL = 876 / TOTAL_TASKS

const VILLAGE_ROWS: VillageRow[] = VILLAGE_RAW.map(r => ({
  village: r.village,
  date: r.date,
  ...genMock(r.total, r.done),
  enterpriseCount: Math.max(0, Math.round(r.total * R_ENT)),
  venueCount: Math.max(0, Math.round(r.total * R_VENUE)),
  rentalCount: Math.max(0, Math.round(r.total * R_RENTAL)),
}))

// ─── 村社近期检查数据变化折线图数据 ────────────────────────────────────────────
// 支持近12个月、近12周、近30天三种维度
interface TrendDataPoint {
  period: string      // 时间周期（月份、周数或日期）
  // 近12个月维度
  任务总数?: number
  完成率?: number
  查出隐患数?: number
  隐患整改完成率?: number
  // 近12周、近30天维度
  新增任务数?: number
  新增完成数?: number
  发现隐患数?: number
  整改隐患数?: number
}

// 生成近12个月的趋势数据
const generateMonthlyTrendData = (): TrendDataPoint[] => {
  const months = [
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
  ]

  // 基于现有数据计算基准值
  const totalTasks = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.total + r.rcjc.total + r.sync141.total, 0)
  const totalHazards = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.hazard + r.rcjc.hazard + r.sync141.hazard, 0)
  const avgCompletionRate = Math.round(VILLAGE_ROWS.reduce((sum, r) => {
    const total = r.fzjz.total + r.rcjc.total + r.sync141.total
    const done = r.fzjz.done + r.rcjc.done + r.sync141.done
    return sum + (total > 0 ? done / total : 0)
  }, 0) / VILLAGE_ROWS.length * 100)

  // 生成每月数据（带趋势变化）
  let baseTasks = Math.round(totalTasks * 0.5) // 起始值较低
  let baseHazards = Math.round(totalHazards * 0.5)
  let completionRate = Math.max(50, avgCompletionRate - 20) // 起始完成率较低
  let hazardRectRate = Math.max(40, avgCompletionRate - 30) // 起始隐患整改率较低

  return months.map((month, idx) => {
    // 模拟趋势：任务数逐渐增加，完成率逐渐提高
    const growthFactor = 1 + idx * 0.05 // 每月增长5%
    const tasks = Math.round(baseTasks * growthFactor + Math.random() * 500)
    const hazards = Math.round(baseHazards * growthFactor * 0.6 + Math.random() * 100)

    // 完成率和隐患整改率逐渐提高
    completionRate = Math.min(95, completionRate + Math.random() * 3)
    hazardRectRate = Math.min(90, hazardRectRate + Math.random() * 4)

    // 更新基准值
    baseTasks = tasks
    baseHazards = hazards

    return {
      period: month,
      任务总数: tasks,
      完成率: Math.round(completionRate),
      查出隐患数: hazards,
      隐患整改完成率: Math.round(hazardRectRate),
    }
  })
}

// 生成近30天的趋势数据（使用绝对数值维度）
const generateDailyTrendData = (): TrendDataPoint[] => {
  const days: TrendDataPoint[] = []
  const now = new Date(2026, 5, 15) // 2026-06-15

  // 基于现有数据计算基准值
  const totalTasks = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.total + r.rcjc.total + r.sync141.total, 0)
  const totalHazards = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.hazard + r.rcjc.hazard + r.sync141.hazard, 0)
  const totalDone = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.done + r.rcjc.done + r.sync141.done, 0)
  const totalRectified = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.rectified + r.rcjc.rectified + r.sync141.rectified, 0)

  // 每日平均值
  const dailyTasks = Math.round(totalTasks * 0.03)
  const dailyHazards = Math.round(totalHazards * 0.03)
  const dailyDoneRate = totalTasks > 0 ? totalDone / totalTasks : 0.8
  const dailyRectifyRate = totalHazards > 0 ? totalRectified / totalHazards : 0.7

  // 生成每日数据（带趋势变化）
  let baseNewTasks = Math.round(dailyTasks * 1.1) // 新增任务数（略多于完成任务数）
  let baseDone = Math.round(dailyTasks * dailyDoneRate * 0.9)
  let baseHazards = Math.round(dailyHazards * 0.9)
  let baseRectified = Math.round(baseHazards * dailyRectifyRate * 0.9)

  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    const month = date.getMonth() + 1
    const day = date.getDate()
    const period = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // 模拟每日波动
    const dayVariation = 0.7 + Math.random() * 0.6 // 0.7-1.3的随机系数
    const newTasks = Math.round(baseNewTasks * dayVariation)
    const done = Math.round(baseDone * dayVariation)
    const hazards = Math.round(baseHazards * dayVariation)
    const rectified = Math.round(hazards * dailyRectifyRate * (0.85 + i * 0.005) + Math.random() * 5)

    days.push({
      period,
      新增任务数: newTasks,
      新增完成数: done,
      发现隐患数: hazards,
      整改隐患数: Math.min(rectified, hazards),
    })

    // 更新基准值
    baseDone = done
    baseHazards = hazards
    baseRectified = rectified
  }

  return days
}

// 生成近12周的趋势数据（使用绝对数值维度）
const generateWeeklyTrendData = (): TrendDataPoint[] => {
  const weeks: TrendDataPoint[] = []
  const now = new Date(2026, 5, 15) // 2026-06-15

  // 基于现有数据计算基准值
  const totalTasks = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.total + r.rcjc.total + r.sync141.total, 0)
  const totalHazards = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.hazard + r.rcjc.hazard + r.sync141.hazard, 0)
  const totalDone = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.done + r.rcjc.done + r.sync141.done, 0)
  const totalRectified = VILLAGE_ROWS.reduce((sum, r) => sum + r.fzjz.rectified + r.rcjc.rectified + r.sync141.rectified, 0)

  // 每周平均值
  const weeklyTasks = Math.round(totalTasks * 0.1)
  const weeklyHazards = Math.round(totalHazards * 0.1)
  const weeklyDoneRate = totalTasks > 0 ? totalDone / totalTasks : 0.8
  const weeklyRectifyRate = totalHazards > 0 ? totalRectified / totalHazards : 0.7

  // 生成每周数据（带趋势变化）
  let baseNewTasks = Math.round(weeklyTasks * 1.1) // 新增任务数（略多于完成任务数）
  let baseDone = Math.round(weeklyTasks * weeklyDoneRate * 0.9) // 起始值
  let baseHazards = Math.round(weeklyHazards * 0.9)
  let baseRectified = Math.round(baseHazards * weeklyRectifyRate * 0.9)

  for (let i = 0; i < 12; i++) {
    const period = `W${i + 1}` // W1, W2, ..., W12

    // 模拟每周波动（逐渐提高完成率和整改率）
    const weekVariation = 0.85 + Math.random() * 0.3 // 0.85-1.15的随机系数
    const newTasks = Math.round(baseNewTasks * weekVariation)
    const done = Math.round(baseDone * weekVariation)
    const hazards = Math.round(baseHazards * weekVariation)
    const rectified = Math.round(hazards * weeklyRectifyRate * (0.9 + i * 0.01) + Math.random() * 20)

    weeks.push({
      period,
      新增任务数: newTasks,
      新增完成数: done,
      发现隐患数: hazards,
      整改隐患数: Math.min(rectified, hazards), // 整改数不超过隐患数
    })

    // 更新基准值（逐渐提高）
    baseDone = done
    baseHazards = hazards
    baseRectified = rectified
  }

  return weeks
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
  'fzjz_total' | 'fzjz_done' | 'fzjz_newTasks' | 'fzjz_newDone' | 'fzjz_hazard' | 'fzjz_newHazard' | 'fzjz_rectified' | 'fzjz_rectifying' |
  'rcjc_total' | 'rcjc_done' | 'rcjc_newTasks' | 'rcjc_newDone' | 'rcjc_hazard' | 'rcjc_newHazard' | 'rcjc_rectified' | 'rcjc_rectifying' |
  'sync141_total' | 'sync141_done' | 'sync141_newTasks' | 'sync141_newDone' | 'sync141_hazard' | 'sync141_newHazard' | 'sync141_rectified' | 'sync141_rectifying'
  | 'rcjc_total' | 'rcjc_done' | 'rcjc_hazard' | 'rcjc_rectified' | 'rcjc_rectifying'
  | 'sync141_total' | 'sync141_done' | 'sync141_hazard' | 'sync141_rectified' | 'sync141_rectifying'

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
    // 日常检查
    case 'rcjc_total': return row.rcjc.total
    case 'rcjc_done': return row.rcjc.done
    case 'rcjc_newTasks': return row.rcjc.newTasks
    case 'rcjc_newDone': return row.rcjc.newDone
    case 'rcjc_hazard': return row.rcjc.hazard
    case 'rcjc_newHazard': return row.rcjc.newHazard
    case 'rcjc_rectified': return row.rcjc.rectified
    case 'rcjc_rectifying': return row.rcjc.rectifying
    // 141同步
    case 'sync141_total': return row.sync141.total
    case 'sync141_done': return row.sync141.done
    case 'sync141_newTasks': return row.sync141.newTasks
    case 'sync141_newDone': return row.sync141.newDone
    case 'sync141_hazard': return row.sync141.hazard
    case 'sync141_newHazard': return row.sync141.newHazard
    case 'sync141_rectified': return row.sync141.rectified
    case 'sync141_rectifying': return row.sync141.rectifying
  }
}

function rateStr(done: number, total: number): string {
  if (total === 0) return '0.00%'
  return ((done / total) * 100).toFixed(2) + '%'
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [quickRange, setQuickRange] = useState<'month' | 'lastMonth' | 'quarter' | 'year' | ''>('')
  const [showNote, setShowNote] = useState(false)
  const [timeDimension, setTimeDimension] = useState<'12months' | '12weeks' | '30days'>('12months')
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null)
  const [showTableHelp, setShowTableHelp] = useState(false) // 表1指标说明悬浮框
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
    const zero: TaskSub = { total: 0, done: 0, hazard: 0, rectified: 0, rectifying: 0, newTasks: 0, newDone: 0, newHazard: 0 }
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

  // 表1列定义（9个指标）
  const subCols = ['总任务数', '总完成率', '新增任务数', '新增完成数', '总隐患数', '整改完成率', '确认隐患数', '已整改', '整改中'] as const
  // 指标说明
  const tableMetrics = [
    { name: '总任务数', definition: '截止查询时间，共有多少任务数' },
    { name: '总完成率', definition: '截止查询时间，总已完成任务数/总任务数' },
    { name: '新增任务数', definition: '查询期间新增的任务数' },
    { name: '新增完成数', definition: '查询期间完成的任务数' },
    { name: '总隐患数', definition: '截止查询时间，共有多少隐患数' },
    { name: '整改完成率', definition: '截止查询时间，已整改的隐患数/总隐患数' },
    { name: '确认隐患数', definition: '查询期间新增的隐患数' },
    { name: '已整改', definition: '查询期间已整改的隐患数' },
    { name: '整改中', definition: '查询期间整改中的隐患数' },
  ] as const

  // 渲染某个 TaskSub 的子列（9个指标），isLast 表示是否最后一类（不需要右侧粗分隔线）
  function renderSubCols(sub: TaskSub, subBg?: string, isLast = false) {
    const totalRate = rateStr(sub.done, sub.total)
    const hazardRate = rateStr(sub.rectified, sub.hazard)
    const lastStyle: React.CSSProperties = isLast ? {} : { borderRight: '2px solid #D1D5DB' }
    return (
      <>
        {/* 1.总任务数 */}
        <td style={td({ textAlign: 'center', fontWeight: 600, background: subBg })}>{sub.total.toLocaleString()}</td>
        {/* 2.总完成率 */}
        <td style={td({ textAlign: 'center', background: subBg })}>
          <RateText rate={totalRate} />
        </td>
        {/* 3.新增任务数 */}
        <td style={td({ textAlign: 'center', color: sub.newTasks > 0 ? '#7C3AED' : '#9CA3AF', fontWeight: sub.newTasks > 0 ? 600 : 400, background: subBg })}>
          {sub.newTasks.toLocaleString()}
        </td>
        {/* 4.新增完成数 */}
        <td style={td({ textAlign: 'center', color: sub.newDone > 0 ? '#4F46E5' : '#9CA3AF', fontWeight: sub.newDone > 0 ? 600 : 400, background: subBg })}>
          {sub.newDone.toLocaleString()}
        </td>
        {/* 5.总隐患数 */}
        <td style={td({ textAlign: 'center', color: sub.hazard > 0 ? '#DC2626' : '#9CA3AF', fontWeight: sub.hazard > 0 ? 600 : 400, background: subBg })}>
          {sub.hazard.toLocaleString()}
        </td>
        {/* 6.整改完成率 */}
        <td style={td({ textAlign: 'center', background: subBg })}>
          <RateText rate={hazardRate} />
        </td>
        {/* 7.确认隐患数 */}
        <td style={td({ textAlign: 'center', color: sub.newHazard > 0 ? '#F59E0B' : '#9CA3AF', fontWeight: sub.newHazard > 0 ? 600 : 400, background: subBg })}>
          {sub.newHazard.toLocaleString()}
        </td>
        {/* 8.已整改 */}
        <td style={td({ textAlign: 'center', color: sub.rectified > 0 ? '#059669' : '#9CA3AF', fontWeight: sub.rectified > 0 ? 600 : 400, background: subBg })}>
          {sub.rectified.toLocaleString()}
        </td>
        {/* 9.整改中 */}
        <td style={td({ textAlign: 'center', color: sub.rectifying > 0 ? '#F59E0B' : '#9CA3AF', fontWeight: sub.rectifying > 0 ? 600 : 400, background: subBg, ...lastStyle })}>
          {sub.rectifying.toLocaleString()}
        </td>
      </>
    )
  }

  const totalColSpan = 1 + 1 + 3 * 9 // # + 村社 + 3类 × 9子列 = 29

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
        const rate = (v: number, base: number) => base > 0 ? `${((v / base) * 100).toFixed(2)}%` : '-'

        // 任务统计指标定义（用于第4个指标卡）
  const taskStatMetrics = [
    { name: '新增任务数', definition: '查询期间新增的任务数' },
    { name: '新增完成数', definition: '查询期间完成的任务数' },
    { name: '累计未完成任务数', definition: '截止查询时间，累计未完成的任务总数' },
    { name: '累计完成率', definition: '截止查询时间，总完成任务数/总任务数' },
    { name: '发现隐患数', definition: '查询期间发现的隐患数' },
    { name: '整改隐患数', definition: '查询期间整改的隐患数' },
    { name: '累计整改率', definition: '截止查询时间，总整改隐患数/总隐患数' },
  ] as const

  // 生成任务统计数据（昨日 + 上周）
  const generateTaskStats = () => {
    const data = selectedVillages.length > 0 ? filteredVillages : allVillages
    const totalTasks = data.reduce((sum, r) => sum + r.fzjz.total + r.rcjc.total + r.sync141.total, 0)
    const totalHazards = data.reduce((sum, r) => sum + r.fzjz.hazard + r.rcjc.hazard + r.sync141.hazard, 0)
    const totalDone = data.reduce((sum, r) => sum + r.fzjz.done + r.rcjc.done + r.sync141.done, 0)
    const totalRectified = data.reduce((sum, r) => sum + r.fzjz.rectified + r.rcjc.rectified + r.sync141.rectified, 0)

    // 昨日数据（模拟）
    const yesterdayNew = Math.round(totalTasks * 0.03 + Math.random() * 50)
    const yesterdayDone = Math.round(totalDone * 0.03 + Math.random() * 40)
    const yesterdayPending = Math.round(totalTasks * 0.97 - yesterdayDone) // 模拟未完成任务
    const yesterdayHazard = Math.round(totalHazards * 0.03 + Math.random() * 20)
    const yesterdayRectified = Math.round(yesterdayHazard * 0.7)
    const yesterdayCumulativeRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0
    const yesterdayHazardRate = totalHazards > 0 ? Math.round((totalRectified / totalHazards) * 100) : 0

    // 上周数据（模拟）
    const lastWeekNew = Math.round(totalTasks * 0.21 + Math.random() * 200)
    const lastWeekDone = Math.round(totalDone * 0.21 + Math.random() * 150)
    const lastWeekPending = Math.round(totalTasks * 0.79 - lastWeekDone) // 模拟未完成任务
    const lastWeekHazard = Math.round(totalHazards * 0.21 + Math.random() * 80)
    const lastWeekRectified = Math.round(lastWeekHazard * 0.7)
    const lastWeekCumulativeRate = yesterdayCumulativeRate // 累计率随时间变化不大
    const lastWeekHazardRate = yesterdayHazardRate

    return {
      yesterday: [yesterdayNew, yesterdayDone, yesterdayPending, yesterdayCumulativeRate, yesterdayHazard, yesterdayRectified, yesterdayHazardRate],
      lastWeek: [lastWeekNew, lastWeekDone, lastWeekPending, lastWeekCumulativeRate, lastWeekHazard, lastWeekRectified, lastWeekHazardRate],
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

        const stats = generateTaskStats()

        return (
      <div style={{ display: 'flex', gap: 12 }}>
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
        {/* ─── 第4个指标卡：任务统计 ─────────────────────── */}
        <div
          style={{
            flex: 1,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* 顶部：图标 + 标题 + 备注图标 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 28 }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 4 }}>任务统计</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>昨日 · 上周</div>
            </div>
            {/* 备注图标：悬浮显示所有指标解释 */}
            <div style={{ position: 'relative' }}>
              <span
                onMouseEnter={() => setHoveredMetric(-1)}
                onMouseLeave={() => setHoveredMetric(null)}
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
              {hoveredMetric === -1 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  padding: '12px 16px',
                  zIndex: 1000,
                  minWidth: 280,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>指标解释</div>
                  {taskStatMetrics.map((m, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{m.name}：</span>
                      {m.definition}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* 底部：指标表格 */}
          <div style={{ borderTop: '1px dashed #FECACA', paddingTop: 8, overflowY: 'auto', maxHeight: 280 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '4px 8px', fontSize: 11 }}>
              {/* 表头 */}
              <div style={{ fontWeight: 600, color: '#6B7280', paddingBottom: 4, borderBottom: '1px solid #FECACA' }}></div>
              <div style={{ fontWeight: 600, color: '#6B7280', textAlign: 'right', paddingBottom: 4, borderBottom: '1px solid #FECACA' }}>昨日</div>
              <div style={{ fontWeight: 600, color: '#6B7280', textAlign: 'right', paddingBottom: 4, borderBottom: '1px solid #FECACA' }}>上周</div>
              {/* 数据行 */}
              {taskStatMetrics.map((metric, i) => {
                const isRate = metric.name.includes('率')
                const yesterdayVal = stats.yesterday[i]
                const lastWeekVal = stats.lastWeek[i]
                return (
                  <React.Fragment key={metric.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0', color: '#374151', fontWeight: 500 }}>
                      {metric.name}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#DC2626', padding: '3px 0' }}>
                      {isRate ? `${yesterdayVal}%` : yesterdayVal.toLocaleString()}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600, color: '#059669', padding: '3px 0' }}>
                      {isRate ? `${lastWeekVal}%` : lastWeekVal.toLocaleString()}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
    })()}

        {/* ─── 村社近期检查数据变化 ─────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
        {/* 标题栏 + 维度切换 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>村社近期检查数据变化</div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #D1D5DB' }}>
            {([
              { key: '12months', label: '近12个月' },
              { key: '12weeks', label: '近12周' },
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
        {/* 折线图 */}
        {timeDimension === '12months' ? (
          /* 近12个月：任务总数、完成率、查出隐患数、隐患整改完成率 */
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={generateMonthlyTrendData()} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} unit="%" />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
              <Legend
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 12, fontSize: 12 }}>
                    {[
                      { name: '任务总数', color: '#4F46E5' },
                      { name: '完成率', color: '#059669' },
                      { name: '查出隐患数', color: '#DC2626' },
                      { name: '隐患整改完成率', color: '#D97706' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: item.color, display: 'inline-block', borderRadius: 2 }} />
                        <span style={{ color: '#374151' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              <Line yAxisId="left" type="monotone" dataKey="任务总数" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="任务总数" position="top" style={{ fontSize: 9, fill: '#4F46E5' }} />
              </Line>
              <Line yAxisId="right" type="monotone" dataKey="完成率" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} unit="%">
                <LabelList dataKey="完成率" position="top" style={{ fontSize: 9, fill: '#059669' }} formatter={(v: number) => `${v}%`} />
              </Line>
              <Line yAxisId="left" type="monotone" dataKey="查出隐患数" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="查出隐患数" position="top" style={{ fontSize: 9, fill: '#DC2626' }} />
              </Line>
              <Line yAxisId="right" type="monotone" dataKey="隐患整改完成率" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} unit="%">
                <LabelList dataKey="隐患整改完成率" position="top" style={{ fontSize: 9, fill: '#D97706' }} formatter={(v: number) => `${v}%`} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          /* 近12周、近30天：完成任务数、发现隐患数、整改隐患数 */
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={
                timeDimension === '12weeks' ? generateWeeklyTrendData() :
                generateDailyTrendData()
              }
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                interval={timeDimension === '30days' ? 4 : 1}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
              <Legend
                content={() => (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, paddingTop: 12, fontSize: 12 }}>
                    {[
                      { name: '新增任务数', color: '#7C3AED' },
                      { name: '新增完成数', color: '#4F46E5' },
                      { name: '发现隐患数', color: '#DC2626' },
                      { name: '整改隐患数', color: '#059669' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: item.color, display: 'inline-block', borderRadius: 2 }} />
                        <span style={{ color: '#374151' }}>{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              <Line yAxisId="left" type="monotone" dataKey="新增任务数" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="新增任务数" position="top" style={{ fontSize: 9, fill: '#7C3AED' }} />
              </Line>
              <Line yAxisId="left" type="monotone" dataKey="新增完成数" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="新增完成数" position="top" style={{ fontSize: 9, fill: '#4F46E5' }} />
              </Line>
              <Line yAxisId="left" type="monotone" dataKey="发现隐患数" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="发现隐患数" position="top" style={{ fontSize: 9, fill: '#DC2626' }} />
              </Line>
              <Line yAxisId="left" type="monotone" dataKey="整改隐患数" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                <LabelList dataKey="整改隐患数" position="top" style={{ fontSize: 9, fill: '#059669' }} />
              </Line>
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
            截止{new Date().toISOString().slice(0, 10)}，良渚街道{filteredVillages.length}个村社任务检查情况如下：
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {([
              {
                label: '总计',
                color: '#111827',
                bg: '#F9FAFB',
                border: '#D1D5DB',
                note: '总计=日常检查+141同步+防灾减灾',
                total: overallStats.rcjc.total + overallStats.sync141.total + overallStats.fzjz.total,
                doneRate: rateStr(overallStats.rcjc.done + overallStats.sync141.done + overallStats.fzjz.done, overallStats.rcjc.total + overallStats.sync141.total + overallStats.fzjz.total),
                hazard: overallStats.rcjc.hazard + overallStats.sync141.hazard + overallStats.fzjz.hazard,
                rectRate: rateStr(overallStats.rcjc.rectified + overallStats.sync141.rectified + overallStats.fzjz.rectified, overallStats.rcjc.hazard + overallStats.sync141.hazard + overallStats.fzjz.hazard),
              },
              {
                label: '日常检查',
                color: '#059669',
                bg: '#F0FDF4',
                border: '#A7F3D0',
                note: '包含自身安全检查和村社创建的监管对象检查',
                total: overallStats.rcjc.total,
                doneRate: rateStr(overallStats.rcjc.done, overallStats.rcjc.total),
                hazard: overallStats.rcjc.hazard,
                rectRate: rateStr(overallStats.rcjc.rectified, overallStats.rcjc.hazard),
              },
              {
                label: '141同步',
                color: '#7C3AED',
                bg: '#FAF5FF',
                border: '#DDD6FE',
                total: overallStats.sync141.total,
                doneRate: rateStr(overallStats.sync141.done, overallStats.sync141.total),
                hazard: overallStats.sync141.hazard,
                rectRate: rateStr(overallStats.sync141.rectified, overallStats.sync141.hazard),
              },
              {
                label: '防灾减灾',
                color: '#1E40AF',
                bg: '#EFF6FF',
                border: '#BFDBFE',
                total: overallStats.fzjz.total,
                doneRate: rateStr(overallStats.fzjz.done, overallStats.fzjz.total),
                hazard: overallStats.fzjz.hazard,
                rectRate: rateStr(overallStats.fzjz.rectified, overallStats.fzjz.hazard),
              },
            ] as const).map(card => (
              <div
                key={card.label}
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: card.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {card.label}
                  {'note' in card && card.note && (
                    <span title={card.note} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: '50%', border: '1px solid #9CA3AF', fontSize: 9, color: '#9CA3AF', cursor: 'help', fontWeight: 600, lineHeight: 1 }}>!</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, color: '#374151' }}>
                  <span style={{ color: '#6B7280' }}>总任务数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right' }}>{card.total.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>总完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: rateColor(card.doneRate) }}>{card.doneRate}</span>
                  <span style={{ color: '#6B7280' }}>总隐患数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#DC2626' }}>{card.hazard.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>整改完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: rateColor(card.rectRate) }}>{card.rectRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
          <span>📋 <b>日常检查</b>（绿色列）</span>
          <span>🔄 <b>141同步</b>（紫色列）</span>
          <span>📊 <b>防灾减灾</b>（蓝色列）</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
            <thead>
              {/* 第一级表头：类别分组 */}
              <tr>
                <th rowSpan={2} style={{ ...th, width: 42, borderRight: '1px solid #E5E7EB' }}>#</th>
                <th rowSpan={2} style={{ ...th, textAlign: 'left', minWidth: 110 }}>村社</th>
                <GroupTh label="日常检查任务" colSpan={9} bg="#F0FDF4" />
                <GroupTh label="141同步任务" colSpan={9} bg="#FAF5FF" />
                <GroupTh label="防灾减灾任务" colSpan={9} bg="#EFF6FF" />
              </tr>
              {/* 第二级表头：9个子列 */}
              <tr>
                {/* 日常检查 - 9个指标 */}
                <SortTh col="rcjc_total" label="总任务数" extraStyle={{ background: '#F0FDF4' }} />
                <th style={{ ...th, background: '#F0FDF4', width: 64 }}>总完成率</th>
                <SortTh col="rcjc_newTasks" label="新增任务数" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_newDone" label="新增完成数" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_hazard" label="总隐患数" extraStyle={{ background: '#F0FDF4' }} />
                <th style={{ ...th, background: '#F0FDF4', width: 76 }}>整改完成率</th>
                <SortTh col="rcjc_newHazard" label="确认隐患数" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_rectified" label="已整改" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_rectifying" label="整改中" extraStyle={{ background: '#F0FDF4', borderRight: '2px solid #D1D5DB' }} />
                {/* 141同步 - 9个指标 */}
                <SortTh col="sync141_total" label="总任务数" extraStyle={{ background: '#FAF5FF' }} />
                <th style={{ ...th, background: '#FAF5FF', width: 64 }}>总完成率</th>
                <SortTh col="sync141_newTasks" label="新增任务数" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_newDone" label="新增完成数" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_hazard" label="总隐患数" extraStyle={{ background: '#FAF5FF' }} />
                <th style={{ ...th, background: '#FAF5FF', width: 76 }}>整改完成率</th>
                <SortTh col="sync141_newHazard" label="确认隐患数" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_rectified" label="已整改" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_rectifying" label="整改中" extraStyle={{ background: '#FAF5FF', borderRight: '2px solid #D1D5DB' }} />
                {/* 防灾减灾 - 9个指标 */}
                <SortTh col="fzjz_total" label="总任务数" extraStyle={{ background: '#EFF6FF' }} />
                <th style={{ ...th, background: '#EFF6FF', width: 64 }}>总完成率</th>
                <SortTh col="fzjz_newTasks" label="新增任务数" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_newDone" label="新增完成数" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_hazard" label="总隐患数" extraStyle={{ background: '#EFF6FF' }} />
                <th style={{ ...th, background: '#EFF6FF', width: 76 }}>整改完成率</th>
                <SortTh col="fzjz_newHazard" label="确认隐患数" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_rectified" label="已整改" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_rectifying" label="整改中" extraStyle={{ background: '#EFF6FF', borderRight: 'none' }} />
              </tr>
            </thead>
            <tbody>
              {pagedVillages.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <td style={td({ textAlign: 'center', color: '#9CA3AF', fontSize: 11, fontWeight: 500 })}>{(page - 1) * pageSize + i + 1}</td>
                  <td style={td({ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' })}>{row.village}</td>
                  {/* 日常检查 */}
                  {renderSubCols(row.rcjc, '#FAFFFC')}
                  {/* 141同步 */}
                  {renderSubCols(row.sync141, '#FDFAFF')}
                  {/* 防灾减灾 */}
                  {renderSubCols(row.fzjz, '#FAFCFF', true)}
                </tr>
              ))}
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
