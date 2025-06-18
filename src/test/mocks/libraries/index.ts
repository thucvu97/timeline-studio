import { resetI18nMocks } from "./i18n"
import { resetThemeMocks } from "./next-themes"
import { resetHotkeysMocks } from "./react-hotkeys-hook"

// Third-party library mocks
import "./lucide-react"
import "./radix-ui"

// Re-export commonly used mocks
export {
  mockUseTheme,
  MockThemeProvider,
  setThemeState,
  resetThemeMocks,
} from "./next-themes"

export { createMockIcon } from "./lucide-react"

export {
  mockUseHotkeys,
  simulateHotkey,
  isHotkeyRegistered,
  resetHotkeysMocks,
} from "./react-hotkeys-hook"

export {
  MockDropdownMenu,
  MockDialog,
} from "./radix-ui"

export {
  mockUseTranslation,
  MockI18nextProvider,
  mockDayjs,
  setLanguage,
  setTranslations,
  resetI18nMocks,
} from "./i18n"

// Helper to reset all library mocks
export function resetAllLibraryMocks() {
  resetThemeMocks()
  resetHotkeysMocks()
  resetI18nMocks()
}
