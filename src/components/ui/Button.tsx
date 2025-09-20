import React, { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  as?: React.ElementType
  to?: string
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  outline: 'btn--outline',
  ghost: 'btn--ghost',
  danger: 'btn--danger',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'btn--sm',
  md: '',
  lg: 'btn--lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      as: Component = 'button',
      to,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'btn',
      VARIANT_CLASS[variant],
      SIZE_CLASS[size],
      fullWidth ? 'btn--full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const isDisabled = disabled || loading

    return (
      <Component
        ref={ref}
        className={classes}
        disabled={isDisabled}
        to={to}
        {...props}
      >
        {leftIcon && !loading ? <span className="btn__icon">{leftIcon}</span> : null}
        {loading ? <Loader2 className="btn__icon" style={{ width: '1.1rem', height: '1.1rem', animation: 'spin 1s linear infinite' }} /> : null}
        {children ? <span>{children}</span> : null}
        {rightIcon && !loading ? <span className="btn__icon">{rightIcon}</span> : null}
      </Component>
    )
  },
)

Button.displayName = 'Button'

export default React.memo(Button)
