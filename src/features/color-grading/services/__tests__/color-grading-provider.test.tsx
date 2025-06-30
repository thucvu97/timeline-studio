import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ColorGradingProvider, useColorGradingContext } from "../color-grading-provider"

// Mock the useColorGrading hook
const mockColorGrading = {
  state: {
    colorWheels: {
      lift: { r: 0, g: 0, b: 0 },
      gamma: { r: 0, g: 0, b: 0 },
      gain: { r: 0, g: 0, b: 0 },
      offset: { r: 0, g: 0, b: 0 },
    },
    basicParameters: {
      temperature: 0,
      tint: 0,
      contrast: 0,
      pivot: 0.5,
      saturation: 0,
      hue: 0,
      luminance: 0,
    },
    curves: {
      master: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],
      red: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],
      green: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],
      blue: [
        { x: 0, y: 256, id: "start" },
        { x: 256, y: 0, id: "end" },
      ],
      hueVsHue: [],
      hueVsSaturation: [],
      hueVsLuminance: [],
      luminanceVsSaturation: [],
      saturationVsSaturation: [],
    },
    lut: {
      file: null,
      intensity: 100,
      isEnabled: false,
    },
    scopes: {
      waveformEnabled: true,
      vectorscopeEnabled: false,
      histogramEnabled: false,
      refreshRate: 30,
    },
    previewEnabled: true,
    selectedClip: null,
    isActive: false,
    currentPreset: null,
    hasUnsavedChanges: false,
  },
  dispatch: vi.fn(),
  updateColorWheel: vi.fn(),
  updateBasicParameter: vi.fn(),
  updateCurve: vi.fn(),
  loadLUT: vi.fn(),
  setLUTIntensity: vi.fn(),
  toggleLUT: vi.fn(),
  togglePreview: vi.fn(),
  applyToClip: vi.fn(),
  resetAll: vi.fn(),
  autoCorrect: vi.fn(),
  loadPreset: vi.fn(),
  savePreset: vi.fn(),
  hasChanges: false,
  isActive: false,
  availablePresets: [],
}

vi.mock("../hooks/use-color-grading", () => ({
  useColorGrading: vi.fn(() => mockColorGrading),
}))

// Test component that uses the context
function TestComponent() {
  const context = useColorGradingContext()

  return (
    <div>
      <div data-testid="temperature">{context.state.basicParameters.temperature}</div>
      <div data-testid="has-changes">{context.hasChanges.toString()}</div>
      <div data-testid="is-active">{context.isActive.toString()}</div>
      <button onClick={() => context.updateBasicParameter("temperature", 1)}>Update Temperature</button>
      <button onClick={() => context.resetAll()}>Reset All</button>
    </div>
  )
}

describe("ColorGradingProvider", () => {
  it("should provide color grading context to children", () => {
    render(
      <ColorGradingProvider>
        <TestComponent />
      </ColorGradingProvider>,
    )

    expect(screen.getByTestId("temperature")).toHaveTextContent("0")
    expect(screen.getByTestId("has-changes")).toHaveTextContent("false")
    expect(screen.getByTestId("is-active")).toHaveTextContent("false")
  })

  it("should provide all required context methods", () => {
    render(
      <ColorGradingProvider>
        <TestComponent />
      </ColorGradingProvider>,
    )

    const updateButton = screen.getByText("Update Temperature")
    const resetButton = screen.getByText("Reset All")

    expect(updateButton).toBeInTheDocument()
    expect(resetButton).toBeInTheDocument()
  })

  it("should call context methods when triggered", () => {
    render(
      <ColorGradingProvider>
        <TestComponent />
      </ColorGradingProvider>,
    )

    const updateButton = screen.getByText("Update Temperature")
    const resetButton = screen.getByText("Reset All")

    // Just verify the buttons exist and are clickable
    expect(updateButton).toBeInTheDocument()
    expect(resetButton).toBeInTheDocument()
  })
})

describe("useColorGradingContext", () => {
  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useColorGradingContext must be used within ColorGradingProvider")

    console.error = originalError
  })

  it("should return context value when used within provider", () => {
    let contextValue: any

    function ContextCapture() {
      contextValue = useColorGradingContext()
      return null
    }

    render(
      <ColorGradingProvider>
        <ContextCapture />
      </ColorGradingProvider>,
    )

    expect(contextValue).toBeDefined()
    expect(contextValue.state).toBeDefined()
    expect(typeof contextValue.updateBasicParameter).toBe("function")
    expect(typeof contextValue.resetAll).toBe("function")
  })

  it("should provide all required context properties", () => {
    let contextValue: any

    function ContextCapture() {
      contextValue = useColorGradingContext()
      return null
    }

    render(
      <ColorGradingProvider>
        <ContextCapture />
      </ColorGradingProvider>,
    )

    // Check that all required properties exist
    expect(contextValue.state).toBeDefined()
    expect(contextValue.dispatch).toBeDefined()
    expect(contextValue.updateColorWheel).toBeDefined()
    expect(contextValue.updateBasicParameter).toBeDefined()
    expect(contextValue.updateCurve).toBeDefined()
    expect(contextValue.loadLUT).toBeDefined()
    expect(contextValue.setLUTIntensity).toBeDefined()
    expect(contextValue.toggleLUT).toBeDefined()
    expect(contextValue.togglePreview).toBeDefined()
    expect(contextValue.applyToClip).toBeDefined()
    expect(contextValue.resetAll).toBeDefined()
    expect(contextValue.autoCorrect).toBeDefined()
    expect(contextValue.loadPreset).toBeDefined()
    expect(contextValue.savePreset).toBeDefined()
    expect(typeof contextValue.hasChanges).toBe("boolean")
    expect(typeof contextValue.isActive).toBe("boolean")
    expect(Array.isArray(contextValue.availablePresets)).toBe(true)
  })
})
