import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TopBar } from "./top-bar"

// Используем мок для TopBar из src/test/setup.ts

// Мокаем модули
const mockOpenModal = vi.fn()
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: mockOpenModal,
  }),
}))

// Mock useTimeline hook
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    createProject: vi.fn(),
    project: null,
    uiState: {},
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    error: null,
    lastAction: null,
    isReady: true,
    isSaving: false,
  }),
}))

vi.mock("@/features/media-studio", () => ({
  LayoutPreviews: () => <div data-testid="layout-previews">Layout Previews</div>,
}))

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle-component">Theme Toggle</div>,
}))

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    isBrowserVisible: true,
    toggleBrowserVisibility: vi.fn(),
    isTimelineVisible: true,
    toggleTimelineVisibility: vi.fn(),
    isOptionsVisible: true,
    toggleOptionsVisibility: vi.fn(),
    activeTab: "media",
    layoutMode: "default",
    playerScreenshotsPath: "",
    screenshotsPath: "",
    openAiApiKey: "",
    claudeApiKey: "",
    handleTabChange: vi.fn(),
    handleLayoutChange: vi.fn(),
    handleScreenshotsPathChange: vi.fn(),
    handlePlayerScreenshotsPathChange: vi.fn(),
    handleAiApiKeyChange: vi.fn(),
    handleClaudeApiKeyChange: vi.fn(),
  }),
}))

// Мокаем useCurrentProject и useAppSettings
vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      name: "Test Project",
      path: "/test/project.json",
      isDirty: false,
    },
    setCurrentProject: vi.fn(),
    createNewProject: vi.fn(),
    saveProject: vi.fn(),
    openProject: vi.fn(),
    setProjectDirty: vi.fn(),
    saveProjectAs: vi.fn(),
    loadProject: vi.fn(),
  }),
}))

vi.mock("@/features/app-state/hooks/use-app-settings", () => ({
  useAppSettings: () => ({
    appVersion: "1.0.0",
    updateAvailable: false,
    checkForUpdates: vi.fn(),
  }),
}))

// Мок уже определен в src/test/setup.ts
// Мокаем console.log для проверки вызова
vi.spyOn(console, "log").mockImplementation(() => {})

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correctly", () => {
    render(<TopBar />)

    // Проверяем, что основные элементы отображаются по их data-testid
    expect(screen.getByTestId("layout-button")).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("keyboard-shortcuts-button")).toBeInTheDocument()
    expect(screen.getByTestId("project-settings-button")).toBeInTheDocument()
    expect(screen.getByTestId("save-button")).toBeInTheDocument()
  })

  it("renders additional buttons correctly", () => {
    render(<TopBar />)

    // Проверяем, что дополнительные кнопки отображаются
    expect(screen.getByTestId("camera-capture-button")).toBeInTheDocument()
    expect(screen.getByTestId("voice-recording-button")).toBeInTheDocument()
    expect(screen.getByTestId("publish-button")).toBeInTheDocument()
    expect(screen.getByTestId("open-project-button")).toBeInTheDocument()
    expect(screen.getByTestId("user-settings-button")).toBeInTheDocument()
    expect(screen.getByTestId("export-button")).toBeInTheDocument()
  })

  it("renders keyboard shortcuts button", () => {
    render(<TopBar />)

    // Находим кнопку для открытия модального окна
    const keyboardShortcutsButton = screen.getByTestId("keyboard-shortcuts-button")

    // Проверяем, что кнопка отображается
    expect(keyboardShortcutsButton).toBeInTheDocument()
    // Кнопка содержит только иконку, без текста
    expect(keyboardShortcutsButton.querySelector('[data-icon="Keyboard"]')).toBeInTheDocument()
  })

  it("renders at least 10 buttons", () => {
    render(<TopBar />)

    // Находим все кнопки по data-testid
    const buttons = [
      screen.getByTestId("layout-button"),
      screen.getByTestId("keyboard-shortcuts-button"),
      screen.getByTestId("project-settings-button"),
      screen.getByTestId("save-button"),
      screen.getByTestId("camera-capture-button"),
      screen.getByTestId("voice-recording-button"),
      screen.getByTestId("publish-button"),
      screen.getByTestId("open-project-button"),
      screen.getByTestId("user-settings-button"),
      screen.getByTestId("export-button"),
    ]

    // Проверяем, что есть хотя бы 10 кнопок
    expect(buttons.length).toBeGreaterThanOrEqual(10)
  })
})
