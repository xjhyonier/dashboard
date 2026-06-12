import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, PieChart, Pie, Cell
} from 'recharts'

type TabKey = 'overview' | 'functions' | 'enterprises'

const TAB_LIST = [
  { key: 'overview' as const, label: '用户概览' },
  { key: 'functions' as const, label: '功能分析' },
  { key: 'enterprises' as const, label: '企业明细' },
]

// ==================== Mock 数据 ====================

interface DailyMetrics {
  date: string
  dau: number
  mau: number
  sessions: number
  avgDuration: number
  newUsers: number
}

const generateDailyMetrics = (): DailyMetrics[] => {
  const days: DailyMetrics[] = []
  for (let m = 1; m <= 6; m++) {
    for (let d = 1; d <= 30; d++) {
      const dayStr = `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dau = Math.floor(Math.random() * 200) + 300
      days.push({
        date: dayStr,
        dau,
        mau: dau + Math.floor(Math.random() * 500) + 200,
        sessions: Math.floor(dau * (2 + Math.random() * 3)),
        avgDuration: Math.floor(8 + Math.random() * 20),
        newUsers: Math.floor(Math.random() * 40) + 10,
      })
    }
  }
  return days
}

// 按月汇总
const groupByMonth = (daily: DailyMetrics[]) => {
  const map: Record<string, { dau: number; mau: number; sessions: number; avgDuration: number; newUsers: number; count: number }> = {}
  daily.forEach(d => {
    const m = d.date.substring(0, 7)
    if (!map[m]) map[m] = { dau: 0, mau: 0, sessions: 0, avgDuration: 0, newUsers: 0, count: 0 }
    map[m].dau += d.dau
    map[m].mau = Math.max(map[m].mau, d.mau)
    map[m].sessions += d.sessions
    map[m].avgDuration += d.avgDuration
    map[m].newUsers += d.newUsers
    map[m].count++
  })
  return Object.entries(map).map(([month, v]) => ({
    month,
    dau: Math.round(v.dau / v.count),
    mau: v.mau,
    dauMauRate: v.mau > 0 ? Math.round(v.dau / v.count / v.mau * 100) : 0,
    sessions: Math.round(v.sessions / v.count),
    avgDuration: Math.round(v.avgDuration / v.count),
    newUsers: v.newUsers,
  }))
}

interface FunctionUsage {
  name: string
  penetration: number
  avgUses: number
  durationShare: number
}

const functionUsageData: FunctionUsage[] = [
  { name: '待办管理', penetration: 85, avgUses: 12.5, durationShare: 22 },
  { name: '制度台账', penetration: 72, avgUses: 8.3, durationShare: 18 },
  { name: '教育培训', penetration: 58, avgUses: 5.1, durationShare: 15 },
  { name: '现场管理', penetration: 42, avgUses: 4.2, durationShare: 12 },
  { name: '双重预防', penetration: 35, avgUses: 3.8, durationShare: 14 },
  { name: '入驻单位管理', penetration: 28, avgUses: 2.1, durationShare: 8 },
  { name: '数据导出', penetration: 22, avgUses: 1.5, durationShare: 5 },
  { name: '报表查看', penetration: 45, avgUses: 6.2, durationShare: 6 },
]

interface EnterpriseActivity {
  name: string
  loginDays: number
  dashboardViews: number
  filterUses: number
  exportCount: number
  lastActive: string
  level: '高' | '中' | '低'
}

const generateEnterpriseActivity = (): EnterpriseActivity[] => {
  const names = [
    '杭州华兴消防设备有限公司', '浙江久安安全科技有限公司', '杭州五常消防工程有限公司',
    '仁和街道工业园区管理委员会', '西虹桥经济开发区', '良渚文化村社区服务中心',
    '杭州消防器材厂', '浙江安防科技有限公司', '杭州应急装备有限公司',
    '五常街道社区卫生服务中心', '仁和街道中心小学', '西虹街道便民服务中心',
    '余杭街道工业园', '仓前街道创业园', '闲林街道安置小区',
  ]
  return names.map(name => {
    const loginDays = Math.floor(Math.random() * 30) + 1
    let level: '高' | '中' | '低'
    if (loginDays >= 20) level = '高'
    else if (loginDays >= 10) level = '中'
    else level = '低'
    return {
      name,
      loginDays,
      dashboardViews: Math.floor(Math.random() * 100) + 10,
      filterUses: Math.floor(Math.random() * 80) + 5,
      exportCount: Math.floor(Math.random() * 20),
      lastActive: `${Math.floor(Math.random() * 10) + 1}天前`,
      level,
    }
  }).sort((a, b) => b.loginDays - a.loginDays)
}

// 留存数据
const retentionData = [
  { stage: '新用户', value: 1000, rate: '100%' },
  { stage: '次日留存', value: 720, rate: '72%' },
  { stage: '7日留存', value: 480, rate: '48%' },
  { stage: '30日留存', value: 350, rate: '35%' },
]

// 热力图数据
const generateHeatmapData = () => {
  const weeks: { week: string; days: { day: string; value: number }[] }[] = []
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  for (let w = 14; w >= 0; w--) {
    const days = weekLabels.map(day => ({
      day,
      value: Math.floor(Math.random() * 5),
    }))
    weeks.push({ week: `第${w + 1}周`, days })
  }
  return weeks
}

// ==================== 用户概览 Tab ====================

function UserOverviewTab() {
  const dailyData = useMemo(() => generateDailyMetrics(), [])
  const monthlyData = useMemo(() => groupByMonth(dailyData), [dailyData])
  const heatmapData = useMemo(() => generateHeatmapData(), [])
  const latest = monthlyData[monthlyData.length - 1]

  const kpis = [
    { label: 'DAU/MAU比', value: `${latest?.dauMauRate ?? 0}%`, change: '+3.2%', up: true, color: '#4F46E5' },
    { label: '人均会话数', value: `${latest?.sessions ?? 0}次`, change: '+0.3', up: true, color: '#3B82F6' },
    { label: '人均停留时长', value: `${latest?.avgDuration ?? 0}min`, change: '+2.1', up: true, color: '#059669' },
    { label: '7日留存率', value: '48%', change: '-2.1%', up: false, color: '#D97706' },
    { label: '本周新用户', value: `${latest?.newUsers ?? 0}`, change: '+5', up: true, color: '#7C3AED' },
  ]

  const heatColors = ['#EBEDF0', '#C6E48B', '#7BC96F', '#239A3B', '#196127']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 指标卡 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ flex: 1, minWidth: 150, background: 'white', borderRadius: 8, border: `1px solid ${kpi.color}20`, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, margin: '4px 0' }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: kpi.up ? '#059669' : '#DC2626' }}>
              {kpi.up ? '↑' : '↓'} {kpi.change.startsWith('-') ? kpi.change : '+' + kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* 月度趋势图 */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>月度活跃趋势</div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} unit="%" />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar yAxisId="left" dataKey="dau" name="DAU" fill="#4F46E5" barSize={24} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="mau" name="MAU" fill="#93C5FD" barSize={24} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="dauMauRate" name="DAU/MAU比" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 留存漏斗 + 活跃热力图 */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* 留存漏斗 */}
        <div style={{ flex: 1, minWidth: 220, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>用户留存漏斗</div>
          {retentionData.map((item, idx) => {
            const colors = ['#4F46E5', '#3B82F6', '#D97706', '#059669']
            const maxVal = retentionData[0].value
            const width = maxVal > 0 ? (item.value / maxVal) * 100 : 0
            return (
              <div key={item.stage} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                  <span>{item.stage}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}人 <span style={{ color: colors[idx] }}>({item.rate})</span></span>
                </div>
                <div style={{ height: 22, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${width}%`, background: colors[idx], borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* 活跃热力图 */}
        <div style={{ flex: 2, minWidth: 400, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>活跃日历热力图（近3个月）</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'space-between', paddingTop: 16, paddingBottom: 4 }}>
              {heatmapData.slice(0, 7).map((_, i) => (
                <div key={i} style={{ fontSize: 10, color: '#9CA3AF', height: 20, lineHeight: '20px' }}>{['一','二','三','四','五','六','日'][i]}</div>
              ))}
            </div>
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {heatmapData.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {week.days.map((day, di) => (
                      <div key={di} title={`${day.day}: ${day.value}`} style={{
                        width: 20, height: 20, borderRadius: 3,
                        background: heatColors[Math.min(day.value, 4)],
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>低</span>
            {heatColors.slice(1).map((c, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 10, color: '#9CA3AF' }}>高</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== 功能分析 Tab ====================

function FunctionAnalysisTab() {
  const sorted = [...functionUsageData].sort((a, b) => b.penetration - a.penetration)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 指标卡 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: '功能模块总数', value: functionUsageData.length, color: '#4F46E5' },
          { label: '平均渗透率', value: `${Math.round(functionUsageData.reduce((s, f) => s + f.penetration, 0) / functionUsageData.length)}%`, color: '#3B82F6' },
          { label: '日均功能使用', value: `${Math.round(functionUsageData.reduce((s, f) => s + f.avgUses, 0))}次`, color: '#059669' },
        ].map(kpi => (
          <div key={kpi.label} style={{ flex: 1, minWidth: 150, background: 'white', borderRadius: 8, border: `1px solid ${kpi.color}20`, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* 功能渗透率排行 */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>功能渗透率排行</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((item, idx) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, width: 20, textAlign: 'right', color: '#9CA3AF' }}>{idx + 1}</span>
              <span style={{ fontSize: 13, width: 100, color: '#374151' }}>{item.name}</span>
              <div style={{ flex: 1, height: 22, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${item.penetration}%`, background: `linear-gradient(90deg, #818CF8, #4F46E5)`, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5', width: 45, textAlign: 'right' }}>{item.penetration}%</span>
              <span style={{ fontSize: 11, color: '#9CA3AF', width: 70, textAlign: 'right' }}>{item.avgUses}次/人</span>
            </div>
          ))}
        </div>
      </div>

      {/* 功能时长占比 */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>功能时长占比分布</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={functionUsageData} dataKey="durationShare" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {functionUsageData.map((_, i) => (
                  <Cell key={i} fill={['#4F46E5','#3B82F6','#059669','#D97706','#DC2626','#7C3AED','#DB2777','#0891B2'][i % 8]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ flex: 1, background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>人均使用次数排行</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={{ stroke: '#E5E7EB' }} width={80} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="avgUses" fill="#059669" barSize={16} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ==================== 企业明细 Tab ====================

function EnterpriseDetailTab() {
  const enterprises = useMemo(() => generateEnterpriseActivity(), [])
  const [sortKey, setSortKey] = useState<string>('loginDays')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [keyword, setKeyword] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  const sorted = useMemo(() => {
    let list = [...enterprises]
    if (keyword) list = list.filter(e => e.name.includes(keyword))
    if (levelFilter !== 'all') list = list.filter(e => e.level === levelFilter)
    list.sort((a: any, b: any) => {
      const va = a[sortKey]; const vb = b[sortKey]
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return list
  }, [enterprises, keyword, levelFilter, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const cols: { key: string; label: string }[] = [
    { key: 'name', label: '企业名称' },
    { key: 'loginDays', label: '登录天数' },
    { key: 'dashboardViews', label: '看板查看' },
    { key: 'filterUses', label: '筛选次数' },
    { key: 'exportCount', label: '导出次数' },
    { key: 'lastActive', label: '最近活跃' },
    { key: 'level', label: '活跃度' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 汇总 */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: '企业总数', value: enterprises.length, color: '#4F46E5' },
          { label: '高活跃企业', value: enterprises.filter(e => e.level === '高').length, color: '#059669' },
          { label: '中活跃企业', value: enterprises.filter(e => e.level === '中').length, color: '#D97706' },
          { label: '低活跃企业', value: enterprises.filter(e => e.level === '低').length, color: '#DC2626' },
        ].map(kpi => (
          <div key={kpi.label} style={{ flex: 1, minWidth: 130, background: 'white', borderRadius: 8, border: `1px solid ${kpi.color}20`, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>{kpi.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, marginTop: 4 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* 搜索 + 筛选 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索企业名称..."
          style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 13, color: '#374151', outline: 'none', minWidth: 200 }} />
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          style={{ padding: '6px 12px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 13, color: '#6B7280', background: 'white', outline: 'none' }}>
          <option value="all">全部活跃度</option>
          <option value="高">高活跃</option>
          <option value="中">中活跃</option>
          <option value="低">低活跃</option>
        </select>
      </div>

      {/* 明细表 */}
      <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {cols.map(col => (
                  <th key={col.key} onClick={() => handleSort(col.key)} style={{
                    padding: '10px 12px', textAlign: col.key === 'name' ? 'left' : 'center', fontWeight: 600, color: '#374151', borderBottom: '2px solid #E5E7EB',
                    cursor: col.key !== 'lastActive' ? 'pointer' : 'default', minWidth: col.key === 'name' ? 180 : 80,
                    position: col.key === 'name' ? 'sticky' : undefined, left: col.key === 'name' ? 0 : undefined, background: col.key === 'name' ? '#F9FAFB' : undefined,
                  }}>
                    {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, idx) => (
                <tr key={e.name} style={{ background: idx % 2 === 0 ? 'white' : '#F9FAFB' }}
                  onMouseEnter={ev => ev.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={ev => ev.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#F9FAFB'}>
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#374151', borderBottom: '1px solid #F3F4F6', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'white' : '#F9FAFB' }}>{e.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#4F46E5', borderBottom: '1px solid #F3F4F6' }}>{e.loginDays}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#3B82F6', borderBottom: '1px solid #F3F4F6' }}>{e.dashboardViews}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{e.filterUses}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151', borderBottom: '1px solid #F3F4F6' }}>{e.exportCount}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>{e.lastActive}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid #F3F4F6' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: e.level === '高' ? '#F0FDF4' : e.level === '中' ? '#FFFBEB' : '#FEF2F2',
                      color: e.level === '高' ? '#059669' : e.level === '中' ? '#D97706' : '#DC2626',
                    }}>{e.level}</span>
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

// ==================== 主页面 ====================

export function OperationsAnalyticsDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTab = searchParams.get('tab')
  const activeTab: TabKey = TAB_LIST.some(t => t.key === urlTab) ? urlTab as TabKey : 'overview'

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader title="运营数据分析" />

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #E5E7EB', background: 'white' }}>
        {TAB_LIST.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setSearchParams({ tab: tab.key })}
              style={{
                padding: '10px 20px', border: 'none', borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                marginBottom: -2, background: 'transparent', color: isActive ? '#4F46E5' : '#6B7280',
                cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap',
              }}>
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && <UserOverviewTab />}
      {activeTab === 'functions' && <FunctionAnalysisTab />}
      {activeTab === 'enterprises' && <EnterpriseDetailTab />}
    </div>
  )
}
