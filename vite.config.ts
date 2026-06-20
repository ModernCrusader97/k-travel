import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'http'
import type { Plugin } from 'vite'

function dropsProxy(): Plugin {
  return {
    name: 'drops-proxy',
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const host = req.headers.host || ''
        if (!host.startsWith('twitch-drops.')) return next()

        const options = {
          hostname: '127.0.0.1',
          port: 9399,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: '127.0.0.1:9399' },
        }
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
          proxyRes.pipe(res, { end: true })
        })
        proxyReq.on('error', () => next())
        req.pipe(proxyReq, { end: true })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), dropsProxy()],
  server: {
    host: true,
    port: 5175,
    allowedHosts: true,
    proxy: {
      '/page-maker': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  }
})
