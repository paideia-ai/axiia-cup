import { Menu } from '@base-ui-components/react/menu'
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Ellipsis,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  agents as agentAPI,
  ApiError,
  builder,
  catalog,
  myAgents,
} from '../api/client'
import type {
  AgentVersionDTO,
  MyAgentDTO,
  VersionDiffResponse,
} from '../api/types'
import { Modal } from '../components/modal'
import { NewAgentButton } from '../components/new-agent-button'
import { NewAgentDialog } from '../components/new-agent-dialog'
import { OsPanel } from '../components/os-panel'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectItem } from '../components/ui/select'
import { VersionList } from '../components/version-list'
import {
  beginEntryMutation,
  finishEntryMutation,
  getEntryMutation,
  notifyAgentsChanged,
  subscribeAgentsChanged,
  subscribeEntryMutation,
} from '../lib/agent-events'
import { purgeBuilderDraftJournals } from '../lib/builder-draft-storage'
import { messageOf, useAsync } from '../lib/use-async'
import { versionTag } from '../lib/version-label'
import { tm } from '../testmode/mark'

const AGENT_NAME_LIMIT = 30

function displayName(sideName: string, agentID: number, name?: string | null) {
  return name ? `${sideName}「${name}」` : `${sideName} #${agentID}`
}

// EA 智能体主页：主人视图是身份、同侧智能体、版本与版本对比的操作中枢；
// 别人的公开投影仍只展示身份与逐版本战绩，不泄露提示词或 diff。
export function AgentViewPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const navigate = useNavigate()
  const location = useLocation()

  // 只请求一次 owner draft：403 才切换到公开投影。主人数据里彼此独立的场景、
  // 版本和 inventory 并行获取，inventory 失败仍可使用主页核心功能。
  const { data: view, error, reload } = useAsync(async () => {
    let draft
    try {
      draft = await builder.draft(agentID)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) {
        return {
          kind: 'public' as const,
          requestedAgentID: agentID,
          publicView: await builder.public(agentID),
        }
      }
      throw cause
    }

    const [scenario, list, inventory] = await Promise.all([
      catalog.scenario(draft.scenarioID, draft.side),
      builder.versions(agentID),
      myAgents.list().catch(() => null),
    ])
    const siblings: MyAgentDTO[] = inventory?.scenarios
      .find((item) => item.scenarioID === draft.scenarioID)
      ?.sides[draft.side] ?? []
    return {
      kind: 'owner' as const,
      requestedAgentID: agentID,
      draft,
      scenario,
      versions: list.versions,
      entryVersionID: list.entryVersionID ?? null,
      siblings,
      self: siblings.find((agent) => agent.agentID === agentID) ?? null,
    }
  }, [agentID])

  const currentView = view?.requestedAgentID === agentID ? view : null
  const data = currentView?.kind === 'owner' ? currentView : null
  const publicView = currentView?.kind === 'public'
    ? currentView.publicView
    : null

  const [osOpen, setOsOpen] = useState(false)
  const [preferVersionID, setPreferVersionID] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [savedVersionID, setSavedVersionID] = useState<number | null>(null)
  const [expressError, setExpressError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [localName, setLocalName] = useState<string | null | undefined>()
  const [renameBusy, setRenameBusy] = useState(false)
  const [renameError, setRenameError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null)
  const [entryNotice, setEntryNotice] = useState<number | null>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const renameFormRef = useRef<HTMLFormElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const menuTriggerRef = useRef<HTMLElement>(null)
  const wasRenaming = useRef(false)
  const currentAgentIDRef = useRef(agentID)
  const mountedRef = useRef(true)
  const renameRequestRef = useRef(0)
  const deleteRequestRef = useRef(0)
  const entryMutation = useSyncExternalStore(
    subscribeEntryMutation,
    getEntryMutation,
    getEntryMutation,
  )
  currentAgentIDRef.current = agentID

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      renameRequestRef.current += 1
      deleteRequestRef.current += 1
    }
  }, [])

  useEffect(() => subscribeAgentsChanged(reload), [reload])

  const sorted: AgentVersionDTO[] = data
    ? [...data.versions].sort((a, b) => b.id - a.id)
    : []
  const sideName = data == null
    ? ''
    : data.draft.side === 'a'
    ? data.scenario.summary.sideAName
    : data.scenario.summary.sideBName
  const currentName = localName === undefined
    ? data?.self?.name ?? null
    : localName
  const fallbackSelf: MyAgentDTO | null = data
    ? {
      agentID,
      versionCount: data.versions.length,
      entryVersionID: data.entryVersionID,
      latestVersionID: sorted[0]?.id ?? null,
      name: currentName,
    }
    : null
  const railAgents = data == null
    ? []
    : data.siblings.some((agent) => agent.agentID === agentID)
    ? data.siblings
    : fallbackSelf == null
    ? data.siblings
    : [fallbackSelf, ...data.siblings]
  const entryVersion = sorted.find((version) => version.isEntry) ?? null
  const canDelete = data?.versions.length === 0
  const nameLength = [...nameDraft].length
  const nameTooLong = nameLength > AGENT_NAME_LIMIT

  // Consume Builder's one-shot navigation notice and clear it from history.
  // agentID is the intended trigger: replace(state=null) must not consume it twice.
  useEffect(() => {
    setOsOpen(false)
    setPreferVersionID(null)
    setActionError(null)
    setRenaming(false)
    setLocalName(undefined)
    setRenameBusy(false)
    setRenameError(null)
    setDeleteOpen(false)
    setDeleteBusy(false)
    setDeleteError(null)
    setCreateAnchor(null)
    setEntryNotice(null)
    const state = location.state as {
      savedVersionID?: number
      expressDispatchError?: string
    } | null
    setSavedVersionID(state?.savedVersionID ?? null)
    setExpressError(state?.expressDispatchError ?? null)
    if (state?.savedVersionID != null || state?.expressDispatchError != null) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [agentID])

  useEffect(() => {
    if (renaming) {
      const frame = requestAnimationFrame(() =>
        renameFormRef.current?.querySelector('input')?.select()
      )
      wasRenaming.current = true
      return () => cancelAnimationFrame(frame)
    }
    if (wasRenaming.current) headingRef.current?.focus()
    wasRenaming.current = false
  }, [renaming])

  // Keep the active pill visible without moving the page vertically.
  useLayoutEffect(() => {
    const rail = railRef.current
    if (!rail) return
    let active = true
    const revealCurrent = () => {
      if (!active) return
      const current = rail.querySelector<HTMLElement>('[aria-current="page"]')
      if (!current) return
      const itemRect = current.getBoundingClientRect()
      const railRect = rail.getBoundingClientRect()
      if (itemRect.left < railRect.left || itemRect.right > railRect.right) {
        rail.scrollLeft += itemRect.left - railRect.left -
          (rail.clientWidth - itemRect.width) / 2
      }
    }
    revealCurrent()
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(revealCurrent)
    observer?.observe(rail)
    void document.fonts?.ready.then(revealCurrent)
    return () => {
      active = false
      observer?.disconnect()
    }
  }, [agentID, railAgents.length])

  useEffect(() => {
    if (entryNotice == null) return
    const timer = setTimeout(() => setEntryNotice(null), 2400)
    return () => clearTimeout(timer)
  }, [entryNotice])

  const markEntry = async (versionID: number) => {
    const token = beginEntryMutation(agentID, versionID)
    if (token == null) return
    setActionError(null)
    try {
      await builder.setEntry(agentID, versionID)
      // Shared invalidation refreshes whichever sibling or inventory projection
      // is mounted when this side-wide change completes.
      notifyAgentsChanged()
      if (mountedRef.current && currentAgentIDRef.current === agentID) {
        setEntryNotice(versionID)
      }
    } catch (cause) {
      if (!mountedRef.current || currentAgentIDRef.current !== agentID) return
      setActionError(messageOf(cause, '设置参赛版本失败'))
    } finally {
      finishEntryMutation(token)
    }
  }

  const beginRename = () => {
    setNameDraft(currentName ?? '')
    setRenameError(null)
    setRenaming(true)
  }

  const saveName = async () => {
    if (renameBusy || nameTooLong) return
    const requestID = ++renameRequestRef.current
    const requestIsCurrent = () =>
      mountedRef.current && renameRequestRef.current === requestID &&
      currentAgentIDRef.current === agentID
    const name = nameDraft.trim()
    setRenameBusy(true)
    setRenameError(null)
    try {
      await agentAPI.rename(agentID, { name: name === '' ? null : name })
      notifyAgentsChanged()
      if (!requestIsCurrent()) return
      setLocalName(name === '' ? null : name)
      setRenaming(false)
    } catch (cause) {
      if (!requestIsCurrent()) return
      setRenameError(messageOf(cause, '重命名失败'))
    } finally {
      if (requestIsCurrent()) setRenameBusy(false)
    }
  }

  const removeAgent = async () => {
    if (!canDelete || deleteBusy) return
    const requestID = ++deleteRequestRef.current
    const requestIsCurrent = () =>
      mountedRef.current && deleteRequestRef.current === requestID &&
      currentAgentIDRef.current === agentID
    const currentIndex = railAgents.findIndex((agent) =>
      agent.agentID === agentID
    )
    const nextAgent = currentIndex < 0
      ? railAgents.find((agent) => agent.agentID !== agentID) ?? null
      : railAgents.slice(currentIndex + 1).find((agent) =>
        agent.agentID !== agentID
      ) ?? railAgents[currentIndex - 1] ?? null
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await agentAPI.remove(agentID)
      purgeBuilderDraftJournals(agentID)
      notifyAgentsChanged()
      if (!requestIsCurrent()) return
      setDeleteOpen(false)
      if (nextAgent) {
        navigate(`/agents/${nextAgent.agentID}`, { replace: true })
      } else {
        navigate('/my-agents', { replace: true })
      }
    } catch (cause) {
      if (!requestIsCurrent()) return
      setDeleteError(messageOf(cause, '删除智能体失败'))
      setDeleteBusy(false)
    }
  }

  // 公开视图：逐版本胜负有意公开；提示词、版本动作和 diff 永不公开。
  if (publicView) {
    const publicName = displayName(
      publicView.sideName,
      publicView.agentID,
      publicView.name,
    )
    return (
      <div className='space-y-6' {...tm('EA.public-view')}>
        <div>
          <Link
            to='/scenarios'
            className='text-sm text-(--foreground-subtle) transition hover:text-(--foreground)'
            {...tm('EA.public-back-link')}
          >
            ← 场景
          </Link>
        </div>
        <div>
          <h1
            className='text-2xl font-black tracking-tight text-(--foreground)'
            {...tm('EA.public-title')}
          >
            {publicName}
          </h1>
          <p
            className='mt-1 text-sm text-(--foreground-subtle)'
            {...tm('EA.public-owner-line')}
          >
            {publicView.ownerName} · {publicView.scenarioTitle}
          </p>
        </div>
        <Card {...tm('EA.public-record-card')}>
          <CardContent className='space-y-3 pt-5'>
            <h2 className='text-sm font-semibold text-(--foreground)'>
              逐版本战绩
            </h2>
            {publicView.versions.length === 0
              ? (
                <p
                  className='text-sm text-(--foreground-subtle)'
                  {...tm('EA.public-record-empty')}
                >
                  还没有保存过版本。
                </p>
              )
              : (
                <ul className='space-y-2' {...tm('EA.public-version-list')}>
                  {publicView.versions.map((version) => (
                    <li
                      key={version.id}
                      className='flex items-center justify-between rounded-lg border border-(--border-soft) px-3 py-2 text-sm'
                      {...tm('EA.public-version-item')}
                    >
                      <span className='text-(--foreground)'>
                        v{version.ordinal}
                        {version.isEntry
                          ? (
                            <span
                              className='ml-2 text-(--accent)'
                              {...tm('EA.public-entry-badge')}
                            >
                              ★ 参赛版本
                            </span>
                          )
                          : null}
                      </span>
                      <span
                        className='text-(--foreground-subtle)'
                        {...tm('EA.public-record')}
                      >
                        {version.matchCount === 0
                          ? '还没有出战过'
                          : `${version.matchCount} 战 ${version.winCount} 胜`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            <p
              className='text-xs text-(--foreground-muted)'
              {...tm('EA.public-owner-only-hint')}
            >
              提示词与版本对比只有主人可见。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <Link
        to='/my-agents'
        className='block text-sm text-(--foreground-subtle) transition hover:text-(--foreground)'
        {...tm('EA.back-link')}
      >
        ← 我的智能体
      </Link>

      {error
        ? <p className='text-sm text-(--accent)' {...tm('EA.error')}>{error}</p>
        : !data
        ? (
          <p
            className='text-sm text-(--foreground-subtle)'
            {...tm('EA.loading')}
          >
            加载中…
          </p>
        )
        : (
          <>
            <header {...tm('EA.page-header')}>
              <p className='mb-2 text-xs text-(--foreground-subtle)'>
                智能体主页
              </p>
              <div className='flex items-start gap-2'>
                {renaming
                  ? (
                    <form
                      ref={renameFormRef}
                      className='flex w-full max-w-lg flex-wrap items-center gap-1'
                      {...tm('EA.rename-form')}
                      onSubmit={(event) => {
                        event.preventDefault()
                        void saveName()
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          (event.nativeEvent.isComposing ||
                            event.keyCode === 229)
                        ) event.preventDefault()
                        if (
                          event.key === 'Escape' &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault()
                          setRenaming(false)
                        }
                      }}
                    >
                      <label htmlFor='inline-agent-name' className='sr-only'>
                        智能体名称
                      </label>
                      <Input
                        id='inline-agent-name'
                        value={nameDraft}
                        disabled={renameBusy}
                        aria-invalid={nameTooLong || !!renameError}
                        aria-describedby='inline-agent-name-help'
                        className='h-11 min-w-0 flex-1 text-lg font-semibold'
                        placeholder='智能体名称（可选）'
                        onChange={(event) => {
                          setNameDraft(event.target.value)
                          setRenameError(null)
                        }}
                      />
                      <Button
                        type='submit'
                        variant='ghost'
                        size='sm'
                        className='h-11 w-11 shrink-0 cursor-pointer p-0 md:h-9 md:w-9'
                        aria-label='保存名称'
                        title='保存名称（Enter）'
                        disabled={renameBusy || nameTooLong}
                      >
                        <Check aria-hidden='true' className='h-4 w-4' />
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='h-11 w-11 shrink-0 cursor-pointer p-0 md:h-9 md:w-9'
                        aria-label='取消重命名'
                        title='取消（Esc）'
                        disabled={renameBusy}
                        onClick={() => setRenaming(false)}
                      >
                        <X aria-hidden='true' className='h-4 w-4' />
                      </Button>
                      <span
                        id='inline-agent-name-help'
                        className={`w-full text-xs ${
                          nameTooLong || renameError
                            ? 'text-(--accent)'
                            : 'text-(--foreground-muted)'
                        }`}
                        role={renameError ? 'alert' : undefined}
                      >
                        {renameError ??
                          (nameTooLong
                            ? `名字最多 ${AGENT_NAME_LIMIT} 字`
                            : `${nameLength}/${AGENT_NAME_LIMIT}`)}
                      </span>
                    </form>
                  )
                  : (
                    <h1
                      ref={headingRef}
                      tabIndex={-1}
                      className='min-w-0 wrap-anywhere text-2xl font-black tracking-tight text-(--foreground) outline-none'
                      {...tm('EA.page-title')}
                    >
                      {displayName(sideName, agentID, currentName)}
                    </h1>
                  )}

                <Menu.Root>
                  <Menu.Trigger
                    ref={menuTriggerRef}
                    hidden={renaming}
                    aria-label='智能体更多操作'
                    title='更多操作'
                    className='flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-(--foreground-subtle) transition hover:bg-white/4 hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent) md:h-9 md:w-9'
                    {...tm('EA.identity-menu')}
                  >
                    <Ellipsis aria-hidden='true' className='h-5 w-5' />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      align='end'
                      sideOffset={6}
                      className='z-40'
                    >
                      <Menu.Popup
                        finalFocus={() =>
                          deleteOpen
                            ? false
                            : renameFormRef.current?.querySelector('input') ??
                              menuTriggerRef.current}
                        className='w-56 rounded-lg border border-(--border) bg-(--surface-elevated) p-1 shadow-xl outline-none'
                      >
                        <Menu.Item
                          onClick={beginRename}
                          className='flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm outline-none data-[highlighted]:bg-white/6'
                        >
                          <Pencil aria-hidden='true' className='h-4 w-4' />
                          重命名
                        </Menu.Item>
                        <div
                          role='separator'
                          className='my-1 border-t border-(--border-soft)'
                        />
                        <Menu.Item
                          disabled={!canDelete}
                          aria-describedby={!canDelete
                            ? 'delete-unavailable'
                            : undefined}
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteOpen(true)
                          }}
                          className='flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm text-(--accent) outline-none data-[highlighted]:bg-white/6 data-[disabled]:cursor-not-allowed data-[disabled]:text-(--foreground-subtle)'
                        >
                          <Trash2 aria-hidden='true' className='h-4 w-4' />
                          删除智能体
                        </Menu.Item>
                        {!canDelete
                          ? (
                            <p
                              id='delete-unavailable'
                              className='px-3 pb-2 text-xs text-(--foreground-subtle)'
                            >
                              已有版本，无法删除
                            </p>
                          )
                          : null}
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </div>
              <p
                className='mt-1 text-sm text-(--foreground-subtle)'
                {...tm('EA.subtitle')}
              >
                {data.scenario.summary.title} ·{' '}
                {data.draft.side === 'a' ? '甲方' : '乙方'} ·{' '}
                {data.versions.length} 个版本 ·{' '}
                <span
                  className='font-mono text-xs text-(--foreground-muted)'
                  {...tm('EA.agent-id')}
                >
                  #{agentID}
                </span>
              </p>
            </header>

            {actionError
              ? (
                <p
                  role='alert'
                  className='text-sm text-(--accent)'
                  {...tm('EA.action-error')}
                >
                  {actionError}
                </p>
              )
              : null}
            {expressError
              ? (
                <p
                  role='alert'
                  className='text-sm text-(--accent)'
                  {...tm('EA.express-error')}
                >
                  {expressError}
                </p>
              )
              : null}
            {savedVersionID != null && entryVersion != null &&
                entryVersion.id !== savedVersionID
              ? (
                <p
                  className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'
                  {...tm('EA.entry-notice')}
                >
                  ★参赛版本仍是{' '}
                  {versionTag(entryVersion, sorted)}；新版本不会自动参赛。
                </p>
              )
              : null}

            <nav
              aria-label='同角色智能体'
              className='flex min-w-0 items-center gap-2'
              {...tm('EA.sibling-pills')}
            >
              <div
                ref={railRef}
                className='flex min-w-0 items-center gap-2 overflow-x-auto py-1'
              >
                {railAgents.map((sibling) => {
                  const siblingName = sibling.agentID === agentID
                    ? currentName
                    : sibling.name
                  const active = sibling.agentID === agentID
                  return (
                    <Link
                      key={sibling.agentID}
                      to={`/agents/${sibling.agentID}`}
                      aria-current={active ? 'page' : undefined}
                      className={`inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition focus-visible:outline-2 focus-visible:outline-(--accent) md:min-h-0 ${
                        active
                          ? 'border-(--accent) font-semibold text-(--accent)'
                          : 'border-(--border) font-medium text-(--foreground-subtle) hover:border-(--foreground-muted) hover:text-(--foreground)'
                      }`}
                      {...tm('EA.sibling-pill')}
                    >
                      {displayName(sideName, sibling.agentID, siblingName)}
                    </Link>
                  )
                })}
              </div>
              <span className='inline-flex' {...tm('EA.sibling-create-button')}>
                <NewAgentButton
                  role={sideName}
                  onClick={(anchor) => setCreateAnchor(anchor)}
                />
              </span>
            </nav>

            <VersionList
              versions={data.versions}
              sideName={sideName}
              entryBusy={entryMutation != null}
              pendingEntryID={entryMutation?.agentID === agentID
                ? entryMutation.versionID
                : null}
              onSetEntry={(versionID) => void markEntry(versionID)}
              onField={(version) => {
                setPreferVersionID(version.id)
                setOsOpen(true)
              }}
              fieldMarker={tm('EA.field-button')['data-tm']}
              headingAside={null}
              headingAction={
                <span
                  className='inline-flex'
                  {...(sorted.length === 0
                    ? tm('EA.version-empty-build-button')
                    : {})}
                >
                  <Button
                    type='button'
                    size='sm'
                    variant='ghost'
                    className='h-11 w-11 shrink-0 cursor-pointer p-0 text-white md:h-8 md:w-8'
                    aria-label='新建版本'
                    title='新建版本'
                    onClick={() => navigate(`/agents/${agentID}/build`)}
                    {...tm('EA.edit-button')}
                  >
                    <span aria-hidden='true' className='relative h-5 w-5'>
                      <Pencil className='h-5 w-5' strokeWidth={1.8} />
                      <Plus
                        className='absolute -right-1 -bottom-0.5 h-3 w-3 rounded-sm bg-(--background)'
                        strokeWidth={2}
                      />
                    </span>
                  </Button>
                </span>
              }
              emptyState={
                <div
                  className='rounded-lg border border-dashed border-(--border-soft) px-4 py-8 text-center'
                  {...tm('EA.version-empty')}
                >
                  <p className='text-sm font-medium text-(--foreground)'>
                    还没有保存过版本
                  </p>
                </div>
              }
            />

            <VersionCompare
              key={`${agentID}-${
                data.versions.map((version) => version.id).join('-')
              }`}
              agentID={agentID}
              versions={data.versions}
            />

            {entryNotice != null
              ? (
                <div
                  role='status'
                  className='fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm shadow-xl md:bottom-8'
                >
                  <Check
                    aria-hidden='true'
                    className='h-4 w-4 text-(--success)'
                  />
                  已设置用此版本参赛
                </div>
              )
              : null}

            {deleteOpen
              ? (
                <Modal
                  title='删除智能体'
                  marker={tm('EA.delete-dialog')['data-tm']}
                  returnFocus={menuTriggerRef.current}
                  onClose={() => {
                    if (!deleteBusy) setDeleteOpen(false)
                  }}
                >
                  <p className='text-sm text-(--foreground-subtle)'>
                    删除{displayName(
                      sideName,
                      agentID,
                      currentName,
                    )}？此智能体还没有保存的版本；草稿也会一并删除。
                  </p>
                  {deleteError
                    ? (
                      <p role='alert' className='text-sm text-(--accent)'>
                        {deleteError}
                      </p>
                    )
                    : null}
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='secondary'
                      className='h-11 cursor-pointer md:h-10'
                      disabled={deleteBusy}
                      onClick={() => setDeleteOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      className='h-11 cursor-pointer md:h-10'
                      disabled={deleteBusy}
                      onClick={() => void removeAgent()}
                    >
                      {deleteBusy ? '删除中…' : '确认删除'}
                    </Button>
                  </div>
                </Modal>
              )
              : null}

            {createAnchor
              ? (
                <NewAgentDialog
                  scenario={data.scenario.summary}
                  initialSide={data.draft.side}
                  anchor={createAnchor}
                  onClose={() => setCreateAnchor(null)}
                />
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

function VersionCompare({
  agentID,
  versions,
}: {
  agentID: number
  versions: AgentVersionDTO[]
}) {
  const sorted = [...versions].sort((a, b) => b.id - a.id)
  const [baseID, setBaseID] = useState(String(sorted[1]?.id ?? ''))
  const [headID, setHeadID] = useState(String(sorted[0]?.id ?? ''))
  const [open, setOpen] = useState(false)
  const [diff, setDiff] = useState<VersionDiffResponse | null>(null)
  const [diffBusy, setDiffBusy] = useState(false)
  const [diffError, setDiffError] = useState<string | null>(null)
  const panelID = useId()
  const requestID = useRef(0)

  useEffect(() => {
    const sequence = ++requestID.current
    if (!open || !baseID || !headID || baseID === headID) {
      setDiffBusy(false)
      return
    }
    setDiffBusy(true)
    setDiffError(null)
    setDiff(null)
    void builder.diff(agentID, Number(baseID), Number(headID))
      .then((result) => {
        if (requestID.current === sequence) setDiff(result)
      })
      .catch((cause: unknown) => {
        if (requestID.current === sequence) {
          setDiffError(messageOf(cause, '对比失败'))
          setDiff(null)
        }
      })
      .finally(() => {
        if (requestID.current === sequence) setDiffBusy(false)
      })
    return () => {
      if (requestID.current === sequence) requestID.current += 1
    }
  }, [agentID, baseID, headID, open])

  if (sorted.length === 0) return null

  const optionLabel = (id: string) => {
    const version = sorted.find((candidate) => String(candidate.id) === id)
    if (!version) return id
    const note = version.note?.trim()
    return `${versionTag(version, sorted)}${version.isEntry ? ' ★' : ''}${
      note ? ` · ${note}` : ''
    } · ${version.modelID}`
  }

  if (sorted.length === 1) {
    return (
      <section
        className='space-y-2 border-t border-(--border-soft) pt-4'
        {...tm('EA.diff-section')}
      >
        <h2 className='text-sm font-medium text-(--foreground-subtle)'>
          版本对比
        </h2>
        <p
          className='text-xs text-(--foreground-muted)'
          {...tm('EA.diff-hint')}
        >
          再保存一个版本即可对比两版策略。
        </p>
      </section>
    )
  }

  return (
    <section
      aria-label='版本对比'
      className='space-y-3 border-t border-(--border-soft) pt-4'
      {...tm('EA.diff-section')}
    >
      <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
        <h2 className='shrink-0'>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            className='h-11 cursor-pointer gap-1.5 px-1 text-(--foreground-subtle) md:h-9'
            aria-expanded={open}
            aria-controls={panelID}
            onClick={() => setOpen((current) => !current)}
            {...tm('EA.diff-button')}
          >
            <ChevronDown
              aria-hidden='true'
              className={`h-3.5 w-3.5 transition-transform ${
                open ? '' : '-rotate-90'
              }`}
            />
            版本对比
          </Button>
        </h2>

        <div className='w-32 sm:w-44' {...tm('EA.diff-base-select')}>
          <Select
            value={baseID}
            placeholder='选择基准版本'
            renderValue={optionLabel}
            onValueChange={(value) => {
              if (!value) return
              setBaseID(value)
              setOpen(true)
            }}
          >
            {sorted.filter((version) => String(version.id) !== headID).map(
              (version) => (
                <SelectItem key={version.id} value={String(version.id)}>
                  {optionLabel(String(version.id))}
                </SelectItem>
              ),
            )}
          </Select>
        </div>

        <ArrowLeftRight
          aria-hidden='true'
          className='h-3.5 w-3.5 shrink-0 text-(--foreground-muted)'
        />

        <div className='w-32 sm:w-44' {...tm('EA.diff-head-select')}>
          <Select
            value={headID}
            placeholder='选择对比版本'
            renderValue={optionLabel}
            onValueChange={(value) => {
              if (!value) return
              setHeadID(value)
              setOpen(true)
            }}
          >
            {sorted.filter((version) => String(version.id) !== baseID).map(
              (version) => (
                <SelectItem key={version.id} value={String(version.id)}>
                  {optionLabel(String(version.id))}
                </SelectItem>
              ),
            )}
          </Select>
        </div>
      </div>

      <div id={panelID} hidden={!open}>
        {open
          ? (
            <div className='space-y-3'>
              {diffBusy
                ? (
                  <p
                    role='status'
                    className='text-xs text-(--foreground-muted)'
                  >
                    对比中…
                  </p>
                )
                : null}
              {diffError
                ? (
                  <p
                    role='alert'
                    className='text-sm text-(--accent)'
                    {...tm('EA.diff-error')}
                  >
                    {diffError}
                  </p>
                )
                : null}
              {diff
                ? (
                  <div
                    className='grid gap-3 md:grid-cols-2'
                    {...tm('EA.diff-result')}
                  >
                    {([
                      ['基准', diff.base],
                      ['对比', diff.head],
                    ] as const).map(([label, version]) => (
                      <div
                        key={label}
                        className='min-w-0 space-y-1.5'
                        {...tm('EA.diff-column')}
                      >
                        <p
                          className='text-xs font-semibold text-(--foreground-subtle)'
                          {...tm('EA.diff-column-title')}
                        >
                          {label} {versionTag(version, sorted)} ·{' '}
                          {version.modelID}
                        </p>
                        <pre
                          className='max-h-80 overflow-auto whitespace-pre-wrap wrap-anywhere rounded-md border border-(--border-soft) bg-white/2 p-3 font-sans text-sm leading-7 text-(--foreground-subtle)'
                          {...tm('EA.diff-prompt')}
                        >
                          {version.prompt}
                        </pre>
                      </div>
                    ))}
                  </div>
                )
                : null}
            </div>
          )
          : null}
      </div>
    </section>
  )
}
