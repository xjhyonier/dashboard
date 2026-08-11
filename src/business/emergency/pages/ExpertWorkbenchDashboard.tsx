import { useState } from 'react'
import { PageShell, PageHeader, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { expertWorkbenchMock } from './mock/expert-workbench'

interface ServiceRecord {
  taskId: string
  enterprise: string
  type: 'phone' | 'wechat' | 'onsite'
  content: string
}

export function ExpertWorkbenchDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [serviceType, setServiceType] = useState<'phone' | 'wechat' | 'onsite'>('phone')
  const [serviceContent, setServiceContent] = useState('')

  const handleExecuteTask = (taskId: string, action: string) => {
    console.log(`执行任务: ${taskId}, 动作: ${action}`)
    alert(`开始执行: ${action}`)
  }

  const handleOpenServiceRecord = (task: any) => {
    setSelectedTask(task)
    setIsModalOpen(true)
    setServiceType('phone')
    setServiceContent('')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
    setServiceType('phone')
    setServiceContent('')
  }

  const handleConfirmServiceRecord = () => {
    const record: ServiceRecord = {
      taskId: selectedTask?.enterprise || '',
      enterprise: selectedTask?.enterprise || '',
      type: serviceType,
      content: serviceContent
    }
    console.log('记录服务:', record)
    handleCloseModal()
  }

  const renderActionButtons = (task: any) => {
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

    const serviceButton = {
      ...buttonStyle,
      background: '#10b981',
      color: 'white'
    }

    let actionButton

    switch (task.taskType) {
      case '现场检查':
        actionButton = (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始现场检查')}
          >
            开始检查
          </button>
        )
        break
      case 'AI看':
        actionButton = (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '启动AI分析')}
          >
            AI识别
          </button>
        )
        break
      case '视频看':
        actionButton = (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '打开视频监控')}
          >
            查看视频
          </button>
        )
        break
      case '整改复核':
        actionButton = (
          <button 
            style={primaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始现场复核')}
          >
            开始复核
          </button>
        )
        break
      case '日常检查':
        actionButton = (
          <button 
            style={secondaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始日常检查')}
          >
            开始检查
          </button>
        )
        break
      case '隐患复查':
        actionButton = (
          <button 
            style={secondaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '开始隐患复查')}
          >
            开始复查
          </button>
        )
        break
      default:
        actionButton = (
          <button 
            style={secondaryButton}
            onClick={() => handleExecuteTask(task.enterprise, '执行任务')}
          >
            执行
          </button>
        )
        break
    }

    return (
      <div className="flex gap-2">
        {actionButton}
        <button
          style={serviceButton}
          onClick={() => handleOpenServiceRecord(task)}
          aria-label="记录服务"
        >
          记录服务
        </button>
      </div>
    )
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

        <SectionBlock 
          title="待办任务清单"
          description="按优先级排序，点击按钮开始执行"
        >
          <GridLayout columns={2}>
            <SectionBlock title="主动巡查">
              <div className="space-y-3">
                {[...expertWorkbenchMock.pendingTasks]
                  .filter(task => task.category !== 'Follow-up')
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
                      {renderActionButtons(task)}
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>
            <SectionBlock title="跟进任务">
              <div className="space-y-3">
                {[...expertWorkbenchMock.pendingTasks]
                  .filter(task => task.category === 'Follow-up')
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
                      {renderActionButtons(task)}
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </GridLayout>
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

      {/* Service Recording Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-lg font-semibold text-text mb-4">
              记录服务 - {selectedTask?.enterprise}
            </h2>
            
            {/* Service Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                服务类型
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="serviceType"
                    value="phone"
                    checked={serviceType === 'phone'}
                    onChange={(e) => setServiceType(e.target.value as 'phone')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-text">电话</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="serviceType"
                    value="wechat"
                    checked={serviceType === 'wechat'}
                    onChange={(e) => setServiceType(e.target.value as 'wechat')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-text">微信</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="serviceType"
                    value="onsite"
                    checked={serviceType === 'onsite'}
                    onChange={(e) => setServiceType(e.target.value as 'onsite')}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-text">现场</span>
                </label>
              </div>
            </div>

            {/* Service Content */}
            <div className="mb-4">
              <label htmlFor="service-content" className="block text-sm font-medium text-text-secondary mb-2">
                服务内容
              </label>
              <textarea
                id="service-content"
                value={serviceContent}
                onChange={(e) => setServiceContent(e.target.value)}
                maxLength={200}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="请输入服务内容..."
              />
              <div className="text-right text-xs text-text-tertiary mt-1">
                {serviceContent.length}/200
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                取消
              </button>
              <button
                onClick={handleConfirmServiceRecord}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
