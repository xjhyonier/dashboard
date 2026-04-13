import { useState, useMemo } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { DutyDimensionProps } from './types'
import {
  workGroups,
  governmentMembers,
  expertsFull,
  hazardRecords,
} from '../mock/station-chief-v2'

export function DutyDimension({ dateRange, selectedKpi, setSelectedKpi }: DutyDimensionProps) {
  const [teamKeyword, setTeamKeyword] = useState('')
  const [memberKeyword, setMemberKeyword] = useState('')
  const [expertKeyword, setExpertKeyword] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null)

  // 排序状态
  const [teamSortKey, setTeamSortKey] = useState<string | null>(null)
  const [teamSortDir, setTeamSortDir] = useState<'asc' | 'desc'>('asc')
  const [memberSortKey, setMemberSortKey] = useState<string | null>(null)
  const [memberSortDir, setMemberSortDir] = useState<'asc' | 'desc'>('asc')
  const [expertSortKey, setExpertSortKey] = useState<string | null>(null)
  const [expertSortDir, setExpertSortDir] = useState<'asc' | 'desc'>('asc')

  // 获取选中人员负责的工作组 IDs（按姓名查找，同一个人所有记录都要）
  const selectedMemberTeamIds = useMemo(() => {
    if (!selectedMemberName) return []
    const allRecords = governmentMembers.filter(m => m.memberName === selectedMemberName)
    const ids = new Set<string>()
    allRecords.forEach(m => m.teamIds.forEach(tid => ids.add(tid)))
    return Array.from(ids)
  }, [selectedMemberName])

  // 过滤工作组：按关键词 + 按选中人员负责的组 + KPI筛选 + 排序
  const filteredTeams = useMemo(() => {
    let result = workGroups
    // 按选中人员负责的组过滤
    if (selectedMemberName && selectedMemberTeamIds.length > 0) {
      result = result.filter(g => selectedMemberTeamIds.includes(g.id))
    }
    // 按关键词过滤
    if (teamKeyword.trim()) {
      const kw = teamKeyword.trim().toLowerCase()
      result = result.filter(g => g.name.toLowerCase().includes(kw))
    }
    // 按顶部 KPI 筛选
    if (selectedKpi) {
      result = result.filter(g => {
        switch (selectedKpi) {
          case 'serious':   return g.hazardSerious > 0
          case 'closed':   return g.hazardClosed > 0
          case 'inProgress': return g.inProgress > 0
          case 'extended':
          case 'overdue':  return g.overdueUnrectified > 0
          case 'deadline': return g.inProgress > 0 || g.overdueUnrectified > 0
          default:         return true
        }
      })
    }
    // 排序
    if (teamSortKey) {
      result = [...result].sort((a, b) => {
        const aVal = (a as any)[teamSortKey]
        const bVal = (b as any)[teamSortKey]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return teamSortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return teamSortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    }
    return result
  }, [teamKeyword, selectedMemberName, selectedMemberTeamIds, selectedKpi, teamSortKey, teamSortDir])

  // 过滤人员：按选中的工作组或人员负责的组过滤 + 关键词过滤 + KPI筛选 + 按姓名去重并合并 teamIds
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
    // 按顶部 KPI 筛选
    if (selectedKpi) {
      result = result.filter(m => {
        switch (selectedKpi) {
          case 'serious':   return m.hazardSerious > 0
          case 'closed':    return m.hazardClosed > 0
          case 'inProgress': return m.inProgress > 0
          case 'extended':
          case 'overdue':   return m.overdueUnrectified > 0
          case 'deadline':  return m.inProgress > 0 || m.overdueUnrectified > 0
          default:          return true
        }
      })
    }
    // 按姓名去重，合并同一个人的多个 teamIds
    const nameToMember = new Map<string, typeof result[0]>()
    result.forEach(m => {
      if (nameToMember.has(m.memberName)) {
        const existing = nameToMember.get(m.memberName)!
        const mergedTeamIds = [...new Set([...existing.teamIds, ...m.teamIds])]
        nameToMember.set(m.memberName, { ...existing, teamIds: mergedTeamIds })
      } else {
        nameToMember.set(m.memberName, m)
      }
    })
    // 排序逻辑
    return Array.from(nameToMember.values()).sort((a, b) => {
      if (memberSortKey) {
        const aVal = (a as any)[memberSortKey]
        const bVal = (b as any)[memberSortKey]
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return memberSortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return memberSortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      }
      if (a.role === 'deputy' && b.role !== 'deputy') return -1
      if (a.role !== 'deputy' && b.role === 'deputy') return 1
      return a.memberName.localeCompare(b.memberName)
    })
  }, [selectedTeamId, selectedMemberName, selectedMemberTeamIds, memberKeyword, selectedKpi, memberSortKey, memberSortDir])

  // 过滤专家：按选中工作组或选中人员负责的组 + KPI筛选
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
    // 按顶部 KPI 筛选（专家只有重大隐患字段）
    if (selectedKpi === 'serious') {
      result = result.filter(e => e.hazardSerious > 0)
    }
    // 排序
    if (expertSortKey) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any
        if (expertSortKey.startsWith('dim_')) {
          const dimIndex = parseInt(expertSortKey.replace('dim_', ''))
          aVal = a.performanceDimensions[dimIndex]?.score || 0
          bVal = b.performanceDimensions[dimIndex]?.score || 0
        } else {
          aVal = (a as any)[expertSortKey]
          bVal = (b as any)[expertSortKey]
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return expertSortDir === 'asc' ? aVal - bVal : bVal - aVal
        }
        return expertSortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal))
      })
    }
    return result
  }, [selectedTeamId, selectedMemberTeamIds, expertKeyword, selectedKpi, expertSortKey, expertSortDir])

  // 获取选中工作组的名称
  const selectedTeamName = selectedTeamId
    ? workGroups.find(g => g.id === selectedTeamId)?.name
    : null

  // 根据筛选范围计算限期整改和延期整改（从隐患记录中按日期过滤）
  const hazardStatsByDateRange = useMemo(() => {
    const { start, end } = dateRange
    const filtered = hazardRecords.filter(r => r.recordTime >= start && r.recordTime <= end)
    return {
      deadline: filtered.filter(r => r.status === 'rectifying' || r.status === 'pending').length,
      extended: filtered.filter(r => r.status === 'overdue').length,
    }
  }, [dateRange])

  // 汇总数据（根据选中的人员或工作组动态计算）
  const total = selectedMemberName
    ? (() => {
        const memberTeams = workGroups.filter(g => selectedMemberTeamIds.includes(g.id))
        return {
          enterprise: memberTeams.reduce((s, g) => s + g.enterpriseCount, 0),
          hazard: memberTeams.reduce((s, g) => s + g.hazardFound, 0),
          serious: memberTeams.reduce((s, g) => s + g.hazardSerious, 0),
          closed: memberTeams.reduce((s, g) => s + g.hazardClosed, 0),
          overdue: memberTeams.reduce((s, g) => s + g.overdueUnrectified, 0),
          inProgress: memberTeams.reduce((s, g) => s + g.inProgress, 0),
          deadline: hazardStatsByDateRange.deadline,
          extended: hazardStatsByDateRange.extended,
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
          deadline: hazardStatsByDateRange.deadline,
          extended: hazardStatsByDateRange.extended,
        }
      })()
    : {
        enterprise: workGroups.reduce((s, g) => s + g.enterpriseCount, 0),
        hazard: workGroups.reduce((s, g) => s + g.hazardFound, 0),
        serious: workGroups.reduce((s, g) => s + g.hazardSerious, 0),
        closed: workGroups.reduce((s, g) => s + g.hazardClosed, 0),
        overdue: workGroups.reduce((s, g) => s + g.overdueUnrectified, 0),
        inProgress: workGroups.reduce((s, g) => s + g.inProgress, 0),
        deadline: hazardStatsByDateRange.deadline,
        extended: hazardStatsByDateRange.extended,
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
      {(selectedTeamId || selectedMemberName || selectedKpi) && (
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
          {selectedKpi && (
            <>
              <span style={{ padding: '2px 8px', background: '#7C3AED', color: '#FFF', borderRadius: 3, fontSize: 11, fontWeight: 500 }}>
                {{
                  enterprise: '检查企业', hazard: '隐患总数', serious: '重大隐患',
                  closed: '已整改', inProgress: '整改中', deadline: '限期整改数',
                  extended: '延期整改数', overdue: '逾期未整改',
                }[selectedKpi] || selectedKpi}
              </span>
              <span style={{ color: '#6B7280' }}>→ 仅展示相关数据</span>
            </>
          )}
          {selectedMemberName && (
            <>
              <span style={{ color: '#1F2937', fontWeight: 600 }}>{selectedMemberName}</span>
              <span style={{ color: '#6B7280' }}>(负责 {selectedMemberTeamIds.length} 个工作组)</span>
            </>
          )}
          {selectedTeamId && !selectedMemberName && (
            <>
              <span style={{ color: '#1F2937', fontWeight: 600 }}>{selectedTeamName}</span>
            </>
          )}
          <button
            onClick={() => { setSelectedTeamId(null); setSelectedMemberName(null); setSelectedKpi(null) }}
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
            清除全部筛选
          </button>
        </div>
      )}

      {/* （一）工作组履职情况表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>（一）工作组履职情况表</div>
          <input type="text" placeholder="搜索工作组名称" value={teamKeyword} onChange={e => setTeamKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {[
                { key: 'name', label: '工作组名称' },
                { key: null, label: '组长' },
                { key: null, label: '副站长' },
                { key: 'memberCount', label: '负责企业' },
                { key: 'enterpriseCount', label: '检查企业' },
                { key: 'hazardFound', label: '隐患总数' },
                { key: 'hazardSerious', label: '重大隐患' },
                { key: 'hazardClosed', label: '已整改' },
                { key: 'hazardClosureRate', label: '整改完成率' },
                { key: 'overdueUnrectified', label: '逾期未整改' },
                { key: 'inProgress', label: '整改中' },
                { key: null, label: '重大风险(任务/时间)' },
              ].map(col => (
                <th
                  key={col.key || col.label}
                  style={{
                    ...thStyle,
                    cursor: col.key ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    if (col.key) {
                      if (teamSortKey === col.key) {
                        setTeamSortDir(teamSortDir === 'asc' ? 'desc' : 'asc')
                      } else {
                        setTeamSortKey(col.key)
                        setTeamSortDir('asc')
                      }
                    }
                  }}
                >
                  {col.label}
                  {col.key && teamSortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{teamSortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr><td colSpan={12} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的工作组</td></tr>
            ) : filteredTeams.map((g, i) => {
              const isSelected = selectedTeamId === g.id
              const major = g.majorRisk
              const leaderMember = governmentMembers.find(m => m.memberName === g.leader && m.teamIds.includes(g.id))
              const deputyMember = governmentMembers.find(m => m.memberName === g.deputy && m.teamIds.includes(g.id))
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
                  <td
                    style={{ ...tdStyle, color: '#4F46E5', cursor: 'pointer', textDecoration: selectedMemberName === g.leader ? 'underline' : 'none' }}
                    onClick={() => setSelectedMemberName(selectedMemberName === g.leader ? null : g.leader)}
                    title="点击筛选该人员"
                  >
                    {g.leader}
                  </td>
                  <td
                    style={{ ...tdStyle, color: '#7C3AED', cursor: 'pointer', textDecoration: selectedMemberName === g.deputy ? 'underline' : 'none' }}
                    onClick={() => setSelectedMemberName(selectedMemberName === g.deputy ? null : g.deputy)}
                    title="点击筛选该人员"
                  >
                    {g.deputy}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{g.memberCount * 10}</td>
                  <td style={tdStyle}>{g.enterpriseCount}</td>
                  <td style={tdStyle}>{g.hazardFound}</td>
                  <td style={{ ...tdStyle, color: '#DC2626' }}>{g.hazardSerious}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{g.hazardClosed}</td>
                  <td style={tdStyle}>{g.hazardClosureRate}%</td>
                  <td style={{ ...tdStyle, color: '#DC2626' }}>{g.overdueUnrectified}</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{g.inProgress}</td>
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
              {[
                { key: 'memberName', label: '姓名' },
                { key: 'position', label: '职务' },
                { key: null, label: '配合工作组' },
                { key: 'enterpriseCount', label: '负责企业' },
                { key: 'inspectionCount', label: '已检查企业' },
                { key: 'hazardFound', label: '发现隐患' },
                { key: 'hazardSerious', label: '重大隐患' },
                { key: 'hazardClosed', label: '已整改' },
                { key: 'hazardClosureRate', label: '整改率' },
                { key: 'inProgress', label: '整改中' },
                { key: 'overdueUnrectified', label: '逾期未改' },
              ].map(col => (
                <th
                  key={col.key || col.label}
                  style={{
                    ...thStyle,
                    cursor: col.key ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    if (col.key) {
                      if (memberSortKey === col.key) {
                        setMemberSortDir(memberSortDir === 'asc' ? 'desc' : 'asc')
                      } else {
                        setMemberSortKey(col.key)
                        setMemberSortDir('asc')
                      }
                    }
                  }}
                >
                  {col.label}
                  {col.key && memberSortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{memberSortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的人员</td></tr>
            ) : filteredMembers.map((m, i) => {
              const isSelected = selectedMemberName === m.memberName
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
                    onClick={() => setSelectedMemberName(isSelected ? null : m.memberName)}
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
              {[
                { key: 'expertName', label: '姓名' },
                { key: 'teamName', label: '配合工作组' },
                { key: null, label: '负责' },
                { key: null, label: '检查' },
                { key: null, label: '发现隐患' },
                { key: null, label: '重大隐患' },
                { key: null, label: '已整改' },
                { key: null, label: '整改率' },
                { key: null, label: '整改中' },
                { key: null, label: '逾期' },
                { key: null, label: '风险标注' },
                { key: null, label: '视频待办' },
                { key: null, label: '隐患待办' },
                { key: null, label: '信息完善' },
                { key: null, label: 'IM咨询' },
                { key: null, label: '服务日志' },
                { key: null, label: '现场看' },
                { key: null, label: '视频看' },
                { key: null, label: 'AI看' },
                { key: null, label: '一企一档' },
              ].map(col => (
                <th
                  key={col.key || col.label}
                  style={{
                    ...thStyle,
                    cursor: col.key ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    if (col.key) {
                      if (expertSortKey === col.key) {
                        setExpertSortDir(expertSortDir === 'asc' ? 'desc' : 'asc')
                      } else {
                        setExpertSortKey(col.key)
                        setExpertSortDir('asc')
                      }
                    }
                  }}
                >
                  {col.label}
                  {col.key && expertSortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{expertSortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
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
              {[
                { key: 'expertName', label: '姓名' },
                { key: 'dim_0', label: '企业基础覆盖度' },
                { key: 'dim_1', label: '制度数字化完善度' },
                { key: 'dim_2', label: '风险识别精准度' },
                { key: 'dim_3', label: '检查计划科学度' },
                { key: 'dim_4', label: '自查执行活跃度' },
                { key: 'dim_5', label: '隐患闭环治理度' },
                { key: 'dim_6', label: '远程监管效能度' },
              ].map(col => (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    if (expertSortKey === col.key) {
                      setExpertSortDir(expertSortDir === 'asc' ? 'desc' : 'asc')
                    } else {
                      setExpertSortKey(col.key)
                      setExpertSortDir('asc')
                    }
                  }}
                >
                  {col.label}
                  {expertSortKey === col.key && (
                    <span style={{ marginLeft: 4 }}>{expertSortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
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
