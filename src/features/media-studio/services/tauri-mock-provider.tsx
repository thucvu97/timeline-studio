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
          console.log(`[TauriMock] Command: ${cmd}`, args)

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
            case "get_gpu_capabilities_full":
              return {
                available_encoders: ["VideoToolbox", "Software"],
                recommended_encoder: "VideoToolbox",
                current_gpu: {
                  name: "Apple M1",
                  driver_version: "Metal 3.0",
                  memory_total: 8192,
                  memory_used: 2048,
                  utilization: 25,
                  encoder_type: "VideoToolbox",
                  supported_codecs: ["h264", "hevc"],
                },
                hardware_acceleration_supported: true,
              }
            case "get_system_info":
              return {
                os: {
                  type: "Darwin",
                  version: "14.0",
                  architecture: "aarch64",
                },
                cpu: {
                  cores: 8,
                  arch: "aarch64",
                },
                memory: {
                  total_bytes: 8589934592,
                  total_mb: 8192,
                  total_gb: 8,
                },
                runtime: {
                  rust_version: "0.25.0",
                  tauri_version: "2.0.0",
                },
              }
            case "check_ffmpeg_capabilities":
              return {
                version: "5.1.2",
                available_codecs: ["h264", "hevc", "vp9", "av1"],
                hardware_encoders: ["h264_videotoolbox", "hevc_videotoolbox"],
                path: "/usr/local/bin/ffmpeg",
              }
            case "get_compiler_settings":
            case "get_compiler_settings_advanced":
              return {
                hardware_acceleration: true,
                max_concurrent_jobs: 2,
                temp_directory: "/tmp",
                cache_size_mb: 1024,
              }
            case "check_hardware_acceleration_support":
              return true
            case "set_hardware_acceleration":
              return null
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
            case "list_api_keys":
              // Возвращаем пустой массив для API ключей (согласно типу ApiKeyInfo[])
              return []
            case "get_api_key":
              // Возвращаем null для отсутствующих ключей
              return null
            case "set_api_key":
              // Возвращаем успешный результат
              return { success: true }
            case "delete_api_key":
              // Возвращаем успешный результат
              return { success: true }
            default:
              console.warn(`[TauriMock] Unhandled command: ${cmd}`, args)
              // Throw error for unhandled commands to see stack trace
              throw new Error(`Command ${cmd} not found`)
          }
        },
      }
    }
  }, [])

  return <>{children}</>
}
