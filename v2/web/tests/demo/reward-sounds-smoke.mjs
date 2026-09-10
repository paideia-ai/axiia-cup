import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1100 },
  })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    window.__cues = []
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__cues.push({
        duration: this.buffer.duration,
        rate: this.buffer.sampleRate,
      })
      return start.apply(this, args)
    }
  })
  await page.goto('http://127.0.0.1:5188/sound-demo.html')
  await page.bringToFront()
  const reward = page.getByRole('region', { name: '领取奖励音效', exact: true })
  await reward.waitFor()
  assert.equal(await reward.getByRole('radio').count(), 0)
  assert.equal(await reward.getByRole('button', { name: /试听/ }).count(), 1)
  await reward.getByRole('button', { name: '试听提现音效' }).click()
  await page.waitForFunction(() => window.__cues.length === 1)
  assert.ok(
    Math.abs(
      (await page.evaluate(() => window.__cues))[0].duration - 15613 / 44100,
    ) < .001,
  )
  assert.equal(await reward.getByLabel('演示积分余额').textContent(), '1,000')
  await page.evaluate(() => {
    window.__cues = []
  })
  const claim = reward.getByRole('button', { name: '领取奖励', exact: true })
  await claim.evaluate((button) => {
    button.click()
    button.click()
    button.click()
  })
  await reward.getByText('+120 积分已到账', { exact: true }).waitFor()
  assert.equal(await reward.getByLabel('演示积分余额').textContent(), '1,120')
  assert.equal((await page.evaluate(() => window.__cues)).length, 1)
  assert.ok(
    Math.abs(
      (await page.evaluate(() => window.__cues))[0].duration - 15613 / 44100,
    ) <
      .001,
  )
  await reward.getByRole('button', { name: '重置再听' }).click()
  await page.getByRole('button', { name: '关闭音效', exact: true }).first()
    .click()
  await page.evaluate(() => {
    window.__cues = []
  })
  await claim.click()
  await reward.getByText('+120 积分已到账', { exact: true }).waitFor()
  assert.equal(await reward.getByLabel('演示积分余额').textContent(), '1,120')
  assert.equal((await page.evaluate(() => window.__cues)).length, 0)
  await page.getByRole('button', { name: '开启音效', exact: true }).first()
    .click()
  await page.waitForTimeout(250)
  assert.equal((await page.evaluate(() => window.__cues)).length, 0)
  await page.route(
    '**/sounds/reward-cashout-b.wav',
    (route) => route.fulfill({ status: 404, body: '' }),
  )
  await page.reload()
  await claim.click()
  await reward.getByText('+120 积分已到账', { exact: true }).waitFor()
  assert.equal(
    (await page.evaluate(() => window.__cues)).length,
    0,
    'audio load failure does not block credit or substitute synthetic audio',
  )
  await page.unroute('**/sounds/reward-cashout-b.wav')
  await reward.getByRole('button', { name: '试听提现音效', exact: true })
    .click()
  await page.waitForFunction(() => window.__cues.length === 1)
  await reward.getByRole('button', { name: '重置再听' }).click()
  await page.addScriptTag({ path: require.resolve('axe-core') })
  const violations = await page.evaluate(async () =>
    (await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    }))
  )
  assert.deepEqual(violations, [])
  for (const width of [1400, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 })
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
    )
    await page.screenshot({
      path: `/tmp/axiia-selected-b-${width}.png`,
      fullPage: true,
    })
  }
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ passed: true, violations, errors }))
} finally {
  await browser.close()
}
