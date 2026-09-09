// U02 · u02-builder-core.feature 的可执行镜像。
// 2026-09-09：构建器按咳嗦「低」层级验收，不再承载版本线。
import { expect, type Page, test } from '@playwright/test'

import { registrationCode, signup } from '../helpers'

const SIDE = '甘龙'
const MCQ_FIRST_OPTIONS = [
  '商鞅只懂新法，你更了解秦国实情',
  '新法一旦失败，秦国会先乱起来',
  '谁来执行？地方官不听怎么办？',
  '先阻止变法，再顺带争取目标',
]

test.describe.configure({ mode: 'serial', timeout: 180_000 })

let page: Page
let agentID = 0
let assembledPrompt = ''
let selectedModelID = ''

async function versions() {
  const response = await page.request.get(`/v1/agents/${agentID}/versions`)
  expect(response.ok()).toBe(true)
  return await response.json() as {
    versions: Array<{
      id: number
      prompt: string
      modelID: string
      note?: string | null
      isEntry?: boolean
    }>
    entryVersionID?: number | null
  }
}

async function enterBuilder() {
  if (!new RegExp(`/agents/${agentID}$`).test(page.url())) {
    await page.goto(`/agents/${agentID}`)
    await expect(page.getByRole('button', { name: '新建版本' }))
      .toBeVisible({ timeout: 30_000 })
  }
  await page.getByRole('button', { name: '新建版本' }).click()
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build$`))
  await expect(page.getByLabel('策略提示词')).toBeEnabled({
    timeout: 30_000,
  })
}

test.beforeAll(async ({ browser }) => {
  expect(registrationCode, 'AXIIA_REGISTRATION_CODE must be set').not.toBe('')
  page = await browser.newPage()
  await signup(page, `u02-keso-${Date.now()}`)
  await page.goto('/my-agents')
  await expect(page.getByRole('heading', { name: '我的智能体' }))
    .toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: `新建${SIDE}智能体` }).click()
  await page.getByRole('dialog', { name: `新建${SIDE}智能体` })
    .getByRole('button', { name: '创建智能体' }).click()
  await expect(page).toHaveURL(/\/agents\/\d+$/)
  agentID = Number(/\/agents\/(\d+)$/.exec(page.url())?.[1])
  await enterBuilder()
})

test.afterAll(async () => {
  await page?.close()
})

test('两个辅助入口始终可见，详细流程按需打开', async () => {
  await test.step('假如 我创建一个甘龙智能体并从主页进入构建器', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}/build$`))
  })

  await test.step('那么 页面直接显示「选择预设策略」与「让你的AI帮你想策略」', async () => {
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
  })

  await test.step('并且 不再显示三选一初始化 tab', async () => {
    await expect(page.getByRole('tab')).toHaveCount(0)
    await expect(page.getByText('初始化方式 · 三选一生成首稿'))
      .toHaveCount(0)
  })

  await test.step('当 我打开外部 AI 辅助', async () => {
    await page.getByRole('button', { name: '让你的AI帮你想策略' }).click()
  })

  await test.step('那么 对话框只提供可复制元提示词，不提供产品内聊天或粘贴框', async () => {
    const dialog = page.getByRole('dialog', { name: '让你的AI帮你想策略' })
    await expect(dialog.getByLabel('元提示词内容')).not.toBeEmpty()
    await expect(dialog.getByRole('button', { name: '复制元提示词' }))
      .toBeVisible()
    await expect(dialog.getByRole('textbox')).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: /发送|开始对话/ }))
      .toHaveCount(0)
    await dialog.getByRole('button', { name: '关闭弹窗' }).click()
  })

  await test.step('当 我打开预设策略，逐题选择并填入工作区', async () => {
    await page.getByRole('button', { name: '选择预设策略' }).click()
    const dialog = page.getByRole('dialog', { name: '选择预设策略' })
    for (const label of MCQ_FIRST_OPTIONS) {
      await dialog.getByRole('button', { name: label, exact: true }).click()
    }
    const preview = dialog.getByRole('region', { name: '拼装预览' })
    assembledPrompt = (await preview.locator('pre').textContent()) ?? ''
    expect(assembledPrompt.trim()).not.toBe('')
    await dialog.getByRole('button', { name: '填入工作区' }).click()
  })

  await test.step('那么 真实场景 deck 拼装的文本进入主输入框', async () => {
    await expect(page.getByLabel('策略提示词')).toHaveValue(assembledPrompt)
  })

  await test.step('并且 两个辅助入口仍然可见', async () => {
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
  })
})

test('模型、备注与角色模板仍属于构建工作', async () => {
  const modelsResponse = await page.request.get('/v1/models')
  expect(modelsResponse.ok()).toBe(true)
  const { models } = await modelsResponse.json() as {
    models: Array<{ id: string; label: string }>
  }

  await test.step('那么 模型选择器的清单与 /v1/models 一致', async () => {
    const model = page.getByRole('combobox')
    await model.click()
    await expect(page.getByRole('option')).toHaveText(
      models.map((item) => item.label),
    )
    const chosen = models[1] ?? models[0]
    selectedModelID = chosen.id
    await page.getByRole('option', { name: chosen.label, exact: true }).click()
  })

  await test.step('当 我填写版本备注并展开角色系统提示词', async () => {
    const before = await page.getByLabel('策略提示词').inputValue()
    await page.getByRole('button', { name: '版本备注' }).click()
    await page.getByLabel('版本备注（可选）').fill('咳嗦验收')
    await page.getByRole('button', { name: '关闭备注' }).click()
    await page.getByText('角色系统提示词', { exact: true }).click()
    await expect(page.locator('[data-tm="E.role-template-text"]'))
      .not.toBeEmpty()
    expect(await page.getByLabel('策略提示词').inputValue()).toBe(before)
  })

  await test.step('那么 备注保留在当前草稿，官方角色模板只读且不改主输入框', async () => {
    await expect(page.getByRole('button', { name: '版本备注' }))
      .toHaveAttribute('title', '版本备注：咳嗦验收')
    await expect(page.locator('[data-tm="E.role-template-text"] textarea'))
      .toHaveCount(0)
  })
})

test('普通保存产生真实版本并回到主页', async () => {
  await test.step('当 我点「保存并返回主页」', async () => {
    const save = page.getByTestId('save-version')
    await expect(save).toHaveText('保存并返回主页')
    await save.click()
  })

  await test.step('那么 我回到智能体主页并看到 v1、模型、备注与提示词', async () => {
    await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
    const card = page.getByTestId('version-card')
    await expect(card).toHaveCount(1)
    await expect(card.getByText('v1', { exact: true })).toBeVisible()
    await expect(card.getByText(assembledPrompt, { exact: true }))
      .toBeVisible()
    await expect(card.getByText(selectedModelID, { exact: true }))
      .toBeVisible()
    await expect(card.getByText('备注：咳嗦验收')).toBeVisible()
  })

  await test.step('并且 服务端版本快照与页面输入一致', async () => {
    const state = await versions()
    expect(state.versions).toHaveLength(1)
    expect(state.versions[0]).toMatchObject({
      prompt: assembledPrompt,
      modelID: selectedModelID,
      note: '咳嗦验收',
    })
  })

  await test.step('并且 首版自动成为该侧参赛版本，且没有派发对局', async () => {
    const state = await versions()
    expect(state.entryVersionID).toBe(state.versions[0].id)
    const matches = await page.request.get('/v1/matches')
    expect(matches.ok()).toBe(true)
    const mine = (await matches.json() as {
      matches: Array<{
        participants?: { a?: { isMine?: boolean }; b?: { isMine?: boolean } }
      }>
    }).matches.filter((match) =>
      match.participants?.a?.isMine || match.participants?.b?.isMine
    )
    expect(mine).toHaveLength(0)
  })
})

test('已有版本后辅助仍存在，构建器不承担版本管理', async () => {
  await test.step('当 我再次从主页进入构建器', async () => {
    await enterBuilder()
  })

  await test.step('那么 两个辅助入口仍可用，模型沿用最新版', async () => {
    await expect(page.getByRole('button', { name: '选择预设策略' }))
      .toBeVisible()
    await expect(page.getByRole('button', { name: '让你的AI帮你想策略' }))
      .toBeVisible()
    const models = await (await page.request.get('/v1/models')).json() as {
      models: Array<{ id: string; label: string }>
    }
    const label = models.models.find((model) => model.id === selectedModelID)
      ?.label ?? selectedModelID
    await expect(page.getByRole('combobox')).toContainText(label)
  })

  await test.step('并且 页面没有版本卡、版本对比、参赛选择或出战', async () => {
    await expect(page.getByTestId('version-card')).toHaveCount(0)
    await expect(page.getByText(/^版本（\d+）$/)).toHaveCount(0)
    await expect(
      page.getByRole('button', { name: /设为.*参赛版本|用 v\d+ 出战/ }),
    )
      .toHaveCount(0)
  })

  const current = '这段现有草稿不能被无提示覆盖。'
  await test.step('当 我用预设策略覆盖不同的已有草稿', async () => {
    await page.getByLabel('策略提示词').fill(current)
    await page.getByRole('button', { name: '选择预设策略' }).click()
    const dialog = page.getByRole('dialog', { name: '选择预设策略' })
    for (const label of MCQ_FIRST_OPTIONS) {
      await dialog.getByRole('button', { name: label, exact: true }).click()
    }
    await dialog.getByRole('button', { name: '填入工作区' }).click()
  })

  await test.step('那么 必须先确认，取消不会丢失当前草稿', async () => {
    const dialog = page.getByRole('dialog', { name: '选择预设策略' })
    await expect(dialog.getByText('主输入框已有策略，是否用这份预设策略替换？'))
      .toBeVisible()
    await dialog.getByRole('button', { name: '取消' }).click()
    await expect(page.getByLabel('策略提示词')).toHaveValue(current)
    await dialog.getByRole('button', { name: '关闭弹窗' }).click()
  })
})

test('实时配置的字数上限在保存前生效', async () => {
  const config = await page.request.get('/v1/config')
  expect(config.ok()).toBe(true)
  const body = await config.json() as { promptUnitLimit: number }
  const before = (await versions()).versions.length

  await test.step('当 我填入超过 /v1/config 上限的策略', async () => {
    await page.getByLabel('策略提示词').fill(
      '法'.repeat(body.promptUnitLimit + 1),
    )
  })

  await test.step('那么 计数器显示超限，保存按钮不可用，服务端版本数不变', async () => {
    await expect(
      page.getByText(`${body.promptUnitLimit + 1} / ${body.promptUnitLimit}`),
    )
      .toBeVisible()
    await expect(page.getByTestId('save-version')).toBeDisabled()
    expect((await versions()).versions).toHaveLength(before)
  })
})
