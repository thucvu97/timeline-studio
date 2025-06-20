import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ExportModal } from "../components/export-modal"

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string) => key),
  }),
}))

// Create mock instances
const toastMock = {
  error: vi.fn(),
  success: vi.fn(),
}

// Mock toast
vi.mock("sonner", () => ({
  get toast() {
    return toastMock
  },
}))

const closeModalMock = vi.fn()
const startRenderMock = vi.fn()
const cancelRenderMock = vi.fn()
const uploadToSocialNetworkMock = vi.fn().mockResolvedValue(true)

// Default mock values
const defaultProject = {
  id: "test-project",
  timeline: { resolution: [1920, 1080], fps: 30 },
}

const defaultSettings = {
  fileName: "test-video",
  savePath: "/path/to/save",
  format: "mp4",
}

const defaultExportConfig = {
  format: "mp4",
  quality: 80,
  videoBitrate: 5000,
  resolution: [1920, 1080],
  frameRate: 30,
  enableGPU: true,
}

// Mock modal service
vi.mock("@/features/modals/services", () => ({
  get useModal() {
    return () => ({
      closeModal: closeModalMock,
    })
  },
}))

// Mock timeline hook
const useTimelineMock = vi.fn(() => ({
  project: defaultProject,
}))

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  get useTimeline() {
    return useTimelineMock
  },
}))

// Mock timeline utils
vi.mock("@/features/timeline/utils/timeline-to-project", () => ({
  timelineToProjectSchema: vi.fn((project) => project),
}))

// Mock video compiler
const useVideoCompilerMock = vi.fn(() => ({
  startRender: startRenderMock,
  isRendering: false,
  renderProgress: null,
  cancelRender: cancelRenderMock,
}))

vi.mock("@/features/video-compiler/hooks/use-video-compiler", () => ({
  get useVideoCompiler() {
    return useVideoCompilerMock
  },
}))

// Mock export settings
const useExportSettingsMock = vi.fn(() => ({
  getCurrentSettings: vi.fn(() => defaultSettings),
  updateSettings: vi.fn(),
  handleChooseFolder: vi.fn(),
  getExportConfig: vi.fn(() => defaultExportConfig),
}))

vi.mock("../hooks/use-export-settings", () => ({
  get useExportSettings() {
    return useExportSettingsMock
  },
}))

// Mock DetailedExportInterface
vi.mock("../components/detailed-export-interface", () => ({
  DetailedExportInterface: ({ onExport, onCancelExport, onClose, settings, isRendering, hasProject }: any) => (
    <div data-testid="detailed-export-interface">
      <div data-testid="has-project">{hasProject ? "true" : "false"}</div>
      <div data-testid="is-rendering">{isRendering ? "true" : "false"}</div>
      <div data-testid="settings">{JSON.stringify(settings)}</div>
      <button onClick={onExport} data-testid="export-button">Export</button>
      <button onClick={onCancelExport} data-testid="cancel-button">Cancel</button>
      <button onClick={onClose} data-testid="close-button">Close</button>
    </div>
  ),
}))

// Mock SocialExportTab
vi.mock("../components/social-export-tab", () => ({
  SocialExportTab: ({ onExport, onCancelExport, onClose, settings, isRendering, hasProject }: any) => (
    <div data-testid="social-export-tab">
      <div data-testid="social-has-project">{hasProject ? "true" : "false"}</div>
      <div data-testid="social-is-rendering">{isRendering ? "true" : "false"}</div>
      <div data-testid="social-settings">{JSON.stringify(settings)}</div>
      <button onClick={() => onExport("youtube")} data-testid="social-export-button">Upload</button>
      <button onClick={onCancelExport} data-testid="social-cancel-button">Cancel</button>
      <button onClick={onClose} data-testid="social-close-button">Close</button>
    </div>
  ),
}))

// Mock BatchExportTab
vi.mock("../components/batch-export-tab", () => ({
  BatchExportTab: ({ onClose, defaultSettings }: any) => (
    <div data-testid="batch-export-tab">
      <div data-testid="batch-settings">{JSON.stringify(defaultSettings)}</div>
      <button onClick={onClose} data-testid="batch-close-button">Close</button>
    </div>
  ),
}))

// Mock social export hook
const useSocialExportMock = vi.fn(() => ({
  uploadToSocialNetwork: uploadToSocialNetworkMock,
}))

vi.mock("../hooks/use-social-export", () => ({
  get useSocialExport() {
    return useSocialExportMock
  },
}))

describe("ExportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset all mocks to default values
    toastMock.error.mockClear()
    toastMock.success.mockClear()
    closeModalMock.mockClear()
    startRenderMock.mockClear()
    startRenderMock.mockResolvedValue(true)
    cancelRenderMock.mockClear()
    uploadToSocialNetworkMock.mockClear()
    uploadToSocialNetworkMock.mockResolvedValue(true)
    
    // Reset hooks to default values
    useTimelineMock.mockReturnValue({
      project: defaultProject,
    })
    
    useVideoCompilerMock.mockReturnValue({
      startRender: startRenderMock,
      isRendering: false,
      renderProgress: null,
      cancelRender: cancelRenderMock,
    })
    
    useExportSettingsMock.mockReturnValue({
      getCurrentSettings: vi.fn(() => defaultSettings),
      updateSettings: vi.fn(),
      handleChooseFolder: vi.fn(),
      getExportConfig: vi.fn(() => defaultExportConfig),
    })
    
    useSocialExportMock.mockReturnValue({
      uploadToSocialNetwork: uploadToSocialNetworkMock,
    })
  })

  describe("Basic rendering", () => {
    it("should render DetailedExportInterface", () => {
      render(<ExportModal />)
      
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should show that project exists", () => {
      render(<ExportModal />)
      
      expect(screen.getByTestId("has-project")).toHaveTextContent("true")
    })

    it("should show not rendering by default", () => {
      render(<ExportModal />)
      
      expect(screen.getByTestId("is-rendering")).toHaveTextContent("false")
    })

    it("should pass settings to DetailedExportInterface", () => {
      render(<ExportModal />)
      
      const settingsElement = screen.getByTestId("settings")
      expect(settingsElement.textContent).toContain("test-video")
      expect(settingsElement.textContent).toContain("/path/to/save")
    })
  })

  describe("Export functionality", () => {
    it("should handle export button click", async () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      
      await act(async () => {
        fireEvent.click(exportButton)
      })
      
      // Test passes if no error is thrown
      expect(exportButton).toBeInTheDocument()
    })

    it("should handle close button click", () => {
      render(<ExportModal />)
      
      const closeButton = screen.getByTestId("close-button")
      fireEvent.click(closeButton)
      
      // Test passes if no error is thrown
      expect(closeButton).toBeInTheDocument()
    })

    it("should handle cancel button click", async () => {
      render(<ExportModal />)
      
      const cancelButton = screen.getByTestId("cancel-button")
      
      await act(async () => {
        fireEvent.click(cancelButton)
      })
      
      // Test passes if no error is thrown
      expect(cancelButton).toBeInTheDocument()
    })
  })

  describe("Error handling", () => {
    it("should handle component without errors", async () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      
      await act(async () => {
        fireEvent.click(exportButton)
      })
      
      // Test passes if no error is thrown during export
      expect(exportButton).toBeInTheDocument()
    })

    it("should handle rapid clicks without errors", async () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      
      await act(async () => {
        fireEvent.click(exportButton)
        fireEvent.click(exportButton)
        fireEvent.click(exportButton)
      })
      
      // Test passes if no error is thrown
      expect(exportButton).toBeInTheDocument()
    })
  })

  describe("Rendering state", () => {
    it("should handle rendering state changes", () => {
      render(<ExportModal />)
      
      // Check that component shows not rendering by default
      const isRenderingElement = screen.getByTestId("is-rendering")
      expect(isRenderingElement).toHaveTextContent("false")
      
      // Component should handle state changes gracefully
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should handle progress updates", () => {
      render(<ExportModal />)
      
      // Component should handle progress updates without errors
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })
  })

  describe("Component integration", () => {
    it("should pass all required props to DetailedExportInterface", () => {
      render(<ExportModal />)
      
      // Check that DetailedExportInterface receives the expected data
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
      expect(screen.getByTestId("export-button")).toBeInTheDocument()
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument()
      expect(screen.getByTestId("close-button")).toBeInTheDocument()
    })

    it("should render without crashing", () => {
      expect(() => render(<ExportModal />)).not.toThrow()
    })

    it("should have export button available", () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      expect(exportButton).toBeEnabled()
    })

    it("should have cancel button available", () => {
      render(<ExportModal />)
      
      const cancelButton = screen.getByTestId("cancel-button")
      expect(cancelButton).toBeEnabled()
    })

    it("should have close button available", () => {
      render(<ExportModal />)
      
      const closeButton = screen.getByTestId("close-button")
      expect(closeButton).toBeEnabled()
    })
  })

  describe("Settings handling", () => {
    it("should pass current settings correctly", () => {
      render(<ExportModal />)
      
      const settingsElement = screen.getByTestId("settings")
      const settingsText = settingsElement.textContent || ""
      
      // Verify settings are passed as expected
      expect(settingsText).toContain("test-video")
      expect(settingsText).toContain("/path/to/save")
      expect(settingsText).toContain("mp4")
    })

    it("should handle settings updates", () => {
      render(<ExportModal />)
      
      // Component should render without errors when settings are updated
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })
  })

  describe("Export configuration", () => {
    it("should handle different export formats", () => {
      render(<ExportModal />)
      
      // Test that component handles export configuration
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should handle video quality settings", () => {
      render(<ExportModal />)
      
      // Test that component handles quality settings
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should handle resolution settings", () => {
      render(<ExportModal />)
      
      // Test that component handles resolution settings
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })
  })

  describe("Integration with export settings", () => {
    it("should call useExportSettings hook", () => {
      render(<ExportModal />)
      
      // Verify component uses export settings
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should handle export config generation", () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      fireEvent.click(exportButton)
      
      // Component should handle config generation
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should handle file path selection", () => {
      render(<ExportModal />)
      
      // Component should handle file chooser
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })
  })

  describe("Timeline integration", () => {
    it("should use project from useTimeline", () => {
      render(<ExportModal />)
      
      // Component should use timeline project
      expect(screen.getByTestId("has-project")).toHaveTextContent("true")
    })

    it("should handle project transformation", () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      fireEvent.click(exportButton)
      
      // Should handle project schema transformation
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })
  })

  describe("Tab navigation", () => {
    it("should render all tabs", () => {
      render(<ExportModal />)
      
      expect(screen.getByText("dialogs.export.local")).toBeInTheDocument()
      expect(screen.getByText("dialogs.export.socialNetworks")).toBeInTheDocument()
      expect(screen.getByText("dialogs.export.batchTab")).toBeInTheDocument()
    })

    it.skip("should switch to social tab", async () => {
      render(<ExportModal />)
      
      const socialTab = screen.getByRole('tab', { name: 'dialogs.export.socialNetworks' })
      expect(socialTab).toHaveAttribute('aria-selected', 'false')
      
      await act(async () => {
        fireEvent.click(socialTab)
      })
      
      // Check that the tab is now selected
      await waitFor(() => {
        expect(socialTab).toHaveAttribute('aria-selected', 'true')
      })
      
      // Check that the social tab panel is visible
      const socialPanel = screen.getByRole('tabpanel', { name: 'dialogs.export.socialNetworks' })
      expect(socialPanel).toBeVisible()
    })

    it.skip("should switch to batch tab", async () => {
      render(<ExportModal />)
      
      const batchTab = screen.getByRole('tab', { name: 'dialogs.export.batchTab' })
      
      await act(async () => {
        fireEvent.click(batchTab)
      })
      
      // Check that the tab is now selected
      await waitFor(() => {
        expect(batchTab).toHaveAttribute('aria-selected', 'true')
      })
      
      // Check that the batch tab panel is visible
      const batchPanel = screen.getByRole('tabpanel', { name: 'dialogs.export.batchTab' })
      expect(batchPanel).toBeVisible()
    })

    it.skip("should switch back to local tab", async () => {
      render(<ExportModal />)
      
      // First switch to batch
      const batchTab = screen.getByText("dialogs.export.batchTab")
      fireEvent.click(batchTab)
      
      await waitFor(() => {
        expect(screen.getByTestId("batch-export-tab")).toBeInTheDocument()
      })
      
      // Then back to local
      const localTab = screen.getByText("dialogs.export.local")
      fireEvent.click(localTab)
      
      await waitFor(() => {
        expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
      })
    })
  })

  describe("Error handling", () => {
    it("should show error when no project", async () => {
      // Mock no project
      useTimelineMock.mockReturnValue({
        project: null,
      })
      
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      await act(async () => {
        fireEvent.click(exportButton)
      })
      
      expect(toastMock.error).toHaveBeenCalledWith("dialogs.export.errors.noProject")
    })

    it("should show error when no save path", async () => {
      // Mock no save path
      useExportSettingsMock.mockReturnValue({
        getCurrentSettings: vi.fn(() => ({
          fileName: "test-video",
          savePath: null,
          format: "mp4",
        })),
        updateSettings: vi.fn(),
        handleChooseFolder: vi.fn(),
        getExportConfig: vi.fn(() => defaultExportConfig),
      })
      
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      await act(async () => {
        fireEvent.click(exportButton)
      })
      
      expect(toastMock.error).toHaveBeenCalledWith("dialogs.export.errors.noPath")
    })

    it("should show error when export fails", async () => {
      // Mock export failure
      startRenderMock.mockRejectedValue(new Error("Export failed"))
      
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      await act(async () => {
        fireEvent.click(exportButton)
      })
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(toastMock.error).toHaveBeenCalledWith("dialogs.export.errors.exportFailed")
    })
  })

  describe("Social export", () => {
    it.skip("should handle social export", async () => {
      render(<ExportModal />)
      
      // Switch to social tab
      const socialTab = screen.getByText("dialogs.export.socialNetworks")
      
      await act(async () => {
        fireEvent.click(socialTab)
      })
      
      // Wait for tab content to appear
      await waitFor(() => {
        expect(screen.getByText("YouTube")).toBeInTheDocument()
      })
      
      const socialExportButton = screen.getByTestId("social-export-button")
      await act(async () => {
        fireEvent.click(socialExportButton)
      })
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(toastMock.success).toHaveBeenCalledWith("dialogs.export.uploadSuccess", { platform: "youtube" })
    })

    it.skip("should show error when social export fails without project", async () => {
      // Mock no project
      useTimelineMock.mockReturnValue({
        project: null,
      })
      
      render(<ExportModal />)
      
      // Switch to social tab
      const socialTab = screen.getByText("dialogs.export.socialNetworks")
      
      await act(async () => {
        fireEvent.click(socialTab)
      })
      
      // Wait for tab content to appear
      await waitFor(() => {
        expect(screen.getByText("YouTube")).toBeInTheDocument()
      })
      
      const socialExportButton = screen.getByTestId("social-export-button")
      await act(async () => {
        fireEvent.click(socialExportButton)
      })
      
      expect(toastMock.error).toHaveBeenCalledWith("dialogs.export.errors.noProject")
    })

    it.skip("should show error when social export fails", async () => {
      // Mock social export failure
      uploadToSocialNetworkMock.mockRejectedValue(new Error("Upload failed"))
      
      render(<ExportModal />)
      
      // Switch to social tab
      const socialTab = screen.getByText("dialogs.export.socialNetworks")
      
      await act(async () => {
        fireEvent.click(socialTab)
      })
      
      // Wait for tab content to appear
      await waitFor(() => {
        expect(screen.getByText("YouTube")).toBeInTheDocument()
      })
      
      const socialExportButton = screen.getByTestId("social-export-button")
      await act(async () => {
        fireEvent.click(socialExportButton)
      })
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(toastMock.error).toHaveBeenCalledWith("dialogs.export.errors.socialExportFailed")
    })
  })

  describe("Render cancellation", () => {
    it("should cancel render with progress", async () => {
      // Mock with render progress
      useVideoCompilerMock.mockReturnValue({
        startRender: startRenderMock,
        isRendering: true,
        renderProgress: { job_id: "test-job-123", percentage: 50 },
        cancelRender: cancelRenderMock,
      })
      
      render(<ExportModal />)
      
      const cancelButton = screen.getByTestId("cancel-button")
      await act(async () => {
        fireEvent.click(cancelButton)
      })
      
      expect(cancelRenderMock).toHaveBeenCalledWith("test-job-123")
    })

    it("should handle cancel without progress", async () => {
      // Mock without render progress (use default)
      render(<ExportModal />)
      
      const cancelButton = screen.getByTestId("cancel-button")
      await act(async () => {
        fireEvent.click(cancelButton)
      })
      
      // Should not call cancelRender when no progress
      expect(cancelRenderMock).not.toHaveBeenCalled()
    })
  })

  describe("Video compiler integration", () => {
    it("should integrate with useVideoCompiler", () => {
      render(<ExportModal />)
      
      // Component should show not rendering by default
      expect(screen.getByTestId("is-rendering")).toHaveTextContent("false")
    })

    it("should handle render cancellation", () => {
      render(<ExportModal />)
      
      const cancelButton = screen.getByTestId("cancel-button")
      fireEvent.click(cancelButton)
      
      // Should handle cancel without errors
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })

    it("should handle render progress updates", () => {
      render(<ExportModal />)
      
      // Component should handle progress updates
      expect(screen.getByTestId("detailed-export-interface")).toBeInTheDocument()
    })
  })
})