import type { TextareaHTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full rounded-md border border-(--border) bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-(--foreground) placeholder:text-(--foreground-muted) outline-none transition-colors duration-150 resize-y focus:border-(--accent) focus:ring-2 focus:ring-[rgba(224,74,47,0.4)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
