/**
 * WebGL библиотека для Timeline Studio
 * Унифицированная система управления WebGL2 контекстом, шейдерами и рендерингом
 */

export * from "./base-renderer"
// Основные модули
export * from "./context-manager"
// Реэкспорт синглтонов для удобства
export { contextManager } from "./context-manager"
export * from "./shader-pool"
export { shaderPool } from "./shader-pool"
// Утилиты
export * from "./utils"
export * from "./vao-manager"
export { vaoManager } from "./vao-manager"
