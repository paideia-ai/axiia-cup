import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { VersionNote } from './version-note'
import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Select, SelectItem } from '../components/ui/select'
import { ModelSelect } from './model-select'
import { demoModels, modelFor, roleFor } from './builder-settings'
import { metaPromptFor } from '../lib/meta-prompt'
import { PROMPT_UNIT_LIMIT, promptLength } from '../lib/prompt-length'
import { rolesForSide, scenarioModule } from '../scenarios'
import { deckFor } from '../scenarios/decks'
import { McqDraft, MetaDraft } from './initialization'
import { Modal } from './modal'
import { type Agent, nameOf, scenarioOf } from './model'

export function DemoBuilder(
  { agent, update, save }: {
    agent: Agent
    update: (agent: Agent) => void
    save: () => void
  },
) {
  const [dialog, setDialog] = useState<'mcq' | 'meta' | null>(null)
  const [filled, setFilled] = useState(false)
  const [presetRoleKey, setPresetRoleKey] = useState<string | null>(
    roleFor(agent)?.key ?? null,
  )
  const scenario = scenarioOf(agent)
  const side = agent.side === 0 ? 'a' : 'b'
  const module = scenarioModule(scenario.id)
  const roleTemplate = module?.roleTemplates?.[side] ??
    '该场景的角色模板文案整理中——比赛时系统仍会自动为你合并官方角色模板，无需在提示词里重复编写。'
  const sideDeck = deckFor(scenario.id, side)
  const presetRoles = sideDeck
    ? []
    : rolesForSide(module, side).filter((role) =>
      deckFor(scenario.id, side, role.key) != null
    )
  const deck = deckFor(scenario.id, side, presetRoleKey)
  const roles = rolesForSide(module, side)
  const selectedRole = roleFor(agent)
  const modelID = modelFor(agent)
  const modelOptions = demoModels.some((model) => model.id === modelID)
    ? demoModels
    : [...demoModels, { id: modelID, label: modelID }]
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle',
  )
  useEffect(() => {
    setCopyState('idle')
  }, [agent.draft])
  useEffect(() => {
    if (copyState !== 'copied') return
    const timer = setTimeout(() => setCopyState('idle'), 1800)
    return () => clearTimeout(timer)
  }, [copyState])
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(agent.draft)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }
  const units = promptLength(agent.draft)
  function fill(text: string, method: 'mcq' | 'builder') {
    update({
      ...agent,
      draft: text,
      method,
      ...(presetRoleKey ? { roleKey: presetRoleKey } : {}),
    })
    setDialog(null)
    setFilled(true)
  }
  return (
    <div className='demo-builder space-y-6'>
      <Link
        to={`/agents/${agent.id}`}
        className='block text-sm text-(--foreground-subtle) hover:text-(--foreground)'
      >
        ← 智能体主页
      </Link>
      <div>
        <h1 className='text-2xl font-black tracking-tight'>智能体构建器</h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          {nameOf(agent)} · {scenario.title}
        </p>
      </div>
      <div
        className='flex flex-wrap items-center gap-x-2 gap-y-1'
        aria-label='策略辅助'
      >
        <span className='text-xs text-(--foreground-subtle)'>
          不知道怎么指挥智能体？
        </span>
        <div className='flex flex-wrap items-center gap-1'>
          <Button size='sm' variant='ghost' onClick={() => setDialog('mcq')}>
            选择预设策略
          </Button>
          <Button size='sm' variant='ghost' onClick={() => setDialog('meta')}>
            让你的AI帮你想策略
          </Button>
        </div>
      </div>
      <div className='demo-editor space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <label htmlFor='strategy' className='text-sm font-semibold'>
            策略提示词
          </label>
          <Button
            size='sm'
            variant='ghost'
            className='h-8 w-8 p-0'
            aria-label='复制当前草稿'
            title={copyState === 'copied' ? '已复制' : '复制当前草稿'}
            disabled={!agent.draft.trim()}
            onClick={() => void copyDraft()}
          >
            {copyState === 'copied'
              ? (
                <Check
                  aria-hidden='true'
                  className='h-4 w-4 text-(--success)'
                />
              )
              : <Copy aria-hidden='true' className='h-4 w-4' />}
          </Button>
        </div>
        {copyState === 'failed' && (
          <p role='alert' className='text-xs text-(--warning)'>
            无法自动复制，请在主输入框中选择文本并复制。
          </p>
        )}
        <Textarea
          id='strategy'
          value={agent.draft}
          onChange={(event) => {
            update({
              ...agent,
              draft: event.target.value,
              method: event.target.value.trim() ? agent.method ?? 'raw' : 'raw',
            })
            setFilled(false)
          }}
          placeholder='你希望智能体如何思考、回应和行动？'
          className='block min-h-[46dvh] p-4 text-base leading-8 sm:min-h-[420px] sm:p-5'
        />
        <div className='flex flex-wrap items-center justify-between gap-3 text-xs text-(--foreground-subtle)'>
          <span role='status'>
            {filled
              ? '策略已填入，可继续修改；保存才会生成版本。'
              : agent.draft
              ? '草稿已保留'
              : '从空白开始，写下你的策略。'}
          </span>
          <span title='汉字按字、英文按词计数'>
            {units} / {PROMPT_UNIT_LIMIT}
          </span>
        </div>
        {units > PROMPT_UNIT_LIMIT && (
          <p role='alert' className='text-xs text-(--warning)'>
            已超出 {units - PROMPT_UNIT_LIMIT} 个单位，请精简至{' '}
            {PROMPT_UNIT_LIMIT} 个单位以内再保存。
          </p>
        )}
      </div>
      <div
        className='flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end'
        aria-label='版本设置'
      >
        <label className='flex w-full min-w-0 flex-col gap-1.5 text-xs text-(--foreground-subtle) md:w-56'>
          <span className='block'>模型</span>
          <ModelSelect
            value={modelID}
            options={modelOptions}
            onChange={(id) => update({ ...agent, draftModelID: id })}
          />
        </label>
        {roles.length > 0 && (
          <label className='flex w-full min-w-0 flex-col gap-1.5 text-xs text-(--foreground-subtle) md:w-56'>
            <span className='block'>出场角色</span>
            <Select
              placeholder='出场角色'
              value={selectedRole?.key}
              renderValue={(key) =>
                roles.find((role) => role.key === key)?.name ?? key}
              onValueChange={(key) => {
                if (key) {
                  update({ ...agent, roleKey: key })
                  setPresetRoleKey(key)
                }
              }}
            >
              {roles.map((role) => (
                <SelectItem key={role.key} value={role.key}>
                  {role.name}
                </SelectItem>
              ))}
            </Select>
          </label>
        )}
        <div className='flex items-center gap-1 self-end md:ml-auto'>
          <VersionNote
            value={agent.versionNote ?? ''}
            onChange={(value) => update({ ...agent, versionNote: value })}
          />
          <Button
            disabled={!agent.draft.trim() || units > PROMPT_UNIT_LIMIT}
            onClick={save}
          >
            保存并返回主页
          </Button>
        </div>
      </div>
      <Accordion>
        <AccordionItem value='role-template' title='角色系统提示词'>
          <p className='mb-3 text-xs leading-6 text-(--foreground-subtle)'>
            比赛时系统会将角色模板与策略提示词合并，无需在主输入框中重复填写。
          </p>
          <pre
            aria-label='角色系统提示词内容'
            tabIndex={0}
            className='max-h-96 overflow-auto whitespace-pre-wrap wrap-anywhere rounded-md border border-(--border-soft) bg-white/2 p-3 font-sans text-xs leading-6 text-(--foreground-subtle)'
          >{roleTemplate}</pre>
        </AccordionItem>
      </Accordion>
      {dialog === 'mcq' && (
        <Modal
          title={`选择预设策略 · ${scenario.roles[agent.side]}`}
          onClose={() => setDialog(null)}
        >
          {presetRoles.length > 0 && (
            <fieldset className='mb-5 space-y-2'>
              <legend className='mb-2 text-sm font-semibold'>选择角色</legend>
              <div className='flex flex-wrap gap-2'>
                {presetRoles.map((role) => (
                  <Button
                    key={role.key}
                    size='sm'
                    variant={presetRoleKey === role.key
                      ? 'primary'
                      : 'secondary'}
                    aria-pressed={presetRoleKey === role.key}
                    onClick={() => setPresetRoleKey(role.key)}
                  >
                    {role.name}
                  </Button>
                ))}
              </div>
            </fieldset>
          )}
          {deck
            ? (
              <McqDraft
                key={presetRoleKey ?? side}
                deck={deck}
                currentDraft={agent.draft}
                onFill={(text) => fill(text, 'mcq')}
              />
            )
            : presetRoles.length > 0
            ? (
              <p className='text-sm text-(--foreground-subtle)'>
                选择一个角色，开始填写对应的预设策略。
              </p>
            )
            : (
              <div className='space-y-4'>
                <p className='text-sm text-(--foreground-subtle)'>
                  这个角色暂时没有预设策略。你可以直接编写，或让你的 AI
                  帮你想策略。
                </p>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => setDialog('meta')}
                >
                  让你的AI帮你想策略
                </Button>
              </div>
            )}
        </Modal>
      )}
      {dialog === 'meta' && (
        <Modal
          title={`让你的AI帮你想策略 · ${scenario.roles[agent.side]}`}
          onClose={() => setDialog(null)}
        >
          <MetaDraft
            metaPrompt={metaPromptFor(
              scenarioModule(scenario.id),
              scenario.title,
              side,
              scenario.roles[agent.side],
            )}
          />
        </Modal>
      )}
    </div>
  )
}
