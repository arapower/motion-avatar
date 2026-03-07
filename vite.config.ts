import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/motion-avatar/',
  plugins: [tailwindcss()],
  server: {
    host: true,
  },
})
