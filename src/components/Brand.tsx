import Link from 'next/link'

/** The Stayboard mark: an orange fancy square holding a white screen, and the wordmark. */
export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-label-lg font-semibold tracking-tight text-text-strong-950">
      <span className="fancy fancy-orange grid size-7 place-items-center rounded-lg">
        <span className="h-2.5 w-3.5 rounded-[3px] bg-static-white" />
      </span>
      Stayboard
    </Link>
  )
}
