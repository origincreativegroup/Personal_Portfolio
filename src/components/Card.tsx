import React, { ReactNode } from 'react';
import { tokens } from '../shared/theme';
import { clsx } from '../shared/utils';

interface CardProps {
  children: ReactNode;
  title?: string;
  footer?: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'tinted';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const getVariantStyles = (variant: string): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.xl,
    fontFamily: tokens.font.family,
    color: tokens.color.text,
  };

  switch (variant) {
    case 'elevated':
      return {
        ...baseStyles,
        backgroundColor: tokens.color.bg,
        border: `1px solid ${tokens.color.border}`,
        // Note: No box-shadow as per design constraints (flat design only)
      };
    case 'tinted':
      return {
        ...baseStyles,
        backgroundColor: `${tokens.color.highlight}10`, // Very light tint of highlight color
        border: `1px solid ${tokens.color.highlight}30`,
      };
    default:
      return baseStyles;
  }
};

const getPaddingStyles = (padding: string): React.CSSProperties => {
  switch (padding) {
    case 'sm':
      return { padding: tokens.spacing(4) };
    case 'md':
      return { padding: tokens.spacing(6) };
    case 'lg':
      return { padding: tokens.spacing(8) };
    default:
      return { padding: tokens.spacing(6) };
  }
};

export const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick
}) => {
  const cardStyles: React.CSSProperties = {
    ...getVariantStyles(variant),
    ...getPaddingStyles(padding),
    cursor: onClick ? 'pointer' : 'default',
    transition: onClick ? 'all 0.2s ease-in-out' : 'none',
  };

  const titleStyles: React.CSSProperties = {
    marginBottom: tokens.spacing(4),
    fontWeight: 600,
    fontSize: '1.125rem',
    color: tokens.color.text,
  };

  const footerStyles: React.CSSProperties = {
    marginTop: tokens.spacing(4),
    fontSize: '0.875rem',
    color: tokens.color.textMuted,
  };

  const contentStyles: React.CSSProperties = {
    color: tokens.color.text,
  };

  return (
    <div
      style={cardStyles}
      className={clsx('pf-card', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {title && <div style={titleStyles}>{title}</div>}
      <div style={contentStyles}>{children}</div>
      {footer && <div style={footerStyles}>{footer}</div>}
    </div>
  );
};