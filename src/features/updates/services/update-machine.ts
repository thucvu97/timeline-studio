/**
 * Update Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @domains/system-integration
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  UpdateMachine,
  UpdateMachineContext,
  UpdateMachineEvent,
} from "@domains/system-integration/machines/update-machine"

export { updateMachine } from "@domains/system-integration/machines/update-machine"
