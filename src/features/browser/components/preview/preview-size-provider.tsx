import { createContext, useContext, useEffect, useMemo } from "react"

import { useMachine } from "@xstate/react"

import { PreviewSizeEventType, getSavedSize, previewSizeMachine, saveSize } from "./preview-size-machine"

/**
 * Интерфейс контекста размера превью
 */
interface PreviewSizeContextType {
  previewSize: number
  canIncreaseSize: boolean
  canDecreaseSize: boolean
  increaseSize: () => void
  decreaseSize: () => void
  setPreviewSize: (size: number) => void
}

/**
 * Контекст для размера превью
 */
const PreviewSizeContext = createContext<PreviewSizeContextType | undefined>(undefined)

/**
 * Пропсы для провайдера размера превью
 */
interface PreviewSizeProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер для размера превью
 * Предоставляет доступ к размеру превью и методам для его изменения
 *
 * @param {PreviewSizeProviderProps} props - Пропсы компонента
 * @returns {JSX.Element} Провайдер контекста с размером превью
 */
export function PreviewSizeProvider({ children }: PreviewSizeProviderProps) {
  console.log("PreviewSizeProvider rendering")

  // Инициализируем машину состояний
  const [state, send] = useMachine(previewSizeMachine)

  console.log("PreviewSizeProvider state:", state.context)
  console.log("PreviewSizeProvider state status:", state.status)

  // Загружаем сохраненный размер при монтировании компонента
  useEffect(() => {
    // Загружаем сохраненный размер из localStorage
    const savedSize = getSavedSize()

    // Устанавливаем загруженный размер
    send({
      type: "SET_PREVIEW_SIZE",
      size: savedSize,
    } as PreviewSizeEventType)
  }, [send])

  // Создаем значение контекста
  const value = useMemo(
    () => ({
      previewSize: state.context.previewSize,
      canIncreaseSize: state.context.canIncreaseSize,
      canDecreaseSize: state.context.canDecreaseSize,
      increaseSize: () => {
        send({ type: "INCREASE_PREVIEW_SIZE" } as PreviewSizeEventType)
        // Сохраняем новый размер в localStorage после обновления состояния
        setTimeout(() => {
          saveSize(state.context.previewSize)
        }, 0)
      },
      decreaseSize: () => {
        send({ type: "DECREASE_PREVIEW_SIZE" } as PreviewSizeEventType)
        // Сохраняем новый размер в localStorage после обновления состояния
        setTimeout(() => {
          saveSize(state.context.previewSize)
        }, 0)
      },
      setPreviewSize: (size: number) => {
        send({
          type: "SET_PREVIEW_SIZE",
          size,
        } as PreviewSizeEventType)
        // Сохраняем новый размер в localStorage после обновления состояния
        setTimeout(() => {
          saveSize(state.context.previewSize)
        }, 0)
      },
    }),
    [state.context, send],
  )

  return <PreviewSizeContext.Provider value={value}>{children}</PreviewSizeContext.Provider>
}

/**
 * Хук для использования контекста размера превью
 * @returns {PreviewSizeContextType} Объект с размером превью и методами для его изменения
 * @throws {Error} Если хук используется вне компонента PreviewSizeProvider
 */
export function usePreviewSize() {
  const context = useContext(PreviewSizeContext)
  if (!context) {
    throw new Error("usePreviewSize must be used within a PreviewSizeProvider")
  }
  return context
}
