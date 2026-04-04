import type { InputHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-(--border) bg-[rgba(255,255,255,0.02)] px-3 text-sm text-(--foreground) placeholder:text-(--foreground-muted) outline-none transition-colors duration-150 focus:border-(--accent) focus:ring-2 focus:ring-[rgba(224,74,47,0.4)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
