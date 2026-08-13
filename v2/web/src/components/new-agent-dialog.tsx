import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { agents, ApiError } from '../api/client'
import type { ScenarioSummary, Side } from '../api/types'
import { cn } from '../lib/cn'
import { rejectCopy } from '../lib/reject-copy'
import { Button } from './ui/button'
import { Input } from './ui/input'

// 新建智能体弹窗（P6 #56/#59/#63，mock V2/V10）：场景固定、执方二选一（打开
// 时预选来源侧）、可选自起名（≤30 字、实时计数，#63 展示为「侧角色名「自起
// 名」」）。POST /v1/agents 成功 → 直接进入该 agent 的构建器；
// sibling_gate（#59/#79 引导门）→ reject-copy 文案 + 「先创建对侧」CTA（切侧
// 不关窗，mock V2 口径）；name_too_long → 名字输入框旁就地提示；旧服务器没有
// 这个端点（404/405）→ 一句功能提示降级，绝不半坏表单。

// 与服务端 BuilderRoutes 的 agentNameLimit 一致（P6：短标签，不是文档）。
export const AGENT_NAME_LIMIT = 30

interface NewAgentDialogProps {
  scenario: ScenarioSummary
  initialSide: Side
  onClose: () => void
}

export function NewAgentDialog({
  scenario,
  initialSide,
  onClose,
}: NewAgentDialogProps) {
  const navigate = useNavigate()
  const [side, setSide] = useState<Side>(initialSide)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  // 三个互斥的错误落点：引导门面板 / 名字行内 / 通用一行。
  const [gateError, setGateError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [onClose])

  const sideName = (which: Side) =>
    which === 'a' ? scenario.sideAName : scenario.sideBName
  const opposite: Side = side === 'a' ? 'b' : 'a'

  // 计数按码点（Array.from），与服务端 Swift 的字符计数对齐：汉字=1。
  const nameLength = [...name].length
  const tooLong = nameLength > AGENT_NAME_LIMIT

  const pickSide = (which: Side) => {
    setSide(which)
    setGateError(null)
    setNameError(null)
    setError(null)
  }

  const submit = async () => {
    const trimmed = name.trim()
    setBusy(true)
    setGateError(null)
    setNameError(null)
    setError(null)
    try {
      const { agentID } = await agents.create({
        scenarioID: scenario.id,
        side,
        // 空名不发 key（契约 optionals-absent），服务端视作未命名。
        name: trimmed === '' ? undefined : trimmed,
      })
      onClose()
      navigate(`/agents/${agentID}/build`)
      return
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'sibling_gate') {
        setGateError(rejectCopy(cause, null))
      } else if (cause instanceof ApiError && cause.code === 'name_too_long') {
        // 文案走 lib/reject-copy；该码尚未入映射表时会回落到服务端英文
        // message——那种情况用本地文案兜底，不给玩家看英文。
        const copy = rejectCopy(cause, null)
        setNameError(
          copy === cause.message
            ? `名字太长了——最多 ${AGENT_NAME_LIMIT} 字，删几个再试`
            : copy,
        )
      } else if (
        cause instanceof ApiError &&
        (cause.status === 404 || cause.status === 405)
      ) {
        // 优雅降级：多智能体批次的后端还没部署时给功能提示，不装死。
        setError(
          '当前服务器还不支持新建多个智能体——该功能随后端更新自动开放，现有智能体不受影响',
        )
      } else if (cause instanceof ApiError) {
        setError(rejectCopy(cause, null, '创建智能体失败'))
      } else {
        // 网络层失败（fetch TypeError 等）：给中文提示，不透传英文报错。
        setError('网络开小差了——请检查连接后重试')
      }
      setBusy(false)
    }
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6'
      role='dialog'
      aria-modal='true'
      aria-labelledby='new-agent-title'
      onClick={onClose}
    >
      <div
        className='max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border border-(--border-soft) bg-(--surface) shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:max-w-md md:rounded-xl'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='flex items-start justify-between gap-3 border-b border-(--border-soft) px-5 py-4'>
          <div className='min-w-0'>
            <h2
              id='new-agent-title'
              className='text-base font-semibold text-(--foreground)'
            >
              新建智能体 · {scenario.title}
            </h2>
            <p className='mt-0.5 text-xs text-(--foreground-muted)'>
              智能体属于场景的一侧；先选执方，名字可起可不起。
            </p>
          </div>
          {
            /* 触控目标 ≥44px（16px 图标 + 14px 内边距×2）；负外边距抵消
            视觉占位，图标大小不变 */
          }
          <button
            type='button'
            aria-label='关闭'
            onClick={onClose}
            className='-m-2 rounded-md p-3.5 text-(--foreground-muted) transition hover:bg-white/4 hover:text-(--foreground)'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        <div className='space-y-4 px-5 py-4'>
          <div className='space-y-1.5'>
            <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
              选择执方
            </p>
            <div className='inline-flex items-center gap-1 rounded-full border border-(--border-soft) bg-white/2 p-1'>
              {(['a', 'b'] as const).map((which) => (
                <button
                  key={which}
                  type='button'
                  aria-pressed={side === which}
                  onClick={() => pickSide(which)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                    side === which
                      ? 'bg-white/10 text-(--foreground)'
                      : 'text-(--foreground-subtle) hover:text-(--foreground)',
                  )}
                >
                  {which === 'a' ? '甲方' : '乙方'} · {sideName(which)}
                </button>
              ))}
            </div>
          </div>

          <div className='space-y-1.5'>
            <label
              htmlFor='new-agent-name'
              className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'
            >
              自起名（可选）——展示为「{sideName(side)}「你起的名」」
            </label>
            <Input
              id='new-agent-name'
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(null)
              }}
              placeholder={`如「铁腕${sideName(side)}」`}
            />
            <div className='flex items-center justify-between gap-2 text-[11px]'>
              <span className='text-(--accent)'>
                {nameError ??
                  (tooLong ? `名字最多 ${AGENT_NAME_LIMIT} 字` : '')}
              </span>
              <span
                className={tooLong
                  ? 'font-semibold text-(--accent)'
                  : 'text-(--foreground-muted)'}
              >
                {nameLength}/{AGENT_NAME_LIMIT}
              </span>
            </div>
          </div>

          {/* #59/#79 引导门：文案来自 reject-copy，引导按 mock V2 口径切侧 */}
          {gateError
            ? (
              <div className='space-y-2 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-3 py-2.5'>
                <p className='text-sm text-(--warning)'>{gateError}</p>
                <p className='text-xs text-(--foreground-muted)'>
                  想再建一个{sideName(side)}？先创建一个{sideName(opposite)}
                  ——两边都要会写才是真本事。两侧都有后不再受限；迭代现有智能体的版本不受此门约束。
                </p>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => pickSide(opposite)}
                >
                  先创建{sideName(opposite)}
                </Button>
              </div>
            )
            : null}

          {error ? <p className='text-sm text-(--accent)'>{error}</p> : null}

          <div className='flex items-center justify-end gap-2 pt-1'>
            <Button variant='secondary' onClick={onClose}>
              取消
            </Button>
            <Button
              data-testid='create-agent'
              disabled={busy || tooLong}
              onClick={() => void submit()}
            >
              {busy ? '创建中…' : '创建并进入构建'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
