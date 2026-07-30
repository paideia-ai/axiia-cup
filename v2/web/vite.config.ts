import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The `/v1` proxy makes the Swift API same-origin with the SPA in dev, so the
// HttpOnly session cookie and the server's Sec-Fetch-Site CSRF gate both work
// with no auth code in JS. AXIIA_PROXY_TARGET points at a locally-running
// `axiia serve` (default 127.0.0.1:8080) or at a deployed server, which lets a
// frontend-only checkout run with no Swift toolchain.
const proxyTarget = process.env.AXIIA_PROXY_TARGET ?? 'http://127.0.0.1:8080'
const remote = new URL(proxyTarget).protocol === 'https:'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'build/client',
  },
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: proxyTarget,
        // A deployed target is virtual-hosted, so it needs the Host header
        // rewritten; a local binary answers on any Host and keeping the browser's
        // own value makes its logs readable.
        changeOrigin: remote,
        configure: remote
          ? (proxy) => {
            // Dev serves over http, and Safari drops a `Secure` cookie there.
            proxy.on('proxyRes', (proxyRes) => {
              const cookies = proxyRes.headers['set-cookie']
              if (cookies) {
                proxyRes.headers['set-cookie'] = cookies.map((cookie) =>
                  cookie.replace(/;\s*Secure/gi, '')
                )
              }
            })
          }
          : undefined,
      },
    },
  },
})
