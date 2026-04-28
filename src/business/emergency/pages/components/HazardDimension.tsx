import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { thStyle, tdStyle, inputStyle } from './styles'
import type { HazardDimensionProps } from './types'
import type { Hazard, HazardStatus, HazardDimension, HazardSourceDetail } from '../../../../db/types'
import { initDatabase, getHazards } from '../../../../db'
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'
import { exportToCSV } from './exportUtils'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  pending:    { label: '待整改', color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' },
  rectifying: { label: '整改中', color: '#D97706', bg: '#FEF3C7', textColor: '#92400E' },
  rectified:  { label: '已整改', color: '#059669', bg: '#D1FAE5', textColor: '#065F46' },
  verified:   { label: '已验收', color: '#059669', bg: '#D1FAE5', textColor: '#065F46' },
  rejected:   { label: '已驳回', color: '#DC2626', bg: '#FEE2E2', textColor: '#991B1B' },
  overdue:    { label: '已逾期', color: '#DC2626', bg: '#FEE2E2', textColor: '#991B1B' },
  closed:     { label: '已闭环', color: '#4F46E5', bg: '#EEF2FF', textColor: '#3730A3' },
}

const LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  '重大隐患': { label: '重大隐患', color: '#DC2626' },
  '一般隐患': { label: '一般隐患', color: '#D97706' },
}

const DIMENSION_CONFIG: Record<string, { label: string; color: string }> = {
  '机构职责':  { label: '机构职责', color: '#7C3AED' },
  '安全投入':  { label: '安全投入', color: '#0891B2' },
  '教育培训':  { label: '教育培训', color: '#059669' },
  '安全制度':  { label: '安全制度', color: '#DC2626' },
  '双重预防':  { label: '双重预防', color: '#D97706' },
  '事故管理':  { label: '事故管理', color: '#4F46E5' },
  '应急管理':  { label: '应急管理', color: '#6B7280' },
}

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  ai评估:  { label: 'AI评估', color: '#7C3AED' },
  一企一档: { label: '一企一档', color: '#0891B2' },
  视频看:  { label: '视频看', color: '#059669' },
  现场看:  { label: '现场看', color: '#D97706' },
  其他:    { label: '其他', color: '#6B7280' },
}

export function HazardDimension({ dateRange, riskLevel, timeRange, selectedKpi, setSelectedKpi, navigateParams }: HazardDimensionProps) {
  const [searchParams] = useSearchParams()
  const [hazardRecords, setHazardRecords] = useState<Hazard[]>([])
  const [loading, setLoading] = useState(true)

  // 筛选状态
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<string>(navigateParams?.teamName || 'all')
  const [expertFilter, setExpertFilter] = useState<string>(navigateParams?.expertName || 'all')
  const [keyword, setKeyword] = useState('')
  const [localStatusFilter, setLocalStatusFilter] = useState<HazardStatus | 'all'>(
    navigateParams?.status ? (navigateParams.status as HazardStatus) : 'all'
  )
  const [dimensionFilter, setDimensionFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [hazardLevelFilter, setHazardLevelFilter] = useState<string>('all')
  // 企业ID列表筛选（任务关联企业）
  const [enterpriseIdsFilter, setEnterpriseIdsFilter] = useState<string[]>(() => {
    const ids = navigateParams?.enterpriseIds
    if (ids && ids.length > 0) return ids
    const urlIds = searchParams.get('enterpriseIds')
    if (urlIds) return urlIds.split(',').filter(Boolean)
    return []
  })

  // 加载数据库数据
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDatabase()
        const data = await getHazards()
        setHazardRecords(data)
      } catch (err) {
        console.error('Failed to load hazards:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // selectedKpi 映射到对应的隐患状态
  const kpiToStatus: Record<string, HazardStatus | null> = {
    serious:   null,
    closed:    'rectified',
    inProgress: 'rectifying',
    deadline:  'pending',
    extended: 'overdue',
    overdue:  'overdue',
  }

  // 优先用局部状态筛选，否则用顶部 KPI 映射的状态
  const statusFilter = localStatusFilter !== 'all' 
    ? localStatusFilter 
    : (selectedKpi ? (kpiToStatus[selectedKpi] || 'all') : 'all')

  // 各状态统计
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, rectifying: 0, rectified: 0, overdue: 0, all: hazardRecords.length }
    hazardRecords.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++
    })
    return counts
  }, [hazardRecords])

  // 行业列表
  const industries = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.enterprise_industry).filter(Boolean) as string[])
    return ['all', ...Array.from(set).sort()]
  }, [hazardRecords])

  // 工作组列表
  const teams = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.team_name).filter(Boolean) as string[])
    return ['all', ...Array.from(set).sort()]
  }, [hazardRecords])

  // 维度列表
  const dimensions = useMemo(() => {
    const set = new Set(hazardRecords.map(r => r.dimension).filter(Boolean) as string[])
    return ['all', ...Array.from(set).sort()]
  }, [hazardRecords])

  // 隐患等级筛选映射
  const hazardLevelMap: Record<string, string> = {
    '全部': 'all',
    '重大隐患': '重大隐患',
    '一般隐患': '一般隐患',
  }

  // 各隐患等级统计
  const hazardLevelCounts = useMemo(() => {
    const counts = { all: hazardRecords.length, '重大隐患': 0, '一般隐患': 0 }
    hazardRecords.forEach(r => {
      if (r.level === '重大隐患') counts['重大隐患']++
      if (r.level === '一般隐患') counts['一般隐患']++
    })
    return counts
  }, [hazardRecords])

  // 计算逾期天数（只对已逾期的隐患显示正数）
  const getOverdueDays = (deadline: string, status: string) => {
    if (status !== 'overdue') return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    const diff = Math.floor((today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 1 // 至少显示1天
  }

  // 过滤后的隐患列表
  const filtered = useMemo(() => {
    return hazardRecords.filter(r => {
      // 隐患等级筛选
      if (hazardLevelFilter !== 'all') {
        if (r.level !== hazardLevelFilter) return false
      }
      // 状态筛选
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      // 来源筛选
      if (sourceFilter !== 'all' && r.source_detail !== sourceFilter) return false
      // 行业筛选
      if (industryFilter !== 'all' && r.enterprise_industry !== industryFilter) return false
      // 工作组筛选
      if (teamFilter !== 'all' && r.team_name !== teamFilter) return false
      // 专家筛选
      if (expertFilter !== 'all' && r.expert_name !== expertFilter) return false
      // 企业ID列表筛选（任务关联企业）
      if (enterpriseIdsFilter.length > 0 && !enterpriseIdsFilter.includes(r.enterprise_id)) return false
      // 维度筛选
      if (dimensionFilter !== 'all' && r.dimension !== dimensionFilter) return false
      // 关键词搜索
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        const enterpriseName = (r.enterprise_name || '').toLowerCase()
        const title = (r.title || '').toLowerCase()
        const description = (r.description || '').toLowerCase()
        const expertName = (r.expert_name || '').toLowerCase()
        if (!enterpriseName.includes(kw) && !title.includes(kw) && !description.includes(kw) && !expertName.includes(kw)) return false
      }
      return true
    })
  }, [hazardRecords, hazardLevelFilter, statusFilter, sourceFilter, industryFilter, teamFilter, expertFilter, dimensionFilter, enterpriseIdsFilter, keyword])

  // 复用排序 hook - 使用 discovered_at 作为排序字段
  const { sortedData, sort, handleSort } = useSortableTable(filtered, 'discovered_at', 'desc')

  // 分页
  const PAGE_SIZE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(sortedData.length / PAGE_SIZE)
  const paginatedData = sortedData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // 筛选变化时重置页码
  useEffect(() => {
    setCurrentPage(1)
  }, [hazardRecords, hazardLevelFilter, statusFilter, sourceFilter, industryFilter, teamFilter, enterpriseIdsFilter, dimensionFilter, keyword])

  // 企业维度隐患统计
  const enterpriseDimensionStats = useMemo(() => {
    const stats: Record<string, { 
      enterpriseName: string
      expertName: string
      机构职责: number
      安全投入: number
      教育培训: number
      安全制度: number
      双重预防: number
      事故管理: number
      应急管理: number
      总计: number 
    }> = {}
    const dimensions = ['机构职责', '安全投入', '教育培训', '安全制度', '双重预防', '事故管理', '应急管理']
    
    filtered.forEach(h => {
      if (!stats[h.enterprise_name]) {
        stats[h.enterprise_name] = { 
          enterpriseName: h.enterprise_name,
          expertName: h.expert_name,
          机构职责: 0,
          安全投入: 0,
          教育培训: 0,
          安全制度: 0,
          双重预防: 0,
          事故管理: 0,
          应急管理: 0,
          总计: 0 
        }
      }
      stats[h.enterprise_name].总计++
      if (dimensions.includes(h.dimension)) {
        stats[h.enterprise_name][h.dimension as keyof typeof stats[string]]++
      }
    })
    
    // 转为数组并按总隐患数排序
    return Object.values(stats).sort((a, b) => b.总计 - a.总计).slice(0, 20)
  }, [filtered])

  // 企业表排序
  const [enterpriseSortKey, setEnterpriseSortKey] = useState<string>('总计')
  const [enterpriseSortDir, setEnterpriseSortDir] = useState<'asc' | 'desc'>('desc')

  const handleEnterpriseSort = (key: string) => {
    if (enterpriseSortKey === key) {
      setEnterpriseSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setEnterpriseSortKey(key)
      setEnterpriseSortDir('desc')
    }
  }

  const sortedEnterpriseStats = useMemo(() => {
    return [...enterpriseDimensionStats].sort((a, b) => {
      const aVal = a[enterpriseSortKey as keyof typeof a] as number
      const bVal = b[enterpriseSortKey as keyof typeof b] as number
      return enterpriseSortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [enterpriseDimensionStats, enterpriseSortKey, enterpriseSortDir])

  const total = hazardRecords.length

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
        加载中...
      </div>
    )
  }

  // 判断是否有任务关联筛选
  const hasTaskFilter = enterpriseIdsFilter.length > 0
  const clearTaskFilter = () => {
    setEnterpriseIdsFilter([])
  }

  return (
    <div>
      {/* 任务跳转提示 */}
      {hasTaskFilter && (
        <div style={{
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
        }}>
          <div style={{ color: '#4338CA' }}>
            <span style={{ fontWeight: 600 }}>筛选条件：</span>
            <span>来自任务关联企业，共 <span style={{ fontWeight: 600, color: '#4F46E5' }}>{enterpriseIdsFilter.length}</span> 家企业</span>
          </div>
          <button
            onClick={clearTaskFilter}
            style={{
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid #C7D2FE',
              background: 'white',
              color: '#4F46E5',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 筛选器 */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}>
        {/* 隐患等级筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
            隐患等级 {hazardLevelFilter !== 'all' && <span style={{ color: '#4F46E5' }}>（已筛选）</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['全部', '重大隐患', '一般隐患'] as const).map(level => {
              const cfg = level === '全部'
                ? { label: '全部', color: '#4F46E5', bg: '#EEF2FF', textColor: '#3730A3' }
                : level === '重大隐患'
                  ? { label: '重大隐患', color: '#DC2626', bg: '#FEE2E2', textColor: '#991B1B' }
                  : { label: '一般隐患', color: '#D97706', bg: '#FEF3C7', textColor: '#92400E' }
              const active = hazardLevelFilter === level || (level === '全部' && hazardLevelFilter === 'all')
              const count = level === '全部' ? hazardLevelCounts.all : hazardLevelCounts[level as '重大隐患' | '一般隐患']
              return (
                <button
                  key={level}
                  onClick={() => setHazardLevelFilter(level === '全部' ? 'all' : level)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${active ? cfg.color : '#D1D5DB'}`,
                    background: active ? cfg.bg : 'white',
                    color: active ? cfg.textColor : '#6B7280',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cfg.label} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        </div>

        {/* 状态筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
            隐患状态 {localStatusFilter !== 'all' && <span style={{ color: '#4F46E5' }}>（已筛选）</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'rectifying', 'rectified', 'overdue'] as const).map(s => {
              const cfg = s === 'all'
                ? { label: '全部', color: '#4F46E5', bg: '#EEF2FF', textColor: '#3730A3' }
                : STATUS_CONFIG[s]
              const active = statusFilter === s
              const count = s === 'all' ? statusCounts.all : (statusCounts[s] || 0)
              return (
                <button
                  key={s}
                  onClick={() => {
                    setLocalStatusFilter(s)
                    setSelectedKpi(null)
                  }}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${active ? cfg.color : '#D1D5DB'}`,
                    background: active ? cfg.bg : 'white',
                    color: active ? cfg.textColor : '#6B7280',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cfg.label} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        </div>

        {/* 主体责任类型筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>
            主体责任类型 {dimensionFilter !== 'all' && <span style={{ color: '#4F46E5' }}>（已筛选）</span>}
          </div>
          <select
            value={dimensionFilter}
            onChange={e => setDimensionFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {dimensions.map(dim => (
              <option key={dim} value={dim}>{dim === 'all' ? '全部类型' : dim}</option>
            ))}
          </select>
        </div>

        {/* 来源筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>来源 {sourceFilter !== 'all' && <span style={{ color: '#4F46E5' }}>（已筛选）</span>}</div>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            <option value="all">全部来源</option>
            <option value="ai评估">AI评估</option>
            <option value="一企一档">一企一档</option>
            <option value="视频看">视频看</option>
            <option value="现场看">现场看</option>
            <option value="其他">其他</option>
          </select>
        </div>

        {/* 行业筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>所属行业</div>
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind === 'all' ? '全部行业' : ind}</option>
            ))}
          </select>
        </div>

        {/* 工作组筛选 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>负责工作组</div>
          <select
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
            style={{ padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 4, fontSize: 12, color: '#374151', outline: 'none' }}
          >
            {teams.map(t => (
              <option key={t} value={t}>{t === 'all' ? '全部工作组' : t}</option>
            ))}
          </select>
        </div>

        {/* 关键词搜索 */}
        <div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>关键词搜索</div>
          <input
            type="text"
            placeholder="企业名称 / 隐患描述 / 专家"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* 重置按钮 */}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => {
              setLocalStatusFilter('all')
              setDimensionFilter('all')
              setSourceFilter('all')
              setIndustryFilter('all')
              setTeamFilter('all')
              setKeyword('')
              setSelectedKpi(null)
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              background: 'white',
              color: '#4F46E5',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            重置筛选
          </button>
        </div>
      </div>

      {/* 隐患列表 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
            隐患明细列表
            <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>
              （{sortedData.length} / {total} 条）
            </span>
          </div>
          <button
            onClick={() => {
              const exportData = sortedData.map(h => ({
                隐患描述: h.title,
                主体责任: h.dimension,
                隐患等级: h.level,
                来源: h.source_detail,
                企业名称: h.enterprise_name,
                行业: h.enterprise_industry,
                工作组: h.team_name,
                专家: h.expert_name,
                状态: STATUS_CONFIG[h.status]?.label || h.status,
                发现时间: h.discovered_at,
                整改期限: h.deadline,
              }))
              exportToCSV(exportData, [
                { key: '隐患描述', label: '隐患描述' },
                { key: '主体责任', label: '主体责任' },
                { key: '隐患等级', label: '隐患等级' },
                { key: '来源', label: '来源' },
                { key: '企业名称', label: '企业名称' },
                { key: '行业', label: '行业' },
                { key: '工作组', label: '工作组' },
                { key: '专家', label: '专家' },
                { key: '状态', label: '状态' },
                { key: '发现时间', label: '发现时间' },
                { key: '整改期限', label: '整改期限' },
              ], '隐患明细列表')
            }}
            style={{
              padding: '4px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              background: 'white',
              color: '#374151',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ⬇ 导出
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1100 }}>
            <thead>
              <tr>
                <th style={thStyle}>序号</th>
                <SortableTh label="企业" sortKey="enterprise_name" sort={sort} onSort={handleSort} />
                <SortableTh label="隐患描述" sortKey="title" sort={sort} onSort={handleSort} />
                <SortableTh label="主体责任" sortKey="dimension" sort={sort} onSort={handleSort} />
                <SortableTh label="等级" sortKey="level" sort={sort} onSort={handleSort} />
                <SortableTh label="来源" sortKey="source_detail" sort={sort} onSort={handleSort} />
                <SortableTh label="行业" sortKey="enterprise_industry" sort={sort} onSort={handleSort} />
                <SortableTh label="状态" sortKey="status" sort={sort} onSort={handleSort} />
                <SortableTh label="发现时间" sortKey="discovered_at" sort={sort} onSort={handleSort} />
                <th style={thStyle}>整改期限</th>
                <th style={thStyle}>逾期天数</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr><td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: '30px' }}>未找到匹配结果</td></tr>
              ) : paginatedData.map((r, i) => {
                const statusCfg = STATUS_CONFIG[r.status] || { label: '未知', color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' }
                const levelCfg = LEVEL_CONFIG[r.level] || { label: '未知', color: '#6B7280' }
                const dimCfg = DIMENSION_CONFIG[r.dimension] || { label: r.dimension || '未知', color: '#6B7280' }
                const sourceCfg = SOURCE_CONFIG[r.source_detail] || { label: r.source_detail || '未知', color: '#6B7280' }
                const overdueDays = getOverdueDays(r.deadline, r.status)
                const rowIndex = (currentPage - 1) * PAGE_SIZE + i + 1
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={{ ...tdStyle, color: '#9CA3AF', fontSize: 11, width: 50 }}>{rowIndex}</td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#6B7280', minWidth: 180 }}>
                      {r.enterprise_name || '-'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'left', color: '#374151', minWidth: 200 }} title={r.description}>
                      {r.title}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500, color: dimCfg.color }}>
                      {dimCfg.label}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: levelCfg.color }}>
                      {levelCfg.label}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500, color: sourceCfg.color }}>
                      {sourceCfg.label}
                    </td>
                    <td style={tdStyle}>
                      {r.enterprise_industry || '-'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: statusCfg.bg,
                        color: statusCfg.textColor,
                        fontWeight: 600,
                        fontSize: 11,
                      }}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td style={tdStyle}>{r.discovered_at}</td>
                    <td style={{ ...tdStyle, color: r.status === 'overdue' ? '#DC2626' : '#374151' }}>{r.deadline}</td>
                    <td style={{ ...tdStyle, fontWeight: overdueDays ? 600 : 400, color: overdueDays ? '#DC2626' : '#9CA3AF' }}>
                      {overdueDays ? `${overdueDays}天` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '8px 0' }}>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              共 {sortedData.length} 条，当前第 {currentPage} / {totalPages} 页
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  background: currentPage === 1 ? '#F3F4F6' : 'white',
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                首页
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  background: currentPage === 1 ? '#F3F4F6' : 'white',
                  color: currentPage === 1 ? '#9CA3AF' : '#374151',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '4px 10px',
                      border: '1px solid',
                      borderColor: currentPage === pageNum ? '#4F46E5' : '#D1D5DB',
                      borderRadius: 4,
                      background: currentPage === pageNum ? '#EEF2FF' : 'white',
                      color: currentPage === pageNum ? '#4F46E5' : '#374151',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: currentPage === pageNum ? 600 : 400,
                    }}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  background: currentPage === totalPages ? '#F3F4F6' : 'white',
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                下一页
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 4,
                  background: currentPage === totalPages ? '#F3F4F6' : 'white',
                  color: currentPage === totalPages ? '#9CA3AF' : '#374151',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                }}
              >
                末页
              </button>
            </div>
          </div>
        )}

        {/* 企业维度隐患统计表 */}
        <div style={{ marginTop: 24, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
              企业维度隐患统计
            </div>
            <button onClick={() => exportToCSV(
              sortedEnterpriseStats.map(row => ({
                企业名称: row.enterpriseName,
                专家: row.expertName,
                机构职责: row['机构职责'],
                安全投入: row['安全投入'],
                教育培训: row['教育培训'],
                安全制度: row['安全制度'],
                双重预防: row['双重预防'],
                事故管理: row['事故管理'],
                应急管理: row['应急管理'],
                总隐患数: row['总计'],
              })),
              [
                { key: '企业名称', label: '企业名称' },
                { key: '专家', label: '专家' },
                { key: '机构职责', label: '机构职责' },
                { key: '安全投入', label: '安全投入' },
                { key: '教育培训', label: '教育培训' },
                { key: '安全制度', label: '安全制度' },
                { key: '双重预防', label: '双重预防' },
                { key: '事故管理', label: '事故管理' },
                { key: '应急管理', label: '应急管理' },
                { key: '总隐患数', label: '总隐患数' },
              ],
              '企业维度隐患统计'
            )} style={{ padding: '4px 12px', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', color: '#374151', fontSize: 12, cursor: 'pointer' }}>⬇ 导出</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {[
                    { key: 'enterpriseName', label: '企业名称', sortable: true },
                    { key: 'expertName', label: '专家', sortable: true },
                    { key: '机构职责', label: '机构职责', sortable: true },
                    { key: '安全投入', label: '安全投入', sortable: true },
                    { key: '教育培训', label: '教育培训', sortable: true },
                    { key: '安全制度', label: '安全制度', sortable: true },
                    { key: '双重预防', label: '双重预防', sortable: true },
                    { key: '事故管理', label: '事故管理', sortable: true },
                    { key: '应急管理', label: '应急管理', sortable: true },
                    { key: '总计', label: '总隐患数', sortable: true },
                  ].map(col => (
                    <th
                      key={col.key}
                      style={{ 
                        ...thStyle, 
                        fontWeight: 600, 
                        cursor: col.sortable ? 'pointer' : 'default',
                        color: enterpriseSortKey === col.key ? '#4F46E5' : '#374151',
                      }}
                      onClick={() => col.sortable && handleEnterpriseSort(col.key)}
                    >
                      {col.label}
                      {col.sortable && enterpriseSortKey === col.key && (
                        <span style={{ marginLeft: 4 }}>{enterpriseSortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEnterpriseStats.length === 0 ? (
                  <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', padding: 20 }}>暂无数据</td></tr>
                ) : sortedEnterpriseStats.map((row, i) => (
                  <tr key={row.enterpriseName} style={{ background: i % 2 === 0 ? 'white' : '#FAFBFC' }}>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500, color: '#1F2937', maxWidth: 180 }}>{row.enterpriseName}</td>
                    <td style={{ ...tdStyle, color: '#4F46E5' }}>{row.expertName}</td>
                    <td style={{ ...tdStyle, color: row['机构职责'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '机构职责' ? 600 : 400 }}>{row['机构职责'] || '-'}</td>
                    <td style={{ ...tdStyle, color: row['安全投入'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '安全投入' ? 600 : 400 }}>{row['安全投入'] || '-'}</td>
                    <td style={{ ...tdStyle, color: row['教育培训'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '教育培训' ? 600 : 400 }}>{row['教育培训'] || '-'}</td>
                    <td style={{ ...tdStyle, color: row['安全制度'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '安全制度' ? 600 : 400 }}>{row['安全制度'] || '-'}</td>
                    <td style={{ ...tdStyle, color: row['双重预防'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '双重预防' ? 600 : 400 }}>{row['双重预防'] || '-'}</td>
                    <td style={{ ...tdStyle, color: row['事故管理'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '事故管理' ? 600 : 400 }}>{row['事故管理'] || '-'}</td>
                    <td style={{ ...tdStyle, color: row['应急管理'] > 0 ? '#D97706' : '#9CA3AF', fontWeight: enterpriseSortKey === '应急管理' ? 600 : 400 }}>{row['应急管理'] || '-'}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#DC2626' }}>{row.总计}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
