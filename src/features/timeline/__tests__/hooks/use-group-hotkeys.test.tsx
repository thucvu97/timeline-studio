/**
 * Comprehensive tests for use-group-hotkeys hook
 */

import { renderHook } from "@testing-library/react"
import { useHotkeys } from "react-hotkeys-hook"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Создаем отдельный модуль для моков
const mockCreateGroup = vi.fn()
const mockUngroupClips = vi.fn()
const mockGetGroupByClip = vi.fn()

vi.mock("../../hooks/use-clip-groups", () => ({
  useClipGroups: () => ({
    createGroup: mockCreateGroup,
    ungroupClips: mockUngroupClips,
    getGroupByClip: mockGetGroupByClip,
    groups: [],
    groupManager: {},
    addToGroup: vi.fn(),
    removeFromGroup: vi.fn(),
    toggleCollapse: vi.fn(),
    lockGroup: vi.fn(),
    renameGroup: vi.fn(),
    setGroupColor: vi.fn(),
    createNestedSequence: vi.fn(),
    updateNestedSequence: vi.fn(),
    breakApartSequence: vi.fn(),
    isClipInGroup: vi.fn(),
    getClipsInGroup: vi.fn(),
  }),
}))

// Mock useHotkeys
type HotkeyHandler = (event: KeyboardEvent) => void
const hotkeyHandlers: Record<string, HotkeyHandler> = {}
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn((keys: string, handler: HotkeyHandler, _options?: any, _deps?: any[]) => {
    hotkeyHandlers[keys] = handler
  }),
}))

// Mock project data
const mockProject: TimelineProject = {
  id: "project-1",
  name: "Test Project",
  sections: [
    {
      id: "section-1",
      name: "Section 1",
      tracks: [
        {
          id: "track-1",
          clips: [
            {
              id: "clip-1",
              name: "Clip 1",
              trackId: "track-1",
              startTime: 0,
              duration: 5,
            } as TimelineClip,
            {
              id: "clip-2",
              name: "Clip 2",
              trackId: "track-1",
              startTime: 5,
              duration: 5,
            } as TimelineClip,
          ],
        },
      ],
    },
  ],
  globalTracks: [
    {
      id: "global-track-1",
      clips: [
        {
          id: "clip-3",
          name: "Clip 3",
          trackId: "global-track-1",
          startTime: 0,
          duration: 10,
        } as TimelineClip,
      ],
    },
  ],
} as any

const mockUiState = {
  selectedClipIds: ["clip-1", "clip-2"],
}

const mockSend = vi.fn()

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: mockProject,
    uiState: mockUiState,
    send: mockSend,
  }),
}))

import { useGroupHotkeys } from "../../hooks/use-group-hotkeys"
import { MockTimelineProvider } from "../test-providers"

import type { ClipGroup } from "../../types/clip-groups"
import type { TimelineClip, TimelineProject } from "../../types/timeline"

describe("useGroupHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Очищаем обработчики
    Object.keys(hotkeyHandlers).forEach((key) => {
       
      delete hotkeyHandlers[key]
    })

    // Сбрасываем выбранные клипы
    mockUiState.selectedClipIds = ["clip-1", "clip-2"]

    // Настройка мока getGroupByClip по умолчанию
    mockGetGroupByClip.mockReturnValue({
      id: "group-1",
      name: "Test Group",
      clips: [
        { clipId: "clip-1", trackId: "track-1" },
        { clipId: "clip-2", trackId: "track-1" },
      ],
    } as ClipGroup)
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("должен регистрировать горячие клавиши", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useGroupHotkeys(), { wrapper })

    const mockUseHotkeys = vi.mocked(useHotkeys)

    // Проверяем регистрацию хоткеев для группировки
    expect(mockUseHotkeys).toHaveBeenCalledWith("cmd+g, ctrl+g", expect.any(Function), { enableOnFormTags: false }, [
      mockProject,
      mockUiState.selectedClipIds,
    ])

    // Проверяем регистрацию хоткеев для разгруппировки
    expect(mockUseHotkeys).toHaveBeenCalledWith(
      "cmd+shift+g, ctrl+shift+g",
      expect.any(Function),
      { enableOnFormTags: false },
      [mockProject, mockUiState.selectedClipIds],
    )
  })

  it("должен создавать группу при нажатии Cmd+G с выбранными клипами", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useGroupHotkeys(), { wrapper })

    // Симулируем нажатие Cmd+G
    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+g, ctrl+g"](event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockCreateGroup).toHaveBeenCalledWith([
      mockProject.sections[0].tracks[0].clips[0],
      mockProject.sections[0].tracks[0].clips[1],
    ])
  })

  it("не должен создавать группу если выбрано меньше 2 клипов", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Изменяем выбранные клипы
    mockUiState.selectedClipIds = ["clip-1"]

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+g, ctrl+g"](event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockCreateGroup).not.toHaveBeenCalled()
  })

  it("должен разгруппировывать клипы при нажатии Cmd+Shift+G", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useGroupHotkeys(), { wrapper })

    // Симулируем нажатие Cmd+Shift+G
    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+shift+g, ctrl+shift+g"](event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockGetGroupByClip).toHaveBeenCalledWith("clip-1")
    expect(mockUngroupClips).toHaveBeenCalledWith("group-1")
  })

  it("не должен разгруппировывать если клип не в группе", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Мокаем что клип не в группе
    mockGetGroupByClip.mockReturnValue(undefined)

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+shift+g, ctrl+shift+g"](event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockGetGroupByClip).toHaveBeenCalledWith("clip-1")
    expect(mockUngroupClips).not.toHaveBeenCalled()
  })

  it("не должен разгруппировывать если нет выбранных клипов", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Очищаем выбранные клипы
    mockUiState.selectedClipIds = []

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+shift+g, ctrl+shift+g"](event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(mockGetGroupByClip).not.toHaveBeenCalled()
    expect(mockUngroupClips).not.toHaveBeenCalled()
  })

  it("должен работать с клипами из глобальных треков", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Выбираем клипы включая глобальный трек
    mockUiState.selectedClipIds = ["clip-1", "clip-3"]

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+g, ctrl+g"](event)

    // Проверяем что createGroup был вызван с правильными клипами
    // Порядок: сначала globalTracks, потом sections
    expect(mockCreateGroup).toHaveBeenCalledWith([
      mockProject.globalTracks[0].clips[0], // clip-3
      mockProject.sections[0].tracks[0].clips[0], // clip-1
    ])
  })

  it("должен работать с разными сочетаниями клавиш для разных ОС", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useGroupHotkeys(), { wrapper })

    const mockUseHotkeys = vi.mocked(useHotkeys)

    // Проверяем что зарегистрированы оба варианта (cmd для Mac, ctrl для Windows/Linux)
    expect(mockUseHotkeys).toHaveBeenCalledWith(
      expect.stringContaining("cmd+g"),
      expect.any(Function),
      expect.any(Object),
      expect.any(Array),
    )

    expect(mockUseHotkeys).toHaveBeenCalledWith(
      expect.stringContaining("ctrl+g"),
      expect.any(Function),
      expect.any(Object),
      expect.any(Array),
    )
  })

  it("должен отключать хоткеи на элементах форм", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useGroupHotkeys(), { wrapper })

    const mockUseHotkeys = vi.mocked(useHotkeys)

    // Проверяем что enableOnFormTags установлен в false
    const calls = mockUseHotkeys.mock.calls
    calls.forEach((call) => {
      const options = call[2]
      expect(options.enableOnFormTags).toBe(false)
    })
  })

  it("должен корректно обрабатывать отсутствие проекта", () => {
    // Временно сохраняем оригинальный проект и устанавливаем null
    const originalProject = mockProject

    // Очищаем глобальные переменные для имитации отсутствия проекта
    mockProject.sections = []
    mockProject.globalTracks = []

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+g, ctrl+g"](event)

    // Не должно быть вызовов createGroup когда нет клипов
    expect(mockCreateGroup).not.toHaveBeenCalled()

    // Восстанавливаем проект
    mockProject.sections = originalProject.sections
    mockProject.globalTracks = originalProject.globalTracks
  })

  it("должен выбирать первый клип из выбранных для определения группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Убедимся что в проекте есть нужные клипы после предыдущего теста
    if (mockProject.sections.length === 0) {
      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          tracks: [
            {
              id: "track-1",
              clips: [
                {
                  id: "clip-1",
                  name: "Clip 1",
                  trackId: "track-1",
                  startTime: 0,
                  duration: 5,
                } as TimelineClip,
                {
                  id: "clip-2",
                  name: "Clip 2",
                  trackId: "track-1",
                  startTime: 5,
                  duration: 5,
                } as TimelineClip,
              ],
            },
          ],
        },
      ] as any
    }

    // Выбираем только клипы из sections
    mockUiState.selectedClipIds = ["clip-2"]

    // Настраиваем группу для клипа
    mockGetGroupByClip.mockReturnValue({
      id: "group-2",
      name: "Group 2",
      clips: [{ clipId: "clip-2", trackId: "track-1" }],
    } as ClipGroup)

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+shift+g, ctrl+shift+g"](event)

    // Должна использоваться группа первого найденного клипа
    expect(mockGetGroupByClip).toHaveBeenCalledWith("clip-2")
    expect(mockUngroupClips).toHaveBeenCalledWith("group-2")
  })

  it("должен собирать клипы из всех секций", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    // Убедимся что проект восстановлен
    if (mockProject.sections.length === 0 || !mockProject.globalTracks) {
      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          tracks: [
            {
              id: "track-1",
              clips: [
                {
                  id: "clip-1",
                  name: "Clip 1",
                  trackId: "track-1",
                  startTime: 0,
                  duration: 5,
                } as TimelineClip,
                {
                  id: "clip-2",
                  name: "Clip 2",
                  trackId: "track-1",
                  startTime: 5,
                  duration: 5,
                } as TimelineClip,
              ],
            },
          ],
        },
      ] as any

      mockProject.globalTracks = [
        {
          id: "global-track-1",
          clips: [
            {
              id: "clip-3",
              name: "Clip 3",
              trackId: "global-track-1",
              startTime: 0,
              duration: 10,
            } as TimelineClip,
          ],
        },
      ] as any
    }

    // Добавляем дополнительную секцию
    const originalSections = [...mockProject.sections]
    mockProject.sections.push({
      id: "section-2",
      name: "Section 2",
      tracks: [
        {
          id: "track-2",
          clips: [
            {
              id: "clip-4",
              name: "Clip 4",
              trackId: "track-2",
              startTime: 0,
              duration: 5,
            } as TimelineClip,
          ],
        },
      ],
    } as any)

    // Выбираем клипы из разных секций
    mockUiState.selectedClipIds = ["clip-1", "clip-4"]

    renderHook(() => useGroupHotkeys(), { wrapper })

    const event = { preventDefault: vi.fn() }
    hotkeyHandlers["cmd+g, ctrl+g"](event)

    // Проверяем что createGroup был вызван
    expect(mockCreateGroup).toHaveBeenCalled()

    // Восстанавливаем оригинальные секции
    mockProject.sections = originalSections
  })
})
