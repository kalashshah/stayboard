import { createTV } from 'tailwind-variants'
import { twMergeConfig } from '@/lib/utils'

export { type VariantProps, type ClassValue } from 'tailwind-variants'

export const tv = createTV({
  twMergeConfig,
})
