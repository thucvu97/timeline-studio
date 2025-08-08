/**
 * Browser Domain Types
 *
 * Центральное место для всех типов Browser домена
 */

// Import existing types
import type { BrowserTab } from "@/shared/types/browser"
import type { BrowserContext, ViewMode } from "@/shared/types/browser-context"

// Re-export existing types
export type { BrowserTab } from "@/shared/types/browser"
export type { BrowserContext, ViewMode } from "@/shared/types/browser-context"

// Browser machine types
export interface BrowserMachineContext extends BrowserContext {
  // Additional domain-specific context if needed
}

export type BrowserMachineEvent =
  | { type: "SWITCH_TAB"; tab: BrowserTab }
  | { type: "SET_SEARCH_QUERY"; query: string; tab?: BrowserTab }
  | { type: "TOGGLE_FAVORITES"; tab?: BrowserTab }
  | {
      type: "SET_SORT"
      sortBy: string
      sortOrder: "asc" | "desc"
      tab?: BrowserTab
    }
  | { type: "SET_GROUP_BY"; groupBy: string; tab?: BrowserTab }
  | { type: "SET_FILTER"; filterType: string; tab?: BrowserTab }
  | { type: "SET_VIEW_MODE"; viewMode: ViewMode; tab?: BrowserTab }
  | { type: "SET_PREVIEW_SIZE"; sizeIndex: number; tab?: BrowserTab }
  | { type: "RESET_TAB_SETTINGS"; tab: BrowserTab }
  | { type: "LOAD_SETTINGS"; settings: Partial<BrowserContext> }
  | { type: "SAVE_SETTINGS" }
  | { type: "SELECT_FILE"; fileId: string; tab?: BrowserTab }
  | { type: "DESELECT_FILE"; fileId: string; tab?: BrowserTab }
  | { type: "TOGGLE_FILE_SELECTION"; fileId: string; tab?: BrowserTab }
  | { type: "SELECT_ALL_FILES"; fileIds: string[]; tab?: BrowserTab }
  | { type: "DESELECT_ALL_FILES"; tab?: BrowserTab }

// Tab settings
export interface TabSettings {
  searchQuery: string
  showFavoritesOnly: boolean
  sortBy: string
  sortOrder: "asc" | "desc"
  groupBy: string
  filterType: string
  viewMode: ViewMode
  previewSizeIndex: number
}

// Browser service types
export interface BrowserService {
  switchTab(tab: BrowserTab): void
  setSearchQuery(query: string, tab?: BrowserTab): void
  toggleFavorites(tab?: BrowserTab): void
  setSortOptions(sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab): void
  setGroupBy(groupBy: string, tab?: BrowserTab): void
  setFilter(filterType: string, tab?: BrowserTab): void
  setViewMode(viewMode: ViewMode, tab?: BrowserTab): void
  setPreviewSize(sizeIndex: number, tab?: BrowserTab): void
  resetTabSettings(tab: BrowserTab): void
  selectFile(fileId: string, tab?: BrowserTab): void
  deselectFile(fileId: string, tab?: BrowserTab): void
  toggleFileSelection(fileId: string, tab?: BrowserTab): void
  selectAllFiles(fileIds: string[], tab?: BrowserTab): void
  deselectAllFiles(tab?: BrowserTab): void
}

// Browser storage types
export interface BrowserStorageService {
  loadSettings(): BrowserContext | null
  saveSettings(context: BrowserContext): void
}
