import react from "@vitejs/plugin-react"
import mdx from "@mdx-js/rollup"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mdx(),
    react()
  ],
  base: "", // Пустая строка для относительных путей
  assetsInclude: ['**/*.md'],
})
