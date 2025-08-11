'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch'
import { cn } from '@/lib/utils'

interface OptimizedSearchInputProps<T> {
  items: T[]
  searchFields: (keyof T)[]
  onSearchChange?: (results: T[], searchTerm: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
  minSearchLength?: number
  maxResults?: number
  showResultsCount?: boolean
  showClearButton?: boolean
  disabled?: boolean
  caseSensitive?: boolean
  renderResult?: (item: T, index: number) => React.ReactNode
  onResultClick?: (item: T) => void
  maxDropdownHeight?: string
}

export function OptimizedSearchInput<T>({
  items,
  searchFields,
  onSearchChange,
  placeholder = "Buscar...",
  className = "",
  debounceMs = 300,
  minSearchLength = 2,
  maxResults = 50,
  showResultsCount = true,
  showClearButton = true,
  disabled = false,
  caseSensitive = false,
  renderResult,
  onResultClick,
  maxDropdownHeight = "300px"
}: OptimizedSearchInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false)
  
  const {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    hasResults,
    resultCount,
    totalCount
  } = useOptimizedSearch(items, searchFields, {
    debounceMs,
    minSearchLength,
    maxResults,
    caseSensitive
  })

  // Notificar pai quando os resultados mudarem
  useMemo(() => {
    onSearchChange?.(results, searchTerm)
  }, [results, searchTerm, onSearchChange])

  const handleClear = useCallback(() => {
    setSearchTerm('')
  }, [setSearchTerm])

  const handleResultClick = useCallback((item: T) => {
    onResultClick?.(item)
    setIsFocused(false)
  }, [onResultClick])

  const defaultRenderResult = useCallback((item: T, index: number) => {
    const firstFieldValue = searchFields.length > 0 ? String(item[searchFields[0]] || '') : ''
    return (
      <div className="px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
        <div className="text-sm font-medium text-gray-900 truncate">
          {firstFieldValue}
        </div>
        {searchFields.length > 1 && (
          <div className="text-xs text-gray-500 truncate">
            {searchFields.slice(1).map(field => String(item[field] || '')).join(' • ')}
          </div>
        )}
      </div>
    )
  }, [searchFields])

  return (
    <div className={cn("relative", className)}>
      {/* Input de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className={cn(
            "pl-10 pr-10",
            isSearching && "pr-12",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        />
        
        {/* Indicador de carregamento */}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
        )}
        
        {/* Botão de limpar */}
        {showClearButton && searchTerm && !isSearching && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      {showResultsCount && searchTerm && (
        <div className="mt-1 text-xs text-gray-500">
          {isSearching ? (
            <span>Buscando...</span>
          ) : (
            <span>
              {resultCount} de {totalCount} resultados
            </span>
          )}
        </div>
      )}

      {/* Dropdown de resultados */}
      {isFocused && hasResults && searchTerm.length >= minSearchLength && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden",
          "max-h-[300px]"
        )}>
          <div 
            className="overflow-y-auto optimized-scrollbar"
            style={{ maxHeight: maxDropdownHeight }}
          >
            {results.map((item, index) => (
              <div key={index} onClick={() => handleResultClick(item)}>
                {renderResult ? renderResult(item, index) : defaultRenderResult(item, index)}
              </div>
            ))}
          </div>
          
          {resultCount >= maxResults && (
            <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
              Mostrando os primeiros {maxResults} resultados
            </div>
          )}
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {isFocused && searchTerm.length >= minSearchLength && !hasResults && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="text-center text-sm text-gray-500">
            Nenhum resultado encontrado para "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para busca rápida com filtros pré-definidos
interface QuickSearchProps<T> {
  items: T[]
  searchFields: (keyof T)[]
  quickFilters?: Array<{
    label: string
    value: string
    field: keyof T
  }>
  onFilterChange?: (filter: string | null) => void
  onSearchChange?: (results: T[], searchTerm: string) => void
  placeholder?: string
  className?: string
}

export function QuickSearch<T>({
  items,
  searchFields,
  quickFilters,
  onFilterChange,
  onSearchChange,
  placeholder = "Buscar...",
  className = ""
}: QuickSearchProps<T>) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  
  const handleFilterClick = useCallback((filter: string | null) => {
    setActiveFilter(filter)
    onFilterChange?.(filter)
  }, [onFilterChange])

  return (
    <div className={cn("space-y-2", className)}>
      {/* Filtros rápidos */}
      {quickFilters && quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(null)}
            className="text-xs"
          >
            Todos
          </Button>
          {quickFilters.map((filter, index) => (
            <Button
              key={index}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick(filter.value)}
              className="text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input de pesquisa otimizado */}
      <OptimizedSearchInput
        items={items}
        searchFields={searchFields}
        onSearchChange={onSearchChange}
        placeholder={placeholder}
        debounceMs={200}
        minSearchLength={1}
        maxResults={20}
        showResultsCount={false}
      />
    </div>
  )
}