// 轻量 UI 套件（不依赖组件库；样式对齐 v2 视觉语言）。
import { X } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '../lib/cn'

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  className,
  title,
  type = 'button',
}: PropsWithChildren<{
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  title?: string
  type?: 'button' | 'submit'
}>) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' && 'bg-(--accent) text-white hover:bg-(--accent-hover)',
        variant === 'secondary' && 'border border-(--border) bg-white/4 text-(--foreground) hover:bg-white/8',
        variant === 'ghost' && 'text-(--foreground-subtle) hover:bg-white/6 hover:text-(--foreground)',
        variant === 'danger' && 'border border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-950/70',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Card({ children, className, onClick, id }: PropsWithChildren<{ className?: string; onClick?: () => void; id?: string }>) {
  return (
    <div
      id={id}
      data-card=''
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-(--border-soft) bg-white/[0.02] p-5',
        onClick && 'cursor-pointer transition hover:border-(--border) hover:bg-white/[0.04]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: PropsWithChildren<{ tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'info' | 'sideA' | 'sideB'; className?: string }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        tone === 'neutral' && 'border-(--border) bg-white/4 text-(--foreground-subtle)',
        tone === 'accent' && 'border-(--accent)/40 bg-(--accent)/10 text-(--accent)',
        tone === 'success' && 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300',
        tone === 'warning' && 'border-amber-800/60 bg-amber-950/40 text-amber-300',
        tone === 'info' && 'border-sky-800/60 bg-sky-950/40 text-sky-300',
        tone === 'sideA' && 'border-sky-800/60 bg-sky-950/40 text-sky-300',
        tone === 'sideB' && 'border-amber-800/60 bg-amber-950/40 text-amber-300',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { key: string; label: ReactNode; disabled?: boolean; badge?: ReactNode }[]
  value: string
  onChange: (key: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1 rounded-full border border-(--border-soft) bg-white/[0.02] p-1', className)}>
      {items.map((it) => (
        <button
          key={it.key}
          type='button'
          disabled={it.disabled}
          onClick={() => !it.disabled && onChange(it.key)}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition',
            value === it.key ? 'bg-white/10 text-(--foreground)' : 'text-(--foreground-subtle) hover:text-(--foreground)',
            it.disabled && 'cursor-not-allowed opacity-45 hover:text-(--foreground-subtle)',
          )}
        >
          {it.label}
          {it.badge}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: PropsWithChildren<{ open: boolean; onClose: () => void; title: ReactNode; wide?: boolean }>) {
  if (!open) return null
  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center' onClick={onClose}>
      <div
        className={cn(
          'max-h-[88vh] w-full overflow-y-auto rounded-t-2xl border border-(--border) bg-(--surface) p-6 sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='panel-title'>{title}</h2>
          <button type='button' onClick={onClose} className='rounded-full p-1.5 text-(--foreground-subtle) hover:bg-white/8'>
            <X className='h-4 w-4' />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ProgressDots({ done, total }: { done: number; total: number }) {
  return (
    <span className='inline-flex items-center gap-1'>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i < done ? 'bg-(--success)' : 'bg-white/15')} />
      ))}
    </span>
  )
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className='flex flex-col items-center gap-3 rounded-2xl border border-dashed border-(--border) px-6 py-12 text-center'>
      <p className='panel-title'>{title}</p>
      {hint && <p className='panel-copy max-w-md text-sm'>{hint}</p>}
      {action}
    </div>
  )
}

export function KeyValue({ label, children }: PropsWithChildren<{ label: ReactNode }>) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>{label}</span>
      <span className='text-sm text-(--foreground)'>{children}</span>
    </div>
  )
}
