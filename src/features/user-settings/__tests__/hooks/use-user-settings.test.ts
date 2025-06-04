import { useContext } from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useUserSettings } from "../../hooks/use-user-settings"

// Мокаем React Context
const mockContextValue = {
  activeTab: "media" as const,
  layoutMode: "default" as const,
  screenshotsPath: "/path/to/screenshots",
  playerScreenshotsPath: "/path/to/player/screenshots",
  playerVolume: 50,
  openAiApiKey: "",
  claudeApiKey: "",
  isBrowserVisible: true,
  handleTabChange: vi.fn(),
  handleLayoutChange: vi.fn(),
  handleScreenshotsPathChange: vi.fn(),
  handlePlayerScreenshotsPathChange: vi.fn(),
  handlePlayerVolumeChange: vi.fn(),
  handleAiApiKeyChange: vi.fn(),
  handleClaudeApiKeyChange: vi.fn(),
  toggleBrowserVisibility: vi.fn(),
}

// Мокаем useContext
vi.mock("react", async () => {
  const actual = await vi.importActual("react")
  return {
    ...actual,
    useContext: vi.fn(),
  }
})

describe("useUserSettings", () => {
  it("should return context value when used within UserSettingsProvider", () => {
    vi.mocked(useContext).mockReturnValue(mockContextValue)

    const { result } = renderHook(() => useUserSettings())

    expect(result.current).toBe(mockContextValue)
  })

  it("should throw error when used outside UserSettingsProvider", () => {
    vi.mocked(useContext).mockReturnValue(null)

    const consoleError = console.error
    console.error = vi.fn() // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useUserSettings())).toThrow(
      "useUserSettings must be used within a UserSettingsProvider",
    )

    console.error = consoleError // Восстанавливаем console.error
  })
})
