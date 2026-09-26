// Serves the unmodified production build with local, read-only historical fixtures.
// Run from v2/web: deno task preview:portraits
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
const port = Number(
  Deno.args.find((arg) => arg.startsWith('--port='))?.split('=')[1] ?? 6035,
)
Deno.serve({ hostname: '0.0.0.0', port }, async (req) => {
  const url = new URL(req.url)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Local read-only preview', { status: 405 })
  }
  if (url.pathname === '/') {
    return new Response(
      `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>80px 角色头像 · 完整战报预览</title><style>body{background:#0c0c0c;color:#e8e8e8;font:16px/1.8 system-ui;max-width:720px;margin:64px auto;padding:24px}a{color:#9dc1ff}li{margin:16px 0}</style><h1>80px 角色头像</h1><p>桌面端使用独立角色栏，手机和裁判 OS 使用顶部身份区。</p><p>本地历史样本 · 只读。页面直接使用本分支生产构建，账号和数据不代表线上实时状态。</p><ul>${
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
