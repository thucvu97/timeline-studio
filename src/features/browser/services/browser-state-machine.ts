import { assign, setup } from "xstate"

import { DEFAULT_PREVIEW_SIZE_INDEX, getPreviewSizeIndex } from "@/features/media/utils/preview-sizes"
import type { BrowserTab } from "@/shared/types/browser"
import type { BrowserContext, ViewMode } from "@/shared/types/browser-context"

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
 * Загружает сохраненные настройки из localStorage
 */
const loadSavedSettings = (): BrowserContext | null => {
  if (typeof window === "undefined") return null

  try {
    const saved = localStorage.getItem("browser-settings")
    if (saved) {
      return JSON.parse(saved) as BrowserContext
    }
  } catch (error) {
    console.error("[BrowserMachine] Failed to load saved settings:", error)
  }

  return null
}

/**
 * Начальный контекст машины состояния
 */
const initialContext: BrowserContext = loadSavedSettings() || {
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
 * Машина состояния браузера с типизацией через setup
 */
export const browserMachine = setup({
  types: {
    context: {} as BrowserContext,
    events: {} as BrowserEvent,
  },
  actions: {
    switchTab: assign({
      activeTab: ({ event }) => {
        if (event.type !== "SWITCH_TAB") return "media"
        return event.tab
      },
    }),
    setSearchQuery: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_SEARCH_QUERY") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            searchQuery: event.query,
          },
        }
      },
    }),
    toggleFavorites: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "TOGGLE_FAVORITES") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            showFavoritesOnly: !context.tabSettings[tab].showFavoritesOnly,
          },
        }
      },
    }),
    setSort: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_SORT") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            sortBy: event.sortBy,
            sortOrder: event.sortOrder,
          },
        }
      },
    }),
    setGroupBy: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_GROUP_BY") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            groupBy: event.groupBy,
          },
        }
      },
    }),
    setFilter: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_FILTER") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            filterType: event.filterType,
          },
        }
      },
    }),
    setViewMode: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_VIEW_MODE") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            viewMode: event.viewMode,
          },
        }
      },
    }),
    setPreviewSize: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "SET_PREVIEW_SIZE") return context.tabSettings
        const tab = event.tab || context.activeTab
        return {
          ...context.tabSettings,
          [tab]: {
            ...context.tabSettings[tab],
            previewSizeIndex: event.sizeIndex,
          },
        }
      },
    }),
    resetTabSettings: assign({
      tabSettings: ({ context, event }) => {
        if (event.type !== "RESET_TAB_SETTINGS") return context.tabSettings
        return {
          ...context.tabSettings,
          [event.tab]: getInitialTabSettings(event.tab),
        }
      },
    }),
    loadSettings: assign(({ context, event }) => {
      if (event.type !== "LOAD_SETTINGS") return context
      return {
        ...context,
        ...event.settings,
      }
    }),
    saveSettings: ({ context }) => {
      // Сохраняем в localStorage для быстрого доступа
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("browser-settings", JSON.stringify(context))
          // Settings saved to localStorage
        } catch (error) {
          console.error("[BrowserMachine] Failed to save settings:", error)
        }
      }
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QCMBOB7A7rMqB0AlhADZgDEAygOoCSAKgMIASA+nQIIBCA2gAwC6iUAAd0sAgBcC6AHZCQAD0QB2AGx5VATgCMAFm0AmXQFYAHAdPLlBgDQgAnom29e2vAd4BmA59XLNXsbGqgC+IXZoWDj4RKSUAKJ0LBTx7ABKzCwAigCq8WkAmnyCSCCi4lKy8koIuuq61qrB2qa8qry6vGp2jggBuhoGxryamu2axrp1YREY2LiEJOR0APIA4msAMvEsAGLsAGorafTxFMXy5ZLScqU1upp4war62tqaQ2+anj2IraZ4DpaVRGCzKTyeYwzECReYxJYJJIUY50C6lK6VW6gGqmeqtBqeL5qUzaH4OFRvPB1UzmYxGfwGIzQ2HRRZxFJJNZpFY5AAKLE4RQElzE1yqd0QqnUllMAWUQTaQwMml+CFUejwsraNLayje2ih4Rhc1ZsXIHL2NE2dHyaJEosx1T+Bieyi8LXVbusmmUquMLTwhKGwxpqk8LgMzJNCzNiJYBxo8SoLAAsisACLxO1lB03J1ql2g96MkymTwTUyq3QGNzgqakt2TWWRo0smMIi28tLxBNJ5I0ABaWeF6Nz4uxiGMnjw2j8Pt4BjDkNxKvJCG8xhnwQMajpdWUJNCrej8Li3YtHE4yUSdBoADk1ucR-aKnmJbVbGvGQDjAfSd9dE8XE9RbWYonbOJNhWdh02vOhbwfJ8ShfMUsUUSVp1-ElF0hFogJpVVSRdFwSJrMNeGCXhTCjcDT3NQ4dg5BDH2zDE3wnNUBh8cxTGrA8fCGSs1xJKlRlGdpSVxZxtDCI0ZHQCA4HkNtUBFV9x3QhAAFpVFVHSaLhNkwDU1D8zeQtF2eWV3nVbRfTXN4FzwP9PHBH03ilZRZJCIA */
  id: "browser",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        SWITCH_TAB: {
          actions: "switchTab",
        },
        SET_SEARCH_QUERY: {
          actions: "setSearchQuery",
        },
        TOGGLE_FAVORITES: {
          actions: "toggleFavorites",
        },
        SET_SORT: {
          actions: "setSort",
        },
        SET_GROUP_BY: {
          actions: "setGroupBy",
        },
        SET_FILTER: {
          actions: "setFilter",
        },
        SET_VIEW_MODE: {
          actions: "setViewMode",
        },
        SET_PREVIEW_SIZE: {
          actions: "setPreviewSize",
        },
        RESET_TAB_SETTINGS: {
          actions: "resetTabSettings",
        },
        LOAD_SETTINGS: {
          actions: "loadSettings",
        },
        SAVE_SETTINGS: {
          actions: "saveSettings",
        },
      },
    },
  },
})
