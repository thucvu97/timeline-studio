/**
 * System Integration Domain Types
 *
 * Центральное место для всех типов домена системной интеграции
 */

// Re-export update types
export type {
  AutoCheckSettings,
  UpdateAvailability,
  UpdateCheckResult,
  UpdateEventPayload,
  UpdateInfo,
  UpdateMachineContext,
  UpdateMachineEvent,
  UpdateProgress,
  UpdateProgressWithPercentage,
  UpdateStatus,
} from "@/features/updates/types"
// Re-export modal types
export type { ModalData, ModalType } from "../machines/modal-machine"

// System integration orchestrator context
export interface SystemIntegrationContext {
  // Modal state
  activeModal: ModalType
  modalData: ModalData | null
  modalStack: ModalType[]

  // Update state
  updateStatus: UpdateStatus
  currentVersion: string
  availableUpdate: UpdateInfo | null
  updateProgress: UpdateProgressWithPercentage | null

  // Notifications
  notifications: SystemNotification[]

  // System status
  isOnline: boolean
  systemResources: SystemResources

  // Feature flags
  features: Record<string, boolean>
}

// System notification type
export interface SystemNotification {
  id: string
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  timestamp: Date
  duration?: number
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: "primary" | "secondary" | "danger"
}

// System resources
export interface SystemResources {
  cpuUsage: number
  memoryUsage: number
  diskSpace: {
    used: number
    total: number
  }
  gpuAvailable: boolean
  gpuMemory?: {
    used: number
    total: number
  }
}

// System integration events
export type SystemIntegrationEvent =
  // Modal events
  | { type: "OPEN_MODAL"; modal: ModalType; data?: ModalData }
  | { type: "CLOSE_MODAL" }
  | { type: "CLOSE_ALL_MODALS" }

  // Update events
  | { type: "CHECK_FOR_UPDATES" }
  | { type: "DOWNLOAD_UPDATE" }
  | { type: "INSTALL_UPDATE" }
  | { type: "DISMISS_UPDATE" }

  // Notification events
  | { type: "SHOW_NOTIFICATION"; notification: Omit<SystemNotification, "id" | "timestamp"> }
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | { type: "CLEAR_NOTIFICATIONS" }

  // System events
  | { type: "UPDATE_ONLINE_STATUS"; isOnline: boolean }
  | { type: "UPDATE_SYSTEM_RESOURCES"; resources: SystemResources }
  | { type: "TOGGLE_FEATURE"; feature: string; enabled: boolean }

// Modal types re-exports (for convenience)
export type ModalType = import("../machines/modal-machine").ModalType
export type ModalData = import("../machines/modal-machine").ModalData

// Update types re-exports (for convenience)
export type UpdateInfo = import("@/features/updates/types").UpdateInfo
export type UpdateStatus = import("@/features/updates/types").UpdateStatus
export type UpdateProgressWithPercentage = import("@/features/updates/types").UpdateProgressWithPercentage

// System integration service interface
export interface SystemIntegrationService {
  // Modal management
  openModal(modal: ModalType, data?: ModalData): void
  closeModal(): void
  closeAllModals(): void

  // Update management
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<void>

  // Notification management
  showNotification(notification: Omit<SystemNotification, "id" | "timestamp">): void
  dismissNotification(id: string): void
  clearNotifications(): void

  // System monitoring
  updateOnlineStatus(isOnline: boolean): void
  updateSystemResources(resources: SystemResources): void

  // Feature flags
  toggleFeature(feature: string, enabled: boolean): void
  isFeatureEnabled(feature: string): boolean
}
