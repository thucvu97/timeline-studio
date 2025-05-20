import { createContext, useContext, useEffect } from "react"

import { useMachine } from "@xstate/react"

import { musicMachine } from "./music-machine"

// Определяем тип для контекста музыкальной машины
interface MusicContextValue {
  // Состояния
  musicFiles: any[]
  filteredFiles: any[]
  searchQuery: string
  sortBy: string
  sortOrder: "asc" | "desc"
  filterType: string
  viewMode: "list" | "thumbnails"
  groupBy: "none" | "artist" | "genre" | "album"
  availableExtensions: string[]
  showFavoritesOnly: boolean
  error?: string
  isPlaying: boolean
  isLoading: boolean
  isError: boolean

  // Методы
  search: (query: string, mediaContext?: any) => void
  sort: (sortBy: string) => void
  filter: (filterType: string, mediaContext?: any) => void
  changeOrder: () => void
  changeViewMode: (mode: "list" | "thumbnails") => void
  changeGroupBy: (groupBy: "none" | "artist" | "genre" | "album") => void
  toggleFavorites: (mediaContext: any) => void
  retry: () => void
}

// Создаем контекст
export const MusicContext = createContext<MusicContextValue | undefined>(
  undefined,
)

// Создаем провайдер
export function MusicProvider({ children }: { children: React.ReactNode }) {
  console.log("MusicProvider rendering")

  // Используем машину состояний
  const [state, send] = useMachine(musicMachine)

  console.log("MusicProvider state:", state.context)
  console.log("MusicProvider state status:", state.status)

  // Извлекаем значения из контекста машины состояний
  const {
    musicFiles,
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    showFavoritesOnly,
    error,
  } = state.context

  // Определяем состояния
  const isPlaying = state.matches("playing")
  const isLoading = state.matches("loading")
  const isError = state.matches("error")

  // Создаем методы для взаимодействия с машиной состояний
  const search = (query: string, mediaContext?: any) => {
    console.log("Search requested:", query)
    send({ type: "SEARCH", query, mediaContext })
  }

  const sort = (sortBy: string) => {
    console.log("Sort requested:", sortBy)
    send({ type: "SORT", sortBy })
  }

  const filter = (filterType: string, mediaContext?: any) => {
    console.log("Filter requested:", filterType)
    send({ type: "FILTER", filterType, mediaContext })
  }

  const changeOrder = () => {
    console.log("Change order requested")
    send({ type: "CHANGE_ORDER" })
  }

  const changeViewMode = (mode: "list" | "thumbnails") => {
    console.log("View mode change requested:", mode)
    send({ type: "CHANGE_VIEW_MODE", mode })
  }

  const changeGroupBy = (groupBy: "none" | "artist" | "genre" | "album") => {
    console.log("Group by change requested:", groupBy)
    send({ type: "CHANGE_GROUP_BY", groupBy })
  }

  const toggleFavorites = (mediaContext: any) => {
    console.log("Toggle favorites requested")
    send({ type: "TOGGLE_FAVORITES", mediaContext })
  }

  const retry = () => {
    console.log("Retry requested")
    send({ type: "RETRY" })
  }

  // Создаем значение контекста
  const value: MusicContextValue = {
    // Состояния
    musicFiles,
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    showFavoritesOnly,
    error,
    isPlaying,
    isLoading,
    isError,

    // Методы
    search,
    sort,
    filter,
    changeOrder,
    changeViewMode,
    changeGroupBy,
    toggleFavorites,
    retry,
  }

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

// Хук для использования контекста
export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider")
  }
  return context
}
