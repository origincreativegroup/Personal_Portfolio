import React, { forwardRef, InputHTMLAttributes } from 'react'

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>

interface InputProps extends NativeInputProps {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
    const hasLeftIcon = Boolean(leftIcon)
    const hasRightIcon = Boolean(rightIcon)

    const inputClasses = [
      'form-control__input',
      hasLeftIcon ? 'form-control__input--with-left-icon' : '',
      hasRightIcon ? 'form-control__input--with-right-icon' : '',
      error ? 'form-control__input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={fullWidth ? 'form-control form-control--full' : 'form-control'}>
        {label ? (
          <label htmlFor={inputId} className="form-control__label">
            {label}
          </label>
        ) : null}

        <div className="input-shell">
          {hasLeftIcon ? (
            <span className="input-shell__icon input-shell__icon--left">{leftIcon}</span>
          ) : null}
          <input ref={ref} id={inputId} className={inputClasses} {...props} />
          {hasRightIcon ? (
            <span className="input-shell__icon input-shell__icon--right">{rightIcon}</span>
          ) : null}
        </div>

        {error ? (
          <p className="form-control__helper form-control__helper--error">{error}</p>
        ) : helperText ? (
          <p className="form-control__helper">{helperText}</p>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default React.memo(Input)
