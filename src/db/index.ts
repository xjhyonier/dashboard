/**
 * 应急管理数据层 - 企业安全数据管理
 * 
 * 统一导出所有类型、查询接口和数据初始化函数
 */

// ==================== 类型导出 ====================

export * from './types'

// ==================== 数据库实例导出 ====================

export { db, initDatabase, resetDatabase } from './memory-db'

// ==================== 企业相关接口 ====================

import { db } from './memory-db'
import {
  Enterprise,
  EnterpriseDimensions,
  EnterpriseStatePath,
  EnterpriseStats,
  EnterpriseFilters,
} from './types'

export async function getEnterprises(filters?: EnterpriseFilters): Promise<Enterprise[]> {
  return db.getEnterprises(filters)
}

export async function getEnterpriseById(id: string): Promise<Enterprise | undefined> {
  return db.getEnterpriseById(id)
}

export async function getEnterpriseDimensions(enterpriseId: string): Promise<EnterpriseDimensions | undefined> {
  return db.getEnterpriseDimensions(enterpriseId)
}

export async function getEnterpriseStatePath(enterpriseId: string): Promise<EnterpriseStatePath | undefined> {
  return db.getEnterpriseStatePath(enterpriseId)
}

export async function getEnterpriseStats(): Promise<EnterpriseStats> {
  return db.getEnterpriseStats()
}

// ==================== 隐患相关接口 ====================

import {
  Hazard,
  HazardHistory,
  HazardStats,
  HazardFilters,
} from './types'

export async function getHazards(filters?: HazardFilters): Promise<Hazard[]> {
  return db.getHazards(filters)
}

export async function getHazardById(id: string): Promise<Hazard | undefined> {
  return db.getHazardById(id)
}

export async function getHazardStats(filters?: HazardFilters): Promise<HazardStats> {
  return db.getHazardStats(filters)
}

export async function getHazardHistories(hazardId: string): Promise<HazardHistory[]> {
  return db.getHazardHistories(hazardId)
}

// ==================== 风险点相关接口 ====================

import {
  RiskPoint,
  RiskPointControl,
  RiskPointRecord,
} from './types'

export async function getRiskPoints(enterpriseId?: string): Promise<RiskPoint[]> {
  return db.getRiskPoints(enterpriseId)
}

export async function getRiskPointById(id: string): Promise<RiskPoint | undefined> {
  return db.getRiskPointById(id)
}

export async function getRiskPointControls(riskPointId: string): Promise<RiskPointControl[]> {
  return db.getRiskPointControls(riskPointId)
}

export async function getRiskPointRecords(riskPointId?: string): Promise<RiskPointRecord[]> {
  return db.getRiskPointRecords(riskPointId)
}

// ==================== 专家相关接口 ====================

import {
  Expert,
  ExpertDimensionScore,
  ExpertPlatformBehavior,
  ExpertWorkload,
  ExpertPerformanceSummary,
  ExpertFilters,
} from './types'

export async function getExperts(filters?: ExpertFilters): Promise<Expert[]> {
  return db.getExperts(filters)
}

export async function getExpertById(id: string): Promise<Expert | undefined> {
  return db.getExpertById(id)
}

export async function getExpertDimensions(expertId: string): Promise<ExpertDimensionScore[]> {
  return db.getExpertDimensions(expertId)
}

export async function getExpertPlatformBehavior(expertId: string): Promise<ExpertPlatformBehavior | undefined> {
  return db.getExpertPlatformBehavior(expertId)
}

export async function getExpertWorkload(expertId: string, month?: string): Promise<ExpertWorkload[]> {
  return db.getExpertWorkload(expertId, month)
}

export async function getExpertPerformanceSummary(expertId: string): Promise<ExpertPerformanceSummary | undefined> {
  return db.getExpertPerformanceSummary(expertId)
}

export async function getExpertsByDimension(
  dimension: 'dim_1' | 'dim_2' | 'dim_3' | 'dim_4' | 'dim_5' | 'dim_6' | 'dim_7'
): Promise<{ expert: Expert; avgScore: number }[]> {
  return db.getExpertsByDimension(dimension)
}

// ==================== 政府人员相关接口 ====================

import {
  GovernmentMember,
  GovernmentMemberFilters,
} from './types'

export async function getGovernmentMembers(filters?: GovernmentMemberFilters): Promise<GovernmentMember[]> {
  return db.getGovernmentMembers(filters)
}

export async function getGovernmentMemberById(id: string): Promise<GovernmentMember | undefined> {
  return db.getGovernmentMemberById(id)
}

export async function getWorkGroupLeaders(workGroupId: string): Promise<GovernmentMember[]> {
  return db.getWorkGroupLeaders(workGroupId)
}

export async function getMemberStats(memberId: string): Promise<{
  responsibleEnterprises: number
  inspections: number
  hazardsFound: number
  majorHazards: number
  closureRate: number
  overdueCount: number
}> {
  return db.getMemberStats(memberId)
}

// ==================== 工作组相关接口 ====================

import {
  WorkGroup,
  WorkGroupStats,
} from './types'

export async function getWorkGroups(): Promise<WorkGroup[]> {
  return db.getWorkGroups()
}

export async function getWorkGroupById(id: string): Promise<WorkGroup | undefined> {
  return db.getWorkGroupById(id)
}

export async function getWorkGroupStats(): Promise<WorkGroupStats[]> {
  return db.getWorkGroupStats()
}

// ==================== 任务相关接口 ====================

import { Task, TaskType } from './types'
export async function getTasks(filters?: { type?: TaskType }): Promise<Task[]> {
  return db.getTasks(filters)
}
export async function getTaskById(id: string): Promise<Task | undefined> {
  return db.getTaskById(id)
}
// ==================== 聚合查询接口 ====================

export async function getWeeklyAggregation(expertId?: string): Promise<{
  weeks: string[]
  expertWorkStats: Record<string, { week: string; workType: string; total: number }[]>
  overallTrend: { week: string; total: number }[]
}> {
  return db.getWeeklyAggregation(expertId)
}

export async function getWeeklyByExpert(): Promise<{
  weeks: string[]
  experts: { id: string; name: string; weeklyData: number[] }[]
}> {
  return db.getWeeklyByExpert()
}

// ==================== 旧版兼容接口 ====================
// 以下接口保持与旧代码的兼容性

export async function getDb() {
  return db
}

// 旧版兼容：企业带维度数据
export async function getEnterprisesWithDimensions(filters?: EnterpriseFilters): Promise<Enterprise[]> {
  const enterprises = await db.getEnterprises(filters)
  const dimensionMap = new Map<string, EnterpriseDimensions>()
  
  for (const ent of enterprises) {
    const dims = await db.getEnterpriseDimensions(ent.id)
    if (dims) {
      dimensionMap.set(ent.id, dims)
    }
  }

  return enterprises.map(e => {
    const dims = dimensionMap.get(e.id)
    if (dims) {
      return {
        ...e,
        info_collection: dims.info_collected,
        data_authorized: dims.data_authorized,
        risk_point_identified: dims.risk_identified,
        safety_org_duty_rate: dims.duty_rate,
        safety_system_rate: dims.system_rate,
        safety_invest_rate: dims.invest_rate,
        inspection_plan_type: dims.plan_type,
        inspection_execution: dims.plan_executed ? 'yes' : 'no',
        third_party_sync: dims.third_party_sync ? 'yes' : 'optional',
        patrol_used: dims.patrol_used ? 'yes' : 'optional',
        training_done: dims.training_done,
        training_has_record: dims.training_record,
        hazard_self_check: dims.hazard_self,
        hazard_platform: dims.hazard_monitor,
        hazard_major: dims.hazard_major,
        hazard_rectify_status: dims.rectify_status,
      }
    }
    return e
  })
}

// 旧版兼容：10维度统计
export async function getDimensionStats(): Promise<{
  dimensionDefinitions: Array<{ name: string; label: string; type: string }>
  enterpriseStats: {
    total: number
    withData: number
    completionRates: Record<string, number>
    averages: Record<string, number>
  }
}> {
  const db = await getDb()
  const dims = await db.getEnterpriseDimensions('')
  
  const ENTERPRISE_DIMENSIONS = [
    { name: 'info_collection', label: '信息采集', type: 'boolean' },
    { name: 'data_authorized', label: '数据授权', type: 'boolean' },
    { name: 'risk_point_identified', label: '风险点识别', type: 'boolean' },
    { name: 'safety_org_duty_rate', label: '机构职责', type: 'number' },
    { name: 'safety_system_rate', label: '安全制度', type: 'number' },
    { name: 'safety_invest_rate', label: '安全投入', type: 'number' },
    { name: 'inspection_plan_type', label: '检查计划', type: 'string' },
    { name: 'inspection_execution', label: '检查执行', type: 'string' },
    { name: 'third_party_sync', label: '第三方同步', type: 'string' },
    { name: 'patrol_used', label: '安全巡查', type: 'string' },
  ]

  return {
    dimensionDefinitions: ENTERPRISE_DIMENSIONS,
    enterpriseStats: {
      total: 200,
      withData: 180,
      completionRates: {
        info_collection: 85,
        data_authorized: 80,
        risk_point_identified: 75,
      },
      averages: {
        safety_org_duty_rate: 72,
        safety_system_rate: 68,
        safety_invest_rate: 65,
      },
    },
  }
}

// 旧版兼容：专家任务统计
export async function getExpertTaskStats(expertId?: string): Promise<{
  total: number
  pending: number
  completed: number
  completionRate: number
}> {
  const hazards = await db.getHazards(expertId ? { expertId } : undefined)
  const total = hazards.length
  const pending = hazards.filter(h => h.status === 'pending').length
  const completed = hazards.filter(h => ['verified', 'closed'].includes(h.status)).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return { total, pending, completed, completionRate }
}

// 导出 EnterpriseDimensions 类型别名（兼容旧代码）
export type EnterpriseDimension = EnterpriseDimensions
