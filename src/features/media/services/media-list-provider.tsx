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
  // Инициализируем машину состояний XState
  const [state, send] = useMachine(mediaListMachine)

  // Получаем доступ к медиа-контексту
  const media = useMedia()
  const { t } = useTranslation()

  // Обновляем состояние машины при изменении списка медиафайлов в MediaProvider
  useEffect(() => {
    // Отправляем событие обновления списка медиафайлов
    if (media.allMediaFiles.length > 0) {
      send({ type: "UPDATE_MEDIA_FILES", files: media.allMediaFiles })
    }
  }, [media.allMediaFiles, send])

  // Отслеживаем изменения в метаданных файлов
  useEffect(() => {
    // Принудительно обновляем состояние машины при любом изменении статуса загрузки метаданных
    send({ type: "UPDATE_MEDIA_FILES", files: media.allMediaFiles })
  }, [
    // Отслеживаем изменения в статусе загрузки метаданных
    media.allMediaFiles
      .map((file) => `${file.path}:${file.isLoadingMetadata}`)
      .join(","),
    send,
    media.allMediaFiles,
  ])

  /**
   * Сортирует медиа-файлы по указанному критерию
   * Отправляет событие SORT в машину состояний
   *
   * @param {string} sortBy - Критерий сортировки (name, date, size, duration)
   */
  const sort = (sortBy: string) => {
    // Проверяем, что критерий сортировки допустимый
    if (["name", "date", "size", "duration"].includes(sortBy)) {
      // Отправляем событие в машину состояний
      send({ type: "SORT", sortBy })
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
    send({ type: "FILTER", filterType, mediaContext })
  }

  /**
   * Выполняет поиск медиа-файлов по запросу
   *
   * @param {string} query - Поисковый запрос
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const search = (query: string, mediaContext: any) => {
    send({ type: "SEARCH", query, mediaContext })
  }

  /**
   * Изменяет режим отображения медиа-файлов
   *
   * @param {string} mode - Режим отображения (list, grid, thumbnails)
   */
  const changeViewMode = (mode: "list" | "grid" | "thumbnails") => {
    send({ type: "CHANGE_VIEW_MODE", mode })
  }

  /**
   * Изменяет критерий группировки медиа-файлов
   *
   * @param {string} groupBy - Критерий группировки (none, type, date, duration)
   */
  const changeGroupBy = (groupBy: string) => {
    send({ type: "CHANGE_GROUP_BY", groupBy })
  }

  /**
   * Изменяет порядок сортировки медиа-файлов
   */
  const changeOrder = () => {
    send({ type: "CHANGE_ORDER" })
  }

  /**
   * Переключает режим отображения только избранных файлов
   *
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const toggleFavorites = (mediaContext: any) => {
    send({ type: "TOGGLE_FAVORITES", mediaContext })
  }

  /**
   * Повторяет загрузку медиа-файлов
   */
  const retry = () => {
    send({ type: "RETRY" })
  }

  /**
   * Устанавливает режим отображения напрямую
   *
   * @param {string} mode - Режим отображения (list, grid, thumbnails)
   */
  const setViewMode = (mode: "list" | "grid" | "thumbnails") => {
    changeViewMode(mode)
  }

  /**
   * Устанавливает критерий сортировки напрямую
   *
   * @param {string} sortBy - Критерий сортировки
   */
  const setSortBy = (sortBy: string) => {
    sort(sortBy)
  }

  /**
   * Устанавливает тип фильтра напрямую
   *
   * @param {string} filterType - Тип фильтра
   */
  const setFilterType = (filterType: string) => {
    filter(filterType, media)
  }

  /**
   * Устанавливает критерий группировки напрямую
   *
   * @param {string} groupBy - Критерий группировки
   */
  const setGroupBy = (groupBy: string) => {
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

      // Если новый порядок отличается от текущего, меняем его
      if (newOrder !== state.context.sortOrder) {
        changeOrder()
      }
    } else {
      // Если передано значение напрямую
      if (orderOrUpdater !== state.context.sortOrder) {
        changeOrder()
      }
    }
  }

  /**
   * Увеличивает размер превью
   */
  const increasePreviewSize = () => {
    if (state.context.canIncreaseSize) {
      send({ type: "INCREASE_PREVIEW_SIZE" })
    }
  }

  /**
   * Уменьшает размер превью
   */
  const decreasePreviewSize = () => {
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
    send({ type: "SET_PREVIEW_SIZE", size })
  }

  /**
   * Устанавливает поисковый запрос
   *
   * @param {string} query - Новый поисковый запрос
   */
  const setSearchQuery = (query: string) => {
    send({ type: "SET_SEARCH_QUERY", query })
  }

  /**
   * Устанавливает флаг отображения только избранных
   *
   * @param {boolean} value - Новое значение флага
   */
  const setShowFavoritesOnly = (value: boolean) => {
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
