import { Link, useParams } from 'react-router-dom'

import { catalog } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/auth'
import { useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

export function CurrentNpcPage() {
  const { scenarioId = '', presetKey = '' } = useParams()
  const { account } = useAuth()
  const { data, loading, error, reload } = useAsync(
    () =>
      catalog.scenario(scenarioId, 'a', {
        credentials: account ? 'include' : 'omit',
        signal: AbortSignal.timeout(3000),
      }),
    [scenarioId, account?.id],
  )
  const matches = data?.presets.filter((preset) => preset.key === presetKey) ??
    []
  const preset = data?.summary.id === scenarioId && matches.length === 1
    ? matches[0]
    : undefined
  const sideName = preset?.side === 'a'
    ? data?.summary.sideAName
    : preset?.side === 'b'
    ? data?.summary.sideBName
    : undefined

  return (
    <div className='mx-auto w-full max-w-3xl space-y-6' {...tm('EA.npc-page')}>
      <Link
        to={`/scenarios/${encodeURIComponent(scenarioId)}`}
        className='inline-flex min-h-11 items-center text-sm underline underline-offset-4'
      >
        返回场景
      </Link>
      {loading
        ? <p role='status'>正在读取 NPC 预设…</p>
        : error
        ? (
          <div className='space-y-3' {...tm('EA.npc-error')}>
            <p role='alert'>暂时无法读取当前 NPC 预设。</p>
            <Button onClick={reload}>重试</Button>
          </div>
        )
        : !preset || !sideName
        ? (
          <p role='status' {...tm('EA.npc-unavailable')}>
            当前场景已没有这个 NPC 预设。请返回场景查看现有对手。
          </p>
        )
        : (
          <>
            <header className='space-y-3' {...tm('EA.npc-identity')}>
              <Badge>当前 NPC 预设</Badge>
              <h1 className='break-words text-2xl font-bold'>{preset.label}</h1>
              <p className='text-sm text-(--foreground-subtle)'>
                此页展示当前用于 NPC 练习的预设配置。
              </p>
            </header>
            <Card>
              <CardContent className='py-5'>
                <dl
                  className='grid gap-5 sm:grid-cols-3'
                  {...tm('EA.npc-metadata')}
                >
                  <div className='min-w-0'>
                    <dt className='text-sm text-(--foreground-subtle)'>场景</dt>
                    <dd className='mt-1 break-words'>{data!.summary.title}</dd>
                  </div>
                  <div className='min-w-0'>
                    <dt className='text-sm text-(--foreground-subtle)'>执方</dt>
                    <dd className='mt-1 break-words'>
                      {preset.side === 'a' ? '甲方' : '乙方'} · {sideName}
                    </dd>
                  </div>
                  <div className='min-w-0'>
                    <dt className='text-sm text-(--foreground-subtle)'>模型</dt>
                    <dd className='mt-1 break-all'>{preset.modelID}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </>
        )}
    </div>
  )
}
