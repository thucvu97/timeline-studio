import { vi } from "vitest"

import type { InvokeArgs } from "@tauri-apps/api/core"

export const mockInvoke = vi.fn()
export const mockConvertFileSrc = vi.fn((src: string) => src)

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
  convertFileSrc: mockConvertFileSrc,
}))

// Mock Tauri OS plugin
vi.mock("@tauri-apps/plugin-os", () => ({
  platform: vi.fn().mockResolvedValue("darwin"),
  version: vi.fn().mockResolvedValue("14.0.0"),
  family: vi.fn().mockResolvedValue("unix"),
  type: vi.fn().mockResolvedValue("macos"),
  arch: vi.fn().mockResolvedValue("x86_64"),
  locale: vi.fn().mockResolvedValue("en-US"),
}))

// Mock Tauri app API
vi.mock("@tauri-apps/api/app", () => ({
  getName: vi.fn().mockResolvedValue("Timeline Studio"),
  getVersion: vi.fn().mockResolvedValue("0.18.0"),
  getTauriVersion: vi.fn().mockResolvedValue("2.0.0"),
}))

// Helper for setting up command responses
export function setupTauriCommand(command: string, response: unknown) {
  mockInvoke.mockImplementation((cmd: string, args?: InvokeArgs) => {
    if (cmd === command) {
      return response instanceof Error ? Promise.reject(response) : Promise.resolve(response)
    }
    return Promise.reject(new Error(`Unknown command: ${cmd}`))
  })
}

// Type-safe command handlers
export interface TauriCommands {
  // Language commands
  get_app_language: () => Promise<{ language: string; system_language: string }>
  set_app_language: (args: { lang: string }) => Promise<{ language: string; system_language: string }>

  // File system commands
  file_exists: (args: { path: string }) => Promise<boolean>
  get_file_stats: (args: { path: string }) => Promise<{ size: number; lastModified: number }>
  read_text_file: (args: { path: string }) => Promise<string>
  write_text_file: (args: { path: string; content: string }) => Promise<void>
  search_files_by_name: (args: { query: string; directory?: string }) => Promise<string[]>
  get_absolute_path: (args: { path: string }) => Promise<string>

  // Media commands
  get_media_files: (args: { path: string }) => Promise<any[]>
  get_media_metadata: (args: { path: string }) => Promise<any>

  // Project commands
  save_project: (args: { project: any; path: string }) => Promise<void>
  load_project: (args: { path: string }) => Promise<any>

  // Export commands
  export_video: (args: {
    projectId: string
    outputPath: string
    format: string
  }) => Promise<{ success: boolean; path?: string; error?: string }>
}

// Type-safe mock factory
export function createTauriMock() {
  const handlers = new Map<keyof TauriCommands, (...args: any[]) => any>()

  const mock = {
    invoke: vi.fn(async (cmd: keyof TauriCommands, args?: InvokeArgs) => {
      const handler = handlers.get(cmd)
      if (handler) {
        return handler(args)
      }
      throw new Error(`No mock handler for command: ${cmd}`)
    }),

    // Helper to register command handlers
    on<K extends keyof TauriCommands>(command: K, handler: TauriCommands[K]) {
      handlers.set(command, handler)
      return this
    },

    // Preset handlers for common scenarios
    usePreset(preset: "default" | "empty" | "with-media" | "with-project") {
      switch (preset) {
        case "default":
          this.on("get_app_language", async () => ({
            language: "ru",
            system_language: "ru",
          }))
          this.on("set_app_language", async (args) => ({
            language: args?.lang || "ru",
            system_language: "ru",
          }))
          this.on("file_exists", async () => true)
          this.on("get_file_stats", async () => ({
            size: 1024,
            lastModified: Date.now(),
          }))
          this.on("read_text_file", async () => '{"test": "data"}')
          this.on("write_text_file", async () => undefined)
          this.on("search_files_by_name", async () => [])
          this.on("get_absolute_path", async (args) => `/absolute${args?.path || ""}`)
          break

        case "empty":
          this.on("get_media_files", async () => [])
          this.on("load_project", async () => {
            throw new Error("No project")
          })
          break

        case "with-media":
          this.on("get_media_files", async () => [
            { id: "1", path: "/video1.mp4", type: "video", duration: 10 },
            { id: "2", path: "/video2.mp4", type: "video", duration: 20 },
          ])
          break

        case "with-project":
          this.on("load_project", async () => ({
            id: "test-project",
            name: "Test Project",
            tracks: [],
            settings: {},
          }))
          break
      }
      return this
    },

    // Reset all handlers
    reset() {
      handlers.clear()
      mockInvoke.mockReset()
    },
  }

  // Replace the global mock
  mockInvoke.mockImplementation(mock.invoke)

  return mock
}
