import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const url = process.env.SOUND_DEMO_URL ??
  'http://127.0.0.1:5188/sound-demo.html'
const output = process.env.SOUND_DEMO_OUTPUT ?? '/tmp/axiia-sound-demo-checks'
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1400, height: 1100 },
})
await context.addInitScript(() => {
  window.__audioStarts = []
  const start = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (...args) {
    const samples = this.buffer?.getChannelData(0) ?? []
    let energy = 0
    for (const sample of samples) energy += sample * sample
    window.__audioStarts.push({
      duration: this.buffer?.duration,
      state: this.context.state,
      rms: Math.sqrt(energy / samples.length),
      when: args[0],
    })
    return start.apply(this, args)
  }
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto(url)
await page.bringToFront()
await page.getByRole('button', { name: '体验完整流程' }).waitFor()
await page.screenshot({ path: `${output}/desktop.png`, fullPage: true })
const starts = () => page.evaluate(() => window.__audioStarts)
const clear = () =>
  page.evaluate(() => {
    window.__audioStarts = []
  })
assert.equal((await starts()).length, 0, 'silent before a gesture')

for (const name of ['保存版本', '发起对战', '模型回复', '对战完成']) {
  const before = (await starts()).length
  await page.getByRole('button', { name: `试听${name}`, exact: true }).click()
  await page.waitForFunction(
    (count) => window.__audioStarts.length === count + 1,
    before,
  )
  await page.waitForTimeout(800)
}
const auditions = await starts()
assert.ok(
  auditions.every((item) => item.state === 'running' && item.rms > 0.02),
)
assert.deepEqual(auditions.map((item) => Math.round(item.duration * 1000)), [
  260,
  340,
  65,
  720,
])

// Default experience: only save, dispatch, completion; never a sound per token.
await clear()
await page.getByRole('button', { name: '体验完整流程' }).click()
await page.getByText('演示结局 · 与提示词编辑内容无关').waitFor({
  timeout: 30000,
})
assert.deepEqual(
  (await starts()).map((item) => Math.round(item.duration * 1000)),
  [260, 340, 720],
)
await page.screenshot({ path: `${output}/finished.png`, fullPage: true })

// With response ticks, each completed response produces exactly one tick.
await page.getByLabel('每次模型回复时播放').check()
await clear()
await page.getByRole('button', { name: '体验完整流程' }).click()
await page.getByText('演示结局 · 与提示词编辑内容无关').waitFor({
  timeout: 30000,
})
const responseFlow = (await starts()).map((item) =>
  Math.round(item.duration * 1000)
)
assert.deepEqual(responseFlow, [260, 340, 65, 65, 65, 65, 65, 65, 720])

// Muting during generation suppresses later cues and does not stop the match.
await clear()
await page.getByRole('button', { name: '体验完整流程' }).click()
await page.waitForFunction(() => window.__audioStarts.length === 2)
await page.getByRole('button', { name: '关闭音效', exact: true }).first()
  .click()
await page.getByText('演示结局 · 与提示词编辑内容无关').waitFor({
  timeout: 30000,
})
assert.equal((await starts()).length, 2)
await page.getByRole('button', { name: '开启音效', exact: true }).first()
  .click()
await page.waitForTimeout(500)
assert.equal((await starts()).length, 2, 'unmute must not replay a backlog')

// A stop never celebrates completion and cancels remaining timers.
await page.getByRole('button', { name: '体验完整流程' }).click()
await page.getByRole('button', { name: '中止演示' }).click()
await clear()
await page.waitForTimeout(1200)
assert.equal((await starts()).length, 0)

// A fresh page restores volume/mute preferences without playing a cue.
await page.getByRole('slider', { name: '音效音量' }).fill('40')
await page.getByRole('button', { name: '关闭音效', exact: true }).first()
  .click()
await page.reload()
assert.equal(await page.getByRole('slider').inputValue(), '40')
assert.equal(
  await page.getByRole('button', { name: '开启音效', exact: true }).count(),
  2,
)
assert.equal((await starts()).length, 0)

await page.addScriptTag({ path: require.resolve('axe-core') })
const accessibility = await page.evaluate(async () => {
  const result = await window.axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
  })
  return result.violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    nodes: nodes.map((n) => n.target),
  }))
})
assert.deepEqual(accessibility, [])
for (const width of [320, 390, 768]) {
  await page.setViewportSize({ width, height: 900 })
  await page.getByRole('button', { name: '重置演示' }).click()
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth
  )
  assert.equal(overflow, false, `no page overflow at ${width}px`)
  await page.screenshot({
    path: `${output}/width-${width}.png`,
    fullPage: true,
  })
}
assert.deepEqual(errors, [])
await writeFile(
  `${output}/results.json`,
  JSON.stringify({ auditions, responseFlow, accessibility, errors }, null, 2),
)
await browser.close()
console.log(`Sound demo checks passed. Evidence: ${output}`)
