import type { MatchDetail, MatchEventDTO } from '../src/api/types.ts'
import { liveJudgeMatch } from '../src/testing/live-judge-fixtures.ts'

// Serves the unmodified production build with local, read-only historical API fixtures.
// Run from v2/web: deno task preview:judge-report (finished reports) or
// deno task preview:live-judge (queued, live and finished 商鞅/本能寺).
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
    // 2xxxx: queued, no rows yet; 1xxxx: the first 12 rows, the next speech
    // streaming; otherwise the finished report.
    const cut = id >= 20000 ? 0 : id >= 10000 ? 12 : null
    const snapshot = cut == null ? match : liveJudgeMatch(match, cut)
    snapshot.summary.id = id
    // The streamed speech takes the recorded next row's seq, channel and speaker.
    const next = cut ? match.turns[cut] ?? null : null
    return [String(id), { snapshot, next }] as const
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
    const title = liveSidebar ? '对战布局本地预览' : '五场景完整战报预览'
    const intro = liveSidebar
      ? '历史样本的开局、进行中与完局状态；进行中页面会显示一段模拟流式发言。使用本分支的正式页面组件，不连接线上服务。'
      : '本地历史样本 · 只读。以下页面使用本分支未经修改的生产构建，包含正式页面布局与交互。样本数据和本地预览账号不代表平台实时数据。'
    return new Response(
      `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{background:white;color:#222;font:16px/1.8 Arial,sans-serif;max-width:720px;margin:40px auto;padding:20px}a{color:#0645ad;text-decoration:underline}a:focus-visible{outline:2px solid #0645ad}li{margin:12px 0}</style><h1>${title}</h1><p>${intro}</p><ul>${
        scenes.map(([id, name]) =>
          `<li><a href="/matches/${id}">${name}${
            liveSidebar ? '' : ` · #${id}`
          }</a></li>`
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
      const { next } = fixtures.get(streamingID)!
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
              const event: MatchEventDTO = {
                chunk: {
                  matchID: Number(streamingID),
                  seq: next.seq,
                  channel: next.channel,
                  speaker: next.speaker,
                  phase: 'text',
                  call: 'say',
                  delta: text[index++],
                },
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
              )
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
      ? JSON.stringify(fixtures.get(id)?.snapshot)
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
