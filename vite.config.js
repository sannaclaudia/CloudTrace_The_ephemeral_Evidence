import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/CloudTrace_The_ephemeral_Evidence/', 
  plugins: [
    react(),
    tailwindcss(),
  ],
})