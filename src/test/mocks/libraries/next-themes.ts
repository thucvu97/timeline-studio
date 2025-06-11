import React from "react"

import { vi } from "vitest"

export const mockUseTheme = vi.fn(() => ({
  theme: "light",
  setTheme: vi.fn(),
  resolvedTheme: "light",
  themes: ["light", "dark", "system"],
  systemTheme: "light",
}))

export const MockThemeProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement("div", { "data-testid": "next-theme-provider" }, children)

vi.mock("next-themes", () => ({
  ThemeProvider: MockThemeProvider,
  useTheme: mockUseTheme,
}))

// Helper to set theme state
export function setThemeState(themeState: Partial<ReturnType<typeof mockUseTheme>>) {
  mockUseTheme.mockReturnValue({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
    systemTheme: "light",
    ...themeState,
  })
}

// Reset theme mocks
export function resetThemeMocks() {
  mockUseTheme.mockReset()
  setThemeState({})
}
