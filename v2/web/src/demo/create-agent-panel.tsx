import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from 'react'
import { Popover } from '@base-ui-components/react/popover'
import { X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export function CreateAgentPanel(
  { role, anchor, name, onNameChange, onSubmit, onClose, blocked, children }: {
    role: string
    anchor: HTMLElement | null
    name: string
    onNameChange: (name: string) => void
    onSubmit: () => void
    onClose: () => void
    blocked: boolean
    children?: ReactNode
  },
) {
  const inputID = useId()
  const [mobile, setMobile] = useState(() =>
    matchMedia('(max-width: 767px)').matches
  )
  const [viewport, setViewport] = useState({
    bottom: 0,
    height: globalThis.innerHeight,
  })
  useEffect(() => {
    const media = matchMedia('(max-width: 767px)')
    const sync = () => {
      setMobile(media.matches)
      const visual = globalThis.visualViewport
      setViewport({
        bottom: visual
          ? Math.max(
            0,
            globalThis.innerHeight - visual.height - visual.offsetTop,
          )
          : 0,
        height: visual?.height ?? globalThis.innerHeight,
      })
    }
    sync()
    media.addEventListener('change', sync)
    globalThis.visualViewport?.addEventListener('resize', sync)
    globalThis.visualViewport?.addEventListener('scroll', sync)
    return () => {
      media.removeEventListener('change', sync)
      globalThis.visualViewport?.removeEventListener('resize', sync)
      globalThis.visualViewport?.removeEventListener('scroll', sync)
    }
  }, [])
  return (
    <Popover.Root
      open
      modal={mobile ? true : 'trap-focus'}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Popover.Portal>
        {mobile && (
          <Popover.Backdrop className='fixed inset-0 z-50 bg-black/55' />
        )}
        <Popover.Positioner
          anchor={anchor}
          side='bottom'
          align='end'
          sideOffset={8}
          collisionPadding={16}
          positionMethod='fixed'
          className='demo-create-positioner z-[60]'
          style={{
            '--create-bottom-inset': `${viewport.bottom}px`,
            '--create-available-height': `${
              Math.max(160, viewport.height - 16)
            }px`,
          } as CSSProperties}
        >
          <Popover.Popup
            initialFocus={() => document.getElementById(inputID)}
            finalFocus={() => anchor?.isConnected ? anchor : false}
            className='demo-overlay-panel demo-create-panel w-80 max-w-[calc(100vw-2rem)] p-4 outline-none'
          >
            <div className='mb-3 flex items-center justify-between gap-3'>
              <Popover.Title className='text-sm font-semibold'>
                新建{role}智能体
              </Popover.Title>
              <Popover.Close
                aria-label='关闭弹窗'
                className='demo-overlay-close'
              >
                <X aria-hidden='true' className='h-4 w-4' />
              </Popover.Close>
            </div>
            <form
              className='space-y-3'
              onSubmit={(event) => {
                event.preventDefault()
                if (!blocked) onSubmit()
              }}
            >
              {children}
              <label htmlFor={inputID} className='sr-only'>
                智能体名称（可选）
              </label>
              <Input
                id={inputID}
                value={name}
                maxLength={30}
                placeholder='名称（可选）'
                onChange={(event) => onNameChange(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' && event.nativeEvent.isComposing
                  ) event.preventDefault()
                }}
              />
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  size='sm'
                  className='min-h-10 px-5'
                  aria-label='创建智能体'
                  disabled={blocked}
                >
                  创建
                </Button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
