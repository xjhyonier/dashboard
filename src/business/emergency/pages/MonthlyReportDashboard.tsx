import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { monthlyReportMock } from './mock/monthly-report'

export function MonthlyReportDashboard() {
  const filters = [
    {
      key: 'month',
      label: '报告月份',
      type: 'select' as const,
      options: [
        { label: '2024年3月', value: '2024-03' },
        { label: '2024年2月', value: '2024-02' },
        { label: '2024年1月', value: '2024-01' }
      ],
      value: '2024-03',
      onChange: (value: string) => console.log('Month:', value)
    }
  ]

  return (
    <>
      <RoleIndicator
        title="月度运营报告"
        description={'展示"一起安"在良渚街道的使用情况和成效，包括企业底数、风险分布、检查覆盖率、隐患发现与整改等核心指标，为决策提供数据支撑。'}
        goals={[
          '全面掌握系统使用情况',
          '评估安全检查覆盖效果',
          '分析隐患治理成效',
          '为下月工作提供决策依据'
        ]}
        keyMetrics={[
          '企业总数与风险分布',
          '检查覆盖率',
          '隐患发现率',
          '整改完成率',
          '环比变化趋势'
        ]}
      />

      <PageShell>
        <PageHeader
          title={'良渚街道"一起安"月度运营报告'}
          subtitle="2024年3月运营数据分析"
          updateTime="2024-03-30 18:00"
        />

        <FilterBar filters={filters} />

        {/* 一、企业（场所）底数情况 */}
        <SectionBlock 
          title="一、企业（场所）底数情况"
          description="辖区内企业（场所）的数量及风险分布"
        >
          <GridLayout columns={4}>
            {monthlyReportMock.enterpriseOverview.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>

          <div className="grid grid-cols-2 gap-grid mt-6">
            <DistributionCard
              title="企业风险等级分布"
              data={monthlyReportMock.enterpriseRiskDistribution}
              total={monthlyReportMock.totalEnterprises}
            />
            <DistributionCard
              title="场所类型分布"
              data={monthlyReportMock.venueTypeDistribution}
              total={monthlyReportMock.totalVenues}
            />
          </div>

          {/* 按风险等级详细统计 */}
          <div className="mt-6">
            <TableCard
              title="按企业风险等级详细统计"
              columns={monthlyReportMock.riskLevelColumns}
              data={monthlyReportMock.riskLevelData}
              maxRows={6}
            />
          </div>

          {/* 按场所类型详细统计 */}
          <div className="mt-6">
            <TableCard
              title="按场所类型详细统计"
              columns={monthlyReportMock.venueTypeColumns}
              data={monthlyReportMock.venueTypeData}
              maxRows={5}
            />
          </div>
        </SectionBlock>

        {/* 二、安全检查开展情况 */}
        <SectionBlock 
          title="二、安全检查开展情况"
          description="本月安全检查覆盖率及检查频次统计"
        >
          <GridLayout columns={4}>
            {monthlyReportMock.inspectionOverview.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>

          <div className="grid grid-cols-2 gap-grid mt-6">
            <TrendCard
              title="检查企业数趋势"
              currentValue={monthlyReportMock.inspectionOverview[0].value}
              data={monthlyReportMock.inspectionTrend}
              trend={{ value: 15.8, type: 'up' }}
            />
            <TrendCard
              title="检查次数趋势"
              currentValue={monthlyReportMock.inspectionOverview[2].value}
              data={monthlyReportMock.inspectionCountTrend}
              trend={{ value: 18.2, type: 'up' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-grid mt-6">
            <TableCard
              title="按企业风险等级统计"
              columns={monthlyReportMock.riskLevelColumns}
              data={monthlyReportMock.riskLevelData}
              maxRows={6}
            />
            <TableCard
              title="按场所类型统计"
              columns={monthlyReportMock.venueTypeColumns}
              data={monthlyReportMock.venueTypeData}
              maxRows={5}
            />
          </div>
        </SectionBlock>

        {/* 三、隐患发现与整改情况 */}
        <SectionBlock 
          title="三、隐患发现与整改情况"
          description="本月隐患发现数量、等级分布及整改进展"
        >
          <GridLayout columns={4}>
            {monthlyReportMock.hazardOverview.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>

          <div className="grid grid-cols-2 gap-grid mt-6">
            <DistributionCard
              title="隐患等级分布"
              data={monthlyReportMock.hazardDistribution}
              total={100}
            />
            <StatusCard
              title="隐患整改状态"
              items={monthlyReportMock.hazardStatus}
            />
          </div>
        </SectionBlock>

        {/* 四、工作建议 */}
        <SectionBlock 
          title="四、工作建议"
          description="基于以上数据分析，提出以下工作建议"
        >
          <div className="grid grid-cols-2 gap-grid">
            {monthlyReportMock.workSuggestions.map((suggestion, index) => (
              <div key={index} className="card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-text">{suggestion.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    suggestion.priority === '高' ? 'bg-red-100 text-red-700' :
                    suggestion.priority === '中' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{suggestion.description}</p>
                <div className="text-xs text-text-tertiary">
                  责任部门: {suggestion.department}
                </div>
              </div>
            ))}
          </div>
        </SectionBlock>
      </PageShell>
    </>
  )
}
