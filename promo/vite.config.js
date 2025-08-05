import mdx from "@mdx-js/rollup"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { fixImports } from "./vite-plugin-fix-imports.js"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [fixImports(), mdx(), react()],
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
    include: ["buffer", "use-sync-external-store/shim/with-selector"],
    // Исключаем тяжелые библиотеки из предварительной оптимизации
    exclude: ["@react-three/fiber", "@react-three/drei", "three"],
  },
  build: {
    // Оптимизация размера бандла
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Более агрессивное разделение кода
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            if (id.includes('mdx') || id.includes('remark') || id.includes('rehype')) {
              return 'mdx-vendor';
            }
            if (id.includes('heroicons')) {
              return 'icons';
            }
            // Остальные вендорные библиотеки
            return 'vendor';
          }
        },
        // Оптимизация размера чанков
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Минификация
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Генерация source maps только для продакшена при необходимости
    sourcemap: false,
    // Оптимизация CSS
    cssCodeSplit: true,
    // Анализ размера бандла (опционально)
    // chunkSizeWarningLimit: 500,
  },
  // Оптимизация для сервера разработки
  server: {
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"],
    },
  },
})
