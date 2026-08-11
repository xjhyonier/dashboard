// 维度四：辖区安全形势 - 各子模块组件

import { SectionBlock } from '../../../components/layout/SectionBlock'

// （一）整体形势
export function SafetySituationOverview() {
  return (
    <SectionBlock
      title="（一）整体形势"
      description="辖区安全生产、消防安全整体态势评估"
      className="mb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 整体评价 */}
        <div className="lg:col-span-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h4 className="text-sm font-semibold text-emerald-800 mb-2">📊 总体评价</h4>
          <p className="text-sm text-emerald-700 leading-relaxed">
            辖区安全生产、消防安全整体<span className="font-bold">平稳可控</span>，但受重点时段、季节交替、企业赶工等影响，
            风险呈<span className="font-bold text-amber-700">阶段性上升态势</span>，小微企业、出租房、物流片区仍为薄弱环节。
          </p>
        </div>
        
        {/* 关键指标 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded">
            <span className="text-xs text-zinc-600">事故起数同比</span>
            <span className="text-sm font-bold text-emerald-600">↓ 12.5%</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded">
            <span className="text-xs text-zinc-600">伤亡人数同比</span>
            <span className="text-sm font-bold text-emerald-600">↓ 8.3%</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded">
            <span className="text-xs text-zinc-600">隐患发现同比</span>
            <span className="text-sm font-bold text-amber-600">↑ 15.2%</span>
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}

// （二）主要风险特征
export function RiskCharacteristics() {
  const risks = [
    { 
      num: '1', 
      title: '人员密集场所消防隐患高发', 
      desc: '九小场所、出租房、沿街店铺存在通道堵塞、违规用电等隐患',
      level: 'high',
      icon: '🔥'
    },
    { 
      num: '2', 
      title: '高危作业环节风险突出', 
      desc: '动火作业、有限空间、外包施工等高危环节管控压力大',
      level: 'high',
      icon: '⚠️'
    },
    { 
      num: '3', 
      title: '一般/低风险企业管理易松懈', 
      desc: '部分企业认为风险低而放松安全管理，存在麻痹思想',
      level: 'medium',
      icon: '⚡'
    },
    { 
      num: '4', 
      title: 'C类企业与平台使用差企业叠加', 
      desc: 'C类不合格企业与平台使用差企业风险叠加，需重点监管',
      level: 'high',
      icon: '🔴'
    },
    { 
      num: '5', 
      title: '季节性风险与末端管控压力', 
      desc: '汛期、高温期、冬季防火期等季节性风险与基层管控压力',
      level: 'medium',
      icon: '🌡️'
    },
  ]

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700'
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700'
      default: return 'bg-blue-50 border-blue-200 text-blue-700'
    }
  }

  return (
    <SectionBlock
      title="（二）主要风险特征"
      description="辖区当前面临的五大主要安全风险特征分析"
      className="mb-6"
    >
      <div className="space-y-3">
        {risks.map((risk, index) => (
          <div key={index} className={`p-3 border rounded-lg ${getLevelColor(risk.level)}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-lg">
                {risk.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{risk.num}.</span>
                  <span className="font-medium">{risk.title}</span>
                  {risk.level === 'high' && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">高风险</span>
                  )}
                </div>
                <p className="text-xs opacity-80 mt-1">{risk.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}

// （三）片区风险热力与趋势研判
export function DistrictRiskHeatmap() {
  const districts = [
    { name: '良渚片区', risk: 'medium', hazards: 423, major: 5, trend: 'stable', desc: '隐患分布平稳，整体可控' },
    { name: '勾庄片区', risk: 'high', hazards: 587, major: 8, trend: 'up', desc: '小微园区隐患高发，需重点关注' },
    { name: '物流片区', risk: 'high', hazards: 654, major: 5, trend: 'up', desc: '物流仓储集中，火灾风险较高' },
  ]

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-amber-500'
      default: return 'bg-emerald-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  return (
    <SectionBlock
      title="（三）片区风险热力与趋势研判"
      description="良渚、勾庄、物流三片区隐患分布与趋势分析"
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {districts.map((district, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-zinc-800">{district.name}</span>
              <div className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${getRiskColor(district.risk)}`}></span>
                <span className="text-lg">{getTrendIcon(district.trend)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 bg-zinc-50 rounded">
                <div className="text-lg font-bold text-zinc-800">{district.hazards}</div>
                <div className="text-xs text-zinc-500">隐患数</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <div className="text-lg font-bold text-red-600">{district.major}</div>
                <div className="text-xs text-zinc-500">重大隐患</div>
              </div>
            </div>
            <p className="text-xs text-zinc-600">{district.desc}</p>
          </div>
        ))}
      </div>
      
      {/* 趋势图表占位 */}
      <div className="mt-4 p-4 bg-zinc-50 rounded-lg">
        <h4 className="text-sm font-semibold text-zinc-700 mb-3">📈 月度隐患数、重大隐患数、执法量趋势</h4>
        <div className="h-32 flex items-end justify-around gap-2">
          {['1月', '2月', '3月', '4月'].map((month, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full flex gap-1 justify-center items-end" style={{ height: '80px' }}>
                <div className="w-3 bg-blue-400 rounded-t" style={{ height: `${60 + i * 10}px` }}></div>
                <div className="w-3 bg-red-400 rounded-t" style={{ height: `${20 + i * 5}px` }}></div>
                <div className="w-3 bg-emerald-400 rounded-t" style={{ height: `${40 + i * 8}px` }}></div>
              </div>
              <span className="text-xs text-zinc-500">{month}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded"></span>隐患数</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded"></span>重大隐患</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded"></span>执法量</span>
        </div>
      </div>
    </SectionBlock>
  )
}

// （四）已开展工作
export function CompletedWorkStats() {
  const works = [
    { type: '节假日专项检查', count: '1200余家次', icon: '🎉' },
    { type: '联合巡查', count: '360余次', icon: '🤝' },
    { type: '整改隐患', count: '2100余条', icon: '✅' },
    { type: '汛期巡查排查', count: '450余处', icon: '🌧️' },
    { type: '整改风险点', count: '63处', icon: '🎯' },
    { type: '高温防火期整改', count: '1800余条', icon: '🔥' },
  ]

  return (
    <SectionBlock
      title="（四）已开展工作"
      description="近期完成的重点工作任务统计"
      className="mb-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {works.map((work, index) => (
          <div key={index} className="bg-indigo-50 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">{work.icon}</div>
            <div className="text-lg font-bold text-indigo-700">{work.count}</div>
            <div className="text-xs text-indigo-600 mt-1">{work.type}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600">
        <span className="font-medium">工作小结：</span>
        一般/低风险抽查、指导服务、重大风险点位巡查研判落实到位，各项重点工作有序推进。
      </div>
    </SectionBlock>
  )
}

// （五）下一步工作措施
export function NextStepsPlan() {
  const steps = [
    { 
      num: '1', 
      title: '严格执行年度检查计划', 
      desc: '重大风险3个月一查、较大风险6个月一查、一般/低风险每月抽查≥10%',
      icon: '📅'
    },
    { 
      num: '2', 
      title: '强化履职督导', 
      desc: '压实企业安全组、消防组个人计划执行与实绩考核',
      icon: '👥'
    },
    { 
      num: '3', 
      title: '提升隐患闭环管理', 
      desc: '提升重大隐患发现率、整改率、闭环率',
      icon: '🔄'
    },
    { 
      num: '4', 
      title: '严管C类不合格企业', 
      desc: '运用ABC分类结果，对C类企业实施重点监管',
      icon: '🔴'
    },
    { 
      num: '5', 
      title: '提升平台使用率', 
      desc: '对后进企业靶向帮扶、执法倒逼，持续提升数字化应用水平',
      icon: '💻'
    },
    { 
      num: '6', 
      title: '发挥专家支撑作用', 
      desc: '精准管控风险，完善应急联动，坚决守住安全底线',
      icon: '👨‍💼'
    },
  ]

  return (
    <SectionBlock
      title="（五）下一步工作措施"
      description="下一阶段重点工作计划与措施"
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {steps.map((step, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-indigo-600 font-medium">{step.num}.</span>
                  <span className="font-medium text-zinc-800">{step.title}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}
