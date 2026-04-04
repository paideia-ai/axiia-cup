import { Select as BaseSelect } from '@base-ui-components/react/select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface SelectProps {
  children: ReactNode
  className?: string
  disabled?: boolean
  onValueChange?: (value: string | null) => void
  placeholder?: string
  value?: string
}

export function Select({
  children,
  className,
  disabled,
  onValueChange,
  placeholder = '请选择…',
  value,
}: SelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <BaseSelect.Trigger
        className={cn(
          'flex h-10 cursor-pointer items-center justify-between gap-2 rounded-md border border-(--border) bg-[rgba(255,255,255,0.02)] px-3 text-sm text-(--foreground) outline-none transition-colors focus:border-(--accent) focus:ring-2 focus:ring-[rgba(224,74,47,0.4)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <BaseSelect.Value>
          {(v: string | null) => (
            <span
              className={
                v ? 'text-(--foreground)' : 'text-(--foreground-muted)'
              }
            >
              {v ?? placeholder}
            </span>
          )}
        </BaseSelect.Value>
        <ChevronDown className="h-4 w-4 shrink-0 text-(--foreground-muted)" />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner side="bottom" sideOffset={6} align="start">
          <BaseSelect.Popup className="z-50 min-w-(--trigger-width) overflow-hidden rounded-lg border border-(--border) bg-(--surface-elevated) py-1 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <BaseSelect.List>{children}</BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}

interface SelectItemProps {
  children: ReactNode
  value: string
}

export function SelectItem({ children, value }: SelectItemProps) {
  return (
    <BaseSelect.Item
      value={value}
      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-(--foreground-subtle) outline-none transition-colors data-[highlighted]:bg-white/5 data-[highlighted]:text-(--foreground) data-[selected]:text-(--foreground)"
    >
      <BaseSelect.ItemIndicator className="flex w-4 shrink-0 items-center justify-center text-(--accent)">
        <Check className="h-3 w-3" strokeWidth={3} />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}
