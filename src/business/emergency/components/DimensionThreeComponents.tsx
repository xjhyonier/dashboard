// 维度三：企业主体责任 - 各子模块组件

import { useState } from 'react'
import { SectionBlock } from '../../../components/layout/SectionBlock'

// （一）总体情况
export function EnterpriseResponsibilityOverview() {
  const stats = [
    { label: '责任制签订率', value: '100%', icon: '📋', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: '主要负责人履职率', value: '100%', icon: '👤', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    { label: '安全投入达标率', value: '96.5%', icon: '💰', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '教育培训覆盖率', value: '98.2%', icon: '📚', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: '风险管控落实率', value: '94.8%', icon: '🛡️', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { label: '隐患自查完成率', value: '91.3%', icon: '🔍', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  ]

  return (
    <SectionBlock
      title="（一）总体情况"
      description="企业安全生产主体责任落实总体概况"
      className="mb-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-4 text-center`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-zinc-600 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600">
        <span className="font-medium">总体评价：</span>
        企业安全生产责任制签订率、主要负责人履职率均达100%，安全投入、教育培训、风险管控、隐患自查、应急管理整体有序。
      </div>
    </SectionBlock>
  )
}

// （二）ABC分类管理
export function ABCClassificationTable() {
  const data = [
    { class: 'A类（优秀）', count: 186, percent: '37.2%', desc: '隐患少、整改快、台账规范、平台使用主动、自查到位', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { class: 'B类（合格）', count: 264, percent: '52.8%', desc: '主体责任基本落实，隐患可控，平台使用正常', color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { class: 'C类（不合格）', count: 50, percent: '10.0%', desc: '隐患多发、整改滞后、屡改屡犯、平台应用差，列为重点监管', color: 'bg-red-50 border-red-200 text-red-700' },
  ]

  return (
    <SectionBlock
      title="（二）企业ABC分类管理"
      description="按企业安全管理水平分为A（优秀）、B（合格）、C（不合格）三类"
      className="mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div key={index} className={`${item.color} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-lg">{item.class}</span>
              <span className="text-2xl font-bold">{item.count}<span className="text-sm font-normal ml-1">家</span></span>
            </div>
            <div className="text-sm opacity-80 mb-2">占比 {item.percent}</div>
            <div className="text-xs leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}

// （三）平台使用情况分析
export function PlatformUsageAnalysis() {
  const goodUsage = [
    { name: '良渚木业有限公司', score: 98, status: '优秀' },
    { name: '勾庄物流仓储中心', score: 95, status: '优秀' },
    { name: '良渚机械制造厂', score: 92, status: '良好' },
    { name: '勾庄化工原料公司', score: 89, status: '良好' },
  ]

  const poorUsage = [
    { name: '某小型加工作坊', score: 23, status: '差', issue: '长期不登录' },
    { name: '某出租房集群', score: 31, status: '差', issue: '零上报' },
    { name: '某沿街店铺', score: 38, status: '差', issue: '不上报' },
    { name: '某小微园区', score: 45, status: '较差', issue: '安全管理薄弱' },
  ]

  return (
    <SectionBlock
      title="（三）平台使用情况分析"
      description="企业数字化平台使用情况及整治措施"
      className="mb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 使用较好 */}
        <div>
          <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            使用较好企业
          </h4>
          <div className="space-y-2">
            {goodUsage.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium text-zinc-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 font-medium">{item.status}</span>
                  <span className="text-sm font-bold text-emerald-700">{item.score}分</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 使用较差 */}
        <div>
          <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            使用较差企业（需整治）
          </h4>
          <div className="space-y-2">
            {poorUsage.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-zinc-700">{item.name}</span>
                  <span className="text-xs text-zinc-500 ml-2">{item.issue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">{item.status}</span>
                  <span className="text-sm font-bold text-red-700">{item.score}分</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 整治措施 */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <h4 className="text-sm font-semibold text-amber-800 mb-2">🎯 整治措施</h4>
        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
          <li>开展集中培训：已组织3场，覆盖120家企业</li>
          <li>上门指导帮扶：已对C类企业全部完成上门指导</li>
          <li>执法倒逼：对拒不使用平台的12家企业已立案查处</li>
        </ul>
      </div>
    </SectionBlock>
  )
}

// （四）风险分级管控（四色管理）
export function RiskLevelControl() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  const riskLevels = [
    { level: '重大风险', key: '重大', color: 'bg-red-500', borderColor: 'border-red-500', count: 15, percent: '3.0%', desc: '红色预警，重点盯防' },
    { level: '较大风险', key: '较大', color: 'bg-orange-500', borderColor: 'border-orange-500', count: 48, percent: '9.6%', desc: '橙色预警，定期巡查' },
    { level: '一般风险', key: '一般', color: 'bg-amber-400', borderColor: 'border-amber-400', count: 142, percent: '28.4%', desc: '黄色提示，常规管理' },
    { level: '低风险', key: '低', color: 'bg-blue-400', borderColor: 'border-blue-400', count: 295, percent: '59.0%', desc: '蓝色正常，抽查监督' },
  ]

  const handleCardClick = (key: string) => {
    setSelectedLevel(selectedLevel === key ? null : key)
  }

  return (
    <SectionBlock
      title="（四）风险分级管控（四色管理）"
      description="点击四色卡片筛选风险点，红（重大）、橙（较大）、黄（一般）、蓝（低）风险点辨识1247处，措施、责任人、频次全部落实"
      className="mb-6"
    >
      {/* 四色卡片 - 可点击筛选 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {riskLevels.map((risk) => {
          const isSelected = selectedLevel === risk.key
          return (
            <button
              key={risk.key}
              onClick={() => handleCardClick(risk.key)}
              className={`
                bg-white rounded-lg p-4 text-center transition-all
                ${isSelected 
                  ? `ring-2 ${risk.borderColor} shadow-lg scale-105` 
                  : 'border border-zinc-200 hover:shadow-md hover:scale-102'
                }
              `}
            >
              <div className={`w-12 h-12 ${risk.color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold shadow-sm`}>
                {risk.level.charAt(0)}
              </div>
              <div className="text-lg font-bold text-zinc-800">{risk.count}<span className="text-sm font-normal text-zinc-500 ml-1">家</span></div>
              <div className="text-xs text-zinc-500">{risk.percent}</div>
              <div className="text-xs font-medium text-zinc-700 mt-1">{risk.level}</div>
              <div className="text-xs text-zinc-400 mt-0.5">{risk.desc}</div>
              {isSelected && (
                <div className="mt-2 text-xs font-medium text-zinc-600 bg-zinc-100 rounded-full px-2 py-0.5 inline-block">
                  已筛选 ✓
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 统计概览 */}
      <div className="p-3 bg-zinc-50 rounded-lg mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">风险点辨识总数：<span className="font-bold text-zinc-800">1,247处</span></span>
          <span className="text-zinc-600">管控措施落实率：<span className="font-bold text-emerald-600">100%</span></span>
          <span className="text-zinc-600">责任人明确率：<span className="font-bold text-emerald-600">100%</span></span>
          <span className="text-zinc-600">检查频次达标率：<span className="font-bold text-emerald-600">98.5%</span></span>
        </div>
      </div>

      {/* 风险点列表 - 带筛选 */}
      <RiskPointList selectedLevel={selectedLevel} />
    </SectionBlock>
  )
}

// 风险点列表组件
function RiskPointList({ selectedLevel }: { selectedLevel: string | null }) {
  const riskPoints = [
    { id: 'FX-001', name: '危化品储存区', enterprise: '良渚化工原料公司', level: '重大', category: '危化品', color: 'bg-red-500', person: '张伟', frequency: '每日', lastCheck: '2026-04-09', measure: '双人双锁、24小时监控、weekly巡检', status: '受控' },
    { id: 'FX-002', name: '喷涂作业区', enterprise: '良渚木业有限公司', level: '重大', category: '消防', color: 'bg-red-500', person: '李明', frequency: '每日', lastCheck: '2026-04-08', measure: '防爆电气、通风除尘、动火审批', status: '受控' },
    { id: 'FX-003', name: '有限空间', enterprise: '勾庄污水处理厂', level: '较大', category: '作业安全', color: 'bg-orange-500', person: '王强', frequency: '每周', lastCheck: '2026-04-07', measure: '作业审批、气体检测、监护人员', status: '受控' },
    { id: 'FX-004', name: '高压配电室', enterprise: '良渚机械制造厂', level: '较大', category: '电气', color: 'bg-orange-500', person: '赵刚', frequency: '每周', lastCheck: '2026-04-10', measure: '绝缘防护、定期检测、持证操作', status: '受控' },
    { id: 'FX-005', name: '起重机械', enterprise: '勾庄物流仓储中心', level: '较大', category: '机械设备', color: 'bg-orange-500', person: '刘洋', frequency: '每周', lastCheck: '2026-04-06', measure: '定期检验、限位装置、持证上岗', status: '受控' },
    { id: 'FX-006', name: '仓库堆垛', enterprise: '物流园区A库', level: '一般', category: '消防', color: 'bg-amber-400', person: '陈华', frequency: '每月', lastCheck: '2026-04-05', measure: '限高标识、通道畅通、防火间距', status: '受控' },
    { id: 'FX-007', name: '食堂燃气', enterprise: '良渚科创园', level: '一般', category: '燃气', color: 'bg-amber-400', person: '周敏', frequency: '每月', lastCheck: '2026-04-08', measure: '泄漏报警、自动切断、通风良好', status: '受控' },
    { id: 'FX-008', name: '消防通道', enterprise: '沿街商铺集群', level: '一般', category: '消防', color: 'bg-amber-400', person: '吴杰', frequency: '每周', lastCheck: '2026-04-03', measure: '禁止占用、标识清晰、保持畅通', status: '整改中' },
    { id: 'FX-009', name: '电梯设备', enterprise: '良渚商务大厦', level: '低', category: '特种设备', color: 'bg-blue-400', person: '郑芳', frequency: '每月', lastCheck: '2026-04-09', measure: '定期维保、年检合格、警示标识', status: '受控' },
    { id: 'FX-010', name: '应急照明', enterprise: '勾庄工业园B区', level: '低', category: '消防', color: 'bg-blue-400', person: '孙涛', frequency: '每季', lastCheck: '2026-03-28', measure: '定期测试、电池更换、完好有效', status: '受控' },
  ]

  // 筛选数据
  const filteredPoints = selectedLevel 
    ? riskPoints.filter(p => p.level === selectedLevel)
    : riskPoints

  const getStatusColor = (status: string) => {
    switch (status) {
      case '受控': return 'text-emerald-600 bg-emerald-50'
      case '整改中': return 'text-amber-600 bg-amber-50'
      case '失控': return 'text-red-600 bg-red-50'
      default: return 'text-zinc-600 bg-zinc-50'
    }
  }

  const getCategoryColor = (category: string) => {
    const map: Record<string, string> = {
      '危化品': 'bg-purple-50 text-purple-600',
      '消防': 'bg-red-50 text-red-600',
      '电气': 'bg-blue-50 text-blue-600',
      '机械设备': 'bg-indigo-50 text-indigo-600',
      '作业安全': 'bg-orange-50 text-orange-600',
      '燃气': 'bg-amber-50 text-amber-600',
      '特种设备': 'bg-cyan-50 text-cyan-600',
    }
    return map[category] || 'bg-zinc-50 text-zinc-600'
  }

  // 检查是否逾期
  const isOverdue = (lastCheck: string, frequency: string) => {
    const last = new Date(lastCheck)
    const now = new Date('2026-04-10')
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    const limits: Record<string, number> = { '每日': 1, '每周': 7, '每月': 30, '每季': 90 }
    return diffDays > (limits[frequency] || 30)
  }

  return (
    <div className="border border-zinc-200 rounded-lg overflow-hidden">
      {/* 标题栏 - 显示筛选状态 */}
      <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-700">
          📋 风险点清单 
          {selectedLevel && (
            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              筛选：{selectedLevel}风险
            </span>
          )}
        </h4>
        {selectedLevel && (
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('clearRiskFilter'))}
            className="text-xs text-zinc-500 hover:text-zinc-700 underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-zinc-50">
            <tr className="border-b border-zinc-200">
              <th className="text-left py-2.5 px-3 font-medium text-zinc-500 w-16">等级</th>
              <th className="text-left py-2.5 px-3 font-medium text-zinc-500">所属企业</th>
              <th className="text-left py-2.5 px-3 font-medium text-zinc-500">风险点名称</th>
              <th className="text-center py-2.5 px-3 font-medium text-zinc-500 w-20">类别</th>
              <th className="text-center py-2.5 px-3 font-medium text-zinc-500 w-16">责任人</th>
              <th className="text-center py-2.5 px-3 font-medium text-zinc-500 w-16">频次</th>
              <th className="text-center py-2.5 px-3 font-medium text-zinc-500 w-20">上次检查</th>
              <th className="text-left py-2.5 px-3 font-medium text-zinc-500">管控措施</th>
              <th className="text-center py-2.5 px-3 font-medium text-zinc-500 w-16">状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredPoints.map((point, index) => {
              const overdue = isOverdue(point.lastCheck, point.frequency)
              return (
                <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                  {/* 等级 */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${point.color}`}></span>
                      <span className="font-medium">{point.level}</span>
                    </div>
                  </td>
                  {/* 企业 */}
                  <td className="py-2.5 px-3 text-zinc-700 max-w-[120px] truncate" title={point.enterprise}>
                    {point.enterprise}
                  </td>
                  {/* 风险点名称 */}
                  <td className="py-2.5 px-3 font-medium text-zinc-800">{point.name}</td>
                  {/* 类别 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getCategoryColor(point.category)}`}>
                      {point.category}
                    </span>
                  </td>
                  {/* 责任人 */}
                  <td className="py-2.5 px-3 text-center text-zinc-600">{point.person}</td>
                  {/* 频次 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-zinc-500">{point.frequency}</span>
                  </td>
                  {/* 上次检查 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={overdue ? 'text-red-600 font-medium' : 'text-zinc-600'}>
                      {point.lastCheck}
                      {overdue && <span className="ml-1 text-[10px]">(逾期)</span>}
                    </span>
                  </td>
                  {/* 管控措施 */}
                  <td className="py-2.5 px-3 text-zinc-600 max-w-[180px] truncate" title={point.measure}>
                    {point.measure}
                  </td>
                  {/* 状态 */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(point.status)}`}>
                      {point.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部统计 */}
      <div className="bg-zinc-50 px-4 py-2 border-t border-zinc-200 text-xs text-zinc-500 flex items-center justify-between">
        <span>
          共 {filteredPoints.length} 条风险点
          {selectedLevel && `（已筛选）`}
          {!selectedLevel && `，其中重大 ${riskPoints.filter(p => p.level === '重大').length} 条、较大 ${riskPoints.filter(p => p.level === '较大').length} 条、一般 ${riskPoints.filter(p => p.level === '一般').length} 条、低 ${riskPoints.filter(p => p.level === '低').length} 条`}
        </span>
        <span className="text-zinc-400">💡 点击上方四色卡片可筛选对应等级</span>
      </div>
    </div>
  )
}

// （五）企业自查自报与基础管理
export function SelfInspectionManagement() {
  const items = [
    { label: '常态化自查', value: '96.2%', icon: '✅', desc: '企业定期开展安全隐患自查' },
    { label: '隐患上报率', value: '94.8%', icon: '📤', desc: '发现隐患及时通过平台上报' },
    { label: '闭环整改率', value: '91.5%', icon: '🔧', desc: '隐患整改闭环管理完成率' },
    { label: '特种作业持证', value: '100%', icon: '📜', desc: '特种作业人员持证上岗率' },
    { label: '外包作业管理', value: '89.3%', icon: '🤝', desc: '外包作业安全协议签订率' },
    { label: '应急演练完成', value: '87.6%', icon: '🚨', desc: '年度应急演练计划完成率' },
    { label: '一企一档', value: '100%', icon: '📁', desc: '企业安全档案建档率' },
    { label: '数字化应用', value: '92.4%', icon: '💻', desc: '企业数字化平台活跃使用率' },
  ]

  return (
    <SectionBlock
      title="（五）企业自查自报与基础管理"
      description="企业常态化自查、隐患上报、闭环整改及基础管理工作推进情况"
      className="mb-6"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div key={index} className="bg-white border border-zinc-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs text-zinc-500">{item.label}</span>
            </div>
            <div className="text-xl font-bold text-indigo-600">{item.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}
