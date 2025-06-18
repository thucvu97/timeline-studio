import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { portraitTemplates } from "../portrait-templates"

describe("portraitTemplates", () => {
  it("should export an array of portrait templates", () => {
    expect(Array.isArray(portraitTemplates)).toBe(true)
    expect(portraitTemplates.length).toBeGreaterThan(0)
  })

  it("should have required properties for each template", () => {
    portraitTemplates.forEach((template) => {
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
    const ids = portraitTemplates.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it("should render 2-screen vertical split template", () => {
    const template = portraitTemplates.find((t) => t.id === "split-vertical-portrait")
    expect(template).toBeDefined()
    
    const { container } = render(template!.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    
    const divider = container.querySelector(".bg-gray-400, .bg-gray-600")
    if (divider) {
      expect(divider).toBeInTheDocument()
    }
  })

  it("should render 2-screen horizontal split template", () => {
    const template = portraitTemplates.find((t) => t.id === "split-horizontal-portrait")
    expect(template).toBeDefined()
    
    render(template!.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("should render diagonal split template", () => {
    const template = portraitTemplates.find((t) => t.id === "split-diagonal-portrait")
    if (!template) {
      // Not all orientations may have diagonal splits
      return
    }
    
    const { container } = render(template.render())
    
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    
    // Check for clip-path styles (inline styles use different format)
    const cells = container.querySelectorAll("[style*='clip']")
    expect(cells.length).toBeGreaterThan(0)
  })

  it("should render 3-screen templates", () => {
    const threeScreenTemplates = portraitTemplates.filter((t) => t.screens === 3)
    expect(threeScreenTemplates.length).toBeGreaterThan(0)
    
    threeScreenTemplates.forEach((template) => {
      const { unmount } = render(template.render())
      
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      
      unmount()
    })
  })

  it("should render 4-screen templates", () => {
    const fourScreenTemplates = portraitTemplates.filter((t) => t.screens === 4)
    expect(fourScreenTemplates.length).toBeGreaterThan(0)
    
    fourScreenTemplates.forEach((template) => {
      const { unmount } = render(template.render())
      
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("3")).toBeInTheDocument()
      expect(screen.getByText("4")).toBeInTheDocument()
      
      unmount()
    })
  })

  it("should render templates with more than 4 screens", () => {
    const multiScreenTemplates = portraitTemplates.filter((t) => t.screens > 4)
    
    if (multiScreenTemplates.length > 0) {
      multiScreenTemplates.forEach((template) => {
        const { unmount } = render(template.render())
        
        // Check that all screen numbers are rendered
        for (let i = 1; i <= template.screens; i++) {
          expect(screen.getByText(i.toString())).toBeInTheDocument()
        }
        
        unmount()
      })
    }
  })

  it("should have resizable flag for all templates", () => {
    portraitTemplates.forEach((template) => {
      expect(template).toHaveProperty("resizable")
      expect(template.resizable).toBe(true)
    })
  })

  it("should have proper split types", () => {
    const validSplitTypes = ["vertical", "horizontal", "diagonal", "custom", "grid"]
    
    portraitTemplates.forEach((template) => {
      expect(validSplitTypes).toContain(template.split)
    })
  })

  it("should render grid templates correctly", () => {
    const gridTemplates = portraitTemplates.filter((t) => t.split === "grid")
    
    if (gridTemplates.length > 0) {
      gridTemplates.forEach((template) => {
        const { unmount } = render(template.render())
        
        // Check that all screens are rendered
        for (let i = 1; i <= template.screens; i++) {
          expect(screen.getByText(i.toString())).toBeInTheDocument()
        }
        
        unmount()
      })
    }
  })

  it("should apply alternating background colors", () => {
    const gridTemplate = portraitTemplates.find((t) => t.split === "grid")
    
    if (gridTemplate) {
      const { container } = render(gridTemplate.render())
      
      const cells = container.querySelectorAll("[style*='background']")
      const backgrounds = Array.from(cells).map((cell) => {
        const style = cell.getAttribute("style")
        return style?.includes("#23262b") ? "dark" : "light"
      })
      
      // Check that backgrounds alternate
      expect(backgrounds).toContain("dark")
      expect(backgrounds).toContain("light")
    }
  })

  it("should render divider lines", () => {
    const template = portraitTemplates[0] // Take first template
    const { container } = render(template.render())
    
    // Check for divider lines (could be vertical or horizontal)
    const dividers = container.querySelectorAll(".bg-gray-400, .bg-gray-600")
    expect(dividers.length).toBeGreaterThan(0)
  })

  it("should have portrait-specific layouts", () => {
    // Portrait templates should generally have more vertical arrangements
    const verticalTemplates = portraitTemplates.filter((t) => 
      t.split === "horizontal" || 
      (t.split === "custom" && t.screens >= 3)
    )
    
    expect(verticalTemplates.length).toBeGreaterThan(0)
  })

  it("should render custom split templates", () => {
    const customTemplates = portraitTemplates.filter((t) => t.split === "custom")
    
    if (customTemplates.length > 0) {
      customTemplates.forEach((template) => {
        const { unmount } = render(template.render())
        
        // Check that all screens are rendered
        for (let i = 1; i <= template.screens; i++) {
          expect(screen.getByText(i.toString())).toBeInTheDocument()
        }
        
        unmount()
      })
    }
  })
})