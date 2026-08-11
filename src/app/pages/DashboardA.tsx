import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, TableCard, StatusCard } from '../../components/widgets'
import { dashboardAMock } from '../../mock/dashboardA'

export function DashboardA() {
  const filters = [
    {
      key: 'time',
      label: '时间范围',
      type: 'tabs' as const,
      options: [
        { label: '今日', value: 'today' },
        { label: '本周', value: 'week' },
        { label: '本月', value: 'month' }
      ],
      value: 'month',
      onChange: (value: string) => console.log('Time filter:', value)
    },
    {
      key: 'region',
      label: '地区',
      type: 'select' as const,
      options: [
        { label: '全部', value: 'all' },
        { label: '华东', value: 'east' },
        { label: '华南', value: 'south' },
        { label: '华北', value: 'north' }
      ],
      value: 'all',
      onChange: (value: string) => console.log('Region filter:', value)
    }
  ]

  return (
    <PageShell>
      <PageHeader
        title="企业客户概览"
        subtitle="实时监控企业客户数量、分布与活跃度"
        updateTime="2024-03-15 18:30"
      />

      <FilterBar filters={filters} />

      {/* KPI 指标区 */}
      <SectionBlock title="核心指标">
        <GridLayout columns={4}>
          {dashboardAMock.kpiMetrics.map((metric, index) => (
            <KpiCard key={index} {...metric} />
          ))}
        </GridLayout>
      </SectionBlock>

      {/* 趋势与分布 */}
      <SectionBlock>
        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="客户增长趋势"
            currentValue={dashboardAMock.kpiMetrics[0].value}
            data={dashboardAMock.monthlyTrend}
            trend={{ value: 8.5, type: 'up' }}
          />
          <DistributionCard
            title="客户行业分布"
            data={dashboardAMock.industryDistribution}
            total={100}
          />
        </div>
      </SectionBlock>

      {/* 排名与状态 */}
      <div className="grid grid-cols-2 gap-grid">
        <RankingCard
          title="客户规模排名 TOP 5"
          data={dashboardAMock.topCustomers}
          maxItems={5}
        />
        <StatusCard
          title="服务状态"
          items={dashboardAMock.serviceStatus}
        />
      </div>

      {/* 订单明细 */}
      <SectionBlock title="最近订单">
        <TableCard
          title="订单明细"
          columns={dashboardAMock.recentOrders.columns}
          data={dashboardAMock.recentOrders.data}
          maxRows={5}
        />
      </SectionBlock>
    </PageShell>
  )
}
