import React from "react"

import { render } from "@testing-library/react"
import { useHotkeys } from "react-hotkeys-hook"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ShortcutHandler } from "../../components/shortcut-handler"
import { ShortcutDefinition } from "../../services/shortcuts-registry"

// Mock react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}))

describe("ShortcutHandler", () => {
  const mockUseHotkeys = vi.mocked(useHotkeys)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render null", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      }

      const { container } = render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe("Hotkey Registration", () => {
    it("should register hotkey for single key combination", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        action: mockAction,
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        "cmd+t",
        mockAction,
        expect.objectContaining({
          enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
          preventDefault: true,
          enabled: true,
        }),
        expect.arrayContaining([true, mockAction, true]),
      )
    })

    it("should register hotkeys for multiple key combinations", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t", "ctrl+t", "alt+t"],
        action: mockAction,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      // Should be called 3 times, once for each key combination
      expect(mockUseHotkeys).toHaveBeenCalledTimes(3)

      expect(mockUseHotkeys).toHaveBeenCalledWith("cmd+t", mockAction, expect.any(Object), expect.any(Array))

      expect(mockUseHotkeys).toHaveBeenCalledWith("ctrl+t", mockAction, expect.any(Object), expect.any(Array))

      expect(mockUseHotkeys).toHaveBeenCalledWith("alt+t", mockAction, expect.any(Object), expect.any(Array))
    })

    it("should use empty function when no action provided", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        // No action provided
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      const registeredAction = mockUseHotkeys.mock.calls[0][1]
      expect(typeof registeredAction).toBe("function")

      // Should not throw when called
      expect(() => registeredAction({} as any, {})).not.toThrow()
    })
  })

  describe("Enabled/Disabled State", () => {
    it("should enable hotkey when both enabled and shortcut.enabled are true", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enabled: true,
        }),
        expect.any(Array),
      )
    })

    it("should disable hotkey when enabled prop is false", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={false} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Array),
      )
    })

    it("should disable hotkey when shortcut.enabled is false", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        enabled: false,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enabled: false,
        }),
        expect.any(Array),
      )
    })

    it("should treat undefined shortcut.enabled as enabled", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        // enabled is undefined
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enabled: undefined,
        }),
        expect.any(Array),
      )
    })
  })

  describe("Options Handling", () => {
    it("should merge custom options with defaults", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        options: {
          preventDefault: false,
          enableOnFormTags: false,
          enabled: false,
        },
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
          preventDefault: true,
          enabled: false, // Should respect the combined enabled state
          // Custom options should be spread in
          ...shortcut.options,
        }),
        expect.any(Array),
      )
    })

    it("should use default options when none provided", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
          preventDefault: true,
          enabled: undefined,
        }),
        expect.any(Array),
      )
    })
  })

  describe("Dependencies Array", () => {
    it("should include correct dependencies", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        action: mockAction,
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      const dependencies = mockUseHotkeys.mock.calls[0][3]

      expect(dependencies).toEqual([true, mockAction, true])
    })

    it("should update dependencies when props change", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        action: mockAction,
        enabled: true,
      }

      const { rerender } = render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      mockUseHotkeys.mockClear()

      // Change enabled prop
      rerender(<ShortcutHandler shortcut={shortcut} enabled={false} />)

      const dependencies = mockUseHotkeys.mock.calls[0][3]
      expect(dependencies).toEqual([false, mockAction, true])
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty keys array", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: [],
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      // Should not call useHotkeys when there are no keys
      expect(mockUseHotkeys).not.toHaveBeenCalled()
    })

    it("should handle shortcut with many key combinations", () => {
      const keys = Array.from({ length: 10 }, (_, i) => `cmd+${i}`)
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} />)

      expect(mockUseHotkeys).toHaveBeenCalledTimes(10)
    })
  })
})
