import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useColorGrading } from "../../hooks/use-color-grading"

describe("useColorGrading", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useColorGrading())

    expect(result.current.state.colorWheels.lift).toEqual({ r: 0, g: 0, b: 0 })
    expect(result.current.state.basicParameters.temperature).toBe(0)
    expect(result.current.state.curves.master).toHaveLength(2)
    expect(result.current.state.lut.isEnabled).toBe(false)
    expect(result.current.state.scopes.waveformEnabled).toBe(true)
    expect(result.current.hasChanges).toBe(false)
  })

  describe("Color Wheels", () => {
    it("should update color wheel values", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateColorWheel("lift", { r: 10, g: 20, b: 30 })
      })

      expect(result.current.state.colorWheels.lift).toEqual({ r: 10, g: 20, b: 30 })
      expect(result.current.state.hasUnsavedChanges).toBe(true)
      expect(result.current.hasChanges).toBe(true)
    })
  })

  describe("Basic Parameters", () => {
    it("should update basic parameters", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateBasicParameter("temperature", 50)
      })

      expect(result.current.state.basicParameters.temperature).toBe(50)
      expect(result.current.state.hasUnsavedChanges).toBe(true)
    })

    it("should detect changes for pivot parameter", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.updateBasicParameter("pivot", 0.7)
      })

      expect(result.current.hasChanges).toBe(true)
    })
  })

  describe("Curves", () => {
    it("should update curve points", () => {
      const { result } = renderHook(() => useColorGrading())

      const newPoints = [
        { x: 0, y: 256, id: "start" },
        { x: 128, y: 128, id: "mid" },
        { x: 256, y: 0, id: "end" },
      ]

      act(() => {
        result.current.updateCurve("master", newPoints)
      })

      expect(result.current.state.curves.master).toHaveLength(3)
      expect(result.current.state.curves.master[1].id).toBe("mid")
    })
  })

  describe("LUT", () => {
    it("should load LUT file", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("film-kodak-2383")
      })

      expect(result.current.state.lut.file).toBe("film-kodak-2383")
      expect(result.current.state.lut.isEnabled).toBe(true)
    })

    it("should update LUT intensity", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.setLUTIntensity(75)
      })

      expect(result.current.state.lut.intensity).toBe(75)
    })

    it("should toggle LUT", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("orange-teal")
        result.current.toggleLUT(false)
      })

      expect(result.current.state.lut.isEnabled).toBe(false)
      expect(result.current.state.lut.file).toBe("orange-teal")
    })
  })

  describe("Scopes", () => {
    it("should toggle scope visibility through dispatch", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.dispatch({
          type: "TOGGLE_SCOPE",
          scopeType: "vectorscope",
          enabled: true,
        })
      })

      expect(result.current.state.scopes.vectorscopeEnabled).toBe(true)
    })

    it("should update refresh rate through dispatch", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.dispatch({
          type: "SET_SCOPE_REFRESH_RATE",
          value: 60,
        })
      })

      expect(result.current.state.scopes.refreshRate).toBe(60)
    })
  })

  describe("Reset", () => {
    it("should reset all settings", () => {
      const { result } = renderHook(() => useColorGrading())

      // Make some changes
      act(() => {
        result.current.updateColorWheel("gamma", { r: 50, g: 50, b: 50 })
        result.current.updateBasicParameter("contrast", 25)
        result.current.loadLUT("vintage-fade")
      })

      expect(result.current.hasChanges).toBe(true)

      // Reset
      act(() => {
        result.current.resetAll()
      })

      expect(result.current.state.colorWheels.gamma).toEqual({ r: 0, g: 0, b: 0 })
      expect(result.current.state.basicParameters.contrast).toBe(0)
      expect(result.current.state.lut.file).toBeNull()
      expect(result.current.hasChanges).toBe(false)
    })

    it("should reset LUT through dispatch", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.loadLUT("bw-contrast")
      })

      act(() => {
        result.current.dispatch({ type: "RESET_LUT" })
      })

      expect(result.current.state.lut.file).toBeNull()
      expect(result.current.state.lut.isEnabled).toBe(false)
    })
  })

  describe("Dispatch", () => {
    it("should handle unknown action types", () => {
      const { result } = renderHook(() => useColorGrading())
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      act(() => {
        result.current.dispatch({ type: "UNKNOWN_ACTION" })
      })

      expect(consoleSpy).toHaveBeenCalledWith("Unknown action type:", "UNKNOWN_ACTION")
      consoleSpy.mockRestore()
    })
  })

  describe("Preview", () => {
    it("should toggle preview", () => {
      const { result } = renderHook(() => useColorGrading())

      act(() => {
        result.current.togglePreview(false)
      })

      expect(result.current.state.previewEnabled).toBe(false)

      act(() => {
        result.current.togglePreview(true)
      })

      expect(result.current.state.previewEnabled).toBe(true)
    })
  })
})
