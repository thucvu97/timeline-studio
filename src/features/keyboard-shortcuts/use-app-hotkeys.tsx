import { useCallback, useEffect, useState } from "react"

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

  // Создаем единый обработчик для всех горячих клавиш
  const handleHotkey = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled) return

      const shortcuts = shortcutsRegistry.getAll()
      const keyCombo = [
        event.ctrlKey && "ctrl",
        event.metaKey && "meta",
        event.altKey && "alt",
        event.shiftKey && "shift",
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+")

      shortcuts.forEach((shortcut) => {
        if (shortcut.enabled && shortcut.action) {
          shortcut.keys.forEach((keys) => {
            if (keys === keyCombo) {
              shortcut.action!(event, {})
            }
          })
        }
      })
    },
    [isEnabled],
  )

  // Регистрируем единый обработчик для всех возможных комбинаций
  useHotkeys(
    "*", // Слушаем все клавиши
    handleHotkey,
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: false, // Не предотвращаем по умолчанию, пусть обработчик решает
      enabled: isEnabled,
    },
    [isEnabled, handleHotkey],
  )

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
