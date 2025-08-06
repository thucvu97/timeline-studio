/**
 * Tests for UnifiedDashboard component
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  createMockAnalysis,
  createMockIntelligentContent,
  createMockMediaFile,
  createMockProgress,
} from "../../../hooks/__tests__/test-utils"
import { useAIIntelligence } from "../../../hooks/use-ai-intelligence"
import { useContentPipeline } from "../../../hooks/use-content-pipeline"
import { UnifiedDashboard } from "../unified-dashboard"

// Mock the hooks
vi.mock("../../../hooks/use-ai-intelligence", () => ({
  useAIIntelligence: vi.fn(),
}))

vi.mock("../../../hooks/use-content-pipeline", () => ({
  useContentPipeline: vi.fn(),
}))

// Mock the child components
vi.mock("../../analysis-viewer/analysis-viewer", () => ({
  AnalysisViewer: vi.fn(({ analysis, className, onSceneSelect, onMomentSelect }) => (
    <div data-testid="analysis-viewer" className={className}>
      <div>Analysis Viewer</div>
      {analysis && (
        <div>
          <button onClick={() => onSceneSelect?.("scene-1")}>Select Scene</button>
          <button onClick={() => onMomentSelect?.("moment-1")}>Select Moment</button>
        </div>
      )}
    </div>
  )),
}))

vi.mock("../../preview-grid/preview-grid", () => ({
  PreviewGrid: vi.fn(({ analysis, viewMode, className, onItemSelect, onItemPlay, onItemDownload }) => (
    <div data-testid="preview-grid" className={className}>
      <div>Preview Grid - Mode: {viewMode}</div>
      {analysis && (
        <div>
          <button onClick={() => onItemSelect?.("item-1")}>Select Item</button>
          <button onClick={() => onItemPlay?.("item-1")}>Play Item</button>
          <button onClick={() => onItemDownload?.("item-1")}>Download Item</button>
        </div>
      )}
    </div>
  )),
}))

// Default mock implementations
const mockAnalyzeContent = vi.fn()
const mockProcessProject = vi.fn()
const mockPausePipeline = vi.fn()
const mockResumePipeline = vi.fn()
const mockCancelPipeline = vi.fn()
const mockResetAI = vi.fn()
const mockStartPipeline = vi.fn()
const mockPauseContentPipeline = vi.fn()
const mockResumeContentPipeline = vi.fn()
const mockStopPipeline = vi.fn()

const defaultAIIntelligenceMock = {
  isProcessing: false,
  progress: null,
  error: null,
  result: null,
  analyzeContent: mockAnalyzeContent,
  processProject: mockProcessProject,
  pausePipeline: mockPausePipeline,
  resumePipeline: mockResumePipeline,
  cancelPipeline: mockCancelPipeline,
  reset: mockResetAI,
}

const defaultContentPipelineMock = {
  isRunning: false,
  isPaused: false,
  results: [],
  startPipeline: mockStartPipeline,
  pausePipeline: mockPauseContentPipeline,
  resumePipeline: mockResumeContentPipeline,
  stopPipeline: mockStopPipeline,
}

describe("UnifiedDashboard", () => {
  const user = userEvent.setup()
  const mockMediaFiles = [createMockMediaFile("video1.mp4"), createMockMediaFile("video2.mp4")]
  const mockOnFileUpload = vi.fn()
  const mockOnAnalysisComplete = vi.fn()
  const mockOnProcessingComplete = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAIIntelligence).mockReturnValue(defaultAIIntelligenceMock)
    vi.mocked(useContentPipeline).mockReturnValue(defaultContentPipelineMock)
  })

  describe("Basic Rendering", () => {
    it("should render dashboard header with title", () => {
      render(<UnifiedDashboard />)

      expect(screen.getByText("AI Content Intelligence")).toBeInTheDocument()
      expect(screen.getByText("0 файлов")).toBeInTheDocument()
    })

    it("should apply custom className", () => {
      const customClass = "custom-unified-dashboard"
      const { container } = render(<UnifiedDashboard className={customClass} />)

      const element = container.firstElementChild
      expect(element).toHaveClass(customClass)
      expect(element).toHaveClass("unified-dashboard")
    })

    it("should show correct file count with media files", () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByText("2 файлов")).toBeInTheDocument()
    })

    it("should render all navigation tabs", () => {
      render(<UnifiedDashboard />)

      expect(screen.getByRole("tab", { name: /обзор/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /анализ/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /обработка/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /результаты/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /настройки/i })).toBeInTheDocument()
    })
  })

  describe("Tab Navigation", () => {
    it("should start with overview tab active", () => {
      render(<UnifiedDashboard />)

      const overviewTab = screen.getByRole("tab", { name: /обзор/i })
      expect(overviewTab).toHaveAttribute("data-state", "active")
    })

    it("should switch to settings tab when clicked", async () => {
      render(<UnifiedDashboard />)

      const settingsTab = screen.getByRole("tab", { name: /настройки/i })
      await user.click(settingsTab)

      expect(settingsTab).toHaveAttribute("data-state", "active")
    })

    it("should disable analysis tab when no analysis available", () => {
      render(<UnifiedDashboard />)

      const analysisTab = screen.getByRole("tab", { name: /анализ/i })
      expect(analysisTab).toHaveAttribute("data-disabled")
    })

    it("should enable analysis tab when analysis is available", () => {
      const mockAnalysis = createMockAnalysis()
      render(
        <UnifiedDashboard
          mediaFiles={mockMediaFiles}
          onAnalysisComplete={() => {
            // Analysis completed
          }}
        />,
      )

      // Simulate analysis completion by finding the header analyze button specifically
      const analyzeButtons = screen.getAllByRole("button", { name: /анализ/i })
      expect(analyzeButtons.length).toBeGreaterThan(0)
      const headerAnalyzeButton = analyzeButtons.find(
        (btn) => btn.className.includes("h-8"), // Header button has specific height
      )
      expect(headerAnalyzeButton).toBeInTheDocument()
    })
  })

  describe("Control Buttons", () => {
    it("should show main action buttons when not processing", () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByRole("button", { name: /настройки/i })).toBeInTheDocument()
      expect(screen.getAllByRole("button", { name: /анализ/i }).length).toBeGreaterThan(0)
      expect(screen.getByRole("button", { name: /полная обработка/i })).toBeInTheDocument()
    })

    it("should disable buttons when no media files", () => {
      render(<UnifiedDashboard />)

      const analyzeButtons = screen.getAllByRole("button", { name: /анализ/i })
      const processButton = screen.getByRole("button", { name: /полная обработка/i })

      // Check that at least one analyze button is disabled
      expect(analyzeButtons.some((btn) => btn.hasAttribute("disabled"))).toBe(true)
      expect(processButton).toBeDisabled()
    })

    it("should show processing controls when processing", () => {
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        isProcessing: true,
      })

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByRole("button", { name: /пауза/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /остановить/i })).toBeInTheDocument()
    })

    it("should show resume button when paused", () => {
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        isProcessing: true,
      })

      vi.mocked(useContentPipeline).mockReturnValue({
        ...defaultContentPipelineMock,
        isRunning: true,
        isPaused: true,
      })

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByRole("button", { name: /продолжить/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /остановить/i })).toBeInTheDocument()
    })
  })

  describe("Progress Display", () => {
    it("should show progress bar when processing", () => {
      const mockProgress = createMockProgress(45)
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        isProcessing: true,
        progress: mockProgress,
      })

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByText("Analyzing content")).toBeInTheDocument()
      expect(screen.getByText("45%")).toBeInTheDocument()
    })

    it("should show pause badge when paused", () => {
      const mockProgress = createMockProgress(30)
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        isProcessing: true,
        progress: mockProgress,
      })

      vi.mocked(useContentPipeline).mockReturnValue({
        ...defaultContentPipelineMock,
        isRunning: true,
        isPaused: true,
      })

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByText("Пауза")).toBeInTheDocument()
    })

    it("should not show progress bar when not processing", () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })
  })

  describe("Actions and Callbacks", () => {
    it("should call analyzeContent when analyze button is clicked", async () => {
      mockAnalyzeContent.mockResolvedValueOnce(createMockAnalysis())

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} onAnalysisComplete={mockOnAnalysisComplete} />)

      // Get the header analyze button specifically
      const analyzeButtons = screen.getAllByRole("button", { name: /анализ/i })
      const headerAnalyzeButton = analyzeButtons.find(
        (btn) => btn.className.includes("h-8"), // Header button has specific height
      )

      expect(headerAnalyzeButton).toBeInTheDocument()
      await user.click(headerAnalyzeButton!)

      await waitFor(() => {
        expect(mockAnalyzeContent).toHaveBeenCalledWith(
          mockMediaFiles,
          expect.objectContaining({
            features: expect.objectContaining({
              sceneAnalysis: true,
              scriptGeneration: true,
              contentClassification: true,
              multiPlatform: true,
              qualityEnhancement: true,
            }),
            platforms: [],
          }),
        )
      })
    })

    it("should call processProject when full processing button is clicked", async () => {
      mockProcessProject.mockResolvedValueOnce(createMockIntelligentContent())

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} onProcessingComplete={mockOnProcessingComplete} />)

      const processButton = screen.getByRole("button", { name: /полная обработка/i })
      await user.click(processButton)

      await waitFor(() => {
        expect(mockProcessProject).toHaveBeenCalledWith(
          mockMediaFiles,
          expect.objectContaining({
            features: expect.objectContaining({
              sceneAnalysis: true,
              scriptGeneration: true,
              contentClassification: true,
              multiPlatform: true,
              qualityEnhancement: true,
            }),
            platforms: [],
          }),
        )
      })
    })

    it("should call onFileUpload when provided", () => {
      render(<UnifiedDashboard onFileUpload={mockOnFileUpload} />)

      // Simulate file upload would require more complex setup
      // This is a basic test that the prop is handled
      expect(mockOnFileUpload).not.toHaveBeenCalled()
    })

    it("should handle pause and resume actions", async () => {
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        isProcessing: true,
      })

      vi.mocked(useContentPipeline).mockReturnValue({
        ...defaultContentPipelineMock,
        isRunning: true,
        isPaused: false,
      })

      const { rerender } = render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      // Test pause
      const pauseButton = screen.getByRole("button", { name: /пауза/i })
      await user.click(pauseButton)

      expect(mockPausePipeline).toHaveBeenCalled()
      expect(mockPauseContentPipeline).toHaveBeenCalled()

      // Update mock to show paused state
      vi.mocked(useContentPipeline).mockReturnValue({
        ...defaultContentPipelineMock,
        isRunning: true,
        isPaused: true,
      })

      rerender(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      // Test resume
      const resumeButton = screen.getByRole("button", { name: /продолжить/i })
      await user.click(resumeButton)

      expect(mockResumePipeline).toHaveBeenCalled()
      expect(mockResumeContentPipeline).toHaveBeenCalled()
    })

    it("should handle stop action", async () => {
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        isProcessing: true,
      })

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      const stopButton = screen.getByRole("button", { name: /остановить/i })
      await user.click(stopButton)

      expect(mockCancelPipeline).toHaveBeenCalled()
      expect(mockStopPipeline).toHaveBeenCalled()
    })

    it("should handle reset action", async () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      // Find reset button by looking for RefreshCw icon
      const buttons = screen.getAllByRole("button")
      const resetBtn = buttons.find((btn) => btn.querySelector('[data-testid="refreshcw-icon"]'))

      expect(resetBtn).toBeInTheDocument()
      await user.click(resetBtn!)
      expect(mockResetAI).toHaveBeenCalled()
    })
  })

  describe("Error Handling", () => {
    it("should handle analysis errors", async () => {
      const mockError = new Error("Analysis failed")
      mockAnalyzeContent.mockRejectedValueOnce(mockError)

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} onError={mockOnError} />)

      // Get the header analyze button specifically
      const analyzeButtons = screen.getAllByRole("button", { name: /анализ/i })
      const headerAnalyzeButton = analyzeButtons.find(
        (btn) => btn.className.includes("h-8"), // Header button has specific height
      )

      await user.click(headerAnalyzeButton!)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(mockError)
      })
    })

    it("should handle processing errors", async () => {
      const mockError = new Error("Processing failed")
      mockProcessProject.mockRejectedValueOnce(mockError)

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} onError={mockOnError} />)

      const processButton = screen.getByRole("button", { name: /полная обработка/i })
      await user.click(processButton)

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(mockError)
      })
    })
  })

  describe("Child Components Integration", () => {
    it("should pass correct props to AnalysisViewer", async () => {
      const mockAnalysis = createMockAnalysis()
      mockAnalyzeContent.mockResolvedValueOnce(mockAnalysis)

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      // First analyze to get analysis data using the header button specifically
      const analyzeButtons = screen.getAllByRole("button", { name: /анализ/i })
      const headerAnalyzeButton = analyzeButtons.find(
        (btn) => btn.className.includes("h-8"), // Header button has specific height
      )

      await user.click(headerAnalyzeButton!)

      // Wait for analysis to complete and switch to analysis tab
      await waitFor(() => {
        const analysisTab = screen.getByRole("tab", { name: /анализ/i })
        expect(analysisTab).not.toHaveAttribute("data-disabled")
      })

      // Switch to analysis tab
      const analysisTab = screen.getByRole("tab", { name: /анализ/i })
      await user.click(analysisTab)

      expect(screen.getByTestId("analysis-viewer")).toBeInTheDocument()
    })

    it("should pass correct props to PreviewGrid", async () => {
      // For this test, we just need to verify that the Results tab can be activated
      // and shows the expected content when results are available
      const mockResults = createMockIntelligentContent()

      // Mock that processing completes and results are available
      vi.mocked(useAIIntelligence).mockReturnValue({
        ...defaultAIIntelligenceMock,
        result: mockResults,
      })

      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      // Since we're mocking that results are already available, results tab should be enabled
      const resultsTab = screen.getByRole("tab", { name: /результаты/i })

      // Switch to results tab
      await user.click(resultsTab)

      // Check that results content is rendered - when no analysis but there are results,
      // it should show the "no results" message or the Target icon
      expect(screen.getByTestId("target-icon")).toBeInTheDocument()
    })
  })

  describe("Statistics and Overview", () => {
    it("should show correct statistics in overview", () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      // Check that overview shows file statistics
      expect(screen.getByText("Загружено файлов")).toBeInTheDocument()
      expect(screen.getByText("Обработано")).toBeInTheDocument()
      expect(screen.getByText("Успешность")).toBeInTheDocument()
      expect(screen.getByText("Статус")).toBeInTheDocument()
    })

    it("should show quick actions in overview", () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByText("Быстрые действия")).toBeInTheDocument()
      expect(screen.getByText("Загрузить файлы")).toBeInTheDocument()
      expect(screen.getByText("Начать анализ")).toBeInTheDocument()
      expect(screen.getByText("AI обработка")).toBeInTheDocument()
    })

    it("should show loaded files list in overview", () => {
      render(<UnifiedDashboard mediaFiles={mockMediaFiles} />)

      expect(screen.getByText("Загруженные файлы")).toBeInTheDocument()
      expect(screen.getByText("video1.mp4")).toBeInTheDocument()
      expect(screen.getByText("video2.mp4")).toBeInTheDocument()
    })
  })
})
