import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { honnojiDecisionDecks } from '../../src/scenarios/decks/honnoji-decision.ts'
import { assembleDeck } from '../../src/lib/deck.ts'

const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    for (
      const [agentID, roleKey, name, opposite] of [
        [211, 'chosokabe', '长宗我部元亲的密使', '细川藤孝'],
        [211, 'yoshiaki', '足利义昭的使者', '明智军中的足轻'],
        [-4, 'hosokawa', '细川藤孝', '长宗我部元亲的密使'],
        [-4, 'ashigaru', '明智军中的足轻', '足利义昭的使者'],
      ]
    ) {
      const page = await browser.newPage({ viewport: { width, height: 960 } })
      await page.goto(`${base}#/agents/${agentID}/build`)
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .click()
      const dialog = page.getByRole('dialog')
      assert.equal(
        await dialog.getByRole('button', { name: opposite, exact: true })
          .count(),
        0,
      )
      await dialog.getByRole('button', { name, exact: true }).click()
      const deck = honnojiDecisionDecks.decks[roleKey]
      const selections = {}
      for (const question of deck.questions) {
        const option = question.options[0]
        await dialog.getByRole('button', { name: option.label, exact: true })
          .click()
        selections[question.id] = option.id
      }
      const expected = assembleDeck(deck, selections)
      assert.equal(await page.getByTestId('mcq-preview').innerText(), expected)
      await dialog.getByRole('button', { name: '填入工作区', exact: true })
        .click()
      assert.equal(
        await page.getByLabel('策略提示词', { exact: true }).inputValue(),
        expected,
      )
      await page.reload()
      await page.getByRole('button', { name: '选择预设策略', exact: true })
        .click()
      assert.equal(
        await dialog.getByRole('button', { name, exact: true }).getAttribute(
          'aria-pressed',
        ),
        'true',
      )
      const alternate = dialog.getByRole('group', {
        name: '选择角色',
        exact: true,
      }).getByRole('button', { pressed: false })
      await alternate.click()
      assert.equal(
        await dialog.getByRole('button', { name: '填入工作区', exact: true })
          .isDisabled(),
        true,
      )
      await dialog.getByRole('button', { name: '关闭弹窗', exact: true })
        .click()
      await page.getByRole('button', { name: '保存并返回主页', exact: true })
        .click()
      await page.getByRole('button', { name: '新建版本', exact: true })
        .waitFor()
      const saved = await page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem('axiia-agent-ux-kesou-20260909-v1'))
            .find((agent) => agent.id === id).versions.at(-1),
        agentID,
      )
      assert.equal(JSON.parse(saved.options).role, roleKey)
      assert.equal(saved.prompt, expected)
      assert.equal(
        await page.evaluate(() =>
          document.documentElement.scrollWidth > innerWidth
        ),
        false,
      )
      await page.close()
    }
    console.log(
      `PASS ${width}px: all four original Honnoji role presets, side filtering, exact assembly, persistence, role switching`,
    )
  }
} finally {
  await browser.close()
}
