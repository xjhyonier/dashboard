import { useState, useMemo, useRef, useEffect } from 'react'

// ─── 表2数据：14项已同步任务分析 ────────────────────────────────────────
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
  { status: '已创建', destination: '村社任务', exception: '无异常，余智护杭任务已同步至村社/镇街', count: 2664, percent: '50.86%' },
  { status: '', destination: '镇街任务', exception: '无异常，余智护杭任务已同步至村社/镇街', count: 195, percent: '3.72%' },
  // 检查完成
  { status: '检查完成', destination: '村社任务', exception: '无异常，余智护杭任务已同步至村社/镇街，并在一起安完成了检查', count: 2379, percent: '45.42%' },
  // 小计1
  { status: '', destination: '', exception: '小计', count: 5238, percent: '', isSubtotal: true, subtotalCount: 5238 },
  // 数据校验异常
  { status: '数据校验异常', destination: '未知分配去向', exception: '企业尚未开通一起安平台，请在村社底数中录入', count: 6661, percent: '77.21%' },
  { status: '', destination: '村社任务', exception: '企业已开通一起安平台，但不在村社底数内，请在村社底数中录入', count: 1506, percent: '17.46%' },
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

// ─── 表1数据：村社检查任务统计 ────────────────────────────────────────────
interface TaskSub {
  total: number    // 任务总数
  done: number     // 已完成
  hazard: number   // 隐患数量
  rectified: number // 已整改
  rectifying: number // 整改中
}

interface VillageRow {
  village: string
  date: string      // 数据日期，格式 YYYY-MM-DD
  fzjz: TaskSub    // 防灾减灾
  rcjc: TaskSub    // 日常检查
  sync141: TaskSub // 141同步
  isTotal?: boolean
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
    return { total: t, done: d, hazard, rectified, rectifying }
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

const VILLAGE_ROWS: VillageRow[] = VILLAGE_RAW.map(r => ({
  village: r.village,
  date: r.date,
  ...genMock(r.total, r.done),
}))

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
type SortCol = 'village' | 'fzjz_total' | 'fzjz_done' | 'fzjz_hazard' | 'fzjz_rectified' | 'fzjz_rectifying'
  | 'rcjc_total' | 'rcjc_done' | 'rcjc_hazard' | 'rcjc_rectified' | 'rcjc_rectifying'
  | 'sync141_total' | 'sync141_done' | 'sync141_hazard' | 'sync141_rectified' | 'sync141_rectifying'

function getSortValue(row: VillageRow, col: SortCol): number {
  switch (col) {
    case 'village': return 0
    case 'fzjz_total': return row.fzjz.total
    case 'fzjz_done': return row.fzjz.done
    case 'fzjz_hazard': return row.fzjz.hazard
    case 'fzjz_rectified': return row.fzjz.rectified
    case 'fzjz_rectifying': return row.fzjz.rectifying
    case 'rcjc_total': return row.rcjc.total
    case 'rcjc_done': return row.rcjc.done
    case 'rcjc_hazard': return row.rcjc.hazard
    case 'rcjc_rectified': return row.rcjc.rectified
    case 'rcjc_rectifying': return row.rcjc.rectifying
    case 'sync141_total': return row.sync141.total
    case 'sync141_done': return row.sync141.done
    case 'sync141_hazard': return row.sync141.hazard
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
    // 时间筛选
    if (dateFrom) {
      matched = matched.filter(r => r.date >= dateFrom)
    }
    if (dateTo) {
      matched = matched.filter(r => r.date <= dateTo)
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
        // 本月 1号 到最后一天
        const lastDay = new Date(y, m + 1, 0).getDate()
        from = `${y}-${pad(m + 1)}-01`
        to = `${y}-${pad(m + 1)}-${pad(lastDay)}`
        break
      }
      case 'lastMonth': {
        const lastMonth = m === 0 ? 11 : m - 1
        const lastYear = m === 0 ? y - 1 : y
        const lastDay = new Date(lastYear, lastMonth + 1, 0).getDate()
        from = `${lastYear}-${pad(lastMonth + 1)}-01`
        to = `${lastYear}-${pad(lastMonth + 1)}-${pad(lastDay)}`
        break
      }
      case 'quarter': {
        const qStartMonth = Math.floor(m / 3) * 3 // 0, 3, 6, 9
        const qEndMonth = qStartMonth + 2
        const lastDay = new Date(y, qEndMonth + 1, 0).getDate()
        from = `${y}-${pad(qStartMonth + 1)}-01`
        to = `${y}-${pad(qEndMonth + 1)}-${pad(lastDay)}`
        break
      }
      case 'year': {
        from = `${y}-01-01`
        to = `${y}-12-31`
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
    const zero: TaskSub = { total: 0, done: 0, hazard: 0, rectified: 0, rectifying: 0 }
    const data = filteredVillages // 使用筛选后的数据
    const sum = data.reduce((acc, r) => ({
      fzjz: {
        total: acc.fzjz.total + r.fzjz.total,
        done: acc.fzjz.done + r.fzjz.done,
        hazard: acc.fzjz.hazard + r.fzjz.hazard,
        rectified: acc.fzjz.rectified + r.fzjz.rectified,
        rectifying: acc.fzjz.rectifying + r.fzjz.rectifying,
      },
      rcjc: {
        total: acc.rcjc.total + r.rcjc.total,
        done: acc.rcjc.done + r.rcjc.done,
        hazard: acc.rcjc.hazard + r.rcjc.hazard,
        rectified: acc.rcjc.rectified + r.rcjc.rectified,
        rectifying: acc.rcjc.rectifying + r.rcjc.rectifying,
      },
      sync141: {
        total: acc.sync141.total + r.sync141.total,
        done: acc.sync141.done + r.sync141.done,
        hazard: acc.sync141.hazard + r.sync141.hazard,
        rectified: acc.sync141.rectified + r.sync141.rectified,
        rectifying: acc.sync141.rectifying + r.sync141.rectifying,
      },
    }), { fzjz: zero, rcjc: zero, sync141: zero })
    return sum
  }, [filteredVillages])

  // 动态合计行
  const totalRow = useMemo(() => {
    const data = selectedVillages.length > 0 ? filteredVillages : allVillages
    const zero: TaskSub = { total: 0, done: 0, hazard: 0, rectified: 0, rectifying: 0 }
    const sum = data.reduce((acc, r) => ({
      fzjz: {
        total: acc.fzjz.total + r.fzjz.total,
        done: acc.fzjz.done + r.fzjz.done,
        hazard: acc.fzjz.hazard + r.fzjz.hazard,
        rectified: acc.fzjz.rectified + r.fzjz.rectified,
        rectifying: acc.fzjz.rectifying + r.fzjz.rectifying,
      },
      rcjc: {
        total: acc.rcjc.total + r.rcjc.total,
        done: acc.rcjc.done + r.rcjc.done,
        hazard: acc.rcjc.hazard + r.rcjc.hazard,
        rectified: acc.rcjc.rectified + r.rcjc.rectified,
        rectifying: acc.rcjc.rectifying + r.rcjc.rectifying,
      },
      sync141: {
        total: acc.sync141.total + r.sync141.total,
        done: acc.sync141.done + r.sync141.done,
        hazard: acc.sync141.hazard + r.sync141.hazard,
        rectified: acc.sync141.rectified + r.sync141.rectified,
        rectifying: acc.sync141.rectifying + r.sync141.rectifying,
      },
    }), { fzjz: zero, rcjc: zero, sync141: zero })
    return { village: '合计', date: '', ...sum, isTotal: true } as VillageRow
  }, [filteredVillages, allVillages, selectedVillages])

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

  const subCols = ['任务数', '已完成', '完成率', '确认隐患数', '已整改', '整改中', '整改完成率'] as const
  const subKeys = ['total', 'done', 'hazard', 'rectified', 'rectifying'] as const

  // 渲染某个 TaskSub 的子列，isLast 表示是否最后一类（不需要右侧粗分隔线）
  function renderSubCols(sub: TaskSub, subBg?: string, isLast = false) {
    const rate = rateStr(sub.done, sub.total)
    const lastStyle: React.CSSProperties = isLast ? {} : { borderRight: '2px solid #D1D5DB' }
    return (
      <>
        <td style={td({ textAlign: 'center', fontWeight: 600, background: subBg })}>{sub.total.toLocaleString()}</td>
        <td style={td({ textAlign: 'center', color: sub.done === 0 ? '#9CA3AF' : '#111827', background: subBg })}>{sub.done.toLocaleString()}</td>
        <td style={td({ textAlign: 'center', background: subBg })}>
          <RateText rate={rate} />
        </td>
        <td style={td({ textAlign: 'center', color: sub.hazard > 0 ? '#DC2626' : '#9CA3AF', fontWeight: sub.hazard > 0 ? 600 : 400, background: subBg })}>
          {sub.hazard.toLocaleString()}
        </td>
        <td style={td({ textAlign: 'center', color: sub.rectified > 0 ? '#059669' : '#9CA3AF', fontWeight: sub.rectified > 0 ? 600 : 400, background: subBg })}>
          {sub.rectified.toLocaleString()}
        </td>
        <td style={td({ textAlign: 'center', color: sub.rectifying > 0 ? '#F59E0B' : '#9CA3AF', fontWeight: sub.rectifying > 0 ? 600 : 400, background: subBg })}>
          {sub.rectifying.toLocaleString()}
        </td>
        <td style={td({ textAlign: 'center', background: subBg, ...lastStyle })}>
          <RateText rate={rateStr(sub.rectified, sub.hazard)} />
        </td>
      </>
    )
  }

  const totalColSpan = 1 + 1 + 3 * 7 // # + 村社 + 3类 × 7子列 = 23

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
        {/* 时间筛选 */}
        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>任务创建时间：</span>
        {/* 快速筛选 */}
        {(['month', 'lastMonth', 'quarter', 'year'] as const).map(range => {
          const labels: Record<string, string> = { month: '本月', lastMonth: '上月', quarter: '本季', year: '本年' }
          const active = quickRange === range
          return (
            <button
              key={range}
              onClick={() => applyQuickRange(range)}
              style={{
                padding: '2px 10px',
                border: active ? '1px solid #4F46E5' : '1px solid #D1D5DB',
                borderRadius: 4,
                background: active ? '#EEF2FF' : 'white',
                color: active ? '#4F46E5' : '#6B7280',
                fontSize: 11,
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
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setQuickRange('') }}
          style={{
            padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', width: 130,
          }}
        />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>至</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setQuickRange('') }}
          style={{
            padding: '3px 8px', border: '1px solid #D1D5DB', borderRadius: 4,
            fontSize: 12, color: '#374151', width: 130,
          }}
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={clearDate}
            style={{
              padding: '3px 8px', border: '1px solid #FCA5A5', borderRadius: 4,
              background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer',
            }}
          >
            清除时间
          </button>
        )}
        {/* 分隔 */}
        <div style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px' }} />
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
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          {
            label: '企业数',
            value: 1286,
            unit: '家',
            color: '#1D4ED8',
            bg: '#EFF6FF',
            border: '#BFDBFE',
            icon: '🏢',
            registered: 1056,
            registeredRate: '82.12%',
          },
          {
            label: '场所数',
            value: 3452,
            unit: '处',
            color: '#059669',
            bg: '#F0FDF4',
            border: '#A7F3D0',
            icon: '🏪',
            registered: 2890,
            registeredRate: '83.72%',
          },
          {
            label: '出租房数',
            value: 876,
            unit: '套',
            color: '#7C3AED',
            bg: '#FAF5FF',
            border: '#DDD6FE',
            icon: '🏠',
            registered: 720,
            registeredRate: '82.19%',
          },
        ].map(item => (
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

      {/* ─── 表1：村社检查任务统计 ─────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {/* 标题栏 */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>表1：村社检查任务统计</span>
            <span style={{ marginLeft: 12, fontSize: 12, color: '#6B7280' }}>
              共 {filteredVillages.length} 条
            </span>
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
                total: overallStats.fzjz.total + overallStats.rcjc.total + overallStats.sync141.total,
                doneRate: rateStr(overallStats.fzjz.done + overallStats.rcjc.done + overallStats.sync141.done, overallStats.fzjz.total + overallStats.rcjc.total + overallStats.sync141.total),
                hazard: overallStats.fzjz.hazard + overallStats.rcjc.hazard + overallStats.sync141.hazard,
                rectRate: rateStr(overallStats.fzjz.rectified + overallStats.rcjc.rectified + overallStats.sync141.rectified, overallStats.fzjz.hazard + overallStats.rcjc.hazard + overallStats.sync141.hazard),
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
              {
                label: '日常检查',
                color: '#059669',
                bg: '#F0FDF4',
                border: '#A7F3D0',
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
                <div style={{ fontSize: 13, fontWeight: 700, color: card.color }}>{card.label}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11, color: '#374151' }}>
                  <span style={{ color: '#6B7280' }}>任务总数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right' }}>{card.total.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: rateColor(card.doneRate) }}>{card.doneRate}</span>
                  <span style={{ color: '#6B7280' }}>查出隐患数</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#DC2626' }}>{card.hazard.toLocaleString()}</span>
                  <span style={{ color: '#6B7280' }}>隐患整改完成率</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: rateColor(card.rectRate) }}>{card.rectRate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 图例 */}
        <div style={{ padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: '#6B7280', borderBottom: '1px solid #F3F4F6' }}>
          <span>📊 <b>防灾减灾</b>（蓝色列）</span>
          <span>📋 <b>日常检查</b>（绿色列）</span>
          <span>🔄 <b>141同步</b>（紫色列）</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1400 }}>
            <thead>
              {/* 第一级表头：类别分组 */}
              <tr>
                <th rowSpan={2} style={{ ...th, width: 42, borderRight: '1px solid #E5E7EB' }}>#</th>
                <th rowSpan={2} style={{ ...th, textAlign: 'left', minWidth: 110 }}>村社</th>
                <GroupTh label="防灾减灾任务" colSpan={7} bg="#EFF6FF" />
                <GroupTh label="日常检查任务" colSpan={7} bg="#F0FDF4" />
                <GroupTh label="141同步任务" colSpan={7} bg="#FAF5FF" />
              </tr>
              {/* 第二级表头：子列 */}
              <tr>
                {/* 防灾减灾 */}
                <SortTh col="fzjz_total" label="任务数" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_done" label="已完成" extraStyle={{ background: '#EFF6FF' }} />
                <th style={{ ...th, background: '#EFF6FF', width: 64 }}>完成率</th>
                <SortTh col="fzjz_hazard" label="确认隐患数" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_rectified" label="已整改" extraStyle={{ background: '#EFF6FF' }} />
                <SortTh col="fzjz_rectifying" label="整改中" extraStyle={{ background: '#EFF6FF' }} />
                <th style={{ ...th, background: '#EFF6FF', width: 76, borderRight: '2px solid #D1D5DB' }}>整改完成率</th>
                {/* 日常检查 */}
                <SortTh col="rcjc_total" label="任务数" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_done" label="已完成" extraStyle={{ background: '#F0FDF4' }} />
                <th style={{ ...th, background: '#F0FDF4', width: 64 }}>完成率</th>
                <SortTh col="rcjc_hazard" label="确认隐患数" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_rectified" label="已整改" extraStyle={{ background: '#F0FDF4' }} />
                <SortTh col="rcjc_rectifying" label="整改中" extraStyle={{ background: '#F0FDF4' }} />
                <th style={{ ...th, background: '#F0FDF4', width: 76, borderRight: '2px solid #D1D5DB' }}>整改完成率</th>
                {/* 141同步 */}
                <SortTh col="sync141_total" label="任务数" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_done" label="已完成" extraStyle={{ background: '#FAF5FF' }} />
                <th style={{ ...th, background: '#FAF5FF', width: 64 }}>完成率</th>
                <SortTh col="sync141_hazard" label="确认隐患数" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_rectified" label="已整改" extraStyle={{ background: '#FAF5FF' }} />
                <SortTh col="sync141_rectifying" label="整改中" extraStyle={{ background: '#FAF5FF' }} />
                <th style={{ ...th, background: '#FAF5FF', width: 76, borderRight: 'none' }}>整改完成率</th>
              </tr>
            </thead>
            <tbody>
              {/* 合计行 - 固定在表格顶部 */}
              <tr style={{ background: '#F3F4F6', fontWeight: 700, position: 'sticky', top: 0, zIndex: 5 }}>
                <td style={td({ textAlign: 'center', color: '#9CA3AF', fontSize: 11, background: '#F3F4F6' })}></td>
                <td style={td({ fontWeight: 700, color: '#111827', background: '#F3F4F6' })}>合计</td>
                {renderSubCols(totalRow.fzjz, '#EEF2FF')}
                {renderSubCols(totalRow.rcjc, '#EEFFEE')}
                {renderSubCols(totalRow.sync141, '#F5EEFF', true)}
              </tr>
              {pagedVillages.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  <td style={td({ textAlign: 'center', color: '#9CA3AF', fontSize: 11, fontWeight: 500 })}>{(page - 1) * pageSize + i + 1}</td>
                  <td style={td({ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' })}>{row.village}</td>
                  {/* 防灾减灾 */}
                  {renderSubCols(row.fzjz, '#FAFCFF')}
                  {/* 日常检查 */}
                  {renderSubCols(row.rcjc, '#FAFFFC')}
                  {/* 141同步 */}
                  {renderSubCols(row.sync141, '#FDFAFF', true)}
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
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>表2：余智护杭 14 项已同步任务分析</span>
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
                          display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                          fontSize: 12, fontWeight: 600,
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
                          display: 'inline-block', padding: '1px 6px', borderRadius: 3, fontSize: 12,
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
    </div>
  )
}
