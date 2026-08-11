import { useState, useEffect, useCallback } from 'react'
import { stationChiefMock, type ExpertMember } from '../pages/mock/station-chief'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type TaskType = 'inspection' | 'review' | 'consultation' | 'followup'
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface TaskFormData {
  expertId: string
  taskType: TaskType
  priority: TaskPriority
  title: string
  description: string
  targetEnterprise: string
  dueDate: string
}

export interface CreateTaskModalProps {
  onClose: () => void
  onSubmit: (data: TaskFormData) => void
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; desc: string }[] = [
  { value: 'inspection', label: '专项检查', desc: '针对特定企业的现场检查任务' },
  { value: 'review', label: '隐患复核', desc: '对已整改隐患进行现场复核' },
  { value: 'consultation', label: '专家咨询', desc: '为企业提供安全指导服务' },
  { value: 'followup', label: '跟踪督办', desc: '对重大隐患整改进度跟踪' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string; bg: string; border: string }[] = [
  { value: 'urgent', label: '紧急', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' },
  { value: 'high', label: '重要', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300' },
  { value: 'normal', label: '一般', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
  { value: 'low', label: '低优', color: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-300' },
]

// Default due date = 7 days from now
function getDefaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CreateTaskModal({ onClose, onSubmit }: CreateTaskModalProps) {
  const experts = stationChiefMock.expertTeam

  const [form, setForm] = useState<TaskFormData>({
    expertId: '',
    taskType: 'inspection',
    priority: 'normal',
    title: '',
    description: '',
    targetEnterprise: '',
    dueDate: getDefaultDueDate(),
  })

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Lock background scroll & Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose],
  )

  const updateField = <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canSubmit = form.expertId !== '' && form.title.trim() !== '' && form.dueDate !== ''

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitting(true)
    // Mock submit delay
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      onSubmit(form)
    }, 600)
  }

  const selectedExpert = experts.find(e => e.id === form.expertId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-zinc-800">创建专项任务</span>
              <p className="text-xs text-zinc-500">为专家指派检查、复核、咨询等专项任务</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        {submitted ? (
          <SuccessView expert={selectedExpert} onClose={onClose} />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Expert selection */}
            <FieldGroup label="指派专家" required>
              <div className="grid grid-cols-3 gap-2">
                {experts.map(expert => {
                  const isSelected = form.expertId === expert.id
                  const gradeStyles: Record<string, string> = {
                    A: 'bg-emerald-100 text-emerald-700',
                    B: 'bg-blue-100 text-blue-700',
                    C: 'bg-red-100 text-red-600',
                  }
                  return (
                    <button
                      key={expert.id}
                      type="button"
                      onClick={() => updateField('expertId', expert.id)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                        ${isSelected
                          ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
                      `}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium shrink-0`}>
                        {expert.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-zinc-800 truncate">{expert.name}</div>
                        <div className="text-[10px] text-zinc-400">{expert.enterpriseCount}家企业 · {expert.totalTasks}任务</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${gradeStyles[expert.grade]}`}>
                        {expert.grade}
                      </span>
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* Task type */}
            <FieldGroup label="任务类型" required>
              <div className="grid grid-cols-4 gap-2">
                {TASK_TYPE_OPTIONS.map(opt => {
                  const isSelected = form.taskType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('taskType', opt.value)}
                      className={`
                        px-3 py-2.5 rounded-xl border text-center transition-all
                        ${isSelected
                          ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
                      `}
                    >
                      <div className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-zinc-700'}`}>{opt.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-500' : 'text-zinc-400'}`}>{opt.desc}</div>
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* Task title */}
            <FieldGroup label="任务标题" required>
              <input
                type="text"
                value={form.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="例：对天成建材有限公司开展消防安全专项检查"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
              />
            </FieldGroup>

            {/* Target enterprise + Due date (side-by-side) */}
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="目标企业">
                <input
                  type="text"
                  value={form.targetEnterprise}
                  onChange={e => updateField('targetEnterprise', e.target.value)}
                  placeholder="输入企业名称"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                />
              </FieldGroup>
              <FieldGroup label="截止日期" required>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => updateField('dueDate', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                />
              </FieldGroup>
            </div>

            {/* Priority */}
            <FieldGroup label="优先级">
              <div className="flex items-center gap-2">
                {PRIORITY_OPTIONS.map(opt => {
                  const isSelected = form.priority === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateField('priority', opt.value)}
                      className={`
                        px-4 py-2 rounded-xl border text-sm font-medium transition-all
                        ${isSelected
                          ? `${opt.bg} ${opt.border} ${opt.color} ring-1 ring-current/20`
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'}
                      `}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </FieldGroup>

            {/* Description */}
            <FieldGroup label="任务描述">
              <textarea
                value={form.description}
                onChange={e => updateField('description', e.target.value)}
                placeholder="描述任务具体要求和注意事项..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all resize-none"
              />
            </FieldGroup>
          </div>
        )}

        {/* ── Footer ── */}
        {!submitted && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`
                px-5 py-2 rounded-xl text-sm font-medium transition-all
                ${canSubmit && !submitting
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}
              `}
            >
              {submitting ? '提交中...' : '创建任务'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SuccessView({
  expert,
  onClose,
}: {
  expert: ExpertMember | undefined
  onClose: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg width="32" height="32" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-zinc-800">任务创建成功</h3>
        <p className="text-sm text-zinc-500 mt-1">
          已通知专家 {expert?.name ?? ''}，请关注任务进度
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        完成
      </button>
    </div>
  )
}
