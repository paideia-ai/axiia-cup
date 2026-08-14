import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

const buttonVariants = cva(
  // The focus ring needs an offset: a half-opacity accent ring drawn flush against
  // an accent-filled button is invisible, which is what shipped before.
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-(--accent) text-white hover:bg-(--accent-hover)',
        secondary:
          'border border-(--border) bg-transparent text-(--foreground) hover:border-(--foreground-muted) hover:bg-white/3',
        ghost: 'bg-transparent text-(--foreground) hover:bg-white/4',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps =
  & ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants>

export function Button({ className, size, variant, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  )
}
