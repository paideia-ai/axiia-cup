import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { builder } from '../api/client'
import { Button } from '../components/ui/button'
import { messageOf } from '../lib/use-async'

export function ScenarioBuildEntry() {
  const { scenarioId = '' } = useParams()
  const [search] = useSearchParams()
  const side = search.get('side')
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const request = useRef<
    {
      key: string
      result: ReturnType<typeof builder.ensure>
    } | null
  >(null)
  const validSide = side === 'a' || side === 'b'

  useEffect(() => {
    if (!validSide) return
    let live = true
    setError(null)
    const key = JSON.stringify([scenarioId, side, retry])
    if (request.current?.key !== key) {
      request.current = {
        key,
        result: builder.ensure({ scenarioID: scenarioId, side }),
      }
    }
    void request.current.result.then(
      ({ agentID }) => {
        if (live) {
          const query = new URLSearchParams({ scenario: scenarioId, side })
          navigate(`/agents/${agentID}/build?${query.toString()}`, {
            replace: true,
          })
        }
      },
    ).catch((cause) => {
      if (live) setError(messageOf(cause, '创建智能体失败'))
    })
    return () => {
      live = false
    }
  }, [scenarioId, side, validSide, navigate, retry])

  return (
    <section className='space-y-3'>
      <h1 className='text-xl font-bold'>打开构建器</h1>
      {!validSide ? <p role='alert'>请先选择要构建的阵营。</p> : error
        ? (
          <>
            <p role='alert'>{error}</p>
            <Button onClick={() => setRetry((n) => n + 1)}>重试</Button>
          </>
        )
        : <p role='status'>正在准备你的智能体…</p>}
      <Link
        to={`/scenarios/${encodeURIComponent(scenarioId)}`}
        className='text-(--accent)'
      >
        返回场景介绍
      </Link>
    </section>
  )
}
