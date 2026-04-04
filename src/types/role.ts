// QuickBI 业务线的角色定义
import { BusinessLine } from './business'

export const quickBIConfig: BusinessLine = {
  id: 'quickbi',
  name: 'QuickBI 数据看板',
  description: '企业级商业智能分析平台',
  roles: [
    {
      id: 'ceo',
      name: 'CEO',
      title: '首席执行官',
      description: '关注企业整体运营状况，决策战略方向',
      goals: [
        '掌握公司整体业务健康度',
        '监控关键业务指标趋势',
        '识别业务风险和机会',
        '支持战略决策'
      ],
      keyMetrics: [
        '总营收',
        '客户增长',
        '市场份额',
        '运营效率'
      ]
    },
    {
      id: 'product',
      name: '产品经理',
      title: '产品负责人',
      description: '负责产品规划、需求分析和产品优化',
      goals: [
        '监控产品使用情况',
        '分析用户行为数据',
        '优化产品功能',
        '提升用户满意度'
      ],
      keyMetrics: [
        '日活跃用户',
        '功能使用率',
        '用户留存率',
        '产品反馈'
      ]
    },
    {
      id: 'sales',
      name: '销售总监',
      title: '销售负责人',
      description: '负责销售业绩、客户关系管理',
      goals: [
        '完成销售目标',
        '管理销售团队',
        '维护客户关系',
        '拓展新客户'
      ],
      keyMetrics: [
        '销售额',
        '订单数量',
        '客户转化率',
        '客户满意度'
      ]
    },
    {
      id: 'operation',
      name: '运营经理',
      title: '运营负责人',
      description: '负责日常运营监控、问题处理',
      goals: [
        '监控系统运行状态',
        '处理异常情况',
        '优化运营流程',
        '提升服务质量'
      ],
      keyMetrics: [
        '系统可用性',
        '响应时间',
        '问题处理率',
        '服务满意度'
      ]
    }
  ]
}

// 应急管理业务线的角色定义
export const emergencyConfig: BusinessLine = {
  id: 'emergency',
  name: '应急管理看板',
  description: '城市应急管理与安全生产监管',
  roles: [
    {
      id: 'government-leader',
      name: '政府领导',
      title: '街道书记/局长',
      description: '关注整体安全效果，做重大决策',
      goals: [
        '掌握辖区整体安全状况',
        '监控重大隐患和火灾事故',
        '识别安全治理成效',
        '支持资源调配决策'
      ],
      keyMetrics: [
        '重点隐患数量',
        '火灾事故数量',
        '隐患整改率',
        '企业覆盖率',
        '数据真实性'
      ]
    },
    {
      id: 'station-chief',
      name: '应消站站长',
      title: '应急消防管理站负责人',
      description: '既要看结果，又要管专家过程',
      goals: [
        '监督辖区安全隐患治理',
        '管理专家团队工作',
        '推动隐患整改闭环',
        '提升整体安全水平'
      ],
      keyMetrics: [
        '专家任务完成率',
        '重点企业到访率',
        '重大隐患跟进率',
        '整改推动率',
        '企业覆盖率'
      ]
    },
    {
      id: 'expert-workbench',
      name: '专家工作台',
      title: '应急安全专家',
      description: '高效管理100家企业，优先级和精力分配',
      goals: [
        '快速识别高风险企业',
        '合理分配工作精力',
        '推动隐患整改闭环',
        '提升负责企业安全水平'
      ],
      keyMetrics: [
        '今日待处理企业',
        '高风险企业数',
        '任务完成率',
        '整改推动率',
        '企业风险下降数'
      ]
    },
    {
      id: 'enterprise-boss',
      name: '企业老板',
      title: '企业负责人',
      description: '关注企业风险和员工履职',
      goals: [
        '了解企业当前风险状况',
        '监督安全员工作履职',
        '确保安全生产责任落实',
        '避免安全事故发生'
      ],
      keyMetrics: [
        '企业风险等级',
        '重大隐患数',
        '安全员履职率',
        '整改完成率',
        '员工培训率'
      ]
    },
    {
      id: 'monthly-report',
      name: '月度报告',
      title: '运营数据分析',
      description: '展示系统使用情况和成效',
      goals: [
        '全面掌握系统使用情况',
        '评估安全检查覆盖效果',
        '分析隐患治理成效',
        '为下月工作提供决策依据'
      ],
      keyMetrics: [
        '企业总数与风险分布',
        '检查覆盖率',
        '隐患发现率',
        '整改完成率',
        '环比变化趋势'
      ]
    }
  ]
}

