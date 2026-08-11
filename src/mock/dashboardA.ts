export const dashboardAMock = {
  kpiMetrics: [
    {
      title: '总客户数',
      value: '12,847',
      unit: '家',
      trend: { value: 12.5, label: '较上月', type: 'up' as const }
    },
    {
      title: '活跃客户数',
      value: '9,234',
      unit: '家',
      trend: { value: 8.3, label: '较上月', type: 'up' as const }
    },
    {
      title: '新增客户',
      value: '458',
      unit: '家',
      trend: { value: -2.1, label: '较上月', type: 'down' as const }
    },
    {
      title: '客户流失率',
      value: '3.2',
      unit: '%',
      trend: { value: -0.8, label: '较上月', type: 'up' as const }
    }
  ],

  monthlyTrend: [
    { label: '1月', value: 8500 },
    { label: '2月', value: 9200 },
    { label: '3月', value: 9800 },
    { label: '4月', value: 10500 },
    { label: '5月', value: 11200 },
    { label: '6月', value: 12100 },
    { label: '7月', value: 11500 },
    { label: '8月', value: 12000 },
    { label: '9月', value: 12600 },
    { label: '10月', value: 12400 },
    { label: '11月', value: 12800 },
    { label: '12月', value: 12847 }
  ],

  industryDistribution: [
    { label: '制造业', value: 3850, color: '#4f46e5' },
    { label: '零售业', value: 2569, color: '#06b6d4' },
    { label: '服务业', value: 2311, color: '#16a34a' },
    { label: '科技行业', value: 1927, color: '#d97706' },
    { label: '其他', value: 2190, color: '#8b5cf6' }
  ],

  topCustomers: [
    { rank: 1, label: '华为技术有限公司', value: '¥2,850万', trend: 'up' as const },
    { rank: 2, label: '阿里巴巴集团', value: '¥2,340万', trend: 'up' as const },
    { rank: 3, label: '腾讯科技', value: '¥1,980万', trend: 'same' as const },
    { rank: 4, label: '字节跳动', value: '¥1,650万', trend: 'down' as const },
    { rank: 5, label: '美团点评', value: '¥1,420万', trend: 'up' as const }
  ],

  recentOrders: {
    columns: [
      { key: 'id', label: '订单号', width: '120px' },
      { key: 'customer', label: '客户', width: '150px' },
      { key: 'product', label: '产品', width: '180px' },
      { key: 'amount', label: '金额', width: '100px' },
      { key: 'date', label: '日期', width: '100px' },
      { key: 'status', label: '状态', width: '80px' }
    ],
    data: [
      {
        id: 'ORD-2024-001',
        customer: '华为技术有限公司',
        product: '企业版年度订阅',
        amount: '¥128,000',
        date: '2024-03-15',
        status: '已完成'
      },
      {
        id: 'ORD-2024-002',
        customer: '阿里巴巴集团',
        product: '专业版月度订阅',
        amount: '¥45,600',
        date: '2024-03-14',
        status: '处理中'
      },
      {
        id: 'ORD-2024-003',
        customer: '腾讯科技',
        product: '企业版季度订阅',
        amount: '¥89,500',
        date: '2024-03-13',
        status: '已完成'
      },
      {
        id: 'ORD-2024-004',
        customer: '字节跳动',
        product: '专业版年度订阅',
        amount: '¥156,000',
        date: '2024-03-12',
        status: '待付款'
      },
      {
        id: 'ORD-2024-005',
        customer: '美团点评',
        product: '基础版月度订阅',
        amount: '¥12,800',
        date: '2024-03-11',
        status: '已完成'
      }
    ]
  },

  serviceStatus: [
    { label: '服务正常', status: 'success' as const, count: 156 },
    { label: '需要关注', status: 'warning' as const, count: 23 },
    { label: '异常告警', status: 'danger' as const, count: 5 },
    { label: '维护中', status: 'neutral' as const, count: 8 }
  ]
}
