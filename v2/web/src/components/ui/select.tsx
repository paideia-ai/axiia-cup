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
  renderValue?: (value: string) => ReactNode
  value?: string
}

export function Select({
  children,
  className,
  disabled,
  onValueChange,
  placeholder = '请选择…',
  renderValue,
  value,
}: SelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <BaseSelect.Trigger
        aria-label={placeholder}
        className={cn(
          'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-(--border) bg-[rgba(255,255,255,0.02)] px-3 text-sm text-(--foreground) outline-none transition-colors focus:border-(--accent) focus:ring-2 focus:ring-[rgba(224,74,47,0.4)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <BaseSelect.Value>
          {(v: string | null) => {
            // base-ui 只有在「值命中已注册的 Item」时才把值交给这个渲染函数；
            // 受控的初始值在 Item 注册之前就落下来，于是触发器一直显示占位符
            // ——模型选择器因此从来没显示过已选模型（保存用的值是对的）。
            // 回落到受控 value 自己渲染，任何 Select 都不再假装「未选择」。
            const shown = v ?? value ?? null
            return (
              <span
                className={shown
                  ? 'text-(--foreground)'
                  : 'text-(--foreground-muted)'}
              >
                {shown && renderValue
                  ? renderValue(shown)
                  : (shown ?? placeholder)}
              </span>
            )
          }}
        </BaseSelect.Value>
        <ChevronDown className='h-4 w-4 shrink-0 text-(--foreground-muted)' />
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        {
          /* z-[60]：弹层要压过 OS 面板等 z-50 的 modal 遮罩，否则下拉开在遮罩
            背后不可见；宽度带回退——部分 base-ui 版本不注入 trigger-width 变量 */
        }
        <BaseSelect.Positioner
          side='bottom'
          sideOffset={6}
          align='start'
          className='z-[60]'
        >
          <BaseSelect.Popup className='w-[var(--anchor-width,var(--trigger-width,16rem))] overflow-hidden rounded-lg border border-(--border) bg-(--surface-elevated) py-1 shadow-[0_20px_60px_rgba(0,0,0,0.5)]'>
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
      className='flex cursor-pointer items-center justify-center gap-2 px-3 py-2 text-sm text-(--foreground-subtle) outline-none transition-colors data-[highlighted]:bg-white/5 data-[highlighted]:text-(--foreground) data-[selected]:text-(--foreground)'
    >
      <BaseSelect.ItemIndicator className='flex w-4 shrink-0 items-center justify-center text-(--accent)'>
        <Check className='h-3 w-3' strokeWidth={3} />
      </BaseSelect.ItemIndicator>
      <BaseSelect.ItemText className='flex-1 text-center'>
        {children}
      </BaseSelect.ItemText>
    </BaseSelect.Item>
  )
}
