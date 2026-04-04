import { getRiskScoreColor } from '../utils/helpers'
import type { Enterprise } from '../types'

interface EnterpriseHeaderProps {
  enterprise: Enterprise
  onVideoWatch?: () => void
  onSiteVisit?: () => void
  onBack?: () => void
}

export function EnterpriseHeader({
  enterprise,
  onVideoWatch,
  onSiteVisit,
  onBack
}: EnterpriseHeaderProps) {
  const scoreColorClass = getRiskScoreColor(enterprise.riskScore)

  return (
    <div className="card">
      {/* 返回按钮 */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-text-tertiary hover:text-primary transition-colors mb-4"
        >
          <span>&larr;</span>
          <span>返回驾驶舱</span>
        </button>
      )}

      <div className="flex items-start justify-between">
        {/* 左侧信息 */}
        <div className="flex-1">
          {/* 企业名称 */}
          <h1 className="text-2xl font-bold text-text mb-1">
            {enterprise.name}
          </h1>

          {/* 行业 + 规模 */}
          <p className="text-sm text-text-secondary mb-4">
            {enterprise.industry} · {enterprise.scale}
          </p>

          {/* AI风险分值 vs 我的评级 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">AI风险</span>
              <span className={`text-xl font-bold ${scoreColorClass}`}>
                {enterprise.riskScore}
              </span>
            </div>
            {enterprise.expertRating !== undefined && enterprise.expertRating !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">我的评级</span>
                <span className={`text-xl font-bold ${getRiskScoreColor(enterprise.expertRating)}`}>
                  {enterprise.expertRating}
                </span>
                {Math.abs(enterprise.riskScore - enterprise.expertRating) > 10 && (
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
                    差值 {enterprise.expertRating - enterprise.riskScore > 0 ? '+' : ''}{enterprise.expertRating - enterprise.riskScore}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 工作组归属标签 */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {enterprise.workGroups.map((group) => (
              <span
                key={group}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium
                         bg-primary/10 text-primary rounded-lg"
              >
                {group}
              </span>
            ))}
            {enterprise.workGroups.length > 1 && (
              <span className="text-xs text-amber-500 font-medium">多组重叠</span>
            )}
          </div>

          {/* 最近检查时间 + 当前隐患数 */}
          <div className="flex items-center gap-4 text-sm">
            {enterprise.lastCheckDate && (
              <span className="text-text-tertiary">
                最近检查: {new Date(enterprise.lastCheckDate).toLocaleDateString('zh-CN')}
              </span>
            )}
            <span className={`
              inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full
              ${enterprise.openHazardCount > 0
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-600'
              }
            `}>
              {enterprise.openHazardCount} 条未闭环
            </span>
          </div>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex flex-col gap-2 ml-6">
          <button
            onClick={onVideoWatch}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border
                     rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <span>📹</span>
            <span>视频看</span>
          </button>
          <button
            onClick={onSiteVisit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary
                     rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <span>🏢</span>
            <span>现场看</span>
          </button>
        </div>
      </div>
    </div>
  )
}
