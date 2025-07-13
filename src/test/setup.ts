import "@testing-library/jest-dom"

import React from "react"

import { cleanup } from "@testing-library/react"
import { afterEach, beforeAll, vi } from "vitest"

// Import modular mocks
import "@/test/mocks/tauri"
import "@/test/mocks/browser"
import "@/test/mocks/libraries"

// Mock scrollIntoView globally for all tests (needed for Radix UI components)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()

  // Also mock other methods that might be missing in jsdom
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = vi.fn()
  }
  if (!Element.prototype.scroll) {
    Element.prototype.scroll = vi.fn()
  }
})

// Mock common providers that are used in tests
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
    updateSettings: vi.fn(),
  }),
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock useApiKeys hook
vi.mock("@/features/user-settings/hooks/use-api-keys")

vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/app-state", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state")>()
  return {
    ...actual,
    useCurrentProject: () => ({
      currentProject: {
        name: "Test Project",
        path: "/test/project.tlsp",
        timeline: { tracks: [], duration: 0 },
      },
      createNewProject: vi.fn(),
      createTempProject: vi.fn(),
      loadOrCreateTempProject: vi.fn(),
      openProject: vi.fn(),
      saveProject: vi.fn(),
      setProjectDirty: vi.fn(),
      isTempProject: false,
    }),
    useAppSettings: () => ({
      getCurrentProject: vi.fn().mockReturnValue({
        name: "Test Project",
        path: "/test/project.tlsp",
        timeline: { tracks: [], duration: 0 },
      }),
      getUserSettings: vi.fn().mockReturnValue({
        browserSettings: null,
        theme: "light",
        language: "en",
      }),
      updateUserSettings: vi.fn(),
      createNewProject: vi.fn(),
      createTempProject: vi.fn(),
      loadOrCreateTempProject: vi.fn(),
      openProject: vi.fn(),
      saveProject: vi.fn(),
      setProjectDirty: vi.fn(),
      isTempProject: false,
    }),
  }
})

vi.mock("@/features/app-state/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state/services")>()
  return {
    ...actual,
    appDirectoriesService: {
      getAppDirectories: vi.fn().mockResolvedValue({
        base_dir: "/Users/test/Movies/Timeline Studio",
      }),
    },
  }
})

// Mock AI Content Intelligence services globally
vi.mock("@/features/ai-chat/services/unified-ai-service", () => ({
  UnifiedAIService: {
    getInstance: vi.fn(() => ({
      analyzeContentIntelligence: vi.fn().mockResolvedValue([]),
      generateScript: vi.fn().mockResolvedValue({ script: "Generated script" }),
      adaptForPlatform: vi.fn().mockResolvedValue({ content: "Adapted content" }),
    })),
  },
}))

vi.mock("@/features/person-identification/services/person-database-service", () => ({
  PersonDatabaseService: {
    getInstance: vi.fn(() => ({
      addPerson: vi.fn().mockResolvedValue({ id: "person-1", name: "Test Person" }),
      searchPerson: vi.fn().mockResolvedValue([]),
      getAllPersons: vi.fn().mockResolvedValue([]),
      updatePerson: vi.fn().mockResolvedValue(undefined),
      deletePerson: vi.fn().mockResolvedValue(undefined),
    })),
  },
}))

vi.mock("@/features/ai-content-intelligence/engines/scene-analysis/scene-analysis-engine", () => ({
  SceneAnalysisEngine: vi.fn(() => ({
    analyzeScene: vi.fn().mockResolvedValue({
      objects: [],
      faces: [],
      emotions: [],
      quality: { score: 0.8 },
    }),
    detectPersons: vi.fn().mockResolvedValue([]),
    analyzeVideo: vi.fn().mockResolvedValue({ scenes: [], persons: [] }),
  })),
}))

// Only absolutely essential global setup
beforeAll(() => {
  // Mock console methods in tests to reduce noise
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  }

  // Mock pointer capture methods for Radix UI components
  if (typeof Element !== "undefined") {
    Element.prototype.hasPointerCapture = vi.fn(() => false)
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
  }

  // Mock ResizeObserver for components that use it
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllEnvs()

  // Дополнительная очистка памяти
  if (globalThis.gc) {
    globalThis.gc()
  }

  // Очистка всех таймеров
  vi.clearAllTimers()
})

// Global test environment setup
declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T
    toHaveClass(className: string): T
    toHaveStyle(style: Record<string, any>): T
  }
}
