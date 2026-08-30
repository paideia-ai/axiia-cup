/* 看板（Supabase）写入 + 身份存储。身份的 localStorage 键与 spec 看板相同，登录一次处处可用。
   只有导测里的明确点击才会调用 recordStep；这里不做任何自动写入。 */

const SB_URL = 'https://xxfaohdyljlwhdbwjqmr.supabase.co'
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4ZmFvaGR5bGpsd2hkYndqcW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NjkxMDgsImV4cCI6MjA5ODU0NTEwOH0.I2ps861GN43rXe2E4mjAG5_Lz6-7hxoYLitKvwG9G0w'

export const NAME_KEY = 'axiia-decisions:me'
export const PW_KEY = 'axiia-decisions:pw'
export const ROLE_KEY = 'axiia:tm:role'
export const IDENTITY_EVENT = 'axiia:tm:identity'

export type Role = 'core' | 'tester'
export type Choice = 'pass' | 'fail' | 'skip'
export interface Identity {
  name: string
  pwd: string
  role: Role
}

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

/** 名字 + 口令都在才算有身份 */
export function getIdentity(): Identity | null {
  const name = read(NAME_KEY).trim()
  const pwd = read(PW_KEY)
  if (!name || !pwd) return null
  return { name, pwd, role: read(ROLE_KEY) === 'core' ? 'core' : 'tester' }
}

export function setIdentity(id: Identity): void {
  try {
    localStorage.setItem(NAME_KEY, id.name.trim())
    localStorage.setItem(PW_KEY, id.pwd)
    localStorage.setItem(ROLE_KEY, id.role)
  } catch {
    // 隐私模式下写不进去也不该炸；本次会话内仍可用（调用方持有对象）
  }
  globalThis.dispatchEvent(new Event(IDENTITY_EVENT))
}

export const BUILD_SHA =
  (import.meta.env.VITE_COMMIT_SHA as string | undefined) ?? 'dev'

export type TmErrorKind = 'pwd' | 'network' | 'server'
export class TmError extends Error {
  kind: TmErrorKind
  constructor(kind: TmErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

export function describeError(e: unknown): string {
  if (e instanceof TmError) {
    if (e.kind === 'pwd') {
      return '口令不对，没写进看板。向 Yihan 或 Minsheng 要口令，在「身份」里重填后再点一次。'
    }
    if (e.kind === 'network') {
      return '网络不通，没写进看板。检查网络后再点一次。'
    }
    return `看板拒绝了这次写入（${e.message}）。再试一次；还不行就把这句话发给 Minsheng。`
  }
  return '写入失败，原因不明。再试一次。'
}

export async function rpc(
  fn: 'set_pick' | 'post_comment',
  body: Record<string, unknown>,
): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: SB_ANON,
        Authorization: `Bearer ${SB_ANON}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new TmError('network', 'fetch failed')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (/password|口令|pwd/i.test(text) || res.status === 401) {
      throw new TmError('pwd', text)
    }
    throw new TmError('server', `${res.status} ${text.slice(0, 120)}`)
  }
  const ct = res.headers.get('content-type') ?? ''
  return ct.includes('json') ? res.json().catch(() => null) : null
}

export interface StepRecordInput {
  stepId: string
  clauseIds: string[]
  primary: string[]
  choice: Choice
  note: string
  identity: Identity
}
export interface StepRecordResult {
  picks: string[]
  commentedOn: string | null
}

/** 一步确认的扇出：每条条款一条 set_pick，写了备注就在主条款下留一条评论，再记一条步骤级进度。 */
export async function recordStep(
  input: StepRecordInput,
): Promise<StepRecordResult> {
  const { identity, stepId, choice } = input
  const note = JSON.stringify({
    build: { web: BUILD_SHA },
    role: identity.role,
    via: `guided:${stepId}`,
    step: stepId,
    at: new Date().toISOString(),
  })
  const pick = (card: string) =>
    rpc('set_pick', {
      p_card: card,
      p_author: identity.name,
      p_choice: choice,
      p_note: note,
      p_pwd: identity.pwd,
    })
  const clauseCards = input.clauseIds.map((c) => `ss:${c}`)
  // 先写第一条：口令错就在这里停下，不会留下一半。
  if (clauseCards.length > 0) await pick(clauseCards[0])
  await Promise.all(clauseCards.slice(1).map(pick))
  await pick(`pjg:${stepId}`)

  const primary = input.primary[0] ?? input.clauseIds[0] ?? null
  const trimmed = input.note.trim()
  let commentedOn: string | null = null
  if (trimmed && primary) {
    await rpc('post_comment', {
      p_card: `ss:${primary}`,
      p_author: identity.name,
      p_body: `[导测 ${stepId}] ${trimmed}`,
      p_parent: null,
      p_pwd: identity.pwd,
    })
    commentedOn = primary
  }
  return { picks: input.clauseIds, commentedOn }
}

/* ── 导测进度（本机） ─────────────────────────────────────────────── */
export interface StepProgress {
  choice: Choice
  at: string
}
export type JourneyProgress = Record<string, StepProgress>

export function progressKey(journeyId: string): string {
  return `axiia:tm:guided:${journeyId}`
}
export function readProgress(journeyId: string): JourneyProgress {
  try {
    const raw = localStorage.getItem(progressKey(journeyId))
    return raw ? (JSON.parse(raw) as JourneyProgress) : {}
  } catch {
    return {}
  }
}
export function writeProgress(journeyId: string, p: JourneyProgress): void {
  try {
    localStorage.setItem(progressKey(journeyId), JSON.stringify(p))
  } catch {
    // 同上：写不进去不炸
  }
}
