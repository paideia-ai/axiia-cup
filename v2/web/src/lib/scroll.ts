import { useEffect, useRef } from 'react'
import { useNavigationMemory } from '../context/navigation-memory'

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
  const memory = useNavigationMemory()
  const scroll = memory?.scroll

  useEffect(() => {
    if (!active) return
    const onScroll = () => {
      if (scroll?.restoring) return
      pinned.current = distanceFromBottom() <= NEAR_BOTTOM_PX
    }
    onScroll()
    globalThis.addEventListener('scroll', onScroll, { passive: true })
    scroll?.listeners.add(onScroll)
    return () => {
      globalThis.removeEventListener('scroll', onScroll)
      scroll?.listeners.delete(onScroll)
    }
  }, [active, scroll])

  useEffect(() => {
    if (!active || !pinned.current || scroll?.restoring) return
    globalThis.scrollTo({ top: document.documentElement.scrollHeight })
  }, [active, signal, scroll])
}
