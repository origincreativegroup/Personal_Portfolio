import { ReactNode, forwardRef, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../shared/utils'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'alert' | 'success' | 'warning' | 'error'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  className?: string
  // Animation props
  animate?: boolean
  // Accessibility
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(({
  children,
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  animate = true,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}, ref) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Size classes
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  }

  // Variant styles
  const variantStyles = {
    default: {
      icon: null,
      iconColor: '',
      borderColor: 'border-gray-200 dark:border-gray-700'
    },
    alert: {
      icon: AlertCircle,
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-200 dark:border-blue-700'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      borderColor: 'border-green-200 dark:border-green-700'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      borderColor: 'border-yellow-200 dark:border-yellow-700'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      borderColor: 'border-red-200 dark:border-red-700'
    }
  }

  const currentVariant = variantStyles[variant]
  const IconComponent = currentVariant.icon

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      setIsVisible(true)
      setIsAnimating(true)
      
      // Focus the modal after animation starts
      setTimeout(() => {
        modalRef.current?.focus()
      }, 10)
    } else {
      setIsAnimating(false)
      // Return focus to previous element
      setTimeout(() => {
        previousActiveElement.current?.focus()
        setIsVisible(false)
      }, 300)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closeOnEscape, onClose])

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle focus trap
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isOpen])

  if (!isVisible) return null

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        animate && 'transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-xl shadow-xl',
          'border border-gray-200 dark:border-gray-700',
          sizeClasses[size],
          'w-full max-h-[90vh] overflow-hidden',
          animate && 'transition-all duration-300 transform',
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
          currentVariant.borderColor,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {IconComponent && (
                <IconComponent className={cn('h-5 w-5', currentVariant.iconColor)} />
              )}
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )

  // Render modal in portal
  return createPortal(modalContent, document.body)
})

Modal.displayName = 'Modal'

// Dialog sub-components for better composition
export const DialogHeader = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(({
  children,
  className = '',
}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700', className)}
  >
    {children}
  </div>
))

DialogHeader.displayName = 'DialogHeader'

export const DialogTitle = forwardRef<HTMLHeadingElement, { children: ReactNode; className?: string }>(({
  children,
  className = '',
}, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)}
  >
    {children}
  </h2>
))

DialogTitle.displayName = 'DialogTitle'

export const DialogDescription = forwardRef<HTMLParagraphElement, { children: ReactNode; className?: string }>(({
  children,
  className = '',
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-400 mt-1', className)}
  >
    {children}
  </p>
))

DialogDescription.displayName = 'DialogDescription'

export const DialogContent = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(({
  children,
  className = '',
}, ref) => (
  <div
    ref={ref}
    className={cn('p-6 overflow-y-auto max-h-[calc(90vh-120px)]', className)}
  >
    {children}
  </div>
))

DialogContent.displayName = 'DialogContent'

export const DialogFooter = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(({
  children,
  className = '',
}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700', className)}
  >
    {children}
  </div>
))

DialogFooter.displayName = 'DialogFooter'

export default Modal