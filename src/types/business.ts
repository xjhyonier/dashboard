// 业务线类型定义
export interface BusinessLine {
  id: string
  name: string
  description: string
  icon?: string
  roles: Role[]
}

// 角色类型定义
export interface Role {
  id: string
  name: string
  title: string
  description: string
  avatar?: string
  goals: string[]          // 角色目标
  keyMetrics: string[]     // 关注的核心指标
  permissions?: string[]   // 权限范围（可选）
}

// 看板配置
export interface DashboardConfig {
  businessId: string
  roleId: string
  pageTitle: string
  pageSubtitle: string
  roleDescription: string  // 角色说明（浮层展示）
  businessContext: string  // 业务背景说明
  sections: DashboardSection[]
}

// 看板区块
export interface DashboardSection {
  id: string
  title: string
  description?: string
  layout: 'grid-4' | 'grid-3' | 'grid-2' | 'full'
  components: ComponentConfig[]
}

// 组件配置
export interface ComponentConfig {
  type: 'kpi' | 'trend' | 'distribution' | 'ranking' | 'status' | 'table'
  title: string
  description?: string
  dataSource: string  // Mock数据路径
  props?: Record<string, any>
}
