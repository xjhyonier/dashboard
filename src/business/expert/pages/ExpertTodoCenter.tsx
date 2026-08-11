import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard } from '../../../components/widgets'
import expertMock from '../mock'
import { getRiskLevelColor, formatDateTime, getRiskScoreColor, getRiskScoreBarColor } from '../utils/helpers'

export function ExpertTodoCenter() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['grp-001', 'grp-002']))
  const [newTodo, setNewTodo] = useState({ title: '', description: '', deadline: '', enterpriseId: '' })

  const { todos, enterprises } = expertMock

  // 筛选
  let filtered = [...todos]
  if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter)
  if (sourceFilter !== 'all') filtered = filtered.filter(t => t.source === sourceFilter)
  if (searchKeyword) filtered = filtered.filter(t => t.enterpriseName?.includes(searchKeyword) || t.title.includes(searchKeyword))

  // 统计
  const todoCount = todos.filter(t => t.status === 'todo').length
  const inProgressCount = todos.filter(t => t.status === 'in_progress').length
  const doneCount = todos.filter(t => t.status === 'done' && new Date(t.completedAt!) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  const overdueCount = todos.filter(t => new Date(t.deadline) < new Date() && t.status !== 'done' && t.status !== 'closed').length

  const isOverdue = (deadline: string) => new Date(deadline) < new Date()

  const toggleGroup = (groupId: string) => {
    const next = new Set(expandedGroups)
    if (next.has(groupId)) next.delete(groupId)
    else next.add(groupId)
    setExpandedGroups(next)
  }

  const handleTodoAction = (todoId: string, action: string) => {
    alert(`Demo: ${action} - ${todoId}`)
  }

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="待办中心" subtitle="多源待办统一管理" />

      <FilterBar filters={[
        {
          key: 'status', label: '状态', type: 'tabs', value: statusFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: '待处理', value: 'todo' },
            { label: '进行中', value: 'in_progress' },
            { label: '已完成', value: 'done' },
          ],
          onChange: setStatusFilter,
        },
        {
          key: 'source', label: '来源', type: 'tabs', value: sourceFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: 'AI推送', value: 'ai_push' },
            { label: '手动创建', value: 'manual' },
            { label: '外部同步', value: 'external_sync' },
            { label: '检查任务', value: 'task' },
          ],
          onChange: setSourceFilter,
        },
      ]}>
        <input
          type="text"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          placeholder="搜索企业名称..."
          className="px-3 py-1.5 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </FilterBar>

      {/* 统计概览 */}
      <SectionBlock>
        <GridLayout columns={4}>
          <KpiCard title="待处理" value={todoCount} description="需处理的任务" />
          <KpiCard title="进行中" value={inProgressCount} description="正在处理的任务" />
          <KpiCard title="本周完成" value={doneCount} description="本周已完成的任务" />
          <KpiCard title="逾期" value={overdueCount} description="超期未完成的任务" />
        </GridLayout>
      </SectionBlock>

      {/* 待办列表 */}
      <SectionBlock>
        <div className="space-y-3">
          {filtered.map(todo => {
            const ent = enterprises.find(e => e.id === todo.enterpriseId)
            const overdue = isOverdue(todo.deadline)

            // 聚合组主条目
            if (todo.groupId && todo.groupSubItems && todo.groupSubItems.length > 0) {
              const isExpanded = expandedGroups.has(todo.groupId)
              const allDone = todo.groupSubItems.every(s => s.status === 'done')
              return (
                <div key={todo.id} className="card">
                  {/* 主条目 */}
                  <div className="flex items-center gap-4">
                    <div className={`w-1 self-stretch rounded-full ${getRiskScoreBarColor(ent?.riskScore ?? 50)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text">{todo.enterpriseName}</span>
                        {todo.workGroup && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{todo.workGroup}</span>}
                        {overdue && <span className="text-xs text-danger font-medium">逾期</span>}
                        {allDone && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">已完成</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        {todo.groupSubItems.map(s => s.source).filter((v, i, a) => a.indexOf(v) === i).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-slate-100 rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`font-bold ${getRiskScoreColor(ent?.riskScore ?? 50)}`}>{ent?.riskScore ?? '--'}</span>
                      <span className="text-sm text-text-tertiary">{todo.deadline.split('T')[0]}</span>
                      <button
                        onClick={() => toggleGroup(todo.groupId!)}
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                      >
                        {todo.groupSubItems.length} 条子任务
                        <span className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&rarr;</span>
                      </button>
                    </div>
                  </div>

                  {/* 展开子项 */}
                  {isExpanded && (
                    <div className="mt-3 ml-5 border-t border-border pt-3 space-y-2">
                      {todo.groupSubItems.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50">
                          <div className="flex items-center gap-3 flex-1">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${sub.status === 'done' ? 'bg-green-500' : sub.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                            <span className="text-sm text-text">{sub.title}</span>
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-text-tertiary rounded">{sub.source}</span>
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{sub.workGroup}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${sub.status === 'done' ? 'bg-green-100 text-green-700' : sub.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {sub.status === 'done' ? '已完成' : sub.status === 'in_progress' ? '进行中' : '待处理'}
                            </span>
                            {sub.status !== 'done' && (
                              <button onClick={() => handleTodoAction(sub.id, sub.status === 'todo' ? '开始处理' : '完成')} className="px-3 py-1 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/5">
                                {sub.status === 'todo' ? '开始处理' : '完成'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            // 单条待办
            return (
              <div key={todo.id} className="card flex items-center gap-4">
                <div className={`w-1 self-stretch rounded-full ${getRiskScoreBarColor(ent?.riskScore ?? 50)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {todo.enterpriseName && <span className="font-medium text-text">{todo.enterpriseName}</span>}
                    <span className="text-sm text-text">{todo.title}</span>
                    {todo.workGroup && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{todo.workGroup}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="px-2 py-0.5 bg-slate-100 rounded">{todo.sourceLabel}</span>
                    <span>{formatDateTime(todo.deadline)}</span>
                    {overdue && <span className="text-danger font-medium">逾期</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${todo.status === 'done' ? 'bg-green-100 text-green-700' : todo.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                    {todo.status === 'done' ? '已完成' : todo.status === 'in_progress' ? '进行中' : '待处理'}
                  </span>
                  {todo.status !== 'done' && todo.status !== 'closed' && (
                    <button onClick={() => handleTodoAction(todo.id, todo.status === 'todo' ? '开始处理' : '完成')} className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
                      {todo.status === 'todo' ? '开始处理' : '完成'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </SectionBlock>

      {/* 手动创建待办按钮 */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 text-sm font-medium text-white bg-primary rounded-full shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl"
        >
          + 手动创建待办
        </button>
      </div>

      {/* 创建待办弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text mb-4">创建待办</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-tertiary block mb-1">待办标题 *</label>
                <input type="text" value={newTodo.title} onChange={e => setNewTodo({ ...newTodo, title: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="输入待办标题" />
              </div>
              <div>
                <label className="text-sm text-text-tertiary block mb-1">详细说明 *</label>
                <textarea value={newTodo.description} onChange={e => setNewTodo({ ...newTodo, description: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" rows={3} placeholder="输入详细说明" />
              </div>
              <div>
                <label className="text-sm text-text-tertiary block mb-1">关联企业</label>
                <select value={newTodo.enterpriseId} onChange={e => setNewTodo({ ...newTodo, enterpriseId: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">不关联</option>
                  {enterprises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-text-tertiary block mb-1">截止时间 *</label>
                <input type="date" value={newTodo.deadline} onChange={e => setNewTodo({ ...newTodo, deadline: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={() => { alert('待办已创建'); setShowCreateModal(false) }} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50" disabled={!newTodo.title || !newTodo.description || !newTodo.deadline}>提交</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
