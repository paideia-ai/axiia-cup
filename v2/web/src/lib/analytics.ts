// Product analytics (PostHog). On only in production builds served from a
// real host: dev, tests, Storybook and the localhost previews of a production
// build never import posthog-js and make no request. VITE_ANALYTICS=on turns
// it on anywhere (the local demo); VITE_ANALYTICS=off turns it off.
//
// Privacy is a hard requirement: no prompt text, transcript or other user
// content may leave the browser. Session replay records the UI's own text
// (headings, labels, buttons, scenario copy) so recordings are readable, and
// blocks every element carrying NO_CAPTURE: prompts, versions and diffs,
// transcripts, judge dialogue and verdicts, and people's and agents' names.
// Inputs and text-bearing attributes stay masked everywhere. Autocapture
// keeps element text only on interactive chrome (links, buttons, labels,
// tabs, menu items; see scrubElementText) so click lists read as "保存版本"
// rather than bare selectors; NO_CAPTURE drops user content from that text
// too.
//
// Rendering new user content? Put NO_CAPTURE on its element.
import type { CaptureResult, PostHog, PostHogConfig } from 'posthog-js'

import type { AccountDTO, Side } from '../api/types'

// The project key is public by design: it can only send events.
export const POSTHOG_KEY = 'phc_y9FZzcSeVMgjWNfchrjYXjVehwKRU9jUPmbFZgzxoZtf'
// Our reverse proxy to PostHog US cloud. The browser never talks to
// posthog.com directly: mainland users see slow or dropped requests there.
export const POSTHOG_HOST = 'https://e.axiia.ai'
const UI_HOST = 'https://us.posthog.com'

const LOCAL_HOST = /^(localhost|127(\.\d{1,3}){3}|\[::1\]|0\.0\.0\.0)$/

export function analyticsWanted({ prod, override, hostname }: {
  prod: boolean
  override: string | undefined
  hostname: string
}): boolean {
  if (override === 'on') return true
  if (override === 'off') return false
  return prod && !LOCAL_HOST.test(hostname)
}

function wantedHere() {
  return analyticsWanted({
    prod: import.meta.env.PROD,
    override: (import.meta.env.VITE_ANALYTICS as string | undefined)?.trim(),
    hostname: globalThis.location?.hostname ?? '',
  })
}

// Class that removes an element's subtree from session replay (rrweb
// blockClass: the recording keeps only an empty box of the same size) and
// makes autocapture ignore clicks inside it. Replay text is otherwise
// recorded, so every element showing user content must carry it.
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

// Autocapture element text survives only on interactive chrome. Clicks on
// plain text (a transcript line, a table cell with a player name) carry no
// text; NO_CAPTURE inside chrome already keeps names out of the chrome's own
// text, because posthog-js skips NO_CAPTURE subtrees when it collects it.
const CHROME_TAGS = new Set(['a', 'button', 'label', 'summary'])
const CHROME_ROLES = new Set([
  'button',
  'checkbox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'switch',
  'tab',
])

function isChrome(tag: string | undefined, role: string | undefined) {
  return CHROME_TAGS.has((tag ?? '').toLowerCase()) ||
    CHROME_ROLES.has((role ?? '').toLowerCase())
}

interface ChainElement {
  tag: string | undefined
  prefix: string
  pairs: Array<[string, string]>
}

// One element of $elements_chain: `tag.class…:key="value"key="value"…`, with
// `"` in values escaped as `\"`. Returns null when it doesn't parse.
function parseChainElement(element: string): ChainElement | null {
  const tag = /^[a-z][a-z0-9-]*/i.exec(element)?.[0]
  const firstValue = element.indexOf('="')
  if (firstValue < 0) return { tag, prefix: element, pairs: [] }
  let keyStart = firstValue
  while (keyStart > 0 && /[\w$-]/.test(element[keyStart - 1])) keyStart--
  const pairs: Array<[string, string]> = []
  let at = keyStart
  while (at < element.length) {
    const eq = element.indexOf('="', at)
    if (eq < 0) return null
    const key = element.slice(at, eq)
    if (!/^[\w$-]+$/.test(key)) return null
    let end = eq + 2
    while (end < element.length && element[end] !== '"') {
      end += element[end] === '\\' && element[end + 1] === '"' ? 2 : 1
    }
    if (end >= element.length) return null
    pairs.push([key, element.slice(eq + 2, end)])
    at = end + 1
  }
  return { tag, prefix: element.slice(0, keyStart), pairs }
}

function chainElementIsChrome({ tag, pairs }: ChainElement) {
  return isChrome(tag, pairs.find(([key]) => key === 'attr__role')?.[1])
}

function scrubChainElement(element: string): string | null {
  const parsed = parseChainElement(element)
  if (!parsed) return null
  if (chainElementIsChrome(parsed)) return element
  return parsed.prefix +
    parsed.pairs.filter(([key]) => key !== 'text')
      .map(([key, value]) => `${key}="${value}"`).join('')
}

function splitChain(chain: string): string[] | null {
  const elements: string[] = []
  let start = 0
  let quoted = false
  for (let at = 0; at < chain.length; at++) {
    const char = chain[at]
    if (quoted) {
      if (char === '\\' && chain[at + 1] === '"') at++
      else if (char === '"') quoted = false
    } else if (char === '"') quoted = true
    else if (char === ';') {
      elements.push(chain.slice(start, at))
      start = at + 1
    }
  }
  if (quoted) return null
  elements.push(chain.slice(start))
  return elements
}

export function scrubElementsChain(chain: string): string | null {
  const scrubbed = splitChain(chain)?.map(scrubChainElement)
  return !scrubbed || scrubbed.includes(null) ? null : scrubbed.join(';')
}

interface CapturedElement {
  tag_name?: string
  attr__role?: string
  $el_text?: string
}

// before_send: applies to $autocapture, $rageclick and $dead_click alike.
// Fails closed: an unparseable chain loses its text altogether.
export function scrubElementText(
  event: CaptureResult | null,
): CaptureResult | null {
  const properties = event?.properties
  if (!properties) return event
  const elements = properties.$elements as CapturedElement[] | undefined
  const chain = properties.$elements_chain as string | undefined
  if (elements == null && chain == null && properties.$el_text == null) {
    return event
  }
  let targetIsChrome = false
  if (Array.isArray(elements)) {
    for (const element of elements) {
      if (!isChrome(element.tag_name, element.attr__role)) {
        delete element.$el_text
      }
    }
    const target = elements[0]
    targetIsChrome = target != null &&
      isChrome(target.tag_name, target.attr__role)
  }
  if (typeof chain === 'string') {
    const scrubbed = scrubElementsChain(chain)
    if (scrubbed == null) {
      delete properties.$elements_chain
      delete properties.$elements
      delete properties.$el_text
      return event
    }
    properties.$elements_chain = scrubbed
    const target = parseChainElement(splitChain(scrubbed)?.[0] ?? '')
    targetIsChrome = targetIsChrome ||
      (target != null && chainElementIsChrome(target))
  }
  if (!targetIsChrome) delete properties.$el_text
  return event
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
    // Element text is on so clicks are readable; scrubElementText keeps it
    // to interactive chrome.
    mask_all_text: false,
    before_send: scrubElementText,
    enable_heatmaps: true,
    capture_dead_clicks: true,
    // Error messages and console lines can quote user content; local config
    // wins over the project's remote settings for both.
    capture_exceptions: false,
    enable_recording_console_log: false,
    session_recording: {
      blockClass: NO_CAPTURE,
      maskAllInputs: true,
      maskAttributeFn: maskAttribute,
      recordHeaders: false,
      recordBody: false,
    },
  }
}

let client: PostHog | null = null
// Calls made while posthog-js is still loading; null when idle or disabled.
let pending: Array<(posthog: PostHog) => void> | null = null

export function analyticsEnabled() {
  return client != null || pending != null
}

// Loads and starts PostHog where analytics is wanted; otherwise does nothing.
export function initAnalytics(
  wanted: boolean = wantedHere(),
  key: string = POSTHOG_KEY,
  host: string = POSTHOG_HOST,
): Promise<void> | null {
  if (!wanted || !key || analyticsEnabled()) return null
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
