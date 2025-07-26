import React from "react"

import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MediaFile } from "@/features/media/types/media"

// Мокаем backend-sync ДО импорта компонентов
const mockExecuteCommand = vi.fn().mockResolvedValue({ success: true })
const mockOnStateChange = vi.fn(() => () => {})

vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: () => ({
    onStateChange: mockOnStateChange,
    sendCommand: vi.fn(),
    executeCommand: mockExecuteCommand,
    onEvent: vi.fn(() => () => {}),
  }),
}))

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => {
  const mockHandlePlayerVolumeChange = vi.fn()

  return {
    useUserSettings: () => ({
      playerVolume: 100,
      handlePlayerVolumeChange: mockHandlePlayerVolumeChange,
    }),
  }
})

// Мокаем AppCommands
vi.mock("@/features/app-state/services/app-machine", () => ({
  AppCommands: {
    playerSetMedia: (mediaId: string, startTime?: number) => ({
      type: "playerSetMedia",
      params: { mediaId, startTime },
    }),
    playerSetVolume: (volume: number) => ({
      type: "playerSetVolume",
      params: { volume },
    }),
    playerSelectClip: (clipId: string) => ({
      type: "playerSelectClip",
      params: { clipId },
    }),
    playerClearSelection: () => ({
      type: "playerClearSelection",
    }),
    playerSetSource: (source: string) => ({
      type: "playerSetSource",
      params: { source },
    }),
    playerApplyEffect: (effectId: string, params: any) => ({
      type: "playerApplyEffect",
      params: { effectId, params },
    }),
    playerApplyFilter: (filterId: string, params: any) => ({
      type: "playerApplyFilter",
      params: { filterId, params },
    }),
    playerApplyTemplate: (templateId: string, mediaIds: string[]) => ({
      type: "playerApplyTemplate",
      params: { templateId, mediaIds },
    }),
    playerClearEffects: () => ({
      type: "playerClearEffects",
      params: {},
    }),
    playerClearFilters: () => ({
      type: "playerClearFilters",
      params: {},
    }),
    playerClearTemplate: () => ({
      type: "playerClearTemplate",
      params: {},
    }),
  },
}))

// Импортируем нужные модули для доступа к мокам
import { useUserSettings } from "@/features/user-settings"

import { PlayerProvider, usePlayer } from "../../services/player-provider"

// Получаем ссылки на мокнутые функции
const mockUserSettings = vi.mocked(useUserSettings)()
const mockHandlePlayerVolumeChange = mockUserSettings.handlePlayerVolumeChange as ReturnType<typeof vi.fn>

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  mockExecuteCommand.mockClear()
  mockOnStateChange.mockClear()
  vi.spyOn(console, "log").mockImplementation(() => {})
  vi.spyOn(console, "error").mockImplementation(() => {})
})

const mockMediaFile: MediaFile = {
  id: "test-file",
  name: "test.mp4",
  path: "/test/test.mp4",
  isVideo: true,
  duration: 120,
}

const wrapper = ({ children }: { children: React.ReactNode }) => <PlayerProvider>{children}</PlayerProvider>

describe("PlayerProvider", () => {
  it("should render without errors", () => {
    render(
      <PlayerProvider>
        <div data-testid="test-content">Test Content</div>
      </PlayerProvider>,
    )

    // Проверяем, что содержимое отрендерилось
    expect(screen.getByTestId("test-content")).toBeInTheDocument()
    expect(screen.getByTestId("test-content").textContent).toBe("Test Content")
  })

  describe("Preview Apply Workflow", () => {
    it("should apply effect locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const effect = {
        id: "effect-1",
        name: "Blur Effect",
        params: { intensity: 0.5 },
      }

      act(() => {
        result.current.applyEffect(effect)
      })

      // В новой архитектуре applyEffect локальная функция
      expect(result.current.appliedEffects).toContainEqual(effect)
    })

    it("should apply filter locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const filter = {
        id: "filter-1",
        name: "Vintage Filter",
        params: { saturation: 0.8 },
      }

      act(() => {
        result.current.applyFilter(filter)
      })

      // В новой архитектуре applyFilter локальная функция
      expect(result.current.appliedFilters).toContainEqual(filter)
    })

    it("should apply template locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const template = {
        id: "template-1",
        name: "Split Screen",
      }

      const files = [mockMediaFile]

      act(() => {
        result.current.applyTemplate(template, files)
      })

      // В новой архитектуре applyTemplate локальная функция
      expect(result.current.appliedTemplate).toEqual(template)
    })

    it("should clear effects locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Сначала добавляем эффект
      const effect = {
        id: "effect-1",
        name: "Blur Effect",
        params: { intensity: 0.5 },
      }

      act(() => {
        result.current.applyEffect(effect)
      })

      expect(result.current.appliedEffects).toHaveLength(1)

      // Затем очищаем
      act(() => {
        result.current.clearEffects()
      })

      expect(result.current.appliedEffects).toHaveLength(0)
    })

    it("should clear filters locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Сначала добавляем фильтр
      const filter = {
        id: "filter-1",
        name: "Vintage Filter",
        params: { saturation: 0.8 },
      }

      act(() => {
        result.current.applyFilter(filter)
      })

      expect(result.current.appliedFilters).toHaveLength(1)

      // Затем очищаем
      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.appliedFilters).toHaveLength(0)
    })

    it("should clear template locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Сначала применяем шаблон
      const template = {
        id: "template-1",
        name: "Split Screen",
      }

      act(() => {
        result.current.applyTemplate(template, [mockMediaFile])
      })

      expect(result.current.appliedTemplate).toBeTruthy()

      // Затем очищаем
      act(() => {
        result.current.clearTemplate()
      })

      expect(result.current.appliedTemplate).toBeNull()
    })
  })

  describe("Backend Commands", () => {
    it("should send play command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await act(async () => {
        await result.current.play()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Play",
        params: {},
      })
    })

    it("should send pause command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await act(async () => {
        await result.current.pause()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Pause",
        params: {},
      })
    })

    it("should send seek command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await act(async () => {
        await result.current.seek(30)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Seek",
        params: { time: 30 },
      })
    })

    it("should send setPlaybackRate command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await act(async () => {
        await result.current.setPlaybackRate(2)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SetPlaybackRate",
        params: { rate: 2 },
      })
    })

    it("should send playerSetMedia command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await act(async () => {
        await result.current.playerSetMedia("media-123", 10)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "playerSetMedia",
        params: { mediaId: "media-123", startTime: 10 },
      })
    })

    it("should send playerSetVolume command", async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      await act(async () => {
        await result.current.playerSetVolume(75)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "playerSetVolume",
        params: { volume: 75 },
      })
    })
  })

  describe("Local State Management", () => {
    it("should update volume locally and call user settings handler", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVolume(0.5) // Set volume to 50% in 0-1 range
      })

      expect(result.current.volume).toBe(0.5)
      expect(mockHandlePlayerVolumeChange).toHaveBeenCalledWith(50) // Should convert to percentage for user settings
    })

    it("should update duration locally", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setDuration(180)
      })

      expect(result.current.duration).toBe(180)
    })

    it("should update video loading state", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVideoLoading(true)
      })

      expect(result.current.isVideoLoading).toBe(true)

      act(() => {
        result.current.setVideoLoading(false)
      })

      expect(result.current.isVideoLoading).toBe(false)
    })

    it("should update current video", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setCurrentVideo(mockMediaFile)
      })

      expect(result.current.currentVideo).toEqual(mockMediaFile)
    })

    it("should update video source", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVideoSource("browser")
      })

      expect(result.current.videoSource).toBe("browser")

      act(() => {
        result.current.setVideoSource("timeline")
      })

      expect(result.current.videoSource).toBe("timeline")
    })

    it("should update prerender settings", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const newSettings = {
        prerenderEnabled: true,
        prerenderQuality: 90,
      }

      act(() => {
        result.current.setPrerenderSettings(newSettings)
      })

      expect(result.current.prerenderSettings.prerenderEnabled).toBe(true)
      expect(result.current.prerenderSettings.prerenderQuality).toBe(90)
    })
  })

  describe("Context values", () => {
    it("should provide default values", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      // Check initial values
      expect(result.current.currentTime).toBe(0)
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.playbackRate).toBe(1)
      expect(result.current.volume).toBe(1) // 100% converted to 0-1 range
      expect(result.current.duration).toBe(0)
      expect(result.current.isVideoLoading).toBe(false)
      expect(result.current.isVideoReady).toBe(false)
      expect(result.current.appliedEffects).toEqual([])
      expect(result.current.appliedFilters).toEqual([])
      expect(result.current.appliedTemplate).toBeNull()
    })
  })

  describe("Error handling", () => {
    it("should handle command execution errors", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Command failed"))

      const { result } = renderHook(() => usePlayer(), { wrapper })

      await expect(result.current.play()).rejects.toThrow("Command failed")
    })
  })
})
