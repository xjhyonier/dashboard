// 导出工具函数

/**
 * 导出数据为 CSV 文件并下载
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  filename: string
) {
  if (data.length === 0) {
    alert('没有数据可导出')
    return
  }

  // 构建 CSV 头
  const headers = columns.map(col => `"${col.label}"`).join(',')

  // 构建 CSV 数据行
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key]
      // 处理值为对象、数组或特殊字符的情况
      if (value === null || value === undefined) return '""'
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"` 
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  )

  // 合并
  const csv = [headers, ...rows].join('\n')

  // 添加 BOM 以支持 Excel 正确识别 UTF-8
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  
  // 创建下载链接
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  // 清理
  URL.revokeObjectURL(link.href)
}

/**
 * 生成导出按钮样式
 */
export const exportButtonStyle: React.CSSProperties = {
  padding: '4px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
  background: 'white',
  color: '#374151',
  fontSize: 12,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}
