// DA — 场景介绍（A4）。独立教育页，与构建器 E 分开（#42）。
// 四层渐进展示：GLANCE → EXPAND-1 → EXPAND-2 → DEEP；侧方胜率在 GLANCE（#38）。
// 叙事 ↔ 原始规则 切换保留；计分规则从场景数据读取、精确权重全公开（#26/#42）。
import { Bot, ChevronDown, Clock, Hammer, Lock, Sparkles, Swords, Unlock } from 'lucide-react'
import { useState, type PropsWithChildren } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Badge, Button, Card, EmptyState, KeyValue, Tabs } from '../components/ui'
import { cn } from '../lib/cn'
import { SCENARIO_BATTLE_COUNTS, SCENARIO_SIDE_WINRATE, sideRoleShort } from '../mock/data'
import { CONFIG, SCENARIOS, store, useAppState } from '../mock/store'
import { DIFFICULTY_LABEL, type Scenario, type ScenarioSideCard, type Side } from '../mock/types'

type ViewMode = 'narrative' | 'raw'

/** 侧方胜率分割条（GLANCE 级，#38）。 */
function SideSplitBar({ scenario }: { scenario: Scenario }) {
  const rate = SCENARIO_SIDE_WINRATE[scenario.id] ?? { A: 0.5, B: 0.5 }
  const pctA = Math.round(rate.A * 100)
  const pctB = 100 - pctA
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex h-2.5 w-full overflow-hidden rounded-full bg-white/6'>
        <span className='bg-(--side-a)' style={{ width: `${pctA}%` }} />
        <span className='bg-(--side-b)' style={{ width: `${pctB}%` }} />
      </div>
      <div className='flex items-baseline justify-between gap-3 text-xs text-(--foreground-subtle)'>
        <span>
          <span className='font-bold text-(--side-a)'>{scenario.sideA.name}</span>
          <span className='ml-1.5 font-semibold text-(--foreground)'>{pctA}%</span>
        </span>
        <span className='text-right'>
          <span className='font-semibold text-(--foreground)'>{pctB}%</span>
          <span className='ml-1.5 font-bold text-(--side-b)'>{scenario.sideB.name}</span>
        </span>
      </div>
    </div>
  )
}

/** 可折叠的展示层：EXPAND-1 / EXPAND-2 / DEEP 默认收起，点击「展开更多」逐层深入。 */
function LayerSection({
  layer,
  title,
  hint,
  open,
  onToggle,
  children,
}: PropsWithChildren<{ layer: string; title: string; hint: string; open: boolean; onToggle: () => void }>) {
  return (
    <section className='overflow-hidden rounded-2xl border border-(--border-soft) bg-white/[0.02]'>
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]'
      >
        <span className='flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1'>
          <span className='text-[11px] font-bold uppercase tracking-[0.18em] text-(--accent)'>{layer}</span>
          <span className='font-extrabold text-(--foreground)'>{title}</span>
          {!open && <span className='truncate text-xs text-(--foreground-muted)'>{hint}</span>}
        </span>
        <span className='inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-(--foreground-subtle)'>
          {open ? '收起' : '展开更多'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && <div className='flex flex-col gap-5 border-t border-(--border-soft) px-5 py-5'>{children}</div>}
    </section>
  )
}

function SubHeading({ children }: PropsWithChildren) {
  return <h3 className='text-[11px] font-bold uppercase tracking-[0.16em] text-(--foreground-muted)'>{children}</h3>
}

/** 原始规则模式：同一份场景数据的平铺结构化视图。 */
function RawBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className='overflow-x-auto rounded-xl border border-(--border-soft) bg-black/40 p-4 text-xs leading-relaxed text-(--foreground-subtle)'>
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function SideCard({ side, card, victory }: { side: Side; card: ScenarioSideCard; victory: string }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4',
        side === 'A' ? 'border-sky-900/50 bg-sky-950/15' : 'border-amber-900/50 bg-amber-950/15',
      )}
    >
      <div className='flex items-center gap-2'>
        <Badge tone={side === 'A' ? 'sideA' : 'sideB'}>{side} 方</Badge>
        <span className='font-bold text-(--foreground)'>{card.name}</span>
      </div>
      <KeyValue label='公开要求'>{card.publicRequirements}</KeyValue>
      <KeyValue label='行动重心'>{card.actionFocus}</KeyValue>
      {/* W2 EXPAND-1 字段（#51）：可选立场/请求项 + 开场白 */}
      <div className='flex flex-col gap-1'>
        <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>可选立场 / 请求项</span>
        <div className='flex flex-wrap gap-1.5'>
          {card.optionalStances.map((s) => (
            <span key={s} className='rounded-full border border-(--border) bg-white/4 px-2.5 py-0.5 text-[11px] text-(--foreground-subtle)'>
              {s}
            </span>
          ))}
        </div>
      </div>
      <KeyValue label='开场白'>
        <span className='italic text-(--foreground-subtle)'>{card.openingStatement}</span>
      </KeyValue>
      <KeyValue label='胜利条件'>{victory}</KeyValue>
    </div>
  )
}

export function ScenarioDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { agents, user } = useAppState()
  const [mode, setMode] = useState<ViewMode>('narrative')
  const [openLayers, setOpenLayers] = useState<{ e1: boolean; e2: boolean; deep: boolean }>({
    e1: false,
    e2: false,
    deep: false,
  })

  const scenario = SCENARIOS.find((s) => s.id === id)
  if (!scenario) {
    return (
      <EmptyState
        title='没有找到这个场景'
        hint='它可能已下线，或链接有误。回到场景列表看看现有的战场。'
        action={<Button onClick={() => navigate('/scenarios')}>回到场景选择</Button>}
      />
    )
  }

  const battleCount = SCENARIO_BATTLE_COUNTS[scenario.id] ?? 0
  // (#39) 统计展示门槛只按对局数；(#54) 未过门槛用引导空态，不显示空数字
  const statsVisible = battleCount >= CONFIG.statsDisplayThreshold
  const npcs = store.npcsFor(scenario.id)
  const pvpUnlocked = store.pvpUnlocked(scenario.id)
  const pvpProgress = store.pvpProgress(scenario.id)
  const myAgents = agents.filter((a) => a.scenarioId === scenario.id && a.ownerId === user?.id)
  // 双侧完成度 + 参赛资格（#58/#64）
  const bySide = store.myAgentsBySide(scenario.id)
  const readiness = store.entryReadiness(scenario.id)
  const missingSide = bySide.A.length === 0 ? 'A' : bySide.B.length === 0 ? 'B' : null
  const toggle = (key: 'e1' | 'e2' | 'deep') => setOpenLayers((o) => ({ ...o, [key]: !o[key] }))

  // 原始规则模式的数据切片（同一数据，按四层切分；judgeOsPrompt 维持不公开 #51，不在任何层出现）
  const rawGlance = {
    id: scenario.id,
    subject: scenario.subject,
    name: scenario.name,
    oneLiner: scenario.oneLiner,
    difficulty: scenario.difficulty,
    beginnerFriendly: scenario.beginnerFriendly,
    isNew: scenario.isNew,
    estimatedMinutes: scenario.estimatedMinutes,
    sideWinRate: SCENARIO_SIDE_WINRATE[scenario.id] ?? null,
    battleCount: statsVisible ? battleCount : `未达展示门槛（<${CONFIG.statsDisplayThreshold}）`,
  }
  const rawExpand1 = {
    background: scenario.background,
    sideA: scenario.sideA,
    sideB: scenario.sideB,
    victoryConditions: scenario.victoryConditions,
  }
  const rawExpand2 = {
    judgePersona: scenario.judgePersona,
    judgePromptSummary: scenario.judgePromptSummary,
    scoring: scenario.scoring,
    hiddenGoalsHowTo: scenario.hiddenGoalsHowTo,
    hiddenInfoTruthConfig: scenario.hiddenInfoTruthConfig,
    postGameInquiry: scenario.postGameInquiry,
    dialogueTurns: scenario.dialogueTurns,
    phases: scenario.phases,
  }
  const rawDeep = {
    judgePrompt: scenario.judgePrompt,
    boundaries: scenario.boundaries,
    judgeModel: scenario.judgeModel,
    scoringModel: scenario.scoringModel,
  }

  return (
    <div className='flex flex-col gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='min-w-0'>
          <p className='page-eyebrow'>DA · 场景介绍 · {scenario.subject}</p>
          <h1 className='page-title'>{scenario.name}</h1>
          <p className='page-subtitle'>{scenario.oneLiner}</p>
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <Tabs
            items={[
              { key: 'narrative', label: '叙事' },
              { key: 'raw', label: '原始规则' },
            ]}
            value={mode}
            onChange={(k) => setMode(k as ViewMode)}
          />
          <Button size='lg' onClick={() => navigate(`/scenarios/${scenario.id}/build`)}>
            <Hammer className='h-4 w-4' />
            去构建
          </Button>
        </div>
      </header>

      <div className='grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
        {/* 左列：四层渐进展示骨架 */}
        <div className='flex flex-col gap-4'>
          {/* GLANCE：常开首层 */}
          <Card className='flex flex-col gap-4'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-[11px] font-bold uppercase tracking-[0.18em] text-(--accent)'>GLANCE · 一眼看懂</span>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge
                  tone={scenario.difficulty === 'easy' ? 'success' : scenario.difficulty === 'medium' ? 'warning' : 'neutral'}
                  className={cn(scenario.difficulty === 'hard' && 'border-red-900/60 bg-red-950/40 text-red-300')}
                >
                  难度 · {DIFFICULTY_LABEL[scenario.difficulty]}
                </Badge>
                {/* (#40) 「适合新手」独立标注 */}
                {scenario.beginnerFriendly && <Badge tone='info'>适合新手</Badge>}
                {scenario.isNew && (
                  <Badge tone='accent'>
                    <Sparkles className='h-3 w-3' />
                    新上线
                  </Badge>
                )}
              </div>
            </div>
            {mode === 'narrative' ? (
              <>
                <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-(--foreground-subtle)'>
                  <span className='inline-flex items-center gap-1.5'>
                    <Clock className='h-4 w-4' />
                    一场约 {scenario.estimatedMinutes} 分钟
                  </span>
                  {statsVisible && (
                    <span className='inline-flex items-center gap-1.5'>
                      <Swords className='h-4 w-4' />
                      累计 {battleCount} 场对局（按 agent 计）
                    </span>
                  )}
                </div>
                {statsVisible ? (
                  <div className='flex flex-col gap-2'>
                    <SubHeading>侧方胜率</SubHeading>
                    <SideSplitBar scenario={scenario} />
                  </div>
                ) : (
                  <div className='flex flex-col gap-1.5 rounded-xl border border-dashed border-(--border) p-3'>
                    <p className='text-xs font-semibold text-(--foreground-subtle)'>数据积累中</p>
                    <p className='text-[11px] leading-relaxed text-(--foreground-muted)'>
                      早期对局正在进行——侧方胜率与场次统计将在这里出现。来打下最早的几场。
                    </p>
                  </div>
                )}
              </>
            ) : (
              <RawBlock data={rawGlance} />
            )}
          </Card>

          <LayerSection
            layer='EXPAND-1'
            title='故事与双方'
            hint='背景故事 · 双方是谁 · 胜利条件 · 立场与开场白'
            open={openLayers.e1}
            onToggle={() => toggle('e1')}
          >
            {mode === 'narrative' ? (
              <>
                <div className='flex flex-col gap-2'>
                  <SubHeading>背景故事</SubHeading>
                  <p className='panel-copy text-sm'>{scenario.background}</p>
                </div>
                <div className='flex flex-col gap-2'>
                  <SubHeading>双方是谁 · 双方胜利条件</SubHeading>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <SideCard side='A' card={scenario.sideA} victory={scenario.victoryConditions.A} />
                    <SideCard side='B' card={scenario.sideB} victory={scenario.victoryConditions.B} />
                  </div>
                </div>
              </>
            ) : (
              <RawBlock data={rawExpand1} />
            )}
          </LayerSection>

          <LayerSection
            layer='EXPAND-2'
            title='裁判与规则'
            hint='评判什么 · 计分权重 · 隐藏目标 · 轮数与阶段'
            open={openLayers.e2}
            onToggle={() => toggle('e2')}
          >
            {mode === 'narrative' ? (
              <>
                <div className='flex flex-col gap-2'>
                  <SubHeading>裁判是谁 · 评判什么</SubHeading>
                  <p className='panel-copy text-sm'>
                    <span className='font-semibold text-(--foreground)'>{scenario.judgePersona}</span>
                  </p>
                  <p className='panel-copy text-sm'>{scenario.judgePromptSummary}</p>
                </div>
                <div className='flex flex-col gap-2'>
                  <SubHeading>计分规则（精确权重全公开）</SubHeading>
                  {/* (#26/#42) 从场景数据读取、不硬编码；权重与判定方式如实展示 */}
                  <div className='overflow-x-auto rounded-xl border border-(--border-soft)'>
                    <table className='w-full min-w-[32rem] text-left text-sm'>
                      <thead>
                        <tr className='border-b border-(--border-soft) text-[11px] uppercase tracking-[0.14em] text-(--foreground-muted)'>
                          <th className='px-4 py-2.5 font-semibold'>维度</th>
                          <th className='px-4 py-2.5 font-semibold'>权重</th>
                          <th className='px-4 py-2.5 font-semibold'>判定方式</th>
                          <th className='px-4 py-2.5 font-semibold'>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scenario.scoring.map((dim) => (
                          <tr key={dim.key} className='border-b border-(--border-soft) last:border-b-0'>
                            <td className='px-4 py-2.5 font-semibold text-(--foreground)'>{dim.label}</td>
                            <td className='px-4 py-2.5 font-semibold text-(--accent)'>{Math.round(dim.weight * 100)}%</td>
                            <td className='px-4 py-2.5'>
                              <Badge tone={dim.kind === 'structured' ? 'success' : 'info'}>
                                {dim.kind === 'structured' ? '结构化' : 'LLM 软判断'}
                              </Badge>
                            </td>
                            <td className='px-4 py-2.5 text-(--foreground-subtle)'>{dim.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <SubHeading>隐藏目标怎么玩</SubHeading>
                  <p className='panel-copy text-sm'>{scenario.hiddenGoalsHowTo}</p>
                  <p className='text-xs text-(--foreground-muted)'>规则对人公开；每局的具体分配对对手 agent 隐藏。</p>
                </div>
                {/* W2 EXPAND-2 字段（#51） */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <KeyValue label='隐藏信息真假配置概况'>{scenario.hiddenInfoTruthConfig}</KeyValue>
                  <KeyValue label='赛后问询方式'>{scenario.postGameInquiry}</KeyValue>
                  <KeyValue label='对话轮数'>{scenario.dialogueTurns} 轮</KeyValue>
                  {scenario.phases && (
                    <KeyValue label='阶段结构'>
                      <span className='flex flex-wrap items-center gap-1.5'>
                        {scenario.phases.map((p, i) => (
                          <span key={p} className='inline-flex items-center gap-1.5'>
                            {i > 0 && <span className='text-(--foreground-muted)'>→</span>}
                            <span className='rounded-full border border-(--border) bg-white/4 px-2.5 py-0.5 text-xs'>{p}</span>
                          </span>
                        ))}
                      </span>
                    </KeyValue>
                  )}
                </div>
              </>
            ) : (
              <RawBlock data={rawExpand2} />
            )}
          </LayerSection>

          <LayerSection
            layer='DEEP'
            title='完整裁判 prompt 与约束'
            hint='裁判完整 prompt · 边界约束 · 裁判/计分模型'
            open={openLayers.deep}
            onToggle={() => toggle('deep')}
          >
            {mode === 'narrative' ? (
              <>
                <div className='flex flex-col gap-2'>
                  <SubHeading>裁判完整 prompt</SubHeading>
                  <pre className='overflow-x-auto whitespace-pre-wrap rounded-xl border border-(--border-soft) bg-black/40 p-4 text-xs leading-relaxed text-(--foreground-subtle)'>
                    {scenario.judgePrompt}
                  </pre>
                  {/* (#51) judgeOsPrompt（裁判内心 OS 的生成 prompt）维持不公开，故不在此页展示 */}
                  <p className='text-xs text-(--foreground-muted)'>裁判内心 OS 的生成 prompt 不公开（仅管理员维护）。</p>
                </div>
                <div className='flex flex-col gap-2'>
                  <SubHeading>边界约束</SubHeading>
                  <ul className='flex flex-col gap-1.5 text-sm text-(--foreground-subtle)'>
                    {scenario.boundaries.map((b) => (
                      <li key={b} className='flex items-start gap-2'>
                        <span className='mt-2 h-1 w-1 shrink-0 rounded-full bg-(--accent)' />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* W2 DEEP 字段（#51）：裁判/计分模型 */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <KeyValue label='裁判模型'>{scenario.judgeModel}</KeyValue>
                  <KeyValue label='计分模型'>{scenario.scoringModel}</KeyValue>
                </div>
              </>
            ) : (
              <RawBlock data={rawDeep} />
            )}
          </LayerSection>
        </div>

        {/* 右列：行动与对手 */}
        <div className='flex flex-col gap-4'>
          <Card className='flex flex-col gap-3'>
            <p className='panel-title text-base'>准备好了？</p>
            {/* per-side（#55/#58）：每个智能体执一侧；参赛需两侧各标一个参赛版本 */}
            <p className='panel-copy text-sm'>每个智能体执一侧。两侧都建、各标一个参赛版本，才能参加锦标赛。</p>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>双侧完成度</span>
              {(['A', 'B'] as const).map((side) => (
                <Badge key={side} tone={bySide[side].length > 0 ? 'success' : 'neutral'}>
                  {sideRoleShort(scenario, side)} {bySide[side].length > 0 ? '✓' : '✗'}
                </Badge>
              ))}
            </div>
            <p className='m-0 text-xs text-(--foreground-muted)'>
              参赛资格：
              {readiness.eligible
                ? '已具备（双侧参赛版本已标）。'
                : missingSide !== null
                  ? `未具备——还没有${sideRoleShort(scenario, missingSide)}侧的智能体。`
                  : '未具备——双侧智能体都有了，还差参赛版本标记。'}
            </p>
            <Button size='lg' className='w-full' onClick={() => navigate(`/scenarios/${scenario.id}/build`)}>
              <Hammer className='h-4 w-4' />
              去构建
            </Button>
            {missingSide !== null && myAgents.length > 0 && (
              <Button
                variant='secondary'
                className='w-full'
                onClick={() => navigate(`/scenarios/${scenario.id}/build?side=${missingSide}`)}
              >
                去创建对侧（{sideRoleShort(scenario, missingSide)}）
              </Button>
            )}
          </Card>

          {/* PVP 门槛状态条（A6）；#65：每侧各赢 ≥N 场 PVE */}
          <Card className='flex flex-col gap-2'>
            {pvpUnlocked ? (
              <div className='flex items-center gap-2 text-sm font-semibold text-(--success)'>
                <Unlock className='h-4 w-4' />
                PVP 已解锁（两侧 PVE 门槛均已达成）
              </div>
            ) : (
              <>
                <div className='flex items-center gap-2 text-sm font-semibold text-(--foreground)'>
                  <Lock className='h-4 w-4 text-(--foreground-subtle)' />
                  每侧各赢 ≥{pvpProgress.A.needed} 场 PVE 解锁 PVP
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  {(['A', 'B'] as const).map((side) => (
                    <Badge key={side} tone={pvpProgress[side].beaten >= pvpProgress[side].needed ? 'success' : 'neutral'}>
                      {sideRoleShort(scenario, side)} {Math.min(pvpProgress[side].beaten, pvpProgress[side].needed)}/{pvpProgress[side].needed}
                      {pvpProgress[side].beaten >= pvpProgress[side].needed ? ' ✓' : ''}
                    </Badge>
                  ))}
                </div>
                {/* #65：胜利按执的侧归因——两侧都要打 */}
                <p className='text-xs text-(--foreground-muted)'>胜场按你执的侧计：用{sideRoleShort(scenario, 'A')}赢点亮左格，用{sideRoleShort(scenario, 'B')}赢点亮右格。</p>
              </>
            )}
          </Card>

          <Card className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1'>
              <p className='panel-title text-base'>PVE 对手（NPC）</p>
              {/* (#34) 战绩语义：NPC 两侧胜率，不是玩家胜率 */}
              <p className='text-[11px] text-(--foreground-muted)'>该 NPC 执A/执B时的胜率（非玩家胜率）</p>
            </div>
            {npcs.map((npc) => (
              <div key={npc.id} className='flex flex-col gap-2 rounded-xl border border-(--border-soft) bg-white/[0.02] p-3'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-semibold text-(--foreground)'>{npc.name}</span>
                  <Badge tone={npc.easeRank === 1 ? 'success' : 'warning'}>
                    {npc.easeRank === 1 ? '最容易' : `难度序 ${npc.easeRank}`}
                  </Badge>
                </div>
                <p className='text-xs text-(--foreground-subtle)'>{npc.tagline}</p>
                <div className='flex items-center gap-4 text-xs'>
                  <span>
                    <span className='font-semibold text-(--side-a)'>执A</span>{' '}
                    <span className='text-(--foreground)'>{Math.round(npc.sideWinRate.A * 100)}%</span>
                  </span>
                  <span>
                    <span className='font-semibold text-(--side-b)'>执B</span>{' '}
                    <span className='text-(--foreground)'>{Math.round(npc.sideWinRate.B * 100)}%</span>
                  </span>
                </div>
              </div>
            ))}
          </Card>

          {myAgents.length > 0 && (
            <Card className='flex flex-col gap-2'>
              <p className='panel-title text-base'>我的智能体</p>
              {myAgents.map((agent) => (
                <Link
                  key={agent.id}
                  to={`/agents/${agent.id}`}
                  className='flex items-center justify-between gap-2 rounded-xl border border-(--border-soft) bg-white/[0.02] px-3 py-2.5 transition hover:border-(--border) hover:bg-white/[0.04]'
                >
                  <span className='inline-flex items-center gap-2 text-sm font-semibold text-(--foreground)'>
                    <Bot className='h-4 w-4 text-(--foreground-subtle)' />
                    {/* agent 名天然含侧（#63） */}
                    <Badge tone={agent.side === 'A' ? 'sideA' : 'sideB'}>{sideRoleShort(scenario, agent.side)}</Badge>
                    {agent.name}
                  </span>
                  <span className='text-xs text-(--foreground-muted)'>{agent.versions.length} 个版本</span>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
