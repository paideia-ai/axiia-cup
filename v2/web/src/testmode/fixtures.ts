/* B3/A5 人测手册里的 {{fixture}} 解析。
   appBaseUrl 始终使用当前被测站点；其他非敏感 ID 按旅程隔离并只保存在本机。 */

export type FixtureValues = Record<string, string>

export const FIXTURE_STORAGE_KEY = 'axiia:tm:fixtures:v2'
export const FIXTURE_SESSION_STORAGE_KEY = 'axiia:tm:fixture-runtime:v1'

const RUNTIME_VARIABLES = new Set(['a5HotseatActiveMatchId'])

const FIXTURE_RE = /\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g

const FIXTURE_LABELS: Record<string, string> = {
  b3OwnerAgentId: 'B3 主智能体 ID',
  b3OwnerSiblingAgentId: 'B3 同侧兄弟智能体 ID',
  b3OwnerSoloSideAgentId: 'B3 单智能体阵营 ID',
  b3OwnerTournamentId: 'B3 锦标赛 ID',
  b3OwnerCompletedMatchId: 'B3 已完成对局 ID',
  b3MissingSideAgentId: 'B3 缺侧账号智能体 ID',
  b3PublicTargetAgentId: 'B3 公开目标智能体 ID',
  a5CoreAgentId: 'A5 双侧完整智能体 ID',
  a5CoreMissingSideAgentId: 'A5 缺侧账号智能体 ID',
  a5CoreLockedAgentId: 'A5 PVP 未解锁智能体 ID',
  a5CoreMobileAgentId: 'A5 移动端多对局智能体 ID',
  a5HotseatAgentId: 'A5 左右手互搏智能体 ID',
  a5HotseatActiveMatchId: '本轮进行中对局 ID',
  a5PvpExhaustedAgentId: 'A5 PVP 配额触顶智能体 ID',
  a5PvpExhaustedOpponentVersionId: '触顶检查对手版本 ID',
  a5PvpChallengerAgentId: 'A5 约战发起方智能体 ID',
  a5PvpOpponentVersionId: 'A5 被约方版本 ID',
}

export function fixtureLabel(name: string): string {
  return FIXTURE_LABELS[name] ?? name
}

/** 按首次出现顺序取出一组文本里的 fixture 名。 */
export function fixtureVariables(
  ...templates: Array<string | null | undefined>
): string[] {
  const names = new Set<string>()
  for (const template of templates) {
    if (!template) continue
    for (const match of template.matchAll(FIXTURE_RE)) names.add(match[1])
  }
  return [...names]
}

function substitute(
  template: string,
  values: FixtureValues,
  encodePathValues: boolean,
): { value: string; missing: string[] } {
  const missing = new Set<string>()
  const value = template.replace(FIXTURE_RE, (token, name: string) => {
    const entered = values[name]?.trim()
    if (!entered) {
      missing.add(name)
      return token
    }
    if (name === 'appBaseUrl') return entered.replace(/\/+$/, '')
    return encodePathValues ? encodeURIComponent(entered) : entered
  })
  return { value, missing: [...missing] }
}

/** 把已填 fixture 代入操作/预期文本；未填项保留双花括号，不会默默删掉。 */
export function fillFixtureText(
  template: string,
  values: FixtureValues,
): { value: string; missing: string[] } {
  return substitute(template, values, false)
}

export interface FixtureUrlResolution {
  preview: string
  href: string | null
  missing: string[]
}

/** 只有全部 URL fixture 都填好且结果是 http(s) 时才产生可打开链接。 */
export function resolveFixtureUrl(
  template: string,
  values: FixtureValues,
): FixtureUrlResolution {
  const resolved = substitute(template, values, true)
  if (resolved.missing.length > 0) {
    return { preview: resolved.value, href: null, missing: resolved.missing }
  }
  try {
    const url = new URL(resolved.value)
    const href = url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null
    return { preview: resolved.value, href, missing: href ? [] : ['URL'] }
  } catch {
    return { preview: resolved.value, href: null, missing: ['URL'] }
  }
}

function currentOrigin(): string {
  try {
    return globalThis.location.origin
  } catch {
    return ''
  }
}

function parseFixtureStore(raw: string | null): Record<string, FixtureValues> {
  const parsed = raw ? JSON.parse(raw) as unknown : null
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
  const result: Record<string, FixtureValues> = {}
  for (const [journeyId, candidate] of Object.entries(parsed)) {
    if (
      !candidate || typeof candidate !== 'object' || Array.isArray(candidate)
    ) {
      continue
    }
    result[journeyId] = Object.fromEntries(
      Object.entries(candidate).filter((entry): entry is [string, string] =>
        typeof entry[1] === 'string'
      ),
    )
  }
  return result
}

function readFixtureStore(): Record<string, FixtureValues> {
  try {
    return parseFixtureStore(localStorage.getItem(FIXTURE_STORAGE_KEY))
  } catch {
    // 隐私模式 / 损坏的旧值都回落到空 fixture。
  }
  return {}
}

function readRuntimeStore(): Record<string, FixtureValues> {
  try {
    return parseFixtureStore(
      sessionStorage.getItem(FIXTURE_SESSION_STORAGE_KEY),
    )
  } catch {
    return {}
  }
}

export function readFixtureValues(
  journeyId: string | null,
  defaults: FixtureValues = {},
): FixtureValues {
  const stored = journeyId ? readFixtureStore()[journeyId] ?? {} : {}
  const runtime = journeyId ? readRuntimeStore()[journeyId] ?? {} : {}
  return { ...defaults, ...stored, ...runtime, appBaseUrl: currentOrigin() }
}

export function writeFixtureValues(
  journeyId: string,
  values: FixtureValues,
): void {
  try {
    const { appBaseUrl: _currentSite, ...persisted } = values
    const stableValues = Object.fromEntries(
      Object.entries(persisted).filter(([name, value]) =>
        !RUNTIME_VARIABLES.has(name) && value.trim() !== ''
      ),
    )
    const store = readFixtureStore()
    store[journeyId] = stableValues
    localStorage.setItem(FIXTURE_STORAGE_KEY, JSON.stringify(store))

    const runtimeValues = Object.fromEntries(
      Object.entries(persisted).filter(([name, value]) =>
        RUNTIME_VARIABLES.has(name) && value.trim() !== ''
      ),
    )
    const runtimeStore = readRuntimeStore()
    runtimeStore[journeyId] = runtimeValues
    sessionStorage.setItem(
      FIXTURE_SESSION_STORAGE_KEY,
      JSON.stringify(runtimeStore),
    )
  } catch {
    // 这些值只为了便利；本机存储不可用时仍可在当前会话内测试。
  }
}

/** 运行时对局不能预填；只接受产品的 /matches/:id 路径，避免误抓 agent 等其他 ID。 */
export function matchIdFromUrl(input: string): string | null {
  try {
    const url = new URL(input, currentOrigin() || 'https://fixture.invalid')
    const match = url.pathname.match(/^\/matches\/([^/]+)\/?$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}
