import { expect, type Page } from '@playwright/test'

export const registrationCode = process.env.AXIIA_REGISTRATION_CODE ?? ''
export const scenarioID = process.env.AXIIA_SCENARIO_ID ?? ''

export function requireServerFixtures() {
  expect(
    registrationCode,
    'AXIIA_REGISTRATION_CODE is set by run-playwright.sh',
  )
    .not.toBe('')
  expect(scenarioID, 'AXIIA_SCENARIO_ID is set by run-playwright.sh').not.toBe(
    '',
  )
}

export async function signup(page: Page, label: string) {
  const email = `playwright-${label}-${Date.now()}@axiia.test`
  await page.goto('/register')
  await page.getByLabel('注册码').fill(registrationCode)
  await page.getByLabel('昵称').fill(`测试玩家 ${label}`)
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码').fill('playwrightpw-123456')
  await page.getByRole('button', { name: '创建账户' }).click()
  await expect(page).toHaveURL(/\/scenarios$/)
  return email
}

export async function buildVersion(
  page: Page,
  side: 'a' | 'b',
  prompt: string,
) {
  await page.goto(`/scenarios/${scenarioID}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const buildButtons = page.getByRole('button', { name: '去构建' })
  await buildButtons.nth(side === 'a' ? 0 : 1).click()
  await expect(page).toHaveURL(/\/agents\/\d+\/build/)
  const agentID = Number(/\/agents\/(\d+)\/build/.exec(page.url())?.[1])
  expect(agentID).toBeGreaterThan(0)

  const promptInput = page.getByLabel('策略提示词')
  await expect(promptInput).toBeEnabled()
  await promptInput.fill(prompt)
  await expect(page.getByText(`${prompt.length} / 1000`)).toBeVisible()
  const save = page.getByTestId('save-version')
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))

  const versionsResponse = await page.request.get(
    `/v1/agents/${agentID}/versions`,
  )
  expect(versionsResponse.ok()).toBe(true)
  const payload = await versionsResponse.json() as {
    versions: Array<{ id: number; prompt: string; isEntry: boolean }>
    entryVersionID: number
  }
  const version = payload.versions.at(-1)
  expect(version?.prompt).toBe(prompt)
  expect(payload.entryVersionID).toBe(version?.id)
  return { agentID, versionID: version!.id }
}
