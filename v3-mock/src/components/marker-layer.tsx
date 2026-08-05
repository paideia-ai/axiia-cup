// 标记系统（复刻 /v3-prototypes 的「标记」交互，改为自动扫描，无需逐元素手标）：
// - 右下角「标记」开关（或按 M）：开启后为页面上所有可指代元素（按钮/链接/输入/标题/卡片/手标 data-mark）
//   生成定位码 pill「页面码/文字slug#序号」，点击复制——反馈时直接贴码即可精确指代任意位置。
// - 页面身份角标常驻右下（页面码 + 中文名 + 路径 + 分支）：人工截图自然携带页面身份。
// - 状态存 localStorage；手标 data-mark="CODE" 优先于自动 slug。
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const MARK_KEY = 'axiia-mock-markers-on'
export const BRANCH_TAG = 'v3.4 ks版'

const PAGES: [RegExp, string, string][] = [
  [/^\/login/, 'LOGIN', '登录'],
  [/^\/register/, 'REG', '注册'],
  [/^\/scenarios\/[^/]+\/build/, 'E', '构建器'],
  [/^\/scenarios\/[^/]+/, 'DA', '场景介绍'],
  [/^\/scenarios/, 'D', '场景选择'],
  [/^\/agents\//, 'EA', '智能体视图'],
  [/^\/my-agents/, 'MA', '我的智能体'],
  [/^\/matches\//, 'FA', '战报'],
  [/^\/history/, 'H', '历史'],
  [/^\/rankings/, 'G', '排名'],
  [/^\/notifications/, 'I', '通知'],
  [/^\/settings/, 'K', '设置'],
  [/^\/express/, 'X', '首战通道'],
  [/^\/docs/, 'DOC', '文档'],
  [/^\/$/, 'LAND', '首页'],
]

function pageOf(path: string): [string, string] {
  for (const [re, code, name] of PAGES) if (re.test(path)) return [code, name]
  return ['?', path]
}

interface Pill {
  code: string
  x: number
  y: number
  w: number
  h: number
}

const SELECTOR = 'button, a, input, select, textarea, summary, [role="button"], h1, h2, h3, [data-card], [data-mark]'

function slugOf(el: Element): string {
  const manual = el.getAttribute('data-mark')
  if (manual) return manual
  const aria = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('placeholder')
  let text = (aria || el.textContent || '').replace(/\s+/g, '').trim()
  if (!text) text = el.tagName.toLowerCase()
  return text.slice(0, 10)
}

export function MarkerLayer() {
  const location = useLocation()
  const [on, setOn] = useState(() => {
    try {
      return localStorage.getItem(MARK_KEY) === '1'
    } catch {
      return false
    }
  })
  const [pills, setPills] = useState<Pill[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [pageCode, pageName] = pageOf(location.pathname)

  const scan = useCallback(() => {
    const counts = new Map<string, number>()
    const found: Pill[] = []
    for (const el of document.querySelectorAll(SELECTOR)) {
      if (el.closest('[data-marker-ui]')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 10 || rect.height < 10) continue
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) continue
      const slug = slugOf(el)
      const n = (counts.get(slug) ?? 0) + 1
      counts.set(slug, n)
      const code = el.getAttribute('data-mark') ?? `${pageCode}/${slug}${n > 1 ? `#${n}` : ''}`
      found.push({ code, x: rect.left, y: rect.top, w: rect.width, h: rect.height })
    }
    setPills(found)
  }, [pageCode])

  const toggle = useCallback(() => {
    setOn((v) => {
      const next = !v
      try {
        localStorage.setItem(MARK_KEY, next ? '1' : '0')
      } catch {
        // 忽略存储失败
      }
      return next
    })
  }, [])

  // M 键开关（输入框内不触发）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.key === 'm' || e.key === 'M') toggle()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  // 开启时：路由变化 / 滚动 / 缩放 / 定时兜底 重扫
  useEffect(() => {
    if (!on) {
      setPills([])
      return
    }
    scan()
    let raf = 0
    const onMove = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(scan)
    }
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    const iv = setInterval(scan, 1200)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
      clearInterval(iv)
      cancelAnimationFrame(raf)
    }
  }, [on, scan, location.pathname])

  const copy = (code: string) => {
    try {
      void navigator.clipboard.writeText(code)
    } catch {
      // 剪贴板不可用时忽略
    }
    setCopied(code)
    setTimeout(() => setCopied(null), 900)
  }

  return (
    <>
      {/* 标记 overlay */}
      {on && (
        <div ref={overlayRef} data-marker-ui style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none' }}>
          {pills.map((p, i) => (
            <div key={i}>
              <div
                style={{
                  position: 'fixed',
                  left: p.x,
                  top: p.y,
                  width: p.w,
                  height: p.h,
                  outline: '1px dashed rgba(224,74,47,.5)',
                  outlineOffset: '-1px',
                  pointerEvents: 'none',
                }}
              />
              <button
                type='button'
                onClick={() => copy(p.code)}
                title={`点击复制标记：${p.code}`}
                style={{
                  position: 'fixed',
                  left: p.x,
                  top: Math.max(0, p.y - 9),
                  zIndex: 9991,
                  pointerEvents: 'auto',
                  font: '600 9px/1.4 ui-monospace,Menlo,monospace',
                  background: copied === p.code ? '#2f7d4f' : 'rgba(224,74,47,.92)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '1px 4px',
                  cursor: 'copy',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied === p.code ? '✓ 已复制' : p.code}
              </button>
            </div>
          ))}
        </div>
      )}
      {/* 常驻页面身份角标 + 标记开关（截图自然携带页面名） */}
      <div
        data-marker-ui
        style={{
          position: 'fixed',
          right: 12,
          bottom: 12,
          zIndex: 9995,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            font: '600 10px/1.5 ui-monospace,Menlo,monospace',
            background: 'rgba(10,10,10,.82)',
            border: '1px solid rgba(255,255,255,.16)',
            color: 'rgba(255,255,255,.85)',
            borderRadius: 6,
            padding: '3px 8px',
            textAlign: 'right',
          }}
        >
          <span style={{ color: '#ff8a65' }}>{pageCode}</span> {pageName} · {location.pathname}
          <span style={{ opacity: 0.55 }}> · {BRANCH_TAG}</span>
        </div>
        <button
          type='button'
          onClick={toggle}
          title='标记模式：为所有元素显示可复制的定位码（快捷键 M）'
          style={{
            pointerEvents: 'auto',
            font: '700 11px/1 ui-monospace,Menlo,monospace',
            background: on ? '#e04a2f' : 'rgba(10,10,10,.82)',
            color: on ? '#fff' : 'rgba(255,255,255,.75)',
            border: '1px solid ' + (on ? '#e04a2f' : 'rgba(255,255,255,.2)'),
            borderRadius: 999,
            padding: '7px 12px',
            cursor: 'pointer',
          }}
        >
          🏷 {on ? '标记 · 开' : '标记'}
        </button>
      </div>
    </>
  )
}
