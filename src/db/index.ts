/**
 * 数据层 - 企业安全数据管理
 * 纯 JS 内存实现，无需 sql.js / WebAssembly
 */

import {
  generateEnterprises,
  generateHazards,
  generateTasks,
  generateEnterpriseDimensions,
  ENTERPRISE_DIMENSIONS,
} from './data-generator'

// ==================== 数据结构 ====================

interface Enterprise {
  id: string
  name: string
  category: string
  risk_level: string
  ai_score: number
  work_group: string
  expert_id: string
  created_at: string
  updated_at: string
  // 企业端安全业务活动维度（扩展后）
  info_collection?: boolean         // 信息采集
  data_authorized?: boolean         // 数据授权
  risk_point_identified?: boolean   // 风险点识别（是否）
  
  // 安全制度建立 - 拆分为3个百分比维度
  safety_org_duty_rate?: number     // 机构职责完善度 %
  safety_system_rate?: number       // 安全制度完善度 %
  safety_invest_rate?: number       // 安全投入完善度 %
  
  // 检查任务相关
  inspection_plan_type?: 'weekly' | 'monthly' | 'quarterly' | 'none'  // 检查计划类型：按周/按月/按季/否
  inspection_execution?: 'yes' | 'no' | 'forced'  // 检查执行：是/否/强制
  
  third_party_sync?: 'yes' | 'no' | 'optional'    // 第三方同步：是/否/非强制
  patrol_used?: 'yes' | 'no' | 'optional'         // 安全巡查随手拍：是/否/非强制
  
  // 教育培训 - 是否开展 + 是否有台账
  training_done?: boolean           // 是否开展
  training_has_record?: boolean    // 是否有台账
  
  work_permit_count?: number        // 作业票报备数量（非强制，有数量即表示已报备）
  
  // 隐患统计
  hazard_self_check?: number        // 自查自纠隐患数
  hazard_platform?: number          // 监管过程中发现的隐患
  hazard_major?: number             // 重大隐患总数
  hazard_rectify_status?: 'completed' | 'uncompleted' | 'partial' | 'overdue'  // 整改进展
  
  // 新增：核心监管指标
  inspection_count?: number         // 当月检查次数
  hazard_rectified?: number         // 已整改隐患数
  enforcement_count?: number        // 执法立案数
}

interface Hazard {
  id: number
  enterprise_id: string
  source: string
  level: string
  status: string
  title: string
  created_at: string
  expert_id: string
}

interface Task {
  id: number
  enterprise_id: string
  expert_id: string
  task_type: string
  title: string
  priority: number
  status: string
  created_at: string
}

interface Expert {
  id: string
  name: string
  avatar: string
  grade: string
  work_group: string
  enterprise_count: number
}

interface WorkLog {
  id: number
  expert_id: string
  work_type: string
  count: number
  work_date: string
  week_key: string
  month_key: string
}

interface EnterpriseDimension {
  id: number
  enterprise_id: string
  dimension_name: string
  dimension_value: string
  recorded_at: string
}

// ==================== 内存数据库 ====================

interface MemoryDB {
  enterprises: Enterprise[]
  hazards: Hazard[]
  tasks: Task[]
  experts: Expert[]
  workLogs: WorkLog[]
  dimensions: EnterpriseDimension[]
}

let memDB: MemoryDB | null = null
let initPromise: Promise<MemoryDB> | null = null

const STORAGE_KEY = 'quickbi_memdb_v2'

// 序列化存储到 localStorage
function saveToStorage(data: MemoryDB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage 可能满了，忽略
  }
}

// 从 localStorage 加载
function loadFromStorage(): MemoryDB | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MemoryDB
  } catch {
    return null
  }
}

// 获取周数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// 生成初始数据
function seedData(): MemoryDB {
  const now = new Date().toISOString().split('T')[0]

  const expertsList: Expert[] = [
    { id: 'ep-001', name: '今卓', avatar: '今', grade: 'A', work_group: '物流片安全组', enterprise_count: 0 },
    { id: 'ep-002', name: '李雷', avatar: '李', grade: 'B', work_group: '良渚片重大', enterprise_count: 0 },
    { id: 'ep-003', name: '韩梅梅', avatar: '韩', grade: 'A', work_group: '良渚片较大', enterprise_count: 0 },
    { id: 'ep-004', name: '张峰', avatar: '张', grade: 'C', work_group: '勾庄片重大', enterprise_count: 0 },
    { id: 'ep-005', name: '陈晨', avatar: '陈', grade: 'B', work_group: '勾庄片较大', enterprise_count: 0 },
  ]

  const expertIds = expertsList.map(e => e.id)

  // 生成 300 家企业
  const rawEnterprises = generateEnterprises(300)
  const enterprises: Enterprise[] = rawEnterprises.map(e => ({
    ...e,
    created_at: now,
    updated_at: now,
  }))

  // 更新专家负责企业数
  const countByExpert: Record<string, number> = {}
  enterprises.forEach(e => {
    countByExpert[e.expert_id] = (countByExpert[e.expert_id] || 0) + 1
  })
  expertsList.forEach(exp => {
    exp.enterprise_count = countByExpert[exp.id] || 0
  })

  const enterpriseIds = enterprises.map(e => e.id)

  // 生成隐患
  const rawHazards = generateHazards(enterpriseIds, expertIds)
  const hazards: Hazard[] = rawHazards.map((h, i) => ({ ...h, id: i + 1 }))

  // 生成任务
  const rawTasks = generateTasks(enterpriseIds, expertIds)
  const tasks: Task[] = rawTasks.map((t, i) => ({ ...t, id: i + 1 }))

  // 生成10维度数据
  const rawDimensions = generateEnterpriseDimensions(enterpriseIds)
  const dimensions: EnterpriseDimension[] = rawDimensions.map((d, i) => ({ ...d, id: i + 1 }))

  // 生成工作日志
  const workTypes = ['risk_annotated', 'hazard_created', 'hazard_verified', 'onsite', 'video', 'consult', 'ledger', 'contact']
  const today = new Date()
  const workLogs: WorkLog[] = []
  let logId = 1

  for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekOffset * 7 - weekStart.getDay())
    const weekNum = getWeekNumber(weekStart)
    const year = weekStart.getFullYear()
    const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`
    const monthKey = `${year}-${(weekStart.getMonth() + 1).toString().padStart(2, '0')}`

    expertsList.forEach(expert => {
      workTypes.forEach(workType => {
        let baseCount = 0
        switch (workType) {
          case 'risk_annotated': baseCount = Math.floor(Math.random() * 15) + 5; break
          case 'hazard_created': baseCount = Math.floor(Math.random() * 10) + 3; break
          case 'hazard_verified': baseCount = Math.floor(Math.random() * 15) + 5; break
          case 'onsite': baseCount = Math.floor(Math.random() * 8) + 3; break
          case 'video': baseCount = Math.floor(Math.random() * 10) + 4; break
          case 'consult': baseCount = Math.floor(Math.random() * 12) + 5; break
          case 'ledger': baseCount = Math.floor(Math.random() * 8) + 3; break
          case 'contact': baseCount = Math.floor(Math.random() * 20) + 10; break
        }
        const efficiency = expert.grade === 'A' ? 1.3 : expert.grade === 'C' ? 0.7 : 1
        const count = Math.max(1, Math.round(baseCount * efficiency))

        const logDate = new Date(weekStart)
        logDate.setDate(logDate.getDate() + Math.floor(Math.random() * 7))

        workLogs.push({
          id: logId++,
          expert_id: expert.id,
          work_type: workType,
          count,
          work_date: logDate.toISOString().split('T')[0],
          week_key: weekKey,
          month_key: monthKey,
        })
      })
    })
  }

  return { enterprises, hazards, tasks, experts: expertsList, workLogs, dimensions }
}

// ==================== 初始化 ====================

export async function initDatabase(): Promise<MemoryDB> {
  if (memDB) return memDB
  if (initPromise) return initPromise

  initPromise = new Promise(resolve => {
    const stored = loadFromStorage()
    if (stored && stored.enterprises?.length > 0) {
      memDB = stored
    } else {
      memDB = seedData()
      saveToStorage(memDB)
    }
    resolve(memDB)
  })

  return initPromise
}

export function saveDatabase(): void {
  if (memDB) saveToStorage(memDB)
}

async function getDB(): Promise<MemoryDB> {
  if (!memDB) await initDatabase()
  return memDB!
}

// 兼容旧代码的 getDb 别名
export async function getDb() {
  return getDB()
}

export function resetDatabase(): void {
  localStorage.removeItem(STORAGE_KEY)
  memDB = null
  initPromise = null
}

export async function reinitializeDatabase(_count = 300): Promise<MemoryDB> {
  resetDatabase()
  return initDatabase()
}

// ==================== 数据查询接口 ====================

export async function getEnterprises(filters?: {
  riskLevel?: string
  expertId?: string
  workGroup?: string
}): Promise<Enterprise[]> {
  const db = await getDB()
  let list = [...db.enterprises]

  if (filters?.riskLevel && filters.riskLevel !== 'all') {
    list = list.filter(e => e.risk_level === filters.riskLevel)
  }
  if (filters?.expertId && filters.expertId !== 'all') {
    list = list.filter(e => e.expert_id === filters.expertId)
  }
  if (filters?.workGroup && filters.workGroup !== 'all') {
    list = list.filter(e => e.work_group === filters.workGroup)
  }

  return list.sort((a, b) => a.ai_score - b.ai_score)
}

export async function getEnterpriseStats(): Promise<{
  total: number
  byRiskLevel: Record<string, number>
  byWorkGroup: Record<string, number>
}> {
  const db = await getDB()
  const total = db.enterprises.length

  const byRiskLevel: Record<string, number> = {}
  const byWorkGroup: Record<string, number> = {}

  db.enterprises.forEach(e => {
    byRiskLevel[e.risk_level] = (byRiskLevel[e.risk_level] || 0) + 1
    byWorkGroup[e.work_group] = (byWorkGroup[e.work_group] || 0) + 1
  })

  return { total, byRiskLevel, byWorkGroup }
}

export async function getHazardStats(filters?: {
  riskLevel?: string
  expertId?: string
}): Promise<{
  total: number
  pending: number
  major: number
  byStatus: Record<string, number>
  byLevel: Record<string, number>
}> {
  const db = await getDB()
  let hazards = [...db.hazards]

  if (filters?.riskLevel && filters.riskLevel !== 'all') {
    const entIds = new Set(db.enterprises.filter(e => e.risk_level === filters.riskLevel).map(e => e.id))
    hazards = hazards.filter(h => entIds.has(h.enterprise_id))
  }
  if (filters?.expertId && filters.expertId !== 'all') {
    hazards = hazards.filter(h => h.expert_id === filters.expertId)
  }

  const total = hazards.length
  const pending = hazards.filter(h => h.status === 'pending').length
  const major = hazards.filter(h => h.level === 'major').length

  const byStatus: Record<string, number> = {}
  const byLevel: Record<string, number> = {}
  hazards.forEach(h => {
    byStatus[h.status] = (byStatus[h.status] || 0) + 1
    byLevel[h.level] = (byLevel[h.level] || 0) + 1
  })

  return { total, pending, major, byStatus, byLevel }
}

export async function getExperts(): Promise<Expert[]> {
  const db = await getDB()
  return [...db.experts].sort((a, b) => a.grade.localeCompare(b.grade) || a.name.localeCompare(b.name))
}

export async function getExpertTaskStats(expertId?: string): Promise<{
  total: number
  pending: number
  completed: number
  completionRate: number
}> {
  const db = await getDB()
  let tasks = [...db.tasks]

  if (expertId && expertId !== 'all') {
    tasks = tasks.filter(t => t.expert_id === expertId)
  }

  const total = tasks.length
  const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  const completed = tasks.filter(t => t.status === 'completed').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, pending, completed, completionRate }
}

export async function getWeeklyAggregation(expertId?: string): Promise<{
  weeks: string[]
  expertWorkStats: Record<string, { week: string; workType: string; total: number }[]>
  overallTrend: { week: string; total: number }[]
}> {
  const db = await getDB()
  let logs = [...db.workLogs]

  if (expertId && expertId !== 'all') {
    logs = logs.filter(l => l.expert_id === expertId)
  }

  const weeksSet = new Set<string>()
  const weekTotals: Record<string, number> = {}
  const expertWorkStats: Record<string, { week: string; workType: string; total: number }[]> = {}

  // 先按 week+workType 聚合
  const aggMap: Record<string, number> = {}
  logs.forEach(l => {
    weeksSet.add(l.week_key)
    const key = `${l.week_key}::${l.work_type}`
    aggMap[key] = (aggMap[key] || 0) + l.count
    weekTotals[l.week_key] = (weekTotals[l.week_key] || 0) + l.count
  })

  Object.entries(aggMap).forEach(([key, total]) => {
    const [week, workType] = key.split('::')
    if (!expertWorkStats[week]) expertWorkStats[week] = []
    expertWorkStats[week].push({ week, workType, total })
  })

  const weeks = Array.from(weeksSet).sort()
  const overallTrend = weeks.map(w => ({ week: w, total: weekTotals[w] || 0 }))

  return { weeks, expertWorkStats, overallTrend }
}

export async function getWeeklyByExpert(): Promise<{
  weeks: string[]
  experts: { id: string; name: string; weeklyData: number[] }[]
}> {
  const db = await getDB()

  const weeksSet = new Set<string>()
  const expertWeekMap: Record<string, Record<string, number>> = {}
  const expertNames: Record<string, string> = {}

  db.experts.forEach(e => { expertNames[e.id] = e.name })

  db.workLogs.forEach(l => {
    weeksSet.add(l.week_key)
    if (!expertWeekMap[l.expert_id]) expertWeekMap[l.expert_id] = {}
    expertWeekMap[l.expert_id][l.week_key] = (expertWeekMap[l.expert_id][l.week_key] || 0) + l.count
  })

  const weeks = Array.from(weeksSet).sort()

  const experts = Object.entries(expertWeekMap).map(([id, weekData]) => ({
    id,
    name: expertNames[id] || id,
    weeklyData: weeks.map(w => weekData[w] || 0),
  }))

  return { weeks, experts }
}

// ==================== 10维度接口 ====================

export async function getEnterpriseDimensions(enterpriseId?: string): Promise<Record<string, any>> {
  const db = await getDB()

  let dims = [...db.dimensions]
  if (enterpriseId) {
    dims = dims.filter(d => d.enterprise_id === enterpriseId)
  }

  const map: Record<string, Record<string, any>> = {}
  dims.forEach(d => {
    if (!map[d.enterprise_id]) map[d.enterprise_id] = {}
    let val: any = d.dimension_value
    if (val === 'true') val = true
    else if (val === 'false') val = false
    else if (!isNaN(Number(val))) val = Number(val)
    map[d.enterprise_id][d.dimension_name] = val
  })

  return enterpriseId ? (map[enterpriseId] || {}) : map
}

export async function getDimensionStats(): Promise<{
  dimensionDefinitions: typeof ENTERPRISE_DIMENSIONS
  enterpriseStats: {
    total: number
    withData: number
    completionRates: Record<string, number>
    averages: Record<string, number>
  }
}> {
  const db = await getDB()

  const total = db.enterprises.length
  const withData = new Set(db.dimensions.map(d => d.enterprise_id)).size

  const completionRates: Record<string, number> = {}
  const averages: Record<string, number> = {}

  ENTERPRISE_DIMENSIONS.forEach(dim => {
    const related = db.dimensions.filter(d => d.dimension_name === dim.name)
    if (dim.type === 'boolean') {
      const completed = related.filter(d => d.dimension_value === 'true').length
      completionRates[dim.name] = related.length > 0 ? Math.round((completed / related.length) * 100) : 0
    } else {
      const nums = related.map(d => Number(d.dimension_value)).filter(n => !isNaN(n))
      const avg = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      averages[dim.name] = Math.round(avg * 10) / 10
    }
  })

  return {
    dimensionDefinitions: ENTERPRISE_DIMENSIONS,
    enterpriseStats: { total, withData, completionRates, averages },
  }
}

export async function getEnterprisesWithDimensions(filters?: {
  riskLevel?: string
  expertId?: string
  workGroup?: string
  dimensionFilters?: {
    name: string
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte'
    value: boolean | number
  }[]
}): Promise<Enterprise[]> {
  const db = await getDB()

  // 构建维度映射：enterpriseId -> { 维度名: 值 }
  const dimMap: Record<string, Record<string, any>> = {}
  db.dimensions.forEach(d => {
    if (!dimMap[d.enterprise_id]) dimMap[d.enterprise_id] = {}
    let val: any = d.dimension_value
    if (val === 'true') val = true
    else if (val === 'false') val = false
    else if (!isNaN(Number(val))) val = Number(val)
    dimMap[d.enterprise_id][d.dimension_name] = val
  })

  // 把10维度直接挂到企业对象顶层，方便列表展示
  let list = db.enterprises.map(e => ({
    ...e,
    ...(dimMap[e.id] || {}),
  }))

  // 基础筛选
  if (filters?.riskLevel && filters.riskLevel !== 'all') {
    list = list.filter(e => e.risk_level === filters.riskLevel)
  }
  if (filters?.expertId && filters.expertId !== 'all') {
    list = list.filter(e => e.expert_id === filters.expertId)
  }
  if (filters?.workGroup && filters.workGroup !== 'all') {
    list = list.filter(e => e.work_group === filters.workGroup)
  }

  // 维度筛选（10维度已挂到企业对象顶层）
  if (filters?.dimensionFilters?.length) {
    list = list.filter(e => {
      return filters.dimensionFilters!.every(f => {
        const v = (e as any)[f.name]
        if (v === undefined) return false
        switch (f.operator) {
          case 'eq': return v === f.value
          case 'gt': return typeof v === 'number' && v > (f.value as number)
          case 'lt': return typeof v === 'number' && v < (f.value as number)
          case 'gte': return typeof v === 'number' && v >= (f.value as number)
          case 'lte': return typeof v === 'number' && v <= (f.value as number)
          default: return true
        }
      })
    })
  }

  return list.sort((a, b) => a.ai_score - b.ai_score)
}
