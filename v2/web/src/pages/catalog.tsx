import { Lock, Unlock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { catalog } from '../api/client'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { useAsync } from '../lib/use-async'

export function CatalogPage() {
  const { data, error, loading } = useAsync(() => catalog.scenarios(), [])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-black tracking-tight text-(--foreground)'>
          场景工坊
        </h1>
        <p className='mt-1 text-sm text-(--foreground-subtle)'>
          选择一个场景，为甲乙双方构建你的对话智能体。
        </p>
      </div>

      {loading
        ? <p className='text-sm text-(--foreground-subtle)'>加载中…</p>
        : error
        ? <p className='text-sm text-(--accent)'>{error}</p>
        : (
          <div className='grid gap-4 md:grid-cols-2'>
            {data?.scenarios.map((scenario) => (
              <Link
                key={scenario.id}
                to={`/scenarios/${scenario.id}`}
                data-testid={`scenario-${scenario.id}`}
              >
                <Card className='h-full transition hover:border-(--foreground-muted)'>
                  <CardContent className='space-y-3 pt-5'>
                    <div className='flex items-start justify-between gap-3'>
                      <h2 className='text-lg font-semibold text-(--foreground)'>
                        {scenario.title}
                      </h2>
                      <Badge tone={scenario.gateUnlocked ? 'success' : 'info'}>
                        {scenario.gateUnlocked
                          ? (
                            <>
                              <Unlock className='mr-1 h-3 w-3' /> PvP 已解锁
                            </>
                          )
                          : (
                            <>
                              <Lock className='mr-1 h-3 w-3' /> PvE
                            </>
                          )}
                      </Badge>
                    </div>
                    <p className='text-sm text-(--foreground-subtle)'>
                      {scenario.subject}
                    </p>
                    <div className='space-y-1 text-xs text-(--foreground-muted)'>
                      <p>
                        <span className='text-(--foreground-subtle)'>
                          {scenario.sideAName}
                        </span>
                        {scenario.sideALabel ? ` · ${scenario.sideALabel}` : ''}
                      </p>
                      <p>
                        <span className='text-(--foreground-subtle)'>
                          {scenario.sideBName}
                        </span>
                        {scenario.sideBLabel ? ` · ${scenario.sideBLabel}` : ''}
                      </p>
                      <p>{scenario.turnCount} 轮</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {data && data.scenarios.length === 0
              ? <p className='text-sm text-(--foreground-subtle)'>暂无场景。</p>
              : null}
          </div>
        )}
    </div>
  )
}
