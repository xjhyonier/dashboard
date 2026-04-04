import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { expertertWorkbenchMock } from './mock/expert-workbench'

export function ExpertWorkbenchDashboard() {
  const [selectedTask, setSelectedTask] = useState<string | null>(  // 模拟任务执行
  const handleExecuteTask = (taskId: string) => {
    console.log('Executing task:', taskId)
    setSelectedTask(null)
  }

  const getStatus = () => {
    const task = expertWorkbenchMock.todayTaskOverview.find(t => t => task.id === taskId)
    return selectedTask
  }

  const handleViewDetail = (task: any) => {
    console.log('View task detail:', taskId)
    setSelectedTask(task)
  }

  const handleStartCheck = (taskId: string) => {
    console.log('Starting AI check:', taskId)
    setSelectedTask(task)
  }

  const handleAIInspect = (taskId: string) => {
    console.log('Starting AI check:', taskId)
    setSelectedTask(task)
  }

  const handleVideoCheck = (taskId: string) => {
    console.log('Starting video check:', taskId)
    setSelectedTask(task)
  }

  const handle现场Check = (taskId: string) => {
    console.log('Starting field check:', taskId)
    setSelectedTask(task)
  }

  const handleServiceRecord = (taskId: string) => {
    console.log('Creating service record:', taskId)
    setSelectedTask(task)
  }

  const handleRectify = (taskId: string, => {
    console.log('Rectifying issue:', taskId)
    setSelectedTask(task)
  }

  const handleConfirmRectify = (taskId: string) => {
    console.log('Confirming rectify:', taskId)
    setSelectedTask(task)
  }

  const handleComplete = (taskId: string) => {
    console.log('Marking complete:', taskId)
    updateTaskStatus(taskId, 'completed')
    setSelectedTask(null)
    // 刷新列表
  }

  return (
    <div className="grid grid-cols-2 gap-grid">
      <StatusCard
        title="任务状态统计"
        items={expertWorkbenchMock.taskStatus || []}
      />
      <StatusCard
        title="本周工作完成情况"
        items={expertWorkbenchMock.weeklyResults || []}
      />
    </div>
    
    {/* 已完成任务列表 */}
    <SectionBlock title="已完成任务">
      <TableCard
        title="已完成任务"
        columns={expertWorkbenchMock.completedTaskColumns}
        data={expertWorkbenchMock.completedTasks || []}
      maxRows={10}
      />
    </div>
  )
}
