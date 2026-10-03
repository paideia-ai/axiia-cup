import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/_preview/achievement-toast/',
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: fileURLToPath(
      new URL('../../build/achievement-toast-preview', import.meta.url),
    ),
    emptyOutDir: true,
  },
})
