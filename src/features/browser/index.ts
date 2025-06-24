export * from "./components"
export * from "./services"

// Новые компоненты Browser Resource Machine
export { EffectsProvider, useEffectsProvider } from "./providers/effects-provider"

// Новые хуки с префиксом для избежания конфликтов
export {
  useEffects as useBrowserEffects,
  useFilters as useBrowserFilters,
  useTransitions as useBrowserTransitions,
  useResources as useBrowserResources,
  useResourceById,
  useResourcesSearch,
  useResourcesByCategory,
  useResourcesByTags,
  useResourcesByComplexity,
  useLoadingState,
  useResourcesStats,
  useResourceSources,
  useResourcesCache,
  useResourcesAdapter,
  useEffectsSearch as useBrowserEffectsSearch,
  useFiltersSearch as useBrowserFiltersSearch,
  useTransitionsSearch as useBrowserTransitionsSearch,
} from "./hooks/use-resources"

// Новые адаптеры
export { useEffectsAdapterNew } from "./adapters/use-effects-adapter-new"
export { useFiltersAdapterNew } from "./adapters/use-filters-adapter-new"
export { useTransitionsAdapterNew } from "./adapters/use-transitions-adapter-new"

// Компоненты
export { EffectsProviderDemo } from "./components/effects-provider-demo"
export { BrowserLazy } from "./components/browser-lazy"

// Типы
export type * from "./types"
