import React, { ReactNode } from 'react';
import { tokens } from '../shared/theme';
import { clsx } from '../shared/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing(12),
    textAlign: 'center',
    fontFamily: tokens.font.family,
  };

  const iconStyles: React.CSSProperties = {
    marginBottom: tokens.spacing(4),
    fontSize: '3rem',
    color: tokens.color.textMuted,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: tokens.color.text,
    marginBottom: tokens.spacing(2),
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: tokens.color.textMuted,
    marginBottom: tokens.spacing(6),
    maxWidth: '400px',
    lineHeight: 1.5,
  };

  const defaultIcon = (
    <div style={iconStyles}>
      📁
    </div>
  );

  return (
    <div style={containerStyles} className={clsx('pf-empty-state', className)}>
      {icon || defaultIcon}
      <div style={titleStyles}>{title}</div>
      {description && (
        <div style={descriptionStyles}>{description}</div>
      )}
      {action && action}
    </div>
  );
};