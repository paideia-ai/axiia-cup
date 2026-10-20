import { portraitInventory, portraitScenarios } from './agent-portrait-fixtures'
import { sortieEntries } from '../features/sortie/fixtures'
import { sortieMatchAPI } from './sortie-demo-matches'
import { config } from './v34-fixtures'

export async function sortieDemoAPI(request: Request, path: string) {
  const matchResponse = await sortieMatchAPI(request, path)
  if (matchResponse) return matchResponse
  const json = Response.json
  if (request.method !== 'GET') {
    return json({
      error: 'preview_only',
      message: '本地演示不保存账户更改或发起真实对战。',
    }, { status: 409 })
  }
  if (path === '/auth/me') {
    return json({
      account: {
        id: 'sortie-demo',
        email: 'preview@example.invalid',
        displayName: '本地演示',
        isAdmin: false,
        hasTOTP: false,
      },
      elevated: false,
      firstBattleDone: true,
    })
  }
  if (path === '/scenarios') {
    return json({ scenarios: portraitScenarios.map((s) => s.summary) })
  }
  if (path === '/my/agents') return json(portraitInventory)
  if (path === '/achievements') {
    return json({ achievements: [], eventCursor: 0 })
  }
  if (path === '/achievements/events') return json({ events: [], cursor: 0 })
  if (path === '/config') return json(config)
  if (path === '/models') return json({ models: config.models })
  if (/^\/rewards\/matches\/\d+$/.test(path)) {
    return json({
      matchID: Number(path.split('/').at(-1)),
      points: 0,
      status: 'ineligible',
    })
  }
  if (path === '/matches') return json({ matches: [], open: true })
  if (path === '/tournaments') return json({ tournaments: [] })
  if (path === '/notifications') {
    return json({ notifications: [], unreadCount: 0 })
  }
  if (path === '/account/preset-usage') return json({ usages: [] })
  if (path === '/my/archived-agents') return json({ agents: [] })
  if (path === '/rewards/quote') {
    return json({
      cost: 100,
      perBattleCost: 100,
      repeatRoleSurcharge: false,
      battleCosts: [100],
    })
  }
  if (path === '/rewards') {
    return json({
      balance: 24200,
      dailyAllowance: 1000,
      battleCost: 100,
      dailyRuns: 10,
      pveWinRefundPercent: 50,
      pvpWinRefundPercent: 80,
      pointsPerYuan: 100,
      nextGrantAt: 0,
      claimableRewards: [],
    })
  }
  if (path === '/notifications/bell' || /^\/agents\/\d+\/stream$/.test(path)) {
    return new Response('retry: 60000\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
  const scene = portraitScenarios.find((s) =>
    path === `/scenarios/${s.summary.id}`
  )
  if (scene) {
    // Local NPC choices for the practice-link demo; no real battle is dispatched.
    return json({
      ...scene,
      presets: (['a', 'b'] as const).map((side) => ({
        key: `sortie-demo-${side}`,
        side,
        label: `${
          side === 'a' ? scene.summary.sideAName : scene.summary.sideBName
        } · 演示对手`,
        modelID: config.models[0].id,
      })),
    })
  }
  if (/^\/scenarios\/[^/]+\/opponents$/.test(path)) {
    return json({ opponents: [] })
  }
  const match = /^\/agents\/(\d+)\/(draft|versions)$/.exec(path)
  if (match) {
    for (const scene of portraitInventory.scenarios) {
      for (const side of ['a', 'b'] as const) {
        const agent = scene.sides[side].find((a) =>
          a.agentID === Number(match[1])
        )
        if (!agent) continue
        if (match[2] === 'draft') {
          return json({
            fields: {},
            scenarioID: scene.scenarioID,
            side,
            role: agent.role,
          })
        }
        const entry = sortieEntries.find((e) => e.agentID === agent.agentID)
        return json({
          entryVersionID: agent.entryVersionID,
          versions: Array.from({ length: agent.versionCount }, (_, i) => ({
            id: agent.agentID * 10 + i,
            agentID: agent.agentID,
            ordinal: i + 1,
            snapshotSeq: i,
            prompt:
              '先回应对方的顾虑，再提出一项可以执行的建议。这是本地预览策略。',
            modelID: config.models[0].id,
            isEntry: agent.entryVersionID === agent.agentID * 10 + i,
            role: agent.role,
            options: agent.role
              ? JSON.stringify({ role: agent.role.key })
              : null,
            winCount: entry?.wins ?? 0,
            lossCount: entry?.losses ?? 0,
            drawCount: entry?.draws ?? 0,
            matchCount: entry ? entry.wins + entry.losses + entry.draws : 0,
          })),
        })
      }
    }
  }
  return json({
    error: 'preview_unavailable',
    message: '这项数据未包含在本地出战演示中。',
  }, { status: 404 })
}
