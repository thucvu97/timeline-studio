import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BrowserStateProvider } from "@/features/browser/services/browser-state-provider"
import { useFileSelection } from "../use-file-selection"

// Mock данные
const mockFile = {
  id: "test-file-1",
  name: "test.mp4",
  path: "/path/test.mp4",
  isVideo: true,
  isAudio: false,
  isImage: false,
  size: 1024,
  duration: 10,
}

// Wrapper для тестов
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <BrowserStateProvider>{children}</BrowserStateProvider>
}

describe("useFileSelection", () => {
  it("должен возвращать правильное начальное состояние", () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)
    expect(typeof result.current.toggleSelection).toBe("function")
    expect(typeof result.current.selectFile).toBe("function")
    expect(typeof result.current.deselectFile).toBe("function")
    expect(typeof result.current.handleToggleSelection).toBe("function")
  })

  it("должен переключать состояние выбора файла", () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)

    act(() => {
      result.current.toggleSelection()
    })

    expect(result.current.isSelected).toBe(true)

    act(() => {
      result.current.toggleSelection()
    })

    expect(result.current.isSelected).toBe(false)
  })

  it("должен выбирать файл", () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    expect(result.current.isSelected).toBe(false)

    act(() => {
      result.current.selectFile()
    })

    expect(result.current.isSelected).toBe(true)
  })

  it("должен отменять выбор файла", () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    // Сначала выберем файл
    act(() => {
      result.current.selectFile()
    })

    expect(result.current.isSelected).toBe(true)

    // Теперь отменим выбор
    act(() => {
      result.current.deselectFile()
    })

    expect(result.current.isSelected).toBe(false)
  })

  it("должен предотвращать всплытие события в handleToggleSelection", () => {
    const { result } = renderHook(() => useFileSelection(mockFile), {
      wrapper: TestWrapper,
    })

    const mockEvent = {
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent

    act(() => {
      result.current.handleToggleSelection(mockEvent)
    })

    expect(mockEvent.stopPropagation).toHaveBeenCalledOnce()
    expect(result.current.isSelected).toBe(true)
  })
})
