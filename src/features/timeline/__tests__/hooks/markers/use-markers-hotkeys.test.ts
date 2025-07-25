import { renderHook } from "@testing-library/react"
import { useHotkeys } from "react-hotkeys-hook"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMarkerHotkeys } from "../../../hooks/use-marker-hotkeys"

// Mock useHotkeys - must be declared before importing
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}))

// Mock useTimelineMarkers
const mockUseTimelineMarkers = {
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
  goToMarker: vi.fn(),
  goToNextMarker: vi.fn(),
  goToPreviousMarker: vi.fn(),
  getMarkerAtTime: vi.fn(),
  markers: [
    { id: "marker-1", time: 10, name: "Chapter 1", type: "chapter", color: "#3b82f6" },
    { id: "marker-2", time: 25, name: "Note", type: "note", color: "#f59e0b" },
  ],
}

vi.mock("../../../hooks/use-timeline-markers", () => ({
  useTimelineMarkers: () => mockUseTimelineMarkers,
}))

// Mock useTimeline
const mockUseTimeline = {
  currentTime: 15.5,
  selectedMarkerId: null,
  seek: vi.fn(),
}

vi.mock("../../../hooks/use-timeline", () => ({
  useTimeline: () => mockUseTimeline,
}))

describe("useMarkersHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем все mock функции
    Object.values(mockUseTimelineMarkers).forEach((mockFn) => {
      if (typeof mockFn === "function" && "mockClear" in mockFn) {
        mockFn.mockClear()
      }
    })
    mockUseTimeline.seek.mockClear()
    
    // Сбрасываем маркеры к исходному состоянию
    mockUseTimelineMarkers.markers = [
      { id: "marker-1", time: 10, name: "Chapter 1", type: "chapter", color: "#3b82f6" },
      { id: "marker-2", time: 25, name: "Note", type: "note", color: "#f59e0b" },
    ]
  })

  it("регистрирует горячие клавиши для маркеров", () => {
    renderHook(() => useMarkerHotkeys())

    // Проверяем, что useHotkeys был вызван правильное количество раз
    expect(vi.mocked(useHotkeys)).toHaveBeenCalledTimes(8)

    // Проверяем некоторые ключевые вызовы (первый параметр - комбинация клавиш)
    const calls = vi.mocked(useHotkeys).mock.calls
    const shortcuts = calls.map((call) => call[0])

    expect(shortcuts).toContain("m")
    expect(shortcuts).toContain("shift+m")
    expect(shortcuts).toContain("cmd+m, ctrl+m")
    expect(shortcuts).toContain("delete")
    expect(shortcuts).toContain("'")
    expect(shortcuts).toContain(";")
    expect(shortcuts).toContain("shift+'")
    expect(shortcuts).toContain("shift+;")

    // Проверяем, что все вызовы имеют правильные опции
    calls.forEach((call) => {
      expect(call[2]).toEqual(
        expect.objectContaining({
          enableOnFormTags: false,
        }),
      )
    })
  })

  it("добавляет маркер при нажатии M", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем колбэк для клавиши M
    const addMarkerCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "m")?.[1]

    // Вызываем колбэк
    addMarkerCallback?.(new KeyboardEvent("keydown"), { keys: ["m"] })

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Marker"),
      type: "note",
      color: "#3b82f6"
    })
  })

  it("добавляет маркер главы при нажатии Shift+M", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем колбэк для Shift+M
    const addChapterCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "shift+m")?.[1]

    // Вызываем колбэк
    addChapterCallback?.(new KeyboardEvent("keydown"), { keys: ["shift+m"] })

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Chapter"),
      type: "chapter",
      color: "#10b981"
    })
  })

  it("удаляет выбранный маркер при нажатии Delete", () => {
    // Добавляем маркер близко к текущему времени (15.5), чтобы getMarkerAtTime его нашёл
    mockUseTimelineMarkers.markers = [
      ...mockUseTimelineMarkers.markers,
      { id: "marker-at-15.5", time: 15.45, name: "Current Marker", type: "note", color: "#f59e0b" }
    ]

    renderHook(() => useMarkerHotkeys())

    // Получаем колбэк для Delete
    const deleteCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "delete")?.[1]

    // Вызываем колбэк
    deleteCallback?.(new KeyboardEvent("keydown"), { keys: ["delete"] })

    expect(mockUseTimelineMarkers.removeMarker).toHaveBeenCalledWith("marker-at-15.5")
  })

  it("не удаляет маркер если ничего не выбрано", () => {
    // Используем маркеры которые далеко от текущего времени (15.5), чтобы getMarkerAtTime не нашёл их
    // Маркеры в 10 и 25 секундах далеко от 15.5, поэтому ничего не найдёт

    renderHook(() => useMarkerHotkeys())

    // Получаем колбэк для Delete
    const deleteCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "delete")?.[1]

    // Вызываем колбэк
    deleteCallback?.(new KeyboardEvent("keydown"), { keys: ["delete"] })

    expect(mockUseTimelineMarkers.removeMarker).not.toHaveBeenCalled()
  })

  it("переходит к предыдущему маркеру при нажатии ; (semicolon)", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем колбэк для ; (semicolon) - go to previous marker
    const prevMarkerCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === ";")?.[1]

    // Вызываем колбэк
    prevMarkerCallback?.(new KeyboardEvent("keydown"), { keys: [";"] })

    // Должен вызывать seek с временем предыдущего маркера (10 секунд)
    expect(mockUseTimeline.seek).toHaveBeenCalledWith(10)
  })

  it("переходит к следующему маркеру при нажатии ' (apostrophe)", () => {
    renderHook(() => useMarkerHotkeys())

    // Получаем колбэк для ' (apostrophe) - go to next marker
    const nextMarkerCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "'")?.[1]

    // Вызываем колбэк
    nextMarkerCallback?.(new KeyboardEvent("keydown"), { keys: ["'"] })

    // Должен вызывать seek с временем следующего маркера (25 секунд)
    expect(mockUseTimeline.seek).toHaveBeenCalledWith(25)
  })


  it("генерирует правильные имена для новых маркеров", () => {
    // Тест для обычного маркера
    renderHook(() => useMarkerHotkeys())

    const addMarkerCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "m")?.[1]

    addMarkerCallback?.(new KeyboardEvent("keydown"), { keys: ["m"] })

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Marker"),
      type: "note",
      color: "#3b82f6"
    })

    // Тест для маркера главы
    const addChapterCallback = vi.mocked(useHotkeys).mock.calls.find((call) => call[0] === "shift+m")?.[1]

    addChapterCallback?.(new KeyboardEvent("keydown"), { keys: ["shift+m"] })

    expect(mockUseTimelineMarkers.addMarker).toHaveBeenCalledWith({
      time: 15.5,
      name: expect.stringContaining("Chapter"),
      type: "chapter",
      color: "#10b981"
    })
  })

  it("настраивает правильные опции для горячих клавиш", () => {
    renderHook(() => useMarkerHotkeys())

    // Проверяем опции для каждого вызова useHotkeys
    vi.mocked(useHotkeys).mock.calls.forEach((call) => {
      const options = call[2]
      expect(options).toEqual({
        enableOnFormTags: false,
      })
    })
  })
})
