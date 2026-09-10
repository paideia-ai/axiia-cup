import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const demoUrl = process.env.JOURNEY_DEMO_URL ??
  'http://localhost:5214/journey-demo.html'
const demoOrigin = new URL(demoUrl).origin
const browser = await chromium.launch()
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
  })
  const errors = [], api = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/v1/')) {
      api.push({
        url: response.url(),
        mocked: response.fromServiceWorker(),
        status: response.status(),
      })
    }
  })
  await page.addInitScript(() => {
    window.__audio = []
    const connect = AudioBufferSourceNode.prototype.connect
    AudioBufferSourceNode.prototype.connect = function (destination, ...args) {
      this.__gain = destination
      return connect.call(this, destination, ...args)
    }
    const start = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__audio.push({
        duration: Math.round(this.buffer.duration * 1000),
        channels: this.buffer.numberOfChannels,
        gain: this.__gain?.gain?.value,
        state: this.context.state,
      })
      return start.apply(this, args)
    }
  })
  await page.goto(demoUrl)
  await page.locator('#prompt-input').waitFor()
  const audio = () => page.evaluate(() => window.__audio)
  const cueCount = async (duration) =>
    (await audio()).filter((x) => x.duration === duration).length
  const editor = page.locator('#prompt-input')
  await editor.click()
  await editor.press('Control+End')
  await editor.pressSequentially(' 守住退路。', { delay: 65 })
  assert.ok(await cueCount(75) > 0, 'selected soft typing audio')
  assert.equal(
    await page.locator('.fancy-caret').evaluate((e) =>
      getComputedStyle(e).height
    ),
    '3px',
  )
  const prompt = await editor.inputValue()
  await page.getByRole('button', { name: '关闭音效', exact: true }).click()
  const beforeMute = (await audio()).length
  await editor.click()
  await editor.press('End')
  await editor.pressSequentially('!', { delay: 60 })
  assert.equal(
    (await audio()).length,
    beforeMute,
    'global mute includes typing',
  )
  await page.getByRole('button', { name: '开启音效', exact: true }).click()
  await page.getByRole('button', { name: '保存并返回主页', exact: true })
    .hover()
  await page.getByRole('button', { name: '保存并返回主页', exact: true })
    .click()
  await page.waitForURL('**#/agents/101')
  assert.equal(
    await cueCount(260),
    1,
    'save confirmation survives route change',
  )
  assert.ok(await cueCount(45) >= 1, 'hover sound')
  assert.ok(await cueCount(110) >= 1, 'click sound')
  assert.ok(
    (await page.getByTestId('version-card').first().innerText()).includes(
      prompt,
    ),
  )
  await page.screenshot({ path: '/tmp/journey-agent-home.png', fullPage: true })
  await page.getByRole('button', { name: '用 v2 出战', exact: true }).click()
  await page.getByRole('combobox').first().click()
  await page.getByRole('option').first().click()
  assert.ok(
    (await page.getByRole('dialog').innerText()).includes('指定版本 v2'),
  )
  await page.screenshot({ path: '/tmp/journey-dispatch.png', fullPage: true })
  await page.getByRole('button', { name: '发起对战', exact: true }).click()
  await page.waitForURL('**#/matches/7001')
  assert.equal(await cueCount(340), 1)
  await page.getByText('正在发言', { exact: true }).first().waitFor()
  await page.screenshot({
    path: '/tmp/journey-battle-live.png',
    fullPage: true,
  })
  const claim = page.getByRole('button', { name: '领取奖励', exact: true })
  await claim.waitFor({ timeout: 25000 })
  await page.waitForFunction(() =>
    !document.querySelector('[aria-label="胜利奖励"] button')?.disabled
  )
  assert.equal(await cueCount(65), 6, 'one cue per completed visible reply')
  assert.equal(await cueCount(720), 1, 'one finish cue')
  assert.equal(await page.getByLabel('积分余额').textContent(), '1,000')
  await claim.evaluate((button) => {
    button.click()
    button.click()
    button.click()
  })
  await page.getByRole('button', { name: '已领取', exact: true }).waitFor()
  assert.equal(await page.getByLabel('积分余额').textContent(), '1,120')
  assert.equal(await cueCount(354), 1, 'only the selected B is played')
  assert.equal((await audio()).find((x) => x.duration === 354).channels, 2)
  assert.ok(
    Math.abs((await audio()).find((x) => x.duration === 354).gain - .75) < .001,
    'payout is boosted 3x at default 25% volume',
  )
  await page.screenshot({
    path: '/tmp/journey-battle-reward.png',
    fullPage: true,
  })
  await page.reload()
  await page.getByRole('button', { name: '已领取', exact: true }).waitFor()
  assert.equal(await page.getByLabel('积分余额').textContent(), '1,120')
  assert.equal(
    (await audio()).length,
    0,
    'reload neither grants nor replays rewards',
  )
  const replayReceipt = await page.evaluate(async () =>
    (await fetch('/v1/demo/rewards/7001', { method: 'POST' })).json()
  )
  assert.equal(replayReceipt.balance, 1120)
  assert.equal(replayReceipt.newlyClaimed, false)
  await page.addScriptTag({ path: require.resolve('axe-core') })
  const violations = await page.evaluate(async () =>
    (await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    }))
  )
  // The unchanged production participant link has a known contrast violation.
  // Keep its identity explicit; all other findings, including the new reward UI, fail.
  const baselineViolations = violations.filter((v) =>
    v.id === 'color-contrast' &&
    v.targets.every((t) => t.length === 1 && t[0] === '.hover\\:opacity-90')
  )
  assert.deepEqual(
    violations.filter((v) => !baselineViolations.includes(v)),
    [],
  )
  const rewardViolations = await page.evaluate(async () =>
    (await window.axe.run(document.querySelector('[aria-label="胜利奖励"]'), {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
    })).violations
  )
  assert.deepEqual(rewardViolations, [])
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 })
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
      `${width}px battle overflow`,
    )
    await page.screenshot({
      path: `/tmp/journey-result-${width}.png`,
      fullPage: true,
    })
  }
  await page.getByRole('button', { name: '重新体验', exact: true }).click()
  await page.locator('#prompt-input').waitFor()
  assert.equal(await page.getByTestId('version-card').count(), 0)
  assert.equal(await page.locator('.fancy-caret').count(), 1)
  assert.ok(
    api.length &&
      api.every((r) =>
        r.mocked && r.url.startsWith(`${demoOrigin}/`) &&
        r.status === 200
      ),
    JSON.stringify(api.filter((r) => !r.mocked || r.status !== 200)),
  )
  assert.deepEqual(errors, [])
  console.log(
    JSON.stringify({
      passed: true,
      stages: [
        'typing',
        'save',
        'agent-home',
        'dispatch',
        'live-replies',
        'win',
        'claim',
        'reload',
        'reset',
      ],
      apiCalls: api.length,
      violations,
      errors,
    }),
  )
} finally {
  await browser.close()
}
