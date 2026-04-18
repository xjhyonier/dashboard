## Why

当前 V2 版本的应急管理 dashboard 中，各维度组件（DutyDimension、IndustryDimension、SpecialDimension）的表格缺少排序功能，用户无法按列排序查看数据。同时，IndustryDimension 仍在使用 Mock 数据（industryHazardAnalysis、enterprises10D），与其他组件使用数据库的规范不一致。这些不一致影响了代码质量和用户体验。

## What Changes

### 数据源统一
- 将 IndustryDimension 的数据源从 Mock（industryHazardAnalysis、enterprises10D）改为数据库（getEnterprises 等）

### 表格排序功能
- **DutyDimension**: 为工作组表、人员履职表、专家履职表添加 SortableTh 表头排序
- **IndustryDimension**: 为责任主体类型表、风险等级表、消防类型表、标签隐患分析表添加 SortableTh 表头排序
- **SpecialDimension**: 为任务列表表添加 SortableTh 表头排序

### 技术规范
- 统一使用已有的 useSortableTable hook 和 SortableTh 组件（已在 StateDimension、HazardDimension 中使用）

## Capabilities

### New Capabilities
- `dimension-sorting`: 统一为各维度组件的表格添加可排序表头，与 StateDimension、HazardDimension 保持一致
- `industry-dimension-db-data`: 将 IndustryDimension 的数据源从 Mock 改为数据库

### Modified Capabilities
- 无（暂不涉及现有 spec 行为的变更）

## Impact

### 受影响代码
- `src/business/emergency/pages/components/DutyDimension.tsx`
- `src/business/emergency/pages/components/IndustryDimension.tsx`
- `src/business/emergency/pages/components/SpecialDimension.tsx`

### 依赖组件
- `src/business/emergency/pages/components/useSortableTable.ts` (已存在)
- `src/business/emergency/pages/components/SortableTh.tsx` (已存在)

### 数据层变更
- IndustryDimension: 移除对 `industryHazardAnalysis`、`enterprises10D` Mock 数据的依赖
- 需要确认数据库是否有对应字段支持行业标签、消防类型等聚合查询
