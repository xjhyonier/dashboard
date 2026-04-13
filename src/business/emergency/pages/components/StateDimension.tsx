import { useState, useMemo } from 'react'
import { EnterpriseStatePath } from '../../../../components/shared/EnterpriseStatePath'
import { thStyle, tdStyle, inputStyle } from './styles'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'
import type { StateDimensionProps } from './types'
import type { Enterprise10D } from '../mock/station-chief-v2'
import { expertsFull, enterprises10D } from '../mock/station-chief-v2'

export function StateDimension({ dateRange, riskLevel, timeRange, navigateParams }: StateDimensionProps) {
  // 专家筛选（支持 URL 参数）
  const [selectedExpert, setSelectedExpert] = useState<string>(navigateParams?.expertName || 'all')

  // 工作组筛选（支持 URL 参数）
  const [selectedTeam, setSelectedTeam] = useState<string>(navigateParams?.teamName || 'all')

  // 风险等级筛选
  const [selectedRisk, setSelectedRisk] = useState<string>('all')

  // 路径节点选中状态
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; count: string } | null>(null)

  const expertOptions = useMemo(() => {
    const names = new Set(expertsFull.map(e => e.expertName))
    return ['all', ...Array.from(names)]
  }, [])

  // 路径节点 -> Enterprise10D 字段的映射
  const nodeIdToFilter = (nodeId: string) => {
    switch (nodeId) {
      case 'opened':             return (e: Enterprise10D) => e.info_collection === true
      case 'collected':          return (e: Enterprise10D) => e.data_authorized === true
      case 'authorized':        return (e: Enterprise10D) => e.data_authorized === true
      case 'risk_match':         return (e: Enterprise10D) => e.risk_point_identified === true
      case 'qualified':          return (e: Enterprise10D) => e.risk_point_identified === true
      case 'rectifying':         return (e: Enterprise10D) => e.hazard_rectify_status === 'rectifying'
      case 'expert_verify':      return (e: Enterprise10D) => e.hazard_rectify_status === 'expert_verify'
      case 'rectifying_ok':      return (e: Enterprise10D) => e.hazard_rectify_status === 'completed'
      case 'rectifying_overdue': return (e: Enterprise10D) => e.hazard_rectify_status === 'overdue'
      case 'has_todo':           return (e: Enterprise10D) => (e.hazard_self_check || 0) > 0 || (e.hazard_platform || 0) > 0 || (e.hazard_major || 0) > 0
      default:                    return (_e: Enterprise10D) => true
    }
  }

  // 企业列表关键词筛选
  const [entKeyword, setEntKeyword] = useState('')

  // ── 企业列表（Enterprise10D）──────────────────────
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)

  // 风险等级映射：筛选值 → 数据值
  const riskLevelMap: Record<string, string> = {
    major: '重大风险',
    high: '较大风险',
    medium: '一般风险',
    low: '低风险',
  }

  const { sortedData: filtered10D, sort, handleSort } = useSortableTable<Enterprise10D>(
    useMemo(() => {
      let result = enterprises10D
      // 专家筛选
      if (selectedExpert !== 'all') {
        result = result.filter(e => e.expert_id === selectedExpert)
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
          e.work_group.toLowerCase().includes(kw)
        )
      }
      return result
    }, [selectedNode, entKeyword, selectedExpert, selectedRisk]),
    'risk_level', 'asc'
  )

  const totalPages = Math.max(1, Math.ceil(filtered10D.length / PAGE_SIZE))
  const paged10D = filtered10D.slice((Math.min(currentPage, totalPages) - 1) * PAGE_SIZE, Math.min(currentPage, totalPages) * PAGE_SIZE)

  return (
    <div>
      {/* 专家 + 风险等级筛选 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* 专家筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>按专家筛选</div>
          <select
            value={selectedExpert}
            onChange={e => setSelectedExpert(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none', minWidth: 140 }}
          >
            {expertOptions.map(name => (
              <option key={name} value={name}>{name === 'all' ? '全部专家' : name}</option>
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
                  onClick={() => setSelectedRisk(opt.key)}
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

      {/* 企业状态路径图 */}
      <div style={{
        padding: '16px',
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: 4,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 12 }}>
          企业状态路径图
          {selectedNode && (
            <span style={{ fontWeight: 400, color: '#7C3AED', fontSize: 12, marginLeft: 12 }}>
              — 已选中：{selectedNode.label}（{selectedNode.count} 家）
            </span>
          )}
        </div>
        <EnterpriseStatePath
          expertId={selectedExpert !== 'all' ? selectedExpert : undefined}
          riskLevel={selectedRisk !== 'all' ? selectedRisk : undefined}
          height={520}
          onNodeSelect={node => setSelectedNode(node)}
          hidePopup
        />
      </div>

      {/* 企业列表（始终显示，点击路径节点筛选） */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            企业列表
            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
              共 {filtered10D.length} 家
              {selectedNode && (
                <span style={{ color: '#7C3AED' }}> · 已按「{selectedNode.label}」筛选</span>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="搜索企业名称 / 工作组"
              value={entKeyword}
              onChange={e => setEntKeyword(e.target.value)}
              style={inputStyle}
            />
            {selectedNode && (
              <button
                onClick={() => { setSelectedNode(null); setEntKeyword('') }}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <SortableTh label="企业名称" sortKey="name" sort={sort} onSort={handleSort} />
                <SortableTh label="信息采集" sortKey="info_collection" sort={sort} onSort={handleSort} />
                <SortableTh label="数据授权" sortKey="data_authorized" sort={sort} onSort={handleSort} />
                <SortableTh label="风险点" sortKey="risk_point_identified" sort={sort} onSort={handleSort} />
                <th style={thStyle}>机构<br/>职责%</th>
                <th style={thStyle}>安全<br/>制度%</th>
                <th style={thStyle}>安全<br/>投入%</th>
                <th style={thStyle}>检查<br/>计划</th>
                <th style={thStyle}>检查<br/>执行</th>
                <th style={thStyle}>三方<br/>同步</th>
                <th style={thStyle}>安全<br/>巡查</th>
                <th style={thStyle}>教育<br/>培训</th>
                <SortableTh label="作业票" sortKey="work_permit_count" sort={sort} onSort={handleSort} />
                <SortableTh label="自查隐患" sortKey="hazard_self_check" sort={sort} onSort={handleSort} />
                <SortableTh label="监管隐患" sortKey="hazard_platform" sort={sort} onSort={handleSort} />
                <SortableTh label="重大隐患" sortKey="hazard_major" sort={sort} onSort={handleSort} />
                <th style={thStyle}>整改状态</th>
                <SortableTh label="风险等级" sortKey="risk_level" sort={sort} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {paged10D.length === 0 ? (
                <tr><td colSpan={19} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>暂无数据</td></tr>
              ) : paged10D.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, color: '#9CA3AF' }}>{(Math.min(currentPage, totalPages) - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937', minWidth: 160 }}>{e.name}</td>
                  <td style={{ ...tdStyle, color: e.info_collection ? '#059669' : '#DC2626' }}>{e.info_collection ? '是' : '否'}</td>
                  <td style={{ ...tdStyle, color: e.data_authorized ? '#059669' : '#D97706' }}>{e.data_authorized ? '是' : '否'}</td>
                  <td style={{ ...tdStyle, color: e.risk_point_identified ? '#059669' : '#D97706' }}>{e.risk_point_identified ? '是' : '否'}</td>
                  <td style={{ ...tdStyle, color: (e.safety_org_duty_rate || 0) >= 80 ? '#059669' : (e.safety_org_duty_rate || 0) >= 60 ? '#D97706' : '#DC2626', fontSize: 11 }}>{e.safety_org_duty_rate ?? 0}%</td>
                  <td style={{ ...tdStyle, color: (e.safety_system_rate || 0) >= 80 ? '#059669' : (e.safety_system_rate || 0) >= 60 ? '#D97706' : '#DC2626', fontSize: 11 }}>{e.safety_system_rate ?? 0}%</td>
                  <td style={{ ...tdStyle, color: (e.safety_invest_rate || 0) >= 80 ? '#059669' : (e.safety_invest_rate || 0) >= 60 ? '#D97706' : '#DC2626', fontSize: 11 }}>{e.safety_invest_rate ?? 0}%</td>
                  <td style={{ ...tdStyle, color: '#374151' }}>{e.inspection_plan_type ? { weekly: '按周', monthly: '按月', quarterly: '按季' }[e.inspection_plan_type] : '否'}</td>
                  <td style={{ ...tdStyle, color: e.inspection_execution === 'yes' ? '#059669' : e.inspection_execution === 'forced' ? '#D97706' : '#9CA3AF' }}>{e.inspection_execution === 'yes' ? '是' : e.inspection_execution === 'forced' ? '强制' : '否'}</td>
                  <td style={{ ...tdStyle, color: e.third_party_sync === 'yes' ? '#059669' : '#9CA3AF' }}>{e.third_party_sync === 'yes' ? '是' : '否'}</td>
                  <td style={{ ...tdStyle, color: e.patrol_used === 'yes' ? '#059669' : '#9CA3AF' }}>{e.patrol_used === 'yes' ? '是' : '否'}</td>
                  <td style={{ ...tdStyle, color: e.training_done ? '#059669' : '#9CA3AF' }}>{e.training_done ? (e.training_has_record ? '已开展✓' : '已开展') : '否'}</td>
                  <td style={{ ...tdStyle, color: (e.work_permit_count || 0) > 0 ? '#D97706' : '#374151' }}>{(e.work_permit_count || 0) > 0 ? '是' : '否'}</td>
                  <td style={{ ...tdStyle, color: (e.hazard_self_check || 0) > 0 ? '#D97706' : '#374151' }}>{e.hazard_self_check || 0}</td>
                  <td style={{ ...tdStyle, color: (e.hazard_platform || 0) > 0 ? '#D97706' : '#374151' }}>{e.hazard_platform || 0}</td>
                  <td style={{ ...tdStyle, color: (e.hazard_major || 0) > 0 ? '#DC2626' : '#374151', fontWeight: 600 }}>{e.hazard_major || 0}</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 500,
                      background: e.hazard_rectify_status === 'completed' ? '#D1FAE5' : '#FEE2E2',
                      color: e.hazard_rectify_status === 'completed' ? '#065F46' : '#991B1B',
                    }}>
                      {{ completed: '已整改', uncompleted: '未整改', partial: '部分整改', overdue: '逾期未改' }[e.hazard_rectify_status || 'uncompleted'] || '—'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: e.risk_level === '重大风险' ? '#DC2626' : e.risk_level === '较大风险' ? '#D97706' : '#374151' }}>{e.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
          <span>共 <span style={{ fontWeight: 600, color: '#1F2937' }}>{filtered10D.length}</span> 家企业，第 {(Math.min(currentPage, totalPages) - 1) * PAGE_SIZE + 1}–{Math.min(Math.min(currentPage, totalPages) * PAGE_SIZE, filtered10D.length)} 条</span>
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
