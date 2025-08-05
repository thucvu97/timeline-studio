import mdx from "@mdx-js/rollup"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [mdx(), react()],
  base: "", // Пустая строка для относительных путей
  assetsInclude: ["**/*.md"],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
})
