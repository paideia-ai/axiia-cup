// Serve the exact production frontend files, without HTML injection, overrides,
// Storybook, mock service workers or preview-specific application branches.
// Only /v1 is synthetic, session-isolated and local. No upstream calls exist.
import { extname, resolve, sep } from 'node:path'
import type { AgentVersionDTO, MyAgentDTO, Side } from '../src/api/types.ts'
import {
  portraitInventory,
  portraitScenarios,
} from '../src/testing/agent-portrait-fixtures.ts'
import { config } from '../src/testing/v34-fixtures.ts'
const root = resolve('build/client')
const port = 6043
const knownRoles =
  portraitInventory.scenarios.find((scene) =>
    scene.scenarioID === 'honnoji-decision'
  )!.sides
const sessions = new Map<
  string,
  {
    inventory: typeof portraitInventory
    drafts: Map<number, Record<string, string>>
    versions: Map<number, AgentVersionDTO[]>
    nextID: number
  }
>()
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}
await Deno.stat(`${root}/index.html`)

async function api(request: Request, url: URL) {
  const cookie = /(?:^|;\s*)portrait-preview=([a-f0-9-]+)/.exec(
    request.headers.get('cookie') ?? '',
  )?.[1]
  const sessionID = cookie && sessions.has(cookie)
    ? cookie
    : crypto.randomUUID()
  if (!sessions.has(sessionID)) {
    const inventory = structuredClone(portraitInventory)
    const versions = new Map<number, AgentVersionDTO[]>()
    for (const scene of inventory.scenarios) {
      for (const side of ['a', 'b'] as const) {
        for (const agent of scene.sides[side]) {
          versions.set(
            agent.agentID,
            Array.from({ length: agent.versionCount }, (_, i) => ({
              id: agent.agentID * 10 + i,
              agentID: agent.agentID,
              ordinal: i + 1,
              snapshotSeq: i,
              prompt: '先回应对方的顾虑，再提出一项可以执行的建议。',
              modelID: config.models[0].id,
              isEntry: agent.entryVersionID === agent.agentID * 10 + i,
              role: agent.role,
              options: agent.role
                ? JSON.stringify({ role: agent.role.key })
                : null,
            })),
          )
        }
      }
    }
    sessions.set(sessionID, {
      inventory,
      versions,
      drafts: new Map(),
      nextID: 5000,
    })
  }
  const state = sessions.get(sessionID)!
  const json = (body: unknown, status = 200) =>
    Response.json(body, {
      status,
      headers: {
        'Set-Cookie':
          `portrait-preview=${sessionID}; Path=/; HttpOnly; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    })
  const failure = (message: string, status = 404) =>
    json({ error: 'local_preview', message }, status)
  const path = url.pathname.slice(3)
  if (request.method === 'GET') {
    if (path === '/auth/me') {
      return json({
        account: {
          id: 'portrait-preview',
          email: 'preview@example.invalid',
          displayName: '本地预览',
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
    if (path === '/my/agents') return json(state.inventory)
    if (path === '/config') return json(config)
    if (path === '/models') return json({ models: config.models })
    if (path === '/matches') return json({ matches: [], open: true })
    if (path === '/tournaments') return json({ tournaments: [] })
    if (path === '/notifications') {
      return json({ notifications: [], unreadCount: 0 })
    }
    if (path === '/account/preset-usage') return json({ usages: [] })
    if (path === '/rewards') {
      return json({
        balance: 1000,
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
    if (path === '/notifications/bell' || /\/agents\/\d+\/stream$/.test(path)) {
      return new Response('retry: 60000\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    }
    const detail = portraitScenarios.find((s) =>
      path === `/scenarios/${s.summary.id}`
    )
    if (detail) return json(detail)
    if (/^\/scenarios\/[^/]+\/opponents$/.test(path)) {
      return json({ opponents: [] })
    }
    if (path === '/my/archived-agents') {
      return json({
        agents: state.inventory.scenarios.flatMap((scene) =>
          (['a', 'b'] as const).flatMap((side) =>
            scene.sides[side].filter((agent) => agent.isArchived).map((
              agent,
            ) => ({
              agent,
              scenarioID: scene.scenarioID,
              scenarioTitle: scene.title,
              sideName: portraitScenarios.find((s) =>
                s.summary.id === scene.scenarioID
              )!.summary[side === 'a' ? 'sideAName' : 'sideBName'],
            }))
          )
        ),
      })
    }
  }
  if (path === '/agents' && request.method === 'POST') {
    const input = await request.json()
    const scene = state.inventory.scenarios.find((s) =>
      s.scenarioID === input.scenarioID
    )
    if (!scene || !['a', 'b'].includes(input.side)) {
      return failure('场景或阵营无效', 400)
    }
    const side = input.side as Side
    const role = input.scenarioID === 'honnoji-decision'
      ? knownRoles[side].find((agent) => agent.role?.key === input.roleKey)
        ?.role
      : null
    if (input.scenarioID === 'honnoji-decision' && !role) {
      return failure('请选择有效角色', 400)
    }
    const agent: MyAgentDTO = {
      agentID: state.nextID++,
      name: null,
      versionCount: 0,
      entryVersionID: null,
      role,
    }
    scene.sides[side].push(agent)
    state.versions.set(agent.agentID, [])
    return json({ agentID: agent.agentID })
  }
  const match = /^\/agents\/(\d+)(?:\/(.*))?$/.exec(path)
  if (match) {
    const id = Number(match[1]), action = match[2]
    for (const scene of state.inventory.scenarios) {
      for (const side of ['a', 'b'] as const) {
        const agent = scene.sides[side].find((item) => item.agentID === id)
        if (!agent) continue
        const list = state.versions.get(id) ?? []
        if (request.method === 'GET') {
          if (action === 'draft') {
            return json({
              fields: state.drafts.get(id) ?? {},
              scenarioID: scene.scenarioID,
              side,
              role: agent.role,
            })
          }
          if (action === 'versions') {
            return json({
              versions: list,
              entryVersionID: agent.entryVersionID ?? null,
            })
          }
          if (action === 'matches') return json({ matches: [], open: true })
        }
        if (request.method === 'PATCH' && !action) {
          agent.name = (await request.json()).name
          return json({ ok: true })
        }
        if (
          action === 'archive' && ['PUT', 'DELETE'].includes(request.method)
        ) {
          agent.isArchived = request.method === 'PUT'
          return json({ ok: true })
        }
        if (request.method === 'POST' && action?.startsWith('entry/')) {
          const versionID = Number(action.slice(6))
          if (
            !list.some((version) => version.id === versionID)
          ) return failure('版本不存在')
          for (const sibling of scene.sides[side]) {
            sibling.entryVersionID = sibling.agentID === id ? versionID : null
            for (
              const version of state.versions.get(sibling.agentID) ?? []
            ) version.isEntry = version.id === versionID
          }
          scene.entryReady = (['a', 'b'] as const).every((key) =>
            scene.sides[key].some((item) => item.entryVersionID != null)
          )
          return json({ ok: true })
        }
        if (
          request.method === 'DELETE' && !action && agent.versionCount === 0
        ) {
          scene.sides[side] = scene.sides[side].filter((item) =>
            item.agentID !== id
          )
          return json({ ok: true })
        }
        return failure(
          '本地预览仅支持查看、新建、改名、归档和切换参赛版本；不执行对战。',
          409,
        )
      }
    }
  }
  return failure('本地预览未提供这项数据。')
}

Deno.serve({ hostname: '0.0.0.0', port }, async (request) => {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/v1/')) return api(request, url)
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, { status: 405 })
  }
  let path: string
  try {
    path = decodeURIComponent(url.pathname)
  } catch {
    return new Response(null, { status: 400 })
  }
  const file = resolve(root, `.${path}`)
  if (!file.startsWith(`${root}${sep}`) && file !== root) {
    return new Response(null, { status: 400 })
  }
  let served = file
  let bytes: Uint8Array<ArrayBuffer>
  try {
    bytes = await Deno.readFile(file)
  } catch {
    if (extname(path)) return new Response(null, { status: 404 })
    served = `${root}/index.html`
    bytes = await Deno.readFile(served)
  }
  return new Response(request.method === 'HEAD' ? null : bytes, {
    headers: {
      'Content-Type': mime[extname(served)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  })
})
