export const monthlyReportMock = {
  // 企业总数
  totalEnterprises: 500,
  totalVenues: 623,

  // 企业（场所）底数情况
  enterpriseOverview: [
    {
      title: '企业总数',
      value: '500',
      unit: '家',
      trend: { value: 5.2, label: '较上月', type: 'up' as const },
      description: '辖区内注册企业'
    },
    {
      title: '场所总数',
      value: '623',
      unit: '个',
      trend: { value: 3.8, label: '较上月', type: 'up' as const },
      description: '包括企业场所和公共场所'
    },
    {
      title: '重大风险企业',
      value: '12',
      unit: '家',
      trend: { value: -8.3, label: '较上月', type: 'down' as const },
      description: '重大风险等级企业'
    },
    {
      title: '重点消防单位',
      value: '45',
      unit: '家',
      trend: { value: 2.3, label: '较上月', type: 'up' as const },
      description: '重点消防监管单位'
    }
  ],

  // 企业风险等级分布
  enterpriseRiskDistribution: [
    { label: '重大风险', value: 12, color: '#dc2626' },
    { label: '较大风险', value: 35, color: '#d97706' },
    { label: '一般风险', value: 156, color: '#16a34a' },
    { label: '低风险', value: 297, color: '#06b6d4' }
  ],

  // 场所类型分布
  venueTypeDistribution: [
    { label: '重点消防单位', value: 45, color: '#dc2626' },
    { label: '一般单位', value: 356, color: '#d97706' },
    { label: '九小场所', value: 222, color: '#16a34a' }
  ],

  // 安全检查开展情况
  inspectionOverview: [
    {
      title: '开展检查企业',
      value: '425',
      unit: '家',
      trend: { value: 15.8, label: '环比', type: 'up' as const },
      description: '本月进行安全检查的企业'
    },
    {
      title: '检查覆盖率',
      value: '85%',
      unit: '',
      trend: { value: 8.5, label: '环比', type: 'up' as const },
      description: '开展检查企业/总企业'
    },
    {
      title: '检查次数',
      value: '892',
      unit: '次',
      trend: { value: 18.2, label: '环比', type: 'up' as const },
      description: '合计安全检查次数'
    },
    {
      title: '存量企业检查',
      value: '380',
      unit: '家',
      trend: { value: 12.3, label: '环比', type: 'up' as const },
      description: '上月已有企业的检查'
    }
  ],

  // 检查企业数趋势
  inspectionTrend: [
    { label: '10月', value: 325 },
    { label: '11月', value: 358 },
    { label: '12月', value: 378 },
    { label: '1月', value: 385 },
    { label: '2月', value: 367 },
    { label: '3月', value: 425 }
  ],

  // 检查次数趋势
  inspectionCountTrend: [
    { label: '10月', value: 685 },
    { label: '11月', value: 732 },
    { label: '12月', value: 758 },
    { label: '1月', value: 782 },
    { label: '2月', value: 755 },
    { label: '3月', value: 892 }
  ],

  // 隐患发现与整改情况
  hazardOverview: [
    {
      title: '发现隐患数',
      value: '234',
      unit: '项',
      trend: { value: 22.5, label: '环比', type: 'up' as const },
      description: '本月发现的隐患总数'
    },
    {
      title: '隐患发现率',
      value: '26.2%',
      unit: '',
      trend: { value: 3.2, label: '环比', type: 'up' as const },
      description: '隐患数/检查次数'
    },
    {
      title: '重大隐患',
      value: '15',
      unit: '项',
      trend: { value: -25.0, label: '环比', type: 'down' as const },
      description: '重大隐患数量'
    },
    {
      title: '隐患整改率',
      value: '89.2%',
      unit: '',
      trend: { value: 5.8, label: '环比', type: 'up' as const },
      description: '已整改/总隐患'
    }
  ],

  // 隐患总数
  totalHazards: 234,

  // 隐患等级分布
  hazardLevelDistribution: [
    { label: '重大隐患', value: 15, color: '#dc2626' },
    { label: '较大隐患', value: 45, color: '#d97706' },
    { label: '一般隐患', value: 120, color: '#16a34a' },
    { label: '轻微隐患', value: 54, color: '#06b6d4' }
  ],

  // 隐患整改状态
  hazardRectificationStatus: [
    { label: '已整改', status: 'success' as const, count: 209 },
    { label: '整改中', status: 'warning' as const, count: 18 },
    { label: '超期未整改', status: 'danger' as const, count: 7 }
  ],

  // 按企业风险等级统计表头
  enterpriseRiskColumns: [
    { key: 'riskLevel', label: '风险等级', width: '120px' },
    { key: 'enterpriseCount', label: '企业数', width: '100px' },
    { key: 'inspectedCount', label: '已检查', width: '100px' },
    { key: 'inspectionRate', label: '检查率', width: '100px' },
    { key: 'hazardCount', label: '隐患数', width: '100px' },
    { key: 'rectificationRate', label: '整改率', width: '100px' }
  ],

  // 按企业风险等级统计数据
  enterpriseRiskData: [
    {
      riskLevel: '重大风险',
      enterpriseCount: '12',
      inspectedCount: '12',
      inspectionRate: '100%',
      hazardCount: '45',
      rectificationRate: '82.2%'
    },
    {
      riskLevel: '较大风险',
      enterpriseCount: '35',
      inspectedCount: '35',
      inspectionRate: '100%',
      hazardCount: '68',
      rectificationRate: '88.2%'
    },
    {
      riskLevel: '一般风险',
      enterpriseCount: '156',
      inspectedCount: '138',
      inspectionRate: '88.5%',
      hazardCount: '89',
      rectificationRate: '91.0%'
    },
    {
      riskLevel: '低风险',
      enterpriseCount: '297',
      inspectedCount: '240',
      inspectionRate: '80.8%',
      hazardCount: '32',
      rectificationRate: '93.8%'
    },
    {
      riskLevel: '合计',
      enterpriseCount: '500',
      inspectedCount: '425',
      inspectionRate: '85.0%',
      hazardCount: '234',
      rectificationRate: '89.2%'
    }
  ],

  // 按场所类型统计表头
  venueTypeColumns: [
    { key: 'venueType', label: '场所类型', width: '120px' },
    { key: 'venueCount', label: '场所数', width: '100px' },
    { key: 'inspectedCount', label: '已检查', width: '100px' },
    { key: 'inspectionRate', label: '检查率', width: '100px' },
    { key: 'hazardCount', label: '隐患数', width: '100px' },
    { key: 'rectificationRate', label: '整改率', width: '100px' }
  ],

  // 按场所类型统计数据
  venueTypeData: [
    {
      venueType: '重点消防单位',
      venueCount: '45',
      inspectedCount: '45',
      inspectionRate: '100%',
      hazardCount: '58',
      rectificationRate: '86.2%'
    },
    {
      venueType: '一般单位',
      venueCount: '356',
      inspectedCount: '312',
      inspectionRate: '87.6%',
      hazardCount: '142',
      rectificationRate: '90.1%'
    },
    {
      venueType: '九小场所',
      venueCount: '222',
      inspectedCount: '178',
      inspectionRate: '80.2%',
      hazardCount: '34',
      rectificationRate: '94.1%'
    },
    {
      venueType: '合计',
      venueCount: '623',
      inspectedCount: '535',
      inspectionRate: '85.9%',
      hazardCount: '234',
      rectificationRate: '89.2%'
    }
  ],

  // 工作建议
  workSuggestions: [
    {
      title: '加强重大风险企业监管',
      description: '重大风险企业检查率已达100%，但整改率仅82.2%，建议增加专家跟进频次，确保重大隐患及时闭环。对超期未整改的7项重大隐患，建议启动约谈程序。',
      priority: '高',
      department: '应消站'
    },
    {
      title: '提升低风险企业检查覆盖率',
      description: '低风险企业检查率为80.8%，低于整体平均水平。建议优化专家精力分配，在保证重点企业监管的同时，提高低风险企业的年度检查覆盖率至85%以上。',
      priority: '中',
      department: '应消站'
    },
    {
      title: '强化九小场所隐患排查',
      description: '九小场所检查率80.2%，但隐患发现率较低（15.5%），可能存在检查深度不足的问题。建议加强九小场所专项检查培训，提升隐患识别能力。',
      priority: '中',
      department: '各社区'
    },
    {
      title: '建立隐患整改长效机制',
      description: '本月隐患整改率89.2%，较上月提升5.8%，成效明显。建议建立隐患整改预警机制，对逾期3天的隐患自动提醒，逾期7天的隐患升级督办。',
      priority: '中',
      department: '运营团队'
    },
    {
      title: '优化专家资源配置',
      description: '当前专家人均管理企业数约100家，建议根据企业风险等级动态调整专家服务频次：重大风险企业每月1次、较大风险企业每季度1次、一般和低风险企业每半年1次。',
      priority: '低',
      department: '应消站'
    }
  ]
}
