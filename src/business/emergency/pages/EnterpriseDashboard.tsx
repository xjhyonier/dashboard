import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

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

// ==================== 待办Tab Mock数据 ====================

// 待办类型
type TodoType = 'total' | 'internal' | 'supervision'

// 月度待办数据
interface MonthlyTodoData {
  month: string
  totalCount: number
  totalRead: number
  totalRectified: number
  totalRate: number
  internalCount: number
  internalRead: number
  internalRectified: number
  internalRate: number
  supervisionCount: number
  supervisionRead: number
  supervisionRectified: number
  supervisionRate: number
}

// 企业待办明细
interface EnterpriseTodoDetail {
  enterpriseName: string
  totalCount: number
  totalRead: number
  totalRectified: number
  totalRate: number
  internalCount: number
  internalRead: number
  internalRectified: number
  internalRate: number
  supervisionCount: number
  supervisionRead: number
  supervisionRectified: number
  supervisionRate: number
}

// 生成2025年7月 - 2026年6月的月度数据
const generateMonthlyTodoData = (): MonthlyTodoData[] => {
  const months = [
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
  ]
  
  return months.map(month => {
    const base = Math.floor(Math.random() * 50) + 30
    const internalBase = Math.floor(base * 0.6)
    const supervisionBase = base - internalBase
    
    const totalRead = Math.floor(base * (0.6 + Math.random() * 0.3))
    const totalRectified = Math.floor(totalRead * (0.5 + Math.random() * 0.4))
    const totalRate = totalRead > 0 ? Math.round(totalRectified / totalRead * 100) : 0
    
    const internalRead = Math.floor(internalBase * (0.6 + Math.random() * 0.3))
    const internalRectified = Math.floor(internalRead * (0.5 + Math.random() * 0.4))
    const internalRate = internalRead > 0 ? Math.round(internalRectified / internalRead * 100) : 0
    
    const supervisionRead = Math.floor(supervisionBase * (0.6 + Math.random() * 0.3))
    const supervisionRectified = Math.floor(supervisionRead * (0.5 + Math.random() * 0.4))
    const supervisionRate = supervisionRead > 0 ? Math.round(supervisionRectified / supervisionRead * 100) : 0
    
    return {
      month,
      totalCount: base,
      totalRead,
      totalRectified,
      totalRate,
      internalCount: internalBase,
      internalRead,
      internalRectified,
      internalRate,
      supervisionCount: supervisionBase,
      supervisionRead,
      supervisionRectified,
      supervisionRate,
    }
  })
}

// 生成企业待办明细数据
const generateEnterpriseTodoDetails = (): EnterpriseTodoDetail[] => {
  const enterprises = [
    '杭州华兴消防设备有限公司', '浙江久安安全科技有限公司', '杭州五常消防工程有限公司',
    '仁和街道工业园区管理委员会', '西虹桥经济开发区', '良渚文化村社区服务中心',
    '杭州消防器材厂', '浙江安防科技有限公司', '杭州应急装备有限公司',
    '五常街道社区卫生服务中心', '仁和街道中心小学', '西虹街道便民服务中心'
  ]
  
  return enterprises.map(name => {
    const totalCount = Math.floor(Math.random() * 20) + 5
    const internalCount = Math.floor(totalCount * 0.6)
    const supervisionCount = totalCount - internalCount
    
    const totalRead = Math.floor(totalCount * (0.6 + Math.random() * 0.3))
    const totalRectified = Math.floor(totalRead * (0.5 + Math.random() * 0.4))
    const totalRate = totalRead > 0 ? Math.round(totalRectified / totalRead * 100) : 0
    
    const internalRead = Math.floor(internalCount * (0.6 + Math.random() * 0.3))
    const internalRectified = Math.floor(internalRead * (0.5 + Math.random() * 0.4))
    const internalRate = internalRead > 0 ? Math.round(internalRectified / internalRead * 100) : 0
    
    const supervisionRead = Math.floor(supervisionCount * (0.6 + Math.random() * 0.3))
    const supervisionRectified = Math.floor(supervisionRead * (0.5 + Math.random() * 0.4))
    const supervisionRate = supervisionRead > 0 ? Math.round(supervisionRectified / supervisionRead * 100) : 0
    
    return {
      enterpriseName: name,
      totalCount,
      totalRead,
      totalRectified,
      totalRate,
      internalCount,
      internalRead,
      internalRectified,
      internalRate,
      supervisionCount,
      supervisionRead,
      supervisionRectified,
      supervisionRate,
    }
  }).sort((a, b) => b.totalCount - a.totalCount)
}

// 待办Tab内容组件
function TodoTabContent() {
  const monthlyData = useMemo(() => generateMonthlyTodoData(), [])
  const enterpriseDetails = useMemo(() => generateEnterpriseTodoDetails(), [])
  
  // 计算当前汇总数据（使用最新月份数据作为示例）
  const latestData = monthlyData[monthlyData.length - 1]
  
  const kpiData = [
    {
      key: 'total',
      label: '总待办',
      count: latestData.totalCount,
      read: latestData.totalRead,
      rectified: latestData.totalRectified,
      rate: latestData.totalRate,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      key: 'internal',
      label: '内部待办数',
      count: latestData.internalCount,
      read: latestData.internalRead,
      rectified: latestData.internalRectified,
      rate: latestData.internalRate,
      color: '#059669',
      bgColor: '#F0FDF4',
    },
    {
      key: 'supervision',
      label: '监管待办数',
      count: latestData.supervisionCount,
      read: latestData.supervisionRead,
      rectified: latestData.supervisionRectified,
      rate: latestData.supervisionRate,
      color: '#D97706',
      bgColor: '#FFFBEB',
    },
  ]
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 指标卡区域 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {kpiData.map(kpi => (
          <div
            key={kpi.key}
            style={{
              flex: 1,
              background: 'white',
              borderRadius: 8,
              border: `1px solid ${kpi.color}20`,
              padding: '16px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: kpi.color,
              marginBottom: 12,
            }}>
              {kpi.label}
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px 16px',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>待办数量</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>{kpi.count}</div>
              </div>
              
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>已读待办数</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6' }}>{kpi.read}</div>
              </div>
              
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>已整改待办数</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{kpi.rectified}</div>
              </div>
              
              <div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>已读待办整改率</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color }}>{kpi.rate}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 折线图区域 */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 16,
        }}>
          月度待办趋势
        </div>
        
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
              unit="%"
            />
            <Tooltip 
              contentStyle={{
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="totalCount" 
              name="待办数量" 
              stroke="#4F46E5" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="totalRead" 
              name="已读待办数" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="totalRectified" 
              name="已整改待办数" 
              stroke="#059669" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="totalRate" 
              name="已读待办整改率" 
              stroke="#D97706" 
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 待办明细表 */}
      <div style={{
        background: 'white',
        borderRadius: 8,
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 16,
        }}>
          待办明细表（按企业名称）
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#374151',
                  borderBottom: '2px solid #E5E7EB',
                  position: 'sticky',
                  left: 0,
                  background: '#F9FAFB',
                  minWidth: 180,
                }}>
                  企业名称
                </th>
                <th colSpan={4} style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#4F46E5',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '2px solid #E5E7EB',
                }}>
                  总待办
                </th>
                <th colSpan={4} style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#059669',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '2px solid #E5E7EB',
                }}>
                  内部待办
                </th>
                <th colSpan={4} style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#D97706',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '2px solid #E5E7EB',
                }}>
                  监管待办
                </th>
              </tr>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 500,
                  color: '#6B7280',
                  borderBottom: '1px solid #E5E7EB',
                  position: 'sticky',
                  left: 0,
                  background: '#F9FAFB',
                }}></th>
                {['待办数量', '已读数', '已整改数', '整改率'].map(header => (
                  <th key={header} style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#6B7280',
                    borderBottom: '1px solid #E5E7EB',
                    borderLeft: header === '待办数量' ? '2px solid #E5E7EB' : '1px solid #F3F4F6',
                    minWidth: 80,
                  }}>
                    {header}
                  </th>
                ))}
                {['待办数量', '已读数', '已整改数', '整改率'].map(header => (
                  <th key={header} style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#6B7280',
                    borderBottom: '1px solid #E5E7EB',
                    borderLeft: header === '待办数量' ? '2px solid #E5E7EB' : '1px solid #F3F4F6',
                    minWidth: 80,
                  }}>
                    {header}
                  </th>
                ))}
                {['待办数量', '已读数', '已整改数', '整改率'].map(header => (
                  <th key={header} style={{
                    padding: '8px 12px',
                    textAlign: 'center',
                    fontWeight: 500,
                    color: '#6B7280',
                    borderBottom: '1px solid #E5E7EB',
                    borderLeft: header === '待办数量' ? '2px solid #E5E7EB' : '1px solid #F3F4F6',
                    minWidth: 80,
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enterpriseDetails.map((detail, idx) => (
                <tr 
                  key={detail.enterpriseName}
                  style={{
                    background: idx % 2 === 0 ? 'white' : '#F9FAFB',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#F9FAFB'}
                >
                  <td style={{
                    padding: '10px 12px',
                    fontWeight: 500,
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                    position: 'sticky',
                    left: 0,
                    background: idx % 2 === 0 ? 'white' : '#F9FAFB',
                  }}>
                    {detail.enterpriseName}
                  </td>
                  {/* 总待办 */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '2px solid #E5E7EB',
                  }}>{detail.totalCount}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#3B82F6',
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.totalRead}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#059669',
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.totalRectified}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#4F46E5',
                    fontWeight: 600,
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.totalRate}%</td>
                  
                  {/* 内部待办 */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '2px solid #E5E7EB',
                  }}>{detail.internalCount}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#3B82F6',
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.internalRead}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#059669',
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.internalRectified}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#059669',
                    fontWeight: 600,
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.internalRate}%</td>
                  
                  {/* 监管待办 */}
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '2px solid #E5E7EB',
                  }}>{detail.supervisionCount}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#3B82F6',
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.supervisionRead}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#059669',
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.supervisionRectified}</td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#D97706',
                    fontWeight: 600,
                    borderBottom: '1px solid #F3F4F6',
                  }}>{detail.supervisionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
      {activeTab === 'todo' && <TodoTabContent />}
      {activeTab === 'system' && <PlaceholderTab title="制度台账" />}
      {activeTab === 'education' && <PlaceholderTab title="教育培训" />}
      {activeTab === 'site' && <PlaceholderTab title="现场管理" />}
      {activeTab === 'dualPrevention' && <PlaceholderTab title="双重预防" />}
      {activeTab === 'tenant' && <PlaceholderTab title="入驻单位管理" />}
    </div>
  )
}
