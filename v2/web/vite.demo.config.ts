import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'demo-root-entry',
      apply: 'build',
      enforce: 'post',
      generateBundle(_options, bundle) {
        const entry = bundle['demo.html']
        if (entry?.type !== 'asset') {
          throw new Error('Demo HTML entry was not generated')
        }
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: entry.source,
        })
      },
    },
  ],
  server: { host: '0.0.0.0', port: 5190, strictPort: true, open: false },
  build: { outDir: 'build/demo', rollupOptions: { input: 'demo.html' } },
})
