import { useEffect, useState } from "react"

import { useHotkeys } from "react-hotkeys-hook"

import { useModal } from "@/features/modals/services/modal-provider"

import { DEFAULT_SHORTCUTS } from "./constants/default-shortcuts"
import { shortcutsRegistry } from "./services/shortcuts-registry"

/**
 * Хук для регистрации и управления горячими клавишами приложения
 * Использует централизованный реестр shortcuts
 */
export function useAppHotkeys() {
  const { openModal } = useModal()
  const [isEnabled, setIsEnabled] = useState(true)
  const [registeredShortcuts, setRegisteredShortcuts] = useState<string[]>([])

  useEffect(() => {
    // Регистрируем дефолтные shortcuts при первой загрузке
    if (shortcutsRegistry.getAll().length === 0) {
      // Добавляем обработчики для модальных окон
      const modalShortcuts = DEFAULT_SHORTCUTS.map((shortcut) => {
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
          default:
            return shortcut
        }
      })

      shortcutsRegistry.registerMany(modalShortcuts)
    }

    // Подписываемся на изменения shortcuts
    const unsubscribe = shortcutsRegistry.subscribe((shortcuts) => {
      // Получаем список всех активных shortcuts для отображения
      const activeShortcuts = shortcuts.filter((s) => s.enabled && s.action).map((s) => s.id)
      setRegisteredShortcuts(activeShortcuts)
    })

    return unsubscribe
  }, [openModal])

  // Регистрируем все активные shortcuts
  useEffect(() => {
    const shortcuts = shortcutsRegistry.getAll()

    shortcuts.forEach((shortcut) => {
      if (shortcut.enabled && shortcut.action) {
        // Регистрируем каждую комбинацию клавиш
        shortcut.keys.forEach((keys) => {
          useHotkeys(
            keys,
            shortcut.action!,
            {
              enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
              preventDefault: true,
              enabled: isEnabled,
              ...shortcut.options,
            },
            [isEnabled, shortcut.action],
          )
        })
      }
    })
  }, [isEnabled, registeredShortcuts])

  // Обработчик для временного отключения shortcuts (например, при редактировании)
  const toggleShortcuts = (enabled: boolean) => {
    setIsEnabled(enabled)
  }

  return {
    isEnabled,
    toggleShortcuts,
    registeredShortcuts,
  }
}
