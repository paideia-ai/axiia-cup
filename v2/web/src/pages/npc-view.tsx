import { useParams, useSearchParams } from 'react-router-dom'

import { npcs } from '../api/client'
import { IdentityVersionCard } from '../components/agent-profile'
import { BackLink } from '../components/back-link'
import { PageLoading } from '../components/page-loading'
import { Button } from '../components/ui/button'
import { positiveID } from '../lib/identity-links'
import { usePageQuery } from '../lib/use-page-query'

export function NPCViewPage() {
  const { scenarioId = '', presetKey = '' } = useParams()
  const [params] = useSearchParams()
  const matchID = positiveID(params.get('match'))
  const profile = usePageQuery({
    queryKey: ['catalog', 'npc', scenarioId, presetKey, matchID],
    queryFn: () => npcs.profile(scenarioId, presetKey, matchID),
    enabled: matchID != null,
  })
  const npc = profile.data
  const history = new URLSearchParams({
    scenario: scenarioId,
    npc: presetKey,
    match: String(matchID),
  })
  return (
    <div className='min-w-0 w-full space-y-6' data-testid='npc-identity'>
      <BackLink
        to={matchID ? `/matches/${matchID}` : '/matches'}
        label={matchID ? '对战' : '历史'}
        className='text-sm text-(--foreground-subtle)'
      />
      {!matchID
        ? <p role='status'>请从对战中打开 NPC 资料。</p>
        : profile.error
        ? (
          <div className='space-y-3'>
            <p role='alert'>暂时无法加载该场对局的 NPC 配置。</p>
            <Button variant='secondary' onClick={profile.reload}>重试</Button>
          </div>
        )
        : !npc
        ? <PageLoading variant='detail' />
        : (
          <>
            <header className='space-y-2'>
              <h1 className='wrap-anywhere text-2xl font-bold text-(--foreground)'>
                {npc.sideName}「{npc.label}」
              </h1>
              <p className='text-sm text-(--foreground-subtle)'>
                {npc.scenarioTitle} · 官方 NPC
              </p>
            </header>
            <IdentityVersionCard
              title='本场对局配置'
              context={`对战 #${matchID}`}
              href={`/matches?${history}`}
              modelID={npc.modelID}
              matchCount={npc.matchCount}
              winCount={npc.winCount}
              lossCount={npc.lossCount}
            />
            <section className='space-y-3' aria-label='NPC 提示词'>
              <h2 className='text-base font-semibold text-(--foreground)'>
                提示词
              </h2>
              <pre className='whitespace-pre-wrap wrap-anywhere font-sans text-sm leading-7 text-(--foreground)'>{npc.prompt || '此 NPC 未配置提示词。'}</pre>
            </section>
          </>
        )}
    </div>
  )
}
