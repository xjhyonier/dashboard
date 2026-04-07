import { useState, useEffect } from 'react'
import { type QueueTask } from '../mock'

interface Props { task: QueueTask; onBack: () => void; onComplete: () => void }

const TASK_TITLES: Record<string, string> = {
  risk_check: '风险评级核对',
  todo_issue: '待办下发',
  hazard_review: '隐患复核',
}

export function ExpertExecutionDetail({ task, onBack, onComplete }: Props) {
  const [done, setDone] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [riskLevel, setRiskLevel] = useState('')
  const [riskReason, setRiskReason] = useState('')
  const [hazardConclusion, setHazardConclusion] = useState<Record<string, string>>({})
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (!done || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [done, countdown])

  useEffect(() => {
    if (done && countdown === 0) onComplete()
  }, [done, countdown, onComplete])

  const submit = () => {
    if (task.type === 'risk_check' && (!riskLevel || riskReason.length < 10)) return
    if (task.type === 'hazard_review' && !hazardConclusion[task.hazardId || '']) return
    // todo_issue 是等待企业状态，提交即表示"已联系推进"
    setDone(true)
  }

  const canSubmit = () => {
    switch (task.type) {
      case 'risk_check': return riskLevel !== '' && riskReason.length >= 10
      case 'hazard_review': return !!hazardConclusion[task.hazardId || '']
      case 'todo_issue': return true
    }
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-50 overflow-hidden">

      {/* 顶部栏 */}
      <header className="h-13 bg-white border-b border-zinc-200/80 flex items-center px-6 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-800 transition-colors">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          返回
        </button>
        <div className="ml-4 flex items-center gap-2">
          <div className="w-0.5 h-4 bg-zinc-200 rounded-full" />
          <span className="text-[13px] font-semibold text-zinc-800">{TASK_TITLES[task.type]}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[12px] text-zinc-400 font-mono">{task.enterpriseName}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : task.priority === 'today' ? 'bg-amber-500' : 'bg-zinc-400'}`} />
        </div>
      </header>

      {/* 成功提示条 */}
      {done && (
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-6 py-2.5 flex items-center gap-3 flex-shrink-0">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-emerald-600 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[13px] text-emerald-700 font-medium">
            已记录，正在进入下一件
            <span className="ml-2 font-mono text-emerald-600">{countdown}s</span>
          </span>
        </div>
      )}

      {/* 表单内容 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[680px] mx-auto py-8 px-6">

          {/* 企业信息 */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 mb-6 shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1.5">
              {task.enterpriseCategory || '企业'}
            </div>
            <div className="text-base font-semibold text-zinc-900 leading-tight">{task.enterpriseName}</div>
            {task.enterpriseAddress && (
              <div className="text-[12px] text-zinc-400 mt-1 flex items-center gap-1.5">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {task.enterpriseAddress}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200/60 mb-6" />

          {/* ===== 风险核对 ===== */}
          {task.type === 'risk_check' && (
            <>
              {/* AI 评估卡片 */}
              <div className="bg-white rounded-xl border border-zinc-200/80 p-5 mb-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-0.5 h-4 bg-blue-500 rounded-full" />
                  <span className="text-[13px] font-semibold text-zinc-800">AI 评估结果</span>
                </div>
                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <div className="text-[11px] text-zinc-400 mb-1">AI 判定</div>
                    <div className="text-2xl font-bold text-red-600 leading-none">{task.aiLevel}</div>
                    <div className="text-[12px] text-zinc-400 mt-1 font-mono">{task.aiScore}分</div>
                  </div>
                  <div className="h-10 w-px bg-zinc-200" />
                  <div>
                    <div className="text-[11px] text-zinc-400 mb-1">专家标注</div>
                    {riskLevel ? (
                      <div className={`text-xl font-bold leading-none ${
                        riskLevel === '重大风险' ? 'text-red-600' :
                        riskLevel === '较大风险' ? 'text-orange-500' :
                        riskLevel === '一般风险' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {riskLevel}
                      </div>
                    ) : (
                      <div className="text-[13px] text-zinc-400 mt-1">请在下方选择</div>
                    )}
                  </div>
                </div>
                {task.aiReasoning && (
                  <div className="bg-zinc-50 rounded-lg border border-zinc-200/60 p-3.5">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">AI 分析依据</div>
                    <div className="text-[13px] text-zinc-600 leading-relaxed">{task.aiReasoning}</div>
                  </div>
                )}
              </div>

              {/* 判定选择 */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-4 bg-zinc-800 rounded-full" />
                  <span className="text-[13px] font-semibold text-zinc-800">最终判定</span>
                </div>
                <div className="grid grid-cols-4 gap-2.5 mb-4">
                  {['重大风险', '较大风险', '一般风险', '低风险'].map(l => (
                    <button
                      key={l}
                      onClick={() => setRiskLevel(l)}
                      className={`py-2.5 rounded-lg text-[13px] font-semibold border-2 transition-all duration-150 active:scale-[0.97]
                        ${riskLevel === l
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
                        }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 判定依据 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-4 bg-zinc-800 rounded-full" />
                  <span className="text-[13px] font-semibold text-zinc-800">判定依据</span>
                  <span className="text-[11px] text-zinc-400 ml-1">（必填，至少 10 字）</span>
                </div>
                <textarea
                  value={riskReason}
                  onChange={e => setRiskReason(e.target.value)}
                  placeholder="请描述您做出此判断的原因，例如：结合企业历史违规记录和本次整改情况..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-[13px] resize-none
                    placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400
                    transition-colors duration-150 leading-relaxed"
                />
                <div className={`text-[11px] mt-1.5 ${riskReason.length >= 10 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                  {riskReason.length} / 10 字符
                </div>
              </div>
            </>
          )}

          {/* ===== 隐患复核 ===== */}
          {task.type === 'hazard_review' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-0.5 h-4 bg-red-500 rounded-full" />
                <span className="text-[13px] font-semibold text-zinc-800">待复核隐患</span>
              </div>
              <div className="bg-white rounded-xl border border-zinc-200/80 p-5 mb-6 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[14px] font-semibold text-zinc-800">{task.hazardDescription}</div>
                    <div className="text-[12px] text-zinc-400 mt-1">
                      整改期限：{task.rectifyDeadline}
                      {task.overdueDays && task.overdueDays > 0 && (
                        <span className="ml-2 text-red-500 font-semibold">已逾期 {task.overdueDays} 天</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-md shrink-0
                    ${task.hazardLevel === '重大隐患' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {task.hazardLevel}
                  </span>
                </div>

                {task.rectificationNote && (
                  <div className="bg-zinc-50 rounded-lg border border-zinc-200/60 p-3.5 mb-4">
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">企业整改说明</div>
                    <div className="text-[13px] text-zinc-700 leading-relaxed">{task.rectificationNote}</div>
                  </div>
                )}

                <div className="text-[12px] font-semibold text-zinc-600 mb-3">您的复核结论：</div>
                <div className="flex flex-col gap-2.5">
                  {([
                    { key: 'pass', label: '整改合格，隐患闭环' },
                    { key: 'fail', label: '整改不合格，需继续整改' },
                    { key: 'onsite', label: '无法判断，需现场复核' },
                  ] as const).map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-150
                        ${(hazardConclusion[task.hazardId || ''] || '') === opt.key
                          ? 'border-zinc-900 bg-zinc-900'
                          : 'border-zinc-300 group-hover:border-zinc-500'
                        }`}>
                        {(hazardConclusion[task.hazardId || ''] || '') === opt.key && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-[13px] text-zinc-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ===== 待办下发 ===== */}
          {task.type === 'todo_issue' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-0.5 h-4 rounded-full ${task.issueSource === 'hazard' ? 'bg-red-500' : 'bg-blue-500'}`} />
                <span className="text-[13px] font-semibold text-zinc-800">
                  {task.issueSource === 'hazard' ? '隐患单' : '指导服务待办'}
                </span>
                {task.hazardLevel && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium
                    ${task.hazardLevel === 'major' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                    {task.hazardLevel === 'major' ? '重大隐患' : '一般隐患'}
                  </span>
                )}
              </div>

              <div className="bg-white rounded-xl border border-zinc-200/80 p-5 mb-5 shadow-sm">
                {task.hazardDescription && (
                  <div className="mb-3">
                    <div className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1.5">事项内容</div>
                    <div className="text-[14px] text-zinc-800 leading-relaxed">{task.hazardDescription}</div>
                  </div>
                )}
                {task.hazardLocation && (
                  <div className="mb-3">
                    <div className="text-[11px] font-medium uppercase tracking-widest text-zinc-400 mb-1.5">位置</div>
                    <div className="text-[13px] text-zinc-600">{task.hazardLocation}</div>
                  </div>
                )}
                {task.rectifyDeadline && (
                  <div className="flex items-center gap-2">
                    <div className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">整改期限</div>
                    <div className="text-[13px] font-mono text-zinc-600">{task.rectifyDeadline?.slice(0, 10)}</div>
                    {task.overdueDays && task.overdueDays > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">
                        已逾期{task.overdueDays}天
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-0.5 h-4 bg-zinc-800 rounded-full" />
                  <span className="text-[13px] font-semibold text-zinc-800">跟进记录</span>
                </div>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="记录本次跟进情况（选填）..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-[13px] resize-none
                    placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-400
                    transition-colors duration-150 leading-relaxed"
                />
              </div>
            </>
          )}

          {/* 提交按钮 */}
          <div className="pt-2 pb-10">
            <button
              onClick={submit}
              disabled={!canSubmit() || done}
              className={`w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-150 active:scale-[0.98]
                ${canSubmit() && !done
                  ? 'bg-zinc-900 hover:bg-zinc-700 text-white shadow-sm'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                }`}
            >
              {done ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  已提交
                </span>
              ) : task.actionLabel}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
