import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  updateTime?: string
  actions?: ReactNode
}

export function PageHeader({ 
  title, 
  subtitle, 
  updateTime,
  actions 
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-text-secondary text-base">
              {subtitle}
            </p>
          )}
          {updateTime && (
            <p className="mt-1 text-sm text-text-tertiary">
              更新时间: {updateTime}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 ml-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
