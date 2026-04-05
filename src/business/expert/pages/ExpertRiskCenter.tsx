import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TableCard } from '../../../components/widgets'
import { RiskRadar } from '../components/RiskRadar'
import expertMock from '../mock'
import type { RiskLevel, RiskDiscrepancy, EnterpriseCategory } from '../types'
import { getRiskScoreColor } from '../utils/helpers'

const riskLevelConfig: Record<string, { label: string; bgClass: string; textClass: string; scoreRange: [number, number] }> = {
  critical: { label: '重大风险', bgClass: 'bg-red-100', textClass: 'text-red-700', scoreRange: [0, 30] },
  high: { label: '较大风险', bgClass: 'bg-orange-100', textClass: 'text-orange-700', scoreRange: [31, 60] },
  medium: { label: '一般风险', bgClass: 'bg-amber-100', textClass: 'text-amber-700', scoreRange: [61, 80] },
  low: { label: '低风险', bgClass: 'bg-green-100', textClass: 'text-green-700', scoreRange: [81, 100] },
  unknown: { label: '未知', bgClass: 'bg-slate-100', textClass: 'text-slate-700', scoreRange: [0, 0] },
}

const categoryLabels: Record<EnterpriseCategory, string> = {
  production: '生产企业',
  fire_key: '消防重点',
  general: '一般场所',
}

function RiskLevelBadge({ level }: { level?: RiskLevel | null }) {
  if (!level) return <span className="text-text-tertiary">--</span>
  const config = riskLevelConfig[level]
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgClass} ${config.textClass}`}>{config.label}</span>
}

function CategoryBadge({ category }: { category?: EnterpriseCategory }) {
  if (!category) return null
  const colors: Record<EnterpriseCategory, string> = {
    production: 'bg-purple-50 text-purple-700',
    fire_key: 'bg-blue-50 text-blue-700',
    general: 'bg-slate-50 text-slate-600',
  }
  return <span className={`text-xs px-1.5 py-0.5 rounded ${colors[category]}`}>{categoryLabels[category]}</span>
}

export function ExpertRiskCenter() {
  const [activeTab, setActiveTab] = useState<'pool' | 'history'>('pool')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<RiskLevel | 'keep_ai'>('keep_ai')
  const [resolutionReason, setResolutionReason] = useState('')
  const [annotationFilter, setAnnotationFilter] = useState('all')
  const [selectedConflict, setSelectedConflict] = useState<string | null>(null)
  const [annotationScore, setAnnotationScore] = useState(50)
  const [annotationAgreement, setAnnotationAgreement] = useState<'agree' | 'disagree'>('agree')
  const [annotationReason, setAnnotationReason] = useState('')

  const { enterprises, annotations, riskDiscrepancies } = expertMock

  // 核对池数据
  const pendingDiscrepancies = riskDiscrepancies.filter(d => d.status === 'pending')
  const resolvedDiscrepancies = riskDiscrepancies.filter(d => d.status === 'resolved')
  const totalDiscrepancies = riskDiscrepancies.length
  const resolutionRate = totalDiscrepancies > 0 ? Math.round((resolvedDiscrepancies.length / totalDiscrepancies) * 100) : 0

  // 筛选
  let filteredPending = categoryFilter === 'all'
    ? pendingDiscrepancies
    : pendingDiscrepancies.filter(d => d.enterpriseCategory === categoryFilter)

  let filteredResolved = categoryFilter === 'all'
    ? resolvedDiscrepancies
    : resolvedDiscrepancies.filter(d => d.enterpriseCategory === categoryFilter)

  // 冲突列表（风险分值对比视图）
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

  const pendingAnnotationCount = enterprises.filter(e => e.expertRating === undefined).length
  const annotatedCount = enterprises.filter(e => e.expertRating !== undefined).length
  const annotationRate = enterprises.length > 0 ? Math.round((annotatedCount / enterprises.length) * 100) : 0

  // 核对操作
  const openDiscrepancy = (id: string) => {
    const d = riskDiscrepancies.find(x => x.id === id)
    if (!d) return
    setSelectedDiscrepancy(id)
    setSelectedLevel('keep_ai')
    setResolutionReason('')
  }

  const submitResolution = () => {
    if (!resolutionReason.trim()) return
    alert(`定级已保存：${selectedLevel === 'keep_ai' ? '保持AI评级' : riskLevelConfig[selectedLevel as RiskLevel]?.label} - ${resolutionReason}`)
    setSelectedDiscrepancy(null)
  }

  // 标注操作
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

  const selectedD = riskDiscrepancies.find(d => d.id === selectedDiscrepancy)
  const selected = conflicts.find(c => c.enterpriseId === selectedConflict)

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="风险研判" subtitle="AI评级 vs 专家定级" />

      {/* TabPanel */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('pool')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pool'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          核对池
          {pendingDiscrepancies.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
              {pendingDiscrepancies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          历史标注
        </button>
      </div>

      {/* 筛选栏 */}
      <FilterBar filters={[
        {
          key: 'category', label: '企业类型', type: 'tabs', value: categoryFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: '生产企业', value: 'production' },
            { label: '消防重点', value: 'fire_key' },
            { label: '一般场所', value: 'general' },
          ],
          onChange: setCategoryFilter,
        },
      ]} />

      {/* 统计概览 */}
      <SectionBlock>
        <GridLayout columns={3}>
          <KpiCard title="待核对企业" value={pendingDiscrepancies.length} description="需专家定级的不一致项" />
          <KpiCard title="已解决" value={resolvedDiscrepancies.length} description="已完成定级的不一致项" />
          <KpiCard title="核对率" value={resolutionRate} unit="%" description={resolutionRate >= 80 ? '表现优秀' : resolutionRate >= 50 ? '继续推进' : '需加快推进'} />
        </GridLayout>
      </SectionBlock>

      {/* === 核对池 Tab === */}
      {activeTab === 'pool' && (
        <>
          <div className="grid grid-cols-3 gap-grid">
            {/* 不一致项列表 */}
            <div className="col-span-2">
              <div className="card">
                <TableCard
                  title="AI vs 专家风险评级不一致"
                  columns={[
                    { key: 'rank', label: '#', width: '40px' },
                    { key: 'name', label: '企业名称', width: '150px' },
                    { key: 'category', label: '类型', width: '70px' },
                    { key: 'aiLevel', label: 'AI等级', width: '90px' },
                    { key: 'expertLevel', label: '专家等级', width: '90px' },
                    { key: 'reason', label: 'AI依据', width: 'auto' },
                    { key: 'action', label: '操作', width: '80px' },
                  ]}
                  data={filteredPending.map((d, i) => ({
                    rank: i + 1,
                    name: (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text truncate">{d.enterpriseName}</span>
                        <CategoryBadge category={d.enterpriseCategory} />
                      </div>
                    ),
                    category: <CategoryBadge category={d.enterpriseCategory} />,
                    aiLevel: <RiskLevelBadge level={d.aiRiskLevel} />,
                    expertLevel: <RiskLevelBadge level={d.expertRiskLevel} />,
                    reason: (
                      <div className="text-xs text-text-tertiary truncate max-w-[200px]" title={d.aiReasoning}>
                        {d.aiReasoning}
                      </div>
                    ),
                    action: (
                      <button
                        onClick={() => openDiscrepancy(d.id)}
                        className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                      >
                        去核对
                      </button>
                    ),
                  }))}
                />
                {filteredPending.length === 0 && (
                  <div className="text-center py-8 text-sm text-text-tertiary">
                    当前无待核对项
                  </div>
                )}
              </div>
            </div>

            {/* 核对操作面板 */}
            <div className="col-span-1">
              {selectedD ? (
                <div className="card sticky top-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-text-secondary">核对操作</h4>
                    <button onClick={() => setSelectedDiscrepancy(null)} className="text-text-tertiary hover:text-text">&times;</button>
                  </div>

                  {/* 企业信息 */}
                  <h3 className="text-base font-semibold text-text mb-2">{selectedD.enterpriseName}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <CategoryBadge category={selectedD.enterpriseCategory} />
                    <span className="text-xs text-text-tertiary">检测于 {new Date(selectedD.detectedAt).toLocaleDateString('zh-CN')}</span>
                  </div>

                  {/* AI 判定 */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-text-tertiary">AI 判定</span>
                      <div className="flex items-center gap-2">
                        <RiskLevelBadge level={selectedD.aiRiskLevel} />
                        <span className={`text-sm font-bold ${getRiskScoreColor(selectedD.aiScore)}`}>{selectedD.aiScore}分</span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{selectedD.aiReasoning}</p>
                  </div>

                  {/* 风险等级选择 */}
                  <div className="mb-4">
                    <span className="text-sm text-text-tertiary block mb-2">请选择风险等级</span>
                    <div className="flex flex-wrap gap-2">
                      {(['critical', 'high', 'medium', 'low'] as const).map(level => {
                        const config = riskLevelConfig[level]
                        return (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                              selectedLevel === level
                                ? `${config.bgClass} ${config.textClass} border-current ring-2 ring-offset-1 ring-current/30`
                                : `${config.bgClass} ${config.textClass} border-transparent opacity-60 hover:opacity-100`
                            }`}
                          >
                            {config.label}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setSelectedLevel('keep_ai')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                          selectedLevel === 'keep_ai'
                            ? 'bg-slate-100 text-slate-700 border-slate-400 ring-2 ring-offset-1 ring-slate-400/30'
                            : 'bg-slate-50 text-slate-500 border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        保持AI评级
                      </button>
                    </div>
                  </div>

                  {/* 定级说明（必填） */}
                  <div className="mb-4">
                    <span className="text-sm text-text-tertiary block mb-2">
                      定级说明 <span className="text-red-500">*</span>
                    </span>
                    <textarea
                      value={resolutionReason}
                      onChange={e => setResolutionReason(e.target.value)}
                      placeholder="请输入您的判断依据（必填，用于过程留痕）..."
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* 提交按钮 */}
                  <button
                    onClick={submitResolution}
                    disabled={!resolutionReason.trim()}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    提交定级
                  </button>
                </div>
              ) : (
                <div className="card text-center py-12 text-sm text-text-tertiary">
                  点击列表中的"去核对"按钮<br />开始风险等级定级
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* === 历史标注 Tab === */}
      {activeTab === 'history' && (
        <div className="card">
          <TableCard
            title="已解决的标注记录"
            columns={[
              { key: 'name', label: '企业名称', width: '180px' },
              { key: 'category', label: '类型', width: '80px' },
              { key: 'aiLevel', label: 'AI等级', width: '90px' },
              { key: 'expertLevel', label: '专家定级', width: '90px' },
              { key: 'reason', label: '定级说明', width: 'auto' },
              { key: 'time', label: '解决时间', width: '120px' },
            ]}
            data={filteredResolved.map(d => ({
              name: (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text">{d.enterpriseName}</span>
                </div>
              ),
              category: <CategoryBadge category={d.enterpriseCategory} />,
              aiLevel: <RiskLevelBadge level={d.aiRiskLevel} />,
              expertLevel: d.expertResolution?.selectedLevel
                ? <RiskLevelBadge level={d.expertResolution.selectedLevel} />
                : <span className="text-text-tertiary">--</span>,
              reason: (
                <div className="text-xs text-text-secondary truncate max-w-[300px]" title={d.expertResolution?.reason}>
                  {d.expertResolution?.reason}
                </div>
              ),
              time: d.expertResolution?.resolvedAt
                ? <span className="text-xs text-text-tertiary">{new Date(d.expertResolution.resolvedAt).toLocaleDateString('zh-CN')}</span>
                : <span className="text-text-tertiary">--</span>,
            }))}
          />
          {filteredResolved.length === 0 && (
            <div className="text-center py-8 text-sm text-text-tertiary">
              暂无已解决的记录
            </div>
          )}
        </div>
      )}

      {/* 分割线 */}
      <div className="my-8 border-t border-border" />

      {/* 冲突对比视图（风险分值对比） */}
      <SectionBlock title="风险分值对比" description="AI 综合评分 vs 专家评分，按差异程度排序">
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

        <div className="grid grid-cols-3 gap-grid mt-4">
          <div className="col-span-2">
            <div className="card">
              <TableCard
                title="AI vs 专家评分对比"
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

                <RiskRadar
                  boardScores={selected.boardComparison.map(b => ({ board: b.board, score: b.expertScore ?? b.aiScore, anomalyCount: 0, anomalies: [] }))}
                />

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
      </SectionBlock>
    </PageShell>
  )
}
