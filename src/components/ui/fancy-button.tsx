// AlignUI FancyButton v0.0.0: vendored from alignui-nextjs-typescript-starter (MIT)
// Higher-emphasis CTA button: dimensional shadows + gradient overlays.
// Variants: neutral | primary (orange) | destructive | basic | themed.
// Use for landing hero CTAs, upgrade prompts, etc. Default app buttons stay on
// the standard Button shim from ./button.

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { tv, type VariantProps } from '@/lib/tv'
import { recursiveCloneChildren } from '@/lib/recursive-clone-children'
import type { PolymorphicComponentProps } from '@/lib/polymorphic'

const FANCY_BUTTON_ROOT_NAME = 'FancyButtonRoot'
const FANCY_BUTTON_ICON_NAME = 'FancyButtonIcon'

export const fancyButtonVariants = tv({
  slots: {
    root: [
      'group relative inline-flex items-center justify-center whitespace-nowrap text-label-sm outline-none',
      'transition duration-200 ease-out',
      'focus:outline-none',
      'disabled:pointer-events-none disabled:text-text-disabled-300',
      'disabled:bg-bg-weak-50 disabled:bg-none disabled:shadow-none disabled:before:hidden disabled:after:hidden',
    ],
    icon: 'relative z-10 size-5 shrink-0',
  },
  variants: {
    // Bezel and sheen come from `.fancy` in globals.css (Prism's recipe); each variant sets only its fill and shadow.
    variant: {
      neutral: { root: 'fancy [--fancy-fill:var(--bg-strong-950)] [--fancy-shadow:var(--shadow-fancy-buttons-neutral)] text-text-white-0' },
      primary: { root: 'fancy [--fancy-fill:var(--primary-base)] [--fancy-shadow:var(--shadow-fancy-buttons-primary)] text-static-white hover:[--fancy-fill:var(--primary-dark)]' },
      destructive: { root: 'fancy [--fancy-fill:var(--error-base)] [--fancy-shadow:var(--shadow-fancy-buttons-error)] text-static-white' },
      basic: {
        root: [
          'bg-bg-white-0 text-text-sub-600 shadow-fancy-buttons-stroke',
          'hover:bg-bg-weak-50 hover:text-text-strong-950 hover:shadow-none',
        ],
      },
      themed: { root: 'fancy [--fancy-fill:var(--bg-strong-950)] [--fancy-shadow:var(--shadow-fancy-buttons-neutral)] text-text-white-0' },
    },
    size: {
      medium: { root: 'h-10 gap-3 rounded-10 px-3.5', icon: '-mx-1' },
      small: { root: 'h-9 gap-3 rounded-10 px-3', icon: '-mx-1' },
      xsmall: { root: 'h-8 gap-3 rounded-10 px-2.5', icon: '-mx-1' },
    },
  },
  defaultVariants: { variant: 'neutral', size: 'medium' },
})

type FancyButtonSharedProps = VariantProps<typeof fancyButtonVariants>

type FancyButtonRootProps = VariantProps<typeof fancyButtonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }

const FancyButtonRoot = React.forwardRef<HTMLButtonElement, FancyButtonRootProps>(
  ({ asChild, children, variant, size, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId()
    const Component = asChild ? Slot : 'button'
    const { root } = fancyButtonVariants({ variant, size })
    const sharedProps: FancyButtonSharedProps = { variant, size }
    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [FANCY_BUTTON_ICON_NAME],
      uniqueId,
      asChild,
    )
    return (
      <Component ref={forwardedRef} className={root({ class: className })} {...rest}>
        {extendedChildren}
      </Component>
    )
  },
)
FancyButtonRoot.displayName = FANCY_BUTTON_ROOT_NAME

function FancyButtonIcon<T extends React.ElementType>({
  className, variant, size, as, ...rest
}: PolymorphicComponentProps<T, FancyButtonSharedProps>) {
  const Component = as || 'div'
  const { icon } = fancyButtonVariants({ variant, size })
  return <Component className={icon({ class: className })} {...rest} />
}
FancyButtonIcon.displayName = FANCY_BUTTON_ICON_NAME

export { FancyButtonRoot as Root, FancyButtonIcon as Icon }

// Convenience default export for plain `<FancyButton variant="primary">Text</FancyButton>` usage.
const FancyButton = FancyButtonRoot
export { FancyButton }
