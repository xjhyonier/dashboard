/**
 * 数据生成脚本 - 生成大量模拟企业数据
 * 运行方式：在浏览器控制台执行或导入到 db/index.ts
 */

// 企业名称生成库 - 模拟真实企业命名规则
// 结构：行政区划(可选) + 字号(2-4字) + 行业 + 组织形式

// 行政区划（可选，约30%概率添加）
const REGIONS = [
  '杭州', '余杭', '良渚', '勾庄', '瓶窑', '仓前', '径山', '闲林', '五常',
  '浙江', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '衢州', '舟山', '台州', '丽水',
]

// 字号（核心名称）- 2-4字的组合
const NAME_CHARS_PART1 = [
  '鑫', '华', '永', '宏', '盛', '金', '银', '祥', '福', '顺', '天', '地', '东', '西',
  '安', '全', '诚', '信', '达', '通', '广', '发', '正', '泰', '瑞', '昌', '润', '丰',
  '裕', '腾', '飞', '龙', '凤', '长', '大', '中', '新', '兴', '凯', '博', '远', '恒',
  '伟', '强', '光', '明', '佳', '美', '德', '建', '国', '民', '力', '利', '优', '特',
]

const NAME_CHARS_PART2 = [
  '盛', '达', '昌', '隆', '兴', '源', '茂', '业', '邦', '泰', '和', '祥', '瑞', '丰',
  '茂', '伟', '强', '刚', '勇', '毅', '俊', '峰', '涛', '杰', '军', '辉', '华', '明',
  '鑫', '诚', '信', '德', '仁', '义', '礼', '智', '勇', '文', '武', '斌', '彬', '才',
  '成', '栋', '梁', '材', '林', '森', '松', '柏', '海', '江', '河', '湖', '川', '山',
]

// 行业特征词
const INDUSTRIES = [
  '化工', '新材料', '建材', '金属制品', '物流', '制药', '机械', '电子科技',
  '纺织', '食品', '服装', '包装', '印务', '塑胶', '家具', '陶瓷', '玻璃制品',
  '钢结构', '电缆', '阀门', '轴承', '模具', '铸造', '锻造', '热处理',
  '仓储', '贸易', '网络科技', '实业', '投资', '建设', '工程', '环保科技',
  '运输', '租赁', '物业', '酒店', '餐饮', '旅游', '教育咨询', '医疗器械',
  '自动化设备', '精密仪器', '新能源', '生物科技', '智能装备', '电气设备',
  '汽配', '五金', '橡塑', '纸制品', '印刷', '印染', '绣花', '织造',
]

// 组织形式
const COMPANY_TYPES = [
  '有限公司', '股份有限公司', '有限责任公司', '厂', '中心', '部', '店',
  '集团有限公司', '实业有限公司', '科技有限公司', '发展有限公司',
]

const EXPERT_IDS = ['ep-001', 'ep-002', 'ep-003', 'ep-004', 'ep-005']
const WORK_GROUPS = ['物流片安全组', '良渚片重大', '良渚片较大', '勾庄片重大', '勾庄片较大']
const CATEGORIES = ['production', 'fire_key', 'general']
const RISK_LEVELS = ['重大风险', '较大风险', '一般风险', '低风险']

// 生成随机企业ID
function generateEnterpriseId(index: number): string {
  return `ent_${index.toString().padStart(5, '0')}`
}

// 生成随机企业名称
// 格式：[行政区划] + 字号(2-4字) + 行业 + 组织形式
function generateEnterpriseName(): string {
  // 30%概率添加行政区划
  const hasRegion = Math.random() < 0.3
  const region = hasRegion ? REGIONS[Math.floor(Math.random() * REGIONS.length)] : ''

  // 字号：2-4字组合
  const nameLength = 2 + Math.floor(Math.random() * 3) // 2,3,4
  let brandName = ''
  for (let i = 0; i < nameLength; i++) {
    const pool = i % 2 === 0 ? NAME_CHARS_PART1 : NAME_CHARS_PART2
    brandName += pool[Math.floor(Math.random() * pool.length)]
  }

  // 行业
  const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)]

  // 组织形式
  const companyType = COMPANY_TYPES[Math.floor(Math.random() * COMPANY_TYPES.length)]

  return `${region}${brandName}${industry}${companyType}`
}

// 根据风险等级生成AI评分
function generateAiScore(riskLevel: string): number {
  switch (riskLevel) {
    case '重大风险': return Math.floor(Math.random() * 30) // 0-29
    case '较大风险': return 30 + Math.floor(Math.random() * 30) // 30-59
    case '一般风险': return 60 + Math.floor(Math.random() * 25) // 60-84
    case '低风险': return 85 + Math.floor(Math.random() * 16) // 85-100
    default: return Math.floor(Math.random() * 100)
  }
}

// 生成企业数据
export function generateEnterprises(count: number = 300) {
  const enterprises = []
  const now = new Date().toISOString().split('T')[0]

  // 风险等级分布（模拟真实情况）
  const riskDistribution = {
    '重大风险': 0.08,   // 8%
    '较大风险': 0.22,  // 22%
    '一般风险': 0.45,  // 45%
    '低风险': 0.25     // 25%
  }

  for (let i = 1; i <= count; i++) {
    // 根据分布随机选择风险等级
    const rand = Math.random()
    let riskLevel = '一般风险'
    let cumulative = 0
    for (const [level, prob] of Object.entries(riskDistribution)) {
      cumulative += prob
      if (rand < cumulative) {
        riskLevel = level
        break
      }
    }

    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    const workGroup = WORK_GROUPS[Math.floor(Math.random() * WORK_GROUPS.length)]
    const expertId = EXPERT_IDS[Math.floor(Math.random() * EXPERT_IDS.length)]

    enterprises.push({
      id: generateEnterpriseId(i),
      name: generateEnterpriseName(),
      category,
      risk_level: riskLevel,
      ai_score: generateAiScore(riskLevel),
      work_group: workGroup,
      expert_id: expertId,
      created_at: now,
      updated_at: now,
    })
  }

  return enterprises
}

// 生成隐患数据
export function generateHazards(enterpriseIds: string[], expertIds: string[]) {
  const hazards = []
  const levels = ['major', 'high', 'normal', 'low']
  const statuses = ['pending', 'in_progress', 'rectified', 'verified']
  const sources = ['self_check', 'platform', 'third_party']

  const hazardTitles = [
    '储罐区未设置防雷接地', '应急物资过期未更换', '部分灭火器压力不足',
    '破碎车间粉尘浓度超标', '特种作业人员证书过期', '输送带缺少防护罩',
    '操作规程未上墙', '停车场缺少消防栓', '实验室废液存放不规范',
    '配电箱缺少漏电保护', '安全通道堵塞', '消防栓水压不足',
    '电梯检验合格证过期', '叉车未定期年检', '危化品储存超量',
    '高处作业未系安全带', '有限空间作业未进行气体检测',
    '吊装作业无警戒区域', '动火作业未办理审批',
    '员工未参加年度安全培训', '职业病危害告知卡缺失',
  ]

  // 约40%的企业有隐患
  const enterpriseCount = Math.floor(enterpriseIds.length * 0.4)
  const selectedEnterprises = enterpriseIds
    .sort(() => Math.random() - 0.5)
    .slice(0, enterpriseCount)

  selectedEnterprises.forEach((entId, entIndex) => {
    // 每个企业1-3条隐患
    const hazardCount = 1 + Math.floor(Math.random() * 3)

    for (let i = 0; i < hazardCount; i++) {
      const createdDate = new Date()
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60))

      const level = levels[Math.floor(Math.random() * levels.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      hazards.push({
        enterprise_id: entId,
        source: sources[Math.floor(Math.random() * sources.length)],
        level,
        status,
        title: hazardTitles[Math.floor(Math.random() * hazardTitles.length)],
        created_at: createdDate.toISOString().split('T')[0],
        expert_id: expertIds[Math.floor(Math.random() * expertIds.length)],
      })
    }
  })

  return hazards
}

// 生成任务数据
export function generateTasks(enterpriseIds: string[], expertIds: string[]) {
  const tasks = []
  const taskTypes = ['risk_check', 'hazard_review', 'consult', 'onsite', 'hazard_issue']
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled']

  const taskTitles = [
    '核对AI风险评级', '复核储罐区防雷隐患', '回复废液处理咨询',
    '现场核查停车场消防', '下发粉尘超标整改通知', '组织安全培训',
    '审核企业应急预案', '现场检查安全生产条件', '整改情况跟踪',
    '专家驻点服务', '隐患整改验收',
  ]

  // 约60%的企业有任务
  const enterpriseCount = Math.floor(enterpriseIds.length * 0.6)
  const selectedEnterprises = enterpriseIds
    .sort(() => Math.random() - 0.5)
    .slice(0, enterpriseCount)

  selectedEnterprises.forEach((entId) => {
    const taskCount = 1 + Math.floor(Math.random() * 2)

    for (let i = 0; i < taskCount; i++) {
      const createdDate = new Date()
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30))

      tasks.push({
        enterprise_id: entId,
        expert_id: expertIds[Math.floor(Math.random() * expertIds.length)],
        task_type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
        title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
        priority: 1 + Math.floor(Math.random() * 4),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: createdDate.toISOString().split('T')[0],
      })
    }
  })

  return tasks
}

// 企业端安全业务活动维度定义（新版扩展）
export const ENTERPRISE_DIMENSIONS = [
  { name: 'info_collection', label: '信息采集', type: 'boolean' },
  { name: 'data_authorized', label: '数据授权', type: 'boolean' },
  { name: 'risk_point_identified', label: '风险点识别', type: 'boolean' },
  { name: 'safety_org_duty_rate', label: '机构职责', type: 'number' },
  { name: 'safety_system_rate', label: '安全制度', type: 'number' },
  { name: 'safety_invest_rate', label: '安全投入', type: 'number' },
  { name: 'inspection_plan_type', label: '检查计划', type: 'string' },
  { name: 'inspection_execution', label: '检查执行', type: 'string' },
  { name: 'third_party_sync', label: '第三方同步', type: 'string' },
  { name: 'patrol_used', label: '安全巡查', type: 'string' },
  { name: 'training_done', label: '培训开展', type: 'boolean' },
  { name: 'training_has_record', label: '培训台账', type: 'boolean' },
  { name: 'work_permit_count', label: '作业票报备', type: 'number' },
  { name: 'hazard_self_check', label: '自查隐患', type: 'number' },
  { name: 'hazard_platform', label: '平台隐患', type: 'number' },
  { name: 'hazard_major', label: '重大隐患', type: 'number' },
  { name: 'hazard_rectify_status', label: '整改进展', type: 'string' },
  // 新增：核心监管指标
  { name: 'inspection_count', label: '当月检查次数', type: 'number' },
  { name: 'hazard_rectified', label: '已整改隐患数', type: 'number' },
  { name: 'enforcement_count', label: '执法立案数', type: 'number' },
]

// 生成企业维度数据（新版扩展字段）
export function generateEnterpriseDimensions(enterpriseIds: string[]) {
  const dimensions = []
  const now = new Date().toISOString().split('T')[0]

  enterpriseIds.forEach(entId => {
    // 基础完成度：约80%的企业已完成信息采集
    const infoCollection = Math.random() < 0.8
    // 约75%的企业已数据授权
    const dataAuthorized = Math.random() < 0.75
    // 约70%的企业已完成风险点识别
    const riskPointIdentified = Math.random() < 0.7

    // 根据企业合规程度生成数值型维度
    // 合规度高的企业各维度分数较高
    const complianceLevel = Math.random()

    // 安全制度3维度 - 百分比（0-100%）
    const safetyOrgDutyRate = infoCollection ? Math.floor(50 + Math.random() * 50 * complianceLevel) : 0
    const safetySystemRate = infoCollection ? Math.floor(40 + Math.random() * 60 * complianceLevel) : 0
    const safetyInvestRate = infoCollection ? Math.floor(30 + Math.random() * 70 * complianceLevel) : 0

    // 检查计划类型：按周/按月/按季/否
    const planTypes: ('weekly' | 'monthly' | 'quarterly' | 'none')[] = ['weekly', 'monthly', 'quarterly', 'none']
    const inspectionPlanType = planTypes[Math.floor(Math.random() * planTypes.length)]
    
    // 检查执行：是/否/强制
    const execTypes: ('yes' | 'no' | 'forced')[] = ['yes', 'no', 'forced']
    const inspectionExecution = inspectionPlanType !== 'none' 
      ? (Math.random() < 0.7 ? 'yes' : Math.random() < 0.5 ? 'forced' : 'no')
      : 'no'

    // 第三方同步：是/否/非强制
    const thirdPartyOptions: ('yes' | 'no' | 'optional')[] = ['yes', 'no', 'optional']
    const thirdPartySync = thirdPartyOptions[Math.floor(Math.random() * thirdPartyOptions.length)]
    
    // 安全巡查随手拍：是/否/非强制
    const patrolOptions: ('yes' | 'no' | 'optional')[] = ['yes', 'no', 'optional']
    const patrolUsed = patrolOptions[Math.floor(Math.random() * patrolOptions.length)]

    // 教育培训：是否开展 + 是否有台账
    const trainingDone = Math.random() < 0.6
    const trainingHasRecord = trainingDone && Math.random() < 0.7

    // 作业票报备：非强制，有数量即表示已报备
    const workPermitCount = Math.floor(Math.random() * 10 * complianceLevel)

    // 隐患统计
    const hazardSelfCheck = Math.floor(Math.random() * 10 * (1 - complianceLevel * 0.5))
    const hazardPlatform = Math.floor(Math.random() * 5 * (1 - complianceLevel))
    const hazardMajor = Math.random() < 0.15 ? Math.floor(Math.random() * 3) : 0
    
    // 整改进展：已整改/未整改/部分已整改/逾期未整改
    const totalHazards = hazardSelfCheck + hazardPlatform + hazardMajor
    const rectifyStatuses: ('completed' | 'uncompleted' | 'partial' | 'overdue')[] = 
      totalHazards === 0 
        ? ['completed'] 
        : ['completed', 'uncompleted', 'partial', 'overdue']
    const hazardRectifyStatus = rectifyStatuses[Math.floor(Math.random() * rectifyStatuses.length)]

    // 构建维度数据
    const dimensionValues: Record<string, boolean | number | string> = {
      info_collection: infoCollection,
      data_authorized: dataAuthorized,
      risk_point_identified: riskPointIdentified,
      safety_org_duty_rate: safetyOrgDutyRate,
      safety_system_rate: safetySystemRate,
      safety_invest_rate: safetyInvestRate,
      inspection_plan_type: inspectionPlanType,
      inspection_execution: inspectionExecution,
      third_party_sync: thirdPartySync,
      patrol_used: patrolUsed,
      training_done: trainingDone,
      training_has_record: trainingHasRecord,
      work_permit_count: workPermitCount,
      hazard_self_check: hazardSelfCheck,
      hazard_platform: hazardPlatform,
      hazard_major: hazardMajor,
      hazard_rectify_status: hazardRectifyStatus,
      // 新增：核心监管指标
      inspection_count: Math.floor(Math.random() * 5),  // 当月检查次数 0-4
      hazard_rectified: Math.floor(Math.random() * (hazardSelfCheck + hazardPlatform + 1)),  // 已整改隐患数
      enforcement_count: Math.random() < 0.1 ? 1 : 0,  // 执法立案数（10%概率有）
    }

    // 插入所有维度
    Object.entries(dimensionValues).forEach(([name, value]) => {
      dimensions.push({
        enterprise_id: entId,
        dimension_name: name,
        dimension_value: String(value),
        recorded_at: now,
      })
    })
  })

  return dimensions
}

// 导出数据生成函数，供外部使用
export const dataGenerator = {
  generateEnterprises,
  generateHazards,
  generateTasks,
}

export default dataGenerator
