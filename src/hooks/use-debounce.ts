'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseDebounceProps {
  value: any
  delay: number
  callback?: (value: any) => void
}

export function useDebounce({ value, delay, callback }: UseDebounceProps) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // Atualizar callback ref quando mudar
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Setar novo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
      if (callbackRef.current) {
        callbackRef.current(value)
      }
    }, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

// Hook para throttle de eventos
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now
        return callback(...args)
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now()
          callback(...args)
        }, delay - (now - lastCallRef.current))
      }
    }) as T,
    [callback, delay]
  )
}

// Hook para lazy loading de componentes
export function useLazyLoading(
  componentLoader: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ComponentType,
  delay: number = 200
) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadComponent = useCallback(async () => {
    if (Component) return

    setIsLoading(true)
    
    try {
      // Simular delay mínimo para melhor UX
      await new Promise(resolve => setTimeout(resolve, delay))
      const { default: LoadedComponent } = await componentLoader()
      setComponent(() => LoadedComponent)
    } catch (error) {
      console.error('Error loading component:', error)
    } finally {
      setIsLoading(false)
    }
  }, [componentLoader, Component, delay])

  useEffect(() => {
    loadComponent()
  }, [loadComponent])

  return { Component, isLoading, loadComponent }
}