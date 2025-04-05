import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Frontend development server port
    // Optional: Proxy backend requests to avoid CORS issues during development
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3001', // Your backend server address
    //     changeOrigin: true,
    //   },
    // }
  }
})