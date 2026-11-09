import { afterEach, describe, expect, it, vi } from 'vitest'

const posthog = vi.hoisted(() => ({
  loaded: false,
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('posthog-js', () => {
  posthog.loaded = true
  return { default: posthog }
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
  posthog.loaded = false
})

const account = {
  id: 'acc-1',
  email: 'someone@example.com',
  phone: '13800000000',
  displayName: 'Tester',
  isAdmin: false,
  hasTOTP: false,
}

describe('product analytics', () => {
  it('is on only for production builds on a real host, unless overridden', async () => {
    const { analyticsWanted } = await import('./analytics')
    const on = (prod: boolean, hostname: string, override?: string) =>
      analyticsWanted({ prod, hostname, override })
    expect(on(true, 'axiia-cup.isofucius.cn')).toBe(true)
    expect(on(false, 'axiia-cup.isofucius.cn')).toBe(false)
    expect(on(true, 'localhost')).toBe(false)
    expect(on(true, '127.0.0.1')).toBe(false)
    expect(on(true, '[::1]')).toBe(false)
    expect(on(false, '127.0.0.1', 'on')).toBe(true)
    expect(on(true, 'axiia-cup.isofucius.cn', 'off')).toBe(false)
  })

  it('stays inert in tests and dev: no import, no calls', async () => {
    const analytics = await import('./analytics')
    expect(analytics.initAnalytics()).toBeNull()
    analytics.track('logged_in', { method: 'email' })
    analytics.identifyAccount(account)
    analytics.resetAnalytics()
    expect(analytics.analyticsEnabled()).toBe(false)
    expect(posthog.loaded).toBe(false)
    expect(posthog.init).not.toHaveBeenCalled()
  })

  it('queues calls made while posthog-js loads and replays them in order', async () => {
    const analytics = await import('./analytics')
    const ready = analytics.initAnalytics(
      true,
      'phc_test',
      'https://proxy.test',
    )
    analytics.identifyAccount(account)
    analytics.track('signed_up', { method: 'phone' })
    await ready
    analytics.resetAnalytics()

    expect(posthog.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({ api_host: 'https://proxy.test' }),
    )
    expect(posthog.identify).toHaveBeenCalledWith('acc-1', {
      display_name: 'Tester',
      role: 'player',
    })
    expect(posthog.capture).toHaveBeenCalledWith('signed_up', {
      method: 'phone',
    })
    expect(posthog.identify.mock.invocationCallOrder[0]).toBeLessThan(
      posthog.capture.mock.invocationCallOrder[0],
    )
    expect(posthog.reset).toHaveBeenCalledOnce()
  })

  it('never sends email or phone as person properties', async () => {
    const analytics = await import('./analytics')
    await analytics.initAnalytics(true, 'phc_test')
    analytics.identifyAccount({ ...account, isAdmin: true })
    const properties = JSON.stringify(posthog.identify.mock.calls)
    expect(properties).not.toContain('someone@example.com')
    expect(properties).not.toContain('13800000000')
    expect(properties).toContain('"role":"admin"')
  })

  it('goes through the proxy, masks replay and scrubs autocapture text', async () => {
    const { analyticsConfig, POSTHOG_HOST, POSTHOG_KEY, scrubElementText } =
      await import('./analytics')
    expect(POSTHOG_KEY).toMatch(/^phc_/)
    const config = analyticsConfig(POSTHOG_HOST)
    expect(config.api_host).toBe('https://e.axiia.ai')
    expect(config.ui_host).toBe('https://us.posthog.com')
    expect(config.capture_pageview).toBe('history_change')
    expect(config.mask_all_text).toBe(false)
    expect(config.before_send).toBe(scrubElementText)
    expect(config.enable_heatmaps).toBe(true)
    expect(config.capture_dead_clicks).toBe(true)
    expect(config.capture_exceptions).toBe(false)
    expect(config.enable_recording_console_log).toBe(false)
    expect(config.session_recording).toMatchObject({
      blockClass: 'ph-no-capture',
      maskAllInputs: true,
      maskTextSelector: '*',
      recordHeaders: false,
      recordBody: false,
    })
    expect(config.autocapture).toMatchObject({
      capture_copied_text: false,
      capture_value_css_selector_allowlist: [],
      element_attribute_ignorelist: expect.arrayContaining([
        'aria-label',
        'title',
        'alt',
        'placeholder',
        'value',
      ]),
    })
  })

  it('masks text-bearing attributes in replay and keeps structural ones', async () => {
    const { maskAttribute } = await import('./analytics')
    expect(maskAttribute('aria-label', '我的智能体')).toBe('*****')
    expect(maskAttribute('TITLE', 'secret')).toBe('******')
    expect(maskAttribute('placeholder', 'x'.repeat(40))).toBe('*'.repeat(12))
    expect(maskAttribute('class', 'ph-no-capture block')).toBe(
      'ph-no-capture block',
    )
    expect(maskAttribute('href', '/agents/12')).toBe('/agents/12')
    expect(maskAttribute('data-track', 'save-prompt')).toBe('save-prompt')
  })

  it('keeps element text on chrome and drops it everywhere else', async () => {
    const { scrubElementText } = await import('./analytics')
    const scrub = (properties: Record<string, unknown>) =>
      scrubElementText({ uuid: 'u', event: '$autocapture', properties })
        ?.properties
    const chain = [
      'span.font-semibold:nth-child="1"nth-of-type="1"text="喝茶的小牛"',
      'button.hover:bg-white.inline-flex:attr__class="hover:bg-white inline-flex"attr__data-track="save-prompt"nth-child="2"nth-of-type="1"text="保存版本"',
      'div:attr__role="tab"nth-child="1"nth-of-type="1"text="评审"',
      'td.py-2:nth-child="2"nth-of-type="2"text="posthog-test-agent"',
    ].join(';')
    const scrubbed = scrub({ $elements_chain: chain, $el_text: '喝茶的小牛' })
    expect(scrubbed?.$elements_chain).toBe([
      'span.font-semibold:nth-child="1"nth-of-type="1"',
      'button.hover:bg-white.inline-flex:attr__class="hover:bg-white inline-flex"attr__data-track="save-prompt"nth-child="2"nth-of-type="1"text="保存版本"',
      'div:attr__role="tab"nth-child="1"nth-of-type="1"text="评审"',
      'td.py-2:nth-child="2"nth-of-type="2"',
    ].join(';'))
    expect(scrubbed?.$el_text).toBeUndefined()

    const onButton = scrub({
      $elements_chain:
        'a:href="/ladder"nth-child="1"nth-of-type="1"text="天梯"',
      $el_text: '天梯',
    })
    expect(onButton?.$el_text).toBe('天梯')

    // Escaped quotes and a ';' inside a value don't split the element.
    expect(
      scrub({
        $elements_chain:
          'p:nth-child="1"nth-of-type="1"text="say \\"hi\\"; ok";a:href="/x"nth-child="1"nth-of-type="1"text="Go"',
      })?.$elements_chain,
    ).toBe(
      'p:nth-child="1"nth-of-type="1";a:href="/x"nth-child="1"nth-of-type="1"text="Go"',
    )

    const elements = [
      { tag_name: 'td', $el_text: 'player' },
      { tag_name: 'div', attr__role: 'menuitem', $el_text: '退出' },
    ]
    expect(scrub({ $elements: elements })?.$elements).toEqual([
      { tag_name: 'td' },
      { tag_name: 'div', attr__role: 'menuitem', $el_text: '退出' },
    ])
  })

  it('fails closed on a chain it cannot parse', async () => {
    const { scrubElementText } = await import('./analytics')
    const event = scrubElementText({
      uuid: 'u',
      event: '$dead_click',
      properties: { $elements_chain: 'p:text="dangling', $el_text: 'x', a: 1 },
    })
    expect(event?.properties).toEqual({ a: 1 })
    expect(scrubElementText(null)).toBeNull()
  })
})
