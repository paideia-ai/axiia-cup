import {
  cloneElement,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

import yoshiaki from '../../assets/portraits/honnoji-decision/yoshiaki-envoy-neutral.webp'
import chosokabe from '../../assets/portraits/honnoji-decision/chosokabe-envoy-neutral.webp'
import hosokawa from '../../assets/portraits/honnoji-decision/hosokawa-fujitaka-neutral.webp'
import ashigaru from '../../assets/portraits/honnoji-decision/ashigaru-neutral.webp'
import './portrait-role-choice.css'

const portraits: Record<string, string> = {
  yoshiaki,
  chosokabe,
  hosokawa,
  ashigaru,
}
type Role = { key: string; name: string }
type Choice = 0 | 1 | null
type Layout = {
  vertical: boolean
  shelf: boolean
  width: number
  height: number
  positions: { x: number; y: number }[]
}
type Gesture = { pointer: number; x: number; y: number; moved: boolean }

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n))

function place(rect: DOMRect): Layout {
  const vw = document.documentElement.clientWidth
  const vh = globalThis.innerHeight
  const narrow = vw < 768
  const pad = 12
  const gap = 10
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  if (narrow) {
    const width = Math.min(252, vw - pad * 2)
    const height = vh < 500 ? 68 : 82
    const above = rect.top - gap - height
    const below = rect.bottom + gap
    // A bottom-anchored sheet (the battle panel) leaves no room under the
    // action. Rather than stacking portraits over it, use the paired shelf.
    if (above >= 60 && below + height <= vh - 76) {
      const x = clamp(cx - width / 2, pad, vw - pad - width)
      return {
        vertical: true,
        shelf: false,
        width,
        height,
        positions: [{ x, y: above }, { x, y: below }],
      }
    }
  }
  const width = Math.min(172, (vw - pad * 2 - gap) / 2)
  const height = 140
  const shelf = narrow || rect.left < width + gap + pad ||
    vw - rect.right < width + gap + pad
  if (!shelf) {
    const y = clamp(cy - height / 2, 60, vh - height - pad)
    return {
      vertical: false,
      shelf,
      width,
      height,
      positions: [{ x: rect.left - gap - width, y }, {
        x: rect.right + gap,
        y,
      }],
    }
  }
  // Keep a pair together when an edge cannot accommodate a full portrait.
  // This is anchored to the action, with no modal, scrim or page-width changes.
  const x = clamp(cx - width - gap / 2, pad, vw - pad - width * 2 - gap)
  const y = rect.top - height - gap >= 60
    ? rect.top - height - gap
    : Math.min(vh - height - pad, rect.bottom + gap)
  return {
    vertical: false,
    shelf,
    width,
    height,
    positions: [{ x, y }, { x: x + width + gap, y }],
  }
}

export function PortraitRoleChoice({ children, roles, disabled, onSelect }: {
  children: ReactElement<HTMLAttributes<HTMLButtonElement>>
  roles: readonly Role[]
  disabled: boolean
  onSelect: (key: string) => void
}) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const liveLayout = useRef<Layout | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const selected = useRef<Choice>(null)
  const [choice, setChoice] = useState<Choice>(null)
  const finishing = useRef(false)
  const origin = useRef<{ left: number; top: number } | null>(null)

  function highlight(value: Choice) {
    selected.current = value
    setChoice(value)
  }
  function close() {
    gesture.current = null
    liveLayout.current = null
    setLayout(null)
    highlight(null)
  }
  function choose(value: Choice) {
    if (!liveLayout.current || finishing.current || disabled) return
    if (value === null) {
      close()
      return
    }
    finishing.current = true
    close()
    onSelect(roles[value].key)
  }
  function open() {
    if (disabled || roles.length !== 2) return false
    finishing.current = false
    const button = anchor.current?.querySelector('button')
    if (!button) return false
    let rect = button.getBoundingClientRect()
    if (document.documentElement.clientWidth < 768) {
      const margin = globalThis.innerHeight < 500 ? 140 : 170
      if (rect.top < margin || rect.bottom > globalThis.innerHeight - margin) {
        button.scrollIntoView({ block: 'center', behavior: 'instant' })
        rect = button.getBoundingClientRect()
      }
    }
    origin.current = { left: rect.left, top: rect.top }
    const next = place(rect)
    liveLayout.current = next
    setLayout(next)
    highlight(null)
    return true
  }
  function direction(x: number, y: number): Choice {
    const input = gesture.current
    const current = liveLayout.current
    if (!input || !current) return null
    const dx = x - input.x
    const dy = y - input.y
    input.moved ||= Math.abs(dx) + Math.abs(dy) > 8
    const delta = current.vertical ? dy : dx
    const cross = current.vertical ? dx : dy
    if (
      Math.abs(cross) > (current.shelf ? 200 : 120) || Math.abs(delta) > 460
    ) return null
    return Math.abs(delta) < 32 ? null : delta < 0 ? 0 : 1
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
      anchor.current?.querySelector('button')?.focus({ preventScroll: true })
      return
    }
    if (!liveLayout.current) return
    const before = liveLayout.current.vertical ? 'ArrowUp' : 'ArrowLeft'
    const after = liveLayout.current.vertical ? 'ArrowDown' : 'ArrowRight'
    if (event.key === before || event.key === after) {
      event.preventDefault()
      event.stopPropagation()
      const index = event.key === before ? 0 : 1
      highlight(index)
      panel.current?.querySelectorAll('button')[index]?.focus({
        preventScroll: true,
      })
    } else if (
      (event.key === 'Enter' || event.key === ' ') && selected.current !== null
    ) {
      event.preventDefault()
      event.stopPropagation()
      choose(selected.current)
    }
  }

  useEffect(() => {
    if (!layout) return
    const outside = (event: Event) => {
      const target = event.target as Node
      if (
        !anchor.current?.contains(target) && !panel.current?.contains(target)
      ) close()
    }
    const onScroll = () => {
      const rect = anchor.current?.querySelector('button')
        ?.getBoundingClientRect()
      if (
        rect && origin.current && (
          Math.abs(rect.left - origin.current.left) > 0.5 ||
          Math.abs(rect.top - origin.current.top) > 0.5
        )
      ) close()
    }
    const onVisibility = () => {
      if (document.hidden) close()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('scroll', onScroll, true)
    document.addEventListener('visibilitychange', onVisibility)
    globalThis.addEventListener('resize', close)
    globalThis.addEventListener('blur', close)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('scroll', onScroll, true)
      document.removeEventListener('visibilitychange', onVisibility)
      globalThis.removeEventListener('resize', close)
      globalThis.removeEventListener('blur', close)
    }
  }, [layout])

  return (
    <span
      ref={anchor}
      className='portrait-choice-anchor'
      data-open={!!layout}
      data-selected={choice !== null}
      onKeyDown={onKeyDown}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDownCapture={(event) => {
        if (
          (event.target as Element).closest('button') !==
            anchor.current?.querySelector('button')
        ) return
        if (disabled || !event.isPrimary || event.button !== 0) return
        if (!open()) return
        event.currentTarget.setPointerCapture(event.pointerId)
        gesture.current = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          moved: false,
        }
      }}
      onPointerMove={(event) => {
        if (gesture.current?.pointer === event.pointerId) {
          highlight(
            direction(event.clientX, event.clientY),
          )
        }
      }}
      onPointerUp={(event) => {
        if (gesture.current?.pointer !== event.pointerId) return
        const value = direction(event.clientX, event.clientY)
        const moved = gesture.current.moved
        gesture.current = null
        if (value !== null) choose(value)
        else if (moved) close()
      }}
      onPointerCancel={close}
      onLostPointerCapture={() => {
        if (gesture.current) close()
      }}
      onClickCapture={(event) => {
        if (
          (event.target as Element).closest('button') !==
            anchor.current?.querySelector('button')
        ) return
        event.preventDefault()
        event.stopPropagation()
        if (event.detail === 0 && open()) {
          requestAnimationFrame(() =>
            panel.current?.querySelector('button')?.focus({
              preventScroll: true,
            })
          )
        }
      }}
    >
      {roles.map((role) => (
        <link
          key={role.key}
          rel='preload'
          as='image'
          href={portraits[role.key]}
        />
      ))}
      {cloneElement(children, {
        'aria-expanded': !!layout,
        'aria-controls': layout ? `${id}-choices` : undefined,
        'aria-describedby': `${id}-hint`,
      })}
      <span id={`${id}-hint`} className='sr-only'>
        按住选择角色，向人物签所在方向滑动，松手创建。回到按钮取消。也可点击后选择人物签。
      </span>
      {layout && createPortal(
        <div
          ref={panel}
          id={`${id}-choices`}
          className='portrait-choices'
          role='group'
          aria-label='选择新智能体的角色'
          data-vertical={layout.vertical}
          data-shelf={layout.shelf}
          onKeyDown={onKeyDown}
        >
          {roles.map((role, index) => (
            <button
              key={role.key}
              type='button'
              className='portrait-choice'
              data-selected={choice === index}
              data-role-key={role.key}
              aria-label={`创建${role.name}`}
              style={{
                left: layout.positions[index].x,
                top: layout.positions[index].y,
                width: layout.width,
                height: layout.height,
                '--portrait-enter-x': layout.vertical
                  ? '0px'
                  : `${index === 0 ? 12 : -12}px`,
                '--portrait-enter-y': layout.vertical
                  ? `${index === 0 ? 10 : -10}px`
                  : '0px',
              } as CSSProperties}
              onFocus={() => highlight(index as Choice)}
              onPointerEnter={() => {
                if (!gesture.current) highlight(index as Choice)
              }}
              onPointerLeave={() => {
                if (!gesture.current) highlight(null)
              }}
              onClick={() => choose(index as Choice)}
            >
              <span className='portrait-choice-image'>
                <img src={portraits[role.key]} alt='' draggable={false} />
              </span>
              <span className='portrait-choice-copy'>
                <strong>{role.name}</strong>
                <span className='portrait-choice-instruction'>
                  <span aria-hidden='true'>
                    {layout.vertical
                      ? (index === 0 ? '↑' : '↓')
                      : (index === 0 ? '←' : '→')}
                  </span>
                </span>
              </span>
            </button>
          ))}
          <span className='sr-only' aria-live='polite'>
            {choice === null ? '请选择角色' : `松手创建${roles[choice].name}`}
          </span>
        </div>,
        document.body,
      )}
    </span>
  )
}
