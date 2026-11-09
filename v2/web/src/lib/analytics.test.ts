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
  it('stays inert without a key: no import, no calls', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '')
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
    const ready = analytics.initAnalytics('phc_test', 'https://proxy.test')
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
    await analytics.initAnalytics('phc_test')
    analytics.identifyAccount({ ...account, isAdmin: true })
    const properties = JSON.stringify(posthog.identify.mock.calls)
    expect(properties).not.toContain('someone@example.com')
    expect(properties).not.toContain('13800000000')
    expect(properties).toContain('"role":"admin"')
  })

  it('goes through the proxy and keeps user text out of replay and autocapture', async () => {
    const { analyticsConfig, DEFAULT_ANALYTICS_HOST } = await import(
      './analytics'
    )
    const config = analyticsConfig(DEFAULT_ANALYTICS_HOST)
    expect(config.api_host).toBe('https://e.axiia.ai')
    expect(config.ui_host).toBe('https://us.posthog.com')
    expect(config.capture_pageview).toBe('history_change')
    expect(config.mask_all_text).toBe(true)
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
})
