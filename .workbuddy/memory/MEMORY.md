# 项目开发注意事项

## recharts Bar 组件颜色排序
- **recharts ComposedChart 中多个 Bar 组件存在"左旋渲染"问题**：JSX 声明顺序与 DOM 实际渲染顺序不一致。
- **规律**：DOM 中的 Bar 顺序 = JSX 声明顺序向左旋转 1 位（即第一个声明的 Bar 会渲染到最后一个位置，其余依次前移）。
- **示例**：若要视觉从左到右为 A/B/C/D，JSX 声明应为 D/A/B/C。
- **验证方法**：通过查询 `.recharts-bar` 的 DOM 元素中的 `path[fill]` 来确认实际渲染顺序。
