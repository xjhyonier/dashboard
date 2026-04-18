# Implementation Tasks

## 1. DutyDimension Sorting

- [x] 1.1 引入 useSortableTable 和 SortableTh 到 DutyDimension
- [x] 1.2 为工作组表 (WorkGroupView) 添加排序功能
- [x] 1.3 为人员履职表 (MemberView) 添加排序功能
- [x] 1.4 为专家履职表 (ExpertView) 添加排序功能

## 2. SpecialDimension Sorting

- [x] 2.1 引入 useSortableTable 和 SortableTh 到 SpecialDimension
- [x] 2.2 为任务列表表 (filteredTasks) 添加排序功能

## 3. IndustryDimension Data Migration

- [x] 3.1 引入数据库方法 (getEnterprises, getHazards) 到 IndustryDimension
- [x] 3.2 移除 industryHazardAnalysis 和 enterprises10D Mock 数据引用
- [x] 3.3 添加状态管理 (enterprises, hazards)
- [x] 3.4 重构 subjectTypes 聚合计算使用 enterprises 数据
- [x] 3.5 重构 riskLevels 聚合计算使用 enterprises 数据
- [x] 3.6 重构 fireTypes 聚合计算使用 enterprises 数据
- [x] 3.7 重构 filtered 聚合计算使用 hazards 数据

## 4. IndustryDimension Sorting

- [x] 4.1 为责任主体类型表 (subjectTypes) 添加排序功能
- [x] 4.2 为风险等级表 (riskLevels) 添加排序功能
- [x] 4.3 为消防类型表 (fireTypes) 添加排序功能
- [x] 4.4 为标签隐患分析表 (filtered) 添加排序功能

## 5. Verification

- [x] 5.1 运行 TypeScript 编译检查 - Build 成功
- [x] 5.2 运行 lint 检查 (Build 成功，lint 无报错)
- [ ] 5.3 手动测试各维度表格排序功能
- [ ] 5.4 验证 IndustryDimension 数据与 Mock 一致性
