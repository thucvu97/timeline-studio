import { assign, createMachine, fromPromise } from "xstate"

import { MediaFile } from "@/types/media"

import { filterFiles, sortFiles } from "./music-utils"

interface MusicContext {
  musicFiles: MediaFile[]
  filteredFiles: MediaFile[]
  searchQuery: string
  sortBy: string
  sortOrder: "asc" | "desc"
  filterType: string
  viewMode: "list" | "thumbnails"
  groupBy: "none" | "artist" | "genre" | "album"
  availableExtensions: string[]
  showFavoritesOnly: boolean
  error?: string
}

interface SearchEvent {
  type: "SEARCH"
  query: string
  mediaContext?: any
}

interface SortEvent {
  type: "SORT"
  sortBy: string
}

interface FilterEvent {
  type: "FILTER"
  filterType: string
  mediaContext?: any
}

interface ChangeOrderEvent {
  type: "CHANGE_ORDER"
}

interface ChangeViewModeEvent {
  type: "CHANGE_VIEW_MODE"
  mode: "list" | "thumbnails"
}

interface ChangeGroupByEvent {
  type: "CHANGE_GROUP_BY"
  groupBy: "none" | "artist" | "genre" | "album"
}

interface RetryEvent {
  type: "RETRY"
}

interface ToggleFavoritesEvent {
  type: "TOGGLE_FAVORITES"
  mediaContext?: any
}

type MusicEvent =
  | SearchEvent
  | SortEvent
  | FilterEvent
  | ChangeOrderEvent
  | ChangeViewModeEvent
  | ChangeGroupByEvent
  | ToggleFavoritesEvent
  | RetryEvent

interface FetchOutput {
  media: MediaFile[]
}

const fetchMusicFiles = fromPromise<FetchOutput, unknown>(async () => {
  const response = await fetch(`/api/music`)
  const data = await response.json()
  return data
})

export const musicMachine = createMachine({
  id: "music",
  initial: "loading",
  context: {
    musicFiles: [],
    filteredFiles: [],
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc",
    filterType: "all",
    viewMode: "list",
    groupBy: "none",
    availableExtensions: [],
    showFavoritesOnly: false,
  } as MusicContext,
  types: {
    context: {} as MusicContext,
    events: {} as MusicEvent,
  },
  states: {
    loading: {
      invoke: {
        id: "fetchFiles",
        src: fetchMusicFiles,
        input: () => ({}),
        onDone: {
          target: "success",
          actions: assign({
            musicFiles: ({ event }) => {
              console.log("Получено файлов из API:", event.output.media.length)
              return event.output.media
            },
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
        onError: {
          target: "error",
          actions: assign({
            error: ({ event }) => String(event.error),
          }),
        },
      },
    },
    success: {
      on: {
        SEARCH: {
          actions: assign({
            searchQuery: ({ event }) => event.query,
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
        SORT: {
          actions: assign({
            sortBy: ({ event }) => event.sortBy,
            filteredFiles: ({ context, event }) => {
              return sortFiles(
                context.filteredFiles,
                event.sortBy,
                context.sortOrder,
              )
            },
          }),
        },
        FILTER: {
          actions: assign({
            filterType: ({ event }) => event.filterType,
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
        CHANGE_ORDER: {
          actions: assign({
            sortOrder: ({ context }) =>
              context.sortOrder === "asc" ? "desc" : "asc",
            filteredFiles: ({ context }) => {
              const newOrder = context.sortOrder === "asc" ? "desc" : "asc"
              return sortFiles(context.filteredFiles, context.sortBy, newOrder)
            },
          }),
        },
        CHANGE_VIEW_MODE: {
          actions: assign(({ event }) => ({
            viewMode: event.mode,
          })),
        },
        CHANGE_GROUP_BY: {
          actions: assign({
            groupBy: ({ event }) => event.groupBy,
          }),
        },
        TOGGLE_FAVORITES: {
          actions: assign({
            showFavoritesOnly: ({ context }) => !context.showFavoritesOnly,
            filteredFiles: ({ context, event }) => {
              // Получаем новое значение showFavoritesOnly (инвертированное текущее)
              const newShowFavoritesOnly = !context.showFavoritesOnly

              // Перефильтровываем файлы с новым значением showFavoritesOnly
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
    error: {
      on: {
        RETRY: {
          target: "loading",
        },
      },
    },
  },
})
