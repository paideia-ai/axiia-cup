import { Bot, Clock, Hammer } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { builder, catalog, myAgents } from '../api/client'
import type { ScenarioSummary, Side } from '../api/types'
import { Accordion, AccordionItem } from '../components/ui/accordion'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { gateMet, sideMet, sideProgressText } from '../lib/gate'
import { messageOf, useAsync } from '../lib/use-async'
import { scenarioModule } from '../scenarios'
import type {
  ScenarioEducation,
  ScenarioHiddenGoalList,
  ScenarioIntroCollection,
  ScenarioIntroCopy,
  ScenarioIntroFact,
  ScenarioIntroImage,
  ScenarioIntroSide,
  ScenarioIntroTimeline,
} from '../scenarios/types'

// 场景介绍的主体为四张顶层卡：背景故事、甲方、乙方、裁判与计分。
// 个别场景可把游戏流程从背景故事中移到末尾，成为独立卡片。
// `module.intro.source` 逐字来自 docs/competition/scenario-intro.html；这里可以
// 重排，但不改写或省略。计分、难度、时长和状态属于额外的产品信息，单独渲染。
export function ScenarioDetailPage() {
  const { scenarioId = '' } = useParams()
  const navigate = useNavigate()
  const [pending, setPending] = useState<string | null>(null)
  const [buildError, setBuildError] = useState<string | null>(null)
  const module = scenarioModule(scenarioId)
  const intro = module?.intro ?? null
  const education = module?.education ?? null

  const { data, error, loading } = useAsync(
    () => catalog.scenario(scenarioId, 'a'),
    [scenarioId],
  )
  const { data: mine } = useAsync(
    () => myAgents.list().catch(() => null),
    [scenarioId],
  )
  const mineOf = (side: Side) =>
    mine?.scenarios.find((item) => item.scenarioID === scenarioId)
      ?.sides[side] ?? []

  const enter = async (side: Side, target: 'build' | 'view') => {
    setPending(`${side}:${target}`)
    setBuildError(null)
    try {
      const { agentID } = await builder.ensure({
        scenarioID: scenarioId,
        side,
      })
      navigate(
        target === 'build'
          ? `/agents/${agentID}/build?scenario=${scenarioId}&side=${side}`
          : `/agents/${agentID}`,
      )
    } catch (cause) {
      setBuildError(messageOf(cause, '创建智能体失败'))
      setPending(null)
    }
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-6'>
      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data
        ? (
          <>
            <header className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                {intro?.source.category
                  ? (
                    <p className='mb-2 text-xs font-semibold tracking-[0.1em] text-(--accent)'>
                      {intro.source.category}
                    </p>
                  )
                  : null}
                <h1 className='text-2xl font-black tracking-tight text-(--foreground) sm:text-3xl'>
                  {intro?.source.title ?? data.summary.title}
                </h1>
                <p className='mt-2 text-sm text-(--foreground-subtle)'>
                  {data.summary.subject}
                </p>
                <p className='mt-3 text-xs text-(--foreground-muted)'>
                  {intro?.source.participants.sides.a.name ??
                    data.summary.sideAName} 对{' '}
                  {intro?.source.participants.sides.b.name ??
                    data.summary.sideBName} ·{' '}
                  {education?.formatLabel ?? `${data.summary.turnCount} 轮`}
                </p>
              </div>
              <GateStatus summary={data.summary} />
            </header>

            <OverviewCard
              intro={intro}
              education={education}
              summary={data.summary}
              factImages={module?.overviewFactImages ?? null}
              timelineAtEnd={module?.timelineAtEnd ?? false}
            />

            <section className='space-y-3' aria-labelledby='participants-title'>
              <div>
                <h2
                  id='participants-title'
                  className='text-lg font-bold text-(--foreground)'
                >
                  {intro?.source.participants.title ?? '双方与胜利条件'}
                </h2>
                {intro
                  ? (
                    <p className='mt-1 text-sm leading-relaxed text-(--foreground-subtle)'>
                      {intro.source.participants.intro}
                    </p>
                  )
                  : null}
              </div>

              <div className='grid gap-4 md:grid-cols-2'>
                {(['a', 'b'] as const).map((side) => (
                  <SideCard
                    key={side}
                    side={side}
                    copy={intro?.source.participants.sides[side] ?? null}
                    fallbackName={side === 'a'
                      ? data.summary.sideAName
                      : data.summary.sideBName}
                    fallbackLabel={side === 'a'
                      ? data.summary.sideALabel
                      : data.summary.sideBLabel}
                    fallbackGoal={education?.winConditions[side] ?? null}
                    hiddenGoals={module?.hiddenGoals?.[side] ?? null}
                    agents={mineOf(side)}
                    pending={pending}
                    onEnter={enter}
                    onViewAll={() => navigate('/my-agents')}
                    onNew={() =>
                      navigate(
                        `/my-agents?new=${side}&scenario=${scenarioId}`,
                      )}
                  />
                ))}
              </div>
              {buildError
                ? <p className='text-sm text-(--accent)'>{buildError}</p>
                : null}
            </section>

            <JudgeScoringCard
              intro={intro}
              education={education}
              scoringInitiallyCollapsed={module?.scoringInitiallyCollapsed ??
                false}
            />

            {module?.timelineAtEnd && intro?.source.overview.timeline
              ? <TimelineCard timeline={intro.source.overview.timeline} />
              : null}
          </>
        )
        : null}
    </div>
  )
}

function OverviewCard({
  intro,
  education,
  summary,
  factImages,
  timelineAtEnd,
}: {
  intro: ScenarioIntroCopy | null
  education: ScenarioEducation | null
  summary: ScenarioSummary
  factImages: Record<string, ScenarioIntroImage> | null
  timelineAtEnd: boolean
}) {
  const overview = intro?.source.overview ?? null
  return (
    <Card data-testid='scenario-intro-card'>
      <CardContent className='space-y-5 pt-5'>
        <div className='space-y-3'>
          <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
            01 · {overview?.label ?? '场景介绍'}
          </p>
          {overview
            ? (
              <>
                <h2 className='text-xl font-bold leading-snug text-(--foreground) sm:text-2xl'>
                  {overview.title}
                </h2>
                {overview.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className='max-w-5xl text-sm leading-7 text-(--foreground-subtle)'
                  >
                    {paragraph}
                  </p>
                ))}
              </>
            )
            : (
              <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                场景导读整理中
              </p>
            )}
        </div>

        {overview?.facts && overview.facts.length > 0
          ? (
            <div className='grid gap-3 md:grid-cols-3'>
              {overview.facts.map((fact) => (
                <OverviewFactCard
                  key={fact.title}
                  fact={fact}
                  image={factImages?.[fact.title] ?? null}
                />
              ))}
            </div>
          )
          : null}

        {overview?.timeline && !timelineAtEnd
          ? (
            <section className='space-y-3 border-t border-(--border-soft) pt-5'>
              <h3 className='text-base font-semibold text-(--foreground)'>
                {overview.timeline.title}
              </h3>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                {overview.timeline.items.map((item) => (
                  <article
                    key={`${item.step}:${item.title}`}
                    className='rounded-lg border border-(--border-soft) bg-white/2 p-4'
                  >
                    <p className='font-mono text-xs text-(--warning)'>
                      {item.step}
                    </p>
                    <h4 className='mt-2 text-sm font-semibold text-(--foreground)'>
                      {item.title}
                    </h4>
                    <p className='mt-2 text-xs leading-6 text-(--foreground-subtle)'>
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )
          : null}

        {overview?.actions
          ? <CollectionBlock collection={overview.actions} />
          : null}

        {intro?.source.participants.note
          ? (
            <div className='rounded-lg border border-(--warning)/35 bg-(--warning)/5 px-4 py-3 sm:flex sm:items-baseline sm:gap-3'>
              <strong className='text-sm text-(--warning)'>
                {intro.source.participants.note.title}
              </strong>
              <p className='mt-1 text-sm leading-6 text-(--foreground-subtle) sm:mt-0'>
                {intro.source.participants.note.text}
              </p>
            </div>
          )
          : null}

        {education
          ? (
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-(--border-soft) pt-4 text-xs text-(--foreground-subtle)'>
              <span title={`难度 ${education.difficulty} / 3`}>
                难度{' '}
                <span className='tracking-[0.12em] text-(--warning)'>
                  {'★'.repeat(education.difficulty)}
                  <span className='text-(--foreground-muted)'>
                    {'☆'.repeat(3 - education.difficulty)}
                  </span>
                </span>
              </span>
              <span className='inline-flex items-center gap-1'>
                <Clock className='h-3.5 w-3.5' />
                一场约 {education.minutes} 分钟
              </span>
              <span>{education.formatLabel}</span>
              {education.noviceFriendly
                ? <Badge tone='success'>适合新手</Badge>
                : null}
            </div>
          )
          : null}

        {statsLine(summary)
          ? (
            <p className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-xs text-(--foreground-subtle)'>
              <span className='mr-2 font-semibold tracking-[0.06em] text-(--foreground-muted)'>
                侧方胜率
              </span>
              {statsLine(summary)}
            </p>
          )
          : education
          ? (
            <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
              侧方胜率 · 对局数 — 数据积累中，早期对局正在进行
            </p>
          )
          : null}
      </CardContent>
    </Card>
  )
}

function TimelineCard({ timeline }: { timeline: ScenarioIntroTimeline }) {
  return (
    <Card data-testid='scenario-intro-card'>
      <CardContent className='space-y-4 pt-5'>
        <h2 className='text-xl font-bold text-(--foreground)'>
          {timeline.title}
        </h2>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {timeline.items.map((item) => (
            <article
              key={`${item.step}:${item.title}`}
              className='rounded-lg border border-(--border-soft) bg-white/2 p-4'
            >
              <p className='font-mono text-xs text-(--warning)'>
                {item.step}
              </p>
              <h3 className='mt-2 text-sm font-semibold text-(--foreground)'>
                {item.title}
              </h3>
              <p className='mt-2 text-xs leading-6 text-(--foreground-subtle)'>
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewFactCard({
  fact,
  image,
}: {
  fact: ScenarioIntroFact
  image: ScenarioIntroImage | null
}) {
  return (
    <article className='rounded-lg border border-(--border-soft) bg-white/2 p-4'>
      {image
        ? (
          <img
            alt={image.alt}
            className='mb-4 aspect-[4/3] w-full rounded-md border border-(--border-soft) bg-white object-contain'
            loading='lazy'
            src={image.src}
          />
        )
        : null}
      <h3 className='text-sm font-semibold text-(--foreground)'>
        {fact.title}
      </h3>
      <p className='mt-2 text-xs leading-6 text-(--foreground-subtle)'>
        {fact.text}
      </p>
    </article>
  )
}

function CollectionBlock(
  { collection }: { collection: ScenarioIntroCollection },
) {
  return (
    <section className='space-y-3 border-t border-(--border-soft) pt-5'>
      <div>
        <h3 className='text-base font-semibold text-(--foreground)'>
          {collection.title}
        </h3>
        {collection.intro
          ? (
            <p className='mt-2 max-w-5xl text-sm leading-7 text-(--foreground-subtle)'>
              {collection.intro}
            </p>
          )
          : null}
      </div>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {collection.items.map((item) => (
          <article
            key={`${item.title}:${item.text}`}
            className='rounded-lg border border-(--border-soft) bg-white/2 p-4'
          >
            <h4 className='text-sm font-semibold text-(--foreground)'>
              {item.title}
            </h4>
            <p className='mt-2 text-xs leading-6 text-(--foreground-subtle)'>
              {item.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function SideCard({
  side,
  copy,
  fallbackName,
  fallbackLabel,
  fallbackGoal,
  hiddenGoals,
  agents,
  pending,
  onEnter,
  onViewAll,
  onNew,
}: {
  side: Side
  copy: ScenarioIntroSide | null
  fallbackName: string
  fallbackLabel: string | null | undefined
  fallbackGoal: string | null
  hiddenGoals: ScenarioHiddenGoalList | null
  agents: Array<{ agentID: number; name?: string | null }>
  pending: string | null
  onEnter: (side: Side, target: 'build' | 'view') => Promise<void>
  onViewAll: () => void
  onNew: () => void
}) {
  const name = copy?.name ?? fallbackName
  return (
    <Card className='h-full' data-testid='scenario-intro-card'>
      <CardContent className='flex h-full flex-col gap-4 pt-5'>
        <div>
          <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
            {side === 'a' ? '02' : '03'} · {copy?.eyebrow ??
              (side === 'a' ? '甲方' : '乙方')}
          </p>
          <h3 className='mt-2 text-xl font-bold text-(--foreground)'>
            {name}
          </h3>
          {(copy ? copy.subtitle : fallbackLabel)
            ? (
              <p className='mt-1 text-xs text-(--foreground-muted)'>
                {copy ? copy.subtitle : fallbackLabel}
              </p>
            )
            : null}
        </div>

        {copy?.paragraphs.map((paragraph) => (
          <p
            key={paragraph}
            className='text-sm leading-7 text-(--foreground-subtle)'
          >
            {paragraph}
          </p>
        ))}

        <div className='rounded-lg border border-(--border-soft) bg-black/10 p-3'>
          <p className='text-[11px] font-semibold tracking-[0.08em] text-(--foreground-muted)'>
            {copy?.goalLabel ?? '胜利条件'}
          </p>
          <p className='mt-1 text-sm leading-6 text-(--foreground-subtle)'>
            {copy?.goal ?? fallbackGoal ?? '胜利条件文案整理中'}
          </p>
        </div>

        {copy?.choices && copy.choices.length > 0
          ? (
            <div className='space-y-2'>
              {copy.choices.map((choice) => {
                const roleGoals = hiddenGoals?.groups.find((group) =>
                  group.role === choice.name
                )
                return (
                  <div key={choice.name} className='space-y-2'>
                    <section className='rounded-lg border border-(--border-soft) bg-white/2 p-3'>
                      <h4 className='text-sm font-semibold text-(--foreground)'>
                        {choice.name}
                      </h4>
                      <p className='mt-1 text-xs leading-6 text-(--foreground-subtle)'>
                        {choice.text}
                      </p>
                    </section>
                    {roleGoals && hiddenGoals
                      ? (
                        <HiddenGoalList
                          goals={{
                            note: hiddenGoals.note,
                            groups: [roleGoals],
                          }}
                          showRole={false}
                        />
                      )
                      : null}
                  </div>
                )
              })}
            </div>
          )
          : null}

        {hiddenGoals && hiddenGoals.groups.every((group) => !group.role)
          ? <HiddenGoalList goals={hiddenGoals} />
          : null}

        {agents.length > 0
          ? (
            <p className='text-xs text-(--foreground-muted)'>
              你已有 {agents.length} 个{name}：{' '}
              {agents.map((agent) => agent.name ?? `#${agent.agentID}`).join(
                ' · ',
              )}
            </p>
          )
          : null}

        <div className='mt-auto flex flex-wrap items-center gap-2 pt-1'>
          {agents.length === 0
            ? (
              <Button
                size='sm'
                data-testid={side === 'a' ? 'build-agent' : 'build-agent-b'}
                disabled={pending != null}
                onClick={() => void onEnter(side, 'build')}
              >
                <Hammer className='mr-1.5 h-3.5 w-3.5' />
                {pending === `${side}:build`
                  ? '创建中…'
                  : copy?.actionLabel ?? `去构建${name}`}
              </Button>
            )
            : (
              <>
                <Button size='sm' onClick={onNew}>
                  <Hammer className='mr-1.5 h-3.5 w-3.5' />
                  再建一个{name}
                </Button>
                <Button size='sm' variant='secondary' onClick={onViewAll}>
                  <Bot className='mr-1.5 h-3.5 w-3.5' />
                  查看我的{name}（{agents.length}）
                </Button>
              </>
            )}
        </div>
      </CardContent>
    </Card>
  )
}

function HiddenGoalList({
  goals,
  showRole = true,
}: {
  goals: ScenarioHiddenGoalList
  showRole?: boolean
}) {
  return (
    <section className='rounded-lg border border-(--warning)/30 bg-(--warning)/5 px-3'>
      <Accordion className='divide-y-0'>
        <AccordionItem
          value='hidden-goals'
          title='隐藏目标列表'
          triggerClassName='text-xs font-medium tracking-[0.04em] text-(--foreground-muted)'
        >
          <div className='space-y-3'>
            <p className='text-xs leading-5 text-(--foreground-subtle)'>
              {goals.note}
            </p>
            {goals.groups.map((group, groupIndex) => (
              <div
                key={group.role ?? groupIndex}
                className={groupIndex === 0
                  ? 'space-y-2'
                  : 'space-y-2 border-t border-(--warning)/20 pt-3'}
              >
                {showRole && group.role
                  ? (
                    <h5 className='text-xs font-semibold text-(--foreground)'>
                      {group.role}
                    </h5>
                  )
                  : null}
                <ul className='space-y-2'>
                  {group.options.map((option) => (
                    <li
                      key={option.id}
                      className='grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2 text-xs leading-5 text-(--foreground-subtle)'
                    >
                      <code className='font-mono font-semibold text-(--warning)'>
                        {option.id}
                      </code>
                      <span>{option.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AccordionItem>
      </Accordion>
    </section>
  )
}

function JudgeScoringCard({
  intro,
  education,
  scoringInitiallyCollapsed,
}: {
  intro: ScenarioIntroCopy | null
  education: ScenarioEducation | null
  scoringInitiallyCollapsed: boolean
}) {
  const participants = intro?.source.participants ?? null
  return (
    <Card data-testid='scenario-intro-card'>
      <CardContent className='space-y-5 pt-5'>
        <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
          04 · 裁判与计分 · 谁来判、怎么算分
        </p>
        <div className='grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]'>
          <div className='space-y-4'>
            {participants
              ? (
                <>
                  <div>
                    <h2 className='text-xl font-bold text-(--foreground)'>
                      {participants.judge.name}
                    </h2>
                    <p className='mt-1 text-xs text-(--foreground-muted)'>
                      {participants.judge.label}
                    </p>
                    {participants.judge.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph}
                        className='mt-3 text-sm leading-7 text-(--foreground-subtle)'
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {participants.supporting
                    ? <CollectionBlock collection={participants.supporting} />
                    : null}
                </>
              )
              : (
                <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                  裁判说明整理中
                </p>
              )}
          </div>
          <ScoringRules
            initiallyCollapsed={scoringInitiallyCollapsed}
            text={education?.scoring ?? '计分规则整理中'}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ScoringRules({
  initiallyCollapsed,
  text,
}: {
  initiallyCollapsed: boolean
  text: string
}) {
  if (initiallyCollapsed) {
    return (
      <section className='rounded-lg border border-(--border-soft) bg-white/2 px-4'>
        <Accordion className='divide-y-0'>
          <AccordionItem
            value='scoring-rules'
            title='计分规则'
            triggerClassName='font-semibold text-(--foreground)'
          >
            <p className='whitespace-pre-line text-sm leading-7 text-(--foreground-subtle)'>
              {text}
            </p>
          </AccordionItem>
        </Accordion>
      </section>
    )
  }
  return (
    <section className='rounded-lg border border-(--border-soft) bg-white/2 p-4'>
      <h3 className='text-sm font-semibold text-(--foreground)'>计分规则</h3>
      <p className='mt-2 whitespace-pre-line text-sm leading-7 text-(--foreground-subtle)'>
        {text}
      </p>
    </section>
  )
}

function statsLine(summary: ScenarioSummary): string | null {
  const stats = summary.stats
  if (!stats) return null
  const pct = (rate: number) => `${Math.round(rate * 100)}%`
  return `${stats.battleCount} 场 · ${summary.sideAName} ${
    pct(stats.sideWinRate.a)
  } / ${summary.sideBName} ${pct(stats.sideWinRate.b)}`
}

function GateStatus({ summary }: { summary: ScenarioSummary }) {
  const progress = summary.gateProgress ?? null
  if (!progress) {
    return (
      <Badge tone={summary.gateUnlocked ? 'success' : 'info'}>
        {summary.gateUnlocked ? 'PvP 已解锁' : 'PvE 阶段'}
      </Badge>
    )
  }
  if (gateMet(progress)) {
    return <Badge tone='success'>✓ PVP 已解锁</Badge>
  }
  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <span className='text-xs text-(--foreground-muted)'>
        每侧各赢 ≥{progress.a.needed} 场 NPC 练习解锁 PVP
      </span>
      {(['a', 'b'] as const).map((which) => (
        <Badge
          key={which}
          tone={sideMet(progress[which]) ? 'success' : 'info'}
        >
          {which === 'a' ? summary.sideAName : summary.sideBName}{' '}
          {sideProgressText(progress[which])}
          {sideMet(progress[which]) ? ' ✓' : ''}
        </Badge>
      ))}
    </div>
  )
}
