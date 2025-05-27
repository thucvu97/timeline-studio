import { assign, createMachine } from "xstate"

import {
  DEFAULT_PREVIEW_SIZE_INDEX,
  PREVIEW_SIZES,
  type PreviewSize,
  getPreviewSizeIndex,
} from "@/lib/constants/preview-sizes"

/**
 * Тип вкладки браузера
 */
export type BrowserTab =
  | "media"
  | "music"
  | "effects"
  | "filters"
  | "transitions"
  | "subtitles"
  | "templates"
  | "style-templates"

/**
 * Режимы отображения для разных типов контента
 */
export type ViewMode = "list" | "grid" | "thumbnails"

/**
 * Контекст машины состояния браузера
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

/**
 * События машины состояния браузера
 */
export type BrowserEvent =
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

/**
 * Начальные настройки для каждой вкладки
 */
const getInitialTabSettings = (tab: BrowserTab) => {
  // Базовые настройки
  const baseSettings = {
    searchQuery: "",
    showFavoritesOnly: false,
    sortBy: "name",
    sortOrder: "asc" as const,
    groupBy: "none",
    filterType: "all",
    viewMode: "thumbnails" as ViewMode,
    previewSizeIndex: DEFAULT_PREVIEW_SIZE_INDEX,
  }

  // Специфичные настройки для разных вкладок
  switch (tab) {
    case "music":
      return {
        ...baseSettings,
        viewMode: "list" as ViewMode,
        sortBy: "title",
      }
    case "templates":
      return {
        ...baseSettings,
        sortBy: "screens",
        groupBy: "screens",
        previewSizeIndex: getPreviewSizeIndex(150), // Больший размер для шаблонов
      }
    case "style-templates":
      return {
        ...baseSettings,
        sortBy: "category",
        groupBy: "category",
        previewSizeIndex: getPreviewSizeIndex(125), // Средний размер для стилевых шаблонов
      }
    case "effects":
    case "filters":
    case "transitions":
      return {
        ...baseSettings,
        sortBy: "category",
        groupBy: "category",
      }
    default:
      return baseSettings
  }
}

/**
 * Начальный контекст машины состояния
 */
const initialContext: BrowserContext = {
  activeTab: "media",
  tabSettings: {
    media: getInitialTabSettings("media"),
    music: getInitialTabSettings("music"),
    effects: getInitialTabSettings("effects"),
    filters: getInitialTabSettings("filters"),
    transitions: getInitialTabSettings("transitions"),
    subtitles: getInitialTabSettings("subtitles"),
    templates: getInitialTabSettings("templates"),
    "style-templates": getInitialTabSettings("style-templates"),
  },
}

/**
 * Машина состояния браузера
 */
export const browserMachine = createMachine({
  id: "browser",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        SWITCH_TAB: {
          actions: assign({
            activeTab: ({ event }) => event.tab,
          }),
        },
        SET_SEARCH_QUERY: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  searchQuery: (event as any).query,
                },
              }
            },
          }),
        },
        TOGGLE_FAVORITES: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  showFavoritesOnly: !context.tabSettings[tab as keyof typeof context.tabSettings].showFavoritesOnly,
                },
              }
            },
          }),
        },
        SET_SORT: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  sortBy: (event as any).sortBy,
                  sortOrder: (event as any).sortOrder,
                },
              }
            },
          }),
        },
        SET_GROUP_BY: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  groupBy: (event as any).groupBy,
                },
              }
            },
          }),
        },
        SET_FILTER: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  filterType: (event as any).filterType,
                },
              }
            },
          }),
        },
        SET_VIEW_MODE: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  viewMode: (event as any).viewMode,
                },
              }
            },
          }),
        },
        SET_PREVIEW_SIZE: {
          actions: assign({
            tabSettings: ({ context, event }) => {
              const tab = (event as any).tab || context.activeTab
              return {
                ...context.tabSettings,
                [tab]: {
                  ...context.tabSettings[tab as keyof typeof context.tabSettings],
                  previewSizeIndex: (event as any).sizeIndex,
                },
              }
            },
          }),
        },
        RESET_TAB_SETTINGS: {
          actions: assign({
            tabSettings: ({ context, event }) => ({
              ...context.tabSettings,
              [(event as any).tab]: getInitialTabSettings((event as any).tab),
            }),
          }),
        },
        LOAD_SETTINGS: {
          actions: assign(({ context, event }) => ({
            ...context,
            ...(event as any).settings,
          })),
        },
        SAVE_SETTINGS: {
          // Здесь можно добавить логику сохранения в localStorage или API
        },
      },
    },
  },
})
