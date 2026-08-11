import { useState } from 'react'
import type { Hazard } from '../types'
import { getRiskScoreColor, formatDate, getHazardStatusLabel } from '../utils/helpers'

interface HazardKanbanProps {
  hazards: Hazard[]
  onAction?: (hazard: Hazard, action: string) => void
}

const KANBAN_COLUMNS: Array<{
  key: string
  title: string
  statuses: string[]
  bgColor: string
}> = [
  { key: 'pending', title: '待下发', statuses: ['pending_issue', 'issued'], bgColor: 'bg-slate-50' },
  { key: 'rectifying', title: '整改中', statuses: ['rectifying'], bgColor: 'bg-orange-50' },
  { key: 'review', title: '待复核', statuses: ['pending_review'], bgColor: 'bg-purple-50' },
  { key: 'closed', title: '已闭环', statuses: ['closed'], bgColor: 'bg-green-50' },
]

export function HazardKanban({ hazards, onAction }: HazardKanbanProps) {
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null)

  const getActionButton = (hazard: Hazard) => {
    switch (hazard.status) {
      case 'pending_issue':
      case 'issued':
        return <button onClick={() => onAction?.(hazard, 'issue')} className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90">下发给企业</button>
      case 'rectifying':
        return (
          <div className="flex gap-1">
            <button onClick={() => onAction?.(hazard, 'view_progress')} className="px-3 py-1 text-xs font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50">查看进度</button>
            <button onClick={() => onAction?.(hazard, 'follow_up')} className="px-3 py-1 text-xs font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50">跟进</button>
          </div>
        )
      case 'pending_review':
        return (
          <div className="flex gap-1">
            <button onClick={() => onAction?.(hazard, 'pass')} className="px-3 py-1 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90">验收通过</button>
            <button onClick={() => onAction?.(hazard, 'fail')} className="px-3 py-1 text-xs font-medium text-white bg-danger rounded-md hover:bg-danger/90">不通过</button>
          </div>
        )
      case 'closed':
        return <button onClick={() => onAction?.(hazard, 'view_detail')} className="px-3 py-1 text-xs font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50">查看详情</button>
      default:
        return null
    }
  }

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* 隐患看板 */}
      <div className="grid grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => {
          const colHazards = hazards.filter(h => col.statuses.includes(h.status))
          return (
            <div key={col.key}>
              <div className={`rounded-t-lg px-4 py-2.5 ${col.bgColor} border border-border border-b-0`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">{col.title}</span>
                  <span className="text-xs text-text-tertiary bg-white px-2 py-0.5 rounded-full">
                    {colHazards.length}
                  </span>
                </div>
              </div>
              <div className="rounded-b-lg border border-border bg-white space-y-3 p-3 min-h-[200px]">
                {colHazards.map((hazard) => {
                  const statusInfo = getHazardStatusLabel(hazard.status)
                  const overdue = isOverdue(hazard.rectifyDeadline)
                  return (
                    <div
                      key={hazard.id}
                      onClick={() => setSelectedHazard(hazard)}
                      className="card-compact cursor-pointer hover:shadow-md transition-shadow"
                    >
                      {/* 隐患等级 Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`
                          text-xs font-medium px-2 py-0.5 rounded
                          ${hazard.level === 'major'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                          }
                        `}>
                          {hazard.level === 'major' ? '重大' : '一般'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* 隐患描述 */}
                      <p className="text-sm text-text line-clamp-2 mb-2">
                        {hazard.description}
                      </p>

                      {/* 对应板块 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-text-tertiary rounded">
                          {hazard.board}
                        </span>
                      </div>

                      {/* 安管员 + 期限 */}
                      <div className="flex items-center justify-between text-xs text-text-tertiary">
                        {hazard.assignedTo && <span>{hazard.assignedTo}</span>}
                        {hazard.rectifyDeadline && (
                          <span className={overdue ? 'text-danger font-medium' : ''}>
                            {formatDate(hazard.rectifyDeadline)}
                          </span>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-3 flex justify-end">
                        {getActionButton(hazard)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 隐患详情弹窗 */}
      {selectedHazard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedHazard(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">隐患详情</h3>
                <button onClick={() => setSelectedHazard(null)} className="text-text-tertiary hover:text-text">&times;</button>
              </div>

              <div className="space-y-4">
                {/* 基本信息 */}
                <div className="card-compact">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-tertiary">隐患描述</span>
                      <p className="text-text mt-1">{selectedHazard.description}</p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">隐患位置</span>
                      <p className="text-text mt-1">{selectedHazard.location}</p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">隐患等级</span>
                      <p className="mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${selectedHazard.level === 'major' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                          {selectedHazard.level === 'major' ? '重大' : '一般'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">对应板块</span>
                      <p className="text-text mt-1">{selectedHazard.board}</p>
                    </div>
                    <div>
                      <span className="text-text-tertiary">创建时间</span>
                      <p className="text-text mt-1">{formatDate(selectedHazard.createdAt)}</p>
                    </div>
                    {selectedHazard.rectifyDeadline && (
                      <div>
                        <span className="text-text-tertiary">整改期限</span>
                        <p className={`mt-1 ${isOverdue(selectedHazard.rectifyDeadline) ? 'text-danger font-medium' : 'text-text'}`}>
                          {formatDate(selectedHazard.rectifyDeadline)}
                          {isOverdue(selectedHazard.rectifyDeadline) && ' (已逾期)'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 状态流转时间线 */}
                <div className="card-compact">
                  <h4 className="text-sm font-medium text-text-secondary mb-3">状态流转</h4>
                  <div className="space-y-2 text-sm">
                    {selectedHazard.createdAt && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-text-tertiary">{formatDate(selectedHazard.createdAt)}</span>
                        <span className="text-text">创建</span>
                      </div>
                    )}
                    {selectedHazard.issuedAt && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <span className="text-text-tertiary">{formatDate(selectedHazard.issuedAt)}</span>
                        <span className="text-text">下发</span>
                      </div>
                    )}
                    {selectedHazard.rectifyingAt && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-text-tertiary">{formatDate(selectedHazard.rectifyingAt)}</span>
                        <span className="text-text">开始整改</span>
                      </div>
                    )}
                    {selectedHazard.reviewAt && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-text-tertiary">{formatDate(selectedHazard.reviewAt)}</span>
                        <span className="text-text">复核 {selectedHazard.reviewResult === 'pass' ? '(通过)' : selectedHazard.reviewResult === 'fail' ? '(不通过)' : ''}</span>
                      </div>
                    )}
                    {selectedHazard.closedAt && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-text-tertiary">{formatDate(selectedHazard.closedAt)}</span>
                        <span className="text-text">闭环</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 复核结果 */}
                {selectedHazard.reviewResult && (
                  <div className="card-compact">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">复核结果</h4>
                    <p className={`text-sm font-medium ${selectedHazard.reviewResult === 'pass' ? 'text-success' : 'text-danger'}`}>
                      {selectedHazard.reviewResult === 'pass' ? '通过' : '不通过'}
                    </p>
                    {selectedHazard.reviewReason && (
                      <p className="text-sm text-text-tertiary mt-1">{selectedHazard.reviewReason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
