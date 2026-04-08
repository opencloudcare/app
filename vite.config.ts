import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-ui': ['radix-ui', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'vendor-icons': ['@tabler/icons-react', 'lucide-react'],
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'react-syntax-highlighter'],
          'vendor-auth': ['better-auth'],
        },
      },
    },
  },
})
