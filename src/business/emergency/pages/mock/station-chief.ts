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

  // 隐患数量趋势
  hazardTrend: [
    { label: '1月', value: 85 },
    { label: '2月', value: 78 },
    { label: '3月', value: 72 },
    { label: '4月', value: 68 },
    { label: '5月', value: 65 },
    { label: '6月', value: 58 },
    { label: '7月', value: 52 },
    { label: '8月', value: 48 },
    { label: '9月', value: 45 },
    { label: '10月', value: 42 },
    { label: '11月', value: 38 },
    { label: '12月', value: 47 }
  ],

  // 隐患等级分布
  hazardDistribution: [
    { label: '重大隐患', value: 12, color: '#dc2626' },
    { label: '较大隐患', value: 35, color: '#d97706' },
    { label: '一般隐患', value: 156, color: '#16a34a' },
    { label: '低风险', value: 289, color: '#06b6d4' }
  ],

  // 专家过程管理指标
  expertManagement: [
    {
      title: '专家任务完成率',
      value: '92.3%',
      unit: '',
      trend: { value: 3.2, label: '较上周', type: 'up' as const }
    },
    {
      title: '重点企业到访率',
      value: '85.6%',
      unit: '',
      trend: { value: 7.8, label: '较上周', type: 'up' as const }
    },
    {
      title: '重大隐患跟进率',
      value: '100%',
      unit: '',
      trend: { value: 0, label: '保持', type: 'neutral' as const }
    },
    {
      title: '专家推动整改率',
      value: '76.8%',
      unit: '',
      trend: { value: 4.5, label: '较上周', type: 'up' as const }
    }
  ],

  // 专家工作量排名
  expertRanking: [
    { rank: 1, label: '张三', value: '125家', trend: 'up' as const },
    { rank: 2, label: '李四', value: '118家', trend: 'up' as const },
    { rank: 3, label: '王五', value: '112家', trend: 'same' as const },
    { rank: 4, label: '赵六', value: '108家', trend: 'up' as const },
    { rank: 5, label: '钱七', value: '102家', trend: 'down' as const },
    { rank: 6, label: '孙八', value: '98家', trend: 'up' as const },
    { rank: 7, label: '周九', value: '95家', trend: 'same' as const },
    { rank: 8, label: '吴十', value: '92家', trend: 'down' as const },
    { rank: 9, label: '郑十一', value: '88家', trend: 'up' as const },
    { rank: 10, label: '王十二', value: '85家', trend: 'up' as const }
  ],

  // 专家任务状态
  expertTaskStatus: [
    { label: '已完成', status: 'success' as const, count: 856 },
    { label: '进行中', status: 'warning' as const, count: 125 },
    { label: '超时未处理', status: 'danger' as const, count: 23 },
    { label: '待分配', status: 'neutral' as const, count: 45 }
  ],

  // 重大隐患列表
  majorHazardColumns: [
    { key: 'enterprise', label: '企业名称', width: '180px' },
    { key: 'hazard', label: '隐患描述', width: '200px' },
    { key: 'level', label: '等级', width: '80px' },
    { key: 'expert', label: '跟进专家', width: '100px' },
    { key: 'status', label: '状态', width: '100px' },
    { key: 'days', label: '持续天数', width: '80px' }
  ],

  majorHazards: [
    {
      enterprise: '某化工厂',
      hazard: '危化品存储区域消防设施不足',
      level: '重大',
      expert: '张三',
      status: '整改中',
      days: '15'
    },
    {
      enterprise: '某纺织厂',
      hazard: '疏散通道被堵塞',
      level: '重大',
      expert: '李四',
      status: '已整改待复核',
      days: '8'
    },
    {
      enterprise: '某电子厂',
      hazard: '电气线路老化严重',
      level: '较大',
      expert: '王五',
      status: '整改中',
      days: '12'
    },
    {
      enterprise: '某机械厂',
      hazard: '特种设备未按时检验',
      level: '重大',
      expert: '赵六',
      status: '超期未整改',
      days: '22'
    },
    {
      enterprise: '某食品厂',
      hazard: '消防控制室无人值守',
      level: '较大',
      expert: '钱七',
      status: '整改中',
      days: '6'
    }
  ],

  // 企业风险等级分布
  enterpriseRiskDistribution: [
    { label: '重大风险', value: 8, color: '#dc2626' },
    { label: '较大风险', value: 23, color: '#d97706' },
    { label: '一般风险', value: 156, color: '#16a34a' },
    { label: '低风险', value: 313, color: '#06b6d4' }
  ],

  // 辖区安全状态
  districtSafetyStatus: [
    { label: '安全平稳', status: 'success' as const, count: 856 },
    { label: '需要关注', status: 'warning' as const, count: 45 },
    { label: '风险较高', status: 'danger' as const, count: 12 },
    { label: '待排查', status: 'neutral' as const, count: 89 }
  ]
}
