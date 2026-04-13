/**
 * 数据层测试脚本
 * 运行方式：在浏览器控制台或通过 Vite 插件执行
 */

import { 
  initDatabase,
  getEnterprises,
  getEnterpriseStats,
  getHazardStats,
  getExperts,
  getGovernmentMembers,
  getWorkGroups,
  getHazards,
  getRiskPoints,
  getSpecialInspections,
  getEnterpriseDimensions,
  getEnterpriseStatePath,
  getExpertDimensions,
  getExpertPlatformBehavior,
} from './index'

async function runTests() {
  console.log('🔄 初始化数据库...')
  await initDatabase()
  console.log('✅ 数据库初始化完成\n')

  // 测试1：企业数据
  console.log('📊 测试1：企业数据')
  const enterprises = await getEnterprises()
  console.log(`   企业总数: ${enterprises.length}`)
  const enterpriseStats = await getEnterpriseStats()
  console.log(`   按风险等级分布:`, enterpriseStats.byRiskLevel)
  console.log('')

  // 测试2：企业维度数据
  console.log('📊 测试2：企业维度数据')
  const firstEnterprise = enterprises[0]
  if (firstEnterprise) {
    const dims = await getEnterpriseDimensions(firstEnterprise.id)
    console.log(`   企业 ${firstEnterprise.id} 维度数据:`, dims ? {
      info_collected: dims.info_collected,
      data_authorized: dims.data_authorized,
      risk_identified: dims.risk_identified,
      duty_rate: dims.duty_rate,
    } : '未找到')
    
    const statePath = await getEnterpriseStatePath(firstEnterprise.id)
    console.log(`   企业状态路径节点数: ${statePath?.nodes.length || 0}`)
  }
  console.log('')

  // 测试3：专家数据
  console.log('📊 测试3：专家数据')
  const experts = await getExperts()
  console.log(`   专家总数: ${experts.length}`)
  experts.slice(0, 3).forEach(exp => {
    console.log(`   - ${exp.name} (${exp.work_group}) 负责 ${exp.enterprise_count} 家企业`)
  })
  
  if (experts[0]) {
    const platformBehavior = await getExpertPlatformBehavior(experts[0].id)
    console.log(`   ${experts[0].name} 平台行为:`, {
      responsible: platformBehavior?.responsible,
      check_count: platformBehavior?.check_count,
      hazard_found: platformBehavior?.hazard_found,
      closure_rate: platformBehavior?.closure_rate,
    })
    
    const dims = await getExpertDimensions(experts[0].id)
    console.log(`   ${experts[0].name} 7维度评分数: ${dims.length}`)
  }
  console.log('')

  // 测试4：政府人员数据
  console.log('📊 测试4：政府人员数据')
  const members = await getGovernmentMembers()
  console.log(`   政府人员总数: ${members.length}`)
  const byPosition = {
    '组长': members.filter(m => m.position === '组长').length,
    '副站长': members.filter(m => m.position === '副站长').length,
    '组员': members.filter(m => m.position === '组员').length,
  }
  console.log(`   按职务分布:`, byPosition)
  console.log('')

  // 测试5：工作组数据
  console.log('📊 测试5：工作组数据')
  const workGroups = await getWorkGroups()
  console.log(`   工作组总数: ${workGroups.length}`)
  workGroups.forEach(wg => {
    console.log(`   - ${wg.name} (${wg.area}) 负责 ${wg.enterprise_count} 家企业`)
  })
  console.log('')

  // 测试6：隐患数据
  console.log('📊 测试6：隐患数据')
  const hazards = await getHazards()
  console.log(`   隐患总数: ${hazards.length}`)
  const hazardStats = await getHazardStats()
  console.log(`   按状态分布:`, hazardStats.byStatus)
  console.log(`   按等级分布:`, hazardStats.byLevel)
  console.log(`   整改率: ${hazardStats.closureRate}%`)
  console.log(`   逾期率: ${hazardStats.overdueRate}%`)
  console.log('')

  // 测试7：风险点数据
  console.log('📊 测试7：风险点数据')
  const riskPoints = await getRiskPoints()
  console.log(`   风险点总数: ${riskPoints.length}`)
  const riskPointsByLevel = {
    '重大': riskPoints.filter(rp => rp.level === '重大').length,
    '较大': riskPoints.filter(rp => rp.level === '较大').length,
    '一般': riskPoints.filter(rp => rp.level === '一般').length,
    '低': riskPoints.filter(rp => rp.level === '低').length,
  }
  console.log(`   按等级分布:`, riskPointsByLevel)
  console.log('')

  // 测试8：专项检查数据
  console.log('📊 测试8：专项检查数据')
  const inspections = await getSpecialInspections()
  console.log(`   专项检查总数: ${inspections.length}`)
  inspections.forEach(si => {
    console.log(`   - ${si.name}: 目标 ${si.target_count} 家, 已检查 ${si.checked_count} 家, 发现隐患 ${si.hazard_count} 条`)
  })
  console.log('')

  // 测试9：筛选功能
  console.log('📊 测试9：筛选功能')
  const majorHazards = await getHazards({ level: 'major' })
  console.log(`   重大隐患数量: ${majorHazards.length}`)
  
  const pendingHazards = await getHazards({ status: 'pending' })
  console.log(`   待整改隐患数量: ${pendingHazards.length}`)
  
  const expertHazards = await getHazards({ expertId: experts[0]?.id })
  console.log(`   ${experts[0]?.name} 负责隐患: ${expertHazards.length} 条`)
  console.log('')

  // 测试10：数据一致性验证
  console.log('📊 测试10：数据一致性验证')
  const workGroupStats = workGroups.map(wg => ({
    name: wg.name,
    enterprise_count: wg.enterprise_count,
    enterprises_in_db: enterprises.filter(e => e.work_group_id === wg.id).length,
    match: wg.enterprise_count === enterprises.filter(e => e.work_group_id === wg.id).length,
  }))
  console.log(`   工作组企业数一致性:`, workGroupStats.every(w => w.match) ? '✅ 通过' : '❌ 失败')
  
  const expertEnterpriseSum = experts.reduce((sum, exp) => sum + exp.enterprise_count, 0)
  console.log(`   专家负责企业总数: ${expertEnterpriseSum} vs 实际企业数: ${enterprises.length}`)
  console.log('')

  console.log('🎉 所有测试完成!')
}

// 导出测试函数供外部调用
export { runTests }

// 如果在浏览器环境中自动运行
if (typeof window !== 'undefined') {
  runTests().catch(console.error)
}
