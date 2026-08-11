# QuickBI Dashboard Framework 项目状态

> 最后更新：2026-04-13

## 项目概述

**项目定位**：应急管理领域可视化看板系统

**核心价值**：支持政府领导、应消站站长、专家工作台、企业老板等多角色视角的数据展示

**技术栈**：React + TypeScript + QuickBI

---

## 项目结构

```
src/
├── business/emergency/
│   └── pages/                    # 页面组件
│       ├── GovernmentLeaderDashboard.tsx    # 政府领导看板
│       ├── StationChiefDashboard.tsx       # 站长看板 V1（政府报告结构）
│       ├── StationChiefV2Dashboard.tsx     # 站长看板 V2（通用数据看板）
│       ├── ExpertDashboard.tsx             # 专家工作台
│       └── mock/                            # Mock 数据
│           ├── station-chief-v2.ts
│           └── ...
├── types/
│   └── role.ts                    # 角色类型定义
└── App.tsx                        # 路由配置
```

---

## 角色看板矩阵

| 角色 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 政府领导 | `GovernmentLeaderDashboard.tsx` | ⚠️ 有历史语法问题 | 需修复 |
| 应消站站长 | `StationChiefDashboard.tsx` | V1 已完成 | 基于政府报告结构 |
| 应消站站长 V2 | `StationChiefV2Dashboard.tsx` | 🔨 开发中 | 通用数据看板重构 |
| 专家工作台 | `ExpertDashboard.tsx` | ✅ 已完成 | - |
| 企业老板 | - | 📋 待开发 | - |

---

## 当前核心任务：站长看板 V2 重构

### 重构背景

V1 的 4 个大维度来自政府 Word 报告，偏「报告结构」而非「看板结构」。不同地区/街镇的维度逻辑各异，不通用。

### V2 设计方案

从数据看板方法论抽象出通用维度轴：

| 维度类型 | 说明 | 优先级 |
|----------|------|--------|
| 组织与人员 | 机构和人员配置、履职情况 | ⭐⭐⭐ 默认优先 |
| 风险维度 | 风险点、隐患排查 | ⭐⭐ |
| 执行维度 | 任务执行、检查记录 | ⭐⭐ |
| 成效维度 | 处置成果、整改效果 | ⭐ |
| 能力维度 | 培训、演练、装备 | ⭐ |

### V2 默认 Tab 设计

**组织与人员**（政府最在意人的维度）

### 进度

- [x] 方案设计文档
- [x] Mock 数据结构
- [x] 页面框架搭建
- [ ] Tab 页面开发（组织与人员）
- [ ] Tab 页面开发（风险维度）
- [ ] Tab 页面开发（执行维度）
- [ ] Tab 页面开发（成效维度）
- [ ] Tab 页面开发（能力维度）
- [ ] 路由接入
- [ ] 真实数据对接

---

## 已知问题

| 问题 | 位置 | 状态 |
|------|------|------|
| 历史语法错误 | `GovernmentLeaderDashboard.tsx` | 📋 待修复 |
| 页面样式兼容 | 多处 | 逐步处理 |

---

## 相关文档

- [站长 V2 看板分析](./docs/station-chief-v2-dashboard-analysis.md)
- [维度一：日常监管数据设计](./docs/dimension-one-日常监管数据设计.md)
- [维度二：人员履职数据设计](./docs/dimension-two-人员履职数据设计.md)
- [人员任务设计](./docs/person-tasks-design.md)

---

## Git 活跃变更

```
最近改动：
- src/App.tsx                # 路由配置
- src/types/role.ts          # 角色入口
- src/business/emergency/pages/StationChiefV2Dashboard.tsx   # 新建
- src/business/emergency/pages/mock/station-chief-v2.ts      # 新建
```

---

## 下一步计划

1. 继续完善站长 V2 各 Tab 页面
2. 修复 GovernmentLeaderDashboard 语法问题
3. 规划企业老板角色看板

---

*此文档由系统自动维护，细节设计请参考 docs/ 目录下的专项文档*
