import * as React from "react"

import { vi } from "vitest"

export const mockUseTheme = vi.fn(() => ({
  theme: "light",
  setTheme: vi.fn(),
  resolvedTheme: "light",
  themes: ["light", "dark", "system"],
  systemTheme: "light",
}))

// Export the mock provider component
export const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement("div", { "data-testid": "next-theme-provider" }, children)
}

// Define the mock inline to avoid hoisting issues
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
