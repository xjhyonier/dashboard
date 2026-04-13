# QuickBI Dashboard Framework - 规范

## 一、项目定位

**做什么**：多角色、多业务线的可视化看板框架，支持快速创建不同业务场景的 Demo 看板。

**不做什么**：
- 不做真实数据接入（当前全是 Mock 数据）
- 不做权限系统（单租户演示模式）
- 不做后端服务

## 二、技术栈约束

```
React 18 + TypeScript + Vite + TailwindCSS + Recharts
```

**约束**：
- 所有业务组件放在 `src/business/{模块名}/` 下
- 公共组件放在 `src/components/` 下
- 组件命名：`PascalCase.tsx`
- Hooks 命名：`use{camelCase}.ts`
- 类型定义统一放 `src/types/`

## 三、目录结构规范

```
src/
├── business/          # 业务模块（每个模块独立）
│   ├── {module}/      # 模块名（小写）
│   │   ├── pages/     # 页面组件
│   │   ├── components/# 模块私有组件
│   │   ├── mock/      # Mock 数据
│   │   ├── types/     # 模块类型
│   │   └── utils/     # 模块工具函数
│   │
├── components/        # 公共组件
│   ├── common/        # 通用组件（Button, Card, Table...）
│   ├── layout/        # 布局组件（PageShell, PageHeader...）
│   ├── widgets/       # 图表/数据组件
│   └── shared/        # 跨模块共享组件
│
├── types/             # 全局类型定义
├── utils/             # 全局工具函数
├── mock/              # 全局 Mock 数据
├── db/                # sql.js 数据库相关
└── styles/            # 全局样式
```

## 四、路由规范

**规则**：
- URL 格式：`/{业务线}/{角色}`
- 示例：`/emergency/expert/queue`
- 路由统一在 `App.tsx` 集中管理
- 新增页面必须同步更新路由

**禁止**：
- ❌ 硬编码页面路径（如 `"../../pages/xxx"`）
- ❌ 在业务组件内直接写 `<Route>`
- ❌ 动态 import 非模块内组件

## 五、组件开发规范

### 5.1 页面组件结构

```tsx
// ✅ 正确：标准的页面结构
export function ExpertDashboard() {
  return (
    <>
      <PageHeader title="专家看板" />
      <PageShell>
        {/* 页面内容 */}
      </PageShell>
    </>
  )
}

// ❌ 错误：缺少 PageShell 或直接在页面写布局
export function BadDashboard() {
  return (
    <div className="p-6">
      {/* ... */}
    </div>
  )
}
```

### 5.2 Props 类型约束

```tsx
// ✅ 正确：props 必须有类型定义
interface RiskCardProps {
  title: string
  value: number
  trend?: 'up' | 'down' | 'stable'
  riskLevel: 'major' | 'high' | 'general' | 'low'
}

export function RiskCard({ title, value, trend, riskLevel }: RiskCardProps) {
  // ...
}
```

### 5.3 Mock 数据规范

```typescript
// ✅ 正确：Mock 数据必须导出完整类型
export interface MemberPerformance {
  id: string
  name: string
  metrics: MetricData[]
}

export const memberPerformanceMock: MemberPerformance[] = [
  // ...
]
```

## 六、数据模型约束

### 6.1 核心类型（已在 `src/types/` 定义）

| 类型 | 文件 | 用途 |
|-----|------|------|
| `BusinessLine` | role.ts | 业务线配置 |
| `Role` | role.ts | 角色定义 |
| `RiskLevel` | index.ts | 风险等级枚举 |
| `TaskProgress` | index.ts | 任务进度 |

### 6.2 新增类型规则

```typescript
// ✅ 正确：在对应模块的 types/ 下新增
// src/business/expert/types/index.ts
export interface ExpertTask {
  id: string
  status: 'pending' | 'in_progress' | 'completed'
  assignee: string
}

// ❌ 错误：在页面组件内直接写 type
```

## 七、样式规范

### 7.1 TailwindCSS 使用

- 使用 `tailwind.config.js` 定义的主题色
- 避免硬编码颜色值（用 `text-gray-500` 而非 `#64748b`）
- 响应式：`sm:`, `md:`, `lg:`, `xl:` 前缀

### 7.2 组件样式隔离

- 组件样式用 TailwindCSS 类名
- 不使用 CSS Modules（保持简单）
- 避免 `!important`

## 八、Git 提交规范

```
feat: 新增功能
fix: 修复 bug
refactor: 重构
docs: 文档更新
chore: 构建/工具变更
```

**示例**：
```bash
git commit -m "feat(expert): 新增任务队列视图"
git commit -m "fix(risk): 修复风险卡片进度条显示异常"
```

## 九、开发流程约束

### 9.1 新增页面

1. 在 `src/business/{module}/pages/` 创建页面
2. 定义 Props 和 Mock 类型
3. 使用 `PageShell` 包裹内容
4. 在 `App.tsx` 添加路由
5. 提交前确认 Mock 数据完整

### 9.2 新增公共组件

1. 确认组件可跨模块复用
2. 放在 `src/components/{category}/`
3. 添加 Props 类型和默认值
4. 补充使用文档

### 9.3 新增业务模块

1. 在 `src/business/` 创建模块目录
2. 在 `src/types/role.ts` 添加业务线配置
3. 在 `App.tsx` 添加路由映射
4. 更新 README.md 的模块说明

## 十、AI 辅助开发约束

**给 AI 的指令模板**：

```
项目：QuickBI Dashboard Framework
任务：[描述你要做什么]
约束：
- 遵循 SPEC.md 规范
- 组件放对应目录
- 使用 TailwindCSS
- Props 必须有类型
- 不要修改其他模块
```

**禁止 AI 做的事**：
- ❌ 修改 `src/components/` 公共组件（除非明确要求）
- ❌ 修改 `src/types/` 类型定义（除非新增模块）
- ❌ 引入新的第三方库（需要讨论）
- ❌ 修改 `package.json`（需要讨论）

## 十一、现状记录

| 模块 | 状态 | 说明 |
|-----|------|------|
| quickbi | 完成 | CEO/产品/销售 三个角色 |
| emergency | 进行中 | 专家工作台、站长、政府领导 |
| expert | 进行中 | 履职任务、风险雷达 |
| government | 待定 | 预留模块 |

**待完善**：
- [ ] 统一图表组件封装
- [ ] 数据导出功能
- [ ] 单元测试
- [ ] CI/CD 流程

---

**最后更新**：2026-04-13
