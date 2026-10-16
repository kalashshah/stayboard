import { cn } from '@/lib/utils'

// AlignUI surface contract: white, rounded-20, stroke shadow ring. AlignUI's free tier ships no Card.
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-20 bg-bg-white-0 p-5 shadow-fancy-buttons-stroke', className)} {...props} />
}
