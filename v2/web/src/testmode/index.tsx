/* 测试模式入口：只管开关、药丸和按需加载。关着的时候只有一次 localStorage 读；
   开着才把 overlay 分块（徽标层 / 弹层 / 清单 / 导测 + 规格与旅程 JSON）拉进来。
   在 <BrowserRouter> 里挂一次（app-router.tsx），每个路由（含首页 / 登录 / 注册）都能用。 */
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

import { BASE_CSS } from './styles'
import { getIdentity, IDENTITY_EVENT } from './supabase'

const TM_KEY = 'axiia:tm'
const BADGES_KEY = 'axiia:tm:badges'

const Surface = lazy(() => import('./overlay'))

/** 标记三态：全部 / 只标有条款的（密集页轻 30%）/ 关 */
export type BadgeMode = 'all' | 'mapped' | 'off'
export interface TmUi {
  badges: BadgeMode
  panel: boolean
  guided: boolean
  identity: boolean
}
export type SetUi = (patch: Partial<TmUi>) => void

const BADGE_NEXT: Record<BadgeMode, BadgeMode> = {
  all: 'mapped',
  mapped: 'off',
  off: 'all',
}
const BADGE_TITLE: Record<BadgeMode, string> = {
  all: '标记：全部显示（点一下只留有条款的）',
  mapped: '标记：只标有条款的（点一下隐藏）',
  off: '标记：已隐藏（点一下全部显示）',
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 隐私模式：本次会话内仍然生效
  }
}
function readBadges(): BadgeMode {
  const v = read(BADGES_KEY)
  return v === '0' ? 'off' : v === 'mapped' ? 'mapped' : 'all'
}

export function TestModeRoot() {
  const location = useLocation()
  const navigate = useNavigate()
  // 初始值就看一眼 ?tm=：带 tm=0 打开时不能先按「开」渲染一帧（那会把 overlay 分块拉下来）
  const [on, setOn] = useState(() => {
    const v = new URLSearchParams(location.search).get('tm')
    if (v === '0') return false
    if (v === '1') return true
    return read(TM_KEY) === '1'
  })
  const [ui, setUiState] = useState<TmUi>(() => ({
    badges: readBadges(),
    panel: false,
    guided: false,
    identity: false,
  }))
  const [who, setWho] = useState(() => getIdentity()?.name ?? null)
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null
    const el = document.createElement('div')
    el.setAttribute('data-tm-root', '')
    return el
  })

  // ?tm=1 开、?tm=0 关，然后把参数从地址栏擦掉（replace），不留在分享出去的链接里。
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get('tm')
    if (v === null) return
    if (v === '1') {
      write(TM_KEY, '1')
      setOn(true)
    } else if (v === '0') {
      write(TM_KEY, '0')
      setOn(false)
    }
    params.delete('tm')
    const search = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
        hash: location.hash,
      },
      { replace: true },
    )
  }, [location.search, location.pathname, location.hash, navigate])

  useEffect(() => {
    if (!on || !host) return
    document.body.appendChild(host)
    return () => {
      host.remove()
    }
  }, [on, host])

  // 产品的移动端底栏（AppShell 里 fixed bottom-0 的 nav）：量它的高度，药丸 / 抽屉都让开它。
  useEffect(() => {
    if (!on || !host) return
    const measure = () => {
      const nav = document.querySelector<HTMLElement>('nav.fixed.bottom-0')
      const h = nav && nav.getClientRects().length > 0 ? nav.offsetHeight : 0
      host.style.setProperty('--tm-nav', `${h}px`)
    }
    const raf = requestAnimationFrame(measure)
    globalThis.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      globalThis.removeEventListener('resize', measure)
    }
  }, [on, host, location.pathname])

  useEffect(() => {
    if (!on) return
    const refresh = () => setWho(getIdentity()?.name ?? null)
    globalThis.addEventListener(IDENTITY_EVENT, refresh)
    globalThis.addEventListener('storage', refresh)
    return () => {
      globalThis.removeEventListener(IDENTITY_EVENT, refresh)
      globalThis.removeEventListener('storage', refresh)
    }
  }, [on])

  const setUi = useCallback<SetUi>((patch) => {
    setUiState((u) => {
      const next = { ...u, ...patch }
      if ('badges' in patch) {
        write(
          BADGES_KEY,
          next.badges === 'off'
            ? '0'
            : next.badges === 'mapped'
            ? 'mapped'
            : '1',
        )
      }
      // 窄屏：清单与导测都是底部弹层，同时开会叠在一起——开一个就收另一个
      if (globalThis.matchMedia?.('(max-width: 639px)').matches) {
        if (patch.panel) next.guided = false
        if (patch.guided) next.panel = false
      }
      return next
    })
  }, [])

  const close = useCallback(() => {
    write(TM_KEY, '0')
    setOn(false)
    setUiState((u) => ({ ...u, panel: false, guided: false, identity: false }))
  }, [])

  if (!on || !host) return null

  return createPortal(
    <>
      <style>{BASE_CSS}</style>
      <nav
        className={`tm-pill${ui.panel ? ' tm-pill--drawer' : ''}`}
        aria-label='测试模式'
      >
        <span className='tm-pill-dot' aria-hidden='true' />
        <span className='tm-pill-name'>测试模式</span>
        <button
          type='button'
          className='tm-pill-btn'
          aria-pressed={ui.badges !== 'off'}
          title={BADGE_TITLE[ui.badges]}
          aria-label={BADGE_TITLE[ui.badges]}
          onClick={() => setUi({ badges: BADGE_NEXT[ui.badges] })}
        >
          标记{ui.badges === 'mapped' ? '·条款' : ''}
        </button>
        <button
          type='button'
          className='tm-pill-btn'
          aria-pressed={ui.guided}
          title='导测：按旅程手册一步步走，逐步确认'
          onClick={() => setUi({ guided: !ui.guided })}
        >
          导测
        </button>
        <button
          type='button'
          className='tm-pill-btn'
          aria-pressed={ui.panel}
          title='清单：本页的规格行、旅程、部件'
          onClick={() => setUi({ panel: !ui.panel })}
        >
          清单
        </button>
        <button
          type='button'
          className='tm-pill-btn tm-pill-btn--who'
          title={who
            ? `当前身份：${who}（点击修改）`
            : '设置身份：名字 + 口令，写看板时用'}
          aria-label={who ? `身份：${who}，点击修改` : '设置身份'}
          onClick={() => setUi({ identity: true })}
        >
          {who
            ? (
              <>
                <span className='tm-pill-who-k' aria-hidden='true'>身份</span>
                {who}
              </>
            )
            : '设置身份'}
        </button>
        <button
          type='button'
          className='tm-pill-btn tm-pill-btn--x'
          aria-label='关闭测试模式'
          title='关闭测试模式（?tm=1 可再打开）'
          onClick={close}
        >
          ✕
        </button>
      </nav>
      <Suspense fallback={null}>
        <Surface ui={ui} setUi={setUi} />
      </Suspense>
    </>,
    host,
  )
}
