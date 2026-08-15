import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
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
import { OsPanel } from '../components/os-panel'
import { VersionList } from '../components/version-list'
import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { initModesAvailable } from '../lib/deck'
import { metaPromptFor } from '../lib/meta-prompt'
import { PROMPT_UNIT_LIMIT, promptLength } from '../lib/prompt-length'
import { rejectCopy } from '../lib/reject-copy'
import { messageOf } from '../lib/use-async'
import { nextVersionCopy, versionTag } from '../lib/version-label'
import {
  roleByKey,
  roleOfOptions,
  roleOptions,
  rolesForSide,
  scenarioModule,
} from '../scenarios'
import { deckFor } from '../scenarios/decks'

const PROMPT_FIELD = 'prompt'

// 工作区（E1/#81）＋ 内嵌版本线（E11/#88）：本页就是一个策略的**编辑现场**——
// 上半是唯一的工作区草稿（高频自动暂存，草稿非版本、从不直接参战），下半是
// 本策略的完整版本线。点保存＝产生一个新版本（E2/#82：严格线性、无父子）后
// **留在本页**（#88：不再跳回 EA），就地把新版插进版本线顶端。版本卡动作按
// #89/#90：基于该版本迭代 / 设为参赛版本 / 出战——「复制为新智能体」已废止。
export function BuilderPage() {
  const { agentId = '' } = useParams()
  const agentID = Number(agentId)
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  // Query params are a first-paint hint only; the draft response is authoritative
  // and overwrites them, so entering the builder without a query string works.
  const [scenarioID, setScenarioID] = useState(params.get('scenario') ?? '')
  const [side, setSide] = useState<Side>(
    (params.get('side') as Side | null) ?? 'a',
  )
  // A3 首战快速通道（#9/#10/#17 例外）：?express=1 时保存＝自动派发首战并
  // 直进实况；无侧别选择（#57——执方本就来自 agent，本页从无切侧控件）。
  const express = params.get('express') === '1'

  const [prompt, setPrompt] = useState('')
  const [roleKey, setRoleKey] = useState<string | null>(null)
  const [models, setModels] = useState<ModelDTO[]>([])
  const [modelID, setModelID] = useState<string | null>(null)
  const [versions, setVersions] = useState<AgentVersionDTO[]>([])
  const [restoredTag, setRestoredTag] = useState<string | null>(null)
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null)
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [draftLoading, setDraftLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // 清空工作区（E7 的唯一回头路）：两步就地确认，不弹窗。
  const [clearArmed, setClearArmed] = useState(false)
  // #88：版本线与出战都搬进本页。
  const [osOpen, setOsOpen] = useState(false)
  const [preferVersionID, setPreferVersionID] = useState<number | null>(null)
  const [entryVersionID, setEntryVersionID] = useState<number | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // P1：策略展示名（#63）。draft 接口不带 name，先从 /my/agents 取。
  const [agentName, setAgentName] = useState<string | null>(null)
  // P11（Yihan 修订）：只有草稿与最新版本不一致时才拦——一致说明没有未保存
  // 的改动，直接载入不打扰。pendingIterate 是待确认的目标版本。
  const [pendingIterate, setPendingIterate] = useState<AgentVersionDTO | null>(
    null,
  )
  // express 专用：config 供新手预设对手 key 与拒绝文案数字；失败按 null
  // 降级（对手回落到第一个对侧预设）。
  const [cfg, setCfg] = useState<ConfigResponse | null>(null)
  const mutateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let live = true
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
        setEntryVersionID(list.entryVersionID ?? null)
        // P5：模型属于版本、随版本快照（#13）——进入工作区默认沿用**最新
        // 版本**的模型，而不是模型清单的第一项。草稿层还不持久化模型，所以
        // 这里从版本线取；没有版本时才回落清单首项（见 models effect）。
        const latest = [...list.versions].sort((a, b) => b.id - a.id)[0]
        if (latest) setModelID(latest.modelID)
        // E3「恢复到工作区」（#82）：?from=<versionID> 把该历史版本回填到工作
        // 区草稿——恢复本身不产生版本、不记录来源。一次性生效：用完即从 URL
        // 摘掉（replace，不留历史），刷新/重挂载不会再次覆盖工作区。
        const fromID = Number(params.get('from') ?? '')
        const fromVersion = list.versions.find((v) => v.id === fromID)
        if (fromVersion) {
          // 从 EA 过来的 ?from=：EA 侧已经确认过，这里直接载入（草稿的 prompt
          // 字段在服务端，预填走与打字相同的 mutate 通道，让草稿与所见一致）。
          setPrompt(fromVersion.prompt)
          setModelID(fromVersion.modelID)
          setRestoredTag(versionTag(fromVersion, list.versions))
          const role = roleOfOptions(
            scenarioModule(draft.scenarioID),
            fromVersion.options,
          )
          if (role && role.side === draft.side) setRoleKey(role.key)
          void builder
            .mutate(agentID, { field: PROMPT_FIELD, value: fromVersion.prompt })
            .catch(() => {})
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              next.delete('from')
              return next
            },
            { replace: true },
          )
        } else {
          setPrompt(draft.fields[PROMPT_FIELD] ?? '')
        }
      } catch (cause) {
        if (live) setError(messageOf(cause))
      } finally {
        if (live) setDraftLoading(false)
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
      // 只有在没能从最新版本继承到模型时才回落清单首项（P5）。
      setModelID((current) => current ?? list.models[0]?.id ?? null)
    }).catch(() => {})
  }, [])

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
    if (!express) return
    let live = true
    void configApi.get().then((value) => {
      if (live) setCfg(value)
    }).catch(() => {})
    return () => {
      live = false
    }
  }, [express])

  useEffect(() => {
    if (!scenarioID) return
    void catalog
      .scenario(scenarioID, side)
      .then(setScenario)
      .catch(() => setScenario(null))
  }, [scenarioID, side])

  useEffect(() => {
    const source = new EventSource(sseUrl(`/agents/${agentID}/stream`), {
      withCredentials: true,
    })
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as BuilderEventDTO
      if ('fieldMutated' in event) {
        // E1：状态行按「自动暂存」口径措辞——草稿在服务端，刷新/离开不丢。
        setLastEvent('已自动暂存')
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

  // E3/#89：把某个版本载入工作区草稿。本身不产生版本、不记录来源。
  const applyIterate = (version: AgentVersionDTO, siblings = versions) => {
    if (mutateTimer.current) {
      clearTimeout(mutateTimer.current)
      mutateTimer.current = null
    }
    setPrompt(version.prompt)
    setModelID(version.modelID)
    setRestoredTag(versionTag(version, siblings))
    setSaveNotice(null)
    const role = roleOfOptions(scenarioModule(scenarioID), version.options)
    if (role && role.side === side) setRoleKey(role.key)
    void builder
      .mutate(agentID, { field: PROMPT_FIELD, value: version.prompt })
      .catch(() => {})
  }

  // P11（Yihan 修订）：草稿与最新版本不一致＝有未保存的改动，覆盖前先确认；
  // 一致就直接载入，不打扰。
  const latestVersion = [...versions].sort((a, b) => b.id - a.id)[0] ?? null
  const draftDiffersFromLatest = latestVersion != null &&
    prompt.trim() !== latestVersion.prompt.trim()

  const requestIterate = (version: AgentVersionDTO) => {
    if (draftDiffersFromLatest) {
      setPendingIterate(version)
      return
    }
    applyIterate(version)
  }

  const onPromptChange = (value: string) => {
    setPrompt(value)
    if (mutateTimer.current) clearTimeout(mutateTimer.current)
    mutateTimer.current = setTimeout(() => {
      void builder
        .mutate(agentID, { field: PROMPT_FIELD, value })
        .catch(() => {})
    }, 400)
  }

  // 初始化方式的「填入工作区」/「清空工作区」：绕过 debounce 立即冲服务端
  // 草稿——两个动作都翻转 E7 门（工作区空↔非空），所见即所存。
  // #83 佐证：本次工作区内容的初始化方式；清空/直写回落 raw。
  const initMethod = useRef<'mcq' | 'builder' | null>(null)

  const fillWorkspace = (value: string, method?: 'mcq' | 'builder') => {
    if (mutateTimer.current) {
      clearTimeout(mutateTimer.current)
      mutateTimer.current = null
    }
    initMethod.current = value.trim() ? method ?? null : null
    setPrompt(value)
    setClearArmed(false)
    void builder
      .mutate(agentID, { field: PROMPT_FIELD, value })
      .catch(() => {})
  }

  // A3 ③：首战的保存自动派发（#17 的唯一例外）——对手＝新手预设指定的
  // 对侧 NPC（#10，config 缺席回落第一个对侧预设），成功直进实况（#9），
  // express 标记走一次性导航 state（旅程卡 #67 的诚实判据）。派发失败降级
  // 为 EA 导航 + 错误文案（版本已保存，玩家可从出战面板手动发起）。
  const expressDispatch = async (versionID: number) => {
    const opponentPresets = (scenario?.presets ?? []).filter(
      (preset) => preset.side !== side,
    )
    const configured = cfg?.expressPreset ?? null
    const preset = opponentPresets.find(
      (item) => item.key === configured?.presetKey,
    ) ?? opponentPresets[0] ?? null
    try {
      if (preset == null) throw new Error('未找到首战对手预设')
      const response = await matches.dispatchPVE({
        versionID,
        presetKey: preset.key,
      })
      navigate(`/matches/${response.matchID}`, { state: { express: true } })
    } catch (cause) {
      navigate(`/agents/${agentID}`, {
        state: {
          savedVersionID: versionID,
          expressDispatchError: `${
            rejectCopy(cause, cfg, '首战自动派发失败')
          }——版本已保存，可从「出战」面板手动发起`,
        },
      })
    }
  }

  const save = async () => {
    if (modelID == null) return
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
    await builder
      .mutate(agentID, { field: PROMPT_FIELD, value: prompt })
      .catch(() => {})
    try {
      // E2（#82）：版本严格线性、不记父子——保存不再携带 parentVersionID。
      const saved = await builder.save(agentID, {
        prompt,
        method: initMethod.current ?? 'raw',
        modelID,
        ...(roleKey == null ? {} : { options: roleOptions(roleKey) }),
      })
      if (express) {
        await expressDispatch(saved.id)
        return
      }
      // #88：保存后**留在本页**——把新版本插进页内版本线，给一句成功提示。
      // 玩家「改一句→保存→再改一句」的连打循环不再被跳转打断。
      const list = await builder.versions(agentID).catch(() => null)
      const nextVersions = list?.versions ?? [...versions, saved]
      setVersions(nextVersions)
      setEntryVersionID(list?.entryVersionID ?? entryVersionID)
      setRestoredTag(null)
      // E10（#84）：保存不移动参赛标记——新版本不是 ★ 时提醒一句。
      const entryID = list?.entryVersionID ?? entryVersionID
      const entry = nextVersions.find((v) => v.id === entryID)
      setSaveNotice(
        entry != null && entry.id !== saved.id
          ? `已保存 ${versionTag(saved, nextVersions)} · ★参赛版本仍是 ${
            versionTag(entry, nextVersions)
          }——新版本不会自动参赛`
          : `已保存 ${versionTag(saved, nextVersions)}`,
      )
      setSaving(false)
    } catch (cause) {
      // #14：计数器仅提示、保存由服务端强制；prompt_too_long 的产品文案
      // 把玩家指回右下角计数器（映射集中在 lib/reject-copy）。
      setError(rejectCopy(cause, null, '保存失败'))
      setSaving(false)
    }
  }

  const setEntry = async (versionID: number) => {
    setError(null)
    try {
      await builder.setEntry(agentID, versionID)
      const list = await builder.versions(agentID)
      setVersions(list.versions)
      setEntryVersionID(list.entryVersionID ?? null)
    } catch (cause) {
      setError(messageOf(cause, '设置参赛版本失败'))
    }
  }

  // P14：E8 承诺过的「复制当前文本」——平台不做 AI 改写，就得给复制手段。
  const copyPrompt = () => {
    try {
      void navigator.clipboard.writeText(prompt).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }).catch(() => {})
    } catch {
      // 非安全上下文没有 clipboard——静默降级，文本仍可手动全选复制。
    }
  }

  // P5 的显示侧：版本继承来的模型可能已不在当前可选清单里（模型下线/更名）。
  // 那时 Select 找不到匹配项会退回「请选择…」，看上去像没选——把它作为一条
  // 合成选项补进去，保证选择器显示的就是这一版真正会用的模型。
  const modelOptions = modelID != null &&
      !models.some((model) => model.id === modelID)
    ? [...models, { id: modelID, label: modelID }]
    : models

  const promptPlaceholder = side === 'a'
    ? '例如：先明确你的立场，再用裁判最难忽视的风险和利益组织论点…'
    : '例如：先拆解对方方案的成本，再把你的真诉求藏在可执行的条件中…'

  const selectedRole = roleByKey(roleModule, roleKey)
  // #14：按汉字或英文词计（非 token），P1 仅提示、不阻断保存。
  const units = promptLength(prompt)
  const overLimit = units > PROMPT_UNIT_LIMIT

  // 初始化方式三选一（E6/#83）：只在工作区为空且场景有 deck 时出现（E7 门
  // 在 initModesAvailable）；deck 缺席的场景不摆假 tab，保持 Basic 直写。
  // deck 按侧或入场角色解析（本能寺逐角色一套），换角色即换 deck、选择重置
  // （key 重挂载）——选择本身不持久化。
  const deck = deckFor(scenarioID, side, roleKey)
  const showInit = !draftLoading && deck != null && initModesAvailable(prompt)
  const sideDisplayName = scenario
    ? (side === 'a' ? scenario.summary.sideAName : scenario.summary.sideBName)
    : side === 'a'
    ? '甲方'
    : '乙方'
  // #68 只读角色模板：内容由场景模块供稿（并行编写中），缺席走通用兜底。
  const roleTemplate = roleModule?.roleTemplates?.[side] ??
    '该场景的角色模板文案整理中——比赛时系统仍会自动为你合并官方角色模板，无需在提示词里重复编写。'

  return (
    <div className='space-y-6'>
      <div>
        <Link
          to={`/agents/${agentID}`}
          className='text-sm text-(--foreground-subtle) transition hover:text-(--foreground)'
        >
          ← 智能体主页
        </Link>
        <h1 className='mt-2 text-2xl font-black tracking-tight text-(--foreground)'>
          智能体构建器
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          {scenario ? scenario.summary.title : scenarioID} ·{' '}
          {agentName != null && agentName !== ''
            ? `${sideDisplayName}「${agentName}」`
            : `${sideDisplayName} #${agentID}`}
        </p>
        {/* E1（#81）工作区语义：一句话说清「暂存 ≠ 版本」，不配说明书（E9） */}
        <p className='mt-1 text-xs text-(--foreground-muted)'>
          {express
            ? '首战快速通道 · 保存即自动开战并直达实况'
            : '工作区 · 输入自动暂存；保存才会生成新版本'}
        </p>
      </div>

      {showInit && deck != null
        ? (
          <InitModes
            key={`${scenarioID}:${side}:${roleKey ?? ''}`}
            deck={deck}
            metaPrompt={metaPromptFor(
              roleModule,
              scenario?.summary.title ?? scenarioID,
              side,
              sideDisplayName,
            )}
            onFill={fillWorkspace}
          />
        )
        : null}

      {/* P11：草稿与最新版本不一致时，覆盖前两步就地确认（不弹窗） */}
      {pendingIterate != null
        ? (
          <div className='flex flex-wrap items-center gap-2 rounded-md border border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.08)] px-3 py-2.5'>
            <span className='text-xs text-(--warning)'>
              工作区里有未保存的改动，基于{' '}
              {versionTag(pendingIterate, versions)} 迭代会覆盖它
            </span>
            <Button
              size='sm'
              variant='secondary'
              onClick={() => {
                applyIterate(pendingIterate)
                setPendingIterate(null)
              }}
            >
              仍要继续
            </Button>
            <button
              type='button'
              onClick={() =>
                setPendingIterate(null)}
              className='cursor-pointer text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
            >
              取消
            </button>
          </div>
        )
        : null}

      {restoredTag != null
        ? (
          <p className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'>
            已载入 {restoredTag} · {nextVersionCopy(versions.length)}
          </p>
        )
        : null}

      {saveNotice != null
        ? (
          <p
            data-testid='save-notice'
            className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'
          >
            {saveNotice}
          </p>
        )
        : null}

      {error ? <p className='text-sm text-(--accent)'>{error}</p> : null}

      <Card>
        <CardContent className='space-y-4 pt-5'>
          <div className='flex items-center justify-between gap-2'>
            <label
              htmlFor='prompt-input'
              className='text-sm text-(--foreground-subtle)'
            >
              策略提示词
            </label>
            {/* P14：E8 早已承诺、线上一直缺席的按钮 */}
            <Button
              size='sm'
              variant='ghost'
              onClick={copyPrompt}
              disabled={prompt.trim() === ''}
            >
              {copied
                ? <Check className='mr-1.5 h-3.5 w-3.5 text-(--success)' />
                : <Copy className='mr-1.5 h-3.5 w-3.5' />}
              {copied ? '已复制' : '复制当前文本'}
            </Button>
          </div>
          <div className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
            <Textarea
              id='prompt-input'
              rows={10}
              value={prompt}
              disabled={draftLoading}
              aria-busy={draftLoading}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={promptPlaceholder}
            />
          </div>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            {/* #68 三层说明的固定文案 */}
            <p className='text-xs text-(--foreground-muted)'>
              你只需编写策略提示词；比赛时系统会自动将它与场景的角色模板合并。
            </p>
            <span
              className={`shrink-0 font-mono text-xs ${
                overLimit ? 'text-(--accent)' : 'text-(--foreground-muted)'
              }`}
              title='按汉字或英文词计数（非 token）；当前仅提示，不阻断保存'
            >
              {units} / {PROMPT_UNIT_LIMIT}
            </span>
          </div>
          {
            /* E7（#83）：迭代只有文本工作台；清空工作区是重选初始化方式的
            唯一回头路——两步就地确认，不弹窗。 */
          }
          {deck != null && !draftLoading && !initModesAvailable(prompt)
            ? (
              clearArmed
                ? (
                  <div className='flex flex-wrap items-center gap-2 rounded-md border border-(--border-soft) bg-white/2 px-3 py-2'>
                    <span className='text-xs text-(--foreground-subtle)'>
                      清空后可重新选择初始化方式
                    </span>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => fillWorkspace('')}
                    >
                      确认清空
                    </Button>
                    <button
                      type='button'
                      onClick={() => setClearArmed(false)}
                      className='cursor-pointer text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
                    >
                      取消
                    </button>
                  </div>
                )
                : (
                  <button
                    type='button'
                    onClick={() => setClearArmed(true)}
                    className='cursor-pointer text-xs text-(--foreground-muted) underline-offset-2 transition hover:text-(--foreground) hover:underline'
                  >
                    清空工作区（重新选择初始化方式）
                  </button>
                )
            )
            : null}
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
                      renderValue={(v) => roleByKey(roleModule, v)?.name ?? v}
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
                  renderValue={(v) =>
                    modelOptions.find((model) => model.id === v)?.label ?? v}
                  onValueChange={(v) => v && setModelID(v)}
                >
                  {modelOptions.map((model) => (
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
              {saving
                ? express ? '开战中…' : '保存中…'
                : express
                ? '保存并开始首战'
                : '保存版本'}
            </Button>
            {/* P12：「保存＝产版」最该被看见的地方就是保存按钮旁 */}
            {!express
              ? (
                <span className='text-xs font-medium text-(--accent)'>
                  {nextVersionCopy(versions.length)}
                </span>
              )
              : null}
            {lastEvent
              ? (
                <span className='text-xs text-(--foreground-muted)'>
                  {lastEvent}
                </span>
              )
              : null}
          </div>
          {/* P5：模型随版本快照（#13）——说清这一版会用哪个模型 */}
          {latestVersion != null
            ? (
              <p className='text-xs text-(--foreground-muted)'>
                {modelID === latestVersion.modelID
                  ? `沿用 ${versionTag(latestVersion, versions)} 的模型`
                  : `已改为新模型，保存后 v${versions.length + 1} 用新模型（${
                    versionTag(latestVersion, versions)
                  } 不受影响）`}
              </p>
            )
            : null}
          {selectedRole
            ? (
              <p className='text-xs text-(--foreground-muted)'>
                {selectedRole.pitch}
              </p>
            )
            : null}
          <Accordion className='border-t border-(--border-soft)'>
            <AccordionItem
              value='role-template'
              title='查看场景角色模板（仅供查看，无需重复编写）'
            >
              <p className='whitespace-pre-wrap text-xs leading-relaxed text-(--foreground-subtle)'>
                {roleTemplate}
              </p>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {
        /* E11/#88：版本线就在编辑现场——保存后不跳转，新版直接长在这里。
        express 首战不摆版本线（那条路只保存一次就直奔实况）。 */
      }
      {!express
        ? (
          <VersionList
            versions={versions}
            onSetEntry={(versionID) => void setEntry(versionID)}
            onIterate={requestIterate}
            onField={(version) => {
              setPreferVersionID(version.id)
              setOsOpen(true)
            }}
            headingAside={
              <span className='text-[11px] text-(--foreground-muted)'>
                保存产生新版本；草稿不参战
              </span>
            }
            emptyState={
              <div className='rounded-lg border border-dashed border-(--border-soft) px-4 py-6 text-center'>
                <p className='text-sm font-medium text-(--foreground)'>
                  还没有保存过版本
                </p>
                <p className='mt-1 text-xs text-(--foreground-muted)'>
                  写下策略并点「保存版本」，这里就会长出 v1。
                </p>
              </div>
            }
          />
        )
        : null}

      {scenario != null && !express
        ? (
          <OsPanel
            open={osOpen}
            onClose={() => setOsOpen(false)}
            scenario={scenario}
            side={side}
            versions={versions}
            entryVersionID={entryVersionID}
            preferVersionID={preferVersionID}
          />
        )
        : null}
    </div>
  )
}
