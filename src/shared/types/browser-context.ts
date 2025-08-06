/**
 * Общие типы для браузера, выделенные для избежания циклических зависимостей
 */

import type { BrowserTab } from "./browser"

export type ViewMode = "list" | "grid" | "thumbnails"

/**
 * Контекст браузера - используется в browser-state-machine и user-settings-machine
 */
export interface BrowserContext {
  // Общие настройки
  activeTab: BrowserTab

  // Настройки для каждой вкладки
  tabSettings: Record<
    BrowserTab,
    {
      searchQuery: string
      showFavoritesOnly: boolean
      sortBy: string
      sortOrder: "asc" | "desc"
      groupBy: string
      filterType: string
      viewMode: ViewMode
      previewSizeIndex: number
    }
  >
}
