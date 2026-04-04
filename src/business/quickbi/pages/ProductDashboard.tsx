import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common/RoleIndicator'
import { productMock } from './mock/product'

export function ProductDashboard() {
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
      value: 'week',
      onChange: (value: string) => console.log('Time:', value)
    }
  ]

  return (
    <>
      <RoleIndicator
        title="产品经理看板"
        description="作为产品负责人，你需要关注产品使用情况、用户行为数据，持续优化产品功能和用户体验。"
        goals={[
          '监控产品使用情况和用户行为',
          '分析功能使用率和用户留存',
          '识别产品痛点和优化机会',
          '提升用户满意度和产品价值'
        ]}
        keyMetrics={[
          '日活跃用户',
          '功能使用率',
          '用户留存率',
          '产品反馈'
        ]}
      />

      <PageShell>
        <PageHeader
          title="产品数据看板"
          subtitle="产品使用情况与用户行为分析"
          updateTime="2024-03-30 18:00"
        />

        <FilterBar filters={filters} />

        <SectionBlock title="核心产品指标">
          <GridLayout columns={4}>
            {productMock.coreMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="用户增长趋势"
            currentValue={productMock.coreMetrics[0].value}
            data={productMock.userTrend}
            trend={{ value: 15.2, type: 'up' }}
          />
          <DistributionCard
            title="功能使用分布"
            data={productMock.featureDistribution}
            total={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-grid">
          <RankingCard
            title="热门功能 TOP 5"
            data={productMock.topFeatures}
            maxItems={5}
          />
          <StatusCard
            title="产品健康度"
            items={productMock.healthStatus}
          />
        </div>
      </PageShell>
    </>
  )
}
