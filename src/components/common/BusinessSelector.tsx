import { BusinessLine } from '../../types/business'

interface BusinessSelectorProps {
  businesses: BusinessLine[]
  currentBusiness: string
  onBusinessChange: (businessId: string) => void
}

import { useState } from 'react'

export function BusinessSelector({ 
  businesses, 
  currentBusiness, 
  onBusinessChange 
}: BusinessSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      {/* 业务线选择按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 16px',
          background: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: '180px'
        }}
      >
        🏢 {businesses.find(b => b.id === currentBusiness)?.name}
        <span style={{ marginLeft: 'auto' }}>▼</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginTop: '4px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}
        >
          {businesses.map((business) => (
            <button
              key={business.id}
              onClick={() => {
                onBusinessChange(business.id)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: business.id === currentBusiness ? '#f8fafc' : 'white',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderBottom: '1px solid #f1f5f9'
              }}
            >
              <div style={{ fontWeight: 500, color: '#0f172a' }}>
                {business.name}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {business.description}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
