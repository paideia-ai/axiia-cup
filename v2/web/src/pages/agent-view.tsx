import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { builder, catalog, myAgents } from '../api/client'
import type {
  AgentVersionDTO,
  MyAgentDTO,
  VersionDiffResponse,
} from '../api/types'
import { OsPanel } from '../components/os-panel'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { VersionList } from '../components/version-list'
import { messageOf, useAsync } from '../lib/use-async'
import { versionLabel, versionTag } from '../lib/version-label'

// EA 智能体主页（B3）：策略门面与公开视图。页头＝策略展示名（P1/#63）+ 同侧
// 兄弟策略胶囊（P9）；版本线与 E 页同构（VersionList，#88）；另有版本 diff
// （自己的 agent，#20 允许）。
// #90：「复制为新智能体」已废止——同侧再建只走「再建一个」（我的智能体页）。
// #89：「恢复到工作区」改称「基于该版本迭代」（语义不变，见 VersionList）。
export function AgentViewPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const navigate = useNavigate()
  const location = useLocation()

  const { data, error, reload } = useAsync(async () => {
    const draft = await builder.draft(agentID)
    const [scenario, list, inventory] = await Promise.all([
      catalog.scenario(draft.scenarioID, draft.side),
      builder.versions(agentID),
      // P1/P9：展示名与兄弟策略都来自这里（draft 不带 name）。失败不致命。
      myAgents.list().catch(() => null),
    ])
    const siblings: MyAgentDTO[] = inventory?.scenarios
      .find((item) => item.scenarioID === draft.scenarioID)
      ?.sides[draft.side] ?? []
    return {
      draft,
      scenario,
      versions: list.versions,
      entryVersionID: list.entryVersionID ?? null,
      siblings,
      self: siblings.find((a) => a.agentID === agentID) ?? null,
    }
  }, [agentID])

  const [osOpen, setOsOpen] = useState(false)
  const [preferVersionID, setPreferVersionID] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // E10（#84 提示句）：构建器保存成功后经导航 state 带来新版本 id；只消费
  // 一次——立即 replace 掉 history state，刷新/回退不复现，不落任何持久层。
  // A3 降级路径同通道：express 首战派发失败时构建器落回这里并带错误文案
  // （版本已保存，出战面板可手动发起）。
  const [savedVersionID, setSavedVersionID] = useState<number | null>(null)
  const [expressError, setExpressError] = useState<string | null>(null)
  useEffect(() => {
    const state = location.state as {
      savedVersionID?: number
      expressDispatchError?: string
    } | null
    if (state?.savedVersionID != null || state?.expressDispatchError != null) {
      setSavedVersionID(state.savedVersionID ?? null)
      setExpressError(state.expressDispatchError ?? null)
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

  // 版本号按 id 次序派生（E2/#82），所以 id 降序＝版本号降序、最新在前。旧实现
  // 按 snapshotSeq 排：那是草稿水位，两次保存之间没打字就并列，列表与 diff 的
  // 默认基准/对比会静默反序。
  const sorted: AgentVersionDTO[] = data
    ? [...data.versions].sort((a, b) => b.id - a.id)
    : []

  // E10：保存的新版本不是参赛版本时（参赛标记仍钉在别的版本上）才提示。
  const entryVersion = sorted.find((v) => v.isEntry) ?? null
  const sideName = data == null
    ? ''
    : data.draft.side === 'a'
    ? data.scenario.summary.sideAName
    : data.scenario.summary.sideBName

  // diff 选择：默认 基准=次新版、对比=最新版；用户改过就用用户的。
  const headID = headSel ?? (sorted[0] ? String(sorted[0].id) : undefined)
  const baseID = baseSel ?? (sorted[1] ? String(sorted[1].id) : undefined)

  // diff 下拉里的选项文案：这里只有 id，先解回 DTO 再交给共享的标签函数。
  const optionLabel = (id: string | undefined) => {
    const version = sorted.find((v) => String(v.id) === id)
    return version ? versionLabel(version, sorted) : id ?? ''
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
                {/* P1：策略展示名当标题；内部 id 降为可复制小字（#25 仍要 id 可见） */}
                <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
                  {data.self?.name
                    ? `${sideName}「${data.self.name}」`
                    : `${sideName} #${agentID}`}
                </h1>
                <p className='mt-1 text-sm text-(--foreground-subtle)'>
                  {data.scenario.summary.title} ·{' '}
                  {data.draft.side === 'a' ? '甲方' : '乙方'} ·{' '}
                  {data.versions.length} 个版本 ·{' '}
                  <span className='font-mono text-xs text-(--foreground-muted)'>
                    #{agentID}
                  </span>
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

            {expressError
              ? <p className='text-sm text-(--accent)'>{expressError}</p>
              : null}

            {/* E10：保存不移动参赛标记（#33）——最常见遗忘点的一次性提示 */}
            {savedVersionID != null && entryVersion != null &&
                entryVersion.id !== savedVersionID
              ? (
                <p className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'>
                  ★参赛版本仍是 {versionTag(entryVersion, sorted)}
                  ——新版本不会自动参赛，可在下方版本卡改标
                </p>
              )
              : null}

            {/* 兄弟策略胶囊（P9）：同侧横向切换；只有一个策略时整排不出现 */}
            {data.siblings.length > 1
              ? (
                <div className='flex flex-wrap items-center gap-2'>
                  {data.siblings.map((sibling) => (
                    <button
                      key={sibling.agentID}
                      type='button'
                      aria-current={sibling.agentID === agentID
                        ? 'page'
                        : undefined}
                      onClick={() => navigate(`/agents/${sibling.agentID}`)}
                      className={sibling.agentID === agentID
                        ? 'cursor-pointer rounded-full border border-(--accent) bg-[rgba(224,74,47,0.1)] px-3 py-1.5 text-xs font-semibold text-(--accent)'
                        : 'cursor-pointer rounded-full border border-(--border) px-3 py-1.5 text-xs font-medium text-(--foreground-subtle) transition hover:border-(--foreground-muted) hover:text-(--foreground)'}
                    >
                      {sibling.name
                        ? `${sideName}「${sibling.name}」`
                        : `${sideName} #${sibling.agentID}`}
                    </button>
                  ))}
                </div>
              )
              : null}

            {/* 版本线与 E 页同构（#88）：同一件事在哪都长一样（E9） */}
            <VersionList
              versions={data.versions}
              sideName={sideName}
              onSetEntry={(versionID) => void markEntry(versionID)}
              onIterate={(version) =>
                navigate(`/agents/${agentID}/build?from=${version.id}`)}
              onField={(version) => {
                setPreferVersionID(version.id)
                setOsOpen(true)
              }}
              emptyState={
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
              }
            />

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
                              renderValue={(v) => optionLabel(v)}
                              onValueChange={(v) => v && setBaseSel(v)}
                            >
                              {sorted.map((version) => (
                                <SelectItem
                                  key={version.id}
                                  value={String(version.id)}
                                >
                                  {optionLabel(String(version.id))}
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
                              renderValue={(v) => optionLabel(v)}
                              onValueChange={(v) => v && setHeadSel(v)}
                            >
                              {sorted.map((version) => (
                                <SelectItem
                                  key={version.id}
                                  value={String(version.id)}
                                >
                                  {optionLabel(String(version.id))}
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
                                  {label} {versionTag(version, sorted)} ·{' '}
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
              preferVersionID={preferVersionID}
            />
          </>
        )}
    </div>
  )
}
