import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCurrentProject } from "../../hooks/use-current-project"

// Мокаем useApp
const mockExecuteCommand = vi.fn()
const mockProjectState = {
  project: null,
}

vi.mock("../../services/app-provider", () => ({
  useApp: () => ({
    projectState: mockProjectState,
    executeCommand: mockExecuteCommand,
  }),
}))

describe("useCurrentProject", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен возвращать текущий проект", () => {
    const mockProject = {
      id: "project-1",
      name: "Мой проект",
      path: "/path/to/project.tls",
      metadata: {
        isDirty: false,
        isNew: false,
      },
    }
    mockProjectState.project = mockProject

    const { result } = renderHook(() => useCurrentProject())

    expect(result.current.currentProject).toEqual(mockProject)
  })

  it("должен предоставлять метод создания нового проекта", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.createNewProject("Новый проект")
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "CreateProject",
      params: { name: "Новый проект", template: "default" }
    })
  })

  it("должен предоставлять метод открытия проекта", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.openProject("/path/to/opened.tls")
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "LoadProject",
      params: { path: "/path/to/opened.tls" }
    })
  })

  it("должен предоставлять метод сохранения проекта", async () => {
    const { result } = renderHook(() => useCurrentProject())

    await act(async () => {
      await result.current.saveProject("/path/to/saved.tls")
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "SaveProject",
      params: { path: "/path/to/saved.tls" }
    })
  })

  it("должен предоставлять метод установки флага изменений", () => {
    const { result } = renderHook(() => useCurrentProject())

    act(() => {
      result.current.setProjectDirty(true)
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "SetProjectDirty",
      params: { dirty: true }
    })

    act(() => {
      result.current.setProjectDirty(false)
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "SetProjectDirty",
      params: { dirty: false }
    })
  })

  it("должен корректно обрабатывать null проект", () => {
    mockProjectState.project = null

    const { result } = renderHook(() => useCurrentProject())

    expect(result.current.currentProject).toBeNull()
  })

  it("должен обновляться при изменении проекта", () => {
    const project1 = {
      id: "project-1",
      name: "Проект 1",
      path: "/project1.tls",
      metadata: {
        isDirty: false,
        isNew: false,
      },
    }
    const project2 = {
      id: "project-2",
      name: "Проект 2",
      path: "/project2.tls",
      metadata: {
        isDirty: true,
        isNew: false,
      },
    }

    mockProjectState.project = project1

    const { result, rerender } = renderHook(() => useCurrentProject())

    expect(result.current.currentProject).toEqual(project1)

    // Меняем возвращаемое значение
    mockProjectState.project = project2

    // Перерендериваем хук
    rerender()

    expect(result.current.currentProject).toEqual(project2)
  })
})
