import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1100 },
  })
  await page.addInitScript(() => {
    window.__cues = []
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__cues.push({
        ms: Math.round(this.buffer.duration * 1000),
        delay: args[0] - this.context.currentTime,
        rms: Math.sqrt(
          this.buffer.getChannelData(0).reduce(
            (sum, value) => sum + value * value,
            0,
          ) / this.buffer.length,
        ),
      })
      return start.apply(this, args)
    }
  })
  await page.goto('http://127.0.0.1:5188/sound-demo.html')
  await page.bringToFront()
  const save = page.getByRole('button', { name: '保存版本', exact: true })
  const battle = page.getByRole('button', { name: '发起对战', exact: true })
  const cues = () => page.evaluate(() => window.__cues)
  const clear = () =>
    page.evaluate(() => {
      window.__cues = []
    })

  await save.hover()
  assert.equal((await cues()).length, 0, 'initial hover cannot unlock audio')
  await save.click()
  await page.waitForFunction(() => window.__cues.length === 1)
  assert.equal((await cues())[0].ms, 110, 'click precedes server success')
  await page.getByText('版本 v1 已保存').waitFor()
  assert.deepEqual((await cues()).map((cue) => cue.ms), [110, 260])

  await clear()
  await battle.hover()
  await page.waitForTimeout(400)
  assert.deepEqual(
    (await cues()).map((cue) => cue.ms),
    [45],
    'one cue on entry, not continuously',
  )
  await battle.click()
  await page.waitForFunction(() => window.__cues.length >= 2)
  const interaction = await cues()
  assert.equal(interaction[1].ms, 110)
  assert.ok(interaction[1].rms > interaction[0].rms * 3)
  assert.ok(
    interaction[1].delay < 0.03,
    'click is not queued behind milestones',
  )
  await page.waitForFunction(() => window.__cues.some((cue) => cue.ms === 340))
  await page.getByRole('button', { name: '中止演示' }).click()

  await page.getByRole('button', { name: '重置演示' }).click()
  await clear()
  await battle.dispatchEvent('pointerenter', { pointerType: 'mouse' })
  assert.equal((await cues()).length, 0, 'disabled battle button stays silent')
  await save.dispatchEvent('pointerenter', { pointerType: 'touch' })
  assert.equal(
    (await cues()).length,
    0,
    'touch does not synthesize hover sound',
  )
  await save.focus()
  await save.press('Enter')
  await page.getByText('版本 v2 已保存').waitFor()
  assert.deepEqual(
    (await cues()).map((cue) => cue.ms),
    [110, 260],
    'keyboard activation clicks once',
  )

  await page.getByRole('button', { name: '关闭音效', exact: true }).first()
    .click()
  await clear()
  await save.hover()
  await save.click()
  await page.getByText('版本 v3 已保存').waitFor()
  assert.equal(
    (await cues()).length,
    0,
    'master mute covers hover, click and success',
  )
  await page.screenshot({
    path: '/tmp/axiia-sound-buttons.png',
    fullPage: true,
  })
  console.log(JSON.stringify({ passed: true, interaction }, null, 2))
} finally {
  await browser.close()
}
