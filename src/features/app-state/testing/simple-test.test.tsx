/**
 * Simple working test for app-state testing system
 */

import React from "react"

import { fireEvent, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithAppState } from "./test-utils"

// Simple test component
function SimpleTestComponent() {
  const [count, setCount] = React.useState(0)

  return (
    <div>
      <h1>Simple Test</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

describe("App State Testing System", () => {
  describe("Basic Functionality", () => {
    it("should render component with testing provider", () => {
      renderWithAppState(<SimpleTestComponent />)

      expect(screen.getByText("Simple Test")).toBeInTheDocument()
      expect(screen.getByText("Count: 0")).toBeInTheDocument()
    })

    it("should handle component interactions", () => {
      renderWithAppState(<SimpleTestComponent />)

      const button = screen.getByText("Increment")
      fireEvent.click(button)

      expect(screen.getByText("Count: 1")).toBeInTheDocument()
    })

    it("should provide mock backend utilities", () => {
      const { mockBackend } = renderWithAppState(<SimpleTestComponent />)

      expect(mockBackend.executeCommand).toBeDefined()
      expect(mockBackend.getProjectState).toBeDefined()
      expect(mockBackend.getEventHistory).toBeDefined()
    })
  })

  describe("Testing Utilities", () => {
    it("should provide working renderWithAppState function", () => {
      const result = renderWithAppState(<SimpleTestComponent />)

      expect(result.container).toBeDefined()
      expect(result.mockBackend).toBeDefined()
    })
  })
})
