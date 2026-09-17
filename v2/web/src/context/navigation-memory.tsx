import {
  createContext,
  type PropsWithChildren,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

import {
  type NavigationMemory,
  readNavigationMemory,
  recordVisit,
  saveNavigationMemory,
  type ScrollPosition,
} from '../lib/navigation-memory'

interface ScrollController {
  pending: Set<symbol>
  restoring: boolean
  wake: () => void
  listeners: Set<() => void>
}
interface MemoryContext {
  memory: NavigationMemory
  key: string
  scroll: ScrollController
}
const Context = createContext<MemoryContext | null>(null)
const RESTORE_TIMEOUT_MS = 10_000

function capturePosition(): ScrollPosition {
  const y = globalThis.scrollY
  // Stable list items preserve what the reader saw when new rows arrive above.
  const anchor = Array.from(
    document.querySelectorAll<HTMLElement>('[data-scroll-anchor]'),
  )
    .find((element) => {
      const rect = element.getBoundingClientRect()
      return rect.bottom > 56 && rect.top < globalThis.innerHeight
    })
  const id = anchor?.dataset.scrollAnchor
  return id
    ? { y, anchor: { id, top: anchor.getBoundingClientRect().top } }
    : { y }
}

export function NavigationMemoryProvider({
  scope,
  enabled = true,
  children,
}: PropsWithChildren<{ scope: string; enabled?: boolean }>) {
  const location = useLocation()
  const action = useNavigationType()
  const [memory, setMemory] = useState(() => readNavigationMemory(scope))
  const memoryRef = useRef(memory)
  const scopeRef = useRef<string | null>(null)
  const previousURL = useRef<string | null>(null)
  const scroll = useMemo<ScrollController>(() => ({
    pending: new Set(),
    restoring: false,
    wake: () => {},
    listeners: new Set(),
  }), [])
  const url = location.pathname + location.search + location.hash

  useLayoutEffect(() => {
    if (!enabled) return
    const previousMode = globalThis.history.scrollRestoration
    globalThis.history.scrollRestoration = 'manual'
    return () => {
      globalThis.history.scrollRestoration = previousMode
    }
  }, [enabled])

  useLayoutEffect(() => {
    if (!enabled) return
    if (scopeRef.current !== scope) {
      memoryRef.current = scopeRef.current == null
        ? readNavigationMemory(scope)
        : { visits: [], index: -1 }
      scopeRef.current = scope
      previousURL.current = null
    }
    const last = memoryRef.current.visits[memoryRef.current.index]
    // Query changes and clearing one-shot route state must not jump the reader.
    const samePage = action !== 'POP' && previousURL.current != null &&
      previousURL.current.split(/[?#]/)[0] === location.pathname
    const next = recordVisit(memoryRef.current, {
      key: location.key,
      url,
      ...(samePage && last?.position ? { position: last.position } : {}),
    }, action)
    memoryRef.current = next
    previousURL.current = url
    setMemory(next)
    const visit = next.visits[next.index]
    const remembered = visit.position
    const target = remembered ?? { y: 0 }
    scroll.restoring = true
    let frame = 0
    let settled = false
    let lastPosition = target
    let persistTimer: ReturnType<typeof setTimeout> | undefined
    const persist = () => saveNavigationMemory(scope, next)
    const save = () => {
      if (scroll.restoring) return
      lastPosition = capturePosition()
      visit.position = lastPosition
      clearTimeout(persistTimer)
      persistTimer = setTimeout(persist, 150)
    }
    const finish = () => {
      if (settled) return
      settled = true
      scroll.restoring = false
      clearTimeout(deadline)
      observer.disconnect()
      save()
      for (const listener of scroll.listeners) listener()
    }
    const restore = () => {
      frame = 0
      if (settled || scroll.pending.size > 0) return
      let top = target.y
      if (target.anchor) {
        const anchor = Array.from(
          document.querySelectorAll<HTMLElement>('[data-scroll-anchor]'),
        )
          .find((element) => element.dataset.scrollAnchor === target.anchor?.id)
        if (anchor) {
          top = globalThis.scrollY + anchor.getBoundingClientRect().top -
            target.anchor.top
        }
      } else if (!remembered && location.hash) {
        let id = location.hash.slice(1)
        try {
          id = decodeURIComponent(id)
        } catch { /* Keep the literal hash. */ }
        const anchor = document.getElementById(id)
        if (anchor) {
          top = globalThis.scrollY + anchor.getBoundingClientRect().top - 56
        }
      }
      globalThis.scrollTo({ top: Math.max(0, top), behavior: 'instant' })
      // Once data is ready, a shorter/deleted result is allowed to clamp to its end.
      finish()
    }
    const schedule = () => {
      if (!settled && !frame) frame = requestAnimationFrame(restore)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(document.body)
    scroll.wake = schedule
    const interrupt = (event: Event) => {
      if (
        event instanceof KeyboardEvent &&
        !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
          .includes(event.key)
      ) return
      finish()
    }
    const flush = () => {
      save()
      persist()
    }
    globalThis.addEventListener('scroll', save, { passive: true })
    globalThis.addEventListener('wheel', interrupt, { passive: true })
    globalThis.addEventListener('touchstart', interrupt, { passive: true })
    globalThis.addEventListener('keydown', interrupt)
    globalThis.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    const deadline = setTimeout(finish, RESTORE_TIMEOUT_MS)
    persist()
    schedule()
    return () => {
      // Read the last observed position, not the new route's already shortened DOM.
      visit.position = lastPosition
      persist()
      clearTimeout(deadline)
      clearTimeout(persistTimer)
      cancelAnimationFrame(frame)
      observer.disconnect()
      scroll.wake = () => {}
      globalThis.removeEventListener('scroll', save)
      globalThis.removeEventListener('wheel', interrupt)
      globalThis.removeEventListener('touchstart', interrupt)
      globalThis.removeEventListener('keydown', interrupt)
      globalThis.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [
    location.key,
    url,
    location.pathname,
    location.hash,
    action,
    scope,
    enabled,
    scroll,
  ])

  return (
    <Context.Provider value={{ memory, key: location.key, scroll }}>
      {children}
    </Context.Provider>
  )
}

export function useNavigationMemory() {
  return useContext(Context)
}

// Async page content registers readiness; polling with existing content does not
// start a new restoration or move the viewport. Standalone stories need no provider.
export function useScrollPending(pending: boolean) {
  const context = useNavigationMemory()
  const scroll = context?.scroll
  const key = context?.key
  useLayoutEffect(() => {
    if (!scroll || !pending) return
    const token = Symbol()
    scroll.pending.add(token)
    return () => {
      scroll.pending.delete(token)
      scroll.wake()
    }
  }, [scroll, key, pending])
}
