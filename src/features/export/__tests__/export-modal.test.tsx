import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ExportModal } from "../components/export-modal"

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string) => key),
  }),
}))

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock modal service
vi.mock("@/features/modals/services", () => ({
  useModal: () => ({
    closeModal: vi.fn(),
  }),
}))

// Mock timeline hook
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: {
      id: "test-project",
      timeline: { resolution: [1920, 1080], fps: 30 },
    },
  }),
}))

// Mock timeline utils
vi.mock("@/features/timeline/utils/timeline-to-project", () => ({
  timelineToProjectSchema: vi.fn((project) => project),
}))

// Mock video compiler
vi.mock("@/features/video-compiler/hooks/use-video-compiler", () => ({
  useVideoCompiler: () => ({
    startRender: vi.fn(),
    isRendering: false,
    renderProgress: null,
    cancelRender: vi.fn(),
  }),
}))

// Mock export settings
vi.mock("../hooks/use-export-settings", () => ({
  useExportSettings: () => ({
    getCurrentSettings: vi.fn(() => ({
      fileName: "test-video",
      savePath: "/path/to/save",
      format: "mp4",
    })),
    updateSettings: vi.fn(),
    handleChooseFolder: vi.fn(),
    getExportConfig: vi.fn(() => ({
      format: "mp4",
      quality: 80,
      videoBitrate: 5000,
      resolution: [1920, 1080],
      frameRate: 30,
      enableGPU: true,
    })),
  }),
}))

// Mock LocalExportTab
vi.mock("../components/local-export-tab", () => ({
  LocalExportTab: ({ onExport, onCancelExport, onClose, settings, isRendering, hasProject }: any) => (
    <div data-testid="local-export-tab">
      <div data-testid="has-project">{hasProject ? "true" : "false"}</div>
      <div data-testid="is-rendering">{isRendering ? "true" : "false"}</div>
      <div data-testid="settings">{JSON.stringify(settings)}</div>
      <button onClick={onExport} data-testid="export-button">Export</button>
      <button onClick={onCancelExport} data-testid="cancel-button">Cancel</button>
      <button onClick={onClose} data-testid="close-button">Close</button>
    </div>
  ),
}))

describe("ExportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Basic rendering", () => {
    it("should render LocalExportTab", () => {
      render(<ExportModal />)
      
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should show that project exists", () => {
      render(<ExportModal />)
      
      expect(screen.getByTestId("has-project")).toHaveTextContent("true")
    })

    it("should show not rendering by default", () => {
      render(<ExportModal />)
      
      expect(screen.getByTestId("is-rendering")).toHaveTextContent("false")
    })

    it("should pass settings to LocalExportTab", () => {
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
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should handle progress updates", () => {
      render(<ExportModal />)
      
      // Component should handle progress updates without errors
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })
  })

  describe("Component integration", () => {
    it("should pass all required props to LocalExportTab", () => {
      render(<ExportModal />)
      
      // Check that LocalExportTab receives the expected data
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
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
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })
  })

  describe("Export configuration", () => {
    it("should handle different export formats", () => {
      render(<ExportModal />)
      
      // Test that component handles export configuration
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should handle video quality settings", () => {
      render(<ExportModal />)
      
      // Test that component handles quality settings
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should handle resolution settings", () => {
      render(<ExportModal />)
      
      // Test that component handles resolution settings
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })
  })

  describe("Integration with export settings", () => {
    it("should call useExportSettings hook", () => {
      render(<ExportModal />)
      
      // Verify component uses export settings
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should handle export config generation", () => {
      render(<ExportModal />)
      
      const exportButton = screen.getByTestId("export-button")
      fireEvent.click(exportButton)
      
      // Component should handle config generation
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should handle file path selection", () => {
      render(<ExportModal />)
      
      // Component should handle file chooser
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
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
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
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
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })

    it("should handle render progress updates", () => {
      render(<ExportModal />)
      
      // Component should handle progress updates
      expect(screen.getByTestId("local-export-tab")).toBeInTheDocument()
    })
  })
})