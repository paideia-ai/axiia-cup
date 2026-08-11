import type { VerdictDTO } from '../api/types'

// A verdict's `output` is whatever JSON the scenario program's validator accepted,
// so the SPA reads it structurally rather than by scenario: known field names get
// a Chinese label and a stable order, everything else is rendered after them, and
// an output that is not a JSON object falls back to its own text.

// The endgame verdict: the one whose card carries the winner and the score ledger.
const TERMINAL_KEYS = new Set(['final', 'judge'])

const FIELD_LABELS: Record<string, string> = {
  schemeDecision: '连环计判定',
  selectedSide: '采信一方',
  winner: '胜方',
  judgment: '大目标裁定',
  judgments: '分案裁定',
  requests: '请求裁定',
  reason: '理由',
  reasoning: '理由',
  summary: '综述',
}

const FIELD_ORDER = [
  'schemeDecision',
  'selectedSide',
  'winner',
  'judgment',
  'judgments',
  'requests',
  'summary',
  'reason',
  'reasoning',
]

export interface VerdictField {
  key: string
  label: string
  lines: string[]
}

export interface ParsedVerdict {
  fields: VerdictField[]
  fallbackText: string | null
}

export function isTerminalVerdict(verdict: VerdictDTO): boolean {
  return TERMINAL_KEYS.has(verdict.key)
}

// A judge-aside push beat (#22①): the scenario records the judge's private aside
// as a verdict keyed `os-<round>`, its output the generated 心声 payload. It
// renders as a 心声 card, always visible — this is the authored OS layer, not a
// model trace, so 调试模式 never gates it.
const OS_BEAT_KEY = /^os-\d+$/

export function isOsBeatVerdict(verdict: VerdictDTO): boolean {
  return OS_BEAT_KEY.test(verdict.key)
}

export interface OsBeat {
  os: string | null
  // W7 对齐后的词汇（P4-S）：attention＝最挂心，favor＝当前倾向，strength＝
  // 倾向强度（离散档位文本）。老对局钉死旧脚本 sha，仍会送来 focus/tendency，
  // 解析时兜住。
  attention: string | null
  favor: string | null
  strength: string | null
  fallbackText: string | null
}

// os/attention/favor/strength is the W7-aligned vocabulary (focus/tendency the
// legacy one); another scenario's beat payload may carry none of it, in which
// case the raw output is still worth a card.
export function parseOsBeat(output: string): OsBeat {
  let payload: unknown = null
  try {
    payload = JSON.parse(output)
  } catch {
    payload = null
  }
  if (
    payload == null || typeof payload !== 'object' || Array.isArray(payload)
  ) {
    return {
      os: null,
      attention: null,
      favor: null,
      strength: null,
      fallbackText: output.trim() || null,
    }
  }
  const object = payload as Record<string, unknown>
  const text = (key: string): string | null => {
    const value = object[key]
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }
  const os = text('os')
  const attention = text('attention') ?? text('focus')
  const favor = text('favor') ?? text('tendency')
  const strength = text('strength')
  return {
    os,
    attention,
    favor,
    strength,
    fallbackText: os || attention || favor ? null : output.trim() || null,
  }
}

export function verdictLabel(key: string): string {
  if (key === 'order') return '先后裁定'
  if (TERMINAL_KEYS.has(key)) return '终局裁决'
  return key
}

function flatten(value: unknown): string[] {
  if (value == null) return []
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)]
  }
  if (Array.isArray(value)) return value.flatMap(flatten)
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, entry]) => flatten(entry).map((line) => `${key}：${line}`),
    )
  }
  return []
}

export function parseVerdict(output: string): ParsedVerdict {
  let payload: unknown = null
  try {
    payload = JSON.parse(output)
  } catch {
    payload = null
  }
  if (
    payload == null || typeof payload !== 'object' || Array.isArray(payload)
  ) {
    return { fields: [], fallbackText: output.trim() || null }
  }

  const object = payload as Record<string, unknown>
  const keys = [
    ...FIELD_ORDER.filter((key) => key in object),
    ...Object.keys(object).filter((key) => !FIELD_ORDER.includes(key)),
  ]
  const fields = keys
    .map((key) => ({
      key,
      label: FIELD_LABELS[key] ?? key,
      lines: flatten(object[key]),
    }))
    .filter((field) => field.lines.length > 0)

  return {
    fields,
    fallbackText: fields.length > 0 ? null : output.trim() || null,
  }
}
