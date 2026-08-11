import type { ServiceRecord } from '../types'
import { formatRelativeTime, getServiceRecordTypeLabel, formatDateTime } from '../utils/helpers'

interface ServiceTimelineProps {
  records: ServiceRecord[]
  onRecordClick?: (record: ServiceRecord) => void
  showEnterprise?: boolean
  compact?: boolean
}

export function ServiceTimeline({
  records,
  onRecordClick,
  showEnterprise = false,
  compact = false
}: ServiceTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-text-tertiary text-sm">
        暂无服务记录
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => {
        const typeInfo = getServiceRecordTypeLabel(record.type)
        return (
          <div
            key={record.id}
            onClick={() => onRecordClick?.(record)}
            className={`flex gap-3 ${onRecordClick ? 'cursor-pointer' : ''}`}
          >
            {/* 时间线轴 */}
            <div className="flex flex-col items-center">
              {/* 图标圆点 */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm
                ${compact ? 'w-6 h-6 text-xs' : ''}
                bg-slate-100 shrink-0
              `}>
                {typeInfo.icon}
              </div>
              {/* 连接线 */}
              {index < records.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            {/* 内容 */}
            <div className={`flex-1 ${compact ? 'pb-3' : 'pb-4'} min-w-0`}>
              {/* 头部: 时间 + 类型 */}
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs text-text-tertiary ${compact ? '' : 'text-sm'}`}>
                  {compact ? formatDateTime(record.createdAt) : formatRelativeTime(record.createdAt)}
                </span>
                <span className={`
                  text-xs font-medium px-2 py-0.5 rounded-full
                  bg-slate-100 text-text-secondary
                `}>
                  {typeInfo.label}
                </span>
              </div>

              {/* 企业名称（可选） */}
              {showEnterprise && record.enterpriseName && (
                <p className="text-sm font-medium text-primary mb-1 truncate">
                  {record.enterpriseName}
                </p>
              )}

              {/* 记录人（非紧凑模式） */}
              {!compact && record.creatorName && (
                <span className="text-xs text-text-tertiary">{record.creatorName}</span>
              )}

              {/* 内容 */}
              <p className={`text-sm text-text ${compact ? 'line-clamp-1' : 'line-clamp-2'} mt-1`}>
                {record.content}
              </p>

              {/* 附件 */}
              {record.attachments.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-text-tertiary">
                    {record.attachments.length} 个附件
                  </span>
                </div>
              )}

              {/* 关联隐患 */}
              {record.relatedHazardId && (
                <div className="mt-1">
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full cursor-pointer hover:bg-primary/20">
                    关联隐患: {record.relatedHazardId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
