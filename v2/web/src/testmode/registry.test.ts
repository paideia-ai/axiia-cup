/* 登记表的一致性：id 格式、条款 / 步骤 id 存在、STEP_HINTS 指向真实步骤与标记、
   源码里用到的 tm('…') / data-tm='…' 与登记表一一对应。`deno task tm:check` 只跑这里。 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import journeys from './data/journeys.json'
import spec from './data/spec-index.json'
import { clausesForPages, pagesOfPath } from './data'
import { STEP_HINTS, TM } from './registry/index'
import { ROUTE_PAGES } from './types'

const ID_RE = /^(A|B|C|D|DA|E|EA|OS|FA|G|I|K|L|X|MA|ADM|NAV)\.[a-z0-9-]+$/
const CLAUSE_IDS = new Set(Object.keys(spec.clauses))
const STEP_IDS = new Set(
  journeys.journeys.flatMap((j) => j.steps.map((s) => s.id)),
)
const TM_IDS = Object.keys(TM)

const here = dirname(fileURLToPath(import.meta.url))
const SRC = join(here, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'testmode' && dir === SRC) continue // 测试模式自己的文件不算使用处
      walk(p, out)
    } else if (name.endsWith('.tsx')) out.push(p)
  }
  return out
}

/** 源码里出现的标记 id → 出现的文件 */
function usedIds(): Map<string, Set<string>> {
  const used = new Map<string, Set<string>>()
  const patterns = [
    /\btm\(\s*'([^']+)'\s*,?\s*\)/g, // deno fmt 换行时会补尾逗号
    /\btm\(\s*"([^"]+)"\s*,?\s*\)/g,
    /data-tm=['"]([^'"]+)['"]/g,
    /data-tm=\{\s*['"]([^'"]+)['"]\s*\}/g,
  ]
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8')
    const rel = relative(SRC, file)
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        const set = used.get(m[1]) ?? new Set<string>()
        set.add(rel)
        used.set(m[1], set)
      }
    }
  }
  return used
}

describe('测试模式登记表', () => {
  it('标记 id 都是 <页面代号>.<kebab-slug>', () => {
    const bad = TM_IDS.filter((id) => !ID_RE.test(id))
    expect(bad, `不合格式的 id：${bad.join(', ')}`).toEqual([])
  })

  it('每条 label 是 2–8 个字的人话（types.ts 的约定；弹层标题与清单行 390px 下不折行）', () => {
    const bad = TM_IDS.filter((id) => {
      const l = TM[id].label ?? ''
      return l.length < 2 || l.length > 8
    })
    expect(bad, `label 太短或太长：${bad.join(', ')}`).toEqual([])
  })

  it('clauses 里的条款 id 都在 spec-index 里', () => {
    const bad: string[] = []
    for (const id of TM_IDS) {
      for (const c of TM[id].clauses ?? []) {
        if (!CLAUSE_IDS.has(c)) bad.push(`${id} → ${c}`)
      }
    }
    expect(bad, `不存在的条款：${bad.join(', ')}`).toEqual([])
  })

  it('journeys 里的步骤 id 都在 journeys.json 里', () => {
    const bad: string[] = []
    for (const id of TM_IDS) {
      for (const s of TM[id].journeys ?? []) {
        if (!STEP_IDS.has(s)) bad.push(`${id} → ${s}`)
      }
    }
    expect(bad, `不存在的步骤：${bad.join(', ')}`).toEqual([])
  })

  it('STEP_HINTS 的键是真实步骤、marker 是已登记的标记、route 以 / 开头', () => {
    const badKeys = Object.keys(STEP_HINTS).filter((k) => !STEP_IDS.has(k))
    expect(badKeys, `不存在的步骤：${badKeys.join(', ')}`).toEqual([])
    const badMarkers = Object.entries(STEP_HINTS)
      .filter(([, h]) => h.marker && !(h.marker in TM))
      .map(([k, h]) => `${k} → ${h.marker}`)
    expect(badMarkers, `未登记的标记：${badMarkers.join(', ')}`).toEqual([])
    const badRoutes = Object.entries(STEP_HINTS)
      .filter(([, h]) => h.route && !h.route.startsWith('/'))
      .map(([k, h]) => `${k} → ${h.route}`)
    expect(badRoutes, `route 要以 / 开头：${badRoutes.join(', ')}`).toEqual([])
  })

  it('STEP_HINTS 的 marker 在自己的 journeys 里列了这一步；登记了步骤的部件那一步都有落点', () => {
    const notListed = Object.entries(STEP_HINTS)
      .filter(([s, h]) =>
        h.marker && !(TM[h.marker]?.journeys ?? []).includes(s)
      )
      .map(([s, h]) => `${s} → ${h.marker}`)
    expect(notListed, `hint 指向的部件没登记这一步：${notListed.join(', ')}`)
      .toEqual([])
    const noHint: string[] = []
    for (const id of TM_IDS) {
      for (const s of TM[id].journeys ?? []) {
        if (!STEP_HINTS[s]) noHint.push(`${id} → ${s}`)
      }
    }
    expect(noHint, `登记了步骤但 STEP_HINTS 没给落点：${noHint.join(', ')}`)
      .toEqual([])
  })

  it('加载中 / 错误 / 空态类部件统一挂 LACK-10（六个组一个口径）', () => {
    const bad = TM_IDS.filter((id) =>
      /[.-](loading|error|empty|failed|unavailable)$/.test(id) &&
      !(TM[id].clauses ?? []).includes('LACK-10')
    )
    expect(bad, `状态态部件没挂 LACK-10：${bad.join(', ')}`).toEqual([])
  })

  it('每条条款至少能在某个路由的清单里列出来（page 为空的按章节回落 + 标记反查）', () => {
    const listed = new Set<string>()
    for (const r of ROUTE_PAGES) {
      const path = r.pattern.source.replace(/^\^|\$$/g, '').replace(
        /\\\//g,
        '/',
      )
        .replace(/\[\^\/\]\+/g, '1')
      const pages = pagesOfPath(path)
      // 登录态页面都带 NAV（panelPages 的规则），这里直接把 NAV 算进去
      for (const c of clausesForPages([...pages, 'NAV'])) listed.add(c.id)
    }
    const missing = [...CLAUSE_IDS].filter((id) => !listed.has(id))
    expect(missing, `没有任何页面会列出这些条款：${missing.join(', ')}`)
      .toEqual([])
  })

  it('源码里用到的每个标记都登记过', () => {
    const used = usedIds()
    const bad = [...used.entries()]
      .filter(([id]) => !(id in TM))
      .map(([id, files]) => `${id}（${[...files].join(', ')}）`)
    expect(bad, `用了但没登记：${bad.join('; ')}`).toEqual([])
  })

  it('登记过的每个标记在源码里至少用了一次', () => {
    const used = usedIds()
    const bad = TM_IDS.filter((id) => !used.has(id))
    expect(bad, `登记了但没用上：${bad.join(', ')}`).toEqual([])
  })
})
