import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/dashboard/' : '/',
  server: {
    port: Number(loadEnv(mode, process.cwd()).VITE_PORT) || 38430,
  },
  build: {
    sourcemap: true,
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}))
