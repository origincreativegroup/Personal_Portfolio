import { motion, Variants, Transition } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '../../shared/utils'

// ===== ANIMATION VARIANTS =====

export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
}

export const slideInFromLeft: Variants = {
  hidden: {
    opacity: 0,
    x: '-100%',
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

export const slideInFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: '100%',
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

export const slideInFromTop: Variants = {
  hidden: {
    opacity: 0,
    y: '-100%',
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export const slideInFromBottom: Variants = {
  hidden: {
    opacity: 0,
    y: '100%',
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export const rotateIn: Variants = {
  hidden: {
    opacity: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    rotate: 0,
  },
}

export const flipIn: Variants = {
  hidden: {
    opacity: 0,
    rotateY: -90,
  },
  visible: {
    opacity: 1,
    rotateY: 0,
  },
}

export const bounceIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
}

export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
}

// ===== TRANSITION PRESETS =====

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const bouncyTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 10,
}

export const gentleTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94],
}

export const quickTransition: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1],
}

// ===== ANIMATED COMPONENTS =====

interface AnimatedDivProps {
  children: ReactNode
  variants?: Variants
  initial?: string | boolean
  animate?: string | boolean
  exit?: string | boolean
  transition?: Transition
  className?: string
  delay?: number
  duration?: number
  stagger?: number
  whileHover?: any
  whileTap?: any
  whileInView?: any
  viewport?: any
  onAnimationComplete?: () => void
}

export const AnimatedDiv = ({
  children,
  variants = fadeInUp,
  initial = 'hidden',
  animate = 'visible',
  exit = 'hidden',
  transition = smoothTransition,
  className = '',
  delay = 0,
  duration,
  stagger,
  whileHover,
  whileTap,
  whileInView,
  viewport,
  onAnimationComplete,
}: AnimatedDivProps) => {
  const customTransition = {
    ...transition,
    ...(delay && { delay }),
    ...(duration && { duration }),
    ...(stagger && { staggerChildren: stagger }),
  }

  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={customTransition}
      whileHover={whileHover}
      whileTap={whileTap}
      whileInView={whileInView}
      viewport={viewport}
      onAnimationComplete={onAnimationComplete}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  whileHover?: any
  whileTap?: any
}

export const AnimatedButton = ({
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  whileHover = { scale: 1.05 },
  whileTap = { scale: 0.95 },
}: AnimatedButtonProps) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    size === 'sm' && 'px-3 py-2 text-sm',
    size === 'md' && 'px-4 py-2.5 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    variant === 'primary' && 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    variant === 'secondary' && 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-secondary-500',
    variant === 'ghost' && 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    className
  ].filter(Boolean).join(' ')

  return (
    <motion.button
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={springTransition}
    >
      {children}
    </motion.button>
  )
}

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  clickable?: boolean
  delay?: number
  stagger?: number
}

export const AnimatedCard = ({
  children,
  className = '',
  hover = false,
  clickable = false,
  delay = 0,
  stagger = 0,
}: AnimatedCardProps) => {
  const baseClasses = [
    'relative rounded-xl transition-all duration-300 ease-out',
    'overflow-hidden',
    clickable && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50',
    className
  ].filter(Boolean).join(' ')

  const hoverProps = hover ? {
    whileHover: { 
      y: -8, 
      scale: 1.02,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    whileTap: { scale: 0.98 }
  } : {}

  return (
    <motion.div
      className={baseClasses}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{
        ...smoothTransition,
        delay,
        staggerChildren: stagger,
      }}
      {...hoverProps}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListProps {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
}

export const AnimatedList = ({
  children,
  className = '',
  stagger = 0.1,
  delay = 0,
}: AnimatedListProps) => {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      transition={{
        ...smoothTransition,
        delay,
        staggerChildren: stagger,
      }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedListItemProps {
  children: ReactNode
  className?: string
  delay?: number
}

export const AnimatedListItem = ({
  children,
  className = '',
  delay = 0,
}: AnimatedListItemProps) => {
  return (
    <motion.div
      className={className}
      variants={staggerItem}
      transition={{
        ...smoothTransition,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedTextProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  split?: boolean
}

export const AnimatedText = ({
  children,
  className = '',
  delay = 0,
  duration = 0.5,
  split = false,
}: AnimatedTextProps) => {
  if (split && typeof children === 'string') {
    const words = children.split(' ')
    
    return (
      <motion.div
        className={className}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        transition={{
          ...smoothTransition,
          delay,
          staggerChildren: 0.05,
        }}
      >
        {words.map((word, index) => (
          <motion.span
            key={index}
            variants={fadeInUp}
            className="inline-block mr-1"
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{
        ...smoothTransition,
        delay,
        duration,
      }}
    >
      {children}
    </motion.div>
  )
}

interface AnimatedIconProps {
  children: ReactNode
  className?: string
  delay?: number
  rotate?: boolean
  bounce?: boolean
}

export const AnimatedIcon = ({
  children,
  className = '',
  delay = 0,
  rotate = false,
  bounce = false,
}: AnimatedIconProps) => {
  const variants = rotate ? rotateIn : bounce ? bounceIn : scaleIn

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        ...smoothTransition,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

// ===== PAGE TRANSITIONS =====

export const pageVariants = {
  initial: {
    opacity: 0,
    x: '-100%',
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: '100%',
  },
}

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

// ===== LOADING ANIMATIONS =====

export const loadingVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const loadingItemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
}

// ===== HOVER ANIMATIONS =====

export const hoverScale = {
  scale: 1.05,
  transition: springTransition,
}

export const hoverLift = {
  y: -4,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  transition: springTransition,
}

export const hoverGlow = {
  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
  transition: springTransition,
}

// ===== TAP ANIMATIONS =====

export const tapScale = {
  scale: 0.95,
  transition: quickTransition,
}

export const tapBounce = {
  scale: 0.9,
  transition: bouncyTransition,
}

// ===== EXPORT ALL =====

export default {
  // Variants
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
  slideInFromBottom,
  rotateIn,
  flipIn,
  bounceIn,
  staggerContainer,
  staggerItem,
  
  // Transitions
  smoothTransition,
  springTransition,
  bouncyTransition,
  gentleTransition,
  quickTransition,
  
  // Components
  AnimatedDiv,
  AnimatedButton,
  AnimatedCard,
  AnimatedList,
  AnimatedListItem,
  AnimatedText,
  AnimatedIcon,
  
  // Page transitions
  pageVariants,
  pageTransition,
  
  // Loading animations
  loadingVariants,
  loadingItemVariants,
  
  // Hover animations
  hoverScale,
  hoverLift,
  hoverGlow,
  
  // Tap animations
  tapScale,
  tapBounce,
}
