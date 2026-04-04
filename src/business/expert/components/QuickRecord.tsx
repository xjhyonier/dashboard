import { useState } from 'react'
import type { ServiceRecordType } from '../types'

interface QuickRecordProps {
  onSubmit?: (data: {
    content: string
    type: ServiceRecordType
    relatedHazardId?: string
  }) => void
  relatedHazards?: Array<{ id: string; description: string }>
}

export function QuickRecord({ onSubmit, relatedHazards = [] }: QuickRecordProps) {
  const [content, setContent] = useState('')
  const [type, setType] = useState<ServiceRecordType>('wechat')
  const [relatedHazardId, setRelatedHazardId] = useState<string>('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = () => {
    if (!content.trim()) return
    onSubmit?.({
      content: content.trim(),
      type,
      relatedHazardId: relatedHazardId || undefined
    })
    setContent('')
    setRelatedHazardId('')
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <div className="card-compact">
      <h4 className="text-sm font-medium text-text-secondary mb-3">快速记录</h4>

      {/* 记录内容 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="记录服务内容..."
        rows={3}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none
                 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                 placeholder:text-text-tertiary"
      />

      {/* 选项行 */}
      <div className="flex items-center gap-3 mt-3">
        {/* 沟通类型 */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ServiceRecordType)}
          className="px-3 py-1.5 text-sm bg-white border border-border rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="wechat">微信沟通</option>
          <option value="phone">电话确认</option>
          <option value="onsite">现场交谈</option>
          <option value="other">其他</option>
        </select>

        {/* 关联隐患 */}
        {relatedHazards.length > 0 && (
          <select
            value={relatedHazardId}
            onChange={(e) => setRelatedHazardId(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">关联隐患（可选）</option>
            {relatedHazards.map(h => (
              <option key={h.id} value={h.id}>
                {h.description.length > 20 ? h.description.slice(0, 20) + '...' : h.description}
              </option>
            ))}
          </select>
        )}

        {/* 附件上传按钮（Demo） */}
        <button
          className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg
                   hover:bg-slate-50 transition-colors"
          onClick={() => alert('附件上传功能（Demo中仅展示按钮）')}
        >
          附件
        </button>

        <div className="flex-1" />

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg
                   hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          提交
        </button>
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="mt-2 text-xs text-success font-medium">
          记录已保存
        </div>
      )}
    </div>
  )
}
