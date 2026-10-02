import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
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

function followBottom(pinnedAt: RefObject<number | null>) {
  globalThis.scrollTo({ top: document.documentElement.scrollHeight })
  pinnedAt.current = globalThis.scrollY
}

// `startAtBottom`: following starts at once instead of waiting for the reader to
// reach the bottom (a replay the reader has just started).
export function usePinToBottom(
  active: boolean,
  signal: unknown,
  startAtBottom = false,
) {
  const pinned = useRef(true)
  // Where following last left the reader. The page only grows below it, so a
  // reader above this point has scrolled up; one at or below it has not.
  const pinnedAt = useRef<number | null>(null)
  const memory = useNavigationMemory()
  const scroll = memory?.scroll

  useEffect(() => {
    if (!active) return
    const onScroll = () => {
      if (scroll?.restoring) return
      // The event for our own scroll can land after the page grew again; that
      // growth is not the reader scrolling up.
      const stayed = pinned.current && pinnedAt.current != null &&
        globalThis.scrollY >= pinnedAt.current
      pinned.current = stayed || distanceFromBottom() <= NEAR_BOTTOM_PX
      pinnedAt.current = pinned.current ? globalThis.scrollY : null
    }
    // Text in a font still loading grows once the font arrives, with no new row
    // to signal it; a reader who follows stays at the bottom through it.
    const onFontsLoaded = () => {
      if (pinned.current && !scroll?.restoring) followBottom(pinnedAt)
    }
    if (startAtBottom && !scroll?.restoring) {
      pinned.current = true
      followBottom(pinnedAt)
    } else onScroll()
    globalThis.addEventListener('scroll', onScroll, { passive: true })
    document.fonts?.addEventListener('loadingdone', onFontsLoaded)
    scroll?.listeners.add(onScroll)
    return () => {
      globalThis.removeEventListener('scroll', onScroll)
      document.fonts?.removeEventListener('loadingdone', onFontsLoaded)
      scroll?.listeners.delete(onScroll)
    }
  }, [active, scroll, startAtBottom])

  useEffect(() => {
    if (!active || !pinned.current || scroll?.restoring) return
    // The scroll event arrives a frame after the page moved. A jump the listener
    // has not seen yet (focusing a judge note from the trend chart) still means
    // the reader left the bottom, and a refresh in between must not undo it.
    if (
      pinnedAt.current != null &&
      globalThis.scrollY < pinnedAt.current - NEAR_BOTTOM_PX &&
      distanceFromBottom() > NEAR_BOTTOM_PX
    ) {
      pinned.current = false
      pinnedAt.current = null
      return
    }
    followBottom(pinnedAt)
    // A render later in this task (a chart moved below the transcript) can grow
    // the page again: follow once more on the next frame.
    const frame = requestAnimationFrame(() => {
      if (pinned.current && !scroll?.restoring) followBottom(pinnedAt)
    })
    return () => cancelAnimationFrame(frame)
  }, [active, signal, scroll])
}
