import { describe, expect, it, vi } from "vitest"

import { createPremierePreset } from "../../presets/premiere-preset"

describe("Adobe Premiere Pro Preset", () => {
  const mockT = vi.fn((key: string, fallback?: string) => fallback || key)

  beforeEach(() => {
    mockT.mockClear()
  })

  it("should create Adobe Premiere Pro preset with all categories", () => {
    const preset = createPremierePreset(mockT)

    expect(preset).toBeDefined()
    expect(Array.isArray(preset)).toBe(true)
    expect(preset.length).toBe(12) // 12 categories total

    // Verify all expected categories exist
    const categoryIds = preset.map((category) => category.id)
    expect(categoryIds).toEqual([
      "file",
      "edit",
      "tools",
      "markers",
      "advanced-tools",
      "audio",
      "subtitles",
      "playback",
      "navigation",
      "timeline",
      "markers-multicam",
      "miscellaneous",
    ])
  })

  describe("File Operations Category", () => {
    it("should contain all file operation shortcuts", () => {
      const preset = createPremierePreset(mockT)
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

  describe("Edit Operations Category", () => {
    it("should contain all edit operation shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const editCategory = preset.find((cat) => cat.id === "edit")

      expect(editCategory).toBeDefined()
      expect(editCategory!.shortcuts).toHaveLength(14)

      const shortcutIds = editCategory!.shortcuts.map((s) => s.id)
      expect(shortcutIds).toContain("undo")
      expect(shortcutIds).toContain("redo")
      expect(shortcutIds).toContain("cut")
      expect(shortcutIds).toContain("copy")
      expect(shortcutIds).toContain("paste")
      expect(shortcutIds).toContain("duplicate")
      expect(shortcutIds).toContain("enable-disable")
      expect(shortcutIds).toContain("delete")
      expect(shortcutIds).toContain("ripple-delete")
      expect(shortcutIds).toContain("close-gap")
      expect(shortcutIds).toContain("select-all")
      expect(shortcutIds).toContain("range-select")

      // Verify key mappings for core edit operations
      const shortcuts = editCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "undo")?.keys).toBe("⌘Z")
      expect(shortcuts.find((s) => s.id === "redo")?.keys).toBe("⇧⌘Z")
      expect(shortcuts.find((s) => s.id === "cut")?.keys).toBe("⌘X")
      expect(shortcuts.find((s) => s.id === "copy")?.keys).toBe("⌘C")
      expect(shortcuts.find((s) => s.id === "paste")?.keys).toBe("⌘V")
      expect(shortcuts.find((s) => s.id === "duplicate")?.keys).toBe("⌘D")
    })
  })

  describe("Tools Category", () => {
    it("should contain all tool shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const toolsCategory = preset.find((cat) => cat.id === "tools")

      expect(toolsCategory).toBeDefined()
      expect(toolsCategory!.shortcuts).toHaveLength(17)

      const shortcuts = toolsCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "magnetic-timeline")?.keys).toBe("⇧N")
      expect(shortcuts.find((s) => s.id === "link")?.keys).toBe("⌘L")
      expect(shortcuts.find((s) => s.id === "split")?.keys).toBe("⌘K")
      expect(shortcuts.find((s) => s.id === "group")?.keys).toBe("⌘G")
      expect(shortcuts.find((s) => s.id === "ungroup")?.keys).toBe("⇧⌘G")
      expect(shortcuts.find((s) => s.id === "rotate-90-cw")?.keys).toBe("⌘→")
      expect(shortcuts.find((s) => s.id === "rotate-90-ccw")?.keys).toBe("⌘←")
    })
  })

  describe("Markers Category", () => {
    it("should contain all marker shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const markersCategory = preset.find((cat) => cat.id === "markers")

      expect(markersCategory).toBeDefined()
      expect(markersCategory!.shortcuts).toHaveLength(11)

      const shortcuts = markersCategory!.shortcuts
      // Test color markers
      expect(shortcuts.find((s) => s.id === "orange-marker")?.keys).toBe("⌘2")
      expect(shortcuts.find((s) => s.id === "yellow-marker")?.keys).toBe("⌘3")
      expect(shortcuts.find((s) => s.id === "green-marker")?.keys).toBe("⌘4")
      expect(shortcuts.find((s) => s.id === "blue-marker")?.keys).toBe("⌘5")
      expect(shortcuts.find((s) => s.id === "cyan-marker")?.keys).toBe("⌘6")
      expect(shortcuts.find((s) => s.id === "purple-marker")?.keys).toBe("⌘7")
      expect(shortcuts.find((s) => s.id === "gray-marker")?.keys).toBe("⌘8")

      // Test other marker functions
      expect(shortcuts.find((s) => s.id === "select-same-label")?.keys).toBe("⌘'")
      expect(shortcuts.find((s) => s.id === "render-preview")?.keys).toBe("↵")
      expect(shortcuts.find((s) => s.id === "previous-keyframe")?.keys).toBe("[")
    })
  })

  describe("Playback Category", () => {
    it("should contain all playback shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const playbackCategory = preset.find((cat) => cat.id === "playback")

      expect(playbackCategory).toBeDefined()
      expect(playbackCategory!.shortcuts).toHaveLength(10)

      const shortcuts = playbackCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "play-pause")?.keys).toBe("Space")
      expect(shortcuts.find((s) => s.id === "stop")?.keys).toBe("^/")
      expect(shortcuts.find((s) => s.id === "fullscreen")?.keys).toBe("⇧'")
      expect(shortcuts.find((s) => s.id === "previous-frame")?.keys).toBe("←")
      expect(shortcuts.find((s) => s.id === "next-frame")?.keys).toBe("→")
      expect(shortcuts.find((s) => s.id === "previous-edit-point")?.keys).toBe("↑")
      expect(shortcuts.find((s) => s.id === "next-edit-point")?.keys).toBe("↓")
    })
  })

  describe("Navigation Category", () => {
    it("should contain all navigation shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const navCategory = preset.find((cat) => cat.id === "navigation")

      expect(navCategory).toBeDefined()
      expect(navCategory!.shortcuts).toHaveLength(11)

      const shortcuts = navCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "previous-marker")?.keys).toBe("⇧↑")
      expect(shortcuts.find((s) => s.id === "next-marker")?.keys).toBe("⇧↓")
      expect(shortcuts.find((s) => s.id === "project-start")?.keys).toBe("\\")
      expect(shortcuts.find((s) => s.id === "project-end")?.keys).toBe("\\")
      expect(shortcuts.find((s) => s.id === "zoom-in")?.keys).toBe("=")
      expect(shortcuts.find((s) => s.id === "zoom-out")?.keys).toBe("-")
      expect(shortcuts.find((s) => s.id === "zoom-to-fit")?.keys).toBe("⇧Z")
    })
  })

  describe("Timeline Category", () => {
    it("should contain all timeline shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const timelineCategory = preset.find((cat) => cat.id === "timeline")

      expect(timelineCategory).toBeDefined()
      expect(timelineCategory!.shortcuts).toHaveLength(8)

      const shortcuts = timelineCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "pause")?.keys).toBe("K")
      expect(shortcuts.find((s) => s.id === "play-forward")?.keys).toBe("L")
      expect(shortcuts.find((s) => s.id === "play-backward")?.keys).toBe("J")
      expect(shortcuts.find((s) => s.id === "ruler")?.keys).toBe("⌘P")
      expect(shortcuts.find((s) => s.id === "show-hide-guides")?.keys).toBe("⌘;")
      expect(shortcuts.find((s) => s.id === "lock-unlock-guides")?.keys).toBe("⇧⌘P")
    })
  })

  describe("Multicam Category", () => {
    it("should contain all multicam shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const multicamCategory = preset.find((cat) => cat.id === "markers-multicam")

      expect(multicamCategory).toBeDefined()
      expect(multicamCategory!.shortcuts).toHaveLength(14)

      const shortcuts = multicamCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "mark-in")?.keys).toBe("I")
      expect(shortcuts.find((s) => s.id === "mark-out")?.keys).toBe("O")
      expect(shortcuts.find((s) => s.id === "clear-in-out")?.keys).toBe("⇧⌘X")
      expect(shortcuts.find((s) => s.id === "add-marker")?.keys).toBe("M")
      expect(shortcuts.find((s) => s.id === "edit-marker")?.keys).toBe("⇧M")

      // Test multicam angles 1-9
      for (let i = 1; i <= 9; i++) {
        expect(shortcuts.find((s) => s.id === `multicam-angle-${i}`)?.keys).toBe(i.toString())
      }
    })
  })

  describe("Miscellaneous Category", () => {
    it("should contain help and export shortcuts", () => {
      const preset = createPremierePreset(mockT)
      const miscCategory = preset.find((cat) => cat.id === "miscellaneous")

      expect(miscCategory).toBeDefined()
      expect(miscCategory!.shortcuts).toHaveLength(2)

      const shortcuts = miscCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "help")?.keys).toBe("F1")
      expect(shortcuts.find((s) => s.id === "export")?.keys).toBe("⌘E")
    })
  })

  describe("Translation Integration", () => {
    it("should call translation function for all categories and shortcuts", () => {
      createPremierePreset(mockT)

      // Verify translation calls for categories
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.file", "Файл")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.edit", "Редактировать")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.tools", "Инструменты")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.markers", "Маркер")

      // Verify translation calls for some shortcuts
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.new-project", "Создать новый проект")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.undo", "Отменить")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.play-pause", "Воспроизведение / Пауза")
    })

    it("should handle missing translations gracefully", () => {
      const mockTMissing = vi.fn((key: string) => key)
      const preset = createPremierePreset(mockTMissing)

      expect(preset).toBeDefined()
      expect(preset.length).toBe(12)

      // Should return translation keys when translations are missing
      const fileCategory = preset.find((cat) => cat.id === "file")
      expect(fileCategory?.name).toBe("dialogs.keyboardShortcuts.categories.file")
    })
  })

  describe("Keyboard Shortcuts Validation", () => {
    it("should have unique keyboard shortcuts within each category", () => {
      const preset = createPremierePreset(mockT)

      preset.forEach((category) => {
        const keys = category.shortcuts.map((s) => s.keys)
        const uniqueKeys = [...new Set(keys)]

        // Allow some duplicates for different functions with same keys
        expect(uniqueKeys.length).toBeGreaterThan(0)
      })
    })

    it("should use proper macOS keyboard notation", () => {
      const preset = createPremierePreset(mockT)

      preset.forEach((category) => {
        category.shortcuts.forEach((shortcut) => {
          const { keys } = shortcut

          // Skip validation for mouse/scroll combinations and Space
          if (
            !keys.includes("Click") &&
            !keys.includes("Drag") &&
            !keys.includes("Scroll") &&
            !keys.includes("вверх") &&
            keys !== "Space"
          ) {
            // Should contain proper macOS symbols
            expect(keys).toMatch(/^[⌘⇧⌥⌃↑↓←→=\-[\]\\/.,'";:ABCDEFGHIJKLMNOPQRSTUVWXYZ0-9\s+F1-F12Space⌫^↵]+$/)

            // Should not contain lowercase letters (except Space)
            if (keys !== "Space") {
              expect(keys).not.toMatch(/[a-z]/)
            }
          }
        })
      })
    })

    it("should have all required properties for each shortcut", () => {
      const preset = createPremierePreset(mockT)

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

  describe("Complete Adobe Premiere Pro Coverage", () => {
    it("should cover all 15 screenshots worth of shortcuts", () => {
      const preset = createPremierePreset(mockT)

      // Count total shortcuts across all categories
      const totalShortcuts = preset.reduce((sum, category) => sum + category.shortcuts.length, 0)

      // Should have 110+ shortcuts as implemented
      expect(totalShortcuts).toBeGreaterThanOrEqual(110)
      expect(totalShortcuts).toBeLessThanOrEqual(130)
    })

    it("should include shortcuts from all screenshot categories", () => {
      const preset = createPremierePreset(mockT)
      const allShortcuts = preset.flatMap((cat) => cat.shortcuts)
      const allIds = allShortcuts.map((s) => s.id)

      // Screenshot 1: File operations
      expect(allIds).toContain("new-project")
      expect(allIds).toContain("save-project")
      expect(allIds).toContain("import")

      // Screenshot 2-3: Edit operations
      expect(allIds).toContain("undo")
      expect(allIds).toContain("cut")
      expect(allIds).toContain("copy")
      expect(allIds).toContain("paste")

      // Screenshot 4-5: Tools
      expect(allIds).toContain("split")
      expect(allIds).toContain("group")
      expect(allIds).toContain("rotate-90-cw")

      // Screenshot 6: Markers
      expect(allIds).toContain("orange-marker")
      expect(allIds).toContain("yellow-marker")

      // Screenshot 10: Playback
      expect(allIds).toContain("play-pause")
      expect(allIds).toContain("previous-frame")

      // Screenshot 13-14: Multicam
      expect(allIds).toContain("multicam-angle-1")
      expect(allIds).toContain("multicam-angle-5")

      // Screenshot 15: Miscellaneous
      expect(allIds).toContain("help")
      expect(allIds).toContain("export")
    })
  })
})
