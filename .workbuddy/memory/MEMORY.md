# 项目开发注意事项

## 修改记录自动维护
- 对 `StationChiefV2Dashboard.tsx` 的任何 UI/功能修改，完成后自动在 `changeLogItems` state 中追加一条记录
- 记录格式：`{ id: N+1, date: 'YYYY-MM-DD', location: '模块名称', content: '修改描述', editing: false }`
- 位置指被修改的模块/区域（如"全局筛选栏"、"全局指标卡"、"趋势图"、"组织与人员维度"等）

## recharts Bar 组件颜色排序
- **真实浏览器（用户环境）结论**：ComposedChart 中多个 Bar 的 **视觉 x 顺序 = JSX 声明顺序向左旋转 1 位**（JSX[A,B,C,D] → 视觉[B,C,D,A]）。若要视觉从左到右为目标顺序 [X,Y,Z]，JSX 应声明为 [Z,X,Y]（目标顺序的左旋反向）。
- **headless Chrome 例外**：无头浏览器渲染时无左旋，视觉 = JSX 声明顺序。**不要用 headless 验证 Bar 视觉顺序**——只有真实浏览器（带 GPU 渲染）才会触发左旋。
- **验证方法**：用真实有头浏览器打开页面查看，或用 playwright launch headless: false（若环境支持）。用 `.recharts-rectangle` 的 getBoundingClientRect().left 排序在真实浏览器中可复现视觉顺序。
- **图例/浮窗顺序统一方案**：用自定义 `<Legend content={<OrderedLegend order={[...]} />} />` 与 `<Tooltip content={<OrderedTooltip order={[...]} />} />`，按目标顺序重排 payload，与 Bar 视觉顺序对齐。
- **历史误判（2026-08-11）**：曾用 headless Chrome 测得"无左旋"，据此去掉左旋补偿，导致用户浏览器顺序错乱。**以真实浏览器为准**。
