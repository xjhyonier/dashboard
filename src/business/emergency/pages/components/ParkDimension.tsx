import { useState, useMemo, useEffect } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import { useSortableTable } from './useSortableTable'
import { initDatabase, getEnterprises, getExperts, getEnterpriseDimensions, getRiskPoints } from '../../../../db'
import type { Enterprise, EnterpriseDimensions, Expert, RiskPoint, RiskLevel, PlanType } from '../../../../db/types'
import { exportToCSV } from './exportUtils'
import { getPlaceCategory } from './placeCategory'

// 合并企业数据
interface EnterpriseWithDimensions extends Enterprise {
  dimensions?: EnterpriseDimensions
}

// 承租单位（mock）信息
interface TenantInfo {
  count: number
  names: string[]
}

// 风险等级颜色
const RISK_COLORS: Record<string, string> = {
  '重大': '#DC2626',
  '较大': '#F97316',
  '一般': '#EAB308',
  '低': '#3B82F6',
}

// 承租单位名称池
const TENANT_PREFIX = ['鑫源', '华瑞', '鼎盛', '宏图', '盛达', '瑞丰', '顺康', '嘉和', '锦程', '天成', '博远', '德盛', '新兴', '万邦', '联众', '海纳', '百川', '金鼎', '永乐', '鼎峰', '广源', '汇丰', '中达', '安泰']
const TENANT_SUFFIX = ['贸易有限公司', '科技有限公司', '制造有限公司', '物流有限公司', '餐饮管理有限公司', '服饰有限公司', '建材有限公司', '电子有限公司', '食品有限公司', '文化传媒有限公司', '商贸有限公司', '装饰工程有限公司']

// 字符串哈希（确定性）
function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// 为房东（企业）确定性生成承租单位
function genTenants(seed: number): TenantInfo {
  const count = seed % 9 // 0-8 个承租单位
  const names: string[] = []
  const used = new Set<string>()
  for (let i = 0; i < count; i++) {
    let p = TENANT_PREFIX[((seed + i * 7) % TENANT_PREFIX.length + TENANT_PREFIX.length) % TENANT_PREFIX.length]
    let s = TENANT_SUFFIX[((seed * 3 + i * 11) % TENANT_SUFFIX.length + TENANT_SUFFIX.length) % TENANT_SUFFIX.length]
    let name = `${p}${s}`
    // 避免同一房东下重名
    let k = 1
    while (used.has(name)) {
      name = `${p}${s}(${k})`
      k++
    }
    used.add(name)
    names.push(name)
  }
  return { count, names }
}

// 行内风险等级配色（与企业看板一致）
const ROW_RISK_COLORS: Record<string, string> = {
  '重大': '#DC2626',
  '较大': '#D97706',
  '一般': '#D97706',
  '低': '#059669',
}

// 企业维度列（房东行复用）
function EnterpriseCells({ dims, expert, riskPointCount, riskLevel }: {
  dims?: EnterpriseDimensions
  expert?: Expert
  riskPointCount: number
  riskLevel: string
}) {
  return (
    <>
      <td style={{ ...tdStyle, fontWeight: 600, color: ROW_RISK_COLORS[riskLevel] || '#374151' }}>{riskLevel || '-'}</td>
      <td style={{ ...tdStyle, color: '#4F46E5' }}>{expert?.name || '-'}</td>
      <td style={{ ...tdStyle, fontWeight: 500 }}>{dims?.todo_total ?? 0}</td>
      <td style={{ ...tdStyle, color: '#059669' }}>{dims?.todo_read ?? 0}</td>
      <td style={{ ...tdStyle, color: '#2563EB', fontWeight: 500 }}>{dims?.todo_completed ?? 0}</td>
      <td style={{ ...tdStyle, color: '#059669', fontWeight: 500 }}>{(dims?.todo_total ?? 0) > 0 ? `${Math.round(((dims?.todo_completed ?? 0) / (dims?.todo_total ?? 1)) * 100)}%` : '-'}</td>
      <td style={{ ...tdStyle, color: '#7C3AED', fontWeight: 500 }}>{(dims?.todo_read ?? 0) > 0 ? `${Math.round(((dims?.todo_completed ?? 0) / (dims?.todo_read ?? 1)) * 100)}%` : '-'}</td>
      <td style={{ ...tdStyle, color: dims?.info_collected ? '#059669' : '#DC2626' }}>{dims?.info_collected ? '✓' : '✗'}</td>
      <td style={{ ...tdStyle, color: dims?.data_authorized ? '#059669' : '#D97706' }}>{dims?.data_authorized ? '✓' : '✗'}</td>
      <td style={{ ...tdStyle, color: riskPointCount > 0 ? '#059669' : '#9CA3AF', fontWeight: riskPointCount > 0 ? 600 : 400 }}>{riskPointCount}</td>
      <td style={{ ...tdStyle, color: (dims?.duty_rate ?? 0) >= 80 ? '#059669' : '#DC2626', fontWeight: 500 }}>{(dims?.duty_rate ?? 0) >= 80 ? '是' : '否'}</td>
      <td style={{ ...tdStyle, color: (dims?.system_rate ?? 0) >= 80 ? '#059669' : '#DC2626', fontWeight: 500 }}>{(dims?.system_rate ?? 0) >= 80 ? '是' : '否'}</td>
      <td style={{ ...tdStyle, color: (dims?.invest_rate ?? 0) >= 80 ? '#059669' : '#DC2626', fontWeight: 500 }}>{(dims?.invest_rate ?? 0) >= 80 ? '是' : '否'}</td>
      <td style={{ ...tdStyle, color: dims?.plan_type ? '#059669' : '#DC2626', fontWeight: 500 }}>{dims?.plan_type ? '有' : '无'}</td>
      <td style={{ ...tdStyle, color: dims?.third_party_sync ? '#059669' : '#DC2626', fontWeight: 500 }}>{dims?.third_party_sync ? '是' : '否'}</td>
      <td style={{ ...tdStyle, color: dims?.patrol_used ? '#059669' : '#9CA3AF' }}>{dims?.patrol_used ? `${(dims?.patrol_casual ?? 0) + (dims?.patrol_daily ?? 0) + (dims?.patrol_special ?? 0)}` : '-'}</td>
      <td style={{ ...tdStyle, color: dims?.training_done ? '#059669' : '#9CA3AF' }}>{dims?.training_done ? `${(dims?.training_daily ?? 0) + (dims?.training_three_level ?? 0)}` : '-'}</td>
      <td style={{ ...tdStyle, color: (dims?.work_permit ?? 0) > 0 ? '#D97706' : '#9CA3AF', fontWeight: (dims?.work_permit ?? 0) > 0 ? 600 : 400 }}>{dims?.work_permit ?? 0}</td>
      <td style={{ ...tdStyle, color: '#D97706' }}>{dims?.hazard_self ?? 0}</td>
      <td style={{ ...tdStyle, color: '#D97706' }}>{dims?.hazard_monitor ?? 0}</td>
      <td style={{ ...tdStyle, color: '#DC2626', fontWeight: 600 }}>{dims?.hazard_major ?? 0}</td>
      <td style={tdStyle}>
        {(() => {
          const total = (dims?.hazard_self ?? 0) + (dims?.hazard_monitor ?? 0) + (dims?.hazard_major ?? 0)
          const rectified = dims?.rectify_status === 'completed' ? total : Math.floor(total * 0.7)
          return <span style={{ color: rectified === total ? '#059669' : '#D97706', fontWeight: 500 }}>{rectified}/{total}</span>
        })()}
      </td>
    </>
  )
}

// 承租单位（mock）风险等级
const TENANT_RISK_LEVELS: RiskLevel[] = ['重大', '较大', '一般', '低']

// 为承租单位确定性生成一套完整的企业维度数据（mock）
function genTenantDims(seed: number): EnterpriseDimensions {
  const completed = (seed % 2) === 0
  const todoTotal = (seed % 18) + 1
  const todoRead = Math.min(todoTotal, Math.max(0, Math.floor((todoTotal * ((seed % 5) + 4)) / 8)))
  const todoCompleted = Math.min(todoRead, Math.floor((todoRead * ((seed % 4) + 3)) / 6))
  return {
    enterprise_id: `mock-${seed}`,
    info_collected: (seed % 3) !== 0,
    data_authorized: (seed % 4) !== 0,
    risk_identified: (seed % 2) === 0,
    duty_rate: 45 + (seed % 60),
    system_rate: 45 + (seed % 60),
    invest_rate: 45 + (seed % 60),
    plan_type: (['weekly', 'monthly', 'quarterly'] as PlanType[])[seed % 3],
    plan_executed: (seed % 3) !== 0,
    third_party_sync: (seed % 3) === 0,
    patrol_used: (seed % 5) !== 0,
    patrol_casual: seed % 7,
    patrol_daily: seed % 5,
    patrol_special: seed % 3,
    training_done: (seed % 4) !== 0,
    training_record: (seed % 2) === 0,
    training_daily: seed % 6,
    training_three_level: seed % 4,
    work_permit: seed % 5,
    hazard_self: seed % 9,
    hazard_monitor: seed % 6,
    hazard_major: seed % 3,
    rectify_status: completed ? 'completed' : 'uncompleted',
    patrol_done: (seed % 2) === 0,
    todo_total: todoTotal,
    todo_read: todoRead,
    todo_completed: todoCompleted,
    updated_at: '',
  }
}

// 表格 / 导出用的统一行结构（房东行 + 承租行共用一套渲染）
interface RowData {
  key: string
  isLandlord: boolean
  landlordName: string    // 房东行=房东名；承租行=所属房东名（左侧列也填上，便于按列查看归属）
  tenantLabel: string     // 房东行 '/'，承租行=承租单位名（不含房东前缀，归属见左侧房东名称列）
  dims?: EnterpriseDimensions
  expert?: Expert
  riskPointCount: number
  riskLevel: string
  industry: string
  workGroup: string
}

// 由一家企业展开为「房东行 + 各承租单位行」
// tenantNames：要展开的承租单位名（已按搜索条件过滤）；includeLandlord：是否包含房东自身行
function buildEnterpriseRows(
  e: EnterpriseWithDimensions,
  dimsMap: Record<string, EnterpriseDimensions>,
  experts: Expert[],
  riskPoints: RiskPoint[],
  tenantNames: string[],
  includeLandlord: boolean,
): RowData[] {
  const dims = dimsMap[e.id]
  const expert = experts.find(exp => exp.id === e.expert_id)
  const riskPointCount = riskPoints.filter(rp => rp.enterprise_id === e.id).length
  const rows: RowData[] = []
  if (includeLandlord) {
    rows.push({
      key: `${e.id}-L`,
      isLandlord: true,
      landlordName: e.name,
      tenantLabel: '/',
      dims,
      expert,
      riskPointCount,
      riskLevel: e.risk_level,
      industry: e.industry,
      workGroup: e.work_group,
    })
  }
  tenantNames.forEach((tName) => {
    const tSeed = hashStr(`${e.id}-T-${tName}`)   // 按承租名生成稳定种子，过滤不影响数据
    rows.push({
      key: `${e.id}-T-${tName}`,
      isLandlord: false,
      landlordName: e.name,
      tenantLabel: tName,
      dims: genTenantDims(tSeed),
      expert: experts.length ? experts[tSeed % experts.length] : undefined,
      riskPointCount: tSeed % 6,
      riskLevel: TENANT_RISK_LEVELS[tSeed % TENANT_RISK_LEVELS.length],
      industry: e.industry,
      workGroup: e.work_group,
    })
  })
  return rows
}

export function ParkDimension({ placeCategory = 'all' }: { placeCategory?: string } = {}) {
  const [enterprises, setEnterprises] = useState<EnterpriseWithDimensions[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [dimensionsMap, setDimensionsMap] = useState<Record<string, EnterpriseDimensions>>({})
  const [riskPoints, setRiskPoints] = useState<RiskPoint[]>([])
  const [entKeyword, setEntKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDatabase()
        const [entList, expertList] = await Promise.all([
          getEnterprises(),
          getExperts(),
        ])

        const dimsMap: Record<string, EnterpriseDimensions> = {}
        const enterprisesWithDims: EnterpriseWithDimensions[] = entList.map(ent => {
          const dims = {} as EnterpriseDimensions
          dimsMap[ent.id] = dims
          return { ...ent, dimensions: dims }
        })

        for (const ent of entList) {
          const dims = await getEnterpriseDimensions(ent.id)
          if (dims) {
            dimsMap[ent.id] = dims
            const idx = enterprisesWithDims.findIndex(e => e.id === ent.id)
            if (idx >= 0) {
              enterprisesWithDims[idx].dimensions = dims
            }
          }
        }

        setEnterprises(enterprisesWithDims)
        setExperts(expertList)
        setDimensionsMap(dimsMap)

        const points = await getRiskPoints()
        setRiskPoints(points)
      } catch (err) {
        console.error('Failed to load enterprises:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 承租单位映射（按企业 id 确定性生成）
  const tenantsMap = useMemo(() => {
    const map: Record<string, TenantInfo> = {}
    enterprises.forEach(e => { map[e.id] = genTenants(hashStr(e.id)) })
    return map
  }, [enterprises])

  // 过滤后的企业（房东名 / 承租单位名匹配任一即保留）
  const { sortedData: filteredEnterprises } = useSortableTable<EnterpriseWithDimensions>(
    useMemo(() => {
      let result = enterprises
      // 企业场所分类筛选（按房东本身所属分类）
      if (placeCategory && placeCategory !== 'all') {
        result = result.filter(e => getPlaceCategory(e.name) === placeCategory)
      }
      if (entKeyword.trim()) {
        const kw = entKeyword.trim().toLowerCase()
        result = result.filter(e => {
          if (e.name.toLowerCase().includes(kw)) return true
          if (e.work_group.toLowerCase().includes(kw)) return true
          if (e.industry.toLowerCase().includes(kw)) return true
          const tenantNames = tenantsMap[e.id]?.names ?? []
          return tenantNames.some(t => t.toLowerCase().includes(kw))
        })
      }
      return result
    }, [enterprises, entKeyword, tenantsMap, placeCategory]),
    'name',
    'asc'
  )

  // 展开为「房东行 + 承租行」全量数组（搜索命中承租名时仅展开匹配承租，房东行仍保留）
  const allRows = useMemo(() => {
    const kw = entKeyword.trim().toLowerCase()
    const rows: RowData[] = []
    filteredEnterprises.forEach(e => {
      const allTenantNames = tenantsMap[e.id]?.names ?? []
      const landlordMatch = !kw || e.name.toLowerCase().includes(kw)
      const matchedTenants = kw ? allTenantNames.filter(t => t.toLowerCase().includes(kw)) : allTenantNames
      const includeLandlord = landlordMatch || matchedTenants.length > 0
      const tenantNames = landlordMatch ? allTenantNames : matchedTenants
      if (!includeLandlord) return
      rows.push(...buildEnterpriseRows(e, dimensionsMap, experts, riskPoints, tenantNames, true))
    })
    return rows
  }, [filteredEnterprises, tenantsMap, dimensionsMap, experts, riskPoints, entKeyword])

  // ─── 汇总统计（与企业看板一致） ──────────────────────
  const stats = useMemo(() => {
    let checkEnterprise = 0
    let trainEnterprise = 0
    let totalSelfHazard = 0
    let rectifiedSelfHazard = 0
    let totalMajorHazard = 0
    let rectifiedMajorHazard = 0

    filteredEnterprises.forEach(e => {
      const d = dimensionsMap[e.id]
      if (!d) return

      if ((d.patrol_daily || 0) > 0 || (d.patrol_special || 0) > 0 || (d.patrol_casual || 0) > 0) {
        checkEnterprise++
      }
      if (d.training_done || (d.training_daily || 0) > 0 || (d.training_three_level || 0) > 0) {
        trainEnterprise++
      }

      const isRectified = d.rectify_status === 'completed'
      const selfHazard = d.hazard_self || 0
      const majorHazard = d.hazard_major || 0

      totalSelfHazard += selfHazard
      rectifiedSelfHazard += isRectified ? selfHazard : Math.floor(selfHazard * 0.7)
      totalMajorHazard += majorHazard
      rectifiedMajorHazard += isRectified ? majorHazard : Math.floor(majorHazard * 0.7)
    })

    return {
      checkEnterprise,
      trainEnterprise,
      totalSelfHazard,
      rectifiedSelfHazard,
      totalMajorHazard,
      rectifiedMajorHazard,
    }
  }, [filteredEnterprises, dimensionsMap])

  // 分页（按展开后的实际行数，含承租单位）
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedRows = allRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
        加载中...
      </div>
    )
  }

  return (
    <div>
      {/* ─── KPI 指标卡（与企业看板一致） ──────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {/* 安全检查户数 */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #9CA3AF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>安全检查户数</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1D4ED8' }}>{stats.checkEnterprise.toLocaleString()}</div>
        </div>
        {/* 教育培训户数 */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #9CA3AF', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>教育培训户数</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#7C3AED' }}>{stats.trainEnterprise.toLocaleString()}</div>
        </div>
        {/* 自查隐患数 / 已整改 */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #9CA3AF', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>自查隐患数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626', lineHeight: 1.2 }}>{stats.totalSelfHazard.toLocaleString()}</div>
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>已整改</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>{stats.rectifiedSelfHazard.toLocaleString()}</div>
          </div>
        </div>
        {/* 重大事故隐患数 / 已整改 */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '10px 14px', border: '1px solid #9CA3AF', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>重大事故隐患数</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#991B1B', lineHeight: 1.2 }}>{stats.totalMajorHazard.toLocaleString()}</div>
          </div>
          <div style={{ width: 2, height: 28, background: '#9CA3AF' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2, whiteSpace: 'nowrap' }}>已整改</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', lineHeight: 1.2 }}>{stats.rectifiedMajorHazard.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 房东列表 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            房东列表
            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
              共 {filteredEnterprises.length} 家
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="搜索房东名称 / 承租单位名称"
              value={entKeyword}
              onChange={e => { setEntKeyword(e.target.value); setCurrentPage(1) }}
              style={inputStyle}
            />
            <button
              onClick={() => {
                const exportData: Record<string, string | number>[] = []
                allRows.forEach(row => {
                    const dims = row.dims
                    const expert = row.expert
                    const rectifiedTotalText = (() => {
                      const total = (dims?.hazard_self ?? 0) + (dims?.hazard_monitor ?? 0) + (dims?.hazard_major ?? 0)
                      const rectified = dims?.rectify_status === 'completed' ? total : Math.floor(total * 0.7)
                      return `${rectified}/${total}`
                    })()
                    exportData.push({
                      房东名称: row.landlordName,
                      承租单位名称: row.tenantLabel,
                      风险等级: row.riskLevel,
                      专家: expert?.name || '-',
                      待办总数: dims?.todo_total ?? 0,
                      已读待办数: dims?.todo_read ?? 0,
                      待办完成数: dims?.todo_completed ?? 0,
                      待办完成率: (dims?.todo_total ?? 0) > 0 ? `${Math.round(((dims?.todo_completed ?? 0) / (dims?.todo_total ?? 1)) * 100)}%` : '-',
                      已读待办完成率: (dims?.todo_read ?? 0) > 0 ? `${Math.round(((dims?.todo_completed ?? 0) / (dims?.todo_read ?? 1)) * 100)}%` : '-',
                      行业: row.industry,
                      工作组: row.workGroup,
                      信息采集: dims?.info_collected ? '是' : '否',
                      数据授权: dims?.data_authorized ? '是' : '否',
                      风险点: row.riskPointCount,
                      机构职责: (dims?.duty_rate ?? 0) >= 80 ? '是' : '否',
                      安全制度: (dims?.system_rate ?? 0) >= 80 ? '是' : '否',
                      安全投入: (dims?.invest_rate ?? 0) >= 80 ? '是' : '否',
                      检查计划: dims?.plan_type ? '有' : '无',
                      三方同步: dims?.third_party_sync ? '是' : '否',
                      安全检查: dims?.patrol_used ? `${(dims?.patrol_casual ?? 0) + (dims?.patrol_daily ?? 0) + (dims?.patrol_special ?? 0)}` : '-',
                      教育培训: dims?.training_done ? `${(dims?.training_daily ?? 0) + (dims?.training_three_level ?? 0)}` : '-',
                      作业票: dims?.work_permit ?? 0,
                      自查隐患: dims?.hazard_self ?? 0,
                      监管隐患: dims?.hazard_monitor ?? 0,
                      重大隐患: dims?.hazard_major ?? 0,
                      已整改数总数: rectifiedTotalText,
                    })
                })
                exportToCSV(exportData, [
                  { key: '房东名称', label: '房东名称' },
                  { key: '承租单位名称', label: '承租单位名称' },
                  { key: '风险等级', label: '风险等级' },
                  { key: '专家', label: '专家' },
                  { key: '待办总数', label: '待办总数' },
                  { key: '已读待办数', label: '已读待办数' },
                  { key: '待办完成数', label: '待办完成数' },
                  { key: '待办完成率', label: '待办完成率' },
                  { key: '已读待办完成率', label: '已读待办完成率' },
                  { key: '行业', label: '行业' },
                  { key: '工作组', label: '工作组' },
                  { key: '信息采集', label: '信息采集' },
                  { key: '数据授权', label: '数据授权' },
                  { key: '风险点', label: '风险点' },
                  { key: '机构职责', label: '机构职责' },
                  { key: '安全制度', label: '安全制度' },
                  { key: '安全投入', label: '安全投入' },
                  { key: '检查计划', label: '检查计划' },
                  { key: '三方同步', label: '三方同步' },
                  { key: '安全检查', label: '安全检查' },
                  { key: '教育培训', label: '教育培训' },
                  { key: '作业票', label: '作业票' },
                  { key: '自查隐患', label: '自查隐患' },
                  { key: '监管隐患', label: '监管隐患' },
                  { key: '重大隐患', label: '重大隐患' },
                  { key: '已整改数总数', label: '已整改数/总数' },
                ], '房东列表')
              }}
              style={{
                padding: '4px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                background: 'white',
                color: '#374151',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ⬇ 导出
            </button>
            {entKeyword && (
              <button
                onClick={() => { setEntKeyword(''); setCurrentPage(1) }}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  background: 'white',
                  color: '#6B7280',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1700 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, minWidth: 180 }}>房东名称</th>
                <th style={{ ...thStyle, minWidth: 260 }}>承租单位<br/>名称</th>
                <th style={thStyle}>风险等级</th>
                <th style={thStyle}>专家</th>
                <th style={thStyle}>待办<br/>总数</th>
                <th style={thStyle}>已读<br/>待办数</th>
                <th style={thStyle}>待办<br/>完成数</th>
                <th style={thStyle}>待办<br/>完成率</th>
                <th style={thStyle}>已读待办<br/>完成率</th>
                <th style={thStyle}>信息<br/>采集</th>
                <th style={thStyle}>数据<br/>授权</th>
                <th style={thStyle}>风险点</th>
                <th style={thStyle}>机构<br/>职责</th>
                <th style={thStyle}>安全<br/>制度</th>
                <th style={thStyle}>安全<br/>投入</th>
                <th style={thStyle}>检查<br/>计划</th>
                <th style={thStyle}>三方<br/>同步</th>
                <th style={thStyle} title="随手拍、日常检查、专项检查的次数">安全<br/>检查 <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', background: '#6B7280', color: 'white', fontSize: 9, fontWeight: 700, cursor: 'help', verticalAlign: 'middle' }}>!</span></th>
                <th style={thStyle} title="日常+三级培训次数">教育<br/>培训 <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', background: '#6B7280', color: 'white', fontSize: 9, fontWeight: 700, cursor: 'help', verticalAlign: 'middle' }}>!</span></th>
                <th style={thStyle}>作业票</th>
                <th style={thStyle}>自查<br/>隐患</th>
                <th style={thStyle}>监管<br/>隐患</th>
                <th style={thStyle}>重大<br/>隐患</th>
                <th style={thStyle}>已整改数/总数</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr><td colSpan={25} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>暂无数据</td></tr>
              ) : pagedRows.map((row, k) => {
                const globalIndex = (safePage - 1) * PAGE_SIZE + k + 1
                const shade = globalIndex % 2 === 0 ? '#FAFBFC' : 'white'
                return (
                  <tr key={row.key} style={{ background: shade }}>
                    <td style={{ ...tdStyle, color: '#9CA3AF' }}>{globalIndex}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: row.isLandlord ? 600 : 400, color: row.isLandlord ? '#1F2937' : '#9CA3AF', minWidth: 180 }}>{row.landlordName}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>{row.tenantLabel}</td>
                    <EnterpriseCells dims={row.dims} expert={row.expert} riskPointCount={row.riskPointCount} riskLevel={row.riskLevel} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
          <span>共 <span style={{ fontWeight: 600, color: '#1F2937' }}>{allRows.length}</span> 行（含承租单位），第 {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, allRows.length)} 行</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, []).map((p, i) =>
                p === '...' ? <span key={`dot-${i}`} style={{ padding: '2px 4px', color: '#9CA3AF' }}>…</span> :
                  <button key={p} onClick={() => setCurrentPage(p as number)}
                    style={{ padding: '2px 8px', border: '1px solid', borderColor: currentPage === p ? '#4F46E5' : '#D1D5DB', borderRadius: 4, background: currentPage === p ? '#4F46E5' : 'white', color: currentPage === p ? '#FFF' : '#6B7280', cursor: 'pointer', fontSize: 12 }}>
                    {p}
                  </button>
              )}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }}>›</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
