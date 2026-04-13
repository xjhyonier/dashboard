# 维度二：组织与人员 - 数据设计

## 一、整体结构

```
组织与人员
├── 工作组层面（3个组）
│   ├── 安全企业组
│   ├── 消防安全组
│   └── 其他专项组（可扩展）
│
├── 组成员层面（各工作组下的人员）
│
└── 专家层面
```

---

## 二、工作组数据字段

| 字段 | 字段名 | 类型 | 说明 | 示例 |
|------|--------|------|------|------|
| team_id | 工作组ID | string | 唯一标识 | team_001 |
| team_name | 工作组名称 | string | - | 安全企业组 |
| team_type | 工作组类型 | enum | enterprise/fire/other | enterprise |
| member_count | 组成员人数 | number | 包含正式成员 | 5 |
| expert_count | 关联专家数 | number | 该组配合的专家 | 2 |
| plan_count | 年度计划数 | number | 今年计划总数 | 48 |
| plan_completed | 已完成计划数 | number | 截至当前完成 | 32 |
| plan_completion_rate | 计划完成率 | percentage | 计算字段 | 66.7% |
| inspection_count | 检查次数 | number | 实际开展检查 | 156 |
| enterprise_count | 走访企业数 | number | 覆盖企业数量 | 89 |
| hazard_found | 发现隐患数 | number | 本周期内 | 45 |
| hazard_closed | 隐患闭环数 | number | 已整改销号 | 38 |
| hazard_closure_rate | 隐患闭环率 | percentage | 计算字段 | 84.4% |

---

## 三、组成员数据字段

| 字段 | 字段名 | 类型 | 说明 | 示例 |
|------|--------|------|------|------|
| member_id | 人员ID | string | 唯一标识 | member_001 |
| member_name | 姓名 | string | - | 张三 |
| team_id | 所属工作组ID | string | 关联 | team_001 |
| position | 职务 | string | 如：组长、组员 | 组长 |
| phone | 联系电话 | string | - | 138xxxx |
| plan_count | 个人年度计划 | number | 分配的计划数 | 12 |
| plan_completed | 计划已完成 | number | - | 8 |
| plan_completion_rate | 计划完成率 | percentage | - | 66.7% |
| inspection_count | 检查次数 | number | - | 24 |
| enterprise_count | 走访企业数 | number | 去重 | 18 |
| hazard_found | 发现隐患数 | number | - | 12 |
| hazard_closed | 隐患闭环数 | number | - | 10 |
| hazard_closure_rate | 隐患闭环率 | percentage | - | 83.3% |
| last_inspection_date | 最近检查日期 | date | - | 2026-04-10 |

---

## 四、专家数据字段

| 字段 | 字段名 | 类型 | 说明 | 示例 |
|------|--------|------|------|------|
| expert_id | 专家ID | string | 唯一标识 | expert_001 |
| expert_name | 姓名 | string | - | 李四 |
| expert_field | 专业领域 | string | 如：危化、建筑、消防 | 危化 |
| expert_level | 专家级别 | enum | 高级/中级/初级 | 高级 |
| team_id | 配合工作组ID | string | 主要配合的组 | team_001 |
| task_count | 分配任务数 | number | 今年以来 | 8 |
| task_completed | 任务完成数 | number | - | 6 |
| task_completion_rate | 任务完成率 | percentage | - | 75% |
| hazard_found | 发现隐患数 | number | 专家参与发现 | 15 |
| hazard_serious | 重大隐患数 | number | 其中重大隐患 | 3 |
| last_task_date | 最近任务日期 | date | - | 2026-04-08 |

---

## 五、汇总指标（工作组层面展示）

```
┌─────────────────────────────────────────────────────────────┐
│  安全企业组                    消防安全组                    │
├─────────────────────────────────────────────────────────────┤
│  计划完成率 ████████░░ 66.7%      计划完成率 ██████░░░░ 58.3%  │
│  检查次数   156               检查次数   98                  │
│  隐患闭环率 ████████░░ 84.4%      隐患闭环率 ███████░░░ 78.2%  │
└─────────────────────────────────────────────────────────────┘
```

---

## 六、视图切换

| 视图 | 内容 | 适用场景 |
|------|------|----------|
| 团队视图 | 工作组卡片 + 汇总数据 | 领导看整体 |
| 个人视图 | 组成员表格 + 履职指标 | 细查个人 |
| 专家视图 | 专家列表 + 任务数据 | 专家管理 |

---

## 七、数据来源（后续对接）

| 数据项 | 来源系统 | 备注 |
|--------|----------|------|
| 计划数据 | 隐患排查治理系统 | - |
| 检查记录 | 移动检查APP | - |
| 隐患数据 | 隐患管理系统 | - |
| 专家信息 | 专家库 | - |

---

## 八、待定问题

1. [ ] 是否需要显示每个人的"待办任务"列表？
2. [ ] 专家是否需要按"是否在岗"状态筛选？
3. [ ] 是否需要展示人员的"考核排名"？
4. [ ] 历史趋势数据是否需要？（如近6个月履职曲线）
