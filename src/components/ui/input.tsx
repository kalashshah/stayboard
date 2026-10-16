import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

// AlignUI-flavored text input (uses the ported semantic tokens).
export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-10 bg-bg-white-0 px-3 text-label-sm text-text-strong-950',
        'ring-1 ring-inset ring-stroke-soft-200 outline-none transition',
        'placeholder:text-text-sub-600/60',
        'focus:ring-2 focus:ring-primary-base',
        'disabled:pointer-events-none disabled:bg-bg-weak-50',
        className,
      )}
      {...props}
    />
  );
}
