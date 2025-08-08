/**
 * Re-export user settings machine from new domain location
 * Для обратной совместимости
 */

export type {
  BrowserTab,
  LayoutMode,
  UserSettingsContextType,
  UserSettingsEvent,
} from "@/domains/project-management/machines/user-settings-machine"
export {
  BROWSER_TABS,
  DEFAULT_LAYOUT,
  DEFAULT_TAB,
  LAYOUTS,
  userSettingsMachine,
} from "@/domains/project-management/machines/user-settings-machine"
