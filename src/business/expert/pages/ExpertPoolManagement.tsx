import { useState } from 'react'
import { PageShell, PageHeader, SectionBlock, GridLayout } from '../../../components/layout'
import expertMock from '../mock'
import { getRiskScoreColor, formatRelativeTime, getChangeTypeLabel } from '../utils/helpers'

export function ExpertPoolManagement() {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['wg-001']))

  const { workGroups, poolChanges } = expertMock

  const totalEnterprises = new Set(workGroups.flatMap(g => g.enterprises.map(e => e.enterpriseId))).size
  const overlapCount = workGroups.flatMap(g => g.enterprises.filter(e => e.overlapGroups.length > 0)).length

  const unreadCount = poolChanges.filter(c => !c.read).length

  const toggleGroup = (groupId: string) => {
    const next = new Set(expandedGroups)
    if (next.has(groupId)) next.delete(groupId)
    else next.add(groupId)
    setExpandedGroups(next)
  }

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="责任池管理" subtitle="工作组与企业分布" />

      {/* 责任池总览 */}
      <SectionBlock>
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <div className="text-sm text-text-secondary font-medium mb-1">总负责企业</div>
              <div className="text-4xl font-bold text-text">{totalEnterprises} <span className="text-lg font-normal text-text-tertiary">家</span></div>
            </div>
            <div className="flex-1" />
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-600 font-medium">{unreadCount} 条未读变动</span>
              </div>
            )}
          </div>

          <GridLayout columns={3}>
            {workGroups.map(g => (
              <div key={g.id} className="card-compact cursor-pointer hover:shadow-md transition-shadow" onClick={() => toggleGroup(g.id)}>
                <div className="text-sm font-medium text-text mb-2">{g.name}</div>
                <div className="text-2xl font-bold text-text">{g.enterpriseCount}</div>
                <div className="text-xs text-text-tertiary">家企业</div>
              </div>
            ))}
          </GridLayout>
          <p className="mt-3 text-xs text-text-tertiary">其中 {overlapCount} 家企业属于多个工作组</p>
        </div>
      </SectionBlock>

      {/* 工作组列表 */}
      <SectionBlock title="工作组列表">
        <div className="space-y-4">
          {workGroups.map(group => {
            const isExpanded = expandedGroups.has(group.id)
            return (
              <div key={group.id} className="card">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-text">{group.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">{group.enterpriseCount} 家</span>
                  </div>
                  <span className={`text-text-tertiary transition-transform ${isExpanded ? 'rotate-180' : ''}`}>&darr;</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4 space-y-2">
                    {group.enterprises.map(ent => (
                      <div key={ent.enterpriseId} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${ent.riskScore < 30 ? 'bg-red-500' : ent.riskScore < 60 ? 'bg-orange-500' : 'bg-green-500'}`} />
                          <span className="text-sm font-medium text-text">{ent.enterpriseName}</span>
                          {ent.overlapGroups.length > 0 && (
                            <div className="flex gap-1">
                              {ent.overlapGroups.map(g => (
                                <span key={g} className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">{g}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${getRiskScoreColor(ent.riskScore)}`}>{ent.riskScore}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SectionBlock>

      {/* 动态变动时间线 */}
      <SectionBlock title="动态变动">
        <div className="card">
          <div className="space-y-4">
            {poolChanges.map((change, index) => {
              const typeInfo = getChangeTypeLabel(change.type)
              return (
                <div key={change.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${change.read ? 'bg-slate-300' : 'bg-red-500'}`} />
                    {index < poolChanges.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-text-tertiary">{formatRelativeTime(change.changedAt)}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeInfo.color}`}>{typeInfo.label}</span>
                      {!change.read && <span className="text-xs text-danger font-medium">未读</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{change.enterpriseName}</span>
                      <span className="text-sm text-text-secondary">
                        {change.type === 'transferred_in' ? `从 ${change.fromExpert} 交接给您` :
                         change.type === 'transferred_out' ? `划转给 ${change.toExpert}` :
                         `加入 ${change.workGroup}`}
                      </span>
                    </div>
                    {(change.pendingItems.openHazards > 0 || change.pendingItems.openTodos > 0) && (
                      <div className="flex gap-3 mt-1 text-xs text-text-tertiary">
                        {change.pendingItems.openHazards > 0 && <span>未闭环隐患 {change.pendingItems.openHazards} 条</span>}
                        {change.pendingItems.openTodos > 0 && <span>未完成待办 {change.pendingItems.openTodos} 条</span>}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </SectionBlock>
    </PageShell>
  )
}
