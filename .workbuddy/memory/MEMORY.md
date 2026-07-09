# 项目开发注意事项

## 修改记录自动维护
- 对 `StationChiefV2Dashboard.tsx` 的任何 UI/功能修改，完成后自动在 `changeLogItems` state 中追加一条记录
- 记录格式：`{ id: N+1, date: 'YYYY-MM-DD', location: '模块名称', content: '修改描述', editing: false }`
- 位置指被修改的模块/区域（如"全局筛选栏"、"全局指标卡"、"趋势图"、"组织与人员维度"等）

## recharts Bar 组件颜色排序
- **recharts ComposedChart 中多个 Bar 组件存在"左旋渲染"问题**：JSX 声明顺序与 DOM 实际渲染顺序不一致。
- **规律**：DOM 中的 Bar 顺序 = JSX 声明顺序向左旋转 1 位（即第一个声明的 Bar 会渲染到最后一个位置，其余依次前移）。
- **示例**：若要视觉从左到右为 A/B/C/D，JSX 声明应为 D/A/B/C。
- **验证方法**：通过查询 `.recharts-bar` 的 DOM 元素中的 `path[fill]` 来确认实际渲染顺序。
