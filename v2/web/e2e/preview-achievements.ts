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
  // This separate build imports the product component for repeatable auditions.
  const toastPrefix = '/_preview/achievement-toast/'
  if (url.pathname === toastPrefix.slice(0, -1)) {
    return new Response(null, {
      status: 308,
      headers: { Location: toastPrefix },
    })
  }
  if (url.pathname.startsWith(toastPrefix)) {
    const toastRoot = resolve('build/achievement-toast-preview')
    let suffix: string
    try {
      suffix = decodeURIComponent(url.pathname.slice(toastPrefix.length))
    } catch {
      return new Response('Invalid path', { status: 400 })
    }
    const file = resolve(toastRoot, suffix || 'index.html')
    if (!file.startsWith(toastRoot + sep)) {
      return new Response('Not found', { status: 404 })
    }
    try {
      return new Response(await Deno.readFile(file), {
        headers: {
          'Content-Type': contentTypes[extname(file)] ??
            'application/octet-stream',
          'Cache-Control': 'no-store',
        },
      })
    } catch (error) {
      if (
        error instanceof Deno.errors.NotFound ||
        error instanceof Deno.errors.IsADirectory
      ) {
        return new Response('Not found', { status: 404 })
      }
      throw error
    }
  }
  // Design choices live only in this local preview server, outside the shipped SPA.
  if (url.pathname === '/_preview/achievement-toasts') {
    return new Response(
      request.method === 'HEAD' ? null : await Deno.readTextFile(
        new URL('./previews/achievement-toast-options.html', import.meta.url),
      ),
      {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    )
  }
  const soundFile = url.pathname.match(
    /^\/_preview\/achievement-sounds\/(manifest\.json|(?:0[1-9]|1[01])-[a-z0-9-]+\.wav)$/,
  )?.[1]
  if (soundFile) {
    const source = new URL(
      `./previews/achievement-sounds/${soundFile}`,
      import.meta.url,
    )
    try {
      const bytes = await Deno.readFile(source)
      // Deno strips the body for HEAD; supplying bytes preserves its GET length.
      return new Response(
        bytes,
        {
          headers: {
            'Content-Type': contentTypes[extname(soundFile)],
            'Content-Length': String(bytes.byteLength),
            'Cache-Control': 'no-store',
          },
        },
      )
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return new Response('Not found', { status: 404 })
      }
      throw error
    }
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
