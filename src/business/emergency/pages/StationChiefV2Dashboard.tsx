import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import { EnterpriseStatePath } from '../../../components/shared/EnterpriseStatePath'
import {
  workGroups,
  governmentMembers,
  expertsFull,
  industryHazardAnalysis,
  specialInspections,
  enterprises,
  filterEnterprisesByState,
  getStateCounts,
  hazardRecords,
  type ExpertFull,
  type IndustryHazardAnalysis,
  type SpecialInspection,
  type Enterprise,
  type EnterpriseState,
  type HazardRecord,
  type HazardStatus,
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
type Dimension = 'duty' | 'industry' | 'special' | 'monitor' | 'state' | 'hazard'
const VALID_DIMENSIONS: Dimension[] = ['duty', 'industry', 'special', 'monitor', 'state', 'hazard']

export function StationChiefV2Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // 从 URL 读取 tab 参数，默认 'duty'
  const urlDimension = searchParams.get('tab')
  const dimension: Dimension = VALID_DIMENSIONS.includes(urlDimension as Dimension) ? urlDimension as Dimension : 'duty'

  const handleDimensionChange = (key: Dimension) => {
    setSearchParams({ tab: key })
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="维度二：组织与人员履职看板" subtitle="工作组 · 政府人员 · 专家履职情况统计" />

      {/* 维度切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'duty', label: '履职维度' },
          { key: 'industry', label: '行业维度' },
          { key: 'special', label: '专项维度' },
          { key: 'state', label: '状态维度' },
          { key: 'monitor', label: '日常监控' },
          { key: 'hazard', label: '隐患维度' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleDimensionChange(tab.key as Dimension)}
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

      {dimension === 'duty' && <DutyDimension />}
      {dimension === 'industry' && <IndustryDimension />}
      {dimension === 'special' && <SpecialDimension />}
      {dimension === 'state' && (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          状态维度 — 建设中
        </div>
      )}
      {dimension === 'monitor' && (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          日常监控维度 — 建设中
        </div>
      )}
      {dimension === 'hazard' && <HazardDimension />}
    </div>
  )
}

// ─────────────────────────────────────────────
// 履职维度
// ─────────────────────────────────────────────
function DutyDimension() {
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

  // 过滤工作组：按关键词 + 按选中人员负责的组 + 排序
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
  }, [teamKeyword, selectedMemberName, selectedMemberTeamIds, teamSortKey, teamSortDir])

  // 过滤人员：按选中的工作组或人员负责的组过滤 + 关键词过滤 + 按姓名去重并合并 teamIds
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
    // 按姓名去重，合并同一个人的多个 teamIds
    const nameToMember = new Map<string, typeof result[0]>()
    result.forEach(m => {
      if (nameToMember.has(m.memberName)) {
        // 合并 teamIds
        const existing = nameToMember.get(m.memberName)!
        const mergedTeamIds = [...new Set([...existing.teamIds, ...m.teamIds])]
        nameToMember.set(m.memberName, { ...existing, teamIds: mergedTeamIds })
      } else {
        nameToMember.set(m.memberName, m)
      }
    })
    // 排序逻辑
    return Array.from(nameToMember.values()).sort((a, b) => {
      // 如果选择了排序列，按排序列排序（副站长不强制置顶）
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
      // 如果没有选择排序列，按默认规则：副站长优先 + 姓名
      if (a.role === 'deputy' && b.role !== 'deputy') return -1
      if (a.role !== 'deputy' && b.role === 'deputy') return 1
      return a.memberName.localeCompare(b.memberName)
    })
  }, [selectedTeamId, selectedMemberName, selectedMemberTeamIds, memberKeyword, memberSortKey, memberSortDir])

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
    // 排序
    if (expertSortKey) {
      result = [...result].sort((a, b) => {
        let aVal: any, bVal: any
        // 7维度列的排序
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
  }, [selectedTeamId, selectedMemberTeamIds, expertKeyword, expertSortKey, expertSortDir])

  // 获取选中工作组的名称
  const selectedTeamName = selectedTeamId
    ? workGroups.find(g => g.id === selectedTeamId)?.name
    : null

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
      {(selectedTeamId || selectedMemberName) && (
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
          <span style={{ color: '#6B7280' }}>，数据已联动筛选</span>
          <button
            onClick={() => { setSelectedTeamId(null); setSelectedMemberName(null) }}
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
              // 查找组长和副站长的人员信息
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

// ─────────────────────────────────────────────
// 行业维度
// ─────────────────────────────────────────────
function DimensionTable({ title, data, keyword, onKeywordChange, keywordPlaceholder }: {
  title: string
  data: { id: string; name: string; enterpriseCount: number; hazardFound: number; hazardSerious: number; hazardClosed: number; closureRate: number; overdue: number; inProgress: number }[]
  keyword: string
  onKeywordChange: (v: string) => void
  keywordPlaceholder: string
}) {
  const filtered = useMemo(() => {
    if (!keyword.trim()) return data
    const kw = keyword.trim().toLowerCase()
    return data.filter(d => d.name.toLowerCase().includes(kw))
  }, [keyword, data])

  const total = {
    enterpriseCount: data.reduce((s, d) => s + d.enterpriseCount, 0),
    hazardFound: data.reduce((s, d) => s + d.hazardFound, 0),
    hazardSerious: data.reduce((s, d) => s + d.hazardSerious, 0),
    hazardClosed: data.reduce((s, d) => s + d.hazardClosed, 0),
    overdue: data.reduce((s, d) => s + d.overdue, 0),
    inProgress: data.reduce((s, d) => s + d.inProgress, 0),
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 4 }}>
        {[
          { label: '行业数', value: data.length, unit: '个' },
          { label: '检查企业', value: total.enterpriseCount, unit: '家' },
          { label: '隐患总数', value: total.hazardFound, unit: '处' },
          { label: '重大隐患', value: total.hazardSerious, unit: '处' },
          { label: '已整改', value: total.hazardClosed, unit: '处' },
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

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{title}</div>
          <input type="text" placeholder={keywordPlaceholder} value={keyword} onChange={e => onKeywordChange(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['名称', '检查企业', '隐患总数', '重大隐患', '已整改', '整改完成率', '逾期未整改', '整改中'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : filtered.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.name}</td>
                <td style={tdStyle}>{d.enterpriseCount}</td>
                <td style={tdStyle}>{d.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{d.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{d.hazardClosed}</td>
                <td style={tdStyle}>{d.closureRate}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{d.overdue}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{d.inProgress}</td>
              </tr>
            ))}
            {filtered.length > 0 && filtered.length < data.length && (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filtered.length} / {data.length} 条</td></tr>
            )}
            {filtered.length === data.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.enterpriseCount}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazardFound}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.hazardSerious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.hazardClosed}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{Math.round(total.hazardClosed / total.hazardFound * 100)}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.overdue}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.inProgress}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 隐患维度
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<HazardStatus, { label: string; color: string; bg: string; textColor: string }> = {
  pending:    { label: '待整改',    color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' },
  rectifying: { label: '整改中',    color: '#D97706', bg: '#FEF3C7', textColor: '#92400E' },
  rectified:  { label: '已整改',    color: '#059669', bg: '#D1FAE5', textColor: '#065F46' },
  overdue:    { label: '逾期未整改', color: '#DC2626', bg: '#FEE2E2', textColor: '#991B1B' },
}

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  general: { label: '一般隐患', color: '#059669' },
  serious: { label: '较大隐患', color: '#D97706' },
  major:   { label: '重大隐患', color: '#DC2626' },
}

function HazardDimension() {
  const [statusFilter, setStatusFilter] = useState<HazardStatus | 'all'>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState('')

  // 各状态统计
  const statusCounts = useMemo(() => {
    const counts: Record<HazardStatus, number> = { pending: 0, rectifying: 0, rectified: 0, overdue: 0 }
    hazardRecords.forEach(r => counts[r.status]++)
    return counts
  }, [])

  // 行业列表
  const industries = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.industry))
    return ['all', ...Array.from(set)]
  }, [])

  // 工作组列表
  const teams = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.teamName))
    return ['all', ...Array.from(set)]
  }, [])

  // 过滤后的隐患列表
  const filtered = useMemo(() => {
    return hazardRecords.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (industryFilter !== 'all' && r.industry !== industryFilter) return false
      if (teamFilter !== 'all' && r.teamName !== teamFilter) return false
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        if (!r.enterpriseName.toLowerCase().includes(kw) &&
            !r.hazardDesc.toLowerCase().includes(kw) &&
            !(r.expertName?.toLowerCase().includes(kw))) return false
      }
      return true
    })
  }, [statusFilter, industryFilter, teamFilter, keyword])

  const total = hazardRecords.length

  return (
    <div>
      {/* 汇总 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 4 }}>
        {[
          { label: '隐患总数', value: total, unit: '处', color: '#374151' },
          { label: '待整改', value: statusCounts.pending, unit: '处', color: '#374151' },
          { label: '整改中', value: statusCounts.rectifying, unit: '处', color: '#92400E' },
          { label: '已整改', value: statusCounts.rectified, unit: '处', color: '#065F46' },
          { label: '逾期未整改', value: statusCounts.overdue, unit: '处', color: '#991B1B' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
          </div>
        ))}
      </div>

      {/* 筛选器 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* 状态筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>隐患状态</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'rectifying', 'rectified', 'overdue'] as const).map(s => {
              const cfg = s === 'all'
                ? { label: '全部', color: '#4F46E5', bg: '#EEF2FF', textColor: '#3730A3' }
                : STATUS_CONFIG[s]
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${active ? cfg.color : '#D1D5DB'}`,
                    background: active ? cfg.bg : 'white',
                    color: active ? cfg.textColor : '#6B7280',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cfg.label} {s !== 'all' ? `(${statusCounts[s]})` : ''}
                </button>
              )
            })}
          </div>
        </div>

        {/* 行业筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>所属行业</div>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind === 'all' ? '全部行业' : ind}</option>
            ))}
          </select>
        </div>

        {/* 工作组筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>负责工作组</div>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {teams.map(t => (
              <option key={t} value={t}>{t === 'all' ? '全部工作组' : t}</option>
            ))}
          </select>
        </div>

        {/* 关键词搜索 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>关键词搜索</div>
          <input
            type="text"
            placeholder="企业名称 / 隐患描述 / 专家"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* 隐患列表 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
          隐患明细列表
          <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
            （{filtered.length} / {total} 条）
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
            <thead>
              <tr>
                {['序号', '企业名称', '行业', '负责工作组', '隐患描述', '隐患等级', '记录时间', '整改期限', '整改完成时间', '当前状态', '跟进专家'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>未找到匹配结果</td></tr>
              ) : filtered.map((r, i) => {
                const statusCfg = STATUS_CONFIG[r.status]
                const riskCfg = RISK_CONFIG[r.riskLevel]
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937', minWidth: 160 }}>{r.enterpriseName}</td>
                    <td style={tdStyle}>{r.industry}</td>
                    <td style={tdStyle}>{r.teamName}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151', minWidth: 180 }}>{r.hazardDesc}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: riskCfg.color }}>{riskCfg.label}</td>
                    <td style={tdStyle}>{r.recordTime}</td>
                    <td style={{ ...tdStyle, color: r.status === 'overdue' ? '#DC2626' : '#374151' }}>{r.rectifyDeadline}</td>
                    <td style={{ ...tdStyle, color: '#059669' }}>{r.rectifyTime || '—'}</td>
                    <td style={{ ...tdStyle }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: statusCfg.bg,
                        color: statusCfg.textColor,
                        fontWeight: 600,
                        fontSize: 11,
                      }}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>{r.expertName || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
function IndustryDimension() {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    if (!keyword.trim()) return industryHazardAnalysis
    const kw = keyword.trim().toLowerCase()
    return industryHazardAnalysis.filter(d => d.industry.toLowerCase().includes(kw))
  }, [keyword])

  const total = {
    hazardCount: industryHazardAnalysis.reduce((s, d) => s + d.hazardCount, 0),
    majorHazardCount: industryHazardAnalysis.reduce((s, d) => s + d.majorHazardCount, 0),
    rectifiedCount: industryHazardAnalysis.reduce((s, d) => s + d.rectifiedCount, 0),
    deadlineCount: industryHazardAnalysis.reduce((s, d) => s + d.deadlineCount, 0),
  }

  return (
    <div>

      {/* 汇总 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 4 }}>
        {[
          { label: '行业数', value: industryHazardAnalysis.length, unit: '个' },
          { label: '隐患总数', value: total.hazardCount, unit: '处' },
          { label: '重大隐患', value: total.majorHazardCount, unit: '处' },
          { label: '已整改', value: total.rectifiedCount, unit: '处' },
          { label: '限期整改', value: total.deadlineCount, unit: '处' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>行业隐患分析统计表</div>
          <input type="text" placeholder="搜索行业名称" value={keyword} onChange={e => setKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', '行业', '隐患数', '重大隐患', '已整改', '限期整改', '高频问题 Top3', '隐患反弹企业 Top3'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : filtered.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.industry}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: d.hazardCount > 150 ? '#DC2626' : d.hazardCount > 100 ? '#D97706' : '#374151' }}>{d.hazardCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#DC2626' }}>{d.majorHazardCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{d.rectifiedCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#D97706' }}>{d.deadlineCount}</td>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.topIssues.join('、')}</td>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.reboundEnterprises.join('、')}</td>
              </tr>
            ))}
            {filtered.length > 0 && filtered.length < industryHazardAnalysis.length && (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filtered.length} / {industryHazardAnalysis.length} 条</td></tr>
            )}
            {filtered.length === industryHazardAnalysis.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td colSpan={2} style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazardCount}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.majorHazardCount}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.rectifiedCount}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.deadlineCount}</td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SpecialDimension() {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    if (!keyword.trim()) return specialInspections
    const kw = keyword.trim().toLowerCase()
    return specialInspections.filter(d => d.name.toLowerCase().includes(kw))
  }, [keyword])

  const total = {
    totalCount: specialInspections.reduce((s, d) => s + d.totalCount, 0),
    checkedCount: specialInspections.reduce((s, d) => s + d.checkedCount, 0),
    hazardCount: specialInspections.reduce((s, d) => s + d.hazardCount, 0),
    majorHazardCount: specialInspections.reduce((s, d) => s + d.majorHazardCount, 0),
    rectifiedCount: specialInspections.reduce((s, d) => s + d.rectifiedCount, 0),
    deadlineCount: specialInspections.reduce((s, d) => s + d.deadlineCount, 0),
  }

  return (
    <div>
      {/* 汇总 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20, padding: '16px', background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 4 }}>
        {[
          { label: '专项数', value: specialInspections.length, unit: '个' },
          { label: '覆盖企业', value: total.totalCount, unit: '家' },
          { label: '已检查', value: total.checkedCount, unit: '家' },
          { label: '隐患总数', value: total.hazardCount, unit: '处' },
          { label: '重大隐患', value: total.majorHazardCount, unit: '处' },
          { label: '已整改', value: total.rectifiedCount, unit: '处' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1F2937' }}>{item.value}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.unit}</div>
          </div>
        ))}
      </div>

      {/* 表格 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>专项检查进度统计表</div>
          <input type="text" placeholder="搜索专项名称" value={keyword} onChange={e => setKeyword(e.target.value)} style={inputStyle} />
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['#', '专项检查名称', '开始日期', '结束日期', '覆盖企业', '已检查', '覆盖率', '隐患数', '重大隐患', '已整改', '限期整改', '突出问题', '重点盯防'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={13} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : filtered.map((d, i) => {
              const coverageRate = d.totalCount > 0 ? Math.round((d.checkedCount / d.totalCount) * 100) : 0
              return (
                <tr key={d.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.name}</td>
                  <td style={tdStyle}>{d.startDate}</td>
                  <td style={tdStyle}>{d.endDate}</td>
                  <td style={tdStyle}>{d.totalCount}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{d.checkedCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: coverageRate >= 80 ? '#059669' : coverageRate >= 50 ? '#D97706' : '#DC2626' }}>{coverageRate}%</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: d.hazardCount > 80 ? '#DC2626' : d.hazardCount > 50 ? '#D97706' : '#374151' }}>{d.hazardCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#DC2626' }}>{d.majorHazardCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{d.rectifiedCount}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#D97706' }}>{d.deadlineCount}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.topIssues.join('、')}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.focusGroups.join('、')}</td>
                </tr>
              )
            })}
            {filtered.length > 0 && filtered.length < specialInspections.length && (
              <tr><td colSpan={13} style={{ ...tdStyle, textAlign: 'left', fontStyle: 'italic', color: '#9CA3AF' }}>已筛选 {filtered.length} / {specialInspections.length} 条</td></tr>
            )}
            {filtered.length === specialInspections.length && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.totalCount}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.checkedCount}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{Math.round((total.checkedCount / total.totalCount) * 100)}%</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazardCount}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.majorHazardCount}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.rectifiedCount}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.deadlineCount}</td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}


