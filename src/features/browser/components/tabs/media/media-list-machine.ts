import { assign, createMachine } from "xstate"

import { MediaFile } from "@/types/media"

/**
 * Константы для размеров превью
 */
/**
 * Массив доступных размеров превью
 * Используется для переключения между размерами при увеличении/уменьшении
 */
export const PREVIEW_SIZES = [80, 100, 125, 150, 200, 250, 300, 400]

/**
 * Тип для размеров превью
 */
export type PreviewSizeType = (typeof PREVIEW_SIZES)[number]

/**
 * Минимальный и максимальный размеры превью (первый и последний элементы массива)
 */
export const MIN_PREVIEW_SIZE = PREVIEW_SIZES[0]
export const MAX_PREVIEW_SIZE = PREVIEW_SIZES[PREVIEW_SIZES.length - 1]

/**
 * Размер превью по умолчанию
 */
export const DEFAULT_PREVIEW_SIZE = 100

/**
 * Интерфейс контекста машины состояний для медиа-файлов
 */
export interface MediaListContextType {
  mediaFiles: MediaFile[] // Все медиа-файлы
  filteredFiles: MediaFile[] // Отфильтрованные медиа-файлы
  error: string | null // Сообщение об ошибке
  isLoading: boolean // Флаг загрузки
  searchQuery: string // Поисковый запрос
  sortBy: string // Критерий сортировки
  sortOrder: "asc" | "desc" // Порядок сортировки
  filterType: string // Тип фильтра
  viewMode: "list" | "grid" | "thumbnails" // Режим отображения
  groupBy: string // Критерий группировки
  showFavoritesOnly: boolean // Показывать только избранные
  availableExtensions: string[] // Доступные расширения файлов
  previewSize: number // Размер превью
  canIncreaseSize: boolean // Можно ли увеличить размер превью
  canDecreaseSize: boolean // Можно ли уменьшить размер превью
}

/**
 * Типы событий для машины состояний медиа-файлов
 */
export type MediaListEventType =
  | { type: "FETCH_MEDIA" } // Загрузить медиа-файлы
  | { type: "RETRY" } // Повторить загрузку
  | { type: "SORT"; sortBy: string } // Сортировать файлы
  | { type: "CHANGE_ORDER" } // Изменить порядок сортировки
  | { type: "FILTER"; filterType: string; mediaContext: any } // Фильтровать файлы
  | { type: "SEARCH"; query: string; mediaContext: any } // Искать файлы
  | { type: "SET_SEARCH_QUERY"; query: string } // Установить поисковый запрос
  | { type: "CHANGE_VIEW_MODE"; mode: "list" | "grid" | "thumbnails" } // Изменить режим отображения
  | { type: "CHANGE_GROUP_BY"; groupBy: string } // Изменить группировку
  | { type: "TOGGLE_FAVORITES"; mediaContext: any } // Переключить режим избранного
  | { type: "SET_SHOW_FAVORITES_ONLY"; value: boolean } // Установить флаг отображения только избранных
  | { type: "INCREASE_PREVIEW_SIZE" } // Увеличить размер превью
  | { type: "DECREASE_PREVIEW_SIZE" } // Уменьшить размер превью
  | { type: "SET_PREVIEW_SIZE"; size: number } // Установить размер превью

/**
 * Машина состояний для управления медиа-файлами
 * Обрабатывает загрузку, фильтрацию, сортировку и группировку медиа-файлов
 *
 * Состояния машины:
 * - loading: Загрузка медиа-файлов
 * - success: Успешная загрузка, обработка событий сортировки и фильтрации
 * - error: Ошибка загрузки
 */
export const mediaListMachine = createMachine({
  id: "mediaList", // Идентификатор машины
  initial: "loading", // Начальное состояние - загрузка

  // Начальный контекст машины
  context: {
    mediaFiles: [], // Все медиа-файлы
    filteredFiles: [], // Отфильтрованные медиа-файлы
    error: null, // Сообщение об ошибке
    isLoading: true, // Флаг загрузки
    searchQuery: "", // Поисковый запрос
    sortBy: "date", // Критерий сортировки по умолчанию
    sortOrder: "desc", // Порядок сортировки по умолчанию
    filterType: "all", // Тип фильтра по умолчанию
    viewMode: "list", // Режим отображения по умолчанию
    groupBy: "none", // Критерий группировки по умолчанию
    showFavoritesOnly: false, // Показывать только избранные
    availableExtensions: [], // Доступные расширения файлов
    previewSize: DEFAULT_PREVIEW_SIZE, // Размер превью по умолчанию
    canIncreaseSize: true, // Можно ли увеличить размер превью
    canDecreaseSize: true, // Можно ли уменьшить размер превью
  } as MediaListContextType,

  // Состояния машины
  states: {
    /**
     * Состояние загрузки медиа-файлов
     * Инициализирует пустой массив файлов
     */
    loading: {
      entry: [
        // Устанавливаем флаг загрузки при входе в состояние
        assign({
          isLoading: true,
          error: null,
        }),
        // Сразу инициализируем пустые массивы и переходим в состояние успеха
        assign({
          mediaFiles: () => [], // Инициализируем пустой массив медиа-файлов
          filteredFiles: () => [], // Инициализируем пустой массив отфильтрованных файлов
          isLoading: false, // Сбрасываем флаг загрузки
          availableExtensions: () => [], // Инициализируем пустой массив доступных расширений
        }),
      ],
      // Сразу переходим в состояние успеха
      always: { target: "success" },
    },

    /**
     * Состояние успешной загрузки медиа-файлов
     * Обрабатывает события сортировки, фильтрации и группировки
     */
    success: {
      on: {
        /**
         * Обработка события сортировки
         * Сортирует файлы по указанному критерию
         */
        SORT: {
          actions: assign({
            // Сохраняем новый критерий сортировки
            sortBy: ({ event }) => event.sortBy,

            // Обновляем отфильтрованные файлы с новой сортировкой
            // Логика сортировки будет реализована в компоненте
          }),
        },

        /**
         * Обработка события изменения порядка сортировки
         * Инвертирует порядок сортировки (asc/desc)
         */
        CHANGE_ORDER: {
          actions: assign({
            // Инвертируем порядок сортировки
            sortOrder: ({ context }) => (context.sortOrder === "asc" ? "desc" : "asc"),
          }),
        },

        /**
         * Обработка события фильтрации
         * Фильтрует файлы по указанному типу
         */
        FILTER: {
          actions: assign({
            // Сохраняем новый тип фильтра
            filterType: ({ event }) => event.filterType,
          }),
        },

        /**
         * Обработка события поиска
         * Фильтрует файлы по поисковому запросу
         */
        SEARCH: {
          actions: assign({
            // Сохраняем новый поисковый запрос
            searchQuery: ({ event }) => event.query,
          }),
        },

        /**
         * Обработка события установки поискового запроса
         * Устанавливает поисковый запрос без выполнения поиска
         */
        SET_SEARCH_QUERY: {
          actions: assign({
            // Обновляем поисковый запрос
            searchQuery: ({ event }) => event.query,
          }),
        },

        /**
         * Обработка события изменения режима отображения
         * Устанавливает новый режим отображения (list/grid/thumbnails)
         */
        CHANGE_VIEW_MODE: {
          actions: assign({
            // Устанавливаем новый режим отображения
            viewMode: ({ event }) => event.mode,
          }),
        },

        /**
         * Обработка события изменения группировки
         * Устанавливает новый критерий группировки
         */
        CHANGE_GROUP_BY: {
          actions: assign({
            // Устанавливаем новый критерий группировки
            groupBy: ({ event }) => event.groupBy,
          }),
        },

        /**
         * Обработка события переключения режима избранного
         * Включает/выключает отображение только избранных файлов
         */
        TOGGLE_FAVORITES: {
          actions: assign({
            // Инвертируем флаг отображения только избранных
            showFavoritesOnly: ({ context }) => !context.showFavoritesOnly,
          }),
        },

        /**
         * Обработка события установки флага отображения только избранных
         * Устанавливает флаг в указанное значение
         */
        SET_SHOW_FAVORITES_ONLY: {
          actions: assign({
            // Устанавливаем флаг отображения только избранных
            showFavoritesOnly: ({ event }) => event.value,
          }),
        },

        /**
         * Обработка события увеличения размера превью
         * Выбирает следующий размер из массива PREVIEW_SIZES
         */
        INCREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим следующий размер в массиве PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)

              // Если текущий размер больше максимального в массиве или это последний элемент
              if (currentIndex === -1 || currentIndex === PREVIEW_SIZES.length - 1) {
                return MAX_PREVIEW_SIZE
              }

              // Возвращаем следующий размер из массива
              return PREVIEW_SIZES[currentIndex + 1]
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ context }) => {
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)
              return currentIndex < PREVIEW_SIZES.length - 1
            },
            canDecreaseSize: () => true,
          }),
        },

        /**
         * Обработка события уменьшения размера превью
         * Выбирает предыдущий размер из массива PREVIEW_SIZES
         */
        DECREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим предыдущий размер в массиве PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему большего
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)

              // Если текущий размер меньше минимального в массиве
              if (currentIndex === -1) {
                return MIN_PREVIEW_SIZE
              }

              // Если текущий размер равен первому элементу массива
              if (currentIndex === 0) {
                return MIN_PREVIEW_SIZE
              }

              // Возвращаем предыдущий размер из массива
              return PREVIEW_SIZES[currentIndex - 1]
            },
            // Обновляем флаги возможности изменения размера
            canDecreaseSize: ({ context }) => {
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)
              return currentIndex > 0
            },
            canIncreaseSize: () => true,
          }),
        },

        /**
         * Обработка события установки размера превью
         * Выбирает ближайший размер из массива PREVIEW_SIZES
         */
        SET_PREVIEW_SIZE: {
          actions: assign({
            // Устанавливаем размер превью, выбирая ближайший из массива PREVIEW_SIZES
            previewSize: ({ event }) => {
              // Ограничиваем размер в пределах допустимых значений
              const clampedSize = Math.max(MIN_PREVIEW_SIZE, Math.min(event.size, MAX_PREVIEW_SIZE))

              // Находим ближайший размер в массиве PREVIEW_SIZES
              let closestSize = PREVIEW_SIZES[0]
              let minDiff = Math.abs(clampedSize - closestSize)

              for (let i = 1; i < PREVIEW_SIZES.length; i++) {
                const diff = Math.abs(clampedSize - PREVIEW_SIZES[i])
                if (diff < minDiff) {
                  minDiff = diff
                  closestSize = PREVIEW_SIZES[i]
                }
              }

              return closestSize
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = PREVIEW_SIZES.findIndex((size) => size >= event.size)
              return closestSizeIndex < PREVIEW_SIZES.length - 1
            },
            canDecreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = PREVIEW_SIZES.findIndex((size) => size >= event.size)
              return closestSizeIndex > 0
            },
          }),
        },

        /**
         * Обработка события повторной загрузки
         * Возвращает машину в состояние загрузки
         */
        RETRY: {
          target: "loading", // Переход в состояние загрузки
        },
      },
    },

    /**
     * Состояние ошибки загрузки медиа-файлов
     * Позволяет повторить попытку загрузки и обрабатывать события сортировки/фильтрации
     */
    error: {
      on: {
        /**
         * Обработка события повторной попытки загрузки
         * Возвращает машину в состояние загрузки
         */
        RETRY: {
          target: "loading", // Переход в состояние загрузки
        },

        /**
         * Обработка события сортировки в состоянии ошибки
         */
        SORT: {
          actions: assign({
            // Сохраняем новый критерий сортировки
            sortBy: ({ event }) => event.sortBy,
          }),
        },

        /**
         * Обработка события изменения порядка сортировки в состоянии ошибки
         */
        CHANGE_ORDER: {
          actions: assign({
            // Инвертируем порядок сортировки
            sortOrder: ({ context }) => (context.sortOrder === "asc" ? "desc" : "asc"),
          }),
        },

        /**
         * Обработка события фильтрации в состоянии ошибки
         */
        FILTER: {
          actions: assign({
            // Сохраняем новый тип фильтра
            filterType: ({ event }) => event.filterType,
          }),
        },

        /**
         * Обработка события поиска в состоянии ошибки
         */
        SEARCH: {
          actions: assign({
            // Сохраняем новый поисковый запрос
            searchQuery: ({ event }) => event.query,
          }),
        },

        /**
         * Обработка события установки поискового запроса в состоянии ошибки
         */
        SET_SEARCH_QUERY: {
          actions: assign({
            // Обновляем поисковый запрос
            searchQuery: ({ event }) => event.query,
          }),
        },

        /**
         * Обработка события изменения режима отображения в состоянии ошибки
         */
        CHANGE_VIEW_MODE: {
          actions: assign({
            // Устанавливаем новый режим отображения
            viewMode: ({ event }) => event.mode,
          }),
        },

        /**
         * Обработка события изменения группировки в состоянии ошибки
         */
        CHANGE_GROUP_BY: {
          actions: assign({
            // Устанавливаем новый критерий группировки
            groupBy: ({ event }) => event.groupBy,
          }),
        },

        /**
         * Обработка события переключения режима избранного в состоянии ошибки
         */
        TOGGLE_FAVORITES: {
          actions: assign({
            // Инвертируем флаг отображения только избранных
            showFavoritesOnly: ({ context }) => !context.showFavoritesOnly,
          }),
        },

        /**
         * Обработка события установки флага отображения только избранных в состоянии ошибки
         */
        SET_SHOW_FAVORITES_ONLY: {
          actions: assign({
            // Устанавливаем флаг отображения только избранных
            showFavoritesOnly: ({ event }) => event.value,
          }),
        },

        /**
         * Обработка события увеличения размера превью в состоянии ошибки
         * Выбирает следующий размер из массива PREVIEW_SIZES
         */
        INCREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим следующий размер в массиве PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)

              // Если текущий размер больше максимального в массиве или это последний элемент
              if (currentIndex === -1 || currentIndex === PREVIEW_SIZES.length - 1) {
                return MAX_PREVIEW_SIZE
              }

              // Возвращаем следующий размер из массива
              return PREVIEW_SIZES[currentIndex + 1]
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ context }) => {
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)
              return currentIndex < PREVIEW_SIZES.length - 1
            },
            canDecreaseSize: () => true,
          }),
        },

        /**
         * Обработка события уменьшения размера превью в состоянии ошибки
         * Выбирает предыдущий размер из массива PREVIEW_SIZES
         */
        DECREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим предыдущий размер в массиве PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему большего
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)

              // Если текущий размер меньше минимального в массиве
              if (currentIndex === -1) {
                return MIN_PREVIEW_SIZE
              }

              // Если текущий размер равен первому элементу массива
              if (currentIndex === 0) {
                return MIN_PREVIEW_SIZE
              }

              // Возвращаем предыдущий размер из массива
              return PREVIEW_SIZES[currentIndex - 1]
            },
            // Обновляем флаги возможности изменения размера
            canDecreaseSize: ({ context }) => {
              const currentIndex = PREVIEW_SIZES.findIndex((size) => size >= context.previewSize)
              return currentIndex > 0
            },
            canIncreaseSize: () => true,
          }),
        },

        /**
         * Обработка события установки размера превью в состоянии ошибки
         * Выбирает ближайший размер из массива PREVIEW_SIZES
         */
        SET_PREVIEW_SIZE: {
          actions: assign({
            // Устанавливаем размер превью, выбирая ближайший из массива PREVIEW_SIZES
            previewSize: ({ event }) => {
              // Ограничиваем размер в пределах допустимых значений
              const clampedSize = Math.max(MIN_PREVIEW_SIZE, Math.min(event.size, MAX_PREVIEW_SIZE))

              // Находим ближайший размер в массиве PREVIEW_SIZES
              let closestSize = PREVIEW_SIZES[0]
              let minDiff = Math.abs(clampedSize - closestSize)

              for (let i = 1; i < PREVIEW_SIZES.length; i++) {
                const diff = Math.abs(clampedSize - PREVIEW_SIZES[i])
                if (diff < minDiff) {
                  minDiff = diff
                  closestSize = PREVIEW_SIZES[i]
                }
              }

              return closestSize
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = PREVIEW_SIZES.findIndex((size) => size >= event.size)
              return closestSizeIndex < PREVIEW_SIZES.length - 1
            },
            canDecreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = PREVIEW_SIZES.findIndex((size) => size >= event.size)
              return closestSizeIndex > 0
            },
          }),
        },
      },
    },
  },
})
