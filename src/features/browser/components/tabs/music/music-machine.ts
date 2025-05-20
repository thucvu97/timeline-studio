import { assign, createMachine, fromPromise } from "xstate"

import { MediaFile } from "@/types/media"

import { filterFiles, sortFiles } from "./music-utils"

/**
 * Интерфейс контекста музыкальной машины состояний
 * Содержит все данные, необходимые для работы с музыкальными файлами
 *
 * @interface MusicContext
 */
interface MusicContext {
  musicFiles: MediaFile[] // Все музыкальные файлы
  filteredFiles: MediaFile[] // Отфильтрованные музыкальные файлы
  searchQuery: string // Текущий поисковый запрос
  sortBy: string // Критерий сортировки
  sortOrder: "asc" | "desc" // Порядок сортировки (по возрастанию/убыванию)
  filterType: string // Тип фильтра
  viewMode: "list" | "thumbnails" // Режим отображения (список/миниатюры)
  groupBy: "none" | "artist" | "genre" | "album" // Группировка файлов
  availableExtensions: string[] // Доступные расширения файлов
  showFavoritesOnly: boolean // Флаг отображения только избранных файлов
  error?: string // Сообщение об ошибке, если есть
}

/**
 * Интерфейс события поиска
 * @interface SearchEvent
 */
interface SearchEvent {
  type: "SEARCH" // Тип события
  query: string // Поисковый запрос
  mediaContext?: any // Контекст медиа для проверки избранных файлов
}

/**
 * Интерфейс события сортировки
 * @interface SortEvent
 */
interface SortEvent {
  type: "SORT" // Тип события
  sortBy: string // Критерий сортировки
}

/**
 * Интерфейс события фильтрации
 * @interface FilterEvent
 */
interface FilterEvent {
  type: "FILTER" // Тип события
  filterType: string // Тип фильтра
  mediaContext?: any // Контекст медиа для проверки избранных файлов
}

/**
 * Интерфейс события изменения порядка сортировки
 * @interface ChangeOrderEvent
 */
interface ChangeOrderEvent {
  type: "CHANGE_ORDER" // Тип события
}

/**
 * Интерфейс события изменения режима отображения
 * @interface ChangeViewModeEvent
 */
interface ChangeViewModeEvent {
  type: "CHANGE_VIEW_MODE" // Тип события
  mode: "list" | "thumbnails" // Новый режим отображения
}

/**
 * Интерфейс события изменения группировки
 * @interface ChangeGroupByEvent
 */
interface ChangeGroupByEvent {
  type: "CHANGE_GROUP_BY" // Тип события
  groupBy: "none" | "artist" | "genre" | "album" // Новый тип группировки
}

/**
 * Интерфейс события повторной попытки загрузки
 * @interface RetryEvent
 */
interface RetryEvent {
  type: "RETRY" // Тип события
}

/**
 * Интерфейс события переключения режима избранного
 * @interface ToggleFavoritesEvent
 */
interface ToggleFavoritesEvent {
  type: "TOGGLE_FAVORITES" // Тип события
  mediaContext?: any // Контекст медиа для проверки избранных файлов
}

/**
 * Объединенный тип всех событий музыкальной машины состояний
 * @type MusicEvent
 */
type MusicEvent =
  | SearchEvent
  | SortEvent
  | FilterEvent
  | ChangeOrderEvent
  | ChangeViewModeEvent
  | ChangeGroupByEvent
  | ToggleFavoritesEvent
  | RetryEvent

/**
 * Интерфейс результата загрузки музыкальных файлов
 * @interface FetchOutput
 */
interface FetchOutput {
  media: MediaFile[] // Массив музыкальных файлов
}

/**
 * Функция для асинхронной загрузки музыкальных файлов
 * Выполняет запрос к API и возвращает результат
 */
const fetchMusicFiles = fromPromise<FetchOutput, unknown>(async () => {
  const response = await fetch(`/api/music`) // Запрос к API
  const data = await response.json() // Парсинг ответа
  return data // Возврат данных
})

/**
 * Машина состояний для управления музыкальными файлами
 * Обрабатывает загрузку, фильтрацию, сортировку и группировку музыкальных файлов
 *
 * Состояния машины:
 * - loading: Загрузка музыкальных файлов
 * - success: Успешная загрузка, обработка событий сортировки и фильтрации
 * - error: Ошибка загрузки
 */
export const musicMachine = createMachine({
  id: "music", // Идентификатор машины
  initial: "loading", // Начальное состояние - загрузка

  // Начальный контекст машины
  context: {
    musicFiles: [], // Все музыкальные файлы
    filteredFiles: [], // Отфильтрованные музыкальные файлы
    searchQuery: "", // Поисковый запрос (пустой по умолчанию)
    sortBy: "name", // Сортировка по имени по умолчанию
    sortOrder: "asc", // Порядок сортировки по возрастанию по умолчанию
    filterType: "all", // Тип фильтра "все" по умолчанию
    viewMode: "list", // Режим отображения "список" по умолчанию
    groupBy: "none", // Без группировки по умолчанию
    availableExtensions: [], // Доступные расширения файлов
    showFavoritesOnly: false, // Не показывать только избранные по умолчанию
  } as MusicContext,

  // Типы для TypeScript
  types: {
    context: {} as MusicContext,
    events: {} as MusicEvent,
  },

  // Состояния машины
  states: {
    /**
     * Состояние загрузки музыкальных файлов
     * Выполняет запрос к API и обрабатывает результат
     */
    loading: {
      invoke: {
        id: "fetchFiles", // Идентификатор вызова
        src: fetchMusicFiles, // Функция для загрузки файлов
        input: () => ({}), // Входные данные (пустые)

        // Обработка успешной загрузки
        onDone: {
          target: "success", // Переход в состояние успеха
          actions: assign({
            // Сохраняем все музыкальные файлы
            musicFiles: ({ event }) => {
              console.log("Получено файлов из API:", event.output.media.length)
              return event.output.media
            },

            // Фильтруем и сортируем файлы
            filteredFiles: ({ event, context }) => {
              const filtered = filterFiles(
                event.output.media,
                context.searchQuery,
                context.filterType,
                context.showFavoritesOnly,
              )
              console.log("Итоговое количество файлов:", filtered.length)
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },

            // Извлекаем доступные расширения файлов
            availableExtensions: ({ event }) => {
              const extensions = new Set<string>()
              event.output.media.forEach((file: MediaFile) => {
                const extension = file.name.split(".").pop()?.toLowerCase()
                if (extension) {
                  extensions.add(extension)
                }
              })
              return Array.from(extensions).sort()
            },
          }),
        },

        // Обработка ошибки загрузки
        onError: {
          target: "error", // Переход в состояние ошибки
          actions: assign({
            error: ({ event }) => String(event.error), // Сохраняем сообщение об ошибке
            musicFiles: () => [], // Инициализируем пустой массив музыкальных файлов
            filteredFiles: () => [], // Инициализируем пустой массив отфильтрованных файлов
            availableExtensions: () => [], // Инициализируем пустой массив доступных расширений
          }),
        },
      },
    },
    /**
     * Состояние успешной загрузки музыкальных файлов
     * Обрабатывает события поиска, сортировки, фильтрации и т.д.
     */
    success: {
      on: {
        /**
         * Обработка события поиска
         * Фильтрует файлы по поисковому запросу
         */
        SEARCH: {
          actions: assign({
            // Сохраняем новый поисковый запрос
            searchQuery: ({ event }) => event.query,

            // Фильтруем и сортируем файлы по новому запросу
            filteredFiles: ({ context, event }) => {
              const filtered = filterFiles(
                context.musicFiles,
                event.query, // Используем новый поисковый запрос
                context.filterType,
                context.showFavoritesOnly,
                event.mediaContext,
              )
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },

        /**
         * Обработка события сортировки
         * Сортирует файлы по указанному критерию
         */
        SORT: {
          actions: assign({
            // Сохраняем новый критерий сортировки
            sortBy: ({ event }) => event.sortBy,

            // Сортируем файлы по новому критерию
            filteredFiles: ({ context, event }) => {
              return sortFiles(
                context.filteredFiles,
                event.sortBy, // Используем новый критерий сортировки
                context.sortOrder,
              )
            },
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

            // Фильтруем и сортируем файлы по новому типу
            filteredFiles: ({ context, event }) => {
              const filtered = filterFiles(
                context.musicFiles,
                context.searchQuery,
                event.filterType, // Используем новый тип фильтра
                context.showFavoritesOnly,
                event.mediaContext,
              )
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },

        /**
         * Обработка события изменения порядка сортировки
         * Меняет порядок сортировки на противоположный
         */
        CHANGE_ORDER: {
          actions: assign({
            // Инвертируем порядок сортировки
            sortOrder: ({ context }) =>
              context.sortOrder === "asc" ? "desc" : "asc",

            // Сортируем файлы в новом порядке
            filteredFiles: ({ context }) => {
              const newOrder = context.sortOrder === "asc" ? "desc" : "asc"
              return sortFiles(context.filteredFiles, context.sortBy, newOrder)
            },
          }),
        },

        /**
         * Обработка события изменения режима отображения
         * Меняет режим отображения (список/миниатюры)
         */
        CHANGE_VIEW_MODE: {
          actions: assign(({ event }) => ({
            viewMode: event.mode, // Устанавливаем новый режим отображения
          })),
        },

        /**
         * Обработка события изменения группировки
         * Меняет тип группировки файлов
         */
        CHANGE_GROUP_BY: {
          actions: assign({
            groupBy: ({ event }) => event.groupBy, // Устанавливаем новый тип группировки
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

            // Перефильтровываем файлы с новым значением флага
            filteredFiles: ({ context, event }) => {
              // Получаем новое значение showFavoritesOnly (инвертированное текущее)
              const newShowFavoritesOnly = !context.showFavoritesOnly

              // Перефильтровываем файлы с новым значением showFavoritesOnly
              const filtered = filterFiles(
                context.musicFiles,
                context.searchQuery,
                context.filterType,
                newShowFavoritesOnly, // Используем новое значение флага
                event.mediaContext,
              )

              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },
      },
    },
    /**
     * Состояние ошибки загрузки музыкальных файлов
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
         * Обработка события сортировки даже в состоянии ошибки
         * Позволяет сортировать файлы, даже если загрузка не удалась
         */
        SORT: {
          actions: assign({
            // Сохраняем новый критерий сортировки
            sortBy: ({ event }) => event.sortBy,

            // Сортируем файлы по новому критерию
            filteredFiles: ({ context, event }) => {
              return sortFiles(
                context.filteredFiles,
                event.sortBy,
                context.sortOrder,
              )
            },
          }),
        },

        /**
         * Обработка события изменения порядка сортировки в состоянии ошибки
         */
        CHANGE_ORDER: {
          actions: assign({
            // Инвертируем порядок сортировки
            sortOrder: ({ context }) =>
              context.sortOrder === "asc" ? "desc" : "asc",

            // Сортируем файлы в новом порядке
            filteredFiles: ({ context }) => {
              const newOrder = context.sortOrder === "asc" ? "desc" : "asc"
              return sortFiles(context.filteredFiles, context.sortBy, newOrder)
            },
          }),
        },

        /**
         * Обработка события фильтрации в состоянии ошибки
         */
        FILTER: {
          actions: assign({
            // Сохраняем новый тип фильтра
            filterType: ({ event }) => event.filterType,

            // Фильтруем и сортируем файлы по новому типу
            filteredFiles: ({ context, event }) => {
              const filtered = filterFiles(
                context.musicFiles,
                context.searchQuery,
                event.filterType,
                context.showFavoritesOnly,
                event.mediaContext,
              )
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },

        /**
         * Обработка события поиска в состоянии ошибки
         */
        SEARCH: {
          actions: assign({
            // Сохраняем новый поисковый запрос
            searchQuery: ({ event }) => event.query,

            // Фильтруем и сортируем файлы по новому запросу
            filteredFiles: ({ context, event }) => {
              const filtered = filterFiles(
                context.musicFiles,
                event.query,
                context.filterType,
                context.showFavoritesOnly,
                event.mediaContext,
              )
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },

        /**
         * Обработка события изменения режима отображения в состоянии ошибки
         */
        CHANGE_VIEW_MODE: {
          actions: assign(({ event }) => ({
            viewMode: event.mode, // Устанавливаем новый режим отображения
          })),
        },

        /**
         * Обработка события изменения группировки в состоянии ошибки
         */
        CHANGE_GROUP_BY: {
          actions: assign({
            groupBy: ({ event }) => event.groupBy, // Устанавливаем новый тип группировки
          }),
        },

        /**
         * Обработка события переключения режима избранного в состоянии ошибки
         */
        TOGGLE_FAVORITES: {
          actions: assign({
            // Инвертируем флаг отображения только избранных
            showFavoritesOnly: ({ context }) => !context.showFavoritesOnly,

            // Перефильтровываем файлы с новым значением флага
            filteredFiles: ({ context, event }) => {
              const newShowFavoritesOnly = !context.showFavoritesOnly
              const filtered = filterFiles(
                context.musicFiles,
                context.searchQuery,
                context.filterType,
                newShowFavoritesOnly,
                event.mediaContext,
              )
              return sortFiles(filtered, context.sortBy, context.sortOrder)
            },
          }),
        },
      },
    },
  },
})
