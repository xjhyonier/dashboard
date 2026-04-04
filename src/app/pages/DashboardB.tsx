import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../components/layout'
import { KpiCard, TrendCard, RankingCard, StatusCard } from '../../components/widgets'
import { dashboardBMock } from '../../mock/dashboardB'

export function DashboardB() {
  const filters = [
    {
      key: 'category',
      label: '商品类别',
      type: 'tabs' as const,
      options: [
        { label: '全部', value: 'all' },
        { label: '手机', value: 'phone' },
        { label: '电脑', value: 'computer' },
        { label: '配件', value: 'accessory' }
      ],
      value: 'all',
      onChange: (value: string) => console.log('Category filter:', value)
    }
  ]

  return (
    <PageShell>
      <PageHeader
        title="销售业绩看板"
        subtitle="实时监控销售数据与订单状态"
        updateTime="2024-03-15 18:30"
      />

      <FilterBar filters={filters} />

      {/* KPI 指标区 */}
      <SectionBlock title="销售指标">
        <GridLayout columns={4}>
          {dashboardBMock.kpiMetrics.map((metric, index) => (
            <KpiCard key={index} {...metric} />
          ))}
        </GridLayout>
      </SectionBlock>

      {/* 销售趋势 */}
      <SectionBlock title="销售趋势">
        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="月度销售趋势"
            currentValue={dashboardBMock.kpiMetrics[0].value}
            data={dashboardBMock.weeklyTrend}
            trend={{ value: 15.2, type: 'up' }}
          />
          <RankingCard
            title="热销产品 TOP 5"
            data={dashboardBMock.topProducts}
            maxItems={5}
          />
        </div>
      </SectionBlock>

      {/* 订单状态 */}
      <SectionBlock title="订单状态">
        <StatusCard
          title="订单处理状态"
          items={dashboardBMock.orderStatus}
        />
      </SectionBlock>
    </PageShell>
  )
}
