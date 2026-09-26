import { type ReactNode, useId, useState } from 'react'
import './transcript-tabs.css'

export function TranscriptTabs({ labels, panels, streaming, reached }: {
  labels: string[]
  panels: ReactNode[]
  streaming: boolean
  reached: number
}) {
  const id = useId()
  const [selected, setSelected] = useState<number | null>(null)
  const active = selected ?? (streaming ? reached : 0)
  const count = streaming ? reached + 1 : labels.length
  return (
    <section
      className='transcript-tabs-region space-y-5'
      aria-label='对局对话记录'
    >
      <div
        className='transcript-stage-tabs'
        role='tablist'
        aria-label='对局阶段'
      >
        {labels.map((label, index) => (
          <button
            key={label}
            type='button'
            role='tab'
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            disabled={streaming && index > reached}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              ) return
              event.preventDefault()
              const next = event.key === 'Home'
                ? 0
                : event.key === 'End'
                ? count - 1
                : (index + (event.key === 'ArrowRight' ? 1 : -1) + count) %
                  count
              setSelected(next)
              document.getElementById(`${id}-tab-${next}`)?.focus()
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {streaming && selected != null
        ? (
          <button
            type='button'
            className='text-xs text-(--foreground-subtle) underline'
            onClick={() => setSelected(null)}
          >
            跟随当前阶段
          </button>
        )
        : null}
      <div
        id={`${id}-panel`}
        role='tabpanel'
        aria-labelledby={`${id}-tab-${active}`}
        tabIndex={0}
        className='transcript-stage-panel space-y-5'
      >
        {panels[active]}
      </div>
    </section>
  )
}
