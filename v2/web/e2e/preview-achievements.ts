// Serve the production build against an isolated, real Swift server.
import { extname, resolve, sep } from 'node:path'

const api = new URL(Deno.args[0] ?? 'http://127.0.0.1:8094')
const port = Number(Deno.args[1] ?? 5184)
if (
  api.protocol !== 'http:' ||
  !['127.0.0.1', 'localhost', '[::1]'].includes(api.hostname)
) throw new Error('The achievement preview requires a local Swift API.')
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid preview port.')
}

const root = resolve('build/client')
await Deno.stat(resolve(root, 'index.html'))
const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
}

Deno.serve({ hostname: '0.0.0.0', port }, async (request) => {
  const url = new URL(request.url)
  if (url.pathname === '/v1' || url.pathname.startsWith('/v1/')) {
    const target = new URL(url.pathname + url.search, api)
    try {
      return await fetch(new Request(target, request), { redirect: 'manual' })
    } catch {
      return Response.json({
        code: 'preview_api_unavailable',
        message: 'The local Swift server is unavailable.',
      }, { status: 502 })
    }
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 })
  }
  let pathname: string
  try {
    pathname = decodeURIComponent(url.pathname)
  } catch {
    return new Response('Invalid path', { status: 400 })
  }
  let file = resolve(root, `.${pathname}`)
  if (file !== root && !file.startsWith(root + sep)) {
    return new Response('Not found', { status: 404 })
  }
  try {
    if (!(await Deno.stat(file)).isFile) file = resolve(root, 'index.html')
  } catch {
    if (extname(file)) return new Response('Not found', { status: 404 })
    file = resolve(root, 'index.html')
  }
  return new Response(
    request.method === 'HEAD' ? null : await Deno.readFile(file),
    {
      headers: {
        'Content-Type': contentTypes[extname(file)] ??
          'application/octet-stream',
        'Cache-Control': 'no-store',
      },
    },
  )
})
