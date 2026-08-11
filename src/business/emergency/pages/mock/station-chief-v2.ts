// ==================== 维度二：组织与人员 Mock 数据 ====================
// V2 版本 - 站长指挥中心 · 人的部分

// ─────────────────────────────────────────────
// 工作组数据
// ─────────────────────────────────────────────
export interface WorkGroup {
  id: string
  name: string
  area: string
  riskLevel: 'general' | 'safety' | 'high' | 'major'
  memberCount: number
  inspectionCount: number
  enterpriseCount: number
  hazardFound: number
  hazardClosed: number
  hazardClosureRate: number
  hazardSerious: number
  overdueUnrectified: number
  inProgress: number
  planCount: number
  planCompleted: number
  planCompletionRate: number
  leader: string
  deputy: string
  // 重大风险任务进度
  majorRisk?: {
    totalTasks: number      // 总任务数（覆盖企业数）
    completedTasks: number   // 已完成
    taskProgress: number    // 任务进度百分比
    cycleStartDate: string  // 周期开始
    cycleEndDate: string    // 周期结束
    timeProgress: number    // 时间进度百分比
    status: 'ahead' | 'on_track' | 'behind' | 'overdue'
  }
}


// ─────────────────────────────────────────────
// 行业隐患分析数据
// ─────────────────────────────────────────────
export interface IndustryHazardAnalysis {
  id: string
  industry: string
  hazardCount: number
  majorHazardCount: number
  rectifiedCount: number
  deadlineCount: number
  topIssues: string[]
  reboundEnterprises: string[]
}

export const industryHazardAnalysis: IndustryHazardAnalysis[] = [
  {
    id: 'ind-001',
    industry: '工业企业',
    hazardCount: 245,
    majorHazardCount: 18,
    rectifiedCount: 198,
    deadlineCount: 12,
    topIssues: ['机械防护缺失', '电气线路老化', '安全标识不足'],
    reboundEnterprises: ['杭州鑫盛化工有限公司', '浙江华达机械制造厂', '余杭宏达建材厂'],
  },
  {
    id: 'ind-002',
    industry: '仓储物流',
    hazardCount: 178,
    majorHazardCount: 12,
    rectifiedCount: 145,
    deadlineCount: 8,
    topIssues: ['消防通道堵塞', '货物堆放超高', '叉车作业违规'],
    reboundEnterprises: ['良渚物流仓储中心', '勾庄货运站', '瓶窑快递分拣中心'],
  },
  {
    id: 'ind-003',
    industry: '小微企业',
    hazardCount: 156,
    majorHazardCount: 8,
    rectifiedCount: 118,
    deadlineCount: 15,
    topIssues: ['灭火器配置不足', '疏散通道不畅', '员工培训缺失'],
    reboundEnterprises: ['余杭小商品加工作坊', '良渚五金加工店', '勾庄服装加工厂'],
  },
  {
    id: 'ind-004',
    industry: '危化使用',
    hazardCount: 89,
    majorHazardCount: 15,
    rectifiedCount: 67,
    deadlineCount: 5,
    topIssues: ['储存不规范', '应急器材不足', '警示标识缺失'],
    reboundEnterprises: ['杭州化工原料公司', '浙江新材料科技', '余杭电镀厂'],
  },
  {
    id: 'ind-005',
    industry: '九小场所',
    hazardCount: 134,
    majorHazardCount: 6,
    rectifiedCount: 102,
    deadlineCount: 11,
    topIssues: ['电线私拉乱接', '安全出口锁闭', '消防器材过期'],
    reboundEnterprises: ['良渚小餐馆', '勾庄理发店', '瓶窑小旅馆'],
  },
  {
    id: 'ind-006',
    industry: '出租房',
    hazardCount: 112,
    majorHazardCount: 9,
    rectifiedCount: 85,
    deadlineCount: 7,
    topIssues: ['电动车违规充电', '疏散通道堵塞', '私拉电线'],
    reboundEnterprises: ['良渚群租房A栋', '勾庄公寓楼', '瓶窑农民房'],
  },
  {
    id: 'ind-007',
    industry: '沿街店铺',
    hazardCount: 98,
    majorHazardCount: 4,
    rectifiedCount: 76,
    deadlineCount: 9,
    topIssues: ['货物占用通道', '电气线路混乱', '住人现象'],
    reboundEnterprises: ['良渚商业街3号', '勾庄市场摊位', '瓶窑临街商铺'],
  },
]

// ─────────────────────────────────────────────
// 专项维度数据
// ─────────────────────────────────────────────
// 专项检查数据
// ─────────────────────────────────────────────
export interface SpecialInspection {
  id: string
  name: string
  totalCount: number
  checkedCount: number
  startDate: string
  endDate: string
  hazardCount: number
  majorHazardCount: number
  rectifiedCount: number
  deadlineCount: number
  topIssues: string[]
  focusGroups: string[]
}

export const specialInspections: SpecialInspection[] = [
  {
    id: 'si-001',
    name: '危化使用企业专项检查',
    totalCount: 112,
    checkedCount: 57,
    startDate: '2026-03-01',
    endDate: '2026-05-01',
    hazardCount: 86,
    majorHazardCount: 12,
    rectifiedCount: 54,
    deadlineCount: 8,
    topIssues: ['储存不规范', '现场管理混乱', '应急器材不足'],
    focusGroups: ['勾庄小微园区', '物流片区', '良渚工业园区'],
  },
  {
    id: 'si-002',
    name: '消防重点单位专项检查',
    totalCount: 85,
    checkedCount: 72,
    startDate: '2026-03-15',
    endDate: '2026-04-15',
    hazardCount: 124,
    majorHazardCount: 8,
    rectifiedCount: 98,
    deadlineCount: 5,
    topIssues: ['消防通道堵塞', '灭火器过期', '疏散标识缺失'],
    focusGroups: ['物流片区', '勾庄片重大', '良渚片较大'],
  },
  {
    id: 'si-003',
    name: '粉尘涉爆企业专项检查',
    totalCount: 38,
    checkedCount: 25,
    startDate: '2026-04-01',
    endDate: '2026-06-01',
    hazardCount: 42,
    majorHazardCount: 5,
    rectifiedCount: 18,
    deadlineCount: 12,
    topIssues: ['除尘系统不规范', '防爆电气缺失', '积尘清理不及时'],
    focusGroups: ['良渚片重大', '勾庄片较大', '物流片区'],
  },
  {
    id: 'si-004',
    name: '有限空间作业专项检查',
    totalCount: 56,
    checkedCount: 48,
    startDate: '2026-02-15',
    endDate: '2026-04-15',
    hazardCount: 67,
    majorHazardCount: 3,
    rectifiedCount: 62,
    deadlineCount: 2,
    topIssues: ['警示标识缺失', '通风设备故障', '应急救援器材不足'],
    focusGroups: ['勾庄片重大', '良渚片较大', '物流片区'],
  },
]

export const workGroups: WorkGroup[] = [
  {
    id: 'team_001',
    name: '勾庄片场所组',
    area: '勾庄片',
    riskLevel: 'general',
    memberCount: 4,
    inspectionCount: 156,
    enterpriseCount: 52,
    hazardFound: 68,
    hazardClosed: 62,
    hazardClosureRate: 91.2,
    hazardSerious: 5,
    overdueUnrectified: 2,
    inProgress: 4,
    planCount: 48,
    planCompleted: 44,
    planCompletionRate: 91.7,
    leader: '毛鹏飞',
    deputy: '余国生',
    majorRisk: {
      totalTasks: 15,
      completedTasks: 8,
      taskProgress: 53.3,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_002',
    name: '物流片场所组',
    area: '物流片',
    riskLevel: 'general',
    memberCount: 4,
    inspectionCount: 142,
    enterpriseCount: 45,
    hazardFound: 58,
    hazardClosed: 55,
    hazardClosureRate: 94.8,
    hazardSerious: 8,
    overdueUnrectified: 1,
    inProgress: 2,
    planCount: 56,
    planCompleted: 52,
    planCompletionRate: 92.9,
    leader: '朱犇',
    deputy: '余国生',
    majorRisk: {
      totalTasks: 12,
      completedTasks: 9,
      taskProgress: 75.0,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_003',
    name: '良渚片场所组',
    area: '良渚片',
    riskLevel: 'general',
    memberCount: 3,
    inspectionCount: 128,
    enterpriseCount: 40,
    hazardFound: 52,
    hazardClosed: 42,
    hazardClosureRate: 80.8,
    hazardSerious: 12,
    overdueUnrectified: 4,
    inProgress: 6,
    planCount: 42,
    planCompleted: 36,
    planCompletionRate: 85.7,
    leader: '包乐年',
    deputy: '余国生',
    majorRisk: {
      totalTasks: 18,
      completedTasks: 8,
      taskProgress: 44.4,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_004',
    name: '物流片安全组',
    area: '物流片',
    riskLevel: 'safety',
    memberCount: 5,
    inspectionCount: 135,
    enterpriseCount: 38,
    hazardFound: 48,
    hazardClosed: 45,
    hazardClosureRate: 93.8,
    hazardSerious: 6,
    overdueUnrectified: 1,
    inProgress: 2,
    planCount: 52,
    planCompleted: 48,
    planCompletionRate: 92.3,
    leader: '洪涛',
    deputy: '余国生',
    majorRisk: {
      totalTasks: 10,
      completedTasks: 6,
      taskProgress: 60.0,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_005',
    name: '良渚片重大',
    area: '良渚片',
    riskLevel: 'major',
    memberCount: 4,
    inspectionCount: 128,
    enterpriseCount: 38,
    hazardFound: 52,
    hazardClosed: 42,
    hazardClosureRate: 80.8,
    hazardSerious: 12,
    overdueUnrectified: 4,
    inProgress: 6,
    planCount: 42,
    planCompleted: 36,
    planCompletionRate: 85.7,
    leader: '陈超',
    deputy: '张义',
    majorRisk: {
      totalTasks: 20,
      completedTasks: 14,
      taskProgress: 70.0,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_006',
    name: '良渚片较大',
    area: '良渚片',
    riskLevel: 'high',
    memberCount: 4,
    inspectionCount: 142,
    enterpriseCount: 42,
    hazardFound: 58,
    hazardClosed: 55,
    hazardClosureRate: 94.8,
    hazardSerious: 8,
    overdueUnrectified: 1,
    inProgress: 2,
    planCount: 56,
    planCompleted: 52,
    planCompletionRate: 92.9,
    leader: '杨宇天',
    deputy: '张义',
    majorRisk: {
      totalTasks: 16,
      completedTasks: 10,
      taskProgress: 62.5,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_007',
    name: '勾庄片重大',
    area: '勾庄片',
    riskLevel: 'major',
    memberCount: 4,
    inspectionCount: 98,
    enterpriseCount: 35,
    hazardFound: 45,
    hazardClosed: 36,
    hazardClosureRate: 80.0,
    hazardSerious: 10,
    overdueUnrectified: 3,
    inProgress: 6,
    planCount: 38,
    planCompleted: 32,
    planCompletionRate: 84.2,
    leader: '施伟奇',
    deputy: '张义',
    majorRisk: {
      totalTasks: 14,
      completedTasks: 9,
      taskProgress: 64.3,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
  {
    id: 'team_008',
    name: '勾庄片较大',
    area: '勾庄片',
    riskLevel: 'high',
    memberCount: 5,
    inspectionCount: 135,
    enterpriseCount: 40,
    hazardFound: 48,
    hazardClosed: 45,
    hazardClosureRate: 93.8,
    hazardSerious: 6,
    overdueUnrectified: 1,
    inProgress: 2,
    planCount: 52,
    planCompleted: 48,
    planCompletionRate: 92.3,
    leader: '陈伟',
    deputy: '张义',
    majorRisk: {
      totalTasks: 12,
      completedTasks: 7,
      taskProgress: 58.3,
      cycleStartDate: '2026-04-01',
      cycleEndDate: '2026-06-30',
      timeProgress: 13.2,
      status: 'ahead',
    },
  },
]

// ─────────────────────────────────────────────
// 政府人员数据（组长、副站长）
// ─────────────────────────────────────────────
export interface GovernmentMember {
  id: string
  memberId: string
  memberName: string
  teamIds: string[]  // 支持一人负责多个工作组
  position: string
  phone: string
  planCount: number
  planCompleted: number
  planCompletionRate: number
  inspectionCount: number
  enterpriseCount: number
  hazardFound: number
  hazardClosed: number
  hazardClosureRate: number
  hazardSerious: number
  inProgress: number
  overdueUnrectified: number
  lastInspectionDate: string
  role: 'leader' | 'deputy'
}

export const governmentMembers: GovernmentMember[] = [
  {
    id: 'gov_001',
    memberId: 'gov_001',
    memberName: '毛鹏飞',
    teamIds: ['team_001'],
    position: '组长',
    phone: '138xxxx0001',
    planCount: 12,
    planCompleted: 10,
    planCompletionRate: 83.3,
    inspectionCount: 28,
    enterpriseCount: 22,
    hazardFound: 15,
    hazardClosed: 12,
    hazardClosureRate: 80.0,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-10',
    role: 'leader',
  },
  {
    id: 'gov_002',
    memberId: 'gov_002',
    memberName: '华燚佳',
    teamIds: ['team_001'],
    position: '组长',
    phone: '138xxxx0002',
    planCount: 10,
    planCompleted: 8,
    planCompletionRate: 80.0,
    inspectionCount: 24,
    enterpriseCount: 18,
    hazardFound: 12,
    hazardClosed: 10,
    hazardClosureRate: 83.3,
    hazardSerious: 1,
    inProgress: 1,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-09',
    role: 'leader',
  },
  {
    id: 'gov_003',
    memberId: 'gov_003',
    memberName: '朱犇',
    teamIds: ['team_002'],
    position: '组长',
    phone: '138xxxx0003',
    planCount: 14,
    planCompleted: 12,
    planCompletionRate: 85.7,
    inspectionCount: 32,
    enterpriseCount: 25,
    hazardFound: 18,
    hazardClosed: 15,
    hazardClosureRate: 83.3,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-11',
    role: 'leader',
  },
  {
    id: 'gov_004',
    memberId: 'gov_004',
    memberName: '刘玉旺',
    teamIds: ['team_002'],
    position: '组长',
    phone: '138xxxx0004',
    planCount: 12,
    planCompleted: 9,
    planCompletionRate: 75.0,
    inspectionCount: 26,
    enterpriseCount: 20,
    hazardFound: 14,
    hazardClosed: 11,
    hazardClosureRate: 78.6,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-08',
    role: 'leader',
  },
  {
    id: 'gov_005',
    memberId: 'gov_005',
    memberName: '包乐年',
    teamIds: ['team_003'],
    position: '组长',
    phone: '138xxxx0005',
    planCount: 11,
    planCompleted: 9,
    planCompletionRate: 81.8,
    inspectionCount: 25,
    enterpriseCount: 19,
    hazardFound: 13,
    hazardClosed: 10,
    hazardClosureRate: 76.9,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-10',
    role: 'leader',
  },
  {
    id: 'gov_006',
    memberId: 'gov_006',
    memberName: '孙中振',
    teamIds: ['team_003'],
    position: '组长',
    phone: '138xxxx0006',
    planCount: 13,
    planCompleted: 10,
    planCompletionRate: 76.9,
    inspectionCount: 29,
    enterpriseCount: 22,
    hazardFound: 16,
    hazardClosed: 13,
    hazardClosureRate: 81.3,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-09',
    role: 'leader',
  },
  {
    id: 'gov_007',
    memberId: 'gov_007',
    memberName: '李旭燕',
    teamIds: ['team_003'],
    position: '组长',
    phone: '138xxxx0007',
    planCount: 10,
    planCompleted: 7,
    planCompletionRate: 70.0,
    inspectionCount: 22,
    enterpriseCount: 16,
    hazardFound: 11,
    hazardClosed: 8,
    hazardClosureRate: 72.7,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-07',
    role: 'leader',
  },
  {
    id: 'gov_008',
    memberId: 'gov_008',
    memberName: '余国生',
    teamIds: ['team_001', 'team_002', 'team_003', 'team_004'],  // 负责多个工作组
    position: '副站长',
    phone: '138xxxx0008',
    planCount: 80,
    planCompleted: 65,
    planCompletionRate: 81.3,
    inspectionCount: 156,
    enterpriseCount: 175,
    hazardFound: 226,
    hazardClosed: 186,
    hazardClosureRate: 82.3,
    hazardSerious: 31,
    inProgress: 15,
    overdueUnrectified: 8,
    lastInspectionDate: '2026-04-11',
    role: 'deputy',
  },
  {
    id: 'gov_009',
    memberId: 'gov_009',
    memberName: '洪涛',
    teamIds: ['team_004'],
    position: '组长',
    phone: '138xxxx0009',
    planCount: 15,
    planCompleted: 12,
    planCompletionRate: 80.0,
    inspectionCount: 35,
    enterpriseCount: 27,
    hazardFound: 18,
    hazardClosed: 15,
    hazardClosureRate: 83.3,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-10',
    role: 'leader',
  },
  {
    id: 'gov_010',
    memberId: 'gov_010',
    memberName: '陈伟',
    teamIds: ['team_008'],
    position: '组长',
    phone: '138xxxx0010',
    planCount: 14,
    planCompleted: 11,
    planCompletionRate: 78.6,
    inspectionCount: 32,
    enterpriseCount: 25,
    hazardFound: 17,
    hazardClosed: 14,
    hazardClosureRate: 82.4,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-09',
    role: 'leader',
  },
  {
    id: 'gov_011',
    memberId: 'gov_011',
    memberName: '沈泽东',
    teamIds: ['team_004'],
    position: '组长',
    phone: '138xxxx0011',
    planCount: 11,
    planCompleted: 8,
    planCompletionRate: 72.7,
    inspectionCount: 24,
    enterpriseCount: 18,
    hazardFound: 13,
    hazardClosed: 10,
    hazardClosureRate: 76.9,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-08',
    role: 'leader',
  },
  {
    id: 'gov_012',
    memberId: 'gov_012',
    memberName: '李宏华',
    teamIds: ['team_004'],
    position: '组长',
    phone: '138xxxx0012',
    planCount: 12,
    planCompleted: 9,
    planCompletionRate: 75.0,
    inspectionCount: 27,
    enterpriseCount: 20,
    hazardFound: 14,
    hazardClosed: 11,
    hazardClosureRate: 78.6,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-07',
    role: 'leader',
  },
  {
    id: 'gov_013',
    memberId: 'gov_013',
    memberName: '陈超',
    teamIds: ['team_005'],
    position: '组长',
    phone: '138xxxx0013',
    planCount: 13,
    planCompleted: 10,
    planCompletionRate: 76.9,
    inspectionCount: 30,
    enterpriseCount: 23,
    hazardFound: 16,
    hazardClosed: 13,
    hazardClosureRate: 81.3,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-10',
    role: 'leader',
  },
  {
    id: 'gov_015',
    memberId: 'gov_015',
    memberName: '杨宇天',
    teamIds: ['team_006'],
    position: '组长',
    phone: '138xxxx0015',
    planCount: 14,
    planCompleted: 11,
    planCompletionRate: 78.6,
    inspectionCount: 33,
    enterpriseCount: 25,
    hazardFound: 18,
    hazardClosed: 15,
    hazardClosureRate: 83.3,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-10',
    role: 'leader',
  },
  {
    id: 'gov_016',
    memberId: 'gov_016',
    memberName: '施伟奇',
    teamIds: ['team_007'],
    position: '组长',
    phone: '138xxxx0016',
    planCount: 12,
    planCompleted: 9,
    planCompletionRate: 75.0,
    inspectionCount: 28,
    enterpriseCount: 21,
    hazardFound: 15,
    hazardClosed: 12,
    hazardClosureRate: 80.0,
    hazardSerious: 3,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-09',
    role: 'leader',
  },
  {
    id: 'gov_017',
    memberId: 'gov_017',
    memberName: '刘浩鑫',
    teamIds: ['team_007'],
    position: '组长',
    phone: '138xxxx0017',
    planCount: 10,
    planCompleted: 7,
    planCompletionRate: 70.0,
    inspectionCount: 22,
    enterpriseCount: 16,
    hazardFound: 11,
    hazardClosed: 8,
    hazardClosureRate: 72.7,
    hazardSerious: 2,
    inProgress: 2,
    overdueUnrectified: 1,
    lastInspectionDate: '2026-04-08',
    role: 'leader',
  },
  {
    id: 'gov_018',
    memberId: 'gov_018',
    memberName: '张义',
    teamIds: ['team_005', 'team_006', 'team_007', 'team_008'],  // 负责多个工作组
    position: '副站长',
    phone: '138xxxx0018',
    planCount: 100,
    planCompleted: 82,
    planCompletionRate: 82.0,
    inspectionCount: 220,
    enterpriseCount: 165,
    hazardFound: 156,
    hazardClosed: 128,
    hazardClosureRate: 82.1,
    hazardSerious: 35,
    inProgress: 18,
    overdueUnrectified: 10,
    lastInspectionDate: '2026-04-12',
    role: 'deputy',
  },
]

// ─────────────────────────────────────────────
// 专家组数据（组员）
// ─────────────────────────────────────────────
export interface ExpertMember {
  expertId: string
  expertName: string
  teamIds: string[]  // 支持一人配合多个工作组
  teamName: string
  taskCount: number
  taskCompleted: number
  taskCompletionRate: number
  hazardFound: number
  hazardSerious: number
  lastTaskDate: string
}

export const experts: ExpertMember[] = [
  {
    expertId: 'exp_001',
    expertName: '小新',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 8,
    taskCompleted: 6,
    taskCompletionRate: 75,
    hazardFound: 15,
    hazardSerious: 3,
    lastTaskDate: '2026-04-08',
  },
  {
    expertId: 'exp_002',
    expertName: '赞赞',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 6,
    taskCompleted: 5,
    taskCompletionRate: 83,
    hazardFound: 12,
    hazardSerious: 2,
    lastTaskDate: '2026-04-09',
  },
  {
    expertId: 'exp_003',
    expertName: '仝运槐',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 7,
    taskCompleted: 5,
    taskCompletionRate: 71,
    hazardFound: 10,
    hazardSerious: 2,
    lastTaskDate: '2026-04-06',
  },
  {
    expertId: 'exp_004',
    expertName: '张杭伟',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 5,
    taskCompleted: 4,
    taskCompletionRate: 80,
    hazardFound: 8,
    hazardSerious: 1,
    lastTaskDate: '2026-04-11',
  },
  {
    expertId: 'exp_005',
    expertName: '王创达',
    teamIds: ['team_004'],
    teamName: '物流片安全组',
    taskCount: 9,
    taskCompleted: 7,
    taskCompletionRate: 78,
    hazardFound: 14,
    hazardSerious: 3,
    lastTaskDate: '2026-04-07',
  },
  {
    expertId: 'exp_006',
    expertName: '梁新舒',
    teamIds: ['team_004'],
    teamName: '物流片安全组',
    taskCount: 6,
    taskCompleted: 5,
    taskCompletionRate: 83,
    hazardFound: 11,
    hazardSerious: 2,
    lastTaskDate: '2026-04-10',
  },
  {
    expertId: 'exp_007',
    expertName: '陈涛',
    teamIds: ['team_004'],
    teamName: '物流片安全组',
    taskCount: 7,
    taskCompleted: 5,
    taskCompletionRate: 71,
    hazardFound: 10,
    hazardSerious: 2,
    lastTaskDate: '2026-04-05',
  },
  {
    expertId: 'exp_008',
    expertName: '段晓辉',
    teamIds: ['team_008'],
    teamName: '勾庄片较大',
    taskCount: 8,
    taskCompleted: 6,
    taskCompletionRate: 75,
    hazardFound: 13,
    hazardSerious: 2,
    lastTaskDate: '2026-04-08',
  },
  {
    expertId: 'exp_009',
    expertName: '郑富彬',
    teamIds: ['team_005'],
    teamName: '良渚片重大',
    taskCount: 6,
    taskCompleted: 5,
    taskCompletionRate: 83,
    hazardFound: 11,
    hazardSerious: 2,
    lastTaskDate: '2026-04-09',
  },
  {
    expertId: 'exp_010',
    expertName: '张平水',
    teamIds: ['team_006'],
    teamName: '良渚片较大',
    taskCount: 5,
    taskCompleted: 4,
    taskCompletionRate: 80,
    hazardFound: 9,
    hazardSerious: 1,
    lastTaskDate: '2026-04-11',
  },
  {
    expertId: 'exp_011',
    expertName: '刘浩鑫',
    teamIds: ['team_007'],
    teamName: '勾庄片重大',
    taskCount: 4,
    taskCompleted: 3,
    taskCompletionRate: 75,
    hazardFound: 7,
    hazardSerious: 1,
    lastTaskDate: '2026-04-06',
  },
  {
    expertId: 'exp_012',
    expertName: '吴灿刚',
    teamIds: ['team_005'],
    teamName: '良渚片重大',
    taskCount: 7,
    taskCompleted: 5,
    taskCompletionRate: 71,
    hazardFound: 11,
    hazardSerious: 2,
    lastTaskDate: '2026-04-07',
  },
]

// ─────────────────────────────────────────────
// （四）安全专家7维度绩效数据
// ─────────────────────────────────────────────
export interface ExpertDimension {
  name: string
  score: number
  weight: number
}

export interface ExpertPlatformBehavior {
  responsible: number      // 负责
  checkCount: number       // 检查
  hazardFound: number      // 发现隐患
  hazardSerious: number    // 重大隐患
  hazardClosed: number     // 已整改
  closureRate: number      // 整改率
  inProgress: number       // 整改中
  overdue: number          // 逾期
  riskMark: number         // 风险标注
  videoTodo: number        // 视频待办
  hazardTodo: number       // 隐患待办
  infoComplete: number     // 信息完善
  imChat: number          // IM咨询
  serviceLog: number      // 服务日志
  onSiteVisit: number     // 现场看
  videoWatch: number      // 视频看
  aiWatch: number         // AI看
  enterpriseFile: number  // 一企一档
}

export interface ExpertFull extends ExpertMember {
  grade: 'A' | 'B' | 'C'
  performanceScore: number
  performanceDimensions: ExpertDimension[]
  platformBehavior: ExpertPlatformBehavior
  taskGrowth: number
  closureRateGrowth: number
}

// ─────────────────────────────────────────────
// 企业状态路径数据
// ─────────────────────────────────────────────

// 企业状态枚举
export type EnterpriseState = 
  | 'all'           // 全部企业
  | 'opened'        // 已开通
  | 'not_opened'    // 未开通
  | 'collected'      // 已采集
  | 'not_collected'  // 未采集
  | 'authorized'     // 数据已授权
  | 'not_authorized' // 未授权
  | 'risk_match'     // 风险标签一致
  | 'risk_mismatch'  // 风险标签不一致
  | 'qualified'      // 合格
  | 'unqualified'    // 不合格
  | 'has_todo'       // 有待办
  | 'no_todo'        // 无待办
  | 'todo_unread'    // 待办未读
  | 'enterprise_read' // 企业已读
  | 'rectifying'     // 整改中
  | 'expert_verify'  // 专家验收
  | 'rectifying_ok'  // 整改未逾期
  | 'rectifying_overdue' // 整改逾期

// 企业数据结构
export interface Enterprise {
  id: string
  name: string
  industry: string
  riskLevel: '重大风险' | '较大风险' | '一般风险' | '低风险'
  area: string
  team: string
  // 状态路径字段
  opened: boolean        // 已开通
  collected: boolean     // 已采集
  authorized: boolean   // 数据已授权
  riskMatch: boolean    // 风险标签一致
  hasTodo: boolean      // 有待办
  todoRead: boolean     // 待办已读
  todoStatus: 'none' | 'unread' | 'rectifying' | 'expert_verify' | 'completed' | 'overdue'
  // 隐患信息
  hazardCount: number
  majorHazardCount: number
  // AI评分
  aiScore: number
  // 负责人
  expertName: string
  lastUpdate: string
}

// 生成企业 Mock 数据
function generateEnterprises(): Enterprise[] {
  const industries = ['工业企业', '仓储物流', '小微企业', '危化使用', '九小场所', '出租房', '沿街店铺']
  const areas = ['良渚片', '勾庄片', '物流片']
  const teams = ['良渚片场所组', '勾庄片场所组', '物流片场所组', '良渚片重大', '良渚片较大', '勾庄片重大', '勾庄片较大', '物流片安全组']
  const riskLevels: Array<'重大风险' | '较大风险' | '一般风险' | '低风险'> = ['重大风险', '较大风险', '一般风险', '低风险']
  const riskWeights = [0.03, 0.1, 0.3, 0.57] // 按比例分配
  const experts = ['小新', '赞赞', '仝运槐', '张杭伟', '王创达', '梁新舒', '陈涛', '段晓辉', '郑富彬', '张平水', '吴灿刚', '刘浩鑫']

  const enterprises: Enterprise[] = []
  const totalCount = 500

  for (let i = 0; i < totalCount; i++) {
    const id = `ent_${String(i + 1).padStart(3, '0')}`
    
    // 按权重随机选择风险等级
    const rand = Math.random()
    let cumWeight = 0
    let riskLevel: '重大风险' | '较大风险' | '一般风险' | '低风险' = '低风险'
    for (let j = 0; j < riskLevels.length; j++) {
      cumWeight += riskWeights[j]
      if (rand < cumWeight) {
        riskLevel = riskLevels[j]
        break
      }
    }

    // 根据风险等级调整各状态概率
    const isHighRisk = riskLevel === '重大风险' || riskLevel === '较大风险'
    
    // 开通状态 (98%)
    const opened = Math.random() < 0.98
    // 采集状态 (85% of opened)
    const collected = opened && Math.random() < 0.85
    // 授权状态 (90% of collected)
    const authorized = collected && Math.random() < 0.90
    // 风险标签一致 (65% of authorized, 高风险企业一致性更低)
    const riskMatch = authorized && (isHighRisk ? Math.random() < 0.55 : Math.random() < 0.70)
    // 有待办 (40% of not risk_match)
    const hasTodo = !riskMatch && Math.random() < 0.40
    // 待办已读 (75% of hasTodo)
    const todoRead = hasTodo && Math.random() < 0.75
    // 待办状态分布
    let todoStatus: Enterprise['todoStatus'] = 'none'
    if (!hasTodo) {
      todoStatus = 'none'
    } else if (!todoRead) {
      todoStatus = Math.random() < 0.7 ? 'unread' : 'rectifying'
    } else {
      const statusRand = Math.random()
      if (statusRand < 0.5) todoStatus = 'rectifying'
      else if (statusRand < 0.7) todoStatus = 'expert_verify'
      else if (statusRand < 0.85) todoStatus = 'completed'
      else todoStatus = 'overdue'
    }

    // 隐患数
    const baseHazard = isHighRisk ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 5)
    const hazardCount = todoStatus === 'none' ? Math.floor(baseHazard * 0.3) : baseHazard
    const majorHazardCount = isHighRisk && Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 1 : 0

    // AI评分
    const baseScore = riskMatch ? 75 + Math.floor(Math.random() * 25) : 25 + Math.floor(Math.random() * 40)

    enterprises.push({
      id,
      name: `${areas[Math.floor(Math.random() * areas.length)]}企业${String(i + 1).padStart(3, '0')}`,
      industry: industries[Math.floor(Math.random() * industries.length)],
      riskLevel,
      area: areas[Math.floor(Math.random() * areas.length)],
      team: teams[Math.floor(Math.random() * teams.length)],
      opened,
      collected,
      authorized,
      riskMatch,
      hasTodo,
      todoRead,
      todoStatus,
      hazardCount,
      majorHazardCount,
      aiScore: Math.min(100, baseScore),
      expertName: experts[Math.floor(Math.random() * experts.length)],
      lastUpdate: `2026-04-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    })
  }

  return enterprises
}

export const enterprises = generateEnterprises()

// 企业状态路径节点配置
export interface StatePathNode {
  id: EnterpriseState
  label: string
  color: 'neutral' | 'green' | 'amber' | 'red' | 'dashed'
  description?: string
}

export const statePathNodes: StatePathNode[] = [
  // 主流程
  { id: 'all', label: '全部企业', color: 'neutral', description: '辖区全部企业' },
  { id: 'opened', label: '已开通', color: 'neutral', description: '已注册登录小程序' },
  { id: 'collected', label: '已采集', color: 'neutral', description: '完成信息采集表单' },
  { id: 'authorized', label: '数据已授权', color: 'neutral', description: '授权一企一档给镇街' },
  { id: 'risk_match', label: '风险标签一致', color: 'green', description: 'AI评估正常' },
  { id: 'qualified', label: '合格', color: 'green', description: '7维度均达标' },
  // 不合格分支
  { id: 'risk_mismatch', label: '风险标签不一致', color: 'amber', description: '存在异常项' },
  { id: 'unqualified', label: '不合格', color: 'amber', description: '需要跟进' },
  { id: 'has_todo', label: '有待办', color: 'amber', description: '已下发待办任务' },
  { id: 'no_todo', label: '无待办', color: 'dashed', description: '无需跟进' },
  // 待办详情
  { id: 'todo_unread', label: '待办未读', color: 'amber', description: '企业尚未查看' },
  { id: 'enterprise_read', label: '企业已读', color: 'amber', description: '已查看待办' },
  { id: 'rectifying', label: '整改中', color: 'amber', description: '正在整改' },
  { id: 'expert_verify', label: '专家验收', color: 'amber', description: '等待专家验收' },
  // 整改结果
  { id: 'rectifying_ok', label: '整改未逾期', color: 'green', description: '正常完成' },
  { id: 'rectifying_overdue', label: '整改逾期', color: 'red', description: '超期未完成' },
  // 断路
  { id: 'not_opened', label: '未开通', color: 'dashed', description: '未注册' },
  { id: 'not_collected', label: '未采集', color: 'dashed', description: '未完成采集' },
  { id: 'not_authorized', label: '未授权', color: 'dashed', description: '未授权数据' },
]

// 统计各状态企业数量
export function getStateCounts(): Record<EnterpriseState, number> {
  const counts: Record<string, number> = {
    all: enterprises.length,
    opened: 0,
    not_opened: 0,
    collected: 0,
    not_collected: 0,
    authorized: 0,
    not_authorized: 0,
    risk_match: 0,
    risk_mismatch: 0,
    qualified: 0,
    unqualified: 0,
    has_todo: 0,
    no_todo: 0,
    todo_unread: 0,
    enterprise_read: 0,
    rectifying: 0,
    expert_verify: 0,
    rectifying_ok: 0,
    rectifying_overdue: 0,
  }

  enterprises.forEach(e => {
    if (e.opened) counts.opened++
    else counts.not_opened++
    
    if (e.collected) counts.collected++
    else counts.not_collected++
    
    if (e.authorized) counts.authorized++
    else counts.not_authorized++
    
    if (e.riskMatch) counts.risk_match++
    else counts.risk_mismatch++
    
    if (e.riskMatch) counts.qualified++
    else counts.unqualified++
    
    if (e.hasTodo) counts.has_todo++
    else counts.no_todo++
    
    if (e.todoStatus === 'unread') counts.todo_unread++
    if (e.todoStatus === 'rectifying' || e.todoStatus === 'expert_verify') {
      counts.enterprise_read++
      if (e.todoStatus === 'rectifying') counts.rectifying++
      else counts.expert_verify++
    }
    if (e.todoStatus === 'completed') counts.rectifying_ok++
    if (e.todoStatus === 'overdue') counts.rectifying_overdue++
  })

  return counts as Record<EnterpriseState, number>
}

// 根据状态筛选企业
export function filterEnterprisesByState(state: EnterpriseState): Enterprise[] {
  switch (state) {
    case 'all': return enterprises
    case 'opened': return enterprises.filter(e => e.opened)
    case 'not_opened': return enterprises.filter(e => !e.opened)
    case 'collected': return enterprises.filter(e => e.collected)
    case 'not_collected': return enterprises.filter(e => !e.collected)
    case 'authorized': return enterprises.filter(e => e.authorized)
    case 'not_authorized': return enterprises.filter(e => !e.authorized)
    case 'risk_match': return enterprises.filter(e => e.riskMatch)
    case 'risk_mismatch': return enterprises.filter(e => !e.riskMatch)
    case 'qualified': return enterprises.filter(e => e.riskMatch)
    case 'unqualified': return enterprises.filter(e => !e.riskMatch)
    case 'has_todo': return enterprises.filter(e => e.hasTodo)
    case 'no_todo': return enterprises.filter(e => !e.hasTodo)
    case 'todo_unread': return enterprises.filter(e => e.todoStatus === 'unread')
    case 'enterprise_read': return enterprises.filter(e => e.todoStatus === 'rectifying' || e.todoStatus === 'expert_verify')
    case 'rectifying': return enterprises.filter(e => e.todoStatus === 'rectifying')
    case 'expert_verify': return enterprises.filter(e => e.todoStatus === 'expert_verify')
    case 'rectifying_ok': return enterprises.filter(e => e.todoStatus === 'completed')
    case 'rectifying_overdue': return enterprises.filter(e => e.todoStatus === 'overdue')
    default: return enterprises
  }
}

export const expertsFull: ExpertFull[] = [
  {
    expertId: 'exp_001',
    expertName: '小新',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 8,
    taskCompleted: 6,
    taskCompletionRate: 75,
    hazardFound: 15,
    hazardSerious: 3,
    lastTaskDate: '2026-04-08',
    grade: 'A',
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
    platformBehavior: {
      responsible: 12,
      checkCount: 45,
      hazardFound: 15,
      hazardSerious: 3,
      hazardClosed: 12,
      closureRate: 80,
      inProgress: 2,
      overdue: 1,
      riskMark: 28,
      videoTodo: 5,
      hazardTodo: 8,
      infoComplete: 92,
      imChat: 36,
      serviceLog: 18,
      onSiteVisit: 12,
      videoWatch: 25,
      aiWatch: 38,
      enterpriseFile: 10,
    },
    taskGrowth: 12,
    closureRateGrowth: 3,
  },
  {
    expertId: 'exp_002',
    expertName: '赞赞',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 6,
    taskCompleted: 5,
    taskCompletionRate: 83,
    hazardFound: 12,
    hazardSerious: 2,
    lastTaskDate: '2026-04-09',
    grade: 'A',
    performanceScore: 82,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 80, weight: 10 },
      { name: '制度数字化完善度', score: 78, weight: 10 },
      { name: '风险识别精准度', score: 85, weight: 10 },
      { name: '检查计划科学度', score: 75, weight: 10 },
      { name: '自查执行活跃度', score: 70, weight: 15 },
      { name: '隐患闭环治理度', score: 82, weight: 15 },
      { name: '远程监管效能度', score: 88, weight: 30 },
    ],
    platformBehavior: {
      responsible: 10,
      checkCount: 38,
      hazardFound: 12,
      hazardSerious: 2,
      hazardClosed: 10,
      closureRate: 83,
      inProgress: 1,
      overdue: 1,
      riskMark: 22,
      videoTodo: 4,
      hazardTodo: 6,
      infoComplete: 88,
      imChat: 28,
      serviceLog: 15,
      onSiteVisit: 10,
      videoWatch: 20,
      aiWatch: 32,
      enterpriseFile: 8,
    },
    taskGrowth: 5,
    closureRateGrowth: 2,
  },
  {
    expertId: 'exp_003',
    expertName: '仝运槐',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 7,
    taskCompleted: 5,
    taskCompletionRate: 71,
    hazardFound: 10,
    hazardSerious: 2,
    lastTaskDate: '2026-04-06',
    grade: 'B',
    performanceScore: 68,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 72, weight: 10 },
      { name: '制度数字化完善度', score: 58, weight: 10 },
      { name: '风险识别精准度', score: 78, weight: 10 },
      { name: '检查计划科学度', score: 65, weight: 10 },
      { name: '自查执行活跃度', score: 50, weight: 15 },
      { name: '隐患闭环治理度', score: 62, weight: 15 },
      { name: '远程监管效能度', score: 72, weight: 30 },
    ],
    platformBehavior: {
      responsible: 8,
      checkCount: 22,
      hazardFound: 10,
      hazardSerious: 2,
      hazardClosed: 7,
      closureRate: 70,
      inProgress: 2,
      overdue: 1,
      riskMark: 18,
      videoTodo: 3,
      hazardTodo: 5,
      infoComplete: 75,
      imChat: 20,
      serviceLog: 10,
      onSiteVisit: 8,
      videoWatch: 15,
      aiWatch: 22,
      enterpriseFile: 6,
    },
    taskGrowth: -8,
    closureRateGrowth: -5,
  },
  {
    expertId: 'exp_004',
    expertName: '张杭伟',
    teamIds: ['team_003'],
    teamName: '良渚片场所组',
    taskCount: 5,
    taskCompleted: 4,
    taskCompletionRate: 80,
    hazardFound: 8,
    hazardSerious: 1,
    lastTaskDate: '2026-04-11',
    grade: 'C',
    performanceScore: 58,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 65, weight: 10 },
      { name: '制度数字化完善度', score: 48, weight: 10 },
      { name: '风险识别精准度', score: 70, weight: 10 },
      { name: '检查计划科学度', score: 55, weight: 10 },
      { name: '自查执行活跃度', score: 45, weight: 15 },
      { name: '隐患闭环治理度', score: 52, weight: 15 },
      { name: '远程监管效能度', score: 62, weight: 30 },
    ],
    platformBehavior: {
      responsible: 6,
      checkCount: 15,
      hazardFound: 8,
      hazardSerious: 1,
      hazardClosed: 5,
      closureRate: 63,
      inProgress: 2,
      overdue: 1,
      riskMark: 12,
      videoTodo: 2,
      hazardTodo: 4,
      infoComplete: 60,
      imChat: 15,
      serviceLog: 8,
      onSiteVisit: 6,
      videoWatch: 10,
      aiWatch: 15,
      enterpriseFile: 4,
    },
    taskGrowth: -15,
    closureRateGrowth: -8,
  },
  {
    expertId: 'exp_005',
    expertName: '王创达',
    teamIds: ['team_004'],
    teamName: '物流片安全组',
    taskCount: 9,
    taskCompleted: 7,
    taskCompletionRate: 78,
    hazardFound: 14,
    hazardSerious: 3,
    lastTaskDate: '2026-04-07',
    grade: 'B',
    performanceScore: 72,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 78, weight: 10 },
      { name: '制度数字化完善度', score: 60, weight: 10 },
      { name: '风险识别精准度', score: 85, weight: 10 },
      { name: '检查计划科学度', score: 70, weight: 10 },
      { name: '自查执行活跃度', score: 55, weight: 15 },
      { name: '隐患闭环治理度', score: 65, weight: 15 },
      { name: '远程监管效能度', score: 75, weight: 30 },
    ],
    platformBehavior: {
      responsible: 10,
      checkCount: 28,
      hazardFound: 14,
      hazardSerious: 3,
      hazardClosed: 10,
      closureRate: 71,
      inProgress: 3,
      overdue: 1,
      riskMark: 25,
      videoTodo: 4,
      hazardTodo: 7,
      infoComplete: 82,
      imChat: 32,
      serviceLog: 14,
      onSiteVisit: 10,
      videoWatch: 18,
      aiWatch: 28,
      enterpriseFile: 8,
    },
    taskGrowth: -3,
    closureRateGrowth: -2,
  },
  {
    expertId: 'exp_006',
    expertName: '梁新舒',
    teamIds: ['team_004'],
    teamName: '物流片安全组',
    taskCount: 6,
    taskCompleted: 5,
    taskCompletionRate: 83,
    hazardFound: 11,
    hazardSerious: 2,
    lastTaskDate: '2026-04-10',
    grade: 'B',
    performanceScore: 70,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 75, weight: 10 },
      { name: '制度数字化完善度', score: 62, weight: 10 },
      { name: '风险识别精准度', score: 82, weight: 10 },
      { name: '检查计划科学度', score: 68, weight: 10 },
      { name: '自查执行活跃度', score: 58, weight: 15 },
      { name: '隐患闭环治理度', score: 66, weight: 15 },
      { name: '远程监管效能度', score: 74, weight: 30 },
    ],
    platformBehavior: {
      responsible: 8,
      checkCount: 25,
      hazardFound: 11,
      hazardSerious: 2,
      hazardClosed: 8,
      closureRate: 73,
      inProgress: 2,
      overdue: 1,
      riskMark: 20,
      videoTodo: 3,
      hazardTodo: 5,
      infoComplete: 78,
      imChat: 25,
      serviceLog: 12,
      onSiteVisit: 8,
      videoWatch: 16,
      aiWatch: 24,
      enterpriseFile: 6,
    },
    taskGrowth: -5,
    closureRateGrowth: -3,
  },
  {
    expertId: 'exp_007',
    expertName: '陈涛',
    teamIds: ['team_004'],
    teamName: '物流片安全组',
    taskCount: 7,
    taskCompleted: 5,
    taskCompletionRate: 71,
    hazardFound: 10,
    hazardSerious: 2,
    lastTaskDate: '2026-04-05',
    grade: 'B',
    performanceScore: 68,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 72, weight: 10 },
      { name: '制度数字化完善度', score: 58, weight: 10 },
      { name: '风险识别精准度', score: 78, weight: 10 },
      { name: '检查计划科学度', score: 65, weight: 10 },
      { name: '自查执行活跃度', score: 52, weight: 15 },
      { name: '隐患闭环治理度', score: 62, weight: 15 },
      { name: '远程监管效能度', score: 72, weight: 30 },
    ],
    platformBehavior: {
      responsible: 7,
      checkCount: 20,
      hazardFound: 10,
      hazardSerious: 2,
      hazardClosed: 6,
      closureRate: 60,
      inProgress: 3,
      overdue: 1,
      riskMark: 16,
      videoTodo: 2,
      hazardTodo: 4,
      infoComplete: 68,
      imChat: 18,
      serviceLog: 9,
      onSiteVisit: 7,
      videoWatch: 12,
      aiWatch: 18,
      enterpriseFile: 5,
    },
    taskGrowth: -10,
    closureRateGrowth: -6,
  },
  {
    expertId: 'exp_008',
    expertName: '段晓辉',
    teamIds: ['team_008'],
    teamName: '勾庄片较大',
    taskCount: 8,
    taskCompleted: 6,
    taskCompletionRate: 75,
    hazardFound: 13,
    hazardSerious: 2,
    lastTaskDate: '2026-04-08',
    grade: 'B',
    performanceScore: 72,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 76, weight: 10 },
      { name: '制度数字化完善度', score: 64, weight: 10 },
      { name: '风险识别精准度', score: 80, weight: 10 },
      { name: '检查计划科学度', score: 70, weight: 10 },
      { name: '自查执行活跃度', score: 58, weight: 15 },
      { name: '隐患闭环治理度', score: 68, weight: 15 },
      { name: '远程监管效能度', score: 76, weight: 30 },
    ],
    platformBehavior: {
      responsible: 9,
      checkCount: 26,
      hazardFound: 13,
      hazardSerious: 2,
      hazardClosed: 9,
      closureRate: 69,
      inProgress: 3,
      overdue: 1,
      riskMark: 22,
      videoTodo: 4,
      hazardTodo: 6,
      infoComplete: 80,
      imChat: 30,
      serviceLog: 13,
      onSiteVisit: 9,
      videoWatch: 17,
      aiWatch: 26,
      enterpriseFile: 7,
    },
    taskGrowth: -2,
    closureRateGrowth: -1,
  },
  {
    expertId: 'exp_009',
    expertName: '郑富彬',
    teamIds: ['team_005'],
    teamName: '良渚片重大',
    taskCount: 6,
    taskCompleted: 5,
    taskCompletionRate: 83,
    hazardFound: 11,
    hazardSerious: 2,
    lastTaskDate: '2026-04-09',
    grade: 'B',
    performanceScore: 74,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 78, weight: 10 },
      { name: '制度数字化完善度', score: 65, weight: 10 },
      { name: '风险识别精准度', score: 82, weight: 10 },
      { name: '检查计划科学度', score: 72, weight: 10 },
      { name: '自查执行活跃度', score: 60, weight: 15 },
      { name: '隐患闭环治理度', score: 70, weight: 15 },
      { name: '远程监管效能度', score: 78, weight: 30 },
    ],
    platformBehavior: {
      responsible: 8,
      checkCount: 30,
      hazardFound: 11,
      hazardSerious: 2,
      hazardClosed: 8,
      closureRate: 73,
      inProgress: 2,
      overdue: 1,
      riskMark: 20,
      videoTodo: 3,
      hazardTodo: 5,
      infoComplete: 85,
      imChat: 28,
      serviceLog: 12,
      onSiteVisit: 8,
      videoWatch: 18,
      aiWatch: 28,
      enterpriseFile: 7,
    },
    taskGrowth: 2,
    closureRateGrowth: 1,
  },
  {
    expertId: 'exp_010',
    expertName: '张平水',
    teamIds: ['team_006'],
    teamName: '良渚片较大',
    taskCount: 5,
    taskCompleted: 4,
    taskCompletionRate: 80,
    hazardFound: 9,
    hazardSerious: 1,
    lastTaskDate: '2026-04-11',
    grade: 'B',
    performanceScore: 70,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 74, weight: 10 },
      { name: '制度数字化完善度', score: 60, weight: 10 },
      { name: '风险识别精准度', score: 78, weight: 10 },
      { name: '检查计划科学度', score: 68, weight: 10 },
      { name: '自查执行活跃度', score: 56, weight: 15 },
      { name: '隐患闭环治理度', score: 66, weight: 15 },
      { name: '远程监管效能度', score: 74, weight: 30 },
    ],
    platformBehavior: {
      responsible: 7,
      checkCount: 22,
      hazardFound: 9,
      hazardSerious: 1,
      hazardClosed: 6,
      closureRate: 67,
      inProgress: 2,
      overdue: 1,
      riskMark: 15,
      videoTodo: 2,
      hazardTodo: 4,
      infoComplete: 72,
      imChat: 20,
      serviceLog: 10,
      onSiteVisit: 7,
      videoWatch: 14,
      aiWatch: 20,
      enterpriseFile: 5,
    },
    taskGrowth: -4,
    closureRateGrowth: -2,
  },
  {
    expertId: 'exp_011',
    expertName: '吴灿刚',
    teamIds: ['team_005'],
    teamName: '良渚片重大',
    taskCount: 7,
    taskCompleted: 5,
    taskCompletionRate: 71,
    hazardFound: 11,
    hazardSerious: 2,
    lastTaskDate: '2026-04-07',
    grade: 'B',
    performanceScore: 66,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 70, weight: 10 },
      { name: '制度数字化完善度', score: 55, weight: 10 },
      { name: '风险识别精准度', score: 76, weight: 10 },
      { name: '检查计划科学度', score: 62, weight: 10 },
      { name: '自查执行活跃度', score: 50, weight: 15 },
      { name: '隐患闭环治理度', score: 60, weight: 15 },
      { name: '远程监管效能度', score: 70, weight: 30 },
    ],
    platformBehavior: {
      responsible: 6,
      checkCount: 18,
      hazardFound: 11,
      hazardSerious: 2,
      hazardClosed: 6,
      closureRate: 55,
      inProgress: 4,
      overdue: 1,
      riskMark: 14,
      videoTodo: 2,
      hazardTodo: 5,
      infoComplete: 65,
      imChat: 16,
      serviceLog: 8,
      onSiteVisit: 6,
      videoWatch: 12,
      aiWatch: 16,
      enterpriseFile: 4,
    },
    taskGrowth: -12,
    closureRateGrowth: -7,
  },
  {
    expertId: 'exp_012',
    expertName: '刘浩鑫',
    teamIds: ['team_007'],
    teamName: '勾庄片重大',
    taskCount: 4,
    taskCompleted: 3,
    taskCompletionRate: 75,
    hazardFound: 7,
    hazardSerious: 1,
    lastTaskDate: '2026-04-06',
    grade: 'C',
    performanceScore: 55,
    performanceDimensions: [
      { name: '企业基础覆盖度', score: 60, weight: 10 },
      { name: '制度数字化完善度', score: 42, weight: 10 },
      { name: '风险识别精准度', score: 65, weight: 10 },
      { name: '检查计划科学度', score: 50, weight: 10 },
      { name: '自查执行活跃度', score: 40, weight: 15 },
      { name: '隐患闭环治理度', score: 48, weight: 15 },
      { name: '远程监管效能度', score: 60, weight: 30 },
    ],
    platformBehavior: {
      responsible: 5,
      checkCount: 12,
      hazardFound: 7,
      hazardSerious: 1,
      hazardClosed: 3,
      closureRate: 43,
      inProgress: 3,
      overdue: 1,
      riskMark: 8,
      videoTodo: 1,
      hazardTodo: 3,
      infoComplete: 52,
      imChat: 10,
      serviceLog: 5,
      onSiteVisit: 5,
      videoWatch: 8,
      aiWatch: 10,
      enterpriseFile: 3,
    },
    taskGrowth: -20,
    closureRateGrowth: -10,
  },
]

// ─────────────────────────────────────────────
// V1 兼容的企业数据（用于企业列表）
// ─────────────────────────────────────────────
export interface Enterprise10D {
  id: string
  name: string
  risk_level: string
  enterprise_type: '生产企业' | '消防场所'
  fire_type?: '九小场所' | '消防重点单位' | '一般单位' | '未知'  // 消防场所子类
  ai_score: number
  work_group: string
  expert_id: string
  // 基础维度
  info_collection?: boolean
  data_authorized?: boolean
  risk_point_identified?: boolean
  // 安全制度3维度
  safety_org_duty_rate?: number
  safety_system_rate?: number
  safety_invest_rate?: number
  // 检查任务
  inspection_plan_type?: 'weekly' | 'monthly' | 'quarterly' | 'none'
  inspection_execution?: 'yes' | 'no' | 'forced'
  // 同步与巡查
  third_party_sync?: 'yes' | 'no' | 'optional'
  patrol_used?: 'yes' | 'no' | 'optional'
  // 教育培训
  training_done?: boolean
  training_has_record?: boolean
  // 作业票与隐患
  work_permit_count?: number
  hazard_self_check?: number
  hazard_platform?: number
  hazard_major?: number
  // 整改进展
  hazard_rectify_status?: 'completed' | 'uncompleted' | 'partial' | 'overdue'
  // 检查与执法
  inspection_count?: number
  hazard_rectified?: number
  enforcement_count?: number
}

// 生成 V1 兼容的企业数据
function generateEnterprises10D(): Enterprise10D[] {
  const industries = ['工业企业', '仓储物流', '小微企业', '危化使用', '九小场所', '出租房', '沿街店铺']
  const areas = ['良渚片', '勾庄片', '物流片']
  const teams = ['良渚片场所组', '勾庄片场所组', '物流片场所组', '良渚片重大', '良渚片较大', '勾庄片重大', '勾庄片较大', '物流片安全组']
  const experts = ['小新', '赞赞', '仝运槐', '张杭伟', '王创达', '梁新舒', '陈涛', '段晓辉', '郑富彬', '张平水', '吴灿刚', '刘浩鑫']
  const riskLevels: Array<{ level: string; weight: number }> = [
    { level: '重大风险', weight: 0.03 },
    { level: '较大风险', weight: 0.1 },
    { level: '一般风险', weight: 0.3 },
    { level: '低风险', weight: 0.57 },
  ]

  const result: Enterprise10D[] = []
  
  for (let i = 0; i < 200; i++) {
    // 按权重选择风险等级
    const rand = Math.random()
    let cumWeight = 0
    let riskLevel = '低风险'
    for (const r of riskLevels) {
      cumWeight += r.weight
      if (rand < cumWeight) {
        riskLevel = r.level
        break
      }
    }

    const isHighRisk = riskLevel === '重大风险' || riskLevel === '较大风险'
    const riskMatch = Math.random() < (isHighRisk ? 0.5 : 0.7)
    
    // 基础字段
    const info_collection = Math.random() < 0.95
    const data_authorized = info_collection && Math.random() < 0.9
    const risk_point_identified = data_authorized && Math.random() < 0.85
    
    // 安全制度
    const safetyBase = isHighRisk ? 60 : 70
    const safety_org_duty_rate = Math.round(safetyBase + Math.random() * 30)
    const safety_system_rate = Math.round(safetyBase + Math.random() * 30)
    const safety_invest_rate = Math.round(safetyBase + Math.random() * 30)
    
    // 检查任务
    const planTypes: Array<'weekly' | 'monthly' | 'quarterly' | 'none'> = ['weekly', 'monthly', 'quarterly', 'none']
    const planWeights = isHighRisk ? [0.4, 0.3, 0.2, 0.1] : [0.2, 0.3, 0.3, 0.2]
    let planType: 'weekly' | 'monthly' | 'quarterly' | 'none' = 'none'
    const planRand = Math.random()
    let cumP = 0
    for (let j = 0; j < planTypes.length; j++) {
      cumP += planWeights[j]
      if (planRand < cumP) {
        planType = planTypes[j]
        break
      }
    }
    
    const executionValues: Array<'yes' | 'no' | 'forced'> = ['yes', 'yes', 'yes', 'no', 'forced']
    const inspection_execution = planType === 'none' ? 'no' : executionValues[Math.floor(Math.random() * executionValues.length)]
    
    // 第三方同步和巡查
    const third_party_sync: 'yes' | 'no' | 'optional' = Math.random() < 0.7 ? 'yes' : Math.random() < 0.5 ? 'no' : 'optional'
    const patrol_used: 'yes' | 'no' | 'optional' = Math.random() < 0.6 ? 'yes' : Math.random() < 0.5 ? 'no' : 'optional'
    
    // 教育培训
    const training_done = Math.random() < 0.75
    const training_has_record = training_done && Math.random() < 0.8
    
    // 作业票
    const work_permit_count = isHighRisk ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3)
    
    // 隐患
    const hazard_self_check = Math.floor(Math.random() * 6)
    const hazard_platform = Math.floor(Math.random() * 4)
    const hazard_major = isHighRisk && Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 1 : 0
    
    // 整改进展
    const rectifyStatuses: Array<'completed' | 'uncompleted' | 'partial' | 'overdue'> = ['completed', 'completed', 'uncompleted', 'partial', 'overdue']
    const hazard_rectify_status = riskMatch ? 'completed' : rectifyStatuses[Math.floor(Math.random() * rectifyStatuses.length)]
    
    // AI 评分
    const ai_score = riskMatch ? Math.round(75 + Math.random() * 25) : Math.round(25 + Math.random() * 40)

    // 企业类型：工业企业/危化使用 -> 生产企业，其他 -> 消防场所
    const industryCategories = ['工业企业', '危化使用', '小微企业', '九小场所', '出租房', '仓储物流', '沿街店铺']
    const industry = industryCategories[Math.floor(Math.random() * industryCategories.length)]
    const enterprise_type: '生产企业' | '消防场所' = (industry === '工业企业' || industry === '危化使用') ? '生产企业' : '消防场所'
    
    // 消防场所细分类型
    const fireTypes: Array<'九小场所' | '消防重点单位' | '一般单位' | '未知'> = ['九小场所', '消防重点单位', '一般单位', '未知']
    const fireTypeWeights = [0.35, 0.25, 0.30, 0.10]  // 九小场所35%, 消防重点25%, 一般单位30%, 未知10%
    let fire_type: '九小场所' | '消防重点单位' | '一般单位' | '未知' = '未知'
    if (enterprise_type === '消防场所') {
      const fireRand = Math.random()
      let cumF = 0
      for (let ft = 0; ft < fireTypes.length; ft++) {
        cumF += fireTypeWeights[ft]
        if (fireRand < cumF) {
          fire_type = fireTypes[ft]
          break
        }
      }
    }

    result.push({
      id: `ent10d_${String(i + 1).padStart(3, '0')}`,
      name: `${areas[Math.floor(Math.random() * areas.length)]}企业${String(i + 1).padStart(3, '0')}`,
      risk_level: riskLevel,
      enterprise_type,
      fire_type: enterprise_type === '消防场所' ? fire_type : undefined,
      ai_score,
      work_group: teams[Math.floor(Math.random() * teams.length)],
      expert_id: `exp_${String(Math.floor(Math.random() * 12) + 1).padStart(3, '0')}`,
      info_collection,
      data_authorized,
      risk_point_identified,
      safety_org_duty_rate,
      safety_system_rate,
      safety_invest_rate,
      inspection_plan_type: planType,
      inspection_execution,
      third_party_sync,
      patrol_used,
      training_done,
      training_has_record,
      work_permit_count,
      hazard_self_check,
      hazard_platform,
      hazard_major,
      hazard_rectify_status,
      inspection_count: Math.floor(Math.random() * 20) + 5,
      hazard_rectified: Math.floor(Math.random() * 10),
      enforcement_count: Math.floor(Math.random() * 3),
    })
  }
  
  return result
}

export const enterprises10D = generateEnterprises10D()

// ─────────────────────────────────────────────
// 隐患记录数据（隐患维度使用）
// ─────────────────────────────────────────────
export type HazardStatus = 'pending' | 'rectifying' | 'rectified' | 'overdue'
export type HazardRiskLevel = 'general' | 'serious' | 'major'

export type HazardSource = 'expert' | 'enterprise'

export interface HazardRecord {
  id: string
  enterpriseName: string
  industry: string
  teamName: string
  hazardDesc: string
  riskLevel: HazardRiskLevel
  recordTime: string       // 发现时间
  rectifyDeadline: string // 整改期限
  rectifyTime?: string    // 整改完成时间
  status: HazardStatus
  source: HazardSource     // 来源：expert=专家提交，enterprise=企业自查自纠
  expertName?: string
}

export const hazardRecords: HazardRecord[] = [
  // 已整改
  { id: 'h001', enterpriseName: '杭州鑫盛化工有限公司', industry: '工业企业', teamName: '勾庄片场所组', hazardDesc: '甲类仓库防爆电气缺失', riskLevel: 'major', recordTime: '2026-03-01', rectifyDeadline: '2026-03-15', rectifyTime: '2026-03-12', status: 'rectified', source: 'expert', expertName: '王建国' },
  { id: 'h002', enterpriseName: '良渚物流仓储中心', industry: '仓储物流', teamName: '物流片场所组', hazardDesc: '消防通道堆放货物', riskLevel: 'general', recordTime: '2026-03-02', rectifyDeadline: '2026-03-10', rectifyTime: '2026-03-09', status: 'rectified', source: 'expert', expertName: '李明' },
  { id: 'h003', enterpriseName: '余杭小商品加工作坊', industry: '小微企业', teamName: '良渚片场所组', hazardDesc: '灭火器配置不足', riskLevel: 'serious', recordTime: '2026-03-03', rectifyDeadline: '2026-03-18', rectifyTime: '2026-03-16', status: 'rectified', source: 'expert', expertName: '张伟' },
  { id: 'h004', enterpriseName: '良渚商业街3号', industry: '沿街店铺', teamName: '良渚片场所组', hazardDesc: '电线私拉乱接', riskLevel: 'serious', recordTime: '2026-03-04', rectifyDeadline: '2026-03-20', rectifyTime: '2026-03-18', status: 'rectified', source: 'enterprise' },
  { id: 'h005', enterpriseName: '勾庄货运站', industry: '仓储物流', teamName: '物流片场所组', hazardDesc: '叉车作业人员无证上岗', riskLevel: 'serious', recordTime: '2026-03-05', rectifyDeadline: '2026-03-12', rectifyTime: '2026-03-11', status: 'rectified', source: 'expert', expertName: '陈刚' },
  { id: 'h006', enterpriseName: '杭州化工原料公司', industry: '危化使用', teamName: '勾庄片场所组', hazardDesc: '危险化学品储存不规范', riskLevel: 'major', recordTime: '2026-03-06', rectifyDeadline: '2026-03-20', rectifyTime: '2026-03-19', status: 'rectified', source: 'expert', expertName: '王建国' },
  { id: 'h007', enterpriseName: '良渚群租房A栋', industry: '出租房', teamName: '良渚片场所组', hazardDesc: '电动车违规充电', riskLevel: 'serious', recordTime: '2026-03-07', rectifyDeadline: '2026-03-14', rectifyTime: '2026-03-13', status: 'rectified', source: 'enterprise' },
  { id: 'h008', enterpriseName: '余杭宏达建材厂', industry: '工业企业', teamName: '勾庄片场所组', hazardDesc: '机械防护装置缺失', riskLevel: 'serious', recordTime: '2026-03-08', rectifyDeadline: '2026-03-22', rectifyTime: '2026-03-20', status: 'rectified', source: 'expert', expertName: '李明' },
  { id: 'h009', enterpriseName: '瓶窑快递分拣中心', industry: '仓储物流', teamName: '瓶窑片场所组', hazardDesc: '货物堆放超高', riskLevel: 'general', recordTime: '2026-03-09', rectifyDeadline: '2026-03-16', rectifyTime: '2026-03-15', status: 'rectified', source: 'enterprise' },
  { id: 'h010', enterpriseName: '勾庄市场摊位', industry: '沿街店铺', teamName: '勾庄片场所组', hazardDesc: '疏散通道堵塞', riskLevel: 'serious', recordTime: '2026-03-10', rectifyDeadline: '2026-03-17', rectifyTime: '2026-03-16', status: 'rectified', source: 'enterprise' },
  // 整改中
  { id: 'h011', enterpriseName: '浙江华达机械制造厂', industry: '工业企业', teamName: '勾庄片场所组', hazardDesc: '铸造车间粉尘浓度超标', riskLevel: 'major', recordTime: '2026-03-12', rectifyDeadline: '2026-04-12', status: 'rectifying', source: 'expert', expertName: '张伟' },
  { id: 'h012', enterpriseName: '勾庄小微园区企业B', industry: '小微企业', teamName: '勾庄片场所组', hazardDesc: '安全标识缺失', riskLevel: 'general', recordTime: '2026-03-14', rectifyDeadline: '2026-04-01', status: 'rectifying', source: 'enterprise' },
  { id: 'h013', enterpriseName: '浙江新材料科技', industry: '危化使用', teamName: '勾庄片场所组', hazardDesc: '应急器材配备不足', riskLevel: 'serious', recordTime: '2026-03-15', rectifyDeadline: '2026-04-10', status: 'rectifying', source: 'expert', expertName: '陈刚' },
  { id: 'h014', enterpriseName: '良渚五金加工店', industry: '小微企业', teamName: '良渚片场所组', hazardDesc: '电气线路老化', riskLevel: 'serious', recordTime: '2026-03-16', rectifyDeadline: '2026-04-05', status: 'rectifying', source: 'expert', expertName: '李明' },
  { id: 'h015', enterpriseName: '瓶窑小旅馆', industry: '出租房', teamName: '瓶窑片场所组', hazardDesc: '消防器材过期', riskLevel: 'general', recordTime: '2026-03-17', rectifyDeadline: '2026-04-03', status: 'rectifying', source: 'enterprise' },
  { id: 'h016', enterpriseName: '勾庄公寓楼', industry: '出租房', teamName: '勾庄片场所组', hazardDesc: '安全出口锁闭', riskLevel: 'serious', recordTime: '2026-03-18', rectifyDeadline: '2026-04-08', status: 'rectifying', source: 'expert', expertName: '王建国' },
  // 待整改
  { id: 'h017', enterpriseName: '余杭电镀厂', industry: '危化使用', teamName: '勾庄片场所组', hazardDesc: '电镀液储存不符合规范', riskLevel: 'major', recordTime: '2026-04-05', rectifyDeadline: '2026-04-20', status: 'pending', source: 'expert', expertName: '张伟' },
  { id: 'h018', enterpriseName: '良渚服装加工厂', industry: '小微企业', teamName: '良渚片场所组', hazardDesc: '员工未佩戴防护用品', riskLevel: 'general', recordTime: '2026-04-06', rectifyDeadline: '2026-04-18', status: 'pending', source: 'enterprise' },
  { id: 'h019', enterpriseName: '瓶窑临街商铺', industry: '沿街店铺', teamName: '瓶窑片场所组', hazardDesc: '货物占用消防通道', riskLevel: 'serious', recordTime: '2026-04-07', rectifyDeadline: '2026-04-15', status: 'pending', source: 'enterprise' },
  { id: 'h020', enterpriseName: '勾庄物流企业C', industry: '仓储物流', teamName: '物流片场所组', hazardDesc: '叉车日常维护记录缺失', riskLevel: 'general', recordTime: '2026-04-08', rectifyDeadline: '2026-04-22', status: 'pending', source: 'enterprise' },
  // 逾期未整改
  { id: 'h021', enterpriseName: '余杭鑫达机械厂', industry: '工业企业', teamName: '勾庄片场所组', hazardDesc: '行车吊具未定期检测', riskLevel: 'major', recordTime: '2026-03-01', rectifyDeadline: '2026-03-15', status: 'overdue', source: 'expert', expertName: '陈刚' },
  { id: 'h022', enterpriseName: '良渚小餐馆', industry: '沿街店铺', teamName: '良渚片场所组', hazardDesc: '燃气报警器未安装', riskLevel: 'serious', recordTime: '2026-03-02', rectifyDeadline: '2026-03-10', status: 'overdue', source: 'enterprise' },
  { id: 'h023', enterpriseName: '瓶窑农民房', industry: '出租房', teamName: '瓶窑片场所组', hazardDesc: '私拉电线充电', riskLevel: 'serious', recordTime: '2026-03-03', rectifyDeadline: '2026-03-10', status: 'overdue', source: 'enterprise' },
  { id: 'h024', enterpriseName: '勾庄片小微企业D', industry: '小微企业', teamName: '勾庄片场所组', hazardDesc: '应急预案未更新', riskLevel: 'general', recordTime: '2026-03-05', rectifyDeadline: '2026-03-20', status: 'overdue', source: 'expert', expertName: '李明' },
  { id: 'h025', enterpriseName: '物流片仓储企业E', industry: '仓储物流', teamName: '物流片场所组', hazardDesc: '监控盲区未覆盖', riskLevel: 'serious', recordTime: '2026-03-06', rectifyDeadline: '2026-03-18', status: 'overdue', source: 'expert', expertName: '王建国' },
]
