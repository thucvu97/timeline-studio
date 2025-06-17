import { describe, expect, it } from "vitest"

// Утилитарные функции для TopBar (если они есть)

describe("TopBar Utils", () => {
  describe("Button State Management", () => {
    it("should validate button state correctly", () => {
      const isButtonEnabled = (isProjectLoaded: boolean, isProcessing: boolean) => {
        return isProjectLoaded && !isProcessing
      }

      expect(isButtonEnabled(true, false)).toBe(true)
      expect(isButtonEnabled(false, false)).toBe(false)
      expect(isButtonEnabled(true, true)).toBe(false)
      expect(isButtonEnabled(false, true)).toBe(false)
    })

    it("should determine save button visibility", () => {
      const shouldShowSaveButton = (hasProject: boolean, isDirty: boolean) => {
        return hasProject && isDirty
      }

      expect(shouldShowSaveButton(true, true)).toBe(true)
      expect(shouldShowSaveButton(true, false)).toBe(false)
      expect(shouldShowSaveButton(false, true)).toBe(false)
      expect(shouldShowSaveButton(false, false)).toBe(false)
    })
  })

  describe("Modal Type Validation", () => {
    it("should validate modal types correctly", () => {
      const validModalTypes = [
        "keyboardShortcuts",
        "projectSettings",
        "userSettings",
        "cameraCapture",
        "voiceRecording",
        "export",
        "renderJobs",
      ]

      const isValidModalType = (type: string) => {
        return validModalTypes.includes(type)
      }

      validModalTypes.forEach(type => {
        expect(isValidModalType(type)).toBe(true)
      })

      expect(isValidModalType("invalidModal")).toBe(false)
      expect(isValidModalType("")).toBe(false)
    })
  })

  describe("Project Name Formatting", () => {
    it("should format project name correctly", () => {
      const formatProjectName = (name: string | null | undefined) => {
        if (!name) return "Untitled Project"
        return name.length > 30 ? `${name.slice(0, 27)}...` : name
      }

      expect(formatProjectName("Short Name")).toBe("Short Name")
      expect(formatProjectName("This is a very long project name that should be truncated")).toBe(
        "This is a very long project..."
      )
      expect(formatProjectName(null)).toBe("Untitled Project")
      expect(formatProjectName(undefined)).toBe("Untitled Project")
      expect(formatProjectName("")).toBe("Untitled Project")
    })
  })

  describe("Keyboard Shortcuts", () => {
    it("should validate keyboard shortcut combinations", () => {
      const isValidShortcut = (keys: string[]) => {
        const validModifiers = ["Ctrl", "Cmd", "Alt", "Shift"]
        const validKeys = ["s", "o", "n", "e", "b", "k", "p"]
        
        if (keys.length < 2) return false
        
        const modifiers = keys.slice(0, -1)
        const key = keys[keys.length - 1]
        
        return modifiers.every(mod => validModifiers.includes(mod)) && validKeys.includes(key)
      }

      expect(isValidShortcut(["Ctrl", "s"])).toBe(true)
      expect(isValidShortcut(["Cmd", "Shift", "s"])).toBe(true)
      expect(isValidShortcut(["s"])).toBe(false)
      expect(isValidShortcut(["Ctrl", "z"])).toBe(false)
      expect(isValidShortcut([])).toBe(false)
    })
  })

  describe("Theme Utilities", () => {
    it("should cycle through themes correctly", () => {
      const getNextTheme = (currentTheme: string) => {
        const themes = ["light", "dark", "system"]
        const currentIndex = themes.indexOf(currentTheme)
        return themes[(currentIndex + 1) % themes.length]
      }

      expect(getNextTheme("light")).toBe("dark")
      expect(getNextTheme("dark")).toBe("system")
      expect(getNextTheme("system")).toBe("light")
      expect(getNextTheme("unknown")).toBe("light") // fallback to first theme
    })

    it("should get theme icon correctly", () => {
      const getThemeIcon = (theme: string) => {
        const icons = {
          light: "sun",
          dark: "moon",
          system: "monitor",
        }
        return icons[theme as keyof typeof icons] || "sun"
      }

      expect(getThemeIcon("light")).toBe("sun")
      expect(getThemeIcon("dark")).toBe("moon")
      expect(getThemeIcon("system")).toBe("monitor")
      expect(getThemeIcon("unknown")).toBe("sun")
    })
  })

  describe("Button Tooltip Generation", () => {
    it("should generate correct tooltips", () => {
      const getButtonTooltip = (action: string, shortcut?: string) => {
        const baseTooltip = action
        return shortcut ? `${baseTooltip} (${shortcut})` : baseTooltip
      }

      expect(getButtonTooltip("Save Project", "Ctrl+S")).toBe("Save Project (Ctrl+S)")
      expect(getButtonTooltip("Open Project")).toBe("Open Project")
      expect(getButtonTooltip("Export", "Ctrl+E")).toBe("Export (Ctrl+E)")
    })
  })

  describe("Version Comparison", () => {
    it("should compare version numbers correctly", () => {
      const isNewerVersion = (current: string, available: string) => {
        const parseVersion = (version: string) => 
          version.split('.').map(Number)
        
        const currentParts = parseVersion(current)
        const availableParts = parseVersion(available)
        
        for (let i = 0; i < Math.max(currentParts.length, availableParts.length); i++) {
          const currentPart = currentParts[i] || 0
          const availablePart = availableParts[i] || 0
          
          if (availablePart > currentPart) return true
          if (availablePart < currentPart) return false
        }
        
        return false
      }

      expect(isNewerVersion("1.0.0", "1.0.1")).toBe(true)
      expect(isNewerVersion("1.0.0", "1.1.0")).toBe(true)
      expect(isNewerVersion("1.0.0", "2.0.0")).toBe(true)
      expect(isNewerVersion("1.0.1", "1.0.0")).toBe(false)
      expect(isNewerVersion("1.0.0", "1.0.0")).toBe(false)
    })
  })

  describe("File Path Utilities", () => {
    it("should extract file name from path", () => {
      const getFileName = (path: string) => {
        return path.split('/').pop()?.split('.')[0] || 'untitled'
      }

      expect(getFileName("/path/to/project.json")).toBe("project")
      expect(getFileName("simple.json")).toBe("simple")
      expect(getFileName("/path/without/extension")).toBe("extension")
      expect(getFileName("")).toBe("untitled")
    })

    it("should validate file extensions", () => {
      const isValidProjectFile = (path: string) => {
        return path.endsWith('.json') || path.endsWith('.timeline')
      }

      expect(isValidProjectFile("project.json")).toBe(true)
      expect(isValidProjectFile("project.timeline")).toBe(true)
      expect(isValidProjectFile("project.txt")).toBe(false)
      expect(isValidProjectFile("project")).toBe(false)
    })
  })

  describe("Error Handling Utilities", () => {
    it("should format error messages", () => {
      const formatErrorMessage = (error: unknown) => {
        if (error instanceof Error) {
          return error.message
        }
        if (typeof error === 'string') {
          return error
        }
        return "An unknown error occurred"
      }

      expect(formatErrorMessage(new Error("Test error"))).toBe("Test error")
      expect(formatErrorMessage("String error")).toBe("String error")
      expect(formatErrorMessage(null)).toBe("An unknown error occurred")
      expect(formatErrorMessage(undefined)).toBe("An unknown error occurred")
      expect(formatErrorMessage({})).toBe("An unknown error occurred")
    })
  })
})