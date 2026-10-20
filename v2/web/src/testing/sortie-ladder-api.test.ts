import { afterEach, expect, it, vi } from 'vitest'
import { sortieEntries } from '../features/sortie/fixtures'
import { createSortieLadderAPI } from './sortie-ladder-api'

afterEach(() => vi.useRealTimers())

function client() {
  const api = createSortieLadderAPI()
  return async (path: string, body?: unknown) => {
    const response = await api.handle(
      new Request(`http://demo/v1${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      path.split('?')[0],
    )
    expect(response).not.toBeNull()
    return { status: response!.status, body: await response!.json() }
  }
}

it('allows three concurrent battles across scenarios, starts each ticket once, and releases slots on completion', async () => {
  vi.useFakeTimers()
  const send = client()
  const mine = sortieEntries[0]
  const before = await send(`/ladder?scenarioID=${mine.scenarioID}`)
  const tickets = []
  for (const entry of [mine, sortieEntries[2], mine, sortieEntries[4]]) {
    const response = await send('/ladder/pairings', {
      versionID: entry.versionID,
    })
    expect(response.status).toBe(200)
    expect(response.body.opponent.side).not.toBe(entry.side)
    expect(response.body.opponent.scenarioID).toBe(entry.scenarioID)
    tickets.push(response.body.id)
  }
  expect((await send('/matches')).body.matches).toHaveLength(0)
  for (const ticket of tickets.slice(0, 3)) {
    const path = `/ladder/pairings/${ticket}/start`
    const started = await send(path, {})
    expect(started.status).toBe(200)
    expect(await send(path, {})).toEqual(started)
  }
  expect(
    (await send('/matches')).body.matches.filter((m: { finished: boolean }) =>
      !m.finished
    ),
  ).toHaveLength(3)
  expect((await send('/rewards')).body.balance).toBe(23900)
  expect(await send(`/ladder/pairings/${tickets[3]}/start`, {}))
    .toEqual({
      status: 429,
      body: { error: 'concurrency_limit', message: 'concurrency_limit' },
    })
  vi.advanceTimersByTime(45001)
  const after = (await send(`/ladder?scenarioID=${mine.scenarioID}`)).body
  const games = (record: { wins: number; losses: number; draws: number }) =>
    record.wins + record.losses + record.draws
  expect(games(after.entries[0].record) - games(before.body.entries[0].record))
    .toBe(2)
  expect((await send(`/ladder?scenarioID=${mine.scenarioID}`)).body).toEqual(
    after,
  )
  expect((await send(`/ladder/pairings/${tickets[3]}/start`, {})).status).toBe(
    200,
  )
  expect(
    (await send('/matches')).body.matches.filter((m: { finished: boolean }) =>
      !m.finished
    ),
  ).toHaveLength(1)
})

it('expires unused tickets without creating a battle or charging points', async () => {
  vi.useFakeTimers()
  const send = client()
  const ticket = await send('/ladder/pairings', {
    versionID: sortieEntries[0].versionID,
  })
  vi.advanceTimersByTime(600001)
  expect(await send(`/ladder/pairings/${ticket.body.id}/start`, {}))
    .toEqual({
      status: 409,
      body: { error: 'pairing_expired', message: 'pairing_expired' },
    })
  expect((await send('/matches')).body.matches).toHaveLength(0)
  expect((await send('/rewards')).body.balance).toBe(24200)
})

it('excludes ten or fewer games from the highest rate while retaining own records and matchmaking', async () => {
  vi.useFakeTimers()
  const send = client()
  const mine = sortieEntries.find((e) => e.wins + e.losses + e.draws === 0)!
  for (let count = 0; count <= 11; count++) {
    const overview = (await send(`/ladder?scenarioID=${mine.scenarioID}`)).body
    const own = overview.entries.find((e: { agentID: number }) =>
      e.agentID === mine.agentID
    ).record
    expect(own.wins + own.losses + own.draws).toBe(count)
    if (count <= 10) {
      expect(overview.highestWinRateAgentID).not.toBe(mine.agentID)
    }
    if (count === 0) {
      expect(overview.highestWinRate).toBeNull()
    }
    if (count === 11) {
      break
    }
    const ticket = await send('/ladder/pairings', { versionID: mine.versionID })
    expect((await send(`/ladder/pairings/${ticket.body.id}/start`, {})).status)
      .toBe(200)
    vi.advanceTimersByTime(45001)
  }
})
