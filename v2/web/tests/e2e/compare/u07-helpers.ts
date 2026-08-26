// U07 专用辅助（新文件，不动 helpers.ts）：战报响应夹具的两种视角变体、
// 固定局真对局（PVE + 左右手互搏 PVP）的一次性 API 装配，与浏览器免 UI 登录。
//
// 口径（tests/e2e/README.md / v34-critical）：完局报告的富层次（问询/隐藏
// 目标/心声/计分账目/回放）用确定性 response fixture 呈现——本地闸门刻意
// 零模型推理；版本 id/入口/泄露契约层则由无模型固定局在真服上产生。
import { type APIRequestContext, expect, type Page } from '@playwright/test'

import type { MatchDetail } from '../../../src/api/types'
import { scriptEvent } from '../../../src/lib/event'
import { finishedMatch } from '../../../src/testing/v34-fixtures'
import {
  apiSignup,
  FIXTURE_WIN_TOKEN,
  installFixtureScenario,
  sameOrigin,
  saveEntryVersion,
  winFixturePVE,
} from '../helpers'

export const RICH_MATCH_ID = 9001
export const PASSWORD = 'playwrightpw-123456'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// 富战报（商鞅庭辩响应夹具）+ 准驳 verdict 事件：score 事件只带 trueRequests/
// guesses/ledger，rulings 按契约坐在 verdict 事件上——补上它，「准驳结果」
// 行与隐藏目标「是否达成」才走真路径。
//
// viewer 'probe'＝#20 服务端契约的响应形状：非所有者拿到的 payload 里，
// 他人己方（a 侧玩家）的 reasoning 已被服务端剥离；b 是 NPC（#80 公开），
// judge 生成层公开（#22②）。UI 层断言以此形状驱动；剥离本身的服务端强断言
// 见 spec 的 @fixme（本地零推理栈无带 reasoning 的真对局可证）。
export function richMatch(viewer: 'owner' | 'probe'): MatchDetail {
  const match = clone(finishedMatch)
  const ruling = match.turns.find((turn) =>
    scriptEvent(turn)?.type === 'verdict'
  )
  const rulingEvent = ruling == null ? null : scriptEvent(ruling)
  if (ruling != null && rulingEvent != null) {
    ruling.event = {
      ...rulingEvent,
      requests: { SR2: '同意', GR2: '驳回' },
    }
  }
  if (viewer === 'probe') {
    for (const turn of match.turns) {
      if (turn.speaker === 'a') turn.reasoning = null
    }
    match.summary.participants!.a.isMine = false
  }
  return match
}

export async function mockMatch(page: Page, id: number, payload: MatchDetail) {
  await page.route(`**/v1/matches/${id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    }))
}

// 把浏览器上下文登录成指定账号（u13 idiom）：page.request 与页面共用
// cookie 罐，POST 落会话 cookie 后 SPA 首次加载即已登录。
export async function uiLogin(page: Page, email: string) {
  const login = await page.request.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email, password: PASSWORD },
  })
  expect(login.ok(), `browser login ${email} succeeds`).toBe(true)
}

// 左右手互搏（#65 hotseat）：同主两侧版本经公开 API 对打——被 v34-critical
// 证明无需 PVP 门槛即放行，产生 kind='pvp'、双侧都带 versionID 的完局素材。
export async function dispatchHotseat(
  context: APIRequestContext,
  versionID: number,
  opponentAgentID: number,
): Promise<number> {
  const response = await context.post('/v1/matches/pvp', {
    headers: sameOrigin,
    data: { versionID, opponentAgentID },
  })
  expect(response.ok(), 'hotseat pvp dispatch succeeds').toBe(true)
  const body = await response.json() as { matchID?: number; id?: number }
  const matchID = body.matchID ?? body.id
  expect(typeof matchID, 'pvp dispatch returns a match id').toBe('number')
  return matchID as number
}

// 固定局对局完局轮询：无模型脚本首次重放即完局，超时即真异常。
export async function pollMatchDone(
  context: APIRequestContext,
  matchID: number,
  timeout = 30_000,
) {
  await expect
    .poll(async () => {
      const detail = await context.get(`/v1/matches/${matchID}`)
      if (!detail.ok()) return false
      const body = await detail.json() as {
        summary: { finished: boolean; scored: boolean }
      }
      return body.summary.finished && body.summary.scored
    }, { message: `match ${matchID} finishes scored`, timeout })
    .toBe(true)
}

// ── 真对局素材：惰性一次性装配（workers=1，首个真对局场景付装配成本）────
//
// 不复用远端专用变量（AXIIA_MATCH_ID/AXIIA_OWNER_EMAIL…）：本地栈是全新库，
// 管理员现场装载无模型固定局场景，帐号现场注册，PVE + 互搏 PVP 各完局一场。

export interface RealFixtureState {
  ownerEmail: string
  probeEmail: string
  pveMatchID: number
  pvpMatchID: number
}

let realFixture: Promise<RealFixtureState> | null = null

export function ensureRealFixture(): Promise<RealFixtureState> {
  realFixture ??= provisionRealFixture()
  return realFixture
}

async function provisionRealFixture(): Promise<RealFixtureState> {
  const fixtureID = `u07-fixture-${Date.now()}`
  await installFixtureScenario(fixtureID, 'U07 战报固定局')
  const owner = await apiSignup('u07-owner')
  const sideA = await saveEntryVersion(
    owner.context,
    fixtureID,
    'a',
    `${FIXTURE_WIN_TOKEN} 正方按固定局暗记出战，用于 U07 战报审计。`,
  )
  const sideB = await saveEntryVersion(
    owner.context,
    fixtureID,
    'b',
    '反方不带暗记：U07 左右手互搏的对手侧。',
  )
  const pveMatchID = await winFixturePVE(owner.context, sideA.versionID, 'a')
  const pvpMatchID = await dispatchHotseat(
    owner.context,
    sideA.versionID,
    sideB.agentID,
  )
  await pollMatchDone(owner.context, pvpMatchID)
  const probe = await apiSignup('u07-probe')
  const state: RealFixtureState = {
    ownerEmail: owner.email,
    probeEmail: probe.email,
    pveMatchID,
    pvpMatchID,
  }
  await owner.context.dispose()
  await probe.context.dispose()
  return state
}
