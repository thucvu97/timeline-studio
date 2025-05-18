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
 * Получение класса для модального окна по его типу
 */
export function getDialogClassForType(modalType: ModalType): string {
  switch (modalType) {
    case "camera-capture":
      return "h-[max(600px,min(70vh,800px))] w-[max(700px,min(80vw,900px))]"
    case "voice-recording":
      return "h-[max(500px,min(60vh,700px))] w-[max(600px,min(70vw,800px))]"
    case "export":
      return "h-[max(700px,min(80vh,900px))] w-[max(800px,min(90vw,1200px))]"
    case "project-settings":
      return "h-[max(500px,min(60vh,700px))] w-[max(600px,min(80vw,800px))]"
    case "user-settings":
      return "h-[max(550px,min(65vh,750px))] w-[max(650px,min(75vw,850px))]"
    case "keyboard-shortcuts":
      return "h-[max(600px,min(70vh,800px))] w-[max(700px,min(85vw,900px))]"
    default:
      return "h-[max(600px,min(50vh,800px))]"
  }
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
