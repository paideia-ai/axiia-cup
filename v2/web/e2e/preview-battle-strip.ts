import { extname, resolve, sep } from 'node:path'
import {
  type BattlePreviewCase,
  battleStripPreviewAPI,
} from '../src/testing/battle-strip-preview-api.ts'

const root = resolve('build/client')
const clearPreviewCookie =
  'battle-preview=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax'
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}
const variants = new Set<BattlePreviewCase>([
  'default',
  'many',
  'empty',
  'foreign',
  'old-server',
  'expired',
  'error',
  'guest',
  'admin',
])
const guide = `<!doctype html><html lang="zh-CN">
<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>对战栏本地预览</title>
<style>body{margin:40px auto;padding:0 20px;max-width:760px;background:#fff;color:#222;font:15px/1.8 Arial,sans-serif}a{color:#0645ad;text-decoration:underline}a:focus-visible{outline:2px solid #0645ad}li{margin:8px 0}</style>
<h1>对战栏本地预览</h1>
<p>本分支的正式前端构建，搭配本地模拟数据。预览不会连接线上服务；不能保存策略、修改账户或发起真实对战。</p>
<p>默认有三场进行中的对局与一场刚完成的对局。网页可用宽度小于 960px 时使用顶部单行横向栏；960–1119px 使用 112px 左栏，1120–1359px 使用 144px 左栏，1360px 起使用 176px 左栏。这里的宽度是浏览器的 CSS 像素，系统缩放会影响可用宽度。</p>
<p>鼠标和触摸设备采用同一门槛，点击高度至少 44px。可以旋转手机、展开折叠屏或调整窗口宽度，核对页面、对局数据及折叠状态保持。顶部横栏随页面正常滚动。有版本目录时，较窄窗口将版本目录放回正文顶部，1680px 起再并排显示两个左栏。</p>
<p>空列表等特殊样本只作用于带该参数的当前页面；重新打开普通预览地址即可恢复默认对局。</p>
<ul>
<li><a href="/my-agents?battle-preview=default">我的智能体</a></li>
<li><a href="/scenarios?battle-preview=default">场景目录</a></li>
<li><a href="/sortie?battle-preview=default">天梯</a></li>
<li><a href="/matches?battle-preview=default">历史</a></li>
<li><a href="/matches/9400?battle-preview=default">进行中的对局</a></li>
<li><a href="/agents/1000?battle-preview=default">智能体主页与左侧版本目录</a></li>
<li><a href="/agents/1000/build?battle-preview=default">构建器</a></li>
<li><a href="/settings?battle-preview=default">设置</a></li>
<li><a href="/my-agents?battle-preview=many">24 场进行中的对局：检查栏内滚动</a></li>
<li><a href="/my-agents?battle-preview=empty">空列表：对战栏隐藏</a></li>
</ul></html>`

Deno.serve({ hostname: '0.0.0.0', port: 6056 }, async (request) => {
  const url = new URL(request.url)
  const path = url.pathname
  if (path.startsWith('/v1/')) {
    // Scope special fixtures to the requesting page rather than a sticky
    // cookie. A previous empty/error sample must not hide the normal preview.
    let value: BattlePreviewCase = 'default'
    try {
      const source = new URL(request.headers.get('referer') ?? '')
      const requested = source.searchParams.get(
        'battle-preview',
      ) as BattlePreviewCase
      if (source.origin === url.origin && variants.has(requested)) {
        value = requested
      }
    } catch {
      // Direct API requests and browsers omitting Referer get the default data.
    }
    const response = await battleStripPreviewAPI(
      request,
      path.slice(3),
      value,
    )
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405 })
  }
  if (path === '/preview' || path === '/preview/help') {
    return new Response(guide, {
      headers: {
        'Content-Type': mime['.html'],
        'Cache-Control': 'no-store',
        'Set-Cookie': clearPreviewCookie,
      },
    })
  }
  const file = resolve(root, `.${decodeURIComponent(path)}`)
  if (!file.startsWith(`${root}${sep}`) && file !== root) {
    return new Response(null, { status: 404 })
  }
  if (extname(path)) {
    try {
      return new Response(await Deno.readFile(file), {
        headers: {
          'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
        },
      })
    } catch {
      return new Response(null, { status: 404 })
    }
  }
  const headers = new Headers({
    'Content-Type': mime['.html'],
    'Cache-Control': 'no-store',
    'Set-Cookie': clearPreviewCookie,
  })
  // A build may be regenerated while this preview stays open.
  return new Response(await Deno.readTextFile(`${root}/index.html`), {
    headers,
  })
})
