import { Menu } from '@base-ui-components/react/menu'
import { Ellipsis, ListChecks } from 'lucide-react'
import { type RefObject, useRef } from 'react'

import { cn } from '../lib/cn'
import { tm } from '../testmode/mark'
import {
  dropdownItemClassName,
  dropdownPopupClassName,
  dropdownScrollClassName,
} from './ui/dropdown-styles'

interface Props {
  triggerRef?: RefObject<HTMLButtonElement | null>
  onPresets: () => void
}

export function StrategyMoreMenu({ triggerRef, onPresets }: Props) {
  const ownTrigger = useRef<HTMLButtonElement>(null)
  const trigger = triggerRef ?? ownTrigger
  const openingDialog = useRef(false)
  return (
    <Menu.Root
      onOpenChange={(open) => {
        if (open) openingDialog.current = false
      }}
    >
      <Menu.Trigger
        ref={trigger}
        aria-label='更多构建方式'
        title='更多构建方式'
        className='flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-(--foreground-subtle) hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) md:h-8 md:w-8'
      >
        <Ellipsis aria-hidden='true' className='h-4 w-4' />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align='end'
          sideOffset={6}
          collisionPadding={16}
          className='z-[60]'
        >
          <Menu.Popup
            className={cn(dropdownPopupClassName, 'w-56')}
            finalFocus={() => openingDialog.current ? false : trigger.current}
          >
            <div className={dropdownScrollClassName}>
              <Menu.Item
                render={<button type='button' />}
                nativeButton
                className={cn(dropdownItemClassName, 'w-full')}
                onClick={() => {
                  openingDialog.current = true
                  onPresets()
                }}
                {...tm('E.init-tab-mcq')}
              >
                <ListChecks aria-hidden='true' className='h-4 w-4' />
                选择预设策略
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
