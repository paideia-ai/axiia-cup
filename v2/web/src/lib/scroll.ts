import { useEffect, useRef } from 'react'
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

const RESTORE_FRAMES = 40
const INTERRUPTS = ['wheel', 'touchstart', 'keydown'] as const

export function useScrollMemory() {
  const { key, pathname } = useLocation()

  useEffect(() => {
    const target = offsets.get(key) ?? 0
    let restoring = true
    let frames = 0
    let handle = 0

    // The page is empty on mount and grows as its data lands, so the remembered
    // offset is not reachable yet. Keep asking until it is — and stop the moment
    // the reader touches the page, which outranks any remembered position.
    const restore = () => {
      if (!restoring) return
      globalThis.scrollTo({ top: target })
      frames += 1
      if (
        Math.abs(globalThis.scrollY - target) > 1 && frames < RESTORE_FRAMES
      ) {
        handle = requestAnimationFrame(restore)
      } else {
        restoring = false
      }
    }
    const interrupt = () => {
      restoring = false
    }
    for (const event of INTERRUPTS) {
      globalThis.addEventListener(event, interrupt, { passive: true })
    }
    restore()

    const onScroll = () => {
      if (!restoring) offsets.set(key, globalThis.scrollY)
    }
    globalThis.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      offsets.set(key, globalThis.scrollY)
      cancelAnimationFrame(handle)
      globalThis.removeEventListener('scroll', onScroll)
      for (const event of INTERRUPTS) {
        globalThis.removeEventListener(event, interrupt)
      }
    }
  }, [key, pathname])
}
