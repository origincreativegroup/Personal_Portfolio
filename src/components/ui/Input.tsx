import React, { forwardRef, InputHTMLAttributes, useMemo } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      variant = 'default',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseStyles = [
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
    ];

    const variantStyles = {
      default: [
        'border',
        'border-gray-300',
        'rounded-lg',
        'bg-white',
        'text-gray-900',
        'placeholder-gray-400',
        'focus:border-primary-500',
        'dark:bg-gray-800',
        'dark:border-gray-600',
        'dark:text-white',
        'dark:placeholder-gray-400',
      ],
      filled: [
        'border-0',
        'rounded-lg',
        'bg-gray-100',
        'text-gray-900',
        'placeholder-gray-500',
        'focus:bg-white',
        'focus:ring-2',
        'dark:bg-gray-700',
        'dark:text-white',
        'dark:placeholder-gray-400',
        'dark:focus:bg-gray-800',
      ],
      outlined: [
        'border-2',
        'border-gray-300',
        'rounded-lg',
        'bg-transparent',
        'text-gray-900',
        'placeholder-gray-400',
        'focus:border-primary-500',
        'dark:border-gray-600',
        'dark:text-white',
        'dark:placeholder-gray-400',
      ],
    };

    const sizeStyles = {
      sm: ['px-3', 'py-1.5', 'text-sm'],
      md: ['px-4', 'py-2', 'text-sm'],
      lg: ['px-4', 'py-3', 'text-base'],
    };

    const iconPadding = {
      sm: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      md: leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '',
      lg: leftIcon ? 'pl-12' : rightIcon ? 'pr-12' : '',
    };

    const widthStyles = fullWidth ? ['w-full'] : [];

    const inputStyles = useMemo(() => [
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...widthStyles,
      iconPadding[size],
      error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
      className,
    ].join(' '), [variant, size, fullWidth, leftIcon, rightIcon, error, className]);

    const iconSize = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconPosition = {
      sm: 'left-3',
      md: 'left-3',
      lg: 'left-3',
    };

    const rightIconPosition = {
      sm: 'right-3',
      md: 'right-3',
      lg: 'right-3',
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className={`absolute ${iconPosition[size]} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500`}>
              <span className={iconSize[size]}>{leftIcon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputStyles}
            {...props}
          />

          {rightIcon && (
            <div className={`absolute ${rightIconPosition[size]} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500`}>
              <span className={iconSize[size]}>{rightIcon}</span>
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p className={`mt-1 text-xs ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default React.memo(Input);