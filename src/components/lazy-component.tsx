'use client'

import { useState, useEffect, Suspense } from 'react'
import { OptimizedLoading } from '@/components/ui/optimized-loading'

interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number
}

export function LazyComponent({ 
  children, 
  fallback, 
  delay = 200 
}: LazyComponentProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!shouldRender) {
    return fallback || <OptimizedLoading variant="skeleton" />
  }

  return <Suspense fallback={fallback || <OptimizedLoading variant="skeleton" />}>
    {children}
  </Suspense>
}

// Componente para lazy loading de abas
interface LazyTabProps {
  children: React.ReactNode
  isActive: boolean
  fallback?: React.ReactNode
}

export function LazyTab({ children, isActive, fallback }: LazyTabProps) {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isActive && !shouldRender) {
      const timer = setTimeout(() => {
        setShouldRender(true)
      }, 100) // Delay mínimo para melhor UX

      return () => clearTimeout(timer)
    }
  }, [isActive, shouldRender])

  if (!isActive) {
    return null
  }

  if (!shouldRender) {
    return fallback || <OptimizedLoading variant="skeleton" lines={5} />
  }

  return <Suspense fallback={fallback || <OptimizedLoading variant="skeleton" lines={5} />}>
    {children}
  </Suspense>
}