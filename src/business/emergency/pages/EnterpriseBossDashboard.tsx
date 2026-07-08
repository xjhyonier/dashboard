import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { PageShell, PageHeader, SectionBlock } from '../../../components/layout'
import { RoleIndicator } from '../../../components/common'
import { enterpriseBossMock } from './mock/enterprise-boss'

// 通用样式
const th: React.CSSProperties = {
  padding: '6px 8px',
  background: '#F9FAFB',
  fontWeight: 600,
  fontSize: 11,
  color: '#374151',
  borderBottom: '1px solid #E5E7EB',
  textAlign: 'center',
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '5px 8px',
  fontSize: 12,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  textAlign: 'center',
  verticalAlign: 'middle',
}

export function EnterpriseBossDashboard() {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('month')
  const [dateFrom, setDateFrom] = useState('2026-01-01')
  const [dateTo, setDateTo] = useState('2026-07-07')
  const [snapshotFilter, setSnapshotFilter] = useState<'snapshot' | 'adminSnapshot'>('snapshot')
  const [eduTimeFilter, setEduTimeFilter] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'>('thisYear')
  const [eduMonthFrom, setEduMonthFrom] = useState('2026-01')
  const [eduMonthTo, setEduMonthTo] = useState('2026-07')
  const [safetyMonth, setSafetyMonth] = useState('2026-07')
  const [partyPage, setPartyPage] = useState(1)
  const PARTY_PAGE_SIZE = 6
  const [activeSection, setActiveSection] = useState('')

  // 板块导航配置
  const sections = [
    { id: 'section-safety-responsibility', label: '一、安全责任主体情况', conditional: true },
    { id: 'section-risk-overview', label: '二、风险分级管控情况' },
    { id: 'section-hazard-management', label: '三、隐患排查治理情况' },
    { id: 'section-education', label: '四、教育培训' },
    { id: 'section-site-management', label: '五、现场管理' },
    { id: 'section-compliance', label: '六、制度台账管理' },
  ]

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY + 120
      let current = ''
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.offsetTop <= scrollTop) {
          current = s.id
        }
      }
      if (current) setActiveSection(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { hazardManagement } = enterpriseBossMock
  const { dailyCheck, specialCheck, governance } = hazardManagement
  const snapshot = hazardManagement[snapshotFilter]

  // 饼图计算
  const totalSource = governance.sourceStats.reduce((s, x) => s + x.value, 0)
  const pieData = governance.sourceStats.map((s, i) => {
    const prev = governance.sourceStats.slice(0, i).reduce((a, b) => a + b.value, 0)
    const start = (prev / totalSource) * 360
    const end = ((prev + s.value) / totalSource) * 360
    return { ...s, start, end }
  })

  // 教育培训月度趋势图数据
  const { educationTraining } = enterpriseBossMock
  const eduMonthlyTrend = educationTraining.monthlyTrend

  // Tooltip 排序
  const EDU_TOOLTIP_ORDER = [
    { key: 'sessions', label: '总数', unit: '场', color: '#7C3AED' },
    { key: 'completed', label: '已结束', unit: '场', color: '#4F46E5' },
    { key: 'inProgress', label: '进行中', unit: '场', color: '#F59E0B' },
    { key: 'shouldTrain', label: '应培训人数', unit: '人', color: '#059669' },
    { key: 'actualSignIn', label: '实际签到人数', unit: '人', color: '#DC2626' },
  ]

  const EduTrendTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null
    const data = payload[0]?.payload || {}
    return (
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #F3F4F6' }}>{label}</div>
        {EDU_TOOLTIP_ORDER.map(({ key, label: itemLabel, unit, color }) => {
          const val = data[key]
          if (val == null) return null
          return (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '2px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
                {itemLabel}
              </span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{val}{unit}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // 风险汇总卡片
  const RiskSummaryCard: React.FC<{
    totalLabel: string
    data: { total: number; major: number; large: number; general: number; low: number }
    unit: string
  }> = ({ totalLabel, data, unit }) => {
    const riskItems = [
      { label: '重大风险', value: data.major, color: '#DC2626', bg: '#FEF2F2' },
      { label: '较大风险', value: data.large, color: '#EA580C', bg: '#FFF7ED' },
      { label: '一般风险', value: data.general, color: '#D97706', bg: '#FFFBEB' },
      { label: '低风险', value: data.low, color: '#059669', bg: '#F0FDF4' },
    ]
    return (
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', padding: '18px 20px', display: 'flex', gap: 20 }}>
        {/* 左侧：总数 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 100, borderRight: '1px solid #E5E7EB', paddingRight: 20 }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 4 }}>{totalLabel}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{data.total}</span>
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>{unit}</span>
          </div>
        </div>
        {/* 右侧：风险分类 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {riskItems.map((item, i) => (
              <div key={i} style={{ flex: 1, background: item.bg, borderRadius: 6, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 5.1 作业安全管理 - 按月份筛选数据
  const safetyMonthData = enterpriseBossMock.workSafety.filter(d => d.month === safetyMonth)
  const safetyTotal = safetyMonthData.reduce((s, d) => s + d.count, 0)
  const safetyTypes = ['动火作业', '高处作业', '受限空间', '临时用电', '吊装作业', '其他']
  const safetyStatuses = ['待作业许可', '待现场签批', '待验收', '已完成']
  const safetyByType = (type: string) => safetyMonthData.filter(d => d.type === type).reduce((s, d) => s + d.count, 0)
  const safetyByStatus = (status: string) => safetyMonthData.filter(d => d.status === status).reduce((s, d) => s + d.count, 0)

  // 5.3 作业票报备 - 按月份筛选数据
  const permitMonthData = enterpriseBossMock.workPermitReport.filter(d => d.month === safetyMonth)
  const permitTotal = permitMonthData.reduce((s, d) => s + d.count, 0)
  const permitTypes = ['动火作业', '高处作业', '受限空间', '临时用电', '吊装作业', '其他']
  const permitStatuses = ['通过', '待审批', '驳回']
  const permitByType = (type: string) => permitMonthData.filter(d => d.type === type).reduce((s, d) => s + d.count, 0)
  const permitByStatus = (status: string) => permitMonthData.filter(d => d.approvalStatus === status).reduce((s, d) => s + d.count, 0)

  const linkBtnStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    marginTop: 8,
    padding: '4px 12px',
    border: '1px solid #4F46E5',
    borderRadius: 4,
    background: '#EEF2FF',
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  }

  return (
    <>
      <RoleIndicator
        title="企业数据看板"
        description="作为企业负责人，您需要关注企业的安全风险状况、隐患排查治理、制度台账合规和现场作业管理。"
        goals={[
          '了解企业当前风险分级状况',
          '掌握隐患排查治理进度',
          '查看制度台账合规情况',
          '监督现场作业票报备',
        ]}
        keyMetrics={[
          '风险总数与分级',
          '隐患整改完成率',
          '制度台账合规率',
          '作业票报备合规率',
        ]}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* 左侧导航 */}
        <nav style={{
          width: 168, flexShrink: 0, position: 'sticky', top: 20,
          background: 'white', borderRadius: 10, border: '1px solid #E5E7EB',
          padding: '16px 0', marginRight: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', padding: '0 16px 14px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
            📋 板块导航
          </div>
          {sections.filter(s => !s.conditional || enterpriseBossMock.safetyResponsibility.hasTenant).map((s, idx) => {
            const isActive = activeSection === s.id
            const icons = ['🏢', '⚠️', '🔍', '📚', '🏗️', '📋']
            const displayIdx = sections.filter(ss => !ss.conditional || enterpriseBossMock.safetyResponsibility.hasTenant).findIndex(ss => ss.id === s.id)
            return (
              <a
                key={s.id}
                onClick={e => { e.preventDefault(); scrollToSection(s.id) }}
                href={`#${s.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px 8px 12px',
                  margin: '1px 8px',
                  borderRadius: 6,
                  fontSize: 12,
                  color: isActive ? '#4F46E5' : '#6B7280',
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? '#EEF2FF' : 'transparent',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.color = '#374151'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#6B7280'
                  }
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icons[displayIdx]}</span>
                <span style={{ lineHeight: 1.4 }}>{s.label}</span>
              </a>
            )
          })}
        </nav>

        {/* 右侧内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
      <PageShell>
        <PageHeader
          title="企业安全概览"
          subtitle="本企业安全状况、隐患排查、制度台账与现场管理"
          updateTime={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:00`}
        />

        {/* ─── 一、安全责任主体情况 ──────────────────────────────── */}
        <div id="section-safety-responsibility" style={{ scrollMarginTop: 80 }}>
        {enterpriseBossMock.safetyResponsibility.hasTenant && (
        <SectionBlock title="一、安全责任主体情况">
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <RiskSummaryCard
                totalLabel="企业总数"
                data={enterpriseBossMock.safetyResponsibility.enterpriseCount}
                unit="家"
              />
            </div>
            <div style={{ flex: 1 }}>
              <RiskSummaryCard
                totalLabel="场所总数"
                data={enterpriseBossMock.safetyResponsibility.venueCount}
                unit="个"
              />
            </div>
          </div>
        </SectionBlock>
        )}
        </div>

        {/* ─── 二、风险分级管控情况 ───────────────────────────── */}
        <div id="section-risk-overview" style={{ scrollMarginTop: 80 }}>
        <SectionBlock title="二、风险分级管控情况">
          <div style={{ display: 'flex', gap: 16 }}>
            {enterpriseBossMock.riskOverview.map((metric, index) => {
              const trendColor = metric.trend.type === 'up' ? '#059669' : metric.trend.type === 'down' ? '#DC2626' : '#9CA3AF'
              const trendIcon = metric.trend.type === 'up' ? '↑' : metric.trend.type === 'down' ? '↓' : '→'
              const cardColors = [
                { bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '#93C5FD', valueColor: '#1D4ED8', labelColor: '#3B82F6', accent: '#3B82F6' },
                { bg: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', border: '#FCA5A5', valueColor: '#DC2626', labelColor: '#DC2626', accent: '#EF4444' },
                { bg: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)', border: '#FDBA74', valueColor: '#EA580C', labelColor: '#EA580C', accent: '#F97316' },
                { bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '#FCD34D', valueColor: '#D97706', labelColor: '#D97706', accent: '#F59E0B' },
                { bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '#86EFAC', valueColor: '#059669', labelColor: '#059669', accent: '#10B981' },
              ]
              const cc = cardColors[index] || cardColors[0]
              return (
                <div key={index} style={{ flex: 1, background: cc.bg, borderRadius: 8, border: `1px solid ${cc.border}`, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: cc.labelColor, marginBottom: 8 }}>{metric.title}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 30, fontWeight: 700, color: cc.valueColor }}>{metric.value}</span>
                    {metric.unit && <span style={{ fontSize: 13, color: cc.accent }}>{metric.unit}</span>}
                    {metric.trend && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: trendColor, marginLeft: 4 }}>
                        <span>{trendIcon}</span>
                        <span>{Math.abs(metric.trend.value)}</span>
                        <span style={{ color: '#9CA3AF' }}>{metric.trend.label}</span>
                      </span>
                    )}
                    {!metric.trend && metric.description && (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{metric.description}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionBlock>
        </div>

        {/* ─── 三、隐患排查治理情况 ───────────────────────────── */}
        <div id="section-hazard-management" style={{ scrollMarginTop: 80 }}>
        <SectionBlock title="三、隐患排查治理情况">
          {/* 时间筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>创建时间:</span>
            {([
              { key: 'today' as const, label: '今日' },
              { key: 'week' as const, label: '本周' },
              { key: 'month' as const, label: '本月' },
              { key: 'year' as const, label: '本年' },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setTimeFilter(opt.key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: timeFilter === opt.key ? '#3B82F6' : '#E5E7EB',
                  background: timeFilter === opt.key ? '#EFF6FF' : 'white',
                  color: timeFilter === opt.key ? '#3B82F6' : '#6B7280',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: timeFilter === opt.key ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
                fontSize: 12, color: '#374151', background: 'white', outline: 'none',
              }}
            />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
                fontSize: 12, color: '#374151', background: 'white', outline: 'none',
              }}
            />
            <button style={{ padding: '3px 14px', border: 'none', borderRadius: 4, background: '#3B82F6', color: 'white', fontSize: 12, cursor: 'pointer' }}>查询</button>
            <button style={{ padding: '3px 14px', border: '1px solid #E5E7EB', borderRadius: 4, background: 'white', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>重置</button>
          </div>

          {/* 日常检查 + 专项检查 + 随手拍 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'stretch' }}>
            {/* 日常检查统计 */}
            <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, background: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋</span> 日常检查统计
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>总任务数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{dailyCheck.total}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>已检查任务数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{dailyCheck.checked}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#FFF7ED', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>超时未检查</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706' }}>{dailyCheck.overdue}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>发现隐患数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>{dailyCheck.hazards}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={th}>序号</th>
                    <th style={{ ...th, textAlign: 'left' }}>任务名称</th>
                    <th style={th}>总任务数</th>
                    <th style={th}>已检查</th>
                    <th style={th}>超时未检查</th>
                    <th style={th}>发现隐患</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyCheck.tasks.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, textAlign: 'left' }}>{t.name}</td>
                      <td style={td}>{t.total}</td>
                      <td style={td}>{t.checked}</td>
                      <td style={{ ...td, color: '#D97706' }}>{t.overdue}</td>
                      <td style={{ ...td, color: '#DC2626' }}>{t.hazards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 专项检查统计 */}
            <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, background: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋</span> 专项检查统计
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>总任务数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{specialCheck.total}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>已检查任务数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{specialCheck.checked}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#FFF7ED', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>超时未检查</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#D97706' }}>{specialCheck.overdue}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#FEF2F2', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>发现隐患数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>{specialCheck.hazards}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={th}>序号</th>
                    <th style={{ ...th, textAlign: 'left' }}>任务名称</th>
                    <th style={th}>总任务数</th>
                    <th style={th}>已检查</th>
                    <th style={th}>超时未检查</th>
                    <th style={th}>发现隐患</th>
                  </tr>
                </thead>
                <tbody>
                  {specialCheck.tasks.map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={{ ...td, textAlign: 'left' }}>{t.name}</td>
                      <td style={td}>{t.total}</td>
                      <td style={td}>{t.checked}</td>
                      <td style={{ ...td, color: '#D97706' }}>{t.overdue}</td>
                      <td style={{ ...td, color: '#DC2626' }}>{t.hazards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 随手拍统计 */}
            <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, background: 'white', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📸</span> 随手拍统计
                </div>
                <select
                  value={snapshotFilter}
                  onChange={e => setSnapshotFilter(e.target.value as 'snapshot' | 'adminSnapshot')}
                  style={{ padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 4, fontSize: 12, color: '#6B7280', background: 'white' }}
                >
                  <option value="snapshot">随手拍统计</option>
                  <option value="adminSnapshot">安管员随手拍</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>随手拍隐患数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{snapshot.total}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>AI识别隐患 {snapshot.aiRecognized}</div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>隐患确认数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{snapshot.confirmed}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                  <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>重大事故隐患数{snapshot.majorHazard}</div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>隐患整改数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{snapshot.rectified}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 5, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 1 }}>隐患验收数</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{snapshot.reward}<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>个</span></div>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={th}>序号</th>
                    <th style={{ ...th, textAlign: 'left' }}>员工姓名</th>
                    <th style={{ ...th, textAlign: 'left' }}>人员类型</th>
                    <th style={th}>随手拍隐患数</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.persons.slice(0, 5).map((p, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                      <td style={td}>{i + 5}</td>
                      <td style={{ ...td, textAlign: 'left' }}>{p.name}</td>
                      <td style={{ ...td, textAlign: 'left' }}>{p.type}</td>
                      <td style={td}>{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 隐患治理情况（左右分栏） */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            {/* 左侧：排查隐患 + 来源统计 */}
            <div style={{ flex: '0 0 340px', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, background: 'white' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                🔍 隐患治理与来源
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', borderRadius: 6, padding: '10px 8px', textAlign: 'center', border: '1px solid #BAE6FD' }}>
                  <div style={{ fontSize: 10, color: '#0369A1', marginBottom: 2 }}>排查隐患数</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0284C7' }}>{governance.found}<span style={{ fontSize: 10, fontWeight: 400, color: '#7DD3FC', marginLeft: 2 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderRadius: 6, padding: '10px 8px', textAlign: 'center', border: '1px solid #FDE68A' }}>
                  <div style={{ fontSize: 10, color: '#92400E', marginBottom: 2 }}>待确认隐患数</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706' }}>{governance.pendingConfirm}<span style={{ fontSize: 10, fontWeight: 400, color: '#FCD34D', marginLeft: 2 }}>个</span></div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>隐患来源统计</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    {pieData.map((s, i) => (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="24"
                        strokeDasharray={`${(s.value / totalSource) * 238.76} 238.76`}
                        strokeDashoffset={-(pieData.slice(0, i).reduce((a, b) => a + b.value, 0) / totalSource) * 238.76}
                      />
                    ))}
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{totalSource}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF' }}>隐患总数</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {governance.sourceStats.map((s, i) => {
                    const pct = totalSource > 0 ? ((s.value / totalSource) * 100).toFixed(1) : '0.0'
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 4,
                          cursor: 'pointer', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#374151', flex: 1 }}>{s.source}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF', marginRight: 2 }}>{pct}%</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#111827', minWidth: 20, textAlign: 'right' }}>{s.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 右侧：整改情况 + 类型统计 */}
            <div style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, background: 'white' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                🔧 隐患整改情况
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[
                  { label: '隐患总数', value: governance.rectification.total, unit: '个', bg: '#F9FAFB', border: '#D1D5DB', color: '#111827' },
                  { label: '已整改', value: governance.rectification.completed, unit: '个', bg: '#F0FDF4', border: '#86EFAC', color: '#059669' },
                  { label: '整改中', value: governance.rectification.inProgress, unit: '个', bg: '#F9FAFB', border: '#D1D5DB', color: '#111827' },
                  { label: '验收中', value: governance.rectification.verifying, unit: '个', bg: '#F9FAFB', border: '#D1D5DB', color: '#111827' },
                  { label: '超时未整改', value: governance.rectification.overdue, unit: '个', bg: '#FEF2F2', border: '#FCA5A5', color: '#DC2626' },
                  { label: '整改完成率', value: `${governance.rectification.completionRate}%`, unit: '', bg: '#F0FDF4', border: '#86EFAC', color: '#059669' },
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, background: item.bg, borderRadius: 6, padding: '6px 8px', textAlign: 'center', border: `1px solid ${item.border}` }}>
                    <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                      {item.value}{item.unit && <span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{item.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* 重大事故隐患整改情况 */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#DC2626', marginBottom: 8 }}>
                ⚠️ 重大事故隐患情况
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[
                  { label: '隐患总数', value: governance.majorRectification.total, unit: '个', bg: '#FEF2F2', border: '#FCA5A5', color: '#DC2626' },
                  { label: '已整改', value: governance.majorRectification.completed, unit: '个', bg: '#F0FDF4', border: '#86EFAC', color: '#059669' },
                  { label: '整改中', value: governance.majorRectification.inProgress, unit: '个', bg: '#F9FAFB', border: '#D1D5DB', color: '#111827' },
                  { label: '验收中', value: governance.majorRectification.verifying, unit: '个', bg: '#F9FAFB', border: '#D1D5DB', color: '#111827' },
                  { label: '超时未整改', value: governance.majorRectification.overdue, unit: '个', bg: '#FEF2F2', border: '#FCA5A5', color: '#DC2626' },
                  { label: '整改完成率', value: `${governance.majorRectification.completionRate}%`, unit: '', bg: '#F0FDF4', border: '#86EFAC', color: '#059669' },
                ].map((item, i) => (
                  <div key={i} style={{ flex: 1, background: item.bg, borderRadius: 6, padding: '6px 8px', textAlign: 'center', border: `1px solid ${item.border}` }}>
                    <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                      {item.value}{item.unit && <span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{item.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 8 }}>隐患类型统计</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {governance.typeStats.map((t, i) => {
                  const max = Math.max(...governance.typeStats.map(x => x.count))
                  const w = Math.round((t.count / max) * 100)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 70, fontSize: 11, color: '#374151', textAlign: 'right', flexShrink: 0 }}>{t.type}</span>
                      <div style={{ flex: 1, height: 20, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(w, 4)}%`, height: '100%', background: '#3B82F6', borderRadius: 3, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                          <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{t.count}个</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </SectionBlock>
        </div>

        {/* ─── 四、教育培训 ──────────────────────────────────── */}
        <div id="section-education" style={{ scrollMarginTop: 80 }}>
        <SectionBlock
          title="四、教育培训"
          description="安全生产教育培训计划与执行情况"
        >
          {/* 时间筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>时间:</span>
            {([
              { key: 'thisMonth' as const, label: '本月' },
              { key: 'lastMonth' as const, label: '上月' },
              { key: 'thisYear' as const, label: '本年' },
              { key: 'lastYear' as const, label: '上年' },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setEduTimeFilter(opt.key)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: eduTimeFilter === opt.key ? '#3B82F6' : '#E5E7EB',
                  background: eduTimeFilter === opt.key ? '#EFF6FF' : 'white',
                  color: eduTimeFilter === opt.key ? '#3B82F6' : '#6B7280',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: eduTimeFilter === opt.key ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
            <input
              type="month"
              value={eduMonthFrom}
              onChange={e => setEduMonthFrom(e.target.value)}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
                fontSize: 12, color: '#374151', background: 'white', outline: 'none',
              }}
            />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
            <input
              type="month"
              value={eduMonthTo}
              onChange={e => setEduMonthTo(e.target.value)}
              style={{
                padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
                fontSize: 12, color: '#374151', background: 'white', outline: 'none',
              }}
            />
            <button style={{ padding: '3px 14px', border: 'none', borderRadius: 4, background: '#3B82F6', color: 'white', fontSize: 12, cursor: 'pointer' }}>查询</button>
            <button style={{ padding: '3px 14px', border: '1px solid #E5E7EB', borderRadius: 4, background: 'white', color: '#6B7280', fontSize: 12, cursor: 'pointer' }}>重置</button>
          </div>

          {/* 第一行 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, background: enterpriseBossMock.educationTraining.hasAnnualPlan ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, padding: '14px 16px', border: `1px solid ${enterpriseBossMock.educationTraining.hasAnnualPlan ? '#86EFAC' : '#FCA5A5'}` }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>年度培训计划是否制定</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: enterpriseBossMock.educationTraining.hasAnnualPlan ? '#059669' : '#DC2626' }}>
                  {enterpriseBossMock.educationTraining.hasAnnualPlan ? '已制定' : '未制定'}
                </span>
                <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>查看详情 →</a>
              </div>
            </div>
            <div style={{ flex: 1, background: '#EFF6FF', borderRadius: 8, padding: '14px 16px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>日常安全教育总场次</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#3B82F6' }}>{enterpriseBossMock.educationTraining.dailySafetyTotal}<span style={{ fontSize: 11, fontWeight: 400, color: '#93C5FD', marginLeft: 3 }}>场</span></span>
                <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>查看详情 →</a>
              </div>
            </div>
            <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 8, padding: '14px 16px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>课件数量</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{enterpriseBossMock.educationTraining.courseCount}<span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>个</span></span>
                <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>查看详情 →</a>
              </div>
            </div>
            <div style={{ flex: 1, background: '#FFF7ED', borderRadius: 8, padding: '14px 16px', border: '1px solid #FED7AA' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, textAlign: 'center' }}>三级教育卡数量</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#D97706' }}>{enterpriseBossMock.educationTraining.threeLevelEduCards}<span style={{ fontSize: 11, fontWeight: 400, color: '#FDBA74', marginLeft: 3 }}>张</span></span>
                <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>查看详情 →</a>
              </div>
            </div>
          </div>

          {/* 第二行：日常安全教育 */}
          <div style={{ border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 12px 12px', marginBottom: 16, background: 'white' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', marginBottom: 8, marginLeft: 2 }}>日常安全教育</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: '总数', value: enterpriseBossMock.educationTraining.dailySafetyTraining.total, unit: '场', bg: '#F9FAFB', color: '#111827' },
                { label: '进行中', value: enterpriseBossMock.educationTraining.dailySafetyTraining.inProgress, unit: '场', bg: '#FFF7ED', color: '#D97706' },
                { label: '已结束', value: enterpriseBossMock.educationTraining.dailySafetyTraining.completed, unit: '场', bg: '#F0FDF4', color: '#059669' },
                { label: '未发布', value: enterpriseBossMock.educationTraining.dailySafetyTraining.unpublished, unit: '场', bg: '#FEF2F2', color: '#DC2626' },
                { label: '应培训人数', value: enterpriseBossMock.educationTraining.shouldTrainCount, unit: '人', bg: '#F9FAFB', color: '#111827' },
                { label: '实际签到人数', value: enterpriseBossMock.educationTraining.actualSignInCount, unit: '人', bg: '#EFF6FF', color: '#3B82F6' },
                { label: '考试完成率', value: `${enterpriseBossMock.educationTraining.examCompletionRate}%`, unit: '', bg: '#F0FDF4', color: '#059669' },
                { label: '考试及格率', value: `${enterpriseBossMock.educationTraining.examPassRate}%`, unit: '', bg: '#F0FDF4', color: '#059669' },
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, background: item.bg, borderRadius: 5, padding: '8px 6px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
                    {item.value}{item.unit && <span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF', marginLeft: 2 }}>{item.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 月度数据趋势图 */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 18px 14px', marginBottom: 16, background: 'white' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>日常安全教育月度数据趋势</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart
                data={eduMonthlyTrend}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  domain={[0, 30]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[200, 350]}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<EduTrendTooltip />} />
                <Legend
                  content={() => (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 4, fontSize: 11, color: '#6B7280' }}>
                      {EDU_TOOLTIP_ORDER.map(({ key, label, color }) => (
                        <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 12, height: 3, borderRadius: 1, background: color, display: 'inline-block' }} />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                />
                <Bar yAxisId="left" dataKey="sessions" name="总数" fill="#7C3AED" radius={[2, 2, 0, 0]} barSize={6} />
                <Bar yAxisId="left" dataKey="completed" name="已结束" fill="#4F46E5" radius={[2, 2, 0, 0]} barSize={6} />
                <Bar yAxisId="left" dataKey="inProgress" name="进行中" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={6} />
                <Line yAxisId="right" type="monotone" dataKey="shouldTrain" name="应培训人数" stroke="#059669" strokeWidth={2} dot={{ r: 3, fill: '#059669', strokeWidth: 0 }} />
                <Line yAxisId="right" type="monotone" dataKey="actualSignIn" name="实际签到人数" stroke="#DC2626" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#DC2626', strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </SectionBlock>
        </div>

        {/* ─── 五、现场管理 ────────────────────────────────── */}
        <div id="section-site-management" style={{ scrollMarginTop: 80 }}>
        <SectionBlock
          title="五、现场管理"
        >
          {/* 5.1 + 5.2 + 5.3 并排 */}
          <div>
            {/* 共享时间筛选 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>月份:</span>
              <input
                type="month"
                value={safetyMonth}
                onChange={e => setSafetyMonth(e.target.value)}
                style={{
                  padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
                  fontSize: 12, color: '#374151', background: 'white', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* 5.1 作业安全管理 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', paddingLeft: 4, borderLeft: '3px solid #DC2626', marginBottom: 10 }}>
                5.1 作业安全管理
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)', borderRadius: 8, padding: '14px 16px', border: '1px solid #FECACA' }}>
                  <div style={{ fontSize: 11, color: '#991B1B', marginBottom: 4, textAlign: 'center' }}>作业票总数</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>{safetyTotal}<span style={{ fontSize: 11, fontWeight: 400, color: '#F87171', marginLeft: 3 }}>张</span></span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>查看详情 →</a>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: 'left' }}>作业票类型</th>
                        <th style={th}>数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safetyTypes.map((type, i) => (
                        <tr key={type} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                          <td style={{ ...td, textAlign: 'left' }}>{type}</td>
                          <td style={{ ...td, fontWeight: 600 }}>{safetyByType(type)} 张</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: 'left' }}>作业票状态</th>
                        <th style={th}>数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safetyStatuses.map((status, i) => {
                        const colorMap: Record<string, { bg: string; color: string }> = {
                          '已完成': { bg: '#F0FDF4', color: '#059669' },
                          '待验收': { bg: '#FFF7ED', color: '#D97706' },
                          '待现场签批': { bg: '#EFF6FF', color: '#3B82F6' },
                          '待作业许可': { bg: '#FAF5FF', color: '#9333EA' },
                        }
                        const c = colorMap[status]
                        return (
                          <tr key={status} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                            <td style={{ ...td, textAlign: 'left' }}>
                              <span style={{ padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color }}>
                                {status}
                              </span>
                            </td>
                            <td style={{ ...td, fontWeight: 600 }}>{safetyByStatus(status)} 张</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5.2 作业票报备 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', paddingLeft: 4, borderLeft: '3px solid #7C3AED', marginBottom: 10 }}>
                5.2 作业票报备
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, background: 'linear-gradient(135deg, #FAF5FF, #F3E8FF)', borderRadius: 8, padding: '14px 16px', border: '1px solid #D8B4FE' }}>
                  <div style={{ fontSize: 11, color: '#6B21A8', marginBottom: 4, textAlign: 'center' }}>报备总数</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#7C3AED' }}>{permitTotal}<span style={{ fontSize: 11, fontWeight: 400, color: '#C084FC', marginLeft: 3 }}>张</span></span>
                    <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11, color: '#4F46E5', textDecoration: 'none', fontWeight: 500, flexShrink: 0 }}>查看详情 →</a>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: 'left' }}>已报备作业票类型</th>
                        <th style={th}>数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permitTypes.map((type, i) => (
                        <tr key={type} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                          <td style={{ ...td, textAlign: 'left' }}>{type}</td>
                          <td style={{ ...td, fontWeight: 600 }}>{permitByType(type)} 张</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ flex: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={{ ...th, textAlign: 'left' }}>审批状态</th>
                        <th style={th}>数量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permitStatuses.map((status, i) => {
                        const colorMap: Record<string, { bg: string; color: string }> = {
                          '通过': { bg: '#F0FDF4', color: '#059669' },
                          '待审批': { bg: '#FFF7ED', color: '#D97706' },
                          '驳回': { bg: '#FEF2F2', color: '#DC2626' },
                        }
                        const c = colorMap[status]
                        return (
                          <tr key={status} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                            <td style={{ ...td, textAlign: 'left' }}>
                              <span style={{ padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: c.bg, color: c.color }}>
                                {status}
                              </span>
                            </td>
                            <td style={{ ...td, fontWeight: 600 }}>{permitByStatus(status)} 张</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 5.3 相关方管理 */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', paddingLeft: 4, borderLeft: '3px solid #3B82F6', marginBottom: 10 }}>
                5.3 相关方管理
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: '#EFF6FF', borderRadius: 8, padding: '12px 16px', textAlign: 'center', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>相关方单位数量</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#3B82F6' }}>{enterpriseBossMock.relatedParty.unitCount}<span style={{ fontSize: 11, fontWeight: 400, color: '#93C5FD', marginLeft: 3 }}>个</span></div>
                </div>
                <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 8, padding: '12px 16px', textAlign: 'center', border: '1px solid #86EFAC' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>相关方人员数量</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{enterpriseBossMock.relatedParty.personCount}<span style={{ fontSize: 11, fontWeight: 400, color: '#6EE7B7', marginLeft: 3 }}>人</span></div>
                </div>
              </div>
              {(() => {
                const totalPages = Math.ceil(enterpriseBossMock.relatedParty.details.length / PARTY_PAGE_SIZE)
                const paged = enterpriseBossMock.relatedParty.details.slice((partyPage - 1) * PARTY_PAGE_SIZE, partyPage * PARTY_PAGE_SIZE)
                return (
                  <>
                    <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={th}>序号</th>
                            <th style={{ ...th, textAlign: 'left' }}>相关方单位</th>
                            <th style={th}>人员数量</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paged.map((d, pi) => {
                            const i = (partyPage - 1) * PARTY_PAGE_SIZE + pi
                            return (
                              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                                <td style={td}>{i + 1}</td>
                                <td style={{ ...td, textAlign: 'left' }}>{d.unit}</td>
                                <td style={{ ...td, fontWeight: 600 }}>{d.personCount}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                        <button
                          onClick={() => setPartyPage(p => Math.max(1, p - 1))}
                          disabled={partyPage === 1}
                          style={{ padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', fontSize: 11, color: partyPage === 1 ? '#D1D5DB' : '#374151', cursor: partyPage === 1 ? 'default' : 'pointer' }}
                        >
                          ‹
                        </button>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{partyPage} / {totalPages}</span>
                        <button
                          onClick={() => setPartyPage(p => Math.min(totalPages, p + 1))}
                          disabled={partyPage === totalPages}
                          style={{ padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', fontSize: 11, color: partyPage === totalPages ? '#D1D5DB' : '#374151', cursor: partyPage === totalPages ? 'default' : 'pointer' }}
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
          </div>
        </SectionBlock>
        </div>

        {/* ─── 六、制度台账管理 ──────────────────────────────── */}
        <div id="section-compliance" style={{ scrollMarginTop: 80 }}>
        <SectionBlock
          title="六、制度台账管理"
          description="5项制度台账合规状态，点击可跳转至对应功能页"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {enterpriseBossMock.complianceRecords.filter(r => r.id !== 'train').map(record => {
              const complianceRate = record.total > 0 ? Math.round((record.completed / record.total) * 100) : 0
              const statusColor = complianceRate === 100 ? '#059669' : complianceRate >= 70 ? '#D97706' : '#DC2626'
              const statusBg = complianceRate === 100 ? '#F0FDF4' : complianceRate >= 70 ? '#FFF7ED' : '#FEF2F2'
              const statusText = complianceRate === 100 ? '已完善' : record.pending > 0 ? '待完善' : '未开始'
              return (
                <div
                  key={record.id}
                  style={{
                    background: 'white',
                    borderRadius: 8,
                    border: `1px solid ${complianceRate === 100 ? '#A7F3D0' : complianceRate >= 70 ? '#FED7AA' : '#FECACA'}`,
                    borderLeft: `4px solid ${statusColor}`,
                    padding: '16px 18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{record.name}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusBg,
                      color: statusColor,
                    }}>
                      {statusText}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px 6px', background: '#F9FAFB', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>总制度数</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{record.total}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px 6px', background: '#F0FDF4', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>已完善</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{record.completed}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', padding: '8px 6px', background: '#FFFBEB', borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2 }}>待完善</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: record.pending > 0 ? '#D97706' : '#9CA3AF' }}>{record.pending}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9CA3AF', marginBottom: 3 }}>
                      <span>完善率</span>
                      <span style={{ fontWeight: 600, color: statusColor }}>{complianceRate}%</span>
                    </div>
                    <div style={{ height: 4, background: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${complianceRate}%`,
                        background: statusColor,
                        borderRadius: 2,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                  <a href={record.link} style={linkBtnStyle} onClick={e => { e.preventDefault() }}>
                    <span>查看详情</span>
                    <span style={{ fontSize: 14 }}>→</span>
                  </a>
                </div>
              )
            })}
          </div>
        </SectionBlock>
        </div>
      </PageShell>
        </div>
      </div>
    </>
  )
}
