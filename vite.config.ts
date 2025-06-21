import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { codecovVitePlugin } from "@codecov/vite-plugin"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Codecov bundle analysis plugin
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "timeline-studio",
      uploadToken: process.env.CODECOV_TOKEN,
      uploadOverrides: {
        // Override the commit SHA if needed
        sha: process.env.GITHUB_SHA,
        // Override the branch name if needed
        branch: process.env.GITHUB_REF_NAME,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
    },
  },
  build: {
    // Generate source maps for bundle analysis
    sourcemap: true,
    // Report compressed size of modules
    reportCompressedSize: true,
    // Rollup options for better bundle analysis
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting analysis
        manualChunks: {
          // React and related libraries
          react: ["react", "react-dom"],
          // State management
          state: ["xstate", "@xstate/react"],
          // UI components
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          // Tauri APIs
          tauri: [
            "@tauri-apps/api", 
            "@tauri-apps/plugin-fs", 
            "@tauri-apps/plugin-dialog",
            "@tauri-apps/plugin-store",
            "@tauri-apps/plugin-global-shortcut",
            "@tauri-apps/plugin-log",
            "@tauri-apps/plugin-notification",
            "@tauri-apps/plugin-opener",
            "@tauri-apps/plugin-websocket",
            "@tauri-apps/plugin-window"
          ],
          // Utilities
          utils: ["dayjs", "clsx", "tailwind-merge"],
          // Media processing
          media: ["wavesurfer.js", "d3", "d3-scale"],
        },
      },
    },
  },
})