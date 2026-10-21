import { portraitInventory, portraitScenarios } from './agent-portrait-fixtures'
import { demoOpponents, sortieEntries } from '../features/sortie/fixtures'
import { sortieLadderAPI } from './sortie-ladder-api'
import { config } from './v34-fixtures'
import { gamesPlayed } from '../features/sortie/matchmaking'

export async function sortieDemoAPI(request: Request, path: string) {
  const matchResponse = await sortieLadderAPI.handle(request, path)
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
  if (path === '/models') return json({ models: config.models })
  if (/^\/rewards\/matches\/\d+$/.test(path)) {
    return json({
      matchID: Number(path.split('/').at(-1)),
      points: 0,
      status: 'ineligible',
    })
  }
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
  const rivalPath = /^\/agents\/(\d+)\/(draft|public)$/.exec(path)
  const rival = rivalPath &&
    demoOpponents.find((e) => e.agentID === Number(rivalPath[1]))
  if (rival && rivalPath) {
    if (rivalPath[2] === 'draft') {
      return json({ error: 'forbidden' }, { status: 403 })
    }
    const scene = portraitScenarios.find((s) =>
      s.summary.id === rival.scenarioID
    )!.summary
    const base = sortieEntries.find((e) =>
      e.scenarioID === rival.scenarioID && e.side === rival.side
    )!
    const role = { key: base.roleKey, name: base.roleName, side: rival.side }
    const ladderRecord = sortieLadderAPI.record(rival)
    return json({
      agentID: rival.agentID,
      scenarioID: rival.scenarioID,
      scenarioTitle: scene.title,
      side: rival.side,
      sideName: rival.side === 'a' ? scene.sideAName : scene.sideBName,
      ownerName: rival.name,
      role,
      ladderRecord,
      versions: [{
        id: rival.versionID,
        ordinal: 1,
        isEntry: true,
        createdAt: 1700000000,
        role,
        matchCount: gamesPlayed(ladderRecord) + 10,
        winCount: ladderRecord.wins + 10,
        lossCount: ladderRecord.losses,
        drawCount: ladderRecord.draws,
      }],
    })
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
        const base = sortieEntries.find((e) => e.agentID === agent.agentID)
        const entry = base ? sortieLadderAPI.record(base) : undefined
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
