// U12 — 设置（B6 #85/#86）· 对战历史（B7）· 边界负检（C2/C3）
// u12-settings-history.feature 的可执行对应（BDD：每个 test.step 的文案与
// feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 硬约束：全套只注册一个账号（beforeAll 一次 signup，之后共用同一会话）；
// 改密场景放在最后（它使其他会话失效）；全程不派发任何对局（预算 0）。
// 复核 5173 时可用 U12_LOGIN_EMAIL/U12_LOGIN_PASSWORD 登录既有账号，
// 避免造出第二个账号。
import { writeFileSync } from 'node:fs'

import { type BrowserContext, expect, type Page, test } from '@playwright/test'

import { registrationCode, signup } from '../helpers'

const ORIGINAL_PASSWORD = 'playwrightpw-123456'
const ROTATED_PASSWORD = 'playwrightpw-7654321'

let context: BrowserContext
let page: Page
let email = ''

async function login(target: Page, password: string) {
  await target.goto('/login')
  await target.getByLabel('邮箱').fill(email)
  await target.getByLabel('密码').fill(password)
  await target.getByRole('button', { name: '登录' }).click()
  await expect(target).not.toHaveURL(/\/login$/)
}

function recordAccount(password: string) {
  if (process.env.U12_ACCOUNT_FILE) {
    writeFileSync(
      process.env.U12_ACCOUNT_FILE,
      JSON.stringify({ email, password }),
    )
  }
}

// 顺序由文件内顺序 + workers=1 保证（改密永远最后）；不用 .serial——
// 它会在首个 red 后放弃余下用例，而 red 本身是本审计的产物，不该截断。
test.describe('U12 设置 · 历史 · 边界', () => {
  test.beforeAll(async ({ browser }) => {
    expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
    context = await browser.newContext()
    page = await context.newPage()
    if (process.env.U12_LOGIN_EMAIL) {
      email = process.env.U12_LOGIN_EMAIL
      await login(page, process.env.U12_LOGIN_PASSWORD ?? ORIGINAL_PASSWORD)
    } else {
      email = await signup(page, 'u12')
    }
    recordAccount(ORIGINAL_PASSWORD)
  })

  test.afterAll(async () => {
    await context?.close()
  })

  test('U12-C01/C04/C05/C06：设置页个人资料区的结构', async () => {
    await test.step('当 我打开 /settings', async () => {
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: '账户' })).toBeVisible()
    })
    await test.step('那么 「个人资料」区可见，昵称行显示当前昵称并带「编辑」按钮', async () => {
      await expect(page.getByRole('heading', { name: '个人资料' }))
        .toBeVisible()
      await expect(page.getByText('昵称', { exact: true })).toBeVisible()
      await expect(page.getByText('测试玩家 u12', { exact: true }).first())
        .toBeVisible()
      await expect(page.getByRole('button', { name: '编辑' })).toBeVisible()
    })
    await test.step('并且 「邮箱」行以纯文本显示注册邮箱，无输入框（U12-C04）', async () => {
      await expect(page.getByText('邮箱', { exact: true })).toBeVisible()
      await expect(page.getByText(email, { exact: true })).toBeVisible()
      // 只读：个人资料卡里除昵称编辑态外没有邮箱输入框
      await expect(page.locator('input[name="email"], input[type="email"]'))
        .toHaveCount(0)
    })
    await test.step('并且 「角色」行显示「选手」徽章，无输入框（U12-C05）', async () => {
      await expect(page.getByText('角色', { exact: true })).toBeVisible()
      await expect(page.getByText('选手', { exact: true })).toBeVisible()
    })
    await test.step('并且 页面上没有「管理员提权」卡（非管理员账号，U12-C06）', async () => {
      await expect(page.getByText('管理员提权')).toHaveCount(0)
    })
  })

  test('U12-C02：昵称长度边界为 1 到 50 字', async () => {
    await page.goto('/settings')
    await test.step('当 我点昵称行的「编辑」并清空输入框；那么 「保存」按钮被禁用（下限 1 字）', async () => {
      await page.getByRole('button', { name: '编辑' }).click()
      const input = page.getByLabel('昵称')
      await input.fill('')
      await expect(page.getByRole('button', { name: '保存', exact: true }))
        .toBeDisabled()
    })
    await test.step('当 我输入 60 个字符；那么 输入框只留下 50 个字符（上限 50，maxLength 截断）', async () => {
      const input = page.getByLabel('昵称')
      await input.fill('')
      await input.pressSequentially('甲'.repeat(60))
      await expect(input).toHaveValue('甲'.repeat(50))
      await page.getByRole('button', { name: '取消' }).click()
    })
  })

  test('U12-C03：改昵称后全站展示即时同步', async () => {
    const renamed = '测试玩家 u12改'
    const header = page.locator('header')
    await page.goto('/settings')
    await test.step('假如 我把昵称改成「测试玩家 u12改」并保存；那么 设置页昵称行与顶栏导航都立即显示新昵称', async () => {
      await page.getByRole('button', { name: '编辑' }).click()
      await page.getByLabel('昵称').fill(renamed)
      await page.getByRole('button', { name: '保存', exact: true }).click()
      await expect(page.getByText(renamed).first()).toBeVisible()
      await expect(header.getByText(renamed)).toBeVisible()
    })
    await test.step('当 我另开「我的智能体」页；那么 顶栏导航仍显示新昵称（全站同步）', async () => {
      await page.goto('/my-agents')
      await expect(header.getByText(renamed)).toBeVisible()
    })
    await test.step('当 我把昵称改回「测试玩家 u12」；那么 顶栏导航恢复显示', async () => {
      await page.goto('/settings')
      await page.getByRole('button', { name: '编辑' }).click()
      await page.getByLabel('昵称').fill('测试玩家 u12')
      await page.getByRole('button', { name: '保存', exact: true }).click()
      await expect(header.getByText('测试玩家 u12')).toBeVisible()
    })
  })

  test('U12-C07：设置页有邀请码状态区块', async () => {
    await test.step('当 我打开 /settings；那么 页面存在「邀请码」状态区块', async () => {
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: '账户' })).toBeVisible()
      await expect(page.getByText(/邀请码/)).toBeVisible()
    })
  })

  test('U12-C08：设置页有通知偏好区块', async () => {
    await test.step('当 我打开 /settings；那么 页面存在「通知偏好」区块', async () => {
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: '账户' })).toBeVisible()
      await expect(page.getByText(/通知偏好/)).toBeVisible()
    })
  })

  test('U12-C09/C10：历史页的行结构与「行点开→战报」', async () => {
    await test.step('当 我打开 /matches；那么 页面标题为「历史」', async () => {
      await page.goto('/matches')
      await expect(page.getByRole('heading', { name: '历史' })).toBeVisible()
      // 行或空态其一渲染完成后再数行数
      await expect(page.getByText(/对战 #\d+|还没有.*对战/).first())
        .toBeVisible()
    })
    const rows = page.getByText(/^对战 #\d+$/)
    if (await rows.count() === 0) {
      await test.step('并且 若历史为空（新账号、非公开模式）→ 显示空态文案与引导语', async () => {
        await expect(page.getByText(/还没有.*对战/)).toBeVisible()
        // U12-C10（行点开→战报）在空历史下无从验证：blocked，兄弟单元覆盖。
      })
      return
    }
    await test.step('并且 若有对局行（dev 后端历史为公开模式）→ 每行有「对战 #id」、场景标题、对局类型与状态徽章', async () => {
      const first = page.locator('a[href^="/matches/"]').first()
      await expect(first.getByText(/对战 #\d+/)).toBeVisible()
      await expect(first.getByText(/PVE|PVP|·/)).toBeVisible()
      await expect(
        first.getByText(/排队中|进行中|判定中|胜方 [AB]|平局/),
      ).toBeVisible()
    })
    await test.step('当 我点开第一行；那么 落到该对局的战报页 /matches/:id', async () => {
      await page.locator('a[href^="/matches/"]').first().click()
      await expect(page).toHaveURL(/\/matches\/\d+$/)
    })
  })

  test('U12-C11：C2 配置旋钮无任何玩家侧 UI', async () => {
    const knobs =
      /每日对战次数|统计展示门槛|解锁门槛|并发上限|可见性矩阵|新手预设/
    for (const path of ['/settings', '/scenarios', '/notifications']) {
      await test.step(`当 我打开 ${path}；那么 不出现 C2 旋钮的配置控件或字样`, async () => {
        await page.goto(path)
        await expect(page.getByRole('heading').first()).toBeVisible()
        await expect(page.getByText(knobs)).toHaveCount(0)
      })
    }
  })

  test('U12-C12：C3 future 功能缺席', async () => {
    await test.step('那么 场景目录没有「最热门」动态精选', async () => {
      await page.goto('/scenarios')
      await expect(page.getByRole('heading').first()).toBeVisible()
      await expect(page.getByText('最热门')).toHaveCount(0)
    })
    await test.step('并且 没有卡牌（deck）构建模式入口、没有 Focus mode 最大化控件', async () => {
      await expect(page.getByText(/卡牌|deck/i)).toHaveCount(0)
      await expect(page.getByText(/focus mode|专注模式/i)).toHaveCount(0)
    })
    await test.step('并且 没有站外通知渠道（email/飞书）设置项，也没有姓名隐私开关', async () => {
      await page.goto('/notifications')
      await expect(page.getByRole('heading').first()).toBeVisible()
      await expect(page.getByText(/邮件通知|email 通知|飞书/i)).toHaveCount(0)
      await page.goto('/settings')
      await expect(page.getByRole('heading', { name: '账户' })).toBeVisible()
      await expect(page.getByText(/姓名隐私|隐私开关/)).toHaveCount(0)
    })
  })

  test('U12-C13：改密表单——客户端先挡必错提交', async () => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: '修改密码' })).toBeVisible()
    await test.step('当 我在「修改密码」表单填入 7 位新密码并提交；那么 得到「新密码至少 8 位」', async () => {
      await page.getByLabel('当前密码').fill(ORIGINAL_PASSWORD)
      await page.getByLabel('新密码', { exact: true }).fill('short-7')
      await page.getByLabel('确认新密码').fill('short-7')
      await page.getByRole('button', { name: '修改密码' }).click()
      await expect(page.getByText('新密码至少 8 位')).toBeVisible()
    })
    await test.step('当 我把两次新密码填得不一致并提交；那么 得到「两次输入的新密码不一致」', async () => {
      await page.getByLabel('新密码', { exact: true }).fill('mismatch-123456')
      await page.getByLabel('确认新密码').fill('mismatch-654321')
      await page.getByRole('button', { name: '修改密码' }).click()
      await expect(page.getByText('两次输入的新密码不一致')).toBeVisible()
    })
  })

  test('U12-C14：当前密码错误被服务端拒绝', async () => {
    await page.goto('/settings')
    await test.step('当 我用错误的当前密码提交一个合法新密码；那么 服务端拒绝，密码保持原样', async () => {
      await page.getByLabel('当前密码').fill('wrong-password-000')
      await page.getByLabel('新密码', { exact: true }).fill(ROTATED_PASSWORD)
      await page.getByLabel('确认新密码').fill(ROTATED_PASSWORD)
      await page.getByRole('button', { name: '修改密码' }).click()
      // 服务端拒绝文案（当前密码错误类）；成功文案绝不能出现
      await expect(page.getByText(/当前密码不正确|修改失败|尝试太频繁/))
        .toBeVisible()
      await expect(page.getByText('密码已修改，其他设备已退出登录'))
        .toHaveCount(0)
    })
  })

  test('U12-C15：改密成功后其他会话失效、当前会话保留（最后跑）', async ({ browser }) => {
    const otherContext = await browser.newContext()
    const otherPage = await otherContext.newPage()
    try {
      await test.step('假如 第二个浏览器上下文在改密之前已登录同一账号', async () => {
        await login(otherPage, ORIGINAL_PASSWORD)
        await otherPage.goto('/settings')
        await expect(otherPage.getByRole('heading', { name: '账户' }))
          .toBeVisible()
      })
      await test.step('当 我用正确的当前密码把密码改为新密码并提交；那么 出现成功文案', async () => {
        await page.goto('/settings')
        await page.getByLabel('当前密码').fill(ORIGINAL_PASSWORD)
        await page.getByLabel('新密码', { exact: true }).fill(ROTATED_PASSWORD)
        await page.getByLabel('确认新密码').fill(ROTATED_PASSWORD)
        await page.getByRole('button', { name: '修改密码' }).click()
        await expect(page.getByText('密码已修改，其他设备已退出登录'))
          .toBeVisible()
        recordAccount(ROTATED_PASSWORD)
      })
      await test.step('并且 第二个上下文刷新后会话失效（被打回登录页）', async () => {
        await otherPage.goto('/settings')
        await expect(otherPage).toHaveURL(/\/(login)?$/)
      })
      await test.step('并且 当前上下文的会话仍然有效（还能打开 /settings）', async () => {
        await page.goto('/matches')
        await expect(page.getByRole('heading', { name: '历史' })).toBeVisible()
        await page.goto('/settings')
        await expect(page.getByRole('heading', { name: '账户' })).toBeVisible()
      })
      await test.step('当 我在当前会话把密码改回「playwrightpw-123456」；那么 账号以已知密码保持可用', async () => {
        await page.getByLabel('当前密码').fill(ROTATED_PASSWORD)
        await page.getByLabel('新密码', { exact: true }).fill(ORIGINAL_PASSWORD)
        await page.getByLabel('确认新密码').fill(ORIGINAL_PASSWORD)
        await page.getByRole('button', { name: '修改密码' }).click()
        await expect(page.getByText('密码已修改，其他设备已退出登录'))
          .toBeVisible()
        recordAccount(ORIGINAL_PASSWORD)
      })
    } finally {
      await otherContext.close()
    }
  })
})
