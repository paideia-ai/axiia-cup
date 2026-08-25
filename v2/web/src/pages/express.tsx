import { Clock } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { builder, catalog, config as configApi } from '../api/client'
import type { Side } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/auth'
import { messageOf, useAsync } from '../lib/use-async'
import { scenarioModule } from '../scenarios'

// A3 首战快速通道落点（#8–#12，mock S4 的简化版 DA）：注册成功直接落进
// 这里——比正常 DA 更省略（#11）：只有我方角色卡 + 钩子 + 一句规则 +
// 「去构建」。执方与对手由新手预设决定（#10/#57，GET /v1/config 的
// expressPreset 三元组＝对手 NPC 的场景/侧/预设 key；缺席回落 商鞅场景、
// 我执 a、对手取第一个 b 侧预设——回落的对手选择在构建器派发时兜底）。
// 已完成首战（firstBattleDone）→ 本页直接让路去场景列表。
export function ExpressPage() {
  const navigate = useNavigate()
  const { firstBattleDone } = useAuth()
  const [entering, setEntering] = useState(false)
  const [enterError, setEnterError] = useState<string | null>(null)

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

  const goBuild = async () => {
    if (!data) return
    setEntering(true)
    setEnterError(null)
    try {
      // 首战＝创建一个单侧 agent（#57）：懒 ensure 后带 express 标记进构建器。
      const { agentID } = await builder.ensure({
        scenarioID: data.scenarioID,
        side: data.mySide,
      })
      navigate(
        `/agents/${agentID}/build?scenario=${data.scenarioID}&side=${data.mySide}&express=1`,
      )
    } catch (cause) {
      setEnterError(messageOf(cause, '创建智能体失败'))
      setEntering(false)
    }
  }

  if (loading) {
    return <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
  }
  if (error || !data) {
    return (
      <div className='rounded-xl border border-(--border-soft) bg-white/2 px-6 py-8 text-center text-sm'>
        <p className='font-semibold text-(--foreground)'>
          {error ?? '首战场景暂不可用'}
        </p>
        <p className='mt-2 text-(--foreground-subtle)'>
          可以先从场景列表任选一个开始。
        </p>
        <div className='mt-5 flex justify-center'>
          <Link to='/scenarios'>
            <Button variant='secondary'>浏览全部场景</Button>
          </Link>
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
    <div className='mx-auto max-w-2xl space-y-6'>
      <div className='space-y-2'>
        <Badge tone='accent'>首战快速通道</Badge>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          {module?.intro?.source.title ?? scenario.summary.title}
        </h1>
        <p className='text-sm leading-relaxed text-(--foreground-subtle)'>
          {education?.hook ?? scenario.summary.subject}
        </p>
      </div>

      {/* 我方角色卡（S4：简化版只保留己方这一张） */}
      <Card>
        <CardContent className='space-y-2 pt-5'>
          <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
            你的角色
          </p>
          <p className='text-lg font-bold text-(--foreground)'>
            {mySideName}
            <span className='ml-2 text-sm font-medium text-(--foreground-subtle)'>
              {mySideLabel}
            </span>
          </p>
          {education
            ? (
              <p className='text-sm leading-relaxed text-(--foreground-subtle)'>
                {education.winConditions[mySide]}
              </p>
            )
            : null}
          {/* 一句规则：首战不展开四层教育，一行讲完怎么赢。 */}
          <p className='flex items-center gap-1.5 text-xs text-(--foreground-muted)'>
            <Clock className='h-3.5 w-3.5' />
            {education?.formatLabel ??
              `${scenario.summary.turnCount} 轮`}后由裁判当场判定胜负——写好策略提示词，AI
            替你上场。
          </p>
        </CardContent>
      </Card>

      {enterError
        ? <p className='text-sm text-(--accent)'>{enterError}</p>
        : null}

      <div className='flex flex-wrap items-center gap-4'>
        <Button
          data-testid='express-build'
          onClick={() => void goBuild()}
          disabled={entering}
        >
          {entering ? '进入中…' : '去构建 →'}
        </Button>
        <Link
          to='/scenarios'
          className='text-xs text-(--foreground-muted) transition hover:text-(--foreground)'
        >
          先逛逛全部场景
        </Link>
      </div>
    </div>
  )
}
