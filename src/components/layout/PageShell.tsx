import { ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  maxWidth?: 'default' | 'wide' | 'full'
  className?: string
}

export function PageShell({ 
  children, 
  maxWidth = 'default',
  className = '' 
}: PageShellProps) {
  const maxWidthClass = {
    default: 'max-w-page',
    wide: 'max-w-7xl',
    full: 'max-w-full'
  }[maxWidth]

  // 当maxWidth为full时，移除mx-auto让内容左对齐
  const containerClass = maxWidth === 'full' 
    ? `px-8 ${maxWidthClass} ${className}`
    : `mx-auto px-8 ${maxWidthClass} ${className}`

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className={containerClass}>
        {children}
      </div>
    </div>
  )
}
