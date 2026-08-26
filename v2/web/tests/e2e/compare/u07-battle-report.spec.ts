// U07 · 战报页（§A7）— u07-battle-report.feature 的可执行对应。
// BDD：每个 test.step 的文案与 feature 的 Given/When/Then 一一对应；行为
// 叙述以 feature 为准。
//
// 2026-08-25 移植注（PR #124 → main，含 #137/#138 后的行为）：
// · 原红「#69 隐藏目标五步」随 F2 落地转绿：断言独立「隐藏目标」区块、
//   逐项账目表（小计/合计/被识破扣分）、ScoreRow（被识破）/（猜中）与
//   结果卡签名明细；F7 胜负行带视角；F5 回放新控件（上一步 / 0.5×1×2×
//   分段倍速 / 常驻终局），不写死任何时长。
// · 素材：富层次报告用响应夹具（u07-helpers.richMatch，v34-critical 口径，
//   本地闸门零模型推理）；版本 id/入口/泄露契约用真服固定局（PVE + 左右手
//   互搏 PVP，惰性一次性装配 ensureRealFixture）。不复用远端专用变量
//   （AXIIA_MATCH_ID / AXIIA_OWNER_EMAIL / AXIIA_PVP_MATCH_ID /
//   AXIIA_PROBE_EMAIL），只吃 run-playwright.sh 注入的环境。
// · 仍红缺口 test.fixme（见 fixme-u07.json）：#71 对手侧公开视图入口未接
//   线；#20 服务端剥离强断言在零推理栈无素材（port-uncertain）。
import { expect, type Page, test } from '@playwright/test'

import { FIXTURE_SIDE_A_NAME, requireServerFixtures, signup } from '../helpers'
import {
  ensureRealFixture,
  mockMatch,
  RICH_MATCH_ID,
  richMatch,
  uiLogin,
} from './u07-helpers'

// 响应夹具（商鞅庭辩）的角色名。
const SIDE_A = '商鞅'
const SIDE_B = '甘龙'

test.beforeEach(() => requireServerFixtures())

async function openFinishedReport(page: Page, matchID: number) {
  await page.goto(`/matches/${matchID}`)
  // 完局布局的地标：对话全文（实况布局叫「对话」）。
  await expect(page.getByRole('heading', { name: '对话全文' }))
    .toBeVisible({ timeout: 30_000 })
}

// 旁观「别人对局」的真服场景需要 dev 同款 AXIIA_OPEN_BATTLES=1——未开启
// 时服务端对非参战者 403 not your match（MatchRoutes.requireMatchReadable）。
// 属环境限制，非 spec-gap；开关状态取自 /v1/matches 投影的 open 字段。
async function skipUnlessOpenBattles(page: Page) {
  const response = await page.request.get('/v1/matches')
  expect(response.ok(), 'GET /v1/matches').toBe(true)
  const { open } = await response.json() as { open?: boolean }
  test.skip(
    open !== true,
    '旁观他人战报需 AXIIA_OPEN_BATTLES=1（dev 同款；环境限制，非 spec-gap）',
  )
}

async function sectionTitles(page: Page): Promise<string[]> {
  return await page.$$eval(
    'h2',
    (els) => els.map((el) => el.textContent?.trim() ?? ''),
  )
}

// 每张对话行卡（.border-l-2 是 DialogueRow 的执方描边）：发言者 + 有无
// 「内心」折叠（ReasoningFold 的开关按钮文案）。
async function rowFolds(page: Page) {
  return await page.$$eval(
    '.border-l-2',
    (cards) =>
      cards.map((card) => ({
        speaker: card.querySelector('span')?.textContent?.trim() ?? '',
        hasFold: [...card.querySelectorAll('button')].some((button) =>
          button.textContent?.includes('内心')
        ),
      })),
  )
}

type Participant = {
  versionID?: number | null
  modelID?: string | null
  presetKey?: string | null
  isMine?: boolean
}

type MatchPayload = {
  summary: {
    kind: string
    finished: boolean
    scored: boolean
    winner?: string | null
    participants?: { a: Participant; b: Participant }
  }
  turns: Array<{ speaker: string; kind: string; reasoning?: string | null }>
  verdicts: Array<{ key: string; model: string }>
}

async function matchPayload(
  page: Page,
  matchID: number,
): Promise<MatchPayload> {
  const response = await page.request.get(`/v1/matches/${matchID}`)
  expect(response.ok(), `GET /v1/matches/${matchID}`).toBe(true)
  return await response.json() as MatchPayload
}

// 夹具预检：素材走样（装配失败、对局没完局）要与「交付物红」区分开——
// 预检失败＝夹具腐坏（fixture rot），不是规格差异。
async function assertPveFixture(
  page: Page,
  matchID: number,
): Promise<MatchPayload> {
  const payload = await matchPayload(page, matchID)
  const { summary } = payload
  expect(summary.kind, '固定局 PVE 对局').toBe('pve')
  expect(summary.finished && summary.scored, '对局应已完局并计分').toBe(true)
  expect(
    summary.participants?.a.isMine,
    '登录账号应是甲方（我方）智能体的所有者',
  ).toBe(true)
  expect(
    summary.participants?.b.presetKey,
    '乙方应是官方 NPC 预设',
  ).toBeTruthy()
  return payload
}

async function assertPvpFixture(
  page: Page,
  matchID: number,
): Promise<MatchPayload> {
  const payload = await matchPayload(page, matchID)
  const { summary } = payload
  expect(summary.kind, '固定局 PVP（互搏）对局').toBe('pvp')
  expect(summary.finished && summary.scored, '对局应已完局并计分').toBe(true)
  expect(summary.participants?.a.versionID, '甲方应为玩家版本').toBeTruthy()
  expect(summary.participants?.b.versionID, '乙方应为玩家版本').toBeTruthy()
  return payload
}

test.describe('U07 · 战报（§A7）', () => {
  test('完局战报的区块次序与结果置顶（#69/#26 主干，F2/F7 更新）', async ({ page }) => {
    await test.step('假如 我以对局所有者视角登录并打开完局战报（响应夹具）', async () => {
      await signup(page, 'u07-a')
      await mockMatch(page, RICH_MATCH_ID, richMatch('owner'))
      await openFinishedReport(page, RICH_MATCH_ID)
    })
    await test.step('那么 「结果」区块置顶——胜负行带我方视角（F7），比分一眼可见', async () => {
      const titles = await sectionTitles(page)
      expect(titles[0]).toBe('结果')
      await expect(page.getByText(`我方（${SIDE_A}）胜`).first()).toBeVisible()
      await expect(page.getByText('比分')).toBeVisible()
    })
    await test.step('并且 比分下有带符号的签名明细（F2——被识破的扣分在结果卡就说清）', async () => {
      await expect(
        page.getByText('商鞅 +1 大政方针 · +0.5 真请求获准 · -1 被识破 = 0.5'),
      ).toBeVisible()
      await expect(page.getByText('甘龙 无增减 = 0', { exact: true }))
        .toBeVisible()
    })
    await test.step('并且 完整终局裁决（含裁判模型标注）在问询之后按原事件顺序出现', async () => {
      await expect(
        page.getByRole('heading', { name: '终局裁决', exact: true }),
      )
        .toBeVisible()
      const final = richMatch('owner').verdicts
        .find((verdict) => verdict.key === 'final' || verdict.key === 'judge')
      expect(final).toBeTruthy()
      await expect(page.getByText(final!.model).first()).toBeVisible()
    })
    await test.step(
      '并且 区块自上而下依次为 结果、对话全文、问询、终局裁决、隐藏目标、计分推导',
      async () => {
        const titles = await sectionTitles(page)
        const order = [
          '结果',
          '对话全文',
          '问询',
          '终局裁决',
          '隐藏目标',
          '计分推导',
        ]
          .map((title) => titles.findIndex((t) => t === title))
        expect(order.every((index) => index >= 0), `h2＝${titles}`).toBe(true)
        expect([...order].sort((a, b) => a - b)).toEqual(order)
      },
    )
    await test.step(
      '并且 计分推导内 真目标、对方猜测、准驳结果、得分账 齐备，且得分账是逐项账目表（F2/#26）',
      async () => {
        for (const label of ['真目标', '对方猜测', '准驳结果', '得分账']) {
          await expect(page.getByText(label, { exact: true }).first())
            .toBeVisible()
        }
        await expect(page.getByText('被识破扣分').first()).toBeVisible()
        await expect(page.getByText(`小计 ${SIDE_A} 0.5 · ${SIDE_B} 0`))
          .toBeVisible()
        await expect(page.getByText(`合计 ${SIDE_A} 0.5 : 0 ${SIDE_B}`))
          .toBeVisible()
      },
    )
    await test.step('并且 对话末尾的计分卡就地标注（被识破）/（猜中）（F2）', async () => {
      await expect(page.getByText('（被识破）').first()).toBeVisible()
      await expect(page.getByText('（猜中）').first()).toBeVisible()
    })
  })

  test('隐藏目标的五步披露区块（#69——F2 已落地，转绿）', async ({ page }) => {
    await test.step('假如 我以对局所有者视角登录并打开完局战报（响应夹具）', async () => {
      await signup(page, 'u07-b')
      await mockMatch(page, RICH_MATCH_ID, richMatch('owner'))
      await openFinishedReport(page, RICH_MATCH_ID)
    })
    await test.step(
      '那么 终局裁决之后、计分推导之前存在独立的「隐藏目标」区块',
      async () => {
        const titles = await sectionTitles(page)
        const hidden = titles.findIndex((t) => t.includes('隐藏目标'))
        expect(hidden, `h2＝${titles}——无「隐藏目标」区块`).toBeGreaterThan(-1)
        expect(hidden).toBeGreaterThan(
          titles.findIndex((t) => t === '终局裁决'),
        )
        expect(hidden).toBeLessThan(titles.findIndex((t) => t === '计分推导'))
      },
    )
    await test.step(
      '并且 区块内五步齐全：真目标、是否达成、对手猜了什么、是否被识破、得分变化',
      async () => {
        for (
          const step of [
            '真目标',
            '是否达成',
            '对手猜了什么',
            '是否被识破',
            '得分变化',
          ]
        ) {
          await expect(
            page.getByText(step).first(),
            `五步之「${step}」`,
          ).toBeVisible()
        }
      },
    )
    await test.step(
      '并且 五步给出的是结论而非散文：已达成（真请求获准 +0.5）、被识破 -1、未被识破 都有明确文案',
      async () => {
        await expect(page.getByText('已达成（真请求获准 +0.5）')).toBeVisible()
        await expect(page.getByText('被识破 -1')).toBeVisible()
        await expect(page.getByText('未被识破')).toBeVisible()
      },
    )
  })

  test('PVE 完局显示我方版本 id，NPC 侧标官方预设（#25/#21）', async ({ page }) => {
    test.setTimeout(300_000)
    let pveMatchID = 0
    await test.step('假如 我以对局所有者身份登录并打开固定局 PVE 完局战报（真服）', async () => {
      const real = await ensureRealFixture()
      pveMatchID = real.pveMatchID
      await uiLogin(page, real.ownerEmail)
      await openFinishedReport(page, pveMatchID)
    })
    const { summary } = await assertPveFixture(page, pveMatchID)
    const mine = summary.participants!.a
    await test.step(
      '那么 我方参战卡显示版本 id 并可复制（可用于按 id 约战）',
      async () => {
        await expect(page.getByText(`v#${mine.versionID}`).first())
          .toBeVisible()
        await expect(page.getByRole('button', { name: '复制 id' }).first())
          .toBeVisible()
        await expect(page.getByText('可用于按 id 约战').first()).toBeVisible()
      },
    )
    await test.step(
      '并且 NPC 侧参战卡标注为官方预设（官方侧无版本 id）',
      async () => {
        await expect(page.getByText('PVE 预设').first()).toBeVisible()
      },
    )
    await test.step('并且 模型 id 按 API 口径公开显示（#21）', async () => {
      expect(mine.modelID, '我方版本必带模型').toBeTruthy()
      await expect(page.getByText(mine.modelID!).first()).toBeVisible()
      const npc = summary.participants!.b
      if (npc.modelID) {
        await expect(page.getByText(npc.modelID).first()).toBeVisible()
      }
    })
  })

  test('PVP 完局同时显示双方版本 id（#25——本地素材为左右手互搏局）', async ({ page }) => {
    test.setTimeout(300_000)
    let pvpMatchID = 0
    await test.step(
      '假如 我以旁观者身份登录并打开一场完局 PVP 战报（真服）',
      async () => {
        const real = await ensureRealFixture()
        pvpMatchID = real.pvpMatchID
        await uiLogin(page, real.probeEmail)
        await skipUnlessOpenBattles(page)
        await openFinishedReport(page, pvpMatchID)
      },
    )
    await test.step('那么 两张参战卡各自显示版本 id（#25 双方都显示）', async () => {
      const { summary } = await assertPvpFixture(page, pvpMatchID)
      // .first()：对手行文本与 id 徽章都含 v#——两处出现即「显示」成立。
      await expect(
        page.getByText(`v#${summary.participants!.a.versionID}`).first(),
      ).toBeVisible()
      await expect(
        page.getByText(`v#${summary.participants!.b.versionID}`).first(),
      ).toBeVisible()
    })
  })

  test('我方侧有显眼的「← 我的智能体」入口（#71）', async ({ page }) => {
    test.setTimeout(300_000)
    await test.step('假如 我以对局所有者身份登录并打开固定局 PVE 完局战报（真服）', async () => {
      const real = await ensureRealFixture()
      await uiLogin(page, real.ownerEmail)
      await openFinishedReport(page, real.pveMatchID)
    })
    await test.step('那么 我方参战卡上有醒目的「← 我的智能体」按钮', async () => {
      // 页头也有同名返回链接——按参战卡（执A 徽记所在的 rounded-xl 卡）取。
      const myCard = page.locator('div.rounded-xl').filter({ hasText: '执A' })
        .first()
      await expect(myCard.getByRole('link', { name: '← 我的智能体' }))
        .toBeVisible()
    })
  })

  // fixme(#71 对手侧公开视图入口缺失): 按规格 #71，参战卡对手侧应有指向
  // 对手智能体公开视图的低调入口；#138 已落地 /v1/agents/:id/public 投影与
  // agent-view 前端公开分支，但 match-detail.tsx 的 ParticipantCard 对手侧
  // 仍是纯文本「对手：{名} · v#{id}」（注释仍写「本阶段不给链接」，
  // #137/#138 均未接线）；待参战卡挂上公开视图入口后摘除。
  test.fixme('对手侧的「查看对手智能体」低调入口（#71——缺口未修）', async ({ page }) => {
    test.setTimeout(300_000)
    await test.step(
      '假如 我以旁观者身份登录并打开一场完局 PVP 战报（真服）',
      async () => {
        const real = await ensureRealFixture()
        await uiLogin(page, real.probeEmail)
        await skipUnlessOpenBattles(page)
        await assertPvpFixture(page, real.pvpMatchID)
        await openFinishedReport(page, real.pvpMatchID)
      },
    )
    await test.step(
      '那么 参战卡上有指向对手智能体公开视图的「查看对手智能体」入口',
      async () => {
        await expect(page.getByText('查看对手智能体').first()).toBeVisible()
      },
    )
  })

  test('裁判 OS 生成层默认公开（#22①/#24/#21）', async ({ page }) => {
    await test.step(
      '假如 我以旁观者视角登录并打开完局战报（响应夹具，不开调试模式）',
      async () => {
        await signup(page, 'u07-c')
        await mockMatch(page, RICH_MATCH_ID, richMatch('probe'))
        await openFinishedReport(page, RICH_MATCH_ID)
      },
    )
    await test.step('那么 对话流中「君上心声」卡默认可见', async () => {
      await expect(page.getByText('君上心声').first()).toBeVisible()
    })
    await test.step(
      '并且 心声卡带结构化倾向（当前倾向恒有；最挂心随夹具 attention 渲染——#135 后新对局只保证 os+favor）',
      async () => {
        await expect(page.getByText('当前倾向').first()).toBeVisible()
        await expect(page.getByText('最挂心').first()).toBeVisible()
      },
    )
    await test.step('并且 心声卡标注裁判所用模型 id', async () => {
      const os = richMatch('probe').verdicts
        .find((verdict) => verdict.key.startsWith('os-'))
      expect(os).toBeTruthy()
      await expect(page.getByText(os!.model).first()).toBeVisible()
    })
  })

  test('调试模式下三类 trace 的可见性（#20/#22②/#80——UI 层）', async ({ browser }) => {
    const ownerContext = await browser.newContext()
    const probeContext = await browser.newContext()
    try {
      const ownerPage = await ownerContext.newPage()
      await test.step('假如 我以对局所有者视角打开完局战报（响应含己方 reasoning）', async () => {
        await signup(ownerPage, 'u07-d')
        await mockMatch(ownerPage, RICH_MATCH_ID, richMatch('owner'))
        await openFinishedReport(ownerPage, RICH_MATCH_ID)
      })
      await test.step(
        '那么 调试模式默认关闭，页面上没有任何「内心」折叠',
        async () => {
          await expect(ownerPage.getByRole('switch', { name: /调试模式/ }))
            .toHaveAttribute('aria-checked', 'false')
          expect((await rowFolds(ownerPage)).every((row) => !row.hasFold))
            .toBe(true)
        },
      )
      await test.step('当 我开启调试模式', async () => {
        await ownerPage.getByRole('switch', { name: /调试模式/ }).click()
        await expect(ownerPage.getByRole('switch', { name: /调试模式/ }))
          .toHaveAttribute('aria-checked', 'true')
      })
      await test.step(
        '那么 我方（商鞅）发言行出现「内心」思考折叠（己方 trace，仅所有者）',
        async () => {
          const folds = await rowFolds(ownerPage)
          expect(
            folds.filter((row) => row.speaker === SIDE_A && row.hasFold).length,
          ).toBeGreaterThan(0)
        },
      )

      const probePage = await probeContext.newPage()
      await test.step(
        '假如 我以旁观者视角打开同一战报（响应已剥离他人己方 reasoning）并开启调试模式',
        async () => {
          await signup(probePage, 'u07-e')
          await mockMatch(probePage, RICH_MATCH_ID, richMatch('probe'))
          await openFinishedReport(probePage, RICH_MATCH_ID)
          await probePage.getByRole('switch', { name: /调试模式/ }).click()
          await expect(probePage.getByRole('switch', { name: /调试模式/ }))
            .toHaveAttribute('aria-checked', 'true')
        },
      )
      await test.step(
        '那么 他人（商鞅）侧发言行没有任何「内心」折叠',
        async () => {
          const folds = await rowFolds(probePage)
          expect(folds.filter((row) => row.speaker === SIDE_A && row.hasFold))
            .toEqual([])
        },
      )
      await test.step(
        '并且 NPC（甘龙）侧发言行出现「内心」折叠（#80 官方侧公开）',
        async () => {
          const folds = await rowFolds(probePage)
          expect(
            folds.filter((row) => row.speaker === SIDE_B && row.hasFold).length,
          ).toBeGreaterThan(0)
        },
      )
      await test.step(
        '并且 裁判真实 trace 折叠对旁观者可见（#22② 公开）',
        async () => {
          // 裁判 trace 折叠数是**推断**出来的：total（全页「内心」按钮）−
          // in-row（.border-l-2 对话行内的折叠，旁观者视角只剩 NPC 侧）＝
          // 行外折叠，即心声卡上的裁判 trace（旁观者响应里 a 侧 reasoning
          // 已剥离，行外折叠不可能来自他人己方 trace——上一步已证）。
          const total = await probePage.getByRole('button', { name: /内心/ })
            .count()
          const inRows = (await rowFolds(probePage))
            .filter((row) => row.hasFold).length
          expect(total).toBeGreaterThan(inRows)
        },
      )
    } finally {
      await ownerContext.close()
      await probeContext.close()
    }
  })

  // fixme(#20 服务端剥离强断言本地无素材): 按规格 #20，/v1/matches/:id 应只
  // 对所有者返回己方 reasoning（服务端剥离，非前端遮罩）；本地 e2e 栈刻意
  // 零模型推理，固定局对局的 turns 全部无 reasoning，「所有者>0 / 旁观=0」
  // 无从取证——port-uncertain — integration to resolve；待集成环境提供带
  // reasoning 的素材（seed 注入或对 dev 远端服复跑）后摘除。原断言体保留。
  test.fixme('服务端契约只对所有者返回己方 reasoning（#20——port-uncertain）', async ({ browser }) => {
    test.setTimeout(300_000)
    const ownerContext = await browser.newContext()
    const probeContext = await browser.newContext()
    try {
      const real = await ensureRealFixture()
      const ownerPage = await ownerContext.newPage()
      const probePage = await probeContext.newPage()
      await test.step('假如 所有者与旁观者分别请求同一场完局对局的接口', async () => {
        await uiLogin(ownerPage, real.ownerEmail)
        await uiLogin(probePage, real.probeEmail)
      })
      await test.step(
        '那么 服务端只对所有者返回己方 reasoning（非前端遮罩）',
        async () => {
          const forOwner = await matchPayload(ownerPage, real.pveMatchID)
          const forProbe = await matchPayload(probePage, real.pveMatchID)
          const reasonedRows = (payload: MatchPayload, speaker: string) =>
            payload.turns.filter((turn) =>
              turn.speaker === speaker && (turn.reasoning ?? '').trim() !== ''
            ).length
          expect(reasonedRows(forOwner, 'a')).toBeGreaterThan(0)
          expect(reasonedRows(forProbe, 'a')).toBe(0)
          expect(reasonedRows(forProbe, 'b')).toBeGreaterThan(0)
          expect(reasonedRows(forProbe, 'judge')).toBeGreaterThan(0)
        },
      )
    } finally {
      await ownerContext.close()
      await probeContext.close()
    }
  })

  test('回放隐藏终局层与 debug 层，F5 新控件与常驻终局（A7/B1/F5）', async ({ page }) => {
    await test.step('假如 我以对局所有者视角登录并打开完局战报（响应夹具）', async () => {
      await signup(page, 'u07-f')
      await mockMatch(page, RICH_MATCH_ID, richMatch('owner'))
      await openFinishedReport(page, RICH_MATCH_ID)
    })
    await test.step('当 我开启调试模式并点击「回放」', async () => {
      await page.getByRole('switch', { name: /调试模式/ }).click()
      await page.getByRole('button', { name: '回放', exact: true }).click()
    })
    const speeds = page.getByRole('group', { name: '倍速' })
    await test.step(
      '那么 结果徽章变为「回放中」，控制条带 上一步、步进与 0.5×/1×/2× 分段倍速（F5）',
      async () => {
        await expect(page.getByText('回放中').first()).toBeVisible()
        await expect(page.getByRole('button', { name: '退出回放' }))
          .toBeVisible()
        await expect(page.getByRole('button', { name: '上一步' })).toBeVisible()
        await expect(page.getByRole('button', { name: '步进' })).toBeVisible()
        await expect(speeds.getByRole('button', { name: '0.5×' })).toBeVisible()
        await expect(speeds.getByRole('button', { name: '1×' }))
          .toHaveAttribute('aria-pressed', 'true')
        await expect(speeds.getByRole('button', { name: '2×' }))
          .toHaveAttribute('aria-pressed', 'false')
      },
    )
    await test.step('当 我选 0.5× 慢速档；那么 档位选中（aria-pressed）且被 localStorage 记住（F5）', async () => {
      await speeds.getByRole('button', { name: '0.5×' }).click()
      await expect(speeds.getByRole('button', { name: '0.5×' }))
        .toHaveAttribute('aria-pressed', 'true')
      expect(
        await page.evaluate(() => localStorage.getItem('axiia-replay-speed')),
      ).toBe('0.5')
    })
    await test.step(
      '并且 结果、问询、隐藏目标、计分推导区块整段隐藏（不剧透终局）',
      async () => {
        const titles = await sectionTitles(page)
        for (const title of ['结果', '问询', '隐藏目标', '计分推导']) {
          expect(titles, `回放中不该出现「${title}」`).not.toContain(title)
        }
      },
    )
    await test.step(
      '并且 调试开关被禁用，所有「内心」折叠隐藏（B1）',
      async () => {
        await expect(page.getByRole('switch', { name: /调试模式/ }))
          .toHaveAttribute('aria-disabled', 'true')
        await expect(page.getByRole('button', { name: /内心/ })).toHaveCount(0)
      },
    )
    await test.step(
      '当 我用「步进」走到终局；那么 终局常驻——「回放结束 / 重新播放」，不自动退出（F5）',
      async () => {
        // 不写死时长：手动步进直至终局（步数上限远大于夹具步骤数；点击与
        // 自动推进赛跑时点空一次无妨，下一轮循环即察觉终局）。
        for (let i = 0; i < 30; i++) {
          if (await page.getByText('回放结束').isVisible().catch(() => false)) {
            break
          }
          await page.getByRole('button', { name: '步进' }).click()
            .catch(() => {})
        }
        await expect(page.getByText('回放结束')).toBeVisible()
        await expect(page.getByRole('button', { name: '重新播放' }))
          .toBeVisible()
        // 常驻：终局层依旧不剧透，直到本人退出。
        expect(await sectionTitles(page)).not.toContain('结果')
      },
    )
    await test.step('当 我点击「退出回放」', async () => {
      await page.getByRole('button', { name: '退出回放' }).click()
    })
    await test.step('那么 结果与计分推导区块恢复显示', async () => {
      await expect(page.getByRole('heading', { name: '结果' })).toBeVisible()
      await expect(page.getByRole('heading', { name: '计分推导' }))
        .toBeVisible()
    })
  })

  test('旁观者经链接看到全部公开层，且拿不到受限三项（#20/#21/F7/分享）', async ({ page }) => {
    test.setTimeout(300_000)
    let pveMatchID = 0
    await test.step('假如 我以旁观者身份登录并直接打开战报链接（真服）', async () => {
      const real = await ensureRealFixture()
      pveMatchID = real.pveMatchID
      await uiLogin(page, real.probeEmail)
      await skipUnlessOpenBattles(page)
      await openFinishedReport(page, pveMatchID)
    })
    await test.step(
      '那么 完整战报渲染：结果、比分、模型、版本 id 全可见',
      async () => {
        const { summary } = await matchPayload(page, pveMatchID)
        await expect(page.getByRole('heading', { name: '结果' })).toBeVisible()
        await expect(page.getByText('比分')).toBeVisible()
        await expect(
          page.getByText(`v#${summary.participants!.a.versionID}`).first(),
        ).toBeVisible()
        expect(summary.participants!.a.modelID, '甲方模型公开').toBeTruthy()
        await expect(page.getByText(summary.participants!.a.modelID!).first())
          .toBeVisible()
      },
    )
    await test.step('并且 旁观视角的胜负行是「胜方 正方」（F7）', async () => {
      await expect(page.getByText(`胜方 ${FIXTURE_SIDE_A_NAME}`).first())
        .toBeVisible()
    })
    await test.step(
      '并且 页面与接口响应中都没有任何一方的提示词或 diff（含固定局暗记）',
      async () => {
        const body = await page.evaluate(() => document.body.innerText)
        expect(body).not.toContain('提示词')
        // 固定局暗记只存在于双方提示词里——出现即真泄露（#20）。
        expect(body).not.toContain('【必胜】')
        // 词边界匹配而非裸子串：页脚 build 哈希等场合可能偶含 'diff' 片段，
        // 这里只拦作为独立词出现的 diff/版本 diff 标签。
        expect(body).not.toMatch(/\bdiff\b/i)
        const payload = await matchPayload(page, pveMatchID)
        expect(JSON.stringify(payload)).not.toContain('【必胜】')
        const keys = new Set<string>()
        const walk = (value: unknown) => {
          if (Array.isArray(value)) value.forEach(walk)
          else if (value != null && typeof value === 'object') {
            for (const [key, child] of Object.entries(value)) {
              keys.add(key)
              walk(child)
            }
          }
        }
        walk(payload)
        expect(keys.has('prompt')).toBe(false)
        expect(keys.has('playerPrompt')).toBe(false)
        expect(keys.has('diff')).toBe(false)
      },
    )
  })
})
