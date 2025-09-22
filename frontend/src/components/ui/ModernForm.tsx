import { ReactNode, forwardRef, FormHTMLAttributes, useCallback, useState } from 'react'
import { cn } from '../../shared/utils'
import ModernInput from './ModernInput'
import ModernButton from './ModernButton'
import { motion } from 'framer-motion'

// ===== TYPES =====

export interface FormField {
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  validation?: {
    required?: boolean | string
    minLength?: { value: number; message: string }
    maxLength?: { value: number; message: string }
    pattern?: { value: RegExp; message: string }
    email?: boolean | string
    min?: { value: number; message: string }
    max?: { value: number; message: string }
    custom?: (value: any) => string | null
  }
  options?: Array<{ value: string; label: string }>
  multiline?: boolean
  rows?: number
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
}

export interface FormData {
  [key: string]: any
}

export interface FormErrors {
  [key: string]: string
}

interface ModernFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  children?: ReactNode
  fields?: FormField[]
  initialData?: FormData
  onSubmit?: (data: FormData) => void | Promise<void>
  onValidate?: (data: FormData) => FormErrors | Promise<FormErrors>
  submitText?: string
  resetText?: string
  showReset?: boolean
  loading?: boolean
  className?: string
  // Animation props
  animate?: boolean
  stagger?: number
  // Validation props
  validateOnChange?: boolean
  validateOnBlur?: boolean
  // Accessibility
  'aria-label'?: string
}

// ===== VALIDATION UTILITIES =====

const validateField = (field: FormField, value: any): string | null => {
  const { validation } = field
  
  if (!validation) return null

  // Required validation
  if (validation.required) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return typeof validation.required === 'string' ? validation.required : `${field.label} is required`
    }
  }

  // Email validation
  if (validation.email && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return typeof validation.email === 'string' ? validation.email : 'Please enter a valid email address'
    }
  }

  // Min length validation
  if (validation.minLength && value && value.length < validation.minLength.value) {
    return validation.minLength.message
  }

  // Max length validation
  if (validation.maxLength && value && value.length > validation.maxLength.value) {
    return validation.maxLength.message
  }

  // Pattern validation
  if (validation.pattern && value && !validation.pattern.value.test(value)) {
    return validation.pattern.message
  }

  // Min value validation
  if (validation.min && value !== '' && Number(value) < validation.min.value) {
    return validation.min.message
  }

  // Max value validation
  if (validation.max && value !== '' && Number(value) > validation.max.value) {
    return validation.max.message
  }

  // Custom validation
  if (validation.custom) {
    return validation.custom(value)
  }

  return null
}

const validateForm = (fields: FormField[], data: FormData): FormErrors => {
  const errors: FormErrors = {}
  
  fields.forEach(field => {
    const error = validateField(field, data[field.name])
    if (error) {
      errors[field.name] = error
    }
  })
  
  return errors
}

// ===== FORM COMPONENT =====

const ModernForm = forwardRef<HTMLFormElement, ModernFormProps>(({
  children,
  fields = [],
  initialData = {},
  onSubmit,
  onValidate,
  submitText = 'Submit',
  resetText = 'Reset',
  showReset = false,
  loading = false,
  className = '',
  animate = true,
  stagger = 0.1,
  validateOnChange = true,
  validateOnBlur = true,
  'aria-label': ariaLabel,
  ...props
}, ref) => {
  const [data, setData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle field change
  const handleFieldChange = useCallback((name: string, value: any) => {
    setData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Validate on change if enabled
    if (validateOnChange) {
      const field = fields.find(f => f.name === name)
      if (field) {
        const error = validateField(field, value)
        setErrors(prev => ({ ...prev, [name]: error || '' }))
      }
    }
  }, [errors, fields, validateOnChange])

  // Handle field blur
  const handleFieldBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate on blur if enabled
    if (validateOnBlur) {
      const field = fields.find(f => f.name === name)
      if (field) {
        const error = validateField(field, data[name])
        setErrors(prev => ({ ...prev, [name]: error || '' }))
      }
    }
  }, [data, fields, validateOnBlur])

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    
    try {
      // Mark all fields as touched
      const allTouched = fields.reduce((acc, field) => {
        acc[field.name] = true
        return acc
      }, {} as { [key: string]: boolean })
      setTouched(allTouched)
      
      // Validate form
      const formErrors = validateForm(fields, data)
      setErrors(formErrors)
      
      // Check for errors
      if (Object.keys(formErrors).length > 0) {
        return
      }
      
      // Custom validation
      if (onValidate) {
        const customErrors = await onValidate(data)
        if (Object.keys(customErrors).length > 0) {
          setErrors(customErrors)
          return
        }
      }
      
      // Submit form
      if (onSubmit) {
        await onSubmit(data)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [data, fields, onSubmit, onValidate])

  // Handle form reset
  const handleReset = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
  }, [initialData])

  // Render field
  const renderField = useCallback((field: FormField, index: number) => {
    const fieldError = errors[field.name]
    const isTouched = touched[field.name]
    const showError = isTouched && fieldError

    const fieldProps = {
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
      value: data[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleFieldChange(field.name, e.target.value)
      },
      onBlur: () => handleFieldBlur(field.name),
      error: showError ? fieldError : undefined,
      helperText: field.helperText,
      required: field.required,
      leftIcon: field.leftIcon,
      rightIcon: field.rightIcon,
      className: field.className,
      multiline: field.multiline,
      rows: field.rows,
    }

    if (animate) {
      return (
        <motion.div
          key={field.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * stagger }}
        >
          {field.type === 'textarea' || field.multiline ? (
            <ModernInput {...fieldProps} multiline />
          ) : field.type === 'select' ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {field.required && <span className="text-error-500 ml-1">*</span>}
              </label>
              <select
                {...fieldProps}
                className={cn(
                  'block w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  showError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
                  field.className
                )}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {showError && (
                <p className="text-sm text-error-500">{fieldError}</p>
              )}
            </div>
          ) : field.type === 'checkbox' ? (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.name}
                checked={data[field.name] || false}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                onBlur={() => handleFieldBlur(field.name)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor={field.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {field.required && <span className="text-error-500 ml-1">*</span>}
              </label>
              {showError && (
                <p className="text-sm text-error-500">{fieldError}</p>
              )}
            </div>
          ) : (
            <ModernInput {...fieldProps} type={field.type} />
          )}
        </motion.div>
      )
    }

    return (
      <div key={field.name}>
        {field.type === 'textarea' || field.multiline ? (
          <ModernInput {...fieldProps} multiline />
        ) : field.type === 'select' ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-error-500 ml-1">*</span>}
            </label>
            <select
              {...fieldProps}
              className={cn(
                'block w-full px-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                showError && 'border-error-500 focus:border-error-500 focus:ring-error-500/20',
                field.className
              )}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {showError && (
              <p className="text-sm text-error-500">{fieldError}</p>
            )}
          </div>
        ) : field.type === 'checkbox' ? (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.name}
              checked={data[field.name] || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              onBlur={() => handleFieldBlur(field.name)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor={field.name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {field.label}
              {field.required && <span className="text-error-500 ml-1">*</span>}
            </label>
            {showError && (
              <p className="text-sm text-error-500">{fieldError}</p>
            )}
          </div>
        ) : (
          <ModernInput {...fieldProps} type={field.type} />
        )}
      </div>
    )
  }, [data, errors, touched, handleFieldChange, handleFieldBlur, animate, stagger])

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      className={cn('space-y-6', className)}
      aria-label={ariaLabel}
      {...props}
    >
      {children || fields.map((field, index) => renderField(field, index))}
      
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {showReset && (
          <ModernButton
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting || loading}
          >
            {resetText}
          </ModernButton>
        )}
        <ModernButton
          type="submit"
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
        >
          {submitText}
        </ModernButton>
      </div>
    </form>
  )
})

ModernForm.displayName = 'ModernForm'

export default ModernForm
