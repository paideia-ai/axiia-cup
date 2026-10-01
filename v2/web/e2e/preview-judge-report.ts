import type { MatchDetail } from '../src/api/types.ts'
import { liveJudgeMatch } from '../src/testing/live-judge-fixtures.ts'

// Serves the unmodified production build with local, read-only historical API fixtures.
// Run from v2/web: deno task preview:judge-report
const root = new URL('../', import.meta.url)
const liveSidebar = Deno.args.includes('--live-sidebar')
const port = liveSidebar ? 6036 : 6034
const scenes = liveSidebar
  ? [
    [20120, '本能寺 · 开局等待'],
    [10120, '本能寺 · 进行中'],
    [120, '本能寺 · 已结束'],
    [20144, '商鞅 · 开局等待'],
    [10144, '商鞅 · 进行中'],
    [144, '商鞅 · 已结束'],
  ] as const
  : [
    [144, '商鞅变法'],
    [120, '本能寺之变'],
    [122, '电车难题'],
    [123, '凤仪亭'],
    [145, '码头疑云'],
  ] as const
const fixtures = new Map(
  await Promise.all(scenes.map(async ([id]) => {
    const match: MatchDetail = JSON.parse(
      await Deno.readTextFile(
        new URL(`src/testing/reference-match-${id % 10000}.json`, root),
      ),
    )
    const snapshot = id >= 10000
      ? liveJudgeMatch(match, id >= 20000 ? 0 : 12)
      : match
    snapshot.summary.id = id
    return [String(id), snapshot] as const
  })),
)
const mime: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript',
  css: 'text/css',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  woff2: 'font/woff2',
  ico: 'image/x-icon',
}
Deno.serve({ hostname: '0.0.0.0', port }, async (req) => {
  const url = new URL(req.url)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Local read-only preview', { status: 405 })
  }
  if (url.pathname === '/') {
    return new Response(
      `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>对战布局本地预览</title><style>body{background:white;color:#222;font:16px/1.8 Arial,sans-serif;max-width:720px;margin:40px auto;padding:20px}a{color:#0645ad;text-decoration:underline}a:focus-visible{outline:2px solid #0645ad}li{margin:12px 0}</style><h1>对战布局本地预览</h1><p>历史样本的开局、进行中与完局状态；进行中页面会显示一段模拟流式发言。使用本分支的正式页面组件，不连接线上服务。</p><ul>${
        scenes.map(([id, name]) =>
          `<li><a href="/matches/${id}">${name}</a></li>`
        ).join('')
      }</ul></html>`,
      { headers: { 'Content-Type': mime.html } },
    )
  }
  if (url.pathname.startsWith('/v1/')) {
    if (url.pathname === '/v1/auth/me') {
      return Response.json({
        account: {
          id: 999999,
          email: 'preview@example.invalid',
          displayName: '本地历史预览',
          role: 'user',
          disabled: false,
        },
        elevated: false,
        firstBattleDone: true,
      })
    }
    const streamingID = /^\/v1\/matches\/(\d+)\/stream$/.exec(url.pathname)?.[1]
    if (streamingID && fixtures.has(streamingID)) {
      const match = fixtures.get(streamingID)!
      const next = match.turns.at(-1)
      let timer: ReturnType<typeof setInterval> | undefined
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          const encoder = new TextEncoder()
          controller.enqueue(encoder.encode(': local preview\n\n'))
          if (next) {
            const text = '此事还须细论，且听我再陈一言。'
            let index = 0
            timer = setInterval(() => {
              if (index >= text.length) {
                clearInterval(timer)
                return
              }
              controller.enqueue(encoder.encode(`data: ${
                JSON.stringify({
                  chunk: {
                    matchID: Number(streamingID),
                    seq: next.seq + 1,
                    channel: match.summary.scenarioID === 'shangyang-court'
                      ? 'court'
                      : 'council',
                    speaker: match.turns[2].speaker,
                    phase: 'text',
                    call: 'say',
                    delta: text[index++],
                  },
                })
              }\n\n`))
            }, 300)
          }
          req.signal.addEventListener('abort', () => {
            clearInterval(timer)
            try {
              controller.close()
            } catch { /* Already cancelled. */ }
          }, { once: true })
        },
        cancel() {
          clearInterval(timer)
        },
      })
      return new Response(body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store',
        },
      })
    }
    const id = /^\/v1\/matches\/(\d+)$/.exec(url.pathname)?.[1]
    const body = id
      ? JSON.stringify(fixtures.get(id))
      : url.pathname === '/v1/matches'
      ? '{"matches":[]}'
      : null
    return new Response(body ?? '{"message":"Local historical preview"}', {
      status: body ? 200 : 404,
      headers: { 'Content-Type': mime.json },
    })
  }
  let path: string
  try {
    path = decodeURIComponent(url.pathname)
  } catch {
    return new Response('', { status: 400 })
  }
  if (path.split('/').some((part) => part === '..') || path.includes('\\')) {
    return new Response('', { status: 400 })
  }
  let bytes: Uint8Array
  try {
    bytes = await Deno.readFile(new URL(`build/client${path}`, root))
  } catch {
    path = '/index.html'
    bytes = await Deno.readFile(new URL('build/client/index.html', root))
  }
  return new Response(req.method === 'HEAD' ? null : bytes, {
    headers: {
      'Content-Type': mime[path.split('.').at(-1)!] ??
        'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  })
})
