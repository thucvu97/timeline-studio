/**
 * Barrel exports для модуля Person Identification
 */

// Компоненты
export * from "./components"

// Hooks
export * from "./hooks"
// Сервисы
export { PersonDatabaseService } from "./services/person-database-service"
export { AdvancedFaceDetectionService } from "./services/advanced-face-detection-service"
export { AdvancedTrackingService } from "./services/advanced-tracking-service"
// Типы
export * from "./types/person"
