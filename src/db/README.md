# 应急管理数据层

## 概述

本数据层为应急管理系统提供完整的数据模型和查询接口，包括：
- **200家企业**及其多维度评估数据
- **12位安全专家**及其7维度绩效评分
- **8个工作组**，每个工作组包含组长、副站长、组员
- **隐患管理**完整生命周期（发现→整改→验收→闭环）
- **风险点管控**（风险点→管控措施→执行记录）
- **专项检查**管理

## 文件结构

```
src/db/
├── index.ts           # 统一导出所有接口
├── types.ts           # TypeScript 类型定义
├── generator.ts       # 数据生成器（200家企业）
├── memory-db.ts       # 内存数据库实现
├── data-generator.ts  # 旧版兼容（已废弃）
└── test.ts            # 测试脚本
```

## 快速开始

```typescript
import { 
  initDatabase,
  getEnterprises,
  getHazardStats,
  getExperts,
  getWorkGroups,
} from '@/db'

// 初始化数据库（只需调用一次）
await initDatabase()

// 获取企业列表
const enterprises = await getEnterprises({
  riskLevel: '重大',
  workGroup: '良渚片安全组',
})

// 获取隐患统计
const stats = await getHazardStats({
  expertId: 'exp-001',
})

// 获取专家列表
const experts = await getExperts()
```

## 核心接口

### 企业相关

| 接口 | 说明 |
|------|------|
| `getEnterprises(filters?)` | 获取企业列表 |
| `getEnterpriseById(id)` | 获取企业详情 |
| `getEnterpriseDimensions(id)` | 获取企业多维度数据 |
| `getEnterpriseStatePath(id)` | 获取企业状态路径 |
| `getEnterpriseStats()` | 获取企业统计 |

### 隐患相关

| 接口 | 说明 |
|------|------|
| `getHazards(filters?)` | 获取隐患列表 |
| `getHazardById(id)` | 获取隐患详情 |
| `getHazardStats(filters?)` | 获取隐患统计 |
| `getHazardHistories(id)` | 获取隐患变更历史 |

### 专家相关

| 接口 | 说明 |
|------|------|
| `getExperts(filters?)` | 获取专家列表 |
| `getExpertDimensions(id)` | 获取专家7维度评分 |
| `getExpertPlatformBehavior(id)` | 获取专家平台行为 |
| `getExpertPerformanceSummary(id)` | 获取专家履职汇总 |

### 政府人员相关

| 接口 | 说明 |
|------|------|
| `getGovernmentMembers(filters?)` | 获取政府人员列表 |
| `getWorkGroups()` | 获取工作组列表 |
| `getWorkGroupStats()` | 获取工作组统计 |

### 风险点相关

| 接口 | 说明 |
|------|------|
| `getRiskPoints(enterpriseId?)` | 获取风险点列表 |
| `getRiskPointControls(id)` | 获取管控措施 |
| `getRiskPointRecords(id?)` | 获取管控记录 |

## 数据规模

| 实体 | 数量 | 说明 |
|------|------|------|
| 企业 | 200 | 按风险等级分布：重大8%、较大22%、一般40%、低30% |
| 专家 | 12 | 每个专家负责 15-18 家企业 |
| 工作组 | 8 | 良渚/勾庄/物流/瓶窑/仓前/闲林/五常/径山 |
| 政府人员 | 32-40 | 每组：1组长 + 1-2副站长 + 1-2组员 |
| 隐患 | 0-5条/企业 | 约 40% 企业有隐患 |
| 风险点 | 1-10个/企业 | 包含管控措施和执行记录 |
| 专项检查 | 8 | 危化/消防/粉尘/有限空间等 |

## 关系约束

```
WorkGroup (8个)
├── 1 个组长 (position='组长')
├── 1-2 个副站长 (position='副站长')
└── 1-2 个组员 (position='组员')

Expert (12人)
└── 每个专家负责 15-18 家企业

Enterprise (200家)
├── 归属 1 个工作组
├── 归属 1 个专家
├── 0-5 个隐患
└── 1-10 个风险点
```

## 时间节点（隐患）

```
发现时间 ──────────────────────────────────────────► 整改期限
    │                                                      │
    ▼                                                      ▼
[待整改] ──► [整改中] ──► [已整改] ──► [验收通过] ──► [闭环]
                    │                  │
                    ▼                  ▼
              [验收不通过] ──► [整改中]
```

## 隐患状态枚举

| 状态 | 说明 |
|------|------|
| `pending` | 待整改 |
| `rectifying` | 整改中 |
| `rectified` | 已整改（待验收） |
| `verified` | 验收通过 |
| `rejected` | 验收不通过 |
| `overdue` | 已逾期 |
| `closed` | 已闭环 |

## 隐患等级

| 等级 | 说明 |
|------|------|
| `major` | 重大隐患 |
| `high` | 较大隐患 |
| `general` | 一般隐患 |

## 专家7维度

| 维度 | 说明 |
|------|------|
| dim_1 | 企业基础覆盖度 |
| dim_2 | 制度数字化完善度 |
| dim_3 | 风险识别精准度 |
| dim_4 | 检查计划科学度 |
| dim_5 | 自查执行活跃度 |
| dim_6 | 隐患闭环治理度 |
| dim_7 | 远程监管效能度 |

## 筛选器示例

```typescript
// 按多个条件筛选企业
const enterprises = await getEnterprises({
  industry: '工业企业',
  category: '生产型企业',
  riskLevel: '较大',
  keyword: '化工',
})

// 按时间范围筛选隐患
const hazards = await getHazards({
  discoveredAtRange: {
    start: '2026-01-01',
    end: '2026-03-31',
  },
  status: 'overdue',
})

// 按超期天数筛选
const overdueHazards = await getHazards({
  overdueDays: { min: 7, max: 30 },
})
```

## 统计接口

```typescript
// 企业统计
const stats = await getEnterpriseStats()
// { total: 200, byRiskLevel: {...}, byIndustry: {...}, ... }

// 隐患统计
const hazardStats = await getHazardStats()
// { total: 350, pending: 45, overdue: 23, closureRate: 78%, ... }

// 工作组统计
const wgStats = await getWorkGroupStats()
// [{ work_group_id, enterprise_count, hazard_total, closure_rate, ... }]
```

## 兼容旧代码

```typescript
// 旧版接口仍然可用
import { getEnterprisesWithDimensions, getDimensionStats } from '@/db'

const enterprises = await getEnterprisesWithDimensions()
const dimensionStats = await getDimensionStats()
```
