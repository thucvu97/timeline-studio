import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const config = defineConfig({
  plugins: [react()],
  base: './',
})

export default config
