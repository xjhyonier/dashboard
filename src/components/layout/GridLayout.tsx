import { ReactNode } from 'react'

interface GridLayoutProps {
  columns?: 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

export function GridLayout({ 
  columns = 3, 
  gap = 'md',
  children,
  className = ''
}: GridLayoutProps) {
  const gapClass = {
    sm: 'gap-4',
    md: 'gap-grid',
    lg: 'gap-8'
  }[gap]

  const colsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columns]

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  )
}
