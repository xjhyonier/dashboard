import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { stationChiefMock } from './mock/station-chief'

export function StationChiefDashboard() {
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
    },
    {
      key: 'area',
      label: '辖区',
      type: 'select' as const,
      options: [
        { label: '全部辖区', value: 'all' },
        { label: 'A社区', value: 'a' },
        { label: 'B社区', value: 'b' },
        { label: 'C社区', value: 'c' }
      ],
      value: 'all',
      onChange: (value: string) => console.log('Area:', value)
    }
  ]

  return (
    <>
      <RoleIndicator
        title="应消站站长看板"
        description="作为应急消防管理站站长，您需要关注辖区整体安全状况和专家团队的工作成效。不仅要看隐患整改结果，还要看专家过程管理的实际成果。"
        goals={[
          '确保辖区重点隐患得到有效处理',
          '监督专家团队工作质量和效率',
          '推动隐患从发现到整改的全闭环',
          '提升辖区整体安全水平'
        ]}
        keyMetrics={[
          '重点隐患数量',
          '隐患整改率',
          '专家任务完成率',
          '重大隐患跟进率',
          '企业覆盖率',
          '火灾事故数'
        ]}
      />

      <PageShell>
        <PageHeader
          title="应消站站长工作台"
          subtitle="辖区安全监管与专家管理"
          updateTime="2024-03-30 18:00"
        />

        <FilterBar filters={filters} />

        {/* 核心结果指标 */}
        <SectionBlock title="核心结果指标">
          <GridLayout columns={4}>
            {stationChiefMock.coreResults.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 隐患治理趋势 */}
        <div className="grid grid-cols-2 gap-grid">
          <TrendCard
            title="隐患数量趋势"
            currentValue={stationChiefMock.coreResults[0].value}
            data={stationChiefMock.hazardTrend}
            trend={{ value: -12.5, type: 'down' }}
          />
          <DistributionCard
            title="隐患等级分布"
            data={stationChiefMock.hazardDistribution}
            total={100}
          />
        </div>

        {/* 专家过程管理 */}
        <SectionBlock title="专家过程管理">
          <GridLayout columns={4}>
            {stationChiefMock.expertManagement.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 专家工作量排名 */}
        <div className="grid grid-cols-2 gap-grid">
          <RankingCard
            title="专家工作量 TOP 10"
            data={stationChiefMock.expertRanking}
            maxItems={10}
          />
          <StatusCard
            title="专家任务状态"
            items={stationChiefMock.expertTaskStatus}
          />
        </div>

        {/* 重点隐患跟进情况 */}
        <SectionBlock title="重点隐患跟进情况">
          <TableCard
            title="重大隐患清单"
            columns={stationChiefMock.majorHazardColumns}
            data={stationChiefMock.majorHazards}
            maxRows={8}
          />
        </SectionBlock>

        {/* 辖区安全状况 */}
        <div className="grid grid-cols-2 gap-grid">
          <DistributionCard
            title="企业风险等级分布"
            data={stationChiefMock.enterpriseRiskDistribution}
            total={100}
          />
          <StatusCard
            title="辖区安全状态"
            items={stationChiefMock.districtSafetyStatus}
          />
        </div>
      </PageShell>
    </>
  )
}
