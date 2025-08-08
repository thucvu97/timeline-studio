/**
 * User Settings Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @domains/project-management
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  BrowserTab,
  LayoutMode,
  UserSettingsContext,
  UserSettingsContextType,
  UserSettingsEvent,
  UserSettingsMachine,
} from "@domains/project-management/machines/user-settings-machine"

export {
  BROWSER_TABS,
  DEFAULT_LAYOUT,
  DEFAULT_TAB,
  LAYOUTS,
  userSettingsMachine,
} from "@domains/project-management/machines/user-settings-machine"
