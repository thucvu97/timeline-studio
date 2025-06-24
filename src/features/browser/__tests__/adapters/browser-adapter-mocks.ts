import { vi } from "vitest"

// Мокаем все провайдеры из providers.tsx чтобы избежать циклических зависимостей
vi.mock("@/features/media-studio/services/providers.tsx", () => ({
  Providers: ({ children }: any) => children,
}))

// Мокаем TauriMockProvider
vi.mock("@/features/media-studio/services/tauri-mock-provider", () => ({
  TauriMockProvider: ({ children }: any) => children,
}))

// Мокаем I18nProvider
vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: any) => children,
}))

// Мокаем ThemeProvider
vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: any) => children,
}))

// Мокаем ModalProvider
vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: any) => children,
}))

// Мокаем AppSettingsProvider и связанные хуки
vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: any) => children,
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
  useAppSettings: vi.fn(() => ({
    getMusicFiles: vi.fn(() => ({ allFiles: [] })),
  })),
}))

// Мокаем BrowserStateProvider
vi.mock("@/features/browser/services/browser-state-provider", () => ({
  BrowserStateProvider: ({ children }: any) => children,
  useBrowserState: vi.fn(() => ({
    state: {},
    send: vi.fn(),
  })),
}))

// Мокаем ProjectSettingsProvider
vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: any) => children,
  useProjectSettings: vi.fn(() => ({
    settings: {
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      aspectRatio: {
        label: "16:9",
        value: { width: 1920, height: 1080 },
      },
    },
  })),
}))

// Мокаем UserSettingsProvider
vi.mock("@/features/user-settings", () => ({
  UserSettingsProvider: ({ children }: any) => children,
}))

// Мокаем ShortcutsProvider
vi.mock("@/features/keyboard-shortcuts", () => ({
  ShortcutsProvider: ({ children }: any) => children,
}))

// Мокаем ResourcesProvider
vi.mock("@/features/resources", () => ({
  ResourcesProvider: ({ children }: any) => children,
  useResources: vi.fn(() => ({})),
}))

// Мокаем ResourcesProvider альтернативный путь
vi.mock("@/features/resources/services/resources-provider", () => ({
  ResourcesProvider: ({ children }: any) => children,
}))

// Мокаем TimelineProvider
vi.mock("@/features/timeline/services/timeline-provider", () => ({
  TimelineProvider: ({ children }: any) => children,
}))

// Мокаем PlayerProvider
vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: any) => children,
}))

// Мокаем ChatProvider
vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  ChatProvider: ({ children }: any) => children,
}))

// Мокаем i18n
vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => key),
    on: vi.fn(),
    off: vi.fn(),
    changeLanguage: vi.fn(() => Promise.resolve()),
  },
}))

// Экспортируем функцию для настройки специфичных моков
export function setupAdapterMocks() {
  // Здесь можно добавить дополнительную настройку моков если нужно
}

// Экспортируем функцию для очистки моков
export function clearAdapterMocks() {
  vi.clearAllMocks()
}
