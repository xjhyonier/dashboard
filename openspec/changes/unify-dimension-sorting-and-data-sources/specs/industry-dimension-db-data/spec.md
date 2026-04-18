# Industry Dimension DB Data Capability

## Overview

将 IndustryDimension 组件的数据源从 Mock 数据改为使用数据库，实现与其他组件的数据源统一。

## Current State

IndustryDimension 目前使用两个 Mock 数据源:
- `industryHazardAnalysis`: 标签隐患分析数据
- `enterprises10D`: 企业统计数据

## Target State

使用数据库的 `getEnterprises()` 和 `getHazards()` 获取原始数据，在组件内按需聚合。

## Data Aggregation

组件内需要对以下维度进行聚合：

1. **责任主体类型** (subjectTypes)
   - 从 Enterprise 的 `category` 或 `industry` 字段映射
   - 统计: 企业数, 检查数, 隐患数, 整改数 等

2. **风险等级** (riskLevels)
   - 从 Enterprise 的 `risk_level` 字段获取
   - 排序: 重大风险 > 较大风险 > 一般风险 > 低风险

3. **消防类型** (fireTypes)
   - 由于 DB 中无 `fire_type` 字段，暂时用 `industry` 字段代替
   - 九小场所、出租房、沿街店铺 等归类为消防场所

4. **标签隐患分析** (filtered)
   - 从 Hazard 的 `enterprise_industry` 字段聚合
   - 统计各行业的隐患数量、整改情况

## Implementation

```typescript
// 在 IndustryDimension 中
import { initDatabase, getEnterprises, getHazards } from '../../../../db'

// 数据加载
const [enterprises, setEnterprises] = useState<Enterprise[]>([])
const [hazards, setHazards] = useState<Hazard[]>([])

useEffect(() => {
  async function loadData() {
    await initDatabase()
    const [entList, hazList] = await Promise.all([
      getEnterprises(),
      getHazards()
    ])
    setEnterprises(entList)
    setHazards(hazList)
  }
  loadData()
}, [])

// 聚合计算（使用 useMemo）
const subjectTypes = useMemo(() => {
  // 按行业/类型聚合 enterprises
}, [enterprises])

const riskLevels = useMemo(() => {
  // 按风险等级聚合
}, [enterprises])

const fireTypes = useMemo(() => {
  // 按行业聚合（暂时用 industry 代替 fire_type）
}, [enterprises])

const filtered = useMemo(() => {
  // 从 hazards 聚合，按 enterprise_industry 分组
}, [hazards])
```

## Open Issues

- DB 中无 `fire_type` 字段，消防类型表暂时使用 `industry` 字段
- 未来可能需要在 Enterprise 类型中添加 `fire_type` 字段
