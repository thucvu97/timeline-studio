// Простая заглушка вместо сложной машины состояний
export function useMusic() {
  return {
    // Состояния
    musicFiles: [],
    filteredFiles: [],
    searchQuery: "",
    sortBy: "name",
    sortOrder: "asc" as const,
    filterType: "all",
    viewMode: "list" as const,
    groupBy: "none" as const,
    availableExtensions: [],
    showFavoritesOnly: false,
    error: null,
    isPlaying: false,
    isLoading: false,
    isError: false,

    // Методы (заглушки)
    search: () => {},
    sort: () => {},
    filter: () => {},
    changeOrder: () => {},
    changeViewMode: () => {},
    changeGroupBy: () => {},
    toggleFavorites: () => {},
    retry: () => {},
    addMusicFiles: () => {},
    updateMusicFiles: () => {},
  };
}
