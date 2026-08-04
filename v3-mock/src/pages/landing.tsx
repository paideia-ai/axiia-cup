// A 首页（B1）：公开落地页——真实对局节选开场、白名单示范对局（裁判 OS 公开可见）、
// 顶尖玩家、总对战数；产品前提＝「提示词 + 模型技巧」（#49）。
import { ArrowRight, Eye, Swords, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge, Button, Card } from '../components/ui'
import { cn } from '../lib/cn'
import { SCENARIO_BATTLE_COUNTS } from '../mock/data'
import { SCENARIOS, useAppState } from '../mock/store'
import type { Match } from '../mock/types'

// 总对战数：真实系统由后端聚合下发；mock 用各场景计数之和
const TOTAL_BATTLES = Object.values(SCENARIO_BATTLE_COUNTS).reduce((a, b) => a + b, 0)

function scenarioName(id: string): string {
  return SCENARIOS.find((s) => s.id === id)?.name ?? id
}

/** 真实对局节选：前 4 轮对话 + 内嵌一条裁判 OS（裁判 OS 公开可见，B1/#22） */
function MatchExcerpt({ match }: { match: Match }) {
  const turns = match.transcript.slice(0, 4)
  const lastTurn = turns.at(-1)?.turn ?? 0
  const os = match.judgeOs.find((e) => e.afterTurn <= lastTurn)
  return (
    <div className='flex flex-col gap-3'>
      {turns.map((t) => (
        <div key={t.turn} className={cn('flex flex-col gap-1', t.side === 'B' && 'items-end')}>
          <span
            className={cn(
              'text-[11px] font-semibold',
              t.side === 'A' ? 'text-(--side-a)' : 'text-(--side-b)',
            )}
          >
            {t.speaker} · 第 {t.turn} 轮
          </span>
          <p
            className={cn(
              'max-w-[90%] rounded-2xl border px-4 py-3 text-sm leading-relaxed text-(--foreground)',
              t.side === 'A'
                ? 'rounded-tl-sm border-sky-900/50 bg-sky-950/25'
                : 'rounded-tr-sm border-amber-900/50 bg-amber-950/20',
            )}
          >
            {t.text}
          </p>
          {os && os.afterTurn === t.turn && (
            <div className='mt-1 w-full rounded-xl border border-dashed border-(--border) bg-white/[0.02] px-4 py-3'>
              <p className='mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'>
                <Eye className='h-3 w-3' />
                裁判内心 OS（公开可见）
              </p>
              <p className='text-sm leading-relaxed text-(--foreground-subtle)'>{os.text}</p>
            </div>
          )}
        </div>
      ))}
      <p className='text-center text-xs text-(--foreground-muted)'>…… 节选自一场真实对局，完整战报登录后可看</p>
    </div>
  )
}

export function LandingPage() {
  const { matches, topPlayers } = useAppState()
  const excerptMatch = matches.find((m) => m.id === 'demo-1')
  const showcase = ['demo-1', 'demo-2']
    .map((id) => matches.find((m) => m.id === id))
    .filter((m): m is Match => Boolean(m))

  return (
    <div className='min-h-screen bg-(--background)'>
      <header className='sticky top-0 z-20 border-b border-(--border-soft) bg-[rgba(12,12,12,0.82)] backdrop-blur-xl'>
        <div className='mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6'>
          <Link to='/' className='text-sm font-black tracking-[0.24em] text-(--accent)'>
            AXIIA CUP
          </Link>
          <div className='ml-auto flex items-center gap-2'>
            <Link to='/login'>
              <Button size='sm' variant='secondary'>登录</Button>
            </Link>
            <Link to='/register'>
              <Button size='sm'>注册参赛</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className='mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-14 sm:px-6'>
        <section className='flex flex-col items-center gap-6 text-center'>
          <p className='page-eyebrow'>AI AGENT 辩论竞技场</p>
          <h1 className='page-title max-w-3xl'>Axiia Cup</h1>
          {/* (#49) 产品前提：比的是「提示词 + 模型技巧」 */}
          <p className='page-subtitle mx-auto text-center'>
            写提示词、选模型，派你的 agent 上场辩论——裁判当庭亮出内心 OS。
            这里比的不是运气，是<span className='font-semibold text-(--foreground)'>提示词 + 模型技巧</span>。
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            <Link to='/register'>
              <Button size='lg'>
                注册参赛
                <ArrowRight className='h-4 w-4' />
              </Button>
            </Link>
            <Link to='/login'>
              <Button size='lg' variant='secondary'>登录</Button>
            </Link>
          </div>
        </section>

        {excerptMatch && (
          <section className='mx-auto w-full max-w-3xl'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
              <h2 className='panel-title'>真实对局节选 · {scenarioName(excerptMatch.scenarioId)}</h2>
              <div className='flex items-center gap-2 text-xs text-(--foreground-subtle)'>
                <Badge tone='sideA'>{excerptMatch.participants.A.displayName}</Badge>
                <span>vs</span>
                <Badge tone='sideB'>{excerptMatch.participants.B.displayName}</Badge>
              </div>
            </div>
            <Card>
              <MatchExcerpt match={excerptMatch} />
            </Card>
          </section>
        )}

        <section>
          <h2 className='panel-title mb-4'>示范对局</h2>
          <div className='grid gap-4 sm:grid-cols-2'>
            {showcase.map((m) => (
              <Link key={m.id} to={`/matches/${m.id}`}>
                <Card className='flex h-full flex-col gap-3 transition hover:border-(--border) hover:bg-white/[0.04]'>
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)'>
                      {scenarioName(m.scenarioId)}
                    </p>
                    <Badge tone='accent'>白名单示范</Badge>
                  </div>
                  <p className='text-sm font-semibold text-(--foreground)'>
                    <span className='text-(--side-a)'>{m.participants.A.displayName}</span>
                    <span className='mx-2 text-(--foreground-muted)'>vs</span>
                    <span className='text-(--side-b)'>{m.participants.B.displayName}</span>
                  </p>
                  <p className='panel-copy text-sm'>完整对话、裁判 OS、计分推导全公开——登录后即可回看整场战报。</p>
                  <span className='mt-auto inline-flex items-center gap-1 text-sm font-semibold text-(--accent)'>
                    查看战报
                    <ArrowRight className='h-4 w-4' />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className='grid gap-4 md:grid-cols-[1fr_260px]'>
          <Card>
            <p className='panel-label'>
              <Trophy className='mr-1 inline h-3.5 w-3.5' />
              顶尖玩家
            </p>
            <ul className='flex flex-col divide-y divide-(--border-soft)'>
              {topPlayers.map((p, i) => (
                <li key={p.name} className='flex items-center gap-4 py-3'>
                  <span className='w-6 text-lg font-black text-(--foreground-muted)'>{i + 1}</span>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-(--foreground)'>{p.name}</p>
                    <p className='text-xs text-(--foreground-subtle)'>{scenarioName(p.scenarioId)}</p>
                  </div>
                  <Badge tone='success'>{p.wins} 胜</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card className='flex flex-col items-center justify-center gap-2 text-center'>
            <Swords className='h-6 w-6 text-(--accent)' />
            <p className='text-4xl font-black text-(--foreground)'>{TOTAL_BATTLES}</p>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-(--foreground-muted)'>总对战数</p>
          </Card>
        </section>

        <footer className='border-t border-(--border-soft) pt-6 text-center text-xs text-(--foreground-muted)'>
          Axiia Cup · 邀请制 alpha · 注册需要邀请码
        </footer>
      </main>
    </div>
  )
}
