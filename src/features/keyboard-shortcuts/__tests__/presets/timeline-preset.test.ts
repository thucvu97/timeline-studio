import { describe, expect, it, vi } from "vitest"

import { createTimelinePreset } from "../../presets/timeline-preset"

describe("Timeline Preset", () => {
  const mockT = vi.fn((key: string, fallback?: string) => fallback || key)

  beforeEach(() => {
    mockT.mockClear()
  })

  it("should create Timeline preset with all categories", () => {
    const preset = createTimelinePreset(mockT)

    expect(preset).toBeDefined()
    expect(Array.isArray(preset)).toBe(true)
    expect(preset.length).toBe(8) // 8 categories

    // Verify all expected categories exist
    const categoryIds = preset.map((category) => category.id)
    expect(categoryIds).toEqual(["preferences", "file", "edit", "view", "tools", "marker", "multicam", "other"])
  })

  describe("Preferences Category", () => {
    it("should contain all preference shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const prefsCategory = preset.find((cat) => cat.id === "preferences")

      expect(prefsCategory).toBeDefined()
      expect(prefsCategory!.shortcuts).toHaveLength(3)

      const shortcuts = prefsCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "preferences")?.keys).toBe("⌥⌘.")
      expect(shortcuts.find((s) => s.id === "project-settings")?.keys).toBe("⌥⌘,")
      expect(shortcuts.find((s) => s.id === "shortcuts")?.keys).toBe("⌥⌘K")
    })
  })

  describe("File Category", () => {
    it("should contain all file operation shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const fileCategory = preset.find((cat) => cat.id === "file")

      expect(fileCategory).toBeDefined()
      expect(fileCategory!.shortcuts).toHaveLength(6)

      const shortcutIds = fileCategory!.shortcuts.map((s) => s.id)
      expect(shortcutIds).toEqual(["new-project", "open-project", "save-project", "save-as", "archive", "import"])

      // Verify key mappings
      const shortcuts = fileCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "new-project")?.keys).toBe("⌘N")
      expect(shortcuts.find((s) => s.id === "open-project")?.keys).toBe("⌘O")
      expect(shortcuts.find((s) => s.id === "save-project")?.keys).toBe("⌘S")
      expect(shortcuts.find((s) => s.id === "save-as")?.keys).toBe("⇧⌘S")
      expect(shortcuts.find((s) => s.id === "archive")?.keys).toBe("⇧⌘A")
      expect(shortcuts.find((s) => s.id === "import")?.keys).toBe("⌘I")
    })
  })

  describe("Edit Category", () => {
    it("should contain all edit operation shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const editCategory = preset.find((cat) => cat.id === "edit")

      expect(editCategory).toBeDefined()
      expect(editCategory!.shortcuts).toHaveLength(7)

      const shortcuts = editCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "undo")?.keys).toBe("⌘Z")
      expect(shortcuts.find((s) => s.id === "redo")?.keys).toBe("⇧⌘Z")
      expect(shortcuts.find((s) => s.id === "cut")?.keys).toBe("⌘X")
      expect(shortcuts.find((s) => s.id === "copy")?.keys).toBe("⌘C")
      expect(shortcuts.find((s) => s.id === "paste")?.keys).toBe("⌘V")
      expect(shortcuts.find((s) => s.id === "delete")?.keys).toBe("Delete")
      expect(shortcuts.find((s) => s.id === "select-all")?.keys).toBe("⌘A")
    })
  })

  describe("View Category", () => {
    it("should contain all view shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const viewCategory = preset.find((cat) => cat.id === "view")

      expect(viewCategory).toBeDefined()
      expect(viewCategory!.shortcuts).toHaveLength(5)

      const shortcuts = viewCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "zoom-in")?.keys).toBe("⌘+")
      expect(shortcuts.find((s) => s.id === "zoom-out")?.keys).toBe("⌘-")
      expect(shortcuts.find((s) => s.id === "fit-to-screen")?.keys).toBe("⌘0")
      expect(shortcuts.find((s) => s.id === "toggle-browser")?.keys).toBe("⌘B")
      expect(shortcuts.find((s) => s.id === "toggle-timeline")?.keys).toBe("⌘T")
    })
  })

  describe("Tools Category", () => {
    it("should contain all tool shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const toolsCategory = preset.find((cat) => cat.id === "tools")

      expect(toolsCategory).toBeDefined()
      expect(toolsCategory!.shortcuts).toHaveLength(4)

      const shortcuts = toolsCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "selection")?.keys).toBe("V")
      expect(shortcuts.find((s) => s.id === "cut-tool")?.keys).toBe("C")
      expect(shortcuts.find((s) => s.id === "hand-tool")?.keys).toBe("H")
      expect(shortcuts.find((s) => s.id === "zoom-tool")?.keys).toBe("Z")
    })
  })

  describe("Marker Category", () => {
    it("should contain all marker shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const markerCategory = preset.find((cat) => cat.id === "marker")

      expect(markerCategory).toBeDefined()
      expect(markerCategory!.shortcuts).toHaveLength(3)

      const shortcuts = markerCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "add-marker")?.keys).toBe("M")
      expect(shortcuts.find((s) => s.id === "next-marker")?.keys).toBe("⇧M")
      expect(shortcuts.find((s) => s.id === "prev-marker")?.keys).toBe("⌥M")
    })
  })

  describe("Multicam Category", () => {
    it("should contain all multicam shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const multicamCategory = preset.find((cat) => cat.id === "multicam")

      expect(multicamCategory).toBeDefined()
      expect(multicamCategory!.shortcuts).toHaveLength(4)

      const shortcuts = multicamCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "switch-camera-1")?.keys).toBe("1")
      expect(shortcuts.find((s) => s.id === "switch-camera-2")?.keys).toBe("2")
      expect(shortcuts.find((s) => s.id === "switch-camera-3")?.keys).toBe("3")
      expect(shortcuts.find((s) => s.id === "switch-camera-4")?.keys).toBe("4")
    })
  })

  describe("Other Category", () => {
    it("should contain playback and audio shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const otherCategory = preset.find((cat) => cat.id === "other")

      expect(otherCategory).toBeDefined()
      expect(otherCategory!.shortcuts).toHaveLength(6)

      const shortcuts = otherCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "play-pause")?.keys).toBe("Space")
      expect(shortcuts.find((s) => s.id === "next-frame")?.keys).toBe("→")
      expect(shortcuts.find((s) => s.id === "prev-frame")?.keys).toBe("←")
      expect(shortcuts.find((s) => s.id === "volume-up")?.keys).toBe("⌘↑")
      expect(shortcuts.find((s) => s.id === "volume-down")?.keys).toBe("⌘↓")
      expect(shortcuts.find((s) => s.id === "mute")?.keys).toBe("⌘M")
    })
  })

  describe("Translation Integration", () => {
    it("should call translation function for all categories and shortcuts", () => {
      createTimelinePreset(mockT)

      // Verify translation calls for categories
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.preferences", "Настройки")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.file", "Файл")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.edit", "Редактировать")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.view", "Посмотреть")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.tools", "Инструменты")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.marker", "Маркер")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.multicam", "Мультикамерный монтаж")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.other", "Прочее")

      // Verify translation calls for some shortcuts
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.preferences", "Настройки пользователя")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.new-project", "Создать новый проект")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.undo", "Отменить")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.play-pause", "Воспроизведение/Пауза")
    })

    it("should handle missing translations gracefully", () => {
      const mockTMissing = vi.fn((key: string) => key)
      const preset = createTimelinePreset(mockTMissing)

      expect(preset).toBeDefined()
      expect(preset.length).toBe(8)

      // Should return translation keys when translations are missing
      const prefsCategory = preset.find((cat) => cat.id === "preferences")
      expect(prefsCategory?.name).toBe("dialogs.keyboardShortcuts.categories.preferences")
    })
  })

  describe("Keyboard Shortcuts Validation", () => {
    it("should have unique ids within the preset", () => {
      const preset = createTimelinePreset(mockT)

      const allIds = preset.flatMap((cat) => cat.shortcuts.map((s) => s.id))
      const uniqueIds = [...new Set(allIds)]

      expect(allIds.length).toBe(uniqueIds.length)
    })

    it("should use proper macOS keyboard notation", () => {
      const preset = createTimelinePreset(mockT)

      preset.forEach((category) => {
        category.shortcuts.forEach((shortcut) => {
          const { keys } = shortcut

          // Should not contain lowercase letters except for single letter shortcuts
          if (keys.length > 1 && keys !== "Space" && keys !== "Delete" && keys !== "Home" && keys !== "End") {
            expect(keys).not.toMatch(/[a-z]/)
          }

          // Should use proper macOS symbols
          if (keys.includes("⌘") || keys.includes("⌥") || keys.includes("⇧")) {
            expect(keys).toMatch(/^[⌘⇧⌥⌃↑↓←→+\-[\]\\/.,'";:0-9A-Z\s]+$/)
          }
        })
      })
    })

    it("should have all required properties for each shortcut", () => {
      const preset = createTimelinePreset(mockT)

      preset.forEach((category) => {
        expect(category).toHaveProperty("id")
        expect(category).toHaveProperty("name")
        expect(category).toHaveProperty("shortcuts")
        expect(Array.isArray(category.shortcuts)).toBe(true)

        category.shortcuts.forEach((shortcut) => {
          expect(shortcut).toHaveProperty("id")
          expect(shortcut).toHaveProperty("name")
          expect(shortcut).toHaveProperty("keys")
          expect(typeof shortcut.id).toBe("string")
          expect(typeof shortcut.name).toBe("string")
          expect(typeof shortcut.keys).toBe("string")
          expect(shortcut.id.length).toBeGreaterThan(0)
          expect(shortcut.keys.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe("Timeline Preset Specifics", () => {
    it("should have Timeline-specific shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const allShortcuts = preset.flatMap((cat) => cat.shortcuts)
      const allIds = allShortcuts.map((s) => s.id)

      // Timeline-specific shortcuts
      expect(allIds).toContain("preferences")
      expect(allIds).toContain("project-settings")
      expect(allIds).toContain("shortcuts")
      expect(allIds).toContain("toggle-browser")
      expect(allIds).toContain("toggle-timeline")
      expect(allIds).toContain("selection")
      expect(allIds).toContain("cut-tool")
      expect(allIds).toContain("hand-tool")
      expect(allIds).toContain("zoom-tool")
    })

    it("should have appropriate number of shortcuts", () => {
      const preset = createTimelinePreset(mockT)
      const totalShortcuts = preset.reduce((sum, category) => sum + category.shortcuts.length, 0)

      expect(totalShortcuts).toBe(38) // Total shortcuts in Timeline preset
    })
  })
})
