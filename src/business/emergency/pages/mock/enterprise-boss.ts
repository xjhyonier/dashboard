export const enterpriseBossMock = {
  // 风险分级管控情况
  riskOverview: [
    {
      title: '风险点总数',
      value: '48',
      unit: '项',
      trend: { value: -3, label: '较上月', type: 'up' as const },
      description: '全部风险点'
    },
    {
      title: '重大风险',
      value: '5',
      unit: '项',
      trend: { value: 0, label: '较上月', type: 'neutral' as const },
      description: '需立即整改'
    },
    {
      title: '较大风险',
      value: '12',
      unit: '项',
      trend: { value: -2, label: '较上月', type: 'up' as const },
      description: '限期整改'
    },
    {
      title: '一般风险',
      value: '18',
      unit: '项',
      trend: { value: -1, label: '较上月', type: 'up' as const },
      description: '持续跟踪'
    },
    {
      title: '低风险',
      value: '13',
      unit: '项',
      trend: { value: 1, label: '较上月', type: 'down' as const },
      description: '日常管理'
    }
  ],

  // ─── 隐患排查治理 ────────────────────────────────────────────
  hazardManagement: {
    // 日常检查统计
    dailyCheck: {
      total: 588,
      checked: 24,
      overdue: 527,
      hazards: 23,
      tasks: [
        { id: 1, name: '111', total: 54, checked: 54, overdue: 4, hazards: 50 },
        { id: 2, name: '通风测试', total: 46, checked: 2, overdue: 43, hazards: 1 },
        { id: 3, name: '测试', total: 40, checked: 2, overdue: 37, hazards: 5 },
        { id: 4, name: '防护', total: 38, checked: 0, overdue: 37, hazards: 0 },
        { id: 5, name: '生产-日常检查-自身检查', total: 27, checked: 0, overdue: 26, hazards: 0 },
        { id: 6, name: '电气线路安全排查', total: 52, checked: 48, overdue: 8, hazards: 12 },
        { id: 7, name: '消防设施巡检', total: 61, checked: 55, overdue: 6, hazards: 18 },
        { id: 8, name: '危险化学品检查', total: 33, checked: 28, overdue: 5, hazards: 9 },
        { id: 9, name: '特种设备安全检测', total: 45, checked: 41, overdue: 4, hazards: 7 },
        { id: 10, name: '安全通道检查', total: 38, checked: 35, overdue: 3, hazards: 6 },
        { id: 11, name: '应急照明系统检查', total: 29, checked: 27, overdue: 2, hazards: 4 },
        { id: 12, name: '消防水泵房巡检', total: 22, checked: 20, overdue: 2, hazards: 3 },
        { id: 13, name: '灭火器有效性检查', total: 55, checked: 53, overdue: 2, hazards: 11 },
        { id: 14, name: '疏散指示标志检查', total: 41, checked: 39, overdue: 2, hazards: 5 },
        { id: 15, name: '防火卷帘门测试', total: 18, checked: 17, overdue: 1, hazards: 2 },
        { id: 16, name: '燃气管道安全排查', total: 36, checked: 34, overdue: 2, hazards: 8 },
        { id: 17, name: '电梯安全年检', total: 12, checked: 12, overdue: 0, hazards: 0 },
        { id: 18, name: '防雷设施检测', total: 8, checked: 8, overdue: 0, hazards: 1 },
        { id: 19, name: '施工工地安全检查', total: 44, checked: 40, overdue: 4, hazards: 15 },
        { id: 20, name: '仓库消防安全巡查', total: 31, checked: 28, overdue: 3, hazards: 6 },
        { id: 21, name: '配电室安全检查', total: 25, checked: 23, overdue: 2, hazards: 4 },
        { id: 22, name: '食堂食品安全检查', total: 19, checked: 18, overdue: 1, hazards: 2 },
        { id: 23, name: '宿舍区安全检查', total: 27, checked: 25, overdue: 2, hazards: 3 },
      ]
    },
    // 专项检查统计
    specialCheck: {
      total: 20,
      checked: 13,
      overdue: 7,
      hazards: 9,
      tasks: [
        { id: 1, name: '防火巡查（每月）', total: 1, checked: 1, overdue: 0, hazards: 0 },
        { id: 2, name: '打卡-照片回归', total: 1, checked: 1, overdue: 0, hazards: 1 },
        { id: 3, name: '专项检查-列明新餐打卡...', total: 1, checked: 1, overdue: 0, hazards: 0 },
        { id: 4, name: '测试111', total: 1, checked: 1, overdue: 0, hazards: 0 },
        { id: 5, name: '计算机世界', total: 1, checked: 0, overdue: 1, hazards: 0 },
        { id: 6, name: '消防安全专项检查', total: 2, checked: 2, overdue: 0, hazards: 1 },
        { id: 7, name: '电气安全专项排查', total: 1, checked: 1, overdue: 0, hazards: 2 },
        { id: 8, name: '危险化学品专项检查', total: 3, checked: 1, overdue: 2, hazards: 3 },
        { id: 9, name: '建筑施工专项检查', total: 1, checked: 0, overdue: 1, hazards: 0 },
        { id: 10, name: '节假日安全专项检查', total: 2, checked: 2, overdue: 0, hazards: 1 },
        { id: 11, name: '特种设备专项检查', total: 1, checked: 1, overdue: 0, hazards: 0 },
        { id: 12, name: '燃气管道专项排查', total: 1, checked: 0, overdue: 1, hazards: 0 },
        { id: 13, name: '防雷防静电专项检查', total: 1, checked: 1, overdue: 0, hazards: 0 },
        { id: 14, name: '应急演练专项评估', total: 1, checked: 0, overdue: 1, hazards: 0 },
        { id: 15, name: '消防设施年检', total: 1, checked: 1, overdue: 0, hazards: 1 },
        { id: 16, name: '安全培训专项督查', total: 1, checked: 0, overdue: 1, hazards: 0 },
      ]
    },
    // 随手拍统计
    snapshot: {
      total: 21,
      aiRecognized: 10,
      confirmed: 18,
      majorHazard: 0,
      generalHazard: 18,
      rectified: 6,
      reward: 5,
      persons: [
        { name: '贤贤', type: '消防安全责任人', count: 1, reward: 0 },
        { name: '春歌', type: '安全管理员', count: 1, reward: 0 },
        { name: '李文魁', type: '普通员工', count: 1, reward: 0 },
        { name: '小新', type: '安全管理员', count: 1, reward: 0 },
        { name: '贤贤', type: '普通员工', count: 1, reward: 0 },
        { name: '李学学', type: '普通员工', count: 1, reward: 0 },
        { name: '张明', type: '部门负责人', count: 3, reward: 1 },
        { name: '王芳', type: '安全管理员', count: 2, reward: 1 },
        { name: '刘强', type: '普通员工', count: 2, reward: 0 },
        { name: '陈丽', type: '消防安全责任人', count: 1, reward: 0 },
        { name: '赵勇', type: '部门负责人', count: 2, reward: 1 },
        { name: '林杰', type: '普通员工', count: 1, reward: 0 },
        { name: '黄敏', type: '安全管理员', count: 1, reward: 0 },
        { name: '周伟', type: '消防设施操作员', count: 2, reward: 1 },
        { name: '吴静', type: '普通员工', count: 1, reward: 0 },
      ]
    },
    // 安管员随手拍统计
    adminSnapshot: {
      total: 12,
      aiRecognized: 6,
      confirmed: 10,
      majorHazard: 1,
      generalHazard: 9,
      rectified: 4,
      reward: 3,
      persons: [
        { name: '春歌', type: '安全管理员', count: 5, reward: 2 },
        { name: '小新', type: '安全管理员', count: 4, reward: 1 },
        { name: '贤贤', type: '安全管理员', count: 3, reward: 0 },
        { name: '张明', type: '安全管理员', count: 2, reward: 0 },
        { name: '王芳', type: '安全管理员', count: 3, reward: 1 },
        { name: '刘强', type: '消防设施操作员', count: 2, reward: 0 },
        { name: '陈丽', type: '安全管理员', count: 1, reward: 0 },
        { name: '赵勇', type: '安全管理员', count: 2, reward: 1 },
        { name: '林杰', type: '消防设施操作员', count: 3, reward: 0 },
        { name: '黄敏', type: '安全管理员', count: 1, reward: 0 },
        { name: '周伟', type: '安全管理员', count: 2, reward: 1 },
        { name: '吴静', type: '消防设施操作员', count: 1, reward: 0 },
      ]
    },
    // 隐患治理
    governance: {
      found: 53,
      pendingConfirm: 0,
      // 部门统计
      deptStats: [
        { dept: '消防部门', count: 44 },
        { dept: '安全部门', count: 10 },
        { dept: '生产部门', count: 9 },
        { dept: '仓储部门', count: 8 },
        { dept: '行政部门', count: 5 },
      ],
      // 整改情况
      rectification: {
        total: 46,
        completed: 12,
        inProgress: 1,
        verifying: 2,
        overdue: 31,
        completionRate: 26.09,
      },
      // 重大事故隐患整改情况
      majorRectification: {
        total: 8,
        completed: 3,
        inProgress: 2,
        verifying: 1,
        overdue: 2,
        completionRate: 37.5,
      },
      // 类型统计
      typeStats: [
        { type: '基础管理', count: 34 },
        { type: '消防', count: 5 },
        { type: '电气安全', count: 2 },
        { type: '应急设施', count: 2 },
        { type: '作业现场', count: 1 },
        { type: '作业环境', count: 1 },
        { type: '特种设备', count: 1 },
      ],
      // 来源统计
      sourceStats: [
        { source: '随手拍', value: 21, color: '#10B981' },
        { source: '日常检查', value: 16, color: '#3B82F6' },
        { source: '专项检查', value: 11, color: '#F59E0B' },
        { source: 'AI检测', value: 3, color: '#8B5CF6' },
        { source: '管理员随手拍', value: 2, color: '#EC4899' }
      ]
    }
  },

  // ─── 制度台账 ────────────────────────────────────────────
  complianceRecords: [
    { id: 'org', name: '机构与职责', total: 8, completed: 7, pending: 1, link: '/emergency/enterprise-boss/compliance?tab=org' },
    { id: 'invest', name: '安全投入', total: 5, completed: 3, pending: 2, link: '/emergency/enterprise-boss/compliance?tab=invest' },
    { id: 'system', name: '制度化管理', total: 15, completed: 14, pending: 1, link: '/emergency/enterprise-boss/compliance?tab=system' },
    { id: 'train', name: '教育培训', total: 12, completed: 10, pending: 2, link: '/emergency/enterprise-boss/compliance?tab=train' },
    { id: 'emergency', name: '应急管理', total: 6, completed: 5, pending: 1, link: '/emergency/enterprise-boss/compliance?tab=emergency' },
    { id: 'accident', name: '事故管理', total: 4, completed: 4, pending: 0, link: '/emergency/enterprise-boss/compliance?tab=accident' },
  ],

  // ─── 教育培训 ──────────────────────────────────────────
  educationTraining: {
    hasAnnualPlan: true,
    courseCount: 38,
    dailySafetyTotal: 24,
    threeLevelEduCards: 156,
    dailySafetyTraining: {
      total: 24,
      inProgress: 5,
      completed: 16,
      unpublished: 3,
    },
    shouldTrainCount: 320,
    actualSignInCount: 285,
    examCompletionRate: 92.3,
    examPassRate: 88.5,
    // 月度趋势数据（近12个月）
    monthlyTrend: [
      { month: '1月', sessions: 18, inProgress: 2, completed: 16, shouldTrain: 270, actualSignIn: 245 },
      { month: '2月', sessions: 15, inProgress: 1, completed: 14, shouldTrain: 260, actualSignIn: 238 },
      { month: '3月', sessions: 22, inProgress: 3, completed: 19, shouldTrain: 300, actualSignIn: 272 },
      { month: '4月', sessions: 20, inProgress: 2, completed: 18, shouldTrain: 310, actualSignIn: 278 },
      { month: '5月', sessions: 24, inProgress: 4, completed: 20, shouldTrain: 320, actualSignIn: 290 },
      { month: '6月', sessions: 24, inProgress: 5, completed: 16, shouldTrain: 320, actualSignIn: 285 },
      { month: '7月', sessions: 21, inProgress: 4, completed: 14, shouldTrain: 315, actualSignIn: 280 },
      { month: '8月', sessions: 19, inProgress: 3, completed: 15, shouldTrain: 305, actualSignIn: 268 },
      { month: '9月', sessions: 23, inProgress: 5, completed: 17, shouldTrain: 325, actualSignIn: 292 },
      { month: '10月', sessions: 25, inProgress: 6, completed: 18, shouldTrain: 330, actualSignIn: 300 },
      { month: '11月', sessions: 22, inProgress: 3, completed: 18, shouldTrain: 318, actualSignIn: 286 },
      { month: '12月', sessions: 26, inProgress: 5, completed: 19, shouldTrain: 335, actualSignIn: 305 },
    ],
  },

  // ─── 现场管理 ──────────────────────────────────────────
  // 作业安全管理（月度数据，月份降序）
  workSafety: [
    { month: '2026-07', type: '动火作业', status: '待作业许可', count: 3 },
    { month: '2026-07', type: '动火作业', status: '待现场签批', count: 2 },
    { month: '2026-07', type: '动火作业', status: '已完成', count: 2 },
    { month: '2026-07', type: '高处作业', status: '已完成', count: 2 },
    { month: '2026-07', type: '高处作业', status: '待作业许可', count: 1 },
    { month: '2026-07', type: '高处作业', status: '待验收', count: 4 },
    { month: '2026-07', type: '受限空间', status: '待作业许可', count: 2 },
    { month: '2026-07', type: '受限空间', status: '待现场签批', count: 3 },
    { month: '2026-07', type: '临时用电', status: '已完成', count: 3 },
    { month: '2026-07', type: '临时用电', status: '待验收', count: 1 },
    { month: '2026-07', type: '吊装作业', status: '待作业许可', count: 1 },
    { month: '2026-07', type: '其他', status: '已完成', count: 2 },
    { month: '2026-06', type: '动火作业', status: '已完成', count: 4 },
    { month: '2026-06', type: '动火作业', status: '待现场签批', count: 1 },
    { month: '2026-06', type: '动火作业', status: '待验收', count: 2 },
    { month: '2026-06', type: '高处作业', status: '待作业许可', count: 3 },
    { month: '2026-06', type: '高处作业', status: '已完成', count: 2 },
    { month: '2026-06', type: '受限空间', status: '待作业许可', count: 3 },
    { month: '2026-06', type: '受限空间', status: '已完成', count: 1 },
    { month: '2026-06', type: '临时用电', status: '待验收', count: 2 },
    { month: '2026-06', type: '吊装作业', status: '已完成', count: 2 },
    { month: '2026-06', type: '其他', status: '待现场签批', count: 1 },
    { month: '2026-05', type: '动火作业', status: '待作业许可', count: 2 },
    { month: '2026-05', type: '动火作业', status: '已完成', count: 3 },
    { month: '2026-05', type: '高处作业', status: '已完成', count: 3 },
    { month: '2026-05', type: '高处作业', status: '待现场签批', count: 1 },
    { month: '2026-05', type: '受限空间', status: '待作业许可', count: 2 },
    { month: '2026-05', type: '受限空间', status: '已��成', count: 2 },
    { month: '2026-05', type: '临时用电', status: '待验收', count: 1 },
    { month: '2026-05', type: '吊装作业', status: '待作业许可', count: 1 },
    { month: '2026-05', type: '其他', status: '已完成', count: 1 },
  ],
  // 相关方管理
  relatedParty: {
    unitCount: 12,
    personCount: 186,
    details: [
      { unit: 'XX建设工程有限公司', personCount: 35 },
      { unit: 'XX设备安装公司', personCount: 28 },
      { unit: 'XX消防工程有限公司', personCount: 22 },
      { unit: 'XX电力工程公司', personCount: 18 },
      { unit: 'XX环境科技有限公司', personCount: 15 },
      { unit: 'XX特种设备检测公司', personCount: 12 },
      { unit: 'XX运输有限公司', personCount: 10 },
      { unit: 'XX建筑劳务有限公司', personCount: 16 },
      { unit: 'XX检测技术服务公司', personCount: 8 },
      { unit: 'XX环保工程有限公司', personCount: 7 },
      { unit: 'XX机电设备有限公司', personCount: 9 },
      { unit: 'XX安全管理咨询公司', personCount: 6 },
      { unit: 'XX物业服务有限公司', personCount: 24 },
      { unit: 'XX餐饮管理有限公司', personCount: 14 },
      { unit: 'XX安保服务公司', personCount: 20 },
      { unit: 'XX清洁服务有限公司', personCount: 11 },
      { unit: 'XX电梯维保有限公司', personCount: 5 },
      { unit: 'XX绿化养护有限公司', personCount: 8 },
    ],
  },
  // 作业票报备（月度数据，月份降序）
  workPermitReport: [
    { month: '2026-07', type: '动火作业', approvalStatus: '通过', count: 4 },
    { month: '2026-07', type: '动火作业', approvalStatus: '待审批', count: 2 },
    { month: '2026-07', type: '动火作业', approvalStatus: '驳回', count: 1 },
    { month: '2026-07', type: '高处作业', approvalStatus: '通过', count: 5 },
    { month: '2026-07', type: '高处作业', approvalStatus: '待审批', count: 1 },
    { month: '2026-07', type: '高处作业', approvalStatus: '驳回', count: 1 },
    { month: '2026-07', type: '受限空间', approvalStatus: '通过', count: 3 },
    { month: '2026-07', type: '受限空间', approvalStatus: '待审批', count: 2 },
    { month: '2026-07', type: '临时用电', approvalStatus: '通过', count: 3 },
    { month: '2026-07', type: '临时用电', approvalStatus: '驳回', count: 1 },
    { month: '2026-07', type: '吊装作业', approvalStatus: '通过', count: 1 },
    { month: '2026-07', type: '其他', approvalStatus: '通过', count: 2 },
    { month: '2026-06', type: '动火作业', approvalStatus: '通过', count: 5 },
    { month: '2026-06', type: '动火作业', approvalStatus: '待审批', count: 1 },
    { month: '2026-06', type: '动火作业', approvalStatus: '驳回', count: 1 },
    { month: '2026-06', type: '高处作业', approvalStatus: '通过', count: 3 },
    { month: '2026-06', type: '高处作业', approvalStatus: '待审批', count: 2 },
    { month: '2026-06', type: '受限空间', approvalStatus: '通过', count: 2 },
    { month: '2026-06', type: '受限空间', approvalStatus: '待审批', count: 1 },
    { month: '2026-06', type: '受限空间', approvalStatus: '驳回', count: 1 },
    { month: '2026-06', type: '临时用电', approvalStatus: '通过', count: 2 },
    { month: '2026-06', type: '吊装作业', approvalStatus: '通过', count: 2 },
    { month: '2026-06', type: '其他', approvalStatus: '待审批', count: 1 },
    { month: '2026-05', type: '动火作业', approvalStatus: '通过', count: 3 },
    { month: '2026-05', type: '动火作业', approvalStatus: '待审批', count: 2 },
    { month: '2026-05', type: '高处作业', approvalStatus: '通过', count: 3 },
    { month: '2026-05', type: '高处作业', approvalStatus: '驳回', count: 1 },
    { month: '2026-05', type: '受限空间', approvalStatus: '通过', count: 3 },
    { month: '2026-05', type: '受限空间', approvalStatus: '待审批', count: 1 },
    { month: '2026-05', type: '临时用电', approvalStatus: '待审批', count: 1 },
    { month: '2026-05', type: '吊装作业', approvalStatus: '待审批', count: 1 },
    { month: '2026-05', type: '其他', approvalStatus: '通过', count: 1 },
  ],

  // ─── 安全责任主体情况 ─────────────────────────────────────
  safetyResponsibility: {
    hasTenant: true,
    enterpriseCount: { total: 12, major: 2, large: 3, general: 5, low: 2 },
    venueCount: { total: 35, major: 5, large: 8, general: 14, low: 8 },
  },
}
