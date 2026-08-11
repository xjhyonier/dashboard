import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common/RoleIndicator'
import { salesMock } from './mock/sales'

export function SalesDashboard() {
  const filters = [
    {
      key: 'region',
      label: '地区',
      type: 'select' as const,
      options: [
        { label: '全国', value: 'all' },
        { label: '华东', value: 'east' },
        { label: '华南', value: 'south' },
        { label: '华北', value: 'north' }
      ],
      value: 'all',
      onChange: (value: string) => console.log('Region:', value)
    }
  ]

  return (
    <>
      <RoleIndicator
        title="销售总监看板"
        description="作为销售负责人，你需要关注销售业绩、客户关系管理，完成销售目标并拓展市场份额。"
        goals={[
          '完成月度/季度销售目标',
          '管理销售团队绩效',
          '维护重要客户关系',
          '拓展新客户和新市场'
        ]}
        keyMetrics={[
          '销售额',
          '订单数量',
          '客户转化率',
          '回款率'
        ]}
      />

      <PageShell>
        <PageHeader
          title="销售业绩看板"
          subtitle="实时监控销售数据与客户状态"
          updateTime="2024-03-30 18:00"
        />

        <FilterBar filters={filters} />

        <SectionBlock title="销售核心指标">
          <GridLayout columns={4}>
            {salesMock.coreMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="销售趋势"
            currentValue={salesMock.coreMetrics[0].value}
            data={salesMock.salesTrend}
            trend={{ value: 18.5, type: 'up' }}
          />
          <DistributionCard
            title="客户行业分布"
            data={salesMock.industryDistribution}
            total={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-grid">
          <RankingCard
            title="TOP 5 销售员"
            data={salesMock.topSalespeople}
            maxItems={5}
          />
          <StatusCard
            title="客户状态"
            items={salesMock.customerStatus}
          />
        </div>

        <SectionBlock title="最近订单">
          <TableCard
            title="订单明细"
            columns={salesMock.orderColumns}
            data={salesMock.recentOrders}
            maxRows={5}
          />
        </SectionBlock>
      </PageShell>
    </>
  )
}
