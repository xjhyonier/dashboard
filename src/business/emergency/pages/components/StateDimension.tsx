import { useState, useMemo, useEffect } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'
import { EnterpriseStatePath } from '../../../../components/shared/EnterpriseStatePath'
import type { StateDimensionProps } from './types'
import { initDatabase, getEnterprises, getExperts, getEnterpriseDimensions, getRiskPoints, db } from '../../../../db'
import type { Enterprise, EnterpriseDimensions, Expert, RiskPoint, RiskPointControl } from '../../../../db/types'
import { exportToCSV } from './exportUtils'

// 合并企业数据
interface EnterpriseWithDimensions extends Enterprise {
  dimensions?: EnterpriseDimensions
}

// 风险等级颜色
const RISK_COLORS: Record<string, string> = {
  '重大': '#DC2626',
  '较大': '#F97316',
  '一般': '#EAB308',
  '低': '#3B82F6',
}

export function StateDimension({ dateRange, riskLevel, timeRange, navigateParams }: StateDimensionProps) {
  const [enterprises, setEnterprises] = useState<EnterpriseWithDimensions[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [dimensionsMap, setDimensionsMap] = useState<Record<string, EnterpriseDimensions>>({})
  const [riskPoints, setRiskPoints] = useState<RiskPoint[]>([])
  const [riskPointControls, setRiskPointControls] = useState<RiskPointControl[]>([])
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null)
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all')
  const [riskPointPage, setRiskPointPage] = useState(1)
  const RISK_POINT_PAGE_SIZE = 20
  const [loading, setLoading] = useState(true)

  // 路径节点选中状态
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; count: string } | null>(null)

  // 专家筛选（支持 URL 参数）
  const [selectedExpert, setSelectedExpert] = useState<string>(navigateParams?.expertName || 'all')

  // 工作组筛选（支持 URL 参数）
  const [selectedTeam, setSelectedTeam] = useState<string>(navigateParams?.teamName || 'all')

  // 风险等级筛选
  const [selectedRisk, setSelectedRisk] = useState<string>('all')

  // 企业列表关键词筛选
  const [entKeyword, setEntKeyword] = useState('')

  // 路径节点 -> 筛选条件的映射
  // 字段名与数据库 EnterpriseDimensions 对应
  const nodeIdToFilter = (nodeId: string) => {
    switch (nodeId) {
      case 'all':             return (_e: EnterpriseWithDimensions) => true
      case 'opened':          return (e: EnterpriseWithDimensions) => e.dimensions?.info_collected === true
      case 'collected':       return (e: EnterpriseWithDimensions) => e.dimensions?.info_collected === true
      case 'authorized':      return (e: EnterpriseWithDimensions) => e.dimensions?.data_authorized === true
      case 'risk_match':      return (e: EnterpriseWithDimensions) => e.dimensions?.risk_identified === true
      case 'qualified':       return (e: EnterpriseWithDimensions) => e.dimensions?.risk_identified === true
      case 'unqualified':     return (e: EnterpriseWithDimensions) => e.dimensions?.risk_identified === false
      case 'has_todo':        return (e: EnterpriseWithDimensions) => (e.dimensions?.hazard_self || 0) > 0 || (e.dimensions?.hazard_monitor || 0) > 0 || (e.dimensions?.hazard_major || 0) > 0
      case 'no_todo':         return (e: EnterpriseWithDimensions) => !((e.dimensions?.hazard_self || 0) > 0 || (e.dimensions?.hazard_monitor || 0) > 0 || (e.dimensions?.hazard_major || 0) > 0)
      case 'rectifying':      return (e: EnterpriseWithDimensions) => e.dimensions?.rectify_status === 'rectifying'
      case 'expert_verify':   return (e: EnterpriseWithDimensions) => e.dimensions?.rectify_status === 'expert_verify'
      case 'rectifying_ok':   return (e: EnterpriseWithDimensions) => e.dimensions?.rectify_status === 'completed'
      case 'rectifying_overdue': return (e: EnterpriseWithDimensions) => e.dimensions?.rectify_status === 'overdue'
      case 'todo_unread':     return (e: EnterpriseWithDimensions) => (e.dimensions?.hazard_self || 0) > 0
      default:                return (_e: EnterpriseWithDimensions) => true
    }
  }

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDatabase()
        const [entList, expertList] = await Promise.all([
          getEnterprises(),
          getExperts(),
        ])
        
        // 加载每个企业的维度数据，并合并到企业对象中
        const dimsMap: Record<string, EnterpriseDimensions> = {}
        const enterprisesWithDims: EnterpriseWithDimensions[] = entList.map(ent => {
          const dims = {} as EnterpriseDimensions
          dimsMap[ent.id] = dims
          return { ...ent, dimensions: dims }
        })
        
        // 逐个加载维度数据（因为是 async 的）
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
        
        // 加载所有风险点和管控措施
        const points = await getRiskPoints()
        setRiskPoints(points)
        
        // 加载所有管控措施
        const controls = db.riskPointControls
        setRiskPointControls(controls)
      } catch (err) {
        console.error('Failed to load enterprises:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 专家选项
  const expertOptions = useMemo(() => {
    return ['all', ...experts.map(e => e.name)]
  }, [experts])

  // 风险等级映射
  const riskLevelMap: Record<string, string> = {
    major: '重大',
    high: '较大',
    medium: '一般',
    low: '低',
  }

  // 过滤后的企业
  const { sortedData: filteredEnterprises, sort, handleSort } = useSortableTable<EnterpriseWithDimensions>(
    useMemo(() => {
      let result = enterprises
      // 专家筛选
      if (selectedExpert !== 'all') {
        const expert = experts.find(e => e.name === selectedExpert)
        if (expert) {
          result = result.filter(e => e.expert_id === expert.id)
        }
      }
      // 工作组筛选
      if (selectedTeam !== 'all') {
        result = result.filter(e => e.work_group === selectedTeam)
      }
      // 风险等级筛选
      if (selectedRisk !== 'all') {
        const mappedLevel = riskLevelMap[selectedRisk]
        if (mappedLevel) {
          result = result.filter(e => e.risk_level === mappedLevel)
        }
      }
      // 路径节点筛选
      if (selectedNode) {
        const filterFn = nodeIdToFilter(selectedNode.id)
        result = result.filter(filterFn)
      }
      // 关键词筛选
      if (entKeyword.trim()) {
        const kw = entKeyword.trim().toLowerCase()
        result = result.filter(e =>
          e.name.toLowerCase().includes(kw) ||
          e.work_group.toLowerCase().includes(kw) ||
          e.industry.toLowerCase().includes(kw)
        )
      }
      return result
    }, [enterprises, selectedExpert, selectedTeam, selectedRisk, entKeyword, experts, selectedNode]),
    'name',
    'asc'
  )

  // 分页
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredEnterprises.length / PAGE_SIZE))
  const pagedEnterprises = filteredEnterprises.slice((Math.min(currentPage, totalPages) - 1) * PAGE_SIZE, Math.min(currentPage, totalPages) * PAGE_SIZE)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
        加载中...
      </div>
    )
  }

  return (
    <div>
      {/* 企业状态路径图 */}
      <EnterpriseStatePath
        expertId={selectedExpert === 'all' ? undefined : selectedExpert}
        riskLevel={selectedRisk === 'all' ? undefined : selectedRisk}
        onNodeSelect={node => setSelectedNode(node)}
        hidePopup
      />

      {/* 选中节点提示 */}
      {selectedNode && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#EEF2FF', borderRadius: 6, fontSize: 12, color: '#4F46E5' }}>
          已选中：{selectedNode.label}（{selectedNode.count} 家）
          <button
            onClick={() => setSelectedNode(null)}
            style={{ marginLeft: 8, padding: '2px 8px', border: '1px solid #C7D2FE', borderRadius: 4, background: 'white', color: '#4F46E5', cursor: 'pointer', fontSize: 11 }}
          >
            取消选择
          </button>
        </div>
      )}

      {/* 专家 + 风险等级筛选 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* 专家筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>按专家筛选</div>
          <select
            value={selectedExpert}
            onChange={e => { setSelectedExpert(e.target.value); setCurrentPage(1) }}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none', minWidth: 140 }}
          >
            {expertOptions.map(name => (
              <option key={name} value={name}>{name === 'all' ? '全部专家' : name}</option>
            ))}
          </select>
        </div>

        {/* 工作组筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>按工作组筛选</div>
          <select
            value={selectedTeam}
            onChange={e => { setSelectedTeam(e.target.value); setCurrentPage(1) }}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none', minWidth: 140 }}
          >
            <option value="all">全部工作组</option>
            {Array.from(new Set(enterprises.map(e => e.work_group))).sort().map(wg => (
              <option key={wg} value={wg}>{wg}</option>
            ))}
          </select>
        </div>

        {/* 风险等级筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>按风险等级筛选</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([
              { key: 'all', label: '全部' },
              { key: 'major', label: '重大风险' },
              { key: 'high', label: '较大风险' },
              { key: 'medium', label: '一般风险' },
              { key: 'low', label: '低风险' },
            ] as const).map(opt => {
              const active = selectedRisk === opt.key
              const colors: Record<string, { border: string; bg: string; text: string }> = {
                all: { border: '#4F46E5', bg: '#EEF2FF', text: '#3730A3' },
                major: { border: '#DC2626', bg: '#FEE2E2', text: '#991B1B' },
                high: { border: '#D97706', bg: '#FEF3C7', text: '#92400E' },
                medium: { border: '#D97706', bg: '#FEF3C7', text: '#92400E' },
                low: { border: '#059669', bg: '#D1FAE5', text: '#065F46' },
              }
              const cfg = colors[opt.key]
              return (
                <button
                  key={opt.key}
                  onClick={() => { setSelectedRisk(opt.key); setCurrentPage(1) }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${active ? cfg.border : '#D1D5DB'}`,
                    background: active ? cfg.bg : 'white',
                    color: active ? cfg.text : '#6B7280',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 企业列表 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            企业列表
            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
              共 {filteredEnterprises.length} 家
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="搜索企业名称 / 工作组 / 行业"
              value={entKeyword}
              onChange={e => { setEntKeyword(e.target.value); setCurrentPage(1) }}
              style={inputStyle}
            />
            <button
              onClick={() => {
                const exportData = filteredEnterprises.map(e => {
                  const dims = dimensionsMap[e.id]
                  const expert = experts.find(exp => exp.id === e.expert_id)
                  return {
                    企业名称: e.name,
                    风险等级: e.risk_level,
                    专家: expert?.name || '-',
                    行业: e.industry,
                    工作组: e.work_group,
                    信息采集: dims?.info_collected ? '是' : '否',
                    数据授权: dims?.data_authorized ? '是' : '否',
                    风险点: riskPoints.filter(rp => rp.enterprise_id === e.id).length,
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
                    已整改数总数: (() => {
                      const total = (dims?.hazard_self ?? 0) + (dims?.hazard_monitor ?? 0) + (dims?.hazard_major ?? 0)
                      const rectified = dims?.rectify_status === 'completed' ? total : Math.floor(total * 0.7)
                      return `${rectified}/${total}`
                    })(),
                  }
                })
                exportToCSV(exportData, [
                  { key: '企业名称', label: '企业名称' },
                  { key: '风险等级', label: '风险等级' },
                  { key: '专家', label: '专家' },
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
                ], '企业列表')
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
            {(selectedExpert !== 'all' || selectedTeam !== 'all' || selectedRisk !== 'all' || entKeyword) && (
              <button
                onClick={() => { setSelectedExpert('all'); setSelectedTeam('all'); setSelectedRisk('all'); setEntKeyword(''); setCurrentPage(1) }}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1400 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, minWidth: 180 }}>企业名称</th>
                <th style={thStyle}>风险等级</th>
                <th style={thStyle}>专家</th>
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
              {pagedEnterprises.length === 0 ? (
                <tr><td colSpan={19} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>暂无数据</td></tr>
              ) : pagedEnterprises.map((e, i) => {
                const dims = dimensionsMap[e.id]
                const riskColors: Record<string, string> = {
                  '重大': '#DC2626',
                  '较大': '#D97706',
                  '一般': '#D97706',
                  '低': '#059669',
                }
                const rateColor = (rate: number | undefined) => {
                  if (rate === undefined) return '#9CA3AF'
                  if (rate >= 80) return '#059669'
                  if (rate >= 60) return '#D97706'
                  return '#DC2626'
                }
                const expert = experts.find(exp => exp.id === e.expert_id)
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={{ ...tdStyle, color: '#9CA3AF' }}>{(Math.min(currentPage, totalPages) - 1) * PAGE_SIZE + i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937', minWidth: 180 }}>{e.name}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: riskColors[e.risk_level] || '#374151' }}>{e.risk_level}</td>
                    <td style={{ ...tdStyle, color: '#4F46E5' }}>{expert?.name || '-'}</td>
                    <td style={{ ...tdStyle, color: dims?.info_collected ? '#059669' : '#DC2626' }}>{dims?.info_collected ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: dims?.data_authorized ? '#059669' : '#D97706' }}>{dims?.data_authorized ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: riskPoints.filter(rp => rp.enterprise_id === e.id).length > 0 ? '#059669' : '#9CA3AF', fontWeight: riskPoints.filter(rp => rp.enterprise_id === e.id).length > 0 ? 600 : 400 }}>{riskPoints.filter(rp => rp.enterprise_id === e.id).length}</td>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
          <span>共 <span style={{ fontWeight: 600, color: '#1F2937' }}>{filteredEnterprises.length}</span> 家企业，第 {(Math.min(currentPage, totalPages) - 1) * PAGE_SIZE + 1}–{Math.min(Math.min(currentPage, totalPages) * PAGE_SIZE, filteredEnterprises.length)} 条</span>
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

      {/* 风险点列表 */}
      <div style={{ marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
        {/* 风险点比例条（可点击筛选） */}
        {(() => {
          const counts = { '重大': 0, '较大': 0, '一般': 0, '低': 0 }
          riskPoints.forEach(rp => { if (counts[rp.level] !== undefined) counts[rp.level]++ })
          const total = riskPoints.length || 1
          return (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
                风险分级管控
                <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
                  共 {total} 个风险点
                </span>
                {selectedEnterpriseId && (
                  <span style={{ fontWeight: 400, color: '#4F46E5', fontSize: 12, marginLeft: 8 }}>
                    （已筛选：{enterprises.find(e => e.id === selectedEnterpriseId)?.name}）
                    <button 
                      onClick={() => setSelectedEnterpriseId(null)}
                      style={{ marginLeft: 8, padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', fontSize: 11, cursor: 'pointer', color: '#6B7280' }}
                    >
                      清除
                    </button>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', background: '#E5E7EB' }}>
                {(['重大', '较大', '一般', '低'] as const).map(level => {
                  const percent = Math.round((counts[level] / total) * 100)
                  return percent > 0 ? (
                    <div 
                      key={level} 
                      style={{ 
                        width: `${percent}%`, 
                        background: RISK_COLORS[level], 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        minWidth: 4,
                      }} 
                      title={`点击筛选${level}风险点`}
                      onClick={() => setRiskLevelFilter(riskLevelFilter === level ? 'all' : level)}
                    >
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {percent >= 8 ? `${level} ${percent}%` : ''}
                      </span>
                    </div>
                  ) : null
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11 }}>
                {(['重大', '较大', '一般', '低'] as const).map(level => (
                  <span 
                    key={level} 
                    onClick={() => setRiskLevelFilter(riskLevelFilter === level ? 'all' : level)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      cursor: 'pointer',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: riskLevelFilter === level ? RISK_COLORS[level] + '30' : RISK_COLORS[level] + '15',
                      border: riskLevelFilter === level ? `1px solid ${RISK_COLORS[level]}` : '1px solid transparent',
                      color: riskLevelFilter === level ? RISK_COLORS[level] : '#6B7280',
                      fontWeight: riskLevelFilter === level ? 600 : 400,
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: RISK_COLORS[level] }} />
                    {level}: {counts[level]}个
                    {riskLevelFilter === level && <span style={{ marginLeft: 2 }}>✕</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* 风险点表格 */}
        <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['风险点名称', '企业', '类型', '风险等级', '检查计划', '最近检查', '频次', '管控措施', '管控状态'].map(h => (
                    <th key={h} style={{ ...thStyle, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let filteredPoints = selectedEnterpriseId 
                    ? riskPoints.filter(rp => rp.enterprise_id === selectedEnterpriseId)
                    : riskPoints
                  // 风险等级筛选
                  if (riskLevelFilter !== 'all') {
                    filteredPoints = filteredPoints.filter(rp => rp.level === riskLevelFilter)
                  }
                  const totalPages = Math.ceil(filteredPoints.length / RISK_POINT_PAGE_SIZE) || 1
                  const pagedPoints = filteredPoints.slice((riskPointPage - 1) * RISK_POINT_PAGE_SIZE, riskPointPage * RISK_POINT_PAGE_SIZE)
                  return pagedPoints.length === 0 ? (
                    <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: 20 }}>暂无数据</td></tr>
                  ) : pagedPoints.map((rp, i) => {
                    const ent = enterprises.find(e => e.id === rp.enterprise_id)
                    const planLabels: Record<string, string> = { weekly: '按周', monthly: '按月', quarterly: '按季' }
                    // 获取该风险点的管控措施
                    const controls = (riskPointControls || []).filter(rc => rc.risk_point_id === rp.id)
                    const firstMeasure = controls.length > 0 ? controls[0].measure : '-'
                    return (
                      <tr key={rp.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{rp.name}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', color: '#4F46E5', cursor: 'pointer' }}
                          onClick={() => setSelectedEnterpriseId(rp.enterprise_id)}>
                          {ent?.name || '-'}
                        </td>
                        <td style={tdStyle}>{rp.type}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          <span style={{ padding: '2px 6px', borderRadius: 3, background: RISK_COLORS[rp.level] + '20', color: RISK_COLORS[rp.level] }}>
                            {rp.level}
                          </span>
                        </td>
                        <td style={tdStyle}>{planLabels[rp.plan_type] || rp.plan_type}</td>
                        <td style={tdStyle}>{rp.last_check_at || '-'}</td>
                        <td style={tdStyle}>{rp.check_frequency}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', color: '#6B7280', maxWidth: 150 }}>
                          <span title={firstMeasure} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {firstMeasure}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 3,
                            fontSize: 10,
                            background: rp.status === '管控中' ? '#FEF3C7' : rp.status === '已消除' ? '#D1FAE5' : '#F3F4F6',
                            color: rp.status === '管控中' ? '#92400E' : rp.status === '已消除' ? '#065F46' : '#6B7280',
                          }}>
                            {rp.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
          {/* 分页 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '1px solid #E5E7EB', fontSize: 11, color: '#6B7280' }}>
            {(() => {
              let filteredPoints = selectedEnterpriseId 
                ? riskPoints.filter(rp => rp.enterprise_id === selectedEnterpriseId)
                : riskPoints
              if (riskLevelFilter !== 'all') {
                filteredPoints = filteredPoints.filter(rp => rp.level === riskLevelFilter)
              }
              const totalPages = Math.ceil(filteredPoints.length / RISK_POINT_PAGE_SIZE) || 1
              return (
                <>
                  <span>共 {filteredPoints.length} 条，第 {(riskPointPage - 1) * RISK_POINT_PAGE_SIZE + 1}–{Math.min(riskPointPage * RISK_POINT_PAGE_SIZE, filteredPoints.length)} 条</span>
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setRiskPointPage(p => Math.max(1, p - 1))} disabled={riskPointPage === 1}
                        style={{ padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: riskPointPage === 1 ? 'not-allowed' : 'pointer', opacity: riskPointPage === 1 ? 0.5 : 1 }}>‹</button>
                      <span style={{ padding: '2px 8px' }}>{riskPointPage} / {totalPages}</span>
                      <button onClick={() => setRiskPointPage(p => Math.min(totalPages, p + 1))} disabled={riskPointPage === totalPages}
                        style={{ padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: riskPointPage === totalPages ? 'not-allowed' : 'pointer', opacity: riskPointPage === totalPages ? 0.5 : 1 }}>›</button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
