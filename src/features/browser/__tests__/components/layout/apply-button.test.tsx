import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ApplyButton } from "@/features/browser/components/layout/apply-button"
import { ResourceType, TimelineResource } from "@/features/resources/types"

describe("ApplyButton", () => {
  const mockResource: TimelineResource = {
    id: "test-resource",
    type: "media",
    name: "Test Resource",
  }

  it("should render apply button", () => {
    render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
      />
    )

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("should call onApply callback when clicked", () => {
    const onApply = vi.fn()

    render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
        onApply={onApply}
      />
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith(mockResource, "media")
  })

  it("should log to console when onApply is not provided", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
      />
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(consoleSpy).toHaveBeenCalledWith("ApplyButton clicked", "test-resource", "media")
    
    consoleSpy.mockRestore()
  })

  it("should stop event propagation", () => {
    const onApply = vi.fn()
    const containerClick = vi.fn()

    render(
      <div onClick={containerClick}>
        <ApplyButton 
          resource={mockResource} 
          size={150} 
          type="media" 
          onApply={onApply}
        />
      </div>
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(onApply).toHaveBeenCalled()
    expect(containerClick).not.toHaveBeenCalled()
  })

  it("should handle different resource types", () => {
    const onApply = vi.fn()
    const types: ResourceType[] = ["media", "effect", "filter", "template", "transition", "music", "subtitles"]

    types.forEach((type) => {
      const { unmount } = render(
        <ApplyButton 
          resource={{ ...mockResource, type }} 
          size={150} 
          type={type} 
          onApply={onApply}
        />
      )

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(onApply).toHaveBeenLastCalledWith({ ...mockResource, type }, type)
      
      unmount()
    })

    expect(onApply).toHaveBeenCalledTimes(types.length)
  })

  it("should apply correct styles based on size", () => {
    const sizes = [50, 100, 150, 200]

    sizes.forEach((size) => {
      const { container, unmount } = render(
        <ApplyButton 
          resource={mockResource} 
          size={size} 
          type="media" 
        />
      )

      const button = container.querySelector("button")
      expect(button).toHaveStyle({
        bottom: `${20 + size / 25}px`
      })

      const icon = container.querySelector("svg")
      expect(icon).toHaveStyle({
        height: `${6 + size / 30}px`,
        width: `${6 + size / 30}px`
      })

      unmount()
    })
  })

  it("should have correct accessibility attributes", () => {
    render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
      />
    )

    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "button")
  })

  it("should have correct hover and focus classes", () => {
    render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
      />
    )

    const button = screen.getByRole("button")
    expect(button.className).toContain("group-hover:visible")
    expect(button.className).toContain("focus:ring-2")
    expect(button.className).toContain("focus:ring-teal")
  })

  it("should prevent default on onApply call", () => {
    const onApply = vi.fn()

    render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
        onApply={onApply}
      />
    )

    const button = screen.getByRole("button")
    const event = new MouseEvent("click", { bubbles: true })
    vi.spyOn(event, "stopPropagation")

    button.dispatchEvent(event)

    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it("should render ArrowRight icon", () => {
    const { container } = render(
      <ApplyButton 
        resource={mockResource} 
        size={150} 
        type="media" 
      />
    )

    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()
    
    // Проверяем класс через getAttribute для SVG элементов
    const iconClass = icon?.getAttribute("class") || ""
    expect(iconClass).toContain("transition-transform")
    expect(iconClass).toContain("hover:scale-110")
  })
})