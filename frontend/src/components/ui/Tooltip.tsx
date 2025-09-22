import { ReactNode, createContext, useContext, useState, useRef, useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../shared/utils'

// ===== TYPES =====

export interface TooltipContextType {
  showTooltip: (content: ReactNode, options?: TooltipOptions) => void
  hideTooltip: () => void
  tooltip: {
    content: ReactNode
    options: TooltipOptions
  } | null
}

export interface TooltipOptions {
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end'
  offset?: number
  delay?: number
  duration?: number
  trigger?: 'hover' | 'click' | 'focus' | 'manual'
  disabled?: boolean
  className?: string
  arrow?: boolean
  interactive?: boolean
  maxWidth?: string | number
  zIndex?: number
}

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  options?: TooltipOptions
  className?: string
}

interface TooltipProviderProps {
  children: ReactNode
}

// ===== CONTEXT =====

const TooltipContext = createContext<TooltipContextType | undefined>(undefined)

export const useTooltip = () => {
  const context = useContext(TooltipContext)
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider')
  }
  return context
}

// ===== PROVIDER =====

export const TooltipProvider = ({ children }: TooltipProviderProps) => {
  const [tooltip, setTooltip] = useState<{ content: ReactNode; options: TooltipOptions } | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = (content: ReactNode, options: TooltipOptions = {}) => {
    if (options.disabled) return

    setTooltip({ content, options })
    setIsVisible(true)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set delay if specified
    if (options.delay && options.delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, options.delay)
    }
  }

  const hideTooltip = () => {
    setIsVisible(false)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Add delay before hiding
    setTimeout(() => {
      setTooltip(null)
    }, 150)
  }

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    const placement = tooltip?.options.placement || 'top'
    const offset = tooltip?.options.offset || 8

    let x = 0
    let y = 0

    // Calculate position based on placement
    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.top - tooltipRect.height - offset
        break
      case 'top-start':
        x = triggerRect.left
        y = triggerRect.top - tooltipRect.height - offset
        break
      case 'top-end':
        x = triggerRect.right - tooltipRect.width
        y = triggerRect.top - tooltipRect.height - offset
        break
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
        y = triggerRect.bottom + offset
        break
      case 'bottom-start':
        x = triggerRect.left
        y = triggerRect.bottom + offset
        break
      case 'bottom-end':
        x = triggerRect.right - tooltipRect.width
        y = triggerRect.bottom + offset
        break
      case 'left':
        x = triggerRect.left - tooltipRect.width - offset
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
      case 'left-start':
        x = triggerRect.left - tooltipRect.width - offset
        y = triggerRect.top
        break
      case 'left-end':
        x = triggerRect.left - tooltipRect.width - offset
        y = triggerRect.bottom - tooltipRect.height
        break
      case 'right':
        x = triggerRect.right + offset
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
        break
      case 'right-start':
        x = triggerRect.right + offset
        y = triggerRect.top
        break
      case 'right-end':
        x = triggerRect.right + offset
        y = triggerRect.bottom - tooltipRect.height
        break
    }

    // Ensure tooltip stays within viewport
    x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8))
    y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8))

    setPosition({ x, y })
  }

  useEffect(() => {
    if (isVisible && tooltip) {
      updatePosition()
      
      const handleResize = () => updatePosition()
      const handleScroll = () => updatePosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [isVisible, tooltip])

  const contextValue: TooltipContextType = {
    showTooltip,
    hideTooltip,
    tooltip: tooltip ? { content: tooltip.content, options: tooltip.options } : null,
  }

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      <TooltipPortal
        tooltip={tooltip}
        isVisible={isVisible}
        position={position}
        tooltipRef={tooltipRef}
        triggerRef={triggerRef}
      />
    </TooltipContext.Provider>
  )
}

// ===== TOOLTIP PORTAL =====

interface TooltipPortalProps {
  tooltip: { content: ReactNode; options: TooltipOptions } | null
  isVisible: boolean
  position: { x: number; y: number }
  tooltipRef: React.RefObject<HTMLDivElement>
  triggerRef: React.RefObject<HTMLElement | null>
}

const TooltipPortal = ({ tooltip, isVisible, position, tooltipRef, triggerRef }: TooltipPortalProps) => {
  if (!tooltip) return null

  const { content, options } = tooltip
  const placement = options.placement || 'top'
  const arrow = options.arrow !== false
  const maxWidth = options.maxWidth || '300px'
  const zIndex = options.zIndex || 1000

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45'
    
    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        return `${baseClasses} -bottom-1 left-1/2 -translate-x-1/2`
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        return `${baseClasses} -top-1 left-1/2 -translate-x-1/2`
      case 'left':
      case 'left-start':
      case 'left-end':
        return `${baseClasses} -right-1 top-1/2 -translate-y-1/2`
      case 'right':
      case 'right-start':
      case 'right-end':
        return `${baseClasses} -left-1 top-1/2 -translate-y-1/2`
      default:
        return baseClasses
    }
  }

  const getAnimationVariants = () => {
    const distance = 8
    
    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        return {
          initial: { opacity: 0, y: distance },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: distance },
        }
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        return {
          initial: { opacity: 0, y: -distance },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -distance },
        }
      case 'left':
      case 'left-start':
      case 'left-end':
        return {
          initial: { opacity: 0, x: distance },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: distance },
        }
      case 'right':
      case 'right-start':
      case 'right-end':
        return {
          initial: { opacity: 0, x: -distance },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -distance },
        }
      default:
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
        }
    }
  }

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg shadow-lg',
            'pointer-events-none',
            options.className
          )}
          style={{
            left: position.x,
            top: position.y,
            maxWidth,
            zIndex,
          }}
          variants={getAnimationVariants()}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          {content}
          {arrow && <div className={getArrowClasses()} />}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ===== TOOLTIP COMPONENT =====

export const Tooltip = forwardRef<HTMLElement, TooltipProps>(({
  children,
  content,
  options = {},
  className = '',
}, ref) => {
  const { showTooltip, hideTooltip } = useTooltip()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)

  const trigger = options.trigger || 'hover'
  const disabled = options.disabled || false

  const handleMouseEnter = () => {
    if (trigger === 'hover' && !disabled) {
      setIsHovered(true)
      showTooltip(content, options)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsHovered(false)
      hideTooltip()
    }
  }

  const handleFocus = () => {
    if (trigger === 'focus' && !disabled) {
      setIsFocused(true)
      showTooltip(content, options)
    }
  }

  const handleBlur = () => {
    if (trigger === 'focus') {
      setIsFocused(false)
      hideTooltip()
    }
  }

  const handleClick = () => {
    if (trigger === 'click' && !disabled) {
      if (isHovered || isFocused) {
        hideTooltip()
      } else {
        showTooltip(content, options)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideTooltip()
    }
  }

  return (
    <div
      ref={ref as any}
      className={cn('inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={trigger === 'focus' ? 0 : undefined}
    >
      {children}
    </div>
  )
})

Tooltip.displayName = 'Tooltip'

// ===== HOOKS =====

export const useTooltipState = () => {
  const { showTooltip, hideTooltip, tooltip } = useTooltip()
  
  return {
    showTooltip,
    hideTooltip,
    isVisible: !!tooltip,
    content: tooltip?.content,
    options: tooltip?.options,
  }
}

// ===== CONVENIENCE COMPONENTS =====

interface SimpleTooltipProps {
  children: ReactNode
  text: string
  placement?: TooltipOptions['placement']
  className?: string
}

export const SimpleTooltip = ({ children, text, placement = 'top', className }: SimpleTooltipProps) => (
  <Tooltip content={text} options={{ placement }} className={className}>
    {children}
  </Tooltip>
)

interface InfoTooltipProps {
  children: ReactNode
  title: string
  description?: string
  placement?: TooltipOptions['placement']
  className?: string
}

export const InfoTooltip = ({ children, title, description, placement = 'top', className }: InfoTooltipProps) => (
  <Tooltip
    content={
      <div className="space-y-1">
        <div className="font-medium">{title}</div>
        {description && <div className="text-xs opacity-90">{description}</div>}
      </div>
    }
    options={{ placement, maxWidth: '250px' }}
    className={className}
  >
    {children}
  </Tooltip>
)

// ===== EXPORT =====

export default {
  TooltipProvider,
  Tooltip,
  SimpleTooltip,
  InfoTooltip,
  useTooltip,
  useTooltipState,
}
