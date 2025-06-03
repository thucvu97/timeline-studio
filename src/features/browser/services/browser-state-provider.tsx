import React, { createContext, useContext, useEffect, useState } from "react"

import { useAppSettings } from "@/features/app-state"
import { DEFAULT_PREVIEW_SIZE_INDEX, PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"

import { BrowserContext, BrowserTab, ViewMode } from "./browser-state-machine"

// Реэкспортируем для удобства
export { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"

/**
 * Начальные настройки для каждой вкладки
 */
const getInitialTabSettings = (tab: BrowserTab) => ({
  searchQuery: "",
  showFavoritesOnly: false,
  sortBy: "name",
  sortOrder: "asc" as const,
  groupBy: "none",
  filterType: "all",
  viewMode: (tab === "music" ? "list" : "thumbnails") as ViewMode,
  previewSizeIndex: DEFAULT_PREVIEW_SIZE_INDEX,
})

/**
 * Начальный контекст
 */
const getInitialContext = (): BrowserContext => ({
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
})

/**
 * Интерфейс контекста провайдера браузера
 */
interface BrowserStateContextValue {
  // Состояние
  state: BrowserContext

  // Геттеры для текущей вкладки
  activeTab: BrowserTab
  currentTabSettings: BrowserContext["tabSettings"][BrowserTab]
  previewSize: number

  // Действия
  switchTab: (tab: BrowserTab) => void
  setSearchQuery: (query: string, tab?: BrowserTab) => void
  toggleFavorites: (tab?: BrowserTab) => void
  setSort: (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => void
  setGroupBy: (groupBy: string, tab?: BrowserTab) => void
  setFilter: (filterType: string, tab?: BrowserTab) => void
  setViewMode: (viewMode: ViewMode, tab?: BrowserTab) => void
  setPreviewSize: (sizeIndex: number, tab?: BrowserTab) => void
  resetTabSettings: (tab: BrowserTab) => void
}

/**
 * Контекст провайдера браузера
 */
const BrowserStateContext = createContext<BrowserStateContextValue | null>(null)

/**
 * Интерфейс свойств провайдера браузера
 */
interface BrowserStateProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер состояния браузера
 */
export const BrowserStateProvider: React.FC<BrowserStateProviderProps> = ({ children }) => {
  const { getUserSettings, updateUserSettings } = useAppSettings()
  const [state, setState] = useState<BrowserContext>(() => {
    // Пытаемся загрузить настройки из пользовательских настроек
    const userSettings = getUserSettings()
    return userSettings.browserSettings || getInitialContext()
  })

  // Сохраняем настройки в пользовательские настройки при изменении (с дебаунсом)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const userSettings = getUserSettings()
      updateUserSettings({
        ...userSettings,
        browserSettings: state,
      })
    }, 500) // Дебаунс 500мс

    return () => clearTimeout(timeoutId)
  }, [state, getUserSettings, updateUserSettings])

  // Геттеры
  const activeTab = state.activeTab
  const currentTabSettings = state.tabSettings[activeTab] || getInitialTabSettings(activeTab)
  const previewSize = PREVIEW_SIZES[currentTabSettings.previewSizeIndex] || PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]

  // Действия
  const switchTab = (tab: BrowserTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }))
  }

  const setSearchQuery = (query: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...(prev.tabSettings[targetTab] || getInitialTabSettings(targetTab)),
          searchQuery: query,
        },
      },
    }))
  }

  const toggleFavorites = (tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          showFavoritesOnly: !prev.tabSettings[targetTab].showFavoritesOnly,
        },
      },
    }))
  }

  const setSort = (sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          sortBy,
          sortOrder,
        },
      },
    }))
  }

  const setGroupBy = (groupBy: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          groupBy,
        },
      },
    }))
  }

  const setFilter = (filterType: string, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          filterType,
        },
      },
    }))
  }

  const setViewMode = (viewMode: ViewMode, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          viewMode,
        },
      },
    }))
  }

  const setPreviewSize = (sizeIndex: number, tab?: BrowserTab) => {
    const targetTab = tab || activeTab
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [targetTab]: {
          ...prev.tabSettings[targetTab],
          previewSizeIndex: sizeIndex,
        },
      },
    }))
  }

  const resetTabSettings = (tab: BrowserTab) => {
    setState((prev) => ({
      ...prev,
      tabSettings: {
        ...prev.tabSettings,
        [tab]: getInitialTabSettings(tab),
      },
    }))
  }

  const value: BrowserStateContextValue = {
    state,
    activeTab,
    currentTabSettings,
    previewSize,
    switchTab,
    setSearchQuery,
    toggleFavorites,
    setSort,
    setGroupBy,
    setFilter,
    setViewMode,
    setPreviewSize,
    resetTabSettings,
  }

  return <BrowserStateContext.Provider value={value}>{children}</BrowserStateContext.Provider>
}

/**
 * Хук для использования состояния браузера
 */
export const useBrowserState = (): BrowserStateContextValue => {
  const context = useContext(BrowserStateContext)
  if (!context) {
    throw new Error("useBrowserState must be used within a BrowserStateProvider")
  }
  return context
}

/**
 * Хук для получения настроек конкретной вкладки
 */
export const useTabSettings = (tab?: BrowserTab) => {
  const { state, activeTab } = useBrowserState()
  const targetTab = tab || activeTab
  return state.tabSettings[targetTab]
}
