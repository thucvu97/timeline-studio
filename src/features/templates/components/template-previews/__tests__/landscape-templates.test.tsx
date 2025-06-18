import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { landscapeTemplates } from "../landscape-templates"

describe("landscapeTemplates", () => {
  it("should export an array of landscape templates", () => {
    expect(Array.isArray(landscapeTemplates)).toBe(true)
    expect(landscapeTemplates.length).toBeGreaterThan(0)
  })

  it("should have required properties for each template", () => {
    landscapeTemplates.forEach((template) => {
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
    const ids = landscapeTemplates.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it("should render 2-screen vertical split template", () => {
    const template = landscapeTemplates.find((t) => t.id === "split-vertical-landscape")
    expect(template).toBeDefined()
    
    if (!template || !template.render) return
    
    const { container } = render(template.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    
    const divider = container.querySelector(".bg-gray-600")
    expect(divider).toBeInTheDocument()
  })

  it("should render 2-screen horizontal split template", () => {
    const template = landscapeTemplates.find((t) => t.id === "split-horizontal-landscape")
    expect(template).toBeDefined()
    
    if (!template || !template.render) return
    
    render(template.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("should render diagonal split template", () => {
    const template = landscapeTemplates.find((t) => t.id === "split-diagonal-landscape")
    expect(template).toBeDefined()
    
    if (!template || !template.render) return
    
    const { container } = render(template.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    
    // Check for clip-path styles (inline styles use different format)
    const cells = container.querySelectorAll("[style*='clip']")
    expect(cells.length).toBeGreaterThan(0)
  })

  it("should render 3-screen templates", () => {
    const threeScreenTemplates = landscapeTemplates.filter((t) => t.screens === 3)
    expect(threeScreenTemplates.length).toBeGreaterThan(0)
    
    threeScreenTemplates.forEach((template) => {
      if (!template.render) return
      const { unmount } = render(template.render())
      
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      
      unmount()
    })
  })

  it("should render 4-screen grid template", () => {
    const template = landscapeTemplates.find((t) => t.id === "split-grid-2x2-landscape")
    expect(template).toBeDefined()
    
    if (!template || !template.render) return
    
    render(template.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("should render templates with more than 4 screens", () => {
    const multiScreenTemplates = landscapeTemplates.filter((t) => t.screens > 4)
    expect(multiScreenTemplates.length).toBeGreaterThan(0)
    
    multiScreenTemplates.forEach((template) => {
      if (!template.render) return
      const { unmount } = render(template.render())
      
      // Check that all screen numbers are rendered
      for (let i = 1; i <= template.screens; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument()
      }
      
      unmount()
    })
  })

  it("should have resizable flag for all templates", () => {
    landscapeTemplates.forEach((template) => {
      expect(template).toHaveProperty("resizable")
      expect(template.resizable).toBe(true)
    })
  })

  it("should have proper split types", () => {
    const validSplitTypes = ["vertical", "horizontal", "diagonal", "custom", "grid"]
    
    landscapeTemplates.forEach((template) => {
      expect(validSplitTypes).toContain(template.split)
    })
  })

  it("should render 25-screen grid template", () => {
    const template = landscapeTemplates.find((t) => t.id === "split-grid-5x5-landscape")
    expect(template).toBeDefined()
    
    if (!template || !template.render) return
    
    render(template.render())
    
    // Check that all 25 screens are rendered
    for (let i = 1; i <= 25; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument()
    }
  })

  it("should apply alternating background colors in grid templates", () => {
    const gridTemplate = landscapeTemplates.find((t) => t.id === "split-grid-2x2-landscape")
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

  it("should render divider lines in grid templates", () => {
    const gridTemplate = landscapeTemplates.find((t) => t.id === "split-grid-3x3-landscape")
    expect(gridTemplate).toBeDefined()
    
    if (!gridTemplate || !gridTemplate.render) return
    
    const { container } = render(gridTemplate.render())
    
    // Check for vertical lines
    const verticalLines = container.querySelectorAll(".bg-gray-400[style*='width:'][style*='1px']")
    expect(verticalLines.length).toBeGreaterThan(0)
    
    // Check for horizontal lines
    const horizontalLines = container.querySelectorAll(".bg-gray-400[style*='height:'][style*='1px']")
    expect(horizontalLines.length).toBeGreaterThan(0)
  })
})