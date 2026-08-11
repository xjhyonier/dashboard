import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common/RoleIndicator'
import { ceoMock } from './mock/ceo'

export function CEODashboard() {
  const filters = [
    {
      key: 'time',
      label: '时间范围',
      type: 'tabs' as const,
      options: [
        { label: '今日', value: 'today' },
        { label: '本周', value: 'week' },
        { label: '本月', value: 'month' },
        { label: '本季', value: 'quarter' }
      ],
      value: 'month',
      onChange: (value: string) => console.log('Time:', value)
    }
  ]

  return (
    <>
      {/* 角色说明浮层 */}
      <RoleIndicator
        title="CEO 看板"
        description="作为首席执行官，您需要关注企业整体运营状况，把握战略方向。此看板帮助您快速了解公司核心业务指标，识别风险和机会。"
        goals={[
          '掌握公司整体业务健康度',
          '监控关键业务指标趋势',
          '识别业务风险和机会',
          '支持战略决策制定'
        ]}
        keyMetrics={[
          '总营收',
          '客户增长',
          '市场份额',
          '运营效率'
        ]}
      />

      <PageShell>
        <PageHeader
          title="CEO 战略看板"
          subtitle="企业整体运营状况概览"
          updateTime="2024-03-30 16:00"
        />

        <FilterBar filters={filters} />

        {/* 核心业务指标 */}
        <SectionBlock title="核心业务指标">
          <GridLayout columns={4}>
            {ceoMock.coreMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 业务趋势与分布 */}
        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="营收增长趋势"
            currentValue={ceoMock.coreMetrics[0].value}
            data={ceoMock.revenueTrend}
            trend={{ value: 18.5, type: 'up' }}
          />
          <DistributionCard
            title="业务线收入分布"
            data={ceoMock.businessDistribution}
            total={100}
          />
        </div>

        {/* 风险监控与团队表现 */}
        <div className="grid grid-cols-2 gap-grid">
          <RankingCard
            title="TOP 5 业务单元"
            data={ceoMock.topBusinessUnits}
            maxItems={5}
          />
          <StatusCard
            title="风险监控"
            items={ceoMock.riskStatus}
          />
        </div>
      </PageShell>
    </>
  )
}
