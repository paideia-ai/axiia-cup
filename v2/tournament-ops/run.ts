// Drives one axiia tournament through its admin API — a single operator verb,
// or the whole lifecycle with `auto`. Built to run unattended from the
// tournament-ops workflow, and to be safe to re-run: `pair` refuses to
// double-dispatch an already-paired round, `enroll` skips versions the
// tournament already holds, and `seed` is a plain reassignment.
//
// Auth, in order of precedence:
//   AXIIA_TOKEN   — any bearer that passes the tournament gate (local fallback)
//   AXIIA_COOKIE  — an elevated admin session's Cookie header (local fallback)
//   GitHub OIDC   — ACTIONS_ID_TOKEN_REQUEST_TOKEN/URL, exchanged at
//                   /v1/auth/federated for a `federated-tournament` token and
//                   re-exchanged before its ten-minute expiry
//
// Inputs come from the environment; see README.md for every variable.

const baseURL = (Deno.env.get('AXIIA_BASE_URL') ?? '').replace(/\/$/, '')
const op = Deno.env.get('OP')?.trim() ?? ''
if (!baseURL || !op) {
  console.error('AXIIA_BASE_URL and OP are both required')
  Deno.exit(2)
}

function env(name: string): string | undefined {
  const value = Deno.env.get(name)?.trim()
  return value ? value : undefined
}

function intEnv(name: string): number | undefined {
  const raw = env(name)
  if (raw === undefined) return undefined
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value)) {
    console.error(`${name} is not an integer: ${raw}`)
    Deno.exit(2)
  }
  return value
}

function floatEnv(name: string): number | undefined {
  const raw = env(name)
  if (raw === undefined) return undefined
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) {
    console.error(`${name} is not a number: ${raw}`)
    Deno.exit(2)
  }
  return value
}

function required(name: string): string {
  const value = env(name)
  if (value === undefined) {
    console.error(`${name} is required for op=${op}`)
    Deno.exit(2)
  }
  return value
}

const pollSeconds = intEnv('POLL_SECONDS') ?? 30
const timeoutMinutes = intEnv('TIMEOUT_MINUTES') ?? 240

// --- auth -------------------------------------------------------------------

const staticToken = env('AXIIA_TOKEN')
const cookieHeader = env('AXIIA_COOKIE')
let minted: { token: string; at: number } | undefined

async function freshToken(): Promise<string> {
  if (staticToken) return staticToken
  // Re-exchange with two minutes of slack: the assertion can always be minted
  // again, so nothing durable is cached here.
  if (minted && Date.now() - minted.at < 480_000) return minted.token
  const requestToken = env('ACTIONS_ID_TOKEN_REQUEST_TOKEN')
  const requestURL = env('ACTIONS_ID_TOKEN_REQUEST_URL')
  if (!requestToken || !requestURL) {
    console.error(
      'no credential: set AXIIA_TOKEN or AXIIA_COOKIE, or run under GitHub Actions with id-token: write',
    )
    Deno.exit(2)
  }
  const assertionResponse = await fetch(
    `${requestURL}&audience=${encodeURIComponent(baseURL)}`,
    { headers: { authorization: `Bearer ${requestToken}` } },
  )
  if (!assertionResponse.ok) {
    throw new Error(`OIDC assertion request -> ${assertionResponse.status}`)
  }
  const assertion = (await assertionResponse.json() as { value?: string }).value
  if (!assertion) throw new Error('OIDC assertion response carried no value')
  const exchange = await fetch(`${baseURL}/v1/auth/federated`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ assertion }),
  })
  if (!exchange.ok) {
    throw new Error(
      `federated exchange refused (${exchange.status}); is the tournament-ops policy deployed?`,
    )
  }
  const token = (await exchange.json() as { accessToken: string }).accessToken
  console.log('exchanged a fresh federated token')
  minted = { token, at: Date.now() }
  return token
}

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {}
  if (staticToken || !cookieHeader) {
    headers.authorization = `Bearer ${await freshToken()}`
  } else {
    // Cookie auth is CSRF-gated; a scripted same-origin fetch declares itself.
    headers.cookie = cookieHeader
    headers['sec-fetch-site'] = 'same-origin'
  }
  if (body !== undefined) headers['content-type'] = 'application/json'
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  console.log(`${method} ${path} -> ${response.status}`)
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${text}`)
  }
  return (text ? JSON.parse(text) : undefined) as T
}

// --- API shapes (the slice this operator reads) -----------------------------

interface Round {
  id: number
  roundNumber: number
  status: string
  phase: string
}

interface Tournament {
  id: number
  scenarioID: string
  status: string
  currentRound: number
  totalRounds: number
  rounds: Round[]
}

interface StandingsEntry {
  playerID: string
  playerName: string
  submissionIDs: number[]
  wins: number
  losses: number
  matchesPlayed: number
  rank: number
}

interface Standings {
  entries: StandingsEntry[]
}

interface PairedMatch {
  matchID: number
  sideAVersionID: number
  sideBVersionID: number
}

interface Paired {
  roundID: number
  roundNumber: number
  phase: string
  matches: PairedMatch[]
  byes: number[]
}

interface MatchRow {
  id: number
  finished: boolean
  scored: boolean
}

async function tournament(id: number): Promise<Tournament> {
  const listed = await api<{ tournaments: Tournament[] }>(
    'GET',
    '/v1/tournaments',
  )
  const found = listed.tournaments.find((entry) => entry.id === id)
  if (!found) throw new Error(`tournament ${id} not found`)
  return found
}

function standings(id: number): Promise<Standings> {
  return api<Standings>('GET', `/v1/tournaments/${id}/standings`)
}

function playedSum(current: Standings): number {
  return current.entries.reduce((sum, entry) => sum + entry.matchesPlayed, 0)
}

function enrolledVersions(current: Standings): Set<number> {
  return new Set(current.entries.flatMap((entry) => entry.submissionIDs))
}

function tournamentID(): number {
  const id = intEnv('TOURNAMENT_ID')
  if (id === undefined) {
    console.error(`TOURNAMENT_ID is required for op=${op}`)
    Deno.exit(2)
  }
  return id
}

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000))

// --- operator verbs ---------------------------------------------------------

async function create(): Promise<number> {
  const scenarioID = required('SCENARIO_ID')
  const totalRounds = intEnv('TOTAL_ROUNDS') ?? 3
  const { id } = await api<{ id: number }>('POST', '/v1/admin/tournaments', {
    scenarioID,
    totalRounds,
  })
  console.log(`created tournament ${id}: ${scenarioID}, ${totalRounds} rounds`)
  return id
}

async function enroll(id: number) {
  const wanted = required('VERSION_IDS').split(',').map((raw) =>
    Number.parseInt(raw.trim(), 10)
  )
  if (wanted.some((value) => !Number.isFinite(value))) {
    console.error('VERSION_IDS must be a CSV of integers')
    Deno.exit(2)
  }
  const already = enrolledVersions(await standings(id))
  for (const versionID of wanted) {
    if (already.has(versionID)) {
      console.log(`version ${versionID} already enrolled, skipping`)
      continue
    }
    await api('POST', `/v1/admin/tournaments/${id}/participants`, { versionID })
    console.log(`enrolled version ${versionID}`)
  }
}

async function seed(id: number, cutoff: number | undefined) {
  const body = cutoff === undefined ? {} : { qualifierCutoff: cutoff }
  const seeded = await api<
    { entrants: { versionID: number; phase: string }[] }
  >(
    'POST',
    `/v1/admin/tournaments/${id}/seed`,
    body,
  )
  const byPhase = new Map<string, number>()
  for (const entrant of seeded.entrants) {
    byPhase.set(entrant.phase, (byPhase.get(entrant.phase) ?? 0) + 1)
  }
  console.log(
    `seeded ${seeded.entrants.length} entrants: ${
      [...byPhase].map(([phase, count]) => `${count} ${phase}`).join(', ') ||
      'none'
    }`,
  )
}

// Pairing is the one verb the server does not make idempotent — each call cuts
// a fresh round and dispatches its matches — so the guard lives here: an
// already-existing roundNumber is never paired again.
async function pair(
  id: number,
  roundNumber?: number,
): Promise<Paired | undefined> {
  const phase = env('PHASE') ?? 'main'
  const current = await tournament(id)
  const target = roundNumber ?? intEnv('ROUND_NUMBER') ??
    Math.max(0, ...current.rounds.map((round) => round.roundNumber)) + 1
  const existing = current.rounds.find((round) => round.roundNumber === target)
  if (existing) {
    console.log(
      `round ${target} already paired (row ${existing.id}, ${existing.status}); refusing to double-dispatch`,
    )
    return undefined
  }
  const paired = await api<Paired>(
    'POST',
    `/v1/admin/tournaments/${id}/rounds/pair`,
    {
      phase,
      roundNumber: target,
    },
  )
  console.log(
    `paired round ${paired.roundNumber} (${paired.phase}): ${paired.matches.length} matches` +
      (paired.byes.length ? `, byes ${paired.byes.join(',')}` : ''),
  )
  for (const match of paired.matches) {
    console.log(
      `  match ${match.matchID}: #${match.sideAVersionID} vs #${match.sideBVersionID}`,
    )
  }
  return paired
}

// A match enters the standings when it is scored, adding one matchesPlayed to
// each side, so a known baseline says exactly when a round of M matches is
// done: sum(matchesPlayed) reaches baseline + 2M. When the server also runs
// with AXIIA_OPEN_BATTLES the match list is checked directly. A resumed round
// (no pair response in hand) falls back to a stability heuristic — said loudly,
// because a failed match never scores and would look "stable" too.
async function waitForRound(
  id: number,
  paired: Paired | undefined,
  baseline: number | undefined,
) {
  const deadline = Date.now() + timeoutMinutes * 60_000
  let stable = 0
  let last = -1
  while (Date.now() < deadline) {
    if (paired) {
      const listing = await api<{ matches: MatchRow[]; open: boolean }>(
        'GET',
        '/v1/matches',
      )
      if (listing.open) {
        const ours = paired.matches.map((match) =>
          listing.matches.find((row) => row.id === match.matchID)
        )
        const scored = ours.filter((row) => row?.scored).length
        const finished = ours.filter((row) => row?.finished).length
        console.log(
          `round progress: ${finished} finished, ${scored}/${paired.matches.length} scored`,
        )
        if (scored === paired.matches.length) return
      } else if (baseline !== undefined) {
        const played = playedSum(await standings(id))
        const target = baseline + 2 * paired.matches.length
        console.log(
          `round progress: standings played sum ${played}, waiting for ${target}`,
        )
        if (played >= target) return
      } else {
        throw new Error(
          'cannot watch this round: closed battle list and no baseline',
        )
      }
    } else {
      const played = playedSum(await standings(id))
      if (played === last) stable += 1
      else stable = 0
      last = played
      console.log(
        `HEURISTIC wait (resumed round): played sum ${played}, stable for ${stable} polls of 5`,
      )
      if (stable >= 5) return
    }
    await sleep(pollSeconds)
  }
  throw new Error(
    `timed out after ${timeoutMinutes} minutes waiting for the round; it was NOT closed. ` +
      'A match that failed never scores — inspect the matches, then re-run advance.',
  )
}

async function closeRound(id: number, roundNumber: number) {
  const row = (await tournament(id)).rounds.find((round) =>
    round.roundNumber === roundNumber
  )
  if (!row) {
    throw new Error(`round ${roundNumber} not found on tournament ${id}`)
  }
  if (row.status === 'done') {
    console.log(`round ${roundNumber} already done`)
    return
  }
  await api('PATCH', `/v1/admin/rounds/${row.id}`, { status: 'done' })
  console.log(`round ${roundNumber} closed`)
}

async function advance(id: number) {
  const current = await tournament(id)
  const target = intEnv('ROUND_NUMBER')
  const row = target !== undefined
    ? current.rounds.find((round) => round.roundNumber === target)
    : current.rounds.filter((round) => round.status !== 'done')
      .sort((a, b) => a.roundNumber - b.roundNumber)[0]
  if (!row) {
    console.log('no open round to advance')
    return
  }
  await waitForRound(id, undefined, undefined)
  await closeRound(id, row.roundNumber)
}

async function promote(id: number) {
  const slots = intEnv('SLOTS')
  if (slots === undefined) {
    console.error('SLOTS is required for op=promote')
    Deno.exit(2)
  }
  const result = await api<{ promoted: number[] }>(
    'POST',
    `/v1/admin/tournaments/${id}/promote`,
    { slots },
  )
  console.log(`promoted to 正赛: ${result.promoted.join(', ') || 'nobody'}`)
}

async function finish(id: number) {
  await api('PATCH', `/v1/admin/tournaments/${id}`, { status: 'finished' })
  console.log(`tournament ${id} finished`)
}

async function status(id: number) {
  const current = await tournament(id)
  console.log(
    `tournament ${current.id}: ${current.scenarioID}, ${current.status}, ` +
      `round ${current.currentRound}/${current.totalRounds}`,
  )
  for (const round of current.rounds) {
    console.log(
      `  round ${round.roundNumber} (${round.phase}): ${round.status}`,
    )
  }
  const table = await standings(id)
  for (const entry of table.entries) {
    console.log(
      `  #${entry.rank} ${entry.playerName}: ${entry.wins}W/${entry.losses}L ` +
        `over ${entry.matchesPlayed} matches (versions ${
          entry.submissionIDs.join(',')
        })`,
    )
  }
}

// The whole lifecycle: create (unless TOURNAMENT_ID resumes one) → enroll →
// seed → per round: pair, watch, close → finish. Every step re-reads the
// server first, so a crashed run picks up where it stopped.
async function auto() {
  let id = intEnv('TOURNAMENT_ID')
  if (id === undefined) id = await create()
  else console.log(`operating existing tournament ${id}`)

  if (env('VERSION_IDS')) await enroll(id)
  const field = enrolledVersions(await standings(id))
  if (field.size < 2) {
    throw new Error(
      `only ${field.size} enrolled versions; auto needs at least 2 — pass VERSION_IDS`,
    )
  }

  const phase = env('PHASE') ?? 'main'
  let cutoff = floatEnv('QUALIFIER_CUTOFF')
  if (cutoff === undefined && phase === 'main') {
    // Single-phase default: without a cutoff the server sends everyone through
    // 海选, which would leave the main pool empty. Cutoff 0 seeds all into 正赛.
    cutoff = 0
    console.log('no QUALIFIER_CUTOFF; seeding everyone straight into 正赛')
  }
  await seed(id, cutoff)
  await api('PATCH', `/v1/admin/tournaments/${id}`, { status: 'running' })

  const current = await tournament(id)
  const firstRound =
    Math.max(0, ...current.rounds.map((round) => round.roundNumber)) + 1
  for (
    let roundNumber = firstRound;
    roundNumber <= current.totalRounds;
    roundNumber++
  ) {
    const baseline = playedSum(await standings(id))
    const paired = await pair(id, roundNumber)
    await waitForRound(id, paired, baseline)
    await closeRound(id, roundNumber)
  }

  await finish(id)
  await status(id)
}

// --- dispatch ---------------------------------------------------------------

try {
  switch (op) {
    case 'create':
      await create()
      break
    case 'enroll':
      await enroll(tournamentID())
      break
    case 'seed':
      await seed(tournamentID(), floatEnv('QUALIFIER_CUTOFF'))
      break
    case 'pair':
      await pair(tournamentID())
      break
    case 'advance':
      await advance(tournamentID())
      break
    case 'promote':
      await promote(tournamentID())
      break
    case 'finish':
      await finish(tournamentID())
      break
    case 'status':
      await status(tournamentID())
      break
    case 'auto':
      await auto()
      break
    default:
      console.error(`unknown op ${op}`)
      Deno.exit(2)
  }
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error))
  Deno.exit(1)
}
