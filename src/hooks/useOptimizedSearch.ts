import { useState, useEffect, useCallback, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

export function useOptimizedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  options: {
    debounceMs?: number
    minSearchLength?: number
    maxResults?: number
    caseSensitive?: boolean
  } = {}
) {
  const {
    debounceMs = 300,
    minSearchLength = 2,
    maxResults = 100,
    caseSensitive = false
  } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<T[]>([])
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs)

  // Função de busca otimizada
  const performSearch = useCallback((term: string, data: T[]) => {
    if (!term || term.length < minSearchLength) {
      setResults(data.slice(0, maxResults))
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    
    // Usar requestAnimationFrame para não bloquear a UI
    requestAnimationFrame(() => {
      try {
        const searchLower = caseSensitive ? term : term.toLowerCase()
        
        const filtered = data.filter(item => {
          return searchFields.some(field => {
            const value = item[field]
            if (value == null) return false
            
            const stringValue = String(value)
            const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase()
            
            return searchValue.includes(searchLower)
          })
        })

        setResults(filtered.slice(0, maxResults))
      } catch (error) {
        console.error('Erro na busca:', error)
        setResults(data.slice(0, maxResults))
      } finally {
        setIsSearching(false)
      }
    })
  }, [searchFields, minSearchLength, maxResults, caseSensitive])

  // Efeito para realizar a busca quando o termo mudar
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(debouncedSearchTerm, items)
    }, debounceMs)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [debouncedSearchTerm, items, performSearch, debounceMs])

  // Resetar resultados quando os itens mudarem
  useEffect(() => {
    if (!searchTerm) {
      setResults(items.slice(0, maxResults))
    }
  }, [items, searchTerm, maxResults])

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    hasResults: results.length > 0,
    resultCount: results.length,
    totalCount: items.length
  }
}

// Hook para busca com memoização avançada
export function useMemoizedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  options: {
    debounceMs?: number
    minSearchLength?: number
    maxResults?: number
    caseSensitive?: number
  } = {}
) {
  const searchHook = useOptimizedSearch(items, searchFields, options)
  
  // Memoizar resultados para evitar re-renders desnecessários
  const memoizedResults = useMemo(() => searchHook.results, [searchHook.results])
  
  return {
    ...searchHook,
    results: memoizedResults
  }
}