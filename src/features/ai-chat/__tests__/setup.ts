import React from "react"

import { afterEach, beforeEach, vi } from "vitest"

// Mock для @xstate/react
vi.mock("@xstate/react", () => ({
  useActor: vi.fn().mockImplementation(() => [
    {
      context: {
        chatMessages: [],
        selectedAgentId: "claude-4-sonnet",
        isProcessing: false,
        error: null,
      },
      value: "idle",
      send: vi.fn(),
    },
    vi.fn(),
  ]),
  useMachine: vi.fn().mockImplementation(() => [
    {
      context: {},
      value: "idle",
      matches: vi.fn().mockReturnValue(false),
    },
    vi.fn(),
  ]),
  createActor: vi.fn().mockImplementation((machine) => ({
    start: vi.fn(),
    stop: vi.fn(),
    send: vi.fn(),
    getSnapshot: vi.fn().mockReturnValue({
      context: {
        chatMessages: [],
        selectedAgentId: "claude-4-sonnet",
        isProcessing: false,
        error: null,
      },
      value: "idle",
    }),
  })),
}))

// Mock для react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      changeLanguage: vi.fn(),
      language: "ru",
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock для i18n модуля
vi.mock("@/i18n", () => ({
  default: {
    isInitialized: true,
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(),
    language: "ru",
  },
}))

// Mock для I18nProvider
vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock для ThemeProvider
vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}))

// Mock для модалов
vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock для user settings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
    claudeApiKey: "test-claude-key",
    updateSettings: vi.fn(),
  }),
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock для AppDirectoriesService
vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    getAppDirectories: vi.fn().mockResolvedValue({
      base_dir: "/Users/test/Movies/Timeline Studio",
    }),
  },
}))

// Mock для AppSettingsProvider
vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useAppSettings: () => ({
    settings: {},
    updateSettings: vi.fn(),
  }),
}))

// Mock для Tauri APIs
vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn().mockResolvedValue(true),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readTextFile: vi.fn().mockResolvedValue("{}"),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
  readDir: vi.fn().mockResolvedValue([]),
  remove: vi.fn().mockResolvedValue(undefined),
}))

// Глобальный setup
beforeEach(() => {
  // Reset localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  })

  // Mock window.__TAURI__
  Object.defineProperty(window, "__TAURI__", {
    value: undefined,
    writable: true,
  })

  // Mock console для чистоты вывода
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(console.warn), // Оставляем warn для отладки
    error: vi.fn(console.error), // Оставляем error для отладки
  }

  // Mock fetch
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})
