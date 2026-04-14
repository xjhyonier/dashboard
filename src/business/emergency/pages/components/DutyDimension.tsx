import { useState, useMemo, useEffect } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { DutyDimensionProps } from './types'
import { initDatabase, getWorkGroups, getGovernmentMembers, getExperts, getHazards, getExpertDimensions, getExpertPlatformBehavior } from '../../../../db'
import type { WorkGroup, GovernmentMember, Expert, Hazard, ExpertDimensionScore, ExpertPlatformBehavior } from '../../../../db/types'
import { exportToCSV } from './exportUtils'

// 工作组视图（包含计算字段）
interface WorkGroupView {
  id: string
  name: string
  area: string
  risk_level: string
  enterprise_count: number
  inspection_count: number
  leader_name: string
  deputy_name: string
  member_count: number
  hazard_total: number
  hazard_major: number
  hazard_pending: number
  hazard_rectified: number
  hazard_overdue: number
  closure_rate: number
  plan_count: number
  plan_completed: number
  plan_completion_rate: number
  major_risk_progress: number
  time_progress: number
}

// 政府人员视图
interface MemberView {
  id: string
  name: string
  position: string
  work_groups: string[]
  enterprise_count: number
  inspection_count: number
  plan_count: number
  plan_completed: number
  plan_completion_rate: number
  hazard_found: number
  hazard_serious: number
  hazard_closed: number
  hazard_in_progress: number
  hazard_overdue: number
  closure_rate: number
  last_inspection_date: string
}

// 专家视图
interface ExpertView {
  id: string
  name: string
  work_group: string
  grade: string
  enterprise_count: number
  check_count: number
  hazard_found: number
  hazard_serious: number
  hazard_closed: number
  closure_rate: number
  in_progress: number
  overdue: number
  risk_mark: number
  video_todo: number
  hazard_todo: number
  info_complete: number
  im_chat: number
  service_log: number
  on_site_visit: number
  video_watch: number
  ai_watch: number
  enterprise_file: number
  dimensions: {
    dim_1: number
    dim_2: number
    dim_3: number
    dim_4: number
    dim_5: number
    dim_6: number
    dim_7: number
  }
}

export function DutyDimension({ dateRange, riskLevel, timeRange, selectedKpi, setSelectedKpi, onNavigateToHazard, onNavigateToState }: DutyDimensionProps) {
  // 数据库数据状态
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [governmentMembers, setGovernmentMembers] = useState<GovernmentMember[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [hazardRecords, setHazardRecords] = useState<Hazard[]>([])
  const [expertDimensions, setExpertDimensions] = useState<Record<string, ExpertDimensionScore[]>>({})
  const [expertPlatformBehaviors, setExpertPlatformBehaviors] = useState<Record<string, ExpertPlatformBehavior>>({})
  const [loading, setLoading] = useState(true)

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        await initDatabase()
        const [groups, members, expertList, hazards] = await Promise.all([
          getWorkGroups(),
          getGovernmentMembers(),
          getExperts(),
          getHazards(),
        ])
        setWorkGroups(groups)
        setGovernmentMembers(members)
        setExperts(expertList)
        setHazardRecords(hazards)

        // 加载专家维度数据
        const dimensionMap: Record<string, ExpertDimensionScore[]> = {}
        const behaviorMap: Record<string, ExpertPlatformBehavior> = {}
        for (const expert of expertList) {
          const dims = await getExpertDimensions(expert.id)
          dimensionMap[expert.id] = dims
          const behavior = await getExpertPlatformBehavior(expert.id)
          if (behavior) {
            behaviorMap[expert.id] = behavior
          }
        }
        setExpertDimensions(dimensionMap)
        setExpertPlatformBehaviors(behaviorMap)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 转换工作组数据（计算隐患统计）
  const workGroupViews = useMemo((): WorkGroupView[] => {
    return workGroups.map(wg => {
      // 获取该工作组负责的企业
      const wgHazards = hazardRecords.filter(h => h.team_name === wg.name)
      const hazard_total = wgHazards.length
      const hazard_major = wgHazards.filter(h => h.level === 'major').length
      const hazard_pending = wgHazards.filter(h => h.status === 'pending' || h.status === 'rectifying').length
      const hazard_rectified = wgHazards.filter(h => ['rectified', 'verified', 'closed'].includes(h.status)).length
      const hazard_overdue = wgHazards.filter(h => h.status === 'overdue').length
      const closure_rate = hazard_total > 0 ? Math.round((hazard_rectified / hazard_total) * 100) : 0

      // 获取该工作组的人员
      const wgMembers = governmentMembers.filter(m => m.work_group === wg.name)
      const leader = wgMembers.find(m => m.position === '组长')
      const deputy = wgMembers.find(m => m.position === '副站长')
      const member_count = wgMembers.length

      // 模拟检查次数和计划数据
      const inspection_count = Math.round(wg.enterprise_count * 2.5)
      const plan_count = Math.round(wg.enterprise_count / 3)
      const plan_completed = Math.round(plan_count * 0.85)
      const plan_completion_rate = plan_count > 0 ? Math.round((plan_completed / plan_count) * 100) : 0

      // 重大风险任务进度（模拟）
      const major_risk_progress = Math.round(40 + Math.random() * 50)
      const time_progress = Math.round(10 + Math.random() * 20)

      return {
        id: wg.id,
        name: wg.name,
        area: wg.area,
        risk_level: wg.risk_level,
        enterprise_count: wg.enterprise_count,
        inspection_count,
        leader_name: leader?.name || '-',
        deputy_name: deputy?.name || '-',
        member_count,
        hazard_total,
        hazard_major,
        hazard_pending,
        hazard_rectified,
        hazard_overdue,
        closure_rate,
        plan_count,
        plan_completed,
        plan_completion_rate,
        major_risk_progress,
        time_progress,
      }
    })
  }, [workGroups, hazardRecords, governmentMembers])

  // 转换政府人员数据
  const memberViews = useMemo((): MemberView[] => {
    // 按姓名分组，排除组员（组员就是专家）
    const nameMap = new Map<string, MemberView>()
    
    governmentMembers.forEach(m => {
      // 跳过组员（组员就是专家，在专家表中显示）
      if (m.position === '组员') return
      
      if (!nameMap.has(m.name)) {
        nameMap.set(m.name, {
          id: m.id,
          name: m.name,
          position: m.position,
          work_groups: [],
          enterprise_count: 0,
          inspection_count: 0,
          plan_count: 0,
          plan_completed: 0,
          plan_completion_rate: 0,
          hazard_found: 0,
          hazard_serious: 0,
          hazard_closed: 0,
          hazard_in_progress: 0,
          hazard_overdue: 0,
          closure_rate: 0,
          last_inspection_date: '-',
        })
      }
      const view = nameMap.get(m.name)!
      if (!view.work_groups.includes(m.work_group)) {
        view.work_groups.push(m.work_group)
      }
    })

    // 计算每个人员的隐患统计
    nameMap.forEach(view => {
      const mHazards = hazardRecords.filter(h => view.work_groups.includes(h.team_name || ''))
      view.hazard_found = mHazards.length
      view.hazard_serious = mHazards.filter(h => h.level === 'major').length
      view.hazard_closed = mHazards.filter(h => ['rectified', 'verified', 'closed'].includes(h.status)).length
      view.hazard_in_progress = mHazards.filter(h => h.status === 'rectifying').length
      view.hazard_overdue = mHazards.filter(h => h.status === 'overdue').length
      view.closure_rate = view.hazard_found > 0 ? Math.round((view.hazard_closed / view.hazard_found) * 100) : 0
      view.enterprise_count = workGroups.filter(wg => view.work_groups.includes(wg.name)).reduce((sum, wg) => sum + wg.enterprise_count, 0)
      // 模拟检查次数和计划数
      view.inspection_count = Math.round(view.enterprise_count * 0.8)
      view.plan_count = Math.round(view.enterprise_count / 5)
      view.plan_completed = Math.round(view.plan_count * 0.8)
      view.plan_completion_rate = view.plan_count > 0 ? Math.round((view.plan_completed / view.plan_count) * 100) : 0
      // 最近检查日期
      if (mHazards.length > 0) {
        const validHazards = mHazards.filter(h => h.record_time)
        if (validHazards.length > 0) {
          const sortedHazards = [...validHazards].sort((a, b) => (b.record_time || '').localeCompare(a.record_time || ''))
          view.last_inspection_date = sortedHazards[0]?.record_time?.split(' ')[0] || '-'
        }
      }
    })

    return Array.from(nameMap.values())
  }, [governmentMembers, hazardRecords, workGroups])

  // 转换专家数据
  const expertViews = useMemo((): ExpertView[] => {
    return experts.map(exp => {
      const dims = expertDimensions[exp.id] || []
      const avgDims = {
        dim_1: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_1_score, 0) / dims.length) : 0,
        dim_2: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_2_score, 0) / dims.length) : 0,
        dim_3: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_3_score, 0) / dims.length) : 0,
        dim_4: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_4_score, 0) / dims.length) : 0,
        dim_5: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_5_score, 0) / dims.length) : 0,
        dim_6: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_6_score, 0) / dims.length) : 0,
        dim_7: dims.length > 0 ? Math.round(dims.reduce((s, d) => s + d.dim_7_score, 0) / dims.length) : 0,
      }
      const behavior = expertPlatformBehaviors[exp.id]
      return {
        id: exp.id,
        name: exp.name,
        work_group: exp.work_group,
        grade: exp.grade,
        enterprise_count: exp.enterprise_count,
        check_count: behavior?.check_count || 0,
        hazard_found: behavior?.hazard_found || 0,
        hazard_serious: behavior?.hazard_serious || 0,
        hazard_closed: behavior?.hazard_closed || 0,
        closure_rate: behavior?.closure_rate || 0,
        in_progress: behavior?.in_progress || 0,
        overdue: behavior?.overdue || 0,
        risk_mark: behavior?.risk_mark || 0,
        video_todo: behavior?.video_todo || 0,
        hazard_todo: behavior?.hazard_todo || 0,
        info_complete: behavior?.info_complete || 0,
        im_chat: behavior?.im_chat || 0,
        service_log: behavior?.service_log || 0,
        on_site_visit: behavior?.on_site_visit || 0,
        video_watch: behavior?.video_watch || 0,
        ai_watch: behavior?.ai_watch || 0,
        enterprise_file: behavior?.enterprise_file || 0,
        dimensions: avgDims,
      }
    })
  }, [experts, expertDimensions, expertPlatformBehaviors])

  // 筛选状态
  const [teamKeyword, setTeamKeyword] = useState('')
  const [memberKeyword, setMemberKeyword] = useState('')
  const [expertKeyword, setExpertKeyword] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null)
  const [filterByMember, setFilterByMember] = useState<string | null>(null) // 按成员名称过滤工作组
  const [selectedExpertName, setSelectedExpertName] = useState<string | null>(null) // 选中的专家

  // 过滤工作组
  const filteredTeams = useMemo(() => {
    let result = workGroupViews
    if (teamKeyword.trim()) {
      const kw = teamKeyword.trim().toLowerCase()
      result = result.filter(g => g.name.toLowerCase().includes(kw))
    }
    // 按成员名称过滤（点击组长/副站长时生效）
    if (filterByMember) {
      result = result.filter(g => 
        g.leader_name === filterByMember || g.deputy_name === filterByMember
      )
    }
    if (riskLevel !== 'all') {
      const riskMap: Record<string, string> = { major: '重大', high: '较大', medium: '一般', low: '低' }
      const mappedLevel = riskMap[riskLevel]
      if (mappedLevel) {
        result = result.filter(g => g.risk_level === mappedLevel)
      }
    }
    return result
  }, [workGroupViews, teamKeyword, riskLevel, filterByMember])

  // 过滤人员
  const filteredMembers = useMemo(() => {
    let result = memberViews
    if (memberKeyword.trim()) {
      const kw = memberKeyword.trim().toLowerCase()
      result = result.filter(m => m.name.toLowerCase().includes(kw) || m.position.toLowerCase().includes(kw))
    }
    if (selectedTeamId) {
      const teamName = workGroups.find(wg => wg.id === selectedTeamId)?.name
      if (teamName) {
        result = result.filter(m => m.work_groups.includes(teamName))
      }
    }
    return result
  }, [memberViews, memberKeyword, selectedTeamId, workGroups])

  // 过滤专家
  const filteredExperts = useMemo(() => {
    let result = expertViews
    // 按选中的专家过滤
    if (selectedExpertName) {
      result = result.filter(e => e.name === selectedExpertName)
    }
    // 按选中的工作组过滤
    if (selectedTeamId) {
      const selectedTeam = workGroups.find(wg => wg.id === selectedTeamId)
      if (selectedTeam) {
        result = result.filter(e => e.work_group === selectedTeam.name)
      }
    }
    if (expertKeyword.trim()) {
      const kw = expertKeyword.trim().toLowerCase()
      result = result.filter(e => e.name.toLowerCase().includes(kw) || e.work_group.toLowerCase().includes(kw))
    }
    return result
  }, [expertViews, expertKeyword, selectedTeamId, workGroups, selectedExpertName])

  // 合计
  const totals = useMemo(() => {
    const teams = selectedTeamId ? filteredTeams.filter(t => t.id === selectedTeamId) : filteredTeams
    return {
      enterprise: teams.reduce((s, t) => s + t.enterprise_count, 0),
      hazard: teams.reduce((s, t) => s + t.hazard_total, 0),
      serious: teams.reduce((s, t) => s + t.hazard_major, 0),
      closed: teams.reduce((s, t) => s + t.hazard_rectified, 0),
    }
  }, [filteredTeams, selectedTeamId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
        加载数据中...
      </div>
    )
  }

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
                {{ enterprise: '检查企业', hazard: '隐患总数', serious: '重大隐患', closed: '已整改', inProgress: '整改中', deadline: '限期整改数', extended: '延期整改数', overdue: '逾期未整改' }[selectedKpi] || selectedKpi}
              </span>
            </>
          )}
          {selectedTeamId && (
            <span style={{ color: '#1F2937', fontWeight: 600 }}>{workGroups.find(wg => wg.id === selectedTeamId)?.name}</span>
          )}
          {selectedMemberName && (
            <span style={{ color: '#1F2937', fontWeight: 600 }}>{selectedMemberName}</span>
          )}
          <button
            onClick={() => { setSelectedTeamId(null); setSelectedMemberName(null); setSelectedKpi(null); setFilterByMember(null); setSelectedExpertName(null) }}
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
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="搜索工作组名称" value={teamKeyword} onChange={e => setTeamKeyword(e.target.value)} style={inputStyle} />
            <button onClick={() => exportToCSV(
              filteredWorkGroups.map(wg => ({
                工作组名称: wg.name,
                区域: wg.area,
                风险等级: wg.risk_level,
                组长: wg.leader_name,
                副站长: wg.deputy_name,
                检查企业: wg.enterprise_count,
                隐患总数: wg.hazard_total,
                重大隐患: wg.hazard_major,
              })),
              [
                { key: '工作组名称', label: '工作组名称' },
                { key: '区域', label: '区域' },
                { key: '风险等级', label: '风险等级' },
                { key: '组长', label: '组长' },
                { key: '副站长', label: '副站长' },
                { key: '检查企业', label: '检查企业' },
                { key: '隐患总数', label: '隐患总数' },
                { key: '重大隐患', label: '重大隐患' },
              ],
              '工作组履职情况表'
            )} style={{ padding: '4px 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', color: '#374151', fontSize: 12, cursor: 'pointer' }}>⬇ 导出</button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>工作组名称</th>
              <th style={thStyle}>组长</th>
              <th style={thStyle}>副站长</th>
              <th style={thStyle}>检查企业</th>
              <th style={thStyle}>隐患总数</th>
              <th style={thStyle}>重大隐患</th>
              <th style={thStyle}>已整改</th>
              <th style={thStyle}>整改完成率</th>
              <th style={thStyle}>逾期未整改</th>
              <th style={thStyle}>整改中</th>
              <th style={thStyle}>重大风险（任务/时间）</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的工作组</td></tr>
            ) : filteredTeams.map((g, i) => {
              const isSelected = selectedTeamId === g.id
              return (
                <tr key={g.id} style={{
                  background: isSelected ? '#EEF3FF' : (i % 2 === 0 ? 'white' : '#FAFBFC'),
                  cursor: 'pointer',
                }}>
                  <td
                    style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: isSelected ? '#4F46E5' : '#1F2937' }}
                    onClick={() => setSelectedTeamId(isSelected ? null : g.id)}
                  >
                    <span style={{ textDecoration: isSelected ? 'underline' : 'none' }}>{g.name}</span>
                  </td>
                  <td
                    style={{ ...tdStyle, color: '#4F46E5', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setFilterByMember(g.leader_name)
                      setSelectedMemberName(g.leader_name)
                    }}
                    title={`点击查看 ${g.leader_name} 负责的工作组`}
                  >
                    {g.leader_name}
                  </td>
                  <td
                    style={{ ...tdStyle, color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setFilterByMember(g.deputy_name)
                      setSelectedMemberName(g.deputy_name)
                    }}
                    title={`点击查看 ${g.deputy_name} 负责的工作组`}
                  >
                    {g.deputy_name}
                  </td>
                  <td
                    style={{ ...tdStyle, fontWeight: 500, cursor: g.enterprise_count > 0 ? 'pointer' : 'default', color: '#4F46E5', textDecoration: 'underline' }}
                    onClick={() => g.enterprise_count > 0 && onNavigateToState?.({ teamName: g.name })}
                    title="点击查看该工作组负责的企业"
                  >
                    {g.enterprise_count}
                  </td>
                  <td
                    style={{ ...tdStyle, cursor: g.hazard_total > 0 ? 'pointer' : 'default' }}
                    onClick={() => g.hazard_total > 0 && onNavigateToHazard?.({ teamName: g.name })}
                    title="点击查看隐患明细"
                  >
                    {g.hazard_total}
                  </td>
                  <td
                    style={{ ...tdStyle, color: '#DC2626', cursor: g.hazard_major > 0 ? 'pointer' : 'default' }}
                    onClick={() => g.hazard_major > 0 && onNavigateToHazard?.({ teamName: g.name, riskLevel: 'major' })}
                    title="点击查看重大隐患"
                  >
                    {g.hazard_major}
                  </td>
                  <td
                    style={{ ...tdStyle, color: '#059669', cursor: g.hazard_rectified > 0 ? 'pointer' : 'default' }}
                    onClick={() => g.hazard_rectified > 0 && onNavigateToHazard?.({ teamName: g.name, status: 'rectified' })}
                    title="点击查看已整改隐患"
                  >
                    {g.hazard_rectified}
                  </td>
                  <td style={tdStyle}>{g.closure_rate}%</td>
                  <td
                    style={{ ...tdStyle, color: '#DC2626', cursor: g.hazard_overdue > 0 ? 'pointer' : 'default' }}
                    onClick={() => g.hazard_overdue > 0 && onNavigateToHazard?.({ teamName: g.name, status: 'overdue' })}
                    title="点击查看逾期未整改隐患"
                  >
                    {g.hazard_overdue}
                  </td>
                  <td
                    style={{ ...tdStyle, color: '#D97706', cursor: g.hazard_pending > 0 ? 'pointer' : 'default' }}
                    onClick={() => g.hazard_pending > 0 && onNavigateToHazard?.({ teamName: g.name, status: 'rectifying' })}
                    title="点击查看整改中隐患"
                  >
                    {g.hazard_pending}
                  </td>
                  <td style={tdStyle}>{g.major_risk_progress}% | {g.time_progress}%</td>
                </tr>
              )
            })}
            {filteredTeams.length > 0 && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>-</td>
                <td style={{ ...tdStyle, color: '#374151' }}>-</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{totals.enterprise}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{totals.hazard}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{totals.serious}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{totals.closed}</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{totals.hazard > 0 ? Math.round((totals.closed / totals.hazard) * 100) : 0}%</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>-</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>-</td>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="搜索姓名" value={memberKeyword} onChange={e => setMemberKeyword(e.target.value)} style={inputStyle} />
            <button onClick={() => exportToCSV(
              filteredMembers.map(m => ({
                姓名: m.name,
                职务: m.position,
                工作组: m.work_group,
                检查企业: m.enterprise_count,
                隐患总数: m.hazard_total,
                重大隐患: m.hazard_major,
                已整改: m.hazard_closed,
              })),
              [
                { key: '姓名', label: '姓名' },
                { key: '职务', label: '职务' },
                { key: '工作组', label: '工作组' },
                { key: '检查企业', label: '检查企业' },
                { key: '隐患总数', label: '隐患总数' },
                { key: '重大隐患', label: '重大隐患' },
                { key: '已整改', label: '已整改' },
              ],
              '人员履职情况表'
            )} style={{ padding: '4px 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', color: '#374151', fontSize: 12, cursor: 'pointer' }}>⬇ 导出</button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>姓名</th>
              <th style={thStyle}>职务</th>
              <th style={thStyle}>所在工作组</th>
              <th style={thStyle}>负责企业</th>
              <th style={thStyle}>已检查企业</th>
              <th style={thStyle}>发现隐患</th>
              <th style={thStyle}>重大隐患</th>
              <th style={thStyle}>已整改</th>
              <th style={thStyle}>整改率</th>
              <th style={thStyle}>整改中</th>
              <th style={thStyle}>逾期未改</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的人员</td></tr>
            ) : filteredMembers.map((m, i) => (
              <tr key={m.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td
                  style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline' }}
                  onClick={() => setSelectedMemberName(m.name)}
                  title="点击筛选此人"
                >
                  {m.name}
                </td>
                <td style={tdStyle}>{m.position}</td>
                <td style={{ ...tdStyle, textAlign: 'left' }}>
                  {m.work_groups.map((wg, idx) => (
                    <span
                      key={idx}
                      style={{ cursor: 'pointer', color: '#059669', textDecoration: 'underline', marginRight: 4 }}
                      onClick={() => setSelectedTeamId(workGroups.find(g => g.name === wg)?.id || null)}
                      title={`点击查看 ${wg} 详情`}
                    >
                      {wg}{idx < m.work_groups.length - 1 ? '、' : ''}
                    </span>
                  ))}
                </td>
                <td
                  style={{ ...tdStyle, cursor: m.enterprise_count > 0 ? 'pointer' : 'default' }}
                  onClick={() => m.enterprise_count > 0 && setSelectedKpi('enterprise')}
                  title="点击查看负责的企业"
                >
                  {m.enterprise_count}
                </td>
                <td style={tdStyle}>{m.inspection_count}</td>
                <td
                  style={{ ...tdStyle, cursor: m.hazard_found > 0 ? 'pointer' : 'default' }}
                  onClick={() => m.hazard_found > 0 && onNavigateToHazard?.({ expertName: m.name })}
                  title="点击查看发现的隐患"
                >
                  {m.hazard_found}
                </td>
                <td
                  style={{ ...tdStyle, color: '#DC2626', cursor: m.hazard_serious > 0 ? 'pointer' : 'default' }}
                  onClick={() => m.hazard_serious > 0 && onNavigateToHazard?.({ expertName: m.name, riskLevel: 'major' })}
                  title="点击查看重大隐患"
                >
                  {m.hazard_serious}
                </td>
                <td
                  style={{ ...tdStyle, color: '#059669', cursor: m.hazard_closed > 0 ? 'pointer' : 'default' }}
                  onClick={() => m.hazard_closed > 0 && onNavigateToHazard?.({ expertName: m.name, status: 'rectified' })}
                  title="点击查看已整改隐患"
                >
                  {m.hazard_closed}
                </td>
                <td style={tdStyle}>{m.closure_rate}%</td>
                <td
                  style={{ ...tdStyle, color: '#D97706', cursor: m.hazard_in_progress > 0 ? 'pointer' : 'default' }}
                  onClick={() => m.hazard_in_progress > 0 && onNavigateToHazard?.({ expertName: m.name, status: 'rectifying' })}
                  title="点击查看整改中隐患"
                >
                  {m.hazard_in_progress}
                </td>
                <td
                  style={{ ...tdStyle, color: '#DC2626', cursor: m.hazard_overdue > 0 ? 'pointer' : 'default' }}
                  onClick={() => m.hazard_overdue > 0 && onNavigateToHazard?.({ expertName: m.name, status: 'overdue' })}
                  title="点击查看逾期未整改隐患"
                >
                  {m.hazard_overdue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* （三）专家履职情况表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>（三）专家履职情况表</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="搜索姓名或工作组" value={expertKeyword} onChange={e => setExpertKeyword(e.target.value)} style={inputStyle} />
            <button onClick={() => exportToCSV(
              filteredExperts.map(e => ({
                姓名: e.name,
                配合工作组: e.work_group,
                负责企业: e.responsible,
                检查次数: e.check_count,
                发现隐患: e.hazard_found,
                重大隐患: e.hazard_serious,
                已整改: e.hazard_closed,
              })),
              [
                { key: '姓名', label: '姓名' },
                { key: '配合工作组', label: '配合工作组' },
                { key: '负责企业', label: '负责企业' },
                { key: '检查次数', label: '检查次数' },
                { key: '发现隐患', label: '发现隐患' },
                { key: '重大隐患', label: '重大隐患' },
                { key: '已整改', label: '已整改' },
              ],
              '专家履职情况表'
            )} style={{ padding: '4px 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', color: '#374151', fontSize: 12, cursor: 'pointer' }}>⬇ 导出</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1200 }}>
            <thead>
              <tr>
                <th style={thStyle}>姓名</th>
                <th style={thStyle}>配合工作组</th>
                <th style={thStyle}>负责</th>
                <th style={thStyle}>检查</th>
                <th style={thStyle}>发现隐患</th>
                <th style={thStyle}>重大隐患</th>
                <th style={thStyle}>已整改</th>
                <th style={thStyle}>整改率</th>
                <th style={thStyle}>整改中</th>
                <th style={thStyle}>逾期</th>
                <th style={thStyle}>风险标注</th>
                <th style={thStyle}>视频待办</th>
                <th style={thStyle}>隐患待办</th>
                <th style={thStyle}>信息完善</th>
                <th style={thStyle}>IM咨询</th>
                <th style={thStyle}>服务日志</th>
                <th style={thStyle}>现场看</th>
                <th style={thStyle}>视频看</th>
                <th style={thStyle}>AI看</th>
                <th style={thStyle}>一企一档</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperts.length === 0 ? (
                <tr><td colSpan={20} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配的专家</td></tr>
              ) : filteredExperts.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td
                    style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, cursor: 'pointer', color: '#4F46E5', textDecoration: 'underline' }}
                    onClick={() => setSelectedExpertName(selectedExpertName === e.name ? null : e.name)}
                    title={selectedExpertName === e.name ? '取消筛选' : `点击筛选 ${e.name}`}
                  >
                    {e.name}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>{e.work_group}</td>
                  <td style={tdStyle}>{e.enterprise_count}</td>
                  <td style={tdStyle}>{e.check_count}</td>
                  <td
                    style={{ ...tdStyle, cursor: e.hazard_found > 0 ? 'pointer' : 'default' }}
                    onClick={() => e.hazard_found > 0 && onNavigateToHazard?.({ expertName: e.name })}
                  >
                    {e.hazard_found}
                  </td>
                  <td style={{ ...tdStyle, color: '#DC2626' }}>{e.hazard_serious}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{e.hazard_closed}</td>
                  <td style={tdStyle}>{e.closure_rate}%</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{e.in_progress}</td>
                  <td style={{ ...tdStyle, color: '#DC2626' }}>{e.overdue}</td>
                  <td style={tdStyle}>{e.risk_mark}</td>
                  <td style={tdStyle}>{e.video_todo}</td>
                  <td style={tdStyle}>{e.hazard_todo}</td>
                  <td style={tdStyle}>{e.info_complete}%</td>
                  <td style={tdStyle}>{e.im_chat}</td>
                  <td style={tdStyle}>{e.service_log}</td>
                  <td style={tdStyle}>{e.on_site_visit}</td>
                  <td style={tdStyle}>{e.video_watch}</td>
                  <td style={tdStyle}>{e.ai_watch}</td>
                  <td style={tdStyle}>{e.enterprise_file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* （四）专家7维度绩效得分明细 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>（四）专家7维度绩效得分明细</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>姓名</th>
              <th style={thStyle}>企业基础覆盖度</th>
              <th style={thStyle}>制度数字化完善度</th>
              <th style={thStyle}>风险识别精准度</th>
              <th style={thStyle}>检查计划科学度</th>
              <th style={thStyle}>自查执行活跃度</th>
              <th style={thStyle}>隐患闭环治理度</th>
              <th style={thStyle}>远程监管效能度</th>
            </tr>
          </thead>
          <tbody>
            {filteredExperts.length === 0 ? (
              <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>暂无数据</td></tr>
            ) : filteredExperts.map((e, i) => (
              <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500 }}>{e.name}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_1 >= 80 ? '#059669' : e.dimensions.dim_1 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_1}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_2 >= 80 ? '#059669' : e.dimensions.dim_2 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_2}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_3 >= 80 ? '#059669' : e.dimensions.dim_3 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_3}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_4 >= 80 ? '#059669' : e.dimensions.dim_4 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_4}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_5 >= 80 ? '#059669' : e.dimensions.dim_5 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_5}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_6 >= 80 ? '#059669' : e.dimensions.dim_6 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_6}</td>
                <td style={{ ...tdStyle, color: e.dimensions.dim_7 >= 80 ? '#059669' : e.dimensions.dim_7 >= 65 ? '#D97706' : '#DC2626' }}>{e.dimensions.dim_7}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
