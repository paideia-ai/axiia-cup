import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import type { AgentVersionDTO } from '../api/types'
import {
  nextVersionCopy,
  recordCopy,
  savedAtCopy,
  versionTag,
} from '../lib/version-label'
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
  onSetEntry: (versionID: number) => void
  onIterate: (version: AgentVersionDTO) => void
  onField: (version: AgentVersionDTO) => void
  // 段落标题右侧的补充内容（E 页放 P12 提示；EA 页留空）。
  headingAside?: ReactNode
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
  onSetEntry,
  onIterate,
  onField,
  headingAside,
  emptyState,
  pendingIterateID,
  onConfirmIterate,
  onCancelIterate,
}: VersionListProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  // 版本号按 id 次序派生（E2/#82），所以 id 降序＝版本号降序、最新在前。
  const sorted = [...versions].sort((a, b) => b.id - a.id)

  return (
    <section className='space-y-3'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <h2 className='text-sm font-semibold text-(--foreground)'>
          版本（{sorted.length}）
        </h2>
        {headingAside ?? (
          <span className='text-[11px] text-(--foreground-muted)'>
            {nextVersionCopy(sorted.length)}
          </span>
        )}
      </div>

      {sorted.length === 0
        ? emptyState ?? (
          <div className='rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'>
            <p className='text-sm font-medium text-(--foreground)'>
              还没有保存过版本
            </p>
            <p className='mt-1 text-xs text-(--foreground-muted)'>
              写下策略并保存，这里就会长出 v1。
            </p>
          </div>
        )
        : sorted.map((version) => (
          <Card
            key={version.id}
            data-testid='version-card'
            className={version.isEntry
              ? 'border-[rgba(224,74,47,0.4)]'
              : undefined}
          >
            <CardContent className='space-y-3 pt-5'>
              <div className='flex flex-wrap items-center gap-2'>
                {/* #25 双编号：vN（本策略序号）与 #id（全局引用号）并排 */}
                <span className='text-base font-bold text-(--foreground)'>
                  {versionTag(version, sorted)}
                </span>
                <span className='font-mono text-xs text-(--foreground-muted)'>
                  #{version.id}
                </span>
                <Badge tone='info'>{version.modelID}</Badge>
                {version.isEntry
                  ? <Badge tone='accent'>★参赛版本</Badge>
                  : null}
              </div>
              {/* P15/P10：战绩、保存时间、备注——E5 与 B3 承诺过的版本身份 */}
              <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--foreground-muted)'>
                <span data-testid='version-record'>{recordCopy(version)}</span>
                {savedAtCopy(version)
                  ? (
                    <span data-testid='version-time'>
                      {savedAtCopy(version)}
                    </span>
                  )
                  : null}
                {version.note
                  ? (
                    <span className='text-(--foreground-subtle)'>
                      备注：{version.note}
                    </span>
                  )
                  : null}
              </div>
              <p
                className={`whitespace-pre-wrap text-sm text-(--foreground-subtle) ${
                  expanded[version.id] ? '' : 'line-clamp-3'
                }`}
              >
                {version.prompt}
              </p>
              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  size='sm'
                  variant='ghost'
                  aria-label={expanded[version.id]
                    ? `收起 ${versionTag(version, sorted)} 全文`
                    : `展开 ${versionTag(version, sorted)} 全文`}
                  onClick={() =>
                    setExpanded((current) => ({
                      ...current,
                      [version.id]: !current[version.id],
                    }))}
                >
                  {expanded[version.id] ? '收起' : '展开全文'}
                </Button>
                {!version.isEntry
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
                    >
                      设为{sideName ?? ''}参赛版本
                    </Button>
                  )
                  : null}
                {/* E3（#82，文案按 #89）：回填工作区草稿，本身不产生版本 */}
                <Button
                  size='sm'
                  variant='secondary'
                  aria-label={`基于 ${versionTag(version, sorted)} 迭代`}
                  title='把这一版载入工作区继续改；本身不产生新版本'
                  onClick={() => onIterate(version)}
                >
                  基于该版本迭代
                </Button>
                <Button
                  size='sm'
                  variant='secondary'
                  aria-label={`用 ${versionTag(version, sorted)} 出战`}
                  onClick={() => onField(version)}
                >
                  出战
                </Button>
              </div>
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
// 挂载即武装：滚进视口并把焦点交给「仍要继续」，点击处一定看得见反馈。
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
      row.querySelector('button')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div
      ref={rowRef}
      role='alert'
      className='flex flex-wrap items-center gap-2 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-3 py-2.5'
    >
      <span className='text-xs text-(--warning)'>{message}</span>
      <Button size='sm' variant='secondary' onClick={onConfirm}>
        仍要继续
      </Button>
      <button
        type='button'
        onClick={onCancel}
        className='cursor-pointer text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
      >
        取消
      </button>
    </div>
  )
}
