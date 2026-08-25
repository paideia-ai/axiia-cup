// U03 · 首战快速通道（express）— u03-express.feature 的可执行对应。
// BDD：每个 test.step 的文案与 feature 的 Given/When/Then 一一对应；
// 行为叙述以 feature 为准。
//
// 锚定 v3.4：A3 全节 · #8–#12 · #45/#52（只验文案）· #67 · #90（废止文案检查）。
//
// 2026-08-25 移植注（PR #120 → main，含 #137/#138 后的行为）：
//   - #90 残留文案已被 #137 清除——原 expect.soft「已知 diff」记录断言
//     转为硬断言（应绿）；
//   - F7（#69/#71，PR #137）：完局战报胜负行带视角（我方（角色）胜…），
//     原裸「胜方 X」断言随之更新；
//   - 触顶文案场景兼容本地 e2e 栈（run-playwright.sh 用 vite dev 起前端，
//     无构建产物时改取 reject-copy 源模块）。
//
// 预算护栏（feature 头部详述）：本 spec **不派发任何对战**——
//   - 前半漏斗用一个全新账号走到「保存并开始首战」按钮前停手；
//   - 完局后状态复用人工旅程已打完首战的账号：
//       AXIIA_U03_EMAIL    人工旅程账号邮箱（密码固定 playwrightpw-123456）
//       AXIIA_U03_MATCH_ID 人工旅程首战对局 id
//     两者缺席时对应场景跳过。
//   - 完局旅程卡（#67/#12 战报底部）依赖 express 派发的一次性导航 state，
//     事后重开对局页不可再现——由人工旅程覆盖，见 feature @人工旅程覆盖。
import { expect, type Page, test } from '@playwright/test'

import { registrationCode, signup } from '../helpers'

const journeyEmail = process.env.AXIIA_U03_EMAIL ?? ''
const journeyMatchID = process.env.AXIIA_U03_MATCH_ID ?? ''

test.beforeEach(() => {
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
})

// 三个 test 相互独立（后两个不依赖第一个的状态），跑法固定 --workers=1
// 即按文件顺序执行；不用 serial 模式——任一 test 失败不该连坐取消后面的
// 场景（serial 会把 fail 后的兄弟全标 skipped）。

// 简化版 DA 的可见要件（U03-C02，#11）。
async function expectSimplifiedDA(page: Page) {
  await expect(page.getByText('首战快速通道').first()).toBeVisible()
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByText('你的角色')).toBeVisible()
  // 2026-08-25 集成注：#142 起「一句规则」渲染 education.formatLabel（商鞅＝
  // 「5 轮朝堂辩论」），不再是移植时的静态「N 轮对话」——断言随产品文案对齐。
  await expect(page.getByText(/轮朝堂辩论后由裁判当场判定胜负/)).toBeVisible()
  await expect(page.getByTestId('express-build')).toHaveText('去构建 →')
  await expect(page.getByText('先逛逛全部场景')).toBeVisible()
}

test('U03：新号一路走到「保存并开始首战」按钮前（不消耗对战）', async ({ page }) => {
  test.setTimeout(240_000)

  await test.step('假如 我用注册码在 /register 注册一个全新账号；那么 注册成功自动登录，落地 URL 是 /express', async () => {
    await signup(page, 'u03-b')
    // U03-C01：signup helper 容忍 /scenarios（老前端）——这里按 A3 收紧。
    await expect(page).toHaveURL(/\/express$/)
  })

  await test.step('那么 /express 是简化版 DA：徽章＋我方角色卡＋一句规则＋「去构建 →」＋逃生链接（U03-C02，#11）', async () => {
    await expectSimplifiedDA(page)
  })

  let agentID = 0
  await test.step('当 我点「去构建 →」；那么 直接进入 /agents/:id/build 且带 express=1，页头写明保存即自动开战，且不摆版本线（U03-C03，#57）', async () => {
    await page.getByTestId('express-build').click()
    await expect(page).toHaveURL(/\/agents\/\d+\/build\?.*express=1/)
    agentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())![1])
    expect(agentID).toBeGreaterThan(0)
    await expect(
      page.getByText('首战快速通道 · 保存即自动开战并直达实况'),
    ).toBeVisible()
    await expect(page.getByTestId('version-card')).toHaveCount(0)
  })

  await test.step('那么 出现「初始化方式 · 三选一生成首稿」卡，三个 tab，默认选中「MCQ 拼装」（U03-C04，#12）', async () => {
    await expect(page.getByText('初始化方式 · 三选一生成首稿')).toBeVisible()
    await expect(page.getByRole('tab')).toHaveText([
      'MCQ 拼装',
      'Basic 直写',
      '元提示词',
    ])
    await expect(
      page.locator('[role="tab"][aria-selected="true"]'),
    ).toHaveText('MCQ 拼装')
  })

  await test.step('当 我切到「元提示词」再切回「MCQ 拼装」；那么 两个 tab 都能正常展示各自内容（U03-C04，#12/#83 可切正常模式）', async () => {
    await page.getByRole('tab', { name: '元提示词' }).click()
    await expect(page.getByText('复制这段元提示词发给你常用的 AI'))
      .toBeVisible()
    await page.getByRole('tab', { name: 'MCQ 拼装' }).click()
    await expect(page.getByRole('button', { name: '填入工作区' }).first())
      .toBeVisible()
  })

  await test.step('那么 初始化卡提示句不出现已废止的「复制为新智能体」（#90，#137 已清除残留）', async () => {
    // #90（08-15）废止该动作；#137（08-24）清除了提示句残留——现行文案是
    // 「想重新选卡：清空工作区」。文案要么在要么不在，短超时即可。
    await expect(page.getByText('复制为新智能体')).toHaveCount(0, {
      timeout: 5_000,
    })
  })

  await test.step('当 我把 MCQ 每题都选一个选项；那么 「拼装预览」逐节拼出提示词文本', async () => {
    const groups = page.locator(
      'div.flex.flex-wrap.gap-2:has(button[aria-pressed])',
    )
    const count = await groups.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      await groups.nth(i).locator('button[aria-pressed]').first().click()
    }
    await expect(page.locator('pre').first()).toBeVisible()
    expect((await page.locator('pre').first().textContent())!.length)
      .toBeGreaterThan(20)
  })

  await test.step('当 我点「填入工作区」；那么 工作区载入拼装文本、初始化卡收起，保存按钮文案是「保存并开始首战」（U03-C05 按钮承诺，#9/#17 例外）', async () => {
    await page.getByRole('button', { name: '填入工作区' }).first().click()
    await expect(page.getByLabel('策略提示词')).not.toHaveValue('')
    await expect(page.getByText('初始化方式 · 三选一生成首稿')).toHaveCount(0)
    await expect(page.getByTestId('save-version')).toHaveText('保存并开始首战')
    // 到此为止不点保存——真实派发由人工旅程消耗（预算 1 场）。
  })
})

test('U03：打过首战的账号——/express 让路，首战战报可开（复用人工旅程账号）', async ({ page }) => {
  test.skip(
    journeyEmail === '' || journeyMatchID === '',
    'AXIIA_U03_EMAIL / AXIIA_U03_MATCH_ID 未提供——完局后状态复用人工旅程账号',
  )
  test.setTimeout(120_000)

  await test.step('假如 我登录人工旅程已打完首战的账号（AXIIA_U03_EMAIL）', async () => {
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(journeyEmail)
    await page.getByLabel('密码').fill('playwrightpw-123456')
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/scenarios$/, { timeout: 45_000 })
  })

  await test.step('当 我直接访问 /express；那么 被重定向到 /scenarios（U03-C09，A3 只针对第一场）', async () => {
    await page.goto('/express')
    await expect(page).toHaveURL(/\/scenarios$/)
  })

  await test.step('当 我打开其首战对局页；那么 对局已完局，结果卡展示带视角的胜负行（F7；战报可开即通过，内容细节归 U07）', async () => {
    await page.goto(`/matches/${journeyMatchID}`)
    // F7（#69/#71，PR #137）：参战视角的完局行是 我方（角色）胜 /
    // 对方（角色）胜 / 平局——不再是移植前的裸「胜方 X」（那是旁观/open
    // 历史的回退形态；人工旅程账号必是参战方）。
    await expect(
      page.getByText(/我方（.+）胜|对方（.+）胜|平局/).first(),
    ).toBeVisible({ timeout: 45_000 })
  })
})

test('U03：每日上限触顶文案存在于前端交付物（#45/#52——绝不触顶实测）', async ({ request }) => {
  await test.step('假如 我获取部署站点的前端产物（vite dev 无 bundle 时改取 reject-copy 源模块）；那么 产物包含「今日次数已用完（」与「明天再来」', async () => {
    const html = await (await request.get('/')).text()
    const assets = [...html.matchAll(/assets\/[\w.-]+\.js/g)].map((m) => m[0])
    let bundle = ''
    for (const asset of assets) {
      bundle += await (await request.get(`/${asset}`)).text()
    }
    if (assets.length === 0) {
      // 本地 e2e 栈（run-playwright.sh）用 vite dev 起前端，index.html 不
      // 引用构建产物——此时取触顶文案的唯一事实源模块（vite 转换后模板
      // 字面量的中文段原样保留）。部署产物路径保持原断言。
      const module = await request.get('/src/lib/reject-copy.ts')
      expect(module.ok()).toBe(true)
      bundle = await module.text()
    }
    expect(bundle).toContain('今日次数已用完（')
    expect(bundle).toContain('明天再来')
  })
})
