import { useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Restore explicit returns to the inventory as well as browser back/forward.
// Store scroll events while the old page is mounted; reading scrollY after a
// shorter destination renders would lose the old position to browser clamping.
export function DemoScrollRestoration() {
  const { key, pathname } = useLocation()
  const navigation = useNavigationType()
  const entries = useRef(new Map<string, number>())
  const inventoryY = useRef(0)
  useLayoutEffect(() => {
    const previous = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => {
      history.scrollRestoration = previous
    }
  }, [])
  useLayoutEffect(() => {
    const entryID = `${key}:${pathname}`
    const target = pathname === '/my-agents'
      ? inventoryY.current
      : navigation === 'POP'
      ? entries.current.get(entryID) ?? 0
      : 0
    globalThis.scrollTo({ top: target, left: 0, behavior: 'instant' })
    const remember = () => {
      entries.current.set(entryID, globalThis.scrollY)
      if (pathname === '/my-agents') inventoryY.current = globalThis.scrollY
    }
    globalThis.addEventListener('scroll', remember, { passive: true })
    return () => globalThis.removeEventListener('scroll', remember)
  }, [key, pathname, navigation])
  return null
}
