/**
 * Comprehensive tests for use-clip-groups hook
 */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useClipGroups } from "../../hooks/use-clip-groups"
import { TimelineGroupManager } from "../../services/group-manager"
import type { ClipGroup } from "../../types/clip-groups"
import type { TimelineClip, TimelineProject } from "../../types/timeline"
import { MockTimelineProvider } from "../test-providers"

// Mock timeline-machine
vi.mock("../../services/timeline-machine", () => ({
  timelineMachine: {},
}))

// Mock group manager
vi.mock("../../services/group-manager", () => {
  const mockGroupManager = {
    groups: new Map(),
    getGroupHierarchy: vi.fn().mockReturnValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createGroup: vi.fn(),
    ungroupClips: vi.fn(),
    addToGroup: vi.fn(),
    removeFromGroup: vi.fn(),
    toggleCollapse: vi.fn(),
    lockGroup: vi.fn(),
    renameGroup: vi.fn(),
    setGroupColor: vi.fn(),
    createNestedSequence: vi.fn(),
    updateNestedSequence: vi.fn(),
    breakApartSequence: vi.fn(),
    getGroup: vi.fn(),
    getGroupByClip: vi.fn(),
    isClipInGroup: vi.fn(),
  }

  return {
    TimelineGroupManager: vi.fn(() => mockGroupManager),
  }
})

// Mock useTimeline
const mockSend = vi.fn()
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

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: vi.fn(() => ({
    project: mockProject,
    send: mockSend,
  })),
}))

describe("useClipGroups", () => {
  let mockGroupManager: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Получаем экземпляр мока
    const TimelineGroupManagerMock = vi.mocked(TimelineGroupManager)
    mockGroupManager = new TimelineGroupManagerMock()

    // Настройка моков по умолчанию
    mockGroupManager.createGroup.mockReturnValue({
      success: true,
      groupId: "group-1",
    })

    mockGroupManager.ungroupClips.mockReturnValue({
      success: true,
      affectedClips: [{ clipId: "clip-1", trackId: "track-1" }],
    })

    mockGroupManager.getGroup.mockImplementation((groupId: string) => {
      if (groupId === "group-1") {
        return {
          id: "group-1",
          name: "Test Group",
          clips: [
            { clipId: "clip-1", trackId: "track-1" },
            { clipId: "clip-2", trackId: "track-1" },
          ],
          locked: false,
          color: "#3b82f6",
          syncMode: "none",
          collapsed: false,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        } as ClipGroup
      }
      return undefined
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("должен инициализироваться без ошибок", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.groups).toEqual([])
    expect(result.current.groupManager).toBeDefined()
  })

  it("должен иметь все необходимые методы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    expect(result.current.createGroup).toBeDefined()
    expect(result.current.ungroupClips).toBeDefined()
    expect(result.current.addToGroup).toBeDefined()
    expect(result.current.removeFromGroup).toBeDefined()
    expect(result.current.toggleCollapse).toBeDefined()
    expect(result.current.lockGroup).toBeDefined()
    expect(result.current.renameGroup).toBeDefined()
    expect(result.current.setGroupColor).toBeDefined()
    expect(result.current.createNestedSequence).toBeDefined()
    expect(result.current.updateNestedSequence).toBeDefined()
    expect(result.current.breakApartSequence).toBeDefined()
    expect(result.current.getGroupByClip).toBeDefined()
    expect(result.current.isClipInGroup).toBeDefined()
    expect(result.current.getClipsInGroup).toBeDefined()
  })

  it("должен создавать группу из клипов", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    const clips = [
      mockProject.sections[0].tracks[0].clips[0],
      mockProject.sections[0].tracks[0].clips[1],
    ] as TimelineClip[]

    act(() => {
      const operationResult = result.current.createGroup(clips, "My Group")
      expect(operationResult.success).toBe(true)
      expect(operationResult.groupId).toBe("group-1")
    })

    // Проверяем вызов менеджера
    expect(mockGroupManager.createGroup).toHaveBeenCalledWith(
      [
        { clipId: "clip-1", trackId: "track-1" },
        { clipId: "clip-2", trackId: "track-1" },
      ],
      "My Group",
      undefined,
    )

    // Проверяем отправку события
    expect(mockSend).toHaveBeenCalledWith({
      type: "CLIPS_GROUPED",
      groupId: "group-1",
      clipIds: ["clip-1", "clip-2"],
    })
  })

  it("должен создавать группу с опциями", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    const clips = [mockProject.sections[0].tracks[0].clips[0]] as TimelineClip[]
    const options = {
      autoColor: true,
      collapseOnCreate: true,
    }

    act(() => {
      result.current.createGroup(clips, undefined, options)
    })

    expect(mockGroupManager.createGroup).toHaveBeenCalledWith(
      [{ clipId: "clip-1", trackId: "track-1" }],
      undefined,
      options,
    )
  })

  it("должен разгруппировывать клипы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    act(() => {
      const operationResult = result.current.ungroupClips("group-1")
      expect(operationResult.success).toBe(true)
    })

    expect(mockGroupManager.ungroupClips).toHaveBeenCalledWith("group-1")

    expect(mockSend).toHaveBeenCalledWith({
      type: "CLIPS_UNGROUPED",
      groupId: "group-1",
      clipIds: ["clip-1"],
    })
  })

  it("должен добавлять клипы в группу", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.addToGroup.mockReturnValue({
      success: true,
    })

    const newClips = [mockProject.globalTracks[0].clips[0]] as TimelineClip[]

    act(() => {
      const operationResult = result.current.addToGroup("group-1", newClips)
      expect(operationResult.success).toBe(true)
    })

    expect(mockGroupManager.addToGroup).toHaveBeenCalledWith("group-1", [
      { clipId: "clip-3", trackId: "global-track-1" },
    ])

    expect(mockSend).toHaveBeenCalledWith({
      type: "CLIPS_ADDED_TO_GROUP",
      groupId: "group-1",
      clipIds: ["clip-3"],
    })
  })

  it("должен удалять клипы из группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.removeFromGroup.mockReturnValue({
      success: true,
    })

    const clipsToRemove = [mockProject.sections[0].tracks[0].clips[0]] as TimelineClip[]

    act(() => {
      const operationResult = result.current.removeFromGroup("group-1", clipsToRemove)
      expect(operationResult.success).toBe(true)
    })

    expect(mockGroupManager.removeFromGroup).toHaveBeenCalledWith("group-1", [{ clipId: "clip-1", trackId: "track-1" }])

    expect(mockSend).toHaveBeenCalledWith({
      type: "CLIPS_REMOVED_FROM_GROUP",
      groupId: "group-1",
      clipIds: ["clip-1"],
    })
  })

  it("должен переключать состояние свернутости группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    act(() => {
      result.current.toggleCollapse("group-1")
    })

    expect(mockGroupManager.toggleCollapse).toHaveBeenCalledWith("group-1")

    expect(mockSend).toHaveBeenCalledWith({
      type: "GROUP_TOGGLED",
      groupId: "group-1",
    })
  })

  it("должен блокировать и разблокировать группу", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    act(() => {
      result.current.lockGroup("group-1", true)
    })

    expect(mockGroupManager.lockGroup).toHaveBeenCalledWith("group-1", true)

    expect(mockSend).toHaveBeenCalledWith({
      type: "GROUP_LOCKED",
      groupId: "group-1",
      locked: true,
    })

    act(() => {
      result.current.lockGroup("group-1", false)
    })

    expect(mockGroupManager.lockGroup).toHaveBeenCalledWith("group-1", false)
  })

  it("должен переименовывать группу", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    act(() => {
      result.current.renameGroup("group-1", "New Name")
    })

    expect(mockGroupManager.renameGroup).toHaveBeenCalledWith("group-1", "New Name")
  })

  it("должен изменять цвет группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    act(() => {
      result.current.setGroupColor("group-1", "#ef4444")
    })

    expect(mockGroupManager.setGroupColor).toHaveBeenCalledWith("group-1", "#ef4444")
  })

  it("должен создавать вложенную последовательность", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.createNestedSequence.mockReturnValue({
      success: true,
      groupId: "sequence-1",
    })

    const clips = mockProject.sections[0].tracks[0].clips

    act(() => {
      const operationResult = result.current.createNestedSequence(clips, "My Sequence")
      expect(operationResult.success).toBe(true)
      expect(operationResult.groupId).toBe("sequence-1")
    })

    expect(mockGroupManager.createNestedSequence).toHaveBeenCalledWith(
      [
        { clipId: "clip-1", trackId: "track-1" },
        { clipId: "clip-2", trackId: "track-1" },
      ],
      "My Sequence",
    )

    expect(mockSend).toHaveBeenCalledWith({
      type: "NESTED_SEQUENCE_CREATED",
      sequenceId: "sequence-1",
      clipIds: ["clip-1", "clip-2"],
    })
  })

  it("должен обновлять вложенную последовательность", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    const updates = {
      scale: 0.5,
      position: { x: 100, y: 50 },
      opacity: 0.8,
    }

    act(() => {
      result.current.updateNestedSequence("sequence-1", updates)
    })

    expect(mockGroupManager.updateNestedSequence).toHaveBeenCalledWith("sequence-1", updates)
  })

  it("должен разбирать вложенную последовательность", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.breakApartSequence.mockReturnValue({
      success: true,
      affectedClips: [
        { clipId: "clip-1", trackId: "track-1" },
        { clipId: "clip-2", trackId: "track-1" },
      ],
    })

    act(() => {
      const operationResult = result.current.breakApartSequence("sequence-1")
      expect(operationResult.success).toBe(true)
    })

    expect(mockGroupManager.breakApartSequence).toHaveBeenCalledWith("sequence-1")

    expect(mockSend).toHaveBeenCalledWith({
      type: "NESTED_SEQUENCE_BROKEN",
      sequenceId: "sequence-1",
      clipIds: ["clip-1", "clip-2"],
    })
  })

  it("должен получать группу по клипу", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.getGroupByClip.mockReturnValue({
      id: "group-1",
      name: "Test Group",
    })

    const group = result.current.getGroupByClip("clip-1")

    expect(mockGroupManager.getGroupByClip).toHaveBeenCalledWith("clip-1")
    expect(group).toEqual({
      id: "group-1",
      name: "Test Group",
    })
  })

  it("должен проверять, находится ли клип в группе", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.isClipInGroup.mockReturnValue(true)

    const isInGroup = result.current.isClipInGroup("clip-1")

    expect(mockGroupManager.isClipInGroup).toHaveBeenCalledWith("clip-1")
    expect(isInGroup).toBe(true)
  })

  it("должен получать клипы в группе", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    const clips = result.current.getClipsInGroup("group-1")

    expect(mockGroupManager.getGroup).toHaveBeenCalledWith("group-1")
    expect(clips).toHaveLength(2)
    expect(clips[0].id).toBe("clip-1")
    expect(clips[1].id).toBe("clip-2")
  })

  it("должен возвращать пустой массив для несуществующей группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.getGroup.mockReturnValue(undefined)

    const clips = result.current.getClipsInGroup("non-existent-group")

    expect(clips).toEqual([])
  })

  it("должен обрабатывать ошибки при создании группы", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.createGroup.mockReturnValue({
      success: false,
      error: "Клипы уже в группе",
    })

    const clips = [mockProject.sections[0].tracks[0].clips[0]] as TimelineClip[]

    act(() => {
      const operationResult = result.current.createGroup(clips)
      expect(operationResult.success).toBe(false)
      expect(operationResult.error).toBe("Клипы уже в группе")
    })

    // При ошибке событие не должно отправляться
    expect(mockSend).not.toHaveBeenCalled()
  })

  it("должен подписываться на события менеджера групп", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result, unmount } = renderHook(() => useClipGroups(), { wrapper })

    // Проверяем подписку
    expect(mockGroupManager.addEventListener).toHaveBeenCalled()

    // Размонтируем компонент
    unmount()

    // Проверяем отписку
    expect(mockGroupManager.removeEventListener).toHaveBeenCalled()
  })

  it("должен обновлять состояние групп при изменениях", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    // Симулируем изменение групп
    const newGroups = [
      {
        id: "group-1",
        name: "Updated Group",
        clips: [],
      },
    ]

    mockGroupManager.getGroupHierarchy.mockReturnValue(newGroups)

    // Вызываем callback, переданный в addEventListener
    const updateCallback = mockGroupManager.addEventListener.mock.calls[0][0]

    act(() => {
      updateCallback()
    })

    // Ждем обновления состояния
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.groups).toEqual(newGroups)
  })

  it("должен находить клипы из глобальных треков", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockTimelineProvider>{children}</MockTimelineProvider>
    )

    const { result } = renderHook(() => useClipGroups(), { wrapper })

    mockGroupManager.getGroup.mockImplementation((groupId: string) => {
      if (groupId === "group-2") {
        return {
          id: "group-2",
          name: "Global Group",
          clips: [{ clipId: "clip-3", trackId: "global-track-1" }],
          locked: false,
          color: "#22c55e",
          syncMode: "none",
          collapsed: false,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        } as ClipGroup
      }
      return undefined
    })

    const clips = result.current.getClipsInGroup("group-2")

    expect(clips).toHaveLength(1)
    expect(clips[0].id).toBe("clip-3")
    expect(clips[0].trackId).toBe("global-track-1")
  })
})
