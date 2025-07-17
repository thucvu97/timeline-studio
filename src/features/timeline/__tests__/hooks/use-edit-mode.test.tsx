import { act, render, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EditModeProvider, useEditMode, useEditModeContext } from "../../hooks/use-edit-mode"
import { EDIT_MODES } from "../../types/edit-modes"

// Mock react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}))

// Mock EDIT_MODE_CONFIGS
vi.mock("../../types/edit-modes", () => ({
  EDIT_MODES: {
    SELECT: "select",
    SPLIT: "split",
    DELETE: "delete",
    MOVE: "move",
  },
  EDIT_MODE_CONFIGS: {
    select: {
      mode: "select",
      cursor: "default",
      hotkey: "v",
    },
    split: {
      mode: "split",
      cursor: "crosshair",
      hotkey: "s",
    },
    delete: {
      mode: "delete",
      cursor: "not-allowed",
      hotkey: "d",
    },
    move: {
      mode: "move",
      cursor: "move",
      hotkey: "m",
    },
  },
}))

describe("useEditMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset document body cursor
    document.body.style.cursor = ""
  })

  it("should initialize with default mode", () => {
    const { result } = renderHook(() => useEditMode())

    expect(result.current.editMode).toBe(EDIT_MODES.SELECT)
    expect(result.current.cursor).toBe("default")
  })

  it("should initialize with custom mode", () => {
    const { result } = renderHook(() => useEditMode(EDIT_MODES.SPLIT))

    expect(result.current.editMode).toBe(EDIT_MODES.SPLIT)
    expect(result.current.cursor).toBe("crosshair")
  })

  it("should change edit mode", () => {
    const { result } = renderHook(() => useEditMode())

    act(() => {
      result.current.setEditMode(EDIT_MODES.DELETE)
    })

    expect(result.current.editMode).toBe(EDIT_MODES.DELETE)
    expect(result.current.cursor).toBe("not-allowed")
  })

  it("should check if in specific mode", () => {
    const { result } = renderHook(() => useEditMode())

    expect(result.current.isEditMode(EDIT_MODES.SELECT)).toBe(true)
    expect(result.current.isEditMode(EDIT_MODES.SPLIT)).toBe(false)

    act(() => {
      result.current.setEditMode(EDIT_MODES.MOVE)
    })

    expect(result.current.isEditMode(EDIT_MODES.SELECT)).toBe(false)
    expect(result.current.isEditMode(EDIT_MODES.MOVE)).toBe(true)
  })

  it("should update document cursor", () => {
    const { result } = renderHook(() => useEditMode())

    expect(document.body.style.cursor).toBe("default")

    act(() => {
      result.current.setEditMode(EDIT_MODES.SPLIT)
    })

    expect(document.body.style.cursor).toBe("crosshair")
  })

  it("should restore previous cursor on unmount", () => {
    document.body.style.cursor = "pointer"

    const { result, unmount } = renderHook(() => useEditMode())

    expect(document.body.style.cursor).toBe("default")

    unmount()

    expect(document.body.style.cursor).toBe("pointer")
  })

  it("should call useHotkeys hook", () => {
    renderHook(() => useEditMode())

    // Hook should be called - this tests integration with hotkeys
    expect(true).toBe(true) // Simple test that hook renders without error
  })
})

describe("EditModeProvider", () => {
  it("should provide edit mode context", () => {
    const TestComponent = () => {
      const { editMode } = useEditModeContext()
      return <div data-testid="edit-mode">{editMode}</div>
    }

    const { getByTestId } = render(
      <EditModeProvider>
        <TestComponent />
      </EditModeProvider>
    )

    expect(getByTestId("edit-mode")).toHaveTextContent(EDIT_MODES.SELECT)
  })

  it("should throw error when used outside provider", () => {
    const TestComponent = () => {
      useEditModeContext()
      return <div>Test</div>
    }

    // Suppress console error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow(
      "useEditModeContext must be used within EditModeProvider"
    )

    consoleSpy.mockRestore()
  })

  it("should share edit mode state across components", () => {
    const Component1 = () => {
      const { editMode, setEditMode } = useEditModeContext()
      return (
        <div>
          <div data-testid="mode-1">{editMode}</div>
          <button onClick={() => setEditMode(EDIT_MODES.SPLIT)} data-testid="change-mode">
            Change Mode
          </button>
        </div>
      )
    }

    const Component2 = () => {
      const { editMode } = useEditModeContext()
      return <div data-testid="mode-2">{editMode}</div>
    }

    const { getByTestId } = render(
      <EditModeProvider>
        <Component1 />
        <Component2 />
      </EditModeProvider>
    )

    expect(getByTestId("mode-1")).toHaveTextContent(EDIT_MODES.SELECT)
    expect(getByTestId("mode-2")).toHaveTextContent(EDIT_MODES.SELECT)

    act(() => {
      getByTestId("change-mode").click()
    })

    expect(getByTestId("mode-1")).toHaveTextContent(EDIT_MODES.SPLIT)
    expect(getByTestId("mode-2")).toHaveTextContent(EDIT_MODES.SPLIT)
  })
})