import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { builder, catalog } from '../api/client'
import type { AgentVersionDTO, VersionDiffResponse } from '../api/types'
import { OsPanel } from '../components/os-panel'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { messageOf, useAsync } from '../lib/use-async'

// EA 智能体主页（B3）：版本卡（新在前）+ ★参赛版本切换 + 「编辑此版本」
// （#70）+ 页头「编辑」（#75）+「出战」呼出 OS 面板 + diff（自己的 agent，
// #20 允许）。#81–#84（编辑草稿/分支语义）未定：此页只做已确认的 v3.4 语义，
// 不加额外的草稿/分支 UI。
export function AgentViewPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const navigate = useNavigate()

  const { data, error, reload } = useAsync(async () => {
    const draft = await builder.draft(agentID)
    const [scenario, list] = await Promise.all([
      catalog.scenario(draft.scenarioID, draft.side),
      builder.versions(agentID),
    ])
    return {
      draft,
      scenario,
      versions: list.versions,
      entryVersionID: list.entryVersionID ?? null,
    }
  }, [agentID])

  const [osOpen, setOsOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [baseSel, setBaseSel] = useState<string | null>(null)
  const [headSel, setHeadSel] = useState<string | null>(null)
  const [diff, setDiff] = useState<VersionDiffResponse | null>(null)
  const [diffBusy, setDiffBusy] = useState(false)
  const [diffError, setDiffError] = useState<string | null>(null)

  const markEntry = async (versionID: number) => {
    setActionError(null)
    try {
      await builder.setEntry(agentID, versionID)
      reload()
    } catch (cause) {
      setActionError(messageOf(cause, '设置参赛版本失败'))
    }
  }

  const sorted: AgentVersionDTO[] = data
    ? [...data.versions].sort((a, b) => b.snapshotSeq - a.snapshotSeq)
    : []

  // diff 选择：默认 基准=次新版、对比=最新版；用户改过就用用户的。
  const headID = headSel ?? (sorted[0] ? String(sorted[0].id) : undefined)
  const baseID = baseSel ?? (sorted[1] ? String(sorted[1].id) : undefined)

  const versionLabel = (id: string | undefined) => {
    const version = sorted.find((v) => String(v.id) === id)
    if (!version) return id ?? ''
    return `v${version.snapshotSeq}${
      version.isEntry ? ' ★' : ''
    } · ${version.modelID}`
  }

  const runDiff = async () => {
    if (baseID == null || headID == null) return
    setDiffBusy(true)
    setDiffError(null)
    try {
      setDiff(await builder.diff(agentID, Number(baseID), Number(headID)))
    } catch (cause) {
      setDiffError(messageOf(cause, '对比失败'))
    } finally {
      setDiffBusy(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <Link
          to='/my-agents'
          className='text-sm text-(--foreground-subtle) transition hover:text-(--foreground)'
        >
          ← 我的智能体
        </Link>
      </div>

      {error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : !data
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : (
          <>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
                  {data.scenario.summary.title} · {data.draft.side === 'a'
                    ? data.scenario.summary.sideAName
                    : data.scenario.summary.sideBName}
                </h1>
                <p className='mt-1 text-sm text-(--foreground-subtle)'>
                  {data.draft.side === 'a' ? '甲方' : '乙方'} · agent #{agentID}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                {
                  /* #75：页头编辑＝载入最新版本进构建器（不是残留草稿），
                    保存＝另存新版；还没有版本时进空构建器 */
                }
                <Button
                  variant='secondary'
                  onClick={() =>
                    navigate(
                      sorted[0]
                        ? `/agents/${agentID}/build?from=${sorted[0].id}`
                        : `/agents/${agentID}/build`,
                    )}
                >
                  编辑
                </Button>
                <Button
                  data-testid='open-os-panel'
                  onClick={() => setOsOpen(true)}
                  disabled={data.versions.length === 0}
                  title={data.versions.length === 0
                    ? '先保存一个版本才能出战'
                    : undefined}
                >
                  出战
                </Button>
              </div>
            </div>

            {actionError
              ? <p className='text-sm text-(--accent)'>{actionError}</p>
              : null}

            <section className='space-y-3'>
              <h2 className='text-sm font-semibold text-(--foreground)'>
                版本（{sorted.length}）
              </h2>
              {sorted.length === 0
                ? (
                  <div className='rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'>
                    <p className='text-sm font-medium text-(--foreground)'>
                      还没有保存过版本
                    </p>
                    <p className='mt-1 text-xs text-(--foreground-muted)'>
                      去构建你的第一版策略。
                    </p>
                    <div className='mt-4 flex justify-center'>
                      <Button
                        onClick={() => navigate(`/agents/${agentID}/build`)}
                      >
                        进入构建器
                      </Button>
                    </div>
                  </div>
                )
                : sorted.map((version) => (
                  <Card
                    key={version.id}
                    className={version.isEntry
                      ? 'border-[rgba(224,74,47,0.4)]'
                      : undefined}
                  >
                    <CardContent className='space-y-3 pt-5'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='text-base font-bold text-(--foreground)'>
                          v{version.snapshotSeq}
                        </span>
                        <span className='font-mono text-xs text-(--foreground-muted)'>
                          #{version.id}
                        </span>
                        <Badge tone='info'>{version.modelID}</Badge>
                        {version.isEntry
                          ? <Badge tone='accent'>★参赛版本</Badge>
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
                            ? `收起 v${version.snapshotSeq} 全文`
                            : `展开 v${version.snapshotSeq} 全文`}
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
                              aria-label={`将 v${version.snapshotSeq} 设为参赛版本`}
                              onClick={() => void markEntry(version.id)}
                            >
                              设为参赛版本
                            </Button>
                          )
                          : null}
                        {/* #70：以此版本内容进构建器——保存即另存新版本 */}
                        <Button
                          size='sm'
                          variant='secondary'
                          aria-label={`编辑 v${version.snapshotSeq}`}
                          onClick={() =>
                            navigate(
                              `/agents/${agentID}/build?from=${version.id}`,
                            )}
                        >
                          编辑此版本
                        </Button>
                        <span className='text-[11px] text-(--foreground-muted)'>
                          保存会另存为新版本
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </section>

            {
              /* #20：diff 属所有者受限项——这里是自己的 agent，允许查看。
                只有一个版本时给引导（#54），不留空白。 */
            }
            {sorted.length === 1
              ? (
                <section className='space-y-3'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    版本对比
                  </h2>
                  <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                    再保存一个版本即可逐字对比两版策略的差异。
                  </p>
                </section>
              )
              : null}
            {sorted.length >= 2
              ? (
                <section className='space-y-3'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    版本对比
                  </h2>
                  <Card>
                    <CardContent className='space-y-4 pt-5'>
                      <div className='flex flex-wrap items-end gap-3'>
                        <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
                          <span className='block'>基准版本</span>
                          <div className='w-48'>
                            <Select
                              value={baseID}
                              renderValue={(v) => versionLabel(v)}
                              onValueChange={(v) => v && setBaseSel(v)}
                            >
                              {sorted.map((version) => (
                                <SelectItem
                                  key={version.id}
                                  value={String(version.id)}
                                >
                                  {versionLabel(String(version.id))}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                        </label>
                        <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
                          <span className='block'>对比版本</span>
                          <div className='w-48'>
                            <Select
                              value={headID}
                              renderValue={(v) => versionLabel(v)}
                              onValueChange={(v) => v && setHeadSel(v)}
                            >
                              {sorted.map((version) => (
                                <SelectItem
                                  key={version.id}
                                  value={String(version.id)}
                                >
                                  {versionLabel(String(version.id))}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                        </label>
                        <Button
                          variant='secondary'
                          onClick={() => void runDiff()}
                          disabled={diffBusy ||
                            baseID == null ||
                            headID == null ||
                            baseID === headID}
                        >
                          {diffBusy ? '对比中…' : '对比'}
                        </Button>
                      </div>
                      {diffError
                        ? <p className='text-sm text-(--accent)'>{diffError}</p>
                        : null}
                      {diff
                        ? (
                          <div className='grid gap-3 md:grid-cols-2'>
                            {([
                              ['基准', diff.base],
                              ['对比', diff.head],
                            ] as const).map(([label, version]) => (
                              <div key={label} className='min-w-0 space-y-1.5'>
                                <p className='text-xs font-semibold text-(--foreground-subtle)'>
                                  {label} v{version.snapshotSeq} ·{' '}
                                  {version.modelID}
                                </p>
                                <pre className='max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-(--border-soft) bg-white/2 p-3 font-mono text-xs leading-relaxed text-(--foreground-subtle)'>
                                  {version.prompt}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )
                        : null}
                    </CardContent>
                  </Card>
                </section>
              )
              : null}

            <OsPanel
              open={osOpen}
              onClose={() => setOsOpen(false)}
              scenario={data.scenario}
              side={data.draft.side}
              versions={data.versions}
              entryVersionID={data.entryVersionID}
            />
          </>
        )}
    </div>
  )
}
