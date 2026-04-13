import { useState, useMemo } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  workGroups,
  governmentMembers,
  expertsFull,
  type ExpertFull,
} from './mock/station-chief-v2'

// ─────────────────────────────────────────────
// 表格样式（Quick BI 风格）
// ─────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#EEF3FF',
  border: '1px solid #E2E8F0',
  fontWeight: 500,
  fontSize: 12,
  color: '#4B5563',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #E2E8F0',
  fontSize: 12,
  color: '#374151',
  textAlign: 'center',
}

const inputStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
  fontSize: 12,
  color: '#374151',
  outline: 'none',
}

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
export function StationChiefV2Dashboard() {
  const [dimension, setDimension] = useState<'person' | 'monitor'>('person')

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="组织与人员" subtitle="维度二" />

      {/* 维度切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'person', label: '人的维度' },
          { key: 'monitor', label: '日常监控' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setDimension(tab.key as typeof dimension)}
            style={{
              padding: '5px 14px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: dimension === tab.key ? '#4F46E5' : '#D1D5DB',
              background: dimension === tab.key ? '#EEF2FF' : 'white',
              color: dimension === tab.key ? '#4F46E5' : '#6B7280',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {dimension === 'person' && <PersonDimension />}
      {dimension === 'monitor' && (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          日常监控维度 — 建设中
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 人的维度
// ─────────────────────────────────────────────
function PersonDimension() {
  const [teamKeyword, setTeamKeyword] = useState('')
  const [memberKeyword, setMemberKeyword] = useState('')
  const [expertKeyword, setExpertKeyword] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  // 获取选中人员负责的工作组 IDs
  const selectedMemberTeamIds = selectedMemberId
    ? governmentMembers.find(m => m.id === selectedMemberId)?.teamIds || []
    : []

  // 过滤工作组：按关键词 + 按选中人员负责的组
  const filteredTeams = useMemo(() => {
    let result = workGroups
    // 按选中人员负责的组过滤
    if (selectedMemberId && selectedMemberTeamIds.length > 0) {
      result = result.filter(g => selectedMemberTeamIds.includes(g.id))
    }
    // 按关键词过滤
    if (teamKeyword.trim()) {
      const kw = teamKeyword.trim().toLowerCase()
      result = result.filter(g => g.name.toLowerCase().includes(kw))
    }
    return result
  }, [teamKeyword, selectedMemberId, selectedMemberTeamIds])

  // 过滤人员：按选中的工作组或人员负责的组过滤 + 关键词过滤
  const filteredMembers = useMemo(() => {
    let result = governmentMembers
    // 按选中的工作组或人员负责的组过滤
    const filterTeamIds = selectedTeamId
      ? [selectedTeamId]
      : (selectedMemberTeamIds.length > 0 ? selectedMemberTeamIds : [])
    if (filterTeamIds.length > 0) {
      result = result.filter(m => m.teamIds.some(tid => filterTeamIds.includes(tid)))
    }
    // 按关键词过滤
    if (memberKeyword.trim()) {
      const kw = memberKeyword.trim().toLowerCase()
      result = result.filter(m =>
        m.memberName.toLowerCase().includes(kw) ||
        m.position.toLowerCase().includes(kw)
      )
    }
    return result
  }, [selectedTeamId, selectedMemberId, selectedMemberTeamIds, memberKeyword])

  // 过滤专家：按选中工作组或选中人员负责的组
  const filteredExperts = useMemo(() => {
    let result = expertsFull
    // 按选中的工作组或人员负责的组过滤
    const filterTeamIds = selectedTeamId
      ? [selectedTeamId]
      : (selectedMemberTeamIds.length > 0 ? selectedMemberTeamIds : [])
    if (filterTeamIds.length > 0) {
      result = result.filter(e => e.teamIds.some(tid => filterTeamIds.includes(tid)))
    }
    // 按关键词过滤
    if (expertKeyword.trim()) {
      const kw = expertKeyword.trim().toLowerCase()
      result = result.filter(e =>
        e.expertName.toLowerCase().includes(kw) ||
        e.teamName.toLowerCase().includes(kw)
      )
    }
    return result
  }, [selectedTeamId, selectedMemberTeamIds, expertKeyword])

  // 获取选中工作组的名称
  const selectedTeamName = selectedTeamId
    ? workGroups.find(g => g.id === selectedTeamId)?.name
    : null

  // 获取选中人员的名称
  const selectedMemberName = selectedMemberId
    ? governmentMembers.find(m => m.id === selectedMemberId)?.memberName
    : null

  // 汇总数据（根据选中的人员或工作组动态计算）
  const total = selectedMemberId
    ? (() => {
        const member = governmentMembers.find(m => m.id === selectedMemberId)!
        const memberTeams = workGroups.filter(g => member.teamIds.includes(g.id))
        return {
          enterprise: memberTeams.reduce((s, g) => s + g.enterpriseCount, 0),
          hazard: memberTeams.reduce((s, g) => s + g.hazardFound, 0),
          serious: memberTeams.reduce((s, g) => s + g.hazardSerious, 0),
          closed: memberTeams.reduce((s, g) => s + g.hazardClosed, 0),
          overdue: memberTeams.reduce((s, g) => s + g.overdueUnrectified, 0),
          inProgress: memberTeams.reduce((s, g) => s + g.inProgress, 0),
        }
      })()
    : selectedTeamId
    ? (() => {
        const g = workGroups.find(g => g.id === selectedTeamId)!
        return {
          enterprise: g.enterpriseCount,
          hazard: g.hazardFound,
          serious: g.hazardSerious,
          closed: g.hazardClosed,
          overdue: g.overdueUnrectified,
          inProgress: g.inProgress,
        }
      })()
    : {
        enterprise: workGroups.reduce((s, g) => s + g.enterpriseCount, 0),
        hazard: workGroups.reduce((s, g) => s + g.hazardFound, 0),
        serious: workGroups.reduce((s, g) => s + g.hazardSerious, 0),
        closed: workGroups.reduce((s, g) => s + g.hazardClosed, 0),
        overdue: workGroups.reduce((s, g) => s + g.overdueUnrectified, 0),
        inProgress: workGroups.reduce((s, g) => s + g.inProgress, 0),
      }

  const memberTotal = filteredMembers.reduce((s, m) => ({
    enterprise: s.enterprise + m.enterpriseCount,
    hazard: s.hazard + m.hazardFound,
    serious: s.serious + m.hazardSerious,
    closed: s.closed + m.hazardClosed,
    inProgress: s.inProgress + m.inProgress,
    overdue: s.overdue + m.overdueUnrectified,
    inspectionCount: s.inspectionCount + m.inspectionCount,
  }), { enterprise: 0, hazard: 0, serious: 0, closed: 0, inProgress: 0, overdue: 0, inspectionCount: 0 })

  return (
    <div>
      {/* 选中提示条 */}
      {(selectedTeamId || selectedMemberId) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          padding: '8px 12px',
          background: '#EEF3FF',
          border: '1px solid #C7D2FE',
          borderRadius: 4,
          fontSize: 12,
        }}>
          <span style={{ color: '#4F46E5', fontWeight: 500 }}>当前筛选：</span>
          {selectedMemberId && (
            <>
              <span style={{ color: '#1F2937', fontWeight: 600 }}>{selectedMemberName}</span>
              <span style={{ color: '#6B7280' }}>(负责 {selectedMemberTeamIds.length} 个工作组)</span>
            </>
          )}
          {selectedTeamId && !selectedMemberId && (
            <>
              <span style={{ color: '#1F2937', fontWeight: 600 }}>{selectedTeamName}</span>
            </>
          )}
          <span style={{ color: '#6B7280' }}>，数据已联动筛选</span>
          <button
            onClick={() => { setSelectedTeamId(null); setSelectedMemberId(null) }}
            style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              border: '1px solid #D1D5DB',
              borderRadius: 3,
              background: 'white',
              color: '#6B7280',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 汇总 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 12,
        marginBottom: 20,
        padding: '16px',
        background: '#FAFAFA',
        border: '1px solid #E5E7EB',
        borderRadius: 4,
      }}>
        {[
          { label: '工作组', value: workGroups.length, unit: '个' },
          { label: '检查企业', value: total.enterprise, unit: '家' },
          { label: '隐患总数', value: total.hazard, unit: '处' },
          { label: '重大隐患', value: total.serious, unit: '处' },
          { label: '已整改', value: total.closed, unit: '处' },
          { label: '逾期未整改', value: total.overdue, unit: '处' },
          { label: '整改中', value: total.inProgress, unit: '处' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
          </div>
        ))}
      </div>

      {/* （一）工作组履职情况表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>（一）工作组履职情况表</div>
          <input type="text" placeholder="搜索工作组名称" value={teamKeyword} onChange={e => setTeamKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['工作组名称', '组长', '副站长', '负责企业', '检查企业', '隐患总数', '重大隐患', '已整改', '整改完成率', '逾期未整改', '整改中', '重大风险(任务/时间)'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr><td colSpan={12} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的工作组</td></tr>
            ) : filteredTeams.map((g, i) => {
              const isSelected = selectedTeamId === g.id
              const major = g.majorRisk
              return (
                <tr key={g.id} style={{
                background: isSelected ? '#EEF3FF' : (i % 2 === 0 ? 'white' : '#FAFBFC'),
                cursor: 'pointer',
              }}>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'left',
                    fontWeight: 500,
                    color: isSelected ? '#4F46E5' : '#1F2937',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedTeamId(isSelected ? null : g.id)}
                  title="点击筛选该工作组"
                >
                  <span style={{ textDecoration: isSelected ? 'underline' : 'none' }}>{g.name}</span>
                </td>
                <td style={{ ...tdStyle, color: '#4F46E5' }}>{g.leader}</td>
                <td style={{ ...tdStyle, color: '#7C3AED' }}>{g.deputy}</td>
                <td style={{ ...tdStyle, fontWeight: 500 }}>{g.memberCount * 10}</td>
                <td style={tdStyle}>{g.enterpriseCount}</td>
                <td style={tdStyle}>{g.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{g.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{g.hazardClosed}</td>
                <td style={tdStyle}>{g.hazardClosureRate}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{g.overdueUnrectified}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{g.inProgress}</td>
                {/* 重大风险任务进度/时间进度 */}
                <td style={tdStyle}>
                  {major ? `${major.taskProgress}% | ${major.timeProgress}%` : '-'}
                </td>
              </tr>
              )
            })}
            {filteredTeams.length > 0 && filteredTeams.length < workGroups.length && (
              <tr><td colSpan={12} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filteredTeams.length} / {workGroups.length} 条</td></tr>
            )}
            {filteredTeams.length === workGroups.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>-</td>
                <td style={{ ...tdStyle, color: '#374151' }}>-</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{workGroups.reduce((s, g) => s + g.memberCount * 10, 0)}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.enterprise}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazard}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.serious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.closed}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{Math.round(total.closed / total.hazard * 100)}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.overdue}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.inProgress}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>-</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* （二）人员履职情况表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>（二）人员履职情况表</div>
          <input type="text" placeholder="搜索姓名" value={memberKeyword} onChange={e => setMemberKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['姓名', '职务', '配合工作组', '负责企业', '已检查企业', '发现隐患', '重大隐患', '已整改', '整改率', '整改中', '逾期未改'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的人员</td></tr>
            ) : filteredMembers.map((m, i) => {
              const isSelected = selectedMemberId === m.id
              const teamNames = m.teamIds.map(id => workGroups.find(g => g.id === id)?.name).filter(Boolean).join('、')
              return (
              <tr key={m.id} style={{
                background: isSelected ? '#EEF3FF' : (i % 2 === 0 ? 'white' : '#FAFBFC'),
                cursor: 'pointer',
              }}>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'left',
                    fontWeight: 500,
                    color: isSelected ? '#4F46E5' : '#1F2937',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedMemberId(isSelected ? null : m.id)}
                  title="点击筛选该人员负责的工作组"
                >
                  <span style={{ textDecoration: isSelected ? 'underline' : 'none' }}>{m.memberName}</span>
                </td>
                <td style={tdStyle}>{m.position}</td>
                <td style={{ ...tdStyle, textAlign: 'left' }}>{teamNames}</td>
                <td style={tdStyle}>{m.enterpriseCount}</td>
                <td style={tdStyle}>{m.inspectionCount}</td>
                <td style={tdStyle}>{m.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{m.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{m.hazardClosed}</td>
                <td style={tdStyle}>{m.hazardClosureRate}%</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{m.inProgress}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{m.overdueUnrectified}</td>
              </tr>
              )
            })}
            {filteredMembers.length > 0 && filteredMembers.length < governmentMembers.length && (
              <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filteredMembers.length} / {governmentMembers.length} 条</td></tr>
            )}
            {filteredMembers.length === governmentMembers.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td colSpan={3} style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{memberTotal.enterprise}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{memberTotal.inspectionCount}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{memberTotal.hazard}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{memberTotal.serious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{memberTotal.closed}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{Math.round(memberTotal.closed / memberTotal.hazard * 100)}%</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{memberTotal.inProgress}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{memberTotal.overdue}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* （三）专家履职情况表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>（三）专家履职情况表</div>
          <input type="text" placeholder="搜索姓名或工作组" value={expertKeyword} onChange={e => setExpertKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['姓名', '配合工作组', '负责', '检查', '发现隐患', '重大隐患', '已整改', '整改率', '整改中', '逾期', '风险标注', '视频待办', '隐患待办', '信息完善', 'IM咨询', '服务日志', '现场看', '视频看', 'AI看', '一企一档'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredExperts.length === 0 ? (
              <tr><td colSpan={20} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的专家</td></tr>
            ) : filteredExperts.map((e, i) => (
              <tr key={e.expertId} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{e.expertName}</td>
                <td style={{ ...tdStyle, textAlign: 'left' }}>{e.teamName}</td>
                <td style={tdStyle}>{e.platformBehavior.responsible}</td>
                <td style={tdStyle}>{e.platformBehavior.checkCount}</td>
                <td style={tdStyle}>{e.platformBehavior.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{e.platformBehavior.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{e.platformBehavior.hazardClosed}</td>
                <td style={tdStyle}>{e.platformBehavior.closureRate}%</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{e.platformBehavior.inProgress}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{e.platformBehavior.overdue}</td>
                <td style={tdStyle}>{e.platformBehavior.riskMark}</td>
                <td style={tdStyle}>{e.platformBehavior.videoTodo}</td>
                <td style={tdStyle}>{e.platformBehavior.hazardTodo}</td>
                <td style={tdStyle}>{e.platformBehavior.infoComplete}%</td>
                <td style={tdStyle}>{e.platformBehavior.imChat}</td>
                <td style={tdStyle}>{e.platformBehavior.serviceLog}</td>
                <td style={tdStyle}>{e.platformBehavior.onSiteVisit}</td>
                <td style={tdStyle}>{e.platformBehavior.videoWatch}</td>
                <td style={tdStyle}>{e.platformBehavior.aiWatch}</td>
                <td style={tdStyle}>{e.platformBehavior.enterpriseFile}</td>
              </tr>
            ))}
            {filteredExperts.length > 0 && filteredExperts.length < expertsFull.length && (
              <tr><td colSpan={20} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filteredExperts.length} / {expertsFull.length} 条</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* （四）专家7维度绩效得分明细 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>（四）专家7维度绩效得分明细</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['姓名', '企业基础覆盖度', '制度数字化完善度', '风险识别精准度', '检查计划科学度', '自查执行活跃度', '隐患闭环治理度', '远程监管效能度'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredExperts.map((e, i) => (
              <tr key={e.expertId} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{e.expertName}</td>
                {e.performanceDimensions.map(d => (
                  <td key={d.name} style={{ ...tdStyle, color: d.score >= 80 ? '#059669' : d.score >= 65 ? '#D97706' : '#DC2626' }}>{d.score}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

