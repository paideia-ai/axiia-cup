import { Popover } from '@base-ui-components/react/popover'
import { StickyNote, X } from 'lucide-react'
import { useId } from 'react'

import { Input } from './ui/input'

export function VersionNote({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const inputID = useId()
  const hasNote = value.trim() !== ''

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label='版本备注'
        title={hasNote ? `版本备注：${value}` : '版本备注（可选）'}
        className='relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-(--foreground-muted) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) md:h-10 md:w-10'
      >
        <StickyNote aria-hidden='true' className='h-4 w-4' />
        {hasNote
          ? (
            <span
              aria-hidden='true'
              className='absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-(--accent)'
            />
          )
          : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side='top'
          align='end'
          sideOffset={8}
          collisionPadding={16}
          className='z-[60]'
        >
          <Popover.Popup
            initialFocus={() => document.getElementById(inputID)}
            className='w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-(--border) bg-(--surface-elevated) p-3 text-(--foreground) shadow-xl outline-none'
          >
            <div className='mb-2 flex items-center justify-between gap-3'>
              <Popover.Title className='text-xs font-medium'>
                版本备注
              </Popover.Title>
              <Popover.Close
                aria-label='关闭备注'
                className='flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) md:h-8 md:w-8'
              >
                <X aria-hidden='true' className='h-4 w-4' />
              </Popover.Close>
            </div>
            <label htmlFor={inputID} className='sr-only'>
              版本备注（可选）
            </label>
            <Input
              id={inputID}
              value={value}
              maxLength={60}
              placeholder='简短记下这一版的变化'
              onChange={(event) => onChange(event.target.value)}
            />
            <div className='mt-2 flex justify-between text-[10px] text-(--foreground-muted)'>
              <Popover.Description>随版本一起保存</Popover.Description>
              <span>{[...value].length}/60</span>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
