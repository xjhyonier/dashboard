# 应急管理数据模型设计文档

> 创建时间：2026-04-13
> 最后更新：2026-04-13（补充风险点管控措施、管控记录）

---

## 一、数据模型总览

### 1.1 核心实体

| 序号 | 实体名称 | 中文名 | 说明 |
|------|----------|--------|------|
| 1 | Enterprise | 企业 | 共200家 |
| 2 | EnterpriseDimensions | 企业多维度数据 | 企业各项指标 |
| 3 | RiskPoint | 风险点 | 企业内部风险点列表 |
| 4 | RiskPointControl | 风险点管控措施 | 管控措施清单 |
| 5 | RiskPointRecord | 风险点管控记录 | 管控执行记录 |
| 6 | Hazard | 隐患 | 隐患记录 |
| 7 | HazardHistory | 隐患状态历史 | 隐患状态变更记录 |
| 8 | Expert | 专家 | 安全专家 |
| 9 | ExpertDimensions | 专家7维度绩效 | 专家对企业的7维度评分 |
| 10 | ExpertPlatformBehavior | 专家平台行为 | 专家平台操作统计 |
| 11 | ExpertWorkload | 专家工作量 | 专家工作统计 |
| 12 | GovernmentMember | 政府人员 | 组长/副站长/组员 |
| 13 | SpecialInspection | 专项检查 | 各类专项检查 |
| 14 | WorkGroup | 工作组 | 8个工作组 |

### 1.2 关联关系

```
┌─────────────────────────────────────────────────────────────────┐
│                         WorkGroup (工作组)                        │
│   8个工作组，每个工作组有：组长、副站长、成员                      │
└─────────────────────────────────────────────────────────────────┘
        ▲                    ▲                    ▲
        │                    │                    │
   1:N  │                N:N  │                N:N  │
        │                    │                    │
┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
│ GovernmentMember │   │    Expert      │   │   Enterprise   │
│  (政府人员)    │   │    (专家)       │   │    (企业)      │
│ 组长/副站长/组员│   │ 负责企业        │   │                │
└───────────────┘   └───────┬───────┘   └───────┬───────┘
                             │                    │
                        1:N  │                    │  1:N
                             ▼                    ▼
                      ┌─────────────┐      ┌─────────────┐
                      │   Hazard    │      │  RiskPoint  │
                      │   (隐患)    │      │  (风险点)    │
                      └─────────────┘      └──────┬──────┘
                                                   │
                                              1:N │
                                                   ▼
                      ┌─────────────────────────────────────┐
                      │     RiskPointControl (管控措施)      │
                      └──────┬──────────────────────────────┘
                             │
                        1:N │
                             ▼
                      ┌─────────────────────────────────────┐
                      │     RiskPointRecord (管控记录)      │
                      └─────────────────────────────────────┘
```

#### 关系详解

| 关系 | 说明 |
|------|------|
| WorkGroup → GovernmentMember | 1:N，一个工作组有多个政府人员（组长1人、副站长多人、组员多人） |
| WorkGroup → Expert | 1:N，一个工作组有多个专家 |
| WorkGroup → Enterprise | 1:N，一个工作组负责多个企业 |
| Expert → Enterprise | 1:N，一个专家负责多个企业 |
| Enterprise → Hazard | 1:N，一个企业有多个隐患 |
| Enterprise → RiskPoint | 1:N，一个企业有多个风险点 |
| RiskPoint → RiskPointControl | 1:N，一个风险点有多个管控措施 |
| RiskPointControl → RiskPointRecord | 1:N，一个管控措施有多条执行记录 |
| Expert → Hazard | 1:N，一个专家可以发现多个隐患 |
| GovernmentMember ↔ WorkGroup | N:N，一个政府人员可以负责多个工作组 |

#### 人员结构

```
WorkGroup (工作组)
├── Leader (组长) - 1人
│   └── GovernmentMember.position = '组长'
├── Deputy (副站长) - 多人
│   └── GovernmentMember.position = '副站长'
└── Members (组员) - 多人
    └── GovernmentMember.position = '组员'
```

---

## 二、详细字段设计

### 2.1 Enterprise（企业）- 200家

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| name | string | ✅ | 企业名称 |
| address | string | | 地址 |
| industry | string | ✅ | 行业分类 |
| category | string | ✅ | 责任主体类型 |
| risk_level | enum | ✅ | 企业风险等级 |
| work_group | string | | 所属工作组 |
| expert_id | string | | 负责专家ID |
| status | enum | | 企业状态：在业/停产/注销 |
| ai_score | number | | AI评分 0-100 |
| created_at | date | | 创建时间 |
| updated_at | date | | 更新时间 |

#### 行业分类（industry）
```
工业企业
仓储物流
小微企业
危化使用
九小场所
出租房
沿街店铺
```

#### 责任主体类型（category）
```
生产型企业
经营型企业
储存型企业
使用型企业
场所类
```

#### 企业风险等级（risk_level）
```
重大
较大
一般
低
```

---

### 2.2 EnterpriseDimensions（企业多维度数据）

每个企业对应一条维度数据，完整字段如下：

#### 一、信息采集
| 字段 | 类型 | 说明 |
|------|------|------|
| info_collected | boolean | 信息采集是否完成 |

#### 二、数据授权
| 字段 | 类型 | 说明 |
|------|------|------|
| data_authorized | boolean | 数据授权是否完成 |

#### 三、风险识别
| 字段 | 类型 | 说明 |
|------|------|------|
| risk_identified | boolean | 风险点是否识别完成 |

#### 四、安全制度建立（百分比）
| 字段 | 类型 | 说明 |
|------|------|------|
| duty_rate | number | 机构职责完善度 0-100% |
| system_rate | number | 安全制度完善度 0-100% |
| invest_rate | number | 安全投入完善度 0-100% |

#### 五、检查执行
| 字段 | 类型 | 说明 |
|------|------|------|
| plan_type | enum | 检查计划：weekly/monthly/quarterly/none |
| plan_executed | boolean | 计划是否执行 |
| third_party_sync | boolean | 三方同步 |
| patrol_used | boolean | 巡查随手拍 |

#### 六、教育培训
| 字段 | 类型 | 说明 |
|------|------|------|
| training_done | boolean | 是否开展培训 |
| training_record | boolean | 培训是否有台账记录 |

#### 七、作业票
| 字段 | 类型 | 说明 |
|------|------|------|
| work_permit | boolean | 作业票报备 |

#### 八、隐患统计
| 字段 | 类型 | 说明 |
|------|------|------|
| hazard_self | number | 自查自纠隐患数 |
| hazard_monitor | number | 监管过程发现隐患数 |
| hazard_major | number | 重大隐患数 |
| rectify_status | enum | 整改状态 |

#### 九、巡查
| 字段 | 类型 | 说明 |
|------|------|------|
| patrol_done | boolean | 是否开展巡查 |

---

### 2.3 RiskPoint（风险点）

企业内部的的风险点列表。

#### 2.3.1 风险点主表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| enterprise_id | string | ✅ | 关联企业ID |
| name | string | ✅ | 风险点名称 |
| level | enum | ✅ | 风险等级 |
| type | string | ✅ | 风险类型 |
| status | enum | ✅ | 管控状态 |
| identified_at | datetime | | 识别时间 |
| last_check_at | datetime | | 最近检查时间 |
| check_frequency | enum | ✅ | 检查频次 |
| plan_type | enum | | 检查计划类型 |
| description | string | | 风险点描述 |

#### 2.3.2 风险点管控措施（RiskPointControl）

每个风险点可以有多条管控措施。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| risk_point_id | string | ✅ | 关联风险点ID |
| measure | string | ✅ | 管控措施内容 |
| responsible | string | | 责任人 |
| responsible_phone | string | | 责任人电话 |
| frequency | string | | 执行频次：每日/每周/每月 |
| status | enum | | 执行状态：执行中/已暂停/已失效 |
| created_at | datetime | | 创建时间 |
| updated_at | datetime | | 更新时间 |

#### 2.3.3 风险点管控记录（RiskPointRecord）

管控措施的执行记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键，UUID |
| risk_point_id | string | 关联风险点ID |
| measure_id | string | 关联管控措施ID |
| executed_by | string | 执行人 |
| executed_at | datetime | 执行时间 |
| result | enum | 执行结果：正常/异常/未执行 |
| note | string | 执行备注 |

#### 2.3.4 风险类型（type）
```
用电安全
消防安全
机械设备
危化品储存
有限空间
高处作业
动火作业
特种设备
职业卫生
其他
```

#### 2.3.5 检查频次（check_frequency）
```
每日
每周
每月
每季度
每年
不定期
```

#### 2.3.6 检查计划类型（plan_type）
```
weekly    // 每周检查
monthly   // 每月检查
quarterly // 每季度检查
none     // 无计划
```

#### 2.3.7 管控状态（status）
```
未管控    // 风险点未采取管控措施
管控中    // 管控措施执行中
已消除    // 风险已消除
已失效    // 管控措施失效，需要更新
```

---

### 2.4 Hazard（隐患）

#### 2.4.1 隐患主表

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| enterprise_id | string | ✅ | 关联企业ID |
| risk_point_id | string | | 关联风险点ID（可选） |
| level | enum | ✅ | 隐患等级 |
| status | enum | ✅ | 隐患当前状态 |
| source | enum | ✅ | 隐患来源 |
| expert_id | string | | 发现专家ID |
| expert_name | string | | 发现专家姓名 |
| title | string | ✅ | 隐患描述/标题 |
| description | string | | 隐患详情 |
| discovered_at | datetime | ✅ | 发现时间 |
| deadline_days | number | ✅ | 整改期限天数：7/15/30等 |
| deadline | datetime | ✅ | 整改期限（discovered_at + deadline_days） |
| rectified_at | datetime | | 整改完成时间 |
| verified_at | datetime | | 验收审核时间 |
| verified_by | string | | 验收人 |
| verify_result | enum | | 验收结果：通过/不通过 |
| closed_at | datetime | | 闭环时间 |

#### 2.4.2 隐患时间节点

```
发现时间 ──────────────────────────────────────────► 整改期限
    │                                                      │
    │  发现隐患                                            │ 超期天数
    │  设置整改期限(7/15/30天)                          │
    │                                                      │
    ▼                                                      ▼
[待整改] ──► [整改中] ──► [已整改] ──► [验收通过] ──► [闭环]
                    │                  │
                    │                  ▼
                    │              [验收不通过] ──► [整改中]
                    ▼
              [已逾期] ──► 继续整改 ──► [整改中]
```

| 时间节点 | 字段 | 说明 |
|----------|------|------|
| 发现时间 | discovered_at | 隐患被发现的时间 |
| 整改期限 | deadline | 自动计算 = 发现时间 + 超期天数 |
| 整改完成 | rectified_at | 企业整改完成提交的时间 |
| 验收时间 | verified_at | 专家/政府人员验收的时间 |
| 闭环时间 | closed_at | 隐患完全关闭的时间 |

#### 2.4.3 隐患状态流转

```
待整改 ──► 整改中 ──► 已整改 ──► 验收通过 ──► 闭环
   │           │
   │           │
   ▼           ▼
已逾期 ──► 继续整改
              │
              ▼
         验收不通过 ──► 整改中
```

#### 2.4.4 隐患状态枚举（status）
```
pending      // 待整改
rectifying  // 整改中
rectified   // 已整改（企业提交整改）
verified    // 验收通过
rejected    // 验收不通过
overdue     // 已逾期
closed     // 已闭环
```

#### 2.4.5 隐患等级（level）
```
major   // 重大
high    // 较大
general // 一般
```

#### 2.4.6 隐患来源（source）
```
expert      // 专家提交
enterprise // 企业自查自纠
```

#### 2.4.7 隐患状态变更历史（HazardHistory）

记录隐患的每次状态变更，便于追溯和时间筛选。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 主键，UUID |
| hazard_id | string | 关联隐患ID |
| from_status | enum | 原状态 |
| to_status | enum | 新状态 |
| operator_id | string | 操作人ID |
| operator_name | string | 操作人姓名 |
| operator_type | enum | 操作人类型：expert/government/enterprise/system |
| operated_at | datetime | 操作时间 |
| note | string | 备注/说明 |

#### 2.4.8 隐患时间维度筛选

支持按以下时间维度筛选隐患：

| 筛选维度 | 字段 | 说明 |
|----------|------|------|
| 按发现时间 | discovered_at | 隐患发现的时间范围 |
| 按整改期限 | deadline | 整改期限的时间范围 |
| 按整改完成时间 | rectified_at | 整改完成的时间范围 |
| 按验收时间 | verified_at | 验收审核的时间范围 |
| 按闭环时间 | closed_at | 闭环的时间范围 |
| 按超期天数 | deadline_days | 超期天数筛选 |

---

### 2.5 Expert（专家）

#### 2.5.1 Expert（专家基本信息）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| name | string | ✅ | 姓名 |
| work_group | string | | 所属工作组 |
| work_group_id | string | | 所属工作组ID |
| grade | string | | 等级/评分 |
| enterprise_count | number | | 负责企业数量 |
| avatar | string | | 头像URL |
| phone | string | | 联系电话 |
| created_at | date | | 创建时间 |

#### 2.5.2 ExpertDimensions（专家7维度绩效得分）

专家对负责企业的7个维度评估得分，每个专家对每个企业都有一个7维度评分。

| 维度ID | 维度名称 | 说明 | 得分范围 |
|--------|----------|------|----------|
| dim_1 | 企业基础覆盖度 | 工作组负责企业的检查覆盖率 | 0-100 |
| dim_2 | 制度数字化完善度 | 企业安全制度上传完整度 | 0-100 |
| dim_3 | 风险识别精准度 | 隐患定级准确性 | 0-100 |
| dim_4 | 检查计划科学度 | 检查计划排期合理性 | 0-100 |
| dim_5 | 自查执行活跃度 | 企业自查任务完成率 | 0-100 |
| dim_6 | 隐患闭环治理度 | 隐患整改完成率+时间 | 0-100 |
| dim_7 | 远程监管效能度 | 视频巡查+AI预警有效性 | 0-100 |

```typescript
interface ExpertDimensionScore {
  expert_id: string
  enterprise_id: string
  dim_1_score: number  // 企业基础覆盖度
  dim_2_score: number  // 制度数字化完善度
  dim_3_score: number  // 风险识别精准度
  dim_4_score: number  // 检查计划科学度
  dim_5_score: number  // 自查执行活跃度
  dim_6_score: number  // 隐患闭环治理度
  dim_7_score: number  // 远程监管效能度
  updated_at: date
}
```

#### 2.5.3 ExpertPlatformBehavior（专家平台行为数据）

专家在平台上的行为统计。

| 字段 | 类型 | 说明 |
|------|------|------|
| expert_id | string | 专家ID |
| responsible | number | 负责企业数 |
| check_count | number | 检查次数 |
| hazard_found | number | 发现隐患数 |
| hazard_serious | number | 重大隐患数 |
| hazard_closed | number | 已整改隐患数 |
| closure_rate | number | 整改率 % |
| risk_mark | number | 风险标注数 |
| video_todo | number | 视频待办数 |
| hazard_todo | number | 隐患待办数 |
| info_complete | number | 信息完善度 % |
| im_chat | number | IM咨询数 |
| service_log | number | 服务日志数 |
| on_site_visit | number | 现场查看数 |
| video_watch | number | 视频查看数 |
| ai_watch | number | AI巡查数 |
| enterprise_file | number | 一企一档完成数 |

#### 2.5.4 ExpertWorkload（专家工作量统计）

专家工作量月度/年度统计。

| 字段 | 类型 | 说明 |
|------|------|------|
| expert_id | string | 专家ID |
| month_key | string | 月份，如 2026-04 |
| week_key | string | 周份，如 2026-W15 |
| work_type | enum | 工作类型 |
| count | number | 次数/数量 |
| work_date | date | 工作日期 |

工作类型（work_type）：
```
现场检查
视频巡查
AI巡查
隐患复查
专家会诊
安全培训
其他
```

---

### 2.6 GovernmentMember（政府人员）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| name | string | ✅ | 姓名 |
| position | enum | ✅ | 职务 |
| work_group | string | | 所属工作组 |
| team_ids | string[] | | 负责的工作组ID列表 |
| phone | string | | 联系电话 |
| created_at | date | | 创建时间 |

#### 政府人员职务（position）
```
组长
副站长
组员
```

---

### 2.7 WorkGroup（工作组）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| name | string | ✅ | 工作组名称 |
| area | string | | 所属片区：良渚片/勾庄片/物流片 |
| risk_level | enum | | 工作组整体风险等级 |
| leader_id | string | | 组长ID |
| deputy_id | string | | 副站长ID |
| member_count | number | | 成员数量 |
| enterprise_count | number | | 负责企业数量 |
| created_at | date | | 创建时间 |

---

### 2.8 SpecialInspection（专项检查）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✅ | 主键，UUID |
| name | string | ✅ | 专项名称 |
| type | string | | 专项类型：危化/消防/粉尘/有限空间/其他 |
| start_date | date | ✅ | 开始时间 |
| end_date | date | ✅ | 结束时间 |
| enterprise_ids | string[] | | 覆盖企业ID列表 |
| target_count | number | | 目标检查企业数 |
| checked_count | number | | 实际检查企业数 |
| hazard_count | number | | 发现隐患数 |
| major_hazard_count | number | | 重大隐患数 |
| status | enum | | 专项状态：进行中/已完成 |

#### 专项类型（type）
```
危化使用
消防重点
粉尘涉爆
有限空间作业
其他
```

---

## 三、企业状态路径（EnterpriseStatePath）

### 3.1 路径节点定义

企业状态路径展示企业在平台上的完整生命周期：

```
[信息采集] → [数据授权] → [风险识别] → [隐患状态] → [风险等级]
     ↓             ↓            ↓            ↓           ↓
  完成/未完成   完成/未完成   完成/未完成   状态标签    四色标签
```

### 3.2 节点详细

| 节点ID | 节点名称 | 类型 | 说明 |
|--------|----------|------|------|
| info_collected | 信息采集 | boolean | 企业信息是否采集 |
| data_authorized | 数据授权 | boolean | 数据是否授权 |
| risk_identified | 风险识别 | boolean | 风险点是否识别 |
| hazard_status | 隐患状态 | enum | 当前隐患状态 |
| risk_level | 风险等级 | enum | 评估后的风险等级 |

### 3.3 节点状态枚举

| 状态值 | 说明 |
|--------|------|
| pending | 待处理 |
| in_progress | 进行中 |
| completed | 已完成 |
| blocked | 阻塞 |
| not_applicable | 不适用 |

---

## 四、统计聚合视图

为方便展示，需要预计算以下聚合数据：

### 4.1 企业统计（EnterpriseStats）
```
- 总数
- 按行业分布
- 按责任主体类型分布
- 按风险等级分布（四色分布）
- 按工作组分布
- ABC分类分布
```

### 4.2 隐患统计（HazardStats）
```
- 总数
- 按状态分布（待整改/整改中/已整改/已逾期）
- 按等级分布（重大/较大/一般）
- 按来源分布（专家/自查）
- 逾期率
- 整改率
```

### 4.3 工作组统计（WorkGroupStats）
```
- 各工作组企业数
- 各工作组隐患数
- 各工作组重大隐患数
- 各工作组整改率
```

### 4.4 人员履职统计（MemberStats）
```
- 负责企业数
- 检查次数
- 发现隐患数
- 重大隐患数
- 整改率
- 逾期数
```

---

## 五、查询接口设计

### 5.1 企业相关

```typescript
// 获取企业列表（支持多维度筛选）
getEnterprises(filters?: {
  industry?: string
  category?: string
  riskLevel?: string
  workGroup?: string
  expertId?: string
  keyword?: string
}): Promise<Enterprise[]>

// 获取企业详情
getEnterpriseById(id: string): Promise<Enterprise>

// 获取企业多维度数据
getEnterpriseDimensions(enterpriseId: string): Promise<EnterpriseDimensions>

// 获取企业状态路径
getEnterpriseStatePath(enterpriseId: string): Promise<StatePath>

// 获取企业风险点列表
getRiskPoints(enterpriseId: string): Promise<RiskPoint[]>

// 获取企业统计
getEnterpriseStats(): Promise<EnterpriseStats>
```

### 5.2 隐患相关

```typescript
// 获取隐患列表
getHazards(filters?: {
  enterpriseId?: string
  riskPointId?: string
  level?: string
  status?: string
  source?: string
  expertId?: string
  workGroup?: string
  keyword?: string
  dateRange?: { start: string; end: string }
}): Promise<Hazard[]>

// 获取隐患统计
getHazardStats(filters?: HazardFilters): Promise<HazardStats>
```

### 5.3 专家相关

```typescript
// 获取专家列表
getExperts(filters?: {
  workGroup?: string
}): Promise<Expert[]>

// 获取专家详情
getExpertById(id: string): Promise<Expert>

// 获取专家7维度绩效得分
getExpertDimensions(expertId: string): Promise<ExpertDimensionScore[]>

// 获取专家平台行为统计
getExpertPlatformBehavior(expertId: string): Promise<ExpertPlatformBehavior>

// 获取专家工作量统计
getExpertWorkload(expertId: string, filters?: {
  month?: string
}): Promise<ExpertWorkload[]>

// 获取专家履职汇总
getExpertPerformanceSummary(expertId: string): Promise<{
  totalEnterprises: number
  totalHazards: number
  majorHazards: number
  closureRate: number
  dimensionScores: number[]
}>

// 按7维度得分排序获取专家列表
getExpertsByDimension(dimension: 'dim_1' | 'dim_2' | ... | 'dim_7'): Promise<Expert[]>
```

### 5.4 政府人员相关

```typescript
// 获取政府人员列表
getGovernmentMembers(filters?: {
  position?: '组长' | '副站长' | '组员'
  workGroup?: string
}): Promise<GovernmentMember[]>

// 获取政府人员详情
getGovernmentMemberById(id: string): Promise<GovernmentMember>

// 获取人员履职统计
getMemberStats(memberId: string): Promise<{
  responsibleEnterprises: number
  inspections: number
  hazardsFound: number
  majorHazards: number
  closureRate: number
  overdueCount: number
}>

// 获取工作组负责人列表（组长+副站长）
getWorkGroupLeaders(workGroupId: string): Promise<GovernmentMember[]>
```

### 5.5 工作组相关

```typescript
// 获取工作组列表
getWorkGroups(): Promise<WorkGroup[]>

// 获取工作组统计
getWorkGroupStats(): Promise<WorkGroupStats[]>
```

### 5.6 专项检查相关

```typescript
// 获取专项检查列表
getSpecialInspections(): Promise<SpecialInspection[]>

// 获取专项详情（含覆盖企业）
getSpecialInspectionById(id: string): Promise<SpecialInspectionDetail>
```

---

## 六、待确认事项

### 6.1 需要确认的字段

1. **企业状态（status）**：在业/停产/注销 是否完整？是否还有其他状态？
2. **风险类型（type）**：用电安全/消防/机械/危化品/有限空间/高处作业/动火作业/其他，是否完整？
3. **专项类型（type）**：危化使用/消防重点/粉尘涉爆/有限空间作业/其他，是否完整？

### 6.2 待扩展功能

1. **风险点详情**：是否需要展示风险点的管控措施？
2. **隐患详情**：是否需要展示隐患的图片、整改前后对比？
3. **历史记录**：是否需要记录隐患的状态变更历史？

### 6.3 尚未覆盖的内容

1. **事故记录**：发生事故的企业需要记录
2. **执法记录**：整改指令书、立案查处等
3. **上级督查**：区级、市级督查问题
4. **考核评价**：人员考核评分
5. **ABC分类**：企业分类 A优秀/B合格/C不合格
6. **平台使用情况**：企业登录次数、自查任务完成率

### 6.4 专家相关待确认

1. **专家7维度得分计算规则**：各维度如何计算？权重如何？
2. **专家履职合格标准**：每月重大隐患+重点问题不少于几条为合格？
3. **专家排名规则**：按7维度总分还是某个维度排名？
4. **视频巡查/AI巡查**：是否需要区分？

---

## 七、实现优先级

### P0 - 核心数据（必须实现）
1. Enterprise（企业）
2. Hazard（隐患）
3. Expert（专家）+ ExpertDimensions（7维度）+ ExpertPlatformBehavior
4. GovernmentMember（政府人员）
5. WorkGroup（工作组）
6. EnterpriseDimensions（企业维度）
7. EnterpriseStatePath（状态路径）

### P1 - 重要数据
1. RiskPoint（风险点）
2. SpecialInspection（专项检查）
3. ExpertWorkload（专家工作量）
4. 各类统计聚合

### P2 - 扩展功能
1. 事故记录
2. 执法记录
3. 历史变更记录

### P2 - 扩展功能
1. 事故记录
2. 执法记录
3. 历史变更记录

---

*文档由 Alma 整理，待实现时对照检查*
