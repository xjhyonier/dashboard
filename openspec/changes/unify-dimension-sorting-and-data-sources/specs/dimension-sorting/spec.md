# Dimension Sorting Capability

## Overview

统一为 V2 Dashboard 各维度组件的表格添加可排序表头功能，与已实现的 StateDimension 和 HazardDimension 保持一致。

## Components Affected

- **DutyDimension**: 3个表格需要排序
  - 工作组表 (WorkGroupView)
  - 人员履职表 (MemberView)
  - 专家履职表 (ExpertView)

- **IndustryDimension**: 4个表格需要排序
  - 责任主体类型表 (subjectTypes)
  - 风险等级表 (riskLevels)
  - 消防类型表 (fireTypes)
  - 标签隐患分析表 (filtered)

- **SpecialDimension**: 1个表格需要排序
  - 任务列表表 (filteredTasks)

## Implementation

使用现有的 `useSortableTable` hook 和 `SortableTh` 组件：

```typescript
import { useSortableTable } from './useSortableTable'
import { SortableTh } from './SortableTh'

// 在组件中使用
const { sortedData, sort, handleSort } = useSortableTable(data, 'defaultSortKey', 'desc')

// 表格头部
<SortableTh label="列名" sortKey="fieldKey" sort={sort} onSort={handleSort} />
```

## Sortable Fields

### DutyDimension

**工作组表**:
- 工作组名称, 成员, 检查企业, 隐患总数, 重大隐患, 已整改, 整改完成率, 逾期未整改, 整改中, 重大风险

**人员履职表**:
- 姓名, 所在工作组, 负责企业, 已检查企业, 发现隐患, 重大隐患, 已整改, 整改率, 整改中, 逾期未改

**专家履职表**:
- 姓名, 配合工作组, 负责, 检查, 发现隐患, 重大隐患, 已整改, 整改率, 整改中, 逾期

### IndustryDimension

**责任主体类型表**:
- 责任主体类型, 企业总数, 检查企业数, 发现隐患数, 重大隐患数, 已整改数, 限期整改数, 复查整改数, 整改指令书

**风险等级表**:
- 风险等级, 企业总数, 检查企业数, 发现隐患数, 重大隐患数, 已整改数, 限期整改数, 复查整改数, 整改指令书

**消防类型表**:
- 消防类型, 企业总数, 检查企业数, 发现隐患数, 重大隐患数, 已整改数, 限期整改数, 复查整改数, 整改指令书

**标签隐患分析表**:
- 标签, 隐患数, 重大隐患, 已整改, 限期整改, 高频问题

### SpecialDimension

**任务列表表**:
- #, 任务名称, 开始日期, 结束日期, 覆盖企业, 已完成, 完成率, 时间进度, 隐患数据, 创建人, 状态
