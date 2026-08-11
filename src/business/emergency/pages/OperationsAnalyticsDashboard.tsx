import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ─── 类型定义 ────────────────────────────────────────────────────
type FunctionTab = 'hazard' | 'check' | 'training' | 'risk' | 'docLedger' | 'siteManagement'
type ModuleFilterValue = 'all' | FunctionTab

const FUNCTION_TABS: { key: FunctionTab; label: string; tooltip?: string }[] = [
  { key: 'hazard', label: '企业自查自纠' },
  { key: 'check', label: '镇街检查', tooltip: '包括AI监管和监督检查' },
  { key: 'training', label: '教育培训' },
  { key: 'risk', label: '风险管控' },
  { key: 'docLedger', label: '制度台账' },
  { key: 'siteManagement', label: '现场管理' },
]

interface RegionRow {
  province: string
  city: string
  district: string
  street: string
  activeUsers: number
  activeEnterprises: number
  totalUsers: number
  totalEnterprises: number
  manufacturingEnterprises: number
  fireVenues: number
  visits: number
  retention7d: number
  retention30d: number
  retention7dUsers: number
  retention30dUsers: number
  // 各模块访问数据
  moduleAccess: Record<FunctionTab, { users: number; ent: number; visits: number }>
  // 隐患排查
  hazardTotal: number
  hazardChecked: number
  hazardCheckedEnt: number
  hazardFound: number
  hazardMajor: number
  hazardMajorRectified: number
  hazardRectified: number
  // 教育培训
  trainPlanEnt: number
  trainDailyEnt: number
  trainDailySessions: number
  trainCoursewareCount: number
  trainCardCount: number
  trainInProgress: number
  trainFinished: number
  trainUnpublished: number
  trainShouldAttend: number
  trainActualAttend: number
  // 镇街检查
  checkTotal: number
  checkEnt: number
  checkCoverageEnt: number
  aiSuperviseCount: number
  superviseCount: number
  aiPushEnt: number
  aiDoneCount: number
  checkHazardTotal: number
  checkHazardRectified: number
  checkMajorTotal: number
  checkMajorRectified: number
  checkPlanDone: number // 五维分析：检查计划已制定户数
  // 风险管控
  riskTotal: number
  riskMajor: number
  riskHigh: number
  riskNormal: number
  riskLow: number
  riskConfirmedTotal: number
  // 制度台账
  docLedgerEnt: number
  docLedgerTotal: number
  docLedgerEstablishedEnt: number
  docLedgerEstablishedCount: number
  docLedgerImprovedEnt: number
  docLedgerImprovedCount: number
  docLedgerPendingEnt: number
  docLedgerPendingCount: number
  // 现场管理
  siteMgmtEnt: number
  siteMgmtTotal: number
  siteWorkPermitTotal: number
  siteWorkPermitDone: number
  siteWorkPermitWait: number
  siteWorkPermitLicense: number
  siteWorkPermitSign: number
  siteReportTotal: number
  siteRelatedEnt: number
  siteRelatedUser: number
}

// ─── 地域 Mock 数据 ──────────────────────────────────────────────
const PROVINCES = ['浙江省', '江苏省', '安徽省', '上海市', '江西省']
const CITIES_BY_PROVINCE: Record<string, string[]> = {
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市'],
  '安徽省': ['合肥市', '芜湖市', '马鞍山市'],
  '上海市': ['黄浦区', '浦东新区', '徐汇区'],
  '江西省': ['南昌市', '九江市', '赣州市'],
}
const DISTRICTS: Record<string, string[]> = {
  '杭州市': ['余杭区', '西湖区', '拱墅区', '上城区', '滨江区', '萧山区'],
  '宁波市': ['海曙区', '鄞州区', '江北区', '镇海区'],
  '温州市': ['鹿城区', '龙湾区', '瓯海区'],
  '嘉兴市': ['南湖区', '秀洲区'],
  '湖州市': ['吴兴区', '南浔区'],
  '南京市': ['鼓楼区', '玄武区', '秦淮区', '建邺区'],
  '苏州市': ['姑苏区', '虎丘区', '吴中区'],
  '无锡市': ['梁溪区', '锡山区'],
  '常州市': ['新北区', '天宁区'],
  '合肥市': ['蜀山区', '包河区'],
  '芜湖市': ['镜湖区', '弋江区'],
  '马鞍山市': ['花山区', '雨山区'],
  '黄浦区': ['外滩街道', '南京东路街道'],
  '浦东新区': ['陆家嘴街道', '花木街道', '潍坊街道'],
  '徐汇区': ['徐家汇街道', '天平路街道'],
  '南昌市': ['东湖区', '西湖区'],
  '九江市': ['浔阳区', '濂溪区'],
  '赣州市': ['章贡区', '南康区'],
}
const STREETS: Record<string, string[]> = {
  '余杭区': ['良渚街道', '五常街道', '仁和街道', '仓前街道', '闲林街道', '余杭街道'],
  '西湖区': ['文新街道', '留下街道', '三墩镇'],
  '拱墅区': ['湖墅街道', '米市巷街道', '和睦街道'],
  '上城区': ['湖滨街道', '清波街道', '小营街道'],
  '滨江区': ['西兴街道', '长河街道', '浦沿街道'],
  '萧山区': ['北干街道', '城厢街道', '蜀山街道'],
  '海曙区': ['江厦街道', '南门街道', '月湖街道'],
  '鄞州区': ['白鹤街道', '百丈街道', '东胜街道'],
  '江北区': ['文教街道', '白沙街道'],
  '镇海区': ['招宝山街道', '骆驼街道'],
  '鹿城区': ['五马街道', '大南街道'],
  '龙湾区': ['永中街道', '海滨街道'],
  '瓯海区': ['景山街道', '新桥街道'],
  '南湖区': ['建设街道', '新兴街道'],
  '秀洲区': ['新城街道', '高照街道'],
  '吴兴区': ['月河街道', '朝阳街道'],
  '南浔区': ['南浔镇', '菱湖镇'],
  '鼓楼区': ['华侨路街道', '宁海路街道'],
  '玄武区': ['新街口街道', '梅园新村街道'],
  '秦淮区': ['夫子庙街道', '双塘街道'],
  '建邺区': ['兴隆街道', '南苑街道'],
  '姑苏区': ['观前街道', '平江街道'],
  '虎丘区': ['狮山街道', '通安镇'],
  '吴中区': ['长桥街道', '木渎镇'],
  '梁溪区': ['崇安寺街道', '通江街道'],
  '锡山区': ['东亭街道', '安镇街道'],
  '新北区': ['河海街道', '三井街道'],
  '天宁区': ['天宁街道', '兰陵街道'],
  '蜀山区': ['三里庵街道', '西园街道'],
  '包河区': ['芜湖路街道', '望湖街道'],
  '镜湖区': ['滨江街道', '赭山街道'],
  '弋江区': ['澛港街道', '马塘街道'],
  '花山区': ['解放路街道', '湖东街道'],
  '雨山区': ['雨山街道', '采石街道'],
  '东湖区': ['百花洲街道', '公园街道'],
  '西湖区_': ['南站街道', '丁公路街道'],
  '浔阳区': ['甘棠街道', '湓浦街道'],
  '濂溪区': ['十里街道', '五里街道'],
  '章贡区': ['解放街道', '赣江街道'],
  '南康区': ['蓉江街道', '东山街道'],
}

function hashRegion(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function generateRegionData(): RegionRow[] {
  const rows: RegionRow[] = []
  Object.entries(CITIES_BY_PROVINCE).forEach(([province, cities]) => {
    cities.forEach(city => {
      const districts = DISTRICTS[city] || []
      districts.forEach(district => {
        const streets = STREETS[district] || []
        streets.forEach(street => {
          const seed = hashRegion(`${province}_${city}_${district}_${street}`)
          const activeEnt = 8 + (seed % 45)
          const activeUsers = activeEnt * (2 + (seed % 6))
          const visits = activeUsers * (3 + (seed % 10))
          const hazardTotal = 30 + (seed % 200)
          const hazardChecked = Math.floor(hazardTotal * (0.5 + (seed % 30) / 100))
          const hazardCheckedEnt = Math.max(1, Math.floor(activeEnt * (0.3 + (seed % 50) / 100)))
          const hazardFound = Math.floor(hazardChecked * (0.2 + (seed % 60) / 100))
          const hazardMajor = Math.max(0, Math.floor(hazardFound * (0.05 + (seed % 15) / 100)))
          const hazardMajorRectified = Math.floor(hazardMajor * (0.5 + (seed % 40) / 100))
          const hazardRectified = Math.floor(hazardFound * (0.5 + (seed % 40) / 100))

          const totalEnt = activeEnt * (2 + (seed % 3)) + Math.floor(Math.random() * 20)
          const safetyTotal = Math.floor(totalEnt * (1.2 + (seed % 30) / 100)) // 安全责任主体总数 > 总注册户数
          const fire = Math.max(1, Math.floor(safetyTotal * (0.2 + (seed % 20) / 100)))
          const manufacturing = safetyTotal - fire

          // 镇街检查派生数据
          const checkTotal = Math.floor(hazardTotal * (0.5 + (seed % 50) / 100))
          const aiSuperviseCount = Math.floor(checkTotal * (0.3 + (seed % 30) / 100))
          const superviseCount = checkTotal - aiSuperviseCount
          const aiPushEnt = Math.max(1, Math.floor(activeEnt * (0.3 + (seed % 25) / 100)))
          const aiDoneCount = Math.floor(aiPushEnt * (0.6 + (seed % 30) / 100))
          const checkHazardTotal = Math.floor(checkTotal * 0.4)
          const checkHazardRectified = Math.floor(checkHazardTotal * (0.5 + (seed % 40) / 100))
          const checkMajorTotal = Math.max(0, Math.floor(checkHazardTotal * (0.05 + (seed % 15) / 100)))
          const checkMajorRectified = Math.floor(checkMajorTotal * (0.5 + (seed % 30) / 100))

          // 教育培训派生数据
          const trainDailySessions = Math.floor(activeEnt * (2 + (seed % 10)))
          const trainInProgress = Math.floor(trainDailySessions * (0.3 + (seed % 20) / 100))
          const trainFinished = Math.floor(trainDailySessions * (0.4 + (seed % 25) / 100))
          const trainUnpublished = trainDailySessions - trainInProgress - trainFinished
          const trainShouldAttend = Math.floor(activeUsers * (0.6 + (seed % 30) / 100))
          const trainActualAttend = Math.floor(trainShouldAttend * (0.7 + (seed % 25) / 100))

          // 风险管控派生数据
          const riskTotal = 10 + (seed % 80)
          const riskMajor = Math.floor((seed % 10) * 0.3)
          const riskHigh = Math.floor((seed % 15) * 0.5)
          const riskNormal = Math.floor((seed % 40) * 0.5)
          const riskLow = Math.floor((seed % 60) * 0.3)
          const riskConfirmedTotal = Math.floor(riskTotal * (0.6 + (seed % 30) / 100))

          // 制度台账派生：已完善 + 待完善 = 已建立
          const docLedgerEstablishedEnt = Math.max(2, Math.floor(activeEnt * (0.5 + (seed % 20) / 100)))
          const docLedgerEstablishedCount = Math.floor(activeEnt * 1.2)
          const docLedgerImprovedEnt = Math.max(1, Math.floor(docLedgerEstablishedEnt * (0.7 + (seed % 25) / 100)))
          const docLedgerPendingEnt = docLedgerEstablishedEnt - docLedgerImprovedEnt
          const docLedgerImprovedCount = Math.floor(docLedgerEstablishedCount * (0.7 + (seed % 25) / 100))
          const docLedgerPendingCount = docLedgerEstablishedCount - docLedgerImprovedCount

          // 现场管理派生数据
          const siteWorkPermitTotal = Math.floor(activeEnt * (3 + (seed % 8)))
          const siteWorkPermitDone = Math.floor(siteWorkPermitTotal * (0.4 + (seed % 20) / 100))
          const siteWorkPermitWait = Math.floor(siteWorkPermitTotal * (0.2 + (seed % 10) / 100))
          const siteWorkPermitLicense = Math.floor(siteWorkPermitTotal * (0.15 + (seed % 10) / 100))
          const siteWorkPermitSign = siteWorkPermitTotal - siteWorkPermitDone - siteWorkPermitWait - siteWorkPermitLicense
          const siteReportTotal = Math.floor(activeEnt * (1.5 + (seed % 5)))
          const siteRelatedEnt = Math.max(1, Math.floor(activeEnt * (0.3 + (seed % 20) / 100)))
          const siteRelatedUser = siteRelatedEnt * (3 + (seed % 10))

          // 五维分析：检查计划制定情况（已制定/未制定，分母=安全责任主体总数）
          const docLedgerEntVal = Math.max(1, Math.floor(activeEnt * (0.6 + (seed % 30) / 100)))
          const checkPlanDoneVal = Math.max(0, Math.floor(docLedgerEntVal * (0.6 + (seed % 35) / 100)))

          rows.push({
            province,
            city,
            district,
            street,
            activeUsers,
            activeEnterprises: activeEnt,
            totalUsers: activeUsers * (2 + (seed % 5)) + Math.floor(Math.random() * 100),
            totalEnterprises: totalEnt,
            manufacturingEnterprises: manufacturing,
            fireVenues: fire,
            visits,
            retention7d: Math.floor(activeEnt * (0.3 + (seed % 30) / 100)),
            retention30d: Math.floor(activeEnt * (0.15 + (seed % 25) / 100)),
            retention7dUsers: Math.floor(activeUsers * (0.3 + (seed % 30) / 100)),
            retention30dUsers: Math.floor(activeUsers * (0.15 + (seed % 25) / 100)),
            moduleAccess: {
              hazard: { users: Math.floor(activeUsers * 0.35), ent: Math.floor(activeEnt * 0.4), visits: Math.floor(visits * 0.3) },
              check: { users: Math.floor(activeUsers * 0.25), ent: Math.floor(activeEnt * 0.3), visits: Math.floor(visits * 0.25) },
              training: { users: Math.floor(activeUsers * 0.2), ent: Math.floor(activeEnt * 0.15), visits: Math.floor(visits * 0.2) },
              risk: { users: Math.floor(activeUsers * 0.15), ent: Math.floor(activeEnt * 0.1), visits: Math.floor(visits * 0.15) },
              docLedger: { users: Math.floor(activeUsers * 0.12), ent: Math.floor(activeEnt * 0.08), visits: Math.floor(visits * 0.1) },
              siteManagement: { users: Math.floor(activeUsers * 0.2), ent: Math.floor(activeEnt * 0.12), visits: Math.floor(visits * 0.15) },
            },
            hazardTotal,
            hazardChecked,
            hazardCheckedEnt,
            hazardFound,
            hazardMajor,
            hazardMajorRectified,
            hazardRectified,
            trainPlanEnt: Math.floor(activeEnt * (0.3 + (seed % 40) / 100)),
            trainDailyEnt: Math.floor(activeEnt * (0.4 + (seed % 35) / 100)),
            trainDailySessions,
            trainCoursewareCount: Math.floor(activeEnt * (1 + (seed % 5))),
            trainCardCount: Math.floor(activeEnt * (0.3 + (seed % 20) / 100)),
            trainInProgress,
            trainFinished,
            trainUnpublished,
            trainShouldAttend,
            trainActualAttend,
            checkTotal,
            checkEnt: Math.max(1, Math.floor(activeEnt * (0.5 + (seed % 40) / 100))),
            checkCoverageEnt: Math.max(1, Math.floor(activeEnt * (0.6 + (seed % 35) / 100))),
            aiSuperviseCount,
            superviseCount,
            aiPushEnt,
            aiDoneCount,
            checkHazardTotal,
            checkHazardRectified,
            checkMajorTotal,
            checkMajorRectified,
            checkPlanDone: checkPlanDoneVal,
            riskTotal,
            riskMajor,
            riskHigh,
            riskNormal,
            riskLow,
            riskConfirmedTotal,
            docLedgerEnt: docLedgerEntVal,
            docLedgerTotal: Math.floor(activeEnt * 1.5),
            docLedgerEstablishedEnt,
            docLedgerEstablishedCount,
            docLedgerImprovedEnt,
            docLedgerImprovedCount,
            docLedgerPendingEnt,
            docLedgerPendingCount,
            siteMgmtEnt: Math.max(1, Math.floor(activeEnt * (0.4 + (seed % 25) / 100))),
            siteMgmtTotal: Math.floor(activeEnt * 1.2),
            siteWorkPermitTotal,
            siteWorkPermitDone,
            siteWorkPermitWait,
            siteWorkPermitLicense,
            siteWorkPermitSign,
            siteReportTotal,
            siteRelatedEnt,
            siteRelatedUser,
          })
        })
      })
    })
  })
  return rows
}

// ─── 趋势 Mock 数据 ─────────────────────────────────────────────
const generateMonthlyTrend = () => {
  const months = []
  for (let m = 7; m <= 18; m++) {
    const year = m <= 12 ? 2025 : 2026
    const month = m <= 12 ? m : m - 12
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const base = 800 + (m - 6) * 120
    const users = base + Math.floor(Math.random() * 200)
    const enterprises = Math.floor(base / 3.5) + Math.floor(Math.random() * 50)
    const visits = base * 4 + Math.floor(Math.random() * 2000)
    months.push({
      month: monthStr,
      activeUsers: users,
      activeEnterprises: enterprises,
      visits,
      avgVisitsPerUser: Math.round(visits / users * 10) / 10,
      avgVisitsPerEnt: Math.round(visits / enterprises * 10) / 10,
    })
  }
  return months
}

// ─── 企业活跃 Mock 数据 ─────────────────────────────────────────
interface ActiveEnterprise {
  name: string
  creditCode: string
  province: string
  city: string
  district: string
  street: string
  activeDays: number
  activeUsers: number
  totalEmployees: number
  visits: number
}

const generateActiveEnterprises = (): ActiveEnterprise[] => {
  const streets = Object.values(STREETS).flat()
  const names = [
    '杭州华兴消防设备有限公司', '浙江久安安全科技有限公司', '杭州五常消防工程有限公司',
    '仁和街道工业园区管理委员会', '西虹桥经济开发区', '良渚文化村社区服务中心',
    '杭州消防器材厂', '浙江安防科技有限公司', '杭州应急装备有限公司',
    '五常街道社区卫生服务中心', '仁和街道中心小学', '西虹街道便民服务中心',
    '余杭街道工业园', '仓前街道创业园', '闲林街道安置小区',
    '南京鼓楼区消防安全中心', '宁波海曙区安全管理办公室', '苏州姑苏区消防站',
    '合肥蜀山区应急指挥中心', '上海浦东新区消防总队', '南昌东湖区安监局',
    '无锡梁溪区消防支队', '常州新北区安全培训中心', '嘉兴南湖区消防大队',
    '温州鹿城区应急管理局', '湖州吴兴区消防站', '九江浔阳区安全办',
    '赣州章贡区消防中心', '马鞍山花山区消防队', '芜湖镜湖区安管办',
  ]
  return names.map((name, i) => {
    const si = (i * 7 + 3) % streets.length
    const s = streets[si]
    let district = '', city = '', province = ''
    for (const [d, slist] of Object.entries(STREETS)) {
      if (slist.includes(s)) { district = d; break }
    }
    for (const [c, dlist] of Object.entries(DISTRICTS)) {
      if (dlist.includes(district)) { city = c; break }
    }
    for (const [p, clist] of Object.entries(CITIES_BY_PROVINCE)) {
      if (clist.includes(city)) { province = p; break }
    }
    // 生成假的社会信用代码（18位，以913开头+随机数字）
    const creditCode = '913' + String(i).padStart(2, '0') + String(Math.floor(Math.random() * 1e13)).padStart(13, '0')
    const totalEmployees = 10 + Math.floor(Math.random() * 200)
    const activeUsers = Math.min(totalEmployees, 3 + Math.floor(Math.random() * 50))
    return {
      name,
      creditCode,
      province,
      city,
      district,
      street: s,
      activeDays: Math.min(30, 15 + (i % 16) + Math.floor(Math.random() * 5)),
      totalEmployees,
      activeUsers,
      visits: 50 + Math.floor(Math.random() * 300),
    }
  }).sort((a, b) => b.activeDays - a.activeDays)
}

// ─── 通用样式 ───────────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: '6px 8px', background: '#F3F4F6', fontWeight: 600, fontSize: 12,
  color: '#374151', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB',
  whiteSpace: 'nowrap', textAlign: 'center',
}
const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '5px 8px', fontSize: 12, color: '#374151',
  borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6',
  verticalAlign: 'middle', textAlign: 'center', ...extra,
})

// ─── 主组件 ────────────────────────────────────────────────────
export function OperationsAnalyticsDashboard() {
  // 移动端检测
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const regionData = useMemo(() => generateRegionData(), [])

  // 全局筛选
  const [timeFilter, setTimeFilter] = useState<'month' | 'quarter' | 'year' | 'custom'>('month')
  const [timeFrom, setTimeFrom] = useState('2026-01')
  const [timeTo, setTimeTo] = useState('2026-06')
  // 地域多选
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedStreets, setSelectedStreets] = useState<string[]>(Object.values(STREETS).flat())
  // 下拉开关
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showStreetDropdown, setShowStreetDropdown] = useState(false)
  // 功能模块筛选（独立于tab，仅影响访问数据）
  const [moduleFilter, setModuleFilter] = useState<ModuleFilterValue>('all')

  // 图表系列可见性
  const [chartVisible, setChartVisible] = useState({ activeUsers: true, activeEnterprises: true, avgVisitsPerUser: true, avgVisitsPerEnt: true })

  // 排行榜排序
  type SortField = 'activeEnterprises' | 'activeUsers' | 'avgVisitsPerUser' | 'avgVisitsPerEnt'
  const [sortField, setSortField] = useState<SortField>('activeUsers')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // 功能 tab
  const [funcTab, setFuncTab] = useState<FunctionTab>('hazard')

  // 修改记录
  const [showChangelog, setShowChangelog] = useState(false)
  const changeLogDefault = useMemo(() => [
    {
      id: 1,
      date: '2026-07-16',
      location: '全局',
      content: '1. 全局筛选默认本月+全选街道\n2. 访问数据指标卡重构：安全责任主体三列布局，活跃人数/户数/人均户均双列布局，7日/30日留存拆分人数+户数，全部卡片带月环比\n3. 6个业务tab全面升级：企业自查自纠/镇街检查/教育培训/风险管控/制度台账/现场管理，每个tab含指标卡+带排序滑动表格\n4. 统一卡片样式：边框#9CA3AF/竖线分隔2px/字号统一/居中对齐/月环比',
      editing: false,
    },
    {
      id: 2,
      date: '2026-07-16',
      location: '五维分析',
      content: '在「二、业务数据」各模块tab上方新增「五维分析」模块，含5个指标卡（安全制度建立/风险点识别/检查计划制定/自查自纠/隐患整改闭环），每个卡片含百分比进度条与【已完成、未完成】双列统计，随地域筛选联动',
      editing: false,
    },
  ], [])
  const [changeLogItems, setChangeLogItems] = useState(() => {
    try {
      const saved = localStorage.getItem('opsAnalytics_changeLogItems')
      return saved ? JSON.parse(saved) : changeLogDefault
    } catch {
      return changeLogDefault
    }
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  // 时间快捷切换时同步 from/to
  React.useEffect(() => {
    if (timeFilter === 'custom') return
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    if (timeFilter === 'month') { setTimeFrom(`${y}-${m}`); setTimeTo(`${y}-${m}`) }
    else if (timeFilter === 'quarter') {
      const qs = Math.floor(now.getMonth() / 3) * 3 + 1
      const qsStr = String(qs).padStart(2, '0')
      const qeStr = String(qs + 2).padStart(2, '0')
      setTimeFrom(`${y}-${qsStr}`); setTimeTo(`${y}-${qeStr}`)
    }
    else if (timeFilter === 'year') { setTimeFrom(`${y}-01`); setTimeTo(`${y}-12`) }
  }, [timeFilter])

  // 根据已选省份动态获取可选城市列表
  const availableCities = useMemo(() => {
    const allCities = Object.values(CITIES_BY_PROVINCE).flat()
    return Array.from(new Set(selectedProvinces.length > 0 ? selectedProvinces.flatMap(p => CITIES_BY_PROVINCE[p] || []) : allCities))
  }, [selectedProvinces])
  const availableDistricts = useMemo(() => {
    const targetCities = selectedCities.length > 0 ? selectedCities : availableCities
    const allDistricts = Object.values(DISTRICTS).flat()
    return Array.from(new Set(targetCities.length > 0 ? targetCities.flatMap(c => DISTRICTS[c] || []) : allDistricts))
  }, [selectedCities, availableCities])
  const availableStreets = useMemo(() => {
    const targetDistricts = selectedDistricts.length > 0 ? selectedDistricts : availableDistricts
    const allStreets = Object.values(STREETS).flat()
    return Array.from(new Set(targetDistricts.length > 0 ? targetDistricts.flatMap(d => STREETS[d] || []) : allStreets))
  }, [selectedDistricts, availableDistricts])

  // 筛选数据 + 动态聚合
  const displayLevel = selectedStreets.length > 0 ? 'street'
    : selectedDistricts.length > 0 ? 'district'
    : selectedCities.length > 0 ? 'city'
    : 'province' as 'province' | 'city' | 'district' | 'street'

  const filteredRegions = useMemo(() => {
    let data = regionData
    if (selectedProvinces.length > 0) data = data.filter(r => selectedProvinces.includes(r.province))
    if (selectedCities.length > 0) data = data.filter(r => selectedCities.includes(r.city))
    if (selectedDistricts.length > 0) data = data.filter(r => selectedDistricts.includes(r.district))
    if (selectedStreets.length > 0) data = data.filter(r => selectedStreets.includes(r.street))

    // 聚合
    const groups: Record<string, RegionRow> = {}
    data.forEach(r => {
      const key = displayLevel === 'province' ? r.province
        : displayLevel === 'city' ? `${r.province}-${r.city}`
        : displayLevel === 'district' ? `${r.province}-${r.city}-${r.district}`
        : `${r.province}-${r.city}-${r.district}-${r.street}`
      if (!groups[key]) {
        groups[key] = { ...r }
        if (displayLevel !== 'street') groups[key].street = ''
        if (displayLevel === 'province' || displayLevel === 'city') groups[key].district = ''
        if (displayLevel === 'province') groups[key].city = ''
      } else {
        const g = groups[key]
        g.activeUsers += r.activeUsers
        g.activeEnterprises += r.activeEnterprises
        g.totalUsers += r.totalUsers
        g.totalEnterprises += r.totalEnterprises
        g.manufacturingEnterprises += r.manufacturingEnterprises
        g.fireVenues += r.fireVenues
        g.visits += r.visits
        g.retention7d += r.retention7d
        g.retention30d += r.retention30d
        g.retention7dUsers += r.retention7dUsers
        g.retention30dUsers += r.retention30dUsers
        g.hazardTotal += r.hazardTotal
        g.hazardChecked += r.hazardChecked
        g.hazardCheckedEnt += r.hazardCheckedEnt
        g.hazardFound += r.hazardFound
        g.hazardMajor += r.hazardMajor
        g.hazardMajorRectified += r.hazardMajorRectified
        g.hazardRectified += r.hazardRectified
        g.trainPlanEnt += r.trainPlanEnt
        g.trainDailyEnt += r.trainDailyEnt
        g.trainDailySessions += r.trainDailySessions
        g.trainCoursewareCount += r.trainCoursewareCount
        g.trainCardCount += r.trainCardCount
        g.trainInProgress += r.trainInProgress
        g.trainFinished += r.trainFinished
        g.trainUnpublished += r.trainUnpublished
        g.trainShouldAttend += r.trainShouldAttend
        g.trainActualAttend += r.trainActualAttend
        g.checkTotal += r.checkTotal
        g.checkEnt += r.checkEnt
        g.checkCoverageEnt += r.checkCoverageEnt
        g.aiSuperviseCount += r.aiSuperviseCount
        g.superviseCount += r.superviseCount
        g.aiPushEnt += r.aiPushEnt
        g.aiDoneCount += r.aiDoneCount
        g.checkHazardTotal += r.checkHazardTotal
        g.checkHazardRectified += r.checkHazardRectified
        g.checkMajorTotal += r.checkMajorTotal
        g.checkMajorRectified += r.checkMajorRectified
        g.checkPlanDone += r.checkPlanDone
        g.riskTotal += r.riskTotal
        g.riskMajor += r.riskMajor
        g.riskHigh += r.riskHigh
        g.riskNormal += r.riskNormal
        g.riskLow += r.riskLow
        g.riskConfirmedTotal += r.riskConfirmedTotal
        g.docLedgerEnt += r.docLedgerEnt
        g.docLedgerTotal += r.docLedgerTotal
        g.docLedgerEstablishedEnt += r.docLedgerEstablishedEnt
        g.docLedgerEstablishedCount += r.docLedgerEstablishedCount
        g.docLedgerImprovedEnt += r.docLedgerImprovedEnt
        g.docLedgerImprovedCount += r.docLedgerImprovedCount
        g.docLedgerPendingEnt += r.docLedgerPendingEnt
        g.docLedgerPendingCount += r.docLedgerPendingCount
        g.siteMgmtEnt += r.siteMgmtEnt
        g.siteMgmtTotal += r.siteMgmtTotal
        g.siteWorkPermitTotal += r.siteWorkPermitTotal
        g.siteWorkPermitDone += r.siteWorkPermitDone
        g.siteWorkPermitWait += r.siteWorkPermitWait
        g.siteWorkPermitLicense += r.siteWorkPermitLicense
        g.siteWorkPermitSign += r.siteWorkPermitSign
        g.siteReportTotal += r.siteReportTotal
        g.siteRelatedEnt += r.siteRelatedEnt
        g.siteRelatedUser += r.siteRelatedUser
        for (const mod of (['hazard','check','training','risk','docLedger','siteManagement'] as FunctionTab[])) {
          g.moduleAccess[mod].users += r.moduleAccess[mod].users
          g.moduleAccess[mod].ent += r.moduleAccess[mod].ent
          g.moduleAccess[mod].visits += r.moduleAccess[mod].visits
        }
      }
    })
    return Object.values(groups).sort((a, b) => b.activeUsers - a.activeUsers)
  }, [regionData, selectedProvinces, selectedCities, selectedDistricts, selectedStreets, displayLevel])

  // 排序函数
  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDir(d => d === 'desc' ? 'asc' : 'desc') }
    else { setSortField(field); setSortDir('desc') }
  }

  // 汇总指标
  const totals = useMemo(() => {
    const t = {
      activeUsers: 0, activeEnterprises: 0, totalUsers: 0, totalEnterprises: 0,
      manufacturingEnterprises: 0, fireVenues: 0, visits: 0,
      retention7d: 0, retention30d: 0, retention7dUsers: 0, retention30dUsers: 0,
      hazardTotal: 0, hazardChecked: 0, hazardCheckedEnt: 0,
      hazardFound: 0, hazardMajor: 0, hazardMajorRectified: 0, hazardRectified: 0,
      trainPlanEnt: 0, trainDailyEnt: 0, trainDailySessions: 0,
      trainCoursewareCount: 0, trainCardCount: 0,
      trainInProgress: 0, trainFinished: 0, trainUnpublished: 0,
      trainShouldAttend: 0, trainActualAttend: 0,
      checkTotal: 0, checkEnt: 0, checkCoverageEnt: 0,
      aiSuperviseCount: 0, superviseCount: 0, aiPushEnt: 0, aiDoneCount: 0,
      checkHazardTotal: 0, checkHazardRectified: 0,
      checkMajorTotal: 0, checkMajorRectified: 0, checkPlanDone: 0,
      riskTotal: 0, riskMajor: 0, riskHigh: 0, riskNormal: 0, riskLow: 0, riskConfirmedTotal: 0,
      docLedgerEnt: 0, docLedgerTotal: 0,
      docLedgerEstablishedEnt: 0, docLedgerEstablishedCount: 0,
      docLedgerImprovedEnt: 0, docLedgerImprovedCount: 0,
      docLedgerPendingEnt: 0, docLedgerPendingCount: 0,
      siteMgmtEnt: 0, siteMgmtTotal: 0,
      siteWorkPermitTotal: 0, siteWorkPermitDone: 0, siteWorkPermitWait: 0, siteWorkPermitLicense: 0, siteWorkPermitSign: 0,
      siteReportTotal: 0, siteRelatedEnt: 0, siteRelatedUser: 0,
      moduleAccess: { hazard: { users:0,ent:0,visits:0 }, check: { users:0,ent:0,visits:0 }, training: { users:0,ent:0,visits:0 }, risk: { users:0,ent:0,visits:0 }, docLedger: { users:0,ent:0,visits:0 }, siteManagement: { users:0,ent:0,visits:0 } } as Record<FunctionTab, { users:number;ent:number;visits:number }>,
    }
    filteredRegions.forEach(r => {
      t.activeUsers += r.activeUsers
      t.activeEnterprises += r.activeEnterprises
      t.totalUsers += r.totalUsers
      t.totalEnterprises += r.totalEnterprises
      t.manufacturingEnterprises += r.manufacturingEnterprises
      t.fireVenues += r.fireVenues
      t.visits += r.visits
      t.retention7d += r.retention7d
      t.retention30d += r.retention30d
      t.retention7dUsers += r.retention7dUsers
      t.retention30dUsers += r.retention30dUsers
      t.hazardTotal += r.hazardTotal
      t.hazardChecked += r.hazardChecked
      t.hazardCheckedEnt += r.hazardCheckedEnt
      t.hazardFound += r.hazardFound
      t.hazardMajor += r.hazardMajor
      t.hazardMajorRectified += r.hazardMajorRectified
      t.hazardRectified += r.hazardRectified
      t.trainPlanEnt += r.trainPlanEnt
      t.trainDailyEnt += r.trainDailyEnt
      t.trainDailySessions += r.trainDailySessions
      t.trainCoursewareCount += r.trainCoursewareCount
      t.trainCardCount += r.trainCardCount
      t.trainInProgress += r.trainInProgress
      t.trainFinished += r.trainFinished
      t.trainUnpublished += r.trainUnpublished
      t.trainShouldAttend += r.trainShouldAttend
      t.trainActualAttend += r.trainActualAttend
      t.checkTotal += r.checkTotal
      t.checkEnt += r.checkEnt
      t.checkCoverageEnt += r.checkCoverageEnt
      t.aiSuperviseCount += r.aiSuperviseCount
      t.superviseCount += r.superviseCount
      t.aiPushEnt += r.aiPushEnt
      t.aiDoneCount += r.aiDoneCount
      t.checkHazardTotal += r.checkHazardTotal
      t.checkHazardRectified += r.checkHazardRectified
      t.checkMajorTotal += r.checkMajorTotal
      t.checkMajorRectified += r.checkMajorRectified
      t.checkPlanDone += r.checkPlanDone
      t.riskTotal += r.riskTotal
      t.riskMajor += r.riskMajor
      t.riskHigh += r.riskHigh
      t.riskNormal += r.riskNormal
      t.riskLow += r.riskLow
      t.riskConfirmedTotal += r.riskConfirmedTotal
      t.docLedgerEnt += r.docLedgerEnt
      t.docLedgerTotal += r.docLedgerTotal
      t.docLedgerEstablishedEnt += r.docLedgerEstablishedEnt
      t.docLedgerEstablishedCount += r.docLedgerEstablishedCount
      t.docLedgerImprovedEnt += r.docLedgerImprovedEnt
      t.docLedgerImprovedCount += r.docLedgerImprovedCount
      t.docLedgerPendingEnt += r.docLedgerPendingEnt
      t.docLedgerPendingCount += r.docLedgerPendingCount
      t.siteMgmtEnt += r.siteMgmtEnt
      t.siteMgmtTotal += r.siteMgmtTotal
      t.siteWorkPermitTotal += r.siteWorkPermitTotal
      t.siteWorkPermitDone += r.siteWorkPermitDone
      t.siteWorkPermitWait += r.siteWorkPermitWait
      t.siteWorkPermitLicense += r.siteWorkPermitLicense
      t.siteWorkPermitSign += r.siteWorkPermitSign
      t.siteReportTotal += r.siteReportTotal
      t.siteRelatedEnt += r.siteRelatedEnt
      t.siteRelatedUser += r.siteRelatedUser
      for (const mod of (['hazard','check','training','risk','docLedger','siteManagement'] as FunctionTab[])) {
        t.moduleAccess[mod].users += r.moduleAccess[mod].users
        t.moduleAccess[mod].ent += r.moduleAccess[mod].ent
        t.moduleAccess[mod].visits += r.moduleAccess[mod].visits
      }
    })
    return t
  }, [filteredRegions])

  // 模块筛选后的访问数据
  const accessData = useMemo(() => {
    if (moduleFilter === 'all') return totals
    const ma = totals.moduleAccess[moduleFilter]
    return { ...totals, activeUsers: ma.users, activeEnterprises: ma.ent, visits: ma.visits }
  }, [totals, moduleFilter])

  // 模块筛选后的区域数据
  const moduleFilteredRegions = useMemo(() => {
    if (moduleFilter === 'all') return filteredRegions
    return filteredRegions.map(r => {
      const ma = r.moduleAccess[moduleFilter]
      const ratioEnt = r.activeEnterprises > 0 ? ma.ent / r.activeEnterprises : 0
      const ratioUsers = r.activeUsers > 0 ? ma.users / r.activeUsers : 0
      return {
        ...r, activeUsers: ma.users, activeEnterprises: ma.ent, visits: ma.visits,
        retention7d: Math.floor(r.retention7d * ratioEnt),
        retention30d: Math.floor(r.retention30d * ratioEnt),
        retention7dUsers: Math.floor(r.retention7dUsers * ratioUsers),
        retention30dUsers: Math.floor(r.retention30dUsers * ratioUsers),
      }
    })
  }, [filteredRegions, moduleFilter])

  // 排序后的区域数据
  const sortedRegions = useMemo(() => {
    const list = [...moduleFilteredRegions]
    const mul = sortDir === 'desc' ? -1 : 1
    list.sort((a, b) => {
      let va: number, vb: number
      if (sortField === 'activeEnterprises') { va = a.activeEnterprises; vb = b.activeEnterprises }
      else if (sortField === 'activeUsers') { va = a.activeUsers; vb = b.activeUsers }
      else if (sortField === 'avgVisitsPerUser') {
        va = a.activeUsers > 0 ? a.visits / a.activeUsers : 0
        vb = b.activeUsers > 0 ? b.visits / b.activeUsers : 0
      } else {
        va = a.activeEnterprises > 0 ? a.visits / a.activeEnterprises : 0
        vb = b.activeEnterprises > 0 ? b.visits / b.activeEnterprises : 0
      }
      return (va - vb) * mul
    })
    return list
  }, [moduleFilteredRegions, sortField, sortDir])

  // 模块筛选后的趋势数据
  const monthlyTrend = useMemo(() => {
    const trend = generateMonthlyTrend()
    if (moduleFilter === 'all') return trend
    const ratio = accessData.activeUsers > 0 ? accessData.activeUsers / totals.activeUsers : 0.3
    return trend.map(m => ({
      ...m, activeUsers: Math.floor(m.activeUsers * ratio),
      activeEnterprises: Math.floor(m.activeEnterprises * ratio),
      visits: Math.floor(m.visits * ratio),
    }))
  }, [moduleFilter, totals.activeUsers, accessData.activeUsers])

  return (
    <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: isMobile ? '100%' : 1500, margin: '0 auto' }}>
      <PageHeader title="一起安平台数据分析看板" actions={
        <button
          onClick={() => setShowChangelog(true)}
          style={{
            background: 'white', border: '1px solid #D1D5DB', borderRadius: 6,
            padding: '5px 14px', fontSize: 12, color: '#4F46E5', cursor: 'pointer',
          }}
        >📝 修改记录</button>
      } />

      {/* ─── 全局筛选栏（sticky） ────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, marginBottom: isMobile ? 12 : 16,
        flexWrap: 'wrap', padding: isMobile ? '4px 0' : '8px 0',
        position: 'sticky', top: 60, zIndex: 40, background: '#F9FAFB',
      }}>
        {/* 时间筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>时间:</span>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value as any)}
            style={selectStyle}>
            <option value="year">本年</option>
            <option value="quarter">本季</option>
            <option value="month">本月</option>
            <option value="custom">自定义</option>
          </select>
          <input type="month" value={timeFrom} onChange={e => { setTimeFrom(e.target.value); setTimeFilter('custom') }}
            style={inputSmall} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
          <input type="month" value={timeTo} onChange={e => { setTimeTo(e.target.value); setTimeFilter('custom') }}
            style={inputSmall} />
        </div>

        <div style={{ width: 1, height: 20, background: '#D1D5DB' }} />

        {/* 省多选 */}
        <MultiSelectDropdown
          label="省"
          options={PROVINCES}
          selected={selectedProvinces}
          onChange={setSelectedProvinces}
          open={showProvinceDropdown}
          onToggle={() => { setShowProvinceDropdown(!showProvinceDropdown); setShowCityDropdown(false); setShowDistrictDropdown(false); setShowStreetDropdown(false) }}
        />

        {/* 市多选 */}
        <MultiSelectDropdown
          label="市"
          options={availableCities}
          selected={selectedCities}
          onChange={setSelectedCities}
          open={showCityDropdown}
          onToggle={() => { setShowCityDropdown(!showCityDropdown); setShowProvinceDropdown(false); setShowDistrictDropdown(false); setShowStreetDropdown(false) }}
        />

        {/* 区多选 */}
        <MultiSelectDropdown
          label="区"
          options={availableDistricts}
          selected={selectedDistricts}
          onChange={setSelectedDistricts}
          open={showDistrictDropdown}
          onToggle={() => { setShowDistrictDropdown(!showDistrictDropdown); setShowProvinceDropdown(false); setShowCityDropdown(false); setShowStreetDropdown(false) }}
        />

        {/* 街道多选 */}
        <MultiSelectDropdown
          label="街道"
          options={availableStreets}
          selected={selectedStreets}
          onChange={setSelectedStreets}
          open={showStreetDropdown}
          onToggle={() => { setShowStreetDropdown(!showStreetDropdown); setShowProvinceDropdown(false); setShowCityDropdown(false); setShowDistrictDropdown(false) }}
        />

        <div style={{ width: 1, height: 20, background: '#D1D5DB' }} />

        {/* 功能模块（仅影响访问数据） */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>功能模块:</span>
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as ModuleFilterValue)}
            style={selectStyle}>
            <option value="all">全部</option>
            {FUNCTION_TABS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* ─── 一、访问数据 ────────────────────────────── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, paddingLeft: 4, borderLeft: '3px solid #4F46E5' }}>
        一、访问数据
      </div>

      {/* ─── 平台使用概况 KPI ────────────────────────── */}
      <div style={{ display: 'flex', gap: isMobile ? 8 : 14, marginBottom: isMobile ? 12 : 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {/* 安全责任主体总数 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: isMobile ? '8px 10px' : '10px 14px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flex: isMobile ? '0 0 calc(50% - 8px)' : 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>安全责任主体总数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{(totals.manufacturingEnterprises + totals.fireVenues).toLocaleString()}</div>
            <MomLabel seed={1001} />
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>生产企业</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4F46E5', lineHeight: 1.2 }}>{totals.manufacturingEnterprises.toLocaleString()}<MomLabel seed={1002} /></div>
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>消防场所</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>{totals.fireVenues.toLocaleString()}<MomLabel seed={1003} /></div>
          </div>
        </div>
        {/* 活跃人数 / 总激活人数 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: isMobile ? '8px 10px' : '10px 14px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flex: isMobile ? '0 0 calc(50% - 8px)' : 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>活跃人数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#4F46E5', lineHeight: 1.2 }}>{accessData.activeUsers.toLocaleString()}</div>
            <MomLabel seed={2001} />
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>总激活人数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#6B7280', lineHeight: 1.2 }}>{totals.totalUsers.toLocaleString()}</div>
            <MomLabel seed={2002} />
          </div>
        </div>
        {/* 活跃户数 / 总注册户数 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: isMobile ? '8px 10px' : '10px 14px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flex: isMobile ? '0 0 calc(50% - 8px)' : 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>活跃户数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3B82F6', lineHeight: 1.2 }}>{accessData.activeEnterprises.toLocaleString()}</div>
            <MomLabel seed={3001} />
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>总注册户数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#6B7280', lineHeight: 1.2 }}>{totals.totalEnterprises.toLocaleString()}</div>
            <MomLabel seed={3002} />
          </div>
        </div>
        {/* 人均访问 / 户均访问 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: isMobile ? '8px 10px' : '10px 14px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flex: isMobile ? '0 0 calc(50% - 8px)' : 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>人均访问次数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>{accessData.activeUsers > 0 ? (accessData.visits / accessData.activeUsers).toFixed(2) : '0'}</div>
            <MomLabel seed={4001} />
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>户均访问次数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#7C3AED', lineHeight: 1.2 }}>{accessData.activeEnterprises > 0 ? (accessData.visits / accessData.activeEnterprises).toFixed(2) : '0'}</div>
            <MomLabel seed={4002} />
          </div>
        </div>
        {/* 30日留存人数 / 30日留存户数 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: isMobile ? '8px 10px' : '10px 14px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flex: isMobile ? '0 0 calc(50% - 8px)' : 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>30日留存人数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>{accessData.retention30dUsers.toLocaleString()}</div>
            <MomLabel seed={6001} />
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>30日留存户数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>{accessData.retention30d.toLocaleString()}</div>
            <MomLabel seed={6002} />
          </div>
        </div>
        {/* 7日留存人数 / 7日留存户数 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: isMobile ? '8px 10px' : '10px 14px', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flex: isMobile ? '0 0 calc(50% - 8px)' : 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>7日留存人数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706', lineHeight: 1.2 }}>{accessData.retention7dUsers.toLocaleString()}</div>
            <MomLabel seed={5001} />
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>7日留存户数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706', lineHeight: 1.2 }}>{accessData.retention7d.toLocaleString()}</div>
            <MomLabel seed={5002} />
          </div>
        </div>
      </div>

      {/* ─── 趋势图 + 地域排行（左右并排） ─────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* 活跃趋势 */}
        <div style={{ flex: 6, background: 'white', border: '1px solid #9CA3AF', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', minHeight: isMobile ? 360 : undefined }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>活跃趋势（按月）</div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'activeUsers', label: '活跃人数', color: '#4F46E5' },
              { key: 'activeEnterprises', label: '活跃户数', color: '#3B82F6' },
              { key: 'avgVisitsPerUser', label: '人均访问次数', color: '#059669' },
              { key: 'avgVisitsPerEnt', label: '户均访问次数', color: '#7C3AED' },
            ].map(s => (
              <span key={s.key}
                onClick={() => setChartVisible(prev => ({ ...prev, [s.key]: !prev[s.key as keyof typeof prev] }))}
                style={{
                  cursor: 'pointer', fontSize: 11, color: chartVisible[s.key as keyof typeof chartVisible] ? s.color : '#D1D5DB',
                  textDecoration: chartVisible[s.key as keyof typeof chartVisible] ? 'none' : 'line-through',
                  userSelect: 'none',
                }}
              >
                ● {s.label}
              </span>
            ))}
          </div>
          <div style={{ height: isMobile ? 300 : undefined, flex: isMobile ? undefined : 1, minHeight: isMobile ? 300 : 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="left" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <Tooltip />
              {chartVisible.activeUsers && <Bar yAxisId="left" dataKey="activeUsers" name="活跃人数" fill="#4F46E5" radius={[4, 4, 0, 0]} />}
              {chartVisible.activeEnterprises && <Bar yAxisId="left" dataKey="activeEnterprises" name="活跃户数" fill="#3B82F6" radius={[4, 4, 0, 0]} />}
              {chartVisible.avgVisitsPerUser && <Line yAxisId="right" type="monotone" dataKey="avgVisitsPerUser" name="人均访问次数" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />}
              {chartVisible.avgVisitsPerEnt && <Line yAxisId="right" type="monotone" dataKey="avgVisitsPerEnt" name="户均访问次数" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" />}
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* 地域排行 */}
        <div style={{ flex: 4, background: 'white', border: '1px solid #9CA3AF', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            活跃排行榜
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ ...th, width: 40, background: '#F3F4F6' }}>#</th>
                  <th style={{ ...th, textAlign: 'left', background: '#F3F4F6' }}>区域</th>
                  <SortTh label="活跃户数" field="activeEnterprises" current={sortField} dir={sortDir} onClick={() => handleSort('activeEnterprises')} />
                  <SortTh label="活跃人数" field="activeUsers" current={sortField} dir={sortDir} onClick={() => handleSort('activeUsers')} />
                  <SortTh label="人均访问" field="avgVisitsPerUser" current={sortField} dir={sortDir} onClick={() => handleSort('avgVisitsPerUser')} />
                  <SortTh label="户均访问" field="avgVisitsPerEnt" current={sortField} dir={sortDir} onClick={() => handleSort('avgVisitsPerEnt')} last />
              </tr>
            </thead>
            <tbody>
              {sortedRegions.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={td({ color: i < 3 ? '#4F46E5' : '#9CA3AF', fontWeight: i < 3 ? 700 : 400 })}>{i + 1}</td>
                  <td style={td({ textAlign: 'left', fontWeight: 500 })}>
                    {displayLevel === 'province' ? r.province
                      : displayLevel === 'city' ? r.city
                      : displayLevel === 'district' ? r.district
                      : r.street}
                  </td>
                  <td style={td({ fontWeight: 600 })}>{r.activeEnterprises}</td>
                  <td style={td({})}>{r.activeUsers}</td>
                  <td style={td({})}>{r.activeUsers > 0 ? Math.round(r.visits / r.activeUsers * 10) / 10 : '-'}</td>
                  <td style={td({ borderRight: 'none' })}>{r.activeEnterprises > 0 ? Math.round(r.visits / r.activeEnterprises * 10) / 10 : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* ─── 企业近30天活跃排行榜 TOP10 ──────────────── */}
      <EnterpriseTop10 moduleFilter={moduleFilter} totalsActiveUsers={totals.activeUsers} accessActiveUsers={accessData.activeUsers} />

      {/* ─── 二、业务数据 ────────────────────────────── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, paddingLeft: 4, borderLeft: '3px solid #4F46E5' }}>
        二、业务数据
      </div>

      {/* ─── 五维分析数据 ────────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #9CA3AF', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>五维分析</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <FiveDimCard title="安全制度建立情况" doneLabel="已建立" done={totals.docLedgerEstablishedEnt} undoneLabel="未建立" undone={Math.max(0, totals.docLedgerEnt - totals.docLedgerEstablishedEnt)} color="#3B82F6" />
          <FiveDimCard title="风险点识别情况" doneLabel="已识别" done={totals.riskConfirmedTotal} undoneLabel="未识别" undone={Math.max(0, totals.riskTotal - totals.riskConfirmedTotal)} color="#7C3AED" />
          <FiveDimCard title="检查计划制定情况" doneLabel="已制定" done={totals.checkPlanDone} undoneLabel="未制定" undone={Math.max(0, totals.docLedgerEnt - totals.checkPlanDone)} color="#4F46E5" />
          <FiveDimCard title="自查自纠情况" doneLabel="已自查" done={totals.hazardCheckedEnt} undoneLabel="未自查" undone={Math.max(0, totals.docLedgerEnt - totals.hazardCheckedEnt)} color="#059669" />
          <FiveDimCard title="隐患整改闭环情况" doneLabel="已到位" done={totals.hazardRectified} undoneLabel="未到位" undone={Math.max(0, totals.hazardFound - totals.hazardRectified)} color="#DC2626" />
        </div>
      </div>

      {/* ─── 核心功能分析 Tab ────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #9CA3AF', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB' }}>
          {FUNCTION_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFuncTab(tab.key)}
              title={tab.tooltip}
              style={{
                flex: 1, padding: isMobile ? '8px 2px' : '10px 0', border: 'none', background: 'transparent',
                borderBottom: funcTab === tab.key ? '2px solid #4F46E5' : '2px solid transparent',
                marginBottom: -2, color: funcTab === tab.key ? '#4F46E5' : '#6B7280',
                cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: funcTab === tab.key ? 600 : 500,
                whiteSpace: 'nowrap',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ padding: isMobile ? 8 : 16 }}>

          {/* 隐患排查 */}
          {funcTab === 'hazard' && (
            <FunctionPanel isMobile={isMobile}
              kpis={<>
                <KpiBlock label="总任务数" value={totals.hazardTotal} unit="条" color="#4F46E5" compact />
                <KpiBlock label="已检查任务数" value={totals.hazardChecked} unit="条" color="#3B82F6" compact />
                <KpiBlock label="已检查户数" value={totals.hazardCheckedEnt} unit="户" color="#7C3AED" compact />
                {/* 隐患总数 / 已整改数 / 整改完成率 */}
                <TripleCard label="隐患总数" value={totals.hazardFound} subValue={totals.hazardRectified} subLabel="已整改" pct={totals.hazardFound > 0 ? Math.round(totals.hazardRectified / totals.hazardFound * 100) : 0} color="#DC2626" />
                {/* 重大事故隐患总数 / 已整改数 / 整改完成率 */}
                <TripleCard label="重大事故隐患总数" value={totals.hazardMajor} subValue={totals.hazardMajorRectified} subLabel="已整改" pct={totals.hazardMajor > 0 ? Math.round(totals.hazardMajorRectified / totals.hazardMajor * 100) : 0} color="#991B1B" />
              </>}
              tables={<DetailTable columns={['区域', '总任务', '已检查任务', '已检查户数', '隐患总数', '已整改', '整改率', '重大事故隐患', '重大事故隐患已整改', '重大事故隐患整改率']}
                rows={filteredRegions.map(r => [
                  displayLevel === 'province' ? r.province : displayLevel === 'city' ? r.city : displayLevel === 'district' ? r.district : r.street,
                  r.hazardTotal, r.hazardChecked, r.hazardCheckedEnt, r.hazardFound,
                  r.hazardRectified, r.hazardFound > 0 ? `${Math.round(r.hazardRectified / r.hazardFound * 100)}%` : '-',
                  r.hazardMajor, r.hazardMajorRectified, r.hazardMajor > 0 ? `${Math.round(r.hazardMajorRectified / r.hazardMajor * 100)}%` : '-',
                ])} />}
            />
          )}

          {/* 镇街检查 */}
          {funcTab === 'check' && (
            <FunctionPanel isMobile={isMobile}
              kpis={<>
                <KpiBlock label="覆盖户数" value={totals.checkCoverageEnt} unit="" color="#4F46E5" compact />
                <TripleCard label="检查次数" value={totals.checkTotal} subValue={totals.aiSuperviseCount} subLabel="AI监管" pct={0} pct2={totals.superviseCount} pct2Label="监督检查" color="#3B82F6" />
                <MultiCard labels={['AI监管次数', '检查单推送户数', '检查单办结数量']} values={[totals.aiSuperviseCount, totals.aiPushEnt, totals.aiDoneCount]} units={['次', '户', '单']} colors={['#7C3AED','#059669','#0EA5E9']} extra={totals.aiPushEnt > 0 ? Math.round(totals.aiDoneCount / totals.aiPushEnt * 100) : 0} extraLabel="办结率" />
                <div style={{ width: '100%', height: 0 }} />
                <TripleCard label="隐患总数" value={totals.checkHazardTotal} subValue={totals.checkHazardRectified} subLabel="已整改" pct={totals.checkHazardTotal > 0 ? Math.round(totals.checkHazardRectified / totals.checkHazardTotal * 100) : 0} color="#DC2626" />
                <TripleCard label="重大事故隐患总数" value={totals.checkMajorTotal} subValue={totals.checkMajorRectified} subLabel="已整改" pct={totals.checkMajorTotal > 0 ? Math.round(totals.checkMajorRectified / totals.checkMajorTotal * 100) : 0} color="#991B1B" />
              </>}
              tables={<DetailTable columns={['区域', '覆盖户数', '检查次数', 'AI监管次数', '监督检查次数', '检查单推送户数', '检查单办结数量', '检查单办结率', '隐患总数', '已整改', '整改率', '重大事故隐患总数', '重大事故隐患已整改', '重大事故隐患整改率']}
                rows={filteredRegions.map(r => [
                  displayLevel === 'province' ? r.province : displayLevel === 'city' ? r.city : displayLevel === 'district' ? r.district : r.street,
                  r.checkCoverageEnt, r.checkTotal, r.aiSuperviseCount, r.superviseCount,
                  r.aiPushEnt, r.aiDoneCount, r.aiPushEnt > 0 ? `${Math.round(r.aiDoneCount / r.aiPushEnt * 100)}%` : '-',
                  r.checkHazardTotal, r.checkHazardRectified, r.checkHazardTotal > 0 ? `${Math.round(r.checkHazardRectified / r.checkHazardTotal * 100)}%` : '-',
                  r.checkMajorTotal, r.checkMajorRectified, r.checkMajorTotal > 0 ? `${Math.round(r.checkMajorRectified / r.checkMajorTotal * 100)}%` : '-',
                ])} />}
            />
          )}

          {/* 教育培训 */}
          {funcTab === 'training' && (
            <FunctionPanel isMobile={isMobile}
              kpis={<>
                <KpiBlock label="年度计划制定户数" value={totals.trainPlanEnt} unit="户" color="#3B82F6" compact />
                <KpiBlock label="开展日常安全教育的户数" value={totals.trainDailyEnt} unit="户" color="#059669" compact />
                <KpiBlock label="课件上传数量" value={totals.trainCoursewareCount} unit="" color="#4F46E5" compact />
                <KpiBlock label="三级教育卡数量" value={totals.trainCardCount} unit="" color="#7C3AED" compact />
                <div style={{ width: '100%', height: 0 }} />
                {/* 日常安全教育综合卡片 */}
                <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: '10px 14px', flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>日常安全教育总场次</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5', lineHeight: 1.2 }}>{totals.trainDailySessions.toLocaleString()}</div>
                    <MomLabel seed={7001} />
                  </div>
                  {[
                    { l:'进行中', v:totals.trainInProgress, c:'#3B82F6' },
                    { l:'已结束', v:totals.trainFinished, c:'#059669' },
                    { l:'未发布', v:totals.trainUnpublished, c:'#9CA3AF' },
                    { l:'应培训人数', v:totals.trainShouldAttend, c:'#374151' },
                    { l:'实际签到人数', v:totals.trainActualAttend, c:'#059669' },
                    { l:'考试完成率', v:totals.trainShouldAttend>0?Math.round(totals.trainActualAttend/totals.trainShouldAttend*100):0, c:'#D97706', u:'%' },
                    { l:'考试及格率', v:totals.trainShouldAttend>0?Math.round(totals.trainActualAttend*0.9/totals.trainShouldAttend*100):0, c:'#7C3AED', u:'%' },
                  ].map((it, idx) => (
                    <div key={it.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{it.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: it.c }}>{(it as any).u ? it.v + (it as any).u : it.v.toLocaleString()}</div>
                      <MomLabel seed={7002 + idx} />
                    </div>
                  ))}
                </div>
              </>}
              tables={<DetailTable columns={['区域', '年度计划制定户数', '开展日常安全教育的户数', '课件上传数量', '三级教育卡数量', '日常安全教育总场次', '进行中', '已结束', '未发布', '应培训人数', '实际签到人数', '考试完成率', '考试及格率']}
                rows={filteredRegions.map(r => [
                  displayLevel === 'province' ? r.province : displayLevel === 'city' ? r.city : displayLevel === 'district' ? r.district : r.street,
                  r.trainPlanEnt, r.trainDailyEnt, r.trainCoursewareCount, r.trainCardCount,
                  r.trainDailySessions, r.trainInProgress, r.trainFinished, r.trainUnpublished,
                  r.trainShouldAttend, r.trainActualAttend,
                  r.trainShouldAttend > 0 ? `${Math.round(r.trainActualAttend / r.trainShouldAttend * 100)}%` : '-',
                  r.trainShouldAttend > 0 ? `${Math.round(r.trainActualAttend * 0.9 / r.trainShouldAttend * 100)}%` : '-',
                ])} />}
            />
          )}

          {/* 风险管控 */}
          {funcTab === 'risk' && (
            <FunctionPanel isMobile={isMobile}
              kpis={<>
                {/* 风险点总数 / 户均数量 | 已确认风险点总数 / 户均数量 */}
                <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: '10px 14px', flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <Column label="风险点总数" value={totals.riskTotal} color="#4F46E5" subLabel="户均" subValue={totals.activeEnterprises > 0 ? Number((totals.riskTotal / totals.activeEnterprises).toFixed(2)) : 0} />
                  <div style={{ width: 2, height: 28, background: '#9CA3AF', flexShrink: 0 }} />
                  <Column label="已确认风险点总数" value={totals.riskConfirmedTotal} color="#059669" subLabel="户均" subValue={totals.activeEnterprises > 0 ? Number((totals.riskConfirmedTotal / totals.activeEnterprises).toFixed(2)) : 0} />
                </div>
                <MultiCard labels={['重大风险', '较大风险', '一般风险', '低风险']} values={[totals.riskMajor, totals.riskHigh, totals.riskNormal, totals.riskLow]} units={['项','项','项','项']} colors={['#991B1B','#EA580C','#D97706','#6B7280']} />
              </>}
              tables={<DetailTable columns={['区域', '风险点总数', '户均数量', '已确认风险点总数', '户均确认数量', '重大风险', '较大风险', '一般风险', '低风险']}
                rows={filteredRegions.map(r => [
                  displayLevel === 'province' ? r.province : displayLevel === 'city' ? r.city : displayLevel === 'district' ? r.district : r.street,
                  r.riskTotal, r.activeEnterprises > 0 ? Number((r.riskTotal / r.activeEnterprises).toFixed(2)) : 0,
                  r.riskConfirmedTotal, r.activeEnterprises > 0 ? Number((r.riskConfirmedTotal / r.activeEnterprises).toFixed(2)) : 0,
                  r.riskMajor, r.riskHigh, r.riskNormal, r.riskLow,
                ])} />}
            />
          )}

          {/* 制度台账 */}
          {funcTab === 'docLedger' && (
            <FunctionPanel isMobile={isMobile}
              kpis={<>
                <KpiBlock label="安全责任主体总数" value={totals.manufacturingEnterprises + totals.fireVenues} unit="" color="#4F46E5" compact />
                <TripleCard label="台账已建立户数" value={totals.docLedgerEstablishedEnt} subValue={totals.docLedgerEstablishedCount} subLabel="已建立数量" pct={0} pct2={totals.docLedgerEstablishedEnt > 0 ? Number((totals.docLedgerEstablishedCount / totals.docLedgerEstablishedEnt).toFixed(2)) : 0} pct2Label="户均建立数" color="#3B82F6" />
                <TripleCard label="台账已完善户数" value={totals.docLedgerImprovedEnt} subValue={totals.docLedgerImprovedCount} subLabel="已完善数量" pct={0} pct2={totals.docLedgerImprovedEnt > 0 ? Number((totals.docLedgerImprovedCount / totals.docLedgerImprovedEnt).toFixed(2)) : 0} pct2Label="户均完善数" color="#059669" />
                <TripleCard label="台账待完善户数" value={totals.docLedgerPendingEnt} subValue={totals.docLedgerPendingCount} subLabel="待完善数量" pct={0} pct2={totals.docLedgerPendingEnt > 0 ? Number((totals.docLedgerPendingCount / totals.docLedgerPendingEnt).toFixed(2)) : 0} pct2Label="户均待完善数" color="#DC2626" />
              </>}
              tables={<DetailTable columns={['区域', '安全责任主体总数', '台账已建立户数', '台账已建立数量', '户均建立数', '台账已完善户数', '台账已完善数量', '户均完善数', '台账待完善户数', '台账待完善数量', '户均待完善数']}
                rows={filteredRegions.map(r => [
                  displayLevel === 'province' ? r.province : displayLevel === 'city' ? r.city : displayLevel === 'district' ? r.district : r.street,
                  r.manufacturingEnterprises + r.fireVenues,
                  r.docLedgerEstablishedEnt, r.docLedgerEstablishedCount,
                  r.docLedgerEstablishedEnt > 0 ? Number((r.docLedgerEstablishedCount / r.docLedgerEstablishedEnt).toFixed(2)) : 0,
                  r.docLedgerImprovedEnt, r.docLedgerImprovedCount,
                  r.docLedgerImprovedEnt > 0 ? Number((r.docLedgerImprovedCount / r.docLedgerImprovedEnt).toFixed(2)) : 0,
                  r.docLedgerPendingEnt, r.docLedgerPendingCount,
                  r.docLedgerPendingEnt > 0 ? Number((r.docLedgerPendingCount / r.docLedgerPendingEnt).toFixed(2)) : 0,
                ])} />}
            />
          )}

          {/* 现场管理 */}
          {funcTab === 'siteManagement' && (
            <FunctionPanel isMobile={isMobile}
              kpis={<>
                <MultiCard labels={['作业票总数', '已完成', '待验收', '待作业许可', '待现场签批']} values={[totals.siteWorkPermitTotal, totals.siteWorkPermitDone, totals.siteWorkPermitWait, totals.siteWorkPermitLicense, totals.siteWorkPermitSign]} units={['','','','','']} colors={['#4F46E5','#059669','#D97706','#3B82F6','#9CA3AF']} />
                <KpiBlock label="作业票报备总数" value={totals.siteReportTotal} unit="" color="#7C3AED" compact />
                <TripleCard label="相关方单位数量" value={totals.siteRelatedEnt} subValue={totals.siteRelatedUser} subLabel="相关方人员数量" pct={0} noPct color="#DC2626" />
              </>}
              tables={<DetailTable columns={['区域', '作业票总数', '已完成', '待验收', '待作业许可', '待现场签批', '作业票报备总数', '相关方单位数量', '相关方人员数量']}
                rows={filteredRegions.map(r => [
                  displayLevel === 'province' ? r.province : displayLevel === 'city' ? r.city : displayLevel === 'district' ? r.district : r.street,
                  r.siteWorkPermitTotal, r.siteWorkPermitDone, r.siteWorkPermitWait, r.siteWorkPermitLicense, r.siteWorkPermitSign,
                  r.siteReportTotal, r.siteRelatedEnt, r.siteRelatedUser,
                ])} />}
            />
          )}

        </div>
      </div>

      {/* ─── 修改记录弹窗 ──────────────────────────────────────── */}
      {showChangelog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}
          onClick={() => { setShowChangelog(false); setEditingId(null) }}
        >
          <div style={{
            background: 'white', borderRadius: 10, boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            width: isMobile ? 'calc(100% - 24px)' : 520, maxHeight: '70vh', overflow: 'auto', padding: isMobile ? '16px 18px' : '24px 28px',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>📝 修改记录</div>
              <button
                onClick={() => { setShowChangelog(false); setEditingId(null) }}
                style={{ border: 'none', background: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {changeLogItems.map(item => (
                <div key={item.id} style={{
                  padding: '12px 14px', background: '#F9FAFB', borderRadius: 8,
                  borderLeft: '3px solid #4F46E5',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{item.date}</span>
                      <span style={{
                        fontSize: 11, padding: '1px 8px', borderRadius: 3,
                        background: '#EEF2FF', color: '#4F46E5', fontWeight: 500,
                      }}>
                        {item.location}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (editingId === item.id) {
                          setChangeLogItems(prev => {
                            const updated = prev.map(i => i.id === item.id ? { ...i, content: editText, editing: false } : i)
                            localStorage.setItem('opsAnalytics_changeLogItems', JSON.stringify(updated))
                            return updated
                          })
                          setEditingId(null)
                        } else {
                          setEditingId(item.id)
                          setEditText(item.content)
                        }
                      }}
                      style={{
                        padding: '2px 8px', fontSize: 11, borderRadius: 4, border: 'none',
                        background: editingId === item.id ? '#4F46E5' : '#EEF2FF',
                        color: editingId === item.id ? 'white' : '#4F46E5',
                        cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      {editingId === item.id ? '保存' : '编辑'}
                    </button>
                  </div>
                  {editingId === item.id ? (
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      style={{
                        width: '100%', minHeight: 80, padding: '8px 10px',
                        border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13,
                        color: '#374151', lineHeight: 1.6, resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                      autoFocus
                    />
                  ) : (
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                onClick={() => { setShowChangelog(false); setEditingId(null) }}
                style={{
                  padding: '6px 20px', border: 'none', borderRadius: 6,
                  background: '#4F46E5', color: 'white', fontSize: 13, cursor: 'pointer',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 子组件 ────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: '2px 8px', border: '1px solid #9CA3AF', borderRadius: 4,
  fontSize: 12, color: '#6B7280', background: 'white', outline: 'none',
}
const inputSmall: React.CSSProperties = {
  padding: '2px 6px', border: '1px solid #9CA3AF', borderRadius: 4,
  fontSize: 12, color: '#374151', background: 'white', outline: 'none',
}

// ─── 排序表头 ──────────────────────────────────────────────────
function SortTh({ label, field, current, dir, onClick, last }: {
  label: string; field: string; current: string; dir: string; onClick: () => void; last?: boolean
}) {
  const active = current === field
  return (
    <th style={{
      ...th, cursor: 'pointer', userSelect: 'none',
      background: active ? '#EEF2FF' : '#F3F4F6',
      color: active ? '#4F46E5' : '#374151',
      borderRight: last ? 'none' : '1px solid #E5E7EB',
    }} onClick={onClick}>
      {label}
      <span style={{ marginLeft: 2, fontSize: 10 }}>
        {active ? (dir === 'desc' ? ' ▼' : ' ▲') : ' ▸'}
      </span>
    </th>
  )
}

// ─── 多选下拉组件 ──────────────────────────────────────────────
function MultiSelectDropdown({
  label, options, selected, onChange, open, onToggle, disabled,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  open: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt))
    } else {
      onChange([...selected, opt])
    }
  }
  const selectAll = () => onChange([...options])
  const clearAll = () => onChange([])
  const hasSelection = selected.length > 0
  const [search, setSearch] = useState('')
  const filtered = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options
  const allChecked = filtered.length > 0 && filtered.every(o => selected.includes(o))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
      <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{label}:</span>
      <button
        onClick={disabled ? undefined : onToggle}
        style={{
          padding: '2px 8px', border: '1px solid #9CA3AF', borderRadius: 4,
          fontSize: 12, background: hasSelection ? '#EEF2FF' : 'white',
          color: hasSelection ? '#4F46E5' : (disabled ? '#D1D5DB' : '#6B7280'),
          cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {hasSelection ? `已选 ${selected.length} 项` : (disabled ? '暂无' : '全部')}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 2,
          background: 'white', border: '1px solid #9CA3AF', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
          maxHeight: 250, overflowY: 'auto', minWidth: 160,
        }}>
          {/* 搜索框 */}
          <div style={{ padding: '4px 8px', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, background: 'white' }}>
            <input
              type="text"
              placeholder="搜索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '3px 6px', border: '1px solid #9CA3AF', borderRadius: 3,
                fontSize: 11, color: '#374151', outline: 'none', boxSizing: 'border-box',
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          {/* 全选/清空 */}
          <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid #F3F4F6' }}>
            <button onClick={selectAll} style={{ fontSize: 10, color: '#4F46E5', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>全选</button>
            <button onClick={clearAll} style={{ fontSize: 10, color: '#9CA3AF', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>清空</button>
          </div>
          {filtered.map(opt => (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', cursor: 'pointer', fontSize: 12,
              color: '#374151', whiteSpace: 'nowrap',
            }}>
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                style={{ margin: 0 }}
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── 月环比模拟 ───────────────────────────────────────────────
const mom = (seed: number) => ((seed % 20) - 10 + Math.random() * 5).toFixed(2)
const momPct = (v: string) => (Number(v) >= 0 ? '+' : '') + v + '%'

function KpiBlock({ label, value, unit, color, compact, subLabel, subValue, subUnit, momChange }: {
  label: string; value: number; unit: string; color: string; compact?: boolean
  subLabel?: string; subValue?: number; subUnit?: string; momChange?: string
}) {
  const fontSize = compact ? 18 : 24
  const padding = compact ? '10px 14px' : '14px 18px'
  const hasDual = subValue != null && !subLabel
  const hasRatio = subValue != null && subLabel != null
  const _mom = momChange ?? (((hashRegion(label) % 20) - 10 + Math.random() * 5).toFixed(2))
  return (
    <div style={{
      background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding,
      flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: 'center', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
        {hasRatio ? `${label} / ${subLabel}` : label}
      </div>
      {hasRatio ? (
        <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
          {value.toLocaleString()}{' / '}{subValue!.toLocaleString()}
          <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{unit}</span>
        </span>
      ) : hasDual ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {subValue!.toLocaleString()}
              <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{subUnit}</span>
            </span>
            <MomLabel seed={value + (subValue ?? 0) + 7000} />
          </div>
          <span style={{ color: '#E5E7EB', fontSize: 14, alignSelf: 'center' }}>|</span>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              {value.toLocaleString()}
              <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{unit}</span>
            </span>
            <MomLabel seed={value + (subValue ?? 0) + 8000} />
          </div>
        </div>
      ) : (
        <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2 }}>
          {value.toLocaleString()}
          <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{unit}</span>
        </span>
      )}
      {_mom && (
        <div style={{ fontSize: 10, color: Number(_mom) >= 0 ? '#DC2626' : '#059669', marginTop: 2 }}>
          环比 {momPct(_mom)}
        </div>
      )}
    </div>
  )
}

function TabSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, paddingLeft: 4, borderLeft: '3px solid #4F46E5' }}>{title}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

// ─── 三合KPI卡 ──────────────────────────────────────────────
function TripleCard({ label, value, subValue, subLabel, pct, color, pct2, pct2Label, noPct }: {
  label: string; value: number; subValue: number; subLabel: string; pct: number; color: string
  pct2?: number; pct2Label?: string; noPct?: boolean
}) {
  const hasPct2 = pct2 != null && pct2Label != null
  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 auto' }}>
      <Column label={label} value={value} color={color} />
      <div style={{ width: 2, height: 28, background: '#9CA3AF', flexShrink: 0 }} />
      <Column label={subLabel} value={subValue} color="#059669" />
      {hasPct2 ? (
        <>
          <div style={{ width: 2, height: 28, background: '#9CA3AF', flexShrink: 0 }} />
          <Column label={pct2Label!} value2={pct2!.toLocaleString()} color="#3B82F6" />
        </>
      ) : !noPct ? (
        <>
          <div style={{ width: 2, height: 28, background: '#9CA3AF', flexShrink: 0 }} />
          <Column label="整改完成率" value2={`${pct}%`} color={pct >= 80 ? '#059669' : pct >= 50 ? '#D97706' : '#DC2626'} />
        </>
      ) : null}
    </div>
  )
}

// ─── 月环比标签 ───────────────────────────────────────────────
function MomLabel({ seed }: { seed: number }) {
  const m = ((seed % 20) - 10 + Math.random() * 5).toFixed(2)
  const isUp = Number(m) >= 0
  return <div style={{ fontSize: 10, color: isUp ? '#DC2626' : '#059669', marginTop: 1, whiteSpace: 'nowrap' }}>环比 {isUp ? '+' : ''}{m}%</div>
}

function Column({ label, value, value2, color, subLabel, subValue, momChange }: { label: string; value?: number; value2?: string; color: string; subLabel?: string; subValue?: number; momChange?: string }) {
  const hasSub = subLabel != null && subValue != null
  const _mom = momChange ?? (((hashRegion(label) % 20) - 10 + Math.random() * 5).toFixed(2))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'space-around' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1.2 }}>
          {value2 ?? (value ?? 0).toLocaleString()}
        </div>
        {_mom && <div style={{ fontSize: 10, color: Number(_mom) >= 0 ? '#DC2626' : '#059669', marginTop: 1 }}>环比 {momPct(_mom)}</div>}
      </div>
      {hasSub && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>{subLabel}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#6B7280', lineHeight: 1.2 }}>
            {subValue!.toLocaleString()}
          </div>
          <MomLabel seed={hashRegion(subLabel!) + (value ?? 0) + (subValue ?? 0)} />
        </div>
      )}
    </div>
  )
}

function MultiCard({ labels, values, units, colors, extra, extraLabel }: {
  labels: string[]; values: number[]; units: string[]; colors: string[]
  extra?: number; extraLabel?: string
}) {
  const hasExtra = extra != null && extraLabel != null
  const n = labels.length
  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto' }}>
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <div style={{ width: 2, height: 28, background: '#9CA3AF', flexShrink: 0 }} />}
          <Column label={l} value={values[i]} color={colors[i]} />
        </React.Fragment>
      ))}
      {hasExtra && (
        <>
          <div style={{ width: 2, height: 28, background: '#9CA3AF', flexShrink: 0 }} />
          <Column label={extraLabel!} value2={`${extra}%`} color={extra! >= 80 ? '#059669' : extra! >= 50 ? '#D97706' : '#DC2626'} />
        </>
      )}
    </div>
  )
}

// ─── 五维分析指标卡（百分比进度条 + 已/未完成） ───────────────
function FiveDimCard({ title, doneLabel, done, undoneLabel, undone, color }: {
  title: string; doneLabel: string; done: number; undoneLabel: string; undone: number; color: string
}) {
  const total = done + undone
  const pct = total > 0 ? Math.round(done / total * 100) : 0
  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #9CA3AF', padding: '12px 14px', flex: '1 1 0', minWidth: 190 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 10, background: '#F3F4F6', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 5 }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color, minWidth: 42, textAlign: 'right' }}>{pct}%</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 6, padding: '8px 10px', border: '1px solid #F3F4F6', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{doneLabel}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color }}>{done.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 6, padding: '8px 10px', border: '1px solid #F3F4F6', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>{undoneLabel}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#9CA3AF' }}>{undone.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

function FunctionPanel({ kpis, tables, isMobile }: { kpis: React.ReactNode; tables?: React.ReactNode; isMobile?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>{kpis}</div>
      {tables}
    </div>
  )
}

function EnterpriseTop10({ moduleFilter, totalsActiveUsers, accessActiveUsers }: { moduleFilter: ModuleFilterValue; totalsActiveUsers: number; accessActiveUsers: number }) {
  const enterprises = useMemo(() => generateActiveEnterprises(), [])
  const scale = moduleFilter === 'all' ? 1 : (totalsActiveUsers > 0 ? accessActiveUsers / totalsActiveUsers : 0.3)
  type ESortField = 'activeDays' | 'activeUsers' | 'avgVisits'
  const [eSortField, setESortField] = useState<ESortField>('activeDays')
  const [eSortDir, setESortDir] = useState<'asc' | 'desc'>('desc')
  const handleESort = (field: ESortField) => {
    if (eSortField === field) { setESortDir(d => d === 'desc' ? 'asc' : 'desc') }
    else { setESortField(field); setESortDir('desc') }
  }
  const top10 = useMemo(() => {
    const scaled = enterprises.map(e => ({
      ...e, activeUsers: Math.floor(e.activeUsers * scale),
      visits: Math.floor(e.visits * scale),
    }))
    const list = [...scaled]
    const mul = eSortDir === 'desc' ? -1 : 1
    const order: ESortField[] = eSortField === 'activeDays' ? ['activeDays','activeUsers','avgVisits']
      : eSortField === 'activeUsers' ? ['activeUsers','activeDays','avgVisits']
      : ['avgVisits','activeDays','activeUsers']
    const get = (e: ActiveEnterprise, f: ESortField) =>
      f === 'activeDays' ? e.activeDays : f === 'activeUsers' ? e.activeUsers : (e.activeUsers > 0 ? e.visits / e.activeUsers : 0)
    list.sort((a, b) => {
      for (const f of order) {
        const diff = (get(a, f) - get(b, f)) * mul
        if (diff !== 0) return diff
      }
      return 0
    })
    return list.slice(0, 10)
  }, [enterprises, eSortField, eSortDir, scale])

  return (
    <div style={{ background: 'white', border: '1px solid #9CA3AF', borderRadius: 8, padding: 14, marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>企业近30天活跃排行榜 TOP10</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={th}>排名</th>
              <th style={{ ...th, textAlign: 'left' }}>企业名称</th>
              <th style={th}>社会信用代码</th>
              <th style={th}>省</th>
              <th style={th}>市</th>
              <th style={th}>区</th>
              <th style={th}>街道</th>
              <SortTh label="累计活跃天数" field="activeDays" current={eSortField} dir={eSortDir} onClick={() => handleESort('activeDays')} />
              <SortTh label="累计活跃人数" field="activeUsers" current={eSortField} dir={eSortDir} onClick={() => handleESort('activeUsers')} />
              <th style={th}>企业人数</th>
              <SortTh label="人均访问次数" field="avgVisits" current={eSortField} dir={eSortDir} onClick={() => handleESort('avgVisits')} last />
            </tr>
          </thead>
          <tbody>
            {top10.map((e, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={td({ color: i < 3 ? '#4F46E5' : '#9CA3AF', fontWeight: i < 3 ? 700 : 400 })}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                </td>
                <td style={td({ textAlign: 'left', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={e.name}>{e.name}</td>
                <td style={td({ fontFamily: 'monospace', fontSize: 11, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })} title={e.creditCode}>{e.creditCode}</td>
                <td style={td({})}>{e.province}</td>
                <td style={td({})}>{e.city}</td>
                <td style={td({})}>{e.district}</td>
                <td style={td({})}>{e.street}</td>
                <td style={td({ fontWeight: 600, color: i < 3 ? '#4F46E5' : '#374151' })}>{e.activeDays} 天</td>
                <td style={td({})}>{e.activeUsers}</td>
                <td style={td({})}>{e.totalEmployees}</td>
                <td style={td({ borderRight: 'none' })}>{e.activeUsers > 0 ? Math.round(e.visits / e.activeUsers * 10) / 10 : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DetailTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  const [dtSort, setDtSort] = useState(0) // 0=no sort; >0=asc; <0=desc (按第|n|列排序)
  const handleDtSort = (colIdx: number) => {
    setDtSort(dtSort === colIdx + 1 ? -(colIdx + 1) : dtSort === -(colIdx + 1) ? 0 : colIdx + 1)
  }
  const sortedRows = useMemo(() => {
    if (dtSort === 0) return rows
    const col = Math.abs(dtSort) - 1
    const dir = dtSort > 0 ? -1 : 1
    return [...rows].sort((a, b) => {
      const va = typeof a[col] === 'number' ? a[col] : String(a[col])
      const vb = typeof b[col] === 'number' ? b[col] : String(b[col])
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }, [rows, dtSort])

  return (
    <div style={{ maxHeight: 340, overflowY: 'auto', marginTop: 4 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            <th style={{ ...th, width: 40, background: '#F3F4F6' }}>#</th>
            {columns.map((col, i) => {
              const sorted = Math.abs(dtSort) === i + 1
              const icon = sorted ? (dtSort > 0 ? ' ▼' : ' ▲') : ' ⇅'
              return (
                <th key={i} onClick={() => handleDtSort(i)}
                  style={{
                    ...th, cursor: 'pointer', userSelect: 'none',
                    background: sorted ? '#EEF2FF' : '#F3F4F6',
                    color: sorted ? '#4F46E5' : '#374151',
                    textAlign: i === 0 ? 'left' : 'center',
                    borderRight: i === columns.length - 1 ? 'none' : '1px solid #E5E7EB',
                  }}>
                  {col}<span style={{ fontSize: 10, color: sorted ? '#4F46E5' : '#9CA3AF' }}>{icon}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
              <td style={td({ color: '#9CA3AF', fontWeight: 400 })}>{i + 1}</td>
              {row.map((cell, j) => (
                <td key={j} style={{
                  ...td({ textAlign: j === 0 ? 'left' : 'center', borderRight: j === columns.length - 1 ? 'none' : '1px solid #F3F4F6' }),
                  fontWeight: j >= 1 ? 600 : 400,
                }}>
                  {typeof cell === 'number' ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
