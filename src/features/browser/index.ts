export * from "./components"
export { BrowserLazy } from "./components/browser-lazy"
// Новые хуки с префиксом для избежания конфликтов
export {
  useEffects as useBrowserEffects,
  useEffectsSearch as useBrowserEffectsSearch,
  useFilters as useBrowserFilters,
  useFiltersSearch as useBrowserFiltersSearch,
  useLoadingState,
  useResourceById,
  useResourceSources,
  useResources as useBrowserResources,
  useResourcesAdapter,
  useResourcesByCategory,
  useResourcesByComplexity,
  useResourcesByTags,
  useResourcesCache,
  useResourcesSearch,
  useResourcesStats,
  useTransitions as useBrowserTransitions,
  useTransitionsSearch as useBrowserTransitionsSearch,
} from "./hooks/use-resources"
// Новые компоненты Browser Resource Machine
export { EffectsProvider, useEffectsProvider } from "./providers/effects-provider"
export * from "./services"

// Типы
export type * from "./types"
