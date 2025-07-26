import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import "@testing-library/jest-dom"

import { AISuggestionsPanel } from "../ai-suggestions-panel"

describe("AISuggestionsPanel", () => {
  it("renders the panel with correct title", () => {
    render(<AISuggestionsPanel />)

    expect(screen.getByText("AI Content Intelligence")).toBeInTheDocument()
  })

  it("renders the subtitle", () => {
    render(<AISuggestionsPanel />)

    expect(screen.getByText("AI анализ и предложения для улучшения контента")).toBeInTheDocument()
  })

  it("displays under development message", () => {
    render(<AISuggestionsPanel />)

    expect(screen.getByText("🚧 В разработке")).toBeInTheDocument()
    expect(screen.getByText("Здесь будут отображаться AI предложения для вашего Timeline")).toBeInTheDocument()
  })

  it("renders the Sparkles icon", () => {
    render(<AISuggestionsPanel />)

    // The icon is rendered as an SVG element with data attributes
    const icon = screen.getByTestId("sparkles-icon")
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute("data-icon", "Sparkles")
  })

  it("applies custom className when provided", () => {
    const customClass = "custom-test-class"
    const { container } = render(<AISuggestionsPanel className={customClass} />)

    expect(container.firstChild).toHaveClass(customClass)
  })

  it("has proper structure with borders and padding", () => {
    const { container } = render(<AISuggestionsPanel />)

    // Check main container has proper classes
    expect(container.firstChild).toHaveClass(
      "h-full",
      "w-full",
      "bg-muted/30",
      "border-l",
      "border-border",
      "flex",
      "flex-col",
    )
  })

  it("has header section with proper styling", () => {
    render(<AISuggestionsPanel />)

    const header = screen.getByText("AI Content Intelligence").closest("div")
    expect(header?.parentElement).toHaveClass("p-4", "border-b", "border-border")
  })

  it("has content section with centered text", () => {
    render(<AISuggestionsPanel />)

    const developmentText = screen.getByText("🚧 В разработке")
    expect(developmentText.closest("div")).toHaveClass("text-center", "text-muted-foreground")
  })

  it("header title has correct styling", () => {
    render(<AISuggestionsPanel />)

    const title = screen.getByText("AI Content Intelligence")
    expect(title).toHaveClass("text-lg", "font-semibold")
  })

  it("subtitle has muted styling", () => {
    render(<AISuggestionsPanel />)

    const subtitle = screen.getByText("AI анализ и предложения для улучшения контента")
    expect(subtitle).toHaveClass("text-sm", "text-muted-foreground")
  })

  it("content area has flex-1 for proper layout", () => {
    render(<AISuggestionsPanel />)

    const contentArea = screen.getByText("🚧 В разработке").closest(".flex-1")
    expect(contentArea).toBeInTheDocument()
    expect(contentArea).toHaveClass("p-4")
  })

  it("handles missing className gracefully", () => {
    const { container } = render(<AISuggestionsPanel />)

    // Should still render with default classes
    expect(container.firstChild).toHaveClass("h-full", "w-full")
  })
})
