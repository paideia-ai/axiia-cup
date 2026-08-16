// U07 · 战报页（§A7）— u07-battle-report.feature 的可执行对应。
// BDD：每个 test.step 的文案与 feature 的 Given/When/Then 一一对应；行为
// 叙述以 feature 为准。**红＝dev 与 v3.4 规格的真实差异（交付物）**，
// 只有 test-bug 才修。
//
// 素材（战斗预算 0，只读）：AXIIA_MATCH_ID（默认 5）＝完局 PVE，owner
// 账号执甲（商鞅），乙侧为官方 NPC 预设；AXIIA_PVP_MATCH_ID（默认 6）＝
// 完局 PVP。登录既有账号（不 signup、不派发）——tests/e2e/helpers.ts 的
// signup/夹具工具因此全部不适用，本文件自带 login。
import { type APIResponse, expect, type Page, test } from '@playwright/test'

const MATCH = process.env.AXIIA_MATCH_ID ?? '5'
const PVP_MATCH = process.env.AXIIA_PVP_MATCH_ID ?? '6'
const OWNER_EMAIL = process.env.AXIIA_OWNER_EMAIL ??
  'playwright-u03-1786869179952@axiia.test'
const PROBE_EMAIL = process.env.AXIIA_PROBE_EMAIL ??
  'coordinator-probe-0816@axiia.test'
const PASSWORD = process.env.AXIIA_ACCOUNT_PASSWORD ?? 'playwrightpw-123456'

// 默认素材的角色名（商鞅变法·朝堂辩法：甲＝商鞅，乙＝甘龙，裁判＝君上）。
// 换 AXIIA_MATCH_ID 时按该场景的 speakerLabels 调整。
const SIDE_A = '商鞅'
const SIDE_B = '甘龙'

async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码').fill(PASSWORD)
  await page.getByRole('button', { name: '登录' }).click()
  await page.waitForURL((url) => !String(url).includes('/login'), {
    timeout: 30_000,
  })
}

async function openFinishedReport(page: Page, matchID: string) {
  await page.goto(`/matches/${matchID}`)
  // 完局布局的地标：对话全文（实况布局叫「对话」）。
  await expect(page.getByRole('heading', { name: '对话全文' }))
    .toBeVisible({ timeout: 30_000 })
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

type MatchPayload = {
  summary: {
    participants?: {
      a: { versionID?: number; modelID?: string; presetKey?: string }
      b: { versionID?: number; modelID?: string; presetKey?: string }
    }
  }
  turns: Array<{ speaker: string; kind: string; reasoning?: string | null }>
  verdicts: Array<{ key: string; model: string }>
}

async function matchPayload(
  page: Page,
  matchID: string,
): Promise<MatchPayload> {
  const response: APIResponse = await page.request.get(`/v1/matches/${matchID}`)
  expect(response.ok(), `GET /v1/matches/${matchID}`).toBe(true)
  return await response.json() as MatchPayload
}

test.describe('U07 · 战报（§A7）', () => {
  test('完局战报的区块次序与结果置顶（#69 主干）', async ({ page }) => {
    await test.step('假如 我以对局所有者身份登录并打开完局战报', async () => {
      await login(page, OWNER_EMAIL)
      await openFinishedReport(page, MATCH)
    })
    await test.step('那么 「结果」区块置顶——胜者与比分一眼可见', async () => {
      const titles = await sectionTitles(page)
      expect(titles[0]).toBe('结果')
      await expect(page.getByText(/胜方|平局/).first()).toBeVisible()
      await expect(page.getByText('比分')).toBeVisible()
    })
    await test.step('并且 判词散文（含裁判模型标注）随结果区块分列', async () => {
      await expect(page.getByText('判词')).toBeVisible()
      const { verdicts } = await matchPayload(page, MATCH)
      const final = verdicts.find((verdict) => verdict.key === 'final')
      expect(final).toBeTruthy()
      await expect(page.getByText(final!.model).first()).toBeVisible()
    })
    await test.step(
      '并且 区块自上而下依次为 结果、对话全文、问询、计分推导',
      async () => {
        const titles = await sectionTitles(page)
        const order = ['结果', '对话全文', '问询', '计分推导']
          .map((title) => titles.findIndex((t) => t === title))
        expect(order.every((index) => index >= 0), `h2＝${titles}`).toBe(true)
        expect([...order].sort((a, b) => a - b)).toEqual(order)
      },
    )
    await test.step(
      '并且 计分推导内有真目标、对方猜测、准驳结果与得分账四行账目',
      async () => {
        for (const label of ['真目标', '对方猜测', '准驳结果', '得分账']) {
          await expect(page.getByText(label, { exact: true }).first())
            .toBeVisible()
        }
      },
    )
  })

  test('隐藏目标的五步披露区块（#69，预期与 dev 有差异）', async ({ page }) => {
    await test.step('假如 我以对局所有者身份登录并打开完局战报', async () => {
      await login(page, OWNER_EMAIL)
      await openFinishedReport(page, MATCH)
    })
    await test.step(
      '那么 问询之后、计分推导之前存在独立的「隐藏目标」区块',
      async () => {
        const titles = await sectionTitles(page)
        const hidden = titles.findIndex((t) => t.includes('隐藏目标'))
        expect(hidden, `h2＝${titles}——无「隐藏目标」区块`).toBeGreaterThan(-1)
        expect(hidden).toBeGreaterThan(titles.findIndex((t) => t === '问询'))
        expect(hidden).toBeLessThan(titles.findIndex((t) => t === '计分推导'))
      },
    )
    await test.step(
      '并且 区块内五步齐全：真目标、辩论中是否达成、对手猜了什么、是否被识破、得分变化',
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
  })

  test('PVE 完局显示我方版本 id，NPC 侧标官方预设（#25/#21）', async ({ page }) => {
    await test.step('假如 我以对局所有者身份登录并打开完局战报', async () => {
      await login(page, OWNER_EMAIL)
      await openFinishedReport(page, MATCH)
    })
    const { summary } = await matchPayload(page, MATCH)
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
    await test.step('并且 双方的模型 id 都公开显示（#21）', async () => {
      await expect(page.getByText(mine.modelID!).first()).toBeVisible()
      await expect(page.getByText(summary.participants!.b.modelID!).first())
        .toBeVisible()
    })
  })

  test('PVP 完局同时显示双方版本 id（#25）', async ({ page }) => {
    await test.step(
      '假如 我以旁观者身份登录并打开一场完局 PVP 战报',
      async () => {
        await login(page, PROBE_EMAIL)
        await openFinishedReport(page, PVP_MATCH)
      },
    )
    await test.step('那么 两张参战卡各自显示版本 id（#25 双方都显示）', async () => {
      const { summary } = await matchPayload(page, PVP_MATCH)
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
    await test.step('假如 我以对局所有者身份登录并打开完局战报', async () => {
      await login(page, OWNER_EMAIL)
      await openFinishedReport(page, MATCH)
    })
    await test.step('那么 我方参战卡上有醒目的「← 我的智能体」按钮', async () => {
      const myCard = page.locator('div.rounded-xl').filter({ hasText: '执A' })
        .first()
      await expect(myCard.getByRole('link', { name: '← 我的智能体' }))
        .toBeVisible()
    })
  })

  test('对手侧的「查看对手智能体」低调入口（#71，预期与 dev 有差异）', async ({ page }) => {
    await test.step(
      '假如 我以旁观者身份登录并打开一场完局 PVP 战报',
      async () => {
        await login(page, PROBE_EMAIL)
        await openFinishedReport(page, PVP_MATCH)
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
      '假如 我以旁观者身份登录并打开完局战报（不开调试模式）',
      async () => {
        await login(page, PROBE_EMAIL)
        await openFinishedReport(page, MATCH)
      },
    )
    await test.step('那么 对话流中「君上心声」卡默认可见', async () => {
      await expect(page.getByText('君上心声').first()).toBeVisible()
    })
    await test.step(
      '并且 心声卡带结构化倾向（最挂心/当前倾向——#24 回放锚点数据）',
      async () => {
        await expect(page.getByText('最挂心').first()).toBeVisible()
        await expect(page.getByText('当前倾向').first()).toBeVisible()
      },
    )
    await test.step('并且 心声卡标注裁判所用模型 id', async () => {
      const { verdicts } = await matchPayload(page, MATCH)
      const os = verdicts.find((verdict) => verdict.key.startsWith('os-'))
      expect(os).toBeTruthy()
      await expect(page.getByText(os!.model).first()).toBeVisible()
    })
  })

  test('调试模式下三类 trace 的可见性（#20/#22②/#80）', async ({ browser }) => {
    const ownerContext = await browser.newContext()
    const probeContext = await browser.newContext()
    try {
      const ownerPage = await ownerContext.newPage()
      await test.step('假如 我以对局所有者身份登录并打开完局战报', async () => {
        await login(ownerPage, OWNER_EMAIL)
        await openFinishedReport(ownerPage, MATCH)
      })
      await test.step(
        '那么 调试模式默认关闭，页面上没有任何「内心」折叠',
        async () => {
          await expect(ownerPage.getByRole('switch'))
            .toHaveAttribute('aria-checked', 'false')
          expect((await rowFolds(ownerPage)).every((row) => !row.hasFold))
            .toBe(true)
        },
      )
      await test.step('当 我开启调试模式', async () => {
        await ownerPage.getByRole('switch').click()
        await expect(ownerPage.getByRole('switch'))
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
        '假如 我以旁观者身份登录并打开同一战报并开启调试模式',
        async () => {
          await login(probePage, PROBE_EMAIL)
          await openFinishedReport(probePage, MATCH)
          await probePage.getByRole('switch').click()
          await expect(probePage.getByRole('switch'))
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
          // 结果卡（判词处）的折叠＝裁判终局 trace；行内折叠只属对话行，
          // 判词的折叠在 .border-l-2 之外。
          const total = await probePage.getByRole('button', { name: /内心/ })
            .count()
          const inRows = (await rowFolds(probePage))
            .filter((row) => row.hasFold).length
          expect(total).toBeGreaterThan(inRows)
        },
      )
      await test.step(
        '并且 服务端契约同样只对所有者返回己方 reasoning（非前端遮罩）',
        async () => {
          const forOwner = await matchPayload(ownerPage, MATCH)
          const forProbe = await matchPayload(probePage, MATCH)
          const reasonedSeqs = (payload: MatchPayload, speaker: string) =>
            payload.turns.filter((turn) =>
              turn.speaker === speaker && (turn.reasoning ?? '').trim() !== ''
            ).length
          expect(reasonedSeqs(forOwner, 'a')).toBeGreaterThan(0)
          expect(reasonedSeqs(forProbe, 'a')).toBe(0)
          expect(reasonedSeqs(forProbe, 'b')).toBeGreaterThan(0)
          expect(reasonedSeqs(forProbe, 'judge')).toBeGreaterThan(0)
        },
      )
    } finally {
      await ownerContext.close()
      await probeContext.close()
    }
  })

  test('回放隐藏终局层与 debug 层，退出后恢复（A7 回放/B1）', async ({ page }) => {
    await test.step('假如 我以对局所有者身份登录并打开完局战报', async () => {
      await login(page, OWNER_EMAIL)
      await openFinishedReport(page, MATCH)
    })
    await test.step('当 我开启调试模式并点击「回放」', async () => {
      await page.getByRole('switch').click()
      await page.getByRole('button', { name: '回放', exact: true }).click()
    })
    await test.step('那么 结果徽章变为「回放中」，出现回放控制条', async () => {
      await expect(page.getByText('回放中').first()).toBeVisible()
      await expect(page.getByRole('button', { name: '退出回放' })).toBeVisible()
    })
    await test.step(
      '并且 结果、问询、计分推导区块整段隐藏（不剧透终局）',
      async () => {
        const titles = await sectionTitles(page)
        expect(titles).not.toContain('结果')
        expect(titles).not.toContain('问询')
        expect(titles).not.toContain('计分推导')
      },
    )
    await test.step(
      '并且 调试开关被禁用，所有「内心」折叠隐藏（B1）',
      async () => {
        await expect(page.getByRole('switch'))
          .toHaveAttribute('aria-disabled', 'true')
        await expect(page.getByRole('button', { name: /内心/ })).toHaveCount(0)
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

  test('旁观者经链接看到全部公开层，且拿不到受限三项（#20/#21/分享）', async ({ page }) => {
    await test.step('假如 我以旁观者身份登录并直接打开战报链接', async () => {
      await login(page, PROBE_EMAIL)
      await openFinishedReport(page, MATCH)
    })
    await test.step(
      '那么 完整战报渲染：对话全文、结果、比分、裁判心声、双方模型、版本 id 全可见',
      async () => {
        const { summary } = await matchPayload(page, MATCH)
        await expect(page.getByRole('heading', { name: '结果' })).toBeVisible()
        await expect(page.getByText('比分')).toBeVisible()
        await expect(page.getByText('君上心声').first()).toBeVisible()
        await expect(page.getByText(summary.participants!.a.modelID!).first())
          .toBeVisible()
        await expect(page.getByText(summary.participants!.b.modelID!).first())
          .toBeVisible()
        await expect(
          page.getByText(`v#${summary.participants!.a.versionID}`).first(),
        ).toBeVisible()
      },
    )
    await test.step(
      '并且 页面与接口响应中都没有任何一方的提示词或 diff',
      async () => {
        const body = await page.evaluate(() => document.body.innerText)
        expect(body).not.toContain('提示词')
        expect(body).not.toContain('diff')
        const payload = await matchPayload(page, MATCH)
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
