// U08 入口与导航 — u08-entry-nav.feature 的可执行对应（BDD：每个 test.step
// 的文案与 feature 的 Given/When/Then 一一对应；行为叙述以 feature 为准）。
//
// 锚定 v3.4：B1 落地页 · B2 注册/登录 · B8 #73/#74 六项头部（历史居最右，
// 桌面＝移动）· #43 铃铛处处可见 · #72 顶栏降噪（视觉面）· E9（导航层）。
//
// 账号纪律：整个文件只注册一个账号（beforeAll），所有场景复用；若设置了
// AXIIA_U08_EMAIL / AXIIA_U08_PASSWORD 则改为登录复用（5173 复核跑法，
// 不再烧注册码名额），此时「注册落快速通道」场景跳过。对战预算 0。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

import { type Browser, expect, type Page, test } from '@playwright/test'

import { registrationCode } from '../helpers'

const reusedEmail = process.env.AXIIA_U08_EMAIL ?? ''
const reusedPassword = process.env.AXIIA_U08_PASSWORD ?? ''
// 借用他人（协调者出借）账号跑只读检查时置 1：错误密码场景（C07）只允许
// 打在自己的账号上，借用模式下强制 skip。
const borrowedAccount = process.env.AXIIA_U08_BORROWED === '1'
const PASSWORD = reusedPassword !== '' ? reusedPassword : 'playwrightpw-123456'
// 截图与账号状态目录：对照审计跑时用 U08_SHOTS_DIR 指到证据仓库。
const SHOTS = process.env.U08_SHOTS_DIR ?? 'test-results/u08-shots'

// 桌面顶栏文字导航（#73/#74）：恰四项、顺序固定、历史居最右；
// 铃铛与设置在其右侧（B8 的第 5、6 项）。
const NAV_LABELS = ['场景', '我的智能体', '排名', '历史']

let u08Email = ''
// 注册当刻观察到的落点路径（仅注册模式下有值；登录复用模式为 null）。
let signupDestination: string | null = null
// 注册码在后端不可用（uses 耗尽）时置 true：未登录场景照常跑，
// 依赖账号的场景 skip 并在 findings 里记 blocked。
let signupBlocked = false

async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码').fill(password)
  await page.getByRole('button', { name: '登录', exact: true }).click()
}

// 账号状态落盘：C01 是预期红（spec-gap 即交付物），失败会让 worker 重启并
// 重跑 beforeAll——不落盘的话第二个 worker 会再注册一个账号，违反「至多
// 1 个账号」。首个成功注册写入此文件，此后所有 worker/复跑一律改走登录。
const STATE_FILE = `${SHOTS}/u08-account.json`

interface AccountState {
  email: string
  password: string
  signupDestination: string
}

test.beforeAll(async ({ browser }) => {
  mkdirSync(SHOTS, { recursive: true })
  const context = await browser.newContext()
  const page = await context.newPage()
  const saved: AccountState | null = existsSync(STATE_FILE)
    ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) as AccountState
    : null
  if (reusedEmail !== '' || saved) {
    // 复核跑法/后续 worker：复用既有账号，不再注册。
    u08Email = reusedEmail !== '' ? reusedEmail : saved!.email
    signupDestination = saved?.signupDestination ?? null
    await loginAs(
      page,
      u08Email,
      reusedEmail !== '' ? PASSWORD : saved!.password,
    )
    await expect(page).toHaveURL(/\/scenarios$/)
  } else {
    // 背景: 假如 我用注册码注册了唯一的 U08 账号 —— 这也是 U08-C04 的
    // 观察时刻：注册成功即自动登录，记录落点。
    expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
    u08Email = `playwright-u08-${Date.now()}@axiia.test`
    await page.goto('/register')
    await page.getByLabel(/注册码/).fill(registrationCode)
    await page.getByLabel('昵称').fill('测试玩家 u08')
    await page.getByLabel('邮箱').fill(u08Email)
    await page.getByLabel('密码').fill(PASSWORD)
    await page.getByRole('button', { name: '创建账户' }).click()
    await Promise.race([
      page.waitForURL((url) => !/\/register$/.test(url.pathname), {
        timeout: 45_000,
      }),
      page.locator('form p').waitFor({ timeout: 45_000 }),
    ])
    if (/\/register$/.test(new URL(page.url()).pathname)) {
      // 注册码 uses 耗尽（2026-08-16 实测 axiia-0815-270671054 已 403
      // invalid_code）：不视为本文件的断言失败——账号依赖场景改为 skip。
      signupBlocked = true
      console.log('U08 signup blocked: registration code unavailable')
      await page.screenshot({
        path: `${SHOTS}/U08-C04-blocked.png`,
        fullPage: true,
      })
    } else {
      signupDestination = new URL(page.url()).pathname
      writeFileSync(
        STATE_FILE,
        JSON.stringify(
          {
            email: u08Email,
            password: PASSWORD,
            signupDestination,
          } satisfies AccountState,
          null,
          2,
        ),
      )
      await page.screenshot({ path: `${SHOTS}/U08-C04.png`, fullPage: true })
      console.log(`U08 account: ${u08Email} → ${signupDestination}`)
    }
  }
  await context.close()
})

// 依赖已登录账号的场景在注册被挡时统一 skip（blocked，非 diff）。
function skipIfBlocked() {
  test.skip(signupBlocked, '注册码不可用，无法取得账号（blocked）')
}

// 每个场景独立 context（未登录场景必须干净），登录场景走 UI 登录复用唯一账号。
async function loggedInPage(
  browser: Browser,
  viewport?: { width: number; height: number },
): Promise<{ page: Page; close: () => Promise<void> }> {
  const context = await browser.newContext(viewport ? { viewport } : {})
  const page = await context.newPage()
  await loginAs(page, u08Email, PASSWORD)
  await expect(page).toHaveURL(/\/scenarios$/)
  return { page, close: () => context.close() }
}

test('U08-C01 落地页展示真实对局内容与统计（B1）', async ({ page }) => {
  await test.step('假如 我未登录并打开首页 /', async () => {
    await page.goto('/')
    await expect(page.getByText('AXIIA CUP').first()).toBeVisible()
  })
  const body = page.locator('body')
  await test.step('那么 页面含真实对局节选开场', async () => {
    await expect(body).toContainText(/对局节选|节选/)
  })
  await test.step('并且 页面含 1–2 场白名单示范对局（裁判 OS 公开可见）', async () => {
    await expect(body).toContainText(/示范对局|示范/)
  })
  await test.step('并且 页面含顶尖玩家展示', async () => {
    await expect(body).toContainText(/顶尖玩家|顶尖/)
  })
  await test.step('并且 页面含总对战数', async () => {
    await expect(body).toContainText(/总对战|对战数|总场次/)
  })
})

test('U08-C02 落地页主行动是注册/登录入口（B1）', async ({ page }) => {
  await test.step('假如 我未登录并打开首页 /', async () => {
    await page.goto('/')
  })
  await test.step('那么 页面有显著的「立即注册」主行动与登录入口', async () => {
    await expect(page.getByRole('link', { name: '立即注册' })).toBeVisible()
    await expect(page.getByRole('link', { name: '登录' }).first()).toBeVisible()
  })
})

test('U08-C03 注册字段集＝邮箱＋注册码＋昵称＋密码（B2）', async ({ page }) => {
  await test.step('假如 我未登录并打开 /register', async () => {
    await page.goto('/register')
  })
  await test.step('那么 表单恰含 注册码、昵称、邮箱、密码 四个输入框', async () => {
    await expect(page.getByLabel(/注册码/)).toBeVisible()
    await expect(page.getByLabel('昵称')).toBeVisible()
    await expect(page.getByLabel('邮箱')).toBeVisible()
    await expect(page.getByLabel('密码')).toBeVisible()
    await expect(page.locator('form input')).toHaveCount(4)
  })
  await test.step('并且 没有手机号字段（手机号近上线再加）', async () => {
    await expect(page.locator('input[type="tel"], input[name="phone"]'))
      .toHaveCount(0)
  })
})

test('U08-C04 注册后自动登录并落进快速通道（B2/A3）', async () => {
  skipIfBlocked()
  test.skip(
    signupDestination === null,
    '登录复用模式且无落盘记录：唯一一次注册发生在注册模式跑；落点见其记录',
  )
  await test.step('当 我用有效注册码提交注册（背景中的唯一一次注册）', () => {
    expect(u08Email).not.toBe('')
  })
  await test.step('那么 我自动登录，且新账号落进 /express 快速通道（未打首战）', () => {
    expect(signupDestination).toBe('/express')
  })
})

test('U08-C05 无效注册码被拒绝（B2）', async ({ page }) => {
  await test.step('假如 我未登录并打开 /register', async () => {
    await page.goto('/register')
  })
  await test.step('当 我用明显无效的注册码提交注册', async () => {
    await page.getByLabel(/注册码/).fill('definitely-invalid-code-u08')
    await page.getByLabel('昵称').fill('测试玩家 u08-invalid')
    await page.getByLabel('邮箱').fill(`u08-invalid-${Date.now()}@axiia.test`)
    await page.getByLabel('密码').fill('throwaway-pw-123456')
    await page.getByRole('button', { name: '创建账户' }).click()
  })
  await test.step('那么 注册被拒绝并显示错误提示，仍停留在 /register', async () => {
    // 错误提示渲染为表单内的 <p>（与登录页同构）；文案本身不在规格内。
    await expect(page.locator('form p')).toBeVisible()
    await expect(page).toHaveURL(/\/register$/)
  })
})

test('U08-C06 邮箱＋密码登录（B2）', async ({ page }) => {
  skipIfBlocked()
  await test.step('假如 我在新的未登录会话打开 /login', async () => {
    await page.goto('/login')
  })
  await test.step('当 我用 U08 账号的邮箱和正确密码登录', async () => {
    await loginAs(page, u08Email, PASSWORD)
  })
  await test.step('那么 我进入登录态（落在 /scenarios）', async () => {
    await expect(page).toHaveURL(/\/scenarios$/)
  })
})

test('U08-C07 错误密码被拒绝（B2）', async ({ page }) => {
  skipIfBlocked()
  test.skip(borrowedAccount, '借用账号只读模式：错误密码只打自己的账号')
  await test.step('假如 我在新的未登录会话打开 /login', async () => {
    await page.goto('/login')
  })
  await test.step('当 我用 U08 账号的邮箱和错误密码登录', async () => {
    await loginAs(page, u08Email, 'wrong-password-123456')
  })
  await test.step('那么 显示错误提示且仍停留在 /login（不进入登录态）', async () => {
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('form p')).toBeVisible()
  })
})

test('U08-C08 桌面顶栏恰为六项，历史居最右（B8 #73/#74）', async ({ browser }) => {
  skipIfBlocked()
  const { page, close } = await loggedInPage(browser)
  try {
    await test.step('假如 我已登录并打开 /scenarios（桌面视口）', async () => {
      await expect(page).toHaveURL(/\/scenarios$/)
    })
    await test.step('那么 顶栏文字导航恰为 场景、我的智能体、排名、历史 四项且顺序如此', async () => {
      await expect(page.locator('header nav a')).toHaveText(NAV_LABELS)
    })
    await test.step('并且 历史在文字导航中居最右', async () => {
      await expect(page.locator('header nav a').last()).toHaveText('历史')
    })
    await test.step('并且 顶栏另有通知铃铛与设置入口', async () => {
      await expect(page.getByRole('link', { name: '通知' })).toBeVisible()
      await expect(page.locator('header a[href="/settings"]')).toBeVisible()
    })
    await test.step('并且 顶栏没有第七个导航项', async () => {
      // 六项＝4 文字 tab + 铃铛 + 设置；再多（管理面板除外——非管理员账号
      // 不该出现）即偏离 #73/#74 清单。
      await expect(page.locator('header nav a')).toHaveCount(4)
    })
  } finally {
    await close()
  }
})

test('U08-C09 移动底栏与桌面顶栏一致（B8 #74）', async ({ browser }) => {
  skipIfBlocked()
  const { page, close } = await loggedInPage(browser, {
    width: 390,
    height: 844,
  })
  try {
    await test.step('假如 我已登录并在移动视口（390×844）打开 /scenarios', async () => {
      await expect(page).toHaveURL(/\/scenarios$/)
    })
    const bottomNav = page.locator('nav').last()
    await test.step('那么 底栏导航项与桌面顶栏文字导航一致：场景、我的智能体、排名、历史', async () => {
      await expect(bottomNav).toBeVisible()
      await expect(bottomNav.locator('a')).toHaveText(NAV_LABELS)
    })
    await test.step('并且 历史在底栏居最右', async () => {
      await expect(bottomNav.locator('a').last()).toHaveText('历史')
    })
    await test.step('并且 通知铃铛在移动端仍可见', async () => {
      await expect(page.getByRole('link', { name: '通知' })).toBeVisible()
    })
    await page.screenshot({ path: `${SHOTS}/U08-C09-bdd.png` })
  } finally {
    await close()
  }
})

test('U08-C10 通知铃处处可见（#43）', async ({ browser }) => {
  skipIfBlocked()
  const { page, close } = await loggedInPage(browser)
  try {
    await test.step('假如 我已登录', async () => {
      await expect(page).toHaveURL(/\/scenarios$/)
    })
    const routes = [
      '/scenarios',
      '/my-agents',
      '/tournaments',
      '/matches',
      '/settings',
    ]
    await test.step('当 我依次访问 场景、我的智能体、排名、历史、设置 五个页面；那么 每个页面的头部都能看到通知铃铛', async () => {
      for (const route of routes) {
        await page.goto(route)
        await expect(
          page.getByRole('link', { name: '通知' }),
          `bell visible on ${route}`,
        ).toBeVisible()
      }
    })
  } finally {
    await close()
  }
})

test('U08-C11 顶栏视觉降噪（#72 视觉面）', async ({ browser }) => {
  skipIfBlocked()
  const { page, close } = await loggedInPage(browser)
  try {
    await test.step('假如 我已登录并打开 /scenarios（桌面视口）', async () => {
      await expect(page).toHaveURL(/\/scenarios$/)
    })
    await test.step('那么 顶栏内不存在「进行中的对战」条或对局卡', async () => {
      // 对战条（aria-label=进行中的对战）若存在也只应在 main 里，不在 header。
      await expect(page.locator('header [aria-label="进行中的对战"]'))
        .toHaveCount(0)
      await expect(page.locator('header')).not.toContainText(/进行中的对战/)
    })
  } finally {
    await close()
  }
})

test('U08-C12 导航无「说明书」类条目（E9 交叉检查）', async ({ browser }) => {
  skipIfBlocked()
  const { page, close } = await loggedInPage(browser)
  try {
    await test.step('假如 我已登录并打开 /scenarios', async () => {
      await expect(page).toHaveURL(/\/scenarios$/)
    })
    await test.step('那么 头部与底部导航不含「说明书 / 帮助 / 文档 / 指南 / docs / help」条目', async () => {
      for (const region of ['header', 'footer', 'nav']) {
        await expect(page.locator(region).first())
          .not.toContainText(/说明书|帮助|文档|指南|docs|help/i)
      }
    })
  } finally {
    await close()
  }
})
