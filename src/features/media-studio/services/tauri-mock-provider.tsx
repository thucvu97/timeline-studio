"use client"

import { useEffect } from "react"

const isTauri = () => {
  if (typeof window === "undefined") return false
  return (window as any).__TAURI_INTERNALS__ !== undefined && (window as any).__TAURI_INTERNALS__ !== null
}

export function TauriMockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only mock in browser environment when Tauri is not available
    // This includes development server and E2E tests
    if (typeof window !== "undefined" && !isTauri()) {
      ;(window as any).__TAURI_INTERNALS__ = {
        transformCallback: (callback: any, once: boolean) => {
          const id = Math.random().toString(36).slice(2)
          return { callback, once, id }
        },
        invoke: async (cmd: string, args?: any) => {
          console.log("Mock Tauri invoke:", cmd, args)

          // Mock responses for common commands
          switch (cmd) {
            case "get_app_language_tauri":
              return { language: "ru", system_language: "ru" }
            case "get_media_files":
              return []
            case "file_exists":
              return false
            case "get_file_stats":
              return { size: 0, lastModified: Date.now() }
            case "get_app_directories":
              return { base_dir: "/Users/test/Movies/Timeline Studio" }
            case "get_active_jobs":
              return []
            case "load_store":
              return { settings: {}, projects: [], resources: [] }
            case "get_store":
              return { settings: {}, projects: [], resources: [] }
            case "get_gpu_capabilities":
              return { has_gpu: false, gpu_name: "Mock GPU", vram_mb: 0 }
            case "get_system_info":
              return { os: "Mock OS", cpu_cores: 4, total_memory_mb: 8192 }
            case "check_ffmpeg_capabilities":
              return { available: true, version: "4.4.0", codecs: [], filters: [] }
            case "get_compiler_settings":
              return { gpu_enabled: false, threads: 4, memory_limit_mb: 4096 }
            case "get_prerender_cache_info":
              return { file_count: 0, total_size_mb: 0, cache_path: "/tmp/cache" }
            case "plugin:event|listen":
              return { id: Math.random().toString(36).slice(2) }
            case "plugin:event|unlisten":
              return null
            case "plugin:store|load":
              return {}
            case "plugin:store|get":
              return null
            case "plugin:fs|exists":
              return false
            case "create_app_directories":
              return { base_dir: "/Users/test/Movies/Timeline Studio" }
            case "plugin:dialog|open_file":
              // Для тестов возвращаем пустой массив, если не переопределено
              return { paths: [] }
            case "plugin:dialog|open_folder":
              // Для тестов возвращаем null, если не переопределено
              return { path: null }
            case "scan_media_folder":
              // Возвращаем пустой массив файлов
              return []
            case "process_media_files":
              // Возвращаем успешный результат
              return { success: true, processed: 0 }
            default:
              console.warn(`Unhandled Tauri command: ${cmd}`)
              return null
          }
        },
      }
    }
  }, [])

  return <>{children}</>
}
