import clsx, { type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

export { type ClassValue } from 'clsx'

const alignuiTextNames = [
  'title-h1', 'title-h2', 'title-h3', 'title-h4', 'title-h5', 'title-h6',
  'label-xl', 'label-lg', 'label-md', 'label-sm', 'label-xs',
  'paragraph-xl', 'paragraph-lg', 'paragraph-md', 'paragraph-sm', 'paragraph-xs',
  'subheading-md', 'subheading-sm', 'subheading-xs', 'subheading-2xs',
  'doc-label', 'doc-paragraph',
]

const alignuiShadowNames = [
  'regular-xs', 'regular-sm', 'regular-md',
  'button-primary-focus', 'button-important-focus', 'button-error-focus',
  'fancy-buttons-neutral', 'fancy-buttons-primary', 'fancy-buttons-error', 'fancy-buttons-stroke',
  'toggle-switch', 'switch-thumb', 'tooltip',
  'custom-xs', 'custom-sm', 'custom-md', 'custom-lg',
]

const alignuiRoundedNames = ['10', '20']

export const twMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [{ text: alignuiTextNames }],
      shadow: [{ shadow: alignuiShadowNames }],
      rounded: [{ rounded: alignuiRoundedNames }],
    },
  },
}

const customTwMerge = extendTailwindMerge(twMergeConfig)

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
