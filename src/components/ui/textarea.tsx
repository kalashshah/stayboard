import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// AlignUI-flavored textarea (uses the ported semantic tokens), mirrors Input.
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-10 bg-bg-white-0 px-3 py-2.5 text-label-sm text-text-strong-950',
        'ring-1 ring-inset ring-stroke-soft-200 outline-none transition',
        'placeholder:text-text-sub-600/60',
        'focus:ring-2 focus:ring-primary-base',
        'disabled:pointer-events-none disabled:bg-bg-weak-50',
        'resize-y',
        className,
      )}
      {...props}
    />
  );
}
