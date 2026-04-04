import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TableCard } from '../../../components/widgets'
import { RiskRadar } from '../components/RiskRadar'
import expertMock from '../mock'
import type { RiskLevel } from '../types'
import { getRiskScoreColor } from '../utils/helpers'

export function ExpertRiskCenter() {
  const [annotationFilter, setAnnotationFilter] = useState('all')
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null)
  const [annotationScore, setAnnotationScore] = useState(50)
  const [annotationAgreement, setAnnotationAgreement] = useState<'agree' | 'disagree'>('agree')
  const [annotationReason, setAnnotationReason] = useState('')

  const { enterprises, annotations } = expertMock

  // 构建冲突列表
  const conflicts = enterprises.map(ent => {
    const boardComparison = ent.boardScores.map(bs => ({
      board: bs.board,
      aiScore: bs.score,
      expertScore: ent.expertRating ? Math.round(bs.score * (ent.expertRating / ent.riskScore)) : null,
    }))
    const history = annotations.filter(a => a.enterpriseId === ent.id)
    return {
      enterpriseId: ent.id,
      enterpriseName: ent.name,
      workGroup: ent.workGroups[0] || '',
      aiScore: ent.riskScore,
      expertScore: ent.expertRating,
      boardComparison,
      annotationHistory: history,
    }
  })

  let filteredConflicts = [...conflicts]
  if (annotationFilter === 'pending') filteredConflicts = filteredConflicts.filter(c => c.expertScore === undefined || c.expertScore === null)
  if (annotationFilter === 'done') filteredConflicts = filteredConflicts.filter(c => c.expertScore !== undefined && c.expertScore !== null)
  filteredConflicts.sort((a, b) => Math.abs((b.expertScore ?? 50) - b.aiScore) - Math.abs((a.expertScore ?? 50) - a.aiScore))

  const pendingCount = enterprises.filter(e => e.expertRating === undefined).length
  const annotatedCount = enterprises.filter(e => e.expertRating !== undefined).length
  const annotationRate = enterprises.length > 0 ? Math.round((annotatedCount / enterprises.length) * 100) : 0

  const openAnnotation = (entId: string) => {
    const ent = conflicts.find(c => c.enterpriseId === entId)
    if (!ent) return
    setSelectedConflict(entId)
    setAnnotationScore(ent.aiScore)
    setAnnotationAgreement('agree')
    setAnnotationReason('')
  }

  const submitAnnotation = () => {
    alert(`标注已保存：${annotationScore}分 - ${annotationAgreement === 'agree' ? '同意' : '不同意'}`)
    setSelectedConflict(null)
  }

  const selected = conflicts.find(c => c.enterpriseId === selectedConflict)

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="风险研判" subtitle="AI评级 vs 专家标注" />

      <FilterBar filters={[
        {
          key: 'status', label: '标注状态', type: 'tabs', value: annotationFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: '待标注', value: 'pending' },
            { label: '已标注', value: 'done' },
          ],
          onChange: setAnnotationFilter,
        },
      ]} />

      {/* 统计概览 */}
      <SectionBlock>
        <GridLayout columns={3}>
          <KpiCard title="待标注企业" value={pendingCount} description="需要专家评级的" />
          <KpiCard title="已标注" value={annotatedCount} description="已完成评级的" />
          <KpiCard title="标注率" value={annotationRate} unit="%" description={annotationRate >= 80 ? '表现优秀' : annotationRate >= 50 ? '继续努力' : '需加快推进'} />
        </GridLayout>
      </SectionBlock>

      <div className="grid grid-cols-3 gap-grid">
        {/* 冲突列表 */}
        <div className="col-span-2">
          <div className="card">
            <TableCard
              title="AI vs 专家评级对比"
              columns={[
                { key: 'rank', label: '#', width: '50px' },
                { key: 'name', label: '企业名称', width: '180px' },
                { key: 'aiScore', label: 'AI评分', width: '80px' },
                { key: 'expertScore', label: '专家评分', width: '80px' },
                { key: 'diff', label: '差值', width: '80px' },
                { key: 'status', label: '状态', width: '80px' },
                { key: 'action', label: '操作', width: '100px' },
              ]}
              data={filteredConflicts.map((c, i) => {
                const diff = c.expertScore !== undefined && c.expertScore !== null ? c.expertScore - c.aiScore : 0
                return {
                  rank: i + 1,
                  name: <span className="text-sm font-medium text-text">{c.enterpriseName}</span>,
                  aiScore: <span className={`font-medium ${getRiskScoreColor(c.aiScore)}`}>{c.aiScore}</span>,
                  expertScore: c.expertScore !== undefined && c.expertScore !== null
                    ? <span className={`font-medium ${getRiskScoreColor(c.expertScore)}`}>{c.expertScore}</span>
                    : <span className="text-text-tertiary">--</span>,
                  diff: c.expertScore !== undefined && c.expertScore !== null
                    ? <span className={`font-medium ${diff > 0 ? 'text-orange-500' : diff < 0 ? 'text-green-500' : 'text-text-tertiary'}`}>{diff > 0 ? '+' : ''}{diff}</span>
                    : <span className="text-text-tertiary">--</span>,
                  status: c.expertScore !== undefined && c.expertScore !== null
                    ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">已标注</span>
                    : <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">待标注</span>,
                  action: c.expertScore !== undefined && c.expertScore !== null
                    ? <button onClick={() => openAnnotation(c.enterpriseId)} className="px-3 py-1 text-xs font-medium text-text-secondary border border-border rounded hover:bg-slate-50">查看</button>
                    : <button onClick={() => openAnnotation(c.enterpriseId)} className="px-3 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90">标注</button>,
                }
              })}
            />
          </div>
        </div>

        {/* 标注操作面板 */}
        <div className="col-span-1">
          {selected ? (
            <div className="card sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-text-secondary">标注操作</h4>
                <button onClick={() => setSelectedConflict(null)} className="text-text-tertiary hover:text-text">&times;</button>
              </div>

              <h3 className="text-base font-semibold text-text mb-4">{selected.enterpriseName}</h3>

              {/* 雷达图 */}
              <RiskRadar
                boardScores={selected.boardComparison.map(b => ({ board: b.board, score: b.expertScore ?? b.aiScore, anomalyCount: 0, anomalies: [] }))}
              />

              {/* 评分调整 */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-tertiary">AI 综合评分</span>
                  <span className={`text-lg font-bold ${getRiskScoreColor(selected.aiScore)}`}>{selected.aiScore}</span>
                </div>
                <div>
                  <span className="text-sm text-text-tertiary block mb-2">专家评分</span>
                  <div className="flex items-center gap-4">
                    <input type="range" min={0} max={100} value={annotationScore} onChange={e => setAnnotationScore(Number(e.target.value))} className="flex-1 accent-primary" />
                    <span className={`text-lg font-bold w-12 text-right ${getRiskScoreColor(annotationScore)}`}>{annotationScore}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-text-tertiary block mb-2">是否同意 AI 评级</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="agree" checked={annotationAgreement === 'agree'} onChange={() => setAnnotationAgreement('agree')} className="accent-primary" />
                      <span className="text-sm text-text">同意</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="agree" checked={annotationAgreement === 'disagree'} onChange={() => setAnnotationAgreement('disagree')} className="accent-primary" />
                      <span className="text-sm text-text">不同意</span>
                    </label>
                  </div>
                </div>
                {annotationAgreement === 'disagree' && (
                  <textarea value={annotationReason} onChange={e => setAnnotationReason(e.target.value)} placeholder="请说明调整理由..." rows={3} className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                )}
              </div>

              <button onClick={submitAnnotation} disabled={annotationAgreement === 'disagree' && !annotationReason.trim()} className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
                提交标注
              </button>
            </div>
          ) : (
            <div className="card text-center py-12 text-sm text-text-tertiary">
              点击列表中的"标注"按钮<br />开始评级标注
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
