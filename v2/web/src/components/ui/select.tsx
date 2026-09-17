import { Select as BaseSelect } from '@base-ui-components/react/select'
import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'
import {
  dropdownItemClassName,
  dropdownPopupClassName,
  dropdownScrollClassName,
} from './dropdown-styles'

interface SelectProps {
  children: ReactNode
  className?: string
  disabled?: boolean
  onValueChange?: (value: string | null) => void
  placeholder?: string
  renderValue?: (value: string) => ReactNode
  value?: string | null
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
          'group flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-(--border) bg-white/2 px-3 text-sm text-(--foreground) outline-none transition-colors hover:border-(--foreground-muted) hover:bg-white/4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) data-[popup-open]:border-(--foreground-muted) disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none md:h-10',
          className,
        )}
      >
        <BaseSelect.Value className='min-w-0 truncate text-left'>
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
        <BaseSelect.Icon>
          <ChevronDown
            aria-hidden='true'
            className='h-3.5 w-3.5 shrink-0 text-(--foreground-muted) transition-transform duration-150 group-data-[popup-open]:rotate-180 motion-reduce:transition-none'
          />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        {
          /* z-[60]：弹层要压过 OS 面板等 z-50 的 modal 遮罩，否则下拉开在遮罩
            背后不可见；宽度带回退——部分 base-ui 版本不注入 trigger-width 变量 */
        }
        <BaseSelect.Positioner
          // Item alignment grows the popup on scroll; use stable anchored sizing.
          alignItemWithTrigger={false}
          side='bottom'
          sideOffset={6}
          align='start'
          collisionPadding={16}
          className='z-[60]'
        >
          <BaseSelect.Popup
            className={cn(
              dropdownPopupClassName,
              'w-[var(--anchor-width,var(--trigger-width,16rem))]',
            )}
          >
            <BaseSelect.List className={dropdownScrollClassName}>
              {children}
            </BaseSelect.List>
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
      className={dropdownItemClassName}
    >
      <BaseSelect.ItemText className='min-w-0 flex-1 text-left wrap-anywhere'>
        {children}
      </BaseSelect.ItemText>
      <span className='flex h-4 w-4 shrink-0 items-center justify-center'>
        <BaseSelect.ItemIndicator>
          <Check
            aria-hidden='true'
            className='h-3.5 w-3.5 text-(--accent)'
            strokeWidth={2}
          />
        </BaseSelect.ItemIndicator>
      </span>
    </BaseSelect.Item>
  )
}
