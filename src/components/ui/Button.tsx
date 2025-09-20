import React, { forwardRef, ButtonHTMLAttributes, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: React.ElementType;
  to?: string;
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
    ref
  ) => {
    // Base styles
    const baseStyles = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'border',
      'border-transparent',
      'font-medium',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
    ];

    // Variant styles
    const variantStyles = {
      primary: [
        'bg-primary-600',
        'text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500',
        'shadow-sm',
        'hover:shadow-md',
      ],
      secondary: [
        'bg-gray-600',
        'text-white',
        'hover:bg-gray-700',
        'focus:ring-gray-500',
        'shadow-sm',
        'hover:shadow-md',
      ],
      outline: [
        'bg-transparent',
        'text-gray-700',
        'border-gray-300',
        'hover:bg-gray-50',
        'focus:ring-primary-500',
        'dark:text-gray-300',
        'dark:border-gray-600',
        'dark:hover:bg-gray-800',
      ],
      ghost: [
        'bg-transparent',
        'text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-primary-500',
        'dark:text-gray-300',
        'dark:hover:bg-gray-800',
      ],
      danger: [
        'bg-red-600',
        'text-white',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'shadow-sm',
        'hover:shadow-md',
      ],
    };

    // Size styles
    const sizeStyles = {
      sm: ['px-3', 'py-1.5', 'text-sm'],
      md: ['px-4', 'py-2', 'text-sm'],
      lg: ['px-6', 'py-3', 'text-base'],
    };

    // Width styles
    const widthStyles = fullWidth ? ['w-full'] : [];

    // Combine all styles with memoization
    const styles = useMemo(() => [
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...widthStyles,
      className,
    ].join(' '), [variant, size, fullWidth, className]);

    const isDisabled = disabled || loading;

    return (
      <Component
        ref={ref}
        className={styles}
        disabled={isDisabled}
        to={to}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {children && <span>{children}</span>}

        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export default React.memo(Button);