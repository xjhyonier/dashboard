import { useState } from 'react'
import type { QueueTask } from '../mock'

interface Props {
  task: QueueTask | null
  isOpen: boolean
  onClose: () => void
  onRecordIssue: (dimension: string, issue: AiIssue) => void
}

interface AiIssue {
  id: string
  title: string
  description: string
  // 问题状态流转：pending -> recorded -> converted_todo / ignored
  status: 'pending' | 'recorded' | 'converted_todo' | 'ignored'
  linkedTodoId?: string   // 关联的待办ID
  detectedAt?: string    // AI识别时间
  processedAt?: string   // 处理时间
  processedBy?: string   // 处理人
}

interface AiDimension {
  id: number
  name: string
  status: 'pass' | 'fail'
  summary: string
  issues?: AiIssue[]
}

// Mock AI 评估详情数据
const MOCK_AI_REPORT: AiDimension[] = [
  {
    id: 1,
    name: '制度建设情况',
    status: 'fail',
    summary: '以下企业安全制度需要完善',
    issues: [
      { id: 'i1', title: '各岗位人员消防管理责任', description: '当前制度待完善', status: 'converted_todo', linkedTodoId: 'TD-2026040501', detectedAt: '2026-04-05 04:30', processedAt: '2026-04-05 10:30', processedBy: '李明辉' },
      { id: 'i2', title: '部门间消防安全责任书', description: '当前制度待完善', status: 'converted_todo', linkedTodoId: 'TD-2026040502', detectedAt: '2026-04-05 04:30', processedAt: '2026-04-05 10:30', processedBy: '李明辉' },
      { id: 'i3', title: 'XXX部消防安全责任书（部门-员工）', description: '当前制度待完善', status: 'ignored', detectedAt: '2026-04-05 04:30', processedAt: '2026-04-05 10:35', processedBy: '李明辉' },
      { id: 'i4', title: '一般单位和九小场所消防安全承诺书', description: '当前制度待完善', status: 'pending', detectedAt: '2026-04-05 04:30' },
    ],
  },
  {
    id: 2,
    name: '风险点辨识情况',
    status: 'pass',
    summary: '未发现企业有缺失的风险点',
  },
  {
    id: 3,
    name: '检查计划制定情况',
    status: 'fail',
    summary: '未制定检查计划',
    issues: [
      { id: 'i5', title: '季度检查计划缺失', description: '2026年Q2检查计划未制定', status: 'pending', detectedAt: '2026-04-05 04:30' },
    ],
  },
  {
    id: 4,
    name: '检查计划执行情况',
    status: 'fail',
    summary: '未执行检查计划',
    issues: [
      { id: 'i6', title: '3月份检查未执行', description: '计划内3项检查均未完成', status: 'pending', detectedAt: '2026-04-02 09:15' },
    ],
  },
  {
    id: 5,
    name: '隐患整改情况',
    status: 'fail',
    summary: '以下隐患需要整改',
    issues: [
      { id: 'i7', title: '灭火器喷嘴损坏', description: '整改前的灭火器喷嘴有明显破损，整改后的照片显示已更换', status: 'converted_todo', linkedTodoId: 'TD-2026040503', detectedAt: '2026-04-03 14:20', processedAt: '2026-04-05 11:00', processedBy: '李明辉' },
      { id: 'i8', title: '从业人员未掌握"一懂三会"', description: '整改前后照片内容完全相同，显示同一个人在相同位置，未实际整改', status: 'pending', detectedAt: '2026-04-05 04:30' },
    ],
  },
]

export function AiEvaluationModal({ task, isOpen, onClose, onRecordIssue }: Props) {
  const [dimensions, setDimensions] = useState<AiDimension[]>(MOCK_AI_REPORT)
  const [expandedDimension, setExpandedDimension] = useState<number | null>(1)
  const [showBatchConfirm, setShowBatchConfirm] = useState(false)
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  if (!isOpen || !task) return null

  // 显示 Toast 提示
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  // 打开批量确认弹层
  const openBatchConfirm = () => {
    // 默认全选所有待处理问题
    const pendingIds = new Set<string>()
    dimensions.forEach(d => {
      d.issues?.filter(i => i.status === 'pending').forEach(i => pendingIds.add(i.id))
    })
    setSelectedIssueIds(pendingIds)
    setShowBatchConfirm(true)
  }

  // 切换问题勾选状态
  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds(prev => {
      const next = new Set(prev)
      if (next.has(issueId)) {
        next.delete(issueId)
      } else {
        next.add(issueId)
      }
      return next
    })
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIssueIds.size === pendingCount) {
      setSelectedIssueIds(new Set())
    } else {
      const pendingIds = new Set<string>()
      dimensions.forEach(d => {
        d.issues?.filter(i => i.status === 'pending').forEach(i => pendingIds.add(i.id))
      })
      setSelectedIssueIds(pendingIds)
    }
  }

  // 确认批量转待办
  const confirmBatchConvert = () => {
    if (selectedIssueIds.size === 0) {
      showToast('请至少选择一个问题', 'error')
      return
    }

    let converted = 0
    setDimensions(prev => prev.map(d => {
      return {
        ...d,
        issues: d.issues?.map(i => {
          if (!selectedIssueIds.has(i.id)) return i
          if (i.status !== 'pending') return i
          converted++
          return {
            ...i,
            status: 'converted_todo' as const,
            linkedTodoId: `TD-${Date.now()}-${i.id}`,
            processedAt: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-'),
            processedBy: '李明辉'
          }
        })
      }
    }))

    setShowBatchConfirm(false)
    showToast(`已成功创建 ${converted} 条待办任务`)
  }

  // 获取所有待处理问题（用于批量确认弹层）
  const getPendingIssues = () => {
    const items: { dimensionId: number; dimensionName: string; issue: AiIssue }[] = []
    dimensions.forEach(d => {
      d.issues?.filter(i => i.status === 'pending').forEach(i => {
        items.push({ dimensionId: d.id, dimensionName: d.name, issue: i })
      })
    })
    return items
  }

  // 计算相对时间
  const getRelativeTime = (dateStr: string): string => {
    const now = new Date('2026-04-05 12:00:00') // 模拟当前时间
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays}天前`
    return `${diffDays}天前`
  }

  const handleRecordIssue = (dimensionId: number, issue: AiIssue) => {
    setDimensions(prev => prev.map(d => {
      if (d.id !== dimensionId) return d
      return {
        ...d,
        issues: d.issues?.map(i => i.id === issue.id ? {
          ...i,
          status: 'recorded' as const,
          processedAt: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-'),
          processedBy: '李明辉'
        } : i),
      }
    }))
    onRecordIssue(dimensions.find(d => d.id === dimensionId)?.name || '', issue)
  }

  const handleConvertToTodo = (dimensionId: number, issue: AiIssue) => {
    const todoId = `TD-${Date.now()}`
    setDimensions(prev => prev.map(d => {
      if (d.id !== dimensionId) return d
      return {
        ...d,
        issues: d.issues?.map(i => i.id === issue.id ? {
          ...i,
          status: 'converted_todo' as const,
          linkedTodoId: todoId,
          processedAt: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-'),
          processedBy: '李明辉'
        } : i),
      }
    }))
  }

  const handleIgnore = (dimensionId: number, issue: AiIssue) => {
    setDimensions(prev => prev.map(d => {
      if (d.id !== dimensionId) return d
      return {
        ...d,
        issues: d.issues?.map(i => i.id === issue.id ? {
          ...i,
          status: 'ignored' as const,
          processedAt: new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-'),
          processedBy: '李明辉'
        } : i),
      }
    }))
  }

  // 统计：待处理、已转待办、已忽略
  const pendingCount = dimensions.reduce((sum, d) => sum + (d.issues?.filter(i => i.status === 'pending').length || 0), 0)
  const convertedCount = dimensions.reduce((sum, d) => sum + (d.issues?.filter(i => i.status === 'converted_todo').length || 0), 0)
  const ignoredCount = dimensions.reduce((sum, d) => sum + (d.issues?.filter(i => i.status === 'ignored').length || 0), 0)
  const totalIssues = dimensions.reduce((sum, d) => sum + (d.issues?.length || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* 浮层 */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-800">AI安全报告详情</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            关闭
          </button>
        </div>

        {/* 企业信息 */}
        <div className="px-6 py-4 bg-zinc-50/50 border-b border-zinc-100">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-base font-semibold text-zinc-800">「{task.enterpriseName}」AI安全报告</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">不合格</span>
            <span className="text-zinc-500">AI分析时间：2026-04-05 04:37:43</span>
            <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
              重新生成AI安全报告
            </button>
          </div>
        </div>

        {/* 统计栏 */}
        <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-zinc-600">
              共发现 <span className="font-semibold text-zinc-800">{totalIssues}</span> 项问题
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-zinc-500">待处理 <span className="font-medium text-zinc-700">{pendingCount}</span></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-500">已转待办 <span className="font-medium text-zinc-700">{convertedCount}</span></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
              <span className="text-zinc-500">已忽略 <span className="font-medium text-zinc-700">{ignoredCount}</span></span>
            </span>
          </div>
          {pendingCount > 0 && (
            <button
              onClick={openBatchConfirm}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              批量转待办 ({pendingCount})
            </button>
          )}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {dimensions.map((dimension) => (
            <div
              key={dimension.id}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                dimension.status === 'fail' ? 'border-red-200 bg-red-50/30' : 'border-zinc-200 bg-zinc-50/30'
              }`}
            >
              {/* 维度标题 */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => setExpandedDimension(expandedDimension === dimension.id ? null : dimension.id)}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    dimension.status === 'fail' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {dimension.id}
                  </span>
                  <div>
                    <span className="font-medium text-zinc-800">{dimension.name}</span>
                    <div className={`text-xs mt-0.5 ${dimension.status === 'fail' ? 'text-red-600' : 'text-green-600'}`}>
                      {dimension.status === 'fail' ? (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {dimension.summary}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {dimension.summary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dimension.issues && dimension.issues.length > 0 && (
                    <span className="text-xs text-zinc-400">{dimension.issues.length}项问题</span>
                  )}
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className={`text-zinc-400 transition-transform duration-200 ${expandedDimension === dimension.id ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* 展开内容 */}
              {expandedDimension === dimension.id && dimension.issues && dimension.issues.length > 0 && (
                <div className="border-t border-zinc-200/60 px-4 py-3">
                  {/* 表头 */}
                  <div className="grid grid-cols-[1fr_100px_80px_120px_80px] gap-3 mb-2 text-xs text-zinc-500 font-medium px-3">
                    <div>问题描述</div>
                    <div className="text-center">待办ID</div>
                    <div className="text-center">识别时间</div>
                    <div className="text-center">状态</div>
                    <div className="text-center">操作</div>
                  </div>

                  {/* 问题列表 */}
                  <div className="space-y-2">
                    {dimension.issues.map((issue) => {
                      const statusConfig = {
                        pending: { bg: 'bg-white border border-zinc-100', badge: 'bg-amber-50 text-amber-600 border-amber-200', label: '待处理', icon: null },
                        recorded: { bg: 'bg-blue-50/50 border border-blue-100/50', badge: 'bg-blue-50 text-blue-600 border-blue-200', label: '已记录', icon: null },
                        converted_todo: { bg: 'bg-emerald-50/50 border border-emerald-100/50', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: '已转待办', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        ignored: { bg: 'bg-zinc-50/50 border border-zinc-100/50', badge: 'bg-zinc-100 text-zinc-500 border-zinc-200', label: '已忽略', icon: 'M6 18L18 6M6 6l12 12' },
                      }
                      const cfg = statusConfig[issue.status]

                      return (
                        <div
                          key={issue.id}
                          className={`grid grid-cols-[1fr_100px_80px_120px_80px] gap-3 items-center py-2.5 px-3 rounded-lg ${cfg.bg}`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-zinc-700 truncate">{issue.title}</div>
                            <div className="text-xs text-zinc-500 mt-0.5 truncate">{issue.description}</div>
                          </div>
                          <div className="text-center">
                            {issue.linkedTodoId ? (
                              <span className="text-xs text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap">{issue.linkedTodoId}</span>
                            ) : (
                              <span className="text-xs text-zinc-300">-</span>
                            )}
                          </div>
                          <div className="text-center">
                            {issue.detectedAt ? (
                              <span className={`text-xs ${getRelativeTime(issue.detectedAt).includes('天') ? 'text-amber-600 font-medium' : 'text-zinc-500'}`}>
                                {getRelativeTime(issue.detectedAt)}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-300">-</span>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${cfg.badge}`}>
                              {cfg.icon && (
                                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                                </svg>
                              )}
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex justify-center gap-1.5">
                            {issue.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleConvertToTodo(dimension.id, issue)}
                                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors whitespace-nowrap"
                                  title="转为待办"
                                >
                                  转待办
                                </button>
                                <button
                                  onClick={() => handleIgnore(dimension.id, issue)}
                                  className="flex items-center justify-center w-7 h-7 border border-zinc-300 text-zinc-500 hover:bg-zinc-100 rounded text-xs transition-colors"
                                  title="忽略"
                                >
                                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {issue.status === 'converted_todo' && (
                              <button
                                className="flex items-center gap-1 px-2 py-1 border border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded text-xs font-medium transition-colors whitespace-nowrap"
                              >
                                查看
                              </button>
                            )}
                            {issue.status === 'ignored' && (
                              <button
                                onClick={() => handleRecordIssue(dimension.id, issue)}
                                className="flex items-center gap-1 px-2 py-1 border border-zinc-300 text-zinc-500 hover:bg-zinc-100 rounded text-xs font-medium transition-colors"
                              >
                                恢复
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400">
              AI评估基于企业上传的安全资料自动生成
            </span>
            {convertedCount > 0 && (
              <span className="text-xs text-emerald-600">
                已生成 {convertedCount} 条待办
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pendingCount === 0 && convertedCount > 0 ? (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                完成确认
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 批量转待办确认弹层 */}
      {showBatchConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowBatchConfirm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* 确认弹层头部 */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-800">确认批量转待办</h3>
              <button
                onClick={() => setShowBatchConfirm(false)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 确认弹层内容 */}
            <div className="px-6 py-4 max-h-[60vh] overflow-auto">
              <p className="text-sm text-zinc-600 mb-4">
                将为您创建 <span className="font-semibold text-zinc-800">{pendingCount}</span> 条待办任务（可取消勾选不需要的）：
              </p>

              {/* 全选栏 */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
                <button
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedIssueIds.size === pendingCount
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-zinc-300 hover:border-blue-400'
                  }`}
                >
                  {selectedIssueIds.size === pendingCount && (
                    <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-zinc-700 font-medium">全选</span>
                <span className="text-xs text-zinc-400 ml-auto">已选 {selectedIssueIds.size} / {pendingCount}</span>
              </div>

              {/* 问题列表 */}
              <div className="space-y-3">
                {getPendingIssues().map(({ dimensionId, dimensionName, issue }) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <button
                      onClick={() => toggleIssueSelection(issue.id)}
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedIssueIds.has(issue.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-zinc-300 hover:border-blue-400'
                      }`}
                    >
                      {selectedIssueIds.has(issue.id) && (
                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">
                          {dimensionName}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-zinc-700">{issue.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">{issue.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 确认弹层底部 */}
            <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                转待办后可继续在"我的待办"中查看和跟进
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBatchConfirm(false)}
                  className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmBatchConvert}
                  disabled={selectedIssueIds.size === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  确认转待办 ({selectedIssueIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-fade-in-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
