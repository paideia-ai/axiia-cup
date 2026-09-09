// agent-edit.feature 的可执行镜像。2026-09-09 起以咳嗦三页层级为准。
import { expect, type Page, test } from '@playwright/test'

import { registrationCode, sameOrigin, signup } from './helpers'

const SIDE_A = '商鞅'
const SIDE_B = '甘龙'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

interface LocalDraftJournal {
  schema: 2
  identity: string
  agentID: number
  writerID: string
  revision: number
  token: string
  basePrompt: string
  prompt: string
  promptPersisted: boolean
  roleKey: string | null
  modelID: string | null
  note: string
  method: 'mcq' | 'builder' | null
  updatedAt: number
}

async function localDraftJournals(page: Page, agentID: number) {
  return await page.evaluate((id) => {
    const found: LocalDraftJournal[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key == null || !key.startsWith('axiia:builder-draft:v2:')) continue
      const raw = localStorage.getItem(key)
      if (raw == null) continue
      try {
        const value = JSON.parse(raw) as LocalDraftJournal
        if (value.schema === 2 && value.agentID === id) found.push(value)
      } catch {
        // Ignore unrelated malformed local data in the browser profile.
      }
    }
    return found.sort((left, right) => right.revision - left.revision)
  }, agentID)
}

async function putLocalDraftJournal(page: Page, journal: LocalDraftJournal) {
  await page.evaluate((value) => {
    const prefix = `axiia:builder-draft:v2:${
      encodeURIComponent(value.identity)
    }:`
    localStorage.setItem(`${prefix}${value.token}`, JSON.stringify(value))
  }, journal)
}

async function journalIdentity(page: Page, agentID: number) {
  const response = await page.request.get('/v1/auth/me')
  expect(response.ok()).toBe(true)
  const me = await response.json() as { account: { id: string } }
  return `${me.account.id}:${agentID}`
}

test.beforeEach(() => {
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
})

async function createFromInventory(
  page: Page,
  role: string,
  name?: string,
): Promise<number> {
  await page.goto('/my-agents')
  await expect(page.getByRole('heading', { name: '我的智能体' }))
    .toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: `新建${role}智能体` }).click()
  const dialog = page.getByRole('dialog', { name: `新建${role}智能体` })
  if (name) await dialog.getByLabel('名称（可选）').fill(name)
  await dialog.getByRole('button', { name: '创建智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/\d+$/)
  const agentID = Number(/\/agents\/(\d+)$/.exec(page.url())?.[1])
  expect(agentID).toBeGreaterThan(0)
  return agentID
}

async function versionState(page: Page, agentID: number) {
  const response = await page.request.get(`/v1/agents/${agentID}/versions`)
  expect(response.ok()).toBe(true)
  return await response.json() as {
    versions: Array<{
      id: number
      ordinal?: number
      prompt: string
      isEntry?: boolean
    }>
    entryVersionID?: number | null
  }
}

async function saveFromBuilder(page: Page, agentID: number, prompt: string) {
  if (!new RegExp(`/agents/${agentID}/build`).test(page.url())) {
    await page.goto(`/agents/${agentID}/build`)
  }
  const input = page.getByLabel('策略提示词')
  await expect(input).toBeEnabled({ timeout: 30_000 })
  await input.fill(prompt)
  await page.getByTestId('save-version').click()
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
}

test('草稿自动暂存，保存回主页，版本严格线性', async ({ page }) => {
  test.setTimeout(240_000)
  await signup(page, `edit-linear-${Date.now()}`)
  let agentID = 0
  const draft = '尚未保存：先以徙木证明法令可执行。'

  await test.step('假如 我从「我的智能体」创建商鞅 A，并先进入 A 的主页', async () => {
    agentID = await createFromInventory(page, SIDE_A, 'A')
    await expect(page.getByRole('heading', { name: `${SIDE_A}「A」` }))
      .toBeVisible()
  })

  await test.step('当 我在低信息构建器写入独特草稿并立刻点击「← 智能体主页」（不等待 debounce）', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
    const input = page.getByLabel('策略提示词')
    await expect(input).toBeEnabled()
    await input.fill(draft)
    await page.getByRole('link', { name: '← 智能体主页' }).click()
  })

  await test.step('并且 我立刻重新打开构建器', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
  })

  await test.step('那么 服务端草稿与输入框都恢复完全相同的文本，且还没有产生版本', async () => {
    await expect(page.getByLabel('策略提示词')).toHaveValue(draft)
    const response = await page.request.get(`/v1/agents/${agentID}/draft`)
    expect(response.ok()).toBe(true)
    expect(
      (await response.json() as { fields: Record<string, string> }).fields
        .prompt,
    )
      .toBe(draft)
    expect((await versionState(page, agentID)).versions).toHaveLength(0)
  })

  await test.step('当 我保存首稿', async () => {
    await page.getByTestId('save-version').click()
  })

  let v1 = 0
  await test.step('那么 我回到 A 的主页，v1 自动成为该侧参赛版本', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    const state = await versionState(page, agentID)
    expect(state.versions).toHaveLength(1)
    v1 = state.versions[0].id
    expect(state.entryVersionID).toBe(v1)
    await expect(page.getByRole('button', {
      name: `将 v1 设为${SIDE_A}参赛版本`,
    })).toHaveAttribute('aria-pressed', 'true')
  })

  await test.step('当 我再次进入构建器保存第二稿', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
    await saveFromBuilder(
      page,
      agentID,
      '第二稿：把每条祖制引用转化为可验证的现实成本。',
    )
  })

  let v2 = 0
  await test.step('那么 我再次回到主页，版本依次为 v2、v1', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    await expect(page.getByTestId('version-card')).toHaveCount(2)
    await expect(
      page.getByTestId('version-card').locator('[data-tm="E.version-tag"]'),
    )
      .toHaveText(['v2', 'v1'])
    const state = await versionState(page, agentID)
    v2 = Math.max(...state.versions.map((version) => version.id))
  })

  await test.step('并且 ★ 仍在 v1，保存没有偷偷改参赛版本', async () => {
    expect((await versionState(page, agentID)).entryVersionID).toBe(v1)
  })

  await test.step('当 我在主页把 v2 设为参赛版本', async () => {
    await page.getByRole('button', {
      name: `将 v2 设为${SIDE_A}参赛版本`,
    }).click()
  })

  await test.step('那么 服务端参赛位移动到 v2', async () => {
    await expect.poll(
      async () => (await versionState(page, agentID)).entryVersionID ?? null,
      { timeout: 20_000 },
    ).toBe(v2)
  })

  await test.step('假如 A 已经有版本', async () => {
    expect((await versionState(page, agentID)).versions.length)
      .toBeGreaterThan(0)
  })

  await test.step('当 我再次打开 A 的构建器', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
  })

  await test.step('那么 预设策略与外部 AI 辅助仍然可见', async () => {
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
  })

  await test.step('并且 当前草稿复制可用', async () => {
    await expect(page.getByRole('button', { name: '复制当前草稿' }))
      .toBeEnabled()
  })

  await test.step('并且 页面没有版本卡、版本对比、参赛或出战控件', async () => {
    await expect(page.getByTestId('version-card')).toHaveCount(0)
    await expect(page.getByText(/^版本（\d+）$/)).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: /设为.*参赛版本|用 v\d+ 出战/ }),
    )
      .toHaveCount(0)
  })
})

test('同一路由切换智能体时，迟到草稿不能串写或误存', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-route-race-${Date.now()}`)
  const promptA = 'A-PRIVATE：迟到的商鞅草稿绝不能进入甘龙。'
  const promptB = 'B-ONLY：甘龙自己的草稿必须原样保存。'
  let agentA = 0
  let agentB = 0

  await test.step('假如 A 与 B 各有一份可区分的服务端草稿，且都还没有版本', async () => {
    const ensure = async (side: 'a' | 'b') => {
      const response = await page.request.post('/v1/agents/ensure', {
        headers: sameOrigin,
        data: { scenarioID: 'shangyang-court', side },
      })
      expect(response.ok()).toBe(true)
      return (await response.json() as { agentID: number }).agentID
    }
    agentA = await ensure('a')
    agentB = await ensure('b')
    for (
      const [agentID, value] of [
        [agentA, promptA],
        [agentB, promptB],
      ] as const
    ) {
      const response = await page.request.post(`/v1/agents/${agentID}/mutate`, {
        headers: sameOrigin,
        data: { field: 'prompt', value },
      })
      expect(response.ok()).toBe(true)
      expect((await versionState(page, agentID)).versions).toHaveLength(0)
    }
  })

  const releaseA = deferred()
  const seenA = deferred()
  const deliveredA = deferred()
  const releaseB = deferred()
  const seenB = deferred()
  const deliveredB = deferred()
  await page.route(`**/v1/agents/${agentA}/draft`, async (route) => {
    const response = await route.fetch()
    seenA.resolve()
    await releaseA.promise
    await route.fulfill({ response })
    deliveredA.resolve()
  })
  await page.route(`**/v1/agents/${agentB}/draft`, async (route) => {
    const response = await route.fetch()
    seenB.resolve()
    await releaseB.promise
    await route.fulfill({ response })
    deliveredB.resolve()
  })

  await test.step('当 A 的草稿响应被延迟，而我在同一个构建器路由切换到 B', async () => {
    await page.goto(`/agents/${agentA}/build`)
    await seenA.promise
    await page.evaluate((path) => {
      globalThis.history.pushState(globalThis.history.state, '', path)
      globalThis.dispatchEvent(
        new PopStateEvent('popstate', { state: globalThis.history.state }),
      )
    }, `/agents/${agentB}/build`)
    await expect(page).toHaveURL(new RegExp(`/agents/${agentB}/build$`))
    await seenB.promise
  })

  await test.step('那么 B 的权威草稿返回前保存保持禁用', async () => {
    await expect(page.getByLabel('策略提示词')).toBeDisabled()
    await expect(page.getByTestId('save-version')).toBeDisabled()
  })

  await test.step('当 A 的迟到响应先返回', async () => {
    releaseA.resolve()
    await deliveredA.promise
  })

  await test.step('那么 A 的文本不会出现在 B，B 仍不能保存', async () => {
    await expect(page.getByLabel('策略提示词')).not.toHaveValue(promptA)
    await expect(page.getByTestId('save-version')).toBeDisabled()
  })

  await test.step('当 B 的权威草稿返回并保存', async () => {
    releaseB.resolve()
    await deliveredB.promise
    await expect(page.getByLabel('策略提示词')).toHaveValue(promptB)
    await expect(page.getByTestId('save-version')).toBeEnabled()
    await page.getByTestId('save-version').click()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentB}$`))
  })

  await test.step('那么 只有 B 产生内容完全正确的 v1，A 的草稿与版本都未被改动', async () => {
    const aState = await versionState(page, agentA)
    const bState = await versionState(page, agentB)
    expect(aState.versions).toHaveLength(0)
    expect(bState.versions).toHaveLength(1)
    expect(bState.versions[0].prompt).toBe(promptB)
    const aDraft = await page.request.get(`/v1/agents/${agentA}/draft`)
    const bDraft = await page.request.get(`/v1/agents/${agentB}/draft`)
    expect(
      (await aDraft.json() as { fields: Record<string, string> }).fields.prompt,
    )
      .toBe(promptA)
    expect(
      (await bDraft.json() as { fields: Record<string, string> }).fields.prompt,
    )
      .toBe(promptB)
  })
})

test('同一智能体卸载重挂后仍共用自动暂存队列', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-remount-queue-${Date.now()}`)
  const agentID = await createFromInventory(page, SIDE_A, '重挂队列')
  await page.getByRole('button', { name: '新建版本' }).click()
  await expect(page.getByLabel('策略提示词')).toBeEnabled()

  const oldPrompt = '旧组件发出的延迟草稿。'
  const newPrompt = '重挂后最终保存的新草稿。'
  const oldMutationSeen = deferred()
  const releaseOldMutation = deferred()
  let saveRequests = 0
  await page.route(`**/v1/agents/${agentID}/mutate`, async (route) => {
    const input = route.request().postDataJSON() as { value?: string }
    if (input.value === oldPrompt) {
      oldMutationSeen.resolve()
      await releaseOldMutation.promise
    }
    await route.continue()
  })
  await page.route(`**/v1/agents/${agentID}/save`, async (route) => {
    saveRequests += 1
    await route.continue()
  })

  await test.step('假如 旧构建器的自动暂存请求仍被延迟', async () => {
    await page.getByLabel('策略提示词').fill(oldPrompt)
    await oldMutationSeen.promise
  })

  await test.step('当 我经 SPA 返回主页并重新挂载同一智能体构建器', async () => {
    await page.getByRole('link', { name: '← 智能体主页' }).click()
    await page.getByRole('button', { name: '新建版本' }).click()
    await expect(page.getByLabel('策略提示词')).toHaveValue(oldPrompt)
  })

  await test.step('并且 我写入新稿并立即保存', async () => {
    await page.getByLabel('策略提示词').fill(newPrompt)
    await page.getByTestId('save-version').click()
  })

  await test.step('那么 新保存会在旧暂存之后排队，旧请求未完成前不会创建版本', async () => {
    await expect(page.getByTestId('save-version')).toHaveText('保存中…')
    await page.waitForTimeout(300)
    expect(saveRequests).toBe(0)
  })

  await test.step('当 旧暂存请求完成', () => {
    releaseOldMutation.resolve()
  })

  await test.step('那么 服务端草稿和唯一版本都只保留重挂后的新稿', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    const response = await page.request.get(`/v1/agents/${agentID}/draft`)
    expect(response.ok()).toBe(true)
    expect(
      (await response.json() as { fields: Record<string, string> }).fields
        .prompt,
    ).toBe(newPrompt)
    const state = await versionState(page, agentID)
    expect(state.versions).toHaveLength(1)
    expect(state.versions[0].prompt).toBe(newPrompt)
  })
})

test('保存等待最终暂存时锁定快照；暂存失败不创建版本', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-save-barrier-${Date.now()}`)
  const agentID = await createFromInventory(page, SIDE_A, '保存屏障')
  await page.getByRole('button', { name: '新建版本' }).click()
  await expect(page.getByLabel('策略提示词')).toBeEnabled()

  await page.getByRole('button', { name: '版本备注' }).click()
  await page.getByLabel('版本备注（可选）').fill('点击时备注')
  await page.getByRole('button', { name: '关闭备注' }).click()

  const mutationSeen = deferred()
  const releaseMutation = deferred()
  let saveRequests = 0
  const mutatePattern = `**/v1/agents/${agentID}/mutate`
  await page.route(mutatePattern, async (route) => {
    mutationSeen.resolve()
    await releaseMutation.promise
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'draft_unavailable',
        message: 'draft unavailable',
      }),
    })
  })
  await page.route(`**/v1/agents/${agentID}/save`, async (route) => {
    saveRequests += 1
    await route.abort()
  })

  await test.step('当 我输入最后一段文字并保存，而最终暂存仍在等待', async () => {
    await page.getByLabel('策略提示词').fill('点击快照：这段文字必须先暂存。')
    await page.getByTestId('save-version').click()
    await mutationSeen.promise
  })

  await test.step('那么 所有会改变版本快照的入口都被冻结', async () => {
    await expect(page.getByLabel('策略提示词')).toBeDisabled()
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeDisabled()
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeDisabled()
    await expect(page.getByRole('button', { name: '复制当前草稿' }))
      .toBeDisabled()
    await expect(page.getByRole('button', { name: '版本备注' }))
      .toBeDisabled()
    const roleSelect = page.locator('[data-tm="E.role-select"]').getByRole(
      'button',
    )
    if (await roleSelect.count() > 0) await expect(roleSelect).toBeDisabled()
    await expect(
      page.locator('[data-tm="E.model-select"]').getByRole('combobox'),
    ).toBeDisabled()
    await expect(page.getByTestId('save-version')).toBeDisabled()
    await expect(page.getByTestId('save-version')).toHaveText('保存中…')
  })

  await test.step('当 最终暂存失败', () => {
    releaseMutation.resolve()
  })

  await test.step('那么 保存停止并显示中文错误，且没有请求创建版本', async () => {
    await expect(
      page.getByText('草稿暂存失败，请检查网络后重试；尚未创建新版本。'),
    )
      .toBeVisible()
    await expect(page.getByLabel('策略提示词')).toBeEnabled()
    await expect(page.getByTestId('save-version')).toBeEnabled()
    expect(saveRequests).toBe(0)
    expect((await versionState(page, agentID)).versions).toHaveLength(0)
  })
})

test('硬刷新恢复本机最后编辑，成功保存后清理恢复日志', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-reload-journal-${Date.now()}`)
  const agentID = await createFromInventory(page, SIDE_A, '刷新保护')
  await page.getByRole('button', { name: '新建版本' }).click()
  await expect(page.getByLabel('策略提示词')).toBeEnabled()

  const mutatePattern = `**/v1/agents/${agentID}/mutate`
  await page.route(mutatePattern, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'draft_unavailable',
        message: 'draft unavailable',
      }),
    })
  })
  const prompt = '硬刷新前最后一笔：不能因为 debounce 尚未完成而丢失。'

  await test.step('假如 服务端暂存不可用，我编辑提示词与版本备注', async () => {
    await page.getByRole('button', { name: '版本备注' }).click()
    await page.getByLabel('版本备注（可选）').fill('刷新保护')
    await page.getByRole('button', { name: '关闭备注' }).click()
    await page.getByLabel('策略提示词').fill(prompt)
    const journals = await localDraftJournals(page, agentID)
    expect(journals).toHaveLength(1)
    expect(journals[0]).toMatchObject({ schema: 2, agentID })
    expect(journals[0].revision).toBeGreaterThan(0)
    expect(journals[0].identity).toContain(`:${agentID}`)
    expect(journals[0].token).not.toBe('')
    expect(journals[0].prompt).toBe(prompt)
    expect(journals[0].basePrompt).toBe('')
  })

  await test.step('并且 复制权限被拒时只显示失败指引，绝不谎报已复制', async () => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error('clipboard denied')),
        },
      })
    })
    await page.getByRole('button', { name: '复制当前草稿' }).click()
    await expect(page.getByText('复制失败，请手动选择策略提示词并复制。'))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '复制当前草稿' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '已复制当前草稿' }))
      .toHaveCount(0)
  })

  await test.step('当 我立即硬刷新', async () => {
    await page.reload()
  })

  await test.step('那么 本机日志恢复最后文本与备注，并明确提示正在同步', async () => {
    await expect(page.getByLabel('策略提示词')).toHaveValue(prompt)
    await expect(page.getByText('已恢复本机未暂存的草稿，正在同步'))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '版本备注' }))
      .toHaveAttribute('title', '版本备注：刷新保护')
    const response = await page.request.get(`/v1/agents/${agentID}/draft`)
    expect(response.ok()).toBe(true)
    expect(
      (await response.json() as { fields: Record<string, string> }).fields
        .prompt ?? '',
    ).toBe('')
  })

  await test.step('当 服务端恢复后我重试保存', async () => {
    await page.unroute(mutatePattern)
    await page.getByTestId('save-version').click()
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
  })

  await test.step('那么 新版本使用恢复文本，且本机恢复日志已清理', async () => {
    const state = await versionState(page, agentID)
    expect(state.versions).toHaveLength(1)
    expect(state.versions[0].prompt).toBe(prompt)
    expect(await localDraftJournals(page, agentID)).toHaveLength(0)
  })
})

test('旧标签页保存只清理点击时 token，不删除另一标签页的新日志', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-journal-cas-${Date.now()}`)
  const agentID = await createFromInventory(page, SIDE_A, '并发日志')
  await page.getByRole('button', { name: '新建版本' }).click()
  const prompt = '旧标签页准备保存的稳定草稿。'
  await page.getByLabel('策略提示词').fill(prompt)
  await expect.poll(async () => {
    const response = await page.request.get(`/v1/agents/${agentID}/draft`)
    return (await response.json() as { fields: Record<string, string> }).fields
      .prompt
  }).toBe(prompt)
  const [saveJournal] = await localDraftJournals(page, agentID)
  expect(saveJournal).toBeDefined()

  const saveSeen = deferred()
  const releaseSave = deferred()
  await page.route(`**/v1/agents/${agentID}/save`, async (route) => {
    const response = await route.fetch()
    saveSeen.resolve()
    await releaseSave.promise
    await route.fulfill({ response })
  }, { times: 1 })

  await test.step('当 旧标签页开始保存并停在服务器响应前', async () => {
    await page.getByTestId('save-version').click()
    await saveSeen.promise
  })

  const newerJournal: LocalDraftJournal = {
    ...saveJournal,
    writerID: 'deterministic-second-tab',
    revision: saveJournal.revision + 1,
    token: `second-tab-${Date.now()}`,
    basePrompt: prompt,
    prompt: '另一标签页稍后写下、尚未保存的新草稿。',
    promptPersisted: false,
    updatedAt: Date.now(),
  }
  await test.step('并且 另一标签页写入更高 revision 和新 token', async () => {
    await putLocalDraftJournal(page, newerJournal)
  })

  await test.step('当 旧标签页的保存响应返回', () => {
    releaseSave.resolve()
  })

  await test.step('那么 只删除旧 token，另一标签页的新日志仍完整保留', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    const journals = await localDraftJournals(page, agentID)
    expect(journals.some((journal) => journal.token === saveJournal.token))
      .toBe(false)
    expect(journals).toContainEqual(newerJournal)
  })
})

test('服务器偏离 base 时保留冲突副本，只有明确选择才恢复', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-journal-conflict-${Date.now()}`)
  const agentID = await createFromInventory(page, SIDE_A, '冲突恢复')
  const serverPrompt = '服务器上的独立新稿。'
  const localPrompt = '本机从旧底稿继续写出的未暂存副本。'
  const seed = await page.request.post(`/v1/agents/${agentID}/mutate`, {
    headers: sameOrigin,
    data: { field: 'prompt', value: serverPrompt },
  })
  expect(seed.ok()).toBe(true)
  await putLocalDraftJournal(page, {
    schema: 2,
    identity: await journalIdentity(page, agentID),
    agentID,
    writerID: 'stale-tab',
    revision: 1,
    token: `conflict-${Date.now()}`,
    basePrompt: '双方曾经看到的旧底稿。',
    prompt: localPrompt,
    promptPersisted: false,
    roleKey: null,
    modelID: null,
    note: '冲突副本',
    method: null,
    updatedAt: Date.now(),
  })

  let mutationRequests = 0
  await page.route(`**/v1/agents/${agentID}/mutate`, async (route) => {
    mutationRequests += 1
    await route.continue()
  })

  await test.step('假如 本机未暂存副本的 base 已落后于服务器', async () => {
    await page.goto(`/agents/${agentID}/build`)
  })

  await test.step('那么 构建器保留服务器文本且不会静默回写旧副本', async () => {
    await expect(page.getByLabel('策略提示词')).toHaveValue(serverPrompt)
    const recovery = page.getByRole('region', { name: '本机草稿恢复' })
    await expect(recovery).toContainText(
      '服务器草稿已更新，本机副本未自动恢复。',
    )
    await expect(recovery).toContainText(localPrompt)
    await page.waitForTimeout(650)
    expect(mutationRequests).toBe(0)
    await expect(page.getByTestId('save-version')).toBeDisabled()
  })

  await test.step('当 我明确选择恢复本机副本', async () => {
    await page.getByRole('button', { name: '恢复本机副本' }).click()
  })

  await test.step('那么 才将本机文本同步到服务器并继续编辑', async () => {
    await expect(page.getByLabel('策略提示词')).toHaveValue(localPrompt)
    await expect(page.getByTestId('draft-recovery')).toHaveCount(0)
    await expect.poll(async () => {
      const response = await page.request.get(`/v1/agents/${agentID}/draft`)
      return (await response.json() as { fields: Record<string, string> })
        .fields
        .prompt
    }).toBe(localPrompt)
    expect(mutationRequests).toBe(1)
  })
})

test('超过十四天的日志不自动覆盖，并可明确保留服务器稿', async ({ page }) => {
  test.setTimeout(180_000)
  await signup(page, `edit-journal-expired-${Date.now()}`)
  const agentID = await createFromInventory(page, SIDE_A, '过期恢复')
  const expiredPrompt = '十五天前留在本机的旧稿。'
  await putLocalDraftJournal(page, {
    schema: 2,
    identity: await journalIdentity(page, agentID),
    agentID,
    writerID: 'expired-tab',
    revision: 1,
    token: `expired-${Date.now()}`,
    basePrompt: '',
    prompt: expiredPrompt,
    promptPersisted: false,
    roleKey: null,
    modelID: null,
    note: '',
    method: null,
    updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  })
  let mutationRequests = 0
  await page.route(`**/v1/agents/${agentID}/mutate`, async (route) => {
    mutationRequests += 1
    await route.continue()
  })

  await test.step('假如 本机日志已超过十四天，即使服务器仍等于其 base', async () => {
    await page.goto(`/agents/${agentID}/build`)
  })

  await test.step('那么 旧稿不会自动恢复或发往服务器', async () => {
    await expect(page.getByLabel('策略提示词')).toHaveValue('')
    const recovery = page.getByRole('region', { name: '本机草稿恢复' })
    await expect(recovery).toContainText(
      '本机留有一份超过 14 天的草稿，未自动恢复。',
    )
    await expect(recovery).toContainText(expiredPrompt)
    await page.waitForTimeout(650)
    expect(mutationRequests).toBe(0)
  })

  await test.step('当 我明确使用服务器草稿', async () => {
    await page.getByRole('button', { name: '使用服务器草稿' }).click()
  })

  await test.step('那么 过期日志被精确清理，服务器空稿保持可编辑', async () => {
    await expect(page.getByTestId('draft-recovery')).toHaveCount(0)
    await expect(page.getByLabel('策略提示词')).toBeEnabled()
    expect(await localDraftJournals(page, agentID)).toHaveLength(0)
    expect(mutationRequests).toBe(0)
  })
})

test('同侧新增门槛；空智能体在主页重命名与删除', async ({ page }) => {
  test.setTimeout(300_000)
  await signup(page, `edit-sibling-${Date.now()}`)
  let agentA = 0
  let agentB = 0
  const deletedPrompt = '删除后不得残留在本机的敏感草稿。'

  await test.step('假如 我只有一个已有版本的商鞅 A', async () => {
    agentA = await createFromInventory(page, SIDE_A, 'A')
    await page.getByRole('button', { name: '新建版本' }).click()
    await saveFromBuilder(page, agentA, 'A v1：先立可信的小承诺。')
  })

  await test.step('当 我从 A 主页尝试新建另一个商鞅', async () => {
    const rail = page.getByRole('navigation', { name: '同角色智能体' })
    await rail.getByRole('button', { name: `新建${SIDE_A}智能体` }).click()
    await page.getByRole('dialog', { name: `新建${SIDE_A}智能体` })
      .getByRole('button', { name: '创建智能体' }).click()
  })

  await test.step('那么 服务端拒绝并引导我去创建甘龙智能体', async () => {
    const dialog = page.getByRole('dialog', { name: `新建${SIDE_A}智能体` })
    await expect(dialog.getByRole('alert')).toBeVisible()
    await expect(dialog.getByRole('button', {
      name: `去创建${SIDE_B}智能体`,
    })).toBeVisible()
  })

  await test.step('当 我创建甘龙、保存一版，再新建商鞅 B', async () => {
    const blocked = page.getByRole('dialog', { name: `新建${SIDE_A}智能体` })
    await blocked.getByRole('button', { name: `去创建${SIDE_B}智能体` })
      .click()
    const opposite = page.getByRole('dialog', { name: `新建${SIDE_B}智能体` })
    await opposite.getByRole('button', { name: '创建智能体' }).click()
    await expect(page).toHaveURL(/\/agents\/\d+$/)
    const sideBID = Number(/\/agents\/(\d+)$/.exec(page.url())?.[1])
    await page.getByRole('button', { name: '新建版本' }).click()
    await saveFromBuilder(page, sideBID, '甘龙 v1：先问变法失败由谁承担。')
    agentB = await createFromInventory(page, SIDE_A, 'B')
  })

  await test.step('那么 B 先进入空的智能体主页，而不是构建器', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentB}$`))
    await expect(page.getByText('还没有保存过版本')).toBeVisible()
    expect((await versionState(page, agentB)).versions).toHaveLength(0)
  })

  await test.step('并且 B 的版本从 v1 独立计数', async () => {
    await page.getByRole('button', { name: '新建版本' }).click()
    await saveFromBuilder(page, agentB, 'B v1：另起一路。')
    await expect(
      page.getByTestId('version-card').getByText('v1', {
        exact: true,
      }),
    ).toBeVisible()
  })

  await test.step('假如 我有一个没有版本、但本机留有多份草稿日志的智能体', async () => {
    agentB = await createFromInventory(page, SIDE_B, '待命')
    expect((await versionState(page, agentB)).versions).toHaveLength(0)
    await page.getByRole('button', { name: '新建版本' }).click()
    await page.getByLabel('策略提示词').fill(deletedPrompt)
    await expect.poll(async () => {
      const response = await page.request.get(`/v1/agents/${agentB}/draft`)
      return (await response.json() as { fields: Record<string, string> })
        .fields
        .prompt
    }).toBe(deletedPrompt)
    const [current] = await localDraftJournals(page, agentB)
    expect(current).toBeDefined()
    await putLocalDraftJournal(page, {
      ...current,
      identity: `another-account:${agentB}`,
      writerID: 'another-account-tab',
      revision: current.revision + 1,
      token: `delete-purge-${Date.now()}`,
      prompt: `${deletedPrompt}（另一 scoped token）`,
      promptPersisted: false,
      updatedAt: Date.now(),
    })
    await page.evaluate((id) => {
      localStorage.setItem(
        `axiia:builder-draft:v1:${id}`,
        'legacy prompt copy',
      )
    }, agentB)
    expect(await localDraftJournals(page, agentB)).toHaveLength(2)
    await page.getByRole('link', { name: '← 智能体主页' }).click()
  })

  await test.step('当 我从主页更多菜单重命名', async () => {
    await page.getByRole('button', { name: '智能体更多操作' }).click()
    await page.getByRole('menuitem', { name: '重命名' }).click()
    await page.locator('#inline-agent-name').fill('新名字')
    await page.getByRole('button', { name: '保存名称' }).click()
  })

  await test.step('那么 标题与服务端清单同步新名称', async () => {
    await expect(page.getByRole('heading', { name: `${SIDE_B}「新名字」` }))
      .toBeVisible()
    const response = await page.request.get('/v1/my/agents')
    expect(response.ok()).toBe(true)
    expect(JSON.stringify(await response.json())).toContain('新名字')
  })

  await test.step('当 我从主页更多菜单删除并确认', async () => {
    await page.getByRole('button', { name: '智能体更多操作' }).click()
    await page.getByRole('menuitem', { name: '删除智能体' }).click()
    const dialog = page.getByRole('dialog', { name: '删除智能体' })
    await dialog.getByRole('button', { name: /确认删除|删除智能体/ }).click()
  })

  await test.step('那么 空智能体被删除，所有 scoped 本机草稿日志也被清理', async () => {
    await expect(page).not.toHaveURL(new RegExp(`/agents/${agentB}$`))
    const response = await page.request.get(`/v1/agents/${agentB}/versions`)
    expect(response.status()).toBe(404)
    expect(await localDraftJournals(page, agentB)).toHaveLength(0)
    expect(
      await page.evaluate(
        (id) => localStorage.getItem(`axiia:builder-draft:v1:${id}`),
        agentB,
      ),
    ).toBeNull()
  })

  await test.step('但是 已有版本的智能体在主页显示“已有版本，无法删除”', async () => {
    await page.goto(`/agents/${agentA}`)
    await page.getByRole('button', { name: '智能体更多操作' }).click()
    await expect(page.getByText('已有版本，无法删除')).toBeVisible()
    await expect(page.getByRole('menuitem', { name: '删除智能体' }))
      .toBeDisabled()
  })
})
