# 项目开发注意事项

## 修改记录自动维护
- 对 `StationChiefV2Dashboard.tsx` 的任何 UI/功能修改，完成后自动在 `changeLogItems` state 中追加一条记录
- 记录格式：`{ id: N+1, date: 'YYYY-MM-DD', location: '模块名称', content: '修改描述', editing: false }`
- 位置指被修改的模块/区域（如"全局筛选栏"、"全局指标卡"、"趋势图"、"组织与人员维度"等）

## recharts Bar 组件颜色排序
- **最终结论（2026-08-11 双重确认：headless playwright 实测 + 用户浏览器反馈）**：recharts v3.8.1 中 **Bar 视觉渲染顺序 = JSX 声明顺序，无任何旋转偏移**。需要什么视觉顺序，JSX 就按什么顺序声明。
- **教训**：早前记录的"左旋 1 位"规律（旧版本/误判）曾导致反复错误补偿。**遇到顺序问题先看真实渲染结果，不要凭旧记忆**。
- **图例/浮窗顺序统一**：自定义 `<Legend content={<OrderedLegend order={[...]} />} />` 与 `<Tooltip content={<OrderedTooltip order={[...]} />} />`，按目标顺序重排 payload。
- **切换分类后顺序稳定**：ComposedChart 加 `key={分类}`，切换时整体重建图表，避免 recharts 内部状态导致顺序漂移。
