// ==================== 专家工作台工具函数 ====================

import type { RiskLevel } from '../types'

/**
 * 根据风险分值返回 Tailwind 色标类名
 */
export function getRiskScoreColor(score: number): string {
  if (score < 30) return 'text-red-600'
  if (score < 60) return 'text-orange-500'
  if (score < 80) return 'text-amber-500'
  return 'text-green-600'
}

/**
 * 根据风险分值返回背景色类名
 */
export function getRiskScoreBgColor(score: number): string {
  if (score < 30) return 'bg-red-50 border-red-200'
  if (score < 60) return 'bg-orange-50 border-orange-200'
  if (score < 80) return 'bg-amber-50 border-amber-200'
  return 'bg-green-50 border-green-200'
}

/**
 * 根据风险分值返回左侧色条颜色
 */
export function getRiskScoreBarColor(score: number): string {
  if (score < 30) return 'bg-red-500'
  if (score < 60) return 'bg-orange-500'
  if (score < 80) return 'bg-amber-500'
  return 'bg-green-500'
}

/**
 * 根据 RiskLevel 枚举返回色标
 */
export function getRiskLevelColor(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    critical: 'text-red-600',
    high: 'text-orange-500',
    medium: 'text-amber-500',
    low: 'text-green-600',
  }
  return map[level]
}

/**
 * 根据 RiskLevel 返回圆点背景
 */
export function getRiskLevelBg(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  }
  return map[level]
}

/**
 * 相对时间格式化
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date()
  const date = new Date(isoString)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 7) return `${diffDay}天前`
  return date.toLocaleDateString('zh-CN')
}

/**
 * 格式化日期为 MM-DD HH:mm
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(isoString: string): string {
  return isoString.split('T')[0]
}

/**
 * 服务记录类型标签映射
 */
export function getServiceRecordTypeLabel(type: string): { label: string; icon: string } {
  const map: Record<string, { label: string; icon: string }> = {
    wechat: { label: '微信沟通', icon: '💬' },
    phone: { label: '电话确认', icon: '📞' },
    onsite: { label: '现场交谈', icon: '🏢' },
    other: { label: '其他', icon: '📝' },
  }
  return map[type] || { label: type, icon: '📝' }
}

/**
 * 隐患状态标签映射
 */
export function getHazardStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    pending_issue: { label: '待下发', color: 'bg-slate-100 text-slate-700' },
    issued: { label: '已下发', color: 'bg-blue-100 text-blue-700' },
    rectifying: { label: '整改中', color: 'bg-orange-100 text-orange-700' },
    pending_review: { label: '待复核', color: 'bg-purple-100 text-purple-700' },
    closed: { label: '已闭环', color: 'bg-green-100 text-green-700' },
  }
  return map[status] || { label: status, color: 'bg-slate-100 text-slate-700' }
}

/**
 * 责任池变动类型标签映射
 */
export function getChangeTypeLabel(type: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    added: { label: '新增', color: 'bg-green-100 text-green-700' },
    transferred_in: { label: '接收', color: 'bg-blue-100 text-blue-700' },
    transferred_out: { label: '划转出', color: 'bg-orange-100 text-orange-700' },
    removed: { label: '移除', color: 'bg-red-100 text-red-700' },
  }
  return map[type] || { label: type, color: 'bg-slate-100 text-slate-700' }
}
