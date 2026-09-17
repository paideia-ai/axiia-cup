import { navigationCache } from './navigation-cache'
import {
  agentQuery,
  catalogQuery,
  draftQuery,
  inventoryQuery,
  matchesQuery,
  matchQuery,
  notificationsQuery,
  scenarioQuery,
  standingsQuery,
  tournamentsQuery,
  versionsQuery,
} from './navigation-queries'

// Only read-only routes are eligible. Build-entry/ensure and dispatch are never
// executed speculatively. Mobile taps and keyboard focus share the same path.
export function prefetchNavigation(path: string, authenticated: boolean) {
  const connection =
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection
  if (connection?.saveData) return
  const credentials = authenticated ? 'include' : 'omit'
  if (path === '/scenarios') {
    void navigationCache.prefetchQuery(catalogQuery(credentials))
    return
  }
  const scenario = /^\/scenarios\/([^/]+)$/.exec(path)
  if (scenario) {
    void navigationCache.prefetchQuery(
      scenarioQuery(decodeURIComponent(scenario[1]), 'a', credentials),
    )
    if (authenticated) void navigationCache.prefetchQuery(inventoryQuery())
    return
  }
  if (!authenticated) return
  if (path === '/my-agents') {
    void navigationCache.prefetchQuery(catalogQuery())
    void navigationCache.prefetchQuery(inventoryQuery())
  } else if (path === '/matches') {
    void navigationCache.prefetchQuery(matchesQuery())
    void navigationCache.prefetchQuery(catalogQuery())
  } else if (path === '/tournaments') {
    void navigationCache.prefetchQuery(tournamentsQuery())
  } else if (path === '/notifications') {
    void navigationCache.prefetchQuery(notificationsQuery())
  } else {
    const target = /^\/(agents|matches|tournaments)\/(\d+)(\/build)?$/.exec(
      path,
    )
    if (!target) return
    const id = Number(target[2])
    if (target[1] === 'agents') {
      if (target[3]) {
        void navigationCache.prefetchQuery(draftQuery(id))
        void navigationCache.prefetchQuery(versionsQuery(id))
      } else {
        void navigationCache.prefetchQuery(agentQuery(id))
        void navigationCache.prefetchQuery(inventoryQuery())
      }
    } else if (!target[3] && target[1] === 'matches') {
      void navigationCache.prefetchQuery(matchQuery(id))
    } else if (!target[3]) {
      void navigationCache.prefetchQuery(standingsQuery(id))
    }
  }
}
