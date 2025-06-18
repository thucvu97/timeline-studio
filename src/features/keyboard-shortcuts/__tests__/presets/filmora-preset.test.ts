import { describe, expect, it, vi } from "vitest"

import { createFilmoraPreset } from "../../presets/filmora-preset"

describe("Wondershare Filmora Preset", () => {
  const mockT = vi.fn((key: string, fallback?: string) => fallback || key)

  beforeEach(() => {
    mockT.mockClear()
  })

  it("should create Filmora preset with all categories", () => {
    const preset = createFilmoraPreset(mockT)

    expect(preset).toBeDefined()
    expect(Array.isArray(preset)).toBe(true)
    expect(preset.length).toBe(12) // 12 categories

    // Verify all expected categories exist
    const categoryIds = preset.map((category) => category.id)
    expect(categoryIds).toEqual([
      "preferences",
      "file",
      "edit",
      "selection",
      "keyframe-animation",
      "tools",
      "markers",
      "multicam-editing",
      "grouping-markers",
      "timeline-navigation",
      "subtitles",
      "playback",
    ])
  })

  describe("Preferences Category", () => {
    it("should contain all preference shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const prefsCategory = preset.find((cat) => cat.id === "preferences")

      expect(prefsCategory).toBeDefined()
      expect(prefsCategory!.shortcuts).toHaveLength(3)

      const shortcuts = prefsCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "preferences")?.keys).toBe("⌘,")
      expect(shortcuts.find((s) => s.id === "shortcuts")?.keys).toBe("⌥⌘K")
      expect(shortcuts.find((s) => s.id === "exit")?.keys).toBe("⌘Q")
    })
  })

  describe("File Category", () => {
    it("should contain all file operation shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const fileCategory = preset.find((cat) => cat.id === "file")

      expect(fileCategory).toBeDefined()
      expect(fileCategory!.shortcuts).toHaveLength(8)

      const shortcuts = fileCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "new-project")?.keys).toBe("⌘N")
      expect(shortcuts.find((s) => s.id === "open-project")?.keys).toBe("⌘O")
      expect(shortcuts.find((s) => s.id === "save-project")?.keys).toBe("⌘S")
      expect(shortcuts.find((s) => s.id === "save-as")?.keys).toBe("⇧⌘S")
      expect(shortcuts.find((s) => s.id === "archive-project")?.keys).toBe("⇧⌘A")
      expect(shortcuts.find((s) => s.id === "import")?.keys).toBe("⌘I")
      expect(shortcuts.find((s) => s.id === "record-voiceover")?.keys).toBe("⌘R")
      expect(shortcuts.find((s) => s.id === "add-to-new-track")?.keys).toBe("⌥⌘N")
    })
  })

  describe("Edit Category", () => {
    it("should contain all edit operation shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const editCategory = preset.find((cat) => cat.id === "edit")

      expect(editCategory).toBeDefined()
      expect(editCategory!.shortcuts).toHaveLength(10)

      const shortcuts = editCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "undo")?.keys).toBe("⌘Z")
      expect(shortcuts.find((s) => s.id === "redo")?.keys).toBe("⇧⌘Z")
      expect(shortcuts.find((s) => s.id === "cut")?.keys).toBe("⌘X")
      expect(shortcuts.find((s) => s.id === "copy")?.keys).toBe("⌘C")
      expect(shortcuts.find((s) => s.id === "paste")?.keys).toBe("⌘V")
      expect(shortcuts.find((s) => s.id === "duplicate")?.keys).toBe("⌘D")
      expect(shortcuts.find((s) => s.id === "enable-disable-clip")?.keys).toBe("E")
      expect(shortcuts.find((s) => s.id === "delete")?.keys).toBe("Delete")
      expect(shortcuts.find((s) => s.id === "ripple-delete")?.keys).toBe("⇧Delete")
      expect(shortcuts.find((s) => s.id === "close-gap")?.keys).toBe("⌥D")
    })
  })

  describe("Selection Category", () => {
    it("should contain all selection and navigation shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const selectionCategory = preset.find((cat) => cat.id === "selection")

      expect(selectionCategory).toBeDefined()
      expect(selectionCategory!.shortcuts).toHaveLength(11)

      const shortcuts = selectionCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "select-all")?.keys).toBe("⌘A")
      expect(shortcuts.find((s) => s.id === "copy-effects")?.keys).toBe("⌥⌘C")
      expect(shortcuts.find((s) => s.id === "paste-effects")?.keys).toBe("⌥⌘V")
      expect(shortcuts.find((s) => s.id === "select-clip-range")?.keys).toBe("X")
      expect(shortcuts.find((s) => s.id === "cancel-selection")?.keys).toBe("⇧X")
      expect(shortcuts.find((s) => s.id === "nudge-left")?.keys).toBe("⌘←")
      expect(shortcuts.find((s) => s.id === "nudge-right")?.keys).toBe("⌘→")
      expect(shortcuts.find((s) => s.id === "nudge-up")?.keys).toBe("⌥↑")
      expect(shortcuts.find((s) => s.id === "nudge-down")?.keys).toBe("⌥↓")
      expect(shortcuts.find((s) => s.id === "magnetic-timeline")?.keys).toBe("P")
      expect(shortcuts.find((s) => s.id === "linking")?.keys).toBe("⇧⌘L")
    })
  })

  describe("Keyframe Animation Category", () => {
    it("should contain keyframe animation shortcut", () => {
      const preset = createFilmoraPreset(mockT)
      const keyframeCategory = preset.find((cat) => cat.id === "keyframe-animation")

      expect(keyframeCategory).toBeDefined()
      expect(keyframeCategory!.shortcuts).toHaveLength(1)

      const shortcut = keyframeCategory!.shortcuts[0]
      expect(shortcut.id).toBe("keyframe-animation")
      expect(shortcut.keys).toBe("⌥⇧K")
    })
  })

  describe("Tools Category", () => {
    it("should contain all tool shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const toolsCategory = preset.find((cat) => cat.id === "tools")

      expect(toolsCategory).toBeDefined()
      expect(toolsCategory!.shortcuts).toHaveLength(8)

      const shortcuts = toolsCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "show-properties")?.keys).toBe("⌥E")
      expect(shortcuts.find((s) => s.id === "split")?.keys).toBe("⌘K")
      expect(shortcuts.find((s) => s.id === "trim-start-to-playhead")?.keys).toBe("Q")
      expect(shortcuts.find((s) => s.id === "trim-end-to-playhead")?.keys).toBe("W")
      expect(shortcuts.find((s) => s.id === "multi-trim")?.keys).toBe("⌘F")
      expect(shortcuts.find((s) => s.id === "crop-and-zoom")?.keys).toBe("⌥C")
      expect(shortcuts.find((s) => s.id === "rotate-90-cw")?.keys).toBe("⌥⌘→")
      expect(shortcuts.find((s) => s.id === "rotate-90-ccw")?.keys).toBe("⌥⌘←")
    })
  })

  describe("Markers Category", () => {
    it("should contain all marker shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const markersCategory = preset.find((cat) => cat.id === "markers")

      expect(markersCategory).toBeDefined()
      expect(markersCategory!.shortcuts).toHaveLength(5)

      const shortcuts = markersCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "mark-in")?.keys).toBe("I")
      expect(shortcuts.find((s) => s.id === "mark-out")?.keys).toBe("O")
      expect(shortcuts.find((s) => s.id === "clear-in-out")?.keys).toBe("↑⌘X")
      expect(shortcuts.find((s) => s.id === "add-marker")?.keys).toBe("M")
      expect(shortcuts.find((s) => s.id === "edit-marker")?.keys).toBe("↑M")
    })
  })

  describe("Multicam Editing Category", () => {
    it("should contain all multicam shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const multicamCategory = preset.find((cat) => cat.id === "multicam-editing")

      expect(multicamCategory).toBeDefined()
      expect(multicamCategory!.shortcuts).toHaveLength(9)

      // Test all 9 camera angles
      for (let i = 1; i <= 9; i++) {
        const shortcut = multicamCategory!.shortcuts.find((s) => s.id === `switch-camera-${i}`)
        expect(shortcut).toBeDefined()
        expect(shortcut?.keys).toBe(i.toString())
      }
    })
  })

  describe("Grouping and Markers Category", () => {
    it("should contain all grouping and color marker shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const groupingCategory = preset.find((cat) => cat.id === "grouping-markers")

      expect(groupingCategory).toBeDefined()
      expect(groupingCategory!.shortcuts).toHaveLength(22)

      const shortcuts = groupingCategory!.shortcuts

      // Test grouping shortcuts
      expect(shortcuts.find((s) => s.id === "group")?.keys).toBe("⌘G")
      expect(shortcuts.find((s) => s.id === "ungroup")?.keys).toBe("⌥⌘G")

      // Test color markers
      expect(shortcuts.find((s) => s.id === "red-marker")?.keys).toBe("⌘1")
      expect(shortcuts.find((s) => s.id === "orange-marker")?.keys).toBe("⌘2")
      expect(shortcuts.find((s) => s.id === "yellow-marker")?.keys).toBe("⌘3")
      expect(shortcuts.find((s) => s.id === "green-marker")?.keys).toBe("⌘4")
      expect(shortcuts.find((s) => s.id === "blue-marker")?.keys).toBe("⌘5")
      expect(shortcuts.find((s) => s.id === "indigo-marker")?.keys).toBe("⌘6")
      expect(shortcuts.find((s) => s.id === "purple-marker")?.keys).toBe("⌘7")
      expect(shortcuts.find((s) => s.id === "gray-marker")?.keys).toBe("⌘8")

      // Test other shortcuts
      expect(shortcuts.find((s) => s.id === "stabilization")?.keys).toBe("⌥S")
      expect(shortcuts.find((s) => s.id === "chroma-key")?.keys).toBe("⇧⌘G")
      expect(shortcuts.find((s) => s.id === "track-motion")?.keys).toBe("⌥X")
    })
  })

  describe("Timeline Navigation Category", () => {
    it("should contain all timeline navigation shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const timelineCategory = preset.find((cat) => cat.id === "timeline-navigation")

      expect(timelineCategory).toBeDefined()
      expect(timelineCategory!.shortcuts).toHaveLength(25)

      const shortcuts = timelineCategory!.shortcuts

      // Test some key shortcuts
      expect(shortcuts.find((s) => s.id === "insert")?.keys).toBe(",")
      expect(shortcuts.find((s) => s.id === "overwrite")?.keys).toBe(".")
      expect(shortcuts.find((s) => s.id === "replace")?.keys).toBe("⌥+MouseDrag")
      expect(shortcuts.find((s) => s.id === "rename")?.keys).toBe("F2")
      expect(shortcuts.find((s) => s.id === "blade-tool")?.keys).toBe("C")
      expect(shortcuts.find((s) => s.id === "select-tool")?.keys).toBe("V")
      expect(shortcuts.find((s) => s.id === "audio-stretch")?.keys).toBe("S")
      expect(shortcuts.find((s) => s.id === "snap-to-timeline")?.keys).toBe("N")
      expect(shortcuts.find((s) => s.id === "fast-preview")?.keys).toBe("B")
      expect(shortcuts.find((s) => s.id === "apply-transition-by-default")?.keys).toBe("⌘T")
    })
  })

  describe("Subtitles Category", () => {
    it("should contain all subtitle shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const subtitlesCategory = preset.find((cat) => cat.id === "subtitles")

      expect(subtitlesCategory).toBeDefined()
      expect(subtitlesCategory!.shortcuts).toHaveLength(4)

      const shortcuts = subtitlesCategory!.shortcuts
      expect(shortcuts.find((s) => s.id === "split-subtitle-edit-mode")?.keys).toBe("⇧Return")
      expect(shortcuts.find((s) => s.id === "merge-subtitles-up")?.keys).toBe("Delete")
      expect(shortcuts.find((s) => s.id === "merge-subtitles-down-single")?.keys).toBe("⌥Q")
      expect(shortcuts.find((s) => s.id === "merge-subtitles-down-multi")?.keys).toBe("⌥Q")
    })
  })

  describe("Playback Category", () => {
    it("should contain all playback shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const playbackCategory = preset.find((cat) => cat.id === "playback")

      expect(playbackCategory).toBeDefined()
      expect(playbackCategory!.shortcuts).toHaveLength(29)

      const shortcuts = playbackCategory!.shortcuts

      // Test key playback shortcuts
      expect(shortcuts.find((s) => s.id === "play-pause")?.keys).toBe("Space")
      expect(shortcuts.find((s) => s.id === "stop")?.keys).toBe("⌃/")
      expect(shortcuts.find((s) => s.id === "fullscreen-restore")?.keys).toBe("⇧'")
      expect(shortcuts.find((s) => s.id === "screenshot")?.keys).toBe("⇧E")
      expect(shortcuts.find((s) => s.id === "previous-frame")?.keys).toBe("←")
      expect(shortcuts.find((s) => s.id === "next-frame")?.keys).toBe("→")
      expect(shortcuts.find((s) => s.id === "zoom-in")?.keys).toBe("=")
      expect(shortcuts.find((s) => s.id === "zoom-out")?.keys).toBe("-")
      expect(shortcuts.find((s) => s.id === "pause")?.keys).toBe("K")
      expect(shortcuts.find((s) => s.id === "play-forward")?.keys).toBe("L")
      expect(shortcuts.find((s) => s.id === "play-backward")?.keys).toBe("J")
    })
  })

  describe("Translation Integration", () => {
    it("should call translation function for all categories and shortcuts", () => {
      createFilmoraPreset(mockT)

      // Verify translation calls for categories
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.preferences", "Предпочтения")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.file", "Файл")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.edit", "Редактировать")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.selection", "Выбор и навигация")
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.keyboardShortcuts.categories.keyframe-animation",
        "Анимация ключевого кадра",
      )
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.tools", "Инструменты")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.markers", "Маркер")
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.keyboardShortcuts.categories.multicam-editing",
        "Мультикамерный монтаж",
      )
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.keyboardShortcuts.categories.grouping-markers",
        "Группировка и маркеры",
      )
      expect(mockT).toHaveBeenCalledWith(
        "dialogs.keyboardShortcuts.categories.timeline-navigation",
        "Навигация по временной шкале",
      )
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.subtitles", "Субтитры")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.categories.playback", "Посмотреть")

      // Verify translation calls for some shortcuts
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.new-project", "Создать новый проект")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.undo", "Вернуть")
      expect(mockT).toHaveBeenCalledWith("dialogs.keyboardShortcuts.shortcuts.play-pause", "Воспроизведение / Пауза")
    })
  })

  describe("Keyboard Shortcuts Validation", () => {
    it("should have unique ids within the preset", () => {
      const preset = createFilmoraPreset(mockT)

      const allIds = preset.flatMap((cat) => cat.shortcuts.map((s) => s.id))
      const uniqueIds = [...new Set(allIds)]

      expect(allIds.length).toBe(uniqueIds.length)
    })

    it("should use proper keyboard notation", () => {
      const preset = createFilmoraPreset(mockT)

      preset.forEach((category) => {
        category.shortcuts.forEach((shortcut) => {
          const { keys } = shortcut

          // Skip validation for special combinations
          if (
            !keys.includes("Click") &&
            !keys.includes("Drag") &&
            !keys.includes("Scroll") &&
            !keys.includes("Return") &&
            keys !== "Space" &&
            keys !== "Delete" &&
            keys !== "Home" &&
            keys !== "End" &&
            keys !== "," &&
            keys !== "." &&
            !/^F\d+$/.exec(keys) // F keys
          ) {
            // Should contain proper symbols or single uppercase letters/numbers
            expect(keys).toMatch(/^[⌘⇧⌥⌃↑↓←→↵=\-+[\]\\/.,'";:A-Za-z0-9\s]+$/)
          }
        })
      })
    })

    it("should have all required properties for each shortcut", () => {
      const preset = createFilmoraPreset(mockT)

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

  describe("Filmora Preset Specifics", () => {
    it("should have Filmora-specific shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const allShortcuts = preset.flatMap((cat) => cat.shortcuts)
      const allIds = allShortcuts.map((s) => s.id)

      // Filmora-specific shortcuts
      expect(allIds).toContain("record-voiceover")
      expect(allIds).toContain("add-to-new-track")
      expect(allIds).toContain("keyframe-animation")
      expect(allIds).toContain("audio-stretch")
      expect(allIds).toContain("close-audio-stretch")
      expect(allIds).toContain("silence-detection")
      expect(allIds).toContain("scene-detection")
      expect(allIds).toContain("stabilization")
      expect(allIds).toContain("chroma-key")
      expect(allIds).toContain("track-motion")
    })

    it("should have appropriate number of shortcuts", () => {
      const preset = createFilmoraPreset(mockT)
      const totalShortcuts = preset.reduce((sum, category) => sum + category.shortcuts.length, 0)

      // Filmora has a lot of shortcuts
      expect(totalShortcuts).toBeGreaterThan(100)
      expect(totalShortcuts).toBeLessThan(150)
    })
  })
})
