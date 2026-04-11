import { ReactNode } from 'react'

interface SectionBlockProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionBlock({ 
  title, 
  description, 
  actions, 
  children,
  className = ''
}: SectionBlockProps) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || actions) && (
        <div className="flex items-start justify-between mb-5 pt-1">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-text leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-2 text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 ml-4 pt-0.5">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
