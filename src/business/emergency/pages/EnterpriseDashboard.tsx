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

// 镇街名称选项
const TOWN_OPTIONS = ['良渚街道', '五常街道', '仁和街道', '西虹街道']

// 风险等级选项
const RISK_LEVEL_OPTIONS = [
  { value: 'major', label: '重大风险' },
  { value: 'high', label: '较大风险' },
  { value: 'medium', label: '一般风险' },
  { value: 'low', label: '低风险' },
]

// 责任主体类型选项
const ENTITY_TYPE_OPTIONS = ['生产企业', '消防场所']

// 消防类型选项
const FIRE_TYPE_OPTIONS = ['消防重点单位', '九小场所', '一般单位']

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

  // 全局筛选状态
  const [filterTown, setFilterTown] = useState<string>('all')  // 镇街名称
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all')  // 风险等级
  const [filterEntityType, setFilterEntityType] = useState<string>('all')  // 责任主体类型
  const [filterFireType, setFilterFireType] = useState<string>('all')  // 消防类型
  const [filterEnterpriseName, setFilterEnterpriseName] = useState<string>('')  // 企业名称搜索

  const handleTabChange = (key: TabKey) => {
    setSearchParams({ tab: key })
  }

  // 重置所有筛选
  const handleResetFilters = () => {
    setFilterTown('all')
    setFilterRiskLevel('all')
    setFilterEntityType('all')
    setFilterFireType('all')
    setFilterEnterpriseName('')
  }

  const hasActiveFilters = filterTown !== 'all' || filterRiskLevel !== 'all' || filterEntityType !== 'all' || filterFireType !== 'all' || filterEnterpriseName !== ''

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="企业使用数据看板" />

      {/* 全局筛选区 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        {/* 镇街名称筛选 */}
        <select
          value={filterTown}
          onChange={e => setFilterTown(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 13,
            color: filterTown !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 130,
          }}
        >
          <option value="all">全部镇街</option>
          {TOWN_OPTIONS.map(town => (
            <option key={town} value={town}>{town}</option>
          ))}
        </select>

        {/* 风险等级筛选 */}
        <select
          value={filterRiskLevel}
          onChange={e => setFilterRiskLevel(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 13,
            color: filterRiskLevel !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 120,
          }}
        >
          <option value="all">全部风险等级</option>
          {RISK_LEVEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* 责任主体类型筛选 */}
        <select
          value={filterEntityType}
          onChange={e => setFilterEntityType(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 13,
            color: filterEntityType !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 120,
          }}
        >
          <option value="all">全部责任主体类型</option>
          {ENTITY_TYPE_OPTIONS.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {/* 消防类型筛选 */}
        <select
          value={filterFireType}
          onChange={e => setFilterFireType(e.target.value)}
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 13,
            color: filterFireType !== 'all' ? '#4F46E5' : '#6B7280',
            background: 'white',
            outline: 'none',
            minWidth: 120,
          }}
        >
          <option value="all">全部消防类型</option>
          {FIRE_TYPE_OPTIONS.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {/* 企业名称搜索 */}
        <input
          type="text"
          value={filterEnterpriseName}
          onChange={e => setFilterEnterpriseName(e.target.value)}
          placeholder="搜索企业名称..."
          style={{
            padding: '6px 12px',
            border: '1px solid #D1D5DB',
            borderRadius: 4,
            fontSize: 13,
            color: '#374151',
            background: 'white',
            outline: 'none',
            minWidth: 180,
          }}
        />

        {/* 重置筛选 */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            style={{
              padding: '6px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              background: 'white',
              color: '#6B7280',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            重置
          </button>
        )}
      </div>

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
