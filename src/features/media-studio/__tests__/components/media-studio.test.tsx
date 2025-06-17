import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaStudio } from "../../components/media-studio"

// Мокаем зависимости
vi.mock("@/features/media-studio/hooks", () => ({
  useAutoLoadUserData: vi.fn(() => ({
    isLoading: false,
    loadedData: {
      media: [],
      music: [],
      effects: [],
      transitions: [],
      filters: [],
      subtitles: [],
      templates: [],
      styleTemplates: [],
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
}))

vi.mock("@/features/top-bar/components/top-bar", () => ({
  TopBar: () => <div data-testid="top-bar">TopBar</div>,
}))

vi.mock("@/features/modals/components", () => ({
  ModalContainer: () => <div data-testid="modal-container">ModalContainer</div>,
}))

vi.mock("../../components/layout", () => ({
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
        media: [],
        music: [],
        effects: [],
        transitions: [],
        filters: [],
        subtitles: [],
        templates: [],
        styleTemplates: [],
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
        media: [],
        music: [],
        effects: [],
        transitions: [],
        filters: [],
        subtitles: [],
        templates: [],
        styleTemplates: [],
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
        media: ["/path/to/video.mp4"],
        music: ["/path/to/music.mp3"],
        effects: [],
        transitions: [],
        filters: [],
        subtitles: [],
        templates: [],
        styleTemplates: [],
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
        media: ["/path/to/video.mp4"],
        music: ["/path/to/music.mp3"],
      }),
    )
  })
})
