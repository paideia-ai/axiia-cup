// Dev seeder: fills a local `axiia serve` with fake players who have real agents
// on every catalog scenario, so PVE presets, friendly PVP and hotseat are all
// exercisable without hand-building an opponent first.
//
// It only speaks the public API. Mint an admin out of band (possession-of-db is
// root), then:
//
//   axiia admin mint --email admin@axiia.test --name Admin --password 'adminpw-123456'
//   deno run -A packages/axiia-web/e2e/seed-dev.ts \
//     http://127.0.0.1:8080 admin@axiia.test 'adminpw-123456' <TOTP-SECRET>
//
// Re-running is safe: signup falls back to login, agents are ensured rather than
// created, and a saved version is simply appended. Every seeded player uses the
// password below, so you can log in as one from the SPA.

import { adminSession, HttpError, Session } from './http.ts'
import type { RoleContext } from './seed-prompts.ts'
import { seedPrompt } from './seed-prompts.ts'

const [baseURL, adminEmail, adminPassword, totpSecret, codeArg] = Deno.args
if (!baseURL || !adminEmail || !adminPassword || !totpSecret) {
  console.error(
    'usage: seed-dev.ts <baseURL> <adminEmail> <adminPassword> <totpSecret> [registrationCode]',
  )
  Deno.exit(2)
}

const registrationCode = codeArg ?? 'SEEDDEV'
const PLAYER_PASSWORD = 'seedpw-123456'

interface Player {
  email: string
  displayName: string
  style: string
}

const PLAYERS: Player[] = [
  {
    email: 'jiangpan@axiia.test',
    displayName: '江畔听雨',
    style:
      '你的风格是以退为进：先接住对方的话，让他觉得被理解，再在他松劲的一刻把结论换掉。少用感叹句。',
  },
  {
    email: 'tieyan@axiia.test',
    displayName: '铁砚',
    style:
      '你的风格是强攻：开口就抛先例与数字，逐条压过去，不给对方铺陈的机会。每一轮至少引用一个具体事例。',
  },
  {
    email: 'qiufen@axiia.test',
    displayName: '秋分',
    style:
      '你的风格是讲故事：把每个论点落到一个具体的人身上，用细节让裁判看见后果。抽象词能删就删。',
  },
  {
    email: 'wuming@axiia.test',
    displayName: '无名氏',
    style:
      '你的风格是极简：只给条件与代价，不解释动机。每一轮不超过五句话，句句可以被当成条款。',
  },
]

interface ScenarioSummary {
  id: string
  title: string
  sideAName: string
  sideBName: string
  sideALabel: string
  sideBLabel: string
}

interface ScenarioDetail {
  summary: ScenarioSummary
}

type Side = 'a' | 'b'

const admin = await adminSession(
  baseURL,
  adminEmail,
  adminPassword,
  totpSecret,
)
await admin.call('POST', '/v1/admin/registration-codes', {
  code: registrationCode,
  uses: 1000,
})

const catalog = await admin.call<{ scenarios: ScenarioSummary[] }>(
  'GET',
  '/v1/scenarios',
)
if (catalog.scenarios.length === 0) {
  console.error('the binary catalog is empty; nothing to seed against')
  Deno.exit(1)
}

const models = await admin.call<{ models: { id: string; label: string }[] }>(
  'GET',
  '/v1/models',
)
if (models.models.length === 0) {
  console.error('GET /v1/models returned nothing; cannot pick a seed model')
  Deno.exit(1)
}
// Seeded opponents are sparring partners, not showcases: take the cheap model
// when the catalog offers it.
const seedModel =
  models.models.find((model) => model.id.includes('flash'))?.id ??
    models.models[0].id

async function playerSession(player: Player): Promise<Session> {
  const session = new Session(baseURL)
  try {
    await session.call('POST', '/v1/auth/signup', {
      code: registrationCode,
      email: player.email,
      phone: null,
      password: PLAYER_PASSWORD,
      displayName: player.displayName,
    })
    return session
  } catch (cause) {
    if (!(cause instanceof HttpError) || cause.status >= 500) throw cause
    const existing = new Session(baseURL)
    await existing.call('POST', '/v1/auth/login', {
      email: player.email,
      password: PLAYER_PASSWORD,
    })
    return existing
  }
}

function roleContext(detail: ScenarioDetail, side: Side): RoleContext {
  const summary = detail.summary
  return {
    scenarioTitle: summary.title,
    selfName: side === 'a' ? summary.sideAName : summary.sideBName,
    opponentName: side === 'a' ? summary.sideBName : summary.sideAName,
    selfLabel: side === 'a' ? summary.sideALabel : summary.sideBLabel,
    opponentLabel: side === 'a' ? summary.sideBLabel : summary.sideALabel,
  }
}

let agents = 0
let versions = 0

for (const player of PLAYERS) {
  const session = await playerSession(player)
  for (const scenario of catalog.scenarios) {
    for (const side of ['a', 'b'] as const) {
      const detail = await session.call<ScenarioDetail>(
        'GET',
        `/v1/scenarios/${encodeURIComponent(scenario.id)}?side=${side}`,
      )
      const { agentID } = await session.call<{ agentID: number }>(
        'POST',
        '/v1/agents/ensure',
        { scenarioID: scenario.id, side },
      )
      agents += 1

      const context = roleContext(detail, side)
      const prompt = `${seedPrompt(context, scenario.id)}\n\n${player.style}`
      await session.call('POST', `/v1/agents/${agentID}/mutate`, {
        field: 'prompt',
        value: prompt,
      })
      const version = await session.call<{ id: number }>(
        'POST',
        `/v1/agents/${agentID}/save`,
        { prompt, modelID: seedModel, parentVersionID: null },
      )
      await session.call(
        'POST',
        `/v1/agents/${agentID}/entry/${version.id}`,
      )
      versions += 1
    }
  }
}

console.log(
  JSON.stringify({
    registrationCode,
    playerPassword: PLAYER_PASSWORD,
    players: PLAYERS.map((player) => player.email),
    scenarios: catalog.scenarios.map((scenario) => scenario.id),
    scenarioID: catalog.scenarios[0].id,
    scenarioTitle: catalog.scenarios[0].title,
    model: seedModel,
    agents,
    versions,
  }),
)
