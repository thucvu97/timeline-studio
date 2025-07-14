/**
 * Tests for DashboardHeader component
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DashboardHeader } from "../dashboard-header"

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  HelpCircle: () => <div data-testid="help-icon">HelpCircle</div>,
  X: () => <div data-testid="close-icon">X</div>,
}))

describe("DashboardHeader", () => {
  it("should render header content", () => {
    render(<DashboardHeader />)

    expect(screen.getByText("AI Content Intelligence")).toBeInTheDocument()
    expect(screen.getByText("Analyze, generate, and adapt your content with AI")).toBeInTheDocument()
    expect(screen.getByText("🧠")).toBeInTheDocument()
  })

  it("should always render help button", () => {
    render(<DashboardHeader />)

    const helpButton = screen.getByTitle("Help")
    expect(helpButton).toBeInTheDocument()
    expect(screen.getByTestId("help-icon")).toBeInTheDocument()
  })

  it("should render close button when onClose is provided", () => {
    const onClose = vi.fn()
    render(<DashboardHeader onClose={onClose} />)

    const closeButton = screen.getByTitle("Close")
    expect(closeButton).toBeInTheDocument()
    expect(screen.getByTestId("close-icon")).toBeInTheDocument()
  })

  it("should not render close button when onClose is not provided", () => {
    render(<DashboardHeader />)

    expect(screen.queryByTitle("Close")).not.toBeInTheDocument()
    expect(screen.queryByTestId("close-icon")).not.toBeInTheDocument()
  })

  it("should call onHelp when help button is clicked", async () => {
    const onHelp = vi.fn()
    const user = userEvent.setup()

    render(<DashboardHeader onHelp={onHelp} />)

    const helpButton = screen.getByTitle("Help")
    await user.click(helpButton)

    expect(onHelp).toHaveBeenCalledTimes(1)
  })

  it("should call onClose when close button is clicked", async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(<DashboardHeader onClose={onClose} />)

    const closeButton = screen.getByTitle("Close")
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("should render both buttons when both callbacks are provided", () => {
    const onHelp = vi.fn()
    const onClose = vi.fn()

    render(<DashboardHeader onHelp={onHelp} onClose={onClose} />)

    expect(screen.getByTitle("Help")).toBeInTheDocument()
    expect(screen.getByTitle("Close")).toBeInTheDocument()
  })

  it("should have correct header structure", () => {
    const { container } = render(<DashboardHeader />)

    const headerElement = container.firstElementChild
    expect(headerElement).toHaveClass("flex", "items-center", "justify-between", "px-4", "py-3", "border-b")
  })

  it("should display the brain emoji icon", () => {
    render(<DashboardHeader />)

    expect(screen.getByText("🧠")).toBeInTheDocument()
  })

  it("should not call onHelp when no callback provided", async () => {
    const user = userEvent.setup()
    render(<DashboardHeader />)

    const helpButton = screen.getByTitle("Help")
    await user.click(helpButton)

    // Should not throw an error
    expect(helpButton).toBeInTheDocument()
  })
})
