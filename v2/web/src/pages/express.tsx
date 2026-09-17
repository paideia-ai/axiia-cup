import { PageLoading } from '../components/page-loading'
import { Clock } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { catalog, config as configApi } from '../api/client'
import type { Side } from '../api/types'
import { Badge } from '../components/ui/badge'
import { ButtonLink } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/auth'
import { useAsync } from '../lib/use-async'
import { agentEntryUrl } from '../lib/agent-entry'
import { scenarioModule } from '../scenarios'
import { tm } from '../testmode/mark'

// A3 首战快速通道落点（#8–#12，mock S4 的简化版 DA）：注册成功直接落进
// 这里——比正常 DA 更省略（#11）：只有我方角色卡 + 钩子 + 一句规则 +
// 「去构建」。执方与对手由新手预设决定（#10/#57，GET /v1/config 的
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
  const education = module?.education ?? null
  const mySideName = mySide === 'a'
    ? scenario.summary.sideAName
    : scenario.summary.sideBName
  const mySideLabel = mySide === 'a'
    ? scenario.summary.sideALabel
    : scenario.summary.sideBLabel

  return (
    <div className='mx-auto max-w-2xl space-y-6' {...tm('X.page')}>
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
          {education?.hook ?? scenario.summary.subject}
        </p>
      </div>

      {/* 我方角色卡（S4：简化版只保留己方这一张） */}
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

      <div className='flex flex-wrap items-center gap-4' {...tm('X.actions')}>
        <ButtonLink
          data-testid='express-build'
          to={agentEntryUrl(data.scenarioID, mySide, 'build', true)}
          {...tm('X.build-button')}
        >
          去构建 →
        </ButtonLink>
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
