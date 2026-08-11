import { useState } from 'react'
import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard } from '../../../components/widgets'
import { ServiceTimeline } from '../components/ServiceTimeline'
import expertMock from '../mock'
import { getServiceRecordTypeLabel, formatDateTime } from '../utils/helpers'

export function ExpertLedger() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [enterpriseFilter, setEnterpriseFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const { serviceRecords, enterprises } = expertMock

  let filtered = [...serviceRecords]
  if (typeFilter !== 'all') filtered = filtered.filter(r => r.type === typeFilter)
  if (enterpriseFilter !== 'all') filtered = filtered.filter(r => r.enterpriseId === enterpriseFilter)

  // 按日期分组
  const grouped = filtered.reduce<Record<string, typeof serviceRecords>>((acc, r) => {
    const date = r.createdAt.split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort().reverse()

  // 统计
  const thisMonthRecords = serviceRecords.filter(r => r.createdAt.startsWith('2026-04')).length
  const uniqueEnterprises = new Set(serviceRecords.map(r => r.enterpriseId)).size
  const completeness = Math.round((uniqueEnterprises / enterprises.length) * 100)

  return (
    <PageShell maxWidth="wide">
      <PageHeader title="我的台账" subtitle="服务记录全局视图" />

      <FilterBar filters={[
        {
          key: 'enterprise', label: '企业', type: 'select', value: enterpriseFilter,
          options: [
            { label: '全部', value: 'all' },
            ...enterprises.map(e => ({ label: e.name, value: e.id })),
          ],
          onChange: setEnterpriseFilter,
        },
        {
          key: 'type', label: '类型', type: 'tabs', value: typeFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: '微信沟通', value: 'wechat' },
            { label: '电话确认', value: 'phone' },
            { label: '现场交谈', value: 'onsite' },
            { label: '其他', value: 'other' },
          ],
          onChange: setTypeFilter,
        },
        {
          key: 'date', label: '日期', type: 'tabs', value: dateFilter,
          options: [
            { label: '全部', value: 'all' },
            { label: '今日', value: 'today' },
            { label: '本周', value: 'week' },
            { label: '本月', value: 'month' },
          ],
          onChange: setDateFilter,
        },
      ]} />

      {/* 统计概览 */}
      <SectionBlock>
        <GridLayout columns={3}>
          <KpiCard title="本月记录" value={thisMonthRecords} unit="条" description="本月所有服务记录" />
          <KpiCard title="覆盖企业" value={uniqueEnterprises} unit="家" description="有记录的企业数" />
          <KpiCard title="台账完整度" value={completeness} unit="%" description={completeness >= 80 ? '台账完整' : '需补齐'} />
        </GridLayout>
      </SectionBlock>

      {/* 按日期分组的时间线 */}
      <SectionBlock>
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium text-text-secondary">{date}</div>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-tertiary">{grouped[date].length} 条记录</span>
              </div>
              <ServiceTimeline
                records={grouped[date].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                showEnterprise
              />
            </div>
          ))}

          {sortedDates.length === 0 && (
            <div className="text-center py-12 text-sm text-text-tertiary">暂无匹配的服务记录</div>
          )}
        </div>
      </SectionBlock>

      {/* 导出按钮 */}
      <div className="flex justify-end mt-4">
        <button onClick={() => alert('Demo: 导出台账功能')} className="px-5 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
          导出台账
        </button>
      </div>
    </PageShell>
  )
}
