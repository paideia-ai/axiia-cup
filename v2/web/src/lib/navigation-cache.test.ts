import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { agents, builder, catalog, matches } from '../api/client'
import {
  invalidateNavigation,
  navigationCache,
  resetNavigationCache,
  setNavigationIdentity,
} from './navigation-cache'
import { catalogQuery, inventoryQuery } from './navigation-queries'
import { finishedMatch } from '../testing/v34-fixtures'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  resetNavigationCache()
})
afterEach(() => {
  resetNavigationCache()
  vi.unstubAllGlobals()
})

describe('navigation data lifetime', () => {
  it('coalesces simultaneous catalog reads but separates guest credentials', async () => {
    const response = deferred<Response>()
    const fetch = vi.fn(() => response.promise.then((value) => value.clone()))
    vi.stubGlobal('fetch', fetch)
    const first = catalog.scenarios()
    const second = catalog.scenarios()
    const guest = catalog.scenarios({ credentials: 'omit' })
    expect(fetch).toHaveBeenCalledTimes(2)
    response.resolve(Response.json({ scenarios: [] }))
    await Promise.all([first, second, guest])
    expect(await first).toEqual(await second)
  })

  it('reuses a fresh catalog on revisit and invalidates it after dispatch', async () => {
    const fetch = vi.fn(() => Promise.resolve(Response.json({ scenarios: [] })))
    vi.stubGlobal('fetch', fetch)
    await navigationCache.fetchQuery(catalogQuery())
    await navigationCache.fetchQuery(catalogQuery())
    expect(fetch).toHaveBeenCalledTimes(1)
    await matches.dispatchPVE({ versionID: 1, presetKey: 'test' })
    expect(
      navigationCache.getQueryState(catalogQuery().queryKey)?.isInvalidated,
    ).toBe(true)
    await navigationCache.fetchQuery(catalogQuery())
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('invalidates cached inventories after successful save, rename and delete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ ok: true }))),
    )
    const actions = [
      () => builder.save(101, { prompt: 'test', modelID: 'test', note: '' }),
      () => agents.rename(101, { name: 'new' }),
      () => agents.remove(101),
      () => builder.setEntry(101, 1002),
    ]
    for (const action of actions) {
      navigationCache.setQueryData(inventoryQuery().queryKey, { scenarios: [] })
      await action()
      expect(
        navigationCache.getQueryState(inventoryQuery().queryKey)?.isInvalidated,
      ).toBe(true)
    }
  })

  it('does not discard valid inventory when a mutation fails', async () => {
    navigationCache.setQueryData(inventoryQuery().queryKey, { scenarios: [] })
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json({ error: 'failed', message: '失败' }, { status: 503 }),
        )
      ),
    )
    await expect(agents.remove(101)).rejects.toThrow('失败')
    expect(
      navigationCache.getQueryState(inventoryQuery().queryKey)?.isInvalidated,
    ).toBe(false)
  })

  it('separates accounts and rejects an old account response arriving late', async () => {
    setNavigationIdentity('alice:false')
    const old = deferred<Response>()
    const fetch = vi.fn().mockImplementationOnce(() => old.promise)
      .mockImplementation(() =>
        Promise.resolve(Response.json({ scenarios: ['bob'] }))
      )
    vi.stubGlobal('fetch', fetch)
    const first = navigationCache.fetchQuery(inventoryQuery()).catch(() => null)
    setNavigationIdentity('bob:false')
    await navigationCache.fetchQuery(inventoryQuery())
    old.resolve(Response.json({ scenarios: ['alice'] }))
    await first
    expect(navigationCache.getQueryData(inventoryQuery().queryKey)).toEqual({
      scenarios: ['bob'],
    })
    expect(fetch).toHaveBeenCalledTimes(2)
    setNavigationIdentity(null)
    expect(navigationCache.getQueryData(inventoryQuery().queryKey))
      .toBeUndefined()
  })

  it('does not reuse an in-flight pre-mutation read after a successful write', async () => {
    const old = deferred<Response>()
    const fetch = vi.fn().mockImplementationOnce(() => old.promise)
      .mockImplementation(() =>
        Promise.resolve(Response.json({ scenarios: ['new'] }))
      )
    vi.stubGlobal('fetch', fetch)
    const first = navigationCache.fetchQuery(inventoryQuery()).catch(() => null)
    await agents.rename(101, { name: 'new' })
    await navigationCache.fetchQuery(inventoryQuery())
    old.resolve(Response.json({ scenarios: ['old'] }))
    await first
    expect(navigationCache.getQueryData(inventoryQuery().queryKey)).toEqual({
      scenarios: ['new'],
    })
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('refreshes after an SSE completion without joining an obsolete read', async () => {
    const old = deferred<Response>()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementationOnce(() => old.promise)
        .mockImplementation(() =>
          Promise.resolve(Response.json({ scenarios: ['completed'] }))
        ),
    )
    const first = navigationCache.fetchQuery(inventoryQuery()).catch(() => null)
    invalidateNavigation('/matches/completed')
    await navigationCache.fetchQuery(inventoryQuery())
    old.resolve(Response.json({ scenarios: ['running'] }))
    await first
    expect(navigationCache.getQueryData(inventoryQuery().queryKey)).toEqual({
      scenarios: ['completed'],
    })
  })
})

describe('match view receipts', () => {
  const summary = { ...finishedMatch.summary, viewed: false }
  const lists = [['matches'], ['matches', 'identity', '101']] as const
  function seed() {
    for (const key of lists) {
      navigationCache.setQueryData(key, {
        matches: [summary, { ...summary, id: 9002 }],
        open: true,
      })
    }
    navigationCache.setQueryData(['match', summary.id], {
      ...finishedMatch,
      summary,
    })
    navigationCache.setQueryData(['inventory'], { scenarios: [] })
  }
  it('updates the viewed match in every cached history without invalidating unrelated data', async () => {
    seed()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ ok: true }))),
    )
    await matches.markViewed(summary.id)
    for (const key of lists) {
      expect(navigationCache.getQueryData(key)).toEqual({
        matches: [{ ...summary, viewed: true }, { ...summary, id: 9002 }],
        open: true,
      })
      expect(navigationCache.getQueryState(key)?.isInvalidated).toBe(true)
    }
    expect(navigationCache.getQueryData(['match', summary.id])).toEqual({
      ...finishedMatch,
      summary: { ...summary, viewed: true },
    })
    expect(navigationCache.getQueryState(['inventory'])?.isInvalidated).toBe(
      false,
    )
  })
  it('keeps unread state when saving the view fails', async () => {
    seed()
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json({ error: 'failed', message: 'failed' }, {
            status: 503,
          }),
        )
      ),
    )
    await expect(matches.markViewed(summary.id)).rejects.toThrow()
    expect(navigationCache.getQueryData(['match', summary.id])).toEqual({
      ...finishedMatch,
      summary,
    })
  })
  it('ignores a previous account receipt arriving after an account switch', async () => {
    setNavigationIdentity('alice:views')
    seed()
    const response = deferred<Response>()
    vi.stubGlobal('fetch', vi.fn(() => response.promise))
    const write = matches.markViewed(summary.id)
    setNavigationIdentity('bob:views')
    seed()
    response.resolve(Response.json({ ok: true }))
    await write
    expect(navigationCache.getQueryData(['match', summary.id])).toEqual({
      ...finishedMatch,
      summary,
    })
    expect(navigationCache.getQueryState(['matches'])?.isInvalidated).toBe(
      false,
    )
  })
})
