// AlignUI Button v0.0.0: vendored from alignui-nextjs-typescript-starter (MIT)
// Wrapped with shadcn-compatible variant/size adapter so existing callsites
// using variant="default|secondary|destructive|outline|ghost|link" and
// size="default|sm|lg|icon|..." keep working.
// For new code: import { Root, Icon } and use the native AlignUI API.

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { tv, type VariantProps } from '@/lib/tv'
import { recursiveCloneChildren } from '@/lib/recursive-clone-children'
import type { PolymorphicComponentProps } from '@/lib/polymorphic'
import { cn } from '@/lib/utils'
import { FancyButton, fancyButtonVariants } from './fancy-button'

const BUTTON_ROOT_NAME = 'ButtonRoot'
const BUTTON_ICON_NAME = 'ButtonIcon'

const buttonVariantsTV = tv({
  slots: {
    root: [
      'group relative inline-flex items-center justify-center whitespace-nowrap outline-none',
      'transition duration-200 ease-out',
      'focus:outline-none',
      'disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:ring-transparent',
    ],
    icon: ['flex size-5 shrink-0 items-center justify-center'],
  },
  variants: {
    variant: {
      primary: {},
      neutral: {},
      error: {},
    },
    mode: {
      filled: {},
      stroke: { root: 'ring-1 ring-inset' },
      lighter: { root: 'ring-1 ring-inset' },
      ghost: { root: 'ring-1 ring-inset' },
    },
    size: {
      medium: { root: 'h-10 gap-3 rounded-10 px-3.5 text-label-sm', icon: '-mx-1' },
      small: { root: 'h-9 gap-3 rounded-lg px-3 text-label-sm', icon: '-mx-1' },
      xsmall: { root: 'h-8 gap-2.5 rounded-lg px-2.5 text-label-sm', icon: '-mx-1' },
      xxsmall: { root: 'h-7 gap-2.5 rounded-lg px-2 text-label-sm', icon: '-mx-1' },
    },
  },
  compoundVariants: [
    // primary
    {
      variant: 'primary',
      mode: 'filled',
      class: {
        root: [
          'bg-primary-base text-static-white',
          'hover:bg-primary-darker',
          'focus-visible:shadow-button-primary-focus',
        ],
      },
    },
    {
      variant: 'primary',
      mode: 'stroke',
      class: {
        root: [
          'bg-bg-white-0 text-primary-base ring-primary-base',
          'hover:bg-primary-alpha-10 hover:ring-transparent',
          'focus-visible:shadow-button-primary-focus',
        ],
      },
    },
    {
      variant: 'primary',
      mode: 'lighter',
      class: {
        root: [
          'bg-primary-alpha-10 text-primary-base ring-transparent',
          'hover:bg-bg-white-0 hover:ring-primary-base',
          'focus-visible:bg-bg-white-0 focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
        ],
      },
    },
    {
      variant: 'primary',
      mode: 'ghost',
      class: {
        root: [
          'bg-transparent text-primary-base ring-transparent',
          'hover:bg-primary-alpha-10',
          'focus-visible:bg-bg-white-0 focus-visible:shadow-button-primary-focus focus-visible:ring-primary-base',
        ],
      },
    },
    // neutral
    {
      variant: 'neutral',
      mode: 'filled',
      class: {
        root: [
          'bg-bg-strong-950 text-text-white-0',
          'hover:bg-bg-surface-800',
          'focus-visible:shadow-button-important-focus',
        ],
      },
    },
    {
      variant: 'neutral',
      mode: 'stroke',
      class: {
        root: [
          'bg-bg-white-0 text-text-strong-950 shadow-regular-xs ring-stroke-soft-200',
          'hover:bg-bg-weak-50 hover:shadow-none hover:ring-transparent',
          'focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
        ],
      },
    },
    {
      variant: 'neutral',
      mode: 'lighter',
      class: {
        root: [
          'bg-bg-weak-50 text-text-sub-600 ring-transparent',
          'hover:bg-bg-white-0 hover:text-text-strong-950 hover:shadow-regular-xs hover:ring-stroke-soft-200',
          'focus-visible:bg-bg-white-0 focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
        ],
      },
    },
    {
      variant: 'neutral',
      mode: 'ghost',
      class: {
        root: [
          'bg-transparent text-text-sub-600 ring-transparent',
          'hover:bg-bg-weak-50 hover:text-text-strong-950',
          'focus-visible:bg-bg-white-0 focus-visible:text-text-strong-950 focus-visible:shadow-button-important-focus focus-visible:ring-stroke-strong-950',
        ],
      },
    },
    // error
    {
      variant: 'error',
      mode: 'filled',
      class: {
        root: [
          'bg-error-base text-static-white',
          'hover:bg-red-700',
          'focus-visible:shadow-button-error-focus',
        ],
      },
    },
    {
      variant: 'error',
      mode: 'stroke',
      class: {
        root: [
          'bg-bg-white-0 text-error-base ring-error-base',
          'hover:bg-red-alpha-10 hover:ring-transparent',
          'focus-visible:shadow-button-error-focus',
        ],
      },
    },
    {
      variant: 'error',
      mode: 'lighter',
      class: {
        root: [
          'bg-red-alpha-10 text-error-base ring-transparent',
          'hover:bg-bg-white-0 hover:ring-error-base',
          'focus-visible:bg-bg-white-0 focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
        ],
      },
    },
    {
      variant: 'error',
      mode: 'ghost',
      class: {
        root: [
          'bg-transparent text-error-base ring-transparent',
          'hover:bg-red-alpha-10',
          'focus-visible:bg-bg-white-0 focus-visible:shadow-button-error-focus focus-visible:ring-error-base',
        ],
      },
    },
  ],
  defaultVariants: { variant: 'primary', mode: 'filled', size: 'medium' },
})

type ButtonSharedProps = VariantProps<typeof buttonVariantsTV>

type ButtonRootProps = VariantProps<typeof buttonVariantsTV> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }

const ButtonRoot = React.forwardRef<HTMLButtonElement, ButtonRootProps>(
  ({ children, variant, mode, size, asChild, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId()
    const Component = asChild ? Slot : 'button'
    const { root } = buttonVariantsTV({ variant, mode, size })

    const sharedProps: ButtonSharedProps = { variant, mode, size }

    const extendedChildren = recursiveCloneChildren(
      children as React.ReactElement[],
      sharedProps,
      [BUTTON_ICON_NAME],
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
ButtonRoot.displayName = BUTTON_ROOT_NAME

function ButtonIcon<T extends React.ElementType>({
  variant,
  mode,
  size,
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T, ButtonSharedProps>) {
  const Component = as || 'div'
  const { icon } = buttonVariantsTV({ mode, variant, size })
  return <Component className={icon({ class: className })} {...rest} />
}
ButtonIcon.displayName = BUTTON_ICON_NAME

export { ButtonRoot as Root, ButtonIcon as Icon }

// ──────────────────────────────────────────────────────────────────────────
// Shadcn-compat shim. Keeps existing callsites working without rewrites.
// Maps shadcn variant/size strings to FancyButton's native variants/sizes:
// no custom style overrides; the component is used as-is.
// ──────────────────────────────────────────────────────────────────────────

type ShadcnVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
type ShadcnSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'

type FancyVariant = NonNullable<VariantProps<typeof fancyButtonVariants>['variant']>
type FancySize = NonNullable<VariantProps<typeof fancyButtonVariants>['size']>

// Project convention: always render the AlignUI FancyButton, used as-is with
// its native variants; no custom style overrides. `default` → orange
// "primary"; `destructive` stays red; the
// remaining shadcn variants map to the subtle `basic`.
const variantMap: Record<ShadcnVariant, FancyVariant> = {
  default: 'primary',
  secondary: 'basic',
  destructive: 'destructive',
  outline: 'basic',
  ghost: 'basic',
  link: 'basic',
}

const sizeMap: Record<ShadcnSize, FancySize> = {
  default: 'small',
  xs: 'xsmall',
  sm: 'xsmall',
  lg: 'medium',
  icon: 'small',
  'icon-xs': 'xsmall',
  'icon-sm': 'xsmall',
  'icon-lg': 'medium',
}

type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  variant?: ShadcnVariant
  size?: ShadcnSize
  asChild?: boolean
  loading?: boolean
  children?: React.ReactNode
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M8 2a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', className, loading, disabled, children, ...rest }, ref) => {
    return (
      <FancyButton
        ref={ref}
        variant={variantMap[variant]}
        size={sizeMap[size]}
        className={className}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        )}
        <span className={cn('contents', loading && 'invisible')}>{children}</span>
      </FancyButton>
    )
  },
)
Button.displayName = 'Button'

// Shadcn-compat buttonVariants(): returns a className string for use on
// non-button elements (anchors, links), backed by FancyButton styles.
function buttonVariants(props?: { variant?: ShadcnVariant; size?: ShadcnSize; className?: string }) {
  const variant = props?.variant ?? 'default'
  const size = props?.size ?? 'default'
  const { root } = fancyButtonVariants({ variant: variantMap[variant], size: sizeMap[size] })
  return cn(root(), props?.className)
}

export { Button, buttonVariants }
