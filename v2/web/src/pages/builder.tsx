import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { builder, catalog, matches, sseUrl } from '../api/client'
import type {
  AgentVersionDTO,
  BuilderEventDTO,
  ModelDTO,
  OpponentAgentDTO,
  PresetOpponentDTO,
  ScenarioDetail,
  Side,
} from '../api/types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { messageOf } from '../lib/use-async'
import {
  roleByKey,
  roleOfOptions,
  roleOptions,
  rolesForSide,
  scenarioModule,
} from '../scenarios'

const PROMPT_FIELD = 'prompt'

// Hotseat is not a third dispatch route: it is a PVP match whose opponent agent
// happens to be your own, which the server already allows.
type OpponentMode = 'pve' | 'pvp' | 'hotseat'

const MODE_LABELS: Record<OpponentMode, string> = {
  pve: '预设对手',
  pvp: '其他玩家',
  hotseat: '左右手互搏',
}

export function BuilderPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const [params] = useSearchParams()
  const navigate = useNavigate()

  // Query params are a first-paint hint only; the draft response is authoritative
  // and overwrites them, so entering the builder without a query string works.
  const [scenarioID, setScenarioID] = useState(params.get('scenario') ?? '')
  const [side, setSide] = useState<Side>(
    (params.get('side') as Side | null) ?? 'a',
  )

  const [prompt, setPrompt] = useState('')
  const [roleKey, setRoleKey] = useState<string | null>(null)
  const [models, setModels] = useState<ModelDTO[]>([])
  const [modelID, setModelID] = useState<string | null>(null)
  const [versions, setVersions] = useState<AgentVersionDTO[]>([])
  const [entryVersionID, setEntryVersionID] = useState<number | null>(null)
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [presetKey, setPresetKey] = useState<string | null>(null)
  const [mode, setMode] = useState<OpponentMode>('pve')
  const [opponents, setOpponents] = useState<OpponentAgentDTO[]>([])
  const [opponentAgentID, setOpponentAgentID] = useState<number | null>(null)
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const mutateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshVersions = async () => {
    const list = await builder.versions(agentID)
    setVersions(list.versions)
    setEntryVersionID(list.entryVersionID ?? null)
  }

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        const [draft, list] = await Promise.all([
          builder.draft(agentID),
          builder.versions(agentID),
        ])
        if (!live) return
        setScenarioID(draft.scenarioID)
        setSide(draft.side)
        setPrompt(draft.fields[PROMPT_FIELD] ?? '')
        setVersions(list.versions)
        setEntryVersionID(list.entryVersionID ?? null)
      } catch (cause) {
        if (live) setError(messageOf(cause))
      }
    })()
    return () => {
      live = false
    }
  }, [agentID])

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
      setModelID((current) => current ?? list.models[0]?.id ?? null)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!scenarioID) return
    // Presets on the opposite side are the PvE opponents for this agent.
    void catalog
      .scenario(scenarioID, side)
      .then(setScenario)
      .catch(() => setScenario(null))
  }, [scenarioID, side])

  useEffect(() => {
    const opponents = scenario?.presets.filter((preset) =>
      preset.side !== side
    ) ?? []
    setPresetKey((current) =>
      opponents.some((preset) => preset.key === current)
        ? current
        : opponents[0]?.key ?? null
    )
  }, [scenario, side])

  useEffect(() => {
    if (!scenarioID) return
    void catalog
      .opponents(scenarioID, side === 'a' ? 'b' : 'a')
      .then((list) => setOpponents(list.opponents))
      .catch(() => setOpponents([]))
  }, [scenarioID, side])

  useEffect(() => {
    const source = new EventSource(sseUrl(`/agents/${agentID}/stream`), {
      withCredentials: true,
    })
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as BuilderEventDTO
      if ('fieldMutated' in event) {
        setLastEvent(`字段已同步：${event.fieldMutated.field}`)
      } else if ('versionCreated' in event) {
        setLastEvent(`版本已创建：#${event.versionCreated.versionID}`)
      }
    }
    return () => source.close()
  }, [agentID])

  useEffect(
    () => () => {
      if (mutateTimer.current) clearTimeout(mutateTimer.current)
    },
    [],
  )

  const onPromptChange = (value: string) => {
    setPrompt(value)
    if (mutateTimer.current) clearTimeout(mutateTimer.current)
    mutateTimer.current = setTimeout(() => {
      void builder
        .mutate(agentID, { field: PROMPT_FIELD, value })
        .catch(() => {})
    }, 400)
  }

  const save = async () => {
    if (modelID == null) return
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const version = await builder.save(agentID, {
        prompt,
        modelID,
        parentVersionID: entryVersionID,
        ...(roleKey == null ? {} : { options: roleOptions(roleKey) }),
      })
      setStatus(`已保存版本 #${version.id}`)
      await refreshVersions()
    } catch (cause) {
      setError(messageOf(cause, '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  const setEntry = async (versionID: number) => {
    await builder.setEntry(agentID, versionID).catch(() => {})
    await refreshVersions()
  }

  const promptPlaceholder = side === 'a'
    ? '例如：先明确你的立场，再用裁判最难忽视的风险和利益组织论点…'
    : '例如：先拆解对方方案的成本，再把你的真诉求藏在可执行的条件中…'

  const selectedRole = roleByKey(roleModule, roleKey)
  const opponentPresets: PresetOpponentDTO[] =
    scenario?.presets.filter((preset) => preset.side !== side) ?? []
  // A preset cast for a role says so; one without options is just its own label.
  const presetLabel = (preset: PresetOpponentDTO) => {
    const role = roleOfOptions(roleModule, preset.options)
    return role ? `${preset.label} · ${role.name}` : preset.label
  }
  const rivalAgents = opponents.filter((opponent) => !opponent.isSelf)
  const ownOppositeAgents = opponents.filter((opponent) => opponent.isSelf)
  const modeOpponents = mode === 'hotseat' ? ownOppositeAgents : rivalAgents

  // The server fields an opponent's entry version else their latest; field ours
  // the same way, so a freshly saved version is playable without marking it.
  const fieldedVersionID = entryVersionID ??
    versions[versions.length - 1]?.id ?? null

  const canDispatch = fieldedVersionID != null &&
    (mode === 'pve' ? presetKey != null : opponentAgentID != null)

  const dispatch = async () => {
    if (fieldedVersionID == null) return
    setError(null)
    try {
      const response = mode === 'pve'
        ? presetKey == null ? null : await matches.dispatchPVE({
          versionID: fieldedVersionID,
          presetKey,
        })
        : opponentAgentID == null
        ? null
        : await matches.dispatchPVP({
          versionID: fieldedVersionID,
          opponentAgentID,
        })
      if (response == null) return
      navigate(`/matches/${response.matchID}`)
    } catch (cause) {
      setError(messageOf(cause, '发起对战失败'))
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          智能体构建器
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          {scenario ? scenario.summary.title : scenarioID} · 为
          {side === 'a' ? '甲' : '乙'}方 · agent #{agentID}
        </p>
      </div>

      {error ? <p className='text-sm text-(--accent)'>{error}</p> : null}

      <Card>
        <CardContent className='space-y-4 pt-5'>
          <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span>系统提示词</span>
            <Textarea
              rows={10}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={promptPlaceholder}
            />
          </label>
          <div className='flex flex-wrap items-end gap-3'>
            {roles.length > 0
              ? (
                <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
                  <span
                    className='block'
                    title='角色决定你在这一局里的身份与筹码'
                  >
                    出场角色
                  </span>
                  <div className='w-56'>
                    <Select
                      placeholder='选择角色'
                      value={roleKey ?? undefined}
                      onValueChange={(v) => v && setRoleKey(v)}
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
              <div className='w-56'>
                <Select
                  value={modelID ?? undefined}
                  onValueChange={(v) => v && setModelID(v)}
                >
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </label>
            <Button
              data-testid='save-version'
              onClick={() => void save()}
              disabled={saving || !prompt.trim() || modelID == null}
            >
              {saving ? '保存中…' : '保存版本'}
            </Button>
            {status
              ? <span className='text-sm text-(--success)'>{status}</span>
              : null}
            {lastEvent
              ? (
                <span className='text-xs text-(--foreground-muted)'>
                  {lastEvent}
                </span>
              )
              : null}
          </div>
          {selectedRole
            ? (
              <p className='text-xs text-(--foreground-muted)'>
                {selectedRole.pitch}
              </p>
            )
            : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-3 pt-5'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            版本历史
          </h2>
          {versions.length === 0
            ? (
              <p className='text-sm text-(--foreground-muted)'>
                还没有版本。写好提示词后点击“保存版本”。
              </p>
            )
            : (
              <ul className='space-y-2'>
                {versions.map((version) => (
                  <li
                    key={version.id}
                    className='flex items-center justify-between gap-3 rounded-md border border-(--border-soft) bg-white/2 px-3 py-2'
                  >
                    <div className='min-w-0'>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono text-sm text-(--foreground)'>
                          v#{version.id}
                        </span>
                        <span className='text-xs text-(--foreground-muted)'>
                          {version.modelID}
                        </span>
                        {version.id === entryVersionID
                          ? <Badge tone='success'>出战</Badge>
                          : null}
                      </div>
                      <p className='truncate text-xs text-(--foreground-subtle)'>
                        {version.prompt}
                      </p>
                    </div>
                    {version.id !== entryVersionID
                      ? (
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() => void setEntry(version.id)}
                        >
                          设为出战
                        </Button>
                      )
                      : null}
                  </li>
                ))}
              </ul>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='space-y-3 pt-5'>
          <h2 className='text-sm font-semibold text-(--foreground)'>
            发起对战
          </h2>
          <div className='flex flex-wrap items-center gap-2'>
            {(['pve', 'pvp', 'hotseat'] as const).map((option) => (
              <Button
                key={option}
                size='sm'
                variant={mode === option ? 'primary' : 'secondary'}
                onClick={() => {
                  setMode(option)
                  setOpponentAgentID(null)
                }}
              >
                {MODE_LABELS[option]}
              </Button>
            ))}
          </div>

          {mode === 'pve'
            ? opponentPresets.length === 0
              ? (
                <p className='text-sm text-(--foreground-muted)'>
                  该场景暂无对手侧的预设对手。
                </p>
              )
              : (
                <div className='w-56'>
                  <Select
                    placeholder='选择预设对手'
                    value={presetKey ?? undefined}
                    onValueChange={(v) => setPresetKey(v ?? null)}
                  >
                    {opponentPresets.map((preset) => (
                      <SelectItem key={preset.key} value={preset.key}>
                        {presetLabel(preset)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              )
            : modeOpponents.length === 0
            ? (
              <p className='text-sm text-(--foreground-muted)'>
                {mode === 'hotseat'
                  ? '你还没有为对手方构建智能体。先去场景页为另一方建一个并保存版本。'
                  : '还没有其他玩家在对手方保存过版本。'}
              </p>
            )
            : (
              <div className='w-56'>
                <Select
                  placeholder={mode === 'hotseat'
                    ? '选择你的对手方'
                    : '选择对手'}
                  value={opponentAgentID != null
                    ? String(opponentAgentID)
                    : undefined}
                  onValueChange={(v) =>
                    setOpponentAgentID(v ? Number(v) : null)}
                >
                  {modeOpponents.map((opponent) => (
                    <SelectItem
                      key={opponent.agentID}
                      value={String(opponent.agentID)}
                    >
                      {opponent.displayName} · agent #{opponent.agentID}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

          <div className='flex flex-wrap items-center gap-3'>
            <Button
              data-testid='dispatch-match'
              onClick={() => void dispatch()}
              disabled={!canDispatch}
            >
              发起对战
            </Button>
            {fieldedVersionID == null
              ? (
                <span className='text-xs text-(--foreground-muted)'>
                  先保存一个版本才能出战。
                </span>
              )
              : (
                <span className='text-xs text-(--foreground-muted)'>
                  出战版本 v#{fieldedVersionID}
                </span>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
