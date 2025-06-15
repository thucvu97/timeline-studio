import React from "react"

import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { PlayerProvider, usePlayer } from "../../services/player-provider"

// Мокаем useUserSettings
const mockHandlePlayerVolumeChange = vi.fn()
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 100,
    handlePlayerVolumeChange: mockHandlePlayerVolumeChange,
  }),
}))

// Создаем мок для send функции
const mockSend = vi.fn()

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: {
        video: null,
        currentTime: 0,
        isPlaying: false,
        isSeeking: false,
        isChangingCamera: false,
        isRecording: false,
        isVideoLoading: false,
        isVideoReady: false,
        isResizableMode: true,
        duration: 0,
        volume: 100,
        previewMedia: null,
        videoSource: "browser",
        appliedEffects: [],
        appliedFilters: [],
        appliedTemplate: null,
      },
    },
    mockSend,
  ]),
}))

// Мокаем playerMachine
vi.mock("../../services/player-machine", () => ({
  playerMachine: {
    id: "player",
    initial: "idle",
    context: {
      video: null,
      currentTime: 0,
      isPlaying: false,
      isSeeking: false,
      isChangingCamera: false,
      isRecording: false,
      isVideoLoading: false,
      isVideoReady: false,
      isResizableMode: true,
      duration: 0,
      volume: 100,
      previewMedia: null,
      videoSource: "browser",
      appliedEffects: [],
      appliedFilters: [],
      appliedTemplate: null,
    },
  },
  PlayerContextType: {},
}))

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  mockSend.mockClear()
  mockHandlePlayerVolumeChange.mockClear()
  vi.spyOn(console, "log").mockImplementation(() => {})
})

const mockMediaFile: MediaFile = {
  id: "test-file",
  name: "test.mp4",
  path: "/test/test.mp4",
  isVideo: true,
  duration: 120,
  size: 1024,
  extension: "mp4",
  isLocal: true,
  isDirectory: false,
  lastModified: Date.now(),
}

describe("PlayerProvider", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PlayerProvider>{children}</PlayerProvider>
  )

  it("should render without errors", () => {
    // Рендерим провайдер с тестовым содержимым
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
    it("should call applyEffect and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const effect = {
        id: "effect-1",
        name: "Blur Effect",
        params: { intensity: 0.5 },
      }

      act(() => {
        result.current.applyEffect(effect)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "applyEffect",
        effect,
      })
    })

    it("should call applyFilter and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const filter = {
        id: "filter-1",
        name: "Vintage Filter",
        params: { saturation: 0.8 },
      }

      act(() => {
        result.current.applyFilter(filter)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "applyFilter",
        filter,
      })
    })

    it("should call applyTemplate and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      const template = {
        id: "template-1",
        name: "Split Screen",
      }
      
      const files = [mockMediaFile]

      act(() => {
        result.current.applyTemplate(template, files)
      })

      // Фильтруем вызовы setVolume
      const applyTemplateCalls = mockSend.mock.calls.filter(
        call => call[0].type === "applyTemplate"
      )
      
      expect(applyTemplateCalls).toHaveLength(1)
      expect(applyTemplateCalls[0][0]).toEqual({
        type: "applyTemplate",
        files,
        template: {
          id: template.id,
          name: template.name,
        },
      })
    })

    it("should call clearEffects and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.clearEffects()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "clearEffects" })
    })

    it("should call clearFilters and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.clearFilters()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "clearFilters" })
    })

    it("should call clearTemplate and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.clearTemplate()
      })

      expect(mockSend).toHaveBeenCalledWith({ type: "clearTemplate" })
    })

    it("should call setPreviewMedia and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setPreviewMedia(mockMediaFile)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "setPreviewMedia",
        media: mockMediaFile,
      })
    })

    it("should call setVideoSource and send correct event", () => {
      const { result } = renderHook(() => usePlayer(), { wrapper })

      act(() => {
        result.current.setVideoSource("timeline")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "setVideoSource",
        source: "timeline",
      })
    })
  })
})
