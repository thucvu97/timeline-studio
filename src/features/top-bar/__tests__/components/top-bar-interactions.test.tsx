import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TopBar } from "../../components/top-bar"

// Тесты взаимодействий для TopBar

const mockOpenModal = vi.fn()
const mockToggleBrowserVisibility = vi.fn()
const mockToggleTimelineVisibility = vi.fn()
const mockToggleOptionsVisibility = vi.fn()
const mockSaveProject = vi.fn()
const mockOpenProject = vi.fn()
const mockSetProjectDirty = vi.fn()
const mockCreateNewProject = vi.fn()

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
    toggleTimelineVisibility: mockToggleTimelineVisibility,
    isOptionsVisible: true,
    toggleOptionsVisibility: mockToggleOptionsVisibility,
  }),
}))

vi.mock("@/features/app-state/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    currentProject: {
      name: "Test Project",
      path: "/test/project.json",
      isDirty: true,
    },
    saveProject: mockSaveProject,
    openProject: mockOpenProject,
    setProjectDirty: mockSetProjectDirty,
    createNewProject: mockCreateNewProject,
  }),
}))

vi.mock("@/features/app-state/hooks/use-app-settings", () => ({
  useAppSettings: () => ({
    appVersion: "1.0.0",
    updateAvailable: false,
    checkForUpdates: vi.fn(),
  }),
}))

describe("TopBar Interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should handle panel visibility toggles", () => {
    render(<TopBar />)

    // Browser toggle
    const browserToggle = screen.getByRole("button", { name: "PanelLeftClose" })
    fireEvent.click(browserToggle)
    expect(mockToggleBrowserVisibility).toHaveBeenCalled()

    // Timeline toggle
    const timelineToggle = screen.getByRole("button", { name: "PanelBottomClose" })
    fireEvent.click(timelineToggle)
    expect(mockToggleTimelineVisibility).toHaveBeenCalled()

    // Options toggle
    const optionsToggle = screen.getByRole("button", { name: "PanelRightClose" })
    fireEvent.click(optionsToggle)
    expect(mockToggleOptionsVisibility).toHaveBeenCalled()
  })

  it("should handle modal opening interactions", () => {
    render(<TopBar />)

    // Keyboard shortcuts
    fireEvent.click(screen.getByTestId("keyboard-shortcuts-button"))
    expect(mockOpenModal).toHaveBeenCalledWith("keyboard-shortcuts")

    // User settings
    fireEvent.click(screen.getByTestId("user-settings-button"))
    expect(mockOpenModal).toHaveBeenCalledWith("user-settings")

    // Project settings
    fireEvent.click(screen.getByTestId("project-settings-button"))
    expect(mockOpenModal).toHaveBeenCalledWith("project-settings")

    // Camera capture
    fireEvent.click(screen.getByTestId("camera-capture-button"))
    expect(mockOpenModal).toHaveBeenCalledWith("camera-capture")

    // Voice recording
    fireEvent.click(screen.getByTestId("voice-recording-button"))
    expect(mockOpenModal).toHaveBeenCalledWith("voice-recording")

    // Export
    fireEvent.click(screen.getByTestId("export-button"))
    expect(mockOpenModal).toHaveBeenCalledWith("export")
  })

  it("should handle project operations", () => {
    render(<TopBar />)

    // Save project
    fireEvent.click(screen.getByTestId("save-button"))
    expect(mockSaveProject).toHaveBeenCalled()

    // Open project
    fireEvent.click(screen.getByTestId("open-project-button"))
    expect(mockOpenProject).toHaveBeenCalled()
  })

  it("should handle project name editing", () => {
    render(<TopBar />)

    // Click on project name to edit
    const projectNameContainer = screen.getByText("Test Project").parentElement
    fireEvent.click(projectNameContainer!)

    // Should show input field
    const input = screen.getByDisplayValue("Test Project")
    expect(input).toBeInTheDocument()

    // Change the name
    fireEvent.change(input, { target: { value: "New Project Name" } })
    expect(mockSetProjectDirty).toHaveBeenCalledWith(true)

    // Press Enter to finish editing
    fireEvent.keyDown(input, { key: "Enter" })
    expect(screen.queryByDisplayValue("New Project Name")).not.toBeInTheDocument()
  })

  it("should show project name in display mode initially", () => {
    render(<TopBar />)

    expect(screen.getByText("Test Project")).toBeInTheDocument()
    expect(screen.queryByDisplayValue("Test Project")).not.toBeInTheDocument()
  })

  it("should render all required UI components", () => {
    render(<TopBar />)

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("gpu-status-badge")).toBeInTheDocument()
    expect(screen.getByTestId("render-jobs-dropdown")).toBeInTheDocument()
    expect(screen.getByTestId("layout-button")).toBeInTheDocument()
  })

  it("should handle multiple rapid interactions", () => {
    render(<TopBar />)

    const saveButton = screen.getByTestId("save-button")

    // Multiple clicks
    fireEvent.click(saveButton)
    fireEvent.click(saveButton)
    fireEvent.click(saveButton)

    expect(mockSaveProject).toHaveBeenCalledTimes(3)
  })

  it("should maintain state across interactions", () => {
    render(<TopBar />)

    // Perform multiple operations
    fireEvent.click(screen.getByTestId("user-settings-button"))
    fireEvent.click(screen.getByTestId("save-button"))
    fireEvent.click(screen.getByRole("button", { name: "PanelLeftClose" }))

    // All should have been called
    expect(mockOpenModal).toHaveBeenCalledWith("user-settings")
    expect(mockSaveProject).toHaveBeenCalled()
    expect(mockToggleBrowserVisibility).toHaveBeenCalled()
  })

  it("should handle keyboard interactions on project name", () => {
    render(<TopBar />)

    // Start editing
    const projectNameContainer = screen.getByText("Test Project").parentElement
    fireEvent.click(projectNameContainer!)

    const input = screen.getByDisplayValue("Test Project")

    // Test blur to finish editing
    fireEvent.blur(input)
    expect(screen.queryByDisplayValue("Test Project")).not.toBeInTheDocument()
  })
})
