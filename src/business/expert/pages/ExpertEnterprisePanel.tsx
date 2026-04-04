import { useState } from 'react'
import { PageShell, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TableCard, TrendCard } from '../../../components/widgets'
import { EnterpriseHeader } from '../components/EnterpriseHeader'
import { RiskRadar } from '../components/RiskRadar'
import { TabPanel } from '../components/TabPanel'
import { HazardKanban } from '../components/HazardKanban'
import { ServiceTimeline } from '../components/ServiceTimeline'
import { QuickRecord } from '../components/QuickRecord'
import expertMock from '../mock'
import type { Hazard } from '../types'
import { getRiskScoreColor, formatDateTime, getHazardStatusLabel } from '../utils/helpers'

interface ExpertEnterprisePanelProps {
  enterpriseId: string
  onBack?: () => void
}

export function ExpertEnterprisePanel({ enterpriseId, onBack }: ExpertEnterprisePanelProps) {
  const [activeBoard, setActiveBoard] = useState<string | undefined>(undefined)
  const [showAnnotationModal, setShowAnnotationModal] = useState(false)
  const [annotationBoard, setAnnotationBoard] = useState<string>('')
  const [annotationScore, setAnnotationScore] = useState(50)
  const [annotationAgreement, setAnnotationAgreement] = useState<'agree' | 'disagree'>('agree')
  const [annotationReason, setAnnotationReason] = useState('')
  const [hazardView, setHazardView] = useState<'kanban' | 'list'>('kanban')

  const enterprise = expertMock.enterprises.find(e => e.id === enterpriseId)
  if (!enterprise) {
    return <PageShell><div className="text-center py-20 text-text-tertiary">企业不存在</div></PageShell>
  }

  const enterpriseHazards = expertMock.hazards.filter(h => h.enterpriseId === enterpriseId)
  const enterpriseRecords = expertMock.serviceRecords.filter(r => r.enterpriseId === enterpriseId)
  const enterpriseAnnotations = expertMock.annotations.filter(a => a.enterpriseId === enterpriseId)
  const openHazards = enterpriseHazards.filter(h => h.status !== 'closed')

  // AI看 Tab - 板块异常明细
  const allAnomalies = enterprise.boardScores.flatMap(bs =>
    bs.anomalies.map(a => ({ ...a, boardScore: bs.score }))
  )
  const filteredAnomalies = activeBoard
    ? allAnomalies.filter(a => a.board === activeBoard)
    : allAnomalies

  // 风险趋势数据
  const trendData = (enterprise.aiInsight?.trend || []).map(t => ({ label: t.month.replace('2026-', ''), value: t.score }))

  // 标注弹窗
  const openAnnotation = (board: string) => {
    const bs = enterprise.boardScores.find(b => b.board === board)
    setAnnotationBoard(board)
    setAnnotationScore(bs?.score ?? 50)
    setAnnotationAgreement('agree')
    setAnnotationReason('')
    setShowAnnotationModal(true)
  }

  const submitAnnotation = () => {
    alert(`标注已保存：${annotationBoard} - ${annotationScore}分 - ${annotationAgreement === 'agree' ? '同意' : '不同意'}`)
    setShowAnnotationModal(false)
  }

  // 隐患操作
  const handleHazardAction = (hazard: any, action: string) => {
    alert(`Demo: ${action} - ${hazard.description}`)
  }

  // 快速记录
  const handleQuickRecord = (data: { content: string; type: any; relatedHazardId?: string }) => {
    alert(`记录已保存：${data.content}`)
  }

  // Tab 定义
  const tabs = [
    {
      key: 'ai',
      label: 'AI看',
      children: (
        <div className="space-y-6">
          {/* AI 洞察摘要 */}
          {enterprise.aiInsight && (
            <div className="card">
              <h4 className="text-sm font-medium text-text-secondary mb-3">AI 风险摘要</h4>
              <p className="text-base leading-relaxed text-text">{enterprise.aiInsight.summary}</p>

              {enterprise.aiInsight.suggestions.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-text-secondary mb-3">建议行动</h5>
                  <div className="space-y-2">
                    {enterprise.aiInsight.suggestions.map((s, i) => (
                      <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <span className="text-sm font-medium text-text-tertiary shrink-0">{i + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-text">{s.action}</p>
                          <span className="text-xs text-text-tertiary">{s.relatedBoard}</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openAnnotation(s.relatedBoard)} className="px-2 py-1 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/5">标注</button>
                          <button className="px-2 py-1 text-xs font-medium text-text-secondary border border-border rounded hover:bg-slate-50">去处理</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 板块异常明细表 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-text-secondary">板块异常明细</h4>
              {activeBoard && (
                <button onClick={() => setActiveBoard(undefined)} className="text-xs text-primary hover:text-primary/80">清除筛选</button>
              )}
            </div>
            {filteredAnomalies.length > 0 ? (
              <div className="space-y-2">
                {filteredAnomalies.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-slate-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-text-secondary rounded shrink-0">{a.board}</span>
                      <span className="text-sm text-text truncate">{a.description}</span>
                      <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${a.severity === 'critical' ? 'bg-red-100 text-red-700' : a.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.severity === 'critical' ? '严重' : a.severity === 'high' ? '高' : '中'}
                      </span>
                    </div>
                    <button onClick={() => openAnnotation(a.board)} className="px-3 py-1 text-xs font-medium text-primary border border-primary/30 rounded hover:bg-primary/5 shrink-0 ml-3">
                      标注
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-text-tertiary">暂无异常项</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'archive',
      label: '一企一档',
      children: (
        <div className="space-y-6">
          {/* 企业基础信息 */}
          <div className="card">
            <h4 className="text-sm font-medium text-text-secondary mb-4">企业基础信息</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-text-tertiary">企业名称</span><p className="text-text mt-1 font-medium">{enterprise.name}</p></div>
              <div><span className="text-text-tertiary">所属行业</span><p className="text-text mt-1">{enterprise.industry}</p></div>
              <div><span className="text-text-tertiary">企业规模</span><p className="text-text mt-1">{enterprise.scale}</p></div>
              <div><span className="text-text-tertiary">地址</span><p className="text-text mt-1">{enterprise.address}</p></div>
              <div><span className="text-text-tertiary">安全负责人</span><p className="text-text mt-1">{enterprise.contactName} ({enterprise.contactPhone})</p></div>
              <div><span className="text-text-tertiary">安管员</span><p className="text-text mt-1">{enterprise.safetyOfficer} ({enterprise.safetyOfficerPhone})</p></div>
            </div>
          </div>

          {/* 历史隐患统计 */}
          <GridLayout columns={4}>
            <KpiCard title="总隐患数" value={enterpriseHazards.length} />
            <KpiCard title="已闭环" value={enterpriseHazards.filter(h => h.status === 'closed').length} />
            <KpiCard title="整改中" value={enterpriseHazards.filter(h => h.status === 'rectifying').length} />
            <KpiCard title="待处理" value={enterpriseHazards.filter(h => ['pending_issue', 'issued', 'pending_review'].includes(h.status)).length} />
          </GridLayout>

          {/* 安全评分趋势 */}
          {trendData.length > 0 && (
            <TrendCard title="安全评分趋势（近6个月）" currentValue={trendData[trendData.length - 1]?.value} data={trendData} trend={trendData[trendData.length - 1]?.value > trendData[0]?.value ? 'up' : 'down'} />
          )}

          {/* 检查记录 */}
          <div className="card">
            <h4 className="text-sm font-medium text-text-secondary mb-4">检查记录</h4>
            <ServiceTimeline records={enterpriseRecords} compact />
          </div>
        </div>
      ),
    },
    {
      key: 'hazards',
      label: '隐患单',
      badge: openHazards.length || undefined,
      children: (
        <div>
          {/* 视图切换 */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setHazardView('kanban')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${hazardView === 'kanban' ? 'bg-white text-primary shadow-sm' : 'text-text-tertiary'}`}
              >看板视图</button>
              <button
                onClick={() => setHazardView('list')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${hazardView === 'list' ? 'bg-white text-primary shadow-sm' : 'text-text-tertiary'}`}
              >列表视图</button>
            </div>
          </div>

          {hazardView === 'kanban' ? (
            <HazardKanban hazards={enterpriseHazards} onAction={handleHazardAction} />
          ) : (
            <TableCard
              title=""
              columns={[
                { key: 'level', label: '等级', width: '80px' },
                { key: 'description', label: '描述' },
                { key: 'board', label: '板块', width: '100px' },
                { key: 'status', label: '状态', width: '100px' },
                { key: 'assignedTo', label: '指派', width: '100px' },
                { key: 'deadline', label: '截止', width: '120px' },
              ]}
              data={enterpriseHazards.map(h => {
                const statusInfo = getHazardStatusLabel(h.status)
                return {
                  level: <span className={`text-xs font-medium px-2 py-0.5 rounded ${h.level === 'major' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{h.level === 'major' ? '重大' : '一般'}</span>,
                  description: h.description,
                  board: <span className="text-xs px-2 py-0.5 bg-slate-100 text-text-tertiary rounded">{h.board}</span>,
                  status: <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusInfo.color}`}>{statusInfo.label}</span>,
                  assignedTo: h.assignedTo || '--',
                  deadline: h.rectifyDeadline ? formatDateTime(h.rectifyDeadline) : '--',
                }
              })}
            />
          )}
        </div>
      ),
    },
    {
      key: 'records',
      label: '服务记录',
      children: (
        <div className="space-y-6">
          {/* 快速记录 */}
          <QuickRecord
            onSubmit={handleQuickRecord}
            relatedHazards={openHazards.map(h => ({ id: h.id, description: h.description }))}
          />
          {/* 记录时间线 */}
          <div className="card">
            <h4 className="text-sm font-medium text-text-secondary mb-4">服务记录</h4>
            <ServiceTimeline records={enterpriseRecords} />
          </div>
        </div>
      ),
    },
    {
      key: 'annotations',
      label: '历史标注',
      badge: enterpriseAnnotations.length || undefined,
      children: (
        <div className="card">
          {enterpriseAnnotations.length > 0 ? (
            <TableCard
              title=""
              columns={[
                { key: 'time', label: '时间', width: '140px' },
                { key: 'board', label: '板块', width: '100px' },
                { key: 'aiScore', label: 'AI分', width: '80px' },
                { key: 'expertScore', label: '我的分', width: '80px' },
                { key: 'result', label: '结果', width: '80px' },
                { key: 'reason', label: '理由' },
              ]}
              data={enterpriseAnnotations.map(a => ({
                time: formatDateTime(a.annotatedAt),
                board: <span className="text-xs px-2 py-0.5 bg-slate-100 text-text-secondary rounded">{a.board === 'overall' ? '综合' : a.board}</span>,
                aiScore: <span className={`font-medium ${getRiskScoreColor(a.aiScore)}`}>{a.aiScore}</span>,
                expertScore: <span className={`font-medium ${getRiskScoreColor(a.expertScore)}`}>{a.expertScore}</span>,
                result: <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.agreement === 'agree' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{a.agreement === 'agree' ? '同意' : '不同意'}</span>,
                reason: a.reason || '--',
              }))}
            />
          ) : (
            <div className="text-center py-8 text-sm text-text-tertiary">暂无标注记录</div>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageShell maxWidth="wide">
      {/* 返回按钮 + 企业头部 */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-text-tertiary hover:text-primary transition-colors mb-4"
        >
          <span>&larr;</span>
          <span>返回驾驶舱</span>
        </button>
        <EnterpriseHeader enterprise={enterprise} onVideoWatch={() => alert(`正在打开 ${enterprise.name} 视频监控...`)} onSiteVisit={() => alert(`已标记 ${enterprise.name} 为需要现场检查`)} />
      </div>

      {/* 风险雷达 */}
      <SectionBlock>
        <RiskRadar
          boardScores={enterprise.boardScores}
          onBoardClick={(board) => setActiveBoard(activeBoard === board ? undefined : board)}
          activeBoard={activeBoard}
        />
      </SectionBlock>

      {/* Tab 面板 */}
      <SectionBlock>
        <TabPanel tabs={tabs} defaultTab="ai" />
      </SectionBlock>

      {/* 标注操作弹窗 */}
      {showAnnotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowAnnotationModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text">标注评级</h3>
                <button onClick={() => setShowAnnotationModal(false)} className="text-text-tertiary hover:text-text text-xl">&times;</button>
              </div>

              <div className="space-y-5">
                <div>
                  <span className="text-sm text-text-tertiary">板块</span>
                  <p className="text-text font-medium mt-1">{annotationBoard}</p>
                </div>
                <div>
                  <span className="text-sm text-text-tertiary">AI 分值</span>
                  <p className={`text-xl font-bold mt-1 ${getRiskScoreColor(enterprise.boardScores.find(b => b.board === annotationBoard)?.score ?? 50)}`}>
                    {enterprise.boardScores.find(b => b.board === annotationBoard)?.score ?? 50}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-text-tertiary block mb-2">专家分值</span>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min={0} max={100} value={annotationScore}
                      onChange={e => setAnnotationScore(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className={`text-xl font-bold w-12 text-right ${getRiskScoreColor(annotationScore)}`}>
                      {annotationScore}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-text-tertiary block mb-2">是否同意 AI 评级</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="agreement" checked={annotationAgreement === 'agree'} onChange={() => setAnnotationAgreement('agree')} className="accent-primary" />
                      <span className="text-sm text-text">同意</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="agreement" checked={annotationAgreement === 'disagree'} onChange={() => setAnnotationAgreement('disagree')} className="accent-primary" />
                      <span className="text-sm text-text">不同意</span>
                    </label>
                  </div>
                </div>
                {annotationAgreement === 'disagree' && (
                  <div>
                    <span className="text-sm text-text-tertiary block mb-2">调整理由 *</span>
                    <textarea
                      value={annotationReason}
                      onChange={e => setAnnotationReason(e.target.value)}
                      placeholder="请说明您调整评级的理由..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAnnotationModal(false)} className="px-4 py-2 text-sm font-medium text-text-secondary border border-border rounded-lg hover:bg-slate-50">
                  取消
                </button>
                <button
                  onClick={submitAnnotation}
                  disabled={annotationAgreement === 'disagree' && !annotationReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  提交标注
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}


