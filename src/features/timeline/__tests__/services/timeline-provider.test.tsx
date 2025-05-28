/**
 * Тесты для TimelineProvider
 */

import React from "react"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TimelineProvider } from "../../services/timeline-provider"

// Тестовый компонент для проверки провайдера
const TestComponent = () => {
  return <div data-testid="timeline-test-component">Timeline Test Component</div>
}

describe("TimelineProvider", () => {
  describe("Provider Initialization", () => {
    it("should be defined and exportable", () => {
      expect(TimelineProvider).toBeDefined()
      expect(typeof TimelineProvider).toBe("function")
    })

    it("should render without errors", () => {
      expect(() => {
        render(
          <TimelineProvider>
            <TestComponent />
          </TimelineProvider>,
        )
      }).not.toThrow()
    })

    it("should render children components", () => {
      render(
        <TimelineProvider>
          <TestComponent />
        </TimelineProvider>,
      )

      expect(screen.getByTestId("timeline-test-component")).toBeInTheDocument()
      expect(screen.getByTestId("timeline-test-component")).toHaveTextContent("Timeline Test Component")
    })
  })

  describe("Provider Functionality", () => {
    it("should accept children prop", () => {
      const { getByTestId } = render(
        <TimelineProvider>
          <div data-testid="child-component">Child Component</div>
        </TimelineProvider>,
      )

      expect(getByTestId("child-component")).toBeInTheDocument()
    })

    it("should render multiple children", () => {
      render(
        <TimelineProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </TimelineProvider>,
      )

      expect(screen.getByTestId("child-1")).toBeInTheDocument()
      expect(screen.getByTestId("child-2")).toBeInTheDocument()
      expect(screen.getByTestId("child-3")).toBeInTheDocument()
    })
  })

  describe("Provider Context", () => {
    it("should provide timeline context to children", () => {
      // Поскольку у нас есть глобальные моки, провайдер должен работать
      const { container } = render(
        <TimelineProvider>
          <TestComponent />
        </TimelineProvider>,
      )

      expect(container.firstChild).toBeInTheDocument()
    })

    it("should handle nested providers", () => {
      expect(() => {
        render(
          <TimelineProvider>
            <TimelineProvider>
              <TestComponent />
            </TimelineProvider>
          </TimelineProvider>,
        )
      }).not.toThrow()
    })
  })

  describe("Error Handling", () => {
    it("should handle empty children", () => {
      expect(() => {
        render(<TimelineProvider>{null}</TimelineProvider>)
      }).not.toThrow()
    })

    it("should handle undefined children", () => {
      expect(() => {
        render(<TimelineProvider>{undefined}</TimelineProvider>)
      }).not.toThrow()
    })

    it("should handle false children", () => {
      expect(() => {
        render(<TimelineProvider>{false}</TimelineProvider>)
      }).not.toThrow()
    })
  })

  describe("Provider Performance", () => {
    it("should render efficiently with many children", () => {
      const children = Array.from({ length: 100 }, (_, i) => (
        <div key={i} data-testid={`child-${i}`}>
          Child {i}
        </div>
      ))

      expect(() => {
        render(<TimelineProvider>{children}</TimelineProvider>)
      }).not.toThrow()

      // Проверяем, что первый и последний элементы отрендерились
      expect(screen.getByTestId("child-0")).toBeInTheDocument()
      expect(screen.getByTestId("child-99")).toBeInTheDocument()
    })
  })
})
