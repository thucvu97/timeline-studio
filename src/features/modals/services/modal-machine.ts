/**
 * Modal Machine - Legacy re-export
 *
 * @deprecated Используйте импорт из @domains/system-integration
 * Этот файл оставлен для обратной совместимости
 */

// Re-export everything from the new domain location
export type {
  ModalType,
  ModalData,
  ModalMachine,
  ModalActor,
  ModalContext,
  ModalEvent,
} from "@domains/system-integration/machines/modal-machine"

export { modalMachine } from "@domains/system-integration/machines/modal-machine"