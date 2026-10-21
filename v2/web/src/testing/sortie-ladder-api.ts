import type { LadderEntryDTO, LadderPairingResponse } from '../api/types'
import {
  demoOpponents,
  sortieEntries,
  type SortieEntry,
} from '../features/sortie/fixtures'
import {
  candidatePool,
  type Entry,
  gamesPlayed,
  pickOpponent,
  winRate,
} from '../features/sortie/matchmaking'
import { createSortieMatches } from './sortie-demo-matches'
import { config } from './v34-fixtures'

export function createSortieLadderAPI() {
  const matches = createSortieMatches()
  const pairings = new Map<string, {
    ticket: LadderPairingResponse
    own: SortieEntry
    opponent: Entry & { name: string }
    matchID?: number
  }>()
  const concurrencyLimit = 3
  let balance = 24200
  const error = (code: string, status: number) =>
    Response.json({ error: code, message: code }, { status })
  const dto = (entry: Entry): LadderEntryDTO => {
    const role = sortieEntries.find((e) =>
      e.scenarioID === entry.scenarioID && e.side === entry.side
    )!
    return {
      agentID: entry.agentID,
      versionID: entry.versionID,
      ordinal: 'ordinal' in entry ? Number(entry.ordinal) : 1,
      ownerID: entry.ownerID,
      ownerName: demoOpponents.find((e) => e.agentID === entry.agentID)?.name ??
        '你',
      scenarioID: entry.scenarioID,
      side: entry.side,
      role: { key: role.roleKey, name: role.roleName, side: entry.side },
      record: matches.record(entry),
    }
  }
  async function handle(
    request: Request,
    path: string,
  ): Promise<Response | null> {
    if (request.method === 'GET' && path === '/config') {
      return Response.json({
        ...config,
        concurrencyLimit,
        usage: {
          battlesToday: matches.summaries().length,
          pvpBattlesToday: matches.summaries().length,
        },
      })
    }
    if (request.method === 'GET' && path === '/rewards') {
      return Response.json({
        balance,
        dailyAllowance: 1000,
        battleCost: 100,
        dailyRuns: 10,
        pveWinRefundPercent: 50,
        pvpWinRefundPercent: 80,
        pointsPerYuan: 100,
        nextGrantAt: 0,
        claimableRewards: [],
      })
    }
    if (request.method === 'GET' && path === '/ladder') {
      const scenarioID = new URL(request.url).searchParams.get('scenarioID')
      const entries = sortieEntries.filter((e) => e.scenarioID === scenarioID)
      const leader = [
        ...entries,
        ...demoOpponents.filter((e) => e.scenarioID === scenarioID),
      ]
        .filter((e) => e.active && gamesPlayed(matches.record(e)) > 10)
        .map((e) => ({ agentID: e.agentID, rate: winRate(matches.record(e))! }))
        .sort((a, b) => b.rate - a.rate || a.agentID - b.agentID)[0]
      return Response.json({
        entries: entries.map(dto),
        highestWinRate: leader?.rate ?? null,
        highestWinRateAgentID: leader?.agentID ?? null,
      })
    }
    if (request.method === 'POST' && path === '/ladder/pairings') {
      let input: { versionID?: number }
      try {
        input = await request.json()
      } catch {
        return error('bad_request', 400)
      }
      const own = sortieEntries.find((e) => e.versionID === input?.versionID)
      if (!own) return error('entry_changed', 409)
      const pool = candidatePool(
        { ...own, ...matches.record(own) },
        demoOpponents.map((e) => ({ ...e, ...matches.record(e) })),
      )
      const chosen = pickOpponent(pool)
      const opponent = demoOpponents.find((e) => e.agentID === chosen?.agentID)
      if (!opponent) return error('no_opponent', 409)
      const ticket = {
        id: crypto.randomUUID(),
        expiresAt: Math.floor(Date.now() / 1000) + 600,
        entry: dto(own),
        opponent: dto(opponent),
      }
      for (const [id, previous] of pairings) {
        if (previous.matchID == null) pairings.delete(id)
      }
      pairings.set(ticket.id, { ticket, own, opponent })
      return Response.json(ticket)
    }
    const start = /^\/ladder\/pairings\/([^/]+)\/start$/.exec(path)
    if (request.method === 'POST' && start) {
      const pairing = pairings.get(start[1])
      if (!pairing) return error('not_found', 404)
      if (pairing.matchID != null) {
        return Response.json({ matchID: pairing.matchID })
      }
      if (pairing.ticket.expiresAt <= Date.now() / 1000) {
        return error('pairing_expired', 409)
      }
      if (
        matches.summaries().filter((m) => !m.finished).length >=
          concurrencyLimit
      ) {
        return error('concurrency_limit', 429)
      }
      if (balance < 100) return error('insufficient_points', 402)
      const outcome =
        (['win', 'loss', 'draw'] as const)[Math.floor(Math.random() * 3)]
      const result = matches.create(pairing.own, pairing.opponent, outcome)
      pairing.matchID = result.matchID
      balance -= 100
      return Response.json(result)
    }
    return matches.handle(request, path)
  }
  return { handle, record: matches.record }
}

export const sortieLadderAPI = createSortieLadderAPI()
