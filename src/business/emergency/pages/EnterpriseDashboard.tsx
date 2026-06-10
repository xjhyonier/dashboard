import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'

type TabKey = 'overview' | 'todo' | 'system' | 'education' | 'site' | 'dualPrevention' | 'tenant'

const TAB_LIST = [
  { key: 'overview' as const, label: '总览' },
  { key: 'todo' as const, label: '待办' },
  { key: 'system' as const, label: '制度台账' },
  { key: 'education' as const, label: '教育培训' },
  { key: 'site' as const, label: '现场管理' },
  { key: 'dualPrevention' as const, label: '双重预防' },
  { key: 'tenant' as const, label: '入驻单位管理' },
]

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF' }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14 }}>该模块暂未实现，后续逐步完善。</div>
    </div>
  )
}

export function EnterpriseDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()

  const urlTab = searchParams.get('tab')
  const activeTab: TabKey = TAB_LIST.some(t => t.key === urlTab) ? urlTab as TabKey : 'overview'

  const handleTabChange = (key: TabKey) => {
    setSearchParams({ tab: key })
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="企业使用数据看板" />

      {/* Tab 切换 */}
      <div style={{
        display: 'flex',
        gap: 0,
        marginBottom: 16,
        borderBottom: '2px solid #E5E7EB',
        background: 'white',
      }}>
        {TAB_LIST.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                marginBottom: -2,
                background: 'transparent',
                color: isActive ? '#4F46E5' : '#6B7280',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab 内容 */}
      {activeTab === 'overview' && <PlaceholderTab title="总览" />}
      {activeTab === 'todo' && <PlaceholderTab title="待办" />}
      {activeTab === 'system' && <PlaceholderTab title="制度台账" />}
      {activeTab === 'education' && <PlaceholderTab title="教育培训" />}
      {activeTab === 'site' && <PlaceholderTab title="现场管理" />}
      {activeTab === 'dualPrevention' && <PlaceholderTab title="双重预防" />}
      {activeTab === 'tenant' && <PlaceholderTab title="入驻单位管理" />}
    </div>
  )
}
