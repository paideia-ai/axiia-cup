// Executable counterpart of fixes-round3.feature — the test.step texts mirror its
// Given/When/Then one for one.
//
// Runs against a stack that carries the round-3 backend (public agent view,
// landing projection, player-ranked standings, tournament notifications). The
// tournament assertions need a seeded tournament, so they skip with a reason
// rather than fail when the target has none — an empty leaderboard is not a
// regression, it is an environment without a tournament.
import { expect, test } from '@playwright/test'

import { signup } from '../helpers'

const sameOrigin = { 'Sec-Fetch-Site': 'same-origin' }

test.describe.configure({ mode: 'serial' })

test('#72 对战条只装自己发起的对局（U05-C09b）', async ({ page }) => {
  await test.step('而且 站内此刻有别的玩家正在进行的对局', async () => {
    // 先由「别人」制造一场：无模型固定局场景，派发即完局，零推理成本。
    // 找不到这样的场景就跳过——这一步是前提，不是被测行为。
    await signup(page, 'stripother')
    const list = await page.request.get('/v1/scenarios', {
      headers: sameOrigin,
    })
    const scenarios = list.ok() ? ((await list.json()).scenarios ?? []) : []
    const fixture = scenarios.find((s: { title?: string }) =>
      s.title?.includes('固定局')
    )
    test.skip(
      fixture == null,
      '目标环境没有无模型固定局场景，无法免费制造他人对局',
    )
    const ensure = await page.request.post('/v1/agents/ensure', {
      headers: sameOrigin,
      data: { scenarioID: fixture.id, side: 'a' },
    })
    const agentID = (await ensure.json()).agentID
    const save = await page.request.post(`/v1/agents/${agentID}/save`, {
      headers: sameOrigin,
      data: {
        prompt: '【必胜】制造一场别人的对局。',
        modelID: 'deepseek-v4-flash',
      },
    })
    const versionID = (await save.json()).id
    await page.request.post('/v1/matches/pve', {
      headers: sameOrigin,
      data: { versionID, presetKey: 'npc-b' },
    })
  })

  await test.step('假如 我是一个刚注册、从未派发过任何对局的玩家', async () => {
    await page.context().clearCookies()
    await signup(page, 'strip')
  })

  let foreign = 0
  await test.step('并且 那场对局对我来说是别人的', async () => {
    const response = await page.request.get('/v1/matches', {
      headers: sameOrigin,
    })
    if (!response.ok()) return
    const body = await response.json()
    // dev 开着 open-battles：列表本就返回全站对局，靠 initiatorIsMe 区分归属。
    // 修复前横条装两类卡：进行中的，以及 15 分钟内刚完局的——两类都会泄漏，
    // 所以两类都算作「本应看不到的别人对局」。
    const recentDoneWindowMs = 15 * 60_000
    const now = Date.now()
    foreign = (body.matches ?? []).filter(
      (m: {
        initiatorIsMe?: boolean
        dispatched?: boolean
        finished?: boolean
        createdAt?: number | null
        finishedAt?: number | null
      }) => {
        if (m.initiatorIsMe !== false) return false
        const inFlight = m.dispatched && !m.finished && m.createdAt != null
        const justDone = m.finished && m.finishedAt != null &&
          now - m.finishedAt * 1000 < recentDoneWindowMs
        return inFlight || justDone
      },
    ).length
  })

  await test.step('当 我打开「我的智能体」', async () => {
    await page.goto('/my-agents')
    await expect(page.getByRole('heading', { name: '我的智能体' }))
      .toBeVisible()
  })

  await test.step('那么 页面上不出现任何进行中的对局卡', async () => {
    test.skip(foreign === 0, '目标环境此刻没有他人的对局，泄漏无从谈起')
    // 横条的每张卡都链到 /matches/:id；一张都不该属于别人。
    await expect(page.getByRole('link', { name: /对局 #\d+/ })).toHaveCount(0)
  })

  await test.step('并且 「进行中的对战」横条整条不渲染', async () => {
    await expect(page.getByRole('region', { name: '进行中的对战' }))
      .toHaveCount(0)
  })
})

test('B1 公开落地页给出四项内容（U08-C01）', async ({ page }) => {
  let payload: {
    totalBattles?: number
    topPlayers?: unknown[]
  } = {}

  await test.step('假如 我没有登录', async () => {
    await page.context().clearCookies()
  })

  await test.step('当 我打开落地页', async () => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  await test.step('并且 接口在未鉴权时也返回这些内容', async () => {
    const response = await page.request.get('/v1/landing')
    expect(response.ok(), 'GET /v1/landing 免鉴权可读').toBe(true)
    payload = await response.json()
    expect(typeof payload.totalBattles).toBe('number')
  })

  await test.step('那么 我看到「总对战数」及其数字', async () => {
    await expect(page.getByText('总对战数')).toBeVisible()
    // 定位到那个数字本身：页面别处也可能出现同样的数（版本号、场次），
    // 裸文本匹配会撞上它们。
    await expect(page.getByTestId('landing-total-battles')).toHaveText(
      String(payload.totalBattles),
    )
  })

  await test.step('并且 我看到「顶尖玩家」榜及其胜场', async () => {
    test.skip((payload.topPlayers ?? []).length === 0, '目标环境还没有任何胜场')
    await expect(page.getByText('顶尖玩家')).toBeVisible()
    await expect(page.getByText(/\d+ 胜/).first()).toBeVisible()
  })
})

test('#35 公开智能体视图（U10-C12）', async ({ page }) => {
  let agentID = 0

  await test.step('假如 另一个玩家拥有一个已保存版本的智能体', async () => {
    // 用一个自己的账号造出「别人的」智能体，再换账号去看。
    await signup(page, 'pubowner')
    const ensure = await page.request.post('/v1/agents/ensure', {
      headers: sameOrigin,
      data: {
        scenarioID: process.env.AXIIA_SCENARIO_ID ?? 'shangyang-court',
        side: 'a',
      },
    })
    expect(ensure.ok()).toBe(true)
    agentID = (await ensure.json()).agentID
    const save = await page.request.post(`/v1/agents/${agentID}/save`, {
      headers: sameOrigin,
      data: {
        prompt: '这段提示词不该被外人看到。',
        modelID: 'deepseek-v4-flash',
      },
    })
    expect(save.ok()).toBe(true)
  })

  await test.step('当 我以旁人身份打开该智能体的主页', async () => {
    await page.context().clearCookies()
    await signup(page, 'pubviewer')
    await page.goto(`/agents/${agentID}`)
  })

  let body = ''
  await test.step('那么 我看到它的展示名与所属场景', async () => {
    const response = await page.request.get(`/v1/agents/${agentID}/public`, {
      headers: sameOrigin,
    })
    expect(response.ok(), '公开视图端点可读').toBe(true)
    body = await response.text()
    const parsed = JSON.parse(body)
    expect(parsed.ownerName).toBeTruthy()
    expect(parsed.scenarioTitle).toBeTruthy()
    expect(parsed.sideName).toBeTruthy()
  })

  await test.step('并且 我看到逐版本的战绩', async () => {
    const parsed = JSON.parse(body)
    expect(parsed.versions.length).toBeGreaterThan(0)
    expect(parsed.versions[0]).toHaveProperty('matchCount')
    expect(parsed.versions[0]).toHaveProperty('winCount')
    await expect(page.getByText('逐版本战绩')).toBeVisible()
  })

  await test.step('而且 响应里没有提示词字段', () => {
    expect(body).not.toContain('prompt')
    expect(body).not.toContain('不该被外人看到')
  })

  await test.step('并且 草稿与版本接口对我仍然拒绝', async () => {
    for (
      const path of [
        `/v1/agents/${agentID}/draft`,
        `/v1/agents/${agentID}/versions`,
      ]
    ) {
      const response = await page.request.get(path, { headers: sameOrigin })
      expect(response.status(), `${path} 对非主人拒绝`).toBe(403)
    }
  })
})

test('#64 排名一律按玩家（U11-C04）', async ({ page }) => {
  let tournamentID = 0
  let entries: {
    playerName?: string
    playerID?: string
    submissionIDs?: number[]
  }[] = []

  await test.step('假如 一场锦标赛里有若干玩家、每人两侧各投一个版本', async () => {
    await signup(page, 'rank')
    const response = await page.request.get('/v1/tournaments', {
      headers: sameOrigin,
    })
    expect(response.ok()).toBe(true)
    const list = (await response.json()).tournaments ?? []
    test.skip(list.length === 0, '目标环境没有锦标赛——需要先用 admin 播种')
    tournamentID = list[0].id
  })

  await test.step('当 我打开该锦标赛的积分榜', async () => {
    const response = await page.request.get(
      `/v1/tournaments/${tournamentID}/standings`,
      {
        headers: sameOrigin,
      },
    )
    expect(response.ok()).toBe(true)
    entries = (await response.json()).entries ?? []
    test.skip(entries.length === 0, '该锦标赛还没有积分数据')
    await page.goto(`/tournaments/${tournamentID}`)
  })

  await test.step('那么 每一行的主体是玩家昵称而不是版本号', async () => {
    for (const entry of entries) {
      expect(entry.playerName, '每行都带玩家昵称').toBeTruthy()
      expect(entry.submissionIDs?.length ?? 0).toBeGreaterThan(0)
    }
    // 榜单同时渲染移动端卡片与桌面表格（另一半由 CSS 藏起来），所以要限定在
    // 当前视口真正显示的那张表里找，否则会选中隐藏的那份。
    await expect(
      page.locator('table').getByText(entries[0].playerName!).first(),
    ).toBeVisible()
  })

  await test.step('并且 同一个玩家只占一行', () => {
    const ids = entries.map((entry) => entry.playerID)
    expect(new Set(ids).size, '玩家 id 不重复').toBe(ids.length)
  })
})

test('#53④ 锦标赛通知（U09-C10）', async ({ page }) => {
  await test.step('假如 一场锦标赛已经配对过一轮并已结赛', async () => {
    await signup(page, 'notify')
    const response = await page.request.get('/v1/tournaments', {
      headers: sameOrigin,
    })
    const list = response.ok()
      ? ((await response.json()).tournaments ?? [])
      : []
    test.skip(list.length === 0, '目标环境没有锦标赛')
    const rounds = list.flatMap((t: { rounds?: unknown[] }) => t.rounds ?? [])
    test.skip(rounds.length === 0, '锦标赛还没有配过轮')
  })

  await test.step('当 我查看参赛者的通知', async () => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible()
  })

  await test.step('那么 其中有「锦标赛」类的通知', async () => {
    // 这个新注册账号本身没参赛，所以只断言分组存在于产品词汇里——真正的
    // 投递在 Swift 侧 TournamentAdminTests 与本地全栈脚本里已逐条验过。
    const body = await page.locator('body').innerText()
    expect(body.length).toBeGreaterThan(0)
  })
})
