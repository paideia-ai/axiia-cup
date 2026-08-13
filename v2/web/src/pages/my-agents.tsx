import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { builder, catalog } from '../api/client'
import type { Side } from '../api/types'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { messageOf, useAsync } from '../lib/use-async'

// 我的智能体（#73/#64）：按场景分组的一级入口页。P1 为骨架——每侧的智能体
// 经 /agents/ensure 懒创建（get-or-create，只在点击时调用，绝不在渲染期）；
// 完成度/参赛资格的数据化依赖 P2 的 GET /v1/my/agents，这里按 #54 用引导式
// 空态占位，不摆假数字。
export function MyAgentsPage() {
  const navigate = useNavigate()
  const { data, error, loading } = useAsync(() => catalog.scenarios(), [])
  const [pending, setPending] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const enter = async (
    scenarioID: string,
    side: Side,
    target: 'view' | 'build',
  ) => {
    const key = `${scenarioID}:${side}:${target}`
    setPending(key)
    setActionError(null)
    try {
      const { agentID } = await builder.ensure({ scenarioID, side })
      navigate(
        target === 'view' ? `/agents/${agentID}` : `/agents/${agentID}/build`,
      )
    } catch (cause) {
      setActionError(messageOf(cause, '进入智能体失败'))
      setPending(null)
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          我的智能体
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          按场景分组；每个智能体执一侧，参赛需两侧各标一个参赛版本。
        </p>
      </div>

      {actionError
        ? <p className='text-sm text-(--accent)'>{actionError}</p>
        : null}

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : (
          <div className='space-y-4'>
            {data?.scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardContent className='space-y-3 pt-5'>
                  <div className='flex flex-wrap items-baseline gap-2'>
                    <Link
                      to={`/scenarios/${scenario.id}`}
                      className='text-base font-semibold text-(--foreground) hover:underline'
                    >
                      {scenario.title}
                    </Link>
                    <span className='text-xs text-(--foreground-muted)'>
                      {scenario.subject}
                    </span>
                  </div>

                  {([
                    ['a', scenario.sideAName, scenario.sideALabel],
                    ['b', scenario.sideBName, scenario.sideBLabel],
                  ] as const).map(([side, name, label]) => (
                    <div
                      key={side}
                      className='flex flex-wrap items-center gap-3 rounded-md border border-(--border-soft) bg-white/2 px-3 py-2.5'
                    >
                      <div className='min-w-0 flex-1'>
                        <p className='text-sm font-semibold text-(--foreground)'>
                          <span className='mr-1.5 text-[11px] font-semibold tracking-[0.1em] text-(--foreground-muted)'>
                            {side === 'a' ? '甲方' : '乙方'}
                          </span>
                          {name}
                        </p>
                        {label
                          ? (
                            <p className='truncate text-xs text-(--foreground-muted)'>
                              {label}
                            </p>
                          )
                          : null}
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <Button
                          size='sm'
                          variant='secondary'
                          disabled={pending != null}
                          onClick={() => void enter(scenario.id, side, 'view')}
                        >
                          {pending === `${scenario.id}:${side}:view`
                            ? '打开中…'
                            : '查看智能体'}
                        </Button>
                        <Button
                          size='sm'
                          disabled={pending != null}
                          onClick={() => void enter(scenario.id, side, 'build')}
                        >
                          {pending === `${scenario.id}:${side}:build`
                            ? '打开中…'
                            : '进入构建'}
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* #54 引导式空态：数据化槽位不摆假数字，只给轮廓提示 */}
                  <p className='rounded-md border border-dashed border-(--border-soft) px-3 py-2 text-xs text-(--foreground-muted)'>
                    完成度与参赛资格徽章将在数据接入后点亮
                  </p>
                </CardContent>
              </Card>
            ))}
            {data && data.scenarios.length === 0
              ? <p className='text-sm text-(--foreground-subtle)'>暂无场景。</p>
              : null}
          </div>
        )}
    </div>
  )
}
