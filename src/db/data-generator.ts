/**
 * ⚠️ 旧版数据生成器
 * 
 * 此文件已废弃，请使用新的数据层：
 * - src/db/types.ts      - 类型定义
 * - src/db/generator.ts  - 数据生成器
 * - src/db/memory-db.ts  - 内存数据库
 * - src/db/index.ts      - 统一导出
 * 
 * 新的数据层包含完整的应急管理数据模型（200家企业、12位专家、8个工作组等）
 * 
 * 保留此文件仅用于旧代码兼容
 */

export * from './generator'
export * from './memory-db'
export * from './types'
