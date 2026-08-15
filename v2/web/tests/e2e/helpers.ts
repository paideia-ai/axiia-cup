import {
  type APIRequestContext,
  expect,
  type Page,
  request,
} from '@playwright/test'

import { totp } from '../../e2e/http'

export const registrationCode = process.env.AXIIA_REGISTRATION_CODE ?? ''
export const scenarioID = process.env.AXIIA_SCENARIO_ID ?? ''
export const baseURL = process.env.AXIIA_BASE_URL ?? ''
const adminEmail = process.env.AXIIA_ADMIN_EMAIL ?? ''
const adminPassword = process.env.AXIIA_ADMIN_PASSWORD ?? ''
const adminTotpSecret = process.env.AXIIA_ADMIN_TOTP_SECRET ?? ''

// Cookie-credentialed mutations from a non-browser client must stamp the CSRF
// signal by hand (same idiom as e2e/http.ts and the critical spec).
export const sameOrigin = { 'Sec-Fetch-Site': 'same-origin' }

export function requireServerFixtures() {
  expect(
    registrationCode,
    'AXIIA_REGISTRATION_CODE is set by run-playwright.sh',
  )
    .not.toBe('')
  expect(scenarioID, 'AXIIA_SCENARIO_ID is set by run-playwright.sh').not.toBe(
    '',
  )
}

export async function signup(page: Page, label: string) {
  const email = `playwright-${label}-${Date.now()}@axiia.test`
  await page.goto('/register')
  await page.getByLabel('注册码').fill(registrationCode)
  await page.getByLabel('昵称').fill(`测试玩家 ${label}`)
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码').fill('playwrightpw-123456')
  await page.getByRole('button', { name: '创建账户' }).click()
  // A3：新账号注册后落首战快速通道 /express（未打过首战）；打过的账号
  // （或极老前端）仍回 /scenarios。两者都算注册成功。
  await expect(page).toHaveURL(/\/(express|scenarios)$/)
  return email
}

// ── Deterministic fixture scenario ──────────────────────────────────────────
//
// Model inference is not part of this gate, yet P3 (pve gate unlocks, paired
// challenge legs) and P6 (#39 stats threshold) need genuinely FINISHED, SCORED
// matches in the real database. A scenario is a deterministic QuickJS script,
// and only `say`/`act`/`random` ever touch a model — so a script that calls
// none of them completes on its first replay with zero inference. The side
// whose player prompt carries FIXTURE_WIN_TOKEN wins (ties fall to a), which
// lets a test decide every outcome from the prompt it saves.
export const FIXTURE_WIN_TOKEN = '【必胜】'
export const FIXTURE_PRESET_A = 'npc-a'
export const FIXTURE_PRESET_B = 'npc-b'
export const FIXTURE_SIDE_A_NAME = '正方'
export const FIXTURE_SIDE_B_NAME = '反方'

function fixtureScriptSource(id: string, title: string): string {
  return `const meta = {
  id: '${id}',
  title: '${title}',
  subject: '测试',
  sideAName: '${FIXTURE_SIDE_A_NAME}',
  sideBName: '${FIXTURE_SIDE_B_NAME}',
  sideALabel: '固定局正方',
  sideBLabel: '固定局反方',
  turnCount: 1,
  stages: [
    { id: 'main', title: '第一阶段·对话', channels: [{ id: 'main', label: '主频道' }] },
  ],
  presets: [
    { key: '${FIXTURE_PRESET_A}', side: 'a', label: '正方陪练', modelID: 'deepseek-v4-flash', prompt: '固定局陪练，不带暗记。' },
    { key: '${FIXTURE_PRESET_B}', side: 'b', label: '反方陪练', modelID: 'deepseek-v4-flash', prompt: '固定局陪练，不带暗记。' },
  ],
  speakerLabels: { a: '${FIXTURE_SIDE_A_NAME}', b: '${FIXTURE_SIDE_B_NAME}', judge: '裁判' },
}

// 固定局：无 say/act/random——首次重放即完局，胜负只看谁的提示词带暗记。
async function main() {
  const token = '${FIXTURE_WIN_TOKEN}'
  const a = game.playerPrompt('a').includes(token)
  const b = game.playerPrompt('b').includes(token)
  const winner = b && !a ? 'b' : 'a'
  game.emit('main', { type: 'scene', text: '固定局：双方亮出方略，裁判按暗记当场判定。' })
  return {
    winner: winner,
    scoreA: winner === 'a' ? 1 : 0,
    scoreB: winner === 'b' ? 1 : 0,
    reasoning: '固定局判定：持暗记的一侧胜。',
  }
}
`
}

// A real admin session over public HTTP: login, then TOTP elevation — the same
// path e2e/http.ts adminSession takes for the seed step.
//
// The server's ElevationGuard accepts each TOTP counter ONCE (monotonic
// anti-replay), so two fixture installs inside the same 30s window would make
// the second elevation fail. matchedCounter tolerates ±1 window of skew, so the
// NEXT window's code (a strictly larger counter) is also valid right now —
// try it before waiting for the window to roll over. The retry cadence stays
// under the guard's 5-attempts-per-minute throttle.
async function elevateAdmin(admin: APIRequestContext): Promise<boolean> {
  const deadline = Date.now() + 90_000
  for (;;) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    for (const at of [nowSeconds, nowSeconds + 30]) {
      const response = await admin.post('/v1/auth/elevate', {
        headers: sameOrigin,
        data: { code: await totp(adminTotpSecret, at) },
      })
      if (response.ok()) return true
    }
    if (Date.now() > deadline) return false
    const secondsToNextWindow = 31 - (nowSeconds % 30)
    await new Promise((resolve) =>
      setTimeout(resolve, secondsToNextWindow * 1000)
    )
  }
}

export async function adminContext(): Promise<APIRequestContext> {
  expect(adminEmail, 'AXIIA_ADMIN_EMAIL is set by run-playwright.sh').not.toBe(
    '',
  )
  const admin = await request.newContext({ baseURL })
  const login = await admin.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email: adminEmail, password: adminPassword },
  })
  expect(login.ok(), 'admin login succeeds').toBe(true)
  expect(await elevateAdmin(admin), 'admin TOTP elevation succeeds').toBe(true)
  return admin
}

// Publishes the fixture script and points a fresh slot at it. Callers pass a
// unique id per attempt so every retry gets its own slot (which is also what
// makes the slot the newest onlineAt in the catalog, #54).
export async function installFixtureScenario(id: string, title: string) {
  const admin = await adminContext()
  const upload = await admin.post('/v1/admin/scripts', {
    headers: sameOrigin,
    data: { source: fixtureScriptSource(id, title) },
  })
  expect(upload.ok(), 'fixture script upload succeeds').toBe(true)
  const { sha } = await upload.json() as { sha: string }
  const slot = await admin.patch(`/v1/admin/slots/${id}`, {
    headers: sameOrigin,
    data: { scriptSHA: sha },
  })
  expect(slot.ok(), 'fixture slot creation succeeds').toBe(true)
  await admin.dispose()
}

// ── API-side player actions (the seed-dev idiom over the public API) ────────

// A second logical user without a second browser context: signs up over HTTP
// and keeps its own cookie jar.
export async function apiSignup(label: string) {
  const context = await request.newContext({ baseURL })
  const email = `playwright-${label}-${Date.now()}@axiia.test`
  const displayName = `测试玩家 ${label}`
  const signup = await context.post('/v1/auth/signup', {
    headers: sameOrigin,
    data: {
      code: registrationCode,
      email,
      phone: null,
      password: 'playwrightpw-123456',
      displayName,
    },
  })
  expect(signup.ok(), `api signup ${label} succeeds`).toBe(true)
  const me = await (await context.get('/v1/auth/me')).json() as {
    account: { id: string }
  }
  return { context, email, displayName, accountID: me.account.id }
}

export async function submissionModelID(
  context: APIRequestContext,
): Promise<string> {
  const models = await context.get('/v1/models')
  expect(models.ok()).toBe(true)
  const list = (await models.json() as { models: { id: string }[] }).models
  return list.find((model) => model.id.includes('flash'))?.id ?? list[0].id
}

// ensure + save + mark entry on one side of a scenario, all over the API.
export async function saveEntryVersion(
  context: APIRequestContext,
  scenario: string,
  side: 'a' | 'b',
  prompt: string,
) {
  const ensure = await context.post('/v1/agents/ensure', {
    headers: sameOrigin,
    data: { scenarioID: scenario, side },
  })
  expect(ensure.ok(), `ensure agent ${scenario}/${side} succeeds`).toBe(true)
  const { agentID } = await ensure.json() as { agentID: number }
  const modelID = await submissionModelID(context)
  const save = await context.post(`/v1/agents/${agentID}/save`, {
    headers: sameOrigin,
    data: { prompt, modelID, parentVersionID: null },
  })
  expect(save.ok(), `save version ${scenario}/${side} succeeds`).toBe(true)
  const version = await save.json() as { id: number }
  const entry = await context.post(
    `/v1/agents/${agentID}/entry/${version.id}`,
    { headers: sameOrigin },
  )
  expect(entry.ok()).toBe(true)
  return { agentID, versionID: version.id }
}

// Dispatches a PVE match on the fixture scenario and waits for the scripted,
// model-free completion; asserts the fielded side really won (gate evidence).
export async function winFixturePVE(
  context: APIRequestContext,
  versionID: number,
  side: 'a' | 'b',
) {
  const presetKey = side === 'a' ? FIXTURE_PRESET_B : FIXTURE_PRESET_A
  const dispatch = await context.post('/v1/matches/pve', {
    headers: sameOrigin,
    data: { versionID, presetKey },
  })
  expect(dispatch.ok(), 'fixture pve dispatch succeeds').toBe(true)
  const { matchID } = await dispatch.json() as { matchID: number }
  await expect
    .poll(async () => {
      const detail = await context.get(`/v1/matches/${matchID}`)
      if (!detail.ok()) return null
      const body = await detail.json() as {
        summary: { finished: boolean; scored: boolean; winner?: string | null }
      }
      return body.summary.finished && body.summary.scored
        ? body.summary.winner
        : null
    }, { message: `fixture match ${matchID} finishes scored`, timeout: 20000 })
    .toBe(side)
  return matchID
}

export async function buildVersion(
  page: Page,
  side: 'a' | 'b',
  prompt: string,
) {
  await page.goto(`/scenarios/${scenarioID}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // P13：该侧已有策略时「去构建」会换成「再建一个」，按序号取按钮不再可靠
  // ——用逐侧稳定 testid（本函数只走该侧尚无策略的首建路径）。
  await page.getByTestId(side === 'a' ? 'build-agent' : 'build-agent-b')
    .click()
  await expect(page).toHaveURL(/\/agents\/\d+\/build/)
  const agentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())?.[1])
  expect(agentID).toBeGreaterThan(0)

  const promptInput = page.getByLabel('策略提示词')
  await expect(promptInput).toBeEnabled()
  await promptInput.fill(prompt)
  await expect(page.getByText(`${prompt.length} / 1000`)).toBeVisible()
  const save = page.getByTestId('save-version')
  await expect(save).toBeEnabled()
  await save.click()
  // #88：保存不再跳转——留在 E 页，版本线就地长出这一版。
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build`))
  await expect(page.getByTestId('version-card').first()).toBeVisible()

  const versionsResponse = await page.request.get(
    `/v1/agents/${agentID}/versions`,
  )
  expect(versionsResponse.ok()).toBe(true)
  const payload = await versionsResponse.json() as {
    versions: Array<{ id: number; prompt: string; isEntry: boolean }>
    entryVersionID: number
  }
  const version = payload.versions.at(-1)
  expect(version?.prompt).toBe(prompt)
  expect(payload.entryVersionID).toBe(version?.id)
  return { agentID, versionID: version!.id }
}
