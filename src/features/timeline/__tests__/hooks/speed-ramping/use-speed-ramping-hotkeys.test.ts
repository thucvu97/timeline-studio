import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSpeedRampingHotkeys } from "../../../hooks/use-speed-ramping-hotkeys"

// Mock useHotkeys
const mockUseHotkeys = vi.fn()
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: (...args: any[]) => mockUseHotkeys(...args),
}))

// Mock useSpeedRamping
const mockUseSpeedRamping = {
  resetToConstantSpeed: vi.fn(),
}

vi.mock("../../../hooks/use-speed-ramping", () => ({
  useSpeedRamping: () => mockUseSpeedRamping,
}))

// Mock useTimeline
const mockSend = vi.fn()
const mockUseTimeline = {
  send: mockSend,
  uiState: {
    selectedClipIds: ["test-clip-1", "test-clip-2"],
  },
}

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline,
}))

describe("useSpeedRampingHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("регистрирует горячие клавиши", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Проверяем, что useHotkeys был вызван для каждой комбинации клавиш
    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "cmd+shift+r, ctrl+shift+r",
      expect.any(Function),
      expect.objectContaining({
        enableOnFormTags: false,
        enabled: true,
      }),
    )

    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "cmd+alt+r, ctrl+alt+r",
      expect.any(Function),
      expect.objectContaining({
        enableOnFormTags: false,
        enabled: true,
      }),
    )

    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "5",
      expect.any(Function),
      expect.objectContaining({
        enableOnFormTags: false,
        enabled: true,
      }),
    )

    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "2",
      expect.any(Function),
      expect.objectContaining({
        enableOnFormTags: false,
        enabled: true,
      }),
    )

    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "4",
      expect.any(Function),
      expect.objectContaining({
        enableOnFormTags: false,
        enabled: true,
      }),
    )

    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "cmd+r, ctrl+r",
      expect.any(Function),
      expect.objectContaining({
        enableOnFormTags: false,
        enabled: true,
      }),
    )
  })

  it("включает speed ramping при нажатии Cmd+Shift+R", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем колбэк для Cmd+Shift+R
    const toggleCallback = mockUseHotkeys.mock.calls.find((call) => call[0] === "cmd+shift+r, ctrl+shift+r")?.[1]

    // Создаем фиктивное событие
    const mockEvent = { preventDefault: vi.fn() }

    // Вызываем колбэк
    toggleCallback?.(mockEvent)

    expect(mockSend).toHaveBeenCalledWith({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "test-clip-1",
    })
    expect(mockSend).toHaveBeenCalledWith({
      type: "ENABLE_SPEED_RAMPING",
      clipId: "test-clip-2",
    })
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it("сбрасывает к нормальной скорости при нажатии Cmd+Alt+R", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем колбэк для Cmd+Alt+R
    const resetCallback = mockUseHotkeys.mock.calls.find((call) => call[0] === "cmd+alt+r, ctrl+alt+r")?.[1]

    // Создаем фиктивное событие
    const mockEvent = { preventDefault: vi.fn() }

    // Вызываем колбэк
    resetCallback?.(mockEvent)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 1.0)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 1.0)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it("устанавливает скорость 0.5x при нажатии клавиши 5", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем колбэк для клавиши 5
    const slowCallback = mockUseHotkeys.mock.calls.find((call) => call[0] === "5")?.[1]

    // Создаем фиктивное событие
    const mockEvent = { preventDefault: vi.fn() }

    // Вызываем колбэк
    slowCallback?.(mockEvent)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 0.5)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 0.5)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it("устанавливает скорость 2x при нажатии клавиши 2", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем колбэк для клавиши 2
    const fastCallback = mockUseHotkeys.mock.calls.find((call) => call[0] === "2")?.[1]

    // Создаем фиктивное событие
    const mockEvent = { preventDefault: vi.fn() }

    // Вызываем колбэк
    fastCallback?.(mockEvent)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 2.0)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 2.0)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it("устанавливает скорость 4x при нажатии клавиши 4", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Получаем колбэк для клавиши 4
    const veryFastCallback = mockUseHotkeys.mock.calls.find((call) => call[0] === "4")?.[1]

    // Создаем фиктивное событие
    const mockEvent = { preventDefault: vi.fn() }

    // Вызываем колбэк
    veryFastCallback?.(mockEvent)

    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-1", 4.0)
    expect(mockUseSpeedRamping.resetToConstantSpeed).toHaveBeenCalledWith("test-clip-2", 4.0)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
  })

  it("не выполняет действия если нет выбранных клипов", () => {
    const originalUiState = mockUseTimeline.uiState
    mockUseTimeline.uiState = { selectedClipIds: [] }

    renderHook(() => useSpeedRampingHotkeys())

    // Получаем колбэк для включения speed ramping
    const toggleCallback = mockUseHotkeys.mock.calls.find((call) => call[0] === "cmd+shift+r, ctrl+shift+r")?.[1]

    // Создаем фиктивное событие
    const mockEvent = { preventDefault: vi.fn() }

    // Вызываем колбэк
    toggleCallback?.(mockEvent)

    // Функции не должны быть вызваны
    expect(mockSend).not.toHaveBeenCalled()
    expect(mockEvent.preventDefault).toHaveBeenCalled()

    // Восстанавливаем состояние
    mockUseTimeline.uiState = originalUiState
  })

  it("настраивает правильные опции для горячих клавиш", () => {
    renderHook(() => useSpeedRampingHotkeys())

    // Проверяем опции для каждого вызова useHotkeys
    mockUseHotkeys.mock.calls.forEach((call) => {
      const options = call[2]
      expect(options).toEqual({
        enableOnFormTags: false,
        enabled: true,
      })
    })
  })
})
