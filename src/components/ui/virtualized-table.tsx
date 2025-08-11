'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface VirtualizedTableProps<T> {
  data: T[]
  columns: {
    key: keyof T
    header: string
    render?: (value: any, item: T) => React.ReactNode
    className?: string
    width?: string
  }[]
  rowHeight?: number
  containerHeight?: number
  className?: string
  loading?: boolean
  onRowClick?: (item: T) => void
  getKey?: (item: T) => string | number
}

export function VirtualizedTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 400,
  className = '',
  loading = false,
  onRowClick,
  getKey = (item: T, index: number) => index
}: VirtualizedTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  // Calcular itens visíveis
  const { visibleItems, startIndex, endIndex, totalHeight } = useMemo(() => {
    const totalHeight = data.length * rowHeight
    const startIndex = Math.floor(scrollTop / rowHeight)
    const endIndex = Math.min(
      data.length - 1,
      startIndex + Math.ceil(containerHeight / rowHeight) + 1
    )
    
    const visibleItems = data.slice(startIndex, endIndex + 1)

    return { visibleItems, startIndex, endIndex, totalHeight }
  }, [data, scrollTop, rowHeight, containerHeight])

  // Otimizar scroll com throttle
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop
    setScrollTop(scrollTop)
    
    if (!isScrolling) {
      setIsScrolling(true)
      requestAnimationFrame(() => setIsScrolling(false))
    }
  }, [isScrolling])

  // Renderizar célula
  const renderCell = useCallback((item: T, column: typeof columns[0]) => {
    const value = item[column.key]
    
    if (column.render) {
      return column.render(value, item)
    }
    
    return String(value ?? '')
  }, [])

  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <div className="animate-pulse space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2">
              {columns.map((_, j) => (
                <div
                  key={j}
                  className="h-8 bg-gray-200 rounded flex-1"
                  style={{ animationDelay: `${j * 0.1}s` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white', className)}>
      {/* Header fixo */}
      <div className="bg-gray-50 border-b">
        <div className="flex">
          {columns.map((column) => (
            <div
              key={String(column.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium text-gray-700 border-r last:border-r-0',
                column.className
              )}
              style={{ width: column.width }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Container virtualizado */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative overflow-auto"
        style={{ height: containerHeight }}
      >
        {/* Espaço total para scroll */}
        <div style={{ height: totalHeight }} />

        {/* Itens visíveis */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            transform: `translateY(${startIndex * rowHeight}px)`,
            willChange: 'transform'
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index
            const key = getKey(item, actualIndex)
            
            return (
              <div
                key={String(key)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'flex border-b hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                style={{ height: rowHeight }}
              >
                {columns.map((column) => (
                  <div
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-2 text-sm text-gray-900 border-r last:border-r-0 flex items-center',
                      column.className
                    )}
                    style={{ width: column.width }}
                  >
                    {renderCell(item, column)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer com informações */}
      <div className="bg-gray-50 border-t px-4 py-2 text-xs text-gray-500 flex justify-between">
        <span>Mostrando {visibleItems.length} de {data.length} itens</span>
        <span>
          Posição: {startIndex + 1}-{endIndex + 1}
        </span>
      </div>
    </div>
  )
}

// Componente de tabela paginada otimizada
interface PaginatedTableProps<T> {
  data: T[]
  columns: {
    key: keyof T
    header: string
    render?: (value: any, item: T) => React.ReactNode
    className?: string
  }[]
  itemsPerPage?: number
  className?: string
  onRowClick?: (item: T) => void
  getKey?: (item: T) => string | number
}

export function PaginatedTable<T>({
  data,
  columns,
  itemsPerPage = 20,
  className = '',
  onRowClick,
  getKey = (item: T, index: number) => index
}: PaginatedTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const pageData = data.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 border-b">
          <div className="flex">
            {columns.map((column) => (
              <div
                key={String(column.key)}
                className={cn(
                  'px-4 py-3 text-sm font-medium text-gray-700 border-r last:border-r-0',
                  column.className
                )}
              >
                {column.header}
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {pageData.map((item, index) => {
            const actualIndex = startIndex + index
            const key = getKey(item, actualIndex)
            
            return (
              <div
                key={String(key)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'flex hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((column) => (
                  <div
                    key={String(column.key)}
                    className={cn(
                      'px-4 py-3 text-sm text-gray-900 border-r last:border-r-0 flex items-center',
                      column.className
                    )}
                  >
                    {column.render 
                      ? column.render(item[column.key], item)
                      : String(item[column.key] ?? '')
                    }
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1}-{Math.min(endIndex, data.length)} de {data.length} itens
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={cn(
                'px-3 py-1 text-sm border rounded',
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              Anterior
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      'px-3 py-1 text-sm border rounded',
                      currentPage === page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={cn(
                'px-3 py-1 text-sm border rounded',
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  )
}