import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { positiveID } from './identity-links'

export function useMatchVersionFocus(ready: boolean) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const versionID = positiveID(params.get('version'))
  const matchID = positiveID(params.get('match'))
  useEffect(() => {
    if (!ready || versionID == null || matchID == null) return
    const frame = requestAnimationFrame(() => {
      document.querySelector(`[data-version-id="${versionID}"]`)
        ?.scrollIntoView({ block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.key, ready, versionID, matchID])
}
