# QuickBI 看板系统使用指南

## 📋 系统概览
这是一个**多角色、多业务线**的看板演示系统，支持快速创建不同业务场景的 Demo 看板。

## 🚀 快速开始

### 1. 查看现有看板
- 访问 **http://localhost:5175/**
- 点击右上角 **"CEO 看板"** 按钮查看角色说明
- 点击顶部角色标签切换不同角色
- 每个角色都有独立的目标和关注指标

### 2. 创建新角色看板
```typescript
// 1. 定义角色（src/types/role.ts）
{
  id: 'marketing',
  name: '市场总监',
  title: '市场营销负责人',
  description: '负责市场推广、品牌建设和营销效果分析',
  goals: [
    '提升品牌知名度',
    '优化营销渠道',
    '提高转化率',
    '降低获客成本'
  ],
  keyMetrics: [
    '品牌曝光度',
    '渠道转化率',
    '营销ROI',
    '客户获取成本'
  ]
}

// 2. 创建 Mock 数据（src/business/quickbi/pages/mock/marketing.ts）
export const marketingMock = {
  coreMetrics: [...],
  campaignData: [...]
}

// 3. 创建页面组件（src/business/quickbi/pages/MarketingDashboard.tsx）
import { PageShell, PageHeader } from '../../components/layout'
import { RoleIndicator } from '../../components/common/RoleIndicator'

import { marketingMock } from './mock/marketing'

export function MarketingDashboard() {
  return (
    <>
      <RoleIndicator
        title="市场营销看板"
        description="负责市场推广、品牌建设和营销效果分析"
        goals={[...]}
        keyMetrics={[...]}
      />
      <PageShell>
        {/* 组件内容 */}
      </PageShell>
    </>
  )
}

// 4. 更新路由（src/App.tsx）
{currentRole === 'marketing' && <MarketingDashboard />}
```

### 3. 添加新业务线
```typescript
// 1. 定义业务线（src/types/business.ts）
export const erpConfig: BusinessLine = {
  id: 'erp',
  name: 'ERP 系统',
  description: '企业资源规划系统',
  roles: [...]
}

// 2. 创建业务线目录
src/business/
  erp/
    pages/
      CEODashboard.tsx
      mock/
        ceo.ts
```

## 🎯 核心优势

### 1. 角色化视角
- ✅ 每个角色有独立的目标和关注指标
- ✅ 浮层说明帮助对齐认知
- ✅ 同一数据，不同角色视角

### 2. 快速扩展
- ✅ 5分钟创建新角色看板
- ✅ 10分钟添加新业务线
- ✅ 组件复用，配置简单

### 3. 演示友好
- ✅ 角色说明清晰展示目标
- ✅ 一键切换不同角色
- ✅ 支持现场讲解和演示

## 📚 使用示例

### 演示场景
```
你：这是一个 QuickBI 的 CEO 看板
我：点击角色说明，你：看，CEO 需要关注的核心指标
你：切换到产品经理角色
我：这是产品经理视角，你：看到产品经理关注用户行为和功能使用率
```

### 开发场景
```
我：需要添加一个运营监控看板
我：[创建运营看板]
你：好的，5分钟完成
我:需要支持 ERP 业务线
我：[添加 ERP 配置]
你：好的，10分钟完成
```

## 🔧 下一步建议

1. **添加工具方法库** - 数字格式化、趋势计算
2. **增强图表组件** - 支持更多图表类型
3. **添加导出功能** - 导出看板截图或数据
4. **完善文档** - 组件使用说明、最佳实践

**现在可以在浏览器中体验完整的多角色演示系统了！** 🎉
