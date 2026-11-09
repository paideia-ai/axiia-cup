import { PageLoading } from '../components/page-loading'
import { Clock } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { catalog, config as configApi } from '../api/client'
import type { ScenarioDetail, Side } from '../api/types'
import { SideEntryAction } from '../components/create-agent-action'
import { Badge } from '../components/ui/badge'
import { ButtonLink } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/auth'
import { useAsync } from '../lib/use-async'
import { rolePortrait } from '../lib/role-portrait'
import { scenarioModule } from '../scenarios'
import type { ScenarioIntroCopy } from '../scenarios/types'
import { speakerLabels } from '../components/timeline/labels'
import { tm } from '../testmode/mark'
import './express.css'

// A3 首战快速通道落点（#8–#12，mock S4 的简化版 DA）：注册成功直接落进
// 这里。商鞅场景采用朝堂关系图，其余场景沿用单角色卡。执方与对手由新手
// 预设决定（#10/#57，GET /v1/config 的
// expressPreset 三元组＝对手 NPC 的场景/侧/预设 key；缺席回落 商鞅场景、
// 我执 a、对手取第一个 b 侧预设——回落的对手选择在构建器派发时兜底）。
// 已完成首战（firstBattleDone）→ 本页直接让路去场景列表。
export function ExpressPage() {
  const { firstBattleDone } = useAuth()

  const { data, error, loading } = useAsync(async () => {
    // config 失败不挡首战：按默认三元组渲染（对手预设由构建器兜底）。
    const cfg = await configApi.get().catch(() => null)
    const preset = cfg?.expressPreset ?? null
    const scenarioID = preset?.scenarioID ?? 'shangyang-court'
    const opponentSide: Side = preset?.side === 'a' ? 'a' : 'b'
    const mySide: Side = opponentSide === 'a' ? 'b' : 'a'
    const scenario = await catalog.scenario(scenarioID, mySide)
    return { scenarioID, mySide, scenario }
  }, [])

  if (firstBattleDone) return <Navigate replace to='/scenarios' />

  if (loading) {
    return <PageLoading variant='detail' {...tm('X.loading')} />
  }
  if (error || !data) {
    return (
      <div
        className='rounded-xl border border-(--border-soft) bg-white/2 px-6 py-8 text-center text-sm'
        {...tm('X.error-card')}
      >
        <p className='font-semibold text-(--foreground)'>
          {error ?? '首战场景暂不可用'}
        </p>
        <p className='mt-2 text-(--foreground-subtle)'>
          可以先从场景列表任选一个开始。
        </p>
        <div className='mt-5 flex justify-center'>
          <ButtonLink
            to='/scenarios'
            variant='secondary'
            {...tm('X.error-browse-button')}
          >
            浏览全部场景
          </ButtonLink>
        </div>
      </div>
    )
  }

  const { scenario, mySide } = data
  const module = scenarioModule(data.scenarioID)
  const courtIntro = data.scenarioID === 'shangyang-court'
    ? module?.intro?.source
    : null
  const education = module?.education ?? null
  const mySideName = mySide === 'a'
    ? scenario.summary.sideAName
    : scenario.summary.sideBName
  const mySideLabel = mySide === 'a'
    ? scenario.summary.sideALabel
    : scenario.summary.sideBLabel

  return (
    <div
      className={`express-entry mx-auto space-y-6 ${
        courtIntro ? 'express-page' : 'max-w-2xl'
      }`}
      {...tm('X.page')}
    >
      <div className='space-y-2' {...tm('X.page-header')}>
        <Badge tone='accent' {...tm('X.badge')}>首战快速通道</Badge>
        <h1
          className='text-2xl font-black tracking-tight text-(--foreground)'
          {...tm('X.page-title')}
        >
          {module?.intro?.source.title ?? scenario.summary.title}
        </h1>
        <p
          className='text-sm leading-relaxed text-(--foreground-subtle)'
          {...tm('X.hook')}
        >
          {courtIntro?.overview.title ?? education?.hook ??
            scenario.summary.subject}
        </p>
      </div>

      {courtIntro
        ? (
          <CourtOverview
            intro={courtIntro}
            scenario={scenario}
            mySide={mySide}
          />
        )
        : (
          <Card {...tm('X.role-card')}>
            <CardContent className='space-y-2 pt-5'>
              <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                你的角色
              </p>
              <p
                className='text-lg font-bold text-(--foreground)'
                {...tm('X.role-name')}
              >
                {mySideName}
                <span className='ml-2 text-sm font-medium text-(--foreground-subtle)'>
                  {mySideLabel}
                </span>
              </p>
              {education
                ? (
                  <p
                    className='text-sm leading-relaxed text-(--foreground-subtle)'
                    {...tm('X.win-condition')}
                  >
                    {education.winConditions[mySide]}
                  </p>
                )
                : null}
              {/* 一句规则：首战不展开四层教育，一行讲完怎么赢。 */}
              <p
                className='flex items-center gap-1.5 text-xs text-(--foreground-muted)'
                {...tm('X.rule-line')}
              >
                <Clock className='h-3.5 w-3.5' />
                {education?.formatLabel ??
                  `${scenario.summary.turnCount} 轮`}后由裁判当场判定胜负——写好策略提示词，AI
                替你上场。
              </p>
            </CardContent>
          </Card>
        )}

      <div className='flex flex-wrap items-center gap-4' {...tm('X.actions')}>
        <SideEntryAction
          scenarioID={data.scenarioID}
          side={mySide}
          role={mySideName}
          target='build'
          express
          testID='express-build'
          marker={tm('X.build-button')['data-tm']}
          size='default'
        >
          {courtIntro
            ? courtIntro.participants.sides[mySide].actionLabel
            : '去构建'} →
        </SideEntryAction>
        <Link
          to='/scenarios'
          className='text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
          {...tm('X.escape-link')}
        >
          先逛逛全部场景
        </Link>
      </div>
    </div>
  )
}

function CourtPortrait(
  { scenarioID, name }: { scenarioID: string; name: string },
) {
  const src = rolePortrait(speakerLabels(scenarioID, {}), name)
  return src
    ? (
      <img
        className='express-portrait'
        src={src}
        alt={`${name}头像`}
        width={88}
        height={88}
        decoding='async'
      />
    )
    : null
}

function CourtOverview({ intro, scenario, mySide }: {
  intro: ScenarioIntroCopy['source']
  scenario: ScenarioDetail
  mySide: Side
}) {
  const scenarioID = scenario.summary.id
  const player = intro.participants.sides[mySide]
  const opponent = intro.participants.sides[mySide === 'a' ? 'b' : 'a']
  const judge = intro.participants.judge
  const hidden = intro.participants.note
  const education = scenarioModule(scenarioID)?.education
  return (
    <>
      <section
        className='express-court'
        aria-label={intro.participants.title}
        data-testid='express-court'
      >
        <div className='express-court-judge'>
          <CourtPortrait scenarioID={scenarioID} name={judge.name} />
          <div>
            <p className='express-label'>裁判</p>
            <h2>{judge.name}</h2>
            <p>决定是否变法</p>
          </div>
        </div>
        <div className='express-court-sides'>
          <div className='express-court-player' {...tm('X.role-card')}>
            <CourtPortrait scenarioID={scenarioID} name={player.name} />
            <p className='express-label'>你的角色</p>
            <h2 {...tm('X.role-name')}>{player.name}</h2>
            <p>{player.eyebrow}</p>
          </div>
          <span className='express-court-debate'>朝堂辩论</span>
          <div className='express-court-opponent'>
            <CourtPortrait scenarioID={scenarioID} name={opponent.name} />
            <p className='express-label'>你的对手</p>
            <h2>{opponent.name}</h2>
            <p>{opponent.eyebrow}</p>
          </div>
        </div>
      </section>

      <section className='express-goal'>
        <h2 className='express-label'>{player.goalLabel}</h2>
        <p {...tm('X.win-condition')}>{player.goal}</p>
      </section>
      <p className='express-debate-note' {...tm('X.rule-line')}>
        <Clock aria-hidden='true' className='mt-0.5 h-4 w-4 shrink-0' />
        <span>
          {education?.formatLabel ??
            `${scenario.summary.turnCount} 轮朝堂辩论`}，每人每轮一次发言，每次不超过三句。
        </span>
      </p>

      <div className='express-disclosures'>
        <details className='express-disclosure'>
          <summary>
            {intro.overview.label}
            <span className='express-disclosure-icon' aria-hidden='true' />
          </summary>
          {intro.overview.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </details>
        <details className='express-disclosure'>
          <summary>
            {hidden?.title ?? '胜负规则'}
            <span className='express-disclosure-hint'>查看胜负规则</span>
            <span className='express-disclosure-icon' aria-hidden='true' />
          </summary>
          {hidden ? <p>{hidden.text}</p> : null}
          {scenario.scoring
            ? (
              <>
                <p>{scenario.scoring.summary}</p>
                <dl className='express-score-list'>
                  {scenario.scoring.items.map((item) => (
                    <div key={item.id}>
                      <dt>{item.label}</dt>
                      <dd>
                        {item.points > 0 ? '+' : item.points < 0 ? '−' : ''}
                        {Math.abs(item.points)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {scenario.scoring.notes?.map((note) => (
                  <p className='express-score-note' key={note}>{note}</p>
                ))}
              </>
            )
            : (
              <p>
                完整计分规则请查看场景详情。<Link
                  className='underline underline-offset-4'
                  to={`/scenarios/${scenarioID}`}
                >
                  查看场景完整规则
                </Link>
              </p>
            )}
        </details>
      </div>
    </>
  )
}
