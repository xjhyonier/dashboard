## Context

当前 V2 Dashboard 的各维度组件中，排序功能的实现不一致：
- **StateDimension** 和 **HazardDimension**: 已使用 `useSortableTable` + `SortableTh` 实现排序
- **DutyDimension**、**IndustryDimension**、**SpecialDimension**: 表格无排序功能

同时，**IndustryDimension** 仍在使用 Mock 数据（`industryHazardAnalysis`、`enterprises10D`），与其他组件使用数据库的规范不一致。

### 现有排序实现参考

```typescript
// useSortableTable hook (已存在)
const { sortedData, sort, handleSort, getSortIcon } = useSortableTable(data, 'defaultSortKey', 'desc')

// SortableTh 组件 (已存在)
<SortableTh label="列名" sortKey="fieldKey" sort={sort} onSort={handleSort} />
```

### 数据模型差异

IndustryDimension 的 Mock 数据使用了与数据库不同的字段：

| Mock 字段 | Mock 类型 | DB 字段 | DB 类型 |
|-----------|----------|---------|---------|
| enterprise_type | '生产企业' \| '消防场所' | category | EnterpriseCategory |
| fire_type | '九小场所' \| '消防重点单位' \| ... | 无 | - |
| industry | string | industry | Industry |

**关键问题**: 数据库 Enterprise 类型中没有 `enterprise_type` 和 `fire_type` 字段。需要决定如何处理。

## Goals / Non-Goals

**Goals:**
- 为 DutyDimension 的3个表格（工作组表、人员履职表、专家履职表）添加排序
- 为 IndustryDimension 的4个表格（责任主体类型表、风险等级表、消防类型表、标签隐患分析表）添加排序
- 为 SpecialDimension 的任务表格添加排序
- 将 IndustryDimension 改为使用数据库数据

**Non-Goals:**
- 不修改数据库 schema
- 不改动 V1/Legacy 组件（StationChiefDashboard 等）
- 不实现高级排序（如多列排序、远程排序）

## Decisions

### Decision 1: IndustryDimension 数据源方案

**选项 A**: 使用现有数据库字段映射
- 将 Mock 的 `enterprise_type`（生产企业/消防场所）映射到 DB 的 `industry` 字段
- 工业企业的行业: '工业企业'、'危化使用' → 归类为"生产企业"
- 其他行业 → 归类为"消防场所"
- 消防类型（九小场所等）暂时用 `industry` 字段代替

**选项 B**: 在组件内从 Enterprise 数据聚合计算
- 利用 getEnterprises 获取所有企业
- 在组件内按行业、风险等级等维度聚合统计
- 移除 industryHazardAnalysis 和 enterprises10D 的依赖

**选择**: 选项 B - 在组件内聚合计算，保持灵活性

### Decision 2: 排序实现方式

**统一使用现有的**:
- `useSortableTable<T>` hook - 提供排序状态管理和数据排序
- `SortableTh` 组件 - 提供可点击排序的表头

**实现模式**:
```typescript
// 1. 引入
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'

// 2. 使用 hook
const { sortedData, sort, handleSort } = useSortableTable(data, 'defaultSortField', 'desc')

// 3. 表格头部使用 SortableTh
<thead>
  <tr>
    <SortableTh label="列名" sortKey="fieldName" sort={sort} onSort={handleSort} />
  </tr>
</thead>
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB 缺少 fire_type 字段 | 消防类型表只能显示行业分类而非详细类型 | 先用 industry 字段代替，后续按需扩展 |
| 大量数据时前端聚合性能差 | Enterprise 数据量大时聚合可能卡顿 | 考虑添加 db 层聚合方法或分页 |
| 排序后分页状态丢失 | 排序后切换页码可能不是预期数据 | 排序时保持第一页或使用 local state |

## Migration Plan

1. **Phase 1**: 为 DutyDimension 添加排序（3个表格）
2. **Phase 2**: 为 SpecialDimension 添加排序（1个表格）
3. **Phase 3**: 重构 IndustryDimension 使用数据库 + 添加排序（4个表格）

每阶段完成后进行功能验证。

## Open Questions

1. **消防类型数据**: DB 中没有 `fire_type` 字段，是否需要添加？还是暂时用 `industry` 代替？
2. **行业标签**: Mock 中的 `industryHazardAnalysis` 有"标签"概念（实际上就是行业分类），DB 中的 `industry` 字段是否能满足需求？
3. **数据聚合位置**: 是在组件内聚合还是在 db 层添加专门的聚合方法？
