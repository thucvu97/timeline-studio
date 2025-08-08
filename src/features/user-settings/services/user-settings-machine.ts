/**
 * User Settings Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @domains/project-management
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  UserSettingsContext,
  UserSettingsContextType,
  UserSettingsEvent,
  UserSettingsMachine,
  LayoutMode,
  BrowserTab,
} from "@domains/project-management/machines/user-settings-machine"

export { 
  userSettingsMachine,
  LAYOUTS,
  DEFAULT_LAYOUT,
  BROWSER_TABS,
  DEFAULT_TAB,
} from "@domains/project-management/machines/user-settings-machine"