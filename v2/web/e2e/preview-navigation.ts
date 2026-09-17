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

const root = resolve('build/client')
const html = (await Deno.readTextFile(`${root}/index.html`)).replace(
  '</body>',
  '<aside role="note" style="position:fixed;bottom:12px;left:12px;z-index:9999;padding:8px 12px;border:1px solid #e04a2f;border-radius:8px;background:#171717;color:#fff;font:12px sans-serif;pointer-events:none">交互预览 · 模拟数据 · 无需登录 · 不保存更改</aside></body>',
)
const mine = structuredClone(inventory)
mine.scenarios[0].sides.b = []

async function api(request: Request, path: string): Promise<Response> {
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

Deno.serve({ hostname: '127.0.0.1', port: 5177 }, async (request) => {
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
})
