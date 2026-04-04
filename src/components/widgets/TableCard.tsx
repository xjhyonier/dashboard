interface TableCardProps {
  title: string
  columns: Array<{ key: string; label: string; width?: string }>
  data: Array<Record<string, any>>
  maxRows?: number
}

export function TableCard({ 
  title, 
  columns, 
  data,
  maxRows = 10 
}: TableCardProps) {
  const displayData = data.slice(0, maxRows)

  return (
    <div className="card">
      <div className="text-sm text-text-secondary font-medium mb-4">
        {title}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left text-xs font-medium text-text-tertiary 
                           uppercase tracking-wider py-2 px-3"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="text-sm text-text py-3 px-3"
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {data.length > maxRows && (
          <div className="text-center py-2 text-xs text-text-tertiary border-t border-border">
            显示前 {maxRows} 条，共 {data.length} 条
          </div>
        )}
      </div>
    </div>
  )
}
