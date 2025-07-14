/**
 * Tests for ActionPanel component
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ActionPanel } from "../action-panel"

describe("ActionPanel", () => {
  const defaultProps = {
    isProcessing: false,
    hasFiles: true,
    onAnalyze: vi.fn(),
    onProcess: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Primary Actions", () => {
    it("should render analyze and process buttons when not processing", () => {
      render(<ActionPanel {...defaultProps} />)

      expect(screen.getByText("Analyze")).toBeInTheDocument()
      expect(screen.getByText("Full Process")).toBeInTheDocument()
    })

    it("should enable buttons when has files and not processing", () => {
      render(<ActionPanel {...defaultProps} />)

      const analyzeButton = screen.getByRole("button", { name: /analyze/i })
      const processButton = screen.getByRole("button", { name: /full process/i })

      expect(analyzeButton).not.toBeDisabled()
      expect(processButton).not.toBeDisabled()
    })

    it("should disable buttons when no files", () => {
      render(<ActionPanel {...defaultProps} hasFiles={false} />)

      const analyzeButton = screen.getByRole("button", { name: /analyze/i })
      const processButton = screen.getByRole("button", { name: /full process/i })

      expect(analyzeButton).toBeDisabled()
      expect(processButton).toBeDisabled()
    })

    it("should disable buttons when processing", () => {
      render(<ActionPanel {...defaultProps} isProcessing={true} />)

      const analyzeButton = screen.getByRole("button", { name: /analyze/i })
      const processButton = screen.getByRole("button", { name: /full process/i })

      expect(analyzeButton).toBeDisabled()
      expect(processButton).toBeDisabled()
    })

    it("should call onAnalyze when analyze button is clicked", async () => {
      const user = userEvent.setup()
      render(<ActionPanel {...defaultProps} />)

      const analyzeButton = screen.getByRole("button", { name: /analyze/i })
      await user.click(analyzeButton)

      expect(defaultProps.onAnalyze).toHaveBeenCalledTimes(1)
    })

    it("should call onProcess when process button is clicked", async () => {
      const user = userEvent.setup()
      render(<ActionPanel {...defaultProps} />)

      const processButton = screen.getByRole("button", { name: /full process/i })
      await user.click(processButton)

      expect(defaultProps.onProcess).toHaveBeenCalledTimes(1)
    })
  })

  describe("Processing Controls", () => {
    it("should not show processing controls when not processing", () => {
      render(<ActionPanel {...defaultProps} />)

      expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    })

    it("should show processing controls when processing", () => {
      render(<ActionPanel {...defaultProps} isProcessing={true} />)

      expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    })

    it("should call onPause when pause button is clicked", async () => {
      const user = userEvent.setup()
      render(<ActionPanel {...defaultProps} isProcessing={true} />)

      const pauseButton = screen.getByRole("button", { name: /pause/i })
      await user.click(pauseButton)

      expect(defaultProps.onPause).toHaveBeenCalledTimes(1)
    })

    it("should call onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup()
      render(<ActionPanel {...defaultProps} isProcessing={true} />)

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe("Quick Actions", () => {
    it("should render scene detection quick action", () => {
      render(<ActionPanel {...defaultProps} />)

      expect(screen.getByText("Scene Detection")).toBeInTheDocument()
    })

    it("should render key moments quick action", () => {
      render(<ActionPanel {...defaultProps} />)

      expect(screen.getByText("Key Moments")).toBeInTheDocument()
    })

    it("should render quality check quick action", () => {
      render(<ActionPanel {...defaultProps} />)

      expect(screen.getByText("Quality Check")).toBeInTheDocument()
    })

    it("should disable quick actions when processing", () => {
      render(<ActionPanel {...defaultProps} isProcessing={true} />)

      const sceneDetectionButton = screen.getByRole("button", { name: /scene detection/i })
      const keyMomentsButton = screen.getByRole("button", { name: /key moments/i })
      const qualityCheckButton = screen.getByRole("button", { name: /quality check/i })

      expect(sceneDetectionButton).toBeDisabled()
      expect(keyMomentsButton).toBeDisabled()
      expect(qualityCheckButton).toBeDisabled()
    })

    it("should disable quick actions when no files", () => {
      render(<ActionPanel {...defaultProps} hasFiles={false} />)

      const sceneDetectionButton = screen.getByRole("button", { name: /scene detection/i })
      const keyMomentsButton = screen.getByRole("button", { name: /key moments/i })
      const qualityCheckButton = screen.getByRole("button", { name: /quality check/i })

      expect(sceneDetectionButton).toBeDisabled()
      expect(keyMomentsButton).toBeDisabled()
      expect(qualityCheckButton).toBeDisabled()
    })
  })

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const customClass = "custom-action-panel"
      render(<ActionPanel {...defaultProps} className={customClass} />)

      const panel = screen.getByText("Analyze").closest("div")?.parentElement
      expect(panel).toHaveClass(customClass)
    })
  })

  describe("Accessibility", () => {
    it("should have proper button roles", () => {
      render(<ActionPanel {...defaultProps} />)

      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("should show disabled state correctly", () => {
      render(<ActionPanel {...defaultProps} hasFiles={false} />)

      const analyzeButton = screen.getByRole("button", { name: /analyze/i })
      expect(analyzeButton).toBeDisabled()
    })

    it("should show tooltips for quick actions", () => {
      render(<ActionPanel {...defaultProps} />)

      const sceneDetectionButton = screen.getByRole("button", { name: /scene detection/i })
      const keyMomentsButton = screen.getByRole("button", { name: /key moments/i })
      const qualityCheckButton = screen.getByRole("button", { name: /quality check/i })

      expect(sceneDetectionButton).toHaveAttribute("title", "Detect and analyze scenes")
      expect(keyMomentsButton).toHaveAttribute("title", "Find key moments")
      expect(qualityCheckButton).toHaveAttribute("title", "Analyze video quality")
    })
  })
})
