import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { builder, catalog } from '../api/client'
import type { Side } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { messageOf, useAsync } from '../lib/use-async'

export function ScenarioDetailPage() {
  const { scenarioId = '' } = useParams()
  const navigate = useNavigate()
  const [side, setSide] = useState<Side>('a')
  const [building, setBuilding] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)

  const { data, error, loading } = useAsync(
    () => catalog.scenario(scenarioId, side),
    [scenarioId, side],
  )

  const build = async () => {
    setBuilding(true)
    setBuildError(null)
    try {
      const { agentID } = await builder.ensure({
        scenarioID: scenarioId,
        side,
      })
      navigate(`/agents/${agentID}?scenario=${scenarioId}&side=${side}`)
    } catch (cause) {
      setBuildError(messageOf(cause, '创建智能体失败'))
      setBuilding(false)
    }
  }

  return (
    <div className='space-y-6'>
      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : data
        ? (
          <>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
                  {data.summary.title}
                </h1>
                <p className='mt-1 max-w-2xl text-sm text-(--foreground-subtle)'>
                  {data.summary.subject}
                </p>
                <p className='mt-3 text-xs text-(--foreground-muted)'>
                  {data.summary.sideAName} 对 {data.summary.sideBName} ·{' '}
                  {data.summary.turnCount} 轮
                </p>
              </div>
              <Badge tone={data.summary.gateUnlocked ? 'success' : 'info'}>
                {data.summary.gateUnlocked ? 'PvP 已解锁' : 'PvE 阶段'}
              </Badge>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              {([
                ['a', data.summary.sideAName, data.summary.sideALabel],
                ['b', data.summary.sideBName, data.summary.sideBLabel],
              ] as const).map(([key, name, label]) => (
                <Card key={key}>
                  <CardContent className='space-y-1 pt-5'>
                    <p className='text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                      {key === 'a' ? '甲方' : '乙方'}
                    </p>
                    <p className='text-base font-semibold text-(--foreground)'>
                      {name}
                    </p>
                    <p className='text-sm text-(--foreground-subtle)'>
                      {label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className='space-y-4 pt-5'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-(--foreground-subtle)'>
                    为哪一方构建：
                  </span>
                  {(['a', 'b'] as const).map((option) => (
                    <Button
                      key={option}
                      size='sm'
                      variant={side === option ? 'primary' : 'secondary'}
                      onClick={() => setSide(option)}
                    >
                      {option === 'a'
                        ? `甲 · ${data.summary.sideAName}`
                        : `乙 · ${data.summary.sideBName}`}
                    </Button>
                  ))}
                </div>

                <div className='flex items-center gap-3'>
                  <Button
                    data-testid='build-agent'
                    onClick={() => void build()}
                    disabled={building}
                  >
                    {building ? '创建中…' : '构建智能体'}
                  </Button>
                  {buildError
                    ? (
                      <span className='text-sm text-(--accent)'>
                        {buildError}
                      </span>
                    )
                    : null}
                </div>
              </CardContent>
            </Card>

            {data.stages.length > 0
              ? (
                <div className='space-y-2'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    对局流程
                  </h2>
                  <ol className='space-y-1.5'>
                    {data.stages.map((stage, index) => (
                      <li
                        key={stage.id}
                        className='rounded-md border border-(--border-soft) bg-white/2 px-3 py-2 text-sm text-(--foreground-subtle)'
                      >
                        <span className='mr-2 font-mono text-xs text-(--foreground-muted)'>
                          {index + 1}
                        </span>
                        {stage.title}
                        {stage.channels.length > 1
                          ? (
                            <span className='ml-2 text-xs text-(--foreground-muted)'>
                              {stage.channels.map((c) => c.label).join(' / ')}
                            </span>
                          )
                          : null}
                      </li>
                    ))}
                  </ol>
                </div>
              )
              : null}

            {data.presets.length > 0
              ? (
                <div className='space-y-2'>
                  <h2 className='text-sm font-semibold text-(--foreground)'>
                    预设对手
                  </h2>
                  <div className='flex flex-wrap gap-2'>
                    {data.presets.map((preset) => (
                      <Badge key={preset.key} tone='info'>
                        {preset.label} · {preset.side === 'a'
                          ? data.summary.sideAName
                          : data.summary.sideBName} · {preset.modelID}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
              : null}
          </>
        )
        : null}
    </div>
  )
}
