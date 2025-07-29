/**
 * Barrel exports для модуля Person Identification
 */

// Компоненты
export * from "./components"

// Hooks
export * from "./hooks"
export { AdvancedFaceDetectionService } from "./services/advanced-face-detection-service"
export { AdvancedTrackingService } from "./services/advanced-tracking-service"
// Сервисы
export { PersonDatabaseService } from "./services/person-database-service"
// Типы
export * from "./types/person"
