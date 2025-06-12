import { useShortcuts } from "../services/shortcuts-provider"

/**
 * Демо компонент для отображения зарегистрированных shortcuts
 * Показывает, какие shortcuts активны
 */
export function ShortcutsDemo() {
  const { shortcuts, isEnabled } = useShortcuts()

  // Фильтруем только shortcuts с действиями
  const activeShortcuts = shortcuts.filter(s => s.action && s.enabled)

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
      <h3 className="font-bold mb-2">Active Shortcuts ({activeShortcuts.length})</h3>
      <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
        {activeShortcuts.map(shortcut => (
          <div key={shortcut.id} className="flex justify-between">
            <span>{shortcut.name}</span>
            <span className="text-gray-400">{shortcut.keys[0]}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-400">
        Shortcuts {isEnabled ? "enabled" : "disabled"}
      </div>
    </div>
  )
}