import { extname, resolve, sep } from 'node:path'

const api = 'http://127.0.0.1:8199'
const root = resolve('build/client')
const port = 5263
const routes: Record<string, string> = {
  scenario: '/scenarios/honnoji-decision',
  inventory: '/my-agents',
  agent: `/agents/${Deno.env.get('CHARACTER_PREVIEW_AGENT') ?? '1'}`,
}
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

const mobile =
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>人物签 · 实际前端手机预览</title>
<style>body{margin:0;background:#080808;color:#eee;font:14px system-ui}header{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:16px;padding:20px}a{color:inherit;text-underline-offset:4px}p{margin:0;color:#aaa;font-size:12px}iframe{display:block;width:390px;height:844px;max-width:100%;border:1px solid #333;margin:0 auto 32px;border-radius:12px;box-sizing:content-box}@media(max-width:420px){iframe{width:100%;height:calc(100dvh - 100px);border:0;border-radius:0}}</style>
<header><strong>390 × 844 手机视口</strong><a href="/__preview/open?view=scenario" target="phone">场景按钮</a><a href="/__preview/open?view=inventory" target="phone">智能体列表</a><a href="/__preview/open?view=agent" target="phone">机器人加号</a><p>方案 7 人物签 · 实际产品页面 · 独立本地数据库</p></header>
<iframe name="phone" title="手机端产品页面" src="/__preview/open?view=scenario"></iframe></html>`

const desktop =
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>人物签 · 实际前端预览</title>
<style>body{margin:0;background:#0c0c0c;color:#eee;font:13px system-ui}header{display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:12px 24px;border-bottom:1px solid #333}a{color:inherit;text-underline-offset:4px}small{color:#aaa;margin-left:auto}iframe{display:block;width:100%;height:calc(100dvh - 51px);border:0}@media(max-width:600px){header{gap:10px;padding:10px 14px}small{display:none}iframe{height:calc(100dvh - 76px)}}</style>
<header><strong>07 人物签</strong><a href="/__preview/open?view=scenario" target="product">场景按钮</a><a href="/__preview/open?view=inventory" target="product">智能体列表</a><a href="/__preview/open?view=agent" target="product">智能体主页</a><a href="/__preview/mobile" target="_blank">手机视口 ↗</a><small>当前 main 的实际页面 + 人物签 · 本地后端</small></header>
<iframe name="product" title="实际前端页面" src="/__preview/open?view=scenario"></iframe></html>`

Deno.serve({ hostname: '0.0.0.0', port }, async (request) => {
  const url = new URL(request.url)
  if (url.pathname === '/preview/role-gestures/' || url.pathname === '/') {
    return Response.redirect(new URL('/__preview/desktop', url), 302)
  }
  if (url.pathname === '/__preview/desktop') {
    return new Response(desktop, { headers: { 'Content-Type': mime['.html'] } })
  }
  if (url.pathname === '/__preview/mobile') {
    return new Response(mobile, { headers: { 'Content-Type': mime['.html'] } })
  }
  if (url.pathname === '/__preview/open') {
    const login = await fetch(`${api}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Sec-Fetch-Site': 'same-origin',
      },
      body: JSON.stringify({
        email: 'character-preview@axiia.test',
        password: 'preview-local-123456',
      }),
    })
    if (!login.ok) return new Response('本地预览账号未就绪', { status: 503 })
    const headers = new Headers({
      Location: routes[url.searchParams.get('view') ?? 'agent'] ?? routes.agent,
    })
    for (const cookie of login.headers.getSetCookie()) {
      headers.append('Set-Cookie', cookie)
    }
    await login.body?.cancel()
    return new Response(null, { status: 303, headers })
  }
  if (url.pathname.startsWith('/v1/')) {
    const headers = new Headers(request.headers)
    headers.delete('host')
    return await fetch(`${api}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : request.body,
      redirect: 'manual',
    })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405 })
  }
  const path = url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/scenario-assets/')
    ? resolve(root, `.${decodeURIComponent(url.pathname)}`)
    : resolve(root, 'index.html')
  if (!path.startsWith(`${root}${sep}`)) {
    return new Response(null, { status: 404 })
  }
  try {
    const body = await Deno.readFile(path)
    return new Response(body, {
      headers: {
        'Content-Type': mime[extname(path)] ?? 'application/octet-stream',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new Response(null, { status: 404 })
  }
})
