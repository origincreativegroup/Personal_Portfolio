import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  centered?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
  centered = false,
}) => {
  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const containerClasses = useMemo(() => centered
    ? 'flex flex-col items-center justify-center min-h-32'
    : 'flex items-center space-x-2', [centered]);

  const spinnerClasses = useMemo(() => [
    'animate-spin',
    'text-primary-600',
    'dark:text-primary-400',
    sizeStyles[size],
    className,
  ].join(' '), [size, className]);

  return (
    <div className={containerClasses}>
      <Loader2 className={spinnerClasses} />
      {text && (
        <span className={`text-gray-600 dark:text-gray-400 ${textSizeStyles[size]} ${centered ? 'mt-2' : ''}`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default React.memo(LoadingSpinner);