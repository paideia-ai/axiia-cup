// Local-only fixture API. Exact built app, no HTML injection or upstream calls.
import { extname, resolve, sep } from 'node:path'
import { sortieDemoAPI } from '../src/testing/sortie-demo-api.ts'

const root = resolve('build/client')
const html = await Deno.readTextFile(`${root}/index.html`)
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

Deno.serve({ hostname: '0.0.0.0', port: 6055 }, async (request) => {
  const path = new URL(request.url).pathname
  if (path.startsWith('/v1/')) return sortieDemoAPI(request, path.slice(3))
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405 })
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
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
})
