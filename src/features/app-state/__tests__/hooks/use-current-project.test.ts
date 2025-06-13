import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCurrentProject } from "../../hooks/use-current-project"

// Мокаем useAppSettings
const mockAppSettings = {
  getCurrentProject: vi.fn(),
  createNewProject: vi.fn(),
  openProject: vi.fn(),
  saveProject: vi.fn(),
  setProjectDirty: vi.fn(),
}

vi.mock("../../hooks/use-app-settings", () => ({
  useAppSettings: () => mockAppSettings,
}))

describe("useCurrentProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать текущий проект", () => {
    const mockProject = {
      path: "/path/to/project.tls",
      name: "Мой проект",
      isDirty: false,
      isNew: false,
    }
    mockAppSettings.getCurrentProject.mockReturnValue(mockProject)

    const { result } = renderHook(() => useCurrentProject())

    expect(result.current.currentProject).toEqual(mockProject)
    expect(mockAppSettings.getCurrentProject).toHaveBeenCalled()
  })

  it("должен предоставлять метод создания нового проекта", () => {
    const { result } = renderHook(() => useCurrentProject())

    act(() => {
      result.current.createNewProject("Новый проект")
    })

    expect(mockAppSettings.createNewProject).toHaveBeenCalledWith("Новый проект")
  })

  it("должен предоставлять метод открытия проекта", async () => {
    mockAppSettings.openProject.mockResolvedValue({
      path: "/path/to/opened.tls",
      name: "Открытый проект",
    })

    const { result } = renderHook(() => useCurrentProject())

    const openedProject = await act(async () => {
      return await result.current.openProject()
    })

    expect(openedProject).toEqual({
      path: "/path/to/opened.tls",
      name: "Открытый проект",
    })
    expect(mockAppSettings.openProject).toHaveBeenCalled()
  })

  it("должен предоставлять метод сохранения проекта", async () => {
    mockAppSettings.saveProject.mockResolvedValue({
      path: "/path/to/saved.tls",
      name: "Сохраненный проект",
    })

    const { result } = renderHook(() => useCurrentProject())

    const savedProject = await act(async () => {
      return await result.current.saveProject("Сохраненный проект")
    })

    expect(savedProject).toEqual({
      path: "/path/to/saved.tls",
      name: "Сохраненный проект",
    })
    expect(mockAppSettings.saveProject).toHaveBeenCalledWith("Сохраненный проект")
  })

  it("должен предоставлять метод установки флага изменений", () => {
    const { result } = renderHook(() => useCurrentProject())

    act(() => {
      result.current.setProjectDirty(true)
    })

    expect(mockAppSettings.setProjectDirty).toHaveBeenCalledWith(true)

    act(() => {
      result.current.setProjectDirty(false)
    })

    expect(mockAppSettings.setProjectDirty).toHaveBeenCalledWith(false)
  })

  it("должен корректно обрабатывать null проект", () => {
    mockAppSettings.getCurrentProject.mockReturnValue(null)

    const { result } = renderHook(() => useCurrentProject())

    expect(result.current.currentProject).toBeNull()
  })

  it("должен обновляться при изменении проекта", () => {
    const project1 = { path: "/project1.tls", name: "Проект 1", isDirty: false, isNew: false }
    const project2 = { path: "/project2.tls", name: "Проект 2", isDirty: true, isNew: false }

    mockAppSettings.getCurrentProject.mockReturnValue(project1)

    const { result, rerender } = renderHook(() => useCurrentProject())

    expect(result.current.currentProject).toEqual(project1)

    // Меняем возвращаемое значение
    mockAppSettings.getCurrentProject.mockReturnValue(project2)

    // Перерендериваем хук
    rerender()

    expect(result.current.currentProject).toEqual(project2)
  })
})
