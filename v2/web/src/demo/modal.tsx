import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal(
  { title, onClose, children }: {
    title: string
    onClose: () => void
    children: ReactNode
  },
) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      if (opener?.isConnected) opener.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby='demo-dialog-title'
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href]',
        )
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className='demo-overlay-panel fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto p-0 backdrop:bg-black/55'
    >
      <div className='flex items-center justify-between border-b border-(--border-soft) px-5 py-4'>
        <h2 id='demo-dialog-title' className='font-semibold'>{title}</h2>
        <button
          type='button'
          className='demo-overlay-close'
          aria-label='关闭弹窗'
          onClick={onClose}
        >
          <X aria-hidden='true' className='h-4 w-4' />
        </button>
      </div>
      <div className='space-y-5 p-5'>{children}</div>
    </dialog>
  )
}
