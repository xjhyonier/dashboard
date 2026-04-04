import { useState } from 'react'

interface RoleIndicatorProps {
  title: string
  description: string
  goals: string[]
  keyMetrics: string[]
  position?: 'top-right' | 'top-left' | 'bottom-right'
}

export function RoleIndicator({ 
  title, 
  description, 
  goals, 
  keyMetrics,
  position = 'top-right' 
}: RoleIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const positionStyles = {
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' }
  }

  return (
    <>
      {/* 角色标识按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 1000,
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          transition: 'all 0.2s'
        }}
      >
        ℹ️ {title}
      </button>

      {/* 角色说明浮层 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题 */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: '#0f172a',
                marginBottom: '8px' 
              }}>
                {title}
              </h2>
              <p style={{ 
                fontSize: '16px', 
                color: '#64748b',
                lineHeight: 1.6 
              }}>
                {description}
              </p>
            </div>

            {/* 角色目标 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '12px'
              }}>
                🎯 核心目标
              </h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                margin: 0 
              }}>
                {goals.map((goal, index) => (
                  <li
                    key={index}
                    style={{
                      padding: '8px 12px',
                      marginBottom: '8px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#475569',
                      borderLeft: '3px solid #4f46e5'
                    }}
                  >
                    {goal}
                  </li>
                ))}
              </ul>
            </div>

            {/* 关注指标 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 600,
                color: '#0f172a',
                marginBottom: '12px'
              }}>
                📊 核心指标
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                {keyMetrics.map((metric, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: '#eff6ff',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#1e40af',
                      fontWeight: 500
                    }}
                  >
                    {metric}
                  </div>
                ))}
              </div>
            </div>

            {/* 关闭按钮 */}
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
