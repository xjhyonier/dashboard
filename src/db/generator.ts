/**
 * 应急管理数据生成器
 * 
 * 生成符合数据模型的 mock 数据（200家企业）
 */

import {
  // 类型
  Enterprise,
  EnterpriseDimensions,
  EnterpriseStatePath,
  StatePathNode,
  Hazard,
  HazardHistory,
  RiskPoint,
  RiskPointControl,
  RiskPointRecord,
  Expert,
  ExpertDimensionScore,
  ExpertPlatformBehavior,
  ExpertWorkload,
  GovernmentMember,
  WorkGroup,
  Task,
  HazardDimension,
  HazardSourceDetail,
  // 枚举
  RiskLevel,
  HazardLevel,
  HazardStatus,
  HazardSource,
  RiskPointLevel,
  RiskPointType,
  RiskPointControlStatus,
  CheckFrequency,
  PlanType,
  GovernmentPosition,
  StateNodeStatus,
  RectifyStatus,
  VerifyResult,
  ExpertWorkType,
} from './types'

// ==================== 工具函数 ====================

/** 生成 UUID */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 生成随机日期（过去N天内） */
function randomPastDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * days))
  return date.toISOString().split('T')[0]
}

/** 生成随机日期时间 */
function randomPastDateTime(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * days))
  date.setHours(Math.floor(Math.random() * 24))
  date.setMinutes(Math.floor(Math.random() * 60))
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

/** 从数组中随机选择 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 生成随机整数 */
function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/** 从枚举数组中随机选择 */
function pickEnum<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]
}

/** 按权重随机选择风险点级别 */
function pickRiskPointLevel(): RiskPointLevel {
  const total = Object.values(RISK_POINT_LEVEL_WEIGHTS).reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (const [level, weight] of Object.entries(RISK_POINT_LEVEL_WEIGHTS)) {
    rand -= weight
    if (rand <= 0) return level as RiskPointLevel
  }
  return '低'
}

// ==================== 静态数据 ====================

const INDUSTRIES = ['工业企业', '仓储物流', '小微企业', '危化使用', '九小场所', '出租房', '沿街店铺']
const CATEGORIES = ['生产型企业', '经营型企业', '储存型企业', '使用型企业', '场所类']
const RISK_LEVELS: RiskLevel[] = ['重大', '较大', '一般', '低']
const ENTERPRISE_STATUSES = ['在业', '停产', '注销']

const HAZARD_LEVELS: HazardLevel[] = ['重大隐患', '一般隐患']
const HAZARD_STATUSES: HazardStatus[] = ['pending', 'rectifying', 'rectified', 'verified', 'rejected', 'overdue', 'closed']
const HAZARD_SOURCES: HazardSource[] = ['expert', 'enterprise']
const HAZARD_DIMENSIONS: HazardDimension[] = ['机构职责', '安全投入', '教育培训', '安全制度', '双重预防', '事故管理', '应急管理']
const HAZARD_SOURCE_DETAILS: HazardSourceDetail[] = ['ai评估', '一企一档', '视频看', '现场看', '其他']
const VERIFY_RESULTS: VerifyResult[] = ['pass', 'fail']

const RISK_POINT_LEVELS: RiskPointLevel[] = ['重大', '较大', '一般', '低']
// 风险点级别权重（越高级别越少）
const RISK_POINT_LEVEL_WEIGHTS: Record<RiskPointLevel, number> = {
  '重大': 5,   // 5%
  '较大': 15,  // 15%
  '一般': 30,  // 30%
  '低': 50,    // 50%
}

const RISK_POINT_TYPES: RiskPointType[] = ['用电安全', '消防安全', '机械设备', '危化品储存', '有限空间', '高处作业', '动火作业', '特种设备', '职业卫生', '其他']
const RISK_POINT_STATUSES: RiskPointControlStatus[] = ['未管控', '管控中', '已消除', '已失效']
const CHECK_FREQUENCIES: CheckFrequency[] = ['每日', '每周', '每月', '每季度', '每年', '不定期']
const PLAN_TYPES: PlanType[] = ['weekly', 'monthly', 'quarterly', 'none']
const RECTIFY_STATUSES: RectifyStatus[] = ['completed', 'uncompleted', 'partial', 'overdue']
const WORK_TYPES: ExpertWorkType[] = ['现场检查', '视频巡查', 'AI巡查', '隐患复查', '专家会诊', '安全培训', '其他']

const GOVERNMENT_POSITIONS: GovernmentPosition[] = ['组长', '副站长', '组员']

// 行政区划
const REGIONS = ['余杭区', '良渚街道', '勾庄街道', '瓶窑镇', '仓前街道', '径山镇', '闲林街道', '五常街道']
// 街道/路名
const STREETS = ['文昌路', '好运路', '通运路', '网周路', '舒心路', '博园路', '棕榈路', '莫干山路', '杭行路', '良运街']

// 真实企业字号词库
const BRAND_CHARS_1 = ['鑫', '华', '永', '宏', '盛', '金', '祥', '福', '顺', '天', '安', '诚', '信', '达', '通', '广', '正', '泰', '瑞', '昌', '润', '丰', '裕', '腾', '飞', '龙', '凤', '长', '大', '中', '新', '兴', '凯', '博', '远', '恒', '伟', '强', '光', '明', '佳', '美', '德', '建', '力', '优', '特', '森', '林', '海', '江', '河', '湖', '川', '山', '松', '柏', '栋', '梁', '辉', '杰', '涛', '峰', '俊', '勇', '刚', '宇', '轩', '泽', '文', '武', '斌', '才', '成', '仁', '义', '礼', '智']
const BRAND_CHARS_2 = ['盛', '达', '昌', '隆', '兴', '源', '茂', '业', '邦', '和', '祥', '瑞', '丰', '伟', '强', '刚', '勇', '毅', '俊', '峰', '涛', '杰', '军', '辉', '明', '鑫', '诚', '信', '德', '仁', '义', '礼', '智', '勇', '文', '武', '斌', '才', '成', '栋', '梁', '材', '林', '森', '松', '柏', '海', '江', '河', '湖', '川', '山', '轩', '泽', '宇']

// 按行业分类的企业名称关键词
const ENTERPRISE_KEYWORDS: Record<string, string[]> = {
  '工业企业': ['机械', '电子', '化工', '纺织', '食品', '服装', '印刷', '包装', '塑胶', '五金', '建材', '家具', '橡塑', '纸制品', '印染', '铸造', '钢结构', '电缆', '阀门', '轴承', '模具'],
  '仓储物流': ['物流', '仓储', '运输', '供应链', '货运', '配送'],
  '小微企业': ['商贸', '商行', '经营部', '服务中心', '工作室', '商超', '门店'],
  '危化使用': ['化工', '溶剂', '涂料', '胶粘剂', '油墨', '树脂'],
  '九小场所': ['餐饮', '旅馆', '网吧', '浴室', '理发店', '超市', '药店', '棋牌室'],
  '出租房': ['公寓', '出租', '宿舍'],
  '沿街店铺': ['商行', '专卖店', '门店', '店铺', '商超'],
  'default': ['科技', '实业', '贸易', '建设', '工程', '环保', '租赁', '物业', '酒店', '汽配', '制药', '新材料']
}

// 组织形式
const COMPANY_TYPES = ['有限公司', '股份有限公司', '有限责任公司', '厂', '中心', '部', '店', '集团有限公司', '实业有限公司', '科技有限公司', '发展有限公司']

// 专家姓名
const EXPERT_NAMES = ['张建国', '李红梅', '王志强', '刘文华', '陈晓峰', '赵敏', '孙伟明', '周丽华', '吴强', '郑海涛', '王秀英', '李明辉']

// 政府人员姓名（从工作组成员中提取）
const GOVERNMENT_NAMES = ['金锋永', '张义', '李磊', '吴灿刚', '孙中振', '李旭燕', '余国生', '仝运槐', '张杭伟', '洪涛', '陈伟', '王创达', '沈泽东', '李宏华', '梁新舒', '陈涛', '陈超', '郑富彬', '杨宇天', '张平水', '施伟奇', '刘浩鑫']

// 工作组成员静态数据
const WORK_GROUP_MEMBERS: { workGroup: string; name: string; position: '组长' | '副站长' | '组员' }[] = [
  // 勾庄片较大
  { workGroup: '勾庄片较大', name: '金锋永', position: '组长' },
  { workGroup: '勾庄片较大', name: '张义', position: '副站长' },
  { workGroup: '勾庄片较大', name: '李磊', position: '组员' },
  { workGroup: '勾庄片较大', name: '吴灿刚', position: '组员' },
  // 勾庄片场所组
  { workGroup: '勾庄片场所组', name: '孙中振', position: '组长' },
  { workGroup: '勾庄片场所组', name: '李旭燕', position: '组长' },
  { workGroup: '勾庄片场所组', name: '余国生', position: '副站长' },
  { workGroup: '勾庄片场所组', name: '仝运槐', position: '组员' },
  { workGroup: '勾庄片场所组', name: '张杭伟', position: '组员' },
  // 物流片场所组
  { workGroup: '物流片场所组', name: '洪涛', position: '组长' },
  { workGroup: '物流片场所组', name: '陈伟', position: '组长' },
  { workGroup: '物流片场所组', name: '余国生', position: '副站长' },
  { workGroup: '物流片场所组', name: '王创达', position: '组员' },
  // 良渚片场所组
  { workGroup: '良渚片场所组', name: '沈泽东', position: '组长' },
  { workGroup: '良渚片场所组', name: '李宏华', position: '组长' },
  { workGroup: '良渚片场所组', name: '余国生', position: '副站长' },
  { workGroup: '良渚片场所组', name: '梁新舒', position: '组员' },
  { workGroup: '良渚片场所组', name: '陈涛', position: '组员' },
  // 物流片安全组
  { workGroup: '物流片安全组', name: '洪涛', position: '组长' },
  { workGroup: '物流片安全组', name: '陈伟', position: '组长' },
  { workGroup: '物流片安全组', name: '张义', position: '副站长' },
  { workGroup: '物流片安全组', name: '王创达', position: '组员' },
  { workGroup: '物流片安全组', name: '吴灿刚', position: '组员' },
  // 良渚片重大
  { workGroup: '良渚片重大', name: '陈超', position: '组长' },
  { workGroup: '良渚片重大', name: '张义', position: '副站长' },
  { workGroup: '良渚片重大', name: '郑富彬', position: '组员' },
  { workGroup: '良渚片重大', name: '吴灿刚', position: '组员' },
  // 良渚片较大
  { workGroup: '良渚片较大', name: '杨宇天', position: '组长' },
  { workGroup: '良渚片较大', name: '张义', position: '副站长' },
  { workGroup: '良渚片较大', name: '张平水', position: '组员' },
  { workGroup: '良渚片较大', name: '吴灿刚', position: '组员' },
  // 勾庄片重大
  { workGroup: '勾庄片重大', name: '施伟奇', position: '组长' },
  { workGroup: '勾庄片重大', name: '张义', position: '副站长' },
  { workGroup: '勾庄片重大', name: '刘浩鑫', position: '组员' },
  { workGroup: '勾庄片重大', name: '吴灿刚', position: '组员' },
]

// 隐患标题
const HAZARD_TITLES = [
  '储罐区未设置防雷接地', '应急物资过期未更换', '部分灭火器压力不足',
  '破碎车间粉尘浓度超标', '特种作业人员证书过期', '输送带缺少防护罩',
  '操作规程未上墙', '停车场缺少消防栓', '实验室废液存放不规范',
  '配电箱缺少漏电保护', '安全通道堵塞', '消防栓水压不足',
  '电梯检验合格证过期', '叉车未定期年检', '危化品储存超量',
  '高处作业未系安全带', '有限空间作业未进行气体检测',
  '吊装作业无警戒区域', '动火作业未办理审批',
  '员工未参加年度安全培训', '职业病危害告知卡缺失',
  '配电房绝缘工具过期', '危化品仓库未分类存放', '消防通道被占用',
  '安全警示标识缺失', '应急广播系统故障', '污水处理设施运行异常',
  '锅炉安全阀过期未检', '压力容器未定期检测', '电气线路老化',
]

// 风险点名称
const RISK_POINT_NAMES = [
  '锅炉房', '配电室', '危化品仓库', '油罐区', '粉尘车间',
  '有限空间作业区', '高处作业平台', '动火作业区', '特种设备区',
  '液氨储罐', '锅炉房', '变配电室', '中央控制室', '仓库区',
  '生产车间', '喷涂作业区', '酸碱储存区', '燃气调压站', '空压机房',
]

// 任务名称
const TASK_NAMES = {
  '日常检查': [
    '2026年01月-2026年06月重大风险检查任务',
    '2026年01月-2026年06月较大风险检查任务',
    '2026年01月-2026年06月一般风险检查任务',
    '2026年01月-2026年06月低风险检查任务',
  ],
  '专项检查': [
    '2025年冷库全链条安全管理专项整治',
    '2025年危化品储存安全专项整治',
    '2025年消防安全专项整治',
    '2025年粉尘涉爆专项整治',
    '2025年有限空间作业专项整治',
    '2025年特种设备专项整治',
  ],
  '督查督办': [
    '上级督办隐患整改任务',
    '重点时段安全保障任务',
    '重大风险企业管控任务',
    '两会期间安全检查任务',
  ],
  '抽检任务': [
    '一般风险企业抽查任务',
    '低风险企业抽查任务',
  ],
}

// 专家姓名（用于任务创建人）
const TASK_CREATORS = ['范嘉杰', '杨涛', '张建国', '李红梅', '王志强', '刘文华']

// ==================== 工作组数据 ====================

const WORK_GROUPS_DATA: { name: string; area: string; risk_level: RiskLevel }[] = [
  { name: '勾庄片较大', area: '勾庄片', risk_level: '较大' },
  { name: '勾庄片场所组', area: '勾庄片', risk_level: '一般' },
  { name: '物流片场所组', area: '物流片', risk_level: '一般' },
  { name: '良渚片场所组', area: '良渚片', risk_level: '一般' },
  { name: '物流片安全组', area: '物流片', risk_level: '重大' },
  { name: '良渚片重大', area: '良渚片', risk_level: '重大' },
  { name: '良渚片较大', area: '良渚片', risk_level: '较大' },
  { name: '勾庄片重大', area: '勾庄片', risk_level: '重大' },
]

// ==================== 生成器 ====================

/** 生成企业名称 */
function generateEnterpriseName(industry?: string): string {
  // 字号：2-3个字
  const nameLen = randomInt(2, 3)
  let brandName = ''
  for (let i = 0; i < nameLen; i++) {
    const pool = i === 0 ? BRAND_CHARS_1 : BRAND_CHARS_2
    brandName += pool[randomInt(0, pool.length - 1)]
  }
  
  // 行业关键词
  let keywords = ENTERPRISE_KEYWORDS[industry || 'default']
  if (!keywords || keywords.length === 0) {
    keywords = ENTERPRISE_KEYWORDS['default']
  }
  const keyword = keywords[randomInt(0, keywords.length - 1)]
  
  // 组织形式
  const companyType = COMPANY_TYPES[randomInt(0, COMPANY_TYPES.length - 1)]
  
  return `${brandName}${keyword}${companyType}`
}

/** 生成企业地址 */
function generateAddress(): string {
  const region = REGIONS[randomInt(0, REGIONS.length - 1)]
  const street = STREETS[randomInt(0, STREETS.length - 1)]
  const num = randomInt(1, 999)
  return `${region}${street}${num}号`
}

/** 生成企业风险等级（基于风险分布） */
function generateRiskLevel(): RiskLevel {
  const rand = Math.random()
  if (rand < 0.08) return '重大'      // 8%
  if (rand < 0.30) return '较大'       // 22%
  if (rand < 0.70) return '一般'       // 40%
  return '低'                           // 30%
}

/** 生成 AI 评分（基于风险等级） */
function generateAiScore(riskLevel: RiskLevel): number {
  switch (riskLevel) {
    case '重大': return randomInt(10, 35)
    case '较大': return randomInt(36, 60)
    case '一般': return randomInt(61, 82)
    case '低': return randomInt(83, 98)
  }
}

// ==================== 主数据生成函数 ====================

export interface GeneratedData {
  workGroups: WorkGroup[]
  governmentMembers: GovernmentMember[]
  experts: Expert[]
  enterprises: Enterprise[]
  enterpriseDimensions: EnterpriseDimensions[]
  enterpriseStatePaths: EnterpriseStatePath[]
  hazards: Hazard[]
  hazardHistories: HazardHistory[]
  riskPoints: RiskPoint[]
  riskPointControls: RiskPointControl[]
  riskPointRecords: RiskPointRecord[]
  expertDimensions: ExpertDimensionScore[]
  expertPlatformBehaviors: ExpertPlatformBehavior[]
  expertWorkloads: ExpertWorkload[]
  tasks: Task[]
}

export function generateAllData(): GeneratedData {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // ==================== 工作组 ====================
  const workGroups: WorkGroup[] = WORK_GROUPS_DATA.map((wg, index) => ({
    id: `wg-${String(index + 1).padStart(3, '0')}`,
    name: wg.name,
    area: wg.area,
    risk_level: wg.risk_level,
    leader_id: '',
    enterprise_count: 0,
    created_at: today,
  }))

  // ==================== 政府人员 ====================
  const governmentMembers: GovernmentMember[] = []
  
  // 使用静态成员数据
  workGroups.forEach((wg) => {
    const members = WORK_GROUP_MEMBERS.filter(m => m.workGroup === wg.name)
    members.forEach((member) => {
      const govMember = {
        id: uuid(),
        name: member.name,
        position: member.position as GovernmentPosition,
        work_group: wg.name,
        work_group_id: wg.id,
        phone: `138${randomInt(10000000, 99999999)}`,
        created_at: today,
      }
      governmentMembers.push(govMember)
      // 设置组长 ID
      if (member.position === '组长' && !wg.leader_id) {
        wg.leader_id = govMember.id
      }
    })
  })

  // ==================== 专家 ====================
  const experts: Expert[] = EXPERT_NAMES.map((name, index) => ({
    id: `exp-${String(index + 1).padStart(3, '0')}`,
    name,
    avatar: name.substring(0, 1),
    work_group: workGroups[index % workGroups.length].name,
    work_group_id: workGroups[index % workGroups.length].id,
    grade: index < 3 ? 'A' : index < 8 ? 'B' : 'C',
    enterprise_count: 0,
    phone: `159${randomInt(10000000, 99999999)}`,
    created_at: today,
  }))

  // ==================== 企业 ====================
  const ENTERPRISE_COUNT = 200
  const enterprises: Enterprise[] = []
  const expertEnterpriseMap: Map<string, string[]> = new Map()
  
  // 均匀分配专家负责的企业（每个专家负责 15-18 家）
  const expertIds = experts.map(e => e.id)
  let expertIndex = 0
  const enterprisePerExpert = Math.ceil(ENTERPRISE_COUNT / expertIds.length)

  for (let i = 0; i < ENTERPRISE_COUNT; i++) {
    const riskLevel = generateRiskLevel()
    const workGroup = workGroups[randomInt(0, workGroups.length - 1)]
    
    // 轮流分配专家
    const expertId = expertIds[expertIndex % expertIds.length]
    if (!expertEnterpriseMap.has(expertId)) {
      expertEnterpriseMap.set(expertId, [])
    }
    expertEnterpriseMap.get(expertId)!.push(`ent-${String(i + 1).padStart(5, '0')}`)
    
    // 每个专家分配约 15-18 家
    if ((i + 1) % enterprisePerExpert === 0) {
      expertIndex++
    }

    // 先生成行业，再生成企业名称
    const industry = pickEnum(INDUSTRIES)

    enterprises.push({
      id: `ent-${String(i + 1).padStart(5, '0')}`,
      name: generateEnterpriseName(industry),
      address: generateAddress(),
      industry: industry,
      category: pickEnum(CATEGORIES),
      risk_level: riskLevel,
      status: pickEnum(ENTERPRISE_STATUSES),
      work_group: workGroup.name,
      work_group_id: workGroup.id,
      expert_id: expertId,
      ai_score: generateAiScore(riskLevel),
      created_at: randomPastDate(365),
      updated_at: today,
    })
    
    // 更新工作组企业数
    workGroup.enterprise_count++
  }

  // 更新专家负责企业数
  experts.forEach(exp => {
    const ents = expertEnterpriseMap.get(exp.id)
    exp.enterprise_count = ents?.length || 0
  })

  // ==================== 企业多维度数据 ====================
  const enterpriseDimensions: EnterpriseDimensions[] = enterprises.map(ent => {
    // 合规程度影响各维度分数
    const complianceLevel = Math.random()
    const infoCollected = Math.random() < 0.85
    const dataAuthorized = infoCollected && Math.random() < 0.80
    const riskIdentified = dataAuthorized && Math.random() < 0.75
    
    return {
      enterprise_id: ent.id,
      info_collected: infoCollected,
      data_authorized: dataAuthorized,
      risk_identified: riskIdentified,
      duty_rate: infoCollected ? randomInt(40, 100) : 0,
      system_rate: infoCollected ? randomInt(35, 100) : 0,
      invest_rate: infoCollected ? randomInt(30, 100) : 0,
      plan_type: pickEnum(PLAN_TYPES),
      plan_executed: Math.random() < 0.70,
      third_party_sync: Math.random() < 0.60,
      patrol_used: Math.random() < 0.65,
      patrol_casual: randomInt(0, 5),
      patrol_daily: randomInt(0, 12),
      patrol_special: randomInt(0, 4),
      training_done: Math.random() < 0.70,
      training_record: Math.random() < 0.60,
      training_daily: randomInt(0, 8),
      training_three_level: randomInt(0, 3),
      work_permit: randomInt(0, 6),
      hazard_self: randomInt(0, 8),
      hazard_monitor: randomInt(0, 5),
      hazard_major: Math.random() < 0.12 ? randomInt(0, 3) : 0,
      rectify_status: pickEnum(RECTIFY_STATUSES),
      patrol_done: Math.random() < 0.65,
      updated_at: today,
    }
  })

  // ==================== 企业状态路径 ====================
  const enterpriseStatePaths: EnterpriseStatePath[] = enterprises.map(ent => {
    const dims = enterpriseDimensions.find(d => d.enterprise_id === ent.id)!
    const nodes: StatePathNode[] = [
      {
        node_id: 'info_collected',
        node_name: '信息采集',
        status: dims.info_collected ? 'completed' : 'pending',
      },
      {
        node_id: 'data_authorized',
        node_name: '数据授权',
        status: dims.data_authorized ? 'completed' : dims.info_collected ? 'pending' : 'blocked',
      },
      {
        node_id: 'risk_identified',
        node_name: '风险识别',
        status: dims.risk_identified ? 'completed' : dims.data_authorized ? 'pending' : 'blocked',
      },
      {
        node_id: 'hazard_status',
        node_name: '隐患状态',
        status: 'in_progress',
        value: dims.hazard_major > 0 ? '重大隐患' : dims.hazard_self + dims.hazard_monitor > 0 ? '一般隐患' : '无隐患',
      },
      {
        node_id: 'risk_level',
        node_name: '风险等级',
        status: 'completed',
        value: ent.risk_level,
      },
    ]
    return { enterprise_id: ent.id, nodes }
  })

  // ==================== 风险点 ====================
  const riskPoints: RiskPoint[] = []
  const riskPointControls: RiskPointControl[] = []
  const riskPointRecords: RiskPointRecord[] = []
  
  enterprises.forEach(ent => {
    // 每企业 1-10 个风险点
    const pointCount = randomInt(1, 10)
    for (let i = 0; i < pointCount; i++) {
      const riskPointId = uuid()
      const identifiedAt = randomPastDate(180)
      const lastCheckAt = randomPastDate(30)
      
      riskPoints.push({
        id: riskPointId,
        enterprise_id: ent.id,
        name: `${RISK_POINT_NAMES[randomInt(0, RISK_POINT_NAMES.length - 1)]}${i + 1}`,
        level: pickRiskPointLevel(),
        type: pickEnum(RISK_POINT_TYPES),
        status: pickEnum(RISK_POINT_STATUSES),
        identified_at: identifiedAt,
        last_check_at: lastCheckAt,
        check_frequency: pickEnum(CHECK_FREQUENCIES),
        plan_type: pickEnum(PLAN_TYPES),
        description: `${pickEnum(RISK_POINT_TYPES)}相关风险点，需要定期检查`,
        created_at: identifiedAt,
        updated_at: today,
      })

      // 每个风险点 1-3 个管控措施
      const controlCount = randomInt(1, 3)
      for (let j = 0; j < controlCount; j++) {
        const controlId = uuid()
        riskPointControls.push({
          id: controlId,
          risk_point_id: riskPointId,
          measure: `管控措施${j + 1}：${pickEnum(RISK_POINT_TYPES)}相关操作规程`,
          responsible: `${pickEnum(GOVERNMENT_NAMES)}`,
          responsible_phone: `158${randomInt(10000000, 99999999)}`,
          frequency: pickEnum(CHECK_FREQUENCIES),
          status: Math.random() < 0.85 ? '管控中' : pickEnum(RISK_POINT_STATUSES),
          created_at: identifiedAt,
          updated_at: today,
        })

        // 每个管控措施 0-5 条记录
        const recordCount = randomInt(0, 5)
        for (let k = 0; k < recordCount; k++) {
          riskPointRecords.push({
            id: uuid(),
            risk_point_id: riskPointId,
            measure_id: controlId,
            executed_by: `执行人${k + 1}`,
            executed_at: randomPastDateTime(60),
            result: pickEnum(['正常', '异常', '未执行'] as const),
            note: k % 3 === 0 ? '备注信息' : '',
          })
        }
      }
    }
  })

  // ==================== 隐患 ====================
  const hazards: Hazard[] = []
  const hazardHistories: HazardHistory[] = []
  
  enterprises.forEach(ent => {
    // 每企业 0-5 条隐患
    const hazardCount = randomInt(0, 5)
    for (let i = 0; i < hazardCount; i++) {
      const hazardId = uuid()
      const discoveredAt = randomPastDate(365)
      const deadlineDays = pickEnum([7, 15, 30, 60])
      const deadline = new Date(discoveredAt)
      deadline.setDate(deadline.getDate() + deadlineDays)
      
      const expert = experts.find(e => e.id === ent.expert_id) || experts[0]
      const status = pickEnum(HAZARD_STATUSES)
      
      // 根据状态生成相关时间
      let rectifiedAt: string | undefined
      let verifiedAt: string | undefined
      let verifiedBy: string | undefined
      let verifyResult: VerifyResult | undefined
      let closedAt: string | undefined

      if (['rectified', 'verified', 'closed'].includes(status)) {
        rectifiedAt = new Date(new Date(discoveredAt).getTime() + randomInt(1, deadlineDays) * 86400000)
          .toISOString().split('T')[0]
      }
      if (['verified', 'closed'].includes(status)) {
        verifiedAt = rectifiedAt ? new Date(new Date(rectifiedAt).getTime() + randomInt(1, 5) * 86400000)
          .toISOString().split('T')[0] : undefined
        verifiedBy = expert.name
        verifyResult = status === 'verified' || status === 'closed' ? 'pass' : pickEnum(VERIFY_RESULTS)
      }
      if (status === 'closed') {
        closedAt = verifiedAt ? new Date(new Date(verifiedAt).getTime() + randomInt(1, 3) * 86400000)
          .toISOString().split('T')[0] : undefined
      }

      hazards.push({
        id: hazardId,
        enterprise_id: ent.id,
        enterprise_name: ent.name,
        enterprise_industry: ent.industry,
        team_name: ent.work_group,
        risk_point_id: riskPoints.length > 0 ? pickEnum(riskPoints.filter(rp => rp.enterprise_id === ent.id)).id : undefined,
        level: pickEnum(HAZARD_LEVELS),
        status,
        source: pickEnum(HAZARD_SOURCES),
        source_detail: pickEnum(HAZARD_SOURCE_DETAILS),
        expert_id: expert.id,
        expert_name: expert.name,
        title: HAZARD_TITLES[randomInt(0, HAZARD_TITLES.length - 1)],
        description: `${HAZARD_TITLES[randomInt(0, HAZARD_TITLES.length - 1)]}，需要及时整改`,
        dimension: pickEnum(HAZARD_DIMENSIONS),
        discovered_at: discoveredAt,
        deadline_days: deadlineDays,
        deadline: deadline.toISOString().split('T')[0],
        rectified_at: rectifiedAt,
        verified_at: verifiedAt,
        verified_by: verifiedBy,
        verify_result: verifyResult,
        closed_at: closedAt,
        created_at: discoveredAt,
        updated_at: today,
      })

      // 生成状态变更历史
      const historyEntries: { status: HazardStatus; operatorType: 'expert' | 'government' | 'enterprise' | 'system'; note: string }[] = [
        { status: 'pending', operatorType: 'system', note: '隐患发现，自动创建' },
      ]
      
      if (['rectifying', 'rectified', 'verified', 'closed'].includes(status)) {
        historyEntries.push({ status: 'rectifying', operatorType: 'enterprise', note: '企业开始整改' })
      }
      if (['rectified', 'verified', 'closed'].includes(status)) {
        historyEntries.push({ status: 'rectified', operatorType: 'enterprise', note: '企业提交整改完成' })
      }
      if (['verified', 'closed'].includes(status)) {
        historyEntries.push({ 
          status: verifyResult === 'pass' ? 'verified' : 'rejected', 
          operatorType: 'expert', 
          note: verifyResult === 'pass' ? '验收通过' : '验收不通过，需要返工' 
        })
      }
      if (status === 'closed') {
        historyEntries.push({ status: 'closed', operatorType: 'system', note: '隐患闭环完成' })
      }
      if (status === 'overdue') {
        historyEntries.push({ status: 'overdue', operatorType: 'system', note: '整改超期' })
      }

      let lastStatus: HazardStatus | undefined
      historyEntries.forEach((entry, idx) => {
        const historyTime = new Date(new Date(discoveredAt).getTime() + idx * 86400000 * 3)
          .toISOString().replace('T', ' ').substring(0, 19)
        
        hazardHistories.push({
          id: uuid(),
          hazard_id: hazardId,
          from_status: lastStatus,
          to_status: entry.status,
          operator_id: entry.operatorType === 'expert' ? expert.id : entry.operatorType === 'government' 
            ? governmentMembers[0].id : entry.operatorType === 'system' ? 'system' : ent.id,
          operator_name: entry.operatorType === 'expert' ? expert.name 
            : entry.operatorType === 'government' ? governmentMembers[0].name 
            : entry.operatorType === 'system' ? '系统' : '企业',
          operator_type: entry.operatorType,
          operated_at: historyTime,
          note: entry.note,
        })
        lastStatus = entry.status
      })
    }
  })

  // ==================== 专家7维度绩效得分 ====================
  const expertDimensions: ExpertDimensionScore[] = []
  
  experts.forEach(exp => {
    const expEnterprises = enterprises.filter(e => e.expert_id === exp.id)
    expEnterprises.forEach(ent => {
      // 基于企业合规程度生成维度分数
      const dims = enterpriseDimensions.find(d => d.enterprise_id === ent.id)!
      const baseScore = dims.info_collected ? 70 : 40
      
      expertDimensions.push({
        expert_id: exp.id,
        enterprise_id: ent.id,
        dim_1_score: randomInt(baseScore - 10, baseScore + 20),   // 企业基础覆盖度
        dim_2_score: randomInt(baseScore - 15, baseScore + 15),   // 制度数字化完善度
        dim_3_score: randomInt(baseScore - 20, baseScore + 25),   // 风险识别精准度
        dim_4_score: randomInt(baseScore - 10, baseScore + 15),   // 检查计划科学度
        dim_5_score: randomInt(baseScore - 25, baseScore + 20),   // 自查执行活跃度
        dim_6_score: randomInt(baseScore - 20, baseScore + 25),   // 隐患闭环治理度
        dim_7_score: randomInt(baseScore - 30, baseScore + 20),   // 远程监管效能度
        updated_at: today,
      })
    })
  })

  // ==================== 专家平台行为统计 ====================
  const expertPlatformBehaviors: ExpertPlatformBehavior[] = experts.map(exp => {
    const expHazards = hazards.filter(h => h.expert_id === exp.id)
    const closedHazards = expHazards.filter(h => h.status === 'closed' || h.status === 'verified')
    
    return {
      expert_id: exp.id,
      responsible: exp.enterprise_count,
      check_count: randomInt(20, 80),
      hazard_found: expHazards.length,
      hazard_serious: expHazards.filter(h => h.level === '重大隐患').length,
      hazard_closed: closedHazards.length,
      closure_rate: expHazards.length > 0 ? Math.round((closedHazards.length / expHazards.length) * 100) : 100,
      risk_mark: randomInt(10, 50),
      video_todo: randomInt(0, 15),
      hazard_todo: randomInt(0, 20),
      info_complete: randomInt(60, 100),
      im_chat: randomInt(30, 100),
      service_log: randomInt(20, 80),
      on_site_visit: randomInt(5, 25),
      video_watch: randomInt(10, 40),
      ai_watch: randomInt(5, 30),
      enterprise_file: randomInt(10, exp.enterprise_count),
    }
  })

  // ==================== 专家工作量统计 ====================
  const expertWorkloads: ExpertWorkload[] = []
  
  // 生成最近8周的工作量数据
  for (let weekOffset = 7; weekOffset >= 0; weekOffset--) {
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekOffset * 7 - now.getDay())
    const weekNum = Math.ceil(((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)
    const weekKey = `${weekStart.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`

    experts.forEach(exp => {
      WORK_TYPES.forEach(workType => {
        let baseCount = 0
        switch (workType) {
          case '现场检查': baseCount = randomInt(3, 10); break
          case '视频巡查': baseCount = randomInt(2, 8); break
          case 'AI巡查': baseCount = randomInt(1, 5); break
          case '隐患复查': baseCount = randomInt(1, 4); break
          case '专家会诊': baseCount = randomInt(0, 2); break
          case '安全培训': baseCount = randomInt(0, 2); break
          case '其他': baseCount = randomInt(1, 5); break
        }
        
        expertWorkloads.push({
          expert_id: exp.id,
          month_key: monthKey,
          week_key: weekKey,
          work_type: workType,
          count: baseCount,
          work_date: new Date(weekStart.getTime() + randomInt(0, 6) * 86400000).toISOString().split('T')[0],
        })
      })
    })
  }

  // ==================== 任务 ====================
  const tasks: Task[] = []
  
  // 日常检查任务（按风险等级）
  const riskLevelTasks: Record<string, string> = {
    '重大': '重大风险',
    '较大': '较大风险',
    '一般': '一般风险',
    '低': '低风险',
  }
  
  Object.entries(riskLevelTasks).forEach(([level, levelName]) => {
    const year = new Date().getFullYear()
    const name = `${year}年01月-${year}年06月${levelName}检查任务`
    const startDate = `${year}-01-01`
    const endDate = `${year}-06-30`
    const relatedEnterprises = enterprises.filter(e => e.risk_level === level)
    const totalCount = relatedEnterprises.length
    const completedCount = Math.floor(totalCount * (0.5 + Math.random() * 0.5))
    
    // 系统创建的日常检查
    tasks.push({
      id: `task-daily-${level}`,
      name,
      type: '日常检查',
      publish_unit: '良渚街道',
      target: '企业',
      total_count: totalCount,
      completed_count: completedCount,
      completion_rate: Math.round((completedCount / totalCount) * 100),
      creator: '系统',
      start_date: startDate,
      end_date: endDate,
      status: '进行中',
      risk_level: level as RiskLevel,
      enterprise_ids: relatedEnterprises.map(e => e.id),
      hazard_count: randomInt(10, 50),
      major_hazard_count: level === '重大' || level === '较大' ? randomInt(1, 5) : 0,
      created_at: startDate,
    })
  })
  
  // 日常检查 - 专家手动创建的任务
  const manualDailyTasks = [
    { name: '五一节前安全检查', month: 4 },
    { name: '夏季高温专项检查', month: 7 },
  ]
  manualDailyTasks.forEach((t, idx) => {
    const relatedEnterprises = enterprises.slice(0, 50)
    tasks.push({
      id: `task-daily-manual-${idx + 1}`,
      name: t.name,
      type: '日常检查',
      publish_unit: '良渚街道',
      target: '企业',
      total_count: relatedEnterprises.length,
      completed_count: Math.floor(relatedEnterprises.length * 0.7),
      completion_rate: 70,
      creator: TASK_CREATORS[idx],
      start_date: `${new Date().getFullYear()}-0${t.month}-01`,
      end_date: `${new Date().getFullYear()}-0${t.month}-30`,
      status: '进行中',
      enterprise_ids: relatedEnterprises.map(e => e.id),
      hazard_count: randomInt(5, 20),
      major_hazard_count: randomInt(0, 3),
      created_at: `${new Date().getFullYear()}-0${t.month}-01`,
    })
  })
  
  // 专项检查任务（生成不同时间段的任务，覆盖本月/本季/本年）
  const specialPeriods = [
    { startMonth: 3, endMonth: 5, year: new Date().getFullYear() },   // 本季度
    { startMonth: 4, endMonth: 4, year: new Date().getFullYear() },   // 本月
    { startMonth: 1, endMonth: 6, year: new Date().getFullYear() },   // 本年上半年
    { startMonth: 7, endMonth: 12, year: new Date().getFullYear() - 1 }, // 去年下半年
  ]
  
  TASK_NAMES['专项检查'].forEach((name, index) => {
    const period = specialPeriods[index % specialPeriods.length]
    const startDate = `${period.year}-${String(period.startMonth).padStart(2, '0')}-01`
    const endDate = `${period.year}-${String(period.endMonth).padStart(2, '0')}-28`
    const totalCount = randomInt(30, 80)
    const completedCount = Math.floor(totalCount * (0.1 + Math.random() * 0.5))
    
    tasks.push({
      id: `task-special-${index + 1}`,
      name,
      type: '专项检查',
      publish_unit: '良渚街道',
      target: '企业',
      total_count: totalCount,
      completed_count: completedCount,
      completion_rate: Math.round((completedCount / totalCount) * 100),
      creator: TASK_CREATORS[randomInt(0, TASK_CREATORS.length - 1)],
      start_date: startDate,
      end_date: endDate,
      status: new Date() > new Date(endDate) ? '已完成' : '进行中',
      enterprise_ids: enterprises.slice(randomInt(0, 50), randomInt(30, 80)).map(e => e.id),
      hazard_count: randomInt(20, 60),
      major_hazard_count: randomInt(1, 8),
      created_at: startDate,
    })
  })
  
  // 督查督办任务
  TASK_NAMES['督查督办'].forEach((name, index) => {
    const year = new Date().getFullYear()
    const startMonth = randomInt(1, 10)
    const duration = randomInt(1, 3) // 1-3个月
    const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`
    const endMonth = startMonth + duration
    const endYear = endMonth > 12 ? year + 1 : year
    const endMonthMod = endMonth > 12 ? endMonth - 12 : endMonth
    const endDate = `${endYear}-${String(endMonthMod).padStart(2, '0')}-28`
    const totalCount = randomInt(10, 30)
    const completedCount = Math.floor(totalCount * (0.3 + Math.random() * 0.6))
    
    tasks.push({
      id: `task-supervise-${index + 1}`,
      name,
      type: '督查督办',
      publish_unit: '良渚街道',
      target: '企业',
      total_count: totalCount,
      completed_count: completedCount,
      completion_rate: Math.round((completedCount / totalCount) * 100),
      creator: TASK_CREATORS[randomInt(0, TASK_CREATORS.length - 1)],
      start_date: startDate,
      end_date: endDate,
      status: new Date() > new Date(endDate) ? '已完成' : '进行中',
      enterprise_ids: enterprises.slice(randomInt(0, 30), randomInt(10, 30)).map(e => e.id),
      hazard_count: randomInt(5, 25),
      major_hazard_count: randomInt(0, 4),
      created_at: startDate,
    })
  })
  
  // 抽检任务（按季度抽查一般/低风险企业，超过10%比例）
  const samplePeriods = [
    { name: 'Q1一般风险企业抽检任务', risk: '一般', quarter: 1 },
    { name: 'Q1低风险企业抽检任务', risk: '低', quarter: 1 },
    { name: 'Q2一般风险企业抽检任务', risk: '一般', quarter: 2 },
    { name: 'Q2低风险企业抽检任务', risk: '低', quarter: 2 },
  ]
  
  samplePeriods.forEach((period, index) => {
    const year = new Date().getFullYear()
    const quarterStartMonth = (period.quarter - 1) * 3
    const quarterEndMonth = quarterStartMonth + 2
    const startDate = `${year}-${String(quarterStartMonth + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(quarterEndMonth + 1).padStart(2, '0')}-28`
    
    // 筛选目标风险等级企业
    const targetEnterprises = enterprises.filter(e => e.risk_level === period.risk)
    // 抽取超过10%的比例（比如15-20%）
    const sampleRate = 0.15 + Math.random() * 0.05 // 15%-20%
    const totalCount = Math.max(Math.floor(targetEnterprises.length * sampleRate), 3)
    const completedCount = Math.floor(totalCount * (0.4 + Math.random() * 0.5))
    
    tasks.push({
      id: `task-sample-${index + 1}`,
      name: period.name,
      type: '抽检任务',
      publish_unit: '良渚街道',
      target: '企业',
      total_count: totalCount,
      completed_count: completedCount,
      completion_rate: Math.round((completedCount / totalCount) * 100),
      creator: TASK_CREATORS[randomInt(0, TASK_CREATORS.length - 1)],
      start_date: startDate,
      end_date: endDate,
      status: new Date() > new Date(endDate) ? '已完成' : '进行中',
      enterprise_ids: targetEnterprises.slice(0, totalCount).map(e => e.id),
      hazard_count: randomInt(2, 10),
      major_hazard_count: 0,
      created_at: startDate,
    })
  })

  return {
    workGroups,
    governmentMembers,
    experts,
    enterprises,
    enterpriseDimensions,
    enterpriseStatePaths,
    hazards,
    hazardHistories,
    riskPoints,
    riskPointControls,
    riskPointRecords,
    expertDimensions,
    expertPlatformBehaviors,
    expertWorkloads,
    tasks,
  }
}
