import type { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { clsx } from 'clsx';

type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  variant?: 'primary' | 'ghost';
};

export const Button = ({
  className,
  children,
  variant = 'primary',
  ...props
}: ButtonProps) => {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const variants: Record<typeof variant, string> = {
    primary: 'bg-[#5a3cf4] text-white hover:bg-[#4a32c9] focus-visible:ring-[#cbc0ff] disabled:bg-[#cbc0ff] disabled:text-[#333333] disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-[#1a1a1a] hover:bg-[#cbc0ff] focus-visible:ring-[#5a3cf4]',
  } as const;

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};
