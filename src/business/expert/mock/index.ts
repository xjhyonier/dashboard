// ==================== 专家工作台 Mock 数据 ====================
import type {
  Enterprise, BoardScore, AnomalyItem, AiInsight, TrendPoint, AiSuggestion,
  AnnotationRecord, Hazard, ServiceRecord, TodoItem, GroupSubItem,
  InspectionTask, SubTask, WorkGroup, WorkGroupEnterprise,
  PoolChange, ChatEnterprise, ChatMessage,
  DashboardKpi, WorkProgress, TaskProgressOverview,
  ExpertPerformance, PerformanceDimension, OperationalNudge, OperationalMetrics,
  RiskDiscrepancy,
} from '../types'

// ==================== 通用企业数据 ====================

const boardNames = ['事故管理', '双重预防', '应急管理', '机构职责', '教育培训', '安全投入', '安全制度']

const makeBoardScores = (overrides?: Partial<Record<string, number>>): BoardScore[] => {
  return boardNames.map(board => {
    const score = overrides?.[board] ?? Math.floor(Math.random() * 40 + 55)
    const anomalyCount = score < 80 ? Math.floor(Math.random() * 3 + 1) : 0
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low']
    const anomalies: AnomalyItem[] = Array.from({ length: anomalyCount }, (_, i) => ({
      id: `${board}-${Date.now()}-${i}`,
      description: `${board}板块发现异常项${i + 1}`,
      severity: severities[Math.min(anomalyCount - 1 - i, 3)],
      board,
      detectedAt: '2026-04-01T08:00:00Z',
    }))
    return { board, score, anomalyCount, anomalies }
  })
}

const enterprises: Enterprise[] = [
  {
    id: 'ent-001', name: '鑫达化工有限公司', category: 'production', industry: '化工制造', scale: '中型',
    address: '滨海新区化工路88号', contactName: '王建国', contactPhone: '138****1234',
    safetyOfficer: '李明辉', safetyOfficerPhone: '139****5678',
    aiScore: 22, riskScore: 22, expertRating: 35, selfCheckRate: 30,
    workGroups: ['消防专项组', '化工巡查组'],
    lastCheckDate: '2026-03-28T10:00:00Z', openHazardCount: 3,
    boardScores: makeBoardScores({ '事故管理': 15, '双重预防': 20, '应急管理': 30 }),
    aiInsight: {
      summary: '该企业近三个月事故管理评分持续下降，双重预防机制存在较大漏洞。建议重点关注消防通道堵塞和危化品存储不规范问题。',
      trend: [
        { month: '2025-11', score: 55 }, { month: '2025-12', score: 48 },
        { month: '2026-01', score: 40 }, { month: '2026-02', score: 35 },
        { month: '2026-03', score: 28 }, { month: '2026-04', score: 22 },
      ],
      suggestions: [
        { id: 's1', priority: 1, action: '立即检查消防通道是否通畅', relatedBoard: '事故管理', relatedAnomalyIds: ['a1'] },
        { id: 's2', priority: 2, action: '核查危化品存储区域双锁管理', relatedBoard: '双重预防', relatedAnomalyIds: ['a2'] },
        { id: 's3', priority: 3, action: '核查应急预案更新情况', relatedBoard: '应急管理', relatedAnomalyIds: ['a3'] },
      ]
    }
  },
  {
    id: 'ent-002', name: '恒盛食品加工厂', category: 'production', industry: '食品加工', scale: '小型',
    address: '经济开发区食品园12号', contactName: '张丽华', contactPhone: '137****9012',
    safetyOfficer: '陈志强', safetyOfficerPhone: '136****3456',
    aiScore: 45, riskScore: 45, expertRating: undefined, selfCheckRate: 50,
    workGroups: ['消防专项组'],
    lastCheckDate: '2026-04-02T14:30:00Z', openHazardCount: 1,
    boardScores: makeBoardScores({ '教育培训': 30, '安全制度': 40 }),
    aiInsight: {
      summary: '该企业教育培训台账存在缺失，新员工安全培训记录不完整。安全制度部分条款已过期未更新。',
      trend: [
        { month: '2025-11', score: 70 }, { month: '2025-12', score: 65 },
        { month: '2026-01', score: 60 }, { month: '2026-02', score: 52 },
        { month: '2026-03', score: 48 }, { month: '2026-04', score: 45 },
      ],
      suggestions: [
        { id: 's4', priority: 1, action: '核查新员工三级安全教育培训记录', relatedBoard: '教育培训', relatedAnomalyIds: ['a4'] },
        { id: 's5', priority: 2, action: '检查安全制度文件更新日期', relatedBoard: '安全制度', relatedAnomalyIds: ['a5'] },
      ]
    }
  },
  {
    id: 'ent-003', name: '宏基机械制造有限公司', category: 'production', industry: '机械制造', scale: '大型',
    address: '高新区工业大道200号', contactName: '刘伟', contactPhone: '135****7890',
    safetyOfficer: '赵刚', safetyOfficerPhone: '134****2345',
    aiScore: 58, riskScore: 58, expertRating: 55, selfCheckRate: 65,
    workGroups: ['园区日常组'],
    lastCheckDate: '2026-03-30T09:00:00Z', openHazardCount: 2,
    boardScores: makeBoardScores({ '双重预防': 35, '机构职责': 40, '安全投入': 50 }),
    aiInsight: {
      summary: '该企业双重预防机制运行良好但存在个别薄弱环节，机构职责方面安全管理人员配置不足。',
      trend: [
        { month: '2025-11', score: 65 }, { month: '2025-12', score: 62 },
        { month: '2026-01', score: 60 }, { month: '2026-02', score: 59 },
        { month: '2026-03', score: 58 }, { month: '2026-04', score: 58 },
      ],
      suggestions: [
        { id: 's6', priority: 1, action: '核查安全管理人员配置是否达标', relatedBoard: '机构职责', relatedAnomalyIds: ['a6'] },
      ]
    }
  },
  {
    id: 'ent-004', name: '天成建材有限公司', category: 'production', industry: '建材制造', scale: '中型',
    address: '城东工业园建材路56号', contactName: '孙建军', contactPhone: '133****6789',
    safetyOfficer: '周磊', safetyOfficerPhone: '132****0123',
    aiScore: 18, riskScore: 18, expertRating: undefined, selfCheckRate: 0,
    workGroups: ['消防专项组', '化工巡查组'],
    lastCheckDate: '2026-03-20T11:00:00Z', openHazardCount: 4,
    boardScores: makeBoardScores({ '事故管理': 10, '双重预防': 15, '应急管理': 20, '安全投入': 25 }),
    aiInsight: {
      summary: '该企业多项安全指标严重不达标，消防设施过期未检验，双重预防系统形同虚设。建议立即安排现场检查。',
      trend: [
        { month: '2025-11', score: 45 }, { month: '2025-12', score: 38 },
        { month: '2026-01', score: 32 }, { month: '2026-02', score: 25 },
        { month: '2026-03', score: 20 }, { month: '2026-04', score: 18 },
      ],
      suggestions: [
        { id: 's7', priority: 1, action: '立即安排现场消防设施检查', relatedBoard: '事故管理', relatedAnomalyIds: ['a7'] },
        { id: 's8', priority: 2, action: '核实双重预防系统运行记录', relatedBoard: '双重预防', relatedAnomalyIds: ['a8'] },
      ]
    }
  },
  {
    id: 'ent-005', name: '瑞祥电子科技有限公司', category: 'general', industry: '电子制造', scale: '小型',
    address: '科技园创新路168号', contactName: '马超', contactPhone: '131****4567',
    safetyOfficer: '黄丽', safetyOfficerPhone: '130****8901',
    aiScore: 85, riskScore: 85, expertRating: 90, selfCheckRate: 90,
    workGroups: ['园区日常组'],
    lastCheckDate: '2026-04-01T16:00:00Z', openHazardCount: 0,
    boardScores: makeBoardScores({ '事故管理': 90, '双重预防': 88, '应急管理': 85, '机构职责': 82, '教育培训': 80, '安全投入': 85, '安全制度': 86 }),
    aiInsight: {
      summary: '该企业各项安全管理指标表现良好，建议保持现有管理水平，定期复核即可。',
      trend: [
        { month: '2025-11', score: 78 }, { month: '2025-12', score: 80 },
        { month: '2026-01', score: 82 }, { month: '2026-02', score: 83 },
        { month: '2026-03', score: 84 }, { month: '2026-04', score: 85 },
      ],
      suggestions: []
    }
  },
  {
    id: 'ent-006', name: '华通物流有限公司', category: 'fire_key', industry: '仓储物流', scale: '中型',
    address: '交通枢纽物流园区A区', contactName: '杨帆', contactPhone: '150****1122',
    safetyOfficer: '吴刚', safetyOfficerPhone: '151****3344',
    aiScore: 35, riskScore: 35, expertRating: undefined, selfCheckRate: 40,
    workGroups: ['消防专项组'],
    lastCheckDate: '2026-03-25T13:00:00Z', openHazardCount: 2,
    boardScores: makeBoardScores({ '应急管理': 25, '事故管理': 30 }),
    aiInsight: {
      summary: '该企业应急预案未更新超过一年，仓储区消防设施存在遮挡问题。',
      trend: [
        { month: '2025-11', score: 50 }, { month: '2025-12', score: 48 },
        { month: '2026-01', score: 42 }, { month: '2026-02', score: 38 },
        { month: '2026-03', score: 36 }, { month: '2026-04', score: 35 },
      ],
      suggestions: [
        { id: 's9', priority: 1, action: '核查应急预案更新情况', relatedBoard: '应急管理', relatedAnomalyIds: ['a9'] },
        { id: 's10', priority: 2, action: '现场检查仓储区消防通道', relatedBoard: '事故管理', relatedAnomalyIds: ['a10'] },
      ]
    }
  },
  {
    id: 'ent-007', name: '永安制药有限公司', category: 'production', industry: '医药制造', scale: '大型',
    address: '生物医药产业园8号', contactName: '陈晓明', contactPhone: '158****5566',
    safetyOfficer: '林婷', safetyOfficerPhone: '159****7788',
    aiScore: 40, riskScore: 40, expertRating: undefined, selfCheckRate: 55,
    workGroups: ['化工巡查组'],
    lastCheckDate: '2026-04-03T10:30:00Z', openHazardCount: 1,
    boardScores: makeBoardScores({ '双重预防': 28, '安全投入': 35 }),
    aiInsight: {
      summary: '该企业双重预防系统中风险管控清单部分项未按时更新，安全投入计划执行率偏低。',
      trend: [
        { month: '2025-11', score: 55 }, { month: '2025-12', score: 52 },
        { month: '2026-01', score: 48 }, { month: '2026-02', score: 44 },
        { month: '2026-03', score: 42 }, { month: '2026-04', score: 40 },
      ],
      suggestions: [
        { id: 's11', priority: 1, action: '核查风险管控清单更新情况', relatedBoard: '双重预防', relatedAnomalyIds: ['a11'] },
      ]
    }
  },
  {
    id: 'ent-008', name: '博远包装材料有限公司', category: 'general', industry: '包装印刷', scale: '小型',
    address: '城西工业集中区22号', contactName: '何强', contactPhone: '155****9900',
    safetyOfficer: '徐静', safetyOfficerPhone: '156****1122',
    aiScore: 72, riskScore: 72, expertRating: 70, selfCheckRate: 70,
    workGroups: ['园区日常组'],
    lastCheckDate: '2026-03-29T15:00:00Z', openHazardCount: 0,
    boardScores: makeBoardScores({ '教育培训': 60, '安全制度': 65 }),
  },
  {
    id: 'ent-009', name: '鑫源金属制品有限公司', category: 'production', industry: '金属加工', scale: '中型',
    address: '经济开发区冶金路99号', contactName: '郑伟', contactPhone: '139****3344',
    safetyOfficer: '钱浩', safetyOfficerPhone: '138****5566',
    aiScore: 28, riskScore: 28, expertRating: undefined, selfCheckRate: 10,
    workGroups: ['消防专项组', '化工巡查组'],
    lastCheckDate: '2026-03-18T09:30:00Z', openHazardCount: 3,
    boardScores: makeBoardScores({ '事故管理': 18, '双重预防': 22, '应急管理': 30, '安全投入': 35 }),
    aiInsight: {
      summary: '该企业近两周未进行检查，多项风险指标处于高位。建议尽快安排现场复查。',
      trend: [
        { month: '2025-11', score: 42 }, { month: '2025-12', score: 38 },
        { month: '2026-01', score: 33 }, { month: '2026-02', score: 30 },
        { month: '2026-03', score: 28 }, { month: '2026-04', score: 28 },
      ],
      suggestions: [
        { id: 's12', priority: 1, action: '安排现场安全检查', relatedBoard: '事故管理', relatedAnomalyIds: ['a12'] },
      ]
    }
  },
  {
    id: 'ent-010', name: '万通木业有限公司', category: 'general', industry: '木材加工', scale: '小型',
    address: '北郊工业路150号', contactName: '吕建华', contactPhone: '137****7788',
    safetyOfficer: '范伟', safetyOfficerPhone: '136****9900',
    aiScore: 52, riskScore: 52, expertRating: undefined, selfCheckRate: 60,
    workGroups: ['消防专项组'],
    lastCheckDate: '2026-03-31T11:00:00Z', openHazardCount: 1,
    boardScores: makeBoardScores({ '事故管理': 32, '应急管理': 38 }),
  },
]

// ==================== 隐患单 Mock 数据 ====================

const hazards: Hazard[] = [
  {
    id: 'hz-001', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    description: '生产车间东侧消防通道被原材料堆放占用，宽度不足1.2米',
    location: '1号生产车间东侧通道', level: 'major', board: '事故管理',
    photos: [], status: 'issued', assignedTo: '李明辉',
    rectifyDeadline: '2026-04-10T18:00:00Z',
    createdAt: '2026-03-28T10:30:00Z', issuedAt: '2026-03-28T14:00:00Z',
  },
  {
    id: 'hz-002', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    description: '危化品仓库双锁管理制度未严格执行，仅使用单锁',
    location: '危化品仓库A区入口', level: 'major', board: '双重预防',
    photos: [], status: 'rectifying', assignedTo: '李明辉',
    rectifyDeadline: '2026-04-15T18:00:00Z',
    createdAt: '2026-03-28T10:35:00Z', issuedAt: '2026-03-29T09:00:00Z', rectifyingAt: '2026-04-01T08:00:00Z',
  },
  {
    id: 'hz-003', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    description: '应急预案未在2026年度进行更新修订',
    location: '安全管理办公室', level: 'general', board: '应急管理',
    photos: [], status: 'pending_review', assignedTo: '李明辉',
    rectifyDeadline: '2026-04-05T18:00:00Z',
    createdAt: '2026-03-20T08:00:00Z', issuedAt: '2026-03-20T10:00:00Z', rectifyingAt: '2026-03-25T08:00:00Z',
    reviewAt: '2026-04-03T16:00:00Z',
  },
  {
    id: 'hz-004', enterpriseId: 'ent-002', enterpriseName: '恒盛食品加工厂',
    description: '新员工入职三级安全教育培训记录缺失3份',
    location: '人力资源部', level: 'general', board: '教育培训',
    photos: [], status: 'pending_issue',
    createdAt: '2026-04-02T15:00:00Z',
  },
  {
    id: 'hz-005', enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    description: '冲压车间安全防护罩变形松动',
    location: '2号冲压车间', level: 'general', board: '双重预防',
    photos: [], status: 'rectifying', assignedTo: '赵刚',
    rectifyDeadline: '2026-04-08T18:00:00Z',
    createdAt: '2026-03-30T09:30:00Z', issuedAt: '2026-03-30T14:00:00Z', rectifyingAt: '2026-04-02T08:00:00Z',
  },
  {
    id: 'hz-006', enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    description: '配电箱安全警示标识脱落',
    location: '1号车间配电室', level: 'general', board: '安全制度',
    photos: [], status: 'closed',
    createdAt: '2026-03-15T10:00:00Z', issuedAt: '2026-03-15T14:00:00Z', rectifyingAt: '2026-03-18T08:00:00Z',
    reviewAt: '2026-03-20T10:00:00Z', closedAt: '2026-03-20T10:30:00Z', reviewResult: 'pass',
  },
  {
    id: 'hz-007', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    description: '消防水带老化破损，干粉灭火器超过检验有效期',
    location: '1号仓库消防器材柜', level: 'major', board: '事故管理',
    photos: [], status: 'pending_issue',
    createdAt: '2026-04-03T09:00:00Z',
  },
  {
    id: 'hz-008', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    description: '粉尘浓度在线监测系统离线超过48小时',
    location: '粉碎车间', level: 'major', board: '双重预防',
    photos: [], status: 'issued', assignedTo: '周磊',
    rectifyDeadline: '2026-04-06T18:00:00Z',
    createdAt: '2026-04-01T10:00:00Z', issuedAt: '2026-04-01T16:00:00Z',
  },
  {
    id: 'hz-009', enterpriseId: 'ent-006', enterpriseName: '华通物流有限公司',
    description: '应急预案超期未更新，最近版本为2024年8月',
    location: '安全管理办公室', level: 'general', board: '应急管理',
    photos: [], status: 'rectifying', assignedTo: '吴刚',
    rectifyDeadline: '2026-04-12T18:00:00Z',
    createdAt: '2026-03-25T14:00:00Z', issuedAt: '2026-03-26T09:00:00Z', rectifyingAt: '2026-03-28T08:00:00Z',
  },
  {
    id: 'hz-010', enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    description: '喷漆车间通风设施故障，VOCs超标排放',
    location: '喷漆车间', level: 'major', board: '事故管理',
    photos: [], status: 'pending_issue',
    createdAt: '2026-04-04T08:00:00Z',
  },
  {
    id: 'hz-011', enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    description: '乙炔气瓶与氧气瓶存放间距不足',
    location: '焊接作业区', level: 'general', board: '双重预防',
    photos: [], status: 'issued', assignedTo: '钱浩',
    rectifyDeadline: '2026-04-08T18:00:00Z',
    createdAt: '2026-03-18T10:00:00Z', issuedAt: '2026-03-18T14:00:00Z',
  },
  {
    id: 'hz-012', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    description: '配电房安全工器具未定期检验',
    location: '配电房', level: 'general', board: '安全投入',
    photos: [], status: 'pending_issue',
    createdAt: '2026-04-03T11:00:00Z',
  },
]

// ==================== 服务记录 Mock 数据 ====================

const serviceRecords: ServiceRecord[] = [
  {
    id: 'sv-001', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    type: 'onsite', content: '现场检查：消防通道部分疏通，原材料已转移至临时存放区。危化品仓库双锁已整改完成。',
    attachments: [], createdAt: '2026-04-03T10:00:00Z', creatorName: '我',
    relatedHazardId: 'hz-002',
  },
  {
    id: 'sv-002', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    type: 'wechat', content: '微信沟通：提醒安管员李明辉尽快提交应急预案修订稿。',
    attachments: [], createdAt: '2026-04-02T09:30:00Z', creatorName: '我',
  },
  {
    id: 'sv-003', enterpriseId: 'ent-002', enterpriseName: '恒盛食品加工厂',
    type: 'phone', content: '电话沟通：与安管员陈志强确认新员工安全培训情况，3份缺失记录将在本周内补齐。',
    attachments: [], createdAt: '2026-04-02T14:00:00Z', creatorName: '我',
  },
  {
    id: 'sv-004', enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    type: 'onsite', content: '现场检查：冲压车间安全防护罩已安排维修，预计4月6日完成。配电箱警示标识已更换。',
    attachments: [], createdAt: '2026-04-01T09:00:00Z', creatorName: '我',
    relatedHazardId: 'hz-005',
  },
  {
    id: 'sv-005', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    type: 'wechat', content: '微信沟通：通知安管员周磊消防器材需紧急更换，已下发隐患整改通知书。',
    attachments: [], createdAt: '2026-04-03T15:00:00Z', creatorName: '我',
    relatedHazardId: 'hz-007',
  },
  {
    id: 'sv-006', enterpriseId: 'ent-005', enterpriseName: '瑞祥电子科技有限公司',
    type: 'onsite', content: '季度例行检查：各项安全管理措施到位，建议继续保持。',
    attachments: [], createdAt: '2026-04-01T16:00:00Z', creatorName: '我',
  },
  {
    id: 'sv-007', enterpriseId: 'ent-006', enterpriseName: '华通物流有限公司',
    type: 'phone', content: '电话沟通：与安管员吴刚确认应急预案修订进度，已完成初稿正在内部审批。',
    attachments: [], createdAt: '2026-04-02T11:00:00Z', creatorName: '我',
    relatedHazardId: 'hz-009',
  },
  {
    id: 'sv-008', enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司',
    type: 'onsite', content: '现场检查：双重预防系统运行正常，风险管控清单更新工作已启动。',
    attachments: [], createdAt: '2026-04-03T10:30:00Z', creatorName: '我',
  },
  {
    id: 'sv-009', enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    type: 'wechat', content: '微信通知：要求安排喷漆车间通风设施维修，VOCs排放问题需紧急处理。',
    attachments: [], createdAt: '2026-04-04T08:30:00Z', creatorName: '我',
  },
  {
    id: 'sv-010', enterpriseId: 'ent-010', enterpriseName: '万通木业有限公司',
    type: 'onsite', content: '现场检查：发现干燥车间灭火器配置不足，已现场指导安管员补充配备。',
    attachments: [], createdAt: '2026-03-31T11:00:00Z', creatorName: '我',
  },
  {
    id: 'sv-011', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    type: 'phone', content: '电话跟进：确认消防通道整改方案已制定，预计4月8日前完成全部清移。',
    attachments: [], createdAt: '2026-04-01T10:00:00Z', creatorName: '我',
    relatedHazardId: 'hz-001',
  },
  {
    id: 'sv-012', enterpriseId: 'ent-008', enterpriseName: '博远包装材料有限公司',
    type: 'wechat', content: '微信沟通：通知安全制度文件更新已完成，提醒安管员归档备案。',
    attachments: [], createdAt: '2026-03-29T14:00:00Z', creatorName: '我',
  },
  {
    id: 'sv-013', enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    type: 'wechat', content: '微信提醒：本周需完成冲压车间防护罩维修验收。',
    attachments: [], createdAt: '2026-04-04T09:00:00Z', creatorName: '我',
  },
  {
    id: 'sv-014', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    type: 'phone', content: '电话沟通：粉尘监测系统供应商已安排技术人员上门维修，预计4月5日恢复在线。',
    attachments: [], createdAt: '2026-04-04T10:00:00Z', creatorName: '我',
  },
  {
    id: 'sv-015', enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司',
    type: 'wechat', content: '微信通知：安全投入年度计划第一季度执行率偏低，请核实并说明原因。',
    attachments: [], createdAt: '2026-04-01T15:00:00Z', creatorName: '我',
  },
]

// ==================== 标注记录 Mock 数据 ====================

const annotations: AnnotationRecord[] = [
  {
    id: 'ann-001', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    board: 'overall', aiScore: 22, expertScore: 35,
    agreement: 'disagree', reason: '企业已开始整改消防通道和危化品仓库，预计一周内完成，风险有所缓解。',
    annotatedAt: '2026-03-29T10:00:00Z',
  },
  {
    id: 'ann-002', enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    board: '双重预防', aiScore: 35, expertScore: 45,
    agreement: 'disagree', reason: '冲压车间防护罩问题属于一般缺陷，整改方案已制定，不应归为高风险。',
    annotatedAt: '2026-03-31T09:00:00Z',
  },
  {
    id: 'ann-003', enterpriseId: 'ent-005', enterpriseName: '瑞祥电子科技有限公司',
    board: 'overall', aiScore: 85, expertScore: 90,
    agreement: 'disagree', reason: '该企业安全管理水平优秀，实际风险应更高评价。',
    annotatedAt: '2026-04-01T17:00:00Z',
  },
  {
    id: 'ann-004', enterpriseId: 'ent-008', enterpriseName: '博远包装材料有限公司',
    board: '安全制度', aiScore: 65, expertScore: 70,
    agreement: 'agree', reason: '',
    annotatedAt: '2026-03-30T10:00:00Z',
  },
]

// ==================== 待办事项 Mock 数据 ====================

const subItemsForGroup1: GroupSubItem[] = [
  { id: 'sub-001', title: '现场检查消防通道整改情况', source: 'AI推送', workGroup: '消防专项组', status: 'todo' },
  { id: 'sub-002', title: '验收应急预案修订稿', source: '隐患单跟进', workGroup: '消防专项组', status: 'in_progress' },
]

const subItemsForGroup2: GroupSubItem[] = [
  { id: 'sub-003', title: '核查粉尘浓度监测系统维修进度', source: '隐患单跟进', workGroup: '化工巡查组', status: 'todo' },
  { id: 'sub-004', title: '检查配电房安全工器具检验情况', source: 'AI推送', workGroup: '化工巡查组', status: 'todo' },
]

const todos: TodoItem[] = [
  {
    id: 'td-001', title: '天成建材消防器材更换', description: '消防水带老化破损、灭火器过期需更换',
    enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    source: 'ai_push', sourceLabel: 'AI推送', workGroup: '消防专项组',
    status: 'todo', priority: 'critical', deadline: '2026-04-05T18:00:00Z',
    createdAt: '2026-04-03T09:00:00Z',
    groupId: 'grp-001', groupSubItems: subItemsForGroup1,
  },
  {
    id: 'td-002', title: '鑫达化工消防通道整改复查', description: '确认消防通道已完全疏通',
    enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    source: 'ai_push', sourceLabel: 'AI推送', workGroup: '消防专项组',
    status: 'todo', priority: 'high', deadline: '2026-04-08T18:00:00Z',
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'td-003', title: '恒盛食品厂培训台账补齐', description: '新员工三级安全教育培训记录补齐',
    enterpriseId: 'ent-002', enterpriseName: '恒盛食品加工厂',
    source: 'manual', sourceLabel: '手动创建', workGroup: '消防专项组',
    status: 'in_progress', priority: 'medium', deadline: '2026-04-07T18:00:00Z',
    createdAt: '2026-04-02T14:00:00Z',
  },
  {
    id: 'td-004', title: '宏基冲压车间防护罩验收', description: '确认安全防护罩维修完成',
    enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    source: 'task', sourceLabel: '日常巡查Q2', workGroup: '园区日常组',
    status: 'todo', priority: 'high', deadline: '2026-04-06T18:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'td-005', title: '华通物流应急预案修订验收', description: '确认预案修订完成并备案',
    enterpriseId: 'ent-006', enterpriseName: '华通物流有限公司',
    source: 'task', sourceLabel: '日常巡查Q2', workGroup: '消防专项组',
    status: 'in_progress', priority: 'medium', deadline: '2026-04-12T18:00:00Z',
    createdAt: '2026-03-28T10:00:00Z',
  },
  {
    id: 'td-006', title: '永安制药风险管控清单核查', description: '检查双重预防系统风险管控清单更新情况',
    enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司',
    source: 'ai_push', sourceLabel: 'AI推送', workGroup: '化工巡查组',
    status: 'todo', priority: 'medium', deadline: '2026-04-09T18:00:00Z',
    createdAt: '2026-04-03T10:30:00Z',
  },
  {
    id: 'td-007', title: '鑫源金属喷漆车间通风维修', description: 'VOCs超标排放问题需紧急处理',
    enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    source: 'ai_push', sourceLabel: 'AI推送', workGroup: '消防专项组',
    status: 'todo', priority: 'critical', deadline: '2026-04-05T18:00:00Z',
    createdAt: '2026-04-04T08:00:00Z',
    groupId: 'grp-002', groupSubItems: subItemsForGroup2,
  },
  {
    id: 'td-008', title: '博远包装安全制度归档', description: '确认安全制度文件更新后已归档备案',
    enterpriseId: 'ent-008', enterpriseName: '博远包装材料有限公司',
    source: 'external_sync', sourceLabel: '外部同步', workGroup: '园区日常组',
    status: 'done', priority: 'low', deadline: '2026-04-01T18:00:00Z',
    createdAt: '2026-03-29T14:00:00Z', completedAt: '2026-03-30T10:00:00Z',
  },
  {
    id: 'td-009', title: '万通木业灭火器补充配置', description: '干燥车间灭火器数量不足需补充',
    enterpriseId: 'ent-010', enterpriseName: '万通木业有限公司',
    source: 'manual', sourceLabel: '手动创建', workGroup: '消防专项组',
    status: 'done', priority: 'low', deadline: '2026-04-02T18:00:00Z',
    createdAt: '2026-03-31T11:00:00Z', completedAt: '2026-04-01T15:00:00Z',
  },
  {
    id: 'td-010', title: '天成建材粉尘监测系统维修', description: '安排技术人员上门维修粉尘监测系统',
    enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    source: 'task', sourceLabel: '消防设施突击检查', workGroup: '化工巡查组',
    status: 'in_progress', priority: 'high', deadline: '2026-04-05T18:00:00Z',
    createdAt: '2026-04-01T16:00:00Z',
  },
  {
    id: 'td-011', title: '瑞祥电子季度复核', description: '季度例行安全复核，确认各项指标正常',
    enterpriseId: 'ent-005', enterpriseName: '瑞祥电子科技有限公司',
    source: 'manual', sourceLabel: '手动创建', workGroup: '园区日常组',
    status: 'done', priority: 'low', deadline: '2026-04-03T18:00:00Z',
    createdAt: '2026-04-01T16:00:00Z', completedAt: '2026-04-01T17:00:00Z',
  },
  {
    id: 'td-012', title: '鑫达化工双锁管理整改确认', description: '确认危化品仓库双锁制度已落实',
    enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    source: 'task', sourceLabel: '日常巡查Q2', workGroup: '化工巡查组',
    status: 'in_progress', priority: 'high', deadline: '2026-04-10T18:00:00Z',
    createdAt: '2026-04-03T10:00:00Z',
  },
  {
    id: 'td-013', title: '鑫源金属气瓶存放整改', description: '乙炔气瓶与氧气瓶存放间距需调整',
    enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    source: 'task', sourceLabel: '消防设施突击检查', workGroup: '消防专项组',
    status: 'todo', priority: 'high', deadline: '2026-04-08T18:00:00Z',
    createdAt: '2026-03-18T14:00:00Z',
  },
  // 过期待办
  {
    id: 'td-014', title: '鑫达化工应急预案修订', description: '应急预案需在季度末完成修订',
    enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    source: 'ai_push', sourceLabel: 'AI推送', workGroup: '消防专项组',
    status: 'todo', priority: 'critical', deadline: '2026-03-31T18:00:00Z',
    createdAt: '2026-03-20T08:00:00Z',
  },
  {
    id: 'td-015', title: '宏基机械安全员配置核查', description: '安全管理人员配置是否达到规定人数',
    enterpriseId: 'ent-003', enterpriseName: '宏基机械制造有限公司',
    source: 'ai_push', sourceLabel: 'AI推送', workGroup: '园区日常组',
    status: 'todo', priority: 'medium', deadline: '2026-04-03T18:00:00Z',
    createdAt: '2026-03-30T09:00:00Z',
  },
]

// ==================== 检查任务 Mock 数据 ====================

const tasks: InspectionTask[] = [
  {
    id: 'task-001', title: '日常巡查 Q2 第1周', type: 'daily', urgency: 'medium',
    description: '对责任池内企业进行日常安全巡查，重点关注高风险企业',
    startDate: '2026-03-31T08:00:00Z', deadline: '2026-04-06T18:00:00Z',
    status: 'in_progress', overallProgress: 65,
    totalSubTasks: 20, completedSubTasks: 13, assignedExpertCount: 4,
    mySubTasks: [
      { id: 'st-001', taskId: 'task-001', title: '检查鑫达化工消防设施', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司', status: 'completed', completedAt: '2026-04-03T10:00:00Z' },
      { id: 'st-002', taskId: 'task-001', title: '检查天成建材安全制度', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司', status: 'in_progress' },
      { id: 'st-003', taskId: 'task-001', title: '检查华通物流应急设施', enterpriseId: 'ent-006', enterpriseName: '华通物流有限公司', status: 'pending' },
      { id: 'st-004', taskId: 'task-001', title: '检查永安制药双重预防', enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司', status: 'completed', completedAt: '2026-04-03T10:30:00Z' },
      { id: 'st-005', taskId: 'task-001', title: '检查鑫源金属喷漆车间', enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司', status: 'pending' },
    ],
  },
  {
    id: 'task-002', title: '消防设施突击检查', type: 'special', urgency: 'critical',
    description: '对辖区内所有企业进行消防设施专项突击检查',
    startDate: '2026-04-01T08:00:00Z', deadline: '2026-04-10T18:00:00Z',
    status: 'in_progress', overallProgress: 30,
    totalSubTasks: 15, completedSubTasks: 4, assignedExpertCount: 3,
    mySubTasks: [
      { id: 'st-006', taskId: 'task-002', title: '突击检查鑫达化工消防设施', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司', status: 'completed', completedAt: '2026-04-02T14:00:00Z' },
      { id: 'st-007', taskId: 'task-002', title: '突击检查天成建材消防器材', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司', status: 'in_progress' },
      { id: 'st-008', taskId: 'task-002', title: '突击检查华通物流消防通道', enterpriseId: 'ent-006', enterpriseName: '华通物流有限公司', status: 'pending' },
      { id: 'st-009', taskId: 'task-002', title: '突击检查鑫源金属消防设施', enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司', status: 'pending' },
      { id: 'st-010', taskId: 'task-002', title: '突击检查万通木业灭火器', enterpriseId: 'ent-010', enterpriseName: '万通木业有限公司', status: 'completed', completedAt: '2026-03-31T15:00:00Z' },
      { id: 'st-011', taskId: 'task-002', title: '突击检查恒盛食品厂消防设施', enterpriseId: 'ent-002', enterpriseName: '恒盛食品加工厂', status: 'pending' },
    ],
  },
  {
    id: 'task-003', title: '化工企业专项排查', type: 'special', urgency: 'high',
    description: '对辖区内化工企业进行安全隐患专项排查',
    startDate: '2026-04-05T08:00:00Z', deadline: '2026-04-20T18:00:00Z',
    status: 'in_progress', overallProgress: 10,
    totalSubTasks: 8, completedSubTasks: 0, assignedExpertCount: 2,
    mySubTasks: [
      { id: 'st-012', taskId: 'task-003', title: '排查鑫达化工危化品管理', enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司', status: 'pending' },
      { id: 'st-013', taskId: 'task-003', title: '排查天成建材粉尘防护', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司', status: 'pending' },
      { id: 'st-014', taskId: 'task-003', title: '排查永安制药危化品存储', enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司', status: 'pending' },
    ],
  },
  {
    id: 'task-004', title: '日常巡查 Q2 第2周', type: 'daily', urgency: 'medium',
    description: '第二周日常巡查，重点关注上周未完成检查的企业',
    startDate: '2026-04-07T08:00:00Z', deadline: '2026-04-13T18:00:00Z',
    status: 'in_progress', overallProgress: 0,
    totalSubTasks: 18, completedSubTasks: 0, assignedExpertCount: 4,
    mySubTasks: [
      { id: 'st-015', taskId: 'task-004', title: '复查恒盛食品厂培训记录', enterpriseId: 'ent-002', enterpriseName: '恒盛食品加工厂', status: 'pending' },
      { id: 'st-016', taskId: 'task-004', title: '检查博远包装安全制度', enterpriseId: 'ent-008', enterpriseName: '博远包装材料有限公司', status: 'pending' },
    ],
  },
]

// ==================== 工作组 Mock 数据 ====================

const workGroups: WorkGroup[] = [
  {
    id: 'wg-001', name: '消防专项组', enterpriseCount: 62,
    enterprises: enterprises.filter(e => e.workGroups.includes('消防专项组')).map(e => ({
      enterpriseId: e.id, enterpriseName: e.name, riskScore: e.riskScore,
      overlapGroups: e.workGroups.filter(g => g !== '消防专项组'),
    })),
  },
  {
    id: 'wg-002', name: '化工巡查组', enterpriseCount: 45,
    enterprises: enterprises.filter(e => e.workGroups.includes('化工巡查组')).map(e => ({
      enterpriseId: e.id, enterpriseName: e.name, riskScore: e.riskScore,
      overlapGroups: e.workGroups.filter(g => g !== '化工巡查组'),
    })),
  },
  {
    id: 'wg-003', name: '园区日常组', enterpriseCount: 80,
    enterprises: enterprises.filter(e => e.workGroups.includes('园区日常组')).map(e => ({
      enterpriseId: e.id, enterpriseName: e.name, riskScore: e.riskScore,
      overlapGroups: e.workGroups.filter(g => g !== '园区日常组'),
    })),
  },
]

// ==================== 责任池变动 Mock 数据 ====================

const poolChanges: PoolChange[] = [
  {
    id: 'pc-001', type: 'added', enterpriseId: 'ent-010', enterpriseName: '万通木业有限公司',
    workGroup: '消防专项组',
    pendingItems: { openHazards: 1, openTodos: 0, pendingReviews: 0 },
    changedAt: '2026-04-04T08:00:00Z', read: false,
  },
  {
    id: 'pc-002', type: 'transferred_in', enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    fromExpert: '张伟', toExpert: '我', workGroup: '消防专项组',
    pendingItems: { openHazards: 3, openTodos: 2, pendingReviews: 0 },
    changedAt: '2026-04-03T16:00:00Z', read: false,
  },
  {
    id: 'pc-003', type: 'transferred_in', enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    fromExpert: '李芳', toExpert: '我', workGroup: '化工巡查组',
    pendingItems: { openHazards: 4, openTodos: 1, pendingReviews: 0 },
    changedAt: '2026-04-02T14:00:00Z', read: true,
  },
  {
    id: 'pc-004', type: 'added', enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司',
    workGroup: '化工巡查组',
    pendingItems: { openHazards: 1, openTodos: 1, pendingReviews: 0 },
    changedAt: '2026-04-01T10:00:00Z', read: true,
  },
  {
    id: 'pc-005', type: 'transferred_out', enterpriseId: 'ent-old-001', enterpriseName: '旧企业A有限公司',
    toExpert: '王磊', workGroup: '园区日常组',
    pendingItems: { openHazards: 0, openTodos: 1, pendingReviews: 0 },
    changedAt: '2026-03-30T09:00:00Z', read: true,
  },
  {
    id: 'pc-006', type: 'removed', enterpriseId: 'ent-old-002', enterpriseName: '旧企业B有限公司',
    workGroup: '消防专项组',
    pendingItems: { openHazards: 0, openTodos: 0, pendingReviews: 0 },
    changedAt: '2026-03-28T16:00:00Z', read: true,
  },
  {
    id: 'pc-007', type: 'added', enterpriseId: 'ent-005', enterpriseName: '瑞祥电子科技有限公司',
    workGroup: '园区日常组',
    pendingItems: { openHazards: 0, openTodos: 0, pendingReviews: 0 },
    changedAt: '2026-03-25T14:00:00Z', read: true,
  },
]

// ==================== 沟通 Mock 数据 ====================

const chatEnterprises: ChatEnterprise[] = [
  {
    enterpriseId: 'ent-001', enterpriseName: '鑫达化工有限公司',
    safetyOfficerName: '李明辉',
    lastMessage: '收到，我马上安排人处理消防通道问题。',
    lastMessageTime: '2026-04-03T10:30:00Z', unreadCount: 2,
  },
  {
    enterpriseId: 'ent-002', enterpriseName: '恒盛食品加工厂',
    safetyOfficerName: '陈志强',
    lastMessage: '3份培训记录今天会补齐，请放心。',
    lastMessageTime: '2026-04-02T14:15:00Z', unreadCount: 0,
  },
  {
    enterpriseId: 'ent-004', enterpriseName: '天成建材有限公司',
    safetyOfficerName: '周磊',
    lastMessage: '供应商明天上午过来维修监测系统。',
    lastMessageTime: '2026-04-04T10:05:00Z', unreadCount: 1,
  },
  {
    enterpriseId: 'ent-006', enterpriseName: '华通物流有限公司',
    safetyOfficerName: '吴刚',
    lastMessage: '应急预案初稿已完成，正在走内部审批流程。',
    lastMessageTime: '2026-04-02T11:30:00Z', unreadCount: 0,
  },
  {
    enterpriseId: 'ent-007', enterpriseName: '永安制药有限公司',
    safetyOfficerName: '林婷',
    lastMessage: '好的，风险管控清单下周完成更新。',
    lastMessageTime: '2026-04-03T11:00:00Z', unreadCount: 1,
  },
  {
    enterpriseId: 'ent-009', enterpriseName: '鑫源金属制品有限公司',
    safetyOfficerName: '钱浩',
    lastMessage: '喷漆车间通风设备需要更换配件，已联系厂家。',
    lastMessageTime: '2026-04-04T08:45:00Z', unreadCount: 3,
  },
]

const chatMessages: Record<string, ChatMessage[]> = {
  'ent-001': [
    { id: 'msg-001', enterpriseId: 'ent-001', senderType: 'expert', senderName: '我', content: '李明辉，你们厂消防通道被原材料占用了，需要尽快清理。', type: 'text', sentAt: '2026-04-03T09:00:00Z' },
    { id: 'msg-002', enterpriseId: 'ent-001', senderType: 'system', senderName: '系统', content: '关联隐患：生产车间东侧消防通道被原材料堆放占用', type: 'system', relatedHazardId: 'hz-001', sentAt: '2026-04-03T09:00:01Z' },
    { id: 'msg-003', enterpriseId: 'ent-001', senderType: 'officer', senderName: '李明辉', content: '好的，我马上安排人清理。预计今天下午可以完成。', type: 'text', sentAt: '2026-04-03T09:15:00Z' },
    { id: 'msg-004', enterpriseId: 'ent-001', senderType: 'expert', senderName: '我', content: '清理后拍照发我确认一下。', type: 'text', sentAt: '2026-04-03T09:20:00Z' },
    { id: 'msg-005', enterpriseId: 'ent-001', senderType: 'officer', senderName: '李明辉', content: '收到，我马上安排人处理消防通道问题。', type: 'text', sentAt: '2026-04-03T10:30:00Z' },
  ],
  'ent-002': [
    { id: 'msg-006', enterpriseId: 'ent-002', senderType: 'expert', senderName: '我', content: '陈工，新员工安全培训记录有3份缺失，需要在4月7日前补齐。', type: 'text', sentAt: '2026-04-02T13:30:00Z' },
    { id: 'msg-007', enterpriseId: 'ent-002', senderType: 'officer', senderName: '陈志强', content: '收到，我查一下是哪几位新员工的。', type: 'text', sentAt: '2026-04-02T13:45:00Z' },
    { id: 'msg-008', enterpriseId: 'ent-002', senderType: 'officer', senderName: '陈志强', content: '找到了，是上个月入职的3位。3份培训记录今天会补齐，请放心。', type: 'text', sentAt: '2026-04-02T14:15:00Z' },
  ],
  'ent-004': [
    { id: 'msg-009', enterpriseId: 'ent-004', senderType: 'expert', senderName: '我', content: '周磊，你们厂消防器材需要紧急更换，干粉灭火器已经过期了。', type: 'text', sentAt: '2026-04-03T15:00:00Z' },
    { id: 'msg-010', enterpriseId: 'ent-004', senderType: 'system', senderName: '系统', content: '关联隐患：消防水带老化破损，干粉灭火器超过检验有效期', type: 'system', relatedHazardId: 'hz-007', sentAt: '2026-04-03T15:00:01Z' },
    { id: 'msg-011', enterpriseId: 'ent-004', senderType: 'officer', senderName: '周磊', content: '好的，我已经向厂里申请采购新的消防器材了。', type: 'text', sentAt: '2026-04-03T15:30:00Z' },
    { id: 'msg-012', enterpriseId: 'ent-004', senderType: 'officer', senderName: '周磊', content: '供应商明天上午过来维修监测系统。', type: 'text', sentAt: '2026-04-04T10:05:00Z' },
  ],
  'ent-006': [
    { id: 'msg-013', enterpriseId: 'ent-006', senderType: 'expert', senderName: '我', content: '吴刚，你们厂的应急预案超期一年没更新了，需要尽快修订。', type: 'text', sentAt: '2026-04-02T11:00:00Z' },
    { id: 'msg-014', enterpriseId: 'ent-006', senderType: 'officer', senderName: '吴刚', content: '应急预案初稿已完成，正在走内部审批流程。', type: 'text', sentAt: '2026-04-02T11:30:00Z' },
  ],
  'ent-007': [
    { id: 'msg-015', enterpriseId: 'ent-007', senderType: 'expert', senderName: '我', content: '林婷，风险管控清单需要更新，部分项已超过更新周期。', type: 'text', sentAt: '2026-04-03T10:45:00Z' },
    { id: 'msg-016', enterpriseId: 'ent-007', senderType: 'officer', senderName: '林婷', content: '好的，风险管控清单下周完成更新。', type: 'text', sentAt: '2026-04-03T11:00:00Z' },
  ],
  'ent-009': [
    { id: 'msg-017', enterpriseId: 'ent-009', senderType: 'expert', senderName: '我', content: '钱浩，喷漆车间VOCs超标了，通风设施需要赶紧修。', type: 'text', sentAt: '2026-04-04T08:30:00Z' },
    { id: 'msg-018', enterpriseId: 'ent-009', senderType: 'officer', senderName: '钱浩', content: '我去看了，通风设备电机坏了，需要更换配件。', type: 'text', sentAt: '2026-04-04T08:40:00Z' },
    { id: 'msg-019', enterpriseId: 'ent-009', senderType: 'expert', senderName: '我', content: '联系厂家了吗？这个问题需要尽快解决。', type: 'text', sentAt: '2026-04-04T08:42:00Z' },
    { id: 'msg-020', enterpriseId: 'ent-009', senderType: 'officer', senderName: '钱浩', content: '喷漆车间通风设备需要更换配件，已联系厂家。', type: 'text', sentAt: '2026-04-04T08:45:00Z' },
  ],
}

// ==================== 驾驶舱聚合数据 ====================

const dashboardKpi: DashboardKpi = {
  todayTodoCount: 8,
  weekExpiringCount: 12,
  overdueCount: 2,
  monthCompletedCount: 34,
}

const workProgress: WorkProgress = {
  visitCoverageRate: 68,
  hazardDiscoveryCount: 12,
  rectificationPushCount: 8,
  ledgerCompleteness: 75,
}

const taskProgress: TaskProgressOverview = {
  dailyTaskCount: 2,
  dailyAvgProgress: 33,
  specialTaskCount: 2,
  specialAvgProgress: 20,
  nearestDeadline: '2026-04-06T18:00:00Z',
}

// ==================== 专家绩效评估 Mock 数据 ====================

const performanceDimensions: PerformanceDimension[] = [
  { id: 'coverage', name: '企业基础覆盖度', weight: 10, score: 78, targetScore: 85, trend: 'up', formula: '账号开通率 + 信息采集完整率' },
  { id: 'systemization', name: '制度数字化完善度', weight: 10, score: 65, targetScore: 80, trend: 'stable', formula: '已完善制度企业比例' },
  { id: 'risk_accuracy', name: '风险识别精准度', weight: 10, score: 82, targetScore: 75, trend: 'up', formula: '实际识别风险点数 / AI判定应识别数' },
  { id: 'plan_quality', name: '检查计划科学度', weight: 10, score: 70, targetScore: 80, trend: 'up', formula: '计划覆盖重大/较大风险点企业比例' },
  { id: 'check_activity', name: '自查执行活跃度', weight: 15, score: 55, targetScore: 70, trend: 'down', formula: '计划实际检查达标户数比例' },
  { id: 'hazard_governance', name: '隐患闭环治理度', weight: 15, score: 68, targetScore: 75, trend: 'stable', formula: '隐患发现率 + 隐患整改完成率' },
  { id: 'remote_effectiveness', name: '远程监管效能度', weight: 30, score: 72, targetScore: 80, trend: 'up', formula: '远程监管覆盖率 + 按户/项整改完成率' },
]

const expertPerformance: ExpertPerformance = {
  overallScore: 69,
  dimensions: performanceDimensions,
  rankInTeam: 3,
  totalTeamMembers: 8,
  updatedAt: '2026-04-04T18:00:00Z',
}

// ==================== 运营指引 Mock 数据 ====================

const operationalNudges: OperationalNudge[] = [
  {
    id: 'nudge-001',
    type: 'warning',
    content: '本周重点：生产企业隐患整改逾期率达 35%，建议优先跟进鑫达化工、天成建材、鑫源金属的整改进度',
    relatedMetric: '隐患整改逾期率',
    relatedEnterpriseType: 'production',
    relatedEnterpriseIds: ['ent-001', 'ent-004', 'ent-009'],
    priority: 1,
    createdAt: '2026-04-04T08:00:00Z',
    dismissed: false,
  },
  {
    id: 'nudge-002',
    type: 'supervision',
    content: '新增 2 家从不自查企业：天成建材（自开通以来未提交自查）、鑫源金属（连续 3 个月未自查），建议进行首访',
    relatedMetric: '从不自查率',
    relatedEnterpriseIds: ['ent-004', 'ent-009'],
    priority: 2,
    createdAt: '2026-04-04T08:00:00Z',
    dismissed: false,
  },
  {
    id: 'nudge-003',
    type: 'supervision',
    content: '消防重点单位华通物流自查自纠逾期，应急预案修订已超期 2 周',
    relatedMetric: '自查自纠逾期率',
    relatedEnterpriseType: 'fire_key',
    relatedEnterpriseIds: ['ent-006'],
    priority: 3,
    createdAt: '2026-04-03T08:00:00Z',
    dismissed: false,
  },
]

// ==================== 运营指标 Mock 数据 ====================

const operationalMetrics: OperationalMetrics = {
  hazardRectificationOverdueRate: 35,
  selfCheckOverdueRate: 22,
  neverSelfCheckRate: 20,
  weeklyTrendGrowth: 8,
  monthlyTrendGrowth: 15,
}

// ==================== 派单队列 Mock 数据（派单执行型） ====================

// 三类队列任务（专家视角）：
// - risk_check: 风险核对（AI与专家评级不一致，需专家定级）
// - ai_evaluation: AI评估（AI分析评估不合格，需专家打开详情确认后生成待办）
// - task: 隐患与待办（合并原 todo_issue + hazard_review，详情页区分隐患/待办类型）
export type TaskType = 'risk_check' | 'ai_evaluation' | 'task'
export type TaskPriority = 'urgent' | 'today' | 'later'
export type TaskStatus = 'pending' | 'completed'

export interface QueueTask {
  id: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  enterpriseId: string
  enterpriseName: string
  enterpriseAddress?: string
  enterpriseCategory?: string
  // 企业风险等级（来自企业档案）
  riskLevel?: '重大风险' | '较大风险' | '一般风险' | '低风险'
  // 所属镇街/村社
  townStreet?: string
  villageCommunity?: string
  // 共用字段
  title: string          // 任务标题（大白话）
  description: string    // 任务描述
  actionLabel: string    // 动作按钮文字
  createdAt: string
  // 风险核对
  aiScore?: number
  aiLevel?: string
  expertScore?: number
  aiReasoning?: string
  daysPending?: number
  // 隐患与待办（合并原 todo_issue + hazard_review）
  taskCategory?: 'hazard' | 'todo'  // 详情页区分：隐患单 or 待办
  hazardDescription?: string
  hazardLevel?: 'general' | 'major'
  hazardLocation?: string
  rectifyDeadline?: string
  overdueDays?: number
  todoOverdueDays?: number
  // 来源标签
  sourceTag?: 'ai_push' | 'manual' | 'external_sync' | 'gov_platform'
  // 隐患复核（仅 taskCategory= hazard 时有）
  hazardId?: string
  rectificationNote?: string
  rectificationPhotos?: string[]
}

const queueTasks: QueueTask[] = [
  // ==================== 🔴 紧急 ====================
  // ① 风险核对 - 重大风险 AI=18，未标注
  {
    id: 'qt-001',
    type: 'risk_check',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-001',
    enterpriseName: '鑫达化工有限公司',
    enterpriseAddress: '滨海新区化工路88号',
    enterpriseCategory: 'production',
    riskLevel: '重大风险',
    townStreet: '滨海新区',
    villageCommunity: '化工园区',
    aiScore: 22,
    aiLevel: '重大风险',
    aiReasoning: '近30天监控异常3次 | 消防设施检查得分45分（低于均值30%） | 隐患整改率60%（低于目标85%）',
    daysPending: 3,
    title: '风险评级待核对',
    description: 'AI判定：重大风险（22分） | 专家未标注',
    actionLabel: '去标注',
    createdAt: '2026-04-01T08:00:00Z',
  },
  // ① 风险核对 - 重大风险 AI=18
  {
    id: 'qt-010',
    type: 'risk_check',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-004',
    enterpriseName: '天成建材有限公司',
    enterpriseAddress: '城东工业园建材路56号',
    enterpriseCategory: 'production',
    aiScore: 18,
    aiLevel: '重大风险',
    aiReasoning: '多项安全指标严重不达标 | 消防设施过期 | 4项未闭环隐患 | 从不自查 | 粉尘监测系统离线',
    daysPending: 7,
    title: '风险评级待核对',
    description: 'AI判定：重大风险（18分） | 专家未标注',
    actionLabel: '去标注',
    createdAt: '2026-03-28T08:00:00Z',
  },
  // ① 风险核对 - 重大风险 AI=28
  {
    id: 'qt-011',
    type: 'risk_check',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-009',
    enterpriseName: '鑫源金属制品有限公司',
    enterpriseAddress: '经济开发区冶金路99号',
    enterpriseCategory: 'production',
    aiScore: 28,
    aiLevel: '重大风险',
    aiReasoning: '金属加工行业 | 3项未闭环隐患 | VOCs超标 | 从不自查 | 连续3个月无检查记录',
    daysPending: 4,
    title: '风险评级待核对',
    description: 'AI判定：重大风险（28分） | 专家未标注',
    actionLabel: '去标注',
    createdAt: '2026-04-01T14:00:00Z',
  },
  // ① 风险核对 - 较大风险 AI=35
  {
    id: 'qt-012',
    type: 'risk_check',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-006',
    enterpriseName: '华通物流有限公司',
    enterpriseAddress: '交通枢纽物流园区A区',
    enterpriseCategory: 'fire_key',
    aiScore: 35,
    aiLevel: '较大风险',
    aiReasoning: '消防重点单位 | 应急预案超期1年 | 仓储区消防设施遮挡 | 自查逾期',
    daysPending: 2,
    title: '风险评级待核对',
    description: 'AI判定：较大风险（35分） | 专家未标注',
    actionLabel: '去标注',
    createdAt: '2026-04-03T11:00:00Z',
  },
  // ① 风险核对 - 较大风险 AI=45
  {
    id: 'qt-013',
    type: 'risk_check',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-002',
    enterpriseName: '恒盛食品加工厂',
    enterpriseAddress: '经济开发区食品园12号',
    enterpriseCategory: 'production',
    aiScore: 45,
    aiLevel: '较大风险',
    aiReasoning: '教育培训台账缺失3份 | 安全制度过期未更新 | 自查率偏低50%',
    daysPending: 2,
    title: '风险评级待核对',
    description: 'AI判定：较大风险（45分） | 专家未标注',
    actionLabel: '去标注',
    createdAt: '2026-04-02T10:00:00Z',
  },
  // ① 风险核对 - 较大风险 AI=52
  {
    id: 'qt-014',
    type: 'risk_check',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-010',
    enterpriseName: '万通木业有限公司',
    enterpriseAddress: '北郊工业路150号',
    enterpriseCategory: 'general',
    aiScore: 52,
    aiLevel: '较大风险',
    aiReasoning: '木材加工行业（易燃）| 干燥车间灭火器配置不足 | 事故管理板块得分偏低',
    daysPending: 1,
    title: '风险评级待核对',
    description: 'AI判定：较大风险（52分） | 专家未标注',
    actionLabel: '去标注',
    createdAt: '2026-04-02T16:00:00Z',
  },

  // ② AI评估 - AI五个维度分析不合格，需专家确认后生成待办
  {
    id: 'qt-021',
    type: 'ai_evaluation',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-001',
    enterpriseName: '鑫达化工有限公司',
    enterpriseAddress: '滨海新区化工路88号',
    enterpriseCategory: 'production',
    riskLevel: '重大风险',
    townStreet: '滨海新区',
    villageCommunity: '化工园区',
    aiReasoning: '制度建设情况：制度缺失3项 | 风险点辨识情况：辨识报告未更新 | 检查计划执行情况：近30天检查完成率仅45%',
    title: 'AI安全报告待确认',
    description: 'AI评估：5个维度综合不合格 | 制度建设、风险辨识、检查执行均存在缺陷',
    actionLabel: '查看评估',
    createdAt: '2026-04-05T08:00:00Z',
  },
  {
    id: 'qt-022',
    type: 'ai_evaluation',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-002',
    enterpriseName: '恒盛食品加工厂',
    enterpriseAddress: '经济开发区食品园12号',
    enterpriseCategory: 'production',
    riskLevel: '较大风险',
    townStreet: '经济开发区',
    villageCommunity: '食品工业园',
    aiReasoning: '教育培训情况：新员工培训记录缺失5人份 | 安全制度情况：制度文件过期6个月未更新',
    title: 'AI安全报告待确认',
    description: 'AI评估：教育培训板块不合格 | 新员工培训记录不完整，制度过期',
    actionLabel: '查看评估',
    createdAt: '2026-04-05T09:30:00Z',
  },
  {
    id: 'qt-023',
    type: 'ai_evaluation',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-004',
    enterpriseName: '天成建材有限公司',
    enterpriseAddress: '城东工业园建材路56号',
    enterpriseCategory: 'production',
    riskLevel: '重大风险',
    townStreet: '城东工业园',
    villageCommunity: '建材园',
    aiReasoning: '隐患整改情况：4项重大隐患逾期未整改 | 应急管理情况：应急预案超过2年未演练',
    title: 'AI安全报告待确认',
    description: 'AI评估：隐患整改板块不合格 | 4项重大隐患逾期，应急演练缺失',
    actionLabel: '查看评估',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'qt-024',
    type: 'ai_evaluation',
    priority: 'later',
    status: 'pending',
    enterpriseId: 'ent-006',
    enterpriseName: '华东纺织印染有限公司',
    enterpriseAddress: '滨海工业区纺织路28号',
    enterpriseCategory: 'production',
    riskLevel: '较大风险',
    townStreet: '滨海工业区',
    villageCommunity: '纺织印染园',
    aiReasoning: '检查计划制定情况：季度检查计划未制定 | 制度建设情况：安全生产责任制未落实到班组',
    title: 'AI安全报告待确认',
    description: 'AI评估：制度建设与检查计划均不完善 | 责任制未落实，检查计划缺失',
    actionLabel: '查看评估',
    createdAt: '2026-04-04T14:00:00Z',
  },

  // ③ 隐患与待办 - 专家创建隐患/待办，等待企业处理
  {
    id: 'qt-015',
    type: 'task',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-009',
    enterpriseName: '鑫源金属制品有限公司',
    enterpriseAddress: '经济开发区冶金路99号',
    enterpriseCategory: 'production',
    riskLevel: '较大风险',
    townStreet: '经济开发区',
    villageCommunity: '冶金工业园',
    taskCategory: 'hazard', // 隐患单
    hazardDescription: '喷漆车间通风设施故障，VOCs浓度超标3倍',
    hazardLevel: 'major',
    hazardLocation: '2号喷漆车间',
    rectifyDeadline: '2026-04-08T18:00:00Z',
    title: '隐患待整改',
    description: '喷漆车间通风故障，VOCs超标 | 重大隐患 | 待企业整改',
    actionLabel: '查看详情',
    createdAt: '2026-04-04T09:00:00Z',
  },
  {
    id: 'qt-016',
    type: 'task',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-004',
    enterpriseName: '天成建材有限公司',
    enterpriseAddress: '城东工业园建材路56号',
    enterpriseCategory: 'production',
    riskLevel: '一般风险',
    townStreet: '城东工业园',
    villageCommunity: '建材园',
    taskCategory: 'hazard',
    hazardDescription: '1号仓库消防水带老化破损，干粉灭火器超过检验有效期',
    hazardLevel: 'major',
    hazardLocation: '1号仓库消防器材柜',
    rectifyDeadline: '2026-04-06T18:00:00Z',
    overdueDays: 1,
    title: '隐患待整改',
    description: '消防器材老化过期 | 重大隐患 | 已逾期1天',
    actionLabel: '联系安管员',
    createdAt: '2026-04-03T09:00:00Z',
  },
  {
    id: 'qt-017',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-007',
    enterpriseName: '永安制药有限公司',
    enterpriseAddress: '生物医药产业园8号',
    enterpriseCategory: 'production',
    issueSource: 'hazard',
    hazardDescription: '危化品仓库温控系统数据异常，部分储存条件超出安全范围',
    hazardLevel: 'major',
    hazardLocation: '危化品仓库B区',
    rectifyDeadline: '2026-04-10T18:00:00Z',
    title: '待办下发',
    description: '隐患单：危化品仓库温控异常 | 重大隐患 | 待企业整改',
    actionLabel: '查看详情',
    createdAt: '2026-04-03T11:00:00Z',
  },
  {
    id: 'qt-018',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-002',
    enterpriseName: '恒盛食品加工厂',
    enterpriseAddress: '经济开发区食品园12号',
    enterpriseCategory: 'production',
    issueSource: 'todo', // 指导服务待办
    hazardDescription: '3号生产线配电箱绝缘老化，存在触电风险',
    hazardLevel: 'general',
    hazardLocation: '3号生产线配电箱',
    rectifyDeadline: '2026-04-10T18:00:00Z',
    title: '待办下发',
    description: '待办：配电箱绝缘老化 | 一般隐患 | 待企业整改',
    actionLabel: '查看详情',
    createdAt: '2026-04-02T16:00:00Z',
  },
  {
    id: 'qt-019',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-008',
    enterpriseName: '博远包装材料有限公司',
    enterpriseAddress: '城西工业集中区22号',
    enterpriseCategory: 'general',
    issueSource: 'hazard',
    hazardDescription: '印刷车间粉尘积聚，除尘设备滤芯超过更换周期',
    hazardLevel: 'general',
    hazardLocation: '印刷车间除尘设备',
    rectifyDeadline: '2026-04-12T18:00:00Z',
    title: '待办下发',
    description: '隐患单：除尘设备滤芯未及时更换 | 一般隐患',
    actionLabel: '查看详情',
    createdAt: '2026-04-03T14:00:00Z',
  },
  {
    id: 'qt-020',
    type: 'task',
    priority: 'later',
    status: 'pending',
    enterpriseId: 'ent-003',
    enterpriseName: '宏基机械制造有限公司',
    enterpriseAddress: '高新区工业大道200号',
    enterpriseCategory: 'production',
    issueSource: 'hazard',
    hazardDescription: '3号车间行车吊钩防脱装置失效',
    hazardLevel: 'major',
    hazardLocation: '3号车间行车',
    rectifyDeadline: '2026-04-10T18:00:00Z',
    title: '待办下发',
    description: '隐患单：行车吊钩防脱失效 | 重大隐患',
    actionLabel: '查看详情',
    createdAt: '2026-04-04T10:00:00Z',
  },
  {
    id: 'qt-033',
    type: 'task',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-004',
    enterpriseName: '天成建材有限公司',
    enterpriseAddress: '城东工业园建材路56号',
    enterpriseCategory: 'production',
    riskLevel: '一般风险',
    townStreet: '城东工业园',
    villageCommunity: '建材园',
    taskCategory: 'todo',
    hazardDescription: '粉尘浓度在线监测系统离线，供应商技术人员上门维修',
    hazardLevel: undefined,
    hazardLocation: '监测系统',
    rectifyDeadline: '2026-04-05T18:00:00Z',
    sourceTag: 'external_sync', // 三方平台同步
    title: '待办跟进',
    description: '监测系统维修跟进 | 今日到期',
    actionLabel: '跟进进度',
    createdAt: '2026-04-04T10:00:00Z',
  },
  {
    id: 'qt-034',
    type: 'task',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-001',
    enterpriseName: '鑫达化工有限公司',
    enterpriseAddress: '滨海新区化工路88号',
    enterpriseCategory: 'production',
    riskLevel: '重大风险',
    townStreet: '滨海新区',
    villageCommunity: '化工园区',
    taskCategory: 'todo',
    hazardDescription: '消防通道原材料已转移，需专家现场复核清空情况',
    hazardLevel: undefined,
    hazardLocation: '消防通道',
    rectifyDeadline: '2026-04-05T18:00:00Z',
    sourceTag: 'manual', // 手动创建
    title: '待办跟进',
    description: '消防通道现场复核 | 今日到期',
    actionLabel: '跟进进度',
    createdAt: '2026-04-04T11:30:00Z',
  },
  {
    id: 'qt-035',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-002',
    enterpriseName: '恒盛食品加工厂',
    enterpriseAddress: '经济开发区食品园12号',
    enterpriseCategory: 'production',
    riskLevel: '一般风险',
    townStreet: '经济开发区',
    villageCommunity: '食品工业园',
    taskCategory: 'todo',
    hazardDescription: '新员工三级安全教育培训记录补齐，电话跟进确认提交情况',
    hazardLevel: undefined,
    hazardLocation: '培训记录',
    rectifyDeadline: '2026-04-07T18:00:00Z',
    sourceTag: 'manual', // 手动创建
    title: '待办跟进',
    description: '培训记录补齐跟进 | 截止4月7日',
    actionLabel: '跟进进度',
    createdAt: '2026-04-02T14:00:00Z',
  },
  {
    id: 'qt-036',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-006',
    enterpriseName: '华通物流有限公司',
    enterpriseAddress: '交通枢纽物流园区A区',
    enterpriseCategory: 'fire_key',
    riskLevel: '较大风险',
    townStreet: '交通枢纽区',
    villageCommunity: '物流园社区',
    taskCategory: 'todo',
    hazardDescription: '应急预案修订稿内部审批流程，微信跟进审批进度',
    hazardLevel: undefined,
    hazardLocation: '应急预案',
    rectifyDeadline: '2026-04-12T18:00:00Z',
    title: '待办下发',
    description: '待办：预案修订审批跟进 | 来源：AI推送 | 截止4月12日',
    actionLabel: '跟进进度',
    createdAt: '2026-04-02T11:30:00Z',
  },
  {
    id: 'qt-037',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-007',
    enterpriseName: '永安制药有限公司',
    enterpriseAddress: '生物医药产业园8号',
    enterpriseCategory: 'production',
    issueSource: 'todo',
    hazardDescription: '双重预防系统风险管控清单更新，预计本周内完成',
    hazardLevel: undefined,
    hazardLocation: '双重预防系统',
    rectifyDeadline: '2026-04-09T18:00:00Z',
    title: '待办下发',
    description: '待办：管控清单更新跟进 | 来源：AI推送 | 截止4月9日',
    actionLabel: '跟进进度',
    createdAt: '2026-04-03T10:30:00Z',
  },
  {
    id: 'qt-038',
    type: 'task',
    priority: 'later',
    status: 'pending',
    enterpriseId: 'ent-003',
    enterpriseName: '宏基机械制造有限公司',
    enterpriseAddress: '高新区工业大道200号',
    enterpriseCategory: 'production',
    issueSource: 'todo',
    hazardDescription: '安全管理人员配置核查，核实是否达到规定人数',
    hazardLevel: undefined,
    hazardLocation: '机构职责',
    rectifyDeadline: '2026-04-10T18:00:00Z',
    title: '待办下发',
    description: '待办：安全员配置核查 | 来源：AI推送 | 截止4月10日',
    actionLabel: '跟进进度',
    createdAt: '2026-04-03T09:00:00Z',
  },

  // ③ 隐患与待办 - 待复核/待推进
  {
    id: 'qt-040',
    type: 'task',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-004',
    enterpriseName: '天成建材有限公司',
    enterpriseAddress: '城东工业园建材路56号',
    enterpriseCategory: 'production',
    hazardId: 'hz-007',
    hazardDescription: '消防通道堵塞 / 灭火器过期',
    hazardLevel: '重大隐患',
    rectifyDeadline: '2026-04-05T18:00:00Z',
    overdueDays: 5,
    title: '隐患逾期未整改',
    description: '隐患：消防通道堵塞 / 灭火器过期（已逾期5天）',
    actionLabel: '联系安管员',
    createdAt: '2026-03-28T10:00:00Z',
  },
  {
    id: 'qt-041',
    type: 'task',
    priority: 'urgent',
    status: 'pending',
    enterpriseId: 'ent-001',
    enterpriseName: '鑫达化工有限公司',
    enterpriseAddress: '滨海新区化工路88号',
    enterpriseCategory: 'production',
    hazardId: 'hz-001',
    hazardDescription: '消防通道被原材料占用',
    hazardLevel: '重大隐患',
    rectifyDeadline: '2026-04-08T18:00:00Z',
    overdueDays: 2,
    title: '隐患逾期未整改',
    description: '隐患：消防通道被原材料占用（已逾期2天）',
    actionLabel: '联系安管员',
    createdAt: '2026-03-28T10:00:00Z',
  },
  {
    id: 'qt-042',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-002',
    enterpriseName: '恒盛食品加工厂',
    enterpriseAddress: '经济开发区食品园12号',
    enterpriseCategory: 'production',
    hazardId: 'hz-004',
    hazardDescription: '新员工三级安全教育培训记录缺失3份',
    hazardLevel: '一般隐患',
    rectifyDeadline: '2026-04-07T18:00:00Z',
    rectificationNote: '3份培训记录已补齐，扫描件已上传',
    rectificationPhotos: [],
    title: '企业整改待复核',
    description: '隐患：新员工培训记录缺失 → 企业已补齐，等待确认闭环',
    actionLabel: '查看并确认闭环',
    createdAt: '2026-04-02T15:00:00Z',
  },
  {
    id: 'qt-043',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-009',
    enterpriseName: '鑫源金属制品有限公司',
    enterpriseAddress: '经济开发区冶金路99号',
    enterpriseCategory: 'production',
    hazardId: 'hz-011',
    hazardDescription: '乙炔气瓶与氧气瓶存放间距不足',
    hazardLevel: '一般隐患',
    rectifyDeadline: '2026-04-08T18:00:00Z',
    rectificationNote: '气瓶已分开存放，间距达到2米以上',
    rectificationPhotos: [],
    title: '企业整改待复核',
    description: '隐患：气瓶存放间距不足 → 企业已整改，等待确认闭环',
    actionLabel: '查看并确认闭环',
    createdAt: '2026-04-04T10:00:00Z',
  },
  {
    id: 'qt-044',
    type: 'task',
    priority: 'today',
    status: 'pending',
    enterpriseId: 'ent-003',
    enterpriseName: '宏基机械制造有限公司',
    enterpriseAddress: '高新区工业大道200号',
    enterpriseCategory: 'production',
    hazardId: 'hz-005',
    hazardDescription: '冲压车间安全防护罩变形松动',
    hazardLevel: '一般隐患',
    rectifyDeadline: '2026-04-06T18:00:00Z',
    rectificationNote: '防护罩已维修加固，完成验收',
    rectificationPhotos: [],
    title: '企业整改待复核',
    description: '隐患：冲压车间防护罩松动 → 企业已维修完成，等待确认闭环',
    actionLabel: '查看并确认闭环',
    createdAt: '2026-04-02T08:00:00Z',
  },
  {
    id: 'qt-045',
    type: 'task',
    priority: 'later',
    status: 'pending',
    enterpriseId: 'ent-006',
    enterpriseName: '华通物流有限公司',
    enterpriseAddress: '交通枢纽物流园区A区',
    enterpriseCategory: 'fire_key',
    hazardId: 'hz-009',
    hazardDescription: '应急预案超期未更新（最近版本为2024年8月）',
    hazardLevel: '一般隐患',
    rectifyDeadline: '2026-04-12T18:00:00Z',
    rectificationNote: '新预案初稿已完成，正在内部审批流程中',
    rectificationPhotos: [],
    title: '企业整改待复核',
    description: '隐患：应急预案超期 → 企业修订中，等待最终确认',
    actionLabel: '查看进度',
    createdAt: '2026-04-03T09:00:00Z',
  },

  // ==================== ✅ 已完成 ====================
  {
    id: 'qt-039',
    type: 'task',
    priority: 'today',
    status: 'completed',
    enterpriseId: 'ent-001',
    enterpriseName: '鑫达化工有限公司',
    enterpriseAddress: '滨海新区化工路88号',
    enterpriseCategory: 'production',
    hazardId: 'hz-002',
    hazardDescription: '危化品仓库双锁管理 → 已整改完成',
    hazardLevel: '重大隐患',
    rectifyDeadline: '2026-04-10T18:00:00Z',
    rectificationNote: '已加装第二把锁，双锁管理制度已严格执行',
    rectificationPhotos: [],
    title: '企业整改待复核',
    description: '隐患：危化品仓库双锁管理 → 已整改完成',
    actionLabel: '确认闭环',
    createdAt: '2026-03-29T09:00:00Z',
  },
]

// ==================== 核对池（风险评级不一致）Mock 数据 ====================

const riskDiscrepancies: RiskDiscrepancy[] = [
  {
    id: 'rd-001',
    enterpriseId: 'ent-001',
    enterpriseName: '鑫达化工有限公司',
    enterpriseCategory: 'production',
    aiRiskLevel: 'critical',
    aiScore: 22,
    expertRiskLevel: undefined,
    expertScore: 35,
    status: 'pending',
    detectedAt: '2026-04-01T08:00:00Z',
    aiReasoning: 'AI 判定重大风险：化工行业 + 3项未闭环隐患（含2项重大）+ 隐患整改逾期率 67% + 消防通道长期堵塞',
  },
  {
    id: 'rd-002',
    enterpriseId: 'ent-002',
    enterpriseName: '恒盛食品加工厂',
    enterpriseCategory: 'production',
    aiRiskLevel: 'high',
    aiScore: 45,
    expertRiskLevel: undefined,
    expertScore: undefined,
    status: 'pending',
    detectedAt: '2026-04-02T10:00:00Z',
    aiReasoning: 'AI 判定较大风险：教育培训台账缺失 + 安全制度过期未更新 + 自查率偏低',
  },
  {
    id: 'rd-003',
    enterpriseId: 'ent-003',
    enterpriseName: '宏基机械制造有限公司',
    enterpriseCategory: 'production',
    aiRiskLevel: 'high',
    aiScore: 58,
    expertRiskLevel: 'high',
    expertScore: 55,
    status: 'pending',
    detectedAt: '2026-04-03T09:00:00Z',
    aiReasoning: 'AI 判定较大风险：双重预防个别薄弱环节 + 安全管理人员配置不足 + 冲压车间防护罩松动',
  },
  {
    id: 'rd-004',
    enterpriseId: 'ent-004',
    enterpriseName: '天成建材有限公司',
    enterpriseCategory: 'production',
    aiRiskLevel: 'critical',
    aiScore: 18,
    expertRiskLevel: undefined,
    expertScore: undefined,
    status: 'pending',
    detectedAt: '2026-03-28T08:00:00Z',
    aiReasoning: 'AI 判定重大风险：多项安全指标严重不达标 + 消防设施过期 + 4项未闭环隐患 + 从不自查 + 粉尘监测系统离线',
  },
  {
    id: 'rd-005',
    enterpriseId: 'ent-006',
    enterpriseName: '华通物流有限公司',
    enterpriseCategory: 'fire_key',
    aiRiskLevel: 'high',
    aiScore: 35,
    expertRiskLevel: undefined,
    expertScore: undefined,
    status: 'pending',
    detectedAt: '2026-04-03T11:00:00Z',
    aiReasoning: 'AI 判定较大风险：消防重点单位 + 应急预案超期1年未更新 + 仓储区消防设施遮挡 + 自查逾期',
  },
  {
    id: 'rd-006',
    enterpriseId: 'ent-007',
    enterpriseName: '永安制药有限公司',
    enterpriseCategory: 'production',
    aiRiskLevel: 'high',
    aiScore: 40,
    expertRiskLevel: undefined,
    expertScore: undefined,
    status: 'pending',
    detectedAt: '2026-04-04T08:00:00Z',
    aiReasoning: 'AI 判定较大风险：医药制造行业 + 双重预防风险管控清单未更新 + 安全投入计划执行率偏低',
  },
  {
    id: 'rd-007',
    enterpriseId: 'ent-009',
    enterpriseName: '鑫源金属制品有限公司',
    enterpriseCategory: 'production',
    aiRiskLevel: 'critical',
    aiScore: 28,
    expertRiskLevel: undefined,
    expertScore: undefined,
    status: 'pending',
    detectedAt: '2026-04-01T14:00:00Z',
    aiReasoning: 'AI 判定重大风险：金属加工行业 + 3项未闭环隐患（含重大项 VOCs 超标）+ 从不自查 + 连续3个月无检查记录',
  },
  // 已解决的示例
  {
    id: 'rd-008',
    enterpriseId: 'ent-005',
    enterpriseName: '瑞祥电子科技有限公司',
    enterpriseCategory: 'general',
    aiRiskLevel: 'low',
    aiScore: 85,
    expertRiskLevel: 'low',
    expertScore: 90,
    status: 'resolved',
    detectedAt: '2026-03-25T08:00:00Z',
    aiReasoning: 'AI 判定低风险：各项安全管理指标表现良好，建议保持',
    expertResolution: {
      action: 'new_level',
      selectedLevel: 'low',
      reason: '该企业安全管理水平优秀，配合度高，实际风险应给予更高评价。',
      resolvedAt: '2026-04-01T17:00:00Z',
    },
  },
  {
    id: 'rd-009',
    enterpriseId: 'ent-008',
    enterpriseName: '博远包装材料有限公司',
    enterpriseCategory: 'general',
    aiRiskLevel: 'medium',
    aiScore: 72,
    expertRiskLevel: 'medium',
    expertScore: 70,
    status: 'resolved',
    detectedAt: '2026-03-28T10:00:00Z',
    aiReasoning: 'AI 判定一般风险：教育培训和安全制度板块存在不足',
    expertResolution: {
      action: 'keep_ai',
      selectedLevel: 'medium',
      reason: '同意AI评级，该企业风险水平与系统判定基本一致。',
      resolvedAt: '2026-03-30T10:00:00Z',
    },
  },
  {
    id: 'rd-010',
    enterpriseId: 'ent-010',
    enterpriseName: '万通木业有限公司',
    enterpriseCategory: 'general',
    aiRiskLevel: 'high',
    aiScore: 52,
    expertRiskLevel: undefined,
    expertScore: undefined,
    status: 'pending',
    detectedAt: '2026-04-02T16:00:00Z',
    aiReasoning: 'AI 判定较大风险：木材加工行业（易燃）+ 干燥车间灭火器配置不足 + 事故管理板块偏低',
  },
]

// ==================== 导出 ====================

export const expertMock = {
  enterprises,
  hazards,
  serviceRecords,
  annotations,
  todos,
  tasks,
  workGroups,
  poolChanges,
  chatEnterprises,
  chatMessages,
  dashboardKpi,
  workProgress,
  taskProgress,
  expertPerformance,
  operationalNudges,
  operationalMetrics,
  riskDiscrepancies,
  // 派单执行型队列
  queueTasks,
}

export default expertMock
