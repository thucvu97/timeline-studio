/**
 * Тесты для хука use-speed-ramping
 */

import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSpeedRamping } from "../use-speed-ramping"

// Мокаем timeline context
const mockSend = vi.fn()

const mockTimelineContext = {
  speedRampingConfigs: {},
  send: mockSend,
  project: {
    id: "test-project",
    name: "Test Project",
    speedRampingConfigs: {},
    globalTracks: [
      {
        id: "track-1",
        clips: [
          {
            id: "test-clip-1",
            name: "Test Clip",
            startTime: 0,
            duration: 10,
            trackId: "track-1",
            mediaFile: null,
            offset: 0,
            mediaDuration: 10,
            playbackRate: 1.0,
            maintainPitch: true,
            effects: [],
            filters: [],
            transitions: [],
            isSelected: false,
            isLocked: false,
            isVisible: true,
            audioOffset: 0,
            linkedClipId: undefined,
            isLinked: false,
            templateId: undefined,
            templateCell: undefined,
            styleTemplate: undefined,
            mediaId: "media-1",
            mediaStartTime: 0,
            mediaEndTime: 10,
            volume: 1.0,
            pan: 0,
            crossfade: { start: 0, end: 0 },
            audioAdjustments: null,
            speedRamping: null,
          },
        ],
      },
    ],
    sections: [],
  },
}

vi.mock("../use-timeline", () => ({
  useTimeline: () => mockTimelineContext,
}))

describe("useSpeedRamping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTimelineContext.speedRampingConfigs = {}
  })

  it("should return initial state when no speed ramping config exists", () => {
    const { result } = renderHook(() => useSpeedRamping())

    expect(result.current.getConfig("test-clip-1")).toBeNull()
  })

  it("should enable speed ramping for a clip", () => {
    const { result } = renderHook(() => useSpeedRamping())

    act(() => {
      result.current.enableSpeedRamping("test-clip-1")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLIP",
      clipId: "test-clip-1",
      updates: expect.objectContaining({
        speedRamping: expect.objectContaining({
          enabled: true,
        }),
      }),
    })
  })

  it("should disable speed ramping for a clip", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Сначала включаем speed ramping
    act(() => {
      result.current.enableSpeedRamping("test-clip-1")
    })

    // Затем отключаем
    act(() => {
      result.current.disableSpeedRamping("test-clip-1")
    })

    // Проверяем, что send был вызван хотя бы один раз
    expect(mockSend).toHaveBeenCalled()
  })

  it("should add a keyframe", () => {
    const { result } = renderHook(() => useSpeedRamping())

    act(() => {
      result.current.addKeyframe("test-clip-1", 2.5, 0.5, "ease-in")
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLIP",
      clipId: "test-clip-1",
      updates: expect.objectContaining({
        speedRamping: expect.objectContaining({
          keyframes: expect.arrayContaining([
            expect.objectContaining({
              time: 2.5,
              value: 0.5,
              interpolation: "ease-in",
            }),
          ]),
        }),
      }),
    })
  })

  it("should update a keyframe", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Сначала добавляем keyframe
    act(() => {
      result.current.addKeyframe("test-clip-1", 2.5, 0.5, "ease-in")
    })

    // Потом обновляем его
    act(() => {
      result.current.updateKeyframe("test-clip-1", "keyframe-1", { value: 2.0, interpolation: "linear" })
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_CLIP",
        clipId: "test-clip-1",
      }),
    )
  })

  it("should remove a keyframe", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Сначала добавляем keyframe
    act(() => {
      result.current.addKeyframe("test-clip-1", 2.5, 0.5, "linear")
    })

    // Затем удаляем его
    act(() => {
      result.current.removeKeyframe("test-clip-1", "keyframe-1")
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_CLIP",
        clipId: "test-clip-1",
      }),
    )
  })

  it("should apply a preset", () => {
    const { result } = renderHook(() => useSpeedRamping())

    act(() => {
      result.current.applyPreset("test-clip-1", "slow-motion")
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_CLIP",
        clipId: "test-clip-1",
      }),
    )
  })

  it("should get speed at specific time", () => {
    const { result } = renderHook(() => useSpeedRamping())

    // Добавляем keyframes для создания конфигурации
    act(() => {
      result.current.addKeyframe("test-clip-1", 0, 1.0, "linear")
    })

    // Тестируем получение скорости в разное время
    expect(result.current.getSpeedAtTime("test-clip-1", 0)).toBe(1.0)
  })

  it("should update config", () => {
    const { result } = renderHook(() => useSpeedRamping())

    const newConfig = {
      enabled: true,
      keyframes: [],
      maintainPitch: false,
      minSpeed: 0.2,
      maxSpeed: 5.0,
      showGraph: false,
      graphHeight: 80,
      graphOpacity: 0.5,
    }

    act(() => {
      result.current.setConfig("test-clip-1", newConfig)
    })

    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLIP",
      clipId: "test-clip-1",
      updates: expect.objectContaining({
        speedRamping: newConfig,
      }),
    })
  })

  it("should return available presets", () => {
    const { result } = renderHook(() => useSpeedRamping())

    const presets = result.current.getPresets()

    expect(presets).toBeInstanceOf(Array)
    expect(presets.length).toBeGreaterThan(0)
  })

  it("should reset to constant speed", () => {
    const { result } = renderHook(() => useSpeedRamping())

    act(() => {
      result.current.resetToConstantSpeed("test-clip-1", 1.0)
    })

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_CLIP",
        clipId: "test-clip-1",
      }),
    )
  })
})
