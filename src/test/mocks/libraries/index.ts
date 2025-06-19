import { resetI18nMocks } from "./i18n"
import { resetThemeMocks } from "./next-themes"
import { resetHotkeysMocks } from "./react-hotkeys-hook"

// Third-party library mocks
import "./lucide-react"
import "./radix-ui"

export {
  MockI18nextProvider,
  mockDayjs,
  mockUseTranslation,
  resetI18nMocks,
  setLanguage,
  setTranslations,
} from "./i18n"

export { createMockIcon } from "./lucide-react"
// Re-export commonly used mocks
export {
  MockThemeProvider,
  mockUseTheme,
  resetThemeMocks,
  setThemeState,
} from "./next-themes"

export {
  MockDialog,
  MockDropdownMenu,
} from "./radix-ui"
export {
  isHotkeyRegistered,
  mockUseHotkeys,
  resetHotkeysMocks,
  simulateHotkey,
} from "./react-hotkeys-hook"

// Helper to reset all library mocks
export function resetAllLibraryMocks() {
  resetThemeMocks()
  resetHotkeysMocks()
  resetI18nMocks()
}
