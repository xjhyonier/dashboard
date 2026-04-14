/**
 * TrendCharts - 趋势图表集合
 * 
 * 包含多种趋势图表：
 * 1. 隐患数量趋势
 * 2. 企业自查趋势
 * 3. 专家待办趋势
 */

import { useState, useMemo, useEffect } from 'react'
import { initDatabase, getHazards, getEnterpriseDimensions, getExperts, getExpertPlatformBehavior } from '../../../../db'
import type { Hazard, EnterpriseDimensions, Expert, ExpertPlatformBehavior } from '../../../../db/types'

// 生成最近12个月
function getLast12Months(): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${d.getMonth() + 1}月`
    })
  }
  return result
}

// 通用柱状图组件
interface BarChartProps {
  title: string
  data: { label: string; value: number; color?: string }[]
  color?: string
  unit?: string
}

function BarChart({ title, data, color = '#4F46E5', unit = '处' }: BarChartProps) {
  const maxVal = useMemo(() => {
    const max = Math.max(...data.map(d => d.value), 1)
    return Math.ceil(max / 10) * 10
  }, [data])

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  return (
    <div style={{ background: 'white', borderRadius: 8, border: '1px solid #E5E7EB', padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>
        {title}
        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginLeft: 8 }}>
          共 {total}{unit}
        </span>
      </div>

      {/* 柱状图 */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 150, borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
        {data.map((d, idx) => {
          const height = (d.value / maxVal) * 130
          return (
            <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '100%',
                maxWidth: 28,
                height: Math.max(height, d.value > 0 ? 4 : 0),
                backgroundColor: d.color || color,
                borderRadius: '4px 4px 0 0',
                minHeight: d.value > 0 ? 4 : 0,
              }} />
            </div>
          )
        })}
      </div>

      {/* 月份 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#9CA3AF' }}>
            {d.label}
          </div>
        ))}
      </div>

      {/* 数值 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#374151' }}>
            {d.value}
          </div>
        ))}
      </div>
    </div>
  )
}

// ==================== 隐患数量趋势 ====================

export function HazardTrendChart({ filterTeam, filterExpert, filterEnterprise, filterIndustry }: any) {
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDatabase().then(() => {
      getHazards().then(data => {
        setHazards(data)
        setLoading(false)
      })
    })
  }, [])

  const data = useMemo(() => {
    const months = getLast12Months()
    return months.map(m => {
      const list = hazards.filter(h => {
        const date = (h.discovered_at || h.created_at).substring(0, 7)
        if (date !== m.key) return false
        if (filterTeam && filterTeam !== 'all' && h.team_name !== filterTeam) return false
        if (filterExpert && filterExpert !== 'all' && h.expert_name !== filterExpert) return false
        if (filterEnterprise && filterEnterprise !== 'all' && h.enterprise_id !== filterEnterprise) return false
        if (filterIndustry && filterIndustry !== 'all' && h.enterprise_industry !== filterIndustry) return false
        return true
      })
      return { label: m.label, value: list.length }
    })
  }, [hazards, filterTeam, filterExpert, filterEnterprise, filterIndustry])

  if (loading) return <div style={{ padding: 20, color: '#6B7280' }}>加载中...</div>

  return <BarChart title="隐患数量趋势" data={data} color="#4F46E5" unit="处" />
}

// ==================== 企业自查趋势 ====================

export function SelfCheckTrendChart({ filterTeam, filterExpert, filterEnterprise, filterIndustry }: any) {
  const [dimensions, setDimensions] = useState<EnterpriseDimensions[]>([])
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      await initDatabase()
      // 加载企业维度数据
      const ents = await import('../../../../db').then(m => m.getEnterprises())
      const dimsList: EnterpriseDimensions[] = []
      for (const ent of ents) {
        const dims = await import('../../../../db').then(m => m.getEnterpriseDimensions(ent.id))
        if (dims) dimsList.push(dims)
      }
      setEnterprises(ents)
      setDimensions(dimsList)
      setLoading(false)
    }
    load()
  }, [])

  const data = useMemo(() => {
    const months = getLast12Months()
    return months.map((m, idx) => {
      // 企业自查隐患数据，按月份分布（模拟）
      const enterpriseCount = enterprises.length
      // 模拟每月自查隐患数（基于企业数和随机因子）
      const baseValue = Math.round(enterpriseCount * 0.3)
      const variance = Math.floor(Math.random() * 10) - 5
      const value = Math.max(0, baseValue + variance)
      return { label: m.label, value }
    })
  }, [enterprises])

  if (loading) return <div style={{ padding: 20, color: '#6B7280' }}>加载中...</div>

  return <BarChart title="企业自查趋势" data={data} color="#10B981" unit="处" />
}

// ==================== 专家待办趋势 ====================

export function ExpertTodoTrendChart({ filterTeam, filterExpert, filterEnterprise, filterIndustry }: any) {
  const [behaviors, setBehaviors] = useState<ExpertPlatformBehavior[]>([])
  const [experts, setExperts] = useState<Expert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      await initDatabase()
      const expertList = await import('../../../../db').then(m => m.getExperts())
      setExperts(expertList)

      // 加载专家平台行为数据
      const behaviorList: ExpertPlatformBehavior[] = []
      for (const exp of expertList) {
        const behavior = await import('../../../../db').then(m => m.getExpertPlatformBehavior(exp.id))
        if (behavior) behaviorList.push(behavior)
      }
      setBehaviors(behaviorList)
      setLoading(false)
    }
    load()
  }, [])

  const data = useMemo(() => {
    const months = getLast12Months()
    return months.map((m, idx) => {
      // 模拟专家待办数据
      const expertCount = experts.length
      // 模拟每月待办数
      const baseValue = Math.round(expertCount * 2.5)
      const variance = Math.floor(Math.random() * 8) - 4
      const value = Math.max(0, baseValue + variance)
      return { label: m.label, value }
    })
  }, [experts])

  if (loading) return <div style={{ padding: 20, color: '#6B7280' }}>加载中...</div>

  return <BarChart title="专家待办趋势" data={data} color="#F59E0B" unit="条" />
}

// ==================== 汇总展示 ====================

interface TrendChartsProps {
  filterTeam?: string
  filterExpert?: string
  filterEnterprise?: string
  filterIndustry?: string
}

export function TrendCharts(props: TrendChartsProps) {
  return (
    <div>
      <HazardTrendChart {...props} />
      <SelfCheckTrendChart {...props} />
      <ExpertTodoTrendChart {...props} />
    </div>
  )
}
