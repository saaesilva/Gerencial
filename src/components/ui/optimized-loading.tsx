'use client'

import { cn } from '@/lib/utils'

interface OptimizedLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'skeleton' | 'dots'
  className?: string
  text?: string
}

export function OptimizedLoading({ 
  size = 'md', 
  variant = 'spinner', 
  className = '',
  text 
}: OptimizedLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('animate-pulse space-y-3', className)}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        {text && <div className="h-4 bg-gray-200 rounded w-full"></div>}
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-current rounded-full animate-bounce',
              sizeClasses[size],
              textClasses[text ? 'md' : size]
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s'
            }}
          />
        ))}
        {text && <span className={cn('ml-2 text-gray-600', textClasses[size])}>{text}</span>}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('animate-spin', sizeClasses[size])}>
        <svg className="w-full h-full text-current" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {text && <span className={cn('text-gray-600', textClasses[size])}>{text}</span>}
    </div>
  )
}

// Componente de loading para tabelas
interface TableLoadingProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableLoading({ rows = 5, columns = 6, className = '' }: TableLoadingProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {[...Array(columns)].map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded flex-1 animate-pulse"
              style={{
                animationDelay: `${(rowIndex * columns + colIndex) * 0.05}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Componente de card de loading otimizado
interface CardLoadingProps {
  lines?: number
  className?: string
}

export function CardLoading({ lines = 3, className = '' }: CardLoadingProps) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${Math.max(30, 100 - i * 20)}%`,
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}