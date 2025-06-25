import { test as base } from "@playwright/test"

type TestFixtures = {
  autoGoto: void
  mockTauriAPI: void
}

// Расширяем базовый тест с полезными фикстурами
export const test = base.extend<TestFixtures>({
  // Автоматическая навигация на главную страницу
  autoGoto: [
    async ({ page }, use) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")
      await use()
    },
    { auto: true },
  ],

  // Моки для Tauri API если приложение запущено в браузере
  mockTauriAPI: async ({ page }, use) => {
    await page.addInitScript(() => {
      // Store for event listeners
      const eventListeners = new Map<string, Set<Function>>()

      if (!window.__TAURI__) {
        window.__TAURI__ = {
          core: {
            invoke: async (cmd: string, args?: any) => {
              console.log("Mock Tauri invoke:", cmd, args)
              // Базовые моки для команд
              switch (cmd) {
                case "get_app_info":
                  return { version: "0.24.0", name: "Timeline Studio" }
                case "get_media_files":
                  return []
                case "get_project_settings":
                  return {
                    frameRate: 30,
                    resolution: { width: 1920, height: 1080 },
                    aspectRatio: "16:9",
                  }
                case "import_media_files":
                  return {
                    success: true,
                    files: args?.paths?.map((path: string) => ({
                      path,
                      name: path.split("/").pop(),
                      type: path.endsWith(".mp4") ? "video" : "image",
                    })),
                  }
                default:
                  return null
              }
            },
          },
          event: {
            emit: (event: string, payload?: any) => {
              console.log("Mock Tauri emit:", event, payload)
              const listeners = eventListeners.get(event)
              if (listeners) {
                listeners.forEach((listener) => listener({ event, payload }))
              }
            },
            listen: (event: string, handler: Function) => {
              console.log("Mock Tauri listen:", event)
              if (!eventListeners.has(event)) {
                eventListeners.set(event, new Set())
              }
              eventListeners.get(event)!.add(handler)
              return {
                unlisten: () => {
                  eventListeners.get(event)?.delete(handler)
                },
              }
            },
          },
          path: {
            homeDir: async () => "/home/user",
            appDataDir: async () => "/home/user/.timeline-studio",
          },
          fs: {
            readTextFile: async () => "{}",
            writeTextFile: async () => {},
            exists: async () => true,
          },
          dialog: {
            open: async (options?: any) => {
              if (options?.multiple) {
                return ["/test/video1.mp4", "/test/video2.mp4"]
              }
              return "/test/video.mp4"
            },
            save: async () => "/test/project.json",
          },
          notification: {
            sendNotification: async () => {},
          },
        }
      }
    })
    await use()
  },
})

export { expect } from "@playwright/test"
