import { Menu } from '@base-ui-components/react/menu'
import { Ellipsis } from 'lucide-react'
import { type RefObject, useRef } from 'react'
import { Link } from 'react-router-dom'

import { tm } from '../testmode/mark'
import {
  dropdownItemClassName,
  dropdownPopupClassName,
} from './ui/dropdown-styles'

type Props =
  & {
    triggerRef?: RefObject<HTMLButtonElement | null>
  }
  & ({ onPresets: () => void; href?: never } | {
    href: string
    onPresets?: never
  })

export function StrategyMoreMenu({ triggerRef, onPresets, href }: Props) {
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
            className={dropdownPopupClassName}
            finalFocus={() => openingDialog.current ? false : trigger.current}
          >
            <Menu.Item
              render={href ? <Link to={href} /> : <button type='button' />}
              nativeButton={!href}
              className={dropdownItemClassName}
              onClick={onPresets
                ? () => {
                  openingDialog.current = true
                  onPresets()
                }
                : undefined}
              {...tm('E.init-tab-mcq')}
            >
              选择预设策略
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
