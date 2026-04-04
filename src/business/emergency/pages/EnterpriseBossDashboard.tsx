import { PageShell, PageHeader, SectionBlock, GridLayout } from '../../../components/layout'
import { KpiCard, DistributionCard, StatusCard, TableCard } from '../../../components/widgets'
import { RoleIndicator } from '../../../components/common'
import { enterpriseBossMock } from './mock/enterprise-boss'

export function EnterpriseBossDashboard() {
  return (
    <>
      <RoleIndicator
        title="企业老板看板"
        description="作为企业负责人，您需要关注企业的安全风险状况和安全员的工作履职情况。看板帮助您快速判断：企业有没有真风险、安全员有没有在干活、别让我背锅。"
        goals={[
          '了解企业当前风险状况',
          '监督安全员工作履职',
          '确保安全生产责任落实',
          '避免安全事故和法律责任'
        ]}
        keyMetrics={[
          '企业风险等级',
          '重大隐患数',
          '安全员履职率',
          '整改完成率',
          '员工培训率',
          '责任暴露风险'
        ]}
      />

      <PageShell>
        <PageHeader
          title="企业安全概览"
          subtitle="本企业安全状况与责任落实"
          updateTime="2024-03-30 18:00"
        />

        {/* 企业风险总览 */}
        <SectionBlock title="企业风险总览">
          <GridLayout columns={4}>
            {enterpriseBossMock.riskOverview.map((metric, index) => (
              <KpiCard key={index} {...metric} />
            ))}
          </GridLayout>
        </SectionBlock>

        {/* 风险提示 */}
        <SectionBlock 
          title="风险提示"
          description="重点关注可能带来法律责任的隐患"
        >
          <div className="card bg-red-50 border-red-200 p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  责任暴露提示
                </h3>
                <p className="text-red-600 mb-4">
                  当前有 <span className="font-bold text-xl">2项</span> 重大隐患逾期未整改，
                  若发生事故，责任链已暴露到经营主体。
                </p>
                <div className="space-y-2">
                  {enterpriseBossMock.responsibilityWarnings.map((warning, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-red-200">
                      <div className="font-medium text-red-700">{warning.title}</div>
                      <div className="text-sm text-red-500">{warning.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionBlock>

        {/* 安全员履职情况 */}
        <SectionBlock title="安全员履职情况">
          <div className="grid grid-cols-2 gap-grid">
            <StatusCard
              title="安全员工作状态"
              items={enterpriseBossMock.safetyOfficerStatus}
            />
            <DistributionCard
              title="本月任务完成分布"
              data={enterpriseBossMock.taskCompletionDistribution}
              total={100}
            />
          </div>
        </SectionBlock>

        {/* 隐患整改进展 */}
        <SectionBlock title="隐患整改进展">
          <TableCard
            title="待处理隐患"
            columns={enterpriseBossMock.hazardColumns}
            data={enterpriseBossMock.pendingHazards}
            maxRows={8}
          />
        </SectionBlock>

        {/* 安全管理概览 */}
        <div className="grid grid-cols-2 gap-grid">
          <StatusCard
            title="安全管理状态"
            items={enterpriseBossMock.safetyManagementStatus}
          />
          <DistributionCard
            title="员工培训完成率"
            data={enterpriseBossMock.trainingCompletion}
            total={100}
          />
        </div>
      </PageShell>
    </>
  )
}
