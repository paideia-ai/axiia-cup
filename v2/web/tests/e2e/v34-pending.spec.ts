import { expect, test } from '@playwright/test'

import { assembleDeck } from '../../src/lib/deck'
import { deckFor } from '../../src/scenarios/decks'
import {
  apiSignup,
  FIXTURE_SIDE_A_NAME,
  FIXTURE_SIDE_B_NAME,
  FIXTURE_WIN_TOKEN,
  installFixtureScenario,
  requireServerFixtures,
  sameOrigin,
  saveEntryVersion,
  scenarioID,
  signup,
  winFixturePVE,
} from './helpers'

// v3.4 P3/P5/P6 完整旅程：后端批次已上线，四条 fixme 契约转正为真服务端
// 旅程。完局对局全部来自确定性固定局脚本（无模型推理，见 helpers 的
// installFixtureScenario）；每条旅程用独立新账号，可单测重跑。

test.beforeEach(() => requireServerFixtures())

interface MatchSummaryJSON {
  id: number
  scenarioID: string
  kind: string
  finished: boolean
  scored: boolean
  winner?: string | null
  challengeID?: number | null
  challengeLeg?: number | null
  initiatorIsMe?: boolean
  participants?: {
    a: {
      versionID?: number | null
      ownerDisplayName?: string | null
      isMine: boolean
    }
    b: {
      versionID?: number | null
      ownerDisplayName?: string | null
      isMine: boolean
    }
  } | null
}

interface ScenarioSummaryJSON {
  id: string
  onlineAt?: number | null
  stats?: { battleCount: number; sideWinRate: { a: number; b: number } }
}

test.describe('v3.4 P3/P5/P6 contracts realized on the live batch', () => {
  test('P3 #66/#76 creates two paired PVP legs, charges two uses, and emits one merged notification', async ({ page }) => {
    test.setTimeout(120_000)
    const stamp = Date.now()
    const arenaID = `e2e-arena-${stamp}`
    await installFixtureScenario(arenaID, '约战固定局')

    // 挑战者走浏览器；被约战方是纯 API 的第二名玩家（seed-dev 习惯用法）。
    const challengerLabel = `challenger-${stamp}`
    await signup(page, challengerLabel)
    const target = await apiSignup(`target-${stamp}`)

    // 双方各自双侧建版本（带暗记）并各赢一场 NPC 练习：#65 的按侧门槛在
    // 约战前必须双双解锁——这些胜局由固定局脚本确定性产生。
    const winPrompt = (side: string) => `${side}侧方略。${FIXTURE_WIN_TOKEN}`
    const mineA = await saveEntryVersion(
      page.request,
      arenaID,
      'a',
      winPrompt('甲'),
    )
    const mineB = await saveEntryVersion(
      page.request,
      arenaID,
      'b',
      winPrompt('乙'),
    )
    await winFixturePVE(page.request, mineA.versionID, 'a')
    await winFixturePVE(page.request, mineB.versionID, 'b')
    const targetA = await saveEntryVersion(
      target.context,
      arenaID,
      'a',
      winPrompt('甲'),
    )
    const targetB = await saveEntryVersion(
      target.context,
      arenaID,
      'b',
      winPrompt('乙'),
    )
    await winFixturePVE(target.context, targetA.versionID, 'a')
    await winFixturePVE(target.context, targetB.versionID, 'b')

    const usageBefore =
      (await (await page.request.get('/v1/config')).json()) as {
        usage: { battlesToday: number; pvpBattlesToday: number }
      }

    // UI 旅程（mock V20）：出战面板 → 玩家约战（已解锁）→ 对手玩家 → 发起
    // 双侧约战。
    await page.goto(`/agents/${mineA.agentID}`)
    await page.getByTestId('open-os-panel').click()
    await page.getByRole('tab', { name: /玩家约战/ }).click()
    await expect(page.getByText('玩家约战已解锁')).toBeVisible()
    await expect(page.getByText('我的双侧出战阵容', { exact: false }))
      .toBeVisible()
    await expect(page.getByText(target.displayName, { exact: true }))
      .toBeVisible()
    const dispatched = page.waitForResponse((response) =>
      response.url().endsWith('/v1/challenges') &&
      response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: '发起双侧约战' }).click()
    const challengeHttp = await dispatched
    expect(challengeHttp.status()).toBe(200)
    const challenge = await challengeHttp.json() as {
      challengeID: number
      matchIDs: number[]
    }
    expect(challenge.matchIDs).toHaveLength(2)

    // F6 成功态：镜像 PVE——面板关闭并重定向到第 ① 场实况（站内路由）；
    // 约战① 徽记 + 「查看另一场」互链保证两场都可达（mock V21 语义上移）。
    await expect(page).toHaveURL(
      new RegExp(`/matches/${challenge.matchIDs[0]}$`),
    )
    await expect(page.getByText('约战①', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: '查看另一场（②）→' }))
      .toHaveAttribute('href', `/matches/${challenge.matchIDs[1]}`)

    // API 复核 ①：两条腿成对——同 challengeID、leg 1/2、kind pvp、执侧成对
    // 交叉（我甲对他乙，他甲对我乙），且都在固定局上真实跑完。
    const legs: MatchSummaryJSON[] = []
    for (const matchID of challenge.matchIDs) {
      await expect
        .poll(async () => {
          const detail = await page.request.get(`/v1/matches/${matchID}`)
          if (!detail.ok()) return false
          const body = await detail.json() as { summary: MatchSummaryJSON }
          return body.summary.finished && body.summary.scored
        }, { message: `challenge leg ${matchID} finishes`, timeout: 20000 })
        .toBe(true)
      const detail = await page.request.get(`/v1/matches/${matchID}`)
      legs.push((await detail.json() as { summary: MatchSummaryJSON }).summary)
    }
    expect(legs.map((leg) => leg.challengeID)).toEqual([
      challenge.challengeID,
      challenge.challengeID,
    ])
    expect(legs.map((leg) => leg.challengeLeg)).toEqual([1, 2])
    for (const leg of legs) {
      expect(leg.kind).toBe('pvp')
      expect(leg.scenarioID).toBe(arenaID)
      expect(leg.initiatorIsMe).toBe(true)
    }
    expect(legs[0].participants?.a.versionID).toBe(mineA.versionID)
    expect(legs[0].participants?.a.isMine).toBe(true)
    expect(legs[0].participants?.b.ownerDisplayName).toBe(target.displayName)
    expect(legs[1].participants?.a.ownerDisplayName).toBe(target.displayName)
    expect(legs[1].participants?.b.versionID).toBe(mineB.versionID)
    expect(legs[1].participants?.b.isMine).toBe(true)

    // API 复核 ②：一次成对约战对发起人计 2 场（总额与 PVP 日额都 +2）。
    const usageAfter =
      (await (await page.request.get('/v1/config')).json()) as {
        usage: { battlesToday: number; pvpBattlesToday: number }
      }
    expect(usageAfter.usage.battlesToday).toBe(
      usageBefore.usage.battlesToday + 2,
    )
    expect(usageAfter.usage.pvpBattlesToday).toBe(
      usageBefore.usage.pvpBattlesToday + 2,
    )

    // API 复核 ③：被约战方恰好一条合并 challenged 通知，锚在 challengeID 上。
    const inbox = await (await target.context.get('/v1/notifications'))
      .json() as {
        notifications: {
          id: number
          kind: string
          matchID?: number | null
          read: boolean
          title?: string
        }[]
      }
    const challenged = inbox.notifications.filter(
      (notification) => notification.kind === 'challenged',
    )
    expect(challenged).toHaveLength(1)
    expect(challenged[0].matchID).toBe(challenge.challengeID)
    expect(challenged[0].read).toBe(false)
    expect(challenged[0].title ?? '').toContain('向你发起双侧约战')
    expect(challenged[0].title ?? '').toContain(`测试玩家 ${challengerLabel}`)

    await target.context.dispose()
  })

  test('P5 #9–#12 Express lands after signup, defaults to MCQ, saves, and enters live first battle', async ({ page }) => {
    test.setTimeout(120_000)
    // A3：新账号注册直落 /express（严格断言，不接受 /scenarios 回落）。
    await signup(page, `express-${Date.now()}`)
    await expect(page).toHaveURL(/\/express$/)

    // 简化版 DA（#11）：钩子 + 我方角色卡。AXIIA_EXPRESS_PRESET 指定对手为
    // 商鞅场景 b 侧预设 → 我执 a（商鞅）。
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '商鞅变法·朝堂辩法',
    )
    await expect(page.getByText('你的角色')).toBeVisible()
    await expect(page.getByText('自魏入秦的说客，无根无党，惟以变法自荐'))
      .toBeVisible()

    await page.getByTestId('express-build').click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build\?.*express=1/)
    await expect(page.getByText('首战快速通道 · 保存即自动开战并直达实况'))
      .toBeVisible()

    // #12：初始化三选一默认停在 MCQ 拼装，商鞅 a 侧题库可见。
    const mcqTab = page.getByRole('tab', { name: 'MCQ 拼装' })
    await expect(mcqTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tab', { name: 'Basic 直写' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '元提示词' })).toBeVisible()
    const deck = deckFor('shangyang-court', 'a', null)
    expect(deck, 'the shangyang side-a MCQ deck ships with the SPA').not
      .toBeNull()
    await expect(page.getByText(deck!.questions[0].prompt)).toBeVisible()

    // 快速答题：每题点第一个选项；答完前「填入工作区」保持不可点。
    const fill = page.getByRole('button', { name: '填入工作区' })
    await expect(fill).toBeDisabled()
    const selections: Record<string, string> = {}
    for (const question of deck!.questions) {
      selections[question.id] = question.options[0].id
      await page
        .getByRole('button', { name: question.options[0].label, exact: true })
        .click()
    }
    await fill.click()

    // 拼装文本进入工作区（所见即所存），三选一卡随之收起。
    const assembled = assembleDeck(deck!, selections)
    await expect(page.getByLabel('策略提示词')).toHaveValue(assembled)
    await expect(page.getByText('初始化方式 · 三选一生成首稿')).toHaveCount(0)

    // #9/#17 例外：express 下保存即自动派发首战并直达实况。
    const save = page.getByTestId('save-version')
    await expect(save).toHaveText('保存并开始首战')
    const dispatched = page.waitForResponse((response) =>
      response.url().endsWith('/v1/matches/pve') &&
      response.request().method() === 'POST'
    )
    await save.click()
    const dispatchHttp = await dispatched
    expect(dispatchHttp.status()).toBe(200)
    const { matchID } = await dispatchHttp.json() as { matchID: number }
    await expect(page).toHaveURL(new RegExp(`/matches/${matchID}$`))
    await expect(page.getByRole('heading', { name: `对战 #${matchID}` }))
      .toBeVisible()

    // API 复核：恰好这一场 PVE 首战存在于我的对局列表。
    const matches = await (await page.request.get('/v1/matches'))
      .json() as { matches: MatchSummaryJSON[] }
    expect(matches.matches).toHaveLength(1)
    expect(matches.matches[0].id).toBe(matchID)
    expect(matches.matches[0].kind).toBe('pve')
    expect(matches.matches[0].scenarioID).toBe('shangyang-court')

    // #12 收尾：首战一完局（哪怕是败局/失败局——本 harness 无模型密钥，商鞅
    // 真场景会快速失败收场），/v1/auth/me 的 firstBattleDone 必须翻真。
    await expect
      .poll(async () => {
        const me = await page.request.get('/v1/auth/me')
        return (await me.json() as { firstBattleDone?: boolean })
          .firstBattleDone === true
      }, {
        message: 'firstBattleDone flips once the battle finishes',
        timeout: 30000,
      })
      .toBe(true)
  })

  test('P6 #59/#79 blocks a second same-side agent until an opposite-side agent exists', async ({ page }) => {
    test.setTimeout(90_000)
    await signup(page, `sibling-${Date.now()}`)
    const detail = await (await page.request.get(
      `/v1/scenarios/${scenarioID}?side=a`,
    )).json() as {
      summary: { title: string; sideAName: string; sideBName: string }
    }
    const { title, sideAName, sideBName } = detail.summary

    // 第一个 a 侧智能体：我的智能体页的空侧 CTA（懒 ensure，不受引导门）。
    await page.goto('/my-agents')
    await page
      .getByRole('button', { name: `创建${title}·${sideAName}侧智能体` })
      .click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    const firstAgentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())?.[1])
    expect(firstAgentID).toBeGreaterThan(0)

    // 同侧第 2 个：新建弹窗被 #59 引导门拦下，给出切侧引导。
    await page.goto('/my-agents')
    await page
      .getByRole('button', { name: `再建一个${title}·${sideAName}侧智能体` })
      .click()
    const dialog = page.getByRole('dialog', { name: /新建智能体/ })
    await expect(dialog).toBeVisible()
    await dialog.getByTestId('create-agent').click()
    await expect(
      dialog.getByText(
        '需先有一个对侧智能体，才能在同侧再建第二个——两边都会写才是真本事',
      ),
    ).toBeVisible()
    await expect(dialog.getByText('两边都要会写才是真本事', { exact: false }))
      .toBeVisible()

    // API 复核：POST /v1/agents 以 409 + sibling_gate 拒绝。
    const rejected = await page.request.post('/v1/agents', {
      headers: sameOrigin,
      data: { scenarioID, side: 'a' },
    })
    expect(rejected.status()).toBe(409)
    expect((await rejected.json() as { error: string }).error).toBe(
      'sibling_gate',
    )

    // 引导 CTA 切到对侧并创建成功。
    await dialog.getByRole('button', { name: `先创建${sideBName}` }).click()
    await dialog.getByTestId('create-agent').click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    const oppositeAgentID = Number(
      /\/agents\/(\d+)\/build/.exec(page.url())?.[1],
    )
    expect(oppositeAgentID).toBeGreaterThan(0)
    expect(oppositeAgentID).not.toBe(firstAgentID)

    // P8a：门认的是「对侧**有版本的**策略」，不是光有个号——空壳开门等于没门。
    // 所以这里必须先给对侧存一版，否则下面的放行不该发生。
    const stillBlocked = await page.request.post('/v1/agents', {
      headers: sameOrigin,
      data: { scenarioID, side: 'a' },
    })
    expect(stillBlocked.status()).toBe(409)

    const oppositeInput = page.getByLabel('策略提示词')
    await expect(oppositeInput).toBeEnabled()
    await oppositeInput.fill('对侧首稿：先谈代价，再谈道理。')
    await page.getByTestId('save-version').click()
    await expect(page.getByTestId('version-card').first()).toBeVisible()

    // 对侧齐备（且有版本）后，同侧第 2 个放行。
    await page.goto('/my-agents')
    await page
      .getByRole('button', { name: `再建一个${title}·${sideAName}侧智能体` })
      .click()
    await page
      .getByRole('dialog', { name: /新建智能体/ })
      .getByTestId('create-agent')
      .click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build/)
    const secondAgentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())?.[1])
    expect(secondAgentID).toBeGreaterThan(0)
    expect([firstAgentID, oppositeAgentID]).not.toContain(secondAgentID)

    // API 复核：清单里 a 侧 2 个、b 侧 1 个。
    const inventory = await (await page.request.get('/v1/my/agents'))
      .json() as {
        scenarios: {
          scenarioID: string
          sides: { a: { agentID: number }[]; b: { agentID: number }[] }
        }[]
      }
    const entry = inventory.scenarios.find(
      (scenario) => scenario.scenarioID === scenarioID,
    )
    expect(entry?.sides.a.map((agent) => agent.agentID).sort()).toEqual(
      [firstAgentID, secondAgentID].sort(),
    )
    expect(entry?.sides.b.map((agent) => agent.agentID)).toEqual([
      oppositeAgentID,
    ])
  })

  test('P6 #39/#54 reveals thresholded catalog stats and pins the newest scenario second', async ({ page }) => {
    test.setTimeout(120_000)
    const stamp = Date.now()
    const fixtureID = `e2e-stats-${stamp}`
    await installFixtureScenario(fixtureID, '统计固定局')
    await signup(page, `stats-${stamp}`)

    // 门槛之下（AXIIA_STATS_DISPLAY_THRESHOLD=2）：#39 是服务端法则——stats
    // key 整个缺席，而不是 0 值。
    const before = await (await page.request.get('/v1/scenarios'))
      .json() as { scenarios: ScenarioSummaryJSON[] }
    const freshEntry = before.scenarios.find((item) => item.id === fixtureID)
    expect(freshEntry, 'the fixture slot is live in the catalog').toBeDefined()
    expect('stats' in freshEntry!).toBe(false)
    expect(freshEntry!.onlineAt).toBeGreaterThan(0)

    // 浏览器复核：固定局卡无统计行；有教育内容的真场景卡画「数据积累中」
    // 引导式空态（电车场景全程无人完局，永远低于门槛）。
    await page.goto('/scenarios')
    const fixtureCard = page.getByTestId(`scenario-${fixtureID}`)
    await expect(fixtureCard).toBeVisible()
    await expect(fixtureCard.getByText('侧方胜率')).toHaveCount(0)
    await expect(
      page.getByTestId('scenario-trolley-problem').getByText(/数据积累中/),
    ).toBeVisible()

    // 两场固定局完局跨过门槛（a 侧带暗记连胜两场 → 100% / 0%）。
    const mine = await saveEntryVersion(
      page.request,
      fixtureID,
      'a',
      `以证据链步步紧逼。${FIXTURE_WIN_TOKEN}`,
    )
    await winFixturePVE(page.request, mine.versionID, 'a')
    await winFixturePVE(page.request, mine.versionID, 'a')

    // API 复核：stats 点亮且数值正确。
    const after = await (await page.request.get('/v1/scenarios'))
      .json() as { scenarios: ScenarioSummaryJSON[] }
    const litEntry = after.scenarios.find((item) => item.id === fixtureID)
    expect(litEntry?.stats?.battleCount).toBe(2)
    expect(litEntry?.stats?.sideWinRate.a).toBe(1)
    expect(litEntry?.stats?.sideWinRate.b).toBe(0)

    // 浏览器复核：统计行点亮（#38 文案口径）。
    await page.goto('/scenarios')
    await expect(fixtureCard.getByText('侧方胜率')).toBeVisible()
    await expect(
      fixtureCard.getByText(
        `2 场 · ${FIXTURE_SIDE_A_NAME} 100% / ${FIXTURE_SIDE_B_NAME} 0%`,
      ),
    ).toBeVisible()

    // #54 新上线：onlineAt 最新者戴徽章；唯一最新时固定钉在第 2 位。onlineAt
    // 是槽位落库秒——本测刚建的槽位理应最新，但同秒并列时只断言徽章归属。
    const onlineAt = (item: ScenarioSummaryJSON) =>
      item.onlineAt ?? Number.NEGATIVE_INFINITY
    const maxOnlineAt = Math.max(...after.scenarios.map(onlineAt))
    const newestIDs = after.scenarios
      .filter((item) => onlineAt(item) === maxOnlineAt)
      .map((item) => item.id)
    expect(newestIDs).toContain(fixtureID)

    await expect(page.getByText('新上线')).toHaveCount(1)
    const badgeCardID = await page
      .locator('a[data-testid^="scenario-"]', { has: page.getByText('新上线') })
      .getAttribute('data-testid')
    expect(newestIDs.map((id) => `scenario-${id}`)).toContain(badgeCardID)
    if (newestIDs.length === 1) {
      await expect(fixtureCard.getByText('新上线')).toBeVisible()
      const order = await page
        .locator('a[data-testid^="scenario-"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-testid'))
        )
      expect(order[1]).toBe(`scenario-${fixtureID}`)
    }
  })
})
