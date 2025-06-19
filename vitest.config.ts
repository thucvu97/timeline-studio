import path from "node:path"

import react from "@vitejs/plugin-react"
import { codecovVitePlugin } from "@codecov/vite-plugin"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    react(),
    // Put the Codecov vite plugin after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "timeline-studio",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**/*", "node_modules/**/*"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "src/test/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/vite-env.d.ts",
        "**/*.test.{ts,tsx}",
        "**/__mocks__/**",
        "**/mocks/**",
        "src/components/ui/**", // Исключаем UI компоненты из проверки покрытия
      ],
      include: ["src/**/*.{ts,tsx}"],
      reportsDirectory: "./coverage",
      all: false,
      skipFull: true,
      clean: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      // Mock Tauri dependencies during testing
      "@tauri-apps/plugin-os": path.resolve(__dirname, "./src/test/mocks/tauri/plugins/os.ts"),
      "@tauri-apps/api/app": path.resolve(__dirname, "./src/test/mocks/tauri/api/app.ts"),
    },
  },
})
