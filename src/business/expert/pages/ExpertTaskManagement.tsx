import { useState } from 'react'
import { PageShell, PageHeader, SectionBlock } from '../../../components/layout'
import { TabPanel } from '../components/TabPanel'
import expertMock from '../mock'
import { getRiskLevelColor, getRiskLevelBg, formatDateTime } from '../utils/helpers'

export function ExpertTaskManagement() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('daily')

  const { tasks } = expertMock

  const dailyTasks = tasks.filter(t => t.type === 'daily')
  const specialTasks = tasks.filter(t => t.type === 'special')
  const currentTasks = activeTab === 'daily' ? dailyTasks : specialTasks

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500'
    if (progress >= 30) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getDaysUntil = (isoString: string) => {
    const now = new Date()
    const target = new Date(isoString)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const handleSubTaskAction = (subTaskId: string, action: string) => {
    alert(`Demo: ${action} - ${subTaskId}`)
  }

  const urgencyLabels: Record<string, { text: string; color: string }> = {
    critical: { text: '紧急', color: 'bg-red-100 text-red-700' },
    high: { text: '较急', color: 'bg-orange-100 text-orange-700' },
    medium: { text: '普通', color: 'bg-slate-100 text-slate-700' },
    low: { text: '低', color: 'bg-slate-50 text-slate-500' },
  }

  const subTaskStatusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: '待执行', color: 'bg-slate-100 text-slate-700' },
    in_progress: { text: '进行中', color: 'bg-amber-100 text-amber-700' },
    completed: { text: '已完成', color: 'bg-green-100 text-green-700' },
  }

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="任务管理" subtitle="检查任务执行与进度" />

      <TabPanel
        tabs={[
          {
            key: 'daily',
            label: '日常检查',
            badge: dailyTasks.length,
            children: null as any,
          },
          {
            key: 'special',
            label: '专项检查',
            badge: specialTasks.length,
            children: null as any,
          },
        ]}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* 任务卡片列表 */}
      <SectionBlock>
        <div className="space-y-4">
          {currentTasks.map(task => {
            const days = getDaysUntil(task.deadline)
            const isOverdue = days < 0 && task.status !== 'completed'
            const urgencyInfo = urgencyLabels[task.urgency] || urgencyLabels.medium

            return (
              <div key={task.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-text">{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${task.type === 'daily' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                      {task.type === 'daily' ? '日常' : '专项'}
                    </span>
                    {task.type === 'special' && (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${urgencyInfo.color}`}>{urgencyInfo.text}</span>
                    )}
                    {task.status === 'overdue' && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">已逾期</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)} className="px-3 py-1.5 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-slate-50">
                      {selectedTask === task.id ? '收起' : '查看详情'}
                    </button>
                    {task.mySubTasks.some(st => st.status !== 'completed') && (
                      <button onClick={() => alert(`Demo: 去处理任务 - ${task.title}`)} className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">
                        去处理
                      </button>
                    )}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${getProgressColor(task.overallProgress)}`} style={{ width: `${task.overallProgress}%` }} />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${task.overallProgress >= 70 ? 'text-green-600' : task.overallProgress >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
                    {task.overallProgress}%
                  </span>
                </div>

                {/* 元信息 */}
                <div className="flex items-center gap-6 text-sm text-text-secondary">
                  <span>截止: {formatDateTime(task.deadline)}</span>
                  {!isOverdue && task.status !== 'completed' && days >= 0 && (
                    <span>还剩 {days} 天</span>
                  )}
                  {isOverdue && <span className="text-danger font-medium">已逾期 {Math.abs(days)} 天</span>}
                  <span>参与专家: {task.assignedExpertCount} 人</span>
                  <span className="text-text">我的子任务: <strong>{task.completedSubTasks}/{task.mySubTasks.length}</strong></span>
                </div>

                {/* 展开的任务详情 */}
                {selectedTask === task.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">任务描述</h4>
                      <p className="text-sm text-text">{task.description}</p>
                    </div>

                    <h4 className="text-sm font-medium text-text-secondary mb-3">子任务列表</h4>
                    <div className="space-y-2">
                      {task.mySubTasks.map(sub => {
                        const statusInfo = subTaskStatusLabels[sub.status]
                        return (
                          <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-slate-50">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-2 h-2 rounded-full ${sub.status === 'completed' ? 'bg-green-500' : sub.status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                              <div>
                                <span className="text-sm text-text">{sub.title}</span>
                                <div className="text-xs text-text-tertiary mt-0.5">
                                  <button className="text-primary hover:underline">{sub.enterpriseName}</button>
                                  {sub.completedAt && <span className="ml-2">完成于 {formatDateTime(sub.completedAt)}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusInfo.color}`}>{statusInfo.text}</span>
                              {sub.status === 'pending' && (
                                <button onClick={() => handleSubTaskAction(sub.id, '去处理')} className="px-3 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90">去处理</button>
                              )}
                              {sub.status === 'in_progress' && (
                                <button onClick={() => handleSubTaskAction(sub.id, '标记完成')} className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600">标记完成</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SectionBlock>
    </PageShell>
  )
}
