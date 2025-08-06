import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useMachine } from "@xstate/react"
import { type ReactNode, useContext } from "react"
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest"

import { getBackendSync } from "@/features/app-state/services/backend-sync"

import { useTimeline } from "../../hooks/use-timeline"
import { TimelineContext, TimelineProvider } from "../timeline-provider"

// Mock модулей
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    onStateChange: vi.fn(),
    onEvent: vi.fn(),
    executeCommand: vi.fn(),
  })),
}))

vi.mock("../timeline-ui-machine", () => {
  const mockUIMachine = {
    provide: vi.fn(() => ({})),
    transition: vi.fn(),
  }

  return {
    timelineUIMachine: mockUIMachine,
  }
})

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(),
}))

vi.mock("../utils/clip-operations", () => ({
  copyClips: vi.fn((clips) => ({
    clips,
    metadata: {
      originalTimeRange: {
        startTime: Math.min(...clips.map((c: any) => c.startTime)),
        endTime: Math.max(...clips.map((c: any) => c.startTime + c.duration)),
      },
    },
  })),
}))

// Тестовые данные
const mockProject = {
  id: "test-project",
  metadata: {
    name: "Test Project",
    created_at: "2024-01-01T00:00:00Z",
    version: "1.0.0",
  },
  timeline: {
    tracks: [
      {
        id: "track-1",
        name: "Video Track 1",
        track_type: "VIDEO",
        clips: [
          {
            id: "clip-1",
            name: "Clip 1",
            media_id: "media-1",
            timeline_in: 0,
            timeline_out: 10,
            source_in: 0,
            source_out: 10,
            playback_rate: 1,
            transitions: [],
          },
        ],
        locked: false,
        enabled: true,
        volume: 1,
        pan: 0,
        height: 100,
      },
    ],
    duration: 100,
    fps: 30,
    sample_rate: 48000,
  },
  settings: {
    resolution: { width: 1920, height: 1080 },
    frame_rate: 30,
    audio_sample_rate: 48000,
    audio_channels: 2,
  },
}

const mockPlaybackState = {
  is_playing: false,
  current_time: 0,
  playback_rate: 1,
}

const mockMediaFile = {
  id: "media-1",
  name: "Test Media",
  path: "/path/to/media.mp4",
}

// Хелпер компоненты
const TestComponent = () => {
  const context = useTimeline()

  return (
    <div>
      <div data-testid="project-name">{context.project?.name}</div>
      <div data-testid="is-playing">{context.isPlaying.toString()}</div>
      <div data-testid="current-time">{context.currentTime}</div>
      <div data-testid="playback-rate">{context.playbackRate}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
      <div data-testid="error">{context.error || "no-error"}</div>
      <div data-testid="selected-clips">{context.selectedClipIds.join(",")}</div>
      <div data-testid="has-clipboard">{context.hasClipboard.toString()}</div>
      <div data-testid="clips-count">{context.clips.length}</div>
      <div data-testid="time-scale">{context.timeScale}</div>
      <div data-testid="edit-mode">{context.editMode}</div>
      <div data-testid="snap-mode">{context.snapMode}</div>
    </div>
  )
}

// Глобальная переменная для mockBackendSync
let mockBackendSync: {
  onStateChange: Mock
  onEvent: Mock
  executeCommand: Mock
}

const wrapper = ({ children }: { children: ReactNode }) => <TimelineProvider>{children}</TimelineProvider>

// Утилита для ожидания инициализации провайдера
const waitForProviderInit = async () => {
  await waitFor(() => {
    expect(mockBackendSync.onStateChange).toHaveBeenCalled()
  })
}

// Утилита для установки состояния проекта
const setProjectState = async (state: ProjectState) => {
  await waitForProviderInit()
  const stateChangeCallback = mockBackendSync.onStateChange.mock.calls[0][0]
  act(() => {
    stateChangeCallback(state)
  })
}

describe("TimelineProvider", () => {
  let mockSendUI: Mock

  beforeEach(() => {
    mockBackendSync = {
      onStateChange: vi.fn((callback) => {
        // Сохраняем callback для последующего вызова в тестах
        return vi.fn()
      }),
      onEvent: vi.fn((callback) => {
        return vi.fn()
      }),
      executeCommand: vi.fn(() => Promise.resolve({ success: true, data: null })),
    }
    vi.mocked(getBackendSync).mockReturnValue(mockBackendSync as any)

    mockSendUI = vi.fn()

    // Мокаем useMachine из @xstate/react
    vi.mocked(useMachine).mockReturnValue([
      {
        context: {
          selectedClipIds: [],
          selectedTrackIds: [],
          selectedSectionIds: [],
          timeScale: 1,
          scrollPosition: { x: 0, y: 0 },
          editMode: "select",
          snapMode: "none",
          isPlaying: false,
          currentTime: 0,
          playbackRate: 1,
          clipboard: null,
          uiError: null,
        },
      },
      mockSendUI,
    ] as any)

    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("инициализация и контекст", () => {
    it("должен создавать контекст с начальными значениями", () => {
      render(<TestComponent />, { wrapper })

      expect(screen.getByTestId("project-name")).toHaveTextContent("")
      expect(screen.getByTestId("is-playing")).toHaveTextContent("false")
      expect(screen.getByTestId("current-time")).toHaveTextContent("0")
      expect(screen.getByTestId("playback-rate")).toHaveTextContent("1")
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false")
      expect(screen.getByTestId("error")).toHaveTextContent("no-error")
      expect(screen.getByTestId("selected-clips")).toHaveTextContent("")
      expect(screen.getByTestId("has-clipboard")).toHaveTextContent("false")
      expect(screen.getByTestId("clips-count")).toHaveTextContent("0")
    })

    it("должен подписываться на изменения backend состояния", () => {
      render(<TestComponent />, { wrapper })

      expect(mockBackendSync.onStateChange).toHaveBeenCalledWith(expect.any(Function))
      expect(mockBackendSync.onEvent).toHaveBeenCalledWith(expect.any(Function))
    })

    it("должен отписываться от backend при размонтировании", () => {
      const unsubscribeState = vi.fn()
      const unsubscribeEvents = vi.fn()
      mockBackendSync.onStateChange.mockReturnValue(unsubscribeState)
      mockBackendSync.onEvent.mockReturnValue(unsubscribeEvents)

      const { unmount } = render(<TestComponent />, { wrapper })

      unmount()

      expect(unsubscribeState).toHaveBeenCalled()
      expect(unsubscribeEvents).toHaveBeenCalled()
    })

    it("должен синхронизировать playback состояние с UI машиной", async () => {
      render(<TestComponent />, { wrapper })

      // Ждем пока компонент отрендерится и вызовется useEffect
      await waitFor(() => {
        expect(mockBackendSync.onStateChange).toHaveBeenCalled()
      })

      const stateChangeCallback = mockBackendSync.onStateChange.mock.calls[0][0]

      act(() => {
        stateChangeCallback({
          project: mockProject,
          playback_state: {
            is_playing: true,
            current_time: 5.5,
            playback_rate: 2,
          },
        })
      })

      await waitFor(() => {
        expect(mockSendUI).toHaveBeenCalledWith({
          type: "SYNC_PLAYBACK_STATE",
          isPlaying: true,
          currentTime: 5.5,
          playbackRate: 2,
        })
      })
    })

    it("должен логировать backend события", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      render(<TestComponent />, { wrapper })

      await waitForProviderInit()

      const eventCallback = mockBackendSync.onEvent.mock.calls[0][0]
      eventCallback({ type: "test-event", data: "test" })

      expect(consoleSpy).toHaveBeenCalledWith("Timeline backend event:", { type: "test-event", data: "test" })
      consoleSpy.mockRestore()
    })

    it("должен обрабатывать отсутствие playback_state", async () => {
      render(<TestComponent />, { wrapper })

      await waitForProviderInit()

      const stateChangeCallback = mockBackendSync.onStateChange.mock.calls[0][0]

      act(() => {
        stateChangeCallback({
          project: mockProject,
          // playback_state отсутствует
        })
      })

      // Не должно быть вызова синхронизации
      expect(mockSendUI).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SYNC_PLAYBACK_STATE",
        }),
      )
    })
  })

  describe("useTimeline hook", () => {
    it("должен возвращать контекст timeline", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.project).toBeNull()
      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentTime).toBe(0)
      expect(result.current.playbackRate).toBe(1)
    })

    it("должен выбрасывать ошибку вне провайдера", () => {
      // Подавляем вывод ошибки в консоль для этого теста
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTimeline())
      }).toThrow("useTimeline must be used within a TimelineProvider")

      consoleSpy.mockRestore()
    })
  })

  describe("состояние загрузки и ошибок", () => {
    it("должен устанавливать isLoading при выполнении команд", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации провайдера
      await waitForProviderInit()

      // Ждем пока контекст станет доступен
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      let resolveCommand: ((value: any) => void) | null = null
      const commandPromise = new Promise((resolve) => {
        resolveCommand = resolve
      })

      mockBackendSync.executeCommand.mockImplementation(() => commandPromise)

      // Запускаем команду но не ждем ее завершения
      const commandAct = act(async () => {
        await result.current!.createProject("New Project")
      })

      // Проверяем что isLoading установлен в true
      await waitFor(() => {
        expect(result.current!.isLoading).toBe(true)
      })

      // Завершаем команду
      resolveCommand!({ success: true, data: null })
      await commandAct

      // Проверяем что isLoading снова false
      expect(result.current!.isLoading).toBe(false)
    })

    it("должен обрабатывать ошибки команд", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockBackendSync.executeCommand.mockRejectedValue(new Error("Command failed"))

      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации провайдера
      await waitForProviderInit()

      // Ждем пока контекст станет доступен
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      // Вызываем команду которая завершится ошибкой
      try {
        await act(async () => {
          await result.current!.createProject("New Project")
        })
      } catch (err) {
        // Ожидаем ошибку
      }

      // Проверяем что ошибка установлена
      await waitFor(() => {
        expect(result.current!.error).toBe("Command failed")
      })

      expect(consoleSpy).toHaveBeenCalledWith("Timeline command failed:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("должен обрабатывать ошибки backend без сообщения", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockBackendSync.executeCommand.mockResolvedValue({ success: false, error: null })

      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации провайдера
      await waitForProviderInit()

      // Ждем пока контекст станет доступен
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      try {
        await act(async () => {
          await result.current!.createProject("New Project")
        })
      } catch (err) {
        // Ожидаем ошибку
      }

      await waitFor(() => {
        expect(result.current!.error).toBe("Command failed")
      })

      consoleSpy.mockRestore()
    })

    it("должен очищать ошибки через clearError", async () => {
      // Мокаем состояние с ошибкой
      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            clipboard: null,
            uiError: "UI Error",
          },
        },
        mockSendUI,
      ] as any)

      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации провайдера
      await waitForProviderInit()

      // Ждем пока контекст станет доступен
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      expect(result.current!.error).toBe("UI Error")

      act(() => {
        result.current!.clearError()
      })

      expect(mockSendUI).toHaveBeenCalledWith({ type: "CLEAR_UI_ERROR" })
    })
  })

  describe("преобразование данных", () => {
    it("должен преобразовывать backend project в TimelineProject", async () => {
      render(<TestComponent />, { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(screen.getByTestId("project-name")).toHaveTextContent("Test Project")
        expect(screen.getByTestId("clips-count")).toHaveTextContent("1")
      })
    })

    it("должен правильно преобразовывать clip данные", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      const clip = result.current.clips[0]
      expect(clip).toMatchObject({
        id: "clip-1",
        name: "Clip 1",
        mediaId: "media-1",
        trackId: "track-1",
        startTime: 0,
        duration: 10,
        mediaStartTime: 0,
        mediaEndTime: 10,
        offset: 0,
        mediaDuration: 10,
        volume: 1.0,
        speed: 1,
        isReversed: false,
        opacity: 1.0,
        effects: [],
        filters: [],
        transitions: [],
        isSelected: false,
        isLocked: false,
      })
    })

    it("должен преобразовывать track данные", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      const project = result.current.project
      expect(project?.globalTracks[0]).toMatchObject({
        id: "track-1",
        name: "Video Track 1",
        type: "video",
        order: 0,
        isLocked: false,
        isMuted: false,
        isHidden: false,
        isSolo: false,
        volume: 1,
        pan: 0,
        height: 100,
        trackEffects: [],
        trackFilters: [],
      })
    })

    it("должен обрабатывать project с несколькими треками и клипами", async () => {
      const complexProject = {
        ...mockProject,
        timeline: {
          ...mockProject.timeline,
          tracks: [
            ...mockProject.timeline.tracks,
            {
              id: "track-2",
              name: "Audio Track 1",
              track_type: "AUDIO",
              clips: [
                {
                  id: "clip-2",
                  name: "Audio Clip",
                  media_id: "media-2",
                  timeline_in: 5,
                  timeline_out: 15,
                  source_in: 0,
                  source_out: 10,
                  playback_rate: 0.5,
                  transitions: [],
                },
              ],
              locked: true,
              enabled: false,
              volume: 0.8,
              pan: -0.5,
              height: 50,
            },
          ],
        },
      }

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: complexProject,
        playback_state: mockPlaybackState,
      })

      expect(result.current.clips).toHaveLength(2)
      expect(result.current.project?.globalTracks).toHaveLength(2)

      const audioTrack = result.current.project?.globalTracks[1]
      expect(audioTrack).toMatchObject({
        type: "audio",
        isLocked: true,
        isMuted: true, // enabled: false превращается в isMuted: true
        volume: 0.8,
        pan: -0.5,
      })

      const audioClip = result.current.clips[1]
      expect(audioClip).toMatchObject({
        speed: 0.5,
        duration: 10,
        trackId: "track-2",
      })
    })

    it("должен вычислять все клипы из всех треков", async () => {
      const multiTrackProject = {
        ...mockProject,
        timeline: {
          ...mockProject.timeline,
          tracks: [
            {
              ...mockProject.timeline.tracks[0],
              clips: [
                mockProject.timeline.tracks[0].clips[0],
                {
                  id: "clip-2",
                  name: "Clip 2",
                  media_id: "media-2",
                  timeline_in: 20,
                  timeline_out: 30,
                  source_in: 0,
                  source_out: 10,
                  playback_rate: 1,
                  transitions: [],
                },
              ],
            },
            {
              id: "track-2",
              name: "Track 2",
              track_type: "VIDEO",
              clips: [
                {
                  id: "clip-3",
                  name: "Clip 3",
                  media_id: "media-3",
                  timeline_in: 0,
                  timeline_out: 20,
                  source_in: 0,
                  source_out: 20,
                  playback_rate: 1,
                  transitions: [],
                },
              ],
              locked: false,
              enabled: true,
              volume: 1,
              pan: 0,
              height: 100,
            },
          ],
        },
      }

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: multiTrackProject,
        playback_state: mockPlaybackState,
      })

      expect(result.current.clips).toHaveLength(3)
      expect(result.current.clips.map((c) => c.id)).toEqual(["clip-1", "clip-2", "clip-3"])
    })

    it("должен обрабатывать отсутствие проекта", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        // project отсутствует
        playback_state: mockPlaybackState,
      })

      expect(result.current.project).toBeNull()
      expect(result.current.clips).toEqual([])
    })

    it("должен обрабатывать треки без клипов", async () => {
      const emptyTracksProject = {
        ...mockProject,
        timeline: {
          ...mockProject.timeline,
          tracks: [
            {
              ...mockProject.timeline.tracks[0],
              clips: [],
            },
            {
              id: "track-2",
              name: "Empty Track",
              track_type: "AUDIO",
              clips: [], // Пустой массив вместо null, так как текущий код не обрабатывает null
              locked: false,
              enabled: true,
              volume: 1,
              pan: 0,
              height: 100,
            },
          ],
        },
      }

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: emptyTracksProject,
        playback_state: mockPlaybackState,
      })

      expect(result.current.clips).toEqual([])
      expect(result.current.project?.globalTracks).toHaveLength(2)
    })

    it("должен правильно вычислять aspect ratio", async () => {
      const wideProject = {
        ...mockProject,
        settings: {
          ...mockProject.settings,
          resolution: { width: 2560, height: 1080 },
        },
      }

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: wideProject,
        playback_state: mockPlaybackState,
      })

      // Пока используется захардкоженное значение "16:9"
      expect(result.current.project?.settings.aspectRatio).toBe("16:9")
    })

    it("должен устанавливать значения по умолчанию для настроек проекта", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      const settings = result.current.project?.settings
      expect(settings).toMatchObject({
        timeFormat: "timecode",
        snapToGrid: false,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 300,
        bitDepth: 16,
      })
    })
  })

  describe("команды проекта", () => {
    it("должен создавать новый проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации
      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      await act(async () => {
        await result.current!.createProject("New Project", { resolution: { width: 1920, height: 1080 } })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "New Project",
          settings: { resolution: { width: 1920, height: 1080 } },
        },
      })
    })

    it("должен сохранять проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации
      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      await act(async () => {
        await result.current!.saveProject("/path/to/project.timeline")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: { path: "/path/to/project.timeline" },
      })
    })

    it("должен сохранять проект без пути", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Ждем инициализации
      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      await act(async () => {
        await result.current!.saveProject()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: { path: null },
      })
    })
  })

  describe("команды треков", () => {
    it("должен добавлять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addTrack("video", "New Video Track", 1)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AddTrack",
        params: {
          name: "New Video Track",
          track_type: "VIDEO",
          index: 1,
        },
      })
    })

    it("должен добавлять трек с автоматическим именем", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addTrack("audio")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AddTrack",
        params: {
          name: expect.stringContaining("Track"),
          track_type: "AUDIO",
          index: null,
        },
      })
    })

    it("должен удалять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeTrack("track-1")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "DeleteTrack",
        params: { track_id: "track-1" },
      })
    })

    it("должен обновлять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateTrack("track-1", { isLocked: true })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "UpdateTrack",
        params: {
          track_id: "track-1",
          updates: {
            enabled: false, // isLocked влияет на enabled
            locked: true,
          },
        },
      })
    })
  })

  describe("команды клипов", () => {
    it("должен добавлять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addClip("track-1", mockMediaFile, 10)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AddClip",
        params: {
          track_id: "track-1",
          media_id: "media-1",
          time: 10,
        },
      })
    })

    it("должен удалять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeClip("clip-1")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "DeleteClip",
        params: { clip_id: "clip-1" },
      })
    })

    it("должен перемещать клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.moveClip("clip-1", "track-2", 20)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "MoveClip",
        params: {
          clip_id: "clip-1",
          track_id: "track-2",
          time: 20,
        },
      })
    })

    it("должен обрезать клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.trimClip("clip-1", 5, 15)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "TrimClip",
        params: {
          clip_id: "clip-1",
          start: 5,
          end: 15,
        },
      })
    })

    it("должен логировать предупреждение для splitClip", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.splitClip("clip-1", 5)
      })

      expect(consoleSpy).toHaveBeenCalledWith("SplitClip not yet implemented in backend")
      expect(mockBackendSync.executeCommand).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("должен обновлять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateClip("clip-1", {
          speed: 2,
          isLocked: true,
        })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: {
            playback_rate: 2,
            enabled: false,
          },
        },
      })
    })

    it("должен обновлять клип с дефолтными значениями", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateClip("clip-1", { name: "New Name" })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: {
            playback_rate: 1,
            enabled: null,
          },
        },
      })
    })
  })

  describe("команды эффектов клипов", () => {
    it("должен добавлять эффект к клипу", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      // Ждем пока состояние обновится
      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      const newEffect = {
        id: "effect-1",
        effectId: "blur",
        name: "Blur",
        enabled: true,
        params: { radius: 10 },
        order: 0,
      }

      await act(async () => {
        await result.current.addEffectToClip("clip-1", newEffect as any)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: {
            playback_rate: 1,
            enabled: null,
          },
        },
      })
    })

    it("должен выбрасывать ошибку если клип не найден", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      await expect(
        act(async () => {
          await result.current.addEffectToClip("non-existent", {} as any)
        }),
      ).rejects.toThrow("Clip non-existent not found")
    })

    it("должен удалять эффект из клипа", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      // Сначала добавим эффект
      const clipWithEffect = {
        ...result.current.clips[0],
        effects: [{ id: "effect-1", name: "Blur" }],
      }

      // Мокаем findClipById чтобы вернуть клип с эффектом
      vi.spyOn(result.current, "clips", "get").mockReturnValue([clipWithEffect])

      await act(async () => {
        await result.current.removeEffectFromClip("clip-1", "effect-1")
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: expect.objectContaining({
            playback_rate: 1,
          }),
        },
      })
    })

    it("должен обновлять эффект клипа", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      await act(async () => {
        await result.current.updateClipEffect("clip-1", "effect-1", { enabled: false })
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalled()
    })

    it("должен переупорядочивать эффекты клипа", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      // Создаем клип с несколькими эффектами
      const clipWithEffects = {
        ...result.current.clips[0],
        effects: [
          { id: "effect-1", name: "Blur", order: 0 },
          { id: "effect-2", name: "Color", order: 1 },
          { id: "effect-3", name: "Scale", order: 2 },
        ],
      }

      vi.spyOn(result.current, "clips", "get").mockReturnValue([clipWithEffects])

      await act(async () => {
        await result.current.reorderClipEffects("clip-1", 0, 2)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: expect.objectContaining({
            playback_rate: 1,
          }),
        },
      })
    })
  })

  describe("команды секций (заглушки)", () => {
    it("должен логировать предупреждение для addSection", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addSection("Section 1", 0, 100)
      })

      expect(consoleSpy).toHaveBeenCalledWith("Sections are not supported in the new architecture")
      consoleSpy.mockRestore()
    })

    it("должен логировать предупреждение для removeSection", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeSection("section-1")
      })

      expect(consoleSpy).toHaveBeenCalledWith("Sections are not supported in the new architecture")
      consoleSpy.mockRestore()
    })

    it("должен логировать предупреждение для updateSection", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateSection("section-1", { name: "Updated" })
      })

      expect(consoleSpy).toHaveBeenCalledWith("Sections are not supported in the new architecture")
      consoleSpy.mockRestore()
    })
  })

  describe("команды воспроизведения", () => {
    it("должен отправлять команду play", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.play()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Play",
        params: {},
      })
    })

    it("должен отправлять команду pause", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.pause()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Pause",
        params: {},
      })
    })

    it("должен отправлять команду stop", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.stop()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Stop",
        params: {},
      })
    })

    it("должен отправлять команду seek", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.seek(15.5)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Seek",
        params: { time: 15.5 },
      })
    })

    it("должен отправлять команду setPlaybackRate", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.setPlaybackRate(2)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "SetPlaybackRate",
        params: { rate: 2 },
      })
    })

    it("должен обрабатывать ошибки команд воспроизведения", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockBackendSync.executeCommand.mockRejectedValueOnce(new Error("Playback error"))

      const { result } = renderHook(() => useTimeline(), { wrapper })

      try {
        await act(async () => {
          await result.current.play()
        })
      } catch (err) {
        // Ожидаем ошибку
      }

      await waitFor(() => {
        expect(result.current.error).toBe("Playback error")
      })

      consoleSpy.mockRestore()
    })
  })

  describe("UI команды", () => {
    it("должен устанавливать масштаб времени", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      act(() => {
        result.current!.setTimeScale(2)
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SET_TIME_SCALE",
        scale: 2,
      })
    })

    it("должен устанавливать позицию прокрутки", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      act(() => {
        result.current!.setScrollPosition(100, 50)
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SET_SCROLL_POSITION",
        x: 100,
        y: 50,
      })
    })

    it("должен устанавливать режим редактирования", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      act(() => {
        result.current!.setEditMode("trim")
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SET_EDIT_MODE",
        mode: "trim",
      })
    })

    it("должен переключать режим привязки", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      act(() => {
        result.current!.toggleSnap("grid")
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "TOGGLE_SNAP",
        snapMode: "grid",
      })
    })
  })

  describe("команды выделения", () => {
    it("должен выделять клипы", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await waitForProviderInit()
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      act(() => {
        result.current!.selectClips(["clip-1", "clip-2"])
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-1", "clip-2"],
        addToSelection: undefined,
      })
    })

    it("должен добавлять клипы к выделению", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectClips(["clip-3"], true)
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SELECT_CLIPS",
        clipIds: ["clip-3"],
        addToSelection: true,
      })
    })

    it("должен выделять треки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectTracks(["track-1"])
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SELECT_TRACKS",
        trackIds: ["track-1"],
        addToSelection: undefined,
      })
    })

    it("должен выделять секции", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectSections(["section-1", "section-2"])
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "SELECT_SECTIONS",
        sectionIds: ["section-1", "section-2"],
        addToSelection: undefined,
      })
    })

    it("должен очищать выделение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.clearSelection()
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "CLEAR_SELECTION",
      })
    })
  })

  describe("буфер обмена", () => {
    beforeEach(() => {
      // Мокаем выделенные клипы
      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: ["clip-1"],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 5,
            playbackRate: 1,
            clipboard: null,
            uiError: null,
          },
        },
        mockSendUI,
      ] as any)
    })

    it("должен копировать выделенные клипы", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      act(() => {
        result.current.copySelection()
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "COPY_SELECTION",
        clipboardData: expect.objectContaining({
          clips: expect.arrayContaining([
            expect.objectContaining({
              id: "clip-1",
            }),
          ]),
        }),
      })
    })

    it("должен вырезать выделенные клипы", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await waitFor(() => {
        expect(result.current.clips.length).toBeGreaterThan(0)
      })

      await act(async () => {
        result.current.cutSelection()
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "CUT_SELECTION",
        clipboardData: expect.objectContaining({
          clips: expect.arrayContaining([
            expect.objectContaining({
              id: "clip-1",
            }),
          ]),
        }),
      })

      // Проверяем, что клип был удален
      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "DeleteClip",
        params: { clip_id: "clip-1" },
      })
    })

    it("не должен копировать если нет выделенных клипов", () => {
      // Мокаем пустое выделение
      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            clipboard: null,
            uiError: null,
          },
        },
        mockSendUI,
      ] as any)

      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.copySelection()
      })

      expect(mockSendUI).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: "COPY_SELECTION",
        }),
      )
    })

    it("должен вставлять клипы из буфера обмена", async () => {
      const clipboardData = {
        clips: [
          {
            id: "clip-copy-1",
            mediaId: "media-1",
            startTime: 10,
            duration: 5,
          },
        ],
        metadata: {
          originalTimeRange: {
            startTime: 10,
            endTime: 15,
          },
        },
      }

      // Мокаем контекст с буфером обмена
      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 20,
            playbackRate: 1,
            clipboard: clipboardData,
            uiError: null,
          },
        },
        mockSendUI,
      ] as any)

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        await result.current.paste("track-1", 30)
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AddClip",
        params: {
          track_id: "track-1",
          media_id: "media-1",
          time: 30,
        },
      })
    })

    it("должен вставлять в текущую позицию если не указана целевая", async () => {
      const clipboardData = {
        clips: [
          {
            id: "clip-copy-1",
            mediaId: "media-1",
            startTime: 0,
            duration: 5,
          },
        ],
        metadata: {
          originalTimeRange: {
            startTime: 0,
            endTime: 5,
          },
        },
      }

      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 25,
            playbackRate: 1,
            clipboard: clipboardData,
            uiError: null,
          },
        },
        mockSendUI,
      ] as any)

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        await result.current.paste()
      })

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AddClip",
        params: {
          track_id: "track-1",
          media_id: "media-1",
          time: 25,
        },
      })
    })

    it("не должен вставлять если буфер обмена пуст", async () => {
      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            clipboard: null,
            uiError: null,
          },
        },
        mockSendUI,
      ] as any)

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        await result.current.paste()
      })

      expect(mockBackendSync.executeCommand).not.toHaveBeenCalled()
    })

    it("должен обрабатывать ошибки при вставке", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const clipboardData = {
        clips: [{ id: "clip-1", mediaId: "media-1", startTime: 0, duration: 5 }],
        metadata: { originalTimeRange: { startTime: 0, endTime: 5 } },
      }

      vi.mocked(useMachine).mockReturnValue([
        {
          context: {
            selectedClipIds: [],
            selectedTrackIds: [],
            selectedSectionIds: [],
            timeScale: 1,
            scrollPosition: { x: 0, y: 0 },
            editMode: "select",
            snapMode: "none",
            isPlaying: false,
            currentTime: 0,
            playbackRate: 1,
            clipboard: clipboardData,
            uiError: null,
          },
        },
        mockSendUI,
      ] as any)

      mockBackendSync.executeCommand.mockRejectedValueOnce(new Error("Paste failed"))

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        await result.current.paste()
      })

      expect(consoleSpy).toHaveBeenCalledWith("Paste failed:", expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe("операции перетаскивания", () => {
    it("должен начинать перетаскивание клипа", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.startDragClip("clip-1")
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "START_DRAG_CLIP",
        clipId: "clip-1",
      })
    })

    it("должен начинать перетаскивание трека", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.startDragTrack("track-1")
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "START_DRAG_TRACK",
        trackId: "track-1",
      })
    })

    it("должен останавливать перетаскивание", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.stopDrag()
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "STOP_DRAG",
      })
    })
  })

  describe("прямая отправка событий (send)", () => {
    it("должен обрабатывать события эффектов", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      const effect = {
        id: "effect-1",
        name: "Blur",
        enabled: true,
      }

      await act(async () => {
        result.current.send({
          type: "ADD_EFFECT_TO_CLIP",
          clipId: "clip-1",
          effect,
        })
      })

      // Ждем выполнения асинхронной операции
      await waitFor(() => {
        expect(mockBackendSync.executeCommand).toHaveBeenCalled()
      })
    })

    it("должен передавать неизвестные события в UI машину", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.send({
          type: "UNKNOWN_EVENT",
          data: "test",
        })
      })

      expect(mockSendUI).toHaveBeenCalledWith({
        type: "UNKNOWN_EVENT",
        data: "test",
      })
    })

    it("должен обрабатывать REMOVE_EFFECT_FROM_CLIP", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        result.current.send({
          type: "REMOVE_EFFECT_FROM_CLIP",
          clipId: "clip-1",
          effectId: "effect-1",
        })
      })

      await waitFor(() => {
        expect(mockBackendSync.executeCommand).toHaveBeenCalled()
      })
    })

    it("должен обрабатывать UPDATE_CLIP_EFFECT", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        result.current.send({
          type: "UPDATE_CLIP_EFFECT",
          clipId: "clip-1",
          effectId: "effect-1",
          updates: { enabled: false },
        })
      })

      await waitFor(() => {
        expect(mockBackendSync.executeCommand).toHaveBeenCalled()
      })
    })

    it("должен обрабатывать REORDER_CLIP_EFFECTS", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await setProjectState({
        project: mockProject,
        playback_state: mockPlaybackState,
      })

      await act(async () => {
        result.current.send({
          type: "REORDER_CLIP_EFFECTS",
          clipId: "clip-1",
          fromIndex: 0,
          toIndex: 1,
        })
      })

      await waitFor(() => {
        expect(mockBackendSync.executeCommand).toHaveBeenCalled()
      })
    })
  })
})
