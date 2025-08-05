/**
 * WebGL библиотека для Timeline Studio
 * Унифицированная система управления WebGL2 контекстом, шейдерами и рендерингом
 */

// Основные модули
export * from "./context-manager"
export * from "./shader-pool"
export * from "./vao-manager"
export * from "./base-renderer"

// Утилиты
export * from "./utils"

// Реэкспорт синглтонов для удобства
export { contextManager } from "./context-manager"
export { shaderPool } from "./shader-pool"
export { vaoManager } from "./vao-manager"