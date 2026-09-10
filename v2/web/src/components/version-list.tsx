import { Check, ChevronDown, ChevronUp, Copy, Sword } from 'lucide-react'
import type { ReactNode } from 'react'
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

interface VersionListProps {
  versions: AgentVersionDTO[]
  sideName?: string
  onSetEntry: (versionID: number) => void
  entryBusy?: boolean
  pendingEntryID?: number | null
  onField: (version: AgentVersionDTO) => void
  fieldMarker?: string
  headingAside?: ReactNode
  headingAction?: ReactNode
  emptyState?: ReactNode
  detailsMissing?: (versionID: number) => boolean
}

export function VersionList({
  versions,
  sideName,
  onSetEntry,
  entryBusy = false,
  pendingEntryID = null,
  onField,
  fieldMarker,
  headingAside,
  headingAction,
  emptyState,
  detailsMissing,
}: VersionListProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [overflows, setOverflows] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState<number | null>(null)
  const [copyError, setCopyError] = useState<number | null>(null)
  const promptNodes = useRef(new Map<number, HTMLParagraphElement>())

  // Expand is only offered when the current three-line preview actually clips.
  // Re-measure on responsive layout and font changes, not just on first paint.
  useEffect(() => {
    let active = true
    const measure = () => {
      if (!active) return
      const next: Record<number, boolean> = {}
      for (const [id, node] of promptNodes.current) {
        const style = getComputedStyle(node)
        const parsedLineHeight = Number.parseFloat(style.lineHeight)
        const fontSize = Number.parseFloat(style.fontSize)
        const lineHeight = Number.isFinite(parsedLineHeight)
          ? parsedLineHeight
          : fontSize * 1.75
        next[id] = node.scrollHeight > Math.ceil(lineHeight * 3) + 1
      }
      setOverflows((current) => {
        const currentKeys = Object.keys(current)
        const nextEntries = Object.entries(next)
        if (
          currentKeys.length === nextEntries.length &&
          nextEntries.every(([id, value]) => current[Number(id)] === value)
        ) return current
        return next
      })
    }

    const frame = requestAnimationFrame(measure)
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(measure)
    for (const node of promptNodes.current.values()) observer?.observe(node)
    globalThis.addEventListener('resize', measure)

    const fonts = document.fonts
    void fonts?.ready.then(measure)
    fonts?.addEventListener('loadingdone', measure)
    return () => {
      active = false
      cancelAnimationFrame(frame)
      observer?.disconnect()
      globalThis.removeEventListener('resize', measure)
      fonts?.removeEventListener('loadingdone', measure)
    }
  }, [versions])

  useEffect(() => {
    if (copied == null) return
    const timer = setTimeout(() => setCopied(null), 1800)
    return () => clearTimeout(timer)
  }, [copied])

  const sorted = [...versions].sort((a, b) => b.id - a.id)

  const copyPrompt = async (version: AgentVersionDTO) => {
    setCopied(null)
    setCopyError(null)
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(version.prompt)
      setCopied(version.id)
    } catch {
      setCopyError(version.id)
    }
  }

  const toggleExpanded = (versionID: number) => {
    setExpanded((current) => ({
      ...current,
      [versionID]: !current[versionID],
    }))
  }

  return (
    <section className='space-y-3' {...tm('E.version-list')}>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-1'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            版本（{sorted.length}）
          </h2>
          {headingAction}
        </div>
        {headingAside === undefined
          ? (
            <span
              className='text-[11px] text-(--foreground-muted)'
              {...tm('E.version-list-aside')}
            >
              {nextVersionCopy(sorted.length)}
            </span>
          )
          : headingAside}
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
          </div>
        )
        : sorted.map((version) => {
          const unavailable = detailsMissing?.(version.id) && !version.prompt
          const tag = versionTag(version, sorted)
          return (
            <Card
              key={version.id}
              data-testid='version-card'
              className={version.isEntry
                ? 'border-[rgba(224,74,47,0.48)] shadow-none'
                : 'shadow-none'}
              {...tm('E.version-card')}
            >
              <CardContent className='space-y-3 pt-5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span
                    className='text-base font-bold text-(--foreground)'
                    {...tm('E.version-tag')}
                  >
                    {tag}
                  </span>
                  {!detailsMissing?.(version.id)
                    ? (
                      <>
                        <span
                          className='font-mono text-xs text-(--foreground-muted)'
                          {...tm('E.version-id')}
                        >
                          #{version.id}
                        </span>
                        <Badge tone='info' {...tm('E.version-model-badge')}>
                          {version.modelID}
                        </Badge>
                      </>
                    )
                    : null}
                  <span
                    className='ml-auto inline-flex'
                    {...(version.isEntry ? tm('E.entry-badge') : {})}
                  >
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      className={`h-11 w-11 shrink-0 cursor-pointer rounded-full border p-0 md:h-9 md:w-9 ${
                        version.isEntry
                          ? 'border-(--accent) bg-(--accent) text-white hover:bg-(--accent-hover)'
                          : 'border-(--border) text-(--foreground-subtle) hover:border-(--foreground-muted)'
                      }`}
                      aria-label={`将 ${tag} 设为${sideName ?? ''}参赛版本`}
                      aria-pressed={version.isEntry}
                      title={version.isEntry
                        ? '已用此版本参赛'
                        : pendingEntryID === version.id
                        ? '正在设置参赛版本'
                        : '用此版本参赛'}
                      disabled={entryBusy}
                      aria-busy={pendingEntryID === version.id || undefined}
                      onClick={() => {
                        if (!version.isEntry) onSetEntry(version.id)
                      }}
                      {...tm('E.set-entry-button')}
                    >
                      <Check aria-hidden='true' className='h-4 w-4' />
                    </Button>
                  </span>
                </div>

                {!detailsMissing?.(version.id)
                  ? (
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--foreground-muted)'>
                      <span
                        data-testid='version-record'
                        {...tm('E.version-record')}
                      >
                        {recordCopy(version)}
                      </span>
                      {version.note?.trim()
                        ? (
                          <span
                            className='break-words text-(--foreground-subtle)'
                            {...tm('E.version-note')}
                          >
                            备注：{version.note.trim()}
                          </span>
                        )
                        : null}
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
                    </div>
                  )
                  : null}

                <p
                  data-version-prompt
                  ref={(node) => {
                    if (node) promptNodes.current.set(version.id, node)
                    else promptNodes.current.delete(version.id)
                  }}
                  className={`whitespace-pre-wrap wrap-anywhere text-[15px] leading-7 text-(--foreground-subtle) ${
                    expanded[version.id] ? '' : 'line-clamp-3'
                  }`}
                  {...tm('E.version-prompt')}
                >
                  {unavailable ? '列表未提供此版本正文。' : version.prompt}
                </p>

                <div className='flex items-center gap-1.5'>
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    className='h-11 w-11 shrink-0 cursor-pointer p-0 md:h-9 md:w-9'
                    aria-label={`复制 ${tag} 提示词`}
                    title={copied === version.id ? '已复制' : '复制提示词'}
                    disabled={unavailable}
                    onClick={() => void copyPrompt(version)}
                    {...tm('E.copy-button')}
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
                  <span
                    className='inline-flex'
                    {...(fieldMarker ? { 'data-tm': fieldMarker } : {})}
                  >
                    <Button
                      type='button'
                      size='sm'
                      variant='secondary'
                      className='h-11 cursor-pointer gap-1.5 px-3 md:h-9'
                      soundFeedback
                      aria-label={`用 ${tag} 出战`}
                      disabled={unavailable}
                      onClick={() => onField(version)}
                      {...tm('E.field-button')}
                    >
                      <Sword aria-hidden='true' className='h-4 w-4' />
                      出战
                    </Button>
                  </span>
                  {overflows[version.id]
                    ? (
                      <Button
                        type='button'
                        size='sm'
                        variant='ghost'
                        className='ml-auto h-11 w-11 shrink-0 cursor-pointer p-0 md:h-9 md:w-9'
                        aria-expanded={!!expanded[version.id]}
                        aria-label={expanded[version.id]
                          ? `收起 ${tag} 全文`
                          : `展开 ${tag} 全文`}
                        title={expanded[version.id] ? '收起全文' : '展开全文'}
                        disabled={unavailable}
                        onClick={() => toggleExpanded(version.id)}
                        {...tm('E.expand-button')}
                      >
                        {expanded[version.id]
                          ? (
                            <ChevronUp
                              aria-hidden='true'
                              className='h-4 w-4'
                            />
                          )
                          : (
                            <ChevronDown
                              aria-hidden='true'
                              className='h-4 w-4'
                            />
                          )}
                      </Button>
                    )
                    : null}
                </div>
                {copied === version.id
                  ? <span role='status' className='sr-only'>{tag} 已复制</span>
                  : null}
                {copyError === version.id
                  ? (
                    <p role='alert' className='text-xs text-(--warning)'>
                      复制失败，请展开全文后手动复制。
                    </p>
                  )
                  : null}
              </CardContent>
            </Card>
          )
        })}
    </section>
  )
}
