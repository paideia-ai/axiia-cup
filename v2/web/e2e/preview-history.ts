// The production build is served byte-for-byte. Only the API differs in fixture mode.
import { extname, resolve, sep } from 'node:path'
import {
  historyFixtures,
  historyScenarios,
} from '../src/testing/history-fixtures.ts'
import { config } from '../src/testing/v34-fixtures.ts'

const live = Deno.args.includes('--live')
const port = live ? 5189 : 5187
const root = resolve('build/client')
const rows = historyFixtures()
const sessions = new Map<string, Set<number>>()
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

async function api(request: Request, url: URL): Promise<Response> {
  if (live) {
    const target = new URL(
      url.pathname + url.search,
      'https://axiia-cup-2.isofucius.cn',
    )
    const headers = new Headers(request.headers)
    headers.delete('host')
    headers.set('accept-encoding', 'identity')
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      redirect: 'manual',
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    })
    const responseHeaders = new Headers(upstream.headers)
    responseHeaders.delete('set-cookie')
    responseHeaders.delete('content-length')
    responseHeaders.delete('content-encoding')
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie.replace(/;\s*Secure/gi, ''))
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  }
  const cookie = /(?:^|;\s*)history-preview=([a-f0-9-]+)/.exec(
    request.headers.get('cookie') ?? '',
  )?.[1]
  const session = cookie && sessions.has(cookie) ? cookie : crypto.randomUUID()
  if (!sessions.has(session)) sessions.set(session, new Set())
  const viewed = sessions.get(session)!
  const json = (body: unknown, status = 200) =>
    Response.json(body, {
      status,
      headers: {
        'Set-Cookie':
          `history-preview=${session}; Path=/; HttpOnly; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    })
  const path = url.pathname.slice(3)
  const history = rows.map((m) => ({
    ...m,
    viewed: m.viewed || viewed.has(m.id),
  }))
  const receipt = /^\/matches\/(\d+)\/view$/.exec(path)
  if (request.method === 'POST' && receipt) {
    viewed.add(Number(receipt[1]))
    return json({ ok: true })
  }
  if (request.method !== 'GET') {
    return json({
      error: 'preview_only',
      message: '本地预览不保存修改或发起对战。',
    }, 409)
  }
  if (path === '/auth/me') {
    return json({
      account: {
        id: 'history-preview',
        email: 'preview@example.invalid',
        displayName: 'yihan',
        isAdmin: false,
        hasTOTP: false,
      },
      elevated: false,
      firstBattleDone: true,
    })
  }
  if (path === '/matches') return json({ open: true, matches: history })
  if (path === '/scenarios') return json({ scenarios: historyScenarios })
  if (path === '/config') return json(config)
  if (path === '/models') return json({ models: config.models })
  if (path === '/my/agents') {
    return json({
      scenarios: historyScenarios.map((s) => ({
        scenarioID: s.id,
        title: s.title,
        sides: Object.fromEntries(
          ['a', 'b'].map((side) => [
            side,
            rows.flatMap((m) => {
              const p = m.participants?.[side as 'a' | 'b']
              return m.scenarioID === s.id && p?.isMine && p.agentID
                ? [{
                  agentID: p.agentID,
                  role: p.role,
                  versionCount: 1,
                  entryVersionID: p.versionID,
                }]
                : []
            }),
          ]),
        ),
        entryReady: true,
        gateProgress: {
          a: { beaten: 1, needed: 1 },
          b: { beaten: 1, needed: 1 },
        },
      })),
    })
  }
  if (path === '/rewards') {
    return json({
      balance: 12000,
      battleCost: 100,
      pvpWinRefundPercent: 100,
      pveWinRefundPercent: 50,
      claimableRewards: [],
    })
  }
  if (path === '/notifications') {
    return json({ notifications: [], unreadCount: 0 })
  }
  if (path === '/notifications/bell') {
    return new Response(
      'event: bell\ndata: {"unreadCount":0}\n\nretry: 60000\n\n',
      { headers: { 'Content-Type': 'text/event-stream' } },
    )
  }
  if (path === '/achievements') {
    return json({ achievements: [], eventCursor: 0 })
  }
  if (path === '/account/preset-usage') return json({ usages: [] })
  const match = /^\/matches\/(\d+)$/.exec(path)
  if (match) {
    const summary = history.find((m) => m.id === Number(match[1]))
    if (summary) {
      return json({
        summary,
        currentTurn: 0,
        turns: [],
        verdicts: [],
        stages: [],
        speakerLabels: {},
        error: null,
      })
    }
  }
  const scene = historyScenarios.find((s) => path === `/scenarios/${s.id}`)
  if (scene) return json({ summary: scene, presets: [], stages: [] })
  const agent = /^\/agents\/(\d+)\/(draft|versions|public|matches|stream)$/
    .exec(path)
  if (agent) {
    const m = rows.find((m) =>
      [m.participants?.a.agentID, m.participants?.b.agentID].includes(
        Number(agent[1]),
      )
    )
    const side = m?.participants?.a.agentID === Number(agent[1]) ? 'a' : 'b'
    const p = m?.participants?.[side]
    if (m && p) {
      if (agent[2] === 'draft') {
        return p.isMine
          ? json({ fields: {}, scenarioID: m.scenarioID, side, role: p.role })
          : json({ error: 'forbidden', message: '提示词仅主人可见。' }, 403)
      }
      const version = {
        id: p.versionID,
        agentID: p.agentID,
        role: p.role,
        ordinal: 1,
        snapshotSeq: 0,
        isEntry: true,
        prompt: '本地演示策略',
        modelID: config.models[0].id,
        createdAt: m.createdAt,
        matchCount: 1,
        winCount: Number(m.winner === side),
        drawCount: Number(m.winner === 'draw'),
        lossCount: Number(m.winner !== side && m.winner !== 'draw'),
      }
      if (agent[2] === 'versions') {
        return json({ versions: [version], entryVersionID: p.versionID })
      }
      if (agent[2] === 'public') {
        return json({
          agentID: p.agentID,
          scenarioID: m.scenarioID,
          scenarioTitle: m.scenarioTitle,
          side,
          sideName: p.role?.name ??
            historyScenarios.find((s) => s.id === m.scenarioID)
              ?.[side === 'a' ? 'sideAName' : 'sideBName'],
          role: p.role,
          ownerName: p.ownerDisplayName,
          versions: [{ ...version, prompt: undefined }],
        })
      }
      if (agent[2] === 'matches') return json({ matches: [m], open: true })
      if (agent[2] === 'stream') {
        return new Response('retry: 60000\n\n', {
          headers: { 'Content-Type': 'text/event-stream' },
        })
      }
    }
  }
  const npc = /^\/scenarios\/([^/]+)\/npcs\/([^/]+)$/.exec(path)
  if (npc) {
    const m = rows.find((m) => m.id === Number(url.searchParams.get('matchID')))
    const side = m?.participants?.a.presetKey === decodeURIComponent(npc[2])
      ? 'a'
      : 'b'
    if (m) {
      return json({
        sourceMatchID: m.id,
        scenarioID: m.scenarioID,
        scenarioTitle: m.scenarioTitle,
        key: decodeURIComponent(npc[2]),
        side,
        sideName: historyScenarios.find((s) => s.id === m.scenarioID)
          ?.[side === 'a' ? 'sideAName' : 'sideBName'],
        label: '预设策略',
        modelID: config.models[0].id,
        prompt: '本地演示预设',
        versionTag: 'preview',
        matchCount: 1,
        winCount: 0,
        drawCount: 0,
        lossCount: 1,
        challengeCount: 1,
      })
    }
  }
  return json({ error: 'not_found', message: '本地预览没有这项数据。' }, 404)
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
