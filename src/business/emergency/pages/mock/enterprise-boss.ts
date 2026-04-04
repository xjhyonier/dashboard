export const enterpriseBossMock = {
  // 企业风险总览
  riskOverview: [
    {
      title: '企业风险等级',
      value: '较大风险',
      unit: '',
      trend: { value: 0, label: '维持不变', type: 'neutral' as const },
      description: '当前风险等级'
    },
    {
      title: '重大隐患数',
      value: '2',
      unit: '项',
      trend: { value: 0, label: '未减少', type: 'neutral' as const },
      description: '逾期未整改'
    },
    {
      title: '最近检查结果',
      value: '基本合格',
      unit: '',
      trend: { value: 0, label: '上次检查', type: 'neutral' as const },
      description: '专家上周检查'
    },
    {
      title: '安全员履职率',
      value: '78%',
      unit: '',
      trend: { value: -12, label: '较上月', type: 'down' as const },
      description: '任务完成率'
    }
  ],

  // 责任暴露警告
  responsibilityWarnings: [
    {
      title: '危化品存储区域消防设施不足',
      detail: '逾期15天未整改，涉及重大安全责任'
    },
    {
      title: '特种设备未按时检验',
      detail: '逾期22天未检验，违反安全生产法'
    }
  ],

  // 安全员工作状态
  safetyOfficerStatus: [
    { label: '今日到岗', status: 'success' as const, count: 1 },
    { label: '本周检查完成', status: 'success' as const, count: 8 },
    { label: '隐患整改跟进', status: 'warning' as const, count: 3 },
    { label: '逾期未处理', status: 'danger' as const, count: 2 }
  ],

  // 任务完成分布
  taskCompletionDistribution: [
    { label: '已完成', value: 78, color: '#16a34a' },
    { label: '进行中', value: 15, color: '#d97706' },
    { label: '逾期', value: 7, color: '#dc2626' }
  ],

  // 隐患列表
  hazardColumns: [
    { key: 'hazard', label: '隐患描述', width: '200px' },
    { key: 'level', label: '等级', width: '80px' },
    { key: 'location', label: '位置', width: '120px' },
    { key: 'status', label: '状态', width: '100px' },
    { key: 'days', label: '持续天数', width: '80px' }
  ],

  pendingHazards: [
    {
      hazard: '危化品存储区域消防设施不足',
      level: '重大',
      location: '化学品仓库',
      status: '逾期未整改',
      days: '15'
    },
    {
      hazard: '特种设备未按时检验',
      level: '重大',
      location: '生产车间',
      status: '逾期未整改',
      days: '22'
    },
    {
      hazard: '电气线路老化',
      level: '较大',
      location: '办公区域',
      status: '整改中',
      days: '6'
    }
  ],

  // 安全管理状态
  safetyManagementStatus: [
    { label: '安全制度完善', status: 'success' as const, count: 1 },
    { label: '培训计划执行', status: 'warning' as const, count: 1 },
    { label: '应急预案更新', status: 'danger' as const, count: 1 },
    { label: '日常巡检到位', status: 'success' as const, count: 1 }
  ],

  // 员工培训完成率
  trainingCompletion: [
    { label: '已完成', value: 85, color: '#16a34a' },
    { label: '进行中', value: 10, color: '#d97706' },
    { label: '未开始', value: 5, color: '#dc2626' }
  ]
}
