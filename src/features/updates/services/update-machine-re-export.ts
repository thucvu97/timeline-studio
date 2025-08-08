/**
 * Re-export update machine from new domain location
 * Для обратной совместимости
 */

export type {
  UpdateMachine,
  UpdateMachineActor,
} from "@/domains/system-integration/machines/update-machine"
export { updateMachine } from "@/domains/system-integration/machines/update-machine"
