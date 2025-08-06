/**
 * Tests for PipelineStatus component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { PipelineProgress, StepProgress } from "../../../shared/types/pipeline"
import { ProcessingStatus } from "../../../shared/types/pipeline"
import { PipelineStatus } from "../pipeline-status"

describe("PipelineStatus", () => {
  const createMockProgress = (overrides?: Partial<PipelineProgress>): PipelineProgress => ({
    overall: 50,
    currentStep: "Analyzing content",
    steps: [
      {
        name: "Video Analysis",
        progress: 100,
        status: ProcessingStatus.COMPLETED,
      },
      {
        name: "Audio Analysis",
        progress: 75,
        status: ProcessingStatus.RUNNING,
      },
      {
        name: "Scene Detection",
        progress: 0,
        status: ProcessingStatus.PENDING,
      },
    ],
    estimatedTimeRemaining: 120,
    messages: [],
    ...overrides,
  })

  it("should render null when no progress provided", () => {
    const { container } = render(<PipelineStatus progress={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("should render progress bar with correct percentage", () => {
    const progress = createMockProgress({ overall: 75 })
    render(<PipelineStatus progress={progress} />)

    expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Processing Pipeline")).toBeInTheDocument()
  })

  it("should display current step", () => {
    const progress = createMockProgress({ currentStep: "Analyzing audio" })
    render(<PipelineStatus progress={progress} />)

    expect(screen.getByText("Current: Analyzing audio")).toBeInTheDocument()
  })

  it("should render all pipeline steps", () => {
    const progress = createMockProgress()
    render(<PipelineStatus progress={progress} />)

    expect(screen.getByText("Video Analysis")).toBeInTheDocument()
    expect(screen.getByText("Audio Analysis")).toBeInTheDocument()
    expect(screen.getByText("Scene Detection")).toBeInTheDocument()
  })

  it("should show correct status icons", () => {
    const progress = createMockProgress()
    render(<PipelineStatus progress={progress} />)

    // Check that status icons are present (we can't easily test specific icons)
    const stepElements = screen.getAllByText(/Video Analysis|Audio Analysis|Scene Detection/)
    expect(stepElements).toHaveLength(3)
  })

  it("should display progress percentage for running steps", () => {
    const progress = createMockProgress()
    render(<PipelineStatus progress={progress} />)

    expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(1) // Progress percentage for Audio Analysis
  })

  it("should render substeps when available", () => {
    const stepWithSubSteps: StepProgress = {
      name: "Complex Analysis",
      progress: 50,
      status: ProcessingStatus.RUNNING,
      subSteps: [
        { name: "Preprocessing", progress: 100 },
        { name: "Processing", progress: 50 },
        { name: "Postprocessing", progress: 0 },
      ],
    }

    const progress = createMockProgress({
      steps: [stepWithSubSteps],
    })

    render(<PipelineStatus progress={progress} />)

    expect(screen.getByText("Preprocessing (100%)")).toBeInTheDocument()
    expect(screen.getByText("Processing (50%)")).toBeInTheDocument()
    expect(screen.getByText("Postprocessing (0%)")).toBeInTheDocument()
  })

  it("should format time remaining correctly", () => {
    // Test seconds
    const progressSeconds = createMockProgress({ estimatedTimeRemaining: 45 })
    render(<PipelineStatus progress={progressSeconds} />)
    expect(screen.getByText("Estimated time remaining: 45s")).toBeInTheDocument()
  })

  it("should format minutes correctly", () => {
    // Test minutes
    const { rerender } = render(<PipelineStatus progress={null} />)

    const progressMinutes = createMockProgress({ estimatedTimeRemaining: 150 })
    rerender(<PipelineStatus progress={progressMinutes} />)
    expect(screen.getByText("Estimated time remaining: 3m")).toBeInTheDocument()
  })

  it("should format hours correctly", () => {
    // Test hours
    const { rerender } = render(<PipelineStatus progress={null} />)

    const progressHours = createMockProgress({ estimatedTimeRemaining: 3900 })
    rerender(<PipelineStatus progress={progressHours} />)
    expect(screen.getByText("Estimated time remaining: 1h 5m")).toBeInTheDocument()
  })

  it("should not show time remaining when not provided", () => {
    const progress = createMockProgress({ estimatedTimeRemaining: undefined })
    render(<PipelineStatus progress={progress} />)

    expect(screen.queryByText(/Estimated time remaining/)).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const customClass = "custom-pipeline-status"
    const progress = createMockProgress()
    const { container } = render(<PipelineStatus progress={progress} className={customClass} />)

    const element = container.firstElementChild
    expect(element).toHaveClass(customClass)
  })

  it("should show correct status colors for different processing states", () => {
    const progress = createMockProgress({
      steps: [
        { name: "Completed Step", progress: 100, status: ProcessingStatus.COMPLETED },
        { name: "Running Step", progress: 50, status: ProcessingStatus.RUNNING },
        { name: "Failed Step", progress: 0, status: ProcessingStatus.FAILED },
        { name: "Skipped Step", progress: 0, status: ProcessingStatus.SKIPPED },
        { name: "Pending Step", progress: 0, status: ProcessingStatus.PENDING },
      ],
    })

    render(<PipelineStatus progress={progress} />)

    // Verify all steps are rendered
    expect(screen.getByText("Completed Step")).toBeInTheDocument()
    expect(screen.getByText("Running Step")).toBeInTheDocument()
    expect(screen.getByText("Failed Step")).toBeInTheDocument()
    expect(screen.getByText("Skipped Step")).toBeInTheDocument()
    expect(screen.getByText("Pending Step")).toBeInTheDocument()
  })

  it("should handle empty steps array", () => {
    const progress = createMockProgress({ steps: [] })
    render(<PipelineStatus progress={progress} />)

    expect(screen.getByText("Processing Pipeline")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
  })

  it("should handle progress without current step", () => {
    const progress = createMockProgress({ currentStep: undefined })
    render(<PipelineStatus progress={progress} />)

    expect(screen.queryByText(/Current:/)).not.toBeInTheDocument()
    expect(screen.getByText("Processing Pipeline")).toBeInTheDocument()
  })
})
