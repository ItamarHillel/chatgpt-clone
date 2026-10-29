import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The backend allows this origin (CORS_ORIGINS in Backend/.env).
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // Libraries change less often than the app code - separate chunks stay cached between deployments.
        codeSplitting: {
          groups: [
            { name: 'markdown', test: /node_modules[\\/](react-markdown|remark-|rehype-|highlight\.js|lowlight|micromark|mdast-|hast-|unified|unist-|vfile)/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
})
