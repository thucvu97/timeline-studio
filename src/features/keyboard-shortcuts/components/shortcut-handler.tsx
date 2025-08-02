import { useHotkeys } from "react-hotkeys-hook"

import type { ShortcutDefinition } from "../services/shortcuts-registry"

interface ShortcutHandlerProps {
  shortcut: ShortcutDefinition
  enabled: boolean
}

/**
 * Компонент для регистрации отдельного shortcut
 * Правильно обрабатывает множественные комбинации клавиш
 */
export function ShortcutHandler({ shortcut, enabled }: ShortcutHandlerProps) {
  // Регистрируем все комбинации клавиш одним вызовом useHotkeys
  // react-hotkeys-hook поддерживает массив комбинаций или строку с разделителями запятой
  const keysString = shortcut.keys.join(", ")

  useHotkeys(
    keysString,
    shortcut.action || (() => {}),
    {
      enableOnFormTags: false, // Исправлено: отключаем для полей ввода по умолчанию
      preventDefault: true,
      enabled: enabled && shortcut.enabled !== false,
      ...shortcut.options,
    },
    [enabled, shortcut.action, shortcut.enabled, keysString],
  )

  return null
}
