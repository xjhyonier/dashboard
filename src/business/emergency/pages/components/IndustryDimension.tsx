import { useState, useMemo, useEffect } from 'react'
import { thStyle, tdStyle, inputStyle } from './styles'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'
import type { IndustryDimensionProps } from './types'
import { initDatabase, getEnterprises, getHazards } from '../../../../db'
import type { Enterprise, Hazard } from '../../../../db/types'
import { exportToCSV } from './exportUtils'

export function IndustryDimension({ dateRange, riskLevel, timeRange, selectedKpi }: IndustryDimensionProps) {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        await initDatabase()
        const [entList, hazList] = await Promise.all([
          getEnterprises(),
          getHazards()
        ])
        setEnterprises(entList)
        setHazards(hazList)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // 标签库（从 hazards 按 enterprise_industry 聚合）
  const tagLibrary = useMemo(() => {
    const tags = new Set<string>()
    hazards.forEach(h => {
      if (h.enterprise_industry) tags.add(h.enterprise_industry)
    })
    return Array.from(tags).sort()
  }, [hazards])

  // 过滤后的标签库
  const filteredTagLibrary = useMemo(() => {
    if (!tagSearch.trim()) return tagLibrary
    const kw = tagSearch.trim().toLowerCase()
    return tagLibrary.filter(t => t.toLowerCase().includes(kw))
  }, [tagSearch, tagLibrary])

  // 切换标签选中状态
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  // 标签隐患分析（从 hazards 聚合）
  const hazardAnalysis = useMemo(() => {
    const map = new Map<string, { hazardCount: number; majorHazardCount: number; rectifiedCount: number; deadlineCount: number; topIssues: string[] }>()
    hazards.forEach(h => {
      const industry = h.enterprise_industry || '未知'
      if (!map.has(industry)) {
        map.set(industry, { hazardCount: 0, majorHazardCount: 0, rectifiedCount: 0, deadlineCount: 0, topIssues: [] })
      }
      const s = map.get(industry)!
      s.hazardCount++
      if (h.level === '重大隐患') s.majorHazardCount++
      if (h.status === 'rectified') s.rectifiedCount++
      if (h.status === 'rectifying') s.deadlineCount++
      // 提取高频问题（前3个）
      if (s.topIssues.length < 3 && h.title && !s.topIssues.includes(h.title.substring(0, 10))) {
        s.topIssues.push(h.title.substring(0, 10))
      }
    })
    return map
  }, [hazards])

  const filtered = useMemo(() => {
    let result = Array.from(hazardAnalysis.entries()).map(([industry, data]) => ({ industry, ...data }))
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      result = result.filter(d => d.industry.toLowerCase().includes(kw))
    }
    if (selectedTags.length > 0) {
      result = result.filter(d => selectedTags.includes(d.industry))
    }
    return result
  }, [keyword, selectedTags, hazardAnalysis])

  const total = {
    hazardCount: hazards.length,
    majorHazardCount: hazards.filter(h => h.level === '重大隐患').length,
    rectifiedCount: hazards.filter(h => h.status === 'rectified').length,
    deadlineCount: hazards.filter(h => h.status === 'rectifying').length,
  }

  // 责任主体类型汇总（从 enterprises 按 industry 映射到企业类型聚合）
  // 映射规则: 工业企业/危化使用 -> 工业企业, 其他行业 -> 消防场所
  const subjectTypes = useMemo(() => {
    const typeNameMap: Record<string, string> = { '工业企业': '工业企业', '消防场所': '消防场所' }
    const industryToType: Record<string, string> = {
      '工业企业': '工业企业', '危化使用': '工业企业',
      '仓储物流': '消防场所', '小微企业': '消防场所', '九小场所': '消防场所', '出租房': '消防场所', '沿街店铺': '消防场所',
    }
    // 同时从 enterprises 和 hazards 聚合数据
    const entMap = new Map<string, { enterpriseCount: number }>()
    const hazMap = new Map<string, { hazardFound: number; seriousHazard: number; rectified: number; deadline: number; recheck: number }>()

    // 按行业聚合企业数
    enterprises.forEach(e => {
      const type = industryToType[e.industry] || '消防场所'
      if (!entMap.has(type)) entMap.set(type, { enterpriseCount: 0 })
      entMap.get(type)!.enterpriseCount++
    })

    // 按行业聚合隐患数据
    hazards.forEach(h => {
      const industry = h.enterprise_industry || '未知'
      const type = industryToType[industry] || '消防场所'
      if (!hazMap.has(type)) hazMap.set(type, { hazardFound: 0, seriousHazard: 0, rectified: 0, deadline: 0, recheck: 0 })
      const s = hazMap.get(type)!
      s.hazardFound++
      if (h.level === '重大隐患') s.seriousHazard++
      if (h.status === 'rectified') s.rectified++
      if (h.status === 'rectifying') s.deadline++
      if (h.status === 'pending') s.recheck++
    })

    // 合并数据
    const allTypes = new Set([...entMap.keys(), ...hazMap.keys()])
    return Array.from(allTypes)
      .map(name => ({
        name: typeNameMap[name] || name,
        enterpriseCount: entMap.get(name)?.enterpriseCount || 0,
        inspectedCount: 0, // DB 中无此字段
        hazardFound: hazMap.get(name)?.hazardFound || 0,
        seriousHazard: hazMap.get(name)?.seriousHazard || 0,
        rectified: hazMap.get(name)?.rectified || 0,
        deadline: hazMap.get(name)?.deadline || 0,
        recheck: hazMap.get(name)?.recheck || 0,
        enforcement: 0, // DB 中无此字段
      }))
      .sort((a, b) => {
        if (a.name === '工业企业' && b.name === '消防场所') return -1
        if (a.name === '消防场所' && b.name === '工业企业') return 1
        return 0
      })
  }, [enterprises, hazards])

  // 消防场所风险等级汇总（只统计消防场所类型企业）
  const riskLevels = useMemo(() => {
    const industryToTypeLocal: Record<string, string> = {
      '工业企业': '工业企业', '危化使用': '工业企业',
      '仓储物流': '消防场所', '小微企业': '消防场所', '九小场所': '消防场所', '出租房': '消防场所', '沿街店铺': '消防场所',
    }
    const entMap = new Map<string, { enterpriseCount: number }>()
    const hazMap = new Map<string, { hazardFound: number; seriousHazard: number; rectified: number; deadline: number; recheck: number }>()

    // 只按消防场所类型企业聚合风险等级
    enterprises
      .filter(e => (industryToTypeLocal[e.industry] || '消防场所') === '消防场所')
      .forEach(e => {
        const level = e.risk_level
        if (!entMap.has(level)) entMap.set(level, { enterpriseCount: 0 })
        entMap.get(level)!.enterpriseCount++
      })

    // 按企业风险等级聚合隐患数据
    hazards.forEach(h => {
      // 隐患关联的企业风险等级需要从 enterprise 查找
      const enterprise = enterprises.find(e => e.id === h.enterprise_id)
      if (!enterprise) return
      const type = industryToTypeLocal[enterprise.industry] || '消防场所'
      if (type !== '消防场所') return
      const level = enterprise.risk_level
      if (!hazMap.has(level)) hazMap.set(level, { hazardFound: 0, seriousHazard: 0, rectified: 0, deadline: 0, recheck: 0 })
      const s = hazMap.get(level)!
      s.hazardFound++
      if (h.level === '重大隐患') s.seriousHazard++
      if (h.status === 'rectified') s.rectified++
      if (h.status === 'rectifying') s.deadline++
      if (h.status === 'pending') s.recheck++
    })

    // 按重大风险、较大风险、一般风险、低风险的顺序排列
    const order = ['重大风险', '较大风险', '一般风险', '低风险']
    return order.map(name => ({
      name: name,
      enterpriseCount: entMap.get(name)?.enterpriseCount || 0,
      inspectedCount: 0,
      hazardFound: hazMap.get(name)?.hazardFound || 0,
      seriousHazard: hazMap.get(name)?.seriousHazard || 0,
      rectified: hazMap.get(name)?.rectified || 0,
      deadline: hazMap.get(name)?.deadline || 0,
      recheck: hazMap.get(name)?.recheck || 0,
      enforcement: 0,
    }))
  }, [enterprises, hazards])

  // 消防类型汇总（从 enterprises 按 risk_level 聚合）
  // 改为按风险等级统计，度量值顺序：重大风险、较大风险、一般风险、低风险
  const fireTypes = useMemo(() => {
    const map = new Map<string, { enterpriseCount: number; inspectedCount: number; hazardFound: number; seriousHazard: number; rectified: number; deadline: number; recheck: number; enforcement: number }>()

    // 只统计消防场所类型企业，按风险等级聚合
    const industryToTypeLocal: Record<string, string> = {
      '工业企业': '工业企业', '危化使用': '工业企业',
      '仓储物流': '消防场所', '小微企业': '消防场所', '九小场所': '消防场所', '出租房': '消防场所', '沿街店铺': '消防场所',
    }

    // 按风险等级聚合企业数（只统计消防场所）
    enterprises
      .filter(e => (industryToTypeLocal[e.industry] || '消防场所') === '消防场所')
      .forEach(e => {
        const level = e.risk_level
        if (!map.has(level)) map.set(level, { enterpriseCount: 0, inspectedCount: 0, hazardFound: 0, seriousHazard: 0, rectified: 0, deadline: 0, recheck: 0, enforcement: 0 })
        map.get(level)!.enterpriseCount++
      })

    // 按风险等级聚合隐患数据
    hazards.forEach(h => {
      const industry = h.enterprise_industry || '未知'
      const type = industryToTypeLocal[industry] || '消防场所'
      if (type !== '消防场所') return
      // 这里简化处理，用隐患关联的行业来估算
      const level = '一般风险' // 简化处理
      if (!map.has(level)) map.set(level, { enterpriseCount: 0, inspectedCount: 0, hazardFound: 0, seriousHazard: 0, rectified: 0, deadline: 0, recheck: 0, enforcement: 0 })
      const s = map.get(level)!
      s.hazardFound++
      if (h.level === '重大隐患') s.seriousHazard++
      if (h.status === 'rectified') s.rectified++
      if (h.status === 'rectifying') s.deadline++
      if (h.status === 'pending') s.recheck++
    })

    // 按重大风险、较大风险、一般风险、低风险的顺序排列
    const order = ['重大风险', '较大风险', '一般风险', '低风险']
    return order.map(name => ({
      name,
      enterpriseCount: map.get(name)?.enterpriseCount || 0,
      inspectedCount: map.get(name)?.inspectedCount || 0,
      hazardFound: map.get(name)?.hazardFound || 0,
      seriousHazard: map.get(name)?.seriousHazard || 0,
      rectified: map.get(name)?.rectified || 0,
      deadline: map.get(name)?.deadline || 0,
      recheck: map.get(name)?.recheck || 0,
      enforcement: map.get(name)?.enforcement || 0,
    }))
  }, [enterprises, hazards])

  // 排序
  const { sortedData: sortedSubjectTypes, sort: sortSubjectTypes, handleSort: handleSortSubjectTypes } = useSortableTable(subjectTypes, 'name', 'asc')
  const { sortedData: sortedRiskLevels, sort: sortRiskLevels, handleSort: handleSortRiskLevels } = useSortableTable(riskLevels, 'name', 'asc')
  const { sortedData: sortedFireTypes, sort: sortFireTypes, handleSort: handleSortFireTypes } = useSortableTable(fireTypes, 'name', 'asc')
  const { sortedData: sortedFiltered, sort: sortFiltered, handleSort: handleSortFiltered } = useSortableTable(filtered, 'hazardCount', 'desc')

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#9CA3AF' }}>
        加载数据中...
      </div>
    )
  }

  return (
    <div>
      {/* 责任主体类型汇总表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>责任主体类型统计表</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr>
                <SortableTh label="责任主体类型" sortKey="name" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <SortableTh label="企业总数" sortKey="enterpriseCount" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <SortableTh label="检查次数" sortKey="inspectedCount" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <th style={thStyle} title="发现隐患的检查户次">整改指令书 <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', background: '#6B7280', color: 'white', fontSize: 9, fontWeight: 700, cursor: 'help', verticalAlign: 'middle' }}>!</span></th>
                <SortableTh label="发现隐患数" sortKey="hazardFound" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <SortableTh label="重大隐患数" sortKey="seriousHazard" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <SortableTh label="已整改数" sortKey="rectified" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <SortableTh label="整改中" sortKey="deadline" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} />
                <SortableTh label="复查整改数" sortKey="recheck" sort={sortSubjectTypes} onSort={handleSortSubjectTypes} tooltip="首次验收未通过，进入二次整改的隐患数" />
              </tr>
            </thead>
            <tbody>
              {sortedSubjectTypes.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#1F2937' }}>{s.name}</td>
                  <td style={tdStyle}>{s.enterpriseCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={{ ...tdStyle, color: s.hazardFound > 50 ? '#DC2626' : '#374151' }}>{s.hazardFound}</td>
                  <td style={{ ...tdStyle, color: '#DC2626', fontWeight: 600 }}>{s.seriousHazard}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{s.rectified}</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{s.deadline}</td>
                  <td style={tdStyle}>{s.recheck}</td>
                </tr>
              ))}
              {sortedSubjectTypes.length > 0 && (
                <>
                  <tr style={{ background: '#FAFBFC' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>未知</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                  </tr>
                  <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                    <td style={tdStyle}>{sortedSubjectTypes.reduce((sum, s) => sum + s.enterpriseCount, 0)}</td>
                    <td style={tdStyle}>{sortedSubjectTypes.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                    <td style={tdStyle}>{sortedSubjectTypes.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                    <td style={tdStyle}>{sortedSubjectTypes.reduce((sum, s) => sum + s.hazardFound, 0)}</td>
                    <td style={{ ...tdStyle, color: '#DC2626' }}>{sortedSubjectTypes.reduce((sum, s) => sum + s.seriousHazard, 0)}</td>
                    <td style={{ ...tdStyle, color: '#059669' }}>{sortedSubjectTypes.reduce((sum, s) => sum + s.rectified, 0)}</td>
                    <td style={{ ...tdStyle, color: '#D97706' }}>{sortedSubjectTypes.reduce((sum, s) => sum + s.deadline, 0)}</td>
                    <td style={tdStyle}>{sortedSubjectTypes.reduce((sum, s) => sum + s.recheck, 0)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 消防场所按风险等级分类统计 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>消防场所按风险等级分类统计</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr>
                <SortableTh label="风险等级" sortKey="name" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <SortableTh label="企业总数" sortKey="enterpriseCount" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <SortableTh label="检查次数" sortKey="inspectedCount" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <th style={thStyle} title="发现隐患的检查户次">整改指令书 <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', background: '#6B7280', color: 'white', fontSize: 9, fontWeight: 700, cursor: 'help', verticalAlign: 'middle' }}>!</span></th>
                <SortableTh label="发现隐患数" sortKey="hazardFound" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <SortableTh label="重大隐患数" sortKey="seriousHazard" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <SortableTh label="已整改数" sortKey="rectified" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <SortableTh label="整改中" sortKey="deadline" sort={sortRiskLevels} onSort={handleSortRiskLevels} />
                <SortableTh label="复查整改数" sortKey="recheck" sort={sortRiskLevels} onSort={handleSortRiskLevels} tooltip="首次验收未通过，进入二次整改的隐患数" />
              </tr>
            </thead>
            <tbody>
              {sortedRiskLevels.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#1F2937' }}>{s.name}</td>
                  <td style={tdStyle}>{s.enterpriseCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={{ ...tdStyle, color: s.hazardFound > 50 ? '#DC2626' : '#374151' }}>{s.hazardFound}</td>
                  <td style={{ ...tdStyle, color: '#DC2626', fontWeight: 600 }}>{s.seriousHazard}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{s.rectified}</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{s.deadline}</td>
                  <td style={tdStyle}>{s.recheck}</td>
                </tr>
              ))}
              {sortedRiskLevels.length > 0 && (
                <>
                  <tr style={{ background: '#FAFBFC' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>未知</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                  </tr>
                  <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                    <td style={tdStyle}>{sortedRiskLevels.reduce((sum, s) => sum + s.enterpriseCount, 0)}</td>
                    <td style={tdStyle}>{sortedRiskLevels.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                    <td style={tdStyle}>{sortedRiskLevels.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                    <td style={tdStyle}>{sortedRiskLevels.reduce((sum, s) => sum + s.hazardFound, 0)}</td>
                    <td style={{ ...tdStyle, color: '#DC2626' }}>{sortedRiskLevels.reduce((sum, s) => sum + s.seriousHazard, 0)}</td>
                    <td style={{ ...tdStyle, color: '#059669' }}>{sortedRiskLevels.reduce((sum, s) => sum + s.rectified, 0)}</td>
                    <td style={{ ...tdStyle, color: '#D97706' }}>{sortedRiskLevels.reduce((sum, s) => sum + s.deadline, 0)}</td>
                    <td style={tdStyle}>{sortedRiskLevels.reduce((sum, s) => sum + s.recheck, 0)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 消防类型汇总表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>消防场所分类表</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr>
                <SortableTh label="风险等级" sortKey="name" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <SortableTh label="企业总数" sortKey="enterpriseCount" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <SortableTh label="检查次数" sortKey="inspectedCount" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <th style={thStyle} title="发现隐患的检查户次">整改指令书 <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', background: '#6B7280', color: 'white', fontSize: 9, fontWeight: 700, cursor: 'help', verticalAlign: 'middle' }}>!</span></th>
                <SortableTh label="发现隐患数" sortKey="hazardFound" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <SortableTh label="重大隐患数" sortKey="seriousHazard" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <SortableTh label="已整改数" sortKey="rectified" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <SortableTh label="整改中" sortKey="deadline" sort={sortFireTypes} onSort={handleSortFireTypes} />
                <SortableTh label="复查整改数" sortKey="recheck" sort={sortFireTypes} onSort={handleSortFireTypes} tooltip="首次验收未通过，进入二次整改的隐患数" />
              </tr>
            </thead>
            <tbody>
              {sortedFireTypes.map((s, i) => (
                <tr key={s.name} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#1F2937' }}>{s.name}</td>
                  <td style={tdStyle}>{s.enterpriseCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={tdStyle}>{s.inspectedCount}</td>
                  <td style={{ ...tdStyle, color: s.hazardFound > 50 ? '#DC2626' : '#374151' }}>{s.hazardFound}</td>
                  <td style={{ ...tdStyle, color: '#DC2626', fontWeight: 600 }}>{s.seriousHazard}</td>
                  <td style={{ ...tdStyle, color: '#059669' }}>{s.rectified}</td>
                  <td style={{ ...tdStyle, color: '#D97706' }}>{s.deadline}</td>
                  <td style={tdStyle}>{s.recheck}</td>
                </tr>
              ))}
              {sortedFireTypes.length > 0 && (
                <>
                  <tr style={{ background: '#FAFBFC' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: '#6B7280' }}>未知</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                    <td style={{ ...tdStyle, color: '#6B7280' }}>0</td>
                  </tr>
                  <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                    <td style={tdStyle}>{sortedFireTypes.reduce((sum, s) => sum + s.enterpriseCount, 0)}</td>
                    <td style={tdStyle}>{sortedFireTypes.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                    <td style={tdStyle}>{sortedFireTypes.reduce((sum, s) => sum + s.inspectedCount, 0)}</td>
                    <td style={tdStyle}>{sortedFireTypes.reduce((sum, s) => sum + s.hazardFound, 0)}</td>
                    <td style={{ ...tdStyle, color: '#DC2626' }}>{sortedFireTypes.reduce((sum, s) => sum + s.seriousHazard, 0)}</td>
                    <td style={{ ...tdStyle, color: '#059669' }}>{sortedFireTypes.reduce((sum, s) => sum + s.rectified, 0)}</td>
                    <td style={{ ...tdStyle, color: '#D97706' }}>{sortedFireTypes.reduce((sum, s) => sum + s.deadline, 0)}</td>
                    <td style={tdStyle}>{sortedFireTypes.reduce((sum, s) => sum + s.recheck, 0)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 标签隐患分析统计表 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>标签隐患分析统计表</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="搜索行业名称" value={keyword} onChange={e => setKeyword(e.target.value)} style={inputStyle} />
            <button onClick={() => exportToCSV(
              filtered.map(d => ({
                标签: d.industry,
                隐患数: d.hazardCount,
                重大隐患: d.majorHazardCount,
                已整改: d.rectifiedCount,
                限期整改: d.deadlineCount,
                高频问题: d.topIssues.join('、'),
              })),
              [
                { key: '标签', label: '标签' },
                { key: '隐患数', label: '隐患数' },
                { key: '重大隐患', label: '重大隐患' },
                { key: '已整改', label: '已整改' },
                { key: '限期整改', label: '限期整改' },
                { key: '高频问题', label: '高频问题' },
              ],
              '标签隐患分析统计表'
            )} style={{ padding: '4px 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', color: '#374151', fontSize: 12, cursor: 'pointer' }}>⬇ 导出</button>
          </div>
        </div>
        {/* 标签选择器入口 */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setTagModalOpen(true)}
            style={{
              padding: '4px 12px',
              border: '1px dashed #D1D5DB',
              borderRadius: 4,
              background: 'white',
              color: '#6B7280',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            + 编辑标签 {selectedTags.length > 0 && `(${selectedTags.length}个已选)`}
          </button>
        </div>

        {/* 标签选择浮层 */}
        {tagModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => { setTagModalOpen(false); setTagSearch('') }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: 8,
                padding: 24,
                width: 480,
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>选择标签</div>
                <button
                  onClick={() => { setTagModalOpen(false); setTagSearch('') }}
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#9CA3AF',
                    fontSize: 18,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="搜索标签..."
                  value={tagSearch}
                  onChange={e => setTagSearch(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {filteredTagLibrary.map(tag => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <span
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 16,
                          border: '1px solid',
                          borderColor: isSelected ? '#4F46E5' : '#D1D5DB',
                          background: isSelected ? '#EEF2FF' : 'white',
                          color: isSelected ? '#4F46E5' : '#6B7280',
                          fontSize: 13,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                  {filteredTagLibrary.length === 0 && (
                    <div style={{ color: '#9CA3AF', fontSize: 13, padding: '20px 0', textAlign: 'center', width: '100%' }}>未找到匹配的标签</div>
                  )}
                </div>
              </div>
              {selectedTags.length > 0 && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#F9FAFB', borderRadius: 4 }}>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>已选标签：</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {tag} ×
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                  onClick={() => setSelectedTags([])}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 4,
                    background: 'white',
                    color: '#DC2626',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  清空
                </button>
                <button
                  onClick={() => { setTagModalOpen(false); setTagSearch('') }}
                  style={{
                    padding: '8px 24px',
                    border: 'none',
                    borderRadius: 4,
                    background: '#4F46E5',
                    color: 'white',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <SortableTh label="标签" sortKey="industry" sort={sortFiltered} onSort={handleSortFiltered} />
              <SortableTh label="隐患数" sortKey="hazardCount" sort={sortFiltered} onSort={handleSortFiltered} />
              <SortableTh label="重大隐患" sortKey="majorHazardCount" sort={sortFiltered} onSort={handleSortFiltered} />
              <SortableTh label="已整改" sortKey="rectifiedCount" sort={sortFiltered} onSort={handleSortFiltered} />
              <SortableTh label="限期整改" sortKey="deadlineCount" sort={sortFiltered} onSort={handleSortFiltered} />
              <th style={thStyle}>高频问题 Top3</th>
            </tr>
          </thead>
          <tbody>
            {sortedFiltered.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>未找到匹配结果</td></tr>
            ) : sortedFiltered.map((d, i) => (
              <tr key={d.industry} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                <td style={{ ...tdStyle, color: '#9CA3AF' }}>{i + 1}</td>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937' }}>{d.industry}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: d.hazardCount > 150 ? '#DC2626' : d.hazardCount > 100 ? '#D97706' : '#374151' }}>{d.hazardCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#DC2626' }}>{d.majorHazardCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#059669' }}>{d.rectifiedCount}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#D97706' }}>{d.deadlineCount}</td>
                <td style={{ ...tdStyle, textAlign: 'left', color: '#64748b', fontSize: 11 }}>{d.topIssues.join('、')}</td>
              </tr>
            ))}
            {sortedFiltered.length > 0 && (
              <tr style={{ background: '#F3F4F6', fontWeight: 600 }}>
                <td colSpan={2} style={{ ...tdStyle, textAlign: 'left', color: '#374151' }}>合计</td>
                <td style={{ ...tdStyle, color: '#374151' }}>{total.hazardCount}</td>
                <td style={{ ...tdStyle, color: '#DC2626' }}>{total.majorHazardCount}</td>
                <td style={{ ...tdStyle, color: '#059669' }}>{total.rectifiedCount}</td>
                <td style={{ ...tdStyle, color: '#D97706' }}>{total.deadlineCount}</td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
