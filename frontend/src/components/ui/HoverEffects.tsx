import { ReactNode, forwardRef, HTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../shared/utils'

// ===== HOVER EFFECT COMPONENTS =====

interface HoverCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverScale?: number
  hoverRotate?: number
  hoverShadow?: string
  hoverGlow?: boolean
  hoverLift?: boolean
  className?: string
}

export const HoverCard = forwardRef<HTMLDivElement, HoverCardProps>(({
  children,
  hoverScale = 1.02,
  hoverRotate = 0,
  hoverShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  hoverGlow = false,
  hoverLift = true,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn('transition-all duration-300 ease-out', className)}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
        y: hoverLift ? -4 : 0,
        boxShadow: hoverShadow,
        ...(hoverGlow && {
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
        }),
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

HoverCard.displayName = 'HoverCard'

interface HoverButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  hoverScale?: number
  hoverGlow?: boolean
  ripple?: boolean
  className?: string
}

export const HoverButton = forwardRef<HTMLButtonElement, HoverButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  hoverScale = 1.05,
  hoverGlow = false,
  ripple = true,
  className = '',
  ...props
}, ref) => {
  const baseClasses = [
    'relative inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'overflow-hidden',
    size === 'sm' && 'px-3 py-2 text-sm',
    size === 'md' && 'px-4 py-2.5 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    variant === 'primary' && 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    variant === 'secondary' && 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-secondary-500',
    variant === 'ghost' && 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    variant === 'outline' && 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    className
  ].filter(Boolean).join(' ')

  return (
    <motion.button
      ref={ref}
      className={baseClasses}
      whileHover={{
        scale: hoverScale,
        ...(hoverGlow && {
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
        }),
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 10,
      }}
      {...props}
    >
      {children}
      {ripple && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-lg"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  )
})

HoverButton.displayName = 'HoverButton'

interface HoverImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string
  alt: string
  hoverScale?: number
  hoverRotate?: number
  hoverBrightness?: number
  hoverSaturate?: number
  className?: string
}

export const HoverImage = forwardRef<HTMLDivElement, HoverImageProps>(({
  src,
  alt,
  hoverScale = 1.1,
  hoverRotate = 0,
  hoverBrightness = 1.1,
  hoverSaturate = 1.1,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn('overflow-hidden rounded-lg', className)}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        whileHover={{
          scale: 1.05,
          filter: `brightness(${hoverBrightness}) saturate(${hoverSaturate})`,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
      />
    </motion.div>
  )
})

HoverImage.displayName = 'HoverImage'

interface HoverTextProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverColor?: string
  hoverScale?: number
  hoverGlow?: boolean
  className?: string
}

export const HoverText = forwardRef<HTMLDivElement, HoverTextProps>(({
  children,
  hoverColor = '#6366f1',
  hoverScale = 1.05,
  hoverGlow = false,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      whileHover={{
        scale: hoverScale,
        color: hoverColor,
        ...(hoverGlow && {
          textShadow: `0 0 10px ${hoverColor}`,
        }),
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

HoverText.displayName = 'HoverText'

interface HoverIconProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverScale?: number
  hoverRotate?: number
  hoverColor?: string
  hoverGlow?: boolean
  className?: string
}

export const HoverIcon = forwardRef<HTMLDivElement, HoverIconProps>(({
  children,
  hoverScale = 1.2,
  hoverRotate = 0,
  hoverColor = '#6366f1',
  hoverGlow = false,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn('inline-flex items-center justify-center', className)}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
        color: hoverColor,
        ...(hoverGlow && {
          filter: `drop-shadow(0 0 8px ${hoverColor})`,
        }),
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

HoverIcon.displayName = 'HoverIcon'

interface HoverListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  staggerDelay?: number
  hoverScale?: number
  hoverLift?: boolean
  className?: string
}

export const HoverList = forwardRef<HTMLDivElement, HoverListProps>(({
  children,
  staggerDelay = 0.1,
  hoverScale = 1.02,
  hoverLift = true,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn('space-y-2', className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      {...props}
    >
      {Array.isArray(children) ? children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{
            scale: hoverScale,
            y: hoverLift ? -2 : 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          {child}
        </motion.div>
      )) : children}
    </motion.div>
  )
})

HoverList.displayName = 'HoverList'

interface HoverCardStackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode[]
  hoverOffset?: number
  hoverScale?: number
  hoverRotate?: number
  className?: string
}

export const HoverCardStack = forwardRef<HTMLDivElement, HoverCardStackProps>(({
  children,
  hoverOffset = 8,
  hoverScale = 1.05,
  hoverRotate = 2,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      {...props}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          className="absolute inset-0"
          style={{
            zIndex: children.length - index,
            transform: `translate(${index * 2}px, ${index * 2}px)`,
          }}
          whileHover={{
            scale: hoverScale,
            rotate: hoverRotate,
            zIndex: 1000,
            transform: `translate(${index * 2}px, ${index * 2}px) scale(${hoverScale}) rotate(${hoverRotate}deg)`,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
})

HoverCardStack.displayName = 'HoverCardStack'

interface HoverRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  revealContent: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export const HoverReveal = forwardRef<HTMLDivElement, HoverRevealProps>(({
  children,
  revealContent,
  direction = 'up',
  className = '',
  ...props
}, ref) => {
  const directionVariants = {
    up: { y: '100%' },
    down: { y: '-100%' },
    left: { x: '100%' },
    right: { x: '-100%' },
  }

  return (
    <motion.div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      whileHover="hover"
      initial="initial"
      {...props}
    >
      <motion.div
        className="relative z-10"
        variants={{
          initial: { opacity: 1 },
          hover: { opacity: 0 },
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center"
        variants={{
          initial: directionVariants[direction],
          hover: { x: 0, y: 0 },
        }}
        transition={{ duration: 0.3 }}
      >
        {revealContent}
      </motion.div>
    </motion.div>
  )
})

HoverReveal.displayName = 'HoverReveal'

// ===== UTILITY HOOKS =====

export const useHoverAnimation = () => {
  const hoverVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  const transition = {
    type: 'spring',
    stiffness: 300,
    damping: 20,
  }

  return { hoverVariants, transition }
}

// ===== EXPORT ALL =====

export default {
  HoverCard,
  HoverButton,
  HoverImage,
  HoverText,
  HoverIcon,
  HoverList,
  HoverCardStack,
  HoverReveal,
  useHoverAnimation,
}
