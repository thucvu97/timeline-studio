import { createContext, useContext, useMemo } from "react"

import { useMachine } from "@xstate/react"

import { ModalData, ModalType, modalMachine } from "./modal-machine"

/**
 * Интерфейс для контекста модальных окон
 */
interface ModalContextType {
  modalType: ModalType
  modalData: ModalData | null
  isOpen: boolean
  openModal: (modalType: ModalType, modalData?: ModalData) => void
  closeModal: () => void
  submitModal: (data?: ModalData) => void
}

/**
 * Пропсы для провайдера модальных окон
 */
interface ModalProviderProps {
  children: React.ReactNode
}

/**
 * Контекст для модальных окон
 */
const ModalContext = createContext<ModalContextType | undefined>(undefined)

/**
 * Провайдер для модальных окон
 */
export function ModalProvider({ children }: ModalProviderProps) {
  const [state, send] = useMachine(modalMachine)

  const value = useMemo(
    () => ({
      modalType: state.context.modalType,
      modalData: state.context.modalData,
      isOpen: state.matches("opened"),
      openModal: (modalType: ModalType, modalData?: ModalData) => {
        console.log("Открываем модальное окно:", modalType)
        send({ type: "OPEN_MODAL", modalType, modalData })
      },
      closeModal: () => {
        console.log("Закрываем модальное окно")
        send({ type: "CLOSE_MODAL" })
      },
      submitModal: (data?: ModalData) => {
        console.log("Отправляем данные модального окна:", data)
        send({ type: "SUBMIT_MODAL", data })
      },
    }),
    [state, send],
  )

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

/**
 * Хук для использования контекста модальных окон
 */
export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
