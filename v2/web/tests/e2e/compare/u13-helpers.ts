// U13 专用辅助（新文件，不动 helpers.ts）：真服登录、固定局对局完局轮询、
// 双侧约战与全页截图。全部走公开 HTTP API，同 e2e/http.ts 的口径。
import { mkdirSync } from 'node:fs'

import {
  type APIRequestContext,
  expect,
  type Page,
  request,
} from '@playwright/test'

import { baseURL, sameOrigin } from '../helpers'

// 截图归档目录：默认落 test-results，跑批时用 U13_SHOTS_DIR 指到评审目录。
export const SHOTS_DIR = process.env.U13_SHOTS_DIR ?? 'test-results/u13-shots'

export async function shot(page: Page, name: string) {
  mkdirSync(SHOTS_DIR, { recursive: true })
  await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: true })
}

// 浏览器外的一个已登录 API 会话（自己的 cookie 罐）。
export async function apiLogin(
  email: string,
  password: string,
): Promise<APIRequestContext> {
  const context = await request.newContext({ baseURL })
  const login = await context.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email, password },
  })
  expect(login.ok(), `api login ${email} succeeds`).toBe(true)
  return context
}

// 把浏览器上下文登录成指定账号：page.request 与页面共用 cookie 罐，POST 落
// 会话 cookie 后 SPA 首次加载即已登录。
export async function uiLogin(page: Page, email: string, password: string) {
  const login = await page.request.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email, password },
  })
  expect(login.ok(), `browser login ${email} succeeds`).toBe(true)
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

// P3 双侧约战：一次挑战两条腿，返回 [leg1, leg2] 的 matchID。
export async function dispatchChallenge(
  context: APIRequestContext,
  scenarioID: string,
  mineA: number,
  mineB: number,
  opponentAccountID: string,
): Promise<number[]> {
  const response = await context.post('/v1/challenges', {
    headers: sameOrigin,
    data: {
      scenarioID,
      mine: { a: { versionID: mineA }, b: { versionID: mineB } },
      opponent: { accountID: opponentAccountID },
    },
  })
  expect(response.ok(), 'challenge dispatch succeeds').toBe(true)
  const body = await response.json() as { matchIDs: number[] }
  expect(body.matchIDs).toHaveLength(2)
  return body.matchIDs
}

export interface NotificationRow {
  id: number
  kind: string
  title?: string
  body?: string
  read: boolean
}

export async function listNotifications(
  context: APIRequestContext,
): Promise<NotificationRow[]> {
  const response = await context.get('/v1/notifications')
  expect(response.ok(), 'notifications list succeeds').toBe(true)
  return (await response.json() as { notifications: NotificationRow[] })
    .notifications
}

// 等到某 kind 的通知出现（投递在服务端事务里，正常一拍即到）。
export async function pollNotificationKind(
  context: APIRequestContext,
  kind: string,
  timeout = 15_000,
) {
  await expect
    .poll(
      async () =>
        (await listNotifications(context)).some((row) => row.kind === kind),
      { message: `notification kind ${kind} arrives`, timeout },
    )
    .toBe(true)
}
