import { useState, useMemo } from 'react'
import type { SortState } from './types'

export function useSortableTable<T>(data: T[], defaultSortKey?: keyof T, defaultDirection: 'asc' | 'desc' = 'desc') {
  const [sort, setSort] = useState<SortState<T>>({
    key: defaultSortKey || null,
    direction: defaultSortKey ? defaultDirection : null,
  })

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sort.key!]
      const bVal = (b as any)[sort.key!]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sort.direction === 'asc' ? -1 : 1
      if (bVal == null) return sort.direction === 'asc' ? 1 : -1
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal, 'zh-CN') : bVal.localeCompare(aVal, 'zh-CN')
      }
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sort])

  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev.key !== key) return { key: key as keyof T, direction: 'desc' }
      if (prev.direction === 'desc') return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key: null, direction: null }
      return { key: key as keyof T, direction: 'desc' }
    })
  }

  const getSortIcon = (key: keyof T) => {
    if (sort.key !== key) return '⇅'
    if (sort.direction === 'desc') return '↓'
    return '↑'
  }

  return { sortedData, sort, handleSort, getSortIcon }
}
