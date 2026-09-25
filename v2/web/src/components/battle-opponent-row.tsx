import { Swords } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { playButtonHover } from '../lib/sound'
import { cn } from '../lib/cn'

type BattleOpponentRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  detail: string
  pending?: boolean
}

export function BattleOpponentRow(
  { label, detail, pending = false, className, ...props }:
    BattleOpponentRowProps,
) {
  return (
    <button
      type='button'
      aria-label={`与${label}对战`}
      onPointerEnter={playButtonHover}
      className={cn(
        'group flex min-h-20 w-full items-center gap-4 rounded-lg border border-(--border) bg-white/2 px-4 py-4 text-left transition-colors duration-150 hover:border-(--accent) hover:bg-(--surface-elevated) focus-visible:border-(--accent) focus-visible:bg-(--surface-elevated) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:pointer-events-none motion-reduce:transition-none',
        pending
          ? 'border-(--accent) bg-(--surface-elevated)'
          : 'disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span className='min-w-0 flex-1'>
        <span className='block text-[15px] leading-6 font-semibold text-(--foreground)'>
          {label}
        </span>
        <span className='mt-1 block text-xs leading-5 text-(--foreground-muted)'>
          {detail}
        </span>
      </span>
      {pending
        ? (
          <span className='shrink-0 text-xs text-(--foreground-subtle)'>
            正在创建…
          </span>
        )
        : (
          <Swords
            aria-hidden='true'
            className='h-[18px] w-[18px] shrink-0 text-(--foreground-muted) transition-colors duration-150 group-hover:text-(--accent) group-focus-visible:text-(--accent) motion-reduce:transition-none'
          />
        )}
    </button>
  )
}
