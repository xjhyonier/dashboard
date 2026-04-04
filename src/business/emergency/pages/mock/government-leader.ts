export const governmentLeaderMock = {
  // 红线监测指标
  redLineMetrics: [
    {
      title: '重大事故隐患数',
      value: '8',
      unit: '项',
      description: '关键红线',
      trend: { value: 0, label: '持平', type: 'neutral' as const }
    },
    {
      title: '隐患整改率',
      value: '90.73%',
      unit: '',
      description: '闭环状态',
      trend: { value: 5.2, label: '较上月', type: 'up' as const }
    },
    {
      title: '已确认隐患数',
      value: '3,475',
      unit: '项',
      description: '累计确认',
      trend: { value: 5.2, label: '较上月', type: 'up' as const }
    },
    {
      title: '已整改隐患数',
      value: '3,153',
      unit: '项',
      description: '已处理',
      trend: { value: 5.2, label: '较上月', type: 'up' as const }
    }
  ],

  // 工作活跃度指标
  activityMetrics: [
    {
      title: '信息采集户数',
      value: '5,581',
      unit: '家',
      description: '已完成信息采集',
      trend: { value: 8.3, label: '较上月', type: 'up' as const }
    },
    {
      title: '企业自查户数',
      value: '1,185',
      unit: '家',
      description: '已开展企业自查',
      trend: { value: 15.2, label: '较上月', type: 'up' as const }
    }
  ],

  // 行政监管支撑
  adminMetrics: [
    {
      title: '已上线镇街组织',
      value: '2',
      unit: '个',
      description: '已启用监管组织'
    },
    {
      title: '镇街监管总户数',
      value: '8,693',
      unit: '家',
      description: '应监管总数'
    }
  ],

  // 趋势及其他图表数据 (保持不变)
  enterpriseTrend: [
    { label: '10月', value: 5420 },
    { label: '11月', value: 5485 },
    { label: '12月', value: 5521 },
    { label: '1月', value: 5558 },
    { label: '2月', value: 5562 },
    { label: '3月', value: 5581 }
  ],
  enterpriseRiskDistribution: [
    { label: '重大风险', value: 8, color: '#dc2626' },
    { label: '较大风险', value: 23, color: '#d97706' },
    { label: '一般风险', value: 156, color: '#16a34a' },
    { label: '低风险', value: 313, color: '#06b6d4' }
  ]
}
