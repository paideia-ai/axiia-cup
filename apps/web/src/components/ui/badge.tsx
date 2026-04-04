import type { HTMLAttributes } from 'react'

import { cn } from '../../lib/cn'

const toneClassName = {
  accent: 'bg-[rgba(224,74,47,0.14)] text-(--accent)',
  success: 'bg-[rgba(52,211,153,0.14)] text-(--success)',
  warning: 'bg-[rgba(251,191,36,0.14)] text-(--warning)',
  info: 'bg-[rgba(96,165,250,0.14)] text-(--info)',
} as const

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof toneClassName
}

export function Badge({ className, tone = 'accent', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.04em]',
        toneClassName[tone],
        className,
      )}
      {...props}
    />
  )
}
