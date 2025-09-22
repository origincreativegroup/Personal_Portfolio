import { ReactNode, forwardRef, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../shared/utils'
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal, ArrowLeft, ArrowRight } from 'lucide-react'
import ModernInput from './ModernInput'
import ModernButton from './ModernButton'

// ===== TYPES =====

export interface Column<T = any> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (value: any, record: T, index: number) => ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
  fixed?: 'left' | 'right'
}

export interface DataTableProps<T = any> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
    pageSizeOptions?: number[]
  }
  onPaginationChange?: (page: number, pageSize: number) => void
  sorting?: {
    field: string
    order: 'asc' | 'desc'
  }
  onSortChange?: (field: string, order: 'asc' | 'desc') => void
  filtering?: {
    field: string
    value: string
  }
  onFilterChange?: (field: string, value: string) => void
  selection?: {
    selectedRowKeys: string[]
    onSelectionChange: (selectedRowKeys: string[], selectedRows: T[]) => void
    getCheckboxProps?: (record: T) => { disabled?: boolean }
  }
  rowKey?: keyof T | ((record: T) => string)
  className?: string
  // Visual props
  variant?: 'default' | 'bordered' | 'striped' | 'hover'
  size?: 'sm' | 'md' | 'lg'
  stickyHeader?: boolean
  // Animation props
  animate?: boolean
  stagger?: number
  // Accessibility
  'aria-label'?: string
}

// ===== UTILITIES =====

const getRowKey = <T,>(record: T, rowKey?: keyof T | ((record: T) => string), index?: number): string => {
  if (typeof rowKey === 'function') {
    return rowKey(record)
  }
  if (rowKey && record[rowKey]) {
    return String(record[rowKey])
  }
  return String(index || 0)
}

const sortData = <T,>(data: T[], field: string, order: 'asc' | 'desc'): T[] => {
  return [...data].sort((a, b) => {
    const aValue = (a as any)[field]
    const bValue = (b as any)[field]
    
    if (aValue === bValue) return 0
    
    const comparison = aValue < bValue ? -1 : 1
    return order === 'asc' ? comparison : -comparison
  })
}

const filterData = <T,>(data: T[], field: string, value: string): T[] => {
  if (!value) return data
  
  return data.filter(record => {
    const fieldValue = (record as any)[field]
    return String(fieldValue).toLowerCase().includes(value.toLowerCase())
  })
}

// ===== DATA TABLE =====

export const DataTable = <T,>({
  data,
  columns,
  loading = false,
  pagination,
  onPaginationChange,
  sorting,
  onSortChange,
  filtering,
  onFilterChange,
  selection,
  rowKey = 'id',
  className = '',
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  animate = true,
  stagger = 0.05,
  'aria-label': ariaLabel,
}: DataTableProps<T>) => {
  const [localSorting, setLocalSorting] = useState<{ field: string; order: 'asc' | 'desc' } | null>(null)
  const [localFiltering, setLocalFiltering] = useState<{ field: string; value: string } | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>(selection?.selectedRowKeys || [])

  // Process data
  const processedData = useMemo(() => {
    let result = [...data]

    // Apply filtering
    if (localFiltering) {
      result = filterData(result, localFiltering.field, localFiltering.value)
    } else if (filtering) {
      result = filterData(result, filtering.field, filtering.value)
    }

    // Apply sorting
    if (localSorting) {
      result = sortData(result, localSorting.field, localSorting.order)
    } else if (sorting) {
      result = sortData(result, sorting.field, sorting.order)
    }

    return result
  }, [data, localFiltering, filtering, localSorting, sorting])

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData

    const { current, pageSize } = pagination
    const start = (current - 1) * pageSize
    const end = start + pageSize

    return processedData.slice(start, end)
  }, [processedData, pagination])

  // Handle sorting
  const handleSort = useCallback((field: string) => {
    const currentSort = localSorting || sorting
    const newOrder = currentSort?.field === field && currentSort?.order === 'asc' ? 'desc' : 'asc'
    
    setLocalSorting({ field, order: newOrder })
    onSortChange?.(field, newOrder)
  }, [localSorting, sorting, onSortChange])

  // Handle filtering
  const handleFilter = useCallback((field: string, value: string) => {
    setLocalFiltering({ field, value })
    onFilterChange?.(field, value)
  }, [onFilterChange])

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    const keys = paginatedData.map((record, index) => getRowKey(record, rowKey, index))
    const newSelectedKeys = checked ? keys : []
    
    setSelectedRowKeys(newSelectedKeys)
    selection?.onSelectionChange(newSelectedKeys, checked ? paginatedData : [])
  }, [paginatedData, rowKey, selection])

  const handleSelectRow = useCallback((record: T, checked: boolean) => {
    const key = getRowKey(record, rowKey)
    const newSelectedKeys = checked
      ? [...selectedRowKeys, key]
      : selectedRowKeys.filter(k => k !== key)
    
    setSelectedRowKeys(newSelectedKeys)
    const selectedRows = paginatedData.filter((r, index) => 
      newSelectedKeys.includes(getRowKey(r, rowKey, index))
    )
    selection?.onSelectionChange(newSelectedKeys, selectedRows)
  }, [selectedRowKeys, paginatedData, rowKey, selection])

  // Variant styles
  const variantClasses = {
    default: 'border border-gray-200 dark:border-gray-700',
    bordered: 'border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700',
    striped: 'border border-gray-200 dark:border-gray-700',
    hover: 'border border-gray-200 dark:border-gray-700',
  }

  // Size styles
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const cellPaddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {columns.some(col => col.filterable) && (
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <ModernInput
              placeholder="Search..."
              value={localFiltering?.value || ''}
              onChange={(e) => {
                const field = localFiltering?.field || columns.find(col => col.filterable)?.key || ''
                handleFilter(field, e.target.value)
              }}
              leftIcon={<Search className="h-4 w-4" />}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className={cn(
            'w-full border-collapse',
            variantClasses[variant],
            sizeClasses[size]
          )}
          aria-label={ariaLabel}
        >
          {/* Header */}
          <thead className={cn('bg-gray-50 dark:bg-gray-800', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {/* Selection column */}
              {selection && (
                <th className={cn('px-4 py-3 text-left', cellPaddingClasses[size])}>
                  <input
                    type="checkbox"
                    checked={selectedRowKeys.length === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
              )}

              {/* Data columns */}
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-gray-900 dark:text-gray-100',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700',
                    column.className,
                    cellPaddingClasses[size]
                  )}
                  style={{ width: column.width }}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3',
                            (localSorting || sorting)?.field === column.key && 
                            (localSorting || sorting)?.order === 'asc'
                              ? 'text-primary-500'
                              : 'text-gray-400'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 -mt-1',
                            (localSorting || sorting)?.field === column.key && 
                            (localSorting || sorting)?.order === 'desc'
                              ? 'text-primary-500'
                              : 'text-gray-400'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white dark:bg-gray-900">
            <AnimatePresence mode="popLayout">
              {paginatedData.map((record, rowIndex) => {
                const key = getRowKey(record, rowKey, rowIndex)
                const isSelected = selectedRowKeys.includes(key)
                const checkboxProps = selection?.getCheckboxProps?.(record) || {}

                return (
                  <motion.tr
                    key={key}
                    initial={animate ? { opacity: 0, y: 20 } : {}}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: rowIndex * stagger }}
                    className={cn(
                      'border-b border-gray-200 dark:border-gray-700',
                      variant === 'striped' && rowIndex % 2 === 1 && 'bg-gray-50 dark:bg-gray-800',
                      variant === 'hover' && 'hover:bg-gray-50 dark:hover:bg-gray-800',
                      isSelected && 'bg-primary-50 dark:bg-primary-900/20'
                    )}
                  >
                    {/* Selection cell */}
                    {selection && (
                      <td className={cn('px-4 py-3', cellPaddingClasses[size])}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(record, e.target.checked)}
                          disabled={checkboxProps.disabled}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                        />
                      </td>
                    )}

                    {/* Data cells */}
                    {columns.map((column) => {
                      const value = column.dataIndex ? (record as any)[column.dataIndex] : (record as any)[column.key]
                      const content = column.render ? column.render(value, record, rowIndex) : value

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3 text-gray-900 dark:text-gray-100',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.className,
                            cellPaddingClasses[size]
                          )}
                          style={{ width: column.width }}
                        >
                          {content}
                        </td>
                      )
                    })}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>

          <div className="flex items-center space-x-2">
            {/* Page size changer */}
            {pagination.showSizeChanger && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => onPaginationChange?.(1, Number(e.target.value))}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {(pagination.pageSizeOptions || [10, 20, 50, 100]).map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pagination controls */}
            <div className="flex items-center space-x-1">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => onPaginationChange?.(pagination.current - 1, pagination.pageSize)}
                disabled={pagination.current <= 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </ModernButton>

              {/* Page numbers */}
              {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                .filter(page => {
                  const current = pagination.current
                  return page === 1 || page === Math.ceil(pagination.total / pagination.pageSize) || 
                         (page >= current - 2 && page <= current + 2)
                })
                .map((page, index, array) => (
                  <div key={page} className="flex items-center">
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <ModernButton
                      variant={page === pagination.current ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => onPaginationChange?.(page, pagination.pageSize)}
                    >
                      {page}
                    </ModernButton>
                  </div>
                ))}

              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => onPaginationChange?.(pagination.current + 1, pagination.pageSize)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ArrowRight className="h-4 w-4" />
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
