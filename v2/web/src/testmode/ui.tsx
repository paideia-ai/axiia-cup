/* 测试模式里反复出现的小部件：条款行、锚 chip、复制按钮、提示条、身份对话框、高亮框。 */
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { anchorUrl, type Clause, CLAUSES, clauseUrl, IMPL_LABEL } from './data'
import { type Identity, type Role } from './supabase'

export function ImplChip({ impl }: { impl: Clause['impl'] }) {
  return (
    <span
      className={`tm-chip tm-chip--${impl}`}
      title={`实现状态：${IMPL_LABEL[impl]}`}
    >
      {IMPL_LABEL[impl]}
    </span>
  )
}

/** 一行条款：id · 规格原话 · 实现状态；整行是到看板那一行的链接 */
export function ClauseRow(
  { id, lead, clamp = true }: { id: string; lead?: ReactNode; clamp?: boolean },
) {
  const c = CLAUSES[id]
  if (!c) {
    return (
      <div className='tm-row'>
        {lead}
        <span className='tm-row-id'>{id}</span>
        <span className='tm-row-q tm-muted'>（索引里没有这条）</span>
      </div>
    )
  }
  return (
    <div className='tm-row'>
      {lead}
      <a
        className='tm-row-id'
        href={clauseUrl(id)}
        target='_blank'
        rel='noreferrer'
        title={`在看板里打开 ${id}`}
      >
        {id}
      </a>
      <span className={`tm-row-q${clamp ? ' tm-clamp' : ''}`} title={c.q}>
        {c.q}
      </span>
      <ImplChip impl={c.impl} />
    </div>
  )
}

export function AnchorChips({ anchors }: { anchors: string[] }) {
  return (
    <div className='tm-chips'>
      {anchors.map((a) => (
        <a
          key={a}
          className='tm-chip tm-ext'
          href={anchorUrl(a)}
          target='_blank'
          rel='noreferrer'
          title={`v3.4 规格原文：${a}`}
        >
          {a}
        </a>
      ))}
    </div>
  )
}

export function ClauseChips({ ids }: { ids: string[] }) {
  return (
    <div className='tm-chips'>
      {ids.map((id) => {
        const c = CLAUSES[id]
        return (
          <a
            key={id}
            className={`tm-chip${c ? ` tm-chip--${c.impl}` : ''}`}
            href={clauseUrl(id)}
            target='_blank'
            rel='noreferrer'
            title={c ? `${c.q}（${IMPL_LABEL[c.impl]}）` : id}
          >
            {id}
          </a>
        )
      })}
    </div>
  )
}

export function copyText(text: string): Promise<void> {
  return navigator.clipboard?.writeText(text).catch(() => {}) ??
    Promise.resolve()
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type='button'
      className='tm-copy'
      aria-label={`复制 ${text}`}
      onClick={() => {
        void copyText(text).then(() => {
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        })
      }}
    >
      {done ? '已复制' : '复制'}
    </button>
  )
}

export interface ToastMessage {
  kind: 'ok' | 'err'
  body: ReactNode
}

export function Toast(
  { toast, onClose }: { toast: ToastMessage | null; onClose: () => void },
) {
  // 只按 toast 本身计时：onClose 每次渲染换一个闭包也不重置 8 秒
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!toast || toast.kind === 'err') return
    const t = setTimeout(() => closeRef.current(), 8000)
    return () => clearTimeout(t)
  }, [toast])
  return (
    <div role='status' aria-live='polite'>
      {toast
        ? (
          <div
            className={`tm-surface tm-toast${
              toast.kind === 'err' ? ' tm-toast--err' : ''
            }`}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>{toast.body}</div>
              <button
                type='button'
                className='tm-x'
                aria-label='关闭提示'
                onClick={onClose}
              >
                ×
              </button>
            </div>
          </div>
        )
        : null}
    </div>
  )
}

export function IdentityDialog(
  { initial, pending, onSave, onClose }: {
    initial: Identity | null
    /** 是哪一下确认把对话框叫出来的（「看到了」），有就把它写进标题和按钮 */
    pending?: string | null
    onSave: (id: Identity) => void
    onClose: () => void
  },
) {
  const [name, setName] = useState(initial?.name ?? '')
  const [pwd, setPwd] = useState(initial?.pwd ?? '')
  const [role, setRole] = useState<Role>(initial?.role ?? 'tester')
  const [err, setErr] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    nameRef.current?.focus()
  }, [])
  return (
    <div
      className='tm-scrim'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        className='tm-surface tm-modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby='tm-identity-title'
        aria-describedby='tm-identity-lede'
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return setErr('名字不能为空')
          if (!pwd) return setErr('口令不能为空')
          onSave({ name: name.trim(), pwd, role })
        }}
      >
        <div className='tm-h'>
          <div className='tm-h-title' id='tm-identity-title'>
            {pending ? '先署个名' : '身份'}
          </div>
          <button
            type='button'
            className='tm-x'
            aria-label='关闭'
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className='tm-body'>
          <p
            className='tm-muted'
            id='tm-identity-lede'
            style={{ margin: '0 0 6px' }}
          >
            {pending
              ? `要把「${pending}」记到看板，需要署名。`
              : '写看板的记录会署这个名。'}
            名字填飞书显示名；口令向 Yihan 或 Minsheng 要——和 spec
            看板同一份，填一次处处可用。
          </p>
          <label className='tm-label' htmlFor='tm-id-name'>名字</label>
          <input
            id='tm-id-name'
            ref={nameRef}
            className='tm-input'
            value={name}
            autoComplete='nickname'
            onChange={(e) => setName(e.target.value)}
          />
          <label className='tm-label' htmlFor='tm-id-pwd'>口令</label>
          <input
            id='tm-id-pwd'
            className='tm-input'
            type='password'
            value={pwd}
            autoComplete='current-password'
            onChange={(e) => setPwd(e.target.value)}
          />
          <span className='tm-label' id='tm-id-role'>我是</span>
          <div className='tm-seg' role='group' aria-labelledby='tm-id-role'>
            <button
              type='button'
              aria-pressed={role === 'tester'}
              onClick={() => setRole('tester')}
            >
              测试者
            </button>
            <button
              type='button'
              aria-pressed={role === 'core'}
              onClick={() => setRole('core')}
            >
              核心成员
            </button>
          </div>
          <p className='tm-dimt' style={{ margin: '4px 0 0', fontSize: 11.5 }}>
            核心成员的记录在看板上算裁决，测试者的算观察。
          </p>
          {err ? <div className='tm-err' role='alert'>{err}</div> : null}
          <div className='tm-actions'>
            <button type='submit' className='tm-btn tm-btn--primary'>
              {pending ? '保存并记录' : '保存身份'}
            </button>
            <button
              type='button'
              className='tm-btn tm-btn--ghost'
              onClick={onClose}
            >
              取消
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export interface Box {
  top: number
  left: number
  width: number
  height: number
}

export function HighlightBox({ box, flash }: { box: Box; flash?: boolean }) {
  return (
    <div
      className={`tm-hl${flash ? ' tm-hl--flash' : ''}`}
      style={{
        top: box.top - 2,
        left: box.left - 2,
        width: box.width + 4,
        height: box.height + 4,
      }}
    />
  )
}
