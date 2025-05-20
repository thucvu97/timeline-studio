import { assign, setup } from "xstate"

/**
 * Типы модальных окон в приложении
 */
export type ModalType =
  | "camera-capture"
  | "voice-recording"
  | "export"
  | "project-settings"
  | "user-settings"
  | "keyboard-shortcuts"
  | "none"

/**
 * Интерфейс для данных модального окна
 */
export interface ModalData {
  /** Класс для размера модального окна */
  dialogClass?: string
  /** Дополнительные данные */
  [key: string]: unknown
}

/**
 * Создание машины состояний для модальных окон
 */
export const modalMachine = setup({
  types: {
    context: {} as {
      modalType: ModalType
      modalData: ModalData | null
    },
    events: {} as
      | { type: "OPEN_MODAL"; modalType: ModalType; modalData?: ModalData }
      | { type: "CLOSE_MODAL" }
      | { type: "SUBMIT_MODAL"; data?: ModalData },
  },
  actions: {
    /**
     * Действие для логирования отправки формы
     */
    logFormSubmission: ({ context, event }) => {
      if (event.type === "SUBMIT_MODAL") {
        console.log(
          `Modal ${context.modalType} submitted with data:`,
          event.data,
        )
      }
    },
  },
}).createMachine({
  id: "modal",
  initial: "closed",
  context: {
    modalType: "none",
    modalData: null,
  },
  states: {
    closed: {
      on: {
        OPEN_MODAL: {
          target: "opened",
          actions: assign({
            modalType: ({ event }) => event.modalType,
            modalData: ({ event }) => event.modalData ?? null,
          }),
        },
      },
    },
    opened: {
      on: {
        CLOSE_MODAL: {
          target: "closed",
          actions: assign({
            modalType: "none",
            modalData: null,
          }),
        },
        SUBMIT_MODAL: {
          target: "closed",
          actions: [
            { type: "logFormSubmission" },
            assign({
              modalType: "none",
              modalData: null,
            }),
          ],
        },
        OPEN_MODAL: {
          // Позволяет открыть другое модальное окно без закрытия текущего
          actions: assign({
            modalType: ({ event }) => event.modalType,
            modalData: ({ event }) => event.modalData ?? null,
          }),
        },
      },
    },
  },
})

/**
 * Тип машины состояний для модальных окон
 */
export type ModalMachine = typeof modalMachine

/**
 * Тип актора машины состояний для модальных окон
 */
export type ModalActor = ReturnType<typeof modalMachine.provide>
