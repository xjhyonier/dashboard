// ==================== 站长指挥中心 Mock 数据 ====================

// ---------- 七维度治理效果 ----------

export interface DimensionScore {
  name: string
  score: number          // 当月辖区均分 0-100
  prevScore: number      // 上月均分，用于计算环比
  trend: 'up' | 'down' | 'stable'
  trendDelta: number     // 环比 delta（绝对值）
  // 钻取：各分值段企业数量
  distribution: {
    label: string        // '优秀(≥80)' | '良好(60-79)' | '关注(30-59)' | '危险(<30)'
    count: number
    color: string
  }[]
  // 钻取：得分最低 3 家企业
  bottomEnterprises: {
    name: string
    score: number
    change: number       // 较上月变化
  }[]
  // 历史 6 个月趋势
  history: { month: string; score: number }[]
}

export const dimensionScores: DimensionScore[] = [
  {
    name: '事故管理', score: 85, prevScore: 81, trend: 'up', trendDelta: 4,
    distribution: [
      { label: '优秀(≥80)', count: 312, color: '#16a34a' },
      { label: '良好(60-79)', count: 120, color: '#4f46e5' },
      { label: '关注(30-59)', count: 45, color: '#d97706' },
      { label: '危险(<30)', count: 23, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '天成建材有限公司', score: 10, change: -5 },
      { name: '鑫达化工有限公司', score: 15, change: -8 },
      { name: '鑫源金属制品有限公司', score: 18, change: -3 },
    ],
    history: [
      { month: '10月', score: 79 }, { month: '11月', score: 80 }, { month: '12月', score: 80 },
      { month: '1月', score: 81 }, { month: '2月', score: 82 }, { month: '3月', score: 85 },
    ],
  },
  {
    name: '双重预防', score: 78, prevScore: 75, trend: 'up', trendDelta: 3,
    distribution: [
      { label: '优秀(≥80)', count: 264, color: '#16a34a' },
      { label: '良好(60-79)', count: 155, color: '#4f46e5' },
      { label: '关注(30-59)', count: 62, color: '#d97706' },
      { label: '危险(<30)', count: 19, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '天成建材有限公司', score: 15, change: -2 },
      { name: '鑫达化工有限公司', score: 20, change: -5 },
      { name: '永安制药有限公司', score: 28, change: 0 },
    ],
    history: [
      { month: '10月', score: 70 }, { month: '11月', score: 71 }, { month: '12月', score: 72 },
      { month: '1月', score: 73 }, { month: '2月', score: 75 }, { month: '3月', score: 78 },
    ],
  },
  {
    name: '应急管理', score: 82, prevScore: 82, trend: 'stable', trendDelta: 0,
    distribution: [
      { label: '优秀(≥80)', count: 288, color: '#16a34a' },
      { label: '良好(60-79)', count: 140, color: '#4f46e5' },
      { label: '关注(30-59)', count: 52, color: '#d97706' },
      { label: '危险(<30)', count: 20, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '华通物流有限公司', score: 25, change: -10 },
      { name: '天成建材有限公司', score: 20, change: 0 },
      { name: '鑫达化工有限公司', score: 30, change: 2 },
    ],
    history: [
      { month: '10月', score: 81 }, { month: '11月', score: 82 }, { month: '12月', score: 82 },
      { month: '1月', score: 82 }, { month: '2月', score: 82 }, { month: '3月', score: 82 },
    ],
  },
  {
    name: '机构职责', score: 90, prevScore: 88, trend: 'up', trendDelta: 2,
    distribution: [
      { label: '优秀(≥80)', count: 380, color: '#16a34a' },
      { label: '良好(60-79)', count: 80, color: '#4f46e5' },
      { label: '关注(30-59)', count: 30, color: '#d97706' },
      { label: '危险(<30)', count: 10, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '宏基机械制造有限公司', score: 40, change: 0 },
      { name: '万通木业有限公司', score: 45, change: 5 },
      { name: '恒盛食品加工厂', score: 50, change: -2 },
    ],
    history: [
      { month: '10月', score: 85 }, { month: '11月', score: 86 }, { month: '12月', score: 87 },
      { month: '1月', score: 87 }, { month: '2月', score: 88 }, { month: '3月', score: 90 },
    ],
  },
  {
    name: '教育培训', score: 75, prevScore: 78, trend: 'down', trendDelta: 3,
    distribution: [
      { label: '优秀(≥80)', count: 245, color: '#16a34a' },
      { label: '良好(60-79)', count: 178, color: '#4f46e5' },
      { label: '关注(30-59)', count: 58, color: '#d97706' },
      { label: '危险(<30)', count: 19, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '恒盛食品加工厂', score: 30, change: -8 },
      { name: '万通木业有限公司', score: 35, change: -5 },
      { name: '宏基机械制造有限公司', score: 40, change: -3 },
    ],
    history: [
      { month: '10月', score: 80 }, { month: '11月', score: 80 }, { month: '12月', score: 79 },
      { month: '1月', score: 79 }, { month: '2月', score: 78 }, { month: '3月', score: 75 },
    ],
  },
  {
    name: '安全投入', score: 88, prevScore: 85, trend: 'up', trendDelta: 3,
    distribution: [
      { label: '优秀(≥80)', count: 340, color: '#16a34a' },
      { label: '良好(60-79)', count: 110, color: '#4f46e5' },
      { label: '关注(30-59)', count: 35, color: '#d97706' },
      { label: '危险(<30)', count: 15, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '永安制药有限公司', score: 35, change: -5 },
      { name: '宏基机械制造有限公司', score: 50, change: 2 },
      { name: '天成建材有限公司', score: 25, change: 0 },
    ],
    history: [
      { month: '10月', score: 82 }, { month: '11月', score: 83 }, { month: '12月', score: 84 },
      { month: '1月', score: 84 }, { month: '2月', score: 85 }, { month: '3月', score: 88 },
    ],
  },
  {
    name: '安全制度', score: 81, prevScore: 81, trend: 'stable', trendDelta: 0,
    distribution: [
      { label: '优秀(≥80)', count: 295, color: '#16a34a' },
      { label: '良好(60-79)', count: 130, color: '#4f46e5' },
      { label: '关注(30-59)', count: 48, color: '#d97706' },
      { label: '危险(<30)', count: 27, color: '#dc2626' },
    ],
    bottomEnterprises: [
      { name: '恒盛食品加工厂', score: 40, change: -2 },
      { name: '鑫达化工有限公司', score: 45, change: 0 },
      { name: '万通木业有限公司', score: 50, change: 3 },
    ],
    history: [
      { month: '10月', score: 80 }, { month: '11月', score: 81 }, { month: '12月', score: 81 },
      { month: '1月', score: 81 }, { month: '2月', score: 81 }, { month: '3月', score: 81 },
    ],
  },
]

// ---------- 转化路径漏斗 ----------

export interface FunnelStage {
  stage: string
  count: number
  rate?: number      // 该阶段 / 第一阶段的比率，用于视觉漏斗宽度
  dropCount?: number // 流失数量（当前阶段 - 下一阶段）
  color: string
}

const buildFunnel = (stages: { stage: string; count: number; color: string }[]): FunnelStage[] => {
  const total = stages[0].count
  return stages.map((s, i) => ({
    ...s,
    rate: Math.round((s.count / total) * 100),
    dropCount: i < stages.length - 1 ? s.count - stages[i + 1].count : 0,
  }))
}

export const teamFunnel: FunnelStage[] = buildFunnel([
  { stage: '发现隐患', count: 500, color: '#4f46e5' },
  { stage: '下发整改', count: 450, color: '#06b6d4' },
  { stage: '整改完成', count: 380, color: '#16a34a' },
  { stage: '复核通过', count: 320, color: '#16a34a' },
  { stage: '完全闭环', count: 300, color: '#16a34a' },
])

// 按专家分组的漏斗，用于对比
export interface ExpertFunnel {
  expertId: string
  expertName: string
  stages: FunnelStage[]
}

export const expertFunnels: ExpertFunnel[] = [
  {
    expertId: 'ep-001', expertName: '今卓',
    stages: buildFunnel([
      { stage: '发现隐患', count: 68, color: '#4f46e5' },
      { stage: '下发整改', count: 65, color: '#06b6d4' },
      { stage: '整改完成', count: 58, color: '#16a34a' },
      { stage: '复核通过', count: 52, color: '#16a34a' },
      { stage: '完全闭环', count: 50, color: '#16a34a' },
    ]),
  },
  {
    expertId: 'ep-002', expertName: '李雷',
    stages: buildFunnel([
      { stage: '发现隐患', count: 55, color: '#4f46e5' },
      { stage: '下发整改', count: 50, color: '#06b6d4' },
      { stage: '整改完成', count: 40, color: '#16a34a' },
      { stage: '复核通过', count: 32, color: '#16a34a' },
      { stage: '完全闭环', count: 28, color: '#16a34a' },
    ]),
  },
  {
    expertId: 'ep-003', expertName: '韩梅梅',
    stages: buildFunnel([
      { stage: '发现隐患', count: 72, color: '#4f46e5' },
      { stage: '下发整改', count: 70, color: '#06b6d4' },
      { stage: '整改完成', count: 65, color: '#16a34a' },
      { stage: '复核通过', count: 60, color: '#16a34a' },
      { stage: '完全闭环', count: 58, color: '#16a34a' },
    ]),
  },
]

// ---------- 专家团队效能 ----------

export interface ExpertMember {
  id: string
  name: string
  avatar: string   // 首字，用于头像渲染
  grade: 'A' | 'B' | 'C'   // A=优秀, B=良好, C=关注
  // 核心指标
  totalTasks: number          // 本月处理任务总数
  avgClosureDays: number      // 平均闭环天数
  closureRate: number         // 隐患一次性复核通过率（%）
  riskAccuracy: number        // 风险评级准确率（%）
  enterpriseCount: number     // 负责企业数
  // 7维度绩效得分（对应 performanceDimensions）
  performanceScore: number    // 综合绩效分 0-100
  performanceDimensions: {
    name: string
    score: number
    weight: number
  }[]
  // 本月/上月对比
  taskGrowth: number         // 较上月任务量变化（%）
  closureRateGrowth: number  // 较上月闭环率变化（百分点）
  // 工作量趋势（近6周）
  weeklyTasks: { week: string; count: number }[]
}

export const expertTeam: ExpertMember[] = [
  {
    id: 'ep-001', name: '今卓', avatar: '今', grade: 'A',
    totalTasks: 125, avgClosureDays: 3.5, closureRate: 96, riskAccuracy: 92, enterpriseCount: 38,
    performanceScore: 88,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 85, weight: 10 },
      { name: '制度数字化完善度', score: 72, weight: 10 },
      { name: '风险识别精准度', score: 92, weight: 10 },
      { name: '检查计划科学度', score: 80, weight: 10 },
      { name: '自查执行活跃度', score: 65, weight: 15 },
      { name: '隐患闭环治理度', score: 78, weight: 15 },
      { name: '远程监管效能度', score: 90, weight: 30 },
    ],
    taskGrowth: 12, closureRateGrowth: 3,
    weeklyTasks: [
      { week: 'W1', count: 18 }, { week: 'W2', count: 22 }, { week: 'W3', count: 20 },
      { week: 'W4', count: 25 }, { week: 'W5', count: 21 }, { week: 'W6', count: 19 },
    ],
  },
  {
    id: 'ep-002', name: '李雷', avatar: '李', grade: 'B',
    totalTasks: 98, avgClosureDays: 4.8, closureRate: 88, riskAccuracy: 85, enterpriseCount: 32,
    performanceScore: 72,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 78, weight: 10 },
      { name: '制度数字化完善度', score: 60, weight: 10 },
      { name: '风险识别精准度', score: 85, weight: 10 },
      { name: '检查计划科学度', score: 70, weight: 10 },
      { name: '自查执行活跃度', score: 55, weight: 15 },
      { name: '隐患闭环治理度', score: 65, weight: 15 },
      { name: '远程监管效能度', score: 78, weight: 30 },
    ],
    taskGrowth: -5, closureRateGrowth: -2,
    weeklyTasks: [
      { week: 'W1', count: 15 }, { week: 'W2', count: 18 }, { week: 'W3', count: 14 },
      { week: 'W4', count: 17 }, { week: 'W5', count: 16 }, { week: 'W6', count: 18 },
    ],
  },
  {
    id: 'ep-003', name: '韩梅梅', avatar: '韩', grade: 'A',
    totalTasks: 142, avgClosureDays: 2.9, closureRate: 98, riskAccuracy: 95, enterpriseCount: 45,
    performanceScore: 94,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 95, weight: 10 },
      { name: '制度数字化完善度', score: 88, weight: 10 },
      { name: '风险识别精准度', score: 95, weight: 10 },
      { name: '检查计划科学度', score: 92, weight: 10 },
      { name: '自查执行活跃度', score: 85, weight: 15 },
      { name: '隐患闭环治理度', score: 90, weight: 15 },
      { name: '远程监管效能度', score: 98, weight: 30 },
    ],
    taskGrowth: 18, closureRateGrowth: 5,
    weeklyTasks: [
      { week: 'W1', count: 22 }, { week: 'W2', count: 25 }, { week: 'W3', count: 24 },
      { week: 'W4', count: 28 }, { week: 'W5', count: 22 }, { week: 'W6', count: 21 },
    ],
  },
  {
    id: 'ep-004', name: '张峰', avatar: '张', grade: 'C',
    totalTasks: 68, avgClosureDays: 7.2, closureRate: 72, riskAccuracy: 78, enterpriseCount: 28,
    performanceScore: 55,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 60, weight: 10 },
      { name: '制度数字化完善度', score: 45, weight: 10 },
      { name: '风险识别精准度', score: 78, weight: 10 },
      { name: '检查计划科学度', score: 50, weight: 10 },
      { name: '自查执行活跃度', score: 38, weight: 15 },
      { name: '隐患闭环治理度', score: 45, weight: 15 },
      { name: '远程监管效能度', score: 58, weight: 30 },
    ],
    taskGrowth: -15, closureRateGrowth: -8,
    weeklyTasks: [
      { week: 'W1', count: 12 }, { week: 'W2', count: 10 }, { week: 'W3', count: 11 },
      { week: 'W4', count: 12 }, { week: 'W5', count: 11 }, { week: 'W6', count: 12 },
    ],
  },
  {
    id: 'ep-005', name: '陈晨', avatar: '陈', grade: 'B',
    totalTasks: 112, avgClosureDays: 4.1, closureRate: 91, riskAccuracy: 88, enterpriseCount: 35,
    performanceScore: 78,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 82, weight: 10 },
      { name: '制度数字化完善度', score: 70, weight: 10 },
      { name: '风险识别精准度', score: 88, weight: 10 },
      { name: '检查计划科学度', score: 75, weight: 10 },
      { name: '自查执行活跃度', score: 62, weight: 15 },
      { name: '隐患闭环治理度', score: 72, weight: 15 },
      { name: '远程监管效能度', score: 82, weight: 30 },
    ],
    taskGrowth: 8, closureRateGrowth: 1,
    weeklyTasks: [
      { week: 'W1', count: 17 }, { week: 'W2', count: 20 }, { week: 'W3', count: 18 },
      { week: 'W4', count: 20 }, { week: 'W5', count: 18 }, { week: 'W6', count: 19 },
    ],
  },
]

// ---------- 工作组数据（用于工作组对比）----------

export interface WorkGroup {
  id: string
  name: string
  area: string
  riskLevel: 'major' | 'high' | 'general' | 'safety'
  leader: string
  deputy: string
  members: string[]
  memberCount: number
  // 考核指标
  totalTasks: number
  completedTasks: number
  completionRate: number
  avgClosureDays: number
  hazardFound: number
  hazardClosed: number
  closureRate: number
  overdueTasks: number
  enterpriseCount: number
  checkedEnterpriseCount: number
  coverageRate: number
  // 环比
  taskGrowth: number
  completionRateGrowth: number
}

export const workGroups: WorkGroup[] = [
  {
    id: 'wg-001', name: '物流片安全组', area: '物流片', riskLevel: 'safety',
    leader: '陈伟', deputy: '张义', members: ['洪涛', '段晓辉', '吴灿刚'], memberCount: 5,
    totalTasks: 156, completedTasks: 142, completionRate: 91.0,
    avgClosureDays: 3.2, hazardFound: 68, hazardClosed: 62, closureRate: 91.2,
    overdueTasks: 3, enterpriseCount: 45, checkedEnterpriseCount: 42, coverageRate: 93.3,
    taskGrowth: 12, completionRateGrowth: 3
  },
  {
    id: 'wg-002', name: '良渚片重大', area: '良渚片', riskLevel: 'major',
    leader: '陈超', deputy: '张义', members: ['郑富彬', '吴灿刚'], memberCount: 4,
    totalTasks: 128, completedTasks: 108, completionRate: 84.4,
    avgClosureDays: 4.8, hazardFound: 52, hazardClosed: 42, closureRate: 80.8,
    overdueTasks: 8, enterpriseCount: 38, checkedEnterpriseCount: 32, coverageRate: 84.2,
    taskGrowth: -5, completionRateGrowth: -2
  },
  {
    id: 'wg-003', name: '良渚片较大', area: '良渚片', riskLevel: 'high',
    leader: '杨宇天', deputy: '张义', members: ['张平水', '吴灿刚'], memberCount: 4,
    totalTasks: 142, completedTasks: 132, completionRate: 93.0,
    avgClosureDays: 2.9, hazardFound: 58, hazardClosed: 55, closureRate: 94.8,
    overdueTasks: 2, enterpriseCount: 42, checkedEnterpriseCount: 40, coverageRate: 95.2,
    taskGrowth: 18, completionRateGrowth: 5
  },
  {
    id: 'wg-004', name: '勾庄片重大', area: '勾庄片', riskLevel: 'major',
    leader: '施伟奇', deputy: '张义', members: ['刘浩鑫', '吴灿刚'], memberCount: 4,
    totalTasks: 98, completedTasks: 82, completionRate: 83.7,
    avgClosureDays: 5.2, hazardFound: 45, hazardClosed: 36, closureRate: 80.0,
    overdueTasks: 6, enterpriseCount: 35, checkedEnterpriseCount: 28, coverageRate: 80.0,
    taskGrowth: -8, completionRateGrowth: -3
  },
  {
    id: 'wg-005', name: '勾庄片较大', area: '勾庄片', riskLevel: 'high',
    leader: '金锋永', deputy: '张义', members: ['李磊', '吴灿刚'], memberCount: 4,
    totalTasks: 135, completedTasks: 125, completionRate: 92.6,
    avgClosureDays: 3.5, hazardFound: 48, hazardClosed: 45, closureRate: 93.8,
    overdueTasks: 4, enterpriseCount: 40, checkedEnterpriseCount: 38, coverageRate: 95.0,
    taskGrowth: 8, completionRateGrowth: 2
  },
]

// ---------- 政府人员数据（组长、副站长）----------

export interface GovernmentMember {
  id: string
  name: string
  role: 'leader' | 'deputy'   // leader=组长, deputy=副站长
  avatar: string               // 首字，用于头像渲染
  // 负责区域
  areas: string[]              // 负责的片区列表
  workGroups: string[]         // 负责的工作组名称列表
  // 履职指标
  enterprisesResponsible: number  // 负责多少家
  enterprisesInspected: number    // 检查多少家
  hazardsFound: number            // 发现隐患
  majorHazards: number            // 重大隐患
  hazardsRectified: number        // 已整改
  rectificationRate: number       // 整改率（%）
  inProgress: number              // 整改中
  overdueUnrectified: number      // 逾期未整改
}

// 从 workGroups 中提取政府人员数据
export const governmentMembers: GovernmentMember[] = [
  {
    id: 'gov-001',
    name: '杨宇天',
    role: 'leader',
    avatar: '杨',
    areas: ['良渚片'],
    workGroups: ['良渚片较大'],
    enterprisesResponsible: 42,
    enterprisesInspected: 40,
    hazardsFound: 58,
    majorHazards: 6,
    hazardsRectified: 55,
    rectificationRate: 94.8,
    inProgress: 2,
    overdueUnrectified: 1,
  },
  {
    id: 'gov-002',
    name: '张义',
    role: 'deputy',
    avatar: '张',
    areas: ['物流片', '良渚片', '勾庄片'],
    workGroups: ['物流片安全组', '良渚片重大', '良渚片较大', '勾庄片重大', '勾庄片较大'],
    enterprisesResponsible: 200,
    enterprisesInspected: 179,
    hazardsFound: 271,
    majorHazards: 28,
    hazardsRectified: 240,
    rectificationRate: 88.6,
    inProgress: 25,
    overdueUnrectified: 6,
  },
  {
    id: 'gov-003',
    name: '陈伟',
    role: 'leader',
    avatar: '陈',
    areas: ['物流片'],
    workGroups: ['物流片安全组'],
    enterprisesResponsible: 45,
    enterprisesInspected: 42,
    hazardsFound: 68,
    majorHazards: 7,
    hazardsRectified: 62,
    rectificationRate: 91.2,
    inProgress: 5,
    overdueUnrectified: 1,
  },
  {
    id: 'gov-004',
    name: '陈超',
    role: 'leader',
    avatar: '陈',
    areas: ['良渚片'],
    workGroups: ['良渚片重大'],
    enterprisesResponsible: 38,
    enterprisesInspected: 32,
    hazardsFound: 52,
    majorHazards: 5,
    hazardsRectified: 42,
    rectificationRate: 80.8,
    inProgress: 8,
    overdueUnrectified: 2,
  },
  {
    id: 'gov-005',
    name: '施伟奇',
    role: 'leader',
    avatar: '施',
    areas: ['勾庄片'],
    workGroups: ['勾庄片重大'],
    enterprisesResponsible: 35,
    enterprisesInspected: 28,
    hazardsFound: 45,
    majorHazards: 4,
    hazardsRectified: 36,
    rectificationRate: 80.0,
    inProgress: 7,
    overdueUnrectified: 2,
  },
  {
    id: 'gov-006',
    name: '金锋永',
    role: 'leader',
    avatar: '金',
    areas: ['勾庄片'],
    workGroups: ['勾庄片较大'],
    enterprisesResponsible: 40,
    enterprisesInspected: 38,
    hazardsFound: 48,
    majorHazards: 4,
    hazardsRectified: 45,
    rectificationRate: 93.8,
    inProgress: 2,
    overdueUnrectified: 1,
  },
]

// ---------- 原有数据（保留，其他区块仍在使用）----------

export const stationChiefMock = {
  // 核心结果指标
  coreResults: [
    {
      title: '重点隐患数量',
      value: '47',
      unit: '项',
      trend: { value: -12.5, label: '较上月', type: 'down' as const },
      description: '重大+较大隐患'
    },
    {
      title: '隐患整改率',
      value: '89.2%',
      unit: '',
      trend: { value: 5.8, label: '较上月', type: 'up' as const },
      description: '已整改/总隐患'
    },
    {
      title: '火灾事故数',
      value: '2',
      unit: '起',
      trend: { value: -66.7, label: '较上月', type: 'down' as const },
      description: '本月火灾事故'
    },
    {
      title: '企业覆盖率',
      value: '78.5%',
      unit: '',
      trend: { value: 8.3, label: '较上月', type: 'up' as const },
      description: '已检查/总企业'
    }
  ],

  hazardTrend: [
    { label: '1月', value: 85 }, { label: '2月', value: 78 }, { label: '3月', value: 72 },
    { label: '4月', value: 68 }, { label: '5月', value: 65 }, { label: '6月', value: 58 },
    { label: '7月', value: 52 }, { label: '8月', value: 48 }, { label: '9月', value: 45 },
    { label: '10月', value: 42 }, { label: '11月', value: 38 }, { label: '12月', value: 47 }
  ],

  hazardDistribution: [
    { label: '重大隐患', value: 12, color: '#dc2626' },
    { label: '较大隐患', value: 35, color: '#d97706' },
    { label: '一般隐患', value: 156, color: '#16a34a' },
    { label: '低风险', value: 289, color: '#06b6d4' }
  ],

  expertManagement: [
    { title: '专家任务完成率', value: '92.3%', trend: { value: 3.2, label: '较上周', type: 'up' as const } },
    { title: '重点企业到访率', value: '85.6%', trend: { value: 7.8, label: '较上周', type: 'up' as const } },
    { title: '重大隐患跟进率', value: '100%',  trend: { value: 0,   label: '保持',   type: 'neutral' as const } },
    { title: '专家推动整改率', value: '76.8%', trend: { value: 4.5, label: '较上周', type: 'up' as const } }
  ],

  expertRanking: [
    { rank: 1, label: '韩梅梅', value: '142件', trend: 'up' as const },
    { rank: 2, label: '今卓',   value: '125件', trend: 'up' as const },
    { rank: 3, label: '陈晨',   value: '112件', trend: 'up' as const },
    { rank: 4, label: '李雷',   value: '98件',  trend: 'down' as const },
    { rank: 5, label: '张峰',   value: '68件',  trend: 'down' as const },
  ],

  expertTaskStatus: [
    { label: '已完成', status: 'success' as const, count: 856 },
    { label: '进行中', status: 'warning' as const, count: 125 },
    { label: '超时未处理', status: 'danger' as const, count: 23 },
    { label: '待分配', status: 'neutral' as const, count: 45 }
  ],

  majorHazardColumns: [
    { key: 'enterprise', label: '企业名称', width: '180px' },
    { key: 'hazard', label: '隐患描述', width: '200px' },
    { key: 'level', label: '等级', width: '80px' },
    { key: 'expert', label: '跟进专家', width: '100px' },
    { key: 'status', label: '状态', width: '100px' },
    { key: 'days', label: '持续天数', width: '80px' }
  ],
  majorHazards: [
    { enterprise: '鑫达化工有限公司',    hazard: '消防通道被原材料堵塞',        level: '重大', expert: '今卓',   status: '整改中',      days: '8' },
    { enterprise: '天成建材有限公司',    hazard: '消防水带老化/灭火器过期',      level: '重大', expert: '今卓',   status: '超期未整改',  days: '5' },
    { enterprise: '鑫源金属制品有限公司', hazard: 'VOCs超标/喷漆车间通风故障',  level: '重大', expert: '李雷',   status: '整改中',      days: '4' },
    { enterprise: '华通物流有限公司',    hazard: '应急预案超期未更新',          level: '较大', expert: '韩梅梅', status: '整改中',      days: '14' },
    { enterprise: '宏基机械制造有限公司', hazard: '冲压车间安全防护罩松动',     level: '一般', expert: '陈晨',   status: '已整改待复核', days: '7' },
  ],

  enterpriseRiskDistribution: [
    { label: '重大风险', value: 8, color: '#dc2626' },
    { label: '较大风险', value: 23, color: '#d97706' },
    { label: '一般风险', value: 156, color: '#16a34a' },
    { label: '低风险', value: 313, color: '#06b6d4' }
  ],

  districtSafetyStatus: [
    { label: '隐患整改逾期', status: 'danger' as const, count: 8 },
    { label: '从不自查企业', status: 'danger' as const, count: 15 },
    { label: '风险评级待核对', status: 'warning' as const, count: 23 },
    { label: '本周正常巡查', status: 'success' as const, count: 310 },
  ],

  // 七大维度治理效果（新版，引用上方详细数据）
  governanceSevenDimensions: dimensionScores,

  // 团队整体转化路径（新版）
  conversionFunnel: teamFunnel,
  expertFunnels,

  // 专家效能（新版）
  expertTeam,

  // 政府人员（组长、副站长）
  governmentMembers,

  // 企业状态路径（对应状态机：已开通→已采集→数据已授权→AI评估→合格/不合格分流）
  enterpriseStatusPath: {
    total: 500,
    nodes: {
      opened:      { label: '已开通',      count: 500, desc: '已注册登录小程序' },
      collected:   { label: '已采集',      count: 420, desc: '完成信息采集表单' },
      authorized:  { label: '数据已授权',  count: 380, desc: '授权一企一档给镇街' },
      qualified:   { label: '合格',        count: 218, desc: 'AI评估7维度均正常' },
      unqualified: { label: '不合格',      count: 162, desc: 'AI评估存在异常项' },
      // 不合格分支
      noTodo:      { label: '无需跟进',    count: 45,  desc: '专家判断无需待办' },
      hasTodo:     { label: '已下发待办',  count: 117, desc: '专家已创建隐患/待办' },
      unread:      { label: '待办未读',    count: 28,  desc: '企业尚未查看待办' },
      inProgress:  { label: '整改中',      count: 52,  desc: '正在整改，期限内' },
      overdue:     { label: '整改逾期',    count: 18,  desc: '超期未完成整改' },
      reviewing:   { label: '专家验收',    count: 19,  desc: '企业提交，等待验收' },
    },
  },

  // 专家工作行为统计（团队累计）
  expertWorkBehavior: [
    {
      id: 'risk_annotated',
      label: '风险标注',
      desc: '完成风险评级核对',
      count: 42,
      unit: '次',
      color: 'blue' as const,
    },
    {
      id: 'hazard_created',
      label: '隐患下发',
      desc: '检查中发现并下发隐患',
      count: 18,
      unit: '次',
      color: 'red' as const,
    },
    {
      id: 'hazard_verified',
      label: '隐患复核',
      desc: '验收企业整改结果',
      count: 56,
      unit: '次',
      color: 'emerald' as const,
    },
    {
      id: 'onsite_inspect',
      label: '现场巡查',
      desc: '到企业现场检查',
      count: 32,
      unit: '次',
      color: 'amber' as const,
    },
    {
      id: 'video_inspect',
      label: '视频巡查',
      desc: '远程视频检查',
      count: 48,
      unit: '次',
      color: 'violet' as const,
    },
    {
      id: 'consult_replied',
      label: '咨询回复',
      desc: '回复企业提问',
      count: 28,
      unit: '次',
      color: 'cyan' as const,
    },
    {
      id: 'ledger_updated',
      label: '台账更新',
      desc: '服务记录写入台账',
      count: 85,
      unit: '次',
      color: 'slate' as const,
    },
    {
      id: 'enterprise_contact',
      label: '企业互动',
      desc: '电话/微信/平台联系',
      count: 124,
      unit: '次',
      color: 'sky' as const,
    },
  ],

  // 较大风险企业名单（对照企业端安全业务活动10维度）
  highRiskEnterprises: [
    {
      id: 'ent_001',
      name: '鑫达化工有限公司',
      riskLevel: '重大风险',
      aiScore: 25,
      status: '整改中',
      // 企业端安全业务活动10维度
      infoCollection: true,              // 1. 信息采集
      riskPointCount: 28,                // 2. 风险点识别
      safetySystemBuilt: true,           // 3. 安全制度建立
      inspectionPlanCount: 2,             // 4. 企业创建的检查任务（按周/月/季）
      inspectionExecutionRate: 85,      // 5. 企业按计划检查
      thirdPartySync: true,              // 6. 第三方平台账号同步
      patrolCount: 12,                   // 7. 安全巡查/随手拍
      trainingCount: 3,                  // 8. 教育培训
      workPermitCount: 5,                // 9. 作业票报备
      // 10. 隐患（分来源）
      hazardSelfCheck: 5,               // 自查自纠隐患
      hazardPlatform: 2,                 // 平台隐患（待办）
      hazardMajor: 2,                    // 重大隐患
    },
    {
      id: 'ent_002',
      name: '天成建材有限公司',
      riskLevel: '重大风险',
      aiScore: 18,
      status: '超期未整改',
      infoCollection: true,
      riskPointCount: 15,
      safetySystemBuilt: false,
      inspectionPlanCount: 1,
      inspectionExecutionRate: 45,
      thirdPartySync: false,
      patrolCount: 3,
      trainingCount: 1,
      workPermitCount: 2,
      hazardSelfCheck: 3,
      hazardPlatform: 1,
      hazardMajor: 3,
    },
    {
      id: 'ent_003',
      name: '鑫源金属制品有限公司',
      riskLevel: '较大风险',
      aiScore: 35,
      status: '整改中',
      infoCollection: true,
      riskPointCount: 22,
      safetySystemBuilt: true,
      inspectionPlanCount: 3,
      inspectionExecutionRate: 92,
      thirdPartySync: true,
      patrolCount: 18,
      trainingCount: 4,
      workPermitCount: 8,
      hazardSelfCheck: 4,
      hazardPlatform: 1,
      hazardMajor: 0,
    },
    {
      id: 'ent_004',
      name: '华通物流有限公司',
      riskLevel: '较大风险',
      aiScore: 42,
      status: '整改中',
      infoCollection: true,
      riskPointCount: 18,
      safetySystemBuilt: true,
      inspectionPlanCount: 2,
      inspectionExecutionRate: 78,
      thirdPartySync: true,
      patrolCount: 9,
      trainingCount: 2,
      workPermitCount: 3,
      hazardSelfCheck: 2,
      hazardPlatform: 1,
      hazardMajor: 0,
    },
    {
      id: 'ent_005',
      name: '永安制药有限公司',
      riskLevel: '较大风险',
      aiScore: 38,
      status: '待下发',
      infoCollection: true,
      riskPointCount: 12,
      safetySystemBuilt: false,
      inspectionPlanCount: 1,
      inspectionExecutionRate: 60,
      thirdPartySync: false,
      patrolCount: 5,
      trainingCount: 1,
      workPermitCount: 1,
      hazardSelfCheck: 2,
      hazardPlatform: 1,
      hazardMajor: 0,
    },
    {
      id: 'ent_006',
      name: '宏基机械制造有限公司',
      riskLevel: '较大风险',
      aiScore: 45,
      status: '已整改待复核',
      infoCollection: true,
      riskPointCount: 20,
      safetySystemBuilt: true,
      inspectionPlanCount: 3,
      inspectionExecutionRate: 95,
      thirdPartySync: true,
      patrolCount: 15,
      trainingCount: 5,
      workPermitCount: 6,
      hazardSelfCheck: 3,
      hazardPlatform: 1,
      hazardThirdParty: 0,
      hazardMajor: 0,
    },
    {
      id: 'ent_007',
      name: '万通木业有限公司',
      riskLevel: '一般风险',
      aiScore: 62,
      status: '正常',
      infoCollection: true,
      riskPointCount: 10,
      safetySystemBuilt: false,
      inspectionPlanCount: 1,
      inspectionExecutionRate: 55,
      thirdPartySync: false,
      patrolCount: 4,
      trainingCount: 1,
      workPermitCount: 1,
      hazardSelfCheck: 1,
      hazardPlatform: 1,
      hazardMajor: 0,
    },
    {
      id: 'ent_008',
      name: '恒盛食品加工厂',
      riskLevel: '一般风险',
      aiScore: 68,
      status: '正常',
      infoCollection: true,
      riskPointCount: 8,
      safetySystemBuilt: true,
      inspectionPlanCount: 2,
      inspectionExecutionRate: 75,
      thirdPartySync: true,
      patrolCount: 6,
      trainingCount: 2,
      workPermitCount: 0,
      hazardSelfCheck: 2,
      hazardPlatform: 0,
      hazardMajor: 0,
    },
    {
      id: 'ent_009',
      name: '永安制药有限公司',
      riskLevel: '较大风险',
      aiScore: 38,
      status: '待下发',
      infoCollection: true,
      riskPointCount: 12,
      safetySystemBuilt: false,
      inspectionPlanCount: 1,
      inspectionExecutionRate: 60,
      thirdPartySync: false,
      patrolCount: 5,
      trainingCount: 1,
      workPermitCount: 1,
      hazardSelfCheck: 2,
      hazardPlatform: 1,
      hazardMajor: 0,
    },
    {
      id: 'ent_010',
      name: '龙腾仓储有限公司',
      riskLevel: '低风险',
      aiScore: 88,
      status: '正常',
      infoCollection: true,
      riskPointCount: 5,
      safetySystemBuilt: true,
      inspectionPlanCount: 2,
      inspectionExecutionRate: 100,
      thirdPartySync: true,
      patrolCount: 20,
      trainingCount: 4,
      workPermitCount: 3,
      hazardSelfCheck: 0,
      hazardPlatform: 0,
      hazardMajor: 0,
    },
  ],
}
