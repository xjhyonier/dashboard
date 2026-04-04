export const dashboardBMock = {
  kpiMetrics: [
    {
      title: '本月销售额',
      value: '8,456',
      unit: '万元',
      trend: { value: 15.2, label: '较上月', type: 'up' as const }
    },
    {
      title: '订单数量',
      value: '2,847',
      unit: '笔',
      trend: { value: 9.8, label: '较上月', type: 'up' as const }
    },
    {
      title: '客单价',
      value: '2,969',
      unit: '元',
      trend: { value: 4.9, label: '较上月', type: 'up' as const }
    },
    {
      title: '退款率',
      value: '2.3',
      unit: '%',
      trend: { value: -0.5, label: '较上月', type: 'down' as const }
    }
  ],

  weeklyTrend: [
    { label: '周一', value: 980 },
    { label: '周二', value: 1230 },
    { label: '周三', value: 1150 },
    { label: '周四', value: 1380 },
    { label: '周五', value: 1560 },
    { label: '周六', value: 2100 },
    { label: '周日', value: 1890 }
  ],

  categoryDistribution: [
    { label: '电子产品', value: 2845, color: '#4f46e5' },
    { label: '服装鞋帽', value: 2134, color: '#06b6d4' },
    { label: '家居用品', value: 1823, color: '#16a34a' },
    { label: '食品饮料', value: 1256, color: '#d97706' },
    { label: '其他', value: 398, color: '#8b5cf6' }
  ],

  topProducts: [
    { rank: 1, label: 'iPhone 15 Pro Max', value: '¥892万', trend: 'up' as const },
    { rank: 2, label: 'MacBook Pro 14"', value: '¥645万', trend: 'up' as const },
    { rank: 3, label: 'iPad Air', value: '¥423万', trend: 'same' as const },
    { rank: 4, label: 'AirPods Pro', value: '¥312万', trend: 'down' as const },
    { rank: 5, label: 'Apple Watch', value: '¥287万', trend: 'up' as const }
  ],

  recentTransactions: [
    {
      id: 'TXN-2024-001',
      customer: '张三',
      product: 'iPhone 15 Pro Max',
      amount: '¥9,999',
      date: '2024-03-15 14:32',
      status: '已支付'
    },
    {
      id: 'TXN-2024-002',
      customer: '李四',
      product: 'MacBook Pro 14"',
      amount: '¥14,999',
      date: '2024-03-15 13:18',
      status: '已发货'
    },
    {
      id: 'TXN-2024-003',
      customer: '王五',
      product: 'iPad Air',
      amount: '¥4,799',
      date: '2024-03-15 11:45',
      status: '已完成'
    },
    {
      id: 'TXN-2024-004',
      customer: '赵六',
      product: 'AirPods Pro',
      amount: '¥1,899',
      date: '2024-03-15 10:22',
      status: '待发货'
    },
    {
      id: 'TXN-2024-005',
      customer: '钱七',
      product: 'Apple Watch',
      amount: '¥3,199',
      date: '2024-03-15 09:15',
      status: '已支付'
    }
  ],

  orderStatus: [
    { label: '已完成', status: 'success' as const, count: 2341 },
    { label: '待发货', status: 'warning' as const, count: 287 },
    { label: '已退款', status: 'danger' as const, count: 65 },
    { label: '处理中', status: 'neutral' as const, count: 154 }
  ]
}
