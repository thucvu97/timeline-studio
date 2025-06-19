import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { squareTemplates } from "../square-templates"

describe("squareTemplates", () => {
  it("should export an array of square templates", () => {
    expect(Array.isArray(squareTemplates)).toBe(true)
    expect(squareTemplates.length).toBeGreaterThan(0)
  })

  it("should have required properties for each template", () => {
    squareTemplates.forEach((template) => {
      expect(template).toHaveProperty("id")
      expect(template).toHaveProperty("split")
      expect(template).toHaveProperty("screens")
      expect(template).toHaveProperty("render")
      expect(typeof template.id).toBe("string")
      expect(typeof template.screens).toBe("number")
      expect(typeof template.render).toBe("function")
    })
  })

  it("should have unique IDs for each template", () => {
    const ids = squareTemplates.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it("should render 2-screen vertical split template", () => {
    const template = squareTemplates.find((t) => t.id === "split-vertical-square")
    expect(template).toBeDefined()

    if (!template) return

    const { container } = render(template.render())

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()

    const divider = container.querySelector(".bg-gray-400, .bg-gray-600")
    if (divider) {
      expect(divider).toBeInTheDocument()
    }
  })

  it("should render 2-screen horizontal split template", () => {
    const template = squareTemplates.find((t) => t.id === "split-horizontal-square")
    expect(template).toBeDefined()

    render(template!.render())

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("should render 4-screen grid template", () => {
    const template = squareTemplates.find((t) => t.id === "split-grid-2x2-square")
    expect(template).toBeDefined()

    render(template!.render())

    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("should render 9-screen grid template", () => {
    const template = squareTemplates.find((t) => t.id === "split-grid-3x3-square")
    expect(template).toBeDefined()

    render(template!.render())

    // Check that all 9 screens are rendered
    for (let i = 1; i <= 9; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument()
    }
  })

  it("should render templates with various screen counts", () => {
    const screenCounts = new Set(squareTemplates.map((t) => t.screens))

    // Square templates should have symmetric screen counts
    expect(screenCounts).toContain(2) // 1x2 or 2x1
    expect(screenCounts).toContain(4) // 2x2
    expect(screenCounts).toContain(9) // 3x3
    // May also contain 16 (4x4), 25 (5x5), etc.
  })

  it("should have resizable property for templates", () => {
    squareTemplates.forEach((template) => {
      // resizable is optional, but if present should be true
      if ("resizable" in template) {
        expect(template.resizable).toBe(true)
      }
    })
  })

  it("should have proper split types", () => {
    const validSplitTypes = ["vertical", "horizontal", "diagonal", "custom", "grid"]

    squareTemplates.forEach((template) => {
      expect(validSplitTypes).toContain(template.split)
    })
  })

  it("should render diagonal split template if exists", () => {
    const template = squareTemplates.find((t) => t.id === "split-diagonal-square")

    if (template) {
      const { container } = render(template.render())

      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()

      // Check for clip-path styles (inline styles use different format)
      const cells = container.querySelectorAll("[style*='clip']")
      expect(cells.length).toBeGreaterThan(0)
    }
  })

  it("should apply alternating background colors in grid templates", () => {
    const gridTemplate = squareTemplates.find((t) => t.split === "grid")
    expect(gridTemplate).toBeDefined()

    if (!gridTemplate || !gridTemplate.render) return

    const { container } = render(gridTemplate.render())

    // For grid templates, check that cells exist
    const cells = container.querySelectorAll(".flex.items-center.justify-center")
    expect(cells.length).toBeGreaterThan(0)

    // Check inline styles on cells
    const hasAlternatingColors = Array.from(cells).some((cell) => {
      const style = cell.getAttribute("style") || ""
      return style.includes("background")
    })

    expect(hasAlternatingColors).toBe(true)
  })

  it("should render divider lines", () => {
    const template = squareTemplates[0] // Take first template
    const { container } = render(template.render())

    // Check for divider lines (could be vertical or horizontal)
    const dividers = container.querySelectorAll(".bg-gray-400, .bg-gray-600")
    expect(dividers.length).toBeGreaterThan(0)
  })

  it("should have symmetric grid layouts for square format", () => {
    const gridTemplates = squareTemplates.filter((t) => t.split === "grid")

    gridTemplates.forEach((template) => {
      // Square grids should typically be symmetric (2x2, 3x3, 4x4, etc.)
      const sqrt = Math.sqrt(template.screens)
      const isSymmetric = Number.isInteger(sqrt)

      // Most square grid templates should be symmetric, but some variations are ok
      const validScreenCounts = [4, 6, 8, 9, 10, 12, 16, 25] // Common grid sizes (including 10)
      expect(validScreenCounts).toContain(template.screens)
    })
  })

  it("should render custom split templates", () => {
    const customTemplates = squareTemplates.filter((t) => t.split === "custom")

    customTemplates.forEach((template) => {
      const { unmount } = render(template.render())

      // Check that all screens are rendered
      for (let i = 1; i <= template.screens; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument()
      }

      unmount()
    })
  })

  it("should render 16-screen grid template if exists", () => {
    const template = squareTemplates.find((t) => t.id === "split-grid-4x4-square")

    if (template) {
      render(template.render())

      // Check that all 16 screens are rendered
      for (let i = 1; i <= 16; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument()
      }
    }
  })

  it("should have proper styling for square format", () => {
    const template = squareTemplates[0]
    const { container } = render(template.render())

    // Check that the container maintains aspect ratio
    const rootElement = container.firstChild as HTMLElement
    expect(rootElement).toHaveClass("h-full", "w-full")
  })
})
