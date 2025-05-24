import { createContext, useContext, useEffect, useMemo } from "react"

import { useMachine } from "@xstate/react"

import {
  TemplateListContextType,
  TemplateListEventType,
  getSavedFavoritesState,
  getSavedTemplateSize,
  saveFavoritesState,
  saveTemplateSize,
  templateListMachine,
} from "./template-list-machine"

/**
 * Интерфейс контекста списка шаблонов
 */
interface TemplateListProviderContextType extends TemplateListContextType {
  increaseSize: () => void
  decreaseSize: () => void
  setPreviewSize: (size: number) => void
  setSearchQuery: (query: string) => void
  toggleFavorites: () => void
  setShowFavoritesOnly: (value: boolean) => void
}

/**
 * Контекст для списка шаблонов
 */
const TemplateListContext = createContext<TemplateListProviderContextType | undefined>(undefined)

/**
 * Пропсы для провайдера списка шаблонов
 */
interface TemplateListProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер для списка шаблонов
 * Предоставляет доступ к состоянию списка шаблонов и методам для его изменения
 *
 * @param {TemplateListProviderProps} props - Пропсы компонента
 * @returns {JSX.Element} Провайдер контекста с состоянием списка шаблонов
 */
export function TemplateListProvider({ children }: TemplateListProviderProps) {
  console.log("TemplateListProvider rendering")

  // Инициализируем машину состояний
  const [state, send] = useMachine(templateListMachine)

  console.log("TemplateListProvider state:", state.context)
  console.log("TemplateListProvider state status:", state.status)

  // Загружаем сохраненные настройки при монтировании компонента
  useEffect(() => {
    // Загружаем сохраненный размер из localStorage
    const savedSize = getSavedTemplateSize()

    // Устанавливаем загруженный размер
    send({
      type: "SET_PREVIEW_SIZE",
      size: savedSize,
    } as TemplateListEventType)

    // Загружаем сохраненное состояние избранных
    const savedFavoritesState = getSavedFavoritesState()

    // Устанавливаем загруженное состояние избранных
    send({
      type: "SET_SHOW_FAVORITES_ONLY",
      value: savedFavoritesState,
    } as TemplateListEventType)
  }, [send])

  // Создаем значение контекста
  const value = useMemo(
    () => ({
      // Состояние
      previewSize: state.context.previewSize,
      canIncreaseSize: state.context.canIncreaseSize,
      canDecreaseSize: state.context.canDecreaseSize,
      searchQuery: state.context.searchQuery,
      showFavoritesOnly: state.context.showFavoritesOnly,

      // Методы
      increaseSize: () => {
        send({ type: "INCREASE_PREVIEW_SIZE" } as TemplateListEventType)
        // Сохраняем новый размер в localStorage после обновления состояния
        setTimeout(() => {
          saveTemplateSize(state.context.previewSize)
        }, 0)
      },
      decreaseSize: () => {
        send({ type: "DECREASE_PREVIEW_SIZE" } as TemplateListEventType)
        // Сохраняем новый размер в localStorage после обновления состояния
        setTimeout(() => {
          saveTemplateSize(state.context.previewSize)
        }, 0)
      },
      setPreviewSize: (size: number) => {
        send({
          type: "SET_PREVIEW_SIZE",
          size,
        } as TemplateListEventType)
        // Сохраняем новый размер в localStorage после обновления состояния
        setTimeout(() => {
          saveTemplateSize(state.context.previewSize)
        }, 0)
      },
      setSearchQuery: (query: string) => {
        send({
          type: "SET_SEARCH_QUERY",
          query,
        } as TemplateListEventType)
      },
      toggleFavorites: () => {
        send({ type: "TOGGLE_FAVORITES" } as TemplateListEventType)
        // Сохраняем новое состояние избранных в localStorage после обновления состояния
        setTimeout(() => {
          saveFavoritesState(state.context.showFavoritesOnly)
        }, 0)
      },
      setShowFavoritesOnly: (value: boolean) => {
        send({
          type: "SET_SHOW_FAVORITES_ONLY",
          value,
        } as TemplateListEventType)
        // Сохраняем новое состояние избранных в localStorage после обновления состояния
        setTimeout(() => {
          saveFavoritesState(state.context.showFavoritesOnly)
        }, 0)
      },
    }),
    [state.context, send],
  )

  return <TemplateListContext.Provider value={value}>{children}</TemplateListContext.Provider>
}

/**
 * Хук для использования контекста списка шаблонов
 * @returns {TemplateListProviderContextType} Объект с состоянием списка шаблонов и методами для его изменения
 * @throws {Error} Если хук используется вне компонента TemplateListProvider
 */
export function useTemplateList() {
  const context = useContext(TemplateListContext)
  if (!context) {
    throw new Error("useTemplateList must be used within a TemplateListProvider")
  }
  return context
}
