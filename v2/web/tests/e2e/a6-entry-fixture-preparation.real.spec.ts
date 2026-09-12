import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  test,
} from '@playwright/test'

import type {
  EntryBundle,
  EntryManifest,
  PrivateEntryRole,
} from '../../e2e/a6-entry-preparation'
import type { MyAgentsResponse, VersionListResponse } from '../../src/api/types'
import { baseURL, sameOrigin } from './helpers'

const run = promisify(execFile)
const local = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(baseURL)
test.use({ screenshot: 'off', trace: 'off', video: 'off' })
test.skip(
  !local || process.env.AXIIA_E2E_ISOLATED !== '1',
  'Only the runner-owned isolated server may provision and consume these fixtures',
)

async function prepare(directory: string, suffix: string) {
  const privateOut = join(directory, `${suffix}-private.jsonl`)
  const publicOut = join(directory, `${suffix}-public.json`)
  const result = await run('deno', [
    'run',
    '-A',
    '--no-config',
    'e2e/prepare-a6-entry.ts',
    '--apply',
  ], {
    cwd: resolve('.'),
    env: {
      ...process.env,
      AXIIA_A6_ENTRY_SCENARIO: 'shangyang-court',
      AXIIA_PRIVATE_OUT: privateOut,
      AXIIA_PUBLIC_OUT: publicOut,
    },
  })
  expect(JSON.parse(result.stdout).ok).toBe(true)
  expect((await stat(privateOut)).mode & 0o077).toBe(0)
  const journal = (await readFile(privateOut, 'utf8')).trim().split('\n').map((
    line,
  ) => JSON.parse(line)) as Array<
    { bundle: EntryBundle; manifest: EntryManifest }
  >
  const bundle = journal.at(-1)!.bundle
  const publicText = await readFile(publicOut, 'utf8')
  const manifest = JSON.parse(publicText) as EntryManifest
  expect(manifest.state).toBe('ready')
  expect(manifest.environment).toBe('isolated-local')
  expect(manifest.fixtures.every((fixture) => fixture.verified)).toBe(true)
  expect(bundle.roles).toHaveLength(2)
  for (const role of bundle.roles) {
    expect(
      publicText.includes(role.email) || publicText.includes(role.password) ||
        publicText.includes(role.accountID!),
    ).toBe(false)
  }
  return { bundle, manifest }
}

async function login(browser: Browser, role: PrivateEntryRole) {
  const context = await browser.newContext()
  const response = await context.request.post('/v1/auth/login', {
    headers: sameOrigin,
    data: { email: role.email, password: role.password },
  })
  expect(response.ok()).toBe(true)
  expect((await response.json()).account.id).toBe(role.accountID)
  const me = await context.request.get('/v1/auth/me')
  expect(me.ok()).toBe(true)
  expect((await me.json()).account.displayName).toBe(role.accountAlias)
  return context
}

async function versions(api: APIRequestContext, id: number) {
  const response = await api.get(`/v1/agents/${id}/versions`)
  expect(response.ok()).toBe(true)
  return await response.json() as VersionListResponse
}

async function state(api: APIRequestContext) {
  const inventory = await (await api.get('/v1/my/agents'))
    .json() as MyAgentsResponse
  const config = await (await api.get('/v1/config')).json()
  const matches = await (await api.get('/v1/matches')).json()
  expect(config.usage).toEqual({ battlesToday: 0, pvpBattlesToday: 0 })
  expect(
    matches.matches.filter((
      match: {
        initiatorIsMe: boolean
        participants?: { a: { isMine: boolean }; b: { isMine: boolean } }
      },
    ) =>
      match.initiatorIsMe || match.participants?.a.isMine ||
      match.participants?.b.isMine
    ),
  ).toEqual([])
  const scenario = inventory.scenarios.find((row) =>
    row.scenarioID === 'shangyang-court'
  )!
  expect(scenario.gateProgress.a.beaten).toBe(0)
  expect(scenario.gateProgress.b.beaten).toBe(0)
  return scenario
}

async function switchEntry(page: Page, agentID: number, versionID: number) {
  await page.goto(`/agents/${agentID}`)
  const card = page.locator('[data-tm="E.version-card"]').filter({
    has: page.getByText(`#${versionID}`, { exact: true }),
  })
  const button = card.locator('[data-tm="E.set-entry-button"]')
  await expect(button).toHaveAttribute('aria-pressed', 'false')
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}

async function saveFirstVersion(page: Page, agentID: number, prompt: string) {
  await page.goto(`/agents/${agentID}/build`)
  await page.locator('[data-tm="E.prompt-input"]').fill(prompt)
  await page.locator('[data-tm="E.save-button"]').click()
  await expect(page).toHaveURL(new RegExp(`/agents/${agentID}$`))
}

test('fresh A6 entry and first-save packs support exact human actions without matches or shared-role resets', async ({ browser }) => {
  test.setTimeout(240_000)
  const directory = await mkdtemp(join(tmpdir(), 'axiia-entry-fixtures-'))
  try {
    const prepared = await prepare(directory, 'first')
    const entryRole = prepared.bundle.roles.find((role) =>
      role.id === 'a6-entry'
    )!
    const firstRole = prepared.bundle.roles.find((role) =>
      role.id === 'a6-entry-first-save'
    )!
    const entry = await login(browser, entryRole)
    const first = await login(browser, firstRole)
    try {
      const main = entryRole.agents[0]
      const opposite = entryRole.agents[1]
      const sibling = entryRole.agents[2]
      const untouched = firstRole.agents[0]
      expect(prepared.manifest.testModeFixtures).toEqual({
        a6EntryAgentId: String(main.agentID),
        a6EntrySiblingAgentId: String(sibling.agentID),
        a6NoEntryAgentId: String(untouched.agentID),
      })
      const initial = await state(entry.request)
      expect(initial.sides.a).toHaveLength(2)
      expect(initial.sides.b).toHaveLength(1)
      expect(
        (await versions(entry.request, main.agentID)).versions.map((
          v,
        ) => [v.ordinal, v.isEntry]).sort(),
      ).toEqual([[1, true], [2, false]])
      expect(
        (await versions(entry.request, sibling.agentID)).entryVersionID ?? null,
      ).toBeNull()
      expect((await versions(entry.request, opposite.agentID)).entryVersionID)
        .toBe(opposite.versions[0].id)
      const untouchedState = await state(first.request)
      expect(untouchedState.sides.a).toHaveLength(1)
      expect(untouchedState.sides.b).toHaveLength(0)
      expect(untouchedState.entryReady).toBe(false)
      expect((await versions(first.request, untouched.agentID)).versions)
        .toEqual([])
      expect(
        (await (await first.request.get(
          `/v1/agents/${untouched.agentID}/draft`,
        )).json()).fields,
      ).toEqual({})

      const blockedWrites: string[] = []
      for (const context of [entry, first]) {
        await context.route('**/v1/**', async (route) => {
          const req = route.request()
          const path = new URL(req.url()).pathname
          if (
            ['GET', 'HEAD', 'OPTIONS'].includes(req.method()) ||
            (req.method() === 'POST' &&
              /^\/v1\/agents\/\d+\/(?:save|mutate|entry\/\d+)$/.test(path))
          ) return await route.continue()
          blockedWrites.push(`${req.method()} ${path}`)
          await route.abort()
        })
      }
      const entryPage = await entry.newPage()
      await switchEntry(entryPage, main.agentID, main.versions[1].id)
      expect((await versions(entry.request, main.agentID)).entryVersionID).toBe(
        main.versions[1].id,
      )
      expect(
        (await versions(entry.request, sibling.agentID)).entryVersionID ?? null,
      ).toBeNull()
      await switchEntry(entryPage, sibling.agentID, sibling.versions[0].id)
      expect(
        (await versions(entry.request, main.agentID)).versions.every((
          version,
        ) => !version.isEntry),
      ).toBe(true)
      expect((await versions(entry.request, sibling.agentID)).entryVersionID)
        .toBe(sibling.versions[0].id)
      const afterEntry = await state(entry.request)
      expect(
        afterEntry.sides.a.filter((agent) => agent.entryVersionID != null).map((
          agent,
        ) => agent.entryVersionID),
      ).toEqual([sibling.versions[0].id])
      expect(afterEntry.sides.b[0].entryVersionID).toBe(opposite.versions[0].id)

      const firstPage = await first.newPage()
      await saveFirstVersion(
        firstPage,
        untouched.agentID,
        'First saved strategy. Explain the claim with evidence.',
      )
      const firstSaved = await versions(first.request, untouched.agentID)
      expect(firstSaved.versions).toHaveLength(1)
      const firstID = firstSaved.versions[0].id
      expect(firstSaved.versions[0].isEntry).toBe(true)
      expect(firstSaved.entryVersionID).toBe(firstID)
      await saveFirstVersion(
        firstPage,
        untouched.agentID,
        'Second saved strategy. Explain the conditions and counterargument.',
      )
      const secondSaved = await versions(first.request, untouched.agentID)
      expect(secondSaved.versions).toHaveLength(2)
      expect(secondSaved.entryVersionID).toBe(firstID)
      expect(
        secondSaved.versions.filter((version) => version.isEntry).map((
          version,
        ) => version.id),
      ).toEqual([firstID])
      const afterFirst = await state(first.request)
      expect(blockedWrites).toEqual([])

      const replacement = await prepare(directory, 'replacement')
      expect(
        replacement.bundle.roles.every((role) =>
          !prepared.bundle.roles.some((old) => old.accountID === role.accountID)
        ),
      ).toBe(true)
      expect(replacement.manifest.generation.id).not.toBe(
        prepared.manifest.generation.id,
      )
      expect(await state(entry.request)).toEqual(afterEntry)
      expect(await state(first.request)).toEqual(afterFirst)
      expect(await versions(first.request, untouched.agentID)).toEqual(
        secondSaved,
      )
      const newFirstRole = replacement.bundle.roles.find((role) =>
        role.id === 'a6-entry-first-save'
      )!
      const fresh = await login(browser, newFirstRole)
      try {
        expect(
          (await versions(fresh.request, newFirstRole.agents[0].agentID))
            .versions,
        ).toEqual([])
        expect((await state(fresh.request)).entryReady).toBe(false)
      } finally {
        await fresh.close()
      }
    } finally {
      await entry.close()
      await first.close()
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
