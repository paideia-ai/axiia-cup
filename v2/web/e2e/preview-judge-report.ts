// Serves the unmodified production build with local, read-only historical API fixtures.
// Run from v2/web: deno task preview:judge-report
const root = new URL('../', import.meta.url)
const scenes = [
  [144, '商鞅变法'],
  [120, '本能寺之变'],
  [122, '电车难题'],
  [123, '凤仪亭'],
  [145, '码头疑云'],
] as const
const fixtures = new Map(
  await Promise.all(scenes.map(async ([id]) =>
    [
      String(id),
      await Deno.readTextFile(
        new URL(`src/testing/reference-match-${id}.json`, root),
      ),
    ] as const
  )),
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
Deno.serve({ hostname: '0.0.0.0', port: 6034 }, async (req) => {
  const url = new URL(req.url)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Local read-only preview', { status: 405 })
  }
  if (url.pathname === '/') {
    return new Response(
      `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>五场景完整战报预览</title><style>body{background:#141414;color:#ddd;font:16px/1.8 system-ui;max-width:720px;margin:64px auto;padding:24px}a{color:#79acff}li{margin:16px 0}</style><h1>五场景完整战报预览</h1><p>本地历史样本 · 只读。以下页面使用本分支未经修改的生产构建，包含正式页面布局与交互。样本数据和本地预览账号不代表平台实时数据。</p><ul>${
        scenes.map(([id, name]) =>
          `<li><a href="/matches/${id}">${name} · #${id}</a></li>`
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
    const id = /^\/v1\/matches\/(\d+)$/.exec(url.pathname)?.[1]
    const body = id
      ? fixtures.get(id)
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
