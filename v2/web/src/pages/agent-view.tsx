import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { agents, ApiError, builder, catalog } from '../api/client'
import type { AgentVersionDTO, VersionDiffResponse } from '../api/types'
import { OsPanel } from '../components/os-panel'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { rejectCopy } from '../lib/reject-copy'
import { messageOf, useAsync } from '../lib/use-async'

// EA 智能体主页（B3，#81–#84 已批）：版本卡（新在前）+ ★参赛版本切换 +
// 「恢复到工作区」（E3/#82，原「编辑此版本」语义重释）+「复制为新智能体」
// （E4/#84）+ 页头「编辑」＝进入工作区（E1/#81）+「出战」呼出 OS 面板 +
// diff（自己的 agent，#20 允许）+ 保存后的一次性参赛标记提示（E10）。
export function AgentViewPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const navigate = useNavigate()
  const location = useLocation()

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
  const [forkPending, setForkPending] = useState<number | null>(null)
  // E10（#84 提示句）：构建器保存成功后经导航 state 带来新版本 id；只消费
  // 一次——立即 replace 掉 history state，刷新/回退不复现，不落任何持久层。
  const [savedVersionID, setSavedVersionID] = useState<number | null>(null)
  useEffect(() => {
    const state = location.state as { savedVersionID?: number } | null
    if (state?.savedVersionID != null) {
      setSavedVersionID(state.savedVersionID)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [])
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

  // E4（#84）复制为新智能体：以该版本文本为首稿，在同场景同侧新建 agent
  // （从 v1 开始），受 #59/#79 引导门。首稿经 mutate 通道写进新 agent 的
  // 工作区草稿——推送失败不阻塞跳转（文本仍可从本 agent 恢复）。
  const forkAsNew = async (version: AgentVersionDTO) => {
    if (!data) return
    setActionError(null)
    setForkPending(version.id)
    try {
      const { agentID: newAgentID } = await agents.create({
        scenarioID: data.draft.scenarioID,
        side: data.draft.side,
      })
      await builder
        .mutate(newAgentID, { field: 'prompt', value: version.prompt })
        .catch(() => {})
      navigate(`/agents/${newAgentID}/build`)
    } catch (cause) {
      // 后端多智能体批次未上线：POST /v1/agents 答 404/405——按钮保留，
      // 文案说明功能随下一批后端到达。
      if (
        cause instanceof ApiError &&
        (cause.status === 404 || cause.status === 405)
      ) {
        setActionError('多智能体功能随下一批后端上线')
      } else {
        setActionError(rejectCopy(cause, null, '复制为新智能体失败'))
      }
      setForkPending(null)
    }
  }

  const sorted: AgentVersionDTO[] = data
    ? [...data.versions].sort((a, b) => b.snapshotSeq - a.snapshotSeq)
    : []

  // E10：保存的新版本不是参赛版本时（参赛标记仍钉在别的版本上）才提示。
  const entryVersion = sorted.find((v) => v.isEntry) ?? null

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
                  /* E1（#81，#75 语义重释）：页头编辑＝进入工作区——内容以
                    服务端常驻草稿为准，不再携带 ?from 覆盖 */
                }
                <Button
                  variant='secondary'
                  onClick={() => navigate(`/agents/${agentID}/build`)}
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

            {/* E10：保存不移动参赛标记（#33）——最常见遗忘点的一次性提示 */}
            {savedVersionID != null && entryVersion != null &&
                entryVersion.id !== savedVersionID
              ? (
                <p className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'>
                  ★参赛版本仍是 v{entryVersion.snapshotSeq}
                  ——新版本不会自动参赛，可在下方版本卡改标
                </p>
              )
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
                        {
                          /* E3（#82，#70 语义重释）：恢复＝把该版本文本回填
                          工作区草稿，本身不产生版本；此后保存照常产生新版本 */
                        }
                        <Button
                          size='sm'
                          variant='secondary'
                          aria-label={`恢复 v${version.snapshotSeq} 到工作区`}
                          title='将此版本回填到工作区草稿；不产生新版本'
                          onClick={() =>
                            navigate(
                              `/agents/${agentID}/build?from=${version.id}`,
                            )}
                        >
                          恢复到工作区
                        </Button>
                        {/* E4（#84）：分叉的唯一出口——同侧另起炉灶，从 v1 开始 */}
                        <Button
                          size='sm'
                          variant='secondary'
                          aria-label={`以 v${version.snapshotSeq} 复制为新智能体`}
                          title='以此版本为首稿，在同场景同侧新建智能体（从 v1 开始）'
                          disabled={forkPending != null}
                          onClick={() => void forkAsNew(version)}
                        >
                          {forkPending === version.id
                            ? '复制中…'
                            : '复制为新智能体'}
                        </Button>
                        <span className='text-[11px] text-(--foreground-muted)'>
                          恢复后保存将成为新版本
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
