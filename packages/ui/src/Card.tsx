import type { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-[#cbc0ff] bg-white px-4 py-3 text-[#1a1a1a]',
        className
      )}
      {...props}
    />
  );
};
