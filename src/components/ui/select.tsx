import { RiArrowDownSLine } from '@remixicon/react'
import { cn } from '@/lib/utils'

// AlignUI select trigger styling on a native <select>: plain text options need nothing the platform control lacks.
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-10 bg-bg-white-0 pr-9 pl-3 text-paragraph-sm text-text-strong-950',
          'shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 outline-none transition duration-200 ease-out',
          'hover:bg-bg-weak-50 focus-visible:ring-2 focus-visible:ring-primary-base',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-2.5 size-5 -translate-y-1/2 text-text-sub-600" />
    </div>
  )
}
