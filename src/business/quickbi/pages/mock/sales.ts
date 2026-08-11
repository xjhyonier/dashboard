export const salesMock = {
  coreMetrics: [
    {
      title: '本月销售额',
      value: '¥1,456万',
      unit: '',
      trend: { value: 18.5, label: '较上月', type: 'up' as const }
    },
    {
      title: '订单数量',
      value: '328',
      unit: '笔',
      trend: { value: 12.3, label: '较上月', type: 'up' as const }
    },
    {
      title: '客户转化率',
      value: '23.5%',
      unit: '',
      trend: { value: 5.2, label: '较上月', type: 'up' as const }
    },
    {
      title: '回款率',
      value: '89.2%',
      unit: '',
      trend: { value: 3.8, label: '较上月', type: 'up' as const }
    }
  ],

  salesTrend: [
    { label: '1月', value: 980 },
    { label: '2月', value: 1050 },
    { label: '3月', value: 1120 },
    { label: '4月', value: 1180 },
    { label: '5月', value: 1250 },
    { label: '6月', value: 1320 },
    { label: '7月', value: 1280 },
    { label: '8月', value: 1350 },
    { label: '9月', value: 1400 },
    { label: '10月', value: 1420 },
    { label: '11月', value: 1440 },
    { label: '12月', value: 1456 }
  ],

  industryDistribution: [
    { label: '制造业', value: 32, color: '#4f46e5' },
    { label: '零售业', value: 28, color: '#06b6d4' },
    { label: '服务业', value: 22, color: '#16a34a' },
    { label: '科技行业', value: 18, color: '#d97706' }
  ],

  topSalespeople: [
    { rank: 1, label: '张三', value: '¥256万', trend: 'up' as const },
    { rank: 2, label: '李四', value: '¥198万', trend: 'up' as const },
    { rank: 3, label: '王五', value: '¥167万', trend: 'same' as const },
    { rank: 4, label: '赵六', value: '¥145万', trend: 'down' as const },
    { rank: 5, label: '钱七', value: '¥128万', trend: 'up' as const }
  ],

  customerStatus: [
    { label: '活跃客户', status: 'success' as const, count: 156 },
    { label: '潜力客户', status: 'warning' as const, count: 45 },
    { label: '流失风险', status: 'danger' as const, count: 12 },
    { label: '待跟进', status: 'neutral' as const, count: 28 }
  ],

  orderColumns: [
    { key: 'orderId', label: '订单编号', width: '120px' },
    { key: 'customer', label: '客户名称', width: '180px' },
    { key: 'product', label: '产品', width: '150px' },
    { key: 'amount', label: '金额', width: '100px' },
    { key: 'date', label: '日期', width: '100px' },
    { key: 'status', label: '状态', width: '80px' }
  ],

  recentOrders: [
    {
      orderId: 'ORD-001',
      customer: '华为技术有限公司',
      product: '企业版年度订阅',
      amount: '¥128,000',
      date: '2024-03-30',
      status: '已完成'
    },
    {
      orderId: 'ORD-002',
      customer: '阿里巴巴集团',
      product: '专业版月度订阅',
      amount: '¥45,600',
      date: '2024-03-29',
      status: '处理中'
    },
    {
      orderId: 'ORD-003',
      customer: '腾讯科技',
      product: '企业版季度订阅',
      amount: '¥89,500',
      date: '2024-03-28',
      status: '已完成'
    }
  ]
}
