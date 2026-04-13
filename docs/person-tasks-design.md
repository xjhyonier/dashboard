# 人员履职 - 按风险等级任务进度展示

## 一、表格结构设计

```
┌────┬────────┬────────────┬──────────────────────────────────────────────────────────┐
│姓名│ 职务   │ 负责企业数 │ 重大风险          │ 较大风险          │ 一般风险        │ 低风险 │
│    │        │            │ 任务进度│时间进度│ 任务进度│时间进度│ 任务进度│时间进度│  ...  │
├────┼────────┼────────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│张义│ 副站长 │  125家    │ 8/10  │ 85%   │ 12/15 │ 78%   │ 45/50 │ 72%   │ 20/25 │
│    │        │            │ ████░░│ ██████░│ ████░░│ █████░│ ███░░│ █████░│ ███░░ │
└────┴────────┴────────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

## 二、字段设计

```typescript
// 按风险等级的任务进度
interface RiskLevelTaskProgress {
  riskLevel: 'major' | 'high' | 'general' | 'low'
  riskLevelName: '重大风险' | '较大风险' | '一般风险' | '低风险'
  
  // 任务进度
  totalTasks: number        // 总任务数（覆盖企业数）
  completedTasks: number    // 已完成任务数
  taskProgress: number      // 任务进度百分比
  
  // 时间进度
  cycleStartDate: string    // 本周期开始日期
  cycleEndDate: string      // 本周期结束日期
  daysTotal: number         // 本周期总天数
  daysElapsed: number       // 已过天数
  daysLeft: number          // 剩余天数（负数表示逾期）
  timeProgress: number       // 时间进度百分比
  
  // 状态标识
  status: 'ahead' | 'on_track' | 'behind' | 'overdue'
  // ahead: 任务进度 > 时间进度（超前）
  // on_track: 任务进度 ≈ 时间进度（正常）
  // behind: 任务进度 < 时间进度（落后）
  // overdue: 已逾期
}

// 人员履职扩展
interface MemberTaskPerformance {
  memberId: string
  memberName: string
  position: string
  teamIds: string[]
  
  // 汇总
  totalEnterprises: number
  totalTasks: number
  
  // 按风险等级的任务进度
  riskProgress: RiskLevelTaskProgress[]
}
```

## 三、UI设计

### 每个单元格展示

```
┌─────────────────────┐
│ 8/10  (80%)        │  ← 任务进度：已完成/总数 + 完成率
│ ████████░░         │  ← 进度条
│ ────────────        │
│ 时间: 85%           │  ← 时间进度
│ █████████░         │  ← 时间进度条
│                     │
│ ● 正常              │  ← 状态标识
└─────────────────────┘

状态颜色：
- 超前（ahead）: 🟢 绿色
- 正常（on_track）: 🔵 蓝色  
- 落后（behind）: 🟡 黄色
- 逾期（overdue）: 🔴 红色
```

### 状态判断逻辑

```
if (daysLeft < 0) {
  status = 'overdue'  // 已逾期
} else if (taskProgress > timeProgress + 10) {
  status = 'ahead'     // 超前 >10%
} else if (taskProgress >= timeProgress - 10) {
  status = 'on_track'   // 正常 ±10%
} else {
  status = 'behind'     // 落后 >10%
}
```

## 四、数据来源

每个风险等级的任务数据来源：

| 风险等级 | 检查频率 | 周期 | 数据来源 |
|---------|---------|------|---------|
| 重大风险 | 每季度1次 | Q1/Q2/Q3/Q4 | 专项检查任务表 |
| 较大风险 | 每半年1次 | 上半年/下半年 | 专项检查任务表 |
| 一般风险 | 每季度1次 | Q1/Q2/Q3/Q4 | 一般企业巡查计划 |
| 低风险 | 每半年1次 | 上半年/下半年 | 低风险企业抽查 |

## 五、Mock数据示例

```typescript
const memberTaskPerformance: MemberTaskPerformance[] = [
  {
    memberId: 'gov_018',
    memberName: '张义',
    position: '副站长',
    teamIds: ['team_005', 'team_006', 'team_007', 'team_008'],
    totalEnterprises: 125,
    riskProgress: [
      {
        riskLevel: 'major',
        riskLevelName: '重大风险',
        totalTasks: 12,
        completedTasks: 8,
        taskProgress: 66.7,
        cycleStartDate: '2026-04-01',
        cycleEndDate: '2026-06-30',
        daysTotal: 91,
        daysElapsed: 12,
        daysLeft: 79,
        timeProgress: 13.2,
        status: 'ahead',
      },
      {
        riskLevel: 'high',
        riskLevelName: '较大风险',
        totalTasks: 20,
        completedTasks: 12,
        taskProgress: 60.0,
        cycleStartDate: '2026-01-01',
        cycleEndDate: '2026-06-30',
        daysTotal: 181,
        daysElapsed: 102,
        daysLeft: 79,
        timeProgress: 56.4,
        status: 'on_track',
      },
      {
        riskLevel: 'general',
        riskLevelName: '一般风险',
        totalTasks: 45,
        completedTasks: 28,
        taskProgress: 62.2,
        cycleStartDate: '2026-01-01',
        cycleEndDate: '2026-03-31',
        daysTotal: 90,
        daysElapsed: 90,
        daysLeft: -12,
        timeProgress: 100,
        status: 'overdue',
      },
      {
        riskLevel: 'low',
        riskLevelName: '低风险',
        totalTasks: 30,
        completedTasks: 22,
        taskProgress: 73.3,
        cycleStartDate: '2026-01-01',
        cycleEndDate: '2026-06-30',
        daysTotal: 181,
        daysElapsed: 102,
        daysLeft: 79,
        timeProgress: 56.4,
        status: 'ahead',
      },
    ],
  },
]
```

## 六、实现优先级

1. ✅ 先实现4个风险等级列
2. ✅ 每个单元格显示：任务进度（数字+进度条）+ 时间进度（数字+进度条）
3. ✅ 状态标识（超前/正常/落后/逾期）
4. ⬜ 单元格点击可展开查看详细任务列表
