import React, { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"
import { useTranslation } from "react-i18next"

import { useMedia } from "@/features/browser/media"

import { MediaListContextType, mediaListMachine } from "./media-list-machine"

/**
 * Интерфейс контекста для провайдера медиа-списка
 * Содержит состояние и методы для управления списком медиа-файлов
 */
interface MediaListProviderContextType extends MediaListContextType {
  // Методы для управления состоянием
  sort: (sortBy: string) => void
  filter: (filterType: string, mediaContext: any) => void
  search: (query: string, mediaContext: any) => void
  changeViewMode: (mode: "list" | "grid" | "thumbnails") => void
  changeGroupBy: (groupBy: string) => void
  changeOrder: () => void
  toggleFavorites: (mediaContext: any) => void
  retry: () => void

  // Методы для управления размером превью
  increasePreviewSize: () => void
  decreasePreviewSize: () => void
  setPreviewSize: (size: number) => void

  // Методы для управления поиском и фильтрацией
  setSearchQuery: (query: string) => void
  setShowFavoritesOnly: (value: boolean) => void

  // Дополнительные методы для прямого обновления состояния
  setViewMode: (mode: "list" | "grid" | "thumbnails") => void
  setSortBy: (sortBy: string) => void
  setFilterType: (filterType: string) => void
  setGroupBy: (groupBy: string) => void
  setSortOrder: (orderOrUpdater: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => void
}

// Создаем контекст для провайдера
const MediaListContext = createContext<MediaListProviderContextType | null>(null)

/**
 * Провайдер для управления списком медиа-файлов
 * Использует машину состояний mediaListMachine
 *
 * @param {React.ReactNode} children - Дочерние компоненты
 * @returns {JSX.Element} Провайдер с контекстом
 */
export function MediaListProvider({ children }: { children: React.ReactNode }) {
  console.log("MediaListProvider rendering")

  // Инициализируем машину состояний XState
  const [state, send] = useMachine(mediaListMachine)

  // Отладочные логи для отслеживания состояния машины
  console.log("MediaListProvider state:", state.context)
  console.log("MediaListProvider state status:", state.status)
  console.log("MediaListProvider state value:", state.value)

  // Получаем доступ к медиа-контексту
  const media = useMedia()
  const { t } = useTranslation()

  // Обновляем состояние машины при изменении списка медиафайлов в MediaProvider
  useEffect(() => {
    console.log("MediaListProvider: Media files changed, updating state", media.allMediaFiles.length)

    // Отправляем событие обновления списка медиафайлов
    if (media.allMediaFiles.length > 0) {
      send({ type: "UPDATE_MEDIA_FILES", files: media.allMediaFiles })
    }
  }, [media.allMediaFiles, send])

  // Отслеживаем изменения в метаданных файлов
  useEffect(() => {
    // Проверяем, есть ли файлы с загруженными метаданными
    const filesWithLoadedMetadata = media.allMediaFiles.filter(file => file.isLoadingMetadata === false)
    const filesStillLoading = media.allMediaFiles.filter(file => file.isLoadingMetadata === true)

    console.log(
      "MediaListProvider: Metadata loading status:",
      `Loaded: ${filesWithLoadedMetadata.length}`,
      `Loading: ${filesStillLoading.length}`,
      `Total: ${media.allMediaFiles.length}`
    )

    // Принудительно обновляем состояние машины при любом изменении статуса загрузки метаданных
    send({ type: "UPDATE_MEDIA_FILES", files: media.allMediaFiles })

  }, [
    // Отслеживаем изменения в статусе загрузки метаданных
    media.allMediaFiles.map(file => `${file.path}:${file.isLoadingMetadata}`).join(','),
    send,
    media.allMediaFiles
  ])

  /**
   * Сортирует медиа-файлы по указанному критерию
   * Отправляет событие SORT в машину состояний
   *
   * @param {string} sortBy - Критерий сортировки (name, date, size, duration)
   */
  const sort = (sortBy: string) => {
    console.log("Sort requested in provider:", sortBy)

    // Проверяем, что критерий сортировки допустимый
    if (["name", "date", "size", "duration"].includes(sortBy)) {
      // Отправляем событие в машину состояний
      send({ type: "SORT", sortBy })
      console.log("Sort event sent to machine:", sortBy)
    } else {
      console.error("Invalid sort criteria:", sortBy)
    }
  }

  /**
   * Фильтрует медиа-файлы по типу
   *
   * @param {string} filterType - Тип фильтра (all, video, audio, image)
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const filter = (filterType: string, mediaContext: any) => {
    console.log("Filter requested:", filterType)
    send({ type: "FILTER", filterType, mediaContext })
  }

  /**
   * Выполняет поиск медиа-файлов по запросу
   *
   * @param {string} query - Поисковый запрос
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const search = (query: string, mediaContext: any) => {
    console.log("Search requested:", query)
    send({ type: "SEARCH", query, mediaContext })
  }

  /**
   * Изменяет режим отображения медиа-файлов
   *
   * @param {string} mode - Режим отображения (list, grid, thumbnails)
   */
  const changeViewMode = (mode: "list" | "grid" | "thumbnails") => {
    console.log("View mode change requested:", mode)
    send({ type: "CHANGE_VIEW_MODE", mode })
  }

  /**
   * Изменяет критерий группировки медиа-файлов
   *
   * @param {string} groupBy - Критерий группировки (none, type, date, duration)
   */
  const changeGroupBy = (groupBy: string) => {
    console.log("Group by change requested:", groupBy)
    send({ type: "CHANGE_GROUP_BY", groupBy })
  }

  /**
   * Изменяет порядок сортировки медиа-файлов
   */
  const changeOrder = () => {
    console.log("Change order requested")
    send({ type: "CHANGE_ORDER" })
  }

  /**
   * Переключает режим отображения только избранных файлов
   *
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const toggleFavorites = (mediaContext: any) => {
    console.log("Toggle favorites requested")
    send({ type: "TOGGLE_FAVORITES", mediaContext })
  }

  /**
   * Повторяет загрузку медиа-файлов
   */
  const retry = () => {
    console.log("Retry requested")
    send({ type: "RETRY" })
  }

  /**
   * Устанавливает режим отображения напрямую
   *
   * @param {string} mode - Режим отображения (list, grid, thumbnails)
   */
  const setViewMode = (mode: "list" | "grid" | "thumbnails") => {
    console.log("Set view mode directly:", mode)
    changeViewMode(mode)
  }

  /**
   * Устанавливает критерий сортировки напрямую
   *
   * @param {string} sortBy - Критерий сортировки
   */
  const setSortBy = (sortBy: string) => {
    console.log("Set sort by directly:", sortBy)
    sort(sortBy)
  }

  /**
   * Устанавливает тип фильтра напрямую
   *
   * @param {string} filterType - Тип фильтра
   */
  const setFilterType = (filterType: string) => {
    console.log("Set filter type directly:", filterType)
    filter(filterType, media)
  }

  /**
   * Устанавливает критерий группировки напрямую
   *
   * @param {string} groupBy - Критерий группировки
   */
  const setGroupBy = (groupBy: string) => {
    console.log("Set group by directly:", groupBy)
    changeGroupBy(groupBy)
  }

  /**
   * Устанавливает порядок сортировки напрямую
   * Может принимать как новое значение, так и функцию для обновления
   *
   * @param {string | ((prev: "asc" | "desc") => "asc" | "desc")} orderOrUpdater - Новый порядок сортировки или функция обновления
   */
  const setSortOrder = (orderOrUpdater: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => {
    if (typeof orderOrUpdater === "function") {
      // Если передана функция, вычисляем новое значение
      const newOrder = orderOrUpdater(state.context.sortOrder)
      console.log("Set sort order with updater function:", newOrder)

      // Если новый порядок отличается от текущего, меняем его
      if (newOrder !== state.context.sortOrder) {
        changeOrder()
      }
    } else {
      // Если передано значение напрямую
      console.log("Set sort order directly:", orderOrUpdater)
      if (orderOrUpdater !== state.context.sortOrder) {
        changeOrder()
      }
    }
  }

  /**
   * Увеличивает размер превью
   */
  const increasePreviewSize = () => {
    console.log("Increase preview size requested")
    if (state.context.canIncreaseSize) {
      send({ type: "INCREASE_PREVIEW_SIZE" })
    }
  }

  /**
   * Уменьшает размер превью
   */
  const decreasePreviewSize = () => {
    console.log("Decrease preview size requested")
    if (state.context.canDecreaseSize) {
      send({ type: "DECREASE_PREVIEW_SIZE" })
    }
  }

  /**
   * Устанавливает размер превью
   *
   * @param {number} size - Новый размер превью
   */
  const setPreviewSize = (size: number) => {
    console.log("Set preview size requested:", size)
    send({ type: "SET_PREVIEW_SIZE", size })
  }

  /**
   * Устанавливает поисковый запрос
   *
   * @param {string} query - Новый поисковый запрос
   */
  const setSearchQuery = (query: string) => {
    console.log("Set search query requested:", query)
    send({ type: "SET_SEARCH_QUERY", query })
  }

  /**
   * Устанавливает флаг отображения только избранных
   *
   * @param {boolean} value - Новое значение флага
   */
  const setShowFavoritesOnly = (value: boolean) => {
    console.log("Set show favorites only requested:", value)
    send({ type: "SET_SHOW_FAVORITES_ONLY", value })
  }

  // Создаем значение контекста
  const contextValue: MediaListProviderContextType = {
    ...state.context,
    sort,
    filter,
    search,
    changeViewMode,
    changeGroupBy,
    changeOrder,
    toggleFavorites,
    retry,
    increasePreviewSize,
    decreasePreviewSize,
    setPreviewSize,
    setSearchQuery,
    setShowFavoritesOnly,
    setViewMode,
    setSortBy,
    setFilterType,
    setGroupBy,
    setSortOrder,
  }

  // Возвращаем провайдер с контекстом
  return <MediaListContext.Provider value={contextValue}>{children}</MediaListContext.Provider>
}

/**
 * Хук для доступа к контексту медиа-списка
 *
 * @returns {MediaListProviderContextType} Значение контекста с состояниями и методами
 * @throws {Error} Если хук используется вне MediaListProvider
 */
export function useMediaList() {
  const context = useContext(MediaListContext)
  if (!context) {
    throw new Error("useMediaList must be used within a MediaListProvider")
  }
  return context
}
