import type { MatchDetail, MatchSummary } from '../api/types'
import { portraitScenarios } from './agent-portrait-fixtures'
import { sortieDemoAPI } from './sortie-demo-api'
import { finishedMatch } from './v34-fixtures'

export type BattlePreviewCase =
  | 'default'
  | 'many'
  | 'empty'
  | 'foreign'
  | 'old-server'
  | 'expired'
  | 'error'
  | 'guest'
  | 'admin'

export function battlePreviewRows(
  variant: BattlePreviewCase = 'default',
): MatchSummary[] {
  const now = Math.floor(Date.now() / 1000)
  const active: MatchSummary[] = Array.from(
    { length: variant === 'many' ? 24 : 3 },
    (_, index) => {
      const scene = portraitScenarios[index % portraitScenarios.length].summary
      return {
        ...finishedMatch.summary,
        id: 9400 - index,
        scenarioID: scene.id,
        scenarioTitle: scene.title,
        initiatorIsMe: true,
        createdAt: now - 120,
        finishedAt: null,
        finished: false,
        scored: false,
        winner: null,
      }
    },
  )
  const done: MatchSummary = {
    ...finishedMatch.summary,
    id: 9300,
    scenarioTitle: '商鞅变法·朝堂辩法',
    initiatorIsMe: true,
    createdAt: now - 300,
    finishedAt: now - 60,
  }
  if (variant === 'empty') return []
  if (variant === 'foreign') {
    return [
      { ...active[0], initiatorIsMe: false },
      { ...active[1], initiatorIsMe: undefined },
    ]
  }
  if (variant === 'old-server') {
    return [
      { ...active[0], createdAt: undefined },
      { ...done, finishedAt: undefined },
    ]
  }
  if (variant === 'expired') return [{ ...done, finishedAt: now - 901 }]
  return [
    ...active,
    done,
    { ...active[0], id: 9500, initiatorIsMe: false },
    { ...done, id: 9501, finishedAt: now - 901 },
  ]
}

// Read-only fixtures for the local built-app preview and responsive browser
// checks. Nothing in the shipped application imports this module.
export async function battleStripPreviewAPI(
  request: Request,
  path: string,
  variant: BattlePreviewCase = 'default',
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'read_only_preview' }, { status: 405 })
  }
  if (path === '/auth/me' && variant === 'guest') {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (path === '/auth/me' && variant === 'admin') {
    return Response.json({
      account: {
        id: 'preview-admin',
        displayName: '预览管理员',
        isAdmin: true,
      },
      elevated: true,
      firstBattleDone: false,
    })
  }
  if (path === '/matches') {
    return variant === 'error'
      ? Response.json({ error: 'preview_unavailable' }, { status: 503 })
      : Response.json({ matches: battlePreviewRows(variant) })
  }
  const detailID = /^\/matches\/(\d+)$/.exec(path)?.[1]
  if (detailID) {
    const summary = battlePreviewRows(variant).find((row) =>
      row.id === Number(detailID)
    )
    if (summary) {
      const detail: MatchDetail = {
        ...finishedMatch,
        summary,
        turns: summary.finished
          ? finishedMatch.turns
          : finishedMatch.turns.slice(0, 2),
        verdicts: summary.finished ? finishedMatch.verdicts : [],
        reasoning: summary.finished ? finishedMatch.reasoning : null,
      }
      return Response.json(detail)
    }
  }
  if (/^\/matches\/\d+\/stream$/.test(path)) {
    return new Response(': local preview\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
  if (path === '/agents/1000/versions') {
    return Response.json({
      entryVersionID: 10000,
      versions: Array.from({ length: 8 }, (_, index) => ({
        id: 10000 + index,
        agentID: 1000,
        ordinal: index + 1,
        snapshotSeq: index,
        prompt: '本地预览策略：先回应顾虑，再提出可执行的建议。',
        modelID: 'fixture-model',
        isEntry: index === 0,
      })),
    })
  }
  return await sortieDemoAPI(request, path)
}
