import type { ScenarioSummary } from '@axiia/shared'
import { ArrowRight, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { getAppMeta } from '../lib/api'

function ScenarioEntry({ scenario }: { scenario: ScenarioSummary }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{scenario.subject}</Badge>
          <Badge tone="info">{scenario.turnCount} 回合</Badge>
        </div>
        <div>
          <CardTitle>{scenario.title}</CardTitle>
          <p className="mt-2 text-sm leading-6 text-(--foreground-subtle)">
            {scenario.roleAName} vs {scenario.roleBName}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Link to={`/scenarios/${scenario.id}`}>
          <Button>
            进入工坊
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
        <Link to={`/leaderboard?scenario=${encodeURIComponent(scenario.id)}`}>
          <Button variant="secondary">
            <Trophy className="mr-1.5 h-4 w-4" />
            看排行榜
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export function ScenariosPage() {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const meta = await getAppMeta()
        setScenarios(meta.scenarios)
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : '加载场景失败',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">场景工坊</p>
        <h1 className="page-title">选择场景</h1>
        <p className="page-subtitle">
          进入一个场景，编写并测试你的策略提示词。
        </p>
      </div>

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {['scenario-skeleton-1', 'scenario-skeleton-2'].map((key) => (
            <div
              key={key}
              className="h-52 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ) : scenarios.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {scenarios.map((scenario) => (
            <ScenarioEntry key={scenario.id} scenario={scenario} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-(--border-soft) bg-white/3 px-4 py-5 text-sm text-(--foreground-subtle)">
          当前没有可用场景。
        </p>
      )}
    </div>
  )
}
