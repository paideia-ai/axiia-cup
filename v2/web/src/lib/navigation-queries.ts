import { queryOptions } from '@tanstack/react-query'

import {
  ApiError,
  builder,
  catalog,
  matches,
  myAgents,
  notifications,
  tournaments,
} from '../api/client'
import type { Side } from '../api/types'
import { navigationCache } from './navigation-cache'

export const catalogQuery = (credentials: RequestCredentials = 'include') =>
  queryOptions({
    queryKey: ['catalog', credentials],
    queryFn: () => catalog.scenarios({ credentials }),
    staleTime: 30_000,
  })
export const scenarioQuery = (
  id: string,
  side: Side = 'a',
  credentials: RequestCredentials = 'include',
) =>
  queryOptions({
    queryKey: ['catalog', credentials, id, side],
    queryFn: () => catalog.scenario(id, side, { credentials }),
    staleTime: 30_000,
  })
export const modelsQuery = () =>
  queryOptions({
    queryKey: ['models'],
    queryFn: () => catalog.models(),
    staleTime: 30_000,
  })
export const inventoryQuery = () =>
  queryOptions({
    queryKey: ['inventory'],
    queryFn: () => myAgents.list(),
  })
export const matchesQuery = () =>
  queryOptions({
    queryKey: ['matches'],
    queryFn: () => matches.list(),
  })
export const matchQuery = (id: number) =>
  queryOptions({
    queryKey: ['match', id],
    queryFn: () => matches.detail(id),
    staleTime: 0,
  })
export const tournamentsQuery = () =>
  queryOptions({
    queryKey: ['tournaments'],
    queryFn: () => tournaments.list(),
  })
export const standingsQuery = (id: number) =>
  queryOptions({
    queryKey: ['standings', id],
    queryFn: () => tournaments.standings(id),
  })
export const notificationsQuery = () =>
  queryOptions({
    queryKey: ['notifications'],
    queryFn: () => notifications.list(),
  })
export const draftQuery = (id: number) =>
  queryOptions({
    queryKey: ['agent', id, 'draft'],
    staleTime: 0,
    queryFn: () => builder.draft(id),
  })
export const versionsQuery = (id: number) =>
  queryOptions({
    queryKey: ['agent', id, 'versions'],
    staleTime: 0,
    queryFn: () => builder.versions(id),
  })

export const agentQuery = (id: number) =>
  queryOptions({
    queryKey: ['agent', id, 'view'],
    queryFn: async () => {
      let draft
      try {
        draft = await navigationCache.fetchQuery(draftQuery(id))
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          return {
            kind: 'public' as const,
            requestedAgentID: id,
            publicView: await builder.public(id),
          }
        }
        throw error
      }
      const [scenario, list] = await Promise.all([
        navigationCache.fetchQuery(scenarioQuery(draft.scenarioID, draft.side)),
        navigationCache.fetchQuery(versionsQuery(id)),
      ])
      return {
        kind: 'owner' as const,
        requestedAgentID: id,
        draft,
        scenario,
        versions: list.versions,
        entryVersionID: list.entryVersionID ?? null,
      }
    },
  })
