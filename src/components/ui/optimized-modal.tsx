'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizedModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  showCloseButton?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]'
}

export function OptimizedModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true
}: OptimizedModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleOutsideClick)

    // Prevenir scroll no body quando modal está aberto
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleOutsideClick)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, closeOnOutsideClick, closeOnEscape])

  if (!isMounted || !isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop com animação suave */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={closeOnOutsideClick ? onClose : undefined}
      />
      
      {/* Modal Container */}
      <div
        ref={modalRef}
        className={cn(
          // Animação de entrada
          'relative transform transition-all duration-300 ease-out',
          'scale-95 opacity-0 animate-in fade-in-90 zoom-in-90',
          // Layout responsivo
          'w-full',
          sizeClasses[size],
          'bg-white rounded-lg shadow-xl border',
          'max-h-[90vh] overflow-hidden',
          className
        )}
        style={{
          // Forçar aceleração de hardware
          transform: 'translateZ(0)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 truncate pr-4">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg hover:bg-gray-100 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'flex-shrink-0'
                )}
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        )}

        {/* Content com scroll otimizado */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// Componente de Dialog otimizado para mobile
interface OptimizedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function OptimizedDialog({ open, onOpenChange, children, className }: OptimizedDialogProps) {
  return (
    <OptimizedModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      size="full"
      className={cn('md:max-w-lg', className)}
      showCloseButton={true}
    >
      {children}
    </OptimizedModal>
  )
}