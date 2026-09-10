import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1060 },
  })
  const errors = []
  const responses = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/v1/')) {
      responses.push({
        url: response.url(),
        mocked: response.fromServiceWorker(),
      })
    }
  })
  await page.addInitScript(() => {
    if (!localStorage.getItem('axiia.typing-preview.v1')) {
      localStorage.setItem(
        'axiia.typing-preview.v1',
        JSON.stringify({
          voice: 'wood',
          caret: 'glow',
          enabled: true,
          volume: 25,
        }),
      )
    }
    window.audioEvents = []
    const original = AudioBufferSourceNode.prototype.start
    AudioBufferSourceNode.prototype.start = function (...args) {
      const samples = this.buffer.getChannelData(0)
      window.audioEvents.push({
        peak: samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0),
        duration: this.buffer.duration,
      })
      return original.apply(this, args)
    }
  })
  await page.goto('http://localhost:5214/journey-demo.html')
  await page.getByLabel('策略提示词', { exact: true }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  const editor = page.locator('#prompt-input')
  const caret = page.locator('.fancy-caret')
  const count = () => page.evaluate(() => window.audioEvents.length)
  const settle = () => page.waitForTimeout(110)
  await editor.click()
  await editor.press('Control+End')
  await settle()
  let before = await count()
  await editor.pressSequentially('test', { delay: 65 })
  assert.equal(await count() - before, 4, 'one sound per typed character')
  await settle()
  before = await count()
  await editor.press('ArrowLeft')
  await editor.press('ArrowRight')
  assert.equal(await count(), before, 'navigation is silent')
  await editor.press('Enter')
  await settle()
  assert.equal(await count() - before, 1, 'newline cue')
  await editor.press('Backspace')
  await settle()
  assert.equal(await count() - before, 2, 'deletion cue')
  await editor.press('Control+z')
  await settle()
  assert.equal(await count() - before, 2, 'undo remains silent')

  // Chromium's native composition pipeline; this is not a physical OS IME test.
  const cdp = await page.context().newCDPSession(page)
  before = await count()
  await cdp.send('Input.imeSetComposition', {
    text: 'nihao',
    selectionStart: 5,
    selectionEnd: 5,
  })
  await settle()
  assert.equal(
    await editor.evaluate((e) => e.classList.contains('custom-caret')),
    false,
  )
  assert.equal(await caret.evaluate((e) => e.hidden), true)
  assert.equal(await count(), before, 'preedit is silent')
  await cdp.send('Input.insertText', { text: '你好' })
  await settle()
  assert.equal(await count() - before, 1, 'one cue on Chinese commit')
  assert.equal(
    await editor.evaluate((e) => e.classList.contains('custom-caret')),
    true,
  )

  before = await count()
  await page.evaluate(() => {
    const field = document.querySelector('textarea')
    field.setRangeText(
      '粘贴的整段策略。\n'.repeat(100),
      field.selectionStart,
      field.selectionEnd,
      'end',
    )
    field.dispatchEvent(
      new InputEvent('input', { inputType: 'insertFromPaste', bubbles: true }),
    )
  })
  await settle()
  assert.equal(await count() - before, 1, 'bulk paste emits only one cue')

  await editor.press('Control+a')
  await settle()
  assert.equal(
    await caret.evaluate((e) => e.hidden),
    true,
    'selection hides caret',
  )
  await editor.press('ArrowRight')
  await editor.press('Control+End')
  await settle()
  assert.equal(
    await caret.evaluate((e) => e.hidden),
    false,
    'caret follows scrolled end',
  )
  const fieldBox = await editor.boundingBox()
  const caretBox = await caret.boundingBox()
  assert.ok(
    caretBox.y >= fieldBox.y && caretBox.y < fieldBox.y + fieldBox.height,
  )
  await editor.evaluate((e) => {
    e.scrollTop = 0
  })
  await settle()
  assert.equal(
    await caret.evaluate((e) => e.hidden),
    true,
    'offscreen caret hidden',
  )
  await editor.fill('你是本能寺之变中的细川藤孝。')
  await settle()
  await page.getByRole('button', { name: '静音柔音' }).click()
  await editor.click()
  await settle()
  before = await count()
  await editor.pressSequentially('silent', { delay: 60 })
  assert.equal(await count(), before, 'mute suppresses typing audio')
  await page.getByRole('button', { name: '开启柔音' }).click()
  await settle()
  assert.equal(await count(), before + 1, 'enabling sound auditions soft voice')
  assert.equal(
    await page.getByRole('button', { name: /清透轻点|圆木|柔光|弹性短线|原生/ })
      .count(),
    0,
    'no alternative selectors remain',
  )
  await editor.focus()
  await editor.press('Control+End')
  await settle()
  assert.equal(
    await caret.evaluate((e) => getComputedStyle(e).height),
    '3px',
    'fixed underline ignores old glow preference',
  )

  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await caret.locator('span').evaluate((e) =>
      getComputedStyle(e).animationName
    ),
    'none',
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.screenshot({
    path: '/tmp/journey-typing-desktop.png',
    fullPage: true,
  })
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await settle()
    assert.equal(
      await page.evaluate(() =>
        document.documentElement.scrollWidth > innerWidth
      ),
      false,
      `no overflow at ${width}px`,
    )
    if (width === 375) {
      await page.screenshot({
        path: '/tmp/journey-typing-mobile.png',
        fullPage: true,
      })
    }
  }
  const samples = await page.evaluate(() => window.audioEvents)
  assert.ok(
    samples.every((s) => s.peak > 0 && s.peak < 0.5 && s.duration < 0.12),
    'audible bounded waveforms',
  )
  await page.getByRole('slider', { name: '柔音音量' }).fill('35')
  await page.reload()
  await page.getByLabel('策略提示词', { exact: true }).waitFor()
  assert.equal(
    await page.getByRole('slider', { name: '柔音音量' }).inputValue(),
    '35',
    'volume preference persists',
  )
  await page.getByRole('button', { name: '让你的AI帮你想策略' }).click()
  assert.ok(
    await page.getByRole('dialog').isVisible(),
    'real helper dialog works',
  )
  await page.keyboard.press('Escape')
  await page.getByText('角色系统提示词', { exact: true }).click()
  assert.ok(
    await page.getByText(
      '比赛时系统会自动合并这份角色模板，无需复制到策略提示词。',
      { exact: true },
    ).isVisible(),
  )
  await editor.fill('先明确风险，再追问可验证的承诺。')
  await page.getByRole('button', { name: '保存并返回主页' }).click()
  await page.getByRole('heading', { name: '智能体构建器' }).waitFor({
    state: 'hidden',
  })
  await page.getByTestId('version-card').nth(1).waitFor()
  assert.equal(
    await page.getByTestId('version-card').count(),
    2,
    'saved version appears on real agent home',
  )
  await page.getByRole('button', { name: '新建版本' }).click()
  await page.waitForFunction(() =>
    document.querySelector('#prompt-input')?.value ===
      '先明确风险，再追问可验证的承诺。'
  )
  await editor.focus()
  await editor.press('Control+End')
  await settle()
  before = await count()
  await editor.pressSequentially('!', { delay: 60 })
  assert.equal(
    await count() - before,
    1,
    'feedback reattaches once after returning from agent home',
  )
  assert.ok(
    responses.length > 0 &&
      responses.every((r) =>
        r.mocked && r.url.startsWith('http://localhost:5214/')
      ),
    'all API responses are local mocks',
  )
  assert.deepEqual(errors, [])
  console.log(
    'PASS: typing, navigation, enter/delete, undo, native Chromium composition, paste, selection, scroll, mute, fixed soft voice and underline, reduced motion, 320–1440px, bounded audio, preferences, original builder helper/save interactions, local mocked API only.',
  )
} finally {
  await browser.close()
}
