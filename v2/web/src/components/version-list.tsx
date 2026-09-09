import type { ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Copy, Sword } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AgentVersionDTO } from '../api/types'
import {
  nextVersionCopy,
  recordCopy,
  savedAtCopy,
  versionTag,
} from '../lib/version-label'
import { tm } from '../testmode/mark'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

// 版本线（#88/E11）：EA 与 E 页共用同一套版本卡——「同一件事在哪都长一样」
// （E9）。动作集合按 #89/#90 定稿：展开全文 / 设为参赛版本 / 基于该版本迭代 /
// 出战；「复制为新智能体」已于 #90 废止，这里不再有它的位置。
// 「保存后将成为 v(N+1)」按 P12 提到段落级，只在标题行出现一次。

interface VersionListProps {
  versions: AgentVersionDTO[]
  // P4/#91：★ 是「这一侧的出战席位」，按钮要说清是哪一侧。
  sideName?: string
  compactActions?: boolean
  detailsMissing?: (versionID: number) => boolean
  onSetEntry: (versionID: number) => void
  onIterate?: (version: AgentVersionDTO) => void
  onField: (version: AgentVersionDTO) => void
  // 段落标题右侧的补充内容（E 页放 P12 提示；EA 页留空）。
  headingAside?: ReactNode
  headingAction?: ReactNode
  emptyState?: ReactNode
  // P11（Yihan 修订）：覆盖保护的两步确认必须「就地」——画进被点击的那张
  // 版本卡（不弹窗）。三个 props 都可选：EA 页不传即不渲染，共享形态不变。
  pendingIterateID?: number | null
  onConfirmIterate?: (version: AgentVersionDTO) => void
  onCancelIterate?: () => void
}

export function VersionList({
  versions,
  sideName,
  compactActions = false,
  detailsMissing,
  onSetEntry,
  onIterate,
  onField,
  headingAside,
  headingAction,
  emptyState,
  pendingIterateID,
  onConfirmIterate,
  onCancelIterate,
}: VersionListProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [overflows, setOverflows] = useState<Record<number, boolean>>({})
  const promptNodes = useRef(new Map<number, HTMLParagraphElement>())
  const [copied, setCopied] = useState<number | null>(null)
  const [copyError, setCopyError] = useState<number | null>(null)
  useEffect(() => {
    if (!compactActions) return
    let active = true
    const measure = () => {
      if (!active) return
      const next: Record<number, boolean> = {}
      for (const [id, node] of promptNodes.current) {
        // Compare to the three-line preview even while expanded, so resizing
        // can hide an unnecessary collapse control without changing the text.
        const lineHeight = Number.parseFloat(getComputedStyle(node).lineHeight)
        next[id] = node.scrollHeight > lineHeight * 3 + 1
      }
      setOverflows((current) =>
        Object.keys(current).length === Object.keys(next).length &&
          Object.entries(next).every(([id, value]) =>
            current[Number(id)] === value
          )
          ? current
          : next
      )
    }
    const observer = new ResizeObserver(measure)
    for (const node of promptNodes.current.values()) observer.observe(node)
    measure()
    void document.fonts.ready.then(measure)
    document.fonts.addEventListener('loadingdone', measure)
    return () => {
      active = false
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', measure)
    }
  }, [compactActions, versions])
  useEffect(() => {
    if (copied == null) return
    const timer = setTimeout(() => setCopied(null), 1800)
    return () => clearTimeout(timer)
  }, [copied])
  const copyPrompt = async (version: AgentVersionDTO) => {
    setCopyError(null)
    setCopied(null)
    try {
      await navigator.clipboard.writeText(version.prompt)
      setCopied(version.id)
    } catch {
      setCopyError(version.id)
    }
  }

  function expandButton(version: AgentVersionDTO) {
    if (compactActions && !overflows[version.id]) return null
    return (
      <Button
        size='sm'
        variant='ghost'
        disabled={detailsMissing?.(version.id) && !version.prompt}
        className={compactActions ? 'ml-auto h-9 w-9 p-0' : undefined}
        aria-expanded={!!expanded[version.id]}
        title={expanded[version.id] ? '收起全文' : '展开全文'}
        aria-label={expanded[version.id]
          ? `收起 ${versionTag(version, sorted)} 全文`
          : `展开 ${versionTag(version, sorted)} 全文`}
        onClick={() =>
          setExpanded((current) => ({
            ...current,
            [version.id]: !current[version.id],
          }))}
        {...tm('E.expand-button')}
      >
        {compactActions
          ? expanded[version.id]
            ? <ChevronUp aria-hidden='true' className='h-4 w-4' />
            : <ChevronDown aria-hidden='true' className='h-4 w-4' />
          : expanded[version.id]
          ? '收起'
          : '展开全文'}
      </Button>
    )
  }

  // 版本号按 id 次序派生（E2/#82），所以 id 降序＝版本号降序、最新在前。
  const sorted = [...versions].sort((a, b) => b.id - a.id)

  return (
    <section className='space-y-3' {...tm('E.version-list')}>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            版本（{sorted.length}）
          </h2>
          {headingAction}
        </div>
        {headingAside ?? (
          <span
            className='text-[11px] text-(--foreground-muted)'
            {...tm('E.version-list-aside')}
          >
            {nextVersionCopy(sorted.length)}
          </span>
        )}
      </div>

      {sorted.length === 0
        ? emptyState ?? (
          <div
            className='rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'
            {...tm('E.version-empty')}
          >
            <p className='text-sm font-medium text-(--foreground)'>
              还没有保存过版本
            </p>
            {!compactActions && (
              <p className='mt-1 text-xs text-(--foreground-muted)'>
                写下策略并保存，这里就会长出 v1。
              </p>
            )}
          </div>
        )
        : sorted.map((version) => (
          <Card
            key={version.id}
            data-testid='version-card'
            className={version.isEntry
              ? 'border-[rgba(224,74,47,0.4)]'
              : undefined}
            {...tm('E.version-card')}
          >
            <CardContent className='space-y-3 pt-5'>
              <div className='flex flex-wrap items-center gap-2'>
                {/* #25 双编号：vN（本策略序号）与 #id（全局引用号）并排 */}
                <span
                  className='text-base font-bold text-(--foreground)'
                  {...tm('E.version-tag')}
                >
                  {versionTag(version, sorted)}
                </span>
                {!detailsMissing?.(version.id) && (
                  <span
                    className='font-mono text-xs text-(--foreground-muted)'
                    {...tm('E.version-id')}
                  >
                    #{version.id}
                  </span>
                )}
                {!detailsMissing?.(version.id) && (
                  <Badge tone='info' {...tm('E.version-model-badge')}>
                    {version.modelID}
                  </Badge>
                )}
                {version.isEntry && !compactActions
                  ? (
                    <Badge tone='accent' {...tm('E.entry-badge')}>
                      ★参赛版本
                    </Badge>
                  )
                  : null}
                {compactActions && (
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    className={`ml-auto h-9 w-9 shrink-0 rounded-full border p-0 ${
                      version.isEntry
                        ? 'border-(--accent) bg-(--accent) text-white hover:bg-(--accent-hover)'
                        : 'border-(--border) text-(--foreground-subtle) hover:border-(--foreground-muted)'
                    }`}
                    aria-label={`将 ${versionTag(version, sorted)} 设为${
                      sideName ?? ''
                    }参赛版本`}
                    aria-pressed={version.isEntry}
                    title={version.isEntry ? '已用此版本参赛' : '用此版本参赛'}
                    onClick={() => {
                      if (!version.isEntry) onSetEntry(version.id)
                    }}
                    {...tm('E.set-entry-button')}
                  >
                    <Check aria-hidden='true' className='h-4 w-4' />
                  </Button>
                )}
              </div>
              {/* P15/P10：战绩、保存时间、备注——E5 与 B3 承诺过的版本身份 */}
              {!detailsMissing?.(version.id) && (
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--foreground-muted)'>
                  <span
                    data-testid='version-record'
                    {...tm('E.version-record')}
                  >
                    {recordCopy(version)}
                  </span>
                  {savedAtCopy(version)
                    ? (
                      <span
                        data-testid='version-time'
                        {...tm('E.version-time')}
                      >
                        {savedAtCopy(version)}
                      </span>
                    )
                    : null}
                  {version.note
                    ? (
                      <span
                        className='text-(--foreground-subtle)'
                        {...tm('E.version-note')}
                      >
                        备注：{version.note}
                      </span>
                    )
                    : null}
                </div>
              )}
              <p
                data-version-prompt
                ref={(node) => {
                  if (node) promptNodes.current.set(version.id, node)
                  else promptNodes.current.delete(version.id)
                }}
                className={`whitespace-pre-wrap text-sm text-(--foreground-subtle) ${
                  expanded[version.id] ? '' : 'line-clamp-3'
                }`}
                {...tm('E.version-prompt')}
              >
                {detailsMissing?.(version.id) && !version.prompt
                  ? '列表未提供此版本正文。'
                  : version.prompt}
              </p>
              <div className='flex flex-wrap items-center gap-2'>
                {!compactActions && expandButton(version)}
                {!version.isEntry && !compactActions
                  ? (
                    <Button
                      size='sm'
                      variant='secondary'
                      aria-label={`将 ${versionTag(version, sorted)} 设为${
                        sideName ?? ''
                      }参赛版本`}
                      title={sideName
                        ? `把${sideName}这一侧的出战席位交给这一版；同侧其他智能体的 ★ 会被收走`
                        : undefined}
                      onClick={() => onSetEntry(version.id)}
                      {...tm('E.set-entry-button')}
                    >
                      设为{sideName ?? ''}参赛版本
                    </Button>
                  )
                  : null}
                {compactActions
                  ? (
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      className='h-9 w-9 p-0'
                      aria-label={`复制 ${versionTag(version, sorted)} 提示词`}
                      title={copied === version.id ? '已复制' : '复制提示词'}
                      disabled={detailsMissing?.(version.id) && !version.prompt}
                      onClick={() => void copyPrompt(version)}
                    >
                      {copied === version.id
                        ? (
                          <Check
                            aria-hidden='true'
                            className='h-4 w-4 text-(--success)'
                          />
                        )
                        : <Copy aria-hidden='true' className='h-4 w-4' />}
                    </Button>
                  )
                  : onIterate
                  ? (
                    <Button
                      size='sm'
                      variant='secondary'
                      aria-label={`基于 ${versionTag(version, sorted)} 迭代`}
                      title='把这一版载入工作区继续改；本身不产生新版本'
                      onClick={() => onIterate(version)}
                      {...tm('E.iterate-button')}
                    >
                      基于该版本迭代
                    </Button>
                  )
                  : null}
                <Button
                  size='sm'
                  variant='secondary'
                  aria-label={`用 ${versionTag(version, sorted)} 出战`}
                  disabled={detailsMissing?.(version.id) && !version.prompt}
                  className={compactActions ? 'gap-1.5' : undefined}
                  onClick={() => onField(version)}
                  {...tm('E.field-button')}
                >
                  {compactActions && (
                    <Sword aria-hidden='true' className='h-4 w-4' />
                  )}
                  出战
                </Button>
                {compactActions && expandButton(version)}
              </div>
              {copyError === version.id && (
                <p role='alert' className='text-xs text-(--warning)'>
                  复制失败，请展开全文后手动复制。
                </p>
              )}
              {
                /* P11（Yihan 修订）：命中武装的那张卡就地渲染两步确认——
              确认行与「基于该版本迭代」按钮同屏，取代原页面顶部横幅 */
              }
              {pendingIterateID === version.id &&
                  onConfirmIterate != null &&
                  onCancelIterate != null
                ? (
                  <IterateConfirmRow
                    message={`工作区里有未保存的改动，基于 ${
                      versionTag(version, sorted)
                    } 迭代会覆盖它`}
                    onConfirm={() => onConfirmIterate(version)}
                    onCancel={onCancelIterate}
                  />
                )
                : null}
            </CardContent>
          </Card>
        ))}
    </section>
  )
}

// P11：卡内两步确认行（复用 E7「清空工作区」的就地确认模式，不弹窗）。
// 挂载即武装：滚进视口并把焦点交给确认行本体（round4 评审 #3：不聚焦
// 「仍要继续」——按住 Enter 的连击会在警告被读到之前就触发覆盖），
// 点击处一定看得见反馈。
function IterateConfirmRow({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const row = rowRef.current
      if (!row) return
      // jsdom 没有 scrollIntoView——守护后调用，真浏览器里滚到可视范围。
      if (typeof row.scrollIntoView === 'function') {
        row.scrollIntoView({ block: 'nearest' })
      }
      row.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div
      ref={rowRef}
      role='alert'
      tabIndex={-1}
      className='flex flex-wrap items-center gap-2 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-3 py-2.5'
      {...tm('E.iterate-confirm')}
    >
      <span className='text-xs text-(--warning)'>{message}</span>
      <Button
        size='sm'
        variant='secondary'
        onClick={onConfirm}
        {...tm('E.iterate-confirm-continue')}
      >
        仍要继续
      </Button>
      <button
        type='button'
        onClick={onCancel}
        className='cursor-pointer text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
        {...tm('E.iterate-confirm-cancel')}
      >
        取消
      </button>
    </div>
  )
}
