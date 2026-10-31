import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useNavigationMemory } from '../context/navigation-memory'
import { positiveID } from './identity-links'

export function useMatchVersionFocus(ready: boolean) {
  const location = useLocation()
  const action = useNavigationType()
  const navigation = useNavigationMemory()
  // POP also describes a fresh deep link. Only a remembered visit should leave
  // scrolling to navigation restoration, including Back to the initial entry.
  const restoringVisit = action === 'POP' &&
    navigation?.memory.visits.some((visit) =>
      visit.key === location.key && visit.position != null
    )
  const params = new URLSearchParams(location.search)
  const versionID = positiveID(params.get('version'))
  const matchID = positiveID(params.get('match'))
  useEffect(() => {
    if (restoringVisit || !ready || versionID == null || matchID == null) return
    const frame = requestAnimationFrame(() => {
      document.querySelector(`[data-version-id="${versionID}"]`)
        ?.scrollIntoView({ block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.key, ready, versionID, matchID, restoringVisit])
}
