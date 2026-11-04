// One `next` step: read the scenario's matches by tag, derive the state,
// report what is pending or failed, and submit whatever the current round
// still needs (its pairs, the moment the previous round settles).
//
// The server has no concurrency cap, so a step submits at most
// backend.maxInFlight minus the games already queued or running for this
// scenario; the rest go out on later steps as games finish (`next --watch`).

import type { Backend } from './backend/backend.ts'
import { derive, retryItems, scenarioTag, type TournamentState } from './engine.ts'
import type { TournamentDir } from './roster.ts'
import type { SubmitItem } from './types.ts'

export interface NextOptions {
  retry?: boolean
  // With retry: leave a slot alone once it has failed this many times.
  maxAttempts?: number
  dryRun?: boolean
  log?: (line: string) => void
}

export interface NextResult {
  state: TournamentState
  submitted: SubmitItem[]
  created: number
  // Games this round still needs that pacing held back for a later step.
  heldBack: number
}

const MAX_BYTES = 256
const byteLength = (s: string) => new TextEncoder().encode(s).length

// The server's per-field limits, checked before anything is sent.
export function checkItem(item: SubmitItem): void {
  const fields = [item.key, item.seed ?? 'x', ...item.tags]
  if (item.tags.length < 1 || item.tags.length > 16) {
    throw new Error(`${item.key}: ${item.tags.length} tags (server allows 1–16)`)
  }
  for (const f of fields) {
    const n = byteLength(f)
    if (n < 1 || n > MAX_BYTES) {
      throw new Error(`${item.key}: "${f.slice(0, 40)}…" is ${n} bytes (server allows 1–256)`)
    }
  }
}

export async function runNext(
  t: TournamentDir,
  backend: Backend,
  opts: NextOptions = {},
): Promise<NextResult> {
  const log = opts.log ?? console.log
  const matches = await backend.query([scenarioTag(t.roster)])
  const state = derive({
    roster: t.roster,
    matches,
    rulings: t.rulings,
    withdrawals: t.withdrawals,
  })
  const wanted = [...state.toSubmit, ...(opts.retry ? retryItems(state, opts.maxAttempts) : [])]
  wanted.forEach(checkItem)
  const budget = Math.max(0, backend.maxInFlight - state.pendingGames)
  const items = wanted.slice(0, budget)
  const heldBack = wanted.length - items.length
  let created = 0
  if (items.length && !opts.dryRun) {
    created = (await backend.submit(items)).filter((r) => r.created).length
  }
  const where = state.frontier
    ? `${state.frontier.stage} round ${state.frontier.round}`
    : 'complete'
  log(`${t.roster.scenarioID}: ${where}`)
  if (state.done) {
    log(`  champion: ${state.ko.champion ?? '(none)'}`)
  }
  if (state.pendingGames) log(`  pending games: ${state.pendingGames}`)
  if (state.failed.length) {
    log(
      `  failed games: ${state.failed.length}${
        opts.retry ? ' (resubmitted)' : ' (rerun with --retry to resubmit)'
      }`,
    )
    for (const f of state.failed.slice(0, 20)) {
      log(`    ${f.pairID}/${f.slot} after ${f.attempts} attempt(s): ${f.error ?? ''}`)
    }
  }
  if (state.awaitingRuling.length) {
    log(`  awaiting 组委会 ruling (add to rulings.json "pairs"):`)
    for (const id of state.awaitingRuling) {
      const pair = state.pairs.get(id)!
      log(`    ${id}: ${pair.p} vs ${pair.q} — ${pair.note ?? ''}`)
    }
  }
  if (state.blocked) log(`  blocked: ${state.blocked}`)
  if (items.length) {
    log(
      `  ${opts.dryRun ? 'would submit' : 'submitted'} ${items.length} game(s)` +
        (opts.dryRun ? '' : ` (${created} new)`),
    )
  }
  if (heldBack) {
    log(
      `  ${heldBack} more game(s) wait for room (max ${backend.maxInFlight} in flight)`,
    )
  }
  return { state, submitted: items, created, heldBack }
}
