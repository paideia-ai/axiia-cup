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
        ms: Math.round(this.buffer.duration * 1000),
        signature: this.buffer.getChannelData(0).slice(0, 512).reduce(
          (sum, value, index) => sum + value * (index + 1),
          0,
        ).toFixed(6),
      })
      return start.apply(this, args)
    }
  })
  await page.goto('http://127.0.0.1:5188/sound-demo.html')
  await page.bringToFront()
  const picker = page.getByRole('region', { name: '十套音效方案' })
  assert.equal(await picker.getByRole('radio').count(), 10)
  const signatures = []
  for (let index = 1; index <= 10; index++) {
    await page.evaluate(() => {
      window.__cues = []
    })
    const name = new RegExp(`试听方案${String(index).padStart(2, '0')} `)
    await picker.getByRole('button', { name }).click()
    await page.waitForTimeout(700)
    const cues = await page.evaluate(() => window.__cues)
    assert.deepEqual(cues.map((cue) => cue.ms), [45, 110])
    signatures.push(cues[1].signature)
  }
  assert.equal(new Set(signatures).size, 10)
  assert.equal(
    await picker.getByRole('radio').first().isChecked(),
    true,
    'audition never changes selection',
  )
  await page.getByLabel('试听内容', { exact: true }).selectOption('all')
  await page.evaluate(() => {
    window.__cues = []
  })
  await picker.getByRole('button', { name: /试听方案07 / }).click()
  await page.waitForTimeout(3000)
  assert.deepEqual(
    (await page.evaluate(() => window.__cues)).map((cue) => cue.ms),
    [45, 110, 260, 340, 85, 720],
  )
  await picker.getByRole('radio', { name: /低音落键/ }).check()
  await page.evaluate(() => {
    window.__cues = []
  })
  await page.getByRole('button', { name: '保存版本', exact: true }).click()
  await page.getByText('版本 v1 已保存').waitFor()
  const selectedClick = (await page.evaluate(() => window.__cues)).find((cue) =>
    cue.ms === 110
  )
  assert.equal(
    selectedClick.signature,
    signatures[6],
    'real demo button uses selected sound set',
  )
  await page.reload()
  assert.equal(
    await page.getByRole('radio', { name: /低音落键/ }).isChecked(),
    true,
  )
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
      path: `/tmp/axiia-sound-ten-${width}.png`,
      fullPage: true,
    })
  }
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      distinctPalettes: signatures.length,
      violations,
      errors,
    }),
  )
} finally {
  await browser.close()
}
