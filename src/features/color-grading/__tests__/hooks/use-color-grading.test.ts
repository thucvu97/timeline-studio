import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useColorGrading } from "../../hooks/use-color-grading"
import { BUILT_IN_PRESETS } from "../../types/presets"

// Мокаем localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, "localStorage", { value: mockLocalStorage })

describe("useColorGrading", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue("[]")
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useColorGrading())

    expect(result.current.state.colorWheels).toEqual({
      lift: { r: 0, g: 0, b: 0 },
      gamma: { r: 0, g: 0, b: 0 },
      gain: { r: 0, g: 0, b: 0 },
      offset: { r: 0, g: 0, b: 0 },
    })

    expect(result.current.state.basicParameters).toEqual({
      temperature: 0,
      tint: 0,
      contrast: 0,
      pivot: 0.5,
      saturation: 0,
      hue: 0,
      luminance: 0,
    })

    expect(result.current.state.previewEnabled).toBe(true)
    expect(result.current.state.isActive).toBe(false)
    expect(result.current.hasChanges).toBe(false)
  })

  it("should update color wheel values", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.updateColorWheel("lift", { r: 10, g: 20, b: 30 })
    })

    expect(result.current.state.colorWheels.lift).toEqual({ r: 10, g: 20, b: 30 })
    expect(result.current.state.hasUnsavedChanges).toBe(true)
    expect(result.current.hasChanges).toBe(true)
  })

  it("should update basic parameters", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.updateBasicParameter("temperature", 50)
    })

    expect(result.current.state.basicParameters.temperature).toBe(50)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
    expect(result.current.hasChanges).toBe(true)
  })

  it("should update curves", () => {
    const { result } = renderHook(() => useColorGrading())

    const newPoints = [
      { x: 0, y: 256, id: "start" },
      { x: 128, y: 128, id: "mid" },
      { x: 256, y: 0, id: "end" },
    ]

    act(() => {
      result.current.updateCurve("master", newPoints)
    })

    expect(result.current.state.curves.master).toEqual(newPoints)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should load LUT file", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.loadLUT("/path/to/lut.cube")
    })

    expect(result.current.state.lut.file).toBe("/path/to/lut.cube")
    expect(result.current.state.lut.isEnabled).toBe(true)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should set LUT intensity", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.setLUTIntensity(75)
    })

    expect(result.current.state.lut.intensity).toBe(75)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should toggle LUT", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.toggleLUT(true)
    })

    expect(result.current.state.lut.isEnabled).toBe(true)

    act(() => {
      result.current.toggleLUT(false)
    })

    expect(result.current.state.lut.isEnabled).toBe(false)
  })

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

  it("should reset all settings", () => {
    const { result } = renderHook(() => useColorGrading())

    // Сначала изменим некоторые настройки
    act(() => {
      result.current.updateColorWheel("lift", { r: 10, g: 20, b: 30 })
      result.current.updateBasicParameter("temperature", 50)
    })

    // Теперь сбросим
    act(() => {
      result.current.resetAll()
    })

    expect(result.current.state.colorWheels.lift).toEqual({ r: 0, g: 0, b: 0 })
    expect(result.current.state.basicParameters.temperature).toBe(0)
    expect(result.current.hasChanges).toBe(false)
  })

  it("should load preset", () => {
    const { result } = renderHook(() => useColorGrading())
    const presetId = BUILT_IN_PRESETS[0].id

    act(() => {
      result.current.loadPreset(presetId)
    })

    expect(result.current.state.currentPreset).toBe(presetId)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should save custom preset", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.savePreset("My Custom Preset")
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "colorGradingPresets",
      expect.stringContaining("My Custom Preset")
    )
  })

  it("should apply auto correction", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.autoCorrect()
    })

    // Проверяем, что автокоррекция изменила кривые
    expect(result.current.state.curves.master).toHaveLength(3)
    expect(result.current.state.basicParameters.contrast).toBe(5)
    expect(result.current.state.basicParameters.saturation).toBe(5)
    expect(result.current.state.hasUnsavedChanges).toBe(true)
  })

  it("should handle dispatch actions", () => {
    const { result } = renderHook(() => useColorGrading())

    act(() => {
      result.current.dispatch({
        type: "UPDATE_COLOR_WHEEL",
        wheel: "gamma",
        value: { r: 5, g: 10, b: 15 },
      })
    })

    expect(result.current.state.colorWheels.gamma).toEqual({ r: 5, g: 10, b: 15 })

    act(() => {
      result.current.dispatch({
        type: "UPDATE_BASIC_PARAMETER",
        parameter: "tint",
        value: 25,
      })
    })

    expect(result.current.state.basicParameters.tint).toBe(25)
  })

  it("should detect changes correctly", () => {
    const { result } = renderHook(() => useColorGrading())

    // Изначально нет изменений
    expect(result.current.hasChanges).toBe(false)

    // Изменяем цветовое колесо
    act(() => {
      result.current.updateColorWheel("lift", { r: 5, g: 0, b: 0 })
    })

    expect(result.current.hasChanges).toBe(true)

    // Сбрасываем
    act(() => {
      result.current.resetAll()
    })

    expect(result.current.hasChanges).toBe(false)

    // Изменяем базовый параметр
    act(() => {
      result.current.updateBasicParameter("temperature", 10)
    })

    expect(result.current.hasChanges).toBe(true)
  })

  it("should return available presets", () => {
    const { result } = renderHook(() => useColorGrading())

    expect(result.current.availablePresets).toEqual(BUILT_IN_PRESETS)
    expect(result.current.availablePresets.length).toBeGreaterThan(0)
  })
})