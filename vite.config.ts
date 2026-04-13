import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: Number(loadEnv(mode, process.cwd()).VITE_PORT) || 38430,
  },
}))
