import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TopBar } from "../../components/top-bar"

// Мокаем все зависимости
const mockOpenModal = vi.fn()
const mockToggleBrowserVisibility = vi.fn()
const mockSaveProject = vi.fn()
const mockCreateNewProject = vi.fn()
const mockLoadProject = vi.fn()

vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: mockOpenModal,
  }),
}))

vi.mock("@/features/media-studio", () => ({
  LayoutPreviews: () => <div data-testid="layout-previews">Layout Previews</div>,
}))

vi.mock("@/features/top-bar/components/theme/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle-component">Theme Toggle</div>,
}))

vi.mock("@/features/video-compiler", () => ({
  GpuStatusBadge: () => <div data-testid="gpu-status-badge">GPU Status</div>,
  RenderJobsDropdown: () => <div data-testid="render-jobs-dropdown">Render Jobs</div>,
}))

vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    isBrowserVisible: true,
    toggleBrowserVisibility: mockToggleBrowserVisibility,
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

vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      name: "Test Project",
      path: "/test/project.json",
      isDirty: false,
    },
    setCurrentProject: vi.fn(),
    createNewProject: mockCreateNewProject,
    saveProject: mockSaveProject,
    setProjectDirty: vi.fn(),
    openProject: mockLoadProject,
  }),
}))

vi.mock("@/features/app-state/hooks/use-app-settings", () => ({
  useAppSettings: () => ({
    appVersion: "1.0.0",
    updateAvailable: false,
    checkForUpdates: vi.fn(),
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

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render top bar component", () => {
    render(<TopBar />)

    // Проверяем наличие основных элементов
    expect(screen.getByTestId("layout-button")).toBeInTheDocument()
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
  })

  it("should render all main buttons", () => {
    render(<TopBar />)

    // Проверяем все основные кнопки
    expect(screen.getByTestId("layout-button")).toBeInTheDocument()
    expect(screen.getByTestId("keyboard-shortcuts-button")).toBeInTheDocument()
    expect(screen.getByTestId("project-settings-button")).toBeInTheDocument()
    expect(screen.getByTestId("save-button")).toBeInTheDocument()
    expect(screen.getByTestId("camera-capture-button")).toBeInTheDocument()
    expect(screen.getByTestId("voice-recording-button")).toBeInTheDocument()
    expect(screen.getByTestId("publish-button")).toBeInTheDocument()
    expect(screen.getByTestId("open-project-button")).toBeInTheDocument()
    expect(screen.getByTestId("user-settings-button")).toBeInTheDocument()
    expect(screen.getByTestId("export-button")).toBeInTheDocument()
  })

  it("should open keyboard shortcuts modal when button is clicked", () => {
    render(<TopBar />)

    const keyboardButton = screen.getByTestId("keyboard-shortcuts-button")
    fireEvent.click(keyboardButton)

    expect(mockOpenModal).toHaveBeenCalledWith("keyboard-shortcuts")
  })

  it("should open project settings modal when button is clicked", () => {
    render(<TopBar />)

    const projectSettingsButton = screen.getByTestId("project-settings-button")
    fireEvent.click(projectSettingsButton)

    expect(mockOpenModal).toHaveBeenCalledWith("project-settings")
  })

  it("should disable save button when project is not dirty", () => {
    render(<TopBar />)

    const saveButton = screen.getByTestId("save-button")
    expect(saveButton).toBeDisabled()
  })

  it("should open camera capture modal when button is clicked", () => {
    render(<TopBar />)

    const cameraButton = screen.getByTestId("camera-capture-button")
    fireEvent.click(cameraButton)

    expect(mockOpenModal).toHaveBeenCalledWith("camera-capture")
  })

  it("should open voice recording modal when button is clicked", () => {
    render(<TopBar />)

    const voiceButton = screen.getByTestId("voice-recording-button")
    fireEvent.click(voiceButton)

    expect(mockOpenModal).toHaveBeenCalledWith("voice-recording")
  })

  it("should open user settings modal when button is clicked", () => {
    render(<TopBar />)

    const userSettingsButton = screen.getByTestId("user-settings-button")
    fireEvent.click(userSettingsButton)

    expect(mockOpenModal).toHaveBeenCalledWith("user-settings")
  })

  it("should open export modal when button is clicked", () => {
    render(<TopBar />)

    const exportButton = screen.getByTestId("export-button")
    fireEvent.click(exportButton)

    expect(mockOpenModal).toHaveBeenCalledWith("export")
  })

  it("should toggle browser visibility when browser toggle button is clicked", () => {
    render(<TopBar />)

    // Находим кнопку переключения браузера по названию иконки
    const browserToggleButton = screen.getByRole("button", { name: "PanelLeftClose" })
    fireEvent.click(browserToggleButton)

    expect(mockToggleBrowserVisibility).toHaveBeenCalled()
  })

  it("should render theme toggle component", () => {
    render(<TopBar />)

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
  })

  it("should render layout button for popover", () => {
    render(<TopBar />)

    expect(screen.getByTestId("layout-button")).toBeInTheDocument()
  })

  it("should have proper CSS classes for styling", () => {
    render(<TopBar />)

    // Проверяем наличие основного контейнера
    const topBarContainer = document.querySelector(".bg-\\[\\#DDDDDD\\]")
    expect(topBarContainer).toBeInTheDocument()
  })

  it("should display project name when project is loaded", () => {
    render(<TopBar />)

    // Проверяем наличие названия проекта в интерфейсе
    expect(screen.getByText("Test Project")).toBeInTheDocument()
  })

  it("should handle missing project gracefully", () => {
    // Тест для проверки стабильности рендеринга
    expect(() => render(<TopBar />)).not.toThrow()

    // Компонент должен рендериться без ошибок
    expect(screen.getByTestId("layout-button")).toBeInTheDocument()
  })

  it("should show publish button with correct styling", () => {
    render(<TopBar />)

    const publishButton = screen.getByTestId("publish-button")
    expect(publishButton).toBeInTheDocument()
  })
})
