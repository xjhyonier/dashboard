export const productMock = {
  coreMetrics: [
    {
      title: '日活跃用户',
      value: '8,456',
      unit: '人',
      trend: { value: 15.2, label: '较昨日', type: 'up' as const },
      description: '今日活跃用户数'
    },
    {
      title: '功能使用率',
      value: '76.8%',
      unit: '',
      trend: { value: 5.3, label: '较上周', type: 'up' as const },
      description: '核心功能使用率'
    },
    {
      title: '7日留存率',
      value: '68.5%',
      unit: '',
      trend: { value: -2.1, label: '较上周', type: 'down' as const },
      description: '用户7日留存率'
    },
    {
      title: '用户满意度',
      value: '4.6',
      unit: '分',
      trend: { value: 0.2, label: '较上月', type: 'up' as const },
      description: '平均满意度评分'
    }
  ],

  userTrend: [
    { label: '周一', value: 7200 },
    { label: '周二', value: 7500 },
    { label: '周三', value: 7800 },
    { label: '周四', value: 8100 },
    { label: '周五', value: 8456 },
    { label: '周六', value: 8900 },
    { label: '周日', value: 8650 }
  ],

  featureDistribution: [
    { label: '数据查询', value: 35, color: '#4f46e5' },
    { label: '报表生成', value: 28, color: '#06b6d4' },
    { label: '数据可视化', value: 22, color: '#16a34a' },
    { label: '权限管理', value: 15, color: '#d97706' }
  ],

  topFeatures: [
    { rank: 1, label: '智能报表', value: '89%', trend: 'up' as const },
    { rank: 2, label: '实时监控', value: '76%', trend: 'up' as const },
    { rank: 3, label: '数据导出', value: '68%', trend: 'same' as const },
    { rank: 4, label: '权限管理', value: '52%', trend: 'down' as const },
    { rank: 5, label: 'API集成', value: '45%', trend: 'up' as const }
  ],

  healthStatus: [
    { label: '功能正常', status: 'success' as const, count: 28 },
    { label: '性能优化', status: 'warning' as const, count: 5 },
    { label: '需要修复', status: 'danger' as const, count: 2 },
    { label: '计划中', status: 'neutral' as const, count: 3 }
  ]
}
