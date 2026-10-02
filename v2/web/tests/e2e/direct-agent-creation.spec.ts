import { expect, type Page, test } from '@playwright/test'
import {
  agentPreviewInventory,
  agentPreviewScenarios,
} from '../../src/testing/scenario-agent-fixtures'
import { config } from '../../src/testing/v34-fixtures'

async function setup(
  page: Page,
  empty = false,
  prepare?: (inventory: typeof agentPreviewInventory) => void,
) {
  const inventory = structuredClone(agentPreviewInventory)
  if (empty) inventory.scenarios[0].sides.a = []
  prepare?.(inventory)
  const created: {
    scenarioID: string
    side: 'a' | 'b'
    name?: string
    roleKey?: string
  }[] = []
  const errors: string[] = []
  const usedPresets = new Set<string>()
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('**/v1/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.slice(3)
    const json = (body: unknown) => route.fulfill({ json: body })
    if (path === '/account/preset-usage') {
      if (request.method() === 'POST') {
        usedPresets.add(
          (request.postDataJSON() as { scenarioID: string }).scenarioID,
        )
      }
      return json({ scenarioIDs: [...usedPresets] })
    }
    if (path === '/auth/me') {
      return json({
        account: {
          id: 'creation-test',
          displayName: '测试',
          email: 'test@example.test',
          isAdmin: false,
        },
        firstBattleDone: true,
      })
    }
    if (path === '/config') return json(config)
    if (path === '/my/agents') return json(inventory)
    if (path === '/scenarios') {
      return json({ scenarios: agentPreviewScenarios.map((s) => s.summary) })
    }
    const scenario = agentPreviewScenarios.find((s) =>
      path === `/scenarios/${s.summary.id}`
    )
    if (scenario) return json(scenario)
    if (path === '/agents' && request.method() === 'POST') {
      const input = request.postDataJSON()
      created.push(input)
      const agentID = 2000 + created.length
      inventory.scenarios.find((s) => s.scenarioID === input.scenarioID)!
        .sides[input.side as 'a' | 'b'].push({
          agentID,
          name: null,
          versionCount: 0,
          role: input.scenarioID === 'honnoji-decision' && input.roleKey
            ? {
              key: input.roleKey,
              name: ({
                yoshiaki: '足利义昭的使者',
                chosokabe: '长宗我部元亲的密使',
                hosokawa: '细川藤孝',
                ashigaru: '明智军中的足轻',
              } as Record<string, string>)[input.roleKey],
              side: input.side,
            }
            : null,
        })
      return json({ agentID })
    }
    const match = /^\/agents\/(\d+)(?:\/(draft|versions))?$/.exec(path)
    if (match) {
      for (const scenario of inventory.scenarios) {
        for (const side of ['a', 'b'] as const) {
          const agent = scenario.sides[side].find((a) =>
            a.agentID === Number(match[1])
          )
          if (!agent) continue
          if (request.method() === 'PATCH') {
            agent.name = request.postDataJSON().name
            return json({ ok: true })
          }
          if (match[2] === 'draft') {
            return json({
              fields: {},
              scenarioID: scenario.scenarioID,
              side,
              role: agent.role,
            })
          }
          if (match[2] === 'versions') {
            return json({ versions: [], entryVersionID: null })
          }
        }
      }
    }
    if (path === '/notifications/bell') {
      return route.fulfill({
        contentType: 'text/event-stream',
        body: 'retry: 60000\ndata: {"unreadCount":0}\n\n',
      })
    }
    if (path === '/notifications') return json({ notifications: [] })
    if (path === '/rewards') {
      return json({ balance: 1000, claimableRewards: [] })
    }
    return json({})
  })
  return { created, errors }
}

for (const width of [1440, 390]) {
  test.describe(`${width}px direct creation`, () => {
    test.use({ viewport: { width, height: 900 } })
    for (
      const entry of [
        'scenario',
        'empty-scenario',
        'inventory',
        'home',
      ] as const
    ) {
      test(`${entry}: directly opens empty focused rename; default ID survives refresh`, async ({ page }) => {
        const { created, errors } = await setup(
          page,
          entry === 'empty-scenario',
        )
        await page.goto(
          entry.includes('scenario')
            ? '/scenarios/fengyiting-real'
            : entry === 'inventory'
            ? '/my-agents'
            : '/agents/1000',
        )
        const urls: string[] = []
        page.on('framenavigated', (frame) => {
          if (frame === page.mainFrame()) {
            urls.push(new URL(frame.url()).pathname)
          }
        })
        const button = entry === 'scenario'
          ? page.getByRole('button', { name: '再建一个董卓' })
          : entry === 'empty-scenario'
          ? page.getByTestId('build-agent')
          : page.getByRole('button', { name: '新建董卓智能体' })
        await button.click()
        await expect(page).toHaveURL(/\/agents\/2001$/)
        const input = page.getByRole('textbox', { name: '智能体名称' })
        await expect(input).toBeFocused()
        await expect(input).toHaveValue('')
        await expect(page.getByRole('dialog')).toHaveCount(0)
        expect(urls.every((url) => url === '/agents/2001')).toBe(true)
        expect(created).toEqual([{ scenarioID: 'fengyiting-real', side: 'a' }])
        await input.press('Escape')
        await expect(page.getByRole('heading', { name: '董卓 #2001' }))
          .toBeVisible()
        await page.reload()
        await expect(page.getByRole('textbox', { name: '智能体名称' }))
          .toHaveCount(0)
        await expect(page.getByRole('heading', { name: '董卓 #2001' }))
          .toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(width)
        expect(errors).toEqual([])
      })
    }
    test('empty name dismisses on outside click; text and the clicked action are preserved', async ({ page }) => {
      await setup(page)
      await page.goto('/my-agents')
      await page.getByRole('button', { name: '新建董卓智能体' }).click()
      const input = page.getByRole('textbox', { name: '智能体名称' })
      await expect(input).toBeFocused()
      await input.click()
      await expect(input).toBeVisible()
      await input.dispatchEvent('compositionstart')
      await page.getByText('智能体主页', { exact: true }).click()
      await expect(input).toBeVisible()
      await input.dispatchEvent('compositionend')
      await page.getByText('智能体主页', { exact: true }).click()
      await expect(input).toHaveCount(0)
      await expect(page.getByRole('heading', { name: '董卓 #2001' }))
        .toBeVisible()

      await page.getByRole('button', { name: '智能体更多操作' }).click()
      await page.getByRole('menuitem', { name: '重命名' }).click()
      await input.fill('我的策略')
      await page.getByText('智能体主页', { exact: true }).click()
      await expect(input).toHaveValue('我的策略')
      await input.fill('   ')
      await page.getByRole('link', { name: '我的智能体', exact: true }).click()
      await expect(page).toHaveURL(/\/my-agents$/)
      await expect(page.getByRole('heading', { name: '我的智能体' }))
        .toBeVisible()
      await page.goBack()
      await expect(page.getByRole('heading', { name: '董卓 #2001' }))
        .toBeVisible()
    })

    test('clearing an existing name and clicking outside restores the default identifier', async ({ page }) => {
      await setup(page)
      await page.goto('/agents/1000')
      await page.getByRole('button', { name: '智能体更多操作' }).click()
      await page.getByRole('menuitem', { name: '重命名' }).click()
      const input = page.getByRole('textbox', { name: '智能体名称' })
      await input.fill('')
      await page.getByText('智能体主页', { exact: true }).click()
      await expect(input).toHaveCount(0)
      await expect(page.getByRole('heading', { name: '董卓 #1000' }))
        .toBeVisible()
      await page.reload()
      await expect(page.getByRole('heading', { name: '董卓 #1000' }))
        .toBeVisible()
    })

    test('successive creation resets the name and preserves saved names', async ({ page }) => {
      const { created } = await setup(page)
      await page.goto('/my-agents')
      await page.getByRole('button', { name: '新建吕布智能体' }).click()
      const input = page.getByRole('textbox', { name: '智能体名称' })
      await input.fill('赤兔')
      await input.press('Enter')
      await expect(page.getByRole('heading', { name: '吕布「赤兔」' }))
        .toBeVisible()
      await page.getByRole('button', { name: '新建吕布智能体' }).click()
      await expect(page).toHaveURL(/\/agents\/2002$/)
      await expect(input).toHaveValue('')
      await expect(input).toBeFocused()
      await input.press('Enter')
      await expect(page.getByRole('heading', { name: '吕布 #2002' }))
        .toBeVisible()
      expect(created).toHaveLength(2)
    })
  })
}

test('slow creation prevents double-clicks and cannot redirect after leaving', async ({ page }) => {
  const { created } = await setup(page)
  let release!: () => void
  const waiting = new Promise<void>((resolve) => release = resolve)
  await page.route('**/v1/agents', async (route) => {
    await waiting
    await route.fallback()
  })
  await page.goto('/scenarios/fengyiting-real')
  const button = page.getByRole('button', { name: '再建一个董卓' })
  await expect(button).toBeVisible()
  await button.evaluate((element: HTMLButtonElement) => {
    element.click()
    element.click()
  })
  await expect(button).toBeDisabled()
  await expect(page).toHaveURL(/\/scenarios\/fengyiting-real$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: '我的智能体', exact: true }).click()
  release()
  await expect.poll(() => created.length).toBe(1)
  await expect(page.getByRole('heading', { name: '我的智能体' })).toBeVisible()
  await expect(page).toHaveURL(/\/my-agents$/)
})

test('rejection stays inline and retry creates only once', async ({ page }) => {
  const { created } = await setup(page)
  let attempts = 0
  await page.route('**/v1/agents', async (route) => {
    if (++attempts === 1) {
      return route.fulfill({
        status: 409,
        json: { error: 'sibling_gate', message: '先为对侧保存一个策略' },
      })
    }
    await route.fallback()
  })
  await page.goto('/scenarios/fengyiting-real')
  await page.getByRole('button', { name: '再建一个董卓' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/scenarios\/fengyiting-real$/)
  await expect(page.getByRole('link', { name: /去完善/ })).toBeVisible()
  await page.getByRole('button', { name: '再建一个董卓' }).click()
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

for (const { summary } of agentPreviewScenarios) {
  test(`${summary.title}: both roles create on their own home`, async ({ page }) => {
    const { created } = await setup(page)
    for (
      const [side, role] of [['a', summary.sideAName], [
        'b',
        summary.sideBName,
      ]] as const
    ) {
      await page.goto(`/scenarios/${summary.id}`)
      const createLabel = summary.id === 'honnoji-decision'
        ? `再建一个${side === 'a' ? '袭击本能寺' : '西进毛利'}智能体`
        : `再建一个${role}`
      await page.getByRole('button', { name: createLabel, exact: true }).click()
      if (summary.id === 'honnoji-decision') {
        await page.locator('.portrait-choice').first().click()
      }
      await expect(page.getByRole('textbox', { name: '智能体名称' }))
        .toBeFocused()
      expect(created.at(-1)).toEqual({
        scenarioID: summary.id,
        side,
        ...(summary.id === 'honnoji-decision'
          ? { roleKey: side === 'a' ? 'yoshiaki' : 'hosokawa' }
          : {}),
      })
    }
  })
}

test('Chinese composition does not submit a name, and overlong names remain editable', async ({ page }) => {
  await setup(page)
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建董卓智能体' }).click()
  const input = page.getByRole('textbox', { name: '智能体名称' })
  await input.fill('董卓')
  await input.dispatchEvent('keydown', {
    key: 'Enter',
    isComposing: true,
    bubbles: true,
  })
  await expect(input).toBeVisible()
  await input.fill('字'.repeat(31))
  await expect(page.getByRole('button', { name: '保存名称' })).toBeDisabled()
  await input.fill('董卓')
  await input.press('Enter')
  await expect(page.getByRole('heading', { name: '董卓「董卓」' }))
    .toBeVisible()
})

test('a failed destination read never repeats the successful creation', async ({ page }) => {
  const { created } = await setup(page)
  let attempts = 0
  await page.route('**/v1/agents/2001/draft', async (route) => {
    if (++attempts === 1) {
      return route.fulfill({ status: 503, json: { error: 'unavailable' } })
    }
    await route.fallback()
  })
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建董卓智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

test('inventory recovery during creation keeps the pending navigation alive', async ({ page }) => {
  const { created } = await setup(page)
  await page.route('**/v1/my/agents', async (route) => {
    if (created.length === 0) {
      return route.fulfill({ status: 503, json: { error: 'unavailable' } })
    }
    await route.fallback()
  })
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建董卓智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

test('first creation survives the empty-to-populated inventory update before its home loads', async ({ page }) => {
  const { created } = await setup(page, true)
  let release!: () => void
  const waiting = new Promise<void>((resolve) => release = resolve)
  await page.route('**/v1/agents/2001/draft', async (route) => {
    await waiting
    await route.fallback()
  })
  await page.goto('/scenarios/fengyiting-real')
  await page.getByTestId('build-agent').click()
  await expect(page.getByRole('button', { name: '再建一个董卓' }))
    .toBeDisabled()
  release()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  await expect(page.getByRole('textbox', { name: '智能体名称' })).toBeFocused()
  expect(created).toHaveLength(1)
})

for (const width of [1440, 390]) {
  for (const entry of ['scenario', 'inventory', 'home'] as const) {
    test(`portrait choice ${width}px ${entry}: direction, cancellation, identity and refresh`, async ({ page, context }) => {
      await page.setViewportSize({ width, height: 900 })
      const { created, errors } = await setup(page)
      await page.goto(
        entry === 'scenario'
          ? '/scenarios/honnoji-decision'
          : entry === 'inventory'
          ? '/my-agents'
          : '/agents/1200',
      )
      const trigger = page.getByRole('button', {
        name: entry === 'scenario'
          ? '再建一个袭击本能寺智能体'
          : '新建 袭击本能寺',
      })
      await trigger.scrollIntoViewIfNeeded()
      const cdp = await context.newCDPSession(page)
      const mobile = width < 768
      if (mobile) {
        await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true })
      }
      async function hold() {
        const rect = await trigger.boundingBox()
        if (!rect) throw new Error('Missing creation button')
        const x = rect.x + rect.width / 2
        const y = rect.y + rect.height / 2
        if (mobile) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x, y }],
          })
        } else {
          await page.mouse.move(x, y)
          await page.mouse.down()
        }
        return { x, y }
      }
      async function move({ x, y }: { x: number; y: number }, delta: number) {
        if (mobile) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x, y: y + delta }],
          })
        } else await page.mouse.move(x + delta, y)
      }
      async function release() {
        if (mobile) {
          await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
          })
        } else await page.mouse.up()
      }
      const start = await hold()
      await expect(page.locator('.portrait-choice')).toHaveCount(2)
      // A queued event from scrolling the trigger into view must not dismiss it.
      await page.evaluate(() => document.dispatchEvent(new Event('scroll')))
      await expect(page.locator('.portrait-choice')).toHaveCount(2)
      expect(
        await page.locator('.portrait-choice-instruction').allTextContents(),
      )
        .toEqual(mobile ? ['↑', '↓'] : ['←', '→'])
      for (const card of await page.locator('.portrait-choice').all()) {
        const rect = await card.boundingBox()
        expect(rect!.x).toBeGreaterThanOrEqual(0)
        expect(rect!.x + rect!.width).toBeLessThanOrEqual(width)
      }
      await move(start, -70)
      await expect(page.locator('[data-role-key="yoshiaki"]')).toHaveAttribute(
        'data-selected',
        'true',
      )
      await move(start, 0)
      await release()
      await expect(page.locator('.portrait-choice')).toHaveCount(0)
      expect(created).toHaveLength(0)
      const select = await hold()
      await move(select, 70)
      await expect(page.locator('[data-role-key="chosokabe"]')).toHaveAttribute(
        'data-selected',
        'true',
      )
      expect(
        await page.locator('.portrait-choice-instruction').allTextContents(),
      )
        .toEqual(mobile ? ['↑', '↓'] : ['←', '→'])
      await release()
      await expect(page).toHaveURL(/\/agents\/2001$/)
      await page.getByRole('textbox', { name: '智能体名称' }).press('Escape')
      await page.reload()
      await expect(
        page.getByRole('heading', { name: '长宗我部元亲的密使 #2001' }),
      ).toBeVisible()
      expect(created).toEqual([{
        scenarioID: 'honnoji-decision',
        side: 'a',
        roleKey: 'chosokabe',
      }])
      expect(errors).toEqual([])
    })
  }
}

test('portrait keyboard selection and a rejected creation remain recoverable', async ({ page }) => {
  const { created, errors } = await setup(page)
  let attempts = 0
  await page.route('**/v1/agents', async (route) => {
    if (++attempts === 1) {
      return route.fulfill({ status: 409, json: { error: 'sibling_gate' } })
    }
    await route.fallback()
  })
  await page.goto('/scenarios/honnoji-decision')
  const trigger = page.getByRole('button', { name: '再建一个西进毛利智能体' })
  await trigger.scrollIntoViewIfNeeded()
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '创建细川藤孝' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: '创建明智军中的足轻' }))
    .toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('.portrait-choice')).toHaveCount(0)
  expect(created).toHaveLength(0)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: '创建细川藤孝' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: '创建明智军中的足轻' }))
    .toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toBeVisible()
  await trigger.click()
  await page.getByRole('button', { name: '创建明智军中的足轻' }).click()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  expect(created[0].roleKey).toBe('ashigaru')
  expect(errors).toEqual([])
})

// A blocked same-side creation offers the opposite side where that side is not
// on the page (the agent home): with no opposite agent yet, the action chooses
// the character in place instead of opening the role page.
for (const width of [1440, 390]) {
  test(`${width}px blocked sibling on the agent home chooses the opposite character in place`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const { created, errors } = await setup(page, false, (inventory) => {
      inventory.scenarios.find((item) =>
        item.scenarioID === 'honnoji-decision'
      )!.sides.b = []
    })
    await page.route('**/v1/agents', async (route) => {
      if (route.request().postDataJSON().side === 'a') {
        return route.fulfill({
          status: 409,
          json: { error: 'sibling_gate', message: '先为对侧保存一个策略' },
        })
      }
      await route.fallback()
    })
    await page.goto('/agents/1200')
    await page.getByRole('button', { name: '新建 袭击本能寺' }).click()
    await page.locator('.portrait-choice').first().click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('link', { name: /去完善/ })).toHaveCount(0)
    await page.getByRole('button', { name: '创建主张西进毛利智能体' }).click()
    await expect(page.locator('.portrait-choice')).toHaveCount(2)
    await page.getByRole('button', { name: '创建明智军中的足轻' }).click()
    // The inventory now lists the new agent; the pending navigation must survive.
    await expect(page).toHaveURL(/\/agents\/2001$/)
    await expect(page.getByRole('textbox', { name: '智能体名称' }))
      .toBeFocused()
    expect(created).toEqual([{
      scenarioID: 'honnoji-decision',
      side: 'b',
      roleKey: 'ashigaru',
    }])
    expect(errors).toEqual([])
  })
}

// My agents shows both sides: the rejection adds no action of its own, and the
// opposite column's own button chooses the character in place.
test('blocked sibling on my agents leaves an empty opposite side to its column', async ({ page }) => {
  const { created, errors } = await setup(page, false, (inventory) => {
    inventory.scenarios.find((item) => item.scenarioID === 'honnoji-decision')!
      .sides.b = []
  })
  await page.route('**/v1/agents', async (route) => {
    if (route.request().postDataJSON().side === 'a') {
      return route.fulfill({
        status: 409,
        json: { error: 'sibling_gate', message: '先为对侧保存一个策略' },
      })
    }
    await route.fallback()
  })
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建 袭击本能寺' }).click()
  await page.locator('.portrait-choice').first().click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: /^创建主张西进毛利/ }))
    .toHaveCount(0)
  await expect(page.getByRole('link', { name: /去完善/ })).toHaveCount(0)
  await page.getByRole('button', { name: '新建 西进毛利' }).click()
  await page.getByRole('button', { name: '创建细川藤孝' }).click()
  await expect(page).toHaveURL(/\/agents\/2001$/)
  expect(created).toEqual([{
    scenarioID: 'honnoji-decision',
    side: 'b',
    roleKey: 'hosokawa',
  }])
  expect(errors).toEqual([])
})

test('a blocked sibling opens an existing opposite draft instead of creating', async ({ page }) => {
  const { created, errors } = await setup(page)
  await page.route('**/v1/agents', (route) =>
    route.fulfill({
      status: 409,
      json: { error: 'sibling_gate', message: '先为对侧保存一个策略' },
    }))
  await page.goto('/my-agents')
  await page.getByRole('button', { name: '新建 袭击本能寺' }).click()
  await page.locator('.portrait-choice').first().click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: /^创建主张西进毛利/ }))
    .toHaveCount(0)
  await page.getByRole('link', { name: '去完善主张西进毛利智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/1250$/)
  expect(created).toHaveLength(0)
  expect(errors).toEqual([])
})
