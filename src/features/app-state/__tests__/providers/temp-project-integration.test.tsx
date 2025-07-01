/**
 * Интеграционные тесты для автоматического создания и управления временным проектом
 */

// Import Tauri modules - они автоматически мокаются через алиасы в vitest.config.ts
import { ReactNode } from "react"

import { invoke } from "@tauri-apps/api/core"
import { appDataDir, basename, join } from "@tauri-apps/api/path"
import { open, save } from "@tauri-apps/plugin-dialog"
import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useCurrentProject } from "../../hooks/use-current-project"
import { AppSettingsProvider } from "../../services/app-settings-provider"

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: () => `test-id-${Math.random().toString(36).substring(2, 11)}`,
}))

// Mock media restoration
vi.mock("@/features/media/hooks/use-media-restoration", () => ({
  useMediaRestoration: () => ({
    restoreProjectMedia: vi.fn(),
    handleMissingFilesResolution: vi.fn(),
    cancelMissingFilesDialog: vi.fn(),
    showMissingFilesDialog: false,
    getMissingFiles: () => [],
  }),
}))

// Mock app directories service
vi.mock("@/features/app-state/services/app-directories-service", () => ({
  appDirectoriesService: {
    getAppDirectories: vi.fn().mockResolvedValue({
      app_dir: "/app/data",
      backup_dir: "/app/backup",
      projects_dir: "/app/projects",
      exports_dir: "/app/exports",
      cache_dir: "/app/cache",
      temp_dir: "/app/temp",
    }),
  },
}))

// Mock store service to prevent actual store initialization
vi.mock("@/features/app-state/services/store-service", () => {
  const mockStoreInstance = {
    initialize: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    getUserSettings: vi.fn().mockResolvedValue(null),
    saveUserSettings: vi.fn().mockResolvedValue(undefined),
    getRecentProjects: vi.fn().mockResolvedValue([]),
    addRecentProject: vi.fn().mockResolvedValue(undefined),
    getFavorites: vi.fn().mockResolvedValue({
      media: [],
      music: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
    }),
    saveFavorites: vi.fn().mockResolvedValue(undefined),
  }

  return {
    StoreService: {
      getInstance: () => mockStoreInstance,
    },
    storeService: mockStoreInstance,
    USER_SETTINGS_STORE_PATH: ".timeline-studio-settings.json",
  }
})

// Test wrapper component
function TestWrapper({ children }: { children: ReactNode }) {
  return <AppSettingsProvider>{children}</AppSettingsProvider>
}

describe("Temporary Project Integration", () => {
  const mockDirectories = {
    base_dir: "/app",
    media_dir: "/app/media",
    projects_dir: "/app/projects",
    backup_dir: "/app/backup",
    snapshot_dir: "/app/snapshots",
    cinematic_dir: "/app/cinematic",
    output_dir: "/app/output",
    render_dir: "/app/render",
    recognition_dir: "/app/recognition",
    media_proxy_dir: "/app/proxy",
    caches_dir: "/app/cache",
    recorded_dir: "/app/recorded",
    audio_dir: "/app/audio",
    cloud_project_dir: "/app/cloud",
    upload_dir: "/app/upload",
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock app directories
    vi.mocked(invoke).mockImplementation((command) => {
      if (command === "get_app_directories" || command === "create_app_directories") {
        return Promise.resolve(mockDirectories)
      }
      return Promise.resolve()
    })

    // Mock file operations
    vi.mocked(readTextFile).mockRejectedValue(new Error("File not found"))
    vi.mocked(writeTextFile).mockResolvedValue()
    vi.mocked(exists).mockResolvedValue(false)

    vi.mocked(join).mockImplementation((...parts) => Promise.resolve(parts.join("/")))
    vi.mocked(appDataDir).mockResolvedValue("/app/data")
    vi.mocked(basename).mockImplementation((path) => Promise.resolve(path.split("/").pop() || ""))
    vi.mocked(open).mockResolvedValue(null)
    vi.mocked(save).mockResolvedValue(null)
  })

  describe("Automatic Temp Project Creation", () => {
    it("should automatically create temp project on startup", async () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      // Wait for the effect to run and temp project to be created
      await waitFor(
        () => {
          expect(result.current.currentProject.path).toBeTruthy()
        },
        { timeout: 2000 },
      )

      // Should have temp project path
      expect(result.current.currentProject.path).toContain("temp_project.tlsp")
      expect(result.current.currentProject.name).toBe("Untitled Project")
      expect(result.current.currentProject.isDirty).toBe(true)
      expect(result.current.isTempProject()).toBe(true)

      // Should have called save
      expect(writeTextFile).toHaveBeenCalledWith("/app/backup/temp_project.tlsp", expect.any(String))
    })

    it.skip("should load existing temp project if it exists", async () => {
      // Mock existing temp project file
      const existingProject = {
        metadata: {
          id: "existing-temp",
          name: "Existing Temp Project",
          version: "2.0.0",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          platform: "macos",
          appVersion: "1.0.0",
        },
        settings: {},
        mediaPool: {
          items: {},
          bins: { root: { id: "root", name: "Media Pool" } },
          smartCollections: [],
          viewSettings: {},
          stats: {},
        },
        sequences: {
          "seq-1": { id: "seq-1", name: "Main Sequence", type: "main" },
        },
        activeSequenceId: "seq-1",
        cache: {
          thumbnails: {},
          waveforms: {},
          proxies: {},
          sceneAnalysis: {},
        },
        workspace: {},
        backup: {
          autoSave: { enabled: true, interval: 5, keepVersions: 10 },
          versions: [],
          lastSaved: new Date().toISOString(),
        },
      }

      // Mock exists to return true for temp project file
      vi.mocked(exists).mockImplementation((path) => {
        if (path === "/app/backup/temp_project.tlsp") {
          return Promise.resolve(true)
        }
        return Promise.resolve(false)
      })

      // Mock readTextFile to simulate an existing temp project
      vi.mocked(readTextFile).mockImplementation((path) => {
        if (path === "/app/backup/temp_project.tlsp") {
          return Promise.resolve(JSON.stringify(existingProject))
        }
        return Promise.reject(new Error("File not found"))
      })

      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      // Log initial state
      console.log("Test: initial state", {
        path: result.current.currentProject.path,
        name: result.current.currentProject.name,
        isNew: result.current.currentProject.isNew
      })

      // Wait for the async effect to complete
      await act(async () => {
        // Give time for the useEffect to trigger and loadOrCreateTempProject to run
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Ждем загрузки проекта - используем polling для проверки изменения состояния
      await waitFor(
        () => {
          const path = result.current.currentProject.path
          const name = result.current.currentProject.name
          const isNew = result.current.currentProject.isNew
          console.log("Test: waiting for project load", { path, name, isNew })
          
          // Проверяем, что проект загрузился (путь установлен и это не новый проект)
          expect(path).toBeTruthy()
          expect(path).toContain("temp_project.tlsp")
          expect(isNew).toBe(false)
        },
        { timeout: 5000, interval: 100 },
      )

      // Проверяем имя проекта
      expect(result.current.currentProject.name).toBe("Existing Temp Project")
      expect(result.current.currentProject.isDirty).toBe(false)
      expect(result.current.isTempProject()).toBe(true)
    })
  })

  describe("Temp Project Auto-save", () => {
    it("should mark temp project as dirty when changed", async () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      await waitFor(() => {
        expect(result.current.currentProject.path).toBeTruthy()
      })

      // Should be dirty by default
      expect(result.current.currentProject.isDirty).toBe(true)

      // Trigger marking as dirty
      result.current.setProjectDirty(true)

      // Should still be dirty
      expect(result.current.currentProject.isDirty).toBe(true)

      // NOTE: Auto-save is currently disabled to prevent file conflicts
      // as noted in the autoSaveTempProject function
    })
  })

  describe("Saving Temp Project as New File", () => {
    it("should convert temp project to regular project when saving", async () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      await waitFor(() => {
        expect(result.current.currentProject.path).toBeTruthy()
      })

      // Mock save dialog
      vi.mocked(save).mockResolvedValue("/user/my-project.tlsp")

      // Mock reading temp project for save
      vi.mocked(readTextFile).mockResolvedValue(
        JSON.stringify({
          metadata: {
            name: "Untitled Project",
            version: "2.0.0",
            modified: new Date().toISOString(),
            created: new Date().toISOString(),
            platform: "macos",
            appVersion: "1.0.0",
            id: "temp-id",
          },
          settings: {},
          mediaPool: { items: {}, bins: {} },
          sequences: {},
          activeSequenceId: "seq-1",
          cache: { thumbnails: {}, waveforms: {}, proxies: {}, sceneAnalysis: {} },
          workspace: {},
          backup: {
            autoSave: { enabled: true, interval: 5, keepVersions: 10 },
            versions: [],
            lastSaved: new Date().toISOString(),
          },
        }),
      )

      // Save the project with new name
      const saveResult = await result.current.saveProject("My New Project")

      expect(saveResult).toEqual({
        path: "/user/my-project.tlsp",
        name: "My New Project",
      })

      // Should no longer be temp project
      await waitFor(() => {
        expect(result.current.currentProject.isDirty).toBe(false)
        expect(result.current.isTempProject()).toBe(false)
      })
    })
  })

  describe("Temp Project Management", () => {
    it("should provide utility methods for temp project detection", async () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      await waitFor(() => {
        expect(result.current.currentProject.path).toBeTruthy()
      })

      // Should detect temp project correctly
      expect(result.current.isTempProject()).toBe(true)

      // Should have correct temp project name
      expect(result.current.currentProject.name).toBe("Untitled Project")

      // Should be marked as dirty (needs saving)
      expect(result.current.currentProject.isDirty).toBe(true)
    })

    it("should create new temp project manually", async () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      await waitFor(() => {
        expect(result.current.currentProject.path).toBeTruthy()
      })

      // Clear previous calls
      vi.mocked(writeTextFile).mockClear()

      // Create new temp project
      await result.current.createTempProject()

      // Should have created and saved new temp project
      expect(writeTextFile).toHaveBeenCalledWith("/app/backup/temp_project.tlsp", expect.any(String))

      expect(result.current.isTempProject()).toBe(true)
      expect(result.current.currentProject.isDirty).toBe(true)
    })
  })

  describe("Error Handling", () => {
    it("should fallback to regular project creation if temp project fails", async () => {
      // Mock directory service failure
      vi.mocked(invoke).mockImplementation((command) => {
        if (command === "get_app_directories" || command === "create_app_directories") {
          return Promise.reject(new Error("Directory service failed"))
        }
        return Promise.resolve()
      })

      vi.mocked(readTextFile).mockRejectedValue(new Error("File not found"))
      vi.mocked(writeTextFile).mockRejectedValue(new Error("Write failed"))

      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      // Should fallback to regular new project
      await waitFor(() => {
        expect(result.current.currentProject.isNew).toBe(true)
      })

      // Should not be a temp project
      expect(result.current.isTempProject()).toBe(false)
    })

    it("should handle temp project save failures gracefully", async () => {
      const { result } = renderHook(() => useCurrentProject(), {
        wrapper: TestWrapper,
      })

      await waitFor(() => {
        expect(result.current.currentProject.path).toBeTruthy()
      })

      // Mock save failure
      vi.mocked(readTextFile).mockResolvedValue(JSON.stringify({ metadata: {} }))
      vi.mocked(writeTextFile).mockRejectedValue(new Error("Save failed"))

      // Should not throw when auto-save fails
      expect(() => {
        result.current.setProjectDirty(true)
      }).not.toThrow()
    })
  })
})
