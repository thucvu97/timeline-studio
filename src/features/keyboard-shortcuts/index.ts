// Компоненты
export * from "./keyboard-shortcuts-modal"
export * from "./components/shortcut-handler"

// Хуки
export * from "./use-app-hotkeys"
export * from "./hooks/use-panel-shortcuts"

// Сервисы
export * from "./services/shortcuts-registry"
export * from "./services/shortcuts-provider"

// Константы
export * from "./constants/default-shortcuts"

// Пресеты - экспортируем функцию создания и типы
export { createPresets } from "./presets"
export type { PresetType, Shortcut as ShortcutPreset } from "./presets/types"
