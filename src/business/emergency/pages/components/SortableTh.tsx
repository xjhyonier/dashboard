import { thStyle } from './styles'

interface SortableThProps {
  label: string
  sortKey: string
  sort: { key: string | null; direction: 'asc' | 'desc' | null }
  onSort: (key: string) => void
  colSpan?: number
  rowSpan?: number
  tooltip?: string
}

export function SortableTh({ label, sortKey, sort, onSort, colSpan, rowSpan, tooltip }: SortableThProps) {
  const isActive = sort.key === sortKey
  const icon = isActive ? (sort.direction === 'desc' ? '↓' : '↑') : '⇅'
  return (
    <th
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(sortKey)}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <span>{label}</span>
        {tooltip && (
          <span
            title={tooltip}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 13, height: 13, borderRadius: '50%', background: '#6B7280',
              color: 'white', fontSize: 9, fontWeight: 700, cursor: 'help',
              verticalAlign: 'middle', flexShrink: 0,
            }}
          >!</span>
        )}
        <span style={{ fontSize: 10, color: isActive ? '#059669' : '#D1D5DB' }}>{icon}</span>
      </div>
    </th>
  )
}
