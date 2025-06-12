import React, { createContext, useContext, useEffect, useState } from "react"

import { useModal } from "@/features/modals/services/modal-provider"

import { ShortcutDefinition, shortcutsRegistry } from "./shortcuts-registry"
import { ShortcutHandler } from "../components/shortcut-handler"
import { DEFAULT_SHORTCUTS } from "../constants/default-shortcuts"
import { usePanelShortcuts } from "../hooks/use-panel-shortcuts"

interface ShortcutsContextType {
  shortcuts: ShortcutDefinition[]
  isEnabled: boolean
  toggleShortcuts: (enabled: boolean) => void
  updateShortcutKeys: (id: string, keys: string[]) => void
  resetShortcut: (id: string) => void
  resetAllShortcuts: () => void
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null)

interface ShortcutsProviderProps {
  children: React.ReactNode
}

/**
 * Провайдер для управления клавиатурными сочетаниями
 * Централизованно регистрирует и управляет всеми shortcuts
 */
export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
  const { openModal } = useModal()
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([])
  const [isEnabled, setIsEnabled] = useState(true)

  // Инициализация shortcuts при первой загрузке
  useEffect(() => {
    if (shortcutsRegistry.getAll().length === 0) {
      // Добавляем обработчики для shortcuts
      const enhancedShortcuts = DEFAULT_SHORTCUTS.map((shortcut) => {
        // Добавляем действия для модальных окон
        switch (shortcut.id) {
          case "open-user-settings":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("user-settings")
              },
            }
          case "open-project-settings":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("project-settings")
              },
            }
          case "open-keyboard-shortcuts":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("keyboard-shortcuts")
              },
            }
          case "export-video":
            return {
              ...shortcut,
              action: (event: KeyboardEvent) => {
                event.preventDefault()
                openModal("export")
              },
            }
          // TODO: Добавить обработчики для остальных shortcuts
          default:
            return shortcut
        }
      })

      shortcutsRegistry.registerMany(enhancedShortcuts)
    }

    // Подписываемся на изменения shortcuts
    const unsubscribe = shortcutsRegistry.subscribe((updatedShortcuts) => {
      setShortcuts(updatedShortcuts)
    })

    // Загружаем начальные shortcuts
    setShortcuts(shortcutsRegistry.getAll())

    return unsubscribe
  }, [openModal])

  const toggleShortcuts = (enabled: boolean) => {
    setIsEnabled(enabled)
  }

  const updateShortcutKeys = (id: string, keys: string[]) => {
    shortcutsRegistry.updateKeys(id, keys)
  }

  const resetShortcut = (id: string) => {
    shortcutsRegistry.reset(id)
  }

  const resetAllShortcuts = () => {
    shortcutsRegistry.resetAll()
  }

  const contextValue: ShortcutsContextType = {
    shortcuts,
    isEnabled,
    toggleShortcuts,
    updateShortcutKeys,
    resetShortcut,
    resetAllShortcuts,
  }

  // Регистрируем shortcuts для панелей
  usePanelShortcuts()

  return (
    <ShortcutsContext.Provider value={contextValue}>
      {/* Рендерим обработчики для всех shortcuts */}
      {shortcuts.map((shortcut) => (
        <ShortcutHandler key={shortcut.id} shortcut={shortcut} enabled={isEnabled} />
      ))}
      {children}
    </ShortcutsContext.Provider>
  )
}

/**
 * Хук для использования контекста shortcuts
 */
export function useShortcuts() {
  const context = useContext(ShortcutsContext)
  if (!context) {
    throw new Error("useShortcuts must be used within ShortcutsProvider")
  }
  return context
}
