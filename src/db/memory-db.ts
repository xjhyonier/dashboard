/**
 * 应急管理内存数据库
 * 
 * 实现所有查询接口，支持数据筛选、聚合统计
 */

import {
  // 类型
  Enterprise,
  EnterpriseDimensions,
  EnterpriseStatePath,
  Hazard,
  HazardHistory,
  RiskPoint,
  RiskPointControl,
  RiskPointRecord,
  Expert,
  ExpertDimensionScore,
  ExpertPlatformBehavior,
  ExpertWorkload,
  GovernmentMember,
  WorkGroup,
  SpecialInspection,
  EnterpriseStats,
  HazardStats,
  WorkGroupStats,
  ExpertPerformanceSummary,
  // 筛选器
  EnterpriseFilters,
  HazardFilters,
  ExpertFilters,
  GovernmentMemberFilters,
  // 枚举
  HazardStatus,
  HazardLevel,
  HazardSource,
  RiskLevel,
  GovernmentPosition,
} from './types'
import { generateAllData, GeneratedData } from './generator'

// ==================== 数据库实例 ====================

class EmergencyDatabase {
  private data: GeneratedData | null = null
  private initialized = false

  // ==================== 初始化 ====================

  async init(): Promise<void> {
    if (this.initialized) return
    
    this.data = generateAllData()
    this.initialized = true
  }

  private ensureInit(): GeneratedData {
    if (!this.data) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.data
  }

  // ==================== 企业相关 ====================

  async getEnterprises(filters?: EnterpriseFilters): Promise<Enterprise[]> {
    const db = this.ensureInit()
    let list = [...db.enterprises]

    if (filters?.industry) {
      list = list.filter(e => e.industry === filters.industry)
    }
    if (filters?.category) {
      list = list.filter(e => e.category === filters.category)
    }
    if (filters?.riskLevel) {
      list = list.filter(e => e.risk_level === filters.riskLevel)
    }
    if (filters?.workGroup) {
      list = list.filter(e => e.work_group === filters.workGroup)
    }
    if (filters?.expertId) {
      list = list.filter(e => e.expert_id === filters.expertId)
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      list = list.filter(e => 
        e.name.toLowerCase().includes(kw) || 
        e.address.toLowerCase().includes(kw)
      )
    }

    return list
  }

  async getEnterpriseById(id: string): Promise<Enterprise | undefined> {
    const db = this.ensureInit()
    return db.enterprises.find(e => e.id === id)
  }

  async getEnterpriseDimensions(enterpriseId: string): Promise<EnterpriseDimensions | undefined> {
    const db = this.ensureInit()
    return db.enterpriseDimensions.find(d => d.enterprise_id === enterpriseId)
  }

  async getEnterpriseStatePath(enterpriseId: string): Promise<EnterpriseStatePath | undefined> {
    const db = this.ensureInit()
    return db.enterpriseStatePaths.find(p => p.enterprise_id === enterpriseId)
  }

  async getEnterpriseStats(): Promise<EnterpriseStats> {
    const db = this.ensureInit()
    const enterprises = db.enterprises

    const stats: EnterpriseStats = {
      total: enterprises.length,
      byIndustry: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byRiskLevel: {} as Record<string, number>,
      byWorkGroup: {},
    }

    enterprises.forEach(e => {
      stats.byIndustry[e.industry] = (stats.byIndustry[e.industry] || 0) + 1
      stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1
      stats.byRiskLevel[e.risk_level] = (stats.byRiskLevel[e.risk_level] || 0) + 1
      stats.byWorkGroup[e.work_group] = (stats.byWorkGroup[e.work_group] || 0) + 1
    })

    return stats
  }

  // ==================== 隐患相关 ====================

  async getHazards(filters?: HazardFilters): Promise<Hazard[]> {
    const db = this.ensureInit()
    let list = [...db.hazards]

    if (filters?.enterpriseId) {
      list = list.filter(h => h.enterprise_id === filters.enterpriseId)
    }
    if (filters?.riskPointId) {
      list = list.filter(h => h.risk_point_id === filters.riskPointId)
    }
    if (filters?.level) {
      list = list.filter(h => h.level === filters.level)
    }
    if (filters?.status) {
      list = list.filter(h => h.status === filters.status)
    }
    if (filters?.source) {
      list = list.filter(h => h.source === filters.source)
    }
    if (filters?.expertId) {
      list = list.filter(h => h.expert_id === filters.expertId)
    }
    if (filters?.workGroup) {
      const entIds = new Set(
        db.enterprises.filter(e => e.work_group === filters.workGroup).map(e => e.id)
      )
      list = list.filter(h => entIds.has(h.enterprise_id))
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      list = list.filter(h => 
        h.title.toLowerCase().includes(kw) || 
        h.description.toLowerCase().includes(kw)
      )
    }

    // 时间范围筛选
    if (filters?.discoveredAtRange) {
      const { start, end } = filters.discoveredAtRange
      list = list.filter(h => h.discovered_at >= start && h.discovered_at <= end)
    }
    if (filters?.deadlineRange) {
      const { start, end } = filters.deadlineRange
      list = list.filter(h => h.deadline >= start && h.deadline <= end)
    }
    if (filters?.rectifiedAtRange) {
      const { start, end } = filters.rectifiedAtRange
      list = list.filter(h => h.rectified_at && h.rectified_at >= start && h.rectified_at <= end)
    }
    if (filters?.verifiedAtRange) {
      const { start, end } = filters.verifiedAtRange
      list = list.filter(h => h.verified_at && h.verified_at >= start && h.verified_at <= end)
    }
    if (filters?.closedAtRange) {
      const { start, end } = filters.closedAtRange
      list = list.filter(h => h.closed_at && h.closed_at >= start && h.closed_at <= end)
    }

    // 按超期天数筛选
    if (filters?.overdueDays) {
      const today = new Date().toISOString().split('T')[0]
      list = list.filter(h => {
        const overdueDays = Math.floor(
          (new Date(today).getTime() - new Date(h.deadline).getTime()) / 86400000
        )
        if (filters.overdueDays?.min !== undefined && overdueDays < filters.overdueDays.min) return false
        if (filters.overdueDays?.max !== undefined && overdueDays > filters.overdueDays.max) return false
        return true
      })
    }

    return list.sort((a, b) => 
      new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
    )
  }

  async getHazardById(id: string): Promise<Hazard | undefined> {
    const db = this.ensureInit()
    return db.hazards.find(h => h.id === id)
  }

  async getHazardStats(filters?: HazardFilters): Promise<HazardStats> {
    const db = this.ensureInit()
    let hazards = [...db.hazards]

    // 应用筛选条件
    if (filters?.enterpriseId) {
      hazards = hazards.filter(h => h.enterprise_id === filters.enterpriseId)
    }
    if (filters?.workGroup) {
      const entIds = new Set(
        db.enterprises.filter(e => e.work_group === filters.workGroup).map(e => e.id)
      )
      hazards = hazards.filter(h => entIds.has(h.enterprise_id))
    }
    if (filters?.expertId) {
      hazards = hazards.filter(h => h.expert_id === filters.expertId)
    }

    const total = hazards.length
    const pending = hazards.filter(h => h.status === 'pending').length
    const overdue = hazards.filter(h => h.status === 'overdue').length
    const major = hazards.filter(h => h.level === 'major').length
    const high = hazards.filter(h => h.level === 'high').length
    const general = hazards.filter(h => h.level === 'general').length

    const byStatus: Record<HazardStatus, number> = {
      pending: 0,
      rectifying: 0,
      rectified: 0,
      verified: 0,
      rejected: 0,
      overdue: 0,
      closed: 0,
    }
    const byLevel: Record<HazardLevel, number> = {
      major: 0,
      high: 0,
      general: 0,
    }
    const bySource: Record<HazardSource, number> = {
      expert: 0,
      enterprise: 0,
    }

    hazards.forEach(h => {
      byStatus[h.status] = (byStatus[h.status] || 0) + 1
      byLevel[h.level] = (byLevel[h.level] || 0) + 1
      bySource[h.source] = (bySource[h.source] || 0) + 1
    })

    const closedHazards = hazards.filter(h => 
      ['verified', 'closed'].includes(h.status)
    ).length
    const closureRate = total > 0 ? Math.round((closedHazards / total) * 100) : 0
    const overdueRate = total > 0 ? Math.round((overdue / total) * 100) : 0

    return {
      total,
      pending,
      overdue,
      major,
      high,
      general,
      byStatus,
      byLevel,
      bySource,
      closureRate,
      overdueRate,
    }
  }

  async getHazardHistories(hazardId: string): Promise<HazardHistory[]> {
    const db = this.ensureInit()
    return db.hazardHistories
      .filter(h => h.hazard_id === hazardId)
      .sort((a, b) => new Date(a.operated_at).getTime() - new Date(b.operated_at).getTime())
  }

  // ==================== 风险点相关 ====================

  async getRiskPoints(enterpriseId?: string): Promise<RiskPoint[]> {
    const db = this.ensureInit()
    let list = [...db.riskPoints]

    if (enterpriseId) {
      list = list.filter(rp => rp.enterprise_id === enterpriseId)
    }

    return list
  }

  async getRiskPointById(id: string): Promise<RiskPoint | undefined> {
    const db = this.ensureInit()
    return db.riskPoints.find(rp => rp.id === id)
  }

  async getRiskPointControls(riskPointId: string): Promise<RiskPointControl[]> {
    const db = this.ensureInit()
    return db.riskPointControls.filter(rc => rc.risk_point_id === riskPointId)
  }

  async getRiskPointRecords(riskPointId?: string): Promise<RiskPointRecord[]> {
    const db = this.ensureInit()
    let list = [...db.riskPointRecords]

    if (riskPointId) {
      list = list.filter(r => r.risk_point_id === riskPointId)
    }

    return list
  }

  // ==================== 专家相关 ====================

  async getExperts(filters?: ExpertFilters): Promise<Expert[]> {
    const db = this.ensureInit()
    let list = [...db.experts]

    if (filters?.workGroup) {
      list = list.filter(e => e.work_group === filters.workGroup)
    }

    return list.sort((a, b) => {
      // 按等级排序（A > B > C），同等级按名称排序
      if (a.grade !== b.grade) {
        const gradeOrder = { A: 0, B: 1, C: 2 }
        return (gradeOrder[a.grade as keyof typeof gradeOrder] || 3) - (gradeOrder[b.grade as keyof typeof gradeOrder] || 3)
      }
      return a.name.localeCompare(b.name)
    })
  }

  async getExpertById(id: string): Promise<Expert | undefined> {
    const db = this.ensureInit()
    return db.experts.find(e => e.id === id)
  }

  async getExpertDimensions(expertId: string): Promise<ExpertDimensionScore[]> {
    const db = this.ensureInit()
    return db.expertDimensions.filter(d => d.expert_id === expertId)
  }

  async getExpertPlatformBehavior(expertId: string): Promise<ExpertPlatformBehavior | undefined> {
    const db = this.ensureInit()
    return db.expertPlatformBehaviors.find(b => b.expert_id === expertId)
  }

  async getExpertWorkload(expertId: string, month?: string): Promise<ExpertWorkload[]> {
    const db = this.ensureInit()
    let list = db.expertWorkloads.filter(w => w.expert_id === expertId)

    if (month) {
      list = list.filter(w => w.month_key === month)
    }

    return list
  }

  async getExpertPerformanceSummary(expertId: string): Promise<ExpertPerformanceSummary | undefined> {
    const db = this.ensureInit()
    const expert = db.experts.find(e => e.id === expertId)
    if (!expert) return undefined

    const dims = db.expertDimensions.filter(d => d.expert_id === expertId)
    const hazards = db.hazards.filter(h => h.expert_id === expertId)
    const closedHazards = hazards.filter(h => ['verified', 'closed'].includes(h.status))

    // 计算各维度平均分
    const avgScore = (field: keyof ExpertDimensionScore) => {
      if (dims.length === 0) return 0
      const sum = dims.reduce((acc, d) => acc + (d[field] as number), 0)
      return Math.round(sum / dims.length)
    }

    return {
      expert_id: expertId,
      totalEnterprises: expert.enterprise_count,
      totalHazards: hazards.length,
      majorHazards: hazards.filter(h => h.level === 'major').length,
      closureRate: hazards.length > 0 
        ? Math.round((closedHazards.length / hazards.length) * 100) 
        : 100,
      dimensionScores: {
        dim_1: avgScore('dim_1_score'),
        dim_2: avgScore('dim_2_score'),
        dim_3: avgScore('dim_3_score'),
        dim_4: avgScore('dim_4_score'),
        dim_5: avgScore('dim_5_score'),
        dim_6: avgScore('dim_6_score'),
        dim_7: avgScore('dim_7_score'),
      },
    }
  }

  async getExpertsByDimension(
    dimension: 'dim_1' | 'dim_2' | 'dim_3' | 'dim_4' | 'dim_5' | 'dim_6' | 'dim_7'
  ): Promise<{ expert: Expert; avgScore: number }[]> {
    const db = this.ensureInit()
    const scoreMap = new Map<string, number[]>()

    db.expertDimensions.forEach(d => {
      if (!scoreMap.has(d.expert_id)) scoreMap.set(d.expert_id, [])
      scoreMap.get(d.expert_id)!.push(d[dimension])
    })

    const result = db.experts.map(exp => {
      const scores = scoreMap.get(exp.id) || []
      const avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
      return { expert: exp, avgScore }
    })

    return result.sort((a, b) => b.avgScore - a.avgScore)
  }

  // ==================== 政府人员相关 ====================

  async getGovernmentMembers(filters?: GovernmentMemberFilters): Promise<GovernmentMember[]> {
    const db = this.ensureInit()
    let list = [...db.governmentMembers]

    if (filters?.position) {
      list = list.filter(m => m.position === filters.position)
    }
    if (filters?.workGroup) {
      list = list.filter(m => m.work_group === filters.workGroup)
    }

    return list.sort((a, b) => {
      // 按职务排序：组长 > 副站长 > 组员
      const posOrder: Record<GovernmentPosition, number> = {
        '组长': 0,
        '副站长': 1,
        '组员': 2,
      }
      return posOrder[a.position] - posOrder[b.position] || a.name.localeCompare(b.name)
    })
  }

  async getGovernmentMemberById(id: string): Promise<GovernmentMember | undefined> {
    const db = this.ensureInit()
    return db.governmentMembers.find(m => m.id === id)
  }

  async getWorkGroupLeaders(workGroupId: string): Promise<GovernmentMember[]> {
    const db = this.ensureInit()
    return db.governmentMembers
      .filter(m => m.work_group_id === workGroupId && ['组长', '副站长'].includes(m.position))
      .sort((a, b) => a.position.localeCompare(b.position))
  }

  async getMemberStats(memberId: string): Promise<{
    responsibleEnterprises: number
    inspections: number
    hazardsFound: number
    majorHazards: number
    closureRate: number
    overdueCount: number
  }> {
    const db = this.ensureInit()
    const member = db.governmentMembers.find(m => m.id === memberId)
    if (!member) {
      return {
        responsibleEnterprises: 0,
        inspections: 0,
        hazardsFound: 0,
        majorHazards: 0,
        closureRate: 0,
        overdueCount: 0,
      }
    }

    // 获取该工作组负责的企业
    const enterprises = db.enterprises.filter(e => e.work_group_id === member.work_group_id)
    const entIds = new Set(enterprises.map(e => e.id))
    const hazards = db.hazards.filter(h => entIds.has(h.enterprise_id))
    const closedHazards = hazards.filter(h => ['verified', 'closed'].includes(h.status))
    const overdueHazards = hazards.filter(h => h.status === 'overdue')

    return {
      responsibleEnterprises: enterprises.length,
      inspections: Math.floor(enterprises.length * (0.5 + Math.random() * 0.5)),
      hazardsFound: hazards.length,
      majorHazards: hazards.filter(h => h.level === 'major').length,
      closureRate: hazards.length > 0 
        ? Math.round((closedHazards.length / hazards.length) * 100)
        : 100,
      overdueCount: overdueHazards.length,
    }
  }

  // ==================== 工作组相关 ====================

  async getWorkGroups(): Promise<WorkGroup[]> {
    const db = this.ensureInit()
    return [...db.workGroups]
  }

  async getWorkGroupById(id: string): Promise<WorkGroup | undefined> {
    const db = this.ensureInit()
    return db.workGroups.find(wg => wg.id === id)
  }

  async getWorkGroupStats(): Promise<WorkGroupStats[]> {
    const db = this.ensureInit()

    return db.workGroups.map(wg => {
      const enterprises = db.enterprises.filter(e => e.work_group_id === wg.id)
      const entIds = new Set(enterprises.map(e => e.id))
      const hazards = db.hazards.filter(h => entIds.has(h.enterprise_id))
      const closedHazards = hazards.filter(h => ['verified', 'closed'].includes(h.status))

      return {
        work_group_id: wg.id,
        work_group_name: wg.name,
        enterprise_count: enterprises.length,
        hazard_total: hazards.length,
        hazard_major: hazards.filter(h => h.level === 'major').length,
        hazard_pending: hazards.filter(h => h.status === 'pending').length,
        hazard_overdue: hazards.filter(h => h.status === 'overdue').length,
        closure_rate: hazards.length > 0 
          ? Math.round((closedHazards.length / hazards.length) * 100)
          : 100,
      }
    })
  }

  // ==================== 专项检查相关 ====================

  async getSpecialInspections(): Promise<SpecialInspection[]> {
    const db = this.ensureInit()
    return [...db.specialInspections]
  }

  async getSpecialInspectionById(id: string): Promise<SpecialInspection | undefined> {
    const db = this.ensureInit()
    return db.specialInspections.find(si => si.id === id)
  }

  // ==================== 聚合查询 ====================

  async getWeeklyAggregation(expertId?: string): Promise<{
    weeks: string[]
    expertWorkStats: Record<string, { week: string; workType: string; total: number }[]>
    overallTrend: { week: string; total: number }[]
  }> {
    const db = this.ensureInit()
    let workloads = [...db.expertWorkloads]

    if (expertId) {
      workloads = workloads.filter(w => w.expert_id === expertId)
    }

    const weeksSet = new Set<string>()
    const weekTotals: Record<string, number> = {}
    const expertWorkStats: Record<string, { week: string; workType: string; total: number }[]> = {}

    const aggMap: Record<string, number> = {}
    workloads.forEach(w => {
      weeksSet.add(w.week_key)
      const key = `${w.week_key}::${w.work_type}`
      aggMap[key] = (aggMap[key] || 0) + w.count
      weekTotals[w.week_key] = (weekTotals[w.week_key] || 0) + w.count
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

  async getWeeklyByExpert(): Promise<{
    weeks: string[]
    experts: { id: string; name: string; weeklyData: number[] }[]
  }> {
    const db = this.ensureInit()

    const weeksSet = new Set<string>()
    const expertWeekMap: Record<string, Record<string, number>> = {}

    db.expertWorkloads.forEach(w => {
      weeksSet.add(w.week_key)
      if (!expertWeekMap[w.expert_id]) expertWeekMap[w.expert_id] = {}
      expertWeekMap[w.expert_id][w.week_key] = 
        (expertWeekMap[w.expert_id][w.week_key] || 0) + w.count
    })

    const weeks = Array.from(weeksSet).sort()

    const experts = Object.entries(expertWeekMap).map(([id, weekData]) => {
      const expert = db.experts.find(e => e.id === id)
      return {
        id,
        name: expert?.name || id,
        weeklyData: weeks.map(w => weekData[w] || 0),
      }
    })

    return { weeks, experts }
  }
}

// 导出单例
export const db = new EmergencyDatabase()

// 兼容旧代码的导出
export async function initDatabase() {
  await db.init()
}

export async function resetDatabase() {
  db.init() // 重新生成数据
}
