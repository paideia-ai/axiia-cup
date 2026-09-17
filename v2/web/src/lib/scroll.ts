import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Scroll is the page's own state, not a function of the data. Two rules, both
// about never moving the viewport out from under the reader:
//
//  - A live transcript follows the bottom ONLY while the reader is already there.
//    One scroll upward unpins it and nothing re-pins it but scrolling back down.
//  - A navigation remembers where each visit left off. Returning to a match or an
//    archive lands where you were; a fresh visit starts at the top. Neither a
//    poll, a refetch, nor an SSE reconnect is a navigation, so none of them move
//    the page at all.

const NEAR_BOTTOM_PX = 96

function distanceFromBottom(): number {
  return document.documentElement.scrollHeight - globalThis.innerHeight -
    globalThis.scrollY
}

export function usePinToBottom(active: boolean, signal: unknown) {
  const pinned = useRef(true)

  useEffect(() => {
    if (!active) return
    const onScroll = () => {
      pinned.current = distanceFromBottom() <= NEAR_BOTTOM_PX
    }
    onScroll()
    globalThis.addEventListener('scroll', onScroll, { passive: true })
    return () => globalThis.removeEventListener('scroll', onScroll)
  }, [active])

  useEffect(() => {
    if (!active || !pinned.current) return
    globalThis.scrollTo({ top: document.documentElement.scrollHeight })
  }, [active, signal])
}

// Keyed by the history entry, so back/forward restores its own offset while a new
// push starts at the top. In memory only: a reload is a fresh visit.
const offsets = new Map<string, number>()

const INTERRUPTS = ['wheel', 'touchstart', 'keydown'] as const

export function useScrollMemory() {
  const { key, pathname, search } = useLocation()
  // The inventory's own return links create new history entries. Remember each
  // filtered inventory separately, without changing fresh visits to other pages.
  const inventories = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const previous = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = previous
    }
  }, [])

  useLayoutEffect(() => {
    const inventoryKey = pathname === '/my-agents' ? pathname + search : null
    const target = offsets.get(key) ??
      (inventoryKey ? inventories.current.get(inventoryKey) : undefined) ?? 0
    let restoring = true
    let frame = 0
    const stop = () => {
      restoring = false
      observer?.disconnect()
      if (timeout) clearTimeout(timeout)
      cancelAnimationFrame(frame)
    }
    const remember = () => {
      if (restoring) return
      offsets.set(key, globalThis.scrollY)
      if (inventoryKey) {
        inventories.current.set(inventoryKey, globalThis.scrollY)
      }
    }
    const restore = () => {
      if (!restoring) return
      globalThis.scrollTo({ top: target, left: 0, behavior: 'instant' })
      if (Math.abs(globalThis.scrollY - target) <= 1) {
        stop()
        remember()
      }
    }
    const interrupt = () => {
      stop()
      remember()
    }
    // API-backed lists can grow after the first paint. Retry on layout changes,
    // but stop as soon as the reader interacts or the saved offset is reached.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(restore)
    })
    observer.observe(document.body)
    const timeout = setTimeout(stop, 5000)
    for (const event of INTERRUPTS) {
      globalThis.addEventListener(event, interrupt, { passive: true })
    }
    restore()
    globalThis.addEventListener('scroll', remember, { passive: true })
    return () => {
      // The destination may already have shortened the DOM and clamped scrollY.
      // Keep the offset captured while the old page was still being read.
      stop()
      globalThis.removeEventListener('scroll', remember)
      for (const event of INTERRUPTS) {
        globalThis.removeEventListener(event, interrupt)
      }
    }
  }, [key, pathname, search])
}
