import { RiErrorWarningFill, RiInformationFill } from '@remixicon/react'
import { cn } from '@/lib/utils'

// AlignUI "lighter" alert, the small inline form: tinted box, state icon, one line of text.
const VARIANTS = {
  error: { box: 'bg-error-lighter', text: 'text-error-base', Icon: RiErrorWarningFill },
  info: { box: 'bg-information-lighter', text: 'text-information-base', Icon: RiInformationFill },
} as const

export function Alert({ children, className, variant = 'error' }: { children: React.ReactNode; className?: string; variant?: keyof typeof VARIANTS }) {
  const { box, text, Icon } = VARIANTS[variant]
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-2 rounded-xl px-3 py-2.5 text-left', box, className)}>
      <Icon className={cn('mt-0.5 size-4 shrink-0', text)} />
      <p className={cn('text-label-sm', text)}>{children}</p>
    </div>
  )
}
