import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
const config = {
  plugins: [react()],
  base: '', // Пустая строка для относительных путей
}

export default defineConfig(config)
