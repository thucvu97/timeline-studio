import { beforeEach, describe, expect, it, vi } from "vitest"

import { ShortcutDefinition, shortcutsRegistry } from "../../services/shortcuts-registry"

describe("ShortcutsRegistry", () => {
  beforeEach(() => {
    // Clear registry before each test
    shortcutsRegistry.clear()
  })

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = shortcutsRegistry
      const instance2 = shortcutsRegistry
      expect(instance1).toBe(instance2)
    })
  })

  describe("Category Initialization", () => {
    it("should initialize with default categories", () => {
      const categories = shortcutsRegistry.getCategories()

      expect(categories).toHaveLength(10)
      expect(categories.map((c) => c.id)).toEqual([
        "settings",
        "file",
        "edit",
        "view",
        "timeline",
        "playback",
        "tools",
        "markers",
        "export",
        "other",
      ])
    })

    it("should sort categories by order", () => {
      const categories = shortcutsRegistry.getCategories()

      for (let i = 0; i < categories.length - 1; i++) {
        expect(categories[i].order).toBeLessThan(categories[i + 1].order)
      }
    })
  })

  describe("Shortcut Registration", () => {
    const mockShortcut: ShortcutDefinition = {
      id: "test-shortcut",
      name: "Test Shortcut",
      category: "test",
      keys: ["cmd+t"],
      description: "Test description",
      action: vi.fn(),
    }

    it("should register a single shortcut", () => {
      shortcutsRegistry.register(mockShortcut)

      const shortcut = shortcutsRegistry.get("test-shortcut")
      expect(shortcut).toBeDefined()
      expect(shortcut?.id).toBe("test-shortcut")
      expect(shortcut?.enabled).toBe(true) // Default enabled value
    })

    it("should normalize keys to array if not already", () => {
      const shortcutWithStringKeys = {
        ...mockShortcut,
        keys: "cmd+t" as any, // Simulate non-array input
      }

      shortcutsRegistry.register(shortcutWithStringKeys)

      const shortcut = shortcutsRegistry.get("test-shortcut")
      expect(Array.isArray(shortcut?.keys)).toBe(true)
      expect(shortcut?.keys).toEqual(["cmd+t"])
    })

    it("should register multiple shortcuts", () => {
      const shortcuts: ShortcutDefinition[] = [
        { ...mockShortcut, id: "shortcut-1" },
        { ...mockShortcut, id: "shortcut-2" },
        { ...mockShortcut, id: "shortcut-3" },
      ]

      shortcutsRegistry.registerMany(shortcuts)

      expect(shortcutsRegistry.getAll()).toHaveLength(3)
      expect(shortcutsRegistry.get("shortcut-1")).toBeDefined()
      expect(shortcutsRegistry.get("shortcut-2")).toBeDefined()
      expect(shortcutsRegistry.get("shortcut-3")).toBeDefined()
    })

    it("should override existing shortcut with same id", () => {
      shortcutsRegistry.register(mockShortcut)

      const updatedShortcut = {
        ...mockShortcut,
        name: "Updated Test Shortcut",
      }

      shortcutsRegistry.register(updatedShortcut)

      const shortcut = shortcutsRegistry.get("test-shortcut")
      expect(shortcut?.name).toBe("Updated Test Shortcut")
    })
  })

  describe("Getting Shortcuts", () => {
    beforeEach(() => {
      const shortcuts: ShortcutDefinition[] = [
        {
          id: "file-new",
          name: "New File",
          category: "file",
          keys: ["cmd+n"],
        },
        {
          id: "file-open",
          name: "Open File",
          category: "file",
          keys: ["cmd+o"],
        },
        {
          id: "edit-copy",
          name: "Copy",
          category: "edit",
          keys: ["cmd+c"],
        },
      ]

      shortcutsRegistry.registerMany(shortcuts)
    })

    it("should get shortcut by id", () => {
      const shortcut = shortcutsRegistry.get("file-new")
      expect(shortcut).toBeDefined()
      expect(shortcut?.name).toBe("New File")
    })

    it("should return undefined for non-existent id", () => {
      const shortcut = shortcutsRegistry.get("non-existent")
      expect(shortcut).toBeUndefined()
    })

    it("should get all shortcuts", () => {
      const shortcuts = shortcutsRegistry.getAll()
      expect(shortcuts).toHaveLength(3)
    })

    it("should get shortcuts by category", () => {
      const fileShortcuts = shortcutsRegistry.getByCategory("file")
      expect(fileShortcuts).toHaveLength(2)
      expect(fileShortcuts.every((s) => s.category === "file")).toBe(true)

      const editShortcuts = shortcutsRegistry.getByCategory("edit")
      expect(editShortcuts).toHaveLength(1)
      expect(editShortcuts[0].id).toBe("edit-copy")
    })

    it("should return empty array for non-existent category", () => {
      const shortcuts = shortcutsRegistry.getByCategory("non-existent")
      expect(shortcuts).toEqual([])
    })
  })

  describe("Updating Shortcuts", () => {
    const mockShortcut: ShortcutDefinition = {
      id: "test-shortcut",
      name: "Test Shortcut",
      category: "test",
      keys: ["cmd+t"],
      enabled: true,
    }

    beforeEach(() => {
      shortcutsRegistry.register(mockShortcut)
    })

    it("should update shortcut keys", () => {
      shortcutsRegistry.updateKeys("test-shortcut", ["cmd+shift+t", "ctrl+t"])

      const shortcut = shortcutsRegistry.get("test-shortcut")
      expect(shortcut?.keys).toEqual(["cmd+shift+t", "ctrl+t"])
    })

    it("should not update keys for non-existent shortcut", () => {
      shortcutsRegistry.updateKeys("non-existent", ["cmd+x"])

      // Should not throw error
      expect(() => shortcutsRegistry.updateKeys("non-existent", ["cmd+x"])).not.toThrow()
    })

    it("should toggle enabled state", () => {
      const shortcut = shortcutsRegistry.get("test-shortcut")
      const initialState = shortcut?.enabled

      shortcutsRegistry.toggleEnabled("test-shortcut")

      const updatedShortcut = shortcutsRegistry.get("test-shortcut")
      expect(updatedShortcut?.enabled).toBe(!initialState)

      // Toggle again
      shortcutsRegistry.toggleEnabled("test-shortcut")
      const toggledAgain = shortcutsRegistry.get("test-shortcut")
      expect(toggledAgain?.enabled).toBe(initialState)
    })

    it("should not toggle enabled for non-existent shortcut", () => {
      expect(() => shortcutsRegistry.toggleEnabled("non-existent")).not.toThrow()
    })
  })

  describe("Reset Functionality", () => {
    it("should reset single shortcut", () => {
      const mockShortcut: ShortcutDefinition = {
        id: "test-shortcut",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      }

      shortcutsRegistry.register(mockShortcut)
      shortcutsRegistry.reset("test-shortcut")

      // Currently reset doesn't do much, just notifies listeners
      // This test ensures it doesn't throw
      expect(() => shortcutsRegistry.reset("test-shortcut")).not.toThrow()
    })

    it("should reset all shortcuts", () => {
      expect(() => shortcutsRegistry.resetAll()).not.toThrow()
    })
  })

  describe("Subscription System", () => {
    it("should notify listeners on shortcut registration", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)

      const mockShortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      }

      shortcutsRegistry.register(mockShortcut)

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "test" })]))
    })

    it("should notify multiple listeners", () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      shortcutsRegistry.subscribe(listener1)
      shortcutsRegistry.subscribe(listener2)

      shortcutsRegistry.register({
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it("should unsubscribe listener", () => {
      const listener = vi.fn()
      const unsubscribe = shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.register({
        id: "test1",
        name: "Test 1",
        category: "test",
        keys: ["cmd+1"],
      })

      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      shortcutsRegistry.register({
        id: "test2",
        name: "Test 2",
        category: "test",
        keys: ["cmd+2"],
      })

      expect(listener).toHaveBeenCalledTimes(1) // Still 1, not called again
    })

    it("should notify on key update", () => {
      const listener = vi.fn()

      shortcutsRegistry.register({
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      })

      shortcutsRegistry.subscribe(listener)
      listener.mockClear()

      shortcutsRegistry.updateKeys("test", ["cmd+shift+t"])

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it("should notify on toggle enabled", () => {
      const listener = vi.fn()

      shortcutsRegistry.register({
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      })

      shortcutsRegistry.subscribe(listener)
      listener.mockClear()

      shortcutsRegistry.toggleEnabled("test")

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it("should notify on reset", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)
      listener.mockClear()

      shortcutsRegistry.reset("any-id")
      expect(listener).toHaveBeenCalledTimes(1)

      shortcutsRegistry.resetAll()
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe("Clear Functionality", () => {
    it("should clear all shortcuts and reinitialize categories", () => {
      shortcutsRegistry.register({
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      })

      expect(shortcutsRegistry.getAll()).toHaveLength(1)

      shortcutsRegistry.clear()

      expect(shortcutsRegistry.getAll()).toHaveLength(0)
      expect(shortcutsRegistry.getCategories()).toHaveLength(10) // Default categories restored
    })

    it("should notify listeners on clear", () => {
      const listener = vi.fn()
      shortcutsRegistry.subscribe(listener)

      shortcutsRegistry.register({
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      })

      listener.mockClear()

      shortcutsRegistry.clear()

      expect(listener).toHaveBeenCalledWith([]) // Called with empty array
    })
  })
})
