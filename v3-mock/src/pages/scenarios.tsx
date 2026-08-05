// D — 场景选择（A4）。每场景一卡：一句话介绍 + 统计（门槛 #39）、
// 难度/适合新手（#40）、预计时长、侧方胜率 glance 钩子（#38）、新场景曝光（#54）。
import { Bot, Clock, Lock, Sparkles, Swords, Unlock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge, Card } from '../components/ui'
import { cn } from '../lib/cn'
import { SCENARIO_BATTLE_COUNTS, SCENARIO_SIDE_WINRATE, sideRoleShort } from '../mock/data'
import { CONFIG, SCENARIOS, store, useAppState } from '../mock/store'
import { DIFFICULTY_LABEL, type Scenario } from '../mock/types'

/** (#54) 新上线场景固定插在列表第 2 位（index 1），不依赖统计门槛的曝光。 */
function orderedScenarios(): Scenario[] {
  const base = [...SCENARIOS]
  const newIdx = base.findIndex((s) => s.isNew)
  if (newIdx < 0) return base
  const [fresh] = base.splice(newIdx, 1)
  base.splice(Math.min(1, base.length), 0, fresh)
  return base
}

/** 侧方胜率两色分割条（#38 glance 级钩子），带双方侧名。 */
function SideSplitBar({ scenario }: { scenario: Scenario }) {
  const rate = SCENARIO_SIDE_WINRATE[scenario.id] ?? { A: 0.5, B: 0.5 }
  const pctA = Math.round(rate.A * 100)
  const pctB = 100 - pctA
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex h-1.5 w-full overflow-hidden rounded-full bg-white/6'>
        <span className='bg-(--side-a)' style={{ width: `${pctA}%` }} />
        <span className='bg-(--side-b)' style={{ width: `${pctB}%` }} />
      </div>
      <div className='flex items-baseline justify-between gap-2 text-[11px] text-(--foreground-subtle)'>
        <span className='truncate'>
          <span className='font-semibold text-(--side-a)'>{scenario.sideA.name}</span> {pctA}%
        </span>
        <span className='truncate text-right'>
          {pctB}% <span className='font-semibold text-(--side-b)'>{scenario.sideB.name}</span>
        </span>
      </div>
    </div>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const navigate = useNavigate()
  const { agents, user } = useAppState()

  const battleCount = SCENARIO_BATTLE_COUNTS[scenario.id] ?? 0
  // (#39) 统计展示门槛只按对局数（按 agent 计），阈值走配置、不写死前端
  const statsVisible = battleCount >= CONFIG.statsDisplayThreshold

  const myAgents = agents.filter((a) => a.scenarioId === scenario.id && a.ownerId === user?.id)
  const pvpUnlocked = store.pvpUnlocked(scenario.id)
  const pvpProgress = store.pvpProgress(scenario.id)

  return (
    <Card
      onClick={() => navigate(`/scenarios/${scenario.id}`)}
      className='flex h-full flex-col gap-4'
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)'>{scenario.subject}</p>
          <h2 className='mt-1 text-xl font-extrabold text-(--foreground)'>{scenario.name}</h2>
        </div>
        {scenario.isNew && (
          <Badge tone='accent'>
            <Sparkles className='h-3 w-3' />
            新上线
          </Badge>
        )}
      </div>

      <p className='panel-copy text-sm'>{scenario.oneLiner}</p>

      <div className='flex flex-wrap items-center gap-2'>
        <Badge
          tone={scenario.difficulty === 'easy' ? 'success' : scenario.difficulty === 'medium' ? 'warning' : 'neutral'}
          className={cn(scenario.difficulty === 'hard' && 'border-red-900/60 bg-red-950/40 text-red-300')}
        >
          难度 · {DIFFICULTY_LABEL[scenario.difficulty]}
        </Badge>
        {/* (#40) 「适合新手」独立标注，不与难度绑定 */}
        {scenario.beginnerFriendly && <Badge tone='info'>适合新手</Badge>}
        <Badge tone='neutral'>
          <Clock className='h-3 w-3' />
          一场约 {scenario.estimatedMinutes} 分钟
        </Badge>
      </div>

      {statsVisible ? (
        <div className='flex flex-col gap-2 rounded-xl border border-(--border-soft) bg-white/[0.02] p-3'>
          <div className='flex items-center justify-between text-[11px] text-(--foreground-subtle)'>
            <span className='inline-flex items-center gap-1.5'>
              <Swords className='h-3.5 w-3.5' />
              累计 {battleCount} 场对局
            </span>
            <span className='font-semibold uppercase tracking-[0.12em] text-(--foreground-muted)'>侧方胜率</span>
          </div>
          <SideSplitBar scenario={scenario} />
        </div>
      ) : (
        // (#54) 未过统计门槛：引导式空态轮廓，不显示空数字
        <div className='flex flex-col gap-1.5 rounded-xl border border-dashed border-(--border) p-3'>
          <p className='text-xs font-semibold text-(--foreground-subtle)'>数据积累中</p>
          <div className='flex h-1.5 w-full overflow-hidden rounded-full bg-white/5'>
            <span className='w-1/2 bg-white/10' />
            <span className='w-1/2 bg-white/6' />
          </div>
          <p className='text-[11px] leading-relaxed text-(--foreground-muted)'>
            早期对局正在进行——侧方胜率与场次统计将在这里出现。来打下最早的几场。
          </p>
        </div>
      )}

      {/* ks 图3：场景卡里的智能体清单拆去「我的智能体」tab——D 回归纯场景发现，此处只留极简入口 */}
      <div className='mt-auto flex flex-wrap items-center gap-2 border-t border-(--border-soft) pt-3'>
        {myAgents.length > 0 && (
          <Link
            to='/my-agents'
            onClick={(e) => e.stopPropagation()}
            className='inline-flex items-center gap-1.5 text-[11px] font-semibold text-(--foreground-subtle) transition hover:text-(--foreground)'
          >
            <Bot className='h-3 w-3' />
            我的智能体（{myAgents.length}）→
          </Link>
        )}
        {pvpUnlocked ? (
          <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold text-(--success)'>
            <Unlock className='h-3 w-3' />
            PVP 已解锁
          </span>
        ) : (
          /* #65：门槛按侧——每侧各赢 ≥N 场 PVE */
          <span className='inline-flex items-center gap-1.5 text-[11px] text-(--foreground-muted)'>
            <Lock className='h-3 w-3' />
            解锁 PVP：{sideRoleShort(scenario, 'A')} {Math.min(pvpProgress.A.beaten, pvpProgress.A.needed)}/{pvpProgress.A.needed}
            {pvpProgress.A.beaten >= pvpProgress.A.needed ? ' ✓' : ''} · {sideRoleShort(scenario, 'B')}{' '}
            {Math.min(pvpProgress.B.beaten, pvpProgress.B.needed)}/{pvpProgress.B.needed}
            {pvpProgress.B.beaten >= pvpProgress.B.needed ? ' ✓' : ''}（每侧各赢 ≥{pvpProgress.A.needed} 场 PVE）
          </span>
        )}
      </div>
    </Card>
  )
}

export function ScenariosPage() {
  const scenarios = orderedScenarios()

  return (
    <div className='flex flex-col gap-8'>
      <header>
        <p className='page-eyebrow'>D · 场景选择</p>
        <h1 className='page-title'>选择你的战场</h1>
        <p className='page-subtitle'>
          每个场景是一场角色对抗：挑一个你想赢的辩局，点进去看完整规则，再去构建你的智能体。
        </p>
      </header>

      <div className='grid gap-5 md:grid-cols-2'>
        {scenarios.map((sc) => (
          <ScenarioCard key={sc.id} scenario={sc} />
        ))}
      </div>
    </div>
  )
}
