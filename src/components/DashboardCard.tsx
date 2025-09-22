import React, { ReactNode } from 'react';
import { tokens } from '../shared/theme';
import { clsx } from '../shared/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  icon?: ReactNode;
  description?: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  className,
  variant = 'default',
}) => {
  const getVariantColor = (variant: string): string => {
    switch (variant) {
      case 'success':
        return '#10B981'; // Green
      case 'warning':
        return '#F59E0B'; // Amber
      case 'info':
        return '#3B82F6'; // Blue
      default:
        return tokens.color.primary;
    }
  };

  const containerStyles: React.CSSProperties = {
    backgroundColor: tokens.color.bg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.xl,
    padding: tokens.spacing(6),
    fontFamily: tokens.font.family,
    position: 'relative',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing(4),
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: tokens.color.textMuted,
    textTransform: 'lowercase',
    letterSpacing: '0.025em',
  };

  const iconStyles: React.CSSProperties = {
    padding: tokens.spacing(2),
    backgroundColor: `${getVariantColor(variant)}20`,
    borderRadius: tokens.radius.md,
    color: getVariantColor(variant),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
  };

  const valueStyles: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 700,
    color: tokens.color.text,
    lineHeight: 1,
    marginBottom: tokens.spacing(2),
  };

  const changeStyles = (direction: string): React.CSSProperties => {
    const getColor = (dir: string) => {
      switch (dir) {
        case 'up':
          return '#10B981';
        case 'down':
          return '#EF4444';
        default:
          return tokens.color.textMuted;
      }
    };

    return {
      display: 'flex',
      alignItems: 'center',
      gap: tokens.spacing(1),
      fontSize: '0.875rem',
      fontWeight: 500,
      color: getColor(direction),
    };
  };

  const descriptionStyles: React.CSSProperties = {
    fontSize: '0.875rem',
    color: tokens.color.textMuted,
    marginTop: tokens.spacing(2),
  };

  const getChangeIcon = (direction: string): string => {
    switch (direction) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '→';
    }
  };

  const accentBarStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '3px',
    backgroundColor: getVariantColor(variant),
  };

  return (
    <div style={containerStyles} className={clsx('pf-dashboard-card', className)}>
      <div style={accentBarStyles} />

      <div style={headerStyles}>
        <div style={titleStyles}>{title}</div>
        {icon && <div style={iconStyles}>{icon}</div>}
      </div>

      <div style={valueStyles}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {change && (
        <div style={changeStyles(change.direction)}>
          <span>{getChangeIcon(change.direction)}</span>
          <span>
            {change.value > 0 ? '+' : ''}{change.value}%
          </span>
          {change.period && (
            <span style={{ color: tokens.color.textMuted }}>
              vs {change.period}
            </span>
          )}
        </div>
      )}

      {description && (
        <div style={descriptionStyles}>{description}</div>
      )}
    </div>
  );
};