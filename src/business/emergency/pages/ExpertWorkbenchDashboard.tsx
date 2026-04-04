import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { expertWorkbenchMock } from './mock/expert-workbench'

export function ExpertWorkbenchDashboard() {
  const handleExecuteTask = (taskId: string, action: string) => {
    console.log(`执行任务: ${taskId}, 动作: ${action}`)
    alert(`开始执行: ${action}`)
  }

  const renderActionButton = (task: any) => {
    const buttonStyle = {
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s'
    }

    const primaryButton = {
      ...buttonStyle,
      background: '#4f46e5',
      color: 'white'
    }

    const secondaryButton = {
      ...buttonStyle,
      background: '#f1f5f9',
      color: '#475569'
    }

    switch (task.taskType) {
      case '现场检查':
        return (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始现场检查')}
          >
            开始检查
          </button>
        )
      case 'AI看':
        return (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '启动AI分析')}
          >
            AI识别
          </button>
        )
      case '视频看':
        return (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '打开视频监控')}
          >
            查看视频
          </button>
        )
      case '整改复核':
        return (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始现场复核')}
          >
            开始复核
          </button>
        )
      case '日常检查':
        return (
          <button 
            style={secondaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始日常检查')}
          >
            开始检查
          </button>
        )
      case '隐患复查':
        return (
          <button 
            style={secondaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始隐患复查')}
          >
            开始复查
          </button>
        )
      default:
        return (
          <button 
            style={secondaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '执行任务')}
          >
            执行
          </button>
        )
    }
  }

  return (
    <>
      <RoleIndicator
        title="专家工作台"
        description="作为三方安全专家，您需要按照平台分配的任务清单执行检查工作。平台已经帮您分析好优先级，您只需要按照待办清单逐项完成即可。"
        goals={[
          '完成平台分配的检查任务',
          '按照优先级处理高风险企业',
          '及时发现并上报隐患',
          '跟进整改直至闭环'
        ]}
        keyMetrics={[
          '今日待办任务',
          '本周到期任务',
          '逾期未处理任务',
          '已完成任务'
        ]}
      />

      <PageShell>
        <PageHeader
          title="专家工作台"
          subtitle="任务清单与执行指引"
          updateTime="2024-03-30 18:00"
        />

        {/* 今日任务概览 */}
        <SectionBlock title="今日任务概览">
          <GridLayout columns={4}>
            {expertWorkbenchMock.todayTaskOverview.map((task, index) => (
              <KpiCard key={index} {...task} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 待办任务清单 - 带执行按钮 */}
        <SectionBlock 
          title="待办任务清单"
          description="按优先级排序，点击按钮开始执行"
        >
          <div className="space-y-3">
            {[...expertWorkbenchMock.pendingTasks]
              .sort((a, b) => (a.riskScore || 0) - (b.riskScore || 0))
              .map((task, index) => (
              <div 
                key={index}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-20 text-center">
                    <span className={`text-sm font-semibold ${
                      task.riskScore && task.riskScore <= 30 ? 'text-red-600' :
                      task.riskScore && task.riskScore <= 60 ? 'text-orange-600' :
                      'text-yellow-600'
                    }`}>
                      {task.priority}
                    </span>
                    <div className="text-xs text-text-tertiary mt-1">分值:{task.riskScore}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-text">{task.enterprise}</div>
                    <div className="text-sm text-text-secondary mt-1">{task.description}</div>
                  </div>
                  <div className="text-sm text-text-tertiary">
                    截止: {task.deadline}
                  </div>
                </div>
                <div className="ml-4">
                  {renderActionButton(task)}
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>

        {/* 任务状态统计 */}
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

        {/* 已完成任务 */}
        <SectionBlock title="已完成任务">
          <TableCard
            title="已完成任务"
            columns={expertWorkbenchMock.completedTaskColumns}
            data={expertWorkbenchMock.completedTasks}
            maxRows={10}
          />
        </SectionBlock>
      </PageShell>
    </>
  )
}
