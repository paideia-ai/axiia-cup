/* 标记扫描：把页面上所有 [data-tm] 的位置量出来。scroll / resize / DOM 变动都只是「排一次 rAF」，
   一帧里最多量一次；量完和上一帧一样就不触发 React 重渲染。 */
import { useEffect, useState } from 'react'

export interface MarkerRect {
  /** 同一 id 可能出现多次（列表项），key 带序号 */
  key: string
  id: string
  el: HTMLElement
  top: number
  left: number
  width: number
  height: number
  /** 在视口内（带 40px 余量），徽标只画这些 */
  inView: boolean
}

export const ROOT_ATTR = 'data-tm-root'

export function collectMarkers(): MarkerRect[] {
  const out: MarkerRect[] = []
  const seen = new Map<string, number>()
  const vh = globalThis.innerHeight
  const vw = globalThis.innerWidth
  const nodes = document.querySelectorAll<HTMLElement>('[data-tm]')
  for (const el of nodes) {
    if (el.closest(`[${ROOT_ATTR}]`)) continue
    const id = el.dataset.tm ?? ''
    if (!id) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    const n = seen.get(id) ?? 0
    seen.set(id, n + 1)
    out.push({
      key: n === 0 ? id : `${id}#${n}`,
      id,
      el,
      top: Math.round(r.top),
      left: Math.round(r.left),
      width: Math.round(r.width),
      height: Math.round(r.height),
      inView: r.bottom > -40 && r.top < vh + 40 && r.right > -40 &&
        r.left < vw + 40,
    })
  }
  return out
}

function same(a: MarkerRect[], b: MarkerRect[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i]
    if (
      x.key !== y.key || x.el !== y.el || x.top !== y.top ||
      x.left !== y.left || x.width !== y.width || x.height !== y.height ||
      x.inView !== y.inView
    ) return false
  }
  return true
}

/** 页面上的标记及其视口坐标；enabled=false 时不装观察器、返回空数组。 */
export function useMarkerRects(enabled: boolean): MarkerRect[] {
  const [rects, setRects] = useState<MarkerRect[]>([])
  useEffect(() => {
    if (!enabled) {
      setRects([])
      return
    }
    let raf = 0
    const measure = () => {
      raf = 0
      const next = collectMarkers()
      setRects((prev) => (same(prev, next) ? prev : next))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    const mo = new MutationObserver((records) => {
      // 自己这层的变动不算（否则徽标一重画就再量一次，循环）
      if (
        records.every((r) => (r.target as Element).closest?.(`[${ROOT_ATTR}]`))
      ) {
        return
      }
      schedule()
    })
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-tm', 'hidden', 'style', 'class', 'open'],
    })
    globalThis.addEventListener('scroll', schedule, true)
    globalThis.addEventListener('resize', schedule)
    // 字体 / 图片晚到会改版式；补一次慢节奏的兜底
    const tick = setInterval(schedule, 1500)
    return () => {
      mo.disconnect()
      globalThis.removeEventListener('scroll', schedule, true)
      globalThis.removeEventListener('resize', schedule)
      clearInterval(tick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled])
  return rects
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  )
  useEffect(() => {
    const mq = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** 窗口是否窄（< 640）：弹层改成底部抽屉 */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() =>
    globalThis.matchMedia?.('(max-width: 639px)').matches ?? false
  )
  useEffect(() => {
    const mq = globalThis.matchMedia?.('(max-width: 639px)')
    if (!mq) return
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

/** Esc 关闭：处理函数返回 true 表示「测试模式确实关掉了什么」，只有这时才拦住事件；
   否则原样放行，产品自己的 Esc（新建弹窗 / 出战面板）照常工作。 */
export function useEscape(active: boolean, onEscape: () => boolean): void {
  useEffect(() => {
    if (!active) return
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (onEscape()) e.stopPropagation()
    }
    // capture 阶段：先于产品的 window 监听器拿到事件，才有机会决定要不要拦
    globalThis.addEventListener('keydown', on, true)
    return () => globalThis.removeEventListener('keydown', on, true)
  }, [active, onEscape])
}

/** 找到某个标记的元素并滚到视野里 */
export function scrollToMarker(
  id: string,
  smooth: boolean,
): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(
    `[data-tm="${CSS.escape(id)}"]:not([${ROOT_ATTR}] *)`,
  )
  if (!el) return null
  const r = el.getBoundingClientRect()
  const inside = r.top >= 0 && r.bottom <= globalThis.innerHeight
  if (!inside) {
    el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' })
  }
  return el
}
