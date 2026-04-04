export const ceoMock = {
  coreMetrics: [
    {
      title: '总营收',
      value: '¥2,847万',
      unit: '',
      trend: { value: 18.5, label: '较上月', type: 'up' as const },
      description: '本月累计营收'
    },
    {
      title: '客户总数',
      value: '12,847',
      unit: '家',
      trend: { value: 12.3, label: '较上月', type: 'up' as const },
      description: '活跃客户数'
    },
    {
      title: '市场份额',
      value: '23.5%',
      unit: '',
      trend: { value: 2.1, label: '较上季', type: 'up' as const },
      description: '行业排名第二'
    },
    {
      title: '运营效率',
      value: '94.2%',
      unit: '',
      trend: { value: 3.8, label: '较上月', type: 'up' as const },
      description: '整体运营效率'
    }
  ],

  revenueTrend: [
    { label: '1月', value: 1850 },
    { label: '2月', value: 1920 },
    { label: '3月', value: 2100 },
    { label: '4月', value: 2250 },
    { label: '5月', value: 2380 },
    { label: '6月', value: 2520 },
    { label: '7月', value: 2480 },
    { label: '8月', value: 2650 },
    { label: '9月', value: 2720 },
    { label: '10月', value: 2780 },
    { label: '11月', value: 2810 },
    { label: '12月', value: 2847 }
  ],

  businessDistribution: [
    { label: 'QuickBI', value: 45, color: '#4f46e5' },
    { label: '数据服务', value: 25, color: '#06b6d4' },
    { label: '咨询业务', value: 18, color: '#16a34a' },
    { label: '其他业务', value: 12, color: '#8b5cf6' }
  ],

  topBusinessUnits: [
    { rank: 1, label: '华东大区', value: '¥856万', trend: 'up' as const },
    { rank: 2, label: '华南大区', value: '¥623万', trend: 'up' as const },
    { rank: 3, label: '华北大区', value: '¥578万', trend: 'same' as const },
    { rank: 4, label: '西南大区', value: '¥445万', trend: 'down' as const },
    { rank: 5, label: '西北大区', value: '¥345万', trend: 'up' as const }
  ],

  riskStatus: [
    { label: '业务正常', status: 'success' as const, count: 85 },
    { label: '需要关注', status: 'warning' as const, count: 12 },
    { label: '风险预警', status: 'danger' as const, count: 3 },
    { label: '待处理', status: 'neutral' as const, count: 5 }
  ]
}
