import type { DetailedHTMLProps, SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type SelectProps = DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> & {
  label?: string;
};

export const Select = ({ label, className, children, ...props }: SelectProps) => {
  return (
    <label className="flex flex-col gap-1 text-sm text-[#1a1a1a]">
      {label && <span className="font-medium lowercase tracking-wide">{label}</span>}
      <select
        className={clsx(
          'rounded-md border border-[#cbc0ff] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#5a3cf4] focus:outline-none focus:ring-2 focus:ring-[#5a3cf4] lowercase',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
};
