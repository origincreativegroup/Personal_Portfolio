import React, { ReactNode, useMemo } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  hover?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const CardComponent: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false,
}) => {
  const baseStyles = [
    'bg-white',
    'dark:bg-gray-800',
    'rounded-lg',
    'transition-all',
    'duration-200',
  ];

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const borderStyles = border ? [
    'border',
    'border-gray-200',
    'dark:border-gray-700',
  ] : [];

  const hoverStyles = hover ? [
    'hover:shadow-md',
    'hover:scale-105',
    'cursor-pointer',
  ] : [];

  const styles = useMemo(() => [
    ...baseStyles,
    paddingStyles[padding],
    shadowStyles[shadow],
    ...borderStyles,
    ...hoverStyles,
    className,
  ].join(' '), [padding, shadow, border, hover, className]);

  return (
    <div className={styles}>
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 pb-3 mb-4 ${className}`}>
      {children}
    </div>
  );
};

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 pt-3 mt-4 ${className}`}>
      {children}
    </div>
  );
};

const Card = React.memo(CardComponent) as React.MemoExoticComponent<React.FC<CardProps>> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
};

Card.Header = React.memo(CardHeader);
Card.Body = React.memo(CardBody);
Card.Footer = React.memo(CardFooter);

export default Card;
