import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config'
export default mergeConfig(
  base,
  defineConfig({
    build: {
      outDir: 'build/journey-demo',
      rolldownOptions: { input: 'journey-demo.html' },
    },
  }),
)
