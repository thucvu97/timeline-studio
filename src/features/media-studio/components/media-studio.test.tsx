import React from "react"

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaStudio } from "./media-studio"

// Мокаем зависимости
vi.mock("@/features/media-studio/hooks", () => ({
  useAutoLoadUserData: vi.fn(() => ({
    isLoading: false,
    loadedData: {
      media: 0,
      music: 0,
      effects: 0,
      transitions: 0,
      filters: 0,
      subtitles: 0,
      styleTemplates: 0,
    },
    error: null,
    reload: vi.fn(),
    clearCache: vi.fn(),
  })),
}))

vi.mock("@/features/user-settings", () => ({
  useUserSettings: vi.fn(() => ({
    layoutMode: "default",
    theme: "light",
    language: "ru",
  })),
  UserSettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Добавляем все необходимые моки для провайдеров
vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useProjectSettings: vi.fn(() => ({
    settings: {
      aspectRatio: {
        value: { width: 1920, height: 1080 },
        update: vi.fn(),
      },
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
    },
    updateProjectSettings: vi.fn(),
  })),
}))

vi.mock("@/features/resources", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/timeline/services/timeline-provider", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TimelineContext: React.createContext({
    project: null,
    uiState: {},
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    error: null,
    lastAction: null,
    isReady: true,
    isSaving: false,
    createProject: vi.fn(),
    loadProject: vi.fn(),
    saveProject: vi.fn(),
    closeProject: vi.fn(),
    addSection: vi.fn(),
    removeSection: vi.fn(),
    updateSection: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    updateTrack: vi.fn(),
    reorderTracks: vi.fn(),
    addClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
  }),
  useTimeline: vi.fn(() => ({
    project: null,
    uiState: {},
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    error: null,
    lastAction: null,
    isReady: true,
    isSaving: false,
    createProject: vi.fn(),
    loadProject: vi.fn(),
    saveProject: vi.fn(),
    closeProject: vi.fn(),
    addSection: vi.fn(),
    removeSection: vi.fn(),
    updateSection: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    updateTrack: vi.fn(),
    reorderTracks: vi.fn(),
    addClip: vi.fn(),
    removeClip: vi.fn(),
    updateClip: vi.fn(),
  })),
}))

vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  usePlayer: vi.fn(() => ({
    video: {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      volume: 1,
    },
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
  })),
}))

vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatContext: React.createContext({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
  }),
  useChat: vi.fn(() => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
  })),
}))

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/shortcuts/services/shortcuts-provider", () => ({
  ShortcutsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/features/top-bar/components/top-bar", () => ({
  TopBar: () => <div data-testid="top-bar">TopBar</div>,
}))

vi.mock("@/features/modals/components", () => ({
  ModalContainer: () => <div data-testid="modal-container">ModalContainer</div>,
}))

vi.mock("./layout", () => ({
  DefaultLayout: () => <div data-testid="default-layout">DefaultLayout</div>,
  OptionsLayout: () => <div data-testid="options-layout">OptionsLayout</div>,
  VerticalLayout: () => <div data-testid="vertical-layout">VerticalLayout</div>,
  ChatLayout: () => <div data-testid="chat-layout">ChatLayout</div>,
}))

describe("MediaStudio", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить компонент с default layout", () => {
    render(<MediaStudio />)

    expect(screen.getByTestId("top-bar")).toBeInTheDocument()
    expect(screen.getByTestId("default-layout")).toBeInTheDocument()
    expect(screen.getByTestId("modal-container")).toBeInTheDocument()
  })

  it("должен рендерить options layout", async () => {
    const { useUserSettings } = await import("@/features/user-settings")
    vi.mocked(useUserSettings).mockReturnValue({
      layoutMode: "options",
      theme: "light",
      language: "ru",
    } as any)

    render(<MediaStudio />)

    expect(screen.getByTestId("options-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
  })

  it("должен рендерить vertical layout", async () => {
    const { useUserSettings } = await import("@/features/user-settings")
    vi.mocked(useUserSettings).mockReturnValue({
      layoutMode: "vertical",
      theme: "light",
      language: "ru",
    } as any)

    render(<MediaStudio />)

    expect(screen.getByTestId("vertical-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
  })

  it("должен рендерить chat layout", async () => {
    const { useUserSettings } = await import("@/features/user-settings")
    vi.mocked(useUserSettings).mockReturnValue({
      layoutMode: "chat",
      theme: "light",
      language: "ru",
    } as any)

    render(<MediaStudio />)

    expect(screen.getByTestId("chat-layout")).toBeInTheDocument()
    expect(screen.queryByTestId("default-layout")).not.toBeInTheDocument()
  })

  it("должен обрабатывать состояние загрузки данных", async () => {
    const { useAutoLoadUserData } = await import("@/features/media-studio/hooks")
    vi.mocked(useAutoLoadUserData).mockReturnValue({
      isLoading: true,
      loadedData: {
        media: 0,
        music: 0,
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      },
      error: null,
      reload: vi.fn(),
      clearCache: vi.fn(),
    })

    const consoleSpy = vi.spyOn(console, "log")

    render(<MediaStudio />)

    expect(consoleSpy).toHaveBeenCalledWith("Загружаем пользовательские данные...")
  })

  it("должен обрабатывать ошибки загрузки данных", async () => {
    const { useAutoLoadUserData } = await import("@/features/media-studio/hooks")
    vi.mocked(useAutoLoadUserData).mockReturnValue({
      isLoading: false,
      loadedData: {
        media: 0,
        music: 0,
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      },
      error: "Ошибка загрузки",
      reload: vi.fn(),
      clearCache: vi.fn(),
    })

    const consoleSpy = vi.spyOn(console, "error")

    render(<MediaStudio />)

    expect(consoleSpy).toHaveBeenCalledWith("Ошибка автозагрузки пользовательских данных:", "Ошибка загрузки")
  })

  it("должен логировать загруженные данные", async () => {
    const { useAutoLoadUserData } = await import("@/features/media-studio/hooks")
    vi.mocked(useAutoLoadUserData).mockReturnValue({
      isLoading: false,
      loadedData: {
        media: 1,
        music: 1,
        effects: 0,
        transitions: 0,
        filters: 0,
        subtitles: 0,
        styleTemplates: 0,
      },
      error: null,
      reload: vi.fn(),
      clearCache: vi.fn(),
    })

    const consoleSpy = vi.spyOn(console, "log")

    render(<MediaStudio />)

    expect(consoleSpy).toHaveBeenCalledWith(
      "Загружены пользовательские данные:",
      expect.objectContaining({
        media: 1,
        music: 1,
      }),
    )
  })
})
