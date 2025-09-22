import { ReactNode, createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../shared/utils'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import ModernButton from './ModernButton'

// ===== TYPES =====

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

// ===== CONTEXT =====

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ===== PROVIDER =====

interface ToastProviderProps {
  children: ReactNode
  maxToasts?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const ToastProvider = ({ 
  children, 
  maxToasts = 5,
  position = 'top-right'
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      dismissible: true,
      ...toast,
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      return updated.slice(0, maxToasts)
    })

    return id
  }, [maxToasts])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} position={position} />
    </ToastContext.Provider>
  )
}

// ===== TOAST CONTAINER =====

interface ToastContainerProps {
  toasts: Toast[]
  position: string
}

const ToastContainer = ({ toasts, position }: ToastContainerProps) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  return createPortal(
    <div className={cn('fixed z-50 space-y-2', positionClasses[position as keyof typeof positionClasses])}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

// ===== TOAST ITEM =====

interface ToastItemProps {
  toast: Toast
}

const ToastItem = ({ toast }: ToastItemProps) => {
  const { removeToast } = useToast()
  const [isVisible, setIsVisible] = useState(true)

  // Auto-dismiss timer
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => removeToast(toast.id), 300)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration, toast.id, removeToast])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => removeToast(toast.id), 300)
  }

  const handleAction = () => {
    toast.action?.onClick()
    handleDismiss()
  }

  // Icon mapping
  const iconMap = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const IconComponent = iconMap[toast.type]

  // Color mapping
  const colorClasses = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-500',
      title: 'text-green-800 dark:text-green-200',
      description: 'text-green-700 dark:text-green-300',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500',
      title: 'text-red-800 dark:text-red-200',
      description: 'text-red-700 dark:text-red-300',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-500',
      title: 'text-yellow-800 dark:text-yellow-200',
      description: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-800 dark:text-blue-200',
      description: 'text-blue-700 dark:text-blue-300',
    },
  }

  const colors = colorClasses[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'max-w-sm w-full rounded-lg border shadow-lg',
        'backdrop-blur-sm',
        colors.bg,
        colors.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={cn('h-5 w-5', colors.icon)} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className={cn('text-sm font-medium', colors.title)}>
              {toast.title}
            </h3>
            {toast.description && (
              <p className={cn('mt-1 text-sm', colors.description)}>
                {toast.description}
              </p>
            )}
            {toast.action && (
              <div className="mt-3">
                <ModernButton
                  variant="ghost"
                  size="sm"
                  onClick={handleAction}
                  className={cn('text-sm', colors.title)}
                >
                  {toast.action.label}
                </ModernButton>
              </div>
            )}
          </div>
          {toast.dismissible && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className={cn(
                  'inline-flex rounded-md p-1.5',
                  'hover:bg-black/5 dark:hover:bg-white/5',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                  colors.title
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ===== HOOKS =====

export const useToastNotifications = () => {
  const { addToast } = useToast()

  const success = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, description, ...options })
  }, [addToast])

  const error = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, description, ...options })
  }, [addToast])

  const warning = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, description, ...options })
  }, [addToast])

  const info = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, description, ...options })
  }, [addToast])

  return { success, error, warning, info }
}

// ===== CONVENIENCE COMPONENTS =====

export const ToastSuccess = ({ title, description }: { title: string; description?: string }) => {
  const { success } = useToastNotifications()
  
  useEffect(() => {
    success(title, description)
  }, [success, title, description])
  
  return null
}

export const ToastError = ({ title, description }: { title: string; description?: string }) => {
  const { error } = useToastNotifications()
  
  useEffect(() => {
    error(title, description)
  }, [error, title, description])
  
  return null
}

export const ToastWarning = ({ title, description }: { title: string; description?: string }) => {
  const { warning } = useToastNotifications()
  
  useEffect(() => {
    warning(title, description)
  }, [warning, title, description])
  
  return null
}

export const ToastInfo = ({ title, description }: { title: string; description?: string }) => {
  const { info } = useToastNotifications()
  
  useEffect(() => {
    info(title, description)
  }, [info, title, description])
  
  return null
}

export default {
  ToastProvider,
  useToast,
  useToastNotifications,
  ToastSuccess,
  ToastError,
  ToastWarning,
  ToastInfo,
}
