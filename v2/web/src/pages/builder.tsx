import { Check, Copy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import {
  ApiError,
  builder,
  catalog,
  config as configApi,
  matches,
  myAgents,
  sseUrl,
} from '../api/client'
import type {
  AgentVersionDTO,
  BuilderEventDTO,
  ConfigResponse,
  ModelDTO,
  ScenarioDetail,
  Side,
} from '../api/types'
import { InitModes } from '../components/builder-init'
import { BattleCostNotice } from '../components/rewards'
import { useBattleQuote } from '../context/rewards'
import { playButtonHover, playSound, unlockAudio } from '../lib/sound'
import { TypingFeedback } from '../components/typing-feedback'
import { trackSoundMatch } from '../lib/match-sound'
import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Button } from '../components/ui/button'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { VersionNote } from '../components/version-note'
import { useOptionalAuth } from '../context/auth'
import {
  builderDraftJournalIdentity,
  builderDraftJournalStoragePrefix,
  enqueueBuilderDraftMutation,
} from '../lib/builder-draft-storage'
import { metaPromptFor } from '../lib/meta-prompt'
import { promptLength } from '../lib/prompt-length'
import { rejectCopy } from '../lib/reject-copy'
import { messageOf } from '../lib/use-async'
import { versionTag } from '../lib/version-label'
import {
  creationTool,
  type FirstBattleAttempt,
  firstBattlePreset,
  readFirstBattleAttempt,
  writeFirstBattleAttempt,
} from '../lib/first-battle'
import {
  roleByKey,
  roleOfOptions,
  roleOptions,
  rolesForSide,
  scenarioModule,
} from '../scenarios'
import { deckFor } from '../scenarios/decks'
import { tm } from '../testmode/mark'

const PROMPT_FIELD = 'prompt'

interface DraftSyncState {
  value: string
  revision: number
  persistedRevision: number
  queue: Promise<void>
}

interface DraftJournal {
  schema: 2
  identity: string
  agentID: number
  writerID: string
  revision: number
  token: string
  basePrompt: string
  prompt: string
  promptPersisted: boolean
  roleKey: string | null
  modelID: string | null
  note: string
  method: 'mcq' | 'builder' | null
  updatedAt: number
}

interface DraftJournalScope {
  identity: string
  agentID: number
}

interface DraftRecovery {
  journal: DraftJournal
  reason: 'conflict' | 'expired'
}

const DRAFT_JOURNAL_AUTO_RESTORE_MS = 14 * 24 * 60 * 60 * 1000

function draftJournalPrefix(scope: DraftJournalScope) {
  return builderDraftJournalStoragePrefix(scope.identity)
}

function draftJournalKey(scope: DraftJournalScope, token: string) {
  return `${draftJournalPrefix(scope)}${token}`
}

function parseDraftJournal(
  scope: DraftJournalScope,
  raw: string,
): DraftJournal | null {
  try {
    const value = JSON.parse(raw) as Partial<DraftJournal>
    if (
      value.schema !== 2 ||
      value.identity !== scope.identity ||
      value.agentID !== scope.agentID ||
      typeof value.writerID !== 'string' || value.writerID === '' ||
      typeof value.revision !== 'number' ||
      !Number.isSafeInteger(value.revision) || value.revision < 1 ||
      typeof value.token !== 'string' || value.token === '' ||
      typeof value.basePrompt !== 'string' ||
      typeof value.prompt !== 'string' ||
      typeof value.promptPersisted !== 'boolean' ||
      !(value.roleKey == null || typeof value.roleKey === 'string') ||
      !(value.modelID == null || typeof value.modelID === 'string') ||
      typeof value.note !== 'string' ||
      typeof value.updatedAt !== 'number' ||
      !Number.isFinite(value.updatedAt) ||
      !(
        value.method == null || value.method === 'mcq' ||
        value.method === 'builder'
      )
    ) return null
    return {
      schema: 2,
      identity: value.identity,
      agentID: value.agentID,
      writerID: value.writerID,
      revision: value.revision,
      token: value.token,
      basePrompt: value.basePrompt,
      prompt: value.prompt,
      promptPersisted: value.promptPersisted,
      roleKey: value.roleKey ?? null,
      modelID: value.modelID ?? null,
      note: value.note,
      method: value.method ?? null,
      updatedAt: value.updatedAt,
    }
  } catch {
    return null
  }
}

function allDraftJournals(scope: DraftJournalScope): DraftJournal[] {
  const journals: DraftJournal[] = []
  try {
    const prefix = draftJournalPrefix(scope)
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key == null || !key.startsWith(prefix)) continue
      const raw = localStorage.getItem(key)
      if (raw == null) continue
      const journal = parseDraftJournal(scope, raw)
      if (journal != null && key === draftJournalKey(scope, journal.token)) {
        journals.push(journal)
      }
    }
  } catch {
    return []
  }
  return journals
}

function latestDraftJournal(scope: DraftJournalScope): DraftJournal | null {
  return allDraftJournals(scope).sort((left, right) =>
    right.revision - left.revision || right.updatedAt - left.updatedAt ||
    right.token.localeCompare(left.token)
  )[0] ?? null
}

function draftJournalByToken(
  scope: DraftJournalScope,
  token: string | null,
): DraftJournal | null {
  if (token == null) return null
  try {
    const raw = localStorage.getItem(draftJournalKey(scope, token))
    return raw == null ? null : parseDraftJournal(scope, raw)
  } catch {
    return null
  }
}

function newDraftJournalToken() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function writeNextDraftJournal(
  scope: DraftJournalScope,
  writerID: string,
  value: Omit<
    DraftJournal,
    'schema' | 'identity' | 'agentID' | 'writerID' | 'revision' | 'token'
  >,
  supersededToken: string | null,
): DraftJournal | null {
  const revision = allDraftJournals(scope).reduce(
    (highest, journal) => Math.max(highest, journal.revision),
    0,
  ) + 1
  const token = newDraftJournalToken()
  const journal: DraftJournal = {
    schema: 2,
    identity: scope.identity,
    agentID: scope.agentID,
    writerID,
    revision,
    token,
    ...value,
  }
  try {
    // A token owns its own key. Writing the successor before removing the exact
    // predecessor means an older tab can never delete a newer tab's record.
    localStorage.setItem(draftJournalKey(scope, token), JSON.stringify(journal))
  } catch {
    return null
  }
  try {
    if (supersededToken != null && supersededToken !== token) {
      localStorage.removeItem(draftJournalKey(scope, supersededToken))
    }
  } catch {
    // The successor is already durable. A leftover predecessor is harmless:
    // revision ordering selects the successor and a later pass can retire it.
  }
  return journal
}

function acknowledgeDraftJournal(
  scope: DraftJournalScope,
  token: string | null,
  writerID: string,
  confirmedPrompt: string,
) {
  const current = draftJournalByToken(scope, token)
  if (current == null || current.writerID !== writerID) return
  try {
    localStorage.setItem(
      draftJournalKey(scope, current.token),
      JSON.stringify(
        {
          ...current,
          basePrompt: confirmedPrompt,
          promptPersisted: current.prompt === confirmedPrompt,
        } satisfies DraftJournal,
      ),
    )
  } catch {
    // A durable server ACK is still authoritative if storage is unavailable.
  }
}

function compareAndDeleteDraftJournal(
  scope: DraftJournalScope,
  snapshot: Pick<DraftJournal, 'token' | 'revision'>,
) {
  const current = draftJournalByToken(scope, snapshot.token)
  if (current == null || current.revision !== snapshot.revision) return false
  try {
    // Compare revision inside the token-owned key, then remove only that key.
    // A newer tab has a different token/key and remains untouchable.
    localStorage.removeItem(draftJournalKey(scope, snapshot.token))
    return true
  } catch {
    // Storage failure must never block a real version save.
    return false
  }
}

// Keso 2026-09-09「低—高—低」方案：构建器只保留写作所需的低复杂度工作区。
// 版本浏览、参赛选择、对比与出战集中在智能体主页；保存普通版本后返回主页。
// 草稿仍由服务端自动暂存，保存仍生成不可变的线性版本，express 首战保持例外。
export function BuilderPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useOptionalAuth()
  const journalScope = useMemo<DraftJournalScope>(() => ({
    identity: builderDraftJournalIdentity(auth?.account?.id, agentID),
    agentID,
  }), [agentID, auth?.account?.id])
  const writerID = useMemo(newDraftJournalToken, [])

  // Query params are a first-paint hint only; the draft response is authoritative
  // and overwrites them, so entering the builder without a query string works.
  const [scenarioID, setScenarioID] = useState(params.get('scenario') ?? '')
  const [side, setSide] = useState<Side>(
    (params.get('side') as Side | null) ?? 'a',
  )
  // Vivian U03-C05 v2: saving and explicitly starting are separate operations.
  const express = params.get('express') === '1'
  const quoteState = useBattleQuote(scenarioID, side, 'pve', express)
  const insufficientPoints = quoteState.blocked
  const requestedTool = creationTool(params.get('init'))

  const [prompt, setPrompt] = useState('')
  const [roleKey, setRoleKey] = useState<string | null>(null)
  const [models, setModels] = useState<ModelDTO[]>([])
  const [modelID, setModelID] = useState<string | null>(null)
  const [versions, setVersions] = useState<AgentVersionDTO[]>([])
  const [restoredTag, setRestoredTag] = useState<string | null>(null)
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recovery, setRecovery] = useState<DraftRecovery | null>(null)
  const [draftLoading, setDraftLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startAttempt, setStartAttempt] = useState<FirstBattleAttempt | null>(
    null,
  )
  const [attemptError, setAttemptError] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [configurationAttempt, setConfigurationAttempt] = useState(0)
  const [configurationError, setConfigurationError] = useState<string | null>(
    null,
  )
  const saveBusyRef = useRef(false)
  const startBusyRef = useRef(false)
  const currentRouteRef = useRef(location.key)
  const currentIdentityRef = useRef(journalScope.identity)
  currentRouteRef.current = location.key
  currentIdentityRef.current = journalScope.identity
  const focusPrompt = useCallback(
    () => document.getElementById('prompt-input')?.focus(),
    [],
  )
  const [copied, setCopied] = useState(false)
  // P10：保存时的可选备注，写一次不再改；保存成功即清空，下一版重新填。
  const [note, setNote] = useState('')
  // P1：策略展示名（#63）。draft 接口不带 name，先从 /my/agents 取。
  const [agentName, setAgentName] = useState<string | null>(null)
  // config 供字数上限、拒绝文案数字与 express 的新手预设对手 key；失败时
  // 保存仍可进行，首战等待重新加载成功后才允许派发。
  const [cfg, setCfg] = useState<ConfigResponse | null>(null)
  const [configSettled, setConfigSettled] = useState(false)
  const [loadedAgentID, setLoadedAgentID] = useState<number | null>(null)
  const mutateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initMethod = useRef<'mcq' | 'builder' | null>(null)
  const promptPersistedRef = useRef(true)
  const basePromptRef = useRef('')
  const journalTokenRef = useRef<string | null>(null)
  const liveRef = useRef(true)
  const saveRequestRef = useRef(0)
  // A route change may reuse BuilderPage. Giving every agent its own sync
  // ledger keeps an old request completion from marking the new agent's draft
  // as persisted.
  const draftSync = useMemo<DraftSyncState>(() => ({
    value: '',
    revision: 0,
    persistedRevision: 0,
    queue: Promise.resolve(),
  }), [agentID])

  // Saving may outlive this keyed route when a player uses the navbar or
  // browser history during a slow request. Late completions must never take
  // over the newer route or write state into an unmounted builder.
  useEffect(() => {
    liveRef.current = true
    return () => {
      liveRef.current = false
      saveRequestRef.current += 1
    }
  }, [])

  useEffect(() => {
    setStartError(null)
    setAttemptError(null)
    setStarting(false)
    startBusyRef.current = false
    saveBusyRef.current = false
    try {
      setStartAttempt(
        express ? readFirstBattleAttempt(journalScope.identity) : null,
      )
    } catch {
      setStartAttempt(null)
      setAttemptError(
        '无法读取首战派发记录，请先到「我的对局」核对；不会自动重试。',
      )
    }
  }, [express, journalScope.identity])

  useEffect(() => {
    if (express && auth?.firstBattleDone) {
      navigate('/scenarios', { replace: true })
    }
  }, [express, auth?.firstBattleDone, navigate])

  // Serialize field mutations so a slow older request can never overwrite a
  // newer draft. The keepalive form is used while leaving the route, when the
  // component can no longer wait for the response it promised as “自动暂存”.
  const enqueueDraftMutation = useCallback((keepalive = false) => {
    const revision = draftSync.revision
    const value = draftSync.value
    if (revision <= draftSync.persistedRevision) {
      return draftSync.queue
    }

    const queued = enqueueBuilderDraftMutation(
      journalScope.identity,
      async () => {
        if (revision <= draftSync.persistedRevision) return
        await builder.mutate(
          agentID,
          { field: PROMPT_FIELD, value },
          { keepalive },
        )
        draftSync.persistedRevision = Math.max(
          draftSync.persistedRevision,
          revision,
        )
        // The coordinated backend treats 200 as a durable commit ACK. Advance
        // this tab's confirmed base even when a newer local revision is queued;
        // that newer revision is now safely based on this confirmed prompt.
        basePromptRef.current = value
        acknowledgeDraftJournal(
          journalScope,
          journalTokenRef.current,
          writerID,
          value,
        )
        if (
          revision === draftSync.revision && value === draftSync.value
        ) {
          promptPersistedRef.current = true
        }
      },
    )
    draftSync.queue = queued
    return queued
  }, [agentID, draftSync, journalScope, writerID])

  useEffect(() => {
    let live = true
    setScenarioID(params.get('scenario') ?? '')
    setSide((params.get('side') as Side | null) ?? 'a')
    setPrompt('')
    setRoleKey(null)
    setModelID(null)
    setVersions([])
    setRestoredTag(null)
    setScenario(null)
    setLastEvent(null)
    setError(null)
    setRecovery(null)
    setSaving(false)
    setCopied(false)
    setNote('')
    setAgentName(null)
    setLoadedAgentID(null)
    initMethod.current = null
    promptPersistedRef.current = true
    basePromptRef.current = ''
    journalTokenRef.current = null
    setDraftLoading(true)
    void (async () => {
      try {
        const [draft, list] = await Promise.all([
          builder.draft(agentID),
          builder.versions(agentID),
        ])
        if (!live) return
        setScenarioID(draft.scenarioID)
        setSide(draft.side)
        setVersions(list.versions)
        // P5：模型属于版本、随版本快照（#13）——进入工作区默认沿用**最新
        // 版本**的模型，而不是模型清单的第一项。草稿层还不持久化模型，所以
        // 这里从版本线取；没有版本时才回落清单首项（见 models effect）。
        const latest = [...list.versions].sort((a, b) => b.id - a.id)[0]
        if (latest) setModelID(latest.modelID)
        const loadedPrompt = draft.fields[PROMPT_FIELD] ?? ''
        basePromptRef.current = loadedPrompt
        // E3「恢复到工作区」（#82）：?from=<versionID> 把该历史版本回填到工作
        // 区草稿——恢复本身不产生版本、不记录来源。一次性生效：用完即从 URL
        // 摘掉（replace，不留历史），刷新/重挂载不会再次覆盖工作区。
        const fromID = Number(params.get('from') ?? '')
        const fromVersion = list.versions.find((v) => v.id === fromID)
        if (fromVersion) {
          // 从 EA 过来的 ?from=：EA 侧已经确认过，这里直接载入（草稿的 prompt
          // 字段在服务端，预填走与打字相同的 mutate 通道，让草稿与所见一致）。
          draftSync.value = fromVersion.prompt
          draftSync.revision += 1
          promptPersistedRef.current = false
          setPrompt(fromVersion.prompt)
          setModelID(fromVersion.modelID)
          setRestoredTag(versionTag(fromVersion, list.versions))
          const role = roleOfOptions(
            scenarioModule(draft.scenarioID),
            fromVersion.options,
          )
          if (role && role.side === draft.side) setRoleKey(role.key)
          initMethod.current = null
          const journal = writeNextDraftJournal(journalScope, writerID, {
            basePrompt: loadedPrompt,
            prompt: fromVersion.prompt,
            promptPersisted: false,
            roleKey: role?.side === draft.side ? role.key : null,
            modelID: fromVersion.modelID,
            note: '',
            method: null,
            updatedAt: Date.now(),
          }, null)
          journalTokenRef.current = journal?.token ?? null
          void enqueueDraftMutation().catch(() => {})
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              next.delete('from')
              return next
            },
            { replace: true },
          )
        } else {
          const journal = latestDraftJournal(journalScope)
          const expired = journal != null &&
            Date.now() - journal.updatedAt > DRAFT_JOURNAL_AUTO_RESTORE_MS
          // Auto-recovery is deliberately three-way, not “local always wins”:
          // 1. server already equals local (the ACK was lost); or
          // 2. local is unacknowledged and server still equals its recorded base.
          // Any independent server change or a >14-day record stays preserved
          // behind an explicit recovery choice and is never POSTed on mount.
          const serverAlreadyHasLocal = !expired && journal != null &&
            journal.prompt === loadedPrompt
          const serverStillAtBase = !expired && journal != null &&
            !journal.promptPersisted && journal.basePrompt === loadedPrompt
          const autoRestore = serverAlreadyHasLocal || serverStillAtBase
          const restoredPrompt = autoRestore && journal != null
            ? journal.prompt
            : loadedPrompt
          draftSync.value = restoredPrompt
          setPrompt(restoredPrompt)
          promptPersistedRef.current = restoredPrompt === loadedPrompt
          if (journal != null && autoRestore) {
            if (journal.modelID != null) setModelID(journal.modelID)
            setNote(journal.note)
            initMethod.current = journal.method
            const journalRole = roleByKey(
              scenarioModule(draft.scenarioID),
              journal.roleKey,
            )
            if (journalRole?.side === draft.side) setRoleKey(journalRole.key)
            const claimed = writeNextDraftJournal(
              journalScope,
              writerID,
              {
                basePrompt: loadedPrompt,
                prompt: restoredPrompt,
                promptPersisted: restoredPrompt === loadedPrompt,
                roleKey: journal.roleKey,
                modelID: journal.modelID,
                note: journal.note,
                method: journal.method,
                updatedAt: Date.now(),
              },
              journal.token,
            )
            journalTokenRef.current = claimed?.token ?? journal.token
          } else if (journal != null) {
            setRecovery({ journal, reason: expired ? 'expired' : 'conflict' })
          }
          if (autoRestore && restoredPrompt !== loadedPrompt) {
            draftSync.revision += 1
            setLastEvent('已恢复本机未暂存的草稿，正在同步')
            void enqueueDraftMutation().catch(() => {})
          } else if (serverAlreadyHasLocal && journal != null) {
            // A hard close can lose only the response while the durable write
            // succeeds. Mark the claimed record confirmed without another POST.
            acknowledgeDraftJournal(
              journalScope,
              journalTokenRef.current,
              writerID,
              loadedPrompt,
            )
          }
        }
        setLoadedAgentID(agentID)
      } catch (cause) {
        if (live) setError(messageOf(cause))
      } finally {
        if (live) setDraftLoading(false)
      }
    })()
    return () => {
      live = false
    }
  }, [agentID, draftSync, enqueueDraftMutation, journalScope, writerID])

  // A scenario the SPA carries a module for lets the player cast his own side; the
  // choice rides along the saved version as the options blob the script parses.
  const roleModule = scenarioModule(scenarioID)
  const roles = rolesForSide(roleModule, side)

  useEffect(() => {
    if (roles.length === 0) {
      setRoleKey(null)
      return
    }
    setRoleKey((current) => {
      if (roles.some((role) => role.key === current)) return current
      const saved = roleOfOptions(
        roleModule,
        versions[versions.length - 1]?.options,
      )
      return saved?.side === side ? saved.key : roles[0].key
    })
  }, [scenarioID, side, versions])

  useEffect(() => {
    void catalog.models().then((list) => {
      setModels(list.models)
    }).catch(() => {})
  }, [])

  // Same-route agent navigation resets modelID. Once that agent's authoritative
  // draft/version list has loaded, a versionless agent falls back to the first
  // live catalog model; versioned agents were already set to their latest model.
  useEffect(() => {
    if (draftLoading || loadedAgentID !== agentID || versions.length > 0) return
    setModelID((current) => current ?? models[0]?.id ?? null)
  }, [agentID, draftLoading, loadedAgentID, models, versions.length])

  // P1：展示名来自 /my/agents（draft 不带 name）；失败静默——标题回落 id。
  useEffect(() => {
    let live = true
    void myAgents.list().then((inventory) => {
      if (!live) return
      for (const scenario of inventory.scenarios) {
        for (const which of ['a', 'b'] as const) {
          const hit = scenario.sides[which].find((a) => a.agentID === agentID)
          if (hit) setAgentName(hit.name ?? null)
        }
      }
    }).catch(() => {})
    return () => {
      live = false
    }
  }, [agentID])

  useEffect(() => {
    let live = true
    setConfigSettled(false)
    setConfigurationError(null)
    void configApi.get({ signal: AbortSignal.timeout(10000) }).then((value) => {
      if (live) setCfg(value)
    }).catch(() => {
      if (live) {
        setCfg(null)
        setConfigurationError(
          '首战配置加载失败，请重新加载后再开始；已保存版本不受影响。',
        )
      }
    }).finally(() => {
      if (live) setConfigSettled(true)
    })
    return () => {
      live = false
    }
  }, [configurationAttempt])

  useEffect(() => {
    if (!scenarioID) return
    let live = true
    setScenario(null)
    void catalog
      .scenario(scenarioID, side, { signal: AbortSignal.timeout(10000) })
      .then((value) => {
        if (live) setScenario(value)
      })
      .catch(() => {
        if (!live) return
        setScenario(null)
        if (express) setError('首战配置加载失败，请刷新后重试')
      })
    return () => {
      live = false
    }
  }, [express, scenarioID, side, configurationAttempt])

  useEffect(() => {
    const source = new EventSource(sseUrl(`/agents/${agentID}/stream`), {
      withCredentials: true,
    })
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as BuilderEventDTO
      if ('fieldMutated' in event || 'versionCreated' in event) {
        setLastEvent(null)
      }
    }
    return () => source.close()
  }, [agentID])

  useEffect(() => {
    const clearPendingTimer = () => {
      if (mutateTimer.current) clearTimeout(mutateTimer.current)
      mutateTimer.current = null
    }
    // SPA route exits keep this JavaScript context alive, so the serialized
    // queue can safely flush the latest value after any older request. Do not
    // start a second request on pagehide: without server-side client revisions,
    // its arrival could be overwritten by the older in-flight mutation.
    return () => {
      clearPendingTimer()
      void enqueueDraftMutation(true).catch(() => {})
    }
  }, [agentID, draftSync, enqueueDraftMutation])

  const latestVersion = [...versions].sort((a, b) => b.id - a.id)[0] ?? null

  const journalWorkspace = (
    overrides: Partial<Omit<DraftJournal, 'updatedAt'>> = {},
  ) => {
    // Merge from the synchronous journal first. This also protects two input
    // events delivered in one React batch: one handler cannot overwrite the
    // other field with a stale render closure.
    const existing = draftJournalByToken(
      journalScope,
      journalTokenRef.current,
    )
    const next = writeNextDraftJournal(journalScope, writerID, {
      basePrompt: basePromptRef.current,
      prompt: existing?.prompt ?? prompt,
      promptPersisted: promptPersistedRef.current,
      roleKey: existing ? existing.roleKey : roleKey,
      modelID: existing ? existing.modelID : modelID,
      note: existing?.note ?? note,
      method: existing ? existing.method : initMethod.current,
      ...overrides,
      updatedAt: Date.now(),
    }, existing?.token ?? null)
    if (next != null) journalTokenRef.current = next.token
  }

  const onPromptChange = (value: string) => {
    draftSync.value = value
    draftSync.revision += 1
    promptPersistedRef.current = false
    setPrompt(value)
    journalWorkspace({ prompt: value, promptPersisted: false })
    if (mutateTimer.current) clearTimeout(mutateTimer.current)
    mutateTimer.current = setTimeout(() => {
      mutateTimer.current = null
      void enqueueDraftMutation().catch(() => {})
    }, 400)
  }

  // Preset fills use the same authoritative server-draft channel as typing.
  const fillWorkspace = (value: string, method?: 'mcq' | 'builder') => {
    if (mutateTimer.current) {
      clearTimeout(mutateTimer.current)
      mutateTimer.current = null
    }
    const nextMethod = value.trim() ? method ?? null : null
    initMethod.current = nextMethod
    draftSync.value = value
    draftSync.revision += 1
    promptPersistedRef.current = false
    setPrompt(value)
    journalWorkspace({
      prompt: value,
      promptPersisted: false,
      method: nextMethod,
    })
    void enqueueDraftMutation().catch(() => {})
  }

  const recoverLocalDraft = () => {
    if (recovery == null) return
    const latest = latestDraftJournal(journalScope)
    if (latest?.token !== recovery.journal.token) {
      setError('本机草稿已在另一标签页更新，请刷新后再选择。')
      return
    }
    const local = recovery.journal
    setRecovery(null)
    setError(null)
    setPrompt(local.prompt)
    if (local.modelID != null) setModelID(local.modelID)
    setNote(local.note)
    initMethod.current = local.method
    const localRole = roleByKey(roleModule, local.roleKey)
    if (localRole?.side === side) setRoleKey(localRole.key)
    draftSync.value = local.prompt
    draftSync.revision += 1
    promptPersistedRef.current = false
    const claimed = writeNextDraftJournal(
      journalScope,
      writerID,
      {
        basePrompt: basePromptRef.current,
        prompt: local.prompt,
        promptPersisted: false,
        roleKey: local.roleKey,
        modelID: local.modelID,
        note: local.note,
        method: local.method,
        updatedAt: Date.now(),
      },
      local.token,
    )
    journalTokenRef.current = claimed?.token ?? local.token
    setLastEvent('已选择恢复本机草稿，正在同步')
    void enqueueDraftMutation().catch(() => {})
  }

  const keepServerDraft = () => {
    if (recovery == null) return
    const latest = latestDraftJournal(journalScope)
    if (latest?.token !== recovery.journal.token) {
      setError('本机草稿已在另一标签页更新，请刷新后再选择。')
      return
    }
    if (!compareAndDeleteDraftJournal(journalScope, recovery.journal)) {
      setError('无法清理本机草稿，请刷新后重试。')
      return
    }
    setRecovery(null)
    setError(null)
    setLastEvent('已保留服务器草稿')
  }

  const expressDependenciesReady = scenario != null && configSettled &&
    cfg != null
  let presetKey: string | null = null
  let presetError = configurationError
  if (express && expressDependenciesReady) {
    try {
      presetKey = firstBattlePreset(cfg, scenario, side)
    } catch (cause) {
      presetError = messageOf(cause)
    }
  }

  const continueFirstBattle = (matchID: number) => {
    navigate(`/matches/${matchID}`, { state: { express: true } })
  }

  const startFirstBattle = async () => {
    if (
      !express || startBusyRef.current || saveBusyRef.current || saving ||
      starting || draftLoading || loadedAgentID !== agentID ||
      !latestVersion || !presetKey || startAttempt || attemptError ||
      auth?.firstBattleDone || recovery != null || insufficientPoints
    ) return
    unlockAudio()
    playSound('click')
    // Freeze the SAVED version, not the editable workspace or the latest ★.
    const attempt: FirstBattleAttempt = {
      versionID: latestVersion.id,
      presetKey,
      status: 'pending',
    }
    const identity = journalScope.identity
    const route = location.key
    const requestID = ++saveRequestRef.current
    const belongsToBuilder = () =>
      liveRef.current &&
      saveRequestRef.current === requestID &&
      currentIdentityRef.current === identity
    const isCurrent = () =>
      belongsToBuilder() && currentRouteRef.current === route
    startBusyRef.current = true
    setStarting(true)
    setStartError(null)
    try {
      // Persist BEFORE sending. A reload after a lost response must not turn an
      // uncertain POST into a second dispatch. This is tab-scoped, not server
      // idempotency or a cross-tab exactly-once guarantee.
      writeFirstBattleAttempt(identity, attempt)
    } catch {
      setAttemptError('无法保留首战派发记录，请检查浏览器存储；尚未派发对局。')
      startBusyRef.current = false
      setStarting(false)
      return
    }
    setStartAttempt(attempt)
    try {
      const response = await matches.dispatchPVE({
        versionID: attempt.versionID,
        presetKey: attempt.presetKey,
      }, { signal: AbortSignal.timeout(30000) })
      const accepted: FirstBattleAttempt = {
        ...attempt,
        status: 'accepted',
        matchID: response.matchID,
      }
      try {
        writeFirstBattleAttempt(identity, accepted)
      } catch {
        // The pre-POST pending record remains conservative if this write fails.
      }
      if (belongsToBuilder()) setStartAttempt(accepted)
      trackSoundMatch(response.matchID)
      if (isCurrent()) {
        playSound('dispatch', String(response.matchID))
        continueFirstBattle(response.matchID)
      }
    } catch (cause) {
      const rejected = cause instanceof ApiError &&
        [400, 401, 402, 403, 404, 409, 413, 422, 429].includes(cause.status)
      if (rejected) {
        try {
          writeFirstBattleAttempt(identity, null)
        } catch {
          if (belongsToBuilder()) {
            setAttemptError('无法更新首战派发记录，请先到「我的对局」核对。')
          }
        }
      }
      if (!belongsToBuilder()) return
      if (rejected) setStartAttempt(null)
      setStartError(
        rejected
          ? `${
            rejectCopy(cause, cfg, '首战派发被拒绝')
          }；版本已保存，可再次点击「开始首战」。`
          : '首战请求结果尚未确认，请到「我的对局」核对；不要重复派发。',
      )
    } finally {
      if (belongsToBuilder()) {
        startBusyRef.current = false
        setStarting(false)
      }
    }
  }

  const save = async () => {
    if (
      saveBusyRef.current || startBusyRef.current || saving || starting ||
      modelID == null || draftLoading || loadedAgentID !== agentID ||
      !prompt.trim() || recovery != null || (express && auth?.firstBattleDone)
    ) return
    unlockAudio()
    playSound('click')
    // Everything below uses this immutable click-time snapshot. The controls
    // are disabled on the same render as `saving`, so a slow final draft flush
    // cannot silently mix a newer prompt/note/model/role into this version.
    const snapshot = {
      prompt,
      method: initMethod.current ?? 'raw',
      modelID,
      note: note.trim(),
      options: roleKey == null ? null : roleOptions(roleKey),
      journal: (() => {
        const journal = draftJournalByToken(
          journalScope,
          journalTokenRef.current,
        )
        return journal == null
          ? null
          : { token: journal.token, revision: journal.revision }
      })(),
    }
    const requestID = ++saveRequestRef.current
    const identity = journalScope.identity
    const route = location.key
    const belongsToBuilder = () =>
      liveRef.current && saveRequestRef.current === requestID &&
      currentIdentityRef.current === identity
    const requestIsCurrent = () =>
      belongsToBuilder() && currentRouteRef.current === route
    saveBusyRef.current = true
    setSaving(true)
    setError(null)
    // 保存后立刻离开本页：把还压在 debounce 里的最后一段输入先冲给服务器
    // 草稿，避免卸载时被丢弃（版本本身用的是本地 prompt，不受影响）。
    // 保存前把还压在 debounce 里的最后一段输入**同步等**落库：草稿必须与即将
    // 产生的版本一致，否则重进工作区时服务端草稿仍停在上一版，P11 会误判
    // 「有未保存的改动」（08-15 实测踩到）。
    if (mutateTimer.current) {
      clearTimeout(mutateTimer.current)
      mutateTimer.current = null
    }
    try {
      try {
        await enqueueDraftMutation()
      } catch {
        if (requestIsCurrent()) {
          setError('草稿暂存失败，请检查网络后重试；尚未创建新版本。')
        }
        return
      }
      if (!requestIsCurrent()) return
      // E2（#82）：版本严格线性、不记父子——保存不再携带 parentVersionID。
      const saved = await builder.save(agentID, {
        prompt: snapshot.prompt,
        method: snapshot.method,
        modelID: snapshot.modelID,
        ...(snapshot.note === '' ? {} : { note: snapshot.note }),
        ...(snapshot.options == null ? {} : { options: snapshot.options }),
      })
      // A hash/query navigation can retain this builder. Reconcile the known
      // immutable result for its identity without taking over the new route or
      // clearing draft fields that the new location may now own.
      if (belongsToBuilder()) {
        setVersions((
          current,
        ) => [...current.filter((version) => version.id !== saved.id), saved])
      }
      if (!requestIsCurrent()) return
      playSound('save', `${agentID}:${saved.id}`)
      if (snapshot.journal != null) {
        if (compareAndDeleteDraftJournal(journalScope, snapshot.journal)) {
          journalTokenRef.current = null
        }
      }
      if (express) {
        setNote('')
        basePromptRef.current = snapshot.prompt
        setLastEvent(
          `版本 v${saved.ordinal} 已保存；点击「开始首战」才会派发对局`,
        )
        return
      }
      // Keso's low-complexity builder returns to the high-information home,
      // where the new immutable version, entry selection, comparison and
      // battle actions live. The backend remains authoritative about whether
      // this first version automatically receives the side's entry slot.
      navigate(`/agents/${agentID}`, {
        state: { savedVersionID: saved.id },
      })
    } catch (cause) {
      if (!requestIsCurrent()) return
      // #14：计数器仅提示、保存由服务端强制；prompt_too_long 的产品文案
      // 把玩家指回右下角计数器（映射集中在 lib/reject-copy）。
      setError(rejectCopy(cause, null, '保存失败'))
    } finally {
      if (belongsToBuilder()) {
        saveBusyRef.current = false
        setSaving(false)
      }
    }
  }

  // P14：E8 承诺过的「复制当前文本」——平台不做 AI 改写，就得给复制手段。
  const copyPrompt = async () => {
    const value = prompt
    try {
      if (navigator.clipboard?.writeText == null) throw new Error('clipboard')
      await navigator.clipboard.writeText(value)
      if (!liveRef.current) return
      setCopied(true)
      setTimeout(() => {
        if (liveRef.current) setCopied(false)
      }, 1500)
    } catch {
      if (!liveRef.current) return
      setCopied(false)
      setError('复制失败，请手动选择策略提示词并复制。')
    }
  }

  // P5 的显示侧：版本继承来的模型可能已不在当前可选清单里（模型下线/更名）。
  // 那时 Select 找不到匹配项会退回「请选择…」，看上去像没选——把它作为一条
  // 合成选项补进去，保证选择器显示的就是这一版真正会用的模型。
  const modelOptions = modelID != null &&
      !models.some((model) => model.id === modelID)
    ? [...models, { id: modelID, label: modelID }]
    : models

  const promptPlaceholder = '你希望智能体如何思考、回应和行动？'

  const selectedRole = roleByKey(roleModule, roleKey)
  // #14：按汉字或英文词计（非 token），P1 仅提示、不阻断保存。上限来自
  // GET /v1/config；config 未到手前只报已用字数，不摆一个可能过时的数。
  const units = promptLength(prompt)
  const promptUnitLimit = cfg?.promptUnitLimit ?? null
  const overLimit = promptUnitLimit != null && units > promptUnitLimit
  const workspaceReady = !draftLoading && loadedAgentID === agentID

  // Helpers remain available for every draft/version. Persona-specific decks
  // still key off the selected role, so changing role resets only the helper.
  const deck = deckFor(scenarioID, side, roleKey)
  const sideDisplayName = scenario
    ? (side === 'a' ? scenario.summary.sideAName : scenario.summary.sideBName)
    : side === 'a'
    ? '甲方'
    : '乙方'
  // #68 只读角色模板：内容由场景模块供稿（并行编写中），缺席走通用兜底。
  const roleTemplate = roleModule?.roleTemplates?.[side] ??
    '该场景的角色模板文案整理中——比赛时系统仍会自动为你合并官方角色模板，无需在提示词里重复编写。'
  const savedRoleKey = latestVersion
    ? roleOfOptions(roleModule, latestVersion.options)?.key ?? null
    : null
  const unsavedFirstBattleChanges = latestVersion != null && (
    prompt !== latestVersion.prompt || modelID !== latestVersion.modelID ||
    roleKey !== savedRoleKey || note.trim() !== ''
  )

  return (
    <div className='space-y-6'>
      <TypingFeedback />
      <div>
        <Link
          to={`/agents/${agentID}`}
          className='text-sm text-(--foreground-subtle) transition hover:text-(--foreground)'
          {...tm('E.back-link')}
        >
          ← 智能体主页
        </Link>
        <h1
          className='mt-2 text-2xl font-black tracking-tight text-(--foreground)'
          {...tm('E.page-title')}
        >
          智能体构建器
        </h1>
        <p
          className='mt-1 text-sm text-(--foreground-subtle)'
          {...tm('E.agent-name')}
        >
          {scenario ? scenario.summary.title : scenarioID} ·{' '}
          {agentName != null && agentName !== ''
            ? `${sideDisplayName}「${agentName}」`
            : `${sideDisplayName} #${agentID}`}
        </p>
      </div>

      {workspaceReady
        ? (
          <fieldset
            disabled={saving || starting || recovery != null}
            className='min-w-0 border-0 p-0'
            aria-busy={saving}
          >
            <legend className='sr-only'>策略辅助</legend>
            <InitModes
              key={`${scenarioID}:${side}:${roleKey ?? ''}:${
                requestedTool ?? (express ? 'express' : 'default')
              }`}
              express={express}
              initialTool={requestedTool}
              onDirect={focusPrompt}
              deck={deck}
              metaPrompt={metaPromptFor(
                roleModule,
                scenario?.summary.title ?? scenarioID,
                side,
                sideDisplayName,
                scenario?.scoring,
                roleKey,
                promptUnitLimit,
              )}
              currentPrompt={prompt}
              onFill={fillWorkspace}
              promptUnitLimit={promptUnitLimit}
            />
          </fieldset>
        )
        : null}

      {restoredTag != null
        ? (
          <p
            className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'
            {...tm('E.restored-notice')}
          >
            已载入 {restoredTag}，修改后保存会生成新版本。
          </p>
        )
        : null}

      {recovery != null
        ? (
          <section
            aria-label='本机草稿恢复'
            className='space-y-3 rounded-lg border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-3 py-3'
            data-testid='draft-recovery'
          >
            <div className='space-y-1'>
              <p className='text-sm text-(--warning)'>
                {recovery.reason === 'expired'
                  ? '本机留有一份超过 14 天的草稿，未自动恢复。'
                  : '服务器草稿已更新，本机副本未自动恢复。'}
              </p>
              <p className='line-clamp-2 text-xs text-(--foreground-subtle)'>
                本机副本：{recovery.journal.prompt || '（空白）'}
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                onClick={recoverLocalDraft}
              >
                恢复本机副本
              </Button>
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={keepServerDraft}
              >
                使用服务器草稿
              </Button>
            </div>
          </section>
        )
        : null}

      {error
        ? (
          <p className='text-sm text-(--accent)' {...tm('E.error')}>
            {error}
          </p>
        )
        : null}

      <fieldset
        disabled={saving || starting || !workspaceReady || recovery != null}
        aria-busy={saving}
        className='space-y-4 rounded-xl border border-(--border-soft) bg-white/2 p-4 sm:p-5'
        {...tm('E.workspace-card')}
      >
        <legend className='sr-only'>版本内容</legend>
        <div className='flex items-center justify-between gap-2'>
          <label
            htmlFor='prompt-input'
            className='text-sm text-(--foreground-subtle)'
          >
            策略提示词
          </label>
          {/* P14：E8 早已承诺、线上一直缺席的按钮 */}
          <Button
            type='button'
            variant='ghost'
            className='h-11 w-11 px-0 md:h-10 md:w-10'
            onClick={() => void copyPrompt()}
            disabled={saving || prompt.trim() === ''}
            aria-label={copied ? '已复制当前草稿' : '复制当前草稿'}
            title={copied ? '已复制' : '复制当前草稿'}
            {...tm('E.copy-prompt-button')}
          >
            {copied
              ? (
                <Check
                  aria-hidden='true'
                  className='h-4 w-4 text-(--success)'
                />
              )
              : <Copy aria-hidden='true' className='h-4 w-4' />}
          </Button>
        </div>
        <div className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
          <Textarea
            data-spec='U19-C17 U19-C18'
            id='prompt-input'
            rows={18}
            value={prompt}
            disabled={!workspaceReady || saving}
            aria-busy={draftLoading || saving}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={promptPlaceholder}
            className='min-h-[46dvh] resize-y bg-(--background) text-base leading-7'
            {...tm('E.prompt-input')}
          />
        </div>
        <div className='flex justify-end'>
          <span
            className={`shrink-0 font-mono text-xs ${
              overLimit ? 'text-(--accent)' : 'text-(--foreground-muted)'
            }`}
            title='按汉字或英文词计数（非 token）'
            {...tm('E.length-counter')}
          >
            {units} / {promptUnitLimit ?? '—'}
          </span>
        </div>
        {overLimit
          ? (
            <p role='alert' className='text-xs text-(--accent)'>
              当前策略超过字数上限，请精简后再保存。
            </p>
          )
          : null}
        <div className='flex flex-wrap items-end gap-2 border-t border-(--border-soft) pt-4'>
          {roles.length > 0
            ? (
              <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
                <span
                  className='block'
                  title='角色决定你在这一局里的身份与筹码'
                >
                  出场角色
                </span>
                <div
                  className='w-[min(14rem,calc(100vw-3rem))]'
                  {...tm('E.role-select')}
                >
                  <Select
                    key={`role:${saving}`}
                    placeholder='选择角色'
                    value={roleKey}
                    className='h-11 md:h-10'
                    disabled={!workspaceReady || saving}
                    renderValue={(v) => roleByKey(roleModule, v)?.name ?? v}
                    onValueChange={(v) => {
                      if (!v) return
                      setRoleKey(v)
                      journalWorkspace({ roleKey: v })
                    }}
                  >
                    {roles.map((role) => (
                      <SelectItem key={role.key} value={role.key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </label>
            )
            : null}
          <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span
              className='block'
              title='模型影响 AI 的表达风格和推理能力'
            >
              模型
            </span>
            <div
              className='w-[min(14rem,calc(100vw-3rem))]'
              {...tm('E.model-select')}
            >
              <Select
                key={`model:${saving}`}
                value={modelID}
                className='h-11 md:h-10'
                disabled={!workspaceReady || saving}
                renderValue={(v) =>
                  modelOptions.find((model) => model.id === v)?.label ?? v}
                onValueChange={(v) => {
                  if (!v) return
                  setModelID(v)
                  journalWorkspace({ modelID: v })
                }}
              >
                {modelOptions.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </label>
          <VersionNote
            key={`note:${saving}`}
            value={note}
            onChange={(value) => {
              setNote(value)
              journalWorkspace({ note: value })
            }}
          />
          <Button
            data-testid='save-version'
            data-spec='U19-C06 U19-C19 U19-C20'
            onPointerEnter={playButtonHover}
            className='h-11 sm:ml-auto md:h-10'
            onClick={() => void save()}
            disabled={saving || starting || draftLoading ||
              loadedAgentID !== agentID ||
              !prompt.trim() || modelID == null || overLimit ||
              recovery != null}
            {...tm('E.save-button')}
          >
            {saving ? '保存中…' : express ? '保存版本' : '保存并返回主页'}
          </Button>
          {lastEvent
            ? (
              <span
                className='text-xs text-(--foreground-muted)'
                {...tm('E.autosave-status')}
              >
                {lastEvent}
              </span>
            )
            : null}
        </div>
        {selectedRole
          ? (
            <p
              className='text-xs text-(--foreground-muted)'
              {...tm('E.role-pitch')}
            >
              {selectedRole.pitch}
            </p>
          )
          : null}
      </fieldset>

      {express && latestVersion
        ? (
          <section
            aria-label='开始首战'
            className='space-y-3 rounded-xl border border-(--border-soft) p-4'
            data-testid='first-battle-start'
          >
            <p className='font-semibold'>
              已保存版本 v{latestVersion.ordinal}（#{latestVersion.id}）
            </p>
            <p className='text-sm text-(--foreground-subtle)'>
              保存不会发起对局或消耗积分。点击「开始首战」后使用此版本和新手预设对手。
            </p>
            <BattleCostNotice quoteState={quoteState} />
            {unsavedFirstBattleChanges
              ? (
                <p role='status' className='text-sm text-(--warning)'>
                  工作区有未保存修改；本次首战只使用上述已保存版本。需要使用修改后的策略时，请先保存。
                </p>
              )
              : null}
            {presetError ? <p role='alert'>{presetError}</p> : null}
            {startError ? <p role='alert'>{startError}</p> : null}
            {attemptError ? <p role='alert'>{attemptError}</p> : null}
            {startAttempt?.status === 'accepted' && startAttempt.matchID != null
              ? (
                <Button
                  onClick={() => continueFirstBattle(startAttempt.matchID!)}
                >
                  继续首战 #{startAttempt.matchID}
                </Button>
              )
              : startAttempt?.status === 'pending' && !starting
              ? (
                <p role='status'>
                  首战请求结果尚未确认，请先核对对局记录，不会自动重新派发。
                </p>
              )
              : (
                <Button
                  data-testid='start-first-battle'
                  data-spec='U19-C07 U19-C19 U19-C20'
                  onPointerEnter={playButtonHover}
                  onClick={() => void startFirstBattle()}
                  disabled={saving || starting || !presetKey ||
                    !!attemptError || recovery != null || insufficientPoints}
                >
                  {starting ? '派发中…' : '开始首战'}
                </Button>
              )}
            {(!expressDependenciesReady || presetError) && !starting
              ? (
                <Button
                  variant='secondary'
                  onClick={() => setConfigurationAttempt((value) => value + 1)}
                >
                  重新加载首战配置
                </Button>
              )
              : null}
            {startAttempt?.status === 'pending' || attemptError
              ? (
                <Link className='block text-sm underline' to='/matches'>
                  查看我的对局
                </Link>
              )
              : null}
          </section>
        )
        : null}

      <Accordion className='rounded-xl border border-(--border-soft) px-4'>
        <AccordionItem
          value='role-template'
          title={
            <span {...tm('E.role-template-toggle')}>
              角色系统提示词
            </span>
          }
        >
          <p
            className='whitespace-pre-wrap text-xs leading-relaxed text-(--foreground-subtle)'
            {...tm('E.role-template-text')}
          >
            {roleTemplate}
          </p>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
