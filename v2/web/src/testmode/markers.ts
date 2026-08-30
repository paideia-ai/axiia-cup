/* 徽标的语义：一个标记登记了什么、该显示成哪种（正常 / 未映射 / 未登记），以及徽标在视口里怎么摆。 */
import { type MarkerRect, ROOT_ATTR } from './dom'
import { TM } from './registry/index'
import type { BadgeMode } from './index'
import type { Box } from './ui'

export interface BadgeSpec {
  key: string
  id: string
  x: number
  y: number
  text: string
  aria: string
  kind: 'ok' | 'gap' | 'unknown'
  box: Box
}

export function describeMarker(id: string): {
  label: string
  count: string
  aria: string
  kind: 'ok' | 'gap' | 'unknown'
} {
  const entry = TM[id]
  if (!entry) {
    return {
      label: '未登记的标记',
      count: '未登记',
      aria: `标记 ${id}，登记表里没有这一条`,
      kind: 'unknown',
    }
  }
  const nc = entry.clauses?.length ?? 0
  const na = entry.anchors?.length ?? 0
  const nj = entry.journeys?.length ?? 0
  if (nc === 0 && na === 0) {
    return {
      label: entry.label,
      count: '未映射',
      aria: `标记 ${id}：${entry.label}，没有对应的规格条款`,
      kind: 'gap',
    }
  }
  const parts: string[] = []
  if (nc) parts.push(`${nc} 规`)
  else if (na) parts.push(`${na} 锚`)
  if (nj) parts.push(`${nj} 旅`)
  return {
    label: entry.label,
    count: parts.join(' · '),
    aria: `标记 ${id}：${entry.label}，${nc} 条规格${
      na ? `、${na} 个规格锚` : ''
    }${nj ? `、${nj} 个旅程步骤` : ''}`,
    kind: 'ok',
  }
}

const BADGE_H = 16
/** 11px 等宽字：ASCII ≈ 6.8px，汉字 / 全角 ≈ 10px（徽标里的「未映射」「规 · 旅」） */
export function badgeWidth(id: string, text: string): number {
  let w = 18
  for (const ch of id + text) w += ch.charCodeAt(0) > 0x2e7f ? 10 : 6.8
  return Math.round(w)
}

interface Placed {
  x: number
  y: number
  w: number
}
function hits(a: Placed, b: Placed): boolean {
  return Math.abs(a.y - b.y) < BADGE_H - 2 && a.x < b.x + b.w + 4 &&
    a.x + a.w + 4 > b.x
}

const REPLACED = /^(IMG|SVG|CANVAS|VIDEO|INPUT|TEXTAREA|SELECT)$/

function glyphHits(el: Element, box: Placed): boolean {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let n = 0
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    if (!t.nodeValue?.trim()) continue
    if (++n > 60) return false // 大容器：点落在它自己的留白上，不逐字查了
    const range = document.createRange()
    range.selectNodeContents(t)
    for (const g of range.getClientRects()) {
      if (
        g.width > 0 && box.x < g.right - 1 && box.x + box.w > g.left + 1 &&
        box.y < g.bottom - 1 && box.y + BADGE_H > g.top + 1
      ) return true
    }
  }
  return false
}

/** 徽标框里有没有「看得见的东西」：图片 / 图标 / 输入框（不是标记本身的）、或任何字形框。
   在框里取 6 个点，看每个点下面（穿过测试模式自己的层）是什么元素，再查它的文字有没有压进框里；
   容器的留白不算——徽标压在留白上没关系，压在字上才是问题。 */
function boxFree(c: Placed, self: HTMLElement): boolean {
  const seen = new Set<Element>()
  for (const dx of [6, c.w / 2, c.w - 6]) {
    for (const dy of [4, BADGE_H - 4]) {
      const el = document.elementsFromPoint(c.x + dx, c.y + dy).find((e) =>
        !e.closest(`[${ROOT_ATTR}]`)
      )
      if (!el || seen.has(el)) continue
      seen.add(el)
      if (el instanceof SVGElement || REPLACED.test(el.tagName)) {
        if (el !== self) return false
        continue
      }
      if (glyphHits(el, c)) return false
    }
  }
  return true
}

/** 摆徽标：候选位置依次是 元素上方 → 内部右上角 → 内部左上角 → 上方靠右 → 下方 → 下方靠右；
   取第一个不压字、不叠别的徽标、在视口内的；都不行就退回上方。
   同一 id 在屏上出现 ≥3 次（列表行）只给第一个画徽标并标 ×N。 */
export function layoutBadges(
  rects: MarkerRect[],
  opts: { vw: number; mode: BadgeMode; skipKey?: string | null },
): BadgeSpec[] {
  const placed: Placed[] = []
  const out: BadgeSpec[] = []
  const vw = opts.vw
  const vh = globalThis.innerHeight
  const inView = rects.filter((r) => r.inView)
  const countById = new Map<string, number>()
  for (const r of inView) countById.set(r.id, (countById.get(r.id) ?? 0) + 1)
  const seen = new Set<string>()
  for (const r of inView) {
    if (r.key === opts.skipKey) continue
    const d = describeMarker(r.id)
    if (opts.mode === 'mapped' && d.kind === 'gap') continue
    const n = countById.get(r.id) ?? 1
    if (n >= 3) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
    }
    const text = n >= 3 ? `${d.count} ×${n}` : d.count
    const w = badgeWidth(r.id, text)
    const clampX = (x: number) => Math.max(2, Math.min(x, vw - w - 4))
    const right = r.left + r.width
    const bottom = r.top + r.height
    const candidates: Placed[] = [
      { x: clampX(r.left), y: r.top - BADGE_H - 5, w },
      { x: clampX(right - w - 2), y: r.top + 2, w },
      { x: clampX(r.left + 2), y: r.top + 2, w },
      { x: clampX(right - w), y: r.top - BADGE_H - 5, w },
      { x: clampX(r.left), y: bottom + 5, w },
      { x: clampX(right - w), y: bottom + 5, w },
    ]
    let pick: Placed | null = null
    for (const c of candidates) {
      if (c.y < 2 || c.y + BADGE_H > vh - 2) continue
      if (placed.some((p) => hits(p, c))) continue
      if (!boxFree(c, r.el)) continue
      pick = c
      break
    }
    if (!pick) {
      // 都压着东西：退回上方（或视口顶端），只保证不叠别的徽标
      pick = { x: clampX(r.left), y: Math.max(2, r.top - BADGE_H - 5), w }
      let guard = 0
      while (placed.some((p) => hits(p, pick!)) && guard++ < 8) {
        pick = { x: pick.x, y: pick.y + BADGE_H + 2, w }
      }
    }
    placed.push(pick)
    out.push({
      key: r.key,
      id: r.id,
      x: pick.x,
      y: pick.y,
      text,
      aria: n >= 3 ? `${d.aria}，本页共 ${n} 处` : d.aria,
      kind: d.kind,
      box: { top: r.top, left: r.left, width: r.width, height: r.height },
    })
  }
  return out
}
