import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { cn } from '../../lib/cn'
import { tm } from '../../testmode/mark'

// Interiority is spoiler-shaped: collapsed by default, and expandable while the
// trace is still streaming — the open state lives here so a delta never closes it.
export function ReasoningFold({
  text,
  streaming = false,
}: {
  text: string
  streaming?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (!text.trim()) return null

  return (
    <div {...tm('FA.reasoning-fold')} className='mt-2'>
      <button
        {...tm('FA.reasoning-toggle')}
        type='button'
        onClick={() => setOpen((value) => !value)}
        className='inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-(--foreground-muted) transition hover:bg-white/4 hover:text-(--foreground-subtle)'
      >
        <ChevronRight
          className={cn('h-3 w-3 transition-transform', open && 'rotate-90')}
        />
        内心
        <span className='font-normal tracking-normal'>
          {streaming ? '· 推演中…' : `· ${text.length} 字`}
        </span>
      </button>
      {open
        ? (
          <p
            {...tm('FA.reasoning-text')}
            className='mt-1 whitespace-pre-wrap border-l border-dashed border-(--border) py-1 pl-3 text-xs leading-relaxed text-(--foreground-muted)'
          >
            {text}
          </p>
        )
        : null}
    </div>
  )
}
