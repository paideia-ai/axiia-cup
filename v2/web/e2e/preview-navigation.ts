import { extname, resolve, sep } from 'node:path'
import {
  config,
  finishedMatch,
  inventory,
  notificationsFixture,
  scenario,
  scenarioList,
  versions,
} from '../src/testing/v34-fixtures.ts'

import {
  agentPreviewInventory,
  agentPreviewScenarios,
  previewAgent,
} from '../src/testing/scenario-agent-fixtures.ts'

const agentCreation = Deno.args.includes('--agent-creation')
const scenarioAgents = agentCreation || Deno.args.includes('--scenario-agents')
const root = resolve('build/client')
const html = (await Deno.readTextFile(`${root}/index.html`)).replace(
  '</body>',
  '<aside role="note" style="position:fixed;bottom:12px;left:12px;z-index:9999;padding:8px 12px;border:1px solid #e04a2f;border-radius:8px;background:#171717;color:#fff;font:12px sans-serif;pointer-events:none">交互预览 · 模拟数据 · 无需登录 · 不影响真实账号</aside></body>',
)
const mine = structuredClone(inventory)
mine.scenarios[0].sides.b = []

const sessions = new Map<string, typeof agentPreviewInventory>()
let nextAgentID = 2000

async function api(request: Request, path: string): Promise<Response> {
  if (agentCreation) {
    const cookie = /preview-session=([a-z0-9-]+)/.exec(
      request.headers.get('cookie') ?? '',
    )?.[1]
    const sessionID = cookie ?? crypto.randomUUID()
    if (!sessions.has(sessionID)) {
      sessions.set(sessionID, structuredClone(agentPreviewInventory))
    }
    const data = sessions.get(sessionID)!
    const respond = (body: unknown, status = 200) =>
      Response.json(body, {
        status,
        headers: {
          'Set-Cookie':
            `preview-session=${sessionID}; Path=/; HttpOnly; SameSite=Lax`,
        },
      })
    if (path === '/my/agents') return respond(data)
    if (path === '/agents' && request.method === 'POST') {
      const { scenarioID, side } = await request.json()
      const scenario = data.scenarios.find((item) =>
        item.scenarioID === scenarioID
      )
      if (!scenario || (side !== 'a' && side !== 'b')) {
        return respond({ error: 'invalid' }, 400)
      }
      const agentID = nextAgentID++
      scenario.sides[side].push({
        agentID,
        name: null,
        versionCount: 0,
        entryVersionID: null,
      })
      return respond({ agentID })
    }
    const match = /^\/agents\/(\d+)(?:\/(draft|versions))?$/.exec(path)
    if (match) {
      for (const scenario of data.scenarios) {
        for (const side of ['a', 'b'] as const) {
          const agent = scenario.sides[side].find((item) =>
            item.agentID === Number(match[1])
          )
          if (!agent) continue
          if (request.method === 'PATCH') {
            agent.name = (await request.json()).name
            return respond({ ok: true })
          }
          if (match[2] === 'draft') {
            return respond({
              fields: {},
              scenarioID: scenario.scenarioID,
              side,
            })
          }
          if (match[2] === 'versions') {
            return respond({
              versions: previewAgent(agent.agentID)?.versions ?? [],
              entryVersionID: agent.entryVersionID,
            })
          }
        }
      }
    }
  }
  const json = Response.json
  if (request.method === 'POST' && path === '/agents/ensure') {
    const { side } = await request.json()
    return json({ agentID: side === 'b' ? 102 : 101 })
  }
  if (request.method !== 'GET') {
    return json({
      error: 'preview_only',
      message: '这里只预览页面跳转，不保存更改或发起对战。',
    }, { status: 409 })
  }
  if (scenarioAgents) {
    if (path === '/my/agents') return json(agentPreviewInventory)
    if (path === '/scenarios') {
      return json({
        scenarios: agentPreviewScenarios.map((item) => item.summary),
      })
    }
    const detail = agentPreviewScenarios.find((item) =>
      path === `/scenarios/${item.summary.id}`
    )
    if (detail) return json(detail)
    const match = /^\/agents\/(\d+)\/(draft|versions)$/.exec(path)
    const agent = match ? previewAgent(Number(match[1])) : null
    if (agent && match) {
      return json(
        match[2] === 'draft'
          ? { fields: {}, scenarioID: agent.scenarioID, side: agent.side }
          : {
            versions: agent.versions,
            entryVersionID: agent.agent.entryVersionID,
          },
      )
    }
  }
  switch (path) {
    case '/auth/me':
      return json({
        account: {
          id: 'navigation-preview',
          displayName: '预览用户',
          email: 'preview@example.test',
          isAdmin: false,
          hasTOTP: false,
        },
        elevated: false,
        firstBattleDone: false,
      })
    case '/landing':
      return json({ demoMatches: [], topPlayers: [], totalMatches: 1 })
    case '/config':
      return json(config)
    case '/rewards':
      return json({
        balance: 1000,
        dailyAllowance: 1000,
        battleCost: 100,
        dailyRuns: 10,
        pveWinRefundPercent: 50,
        pvpWinRefundPercent: 80,
        pointsPerYuan: 100,
        nextGrantAt: 0,
        claimableRewards: [{ matchID: 9001, points: 50, kind: 'pve' }],
      })
    case '/rewards/quote':
      return json({
        cost: 100,
        perBattleCost: 100,
        repeatRoleSurcharge: false,
        battleCosts: [100],
      })
    case '/rewards/matches/9001':
      return json({
        matchID: 9001,
        points: 50,
        status: 'claimable',
        kind: 'pve',
      })
    case '/models':
      return json({ models: config.models })
    case '/scenarios':
      return json(scenarioList)
    case `/scenarios/${scenario.summary.id}`:
      return json(scenario)
    case `/scenarios/${scenario.summary.id}/opponents`:
      return json({ opponents: [] })
    case '/my/agents':
      return json(mine)
    case '/matches':
      return json({ matches: [finishedMatch.summary] })
    case '/matches/9001':
      return json(finishedMatch)
    case '/notifications':
      return json(notificationsFixture)
    case '/tournaments':
      return json({ tournaments: [{ id: 1, phase: 'qualifier', round: 1 }] })
    case '/tournaments/1/standings':
      return json({ entries: [] })
  }
  const agent = /^\/agents\/(101|102)\/(draft|versions|stream)$/.exec(path)
  if (agent?.[2] === 'draft') {
    return json({
      fields: {},
      scenarioID: scenario.summary.id,
      side: agent[1] === '102' ? 'b' : 'a',
    })
  }
  if (agent?.[2] === 'versions') {
    return json(
      agent[1] === '101'
        ? { versions, entryVersionID: 1002 }
        : { versions: [], entryVersionID: null },
    )
  }
  if (path === '/notifications/bell' || agent?.[2] === 'stream') {
    const body = path === '/notifications/bell'
      ? 'retry: 60000\ndata: {"unreadCount":1}\n\n'
      : 'retry: 60000\n\n'
    return new Response(body, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }
  return json({
    error: 'preview_unavailable',
    message: '此预览未提供这项数据。',
  }, { status: 404 })
}

const contentTypes: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

Deno.serve(
  {
    hostname: '127.0.0.1',
    port: agentCreation ? 5188 : scenarioAgents ? 5178 : 5177,
  },
  async (request) => {
    const path = new URL(request.url).pathname
    if (path.startsWith('/v1/')) return api(request, path.slice(3))
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 })
    }
    if (path.startsWith('/assets/') || path.startsWith('/scenario-assets/')) {
      const file = resolve(root, `.${decodeURIComponent(path)}`)
      if (!file.startsWith(`${root}${sep}`)) {
        return new Response(null, { status: 404 })
      }
      try {
        return new Response(await Deno.readFile(file), {
          headers: {
            'Content-Type': contentTypes[extname(file)] ??
              'application/octet-stream',
          },
        })
      } catch {
        return new Response(null, { status: 404 })
      }
    }
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  },
)
