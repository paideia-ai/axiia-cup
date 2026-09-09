import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  marker?: string
  returnFocus?: HTMLElement | null
}

const focusableSelector = [
  'button:not(:disabled)',
  'a[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Accessible modal shell shared by destructive confirmations and helper flows. */
export function Modal({
  title,
  onClose,
  children,
  marker,
  returnFocus,
}: ModalProps) {
  const titleID = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    })

    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      const target = returnFocus?.isConnected ? returnFocus : opener
      if (target?.isConnected) target.focus()
    }
  }, [returnFocus])

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleID}
        data-tm={marker}
        className='max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border border-(--border) bg-(--surface-elevated) text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:max-w-xl md:rounded-xl'
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onClose()
            return
          }
          if (event.key !== 'Tab') return
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              focusableSelector,
            ),
          )
          const first = controls[0]
          const last = controls.at(-1)
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }}
      >
        <div className='flex items-center justify-between gap-3 border-b border-(--border-soft) px-5 py-4'>
          <h2 id={titleID} className='font-semibold'>{title}</h2>
          <button
            type='button'
            aria-label='关闭弹窗'
            title='关闭'
            onClick={onClose}
            className='flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) md:h-9 md:w-9'
          >
            <X aria-hidden='true' className='h-4 w-4' />
          </button>
        </div>
        <div className='space-y-5 p-5'>{children}</div>
      </div>
    </div>
  )
}
