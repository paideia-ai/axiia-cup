import { tm } from '../testmode/mark'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { IdentityVersionCard } from '../components/agent-profile'
import { BackLink } from '../components/back-link'
import { PageLoading } from '../components/page-loading'
import { Button } from '../components/ui/button'
import { positiveID } from '../lib/identity-links'
import { agentQuery } from '../lib/navigation-queries'
import { usePageQuery } from '../lib/use-page-query'

export function AgentIdentityPage() {
  const { agentId = '' } = useParams()
  const [params] = useSearchParams()
  const id = positiveID(agentId)
  const versionID = positiveID(params.get('version'))
  const matchID = positiveID(params.get('match'))
  const tournamentID = positiveID(params.get('tournament'))
  const profile = usePageQuery({ ...agentQuery(id ?? 0), enabled: id != null })
  const view = profile.data?.requestedAgentID === id ? profile.data : null
  if (view?.kind === 'owner') {
    return (
      <Navigate
        replace
        to={`/agents/${id}${versionID ? `?version=${versionID}` : ''}`}
      />
    )
  }
  const agent = view?.kind === 'public' ? view.publicView : null
  const versions = [...agent?.versions ?? []].sort((a, b) =>
    Number(b.id === versionID) - Number(a.id === versionID) || b.id - a.id
  )
  return (
    <div
      className='mx-auto max-w-3xl space-y-6'
      data-testid='agent-identity'
      {...tm('EA.public-view')}
    >
      <BackLink
        {...tm('EA.public-back-link')}
        to={matchID
          ? `/matches/${matchID}`
          : tournamentID
          ? `/tournaments/${tournamentID}`
          : '/matches'}
        label={matchID ? '对战' : tournamentID ? '赛事排名' : '历史'}
        className='text-sm text-(--foreground-subtle)'
      />
      {profile.error || !id
        ? (
          <div className='space-y-3'>
            <p role='alert'>暂时无法加载这个智能体。</p>
            <Button onClick={profile.reload}>重试</Button>
          </div>
        )
        : !agent
        ? <PageLoading variant='detail' />
        : (
          <>
            <header className='space-y-2'>
              <h1
                {...tm('EA.public-title')}
                className='wrap-anywhere text-2xl font-bold text-(--foreground)'
              >
                {agent.name
                  ? `${agent.sideName}「${agent.name}」`
                  : `${agent.sideName} #${agent.agentID}`}
              </h1>
              <p
                {...tm('EA.public-owner-line')}
                className='text-sm text-(--foreground-subtle)'
              >
                {agent.ownerName} · {agent.scenarioTitle}
              </p>
              <p
                {...tm('EA.public-owner-only-hint')}
                className='text-xs text-(--foreground-muted)'
              >
                提示词仅主人可见。
              </p>
            </header>
            {versionID && !versions.some((v) => v.id === versionID) && (
              <p role='status' className='text-sm text-(--foreground-subtle)'>
                版本 #{versionID} 暂不可用。
              </p>
            )}
            <section aria-label='逐版本战绩' {...tm('EA.public-record-card')}>
              <div className='space-y-3' {...tm('EA.public-version-list')}>
                {versions.length === 0 && (
                  <p
                    {...tm('EA.public-record-empty')}
                    className='text-sm text-(--foreground-subtle)'
                  >
                    尚未保存版本。
                  </p>
                )}
                {versions.map((version) => (
                  <IdentityVersionCard
                    key={version.id}
                    title={`v${version.ordinal} · #${version.id}`}
                    href={`/matches?agent=${agent.agentID}&version=${version.id}`}
                    modelID={version.modelID}
                    matchCount={version.matchCount}
                    winCount={version.winCount}
                    lossCount={version.lossCount}
                    context={version.id === versionID
                      ? (matchID
                        ? '本场对局版本'
                        : tournamentID
                        ? '赛事提交版本'
                        : '所选版本')
                      : undefined}
                  />
                ))}
              </div>
            </section>
          </>
        )}
    </div>
  )
}
