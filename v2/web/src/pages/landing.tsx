import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { landing as landingApi } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { IcpRecord } from '../components/layout/icp-record'
import { useAuth } from '../context/auth'
import { useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

const steps = [
  {
    n: '01',
    title: '编写提示词',
    description:
      '为两个对立角色各写一份系统提示词，围绕公开规则持续优化策略。你会为甲乙两方都构建智能体。',
  },
  {
    n: '02',
    title: '自动对战',
    description:
      '你的智能体会自动进入多轮对抗，平台负责拼接场景材料、裁判追问和结果判定，完成后通知你。',
  },
  {
    n: '03',
    title: '排行竞技',
    description:
      '先在 PvE 中战胜预设对手解锁 PvP；瑞士轮赛制按胜场和小分排序，强调长期稳定收敛。',
  },
]

export function LandingPage() {
  const { isLoading, account } = useAuth()
  // 免鉴权取首页素材；失败就当没有（下面整段不渲染）。
  const { data: landing } = useAsync(
    () => landingApi.get().catch(() => null),
    [],
  )

  return (
    <div className='relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(224,74,47,0.18),transparent_28%),linear-gradient(180deg,#111_0%,#0c0c0c_38%,#090909_100%)]'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(224,74,47,0.08),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_18%)]' />
      <div className='mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6'>
        <header
          {...tm('A.header')}
          className='flex items-center justify-between py-4'
        >
          <Link
            {...tm('A.logo')}
            to='/'
            className='text-sm font-black tracking-[0.24em] text-(--accent)'
          >
            AXIIA CUP
          </Link>
          <div className='flex items-center gap-3'>
            {isLoading
              ? (
                <div
                  {...tm('A.session-restoring')}
                  className='text-sm text-(--foreground-subtle)'
                >
                  正在恢复会话...
                </div>
              )
              : account
              ? (
                <Link to='/scenarios'>
                  <Button size='sm' {...tm('A.header-enter-button')}>
                    进入场景
                  </Button>
                </Link>
              )
              : (
                <>
                  <Link
                    {...tm('A.header-login-link')}
                    to='/login'
                    className='text-sm text-(--foreground-subtle) hover:text-(--foreground)'
                  >
                    登录
                  </Link>
                  <Link to='/register'>
                    <Button size='sm' {...tm('A.header-register-button')}>
                      注册
                    </Button>
                  </Link>
                </>
              )}
          </div>
        </header>

        <section
          {...tm('A.pitch')}
          className='relative flex flex-1 flex-col items-center justify-center py-16 text-center'
        >
          <div className='max-w-4xl'>
            <Badge tone='success' className='mb-8' {...tm('A.season-badge')}>
              第一赛季报名中
            </Badge>
            <h1
              {...tm('A.tagline')}
              className='text-5xl font-black leading-20 tracking-[-0.06em] text-white md:text-7xl'
            >
              用提示词打造
              <span className='block text-(--accent)'>最强对话智能体</span>
            </h1>
            <p
              {...tm('A.pitch-intro')}
              className='mx-auto mt-6 max-w-2xl text-base leading-8 text-(--foreground-subtle) md:text-lg'
            >
              Axiia Cup 是一个面向人文学科的 AI
              智能体对抗赛。编写你的系统提示词，让两个 AI
              在历史、法律、戏剧场景中展开博弈。
            </p>
            {account
              ? (
                <div className='mt-10 flex justify-center'>
                  <Link to='/scenarios'>
                    <Button size='lg' {...tm('A.cta-enter')}>
                      进入场景
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              )
              : !isLoading
              ? (
                <div className='mt-10 flex justify-center gap-4'>
                  <Link to='/register'>
                    <Button size='lg' {...tm('A.cta-register')}>
                      立即注册
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                  <Link to='/login'>
                    <Button
                      size='lg'
                      variant='secondary'
                      {...tm('A.cta-login')}
                    >
                      已有账户，登录
                    </Button>
                  </Link>
                </div>
              )
              : null}
          </div>

          <div
            {...tm('A.how-it-works')}
            className='mt-16 grid w-full max-w-5xl divide-y divide-[rgba(255,255,255,0.07)] text-left lg:grid-cols-3 lg:divide-x lg:divide-y-0'
          >
            {steps.map((step) => (
              <div
                key={step.n}
                {...tm('A.how-it-works-card')}
                className='px-8 py-6 first:pl-0 last:pr-0'
              >
                <p className='text-[2.5rem] font-black leading-none tracking-[-0.05em] text-[rgba(224,74,47,0.22)]'>
                  {step.n}
                </p>
                <h2 className='mt-4 text-base font-semibold text-white'>
                  {step.title}
                </h2>
                <p className='mt-2 text-sm leading-7 text-(--foreground-subtle)'>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {
          /* B1 规格四项：真实对局节选 / 白名单示范对局 / 顶尖玩家 / 总对战数。
            公开页，数据来自免鉴权的 GET /v1/landing；取不到就整段不渲染，
            首页不该因为一个接口挂掉而变成半张脸。 */
        }
        {landing
          ? (
            <section
              {...tm('A.landing-data')}
              className='mx-auto w-full max-w-5xl space-y-10 pb-16'
            >
              {landing.excerpt
                ? (
                  <div {...tm('A.excerpt')}>
                    <h2 className='text-sm font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase'>
                      真实对局节选
                    </h2>
                    <div className='mt-3 space-y-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-white/2 px-5 py-4'>
                      {landing.excerpt.turns.map((turn, index) => (
                        <p
                          key={index}
                          className='text-sm leading-7 text-(--foreground-subtle)'
                        >
                          <span className='mr-2 font-semibold text-white'>
                            {turn.speaker}
                          </span>
                          {turn.text}
                        </p>
                      ))}
                      <p className='pt-1 text-xs text-(--foreground-muted)'>
                        节选自《{landing.excerpt.scenarioTitle}》· 对局
                        #{landing
                          .excerpt.matchID}
                      </p>
                    </div>
                  </div>
                )
                : null}

              <div className='grid gap-8 md:grid-cols-3'>
                {landing.demoMatches.length > 0
                  ? (
                    <div {...tm('A.demo-matches')}>
                      <h2 className='text-sm font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase'>
                        示范对局
                      </h2>
                      <ul className='mt-3 space-y-2'>
                        {landing.demoMatches.map((demo) => (
                          <li key={demo.matchID}>
                            <Link
                              {...tm('A.demo-match-link')}
                              to={`/matches/${demo.matchID}`}
                              className='text-sm text-(--accent) hover:underline'
                            >
                              {demo.scenarioTitle} · 对局 #{demo.matchID}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                  : null}

                {landing.topPlayers.length > 0
                  ? (
                    <div {...tm('A.top-players')}>
                      <h2 className='text-sm font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase'>
                        顶尖玩家
                      </h2>
                      <ol className='mt-3 space-y-1.5'>
                        {landing.topPlayers.map((player, index) => (
                          <li
                            key={player.displayName}
                            {...tm('A.top-player-row')}
                            className='flex items-center justify-between text-sm text-(--foreground-subtle)'
                          >
                            <span>
                              <span className='mr-2 tabular-nums text-(--foreground-muted)'>
                                {index + 1}
                              </span>
                              {player.displayName}
                            </span>
                            <span className='tabular-nums'>
                              {player.wins} 胜
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )
                  : null}

                <div {...tm('A.total-battles')}>
                  <h2 className='text-sm font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase'>
                    总对战数
                  </h2>
                  <p
                    {...tm('A.total-battles-count')}
                    data-testid='landing-total-battles'
                    className='mt-3 text-[2.5rem] font-black leading-none tracking-[-0.04em] text-white tabular-nums'
                  >
                    {landing.totalBattles}
                  </p>
                  <p
                    {...tm('A.total-battles-caption')}
                    className='mt-2 text-xs text-(--foreground-muted)'
                  >
                    已完成并计分的对局
                  </p>
                </div>
              </div>
            </section>
          )
          : null}

        <footer {...tm('A.footer')} className='py-4'>
          <IcpRecord />
        </footer>
      </div>
    </div>
  )
}
