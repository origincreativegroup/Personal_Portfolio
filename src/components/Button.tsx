import React, { ButtonHTMLAttributes, ReactNode, forwardRef, useRef } from 'react';
import { tokens } from '../shared/theme';
import { clsx } from '../shared/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ripple?: boolean;
}

const getVariantStyles = (variant: string) => {
  const styles: React.CSSProperties = {
    fontFamily: tokens.font.family,
    fontWeight: 500,
    textTransform: 'lowercase' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    border: 'none',
    outline: 'none',
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.lg,
  };

  switch (variant) {
    case 'primary':
      return {
        ...styles,
        backgroundColor: tokens.color.primary,
        color: '#ffffff',
        border: `1px solid ${tokens.color.primary}`,
      };
    case 'secondary':
      return {
        ...styles,
        backgroundColor: tokens.color.bg,
        color: tokens.color.text,
        border: `1px solid ${tokens.color.border}`,
      };
    case 'ghost':
      return {
        ...styles,
        backgroundColor: 'transparent',
        color: tokens.color.text,
        border: '1px solid transparent',
      };
    case 'outline':
      return {
        ...styles,
        backgroundColor: 'transparent',
        color: tokens.color.text,
        border: `1px solid ${tokens.color.border}`,
      };
    default:
      return styles;
  }
};

const getSizeStyles = (size: string): React.CSSProperties => {
  switch (size) {
    case 'sm':
      return {
        padding: `${tokens.spacing(2)} ${tokens.spacing(3)}`,
        fontSize: '0.875rem',
      };
    case 'md':
      return {
        padding: `${tokens.spacing(2.5)} ${tokens.spacing(4)}`,
        fontSize: '0.875rem',
      };
    case 'lg':
      return {
        padding: `${tokens.spacing(3)} ${tokens.spacing(6)}`,
        fontSize: '1rem',
      };
    case 'xl':
      return {
        padding: `${tokens.spacing(4)} ${tokens.spacing(8)}`,
        fontSize: '1.125rem',
      };
    default:
      return {};
  }
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ripple = true,
  disabled,
  onClick,
  style,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const finalRef = ref || buttonRef;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;

    // Add ripple effect
    if (ripple && finalRef && 'current' in finalRef && finalRef.current) {
      const button = finalRef.current;
      const rect = button.getBoundingClientRect();
      const rippleSize = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - rippleSize / 2;
      const y = e.clientY - rect.top - rippleSize / 2;

      const rippleEl = document.createElement('span');
      rippleEl.style.position = 'absolute';
      rippleEl.style.width = rippleSize + 'px';
      rippleEl.style.height = rippleSize + 'px';
      rippleEl.style.left = x + 'px';
      rippleEl.style.top = y + 'px';
      rippleEl.style.borderRadius = '50%';
      rippleEl.style.backgroundColor = variant === 'primary' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      rippleEl.style.transform = 'scale(0)';
      rippleEl.style.animation = 'ripple 0.6s linear';
      rippleEl.style.pointerEvents = 'none';

      button.appendChild(rippleEl);

      setTimeout(() => {
        rippleEl.remove();
      }, 600);
    }

    onClick?.(e);
  };

  const buttonStyles: React.CSSProperties = {
    ...getVariantStyles(variant),
    ...getSizeStyles(size),
    width: fullWidth ? '100%' : undefined,
    opacity: disabled || loading ? 0.5 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    overflow: ripple ? 'hidden' : 'visible',
    ...style,
  };

  const loadingStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '1.25rem',
    height: '1.25rem',
    border: '2px solid currentColor',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing(2),
    opacity: loading ? 0 : 1,
  };

  return (
    <>
      {/* Add CSS keyframes for animations */}
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <button
        ref={finalRef}
        style={buttonStyles}
        disabled={disabled || loading}
        onClick={handleClick}
        className={clsx('pf-button', className)}
        {...props}
      >
        {loading && <div style={loadingStyles} />}

        <div style={contentStyles}>
          {icon && iconPosition === 'left' && (
            <span style={{ flexShrink: 0 }}>{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span style={{ flexShrink: 0 }}>{icon}</span>
          )}
        </div>
      </button>
    </>
  );
});

Button.displayName = 'Button';