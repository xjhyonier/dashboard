import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
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

// 月份选项（2025-07 至 2026-12）
const MONTH_OPTIONS = [
  '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
  '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
]

// 月份多选组件
function MonthMultiSelect({ selectedMonths, onChange }: {
  selectedMonths: string[]
  onChange: (months: string[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownRef])
  
  const toggleMonth = (month: string) => {
    if (selectedMonths.includes(month)) {
      onChange(selectedMonths.filter(m => m !== month))
    } else {
      onChange([...selectedMonths, month])
    }
  }
  
  const selectAll = () => {
    onChange([...MONTH_OPTIONS])
  }
  
  const deselectAll = () => {
    onChange([])
  }
  
  const getDisplayText = () => {
    if (selectedMonths.length === 0) return '选择月份'
    if (selectedMonths.length === MONTH_OPTIONS.length) return '全部月份'
    if (selectedMonths.length <= 2) return selectedMonths.join(', ')
    return `已选${selectedMonths.length}个月`
  }
  
  return (
    <div style={{ position: 'relative' }} ref={dropdownRef as any}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: 4,
          fontSize: 13,
          color: selectedMonths.length > 0 ? '#4F46E5' : '#6B7280',
          background: 'white',
          cursor: 'pointer',
          minWidth: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>{getDisplayText()}</span>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>▼</span>
      </div>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 4,
          background: 'white',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: 280,
          maxHeight: 360,
          overflowY: 'auto',
          padding: 8,
        }}>
          {/* 操作按钮 */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: '1px solid #E5E7EB',
          }}>
            <button
              onClick={selectAll}
              style={{
                flex: 1,
                padding: '4px 8px',
                border: '1px solid #4F46E5',
                borderRadius: 4,
                background: selectedMonths.length === MONTH_OPTIONS.length ? '#4F46E5' : 'white',
                color: selectedMonths.length === MONTH_OPTIONS.length ? 'white' : '#4F46E5',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              全选
            </button>
            <button
              onClick={deselectAll}
              style={{
                flex: 1,
                padding: '4px 8px',
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                background: selectedMonths.length === 0 ? '#F3F4F6' : 'white',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              清空
            </button>
          </div>
          
          {/* 月份网格 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 4,
          }}>
            {MONTH_OPTIONS.map(month => {
              const isSelected = selectedMonths.includes(month)
              const [year, mon] = month.split('-')
              return (
                <div
                  key={month}
                  onClick={() => toggleMonth(month)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'center',
                    background: isSelected ? '#EEF2FF' : 'transparent',
                    color: isSelected ? '#4F46E5' : '#374151',
                    border: isSelected ? '1px solid #4F46E5' : '1px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#F9FAFB'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {`${year}年${parseInt(mon)}月`}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

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
      
      {/* 柱状图+折线图区域 */}
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
          <ComposedChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              content={() => {
                const items = [
                  { value: '待办数量', color: '#4F46E5', type: 'rect' },
                  { value: '已读待办数', color: '#3B82F6', type: 'rect' },
                  { value: '已整改待办数', color: '#059669', type: 'rect' },
                  { value: '已读待办整改率', color: '#D97706', type: 'line' },
                ]
                return (
                  <ul className="recharts-default-legend" style={{ display: 'flex', justifyContent: 'center', gap: 16, listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.map((item) => (
                      <li key={item.value} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#374151' }}>
                        {item.type === 'rect' ? (
                          <svg width={14} height={14} viewBox="0 0 14 14">
                            <rect width={14} height={14} fill={item.color} rx={2} />
                          </svg>
                        ) : (
                          <svg width={20} height={14} viewBox="0 0 20 14">
                            <line x1={2} y1={7} x2={18} y2={7} stroke={item.color} strokeWidth={3} strokeLinecap="round" />
                            <circle cx={4} cy={7} r={3} fill={item.color} />
                            <circle cx={16} cy={7} r={3} fill={item.color} />
                          </svg>
                        )}
                        <span style={{ fontSize: 12 }}>{item.value}</span>
                      </li>
                    ))}
                  </ul>
                )
              }}
            />
            <Bar 
              yAxisId="left"
              dataKey="totalCount" 
              name="待办数量" 
              fill="#4F46E5" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="totalRead" 
              name="已读待办数" 
              fill="#3B82F6" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="totalRectified" 
              name="已整改待办数" 
              fill="#059669" 
              barSize={20}
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="totalRate" 
              name="已读待办整改率" 
              unit="%"
              stroke="#D97706" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
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

// ==================== 制度台账Tab Mock数据 ====================

// 制度台账各维度完成状态
interface SystemCompletion {
  allComplete: boolean  // 是否全部完善
  organization: boolean  // 机构与职责
  investment: boolean    // 安全投入
  institutional: boolean // 制度化管理
  education: boolean     // 教育培训
  dualPrevention: boolean // 双重预防
  emergency: boolean    // 应急管理
  accident: boolean     // 事故管理
}

// 生产企业制度台账统计
interface ProductionSystemStat {
  riskLevel: string
  completion: SystemCompletion
}

// 消防场所制度台账统计
interface FireSystemStat {
  fireType: string
  completion: SystemCompletion
}

// 企业制度台账明细
interface EnterpriseSystemDetail {
  enterpriseName: string
  entityType: '生产企业' | '消防场所'
  riskLevel: string
  fireType: string
  completion: SystemCompletion
}

// 生成随机完成状态
const generateRandomCompletion = (): SystemCompletion => {
  const allComplete = Math.random() > 0.5
  const generateBool = () => allComplete || Math.random() > 0.5
  
  return {
    allComplete,
    organization: generateBool(),
    investment: generateBool(),
    institutional: generateBool(),
    education: generateBool(),
    dualPrevention: generateBool(),
    emergency: generateBool(),
    accident: generateBool(),
  }
}

// 计算完成率
const calcCompletionRate = (items: SystemCompletion[], key: keyof SystemCompletion): string => {
  if (key === 'allComplete') {
    const count = items.filter(item => item.allComplete).length
    return items.length > 0 ? `${count}/${items.length}` : '0/0'
  }
  const count = items.filter(item => item[key]).length
  return items.length > 0 ? `${count}/${items.length}` : '0/0'
}

// 格式化布尔值为图标
const formatBool = (val: boolean): string => val ? '✓' : '✗'

// 生成生产企业制度台账统计数据
const generateProductionSystemStats = (): ProductionSystemStat[] => {
  const riskLevels = ['重大风险', '较大风险', '一般风险', '低风险']
  return riskLevels.map(riskLevel => ({
    riskLevel,
    completion: generateRandomCompletion(),
  }))
}

// 生成消防场所制度台账统计数据
const generateFireSystemStats = (): FireSystemStat[] => {
  const fireTypes = ['消防重点单位', '九小场所', '一般单位']
  return fireTypes.map(fireType => ({
    fireType,
    completion: generateRandomCompletion(),
  }))
}

// 生成企业制度台账明细数据
const generateEnterpriseSystemDetails = (): EnterpriseSystemDetail[] => {
  const enterprises = [
    { name: '杭州华兴消防设备有限公司', type: '生产企业' as const, risk: '重大风险', fire: '-' },
    { name: '浙江久安安全科技有限公司', type: '生产企业' as const, risk: '较大风险', fire: '-' },
    { name: '杭州五常消防工程有限公司', type: '生产企业' as const, risk: '一般风险', fire: '-' },
    { name: '仁和街道工业园区管理委员会', type: '生产企业' as const, risk: '低风险', fire: '-' },
    { name: '西虹桥经济开发区', type: '消防场所' as const, risk: '-', fire: '消防重点单位' },
    { name: '良渚文化村社区服务中心', type: '消防场所' as const, risk: '-', fire: '九小场所' },
    { name: '杭州消防器材厂', type: '生产企业' as const, risk: '重大风险', fire: '-' },
    { name: '浙江安防科技有限公司', type: '生产企业' as const, risk: '较大风险', fire: '-' },
    { name: '杭州应急装备有限公司', type: '消防场所' as const, risk: '-', fire: '一般单位' },
    { name: '五常街道社区卫生服务中心', type: '消防场所' as const, risk: '-', fire: '九小场所' },
    { name: '仁和街道中心小学', type: '消防场所' as const, risk: '-', fire: '消防重点单位' },
    { name: '西虹街道便民服务中心', type: '消防场所' as const, risk: '-', fire: '一般单位' },
  ]
  
  return enterprises.map(({ name, type, risk, fire }) => ({
    enterpriseName: name,
    entityType: type,
    riskLevel: risk,
    fireType: fire,
    completion: generateRandomCompletion(),
  }))
}

// 制度台账Tab内容组件
function SystemTabContent() {
  const enterpriseDetails = useMemo(() => generateEnterpriseSystemDetails(), [])
  
  // 计算指标卡数据
  const totalEnterprises = enterpriseDetails.length
  const totalCompleted = enterpriseDetails.filter(e => e.completion.allComplete).length
  
  const productionEnterprises = enterpriseDetails.filter(e => e.entityType === '生产企业')
  const productionCompleted = productionEnterprises.filter(e => e.completion.allComplete).length
  
  const fireEnterprises = enterpriseDetails.filter(e => e.entityType === '消防场所')
  const fireCompleted = fireEnterprises.filter(e => e.completion.allComplete).length
  
  const kpiData = [
    {
      label: '已完善台账的总户数/监管总户数',
      completed: totalCompleted,
      total: totalEnterprises,
      rate: totalEnterprises > 0 ? Math.round(totalCompleted / totalEnterprises * 100) : 0,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      label: '生产企业已完善台账户数/生产企业总户数',
      completed: productionCompleted,
      total: productionEnterprises.length,
      rate: productionEnterprises.length > 0 ? Math.round(productionCompleted / productionEnterprises.length * 100) : 0,
      color: '#059669',
      bgColor: '#F0FDF4',
    },
    {
      label: '消防场所已完善台账户数/消防场所总户数',
      completed: fireCompleted,
      total: fireEnterprises.length,
      rate: fireEnterprises.length > 0 ? Math.round(fireCompleted / fireEnterprises.length * 100) : 0,
      color: '#D97706',
      bgColor: '#FFFBEB',
    },
  ]
  
  // 表格列配置
  const systemColumns = [
    { key: 'allComplete', label: '全部完善户数' },
    { key: 'organization', label: '机构与职责' },
    { key: 'investment', label: '安全投入' },
    { key: 'institutional', label: '制度化管理' },
    { key: 'education', label: '教育培训' },
    { key: 'dualPrevention', label: '双重预防' },
    { key: 'emergency', label: '应急管理' },
    { key: 'accident', label: '事故管理' },
  ]
  
  // 生产企业制度台账交叉表（按风险等级统计已完善户数）
  const productionCrossTable = useMemo(() => {
    const riskLevels = ['重大风险', '较大风险', '一般风险', '低风险']
    const productionEnterprises = enterpriseDetails.filter(e => e.entityType === '生产企业')
    
    return riskLevels.map(riskLevel => {
      const enterprises = productionEnterprises.filter(e => e.riskLevel === riskLevel)
      const total = enterprises.length
      return {
        riskLevel,
        total,
        allComplete: enterprises.filter(e => e.completion.allComplete).length,
        organization: enterprises.filter(e => e.completion.organization).length,
        investment: enterprises.filter(e => e.completion.investment).length,
        institutional: enterprises.filter(e => e.completion.institutional).length,
        education: enterprises.filter(e => e.completion.education).length,
        dualPrevention: enterprises.filter(e => e.completion.dualPrevention).length,
        emergency: enterprises.filter(e => e.completion.emergency).length,
        accident: enterprises.filter(e => e.completion.accident).length,
      }
    })
  }, [enterpriseDetails])

  // 消防场所制度台账交叉表（按消防类型统计已完善户数）
  const fireCrossTable = useMemo(() => {
    const fireTypes = ['消防重点单位', '九小场所', '一般单位']
    const fireEnterprisesList = enterpriseDetails.filter(e => e.entityType === '消防场所')
    
    return fireTypes.map(fireType => {
      const enterprises = fireEnterprisesList.filter(e => e.fireType === fireType)
      const total = enterprises.length
      return {
        fireType,
        total,
        allComplete: enterprises.filter(e => e.completion.allComplete).length,
        organization: enterprises.filter(e => e.completion.organization).length,
        investment: enterprises.filter(e => e.completion.investment).length,
        institutional: enterprises.filter(e => e.completion.institutional).length,
        education: enterprises.filter(e => e.completion.education).length,
        dualPrevention: enterprises.filter(e => e.completion.dualPrevention).length,
        emergency: enterprises.filter(e => e.completion.emergency).length,
        accident: enterprises.filter(e => e.completion.accident).length,
      }
    })
  }, [enterpriseDetails])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 指标卡区域 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {kpiData.map((kpi, idx) => (
          <div
            key={idx}
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
              fontSize: 12,
              fontWeight: 500,
              color: '#6B7280',
              marginBottom: 8,
            }}>
              {kpi.label}
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: kpi.color }}>
                {kpi.completed}
              </span>
              <span style={{ fontSize: 14, color: '#9CA3AF' }}>
                / {kpi.total}
              </span>
            </div>
            
            <div style={{
              fontSize: 12,
              color: '#9CA3AF',
            }}>
              完善率：<span style={{ color: kpi.color, fontWeight: 600 }}>{kpi.rate}%</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* 生产企业制度台账完善情况统计 */}
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
          生产企业制度台账完善情况统计（按风险等级）
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
                  minWidth: 120,
                }}>
                  风险等级
                </th>
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6B7280',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '1px solid #E5E7EB',
                  minWidth: 80,
                }}>
                  总户数
                </th>
                {systemColumns.map(col => (
                  <th key={col.key} style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6B7280',
                    borderBottom: '2px solid #E5E7EB',
                    borderLeft: '1px solid #E5E7EB',
                    minWidth: 100,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productionCrossTable.map((row, idx) => (
                <tr 
                  key={row.riskLevel}
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
                    {row.riskLevel}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 14,
                  }}>
                    {row.total}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.allComplete ? '#059669' : '#DC2626',
                    fontWeight: row.allComplete ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.allComplete}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.organization ? '#059669' : '#DC2626',
                    fontWeight: row.organization ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.organization}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.investment ? '#059669' : '#DC2626',
                    fontWeight: row.investment ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.investment}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.institutional ? '#059669' : '#DC2626',
                    fontWeight: row.institutional ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.institutional}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.education ? '#059669' : '#DC2626',
                    fontWeight: row.education ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.education}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.dualPrevention ? '#059669' : '#DC2626',
                    fontWeight: row.dualPrevention ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.dualPrevention}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.emergency ? '#059669' : '#DC2626',
                    fontWeight: row.emergency ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.emergency}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.accident ? '#059669' : '#DC2626',
                    fontWeight: row.accident ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.accident}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 消防场所制度台账完善情况统计 */}
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
          消防场所制度台账完善情况统计（按消防类型）
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
                  minWidth: 120,
                }}>
                  消防类型
                </th>
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6B7280',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '1px solid #E5E7EB',
                  minWidth: 80,
                }}>
                  总户数
                </th>
                {systemColumns.map(col => (
                  <th key={col.key} style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6B7280',
                    borderBottom: '2px solid #E5E7EB',
                    borderLeft: '1px solid #E5E7EB',
                    minWidth: 100,
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fireCrossTable.map((row, idx) => (
                <tr 
                  key={row.fireType}
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
                    {row.fireType}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#374151',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 14,
                  }}>
                    {row.total}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.allComplete ? '#059669' : '#DC2626',
                    fontWeight: row.allComplete ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.allComplete}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.organization ? '#059669' : '#DC2626',
                    fontWeight: row.organization ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.organization}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.investment ? '#059669' : '#DC2626',
                    fontWeight: row.investment ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.investment}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.institutional ? '#059669' : '#DC2626',
                    fontWeight: row.institutional ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.institutional}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.education ? '#059669' : '#DC2626',
                    fontWeight: row.education ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.education}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.dualPrevention ? '#059669' : '#DC2626',
                    fontWeight: row.dualPrevention ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.dualPrevention}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.emergency ? '#059669' : '#DC2626',
                    fontWeight: row.emergency ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.emergency}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: row.accident ? '#059669' : '#DC2626',
                    fontWeight: row.accident ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {row.accident}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 制度台账明细表 */}
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
          制度台账明细（按企业名称）
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
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6B7280',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '1px solid #E5E7EB',
                  minWidth: 100,
                }}>
                  责任主体类型
                </th>
                <th style={{
                  padding: '10px 12px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#6B7280',
                  borderBottom: '2px solid #E5E7EB',
                  borderLeft: '1px solid #E5E7EB',
                  minWidth: 100,
                }}>
                  风险等级/消防类型
                </th>
                {systemColumns.map(col => (
                  <th key={col.key} style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6B7280',
                    borderBottom: '2px solid #E5E7EB',
                    borderLeft: '1px solid #E5E7EB',
                    minWidth: 100,
                  }}>
                    {col.label}
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
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#6B7280',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                  }}>
                    {detail.entityType}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: '#6B7280',
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                  }}>
                    {detail.entityType === '生产企业' ? detail.riskLevel : detail.fireType}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.allComplete ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.allComplete ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.allComplete)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.organization ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.organization ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.organization)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.investment ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.investment ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.investment)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.institutional ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.institutional ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.institutional)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.education ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.education ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.education)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.dualPrevention ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.dualPrevention ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.dualPrevention)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.emergency ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.emergency ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.emergency)}
                  </td>
                  <td style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: detail.completion.accident ? '#059669' : '#DC2626',
                    fontWeight: detail.completion.accident ? 600 : 400,
                    borderBottom: '1px solid #F3F4F6',
                    borderLeft: '1px solid #F3F4F6',
                    fontSize: 16,
                  }}>
                    {formatBool(detail.completion.accident)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 教育培训月度数据
interface EducationMonthlyData {
  month: string
  planCount: number       // 年度培训计划制定户数
  courseCount: number     // 上传课件数量
  safetyCount: number     // 日常安全教育数量
  traineeCount: number    // 培训人数
  checkinCount: number    // 签到人数
  level3Courses: number   // 三级安全教育课程数
  level3Cards: number     // 教育卡数量
  level3Offline: number   // 线下培训数量
}

// 企业教育培训明细
interface EnterpriseEducationDetail {
  enterpriseName: string
  planCount: number
  courseCount: number
  safetyCount: number
  traineeCount: number
  checkinCount: number
  level3Courses: number
  level3Cards: number
  level3Offline: number
}

const generateEducationMonthlyData = (): EducationMonthlyData[] => {
  const months = [
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
  ]
  return months.map(month => ({
    month,
    planCount: Math.floor(Math.random() * 20) + 5,
    courseCount: Math.floor(Math.random() * 50) + 20,
    safetyCount: Math.floor(Math.random() * 40) + 15,
    traineeCount: Math.floor(Math.random() * 300) + 100,
    checkinCount: Math.floor(Math.random() * 280) + 80,
    level3Courses: Math.floor(Math.random() * 15) + 3,
    level3Cards: Math.floor(Math.random() * 30) + 10,
    level3Offline: Math.floor(Math.random() * 20) + 5,
  }))
}

const generateEnterpriseEducationDetails = (): EnterpriseEducationDetail[] => {
  const enterprises = [
    '杭州华兴消防设备有限公司', '浙江久安安全科技有限公司', '杭州五常消防工程有限公司',
    '仁和街道工业园区管理委员会', '西虹桥经济开发区', '良渚文化村社区服务中心',
    '杭州消防器材厂', '浙江安防科技有限公司', '杭州应急装备有限公司',
    '五常街道社区卫生服务中心', '仁和街道中心小学', '西虹街道便民服务中心'
  ]
  return enterprises.map(name => ({
    enterpriseName: name,
    planCount: Math.floor(Math.random() * 5) + 1,
    courseCount: Math.floor(Math.random() * 30) + 5,
    safetyCount: Math.floor(Math.random() * 20) + 3,
    traineeCount: Math.floor(Math.random() * 150) + 20,
    checkinCount: Math.floor(Math.random() * 140) + 15,
    level3Courses: Math.floor(Math.random() * 8) + 1,
    level3Cards: Math.floor(Math.random() * 15) + 3,
    level3Offline: Math.floor(Math.random() * 10) + 2,
  })).sort((a, b) => b.traineeCount - a.traineeCount)
}

// 教育培训Tab内容组件
function EducationTabContent() {
  const monthlyData = useMemo(() => generateEducationMonthlyData(), [])
  const enterpriseDetails = useMemo(() => generateEnterpriseEducationDetails(), [])

  const latest = monthlyData[monthlyData.length - 1]

  // 教育培训 KPI
  const educationKpis = [
    { label: '年度培训计划制定户数', value: latest.planCount, color: '#4F46E5' },
    { label: '上传课件数量', value: latest.courseCount, color: '#3B82F6' },
    { label: '日常安全教育数量', value: latest.safetyCount, color: '#059669' },
    { label: '培训人数', value: latest.traineeCount, color: '#D97706' },
    { label: '签到人数', value: latest.checkinCount, color: '#DC2626' },
  ]

  // 三级安全教育 KPI
  const level3Kpis = [
    { label: '三级安全教育课程数', value: latest.level3Courses, color: '#7C3AED' },
    { label: '教育卡数量', value: latest.level3Cards, color: '#DB2777' },
    { label: '线下培训数量', value: latest.level3Offline, color: '#0891B2' },
  ]

  // 教育培训折线图配置
  const educationChartLines = [
    { dataKey: 'planCount', name: '年度培训计划制定户数', stroke: '#4F46E5' },
    { dataKey: 'courseCount', name: '上传课件数量', stroke: '#3B82F6' },
    { dataKey: 'safetyCount', name: '日常安全教育数量', stroke: '#059669' },
    { dataKey: 'traineeCount', name: '培训人数', stroke: '#D97706' },
    { dataKey: 'checkinCount', name: '签到人数', stroke: '#DC2626' },
  ]

  // 三级安全教育折线图配置
  const level3ChartLines = [
    { dataKey: 'level3Courses', name: '三级安全教育课程数', stroke: '#7C3AED' },
    { dataKey: 'level3Cards', name: '教育卡数量', stroke: '#DB2777' },
    { dataKey: 'level3Offline', name: '线下培训数量', stroke: '#0891B2' },
  ]

  // 明细表列配置
  const detailColumns = [
    ...educationKpis,
    ...level3Kpis,
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 教育培训 */}

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧：指标卡 */}
        <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>教育培训</div>
          {educationKpis.map(kpi => (
            <div key={kpi.label} style={{
              background: 'white',
              borderRadius: 6,
              border: `1px solid ${kpi.color}20`,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* 右侧：折线图 */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px', minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>教育培训月度趋势</div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {educationChartLines.map(line => (
                <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.stroke} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 三级安全教育 */}

      <div style={{ display: 'flex', gap: 16 }}>
        {/* 左侧：指标卡 */}
        <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>三级安全教育</div>
          {level3Kpis.map(kpi => (
            <div key={kpi.label} style={{
              background: 'white',
              borderRadius: 6,
              border: `1px solid ${kpi.color}20`,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* 右侧：折线图 */}
        <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px', minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>三级安全教育月度趋势</div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              {level3ChartLines.map(line => (
                <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.stroke} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 企业明细表 */}

      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>企业明细表（按企业名称）</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #E5E7EB', position: 'sticky', left: 0, background: '#F9FAFB', minWidth: 180 }}>企业名称</th>
                <th colSpan={5} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#4F46E5', borderBottom: '2px solid #E5E7EB', borderLeft: '2px solid #E5E7EB' }}>教育培训</th>
                <th colSpan={3} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#7C3AED', borderBottom: '2px solid #E5E7EB', borderLeft: '2px solid #E5E7EB' }}>三级安全教育</th>
              </tr>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#6B7280', borderBottom: '1px solid #E5E7EB', position: 'sticky', left: 0, background: '#F9FAFB' }}></th>
                {educationKpis.map(kpi => (
                  <th key={kpi.label} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6B7280', borderBottom: '1px solid #E5E7EB', borderLeft: '1px solid #F3F4F6', minWidth: 90, fontSize: 12 }}>{kpi.label}</th>
                ))}
                {level3Kpis.map(kpi => (
                  <th key={kpi.label} style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 500, color: '#6B7280', borderBottom: '1px solid #E5E7EB', borderLeft: '2px solid #E5E7EB', minWidth: 90, fontSize: 12 }}>{kpi.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enterpriseDetails.map((detail, idx) => (
                <tr key={detail.enterpriseName} style={{ background: idx % 2 === 0 ? 'white' : '#F9FAFB' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#F9FAFB'}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#374151', borderBottom: '1px solid #F3F4F6', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'white' : '#F9FAFB' }}>{detail.enterpriseName}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6', borderLeft: '2px solid #E5E7EB' }}>{detail.planCount}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#3B82F6', borderBottom: '1px solid #F3F4F6' }}>{detail.courseCount}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#059669', borderBottom: '1px solid #F3F4F6' }}>{detail.safetyCount}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#D97706', borderBottom: '1px solid #F3F4F6' }}>{detail.traineeCount}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#DC2626', borderBottom: '1px solid #F3F4F6' }}>{detail.checkinCount}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#7C3AED', borderBottom: '1px solid #F3F4F6', borderLeft: '2px solid #E5E7EB' }}>{detail.level3Courses}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#DB2777', borderBottom: '1px solid #F3F4F6' }}>{detail.level3Cards}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#0891B2', borderBottom: '1px solid #F3F4F6' }}>{detail.level3Offline}</td>
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
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])  // 月份多选

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
    setSelectedMonths([])
  }

  const hasActiveFilters = filterTown !== 'all' || filterRiskLevel !== 'all' || filterEntityType !== 'all' || filterFireType !== 'all' || filterEnterpriseName !== '' || selectedMonths.length > 0

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

        {/* 月份多选 */}
        <MonthMultiSelect selectedMonths={selectedMonths} onChange={setSelectedMonths} />

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
      {activeTab === 'system' && <SystemTabContent />}
      {activeTab === 'education' && <EducationTabContent />}
      {activeTab === 'site' && <PlaceholderTab title="现场管理" />}
      {activeTab === 'dualPrevention' && <PlaceholderTab title="双重预防" />}
      {activeTab === 'tenant' && <PlaceholderTab title="入驻单位管理" />}
    </div>
  )
}
