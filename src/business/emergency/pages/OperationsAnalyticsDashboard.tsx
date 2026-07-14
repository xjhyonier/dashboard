import { useState, useMemo } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// ─── 类型定义 ────────────────────────────────────────────────────
type FunctionTab = 'hazard' | 'training' | 'check' | 'risk'

const FUNCTION_TABS: { key: FunctionTab; label: string }[] = [
  { key: 'hazard', label: '隐患排查' },
  { key: 'training', label: '教育培训' },
  { key: 'check', label: '安全检查' },
  { key: 'risk', label: '风险管控' },
]

interface RegionRow {
  province: string
  city: string
  district: string
  street: string
  activeUsers: number
  activeEnterprises: number
  visits: number
  retention7d: number
  retention30d: number
  retention7dUsers: number
  retention30dUsers: number
  // 隐患排查
  hazardTotal: number
  hazardChecked: number
  hazardCheckedEnt: number
  hazardFound: number
  hazardMajor: number
  hazardRectified: number
  // 教育培训
  trainPlanEnt: number
  trainDailyEnt: number
  trainDailySessions: number
  // 安全检查
  checkTotal: number
  checkEnt: number
  // 风险管控
  riskTotal: number
  riskMajor: number
  riskHigh: number
}

// ─── 地域 Mock 数据 ──────────────────────────────────────────────
const PROVINCES = ['浙江省', '江苏省', '安徽省', '上海市', '江西省']
const CITIES_BY_PROVINCE: Record<string, string[]> = {
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市'],
  '安徽省': ['合肥市', '芜湖市', '马鞍山市'],
  '上海市': ['黄浦区', '浦东新区', '徐汇区'],
  '江西省': ['南昌市', '九江市', '赣州市'],
}
const DISTRICTS: Record<string, string[]> = {
  '杭州市': ['余杭区', '西湖区', '拱墅区', '上城区', '滨江区', '萧山区'],
  '宁波市': ['海曙区', '鄞州区', '江北区', '镇海区'],
  '温州市': ['鹿城区', '龙湾区', '瓯海区'],
  '嘉兴市': ['南湖区', '秀洲区'],
  '湖州市': ['吴兴区', '南浔区'],
  '南京市': ['鼓楼区', '玄武区', '秦淮区', '建邺区'],
  '苏州市': ['姑苏区', '虎丘区', '吴中区'],
  '无锡市': ['梁溪区', '锡山区'],
  '常州市': ['新北区', '天宁区'],
  '合肥市': ['蜀山区', '包河区'],
  '芜湖市': ['镜湖区', '弋江区'],
  '马鞍山市': ['花山区', '雨山区'],
  '黄浦区': ['外滩街道', '南京东路街道'],
  '浦东新区': ['陆家嘴街道', '花木街道', '潍坊街道'],
  '徐汇区': ['徐家汇街道', '天平路街道'],
  '南昌市': ['东湖区', '西湖区'],
  '九江市': ['浔阳区', '濂溪区'],
  '赣州市': ['章贡区', '南康区'],
}
const STREETS: Record<string, string[]> = {
  '余杭区': ['良渚街道', '五常街道', '仁和街道', '仓前街道', '闲林街道', '余杭街道'],
  '西湖区': ['文新街道', '留下街道', '三墩镇'],
  '拱墅区': ['湖墅街道', '米市巷街道', '和睦街道'],
  '上城区': ['湖滨街道', '清波街道', '小营街道'],
  '滨江区': ['西兴街道', '长河街道', '浦沿街道'],
  '萧山区': ['北干街道', '城厢街道', '蜀山街道'],
  '海曙区': ['江厦街道', '南门街道', '月湖街道'],
  '鄞州区': ['白鹤街道', '百丈街道', '东胜街道'],
  '江北区': ['文教街道', '白沙街道'],
  '镇海区': ['招宝山街道', '骆驼街道'],
  '鹿城区': ['五马街道', '大南街道'],
  '龙湾区': ['永中街道', '海滨街道'],
  '瓯海区': ['景山街道', '新桥街道'],
  '南湖区': ['建设街道', '新兴街道'],
  '秀洲区': ['新城街道', '高照街道'],
  '吴兴区': ['月河街道', '朝阳街道'],
  '南浔区': ['南浔镇', '菱湖镇'],
  '鼓楼区': ['华侨路街道', '宁海路街道'],
  '玄武区': ['新街口街道', '梅园新村街道'],
  '秦淮区': ['夫子庙街道', '双塘街道'],
  '建邺区': ['兴隆街道', '南苑街道'],
  '姑苏区': ['观前街道', '平江街道'],
  '虎丘区': ['狮山街道', '通安镇'],
  '吴中区': ['长桥街道', '木渎镇'],
  '梁溪区': ['崇安寺街道', '通江街道'],
  '锡山区': ['东亭街道', '安镇街道'],
  '新北区': ['河海街道', '三井街道'],
  '天宁区': ['天宁街道', '兰陵街道'],
  '蜀山区': ['三里庵街道', '西园街道'],
  '包河区': ['芜湖路街道', '望湖街道'],
  '镜湖区': ['滨江街道', '赭山街道'],
  '弋江区': ['澛港街道', '马塘街道'],
  '花山区': ['解放路街道', '湖东街道'],
  '雨山区': ['雨山街道', '采石街道'],
  '东湖区': ['百花洲街道', '公园街道'],
  '西湖区_': ['南站街道', '丁公路街道'],
  '浔阳区': ['甘棠街道', '湓浦街道'],
  '濂溪区': ['十里街道', '五里街道'],
  '章贡区': ['解放街道', '赣江街道'],
  '南康区': ['蓉江街道', '东山街道'],
}

function hashRegion(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function generateRegionData(): RegionRow[] {
  const rows: RegionRow[] = []
  Object.entries(CITIES_BY_PROVINCE).forEach(([province, cities]) => {
    cities.forEach(city => {
      const districts = DISTRICTS[city] || []
      districts.forEach(district => {
        const streets = STREETS[district] || []
        streets.forEach(street => {
          const seed = hashRegion(`${province}_${city}_${district}_${street}`)
          const activeEnt = 8 + (seed % 45)
          const activeUsers = activeEnt * (2 + (seed % 6))
          const visits = activeUsers * (3 + (seed % 10))
          const hazardTotal = 30 + (seed % 200)
          const hazardChecked = Math.floor(hazardTotal * (0.5 + (seed % 30) / 100))
          const hazardCheckedEnt = Math.max(1, Math.floor(activeEnt * (0.3 + (seed % 50) / 100)))
          const hazardFound = Math.floor(hazardChecked * (0.2 + (seed % 60) / 100))
          const hazardMajor = Math.max(0, Math.floor(hazardFound * (0.05 + (seed % 15) / 100)))
          const hazardRectified = Math.floor(hazardFound * (0.5 + (seed % 40) / 100))

          rows.push({
            province,
            city,
            district,
            street,
            activeUsers,
            activeEnterprises: activeEnt,
            visits,
            retention7d: Math.floor(activeEnt * (0.3 + (seed % 30) / 100)),
            retention30d: Math.floor(activeEnt * (0.15 + (seed % 25) / 100)),
            retention7dUsers: Math.floor(activeUsers * (0.3 + (seed % 30) / 100)),
            retention30dUsers: Math.floor(activeUsers * (0.15 + (seed % 25) / 100)),
            hazardTotal,
            hazardChecked,
            hazardCheckedEnt,
            hazardFound,
            hazardMajor,
            hazardRectified,
            trainPlanEnt: Math.floor(activeEnt * (0.3 + (seed % 40) / 100)),
            trainDailyEnt: Math.floor(activeEnt * (0.4 + (seed % 35) / 100)),
            trainDailySessions: Math.floor(activeEnt * (2 + (seed % 10))),
            checkTotal: Math.floor(hazardTotal * (0.5 + (seed % 50) / 100)),
            checkEnt: Math.max(1, Math.floor(activeEnt * (0.5 + (seed % 40) / 100))),
            riskTotal: 10 + (seed % 80),
            riskMajor: Math.floor((seed % 10) * 0.3),
            riskHigh: Math.floor((seed % 15) * 0.5),
          })
        })
      })
    })
  })
  return rows
}

// ─── 趋势 Mock 数据 ─────────────────────────────────────────────
const generateMonthlyTrend = () => {
  const months = []
  for (let m = 1; m <= 6; m++) {
    const base = 800 + m * 100
    const users = base + Math.floor(Math.random() * 200)
    const enterprises = Math.floor(base / 3.5) + Math.floor(Math.random() * 50)
    const visits = base * 4 + Math.floor(Math.random() * 2000)
    months.push({
      month: `2026-${String(m).padStart(2, '0')}`,
      activeUsers: users,
      activeEnterprises: enterprises,
      visits,
      avgVisitsPerUser: Math.round(visits / users * 10) / 10,
      avgVisitsPerEnt: Math.round(visits / enterprises * 10) / 10,
    })
  }
  return months
}

// ─── 通用样式 ───────────────────────────────────────────────────
const th: React.CSSProperties = {
  padding: '6px 8px', background: '#F3F4F6', fontWeight: 600, fontSize: 12,
  color: '#374151', borderBottom: '2px solid #E5E7EB', borderRight: '1px solid #E5E7EB',
  whiteSpace: 'nowrap', textAlign: 'center',
}
const td = (extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '5px 8px', fontSize: 12, color: '#374151',
  borderBottom: '1px solid #F3F4F6', borderRight: '1px solid #F3F4F6',
  verticalAlign: 'middle', textAlign: 'center', ...extra,
})

// ─── 主组件 ────────────────────────────────────────────────────
export function OperationsAnalyticsDashboard() {
  const regionData = useMemo(() => generateRegionData(), [])
  const monthlyTrend = useMemo(() => generateMonthlyTrend(), [])

  // 全局筛选
  const [timeFilter, setTimeFilter] = useState<'month' | 'quarter' | 'year' | 'custom'>('year')
  const [timeFrom, setTimeFrom] = useState('2026-01')
  const [timeTo, setTimeTo] = useState('2026-06')
  const [regionLevel, setRegionLevel] = useState<'province' | 'city' | 'district' | 'street'>('province')
  const [selectedProvince, setSelectedProvince] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedDistrict, setSelectedDistrict] = useState('all')

  // 功能 tab
  const [funcTab, setFuncTab] = useState<FunctionTab>('hazard')

  // 地域级联选项
  const availableCities = selectedProvince === 'all'
    ? []
    : (CITIES_BY_PROVINCE[selectedProvince] || [])
  const availableDistricts = selectedCity === 'all'
    ? []
    : (DISTRICTS[selectedCity] || [])
  const availableStreets = selectedDistrict === 'all'
    ? []
    : (STREETS[selectedDistrict] || [])

  // 筛选数据
  const filteredRegions = useMemo(() => {
    let data = regionData
    if (selectedProvince !== 'all') {
      data = data.filter(r => r.province === selectedProvince)
      if (selectedCity !== 'all') {
        data = data.filter(r => r.city === selectedCity)
        if (selectedDistrict !== 'all') {
          data = data.filter(r => r.district === selectedDistrict)
        }
      }
    }

    // 按地域层级聚合
    const aggregate = (level: 'province' | 'city' | 'district' | 'street') => {
      const groups: Record<string, RegionRow> = {}
      data.forEach(r => {
        const key = level === 'province' ? r.province
          : level === 'city' ? `${r.province}-${r.city}`
          : level === 'district' ? `${r.province}-${r.city}-${r.district}`
          : `${r.province}-${r.city}-${r.district}-${r.street}`
        if (!groups[key]) {
          groups[key] = { ...r }
          if (level !== 'street') groups[key].street = ''
          if (level === 'province' || level === 'city') groups[key].district = ''
          if (level === 'province') groups[key].city = ''
        } else {
          const g = groups[key]
          g.activeUsers += r.activeUsers
          g.activeEnterprises += r.activeEnterprises
          g.visits += r.visits
          g.retention7d += r.retention7d
          g.retention30d += r.retention30d
          g.retention7dUsers += r.retention7dUsers
          g.retention30dUsers += r.retention30dUsers
          g.hazardTotal += r.hazardTotal
          g.hazardChecked += r.hazardChecked
          g.hazardCheckedEnt += r.hazardCheckedEnt
          g.hazardFound += r.hazardFound
          g.hazardMajor += r.hazardMajor
          g.hazardRectified += r.hazardRectified
          g.trainPlanEnt += r.trainPlanEnt
          g.trainDailyEnt += r.trainDailyEnt
          g.trainDailySessions += r.trainDailySessions
          g.checkTotal += r.checkTotal
          g.checkEnt += r.checkEnt
          g.riskTotal += r.riskTotal
          g.riskMajor += r.riskMajor
          g.riskHigh += r.riskHigh
        }
      })
      return Object.values(groups).sort((a, b) => b.activeUsers - a.activeUsers)
    }
    return aggregate(regionLevel)
  }, [regionData, selectedProvince, selectedCity, selectedDistrict, regionLevel])

  // 汇总指标
  const totals = useMemo(() => {
    const t = {
      activeUsers: 0, activeEnterprises: 0, visits: 0,
      retention7d: 0, retention30d: 0, retention7dUsers: 0, retention30dUsers: 0,
      hazardTotal: 0, hazardChecked: 0, hazardCheckedEnt: 0,
      hazardFound: 0, hazardMajor: 0, hazardRectified: 0,
      trainPlanEnt: 0, trainDailyEnt: 0, trainDailySessions: 0,
      checkTotal: 0, checkEnt: 0,
      riskTotal: 0, riskMajor: 0, riskHigh: 0,
    }
    filteredRegions.forEach(r => {
      t.activeUsers += r.activeUsers
      t.activeEnterprises += r.activeEnterprises
      t.visits += r.visits
      t.retention7d += r.retention7d
      t.retention30d += r.retention30d
      t.retention7dUsers += r.retention7dUsers
      t.retention30dUsers += r.retention30dUsers
      t.hazardTotal += r.hazardTotal
      t.hazardChecked += r.hazardChecked
      t.hazardCheckedEnt += r.hazardCheckedEnt
      t.hazardFound += r.hazardFound
      t.hazardMajor += r.hazardMajor
      t.hazardRectified += r.hazardRectified
      t.trainPlanEnt += r.trainPlanEnt
      t.trainDailyEnt += r.trainDailyEnt
      t.trainDailySessions += r.trainDailySessions
      t.checkTotal += r.checkTotal
      t.checkEnt += r.checkEnt
      t.riskTotal += r.riskTotal
      t.riskMajor += r.riskMajor
      t.riskHigh += r.riskHigh
    })
    return t
  }, [filteredRegions])

  return (
    <div style={{ padding: '24px', maxWidth: 1500, margin: '0 auto' }}>
      <PageHeader title="运营数据分析看板" />

      {/* ─── 全局筛选栏 ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        flexWrap: 'wrap', padding: '8px 0',
      }}>
        {/* 时间筛选 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>时间:</span>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value as any)}
            style={selectStyle}>
            <option value="year">本年</option>
            <option value="quarter">本季</option>
            <option value="month">本月</option>
            <option value="custom">自定义</option>
          </select>
          <input type="month" value={timeFrom} onChange={e => { setTimeFrom(e.target.value); setTimeFilter('custom') }}
            style={inputSmall} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>~</span>
          <input type="month" value={timeTo} onChange={e => { setTimeTo(e.target.value); setTimeFilter('custom') }}
            style={inputSmall} />
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 地域层级 */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>地域:</span>
          {([
            { key: 'province' as const, label: '省' },
            { key: 'city' as const, label: '市' },
            { key: 'district' as const, label: '区' },
            { key: 'street' as const, label: '街道' },
          ]).map(opt => (
            <button key={opt.key} onClick={() => setRegionLevel(opt.key)}
              style={{
                padding: '2px 8px', borderRadius: 3, border: '1px solid',
                borderColor: regionLevel === opt.key ? '#4F46E5' : '#E5E7EB',
                background: regionLevel === opt.key ? '#EEF2FF' : 'white',
                color: regionLevel === opt.key ? '#4F46E5' : '#6B7280',
                cursor: 'pointer', fontSize: 12,
                fontWeight: regionLevel === opt.key ? 600 : 400,
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />

        {/* 地域级联下拉 */}
        <select value={selectedProvince} onChange={e => { setSelectedProvince(e.target.value); setSelectedCity('all'); setSelectedDistrict('all') }}
          style={selectStyle}>
          <option value="all">全国</option>
          {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {availableCities.length > 0 && (
          <select value={selectedCity} onChange={e => { setSelectedCity(e.target.value); setSelectedDistrict('all') }}
            style={selectStyle}>
            <option value="all">全部城市</option>
            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {availableDistricts.length > 0 && (
          <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
            style={selectStyle}>
            <option value="all">全部区县</option>
            {availableDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {/* ─── 平台使用概况 KPI ────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiBlock label="活跃人数" value={totals.activeUsers} unit="人" color="#4F46E5" />
        <KpiBlock label="活跃户数" value={totals.activeEnterprises} unit="户" color="#3B82F6" />
        <KpiBlock label="人均访问次数" value={totals.activeUsers > 0 ? Math.round(totals.visits / totals.activeUsers) : 0} unit="次/人" color="#059669" />
        <KpiBlock label="户均访问次数" value={totals.activeEnterprises > 0 ? Math.round(totals.visits / totals.activeEnterprises) : 0} unit="次/户" color="#7C3AED" />
        <KpiBlock label="7日留存" value={totals.retention7d} unit="户" color="#D97706"
          subValue={totals.retention7dUsers} subUnit="人" />
        <KpiBlock label="30日留存" value={totals.retention30d} unit="户" color="#DC2626"
          subValue={totals.retention30dUsers} subUnit="人" />
      </div>

      {/* ─── 趋势图 + 地域排行（左右并排） ─────────────── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {/* 活跃趋势 */}
        <div style={{ flex: 6, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>活跃趋势（按月）</div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="left" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tick={{ fill: '#9CA3AF' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="activeUsers" name="活跃人数" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="activeEnterprises" name="活跃户数" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="avgVisitsPerUser" name="人均访问次数" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="avgVisitsPerEnt" name="户均访问次数" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 地域排行 */}
        <div style={{ flex: 4, background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            {regionLevel === 'province' ? '各省' : regionLevel === 'city' ? '各市' : regionLevel === 'district' ? '各区' : '各街道'}活跃排行
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 40 }}>#</th>
                <th style={{ ...th, textAlign: 'left' }}>区域</th>
                <th style={th}>活跃户数</th>
                <th style={th}>活跃人数</th>
                <th style={th}>人均访问</th>
                <th style={{ ...th, borderRight: 'none' }}>户均访问</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegions.slice(0, 10).map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={td({ color: i < 3 ? '#4F46E5' : '#9CA3AF', fontWeight: i < 3 ? 700 : 400 })}>{i + 1}</td>
                  <td style={td({ textAlign: 'left', fontWeight: 500 })}>
                    {regionLevel === 'province' ? r.province
                      : regionLevel === 'city' ? r.city
                      : regionLevel === 'district' ? r.district
                      : r.street}
                  </td>
                  <td style={td({ fontWeight: 600 })}>{r.activeEnterprises}</td>
                  <td style={td({})}>{r.activeUsers}</td>
                  <td style={td({})}>{r.activeUsers > 0 ? Math.round(r.visits / r.activeUsers * 10) / 10 : '-'}</td>
                  <td style={td({ borderRight: 'none' })}>{r.activeEnterprises > 0 ? Math.round(r.visits / r.activeEnterprises * 10) / 10 : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 核心功能分析 Tab ────────────────────────── */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB' }}>
          {FUNCTION_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFuncTab(tab.key)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'transparent',
                borderBottom: funcTab === tab.key ? '2px solid #4F46E5' : '2px solid transparent',
                marginBottom: -2, color: funcTab === tab.key ? '#4F46E5' : '#6B7280',
                cursor: 'pointer', fontSize: 13, fontWeight: funcTab === tab.key ? 600 : 500,
              }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ padding: 16 }}>

          {/* 隐患排查 */}
          {funcTab === 'hazard' && (
            <FunctionPanel>
              <KpiBlock label="总任务数" value={totals.hazardTotal} unit="条" color="#4F46E5" compact />
              <KpiBlock label="已检查任务数" value={totals.hazardChecked} unit="条" color="#3B82F6" compact />
              <KpiBlock label="已检查户数" value={totals.hazardCheckedEnt} unit="户" color="#7C3AED" compact />
              <KpiBlock label="发现隐患数" value={totals.hazardFound} unit="项" color="#DC2626" compact />
              <KpiBlock label="重大事故隐患数" value={totals.hazardMajor} unit="项" color="#991B1B" compact />
              <KpiBlock label="已整改隐患" value={totals.hazardRectified} unit="项" color="#059669" compact />
              <KpiBlock label="整改完成率" value={totals.hazardFound > 0 ? Math.round(totals.hazardRectified / totals.hazardFound * 100) : 0} unit="%" color="#065F46" compact />
              <DetailTable columns={['区域', '总任务', '已检查任务', '已检查户数', '发现隐患', '重大隐患', '已整改', '整改率']}
                rows={filteredRegions.slice(0, 10).map(r => [
                  regionLevel === 'province' ? r.province : regionLevel === 'city' ? r.city : regionLevel === 'district' ? r.district : r.street,
                  r.hazardTotal, r.hazardChecked, r.hazardCheckedEnt, r.hazardFound, r.hazardMajor,
                  r.hazardRectified, r.hazardFound > 0 ? `${Math.round(r.hazardRectified / r.hazardFound * 100)}%` : '-',
                ])} />
            </FunctionPanel>
          )}

          {/* 教育培训 */}
          {funcTab === 'training' && (
            <FunctionPanel>
              <KpiBlock label="年度计划制定户数" value={totals.trainPlanEnt} unit="户" color="#4F46E5" compact />
              <KpiBlock label="日常安全教育户数" value={totals.trainDailyEnt} unit="户" color="#7C3AED" compact />
              <KpiBlock label="日常安全教育总场次" value={totals.trainDailySessions} unit="场" color="#059669" compact />
              <DetailTable columns={['区域', '计划制定户数', '日常教育户数', '日常教育场次']}
                rows={filteredRegions.slice(0, 10).map(r => [
                  regionLevel === 'province' ? r.province : regionLevel === 'city' ? r.city : regionLevel === 'district' ? r.district : r.street,
                  r.trainPlanEnt, r.trainDailyEnt, r.trainDailySessions,
                ])} />
            </FunctionPanel>
          )}

          {/* 安全检查 */}
          {funcTab === 'check' && (
            <FunctionPanel>
              <KpiBlock label="检查总次数" value={totals.checkTotal} unit="次" color="#4F46E5" compact />
              <KpiBlock label="已检查户数" value={totals.checkEnt} unit="户" color="#3B82F6" compact />
              <DetailTable columns={['区域', '检查总次数', '已检查户数']}
                rows={filteredRegions.slice(0, 10).map(r => [
                  regionLevel === 'province' ? r.province : regionLevel === 'city' ? r.city : regionLevel === 'district' ? r.district : r.street,
                  r.checkTotal, r.checkEnt,
                ])} />
            </FunctionPanel>
          )}

          {/* 风险管控 */}
          {funcTab === 'risk' && (
            <FunctionPanel>
              <KpiBlock label="风险点总数" value={totals.riskTotal} unit="项" color="#4F46E5" compact />
              <KpiBlock label="重大风险" value={totals.riskMajor} unit="项" color="#991B1B" compact />
              <KpiBlock label="较大风险" value={totals.riskHigh} unit="项" color="#EA580C" compact />
              <DetailTable columns={['区域', '风险点总数', '重大风险', '较大风险']}
                rows={filteredRegions.slice(0, 10).map(r => [
                  regionLevel === 'province' ? r.province : regionLevel === 'city' ? r.city : regionLevel === 'district' ? r.district : r.street,
                  r.riskTotal, r.riskMajor, r.riskHigh,
                ])} />
            </FunctionPanel>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── 子组件 ────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: 4,
  fontSize: 12, color: '#6B7280', background: 'white', outline: 'none',
}
const inputSmall: React.CSSProperties = {
  padding: '2px 6px', border: '1px solid #D1D5DB', borderRadius: 4,
  fontSize: 12, color: '#374151', background: 'white', outline: 'none',
}

function KpiBlock({ label, value, unit, color, compact, subLabel, subValue, subUnit }: {
  label: string; value: number; unit: string; color: string; compact?: boolean
  subLabel?: string; subValue?: number; subUnit?: string
}) {
  const fontSize = compact ? 20 : 28
  const padding = compact ? '10px 14px' : '14px 18px'
  const hasDual = subValue != null
  return (
    <div style={{
      flex: 1, minWidth: compact ? 120 : 160, background: 'white',
      borderRadius: 8, border: '1px solid #E5E7EB', padding,
    }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>{label}</div>
      {hasDual ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'nowrap' }}>
          <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {subValue!.toLocaleString()}
            <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{subUnit}</span>
          </span>
          <span style={{ color: '#E5E7EB', fontSize: 14, flexShrink: 0 }}>|</span>
          <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {value.toLocaleString()}
            <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{unit}</span>
          </span>
        </div>
      ) : (
        <span style={{ fontSize, fontWeight: 700, color, lineHeight: 1.2 }}>
          {value.toLocaleString()}
          <span style={{ fontSize: compact ? 11 : 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 3 }}>{unit}</span>
        </span>
      )}
    </div>
  )
}

function FunctionPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  )
}

function DetailTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 4 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{ ...th, textAlign: i === 0 ? 'left' : 'center', borderRight: i === columns.length - 1 ? 'none' : '1px solid #E5E7EB' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  ...td({ textAlign: j === 0 ? 'left' : 'center', borderRight: j === columns.length - 1 ? 'none' : '1px solid #F3F4F6' }),
                  fontWeight: j >= 1 ? 600 : 400,
                }}>
                  {typeof cell === 'number' ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
