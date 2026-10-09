import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_DEV_BACKEND || 'http://localhost:8080'

  return {
    plugins: [react()],
    // Same origin in dev too: /api and /ws go to the local backend.
    server: {
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/ws': { target: backend, changeOrigin: true, ws: true },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      // forms are typed key by key and the whole suite runs in parallel: a slow machine or CI needs more than 5 s
      testTimeout: 20_000,
    },
  }
})
