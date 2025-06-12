import { useEffect } from "react"

import { useHotkeys } from "react-hotkeys-hook"

import { ShortcutDefinition } from "../services/shortcuts-registry"

interface ShortcutHandlerProps {
  shortcut: ShortcutDefinition
  enabled: boolean
}

/**
 * Компонент для регистрации отдельного shortcut
 * Обходит ограничение React hooks в циклах
 */
export function ShortcutHandler({ shortcut, enabled }: ShortcutHandlerProps) {
  // Регистрируем каждую комбинацию клавиш для данного shortcut
  shortcut.keys.forEach((keys) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(
      keys,
      shortcut.action || (() => {}),
      {
        enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
        preventDefault: true,
        enabled: enabled && shortcut.enabled,
        ...shortcut.options,
      },
      [enabled, shortcut.action, shortcut.enabled]
    )
  })

  return null
}