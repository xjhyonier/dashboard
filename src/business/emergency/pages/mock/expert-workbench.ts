export const expertWorkbenchMock = {
  // 今日任务概览
  todayTaskOverview: [
    {
      title: '今日待办',
      value: '15',
      unit: '项',
      trend: { value: 3, label: '较昨日', type: 'up' as const },
      description: '需要今日完成的任务'
    },
    {
      title: '本周到期',
      value: '28',
      unit: '项',
      trend: { value: 5, label: '较昨日', type: 'up' as const },
      description: '本周内需要完成的任务'
    },
    {
      title: '逾期未处理',
      value: '5',
      unit: '项',
      trend: { value: -2, label: '较昨日', type: 'down' as const },
      description: '超期未完成的任务'
    },
    {
      title: '已完成',
      value: '156',
      unit: '项',
      trend: { value: 12, label: '本周', type: 'up' as const },
      description: '本月已完成任务'
    }
  ],

  // 任务列表表头
  taskColumns: [
    { key: 'priority', label: '优先级', width: '80px' },
    { key: 'enterprise', label: '企业名称', width: '180px' },
    { key: 'taskType', label: '任务类型', width: '100px' },
    { key: 'description', label: '任务说明', width: '200px' },
    { key: 'deadline', label: '截止时间', width: '100px' },
    { key: 'action', label: '执行动作', width: '150px' }
  ],

  // 待办任务清单（按优先级排序）
  pendingTasks: [
    {
      priority: '🔴 紧急',
      riskScore: 20,
      enterprise: '某化工厂',
      taskType: '现场检查',
      description: '重大隐患超期15天未整改',
      deadline: '今日18:00',
      action: '现场核查整改进度'
    },
    {
      priority: '🔴 紧急',
      riskScore: 25,
      enterprise: '某机械厂',
      taskType: '现场检查',
      description: '特种设备超期未检验',
      deadline: '今日17:00',
      action: '督促立即送检'
    },
    {
      priority: '🔴 紧急',
      riskScore: 30,
      enterprise: '某纺织厂',
      taskType: '整改复核',
      description: '重大隐患已整改，需现场复核',
      deadline: '今日16:00',
      action: '现场复核验收'
    },
    {
      priority: '🟠 重要',
      riskScore: 50,
      enterprise: '某电子厂',
      taskType: 'AI看',
      description: '电气线路老化，需AI识别评估',
      deadline: '今日15:00',
      action: '使用AI工具识别隐患'
    },
    {
      priority: '🟠 重要',
      riskScore: 55,
      enterprise: '某食品厂',
      taskType: '视频看',
      description: '消防控制室无人值守',
      deadline: '今日14:00',
      action: '视频监控检查'
    },
    {
      priority: '🟡 一般',
      riskScore: 80,
      enterprise: '某服装厂',
      taskType: '日常检查',
      description: '例行检查到期',
      deadline: '本周五',
      action: '按计划执行检查'
    },
    {
      priority: '🟡 一般',
      riskScore: 85,
      enterprise: '某家具厂',
      taskType: '隐患复查',
      description: '一般隐患已整改，需复查',
      deadline: '本周五',
      action: '现场复查确认'
    }
  ],

  // 任务状态统计
  taskStatus: [
    { label: '待执行', status: 'warning' as const, count: 23 },
    { label: '进行中', status: 'neutral' as const, count: 8 },
    { label: '已完成', status: 'success' as const, count: 156 },
    { label: '逾期', status: 'danger' as const, count: 5 }
  ],

  // 本周工作完成情况
  weeklyResults: [
    { label: '检查企业数', status: 'success' as const, count: 28 },
    { label: '发现隐患数', status: 'success' as const, count: 45 },
    { label: '推动整改数', status: 'success' as const, count: 38 },
    { label: '完成任务数', status: 'success' as const, count: 42 }
  ],

  // 已完成任务列表
  completedTaskColumns: [
    { key: 'enterprise', label: '企业名称', width: '180px' },
    { key: 'taskType', label: '任务类型', width: '100px' },
    { key: 'description', label: '任务说明', width: '200px' },
    { key: 'completedTime', label: '完成时间', width: '120px' }
  ],

  // 已完成任务数据
  completedTasks: [
    {
      enterprise: '某食品厂',
      taskType: '日常检查',
      description: '例行检查完成',
      completedTime: '2024-03-28 16:30'
    },
    {
      enterprise: '某服装厂',
      taskType: '隐患复查',
      description: '一般隐患已整改并复核通过',
      completedTime: '2024-03-28 15:45'
    },
    {
      enterprise: '某五金厂',
      taskType: '专项检查',
      description: '消防安全专项检查',
      completedTime: '2024-03-27 14:20'
    },
    {
      enterprise: '某包装厂',
      taskType: 'AI看',
      description: 'AI识别出2处隐患',
      completedTime: '2024-03-27 11:30'
    },
    {
      enterprise: '某玩具厂',
      taskType: '视频看',
      description: '视频监控检查正常',
      completedTime: '2024-03-26 17:00'
    }
  ]
}

