import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: env.VITE_ES_URL
        ? {
            '/es': {
              target: env.VITE_ES_URL,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/es/, ''),
              headers: {
                Authorization: `ApiKey ${env.VITE_ES_API_KEY}`,
              },
            },
          }
        : undefined,
    },
  }
})
