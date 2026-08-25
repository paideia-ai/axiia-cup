// 锦标赛全程真机验收 — u13-tournaments-live.feature 的可执行对应（BDD：每个
// test.step 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature
// 为准）。
//
// 只能对本地 harness 跑：需要 AXIIA_BIN ≥ac61e0f 的锦标赛管理路由，以及
// scripts+slots 装出的无模型固定局场景（配对派发的对局零推理完局）。u11 在
// 远程 dev 把这些深层行为按 untestable 归档，本套件在本地真服上补上那一半。
//
// 选手播种（provisionalRating = 1200 + 40×(胜-负)，只数 pvp）：P1、P3 各以带
// 【必胜】暗记的双侧版本赢下一场双侧约战（1280）；P2、P4 各输两腿（1120）；
// qualifierCutoff=1240 恰好切出 正赛{P1,P3} / 海选{P2,P4}。P2/P4 的 PVE 门用
// 一次性暗记版本解锁，参赛版本不带暗记。
import { type APIRequestContext, expect, test } from '@playwright/test'

import {
  adminContext,
  apiSignup,
  installFixtureScenario,
  requireServerFixtures,
  sameOrigin,
  saveEntryVersion,
  signup,
  winFixturePVE,
} from '../helpers'
import {
  apiLogin,
  dispatchChallenge,
  listNotifications,
  pollMatchDone,
  pollNotificationKind,
  shot,
  uiLogin,
} from './u13-helpers'

const FIXTURE_ID = `u13-fixture-${Date.now()}`
const FIXTURE_TITLE = 'U13 锦标赛固定局'
const WIN = '【必胜】'
const PW = 'playwrightpw-123456'

test.describe.configure({ mode: 'serial' })
test.beforeEach(() => requireServerFixtures())

// ── 串行共享状态（本文件 workers=1 串行跑，模块级变量即赛程台账） ──────────
let p1Email = ''
let admin: APIRequestContext
let p1: APIRequestContext
let p2: APIRequestContext
let p2Name = ''
let p1A = { agentID: 0, versionID: 0 }
let p1B = { agentID: 0, versionID: 0 }
let p3A = { agentID: 0, versionID: 0 }
let p3B = { agentID: 0, versionID: 0 }
let p2A = { agentID: 0, versionID: 0 }
let p4B = { agentID: 0, versionID: 0 }
let tournamentID = 0
let qualifierRoundID = 0
let qualifierMatchID = 0
let mainMatchID = 0

test('U13-C01 用注册码在真注册页开出一个新账号', async ({ page }) => {
  await test.step('当 我打开 /register 用注册码填全四项并点「创建账户」', async () => {
    // signup 走真 /register 表单：注册码/昵称/邮箱/密码 → 创建账户。
    p1Email = await signup(page, 'u13p1')
  })

  await test.step('那么 我落进 /express 或 /scenarios——注册即登录成功', async () => {
    await expect(page).toHaveURL(/\/(express|scenarios)$/)
    await shot(page, '01-registered-landing')
  })

  await test.step('并且 /v1/auth/me 返回我的账号', async () => {
    const me = await page.request.get('/v1/auth/me')
    expect(me.ok(), '注册后即持有效会话').toBe(true)
  })
})

test('U13-C02 管理员在固定局场景上建赛、报名四个版本并按 1240 播种', async () => {
  test.setTimeout(240_000)
  let p3: APIRequestContext
  let p4: APIRequestContext
  let p2AccountID = ''
  let p4AccountID = ''

  await test.step('假如 管理员装好无模型固定局场景（scripts+slots）', async () => {
    await installFixtureScenario(FIXTURE_ID, FIXTURE_TITLE)
  })

  await test.step('并且 四名玩家各在两侧保存参赛版本，并各自解锁 PVP 门', async () => {
    // P1 = C01 的浏览器账号，这里以 API 会话续用同一账号。
    p1 = await apiLogin(p1Email, PW)
    const s2 = await apiSignup('u13p2')
    const s3 = await apiSignup('u13p3')
    const s4 = await apiSignup('u13p4')
    p2 = s2.context
    p3 = s3.context
    p4 = s4.context
    p2Name = s2.displayName
    p2AccountID = s2.accountID
    p4AccountID = s4.accountID

    // P1/P3：参赛版本自带暗记，门与赛用同一版本。
    p1A = await saveEntryVersion(
      p1,
      FIXTURE_ID,
      'a',
      `${WIN}以势压人，句句立约。`,
    )
    p1B = await saveEntryVersion(
      p1,
      FIXTURE_ID,
      'b',
      `${WIN}以退为进，后发制人。`,
    )
    p3A = await saveEntryVersion(
      p3,
      FIXTURE_ID,
      'a',
      `${WIN}先例开路，逐条压过。`,
    )
    p3B = await saveEntryVersion(p3, FIXTURE_ID, 'b', `${WIN}把代价讲成故事。`)
    await winFixturePVE(p1, p1A.versionID, 'a')
    await winFixturePVE(p1, p1B.versionID, 'b')
    await winFixturePVE(p3, p3A.versionID, 'a')
    await winFixturePVE(p3, p3B.versionID, 'b')

    // P2/P4：先用一次性暗记版本赢门，再存不带暗记的参赛版本（entry 随之后移）。
    for (const [ctx, tag] of [[p2, 'p2'], [p4, 'p4']] as const) {
      const gateA = await saveEntryVersion(
        ctx,
        FIXTURE_ID,
        'a',
        `${WIN}仅用于门槛练习(${tag})。`,
      )
      const gateB = await saveEntryVersion(
        ctx,
        FIXTURE_ID,
        'b',
        `${WIN}仅用于门槛练习(${tag})。`,
      )
      await winFixturePVE(ctx, gateA.versionID, 'a')
      await winFixturePVE(ctx, gateB.versionID, 'b')
    }
    p2A = await saveEntryVersion(
      p2,
      FIXTURE_ID,
      'a',
      '实战版·不带暗记，正面立论。',
    )
    await saveEntryVersion(p2, FIXTURE_ID, 'b', '实战版·不带暗记，稳守反击。')
    await saveEntryVersion(p4, FIXTURE_ID, 'a', '实战版·不带暗记，以证据说话。')
    p4B = await saveEntryVersion(
      p4,
      FIXTURE_ID,
      'b',
      '实战版·不带暗记，条款化收束。',
    )
  })

  await test.step('并且 P1、P3 各赢下一场双侧约战——MMR 升到 1280，P2、P4 跌到 1120', async () => {
    const legs1 = await dispatchChallenge(
      p1,
      FIXTURE_ID,
      p1A.versionID,
      p1B.versionID,
      p2AccountID,
    )
    const legs3 = await dispatchChallenge(
      p3,
      FIXTURE_ID,
      p3A.versionID,
      p3B.versionID,
      p4AccountID,
    )
    for (const id of legs1) await pollMatchDone(p1, id)
    for (const id of legs3) await pollMatchDone(p3, id)
  })

  await test.step('当 管理员创建 totalRounds=3 的锦标赛并报名四个版本（两侧各二）', async () => {
    admin = await adminContext()
    const created = await admin.post('/v1/admin/tournaments', {
      headers: sameOrigin,
      data: { scenarioID: FIXTURE_ID, totalRounds: 3 },
    })
    expect(created.ok(), '建赛成功').toBe(true)
    tournamentID = (await created.json() as { id: number }).id
    for (
      const versionID of [
        p1A.versionID,
        p2A.versionID,
        p3B.versionID,
        p4B.versionID,
      ]
    ) {
      const enrolled = await admin.post(
        `/v1/admin/tournaments/${tournamentID}/participants`,
        { headers: sameOrigin, data: { versionID } },
      )
      expect(enrolled.ok(), `报名版本 #${versionID} 成功`).toBe(true)
    }
  })

  let entrants: Array<
    {
      versionID: number
      phase: string
      rating: number
      skippedQualifier: boolean
    }
  > = []
  await test.step('并且 管理员以 qualifierCutoff=1240 播种', async () => {
    const seeded = await admin.post(
      `/v1/admin/tournaments/${tournamentID}/seed`,
      { headers: sameOrigin, data: { qualifierCutoff: 1240 } },
    )
    expect(seeded.ok(), '播种成功').toBe(true)
    entrants = (await seeded.json() as { entrants: typeof entrants }).entrants
  })

  await test.step('那么 P1、P3 直入正赛且标记跳过海选，P2、P4 落入海选', async () => {
    const byVersion = new Map(
      entrants.map((entrant) => [entrant.versionID, entrant]),
    )
    for (const versionID of [p1A.versionID, p3B.versionID]) {
      const entrant = byVersion.get(versionID)!
      expect(entrant.rating, `胜者 #${versionID} 的 MMR`).toBe(1280)
      expect(entrant.phase).toBe('main')
      expect(entrant.skippedQualifier, '#32 高分直入正赛').toBe(true)
    }
    for (const versionID of [p2A.versionID, p4B.versionID]) {
      const entrant = byVersion.get(versionID)!
      expect(entrant.rating, `负者 #${versionID} 的 MMR`).toBe(1120)
      expect(entrant.phase).toBe('qualifier')
      expect(entrant.skippedQualifier).toBe(false)
    }
  })

  await test.step('并且 管理员把锦标赛状态推进到 running', async () => {
    const patched = await admin.patch(`/v1/admin/tournaments/${tournamentID}`, {
      headers: sameOrigin,
      data: { status: 'running' },
    })
    expect(patched.ok()).toBe(true)
  })
})

test('U13-C03 配对海选轮派发真对局，完局关轮，再配正赛轮', async () => {
  test.setTimeout(120_000)

  await test.step('当 管理员对海选池配对第 1 轮', async () => {
    const paired = await admin.post(
      `/v1/admin/tournaments/${tournamentID}/rounds/pair`,
      { headers: sameOrigin, data: { phase: 'qualifier' } },
    )
    expect(paired.ok(), '海选配对成功').toBe(true)
    const body = await paired.json() as {
      roundID: number
      roundNumber: number
      phase: string
      matches: Array<{ matchID: number }>
      byes: number[]
    }
    expect(body.roundNumber).toBe(1)
    expect(body.phase).toBe('qualifier')
    qualifierRoundID = body.roundID
    qualifierMatchID = body.matches[0]?.matchID ?? 0

    await test.step('那么 响应给出 1 场已派发对局且无轮空', () => {
      expect(body.matches).toHaveLength(1)
      expect(body.byes).toEqual([])
    })
  })

  await test.step('并且 海选选手在 /v1/matches 里看得到这场 pvp 对局', async () => {
    const listed = await p2.get('/v1/matches')
    expect(listed.ok()).toBe(true)
    const mine = (await listed.json() as {
      matches: Array<{ id: number; kind: string }>
    }).matches.find((match) => match.id === qualifierMatchID)
    expect(mine, '参赛者列表里有锦标赛对局').toBeDefined()
    expect(mine!.kind).toBe('pvp')
  })

  await test.step('并且 固定局零推理完局——对局 finished 且 scored', async () => {
    await pollMatchDone(p2, qualifierMatchID)
  })

  await test.step('当 管理员把第 1 轮置为 done 并对正赛池配对第 2 轮', async () => {
    // 注意枚举不对称：轮次是 pairing/running/done，锦标赛才有 finished。
    const closed = await admin.patch(`/v1/admin/rounds/${qualifierRoundID}`, {
      headers: sameOrigin,
      data: { status: 'done' },
    })
    expect(closed.ok(), '关轮成功').toBe(true)
    const paired = await admin.post(
      `/v1/admin/tournaments/${tournamentID}/rounds/pair`,
      { headers: sameOrigin, data: { phase: 'main' } },
    )
    expect(paired.ok(), '正赛配对成功').toBe(true)
    const body = await paired.json() as {
      roundNumber: number
      phase: string
      matches: Array<{ matchID: number }>
    }
    expect(body.roundNumber).toBe(2)
    expect(body.phase).toBe('main')
    expect(body.matches).toHaveLength(1)
    mainMatchID = body.matches[0].matchID
  })

  await test.step('那么 正赛对局同样完局', async () => {
    await pollMatchDone(p1, mainMatchID)
  })

  await test.step('并且 /v1/tournaments 时间线给出两轮：qualifier 与 main', async () => {
    const tournaments = await p1.get('/v1/tournaments')
    expect(tournaments.ok()).toBe(true)
    const summary = (await tournaments.json() as {
      tournaments: Array<{
        id: number
        currentRound: number
        rounds?: Array<{ roundNumber: number; phase: string; status: string }>
      }>
    }).tournaments.find((row) => row.id === tournamentID)!
    expect(summary.currentRound).toBe(2)
    expect(summary.rounds?.map((round) => round.phase)).toEqual([
      'qualifier',
      'main',
    ])
    expect(summary.rounds?.map((round) => round.status)).toEqual([
      'done',
      'running',
    ])
  })
})

test('U13-C04 玩家在「排名」页看到锦标赛卡片——时间线与阶段标签', async ({ page }) => {
  await test.step('假如 我以 P1 登录', async () => {
    await uiLogin(page, p1Email, PW)
  })

  await test.step('那么 顶部导航存在「排名」入口', async () => {
    await page.goto('/scenarios')
    await expect(page.getByRole('link', { name: '排名' }).first()).toBeVisible()
  })

  await test.step('当 我进入 /tournaments', async () => {
    await page.goto('/tournaments')
    await expect(page.getByRole('heading', { name: '排名' })).toBeVisible()
  })

  const card = page.locator(`a[href="/tournaments/${tournamentID}"]`)
  await test.step('那么 我看到该锦标赛卡片：第 2/3 轮与状态徽章', async () => {
    await expect(card.getByText(`锦标赛 #${tournamentID}`)).toBeVisible()
    await expect(card.getByText('第 2/3 轮')).toBeVisible()
    await expect(card.getByText('running')).toBeVisible()
    await shot(page, '02-tournaments-list-running')
  })

  await test.step('并且 接口带 rounds 时间线与 phase，页面渲染按轮时间线（B4——#138 已落地）', async () => {
    const response = await page.request.get('/v1/tournaments')
    expect(response.ok()).toBe(true)
    const summary = (await response.json() as {
      tournaments: Array<{ id: number; phase?: string; rounds?: unknown[] }>
    }).tournaments.find((row) => row.id === tournamentID)!
    expect(summary.rounds?.length, '服务端已随列表带出按轮时间线').toBe(2)
    expect(summary.phase, '服务端已带当前 phase').toBe('main')
    // 2026-08-25 集成注：#138（按玩家排名批次）已在 tournaments.tsx 落地
    // B4 按轮时间线（每轮一格 li，title=阶段 · 状态）——由钉缺口转为验收。
    await expect(card.getByText('第 1 轮')).toBeVisible()
    await expect(card.getByText('第 2 轮')).toBeVisible()
    await expect(card.locator('li[title="海选 · done"]')).toHaveCount(1)
    await expect(card.locator('li[title="正赛 · running"]')).toHaveCount(1)
  })

  await test.step('并且 页面渲染「海选」「正赛」阶段标签（#32——#138 已落地）', async () => {
    // 时间线格子各带阶段名；当前 phase 另有徽章（「正赛」出现 ≥2 处）。
    await expect(card.getByText('海选').first()).toBeVisible()
    await expect(card.getByText('正赛').first()).toBeVisible()
  })

  await test.step('当 我点开该锦标赛卡片', async () => {
    await card.click()
    await expect(page).toHaveURL(new RegExp(`/tournaments/${tournamentID}$`))
  })

  await test.step('那么 我落在 /tournaments/:id 的「积分榜」页', async () => {
    await expect(
      page.getByRole('heading', { name: `锦标赛 #${tournamentID} 积分榜` }),
    ).toBeVisible()
    await shot(page, '03-standings-running')
  })

  await test.step('并且 「历史」页里有我那场锦标赛对局的卡片', async () => {
    await page.goto('/matches')
    await expect(page.getByRole('heading', { name: '历史' })).toBeVisible()
    await expect(page.getByText(`对战 #${mainMatchID}`)).toBeVisible()
    await shot(page, '04-history-with-tournament-match')
  })
})

test('U13-C05 赛事 running 时试炼未被阻挡——机制是启动期环境变量', async ({ page }) => {
  await test.step('假如 我以 P1 登录且锦标赛正在 running', async () => {
    await uiLogin(page, p1Email, PW)
    const tournaments = await page.request.get('/v1/tournaments')
    const summary = (await tournaments.json() as {
      tournaments: Array<{ id: number; status: string }>
    }).tournaments.find((row) => row.id === tournamentID)!
    expect(summary.status).toBe('running')
  })

  await test.step('那么 /v1/config 的 trialsBlocked 为 false', async () => {
    const config = await page.request.get('/v1/config')
    expect(config.ok()).toBe(true)
    expect((await config.json() as { trialsBlocked: boolean }).trialsBlocked)
      .toBe(false)
  })

  await test.step('当 我从智能体页呼出出战面板', async () => {
    await page.goto(`/agents/${p1A.agentID}`)
    await page.getByTestId('open-os-panel').click()
    await expect(page.getByRole('tab', { name: 'NPC 练习' })).toBeVisible()
  })

  await test.step('那么 面板里没有「赛事进行中，试炼暂时关闭」横幅', async () => {
    await expect(page.getByText('赛事进行中，试炼暂时关闭')).toHaveCount(0)
    await shot(page, '05-os-panel-trials-open')
    test.info().annotations.push({
      type: 'product-gap',
      description:
        '#47 阻挡机制：trialsBlocked 只来自启动期 AXIIA_TRIALS_BLOCKED（AxiiaCLI Serve.swift:149），无管理面运行时开关——赛事期间阻挡意味着重启服务；/rounds/pair 不走 requireTrialsOpen，阻挡期锦标赛照常派发（该半边正确）',
    })
  })
})

test('U13-C06 直邀者的铃铛与通知页', async ({ page }) => {
  await test.step('假如 我以 P1（跳过海选的直邀者）登录', async () => {
    await uiLogin(page, p1Email, PW)
    // #53⑤ 在播种那一刻投递、#53④ 在正赛配对那一刻投递——先在 API 面等到。
    await pollNotificationKind(p1, 'tournament_invite')
    await pollNotificationKind(p1, 'tournament_round')
  })

  await test.step('那么 顶栏铃铛带未读小圆点', async () => {
    await page.goto('/scenarios')
    await expect(page.getByLabel(/条未读$/)).toBeVisible()
  })

  await test.step('当 我进入 /notifications', async () => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible()
  })

  await test.step('那么 我看到「锦标赛资格」徽章与「锦标赛邀请」标题（#53⑤）', async () => {
    await expect(page.getByText('锦标赛资格').first()).toBeVisible()
    await expect(page.getByText('锦标赛邀请').first()).toBeVisible()
  })

  await test.step('并且 我看到「锦标赛新一轮开始」（#53④——正赛配对那一刻投递）', async () => {
    await expect(page.getByText('锦标赛新一轮开始').first()).toBeVisible()
    await shot(page, '06-notifications-invite-and-round')
  })

  await test.step('并且 海选选手 P2 的通知里同样有 tournament_round', async () => {
    const rows = await listNotifications(p2)
    expect(rows.some((row) => row.kind === 'tournament_round')).toBe(true)
    // P2 是被挑战者：#53① 的合并约战通知也应在场（前置局的副产品）。
    expect(rows.some((row) => row.kind === 'challenged')).toBe(true)
  })
})

test('U13-C07 结赛推送最终排名通知，积分榜按玩家给出四行', async ({ page }) => {
  await test.step('当 管理员把锦标赛置为 finished', async () => {
    const patched = await admin.patch(`/v1/admin/tournaments/${tournamentID}`, {
      headers: sameOrigin,
      data: { status: 'finished' },
    })
    expect(patched.ok(), '结赛成功').toBe(true)
  })

  await test.step('那么 P1 的通知里出现「锦标赛已结束」与「最终排名已产生」', async () => {
    await pollNotificationKind(p1, 'tournament_finished')
    await uiLogin(page, p1Email, PW)
    await page.goto('/notifications')
    await expect(page.getByText('锦标赛已结束').first()).toBeVisible()
    await expect(page.getByText('最终排名已产生').first()).toBeVisible()
    await shot(page, '07-notifications-final-ranking')
  })

  await test.step('并且 「排名」页的该锦标赛徽章变为 finished', async () => {
    await page.goto('/tournaments')
    const card = page.locator(`a[href="/tournaments/${tournamentID}"]`)
    await expect(card.getByText('finished')).toBeVisible()
    await shot(page, '08-tournaments-list-finished')
  })

  let entries: Array<
    { playerID: string; playerName: string; submissionIDs: number[] }
  > = []
  await test.step('并且 积分榜接口按玩家给出 4 行、行行有昵称且互不重复（#64 后端）', async () => {
    const response = await page.request.get(
      `/v1/tournaments/${tournamentID}/standings`,
    )
    expect(response.ok()).toBe(true)
    entries = (await response.json() as { entries: typeof entries }).entries
    expect(entries).toHaveLength(4)
    for (const entry of entries) {
      expect(entry.playerName, '每行都带玩家昵称').toBeTruthy()
      expect(entry.submissionIDs.length).toBeGreaterThan(0)
    }
    expect(new Set(entries.map((entry) => entry.playerID)).size).toBe(4)
  })

  await test.step('并且 积分榜页面按玩家渲染昵称（#64 前端——#138 已落地）', async () => {
    await page.goto(`/tournaments/${tournamentID}`)
    await expect(
      page.getByRole('heading', { name: `锦标赛 #${tournamentID} 积分榜` }),
    ).toBeVisible()
    await expect(page.locator('table tbody tr')).toHaveCount(4)
    // 2026-08-25 集成注：standings.tsx 已按玩家渲染 playerName（#138 按玩家
    // 排名批次）——由钉缺口转为验收：每行选手列都是玩家昵称。
    for (const entry of entries) {
      await expect(page.locator('table').getByText(entry.playerName).first())
        .toBeVisible()
    }
    await shot(page, '09-standings-finished-by-player')
  })
})

test('U13-C08 单侧版本也能被报名进锦标赛', async () => {
  let soloVersionID = 0
  await test.step('假如 一名只在甲侧保存过版本的新玩家', async () => {
    const solo = await apiSignup('u13solo')
    const saved = await saveEntryVersion(
      solo.context,
      FIXTURE_ID,
      'a',
      '只有甲侧的孤版本。',
    )
    soloVersionID = saved.versionID
    await solo.context.dispose()
  })

  await test.step('当 管理员在另一场锦标赛里报名他的单侧版本', async () => {
    const created = await admin.post('/v1/admin/tournaments', {
      headers: sameOrigin,
      data: { scenarioID: FIXTURE_ID, totalRounds: 1 },
    })
    expect(created.ok()).toBe(true)
    const throwaway = (await created.json() as { id: number }).id
    const enrolled = await admin.post(
      `/v1/admin/tournaments/${throwaway}/participants`,
      { headers: sameOrigin, data: { versionID: soloVersionID } },
    )

    await test.step('那么 服务器照单全收——#58 的双侧校验缺失（缺口）', () => {
      expect(enrolled.ok(), '单侧版本被无校验接受').toBe(true)
      test.info().annotations.push({
        type: 'product-gap',
        description:
          '#58 报名双侧校验：POST /v1/admin/tournaments/:id/participants（AdminRoutes.swift:125）只查锦标赛存在即 enroll，不校验该玩家两侧是否都有参赛版本',
      })
    })
  })
})
