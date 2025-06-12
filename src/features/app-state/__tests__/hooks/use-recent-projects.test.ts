import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useRecentProjects } from "../../hooks/use-recent-projects"

// Мокаем useAppSettings
const mockAppSettings = {
  getRecentProjects: vi.fn(),
  addRecentProject: vi.fn(),
  removeRecentProject: vi.fn(),
  clearRecentProjects: vi.fn(),
}

vi.mock("../../hooks/use-app-settings", () => ({
  useAppSettings: () => mockAppSettings,
}))

describe("useRecentProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать список недавних проектов", () => {
    const mockProjects = [
      { path: "/project1.tlsp", name: "Проект 1", lastOpened: Date.now() - 1000 },
      { path: "/project2.tlsp", name: "Проект 2", lastOpened: Date.now() - 2000 },
      { path: "/project3.tlsp", name: "Проект 3", lastOpened: Date.now() - 3000 },
    ]
    mockAppSettings.getRecentProjects.mockReturnValue(mockProjects)

    const { result } = renderHook(() => useRecentProjects())

    expect(result.current.recentProjects).toEqual(mockProjects)
    expect(mockAppSettings.getRecentProjects).toHaveBeenCalled()
  })

  it("должен добавлять проект в недавние", () => {
    const { result } = renderHook(() => useRecentProjects())

    act(() => {
      result.current.addRecentProject("/new-project.tlsp", "Новый проект")
    })

    expect(mockAppSettings.addRecentProject).toHaveBeenCalledWith(
      "/new-project.tlsp", 
      "Новый проект"
    )
  })

  it("должен удалять проект из недавних", () => {
    const { result } = renderHook(() => useRecentProjects())

    act(() => {
      result.current.removeRecentProject("/project-to-remove.tlsp")
    })

    expect(mockAppSettings.removeRecentProject).toHaveBeenCalledWith("/project-to-remove.tlsp")
  })

  it("должен очищать список недавних проектов", () => {
    const { result } = renderHook(() => useRecentProjects())

    act(() => {
      result.current.clearRecentProjects()
    })

    expect(mockAppSettings.clearRecentProjects).toHaveBeenCalled()
  })

  it("должен корректно обрабатывать пустой список", () => {
    mockAppSettings.getRecentProjects.mockReturnValue([])

    const { result } = renderHook(() => useRecentProjects())

    expect(result.current.recentProjects).toEqual([])
  })

  it("должен обновляться при изменении списка", () => {
    const projects1 = [
      { path: "/project1.tlsp", name: "Проект 1", lastOpened: Date.now() }
    ]
    const projects2 = [
      { path: "/project1.tlsp", name: "Проект 1", lastOpened: Date.now() },
      { path: "/project2.tlsp", name: "Проект 2", lastOpened: Date.now() - 1000 }
    ]

    mockAppSettings.getRecentProjects.mockReturnValue(projects1)

    const { result, rerender } = renderHook(() => useRecentProjects())

    expect(result.current.recentProjects).toHaveLength(1)

    // Меняем возвращаемое значение
    mockAppSettings.getRecentProjects.mockReturnValue(projects2)

    // Перерендериваем хук
    rerender()

    expect(result.current.recentProjects).toHaveLength(2)
  })

  it("должен корректно обрабатывать недавние проекты с одинаковыми путями", () => {
    const mockProjects = [
      { path: "/duplicate.tlsp", name: "Проект 1", lastOpened: Date.now() },
      { path: "/duplicate.tlsp", name: "Проект 1 (копия)", lastOpened: Date.now() - 1000 },
    ]
    mockAppSettings.getRecentProjects.mockReturnValue(mockProjects)

    const { result } = renderHook(() => useRecentProjects())

    expect(result.current.recentProjects).toEqual(mockProjects)
    // В реальности должна быть логика дедупликации, но пока возвращаем как есть
  })
})