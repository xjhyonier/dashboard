import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { governmentLeaderMock } from './mock/government-leader'

export function GovernmentLeaderDashboard() {
  const filters = [
    {
      key: 'time',
      label: '时间范围',
      type: 'tabs' as const,
      options: [
        { label: '本月', value: 'month' },
        { label: '本季', value: 'quarter' },
        { label: '本年', value: 'year' }
      ],
      value: 'month',
      onChange: (value: string) => console.log('Time:', value)
    },
    {
      key: 'district',
      label: '辖区',
      type: 'select' as const,
      options: [
        { label: '全街道', value: 'all' },
        { label: 'A社区', value: 'a' },
        { label: 'B社区', value: 'b' }
      ],
      value: 'all',
      onChange: (value: string) => console.log('District:', value)
    }
  ]

  return (
    <>
      <RoleIndicator
        title="政府领导看板"
        description="作为街道书记/局长，您需要关注街道整体安全状况的实际效果。看板帮助您快速判断：有没有变安全、数据真不真、资源有没有打到重点上。"
        goals={[
          '掌握街道整体安全状况',
          '监控重大隐患和火灾事故',
          '判断安全治理真实成效',
          '支持资源调配决策'
        ]}
        keyMetrics={[
          '重点隐患数量',
          '火灾事故数',
          '隐患整改率',
          '企业覆盖率',
          '数据真实性',
          '风险变化趋势'
        ]}
      />

      <PageShell>
        <PageHeader
          title="街道安全概览"
          subtitle="整体安全状况与治理成效"
          updateTime="2024-03-30 18:00"
        />

        <FilterBar filters={filters} />

        {/* 红线监测 */}
        <SectionBlock 
          title="红线监测"
          description="重大风险与闭环状态"
        >
          <GridLayout columns={4}>
            {governmentLeaderMock.redLineMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 工作活跃度 */}
        <SectionBlock 
          title="工作活跃度"
          description="信息采集与企业自查进展"
        >
          <GridLayout columns={4}>
            {governmentLeaderMock.activityMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 行政监管支撑 */}
        <SectionBlock 
          title="行政监管支撑"
          description="组织覆盖与监管规模"
        >
          <GridLayout columns={4}>
            {governmentLeaderMock.adminMetrics.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 趋势判断 */}
        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="监管企业趋势"
            currentValue={governmentLeaderMock.redLineMetrics[0].value}
            data={governmentLeaderMock.enterpriseTrend}
            trend={{ value: 12.5, type: 'up' }}
          />
          <DistributionCard
            title="企业风险分布"
            data={governmentLeaderMock.enterpriseRiskDistribution}
            total={100}
          />
        </div>
      </PageShell>
    </>
  )
}
