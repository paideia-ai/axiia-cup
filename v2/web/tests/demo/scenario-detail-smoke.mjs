import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.DEMO_URL ?? 'http://localhost:5190/demo.html'
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 960 } })
    const errors = []
    const apiRequests = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/v1')) {
        apiRequests.push(request.url())
      }
    })
    for (
      const [id, title, sideCounts] of [
        ['fengyiting-real', '凤仪亭之夜', [8, 1]],
        ['honnoji-decision', '本能寺之变·敌在何处', [3, 1]],
        ['legal-harbor-murder-jury', '码头疑云：七号仓命案', [1, 1]],
        ['shangyang-court', '商鞅变法·朝堂辩法', [1, 1]],
        ['trolley-problem', '电车难题·一人与五人', [3, 1]],
      ]
    ) {
      await page.goto(`${base}#/my-agents`)
      const link = page.getByRole('link', { name: title, exact: true })
      assert.equal(await link.getAttribute('href'), `#/scenarios/${id}`)
      await link.focus()
      await page.keyboard.press('Enter')
      await page.waitForURL((url) => url.hash === `#/scenarios/${id}`)
      const original = await page.evaluate(async (id) => {
        const { scenarioModule } = await import('/src/scenarios/index.ts')
        const module = scenarioModule(id)
        return {
          title: module.intro.source.title,
          paragraphs: module.intro.source.overview.paragraphs,
        }
      }, id)
      await page.getByRole('heading', {
        name: original.title,
        exact: true,
        level: 1,
      })
        .waitFor()
      const renderedParagraphs = await page.locator('main p').allTextContents()
      for (const paragraph of original.paragraphs) {
        assert.ok(
          renderedParagraphs.includes(paragraph),
          `Missing paragraph in ${id}`,
        )
      }
      assert.ok(await page.getByTestId('scenario-intro-card').count() >= 4)
      const viewMine = page.getByRole('button', { name: /^查看我的/ })
      assert.equal(await viewMine.count(), 2)
      for (let index = 0; index < 2; index++) {
        assert.ok(
          (await viewMine.nth(index).innerText()).includes(
            `（${sideCounts[index]}）`,
          ),
        )
      }
      const accordions = page.getByRole('button', { expanded: false })
      if (await accordions.count()) {
        const button = accordions.first()
        const element = await button.elementHandle()
        await button.click()
        assert.equal(await element.getAttribute('aria-expanded'), 'true')
      }
      for (const img of await page.locator('main img').all()) {
        await img.scrollIntoViewIfNeeded()
        assert.equal(
          await img.evaluate(async (node) => {
            await node.decode()
            return node.naturalWidth > 0
          }),
          true,
        )
      }
      assert.equal(
        await page.evaluate(() =>
          document.documentElement.scrollWidth > innerWidth
        ),
        false,
      )
      await page.reload()
      await page.getByRole('heading', {
        name: original.title,
        exact: true,
        level: 1,
      })
        .waitFor()
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({
        path: `/tmp/axiia-agent-visual-polish/scenario-${id}-${width}.png`,
      })
      await viewMine.first().click()
      await page.getByRole('heading', { name: '我的智能体', exact: true })
        .waitFor()
    }
    await page.getByRole('link', { name: '凤仪亭之夜', exact: true }).click()
    await page.getByRole('button', { name: '再建一个董卓', exact: true })
      .click()
    await page.getByLabel('智能体名称（可选）').fill('场景入口测试')
    await page.getByRole('button', { name: '创建智能体', exact: true }).click()
    await page.getByRole('heading', {
      name: '董卓「场景入口测试」',
      exact: true,
    }).waitFor()
    await page.goto(`${base}#/scenarios/not-a-scenario`)
    await page.getByRole('heading', { name: '场景不存在', exact: true })
      .waitFor()
    assert.deepEqual(errors, [])
    assert.deepEqual(apiRequests, [])
    console.log(
      `PASS ${width}px: all 5 scene links, original copy, images, accordions, local counts, create/return, direct refresh, no API calls`,
    )
    await page.close()
  }
} finally {
  await browser.close()
}
