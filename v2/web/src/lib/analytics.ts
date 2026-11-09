// Product analytics (PostHog). Off unless the build bakes in VITE_POSTHOG_KEY:
// without a key nothing is imported and no request leaves the browser, which
// keeps dev, tests, storybook and previews clean. CI feeds the key from the
// GitHub repo variable POSTHOG_KEY (see v2/README.md, "Product analytics").
//
// Privacy is a hard requirement: no prompt text, transcript or other user
// content may leave the browser. Autocapture sends no element text and no
// text-bearing attributes; session replay masks every text node and input
// and the same attributes; prompt and transcript surfaces are additionally
// blocked from replay and autocapture with NO_CAPTURE.
import type { PostHog, PostHogConfig } from 'posthog-js'

import type { AccountDTO, Side } from '../api/types'

// Our reverse proxy to PostHog US cloud. The browser never talks to
// posthog.com directly: mainland users see slow or dropped requests there.
export const DEFAULT_ANALYTICS_HOST = 'https://e.axiia.ai'
const UI_HOST = 'https://us.posthog.com'

// Class that removes an element's subtree from session replay (rrweb
// blockClass) and makes autocapture ignore clicks inside it.
export const NO_CAPTURE = 'ph-no-capture'

// Attributes that can carry user-authored text (agent names, prompt
// excerpts, display names). Dropped from autocapture and masked in replay.
export const TEXT_ATTRIBUTES = [
  'alt',
  'aria-braillelabel',
  'aria-description',
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'download',
  'label',
  'placeholder',
  'summary',
  'title',
  'value',
] as const

const textAttributes = new Set<string>(TEXT_ATTRIBUTES)

export function maskAttribute(name: string, value: string): string {
  return textAttributes.has(name.toLowerCase())
    ? '*'.repeat(Math.min(value.length, 12))
    : value
}

type AuthMethod = 'email' | 'phone'

// The core funnel. Keep this list in sync with v2/README.md.
export interface AnalyticsEvents {
  signed_up: { method: AuthMethod }
  logged_in: { method: AuthMethod }
  agent_created: {
    scenario_id: string
    side: Side
    agent_id: number
    source: 'create' | 'entry'
  }
  prompt_saved: {
    scenario_id: string
    agent_id: number
    version_id: number
    version_ordinal?: number
    prompt_length: number
    express: boolean
  }
  match_started: {
    kind: 'first_battle' | 'pve' | 'pvp' | 'challenge' | 'ladder'
    scenario_id?: string
    match_id?: number
  }
  match_result_viewed: {
    match_id: number
    scenario_id: string
    match_kind: string
    initiated_by_me?: boolean
  }
}

export function analyticsConfig(apiHost: string): Partial<PostHogConfig> {
  return {
    api_host: apiHost,
    ui_host: UI_HOST,
    defaults: '2026-08-30',
    // React Router navigations are history changes; the initial load counts too.
    capture_pageview: 'history_change',
    person_profiles: 'identified_only',
    autocapture: {
      capture_copied_text: false,
      element_attribute_ignorelist: [...TEXT_ATTRIBUTES],
      capture_value_css_selector_allowlist: [],
    },
    mask_all_text: true,
    // Error messages and console lines can quote user content; local config
    // wins over the project's remote settings for both.
    capture_exceptions: false,
    enable_recording_console_log: false,
    session_recording: {
      blockClass: NO_CAPTURE,
      maskAllInputs: true,
      maskTextSelector: '*',
      maskAttributeFn: maskAttribute,
      recordHeaders: false,
      recordBody: false,
    },
  }
}

const buildKey =
  (import.meta.env.VITE_POSTHOG_KEY as string | undefined)?.trim() ?? ''
const buildHost =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.trim() ||
  DEFAULT_ANALYTICS_HOST

let client: PostHog | null = null
// Calls made while posthog-js is still loading; null when idle or disabled.
let pending: Array<(posthog: PostHog) => void> | null = null

export function analyticsEnabled() {
  return client != null || pending != null
}

// Loads and starts PostHog when a key is configured; otherwise does nothing.
export function initAnalytics(
  key: string = buildKey,
  host: string = buildHost,
): Promise<void> | null {
  if (!key || analyticsEnabled()) return null
  pending = []
  return import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, analyticsConfig(host))
    client = posthog
    const queued = pending ?? []
    pending = null
    for (const call of queued) call(posthog)
  }).catch(() => {
    pending = null
  })
}

function withClient(call: (posthog: PostHog) => void) {
  if (client) call(client)
  else pending?.push(call)
}

export function track<E extends keyof AnalyticsEvents>(
  event: E,
  properties: AnalyticsEvents[E],
) {
  withClient((posthog) => posthog.capture(event, properties))
}

// Person properties stop at display name and role: never email or phone.
export function identifyAccount(account: AccountDTO) {
  withClient((posthog) =>
    posthog.identify(account.id, {
      display_name: account.displayName,
      role: account.isAdmin ? 'admin' : 'player',
    })
  )
}

export function resetAnalytics() {
  withClient((posthog) => posthog.reset())
}
