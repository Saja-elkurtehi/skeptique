import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url))

function backendCompanion() {
  let backendProcess
  return {
    name: 'skeptique-backend-companion',
    apply: 'serve',
    configureServer(server) {
      const probe = createConnection({ host: '127.0.0.1', port: 3000 })
      probe.once('connect', () => probe.destroy())
      probe.once('error', () => {
        backendProcess = spawn(process.execPath, ['server.js'], {
          cwd: path.resolve(frontendDirectory, '../backend'),
          stdio: 'inherit',
        })
      })
      server.httpServer?.once('close', () => backendProcess?.kill())
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/skeptique/',
  plugins: [react(), backendCompanion()],
  build: { commonjsOptions: { include: [/node_modules/, /framing\.cjs$/] } },
}))
