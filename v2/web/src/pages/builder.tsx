import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { builder, catalog, sseUrl } from '../api/client'
import type {
  AgentVersionDTO,
  BuilderEventDTO,
  ModelDTO,
  ScenarioDetail,
  Side,
} from '../api/types'
import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { PROMPT_UNIT_LIMIT, promptLength } from '../lib/prompt-length'
import { messageOf } from '../lib/use-async'
import {
  roleByKey,
  roleOfOptions,
  roleOptions,
  rolesForSide,
  scenarioModule,
} from '../scenarios'

const PROMPT_FIELD = 'prompt'

// 纯构建器（EA/E 拆分后）：只管编辑与保存版本。版本列表与出战都归 EA
// （/agents/:id），派发归 OS 面板——保存成功即回 EA。保存语义不变：保存
// 总是创建一个新版本。
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
  const [lastEvent, setLastEvent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const mutateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        setVersions(list.versions)
        setEntryVersionID(list.entryVersionID ?? null)
        // #70「编辑此版本」：?from=<versionID> 只做一次性预填（本效果每个
        // agentID 只跑一次），之后的编辑一切照常。
        const fromID = Number(params.get('from') ?? '')
        const fromVersion = list.versions.find((v) => v.id === fromID)
        if (fromVersion) {
          setPrompt(fromVersion.prompt)
          setModelID(fromVersion.modelID)
          const role = roleOfOptions(
            scenarioModule(draft.scenarioID),
            fromVersion.options,
          )
          if (role && role.side === draft.side) setRoleKey(role.key)
          // 草稿的 prompt 字段在服务端：预填走与打字相同的 mutate 通道，
          // 让服务器草稿与所见一致。
          void builder
            .mutate(agentID, { field: PROMPT_FIELD, value: fromVersion.prompt })
            .catch(() => {})
        } else {
          setPrompt(draft.fields[PROMPT_FIELD] ?? '')
        }
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
    try {
      await builder.save(agentID, {
        prompt,
        modelID,
        parentVersionID: entryVersionID,
        ...(roleKey == null ? {} : { options: roleOptions(roleKey) }),
      })
      // 版本列表在 EA：保存成功即回智能体主页。
      navigate(`/agents/${agentID}`)
    } catch (cause) {
      setError(messageOf(cause, '保存失败'))
      setSaving(false)
    }
  }

  const promptPlaceholder = side === 'a'
    ? '例如：先明确你的立场，再用裁判最难忽视的风险和利益组织论点…'
    : '例如：先拆解对方方案的成本，再把你的真诉求藏在可执行的条件中…'

  const selectedRole = roleByKey(roleModule, roleKey)
  // #14：按汉字或英文词计（非 token），P1 仅提示、不阻断保存。
  const units = promptLength(prompt)
  const overLimit = units > PROMPT_UNIT_LIMIT
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
          {scenario ? scenario.summary.title : scenarioID} · 为
          {side === 'a' ? '甲' : '乙'}方 · agent #{agentID}
        </p>
      </div>

      {error ? <p className='text-sm text-(--accent)'>{error}</p> : null}

      <Card>
        <CardContent className='space-y-4 pt-5'>
          <label className='block space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span>策略提示词</span>
            <Textarea
              rows={10}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={promptPlaceholder}
            />
          </label>
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
    </div>
  )
}
