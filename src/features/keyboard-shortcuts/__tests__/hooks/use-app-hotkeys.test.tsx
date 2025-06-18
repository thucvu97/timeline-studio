import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAppHotkeys } from "../../hooks/use-app-hotkeys"
import { shortcutsRegistry } from "../../services/shortcuts-registry"

// Mock dependencies
const mockOpenModal = vi.fn()

vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: mockOpenModal,
  }),
}))

describe("useAppHotkeys", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shortcutsRegistry.clear()
  })

  afterEach(() => {
    shortcutsRegistry.clear()
  })

  describe("Hook Initialization", () => {
    it("should register default shortcuts on first load", () => {
      const registerManySpy = vi.spyOn(shortcutsRegistry, "registerMany")

      renderHook(() => useAppHotkeys())

      expect(registerManySpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "open-user-settings" }),
          expect.objectContaining({ id: "open-project-settings" }),
          expect.objectContaining({ id: "open-keyboard-shortcuts" }),
        ]),
      )
    })

    it("should not re-register shortcuts if already exists", () => {
      // Pre-register some shortcuts
      shortcutsRegistry.register({
        id: "existing",
        name: "Existing",
        category: "test",
        keys: ["cmd+e"],
      })
      
      const registerManySpy = vi.spyOn(shortcutsRegistry, "registerMany")

      renderHook(() => useAppHotkeys())

      expect(registerManySpy).not.toHaveBeenCalled()
    })
  })

  describe("Modal Action Handlers", () => {
    it("should register modal shortcuts with actions", () => {
      renderHook(() => useAppHotkeys())

      const userSettingsShortcut = shortcutsRegistry.get("open-user-settings")
      const projectSettingsShortcut = shortcutsRegistry.get("open-project-settings")
      const keyboardShortcut = shortcutsRegistry.get("open-keyboard-shortcuts")

      expect(userSettingsShortcut?.action).toBeDefined()
      expect(projectSettingsShortcut?.action).toBeDefined()
      expect(keyboardShortcut?.action).toBeDefined()
    })

    it("should call openModal with correct modal id for user settings", () => {
      // Ensure registry is empty so shortcuts get registered
      shortcutsRegistry.clear()
      
      renderHook(() => useAppHotkeys())

      const shortcut = shortcutsRegistry.get("open-user-settings")
      const mockEvent = new KeyboardEvent("keydown")
      vi.spyOn(mockEvent, "preventDefault")

      shortcut?.action?.(mockEvent, {})

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOpenModal).toHaveBeenCalledWith("user-settings")
    })

    it("should call openModal with correct modal id for project settings", () => {
      // Ensure registry is empty so shortcuts get registered
      shortcutsRegistry.clear()
      
      renderHook(() => useAppHotkeys())

      const shortcut = shortcutsRegistry.get("open-project-settings")
      const mockEvent = new KeyboardEvent("keydown")
      vi.spyOn(mockEvent, "preventDefault")

      shortcut?.action?.(mockEvent, {})

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOpenModal).toHaveBeenCalledWith("project-settings")
    })

    it("should call openModal with correct modal id for keyboard shortcuts", () => {
      // Ensure registry is empty so shortcuts get registered
      shortcutsRegistry.clear()
      
      renderHook(() => useAppHotkeys())

      const shortcut = shortcutsRegistry.get("open-keyboard-shortcuts")
      const mockEvent = new KeyboardEvent("keydown")
      vi.spyOn(mockEvent, "preventDefault")

      shortcut?.action?.(mockEvent, {})

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockOpenModal).toHaveBeenCalledWith("keyboard-shortcuts")
    })
  })

  describe("Toggle Functionality", () => {
    it("should provide toggle function", () => {
      const { result } = renderHook(() => useAppHotkeys())

      expect(result.current.toggleShortcuts).toBeDefined()
      expect(typeof result.current.toggleShortcuts).toBe("function")
    })

    it("should update isEnabled state", () => {
      const { result } = renderHook(() => useAppHotkeys())

      expect(result.current.isEnabled).toBe(true)

      act(() => {
        result.current.toggleShortcuts(false)
      })

      expect(result.current.isEnabled).toBe(false)

      act(() => {
        result.current.toggleShortcuts(true)
      })

      expect(result.current.isEnabled).toBe(true)
    })
  })

  describe("Subscription", () => {
    it("should update registered shortcuts list", () => {
      // Clear registry to ensure clean state
      shortcutsRegistry.clear()
      
      const { result } = renderHook(() => useAppHotkeys())

      // Wait for useEffect to run and register shortcuts
      act(() => {
        // Force a re-render to ensure effect has run
      })
      
      // Now trigger an update by adding a shortcut to force subscription callback
      act(() => {
        shortcutsRegistry.register({
          id: "trigger-update",
          name: "Trigger",
          category: "test",
          keys: ["cmd+t"],
          action: vi.fn(),
          enabled: true,
        })
      })
      
      // After the update, we should have the modal shortcuts registered
      expect(result.current.registeredShortcuts.length).toBeGreaterThan(0)
      expect(result.current.registeredShortcuts).toContain("open-user-settings")
      expect(result.current.registeredShortcuts).toContain("open-project-settings")
      expect(result.current.registeredShortcuts).toContain("open-keyboard-shortcuts")

      // Add a new shortcut with action
      act(() => {
        shortcutsRegistry.register({
          id: "new-test",
          name: "New Test",
          category: "test",
          keys: ["cmd+n"],
          action: vi.fn(),
          enabled: true,
        })
      })

      // Should include the new shortcut
      expect(result.current.registeredShortcuts).toContain("new-test")
    })

    it("should unsubscribe on unmount", () => {
      const unsubscribeSpy = vi.fn()
      vi.spyOn(shortcutsRegistry, "subscribe").mockReturnValue(unsubscribeSpy)

      const { unmount } = renderHook(() => useAppHotkeys())

      expect(unsubscribeSpy).not.toHaveBeenCalled()

      unmount()

      expect(unsubscribeSpy).toHaveBeenCalled()
    })
  })
})