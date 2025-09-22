import { ReactNode, forwardRef, ElementType, ComponentProps } from 'react'

interface ButtonProps<T extends ElementType = 'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  icon?: ReactNode // Add icon prop for compatibility
  fullWidth?: boolean
  as?: T
  className?: string
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

type ButtonComponent = <T extends ElementType = 'button'>(
  props: ButtonProps<T> & Omit<ComponentProps<T>, keyof ButtonProps<T>>
) => React.ReactElement<any, any>

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm'
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

const Button = forwardRef<HTMLElement, ButtonProps<any>>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  icon, // Add icon prop
  fullWidth = false,
  as: Component = 'button',
  className = '',
  disabled = false,
  onClick,
  ...props
}, ref) => {
  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-md',
    'transition-colors duration-200 focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ')

  const content = (
    <>
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : (leftIcon || icon) ? (
        <span className="mr-2">{leftIcon || icon}</span>
      ) : null}

      {children}

      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </>
  )

  return (
    <Component
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {content}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button