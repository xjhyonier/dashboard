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

  // 待办任务清单（按优先级排序 - 风险分值越低越紧急）
  pendingTasks: [
    {
      priority: '🔴 紧急',
      riskScore: 10,
      enterprise: '杭州杭锅工业锅炉有限公司',
      taskType: '视频检查',
      description: '视频检查视频补充',
      deadline: '2025/9/21',
      action: '补充视频资料',
      category: 'Follow-up'
    },
    {
      priority: '🔴 紧急',
      riskScore: 15,
      enterprise: '25家企业集群',
      taskType: '风险核对',
      description: '风险等级与AI预测不一致，需专家确认',
      deadline: '2025/10/2',
      action: '确认AI风险等级',
      category: 'Follow-up'
    },
    {
      priority: '🔴 紧急',
      riskScore: 20,
      enterprise: '杭州杭锅工业锅炉有限公司',
      taskType: '专家辅导',
      description: '专家辅导待办',
      deadline: '2025/9/11',
      action: '执行辅导'
    },
    {
      priority: '🟠 重要',
      riskScore: 40,
      enterprise: '杭州阿里巴巴网络技术有限公司',
      taskType: '日常检查',
      description: '日常安全检查',
      deadline: '2025/9/15',
      action: '执行检查'
    },
    {
      priority: '🟠 重要',
      riskScore: 45,
      enterprise: '杭州海康威视数字技术股份有限公司',
      taskType: '设施设备',
      description: '设施设备更新待办',
      deadline: '2025/9/14',
      action: '设备核查'
    },
    {
      priority: '🟡 一般',
      riskScore: 70,
      enterprise: '杭州大华技术股份有限公司',
      taskType: '文件签名',
      description: '安全目标责任书签名',
      deadline: '2025/9/16',
      action: '线上签名'
    },
    {
      priority: '🟡 一般',
      riskScore: 75,
      enterprise: '浙江中控技术股份有限公司',
      taskType: '设施设备',
      description: '设施设备维护待办',
      deadline: '2025/9/13',
      action: '设备核查'
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

