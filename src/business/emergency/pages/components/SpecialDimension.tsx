import { useState, useMemo, useEffect } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'
import type { SpecialDimensionProps } from './types'
import { initDatabase, getTasks, getWorkGroups, getExperts, getHazards, getEnterprises } from '../../../../db'
import type { Task, WorkGroup, Expert, Hazard, Enterprise } from '../../../../db/types'
import { exportToCSV } from './exportUtils'

const PAGE_SIZE = 10

// 时间进度计算
function calcTimeProgress(startDate: string, endDate: string): { percent: number; status: '正常' | '超前' | '滞后' } {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (now < start) return { percent: 0, status: '超前' }
  if (now > end) return { percent: 100, status: '滞后' }
  
  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  const percent = Math.round((elapsed / total) * 100)
  
  return { percent: Math.min(100, Math.max(0, percent)), status: '正常' }
}

type TaskTab = '日常检查' | '专项检查' | '督查督办' | '抽检'

export function SpecialDimension({ dateRange, riskLevel, timeRange, selectedKpi, onNavigateToHazard }: SpecialDimensionProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TaskTab>('日常检查')
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initDatabase()
        const [taskList, groups, expertList, hazardList, entList] = await Promise.all([
          getTasks(),
          getWorkGroups(),
          getExperts(),
          getHazards(),
          getEnterprises(),
        ])
        setTasks(taskList)
        setWorkGroups(groups)
        setExperts(expertList)
        setHazards(hazardList)
        setEnterprises(entList)
      } catch (err) {
        console.error('Failed to load tasks:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 带时间筛选的任务
  const filteredTasks = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    // 月份是0-indexed，0-2月=Q1, 3-5月=Q2, 6-8月=Q3, 9-11月=Q4
    const currentQuarter = Math.floor(currentMonth / 3) + 1
    
    return tasks.filter(task => {
      const taskStart = new Date(task.start_date)
      const taskEnd = new Date(task.end_date)
      
      if (dateRange?.start && taskEnd < new Date(dateRange.start)) return false
      if (dateRange?.end && taskStart > new Date(dateRange.end)) return false
      
      if (timeRange) {
        if (timeRange === 'month') {
          const monthStart = new Date(currentYear, currentMonth, 1)
          const monthEnd = new Date(currentYear, currentMonth + 1, 0)
          if (taskEnd < monthStart || taskStart > monthEnd) return false
        } else if (timeRange === 'quarter') {
          const quarterStartMonth = (currentQuarter - 1) * 3
          const quarterEndMonth = quarterStartMonth + 2
          const quarterStart = new Date(currentYear, quarterStartMonth, 1)
          const quarterEnd = new Date(currentYear, quarterEndMonth + 1, 0)
          if (taskEnd < quarterStart || taskStart > quarterEnd) return false
        } else if (timeRange === 'year') {
          const yearStart = new Date(currentYear, 0, 1)
          const yearEnd = new Date(currentYear, 11, 31)
          if (taskEnd < yearStart || taskStart > yearEnd) return false
        }
      }
      return true
    })
  }, [tasks, dateRange, timeRange])

  // 当前 tab 的任务
  const currentTasks = useMemo(() => {
    let list = filteredTasks.filter(t => t.type === activeTab)
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      list = list.filter(t => t.name.toLowerCase().includes(kw) || t.creator.toLowerCase().includes(kw))
    }
    return list
  }, [filteredTasks, activeTab, keyword])

  // 排序
  const { sortedData: sortedTasks, sort, handleSort } = useSortableTable(currentTasks, 'start_date', 'desc')

  // 分页
  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE))
  const pagedTasks = sortedTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // 统计
  const stats = useMemo(() => ({
    taskCount: filteredTasks.length,
    totalCount: filteredTasks.reduce((s, t) => s + t.total_count, 0),
    completedCount: filteredTasks.reduce((s, t) => s + t.completed_count, 0),
  }), [filteredTasks])

  // 任务类型映射
  const typeMap: Record<string, string> = {
    '日常检查': 'daily',
    '专项检查': 'special',
    '督查督办': 'supervise',
    '抽检任务': 'sample',
  }

  // 按组织/人的进度
  const taskProgressByOrg = useMemo(() => {
    const taskList = selectedTask ? [selectedTask] : currentTasks
    if (taskList.length === 0) return []
    
    const groupCount = Math.min(workGroups.length, 4)
    const totalTasks = taskList.reduce((s, t) => s + t.total_count, 0)
    const completedTasks = taskList.reduce((s, t) => s + t.completed_count, 0)
    const perGroup = Math.ceil(totalTasks / groupCount)
    let remaining = totalTasks
    
    return workGroups.slice(0, groupCount).map((g, i) => {
      const isLast = i === groupCount - 1
      const total = isLast ? remaining : Math.min(perGroup, remaining)
      remaining -= total
      // 按比例分配已完成数
      const completed = isLast 
        ? completedTasks - (taskList.length > 1 ? Math.floor((totalTasks - total) * (completedTasks / totalTasks)) : 0)
        : Math.floor(total * (completedTasks / totalTasks))
      return {
        name: g.name,
        total,
        completed: Math.max(0, completed),
        rate: total > 0 ? Math.round((Math.max(0, completed) / total) * 100) : 0,
      }
    })
  }, [selectedTask, currentTasks, workGroups])

  const taskProgressByPerson = useMemo(() => {
    const taskList = selectedTask ? [selectedTask] : currentTasks
    if (taskList.length === 0) return []
    
    const expertCount = Math.min(experts.length, 6)
    const totalTasks = taskList.reduce((s, t) => s + t.total_count, 0)
    const completedTasks = taskList.reduce((s, t) => s + t.completed_count, 0)
    const perExpert = Math.ceil(totalTasks / expertCount)
    let remaining = totalTasks
    
    return experts.slice(0, expertCount).map((e, i) => {
      const isLast = i === expertCount - 1
      const total = isLast ? remaining : Math.min(perExpert, remaining)
      remaining -= total
      const completed = isLast 
        ? completedTasks - (taskList.length > 1 ? Math.floor((totalTasks - total) * (completedTasks / totalTasks)) : 0)
        : Math.floor(total * (completedTasks / totalTasks))
      return {
        name: e.name,
        total,
        completed: Math.max(0, completed),
        rate: total > 0 ? Math.round((Math.max(0, completed) / total) * 100) : 0,
      }
    })
  }, [selectedTask, currentTasks, experts])

  // 状态样式
  const statusLabels: Record<string, { bg: string; color: string }> = {
    '进行中': { bg: '#DBEAFE', color: '#1D4ED8' },
    '已完成': { bg: '#D1FAE5', color: '#065F46' },
    '已过期': { bg: '#FEE2E2', color: '#991B1B' },
  }

  // 隐患等级样式
  const hazardLevelColors: Record<string, string> = {
    '重大隐患': '#DC2626',
    '一般隐患': '#D97706',
  }

  // 选中任务关联的隐患汇总
  const taskHazardSummary = useMemo(() => {
    // 根据选中任务筛选隐患
    const filteredHazards = selectedTask 
      ? hazards.filter(h => selectedTask.enterprise_ids.includes(h.enterprise_id))
      : hazards
    
    // 按 title 统计高频问题（同时统计关联企业数）
    const titleStats: Record<string, { level: string; count: number; enterpriseIds: Set<string> }> = {}
    filteredHazards.forEach(h => {
      if (!titleStats[h.title]) {
        titleStats[h.title] = { level: h.level, count: 0, enterpriseIds: new Set() }
      }
      titleStats[h.title].count++
      titleStats[h.title].enterpriseIds.add(h.enterprise_id)
    })
    
    // 转为数组并排序
    return Object.entries(titleStats)
      .map(([title, data]) => ({ 
        title, 
        level: data.level, 
        count: data.count,
        enterpriseCount: data.enterpriseIds.size,
      }))
      .sort((a, b) => b.count - a.count)
  }, [selectedTask, hazards])

  // 跳转隐患列表
  const handleHazardClick = (type: string) => {
    if (!onNavigateToHazard) return
    // 根据当前 tab 确定监管类型
    const supervisionType = typeMap[activeTab] || undefined
    onNavigateToHazard({ status: supervisionType })
  }

  // 跳转隐患列表（按任务关联企业筛选）
  const handleTaskHazardClick = (task: Task, level?: string) => {
    if (!onNavigateToHazard) return
    const params: any = {}
    // 任务关联的企业可以作为企业筛选条件
    if (task.enterprise_ids && task.enterprise_ids.length > 0) {
      params.enterpriseIds = task.enterprise_ids
    }
    if (level) params.riskLevel = level
    onNavigateToHazard(params)
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>加载中...</div>
  }

  return (
    <div>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>任务总数</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937' }}>{stats.taskCount}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>覆盖企业</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937' }}>{stats.totalCount}</div>
        </div>
        <div style={{ background: 'white', borderRadius: 8, padding: 16, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>已完成</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{stats.completedCount}</div>
        </div>
      </div>

      {/* Tab + 搜索 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['日常检查', '专项检查', '督查督办', '抽检'] as TaskTab[]).map(tab => {
            const count = filteredTasks.filter(t => t.type === tab).length
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setKeyword(''); setCurrentPage(1); setSelectedTask(null) }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: isActive ? '#4F46E5' : '#E5E7EB',
                  background: isActive ? '#EEF2FF' : 'white',
                  color: isActive ? '#4F46E5' : '#6B7280',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {tab} ({count})
              </button>
            )
          })}
        </div>
        <input
          type="text"
          placeholder="搜索任务"
          value={keyword}
          onChange={e => { setKeyword(e.target.value); setCurrentPage(1) }}
          style={{ ...inputStyle, width: 180 }}
        />
        <button onClick={() => exportToCSV(
          currentTasks.map(t => ({
            任务名称: t.name,
            类型: t.type,
            发布单位: t.publish_unit,
            开始日期: t.start_date,
            结束日期: t.end_date,
            覆盖企业: t.total_count,
            已完成: t.completed_count,
            完成率: t.completion_rate + '%',
            隐患数: t.hazard_count,
            重大隐患: t.major_hazard_count,
            创建人: t.creator,
            状态: t.status,
          })),
          [
            { key: '任务名称', label: '任务名称' },
            { key: '类型', label: '类型' },
            { key: '发布单位', label: '发布单位' },
            { key: '开始日期', label: '开始日期' },
            { key: '结束日期', label: '结束日期' },
            { key: '覆盖企业', label: '覆盖企业' },
            { key: '已完成', label: '已完成' },
            { key: '完成率', label: '完成率' },
            { key: '隐患数', label: '隐患数' },
            { key: '重大隐患', label: '重大隐患' },
            { key: '创建人', label: '创建人' },
            { key: '状态', label: '状态' },
          ],
          '任务列表'
        )} style={{ padding: '4px 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', color: '#374151', fontSize: 12, cursor: 'pointer' }}>⬇ 导出</button>
      </div>

      {/* 任务表格 */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              <th style={{ ...thStyle, fontWeight: 600, fontSize: 11 }}>#</th>
              <SortableTh label="任务名称" sortKey="name" sort={sort} onSort={handleSort} />
              <SortableTh label="开始日期" sortKey="start_date" sort={sort} onSort={handleSort} />
              <SortableTh label="结束日期" sortKey="end_date" sort={sort} onSort={handleSort} />
              <SortableTh label="覆盖企业" sortKey="total_count" sort={sort} onSort={handleSort} />
              <SortableTh label="已完成" sortKey="completed_count" sort={sort} onSort={handleSort} />
              <SortableTh label="完成率" sortKey="completion_rate" sort={sort} onSort={handleSort} />
              <th style={{ ...thStyle, fontWeight: 600, fontSize: 11 }}>时间进度</th>
              <th style={{ ...thStyle, fontWeight: 600, fontSize: 11 }}>隐患数据</th>
              <SortableTh label="创建人" sortKey="creator" sort={sort} onSort={handleSort} />
              <SortableTh label="状态" sortKey="status" sort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {pagedTasks.length === 0 ? (
              <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>暂无数据</td></tr>
            ) : pagedTasks.map((t, i) => {
              const timeProgress = calcTimeProgress(t.start_date, t.end_date)
              const statusStyle = statusLabels[t.status] || { bg: '#F3F4F6', color: '#374151' }
              const isSelected = selectedTask?.id === t.id
              return (
                <tr 
                  key={t.id} 
                  style={{ 
                    background: isSelected ? '#EEF2FF' : i % 2 === 0 ? 'white' : '#FAFBFC',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedTask(isSelected ? null : t)}
                >
                  <td style={{ ...tdStyle, color: '#9CA3AF' }}>{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937', maxWidth: 240 }}>
                    {isSelected && <span style={{ color: '#4F46E5', marginRight: 4 }}>▶</span>}
                    {t.name}
                  </td>
                  <td style={tdStyle}>{t.start_date}</td>
                  <td style={tdStyle}>{t.end_date}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{t.total_count}</td>
                  <td style={{ ...tdStyle, color: '#059669', fontWeight: 600 }}>{t.completed_count}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: t.completion_rate >= 80 ? '#059669' : t.completion_rate >= 50 ? '#D97706' : '#DC2626' }}>
                    {t.completion_rate}%
                  </td>
                  <td style={{ ...tdStyle }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${timeProgress.percent}%`, 
                          height: '100%', 
                          background: timeProgress.status === '滞后' ? '#DC2626' : '#4F46E5',
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{timeProgress.percent}%</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: t.creator === '系统' ? '#9CA3AF' : '#4F46E5' }}>{t.creator}</td>
                  <td style={tdStyle} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <span
                        onClick={() => handleTaskHazardClick(t)}
                        style={{
                          cursor: 'pointer',
                          color: '#D97706',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                        title="点击查看隐患详情"
                      >
                        {t.hazard_count}条
                      </span>
                      <span
                        onClick={() => handleTaskHazardClick(t, 'major')}
                        style={{
                          cursor: 'pointer',
                          color: '#DC2626',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                        title="点击查看重大隐患详情"
                      >
                        {t.major_hazard_count}条
                      </span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ ...statusStyle, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {/* 分页 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #E5E7EB', fontSize: 12, color: '#6B7280' }}>
          <span>共 {currentTasks.length} 条</span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white' }}>‹</button>
              <span style={{ padding: '4px 8px' }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white' }}>›</button>
            </div>
          )}
        </div>
      </div>

      {/* 按组织/人的进度（默认展示全部，点击任务后切换） */}
      <div style={{ marginTop: 24, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            {selectedTask ? `${selectedTask.name} - 进度详情` : '全部任务 - 汇总进度'}
          </div>
          {selectedTask && (
            <button 
              onClick={() => setSelectedTask(null)}
              style={{ padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', fontSize: 11, cursor: 'pointer', color: '#6B7280' }}
            >
              返回汇总
            </button>
          )}
        </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 16 }}>
          {/* 按组织 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 12 }}>按工作组</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {taskProgressByOrg.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 80, fontSize: 12, color: '#6B7280' }}>{item.name}</div>
                  <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${item.rate}%`, 
                      height: '100%', 
                      background: item.rate >= 80 ? '#059669' : item.rate >= 50 ? '#D97706' : '#DC2626',
                      borderRadius: 4,
                    }} />
                  </div>
                  <div style={{ width: 50, fontSize: 11, color: '#374151', textAlign: 'right' }}>
                    {item.completed}/{item.total}
                  </div>
                  <div style={{ width: 36, fontSize: 11, fontWeight: 600, color: item.rate >= 80 ? '#059669' : '#374151' }}>
                    {item.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 按人 */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 12 }}>按专家</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {taskProgressByPerson.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 60, fontSize: 12, color: '#6B7280' }}>{item.name}</div>
                  <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${item.rate}%`, 
                      height: '100%', 
                      background: item.rate >= 80 ? '#059669' : item.rate >= 50 ? '#D97706' : '#DC2626',
                      borderRadius: 4,
                    }} />
                  </div>
                  <div style={{ width: 50, fontSize: 11, color: '#374151', textAlign: 'right' }}>
                    {item.completed}/{item.total}
                  </div>
                  <div style={{ width: 36, fontSize: 11, fontWeight: 600, color: item.rate >= 80 ? '#059669' : '#374151' }}>
                    {item.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 高频问题汇总（默认展示，点击任务后筛选） */}
      <div style={{ marginTop: 24, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            {selectedTask ? `高频问题汇总（${selectedTask.name}）` : '高频问题汇总（全部任务）'}
          </div>
          {selectedTask && (
            <button 
              onClick={() => setSelectedTask(null)}
              style={{ padding: '4px 10px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', fontSize: 11, cursor: 'pointer', color: '#6B7280' }}
            >
              查看全部
            </button>
          )}
        </div>
        {!taskHazardSummary || taskHazardSummary.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>暂无隐患数据</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['排名', '问题类型', '出现次数', '关联企业数', '风险等级'].map(h => (
                  <th key={h} style={{ ...thStyle, fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskHazardSummary.slice(0, 10).map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, color: i < 3 ? '#DC2626' : '#9CA3AF', fontWeight: i < 3 ? 600 : 400 }}>
                    {i + 1}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500 }}>{item.title}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{item.count}次</td>
                  <td style={{ ...tdStyle, color: '#4F46E5' }}>{item.enterpriseCount}家</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: hazardLevelColors[item.level] || '#374151' }}>
                    {item.level}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
