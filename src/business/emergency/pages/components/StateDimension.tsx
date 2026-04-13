import { useState, useMemo, useEffect } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'
import { EnterpriseStatePath } from '../../../../components/shared/EnterpriseStatePath'
import type { StateDimensionProps } from './types'
import { initDatabase, getEnterprises, getExperts, getEnterpriseDimensions } from '../../../../db'
import type { Enterprise, EnterpriseDimensions, Expert } from '../../../../db/types'

// 合并企业数据
interface EnterpriseWithDimensions extends Enterprise {
  dimensions?: EnterpriseDimensions
}

export function StateDimension({ dateRange, riskLevel, timeRange, navigateParams }: StateDimensionProps) {
  const [enterprises, setEnterprises] = useState<EnterpriseWithDimensions[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [dimensionsMap, setDimensionsMap] = useState<Record<string, EnterpriseDimensions>>({})
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
  const nodeIdToFilter = (nodeId: string) => {
    switch (nodeId) {
      case 'all':             return (_e: EnterpriseWithDimensions) => true
      case 'opened':          return (e: EnterpriseWithDimensions) => e.dimensions?.data_opened === true
      case 'collected':       return (e: EnterpriseWithDimensions) => e.dimensions?.data_collected === true
      case 'authorized':      return (e: EnterpriseWithDimensions) => e.dimensions?.data_authorized === true
      case 'risk_match':      return (e: EnterpriseWithDimensions) => e.dimensions?.risk_point_identified === true
      case 'qualified':       return (e: EnterpriseWithDimensions) => e.dimensions?.risk_point_identified === true
      case 'unqualified':     return (e: EnterpriseWithDimensions) => e.dimensions?.risk_point_identified === false
      case 'has_todo':        return (e: EnterpriseWithDimensions) => (e.dimensions?.hazard_self_check || 0) > 0 || (e.dimensions?.hazard_platform || 0) > 0 || (e.dimensions?.hazard_major || 0) > 0
      case 'no_todo':         return (e: EnterpriseWithDimensions) => !((e.dimensions?.hazard_self_check || 0) > 0 || (e.dimensions?.hazard_platform || 0) > 0 || (e.dimensions?.hazard_major || 0) > 0)
      case 'rectifying':      return (e: EnterpriseWithDimensions) => e.dimensions?.hazard_rectify_status === 'rectifying'
      case 'expert_verify':   return (e: EnterpriseWithDimensions) => e.dimensions?.hazard_rectify_status === 'expert_verify'
      case 'rectifying_ok':   return (e: EnterpriseWithDimensions) => e.dimensions?.hazard_rectify_status === 'completed'
      case 'rectifying_overdue': return (e: EnterpriseWithDimensions) => e.dimensions?.hazard_rectify_status === 'overdue'
      case 'todo_unread':     return (e: EnterpriseWithDimensions) => (e.dimensions?.hazard_self_check || 0) > 0
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
        
        // 加载每个企业的维度数据
        const dimsMap: Record<string, EnterpriseDimensions> = {}
        for (const ent of entList) {
          const dims = await getEnterpriseDimensions(ent.id)
          if (dims) {
            dimsMap[ent.id] = dims
          }
        }
        
        setEnterprises(entList)
        setExperts(expertList)
        setDimensionsMap(dimsMap)
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
  const { sortedData: filteredEnterprises, sort, handleSort } = useSortableTable<Enterprise>(
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
                <th style={thStyle}>机构<br/>职责%</th>
                <th style={thStyle}>安全<br/>制度%</th>
                <th style={thStyle}>安全<br/>投入%</th>
                <th style={thStyle}>检查<br/>计划</th>
                <th style={thStyle}>三方<br/>同步</th>
                <th style={thStyle}>安全<br/>巡查</th>
                <th style={thStyle}>教育<br/>培训</th>
                <th style={thStyle}>作业票</th>
                <th style={thStyle}>自查<br/>隐患</th>
                <th style={thStyle}>监管<br/>隐患</th>
                <th style={thStyle}>重大<br/>隐患</th>
                <th style={thStyle}>整改状态</th>
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
                    <td style={{ ...tdStyle, color: dims?.risk_identified ? '#059669' : '#D97706' }}>{dims?.risk_identified ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: rateColor(dims?.duty_rate), fontWeight: 600 }}>{dims?.duty_rate ?? '-'}%</td>
                    <td style={{ ...tdStyle, color: rateColor(dims?.system_rate), fontWeight: 600 }}>{dims?.system_rate ?? '-'}%</td>
                    <td style={{ ...tdStyle, color: rateColor(dims?.invest_rate), fontWeight: 600 }}>{dims?.invest_rate ?? '-'}%</td>
                    <td style={{ ...tdStyle, color: '#374151' }}>
                      {dims?.plan_type ? { weekly: '按周', monthly: '按月', quarterly: '按季' }[dims.plan_type] || dims.plan_type : '-'}
                    </td>
                    <td style={{ ...tdStyle, color: dims?.third_party_sync ? '#059669' : '#9CA3AF' }}>{dims?.third_party_sync ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: dims?.patrol_used ? '#059669' : '#9CA3AF' }}>{dims?.patrol_used ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: dims?.training_done ? '#059669' : '#9CA3AF' }}>{dims?.training_done ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: (dims?.work_permit ?? 0) > 0 ? '#D97706' : '#9CA3AF' }}>{(dims?.work_permit ?? 0) > 0 ? '✓' : '✗'}</td>
                    <td style={{ ...tdStyle, color: '#D97706' }}>{dims?.hazard_self ?? 0}</td>
                    <td style={{ ...tdStyle, color: '#D97706' }}>{dims?.hazard_monitor ?? 0}</td>
                    <td style={{ ...tdStyle, color: '#DC2626', fontWeight: 600 }}>{dims?.hazard_major ?? 0}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 500,
                        background: dims?.rectify_status === 'completed' ? '#D1FAE5' : '#FEE2E2',
                        color: dims?.rectify_status === 'completed' ? '#065F46' : '#991B1B',
                      }}>
                        {dims?.rectify_status === 'completed' ? '已整改' : '未整改'}
                      </span>
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
    </div>
  )
}
