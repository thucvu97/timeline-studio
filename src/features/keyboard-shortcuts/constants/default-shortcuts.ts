/**
 * Дефолтные клавиатурные сочетания для приложения
 * Централизованное место для всех shortcuts
 */

import { ShortcutDefinition } from "../services/shortcuts-registry"

// Утилита для создания shortcuts с разными вариантами для macOS
const createMacShortcut = (
  id: string,
  name: string,
  category: string,
  primaryKeys: string,
  description?: string,
): ShortcutDefinition => {
  // Генерируем варианты для macOS
  const keys = [primaryKeys]

  // Добавляем альтернативные варианты для macOS
  if (primaryKeys.includes("⌘")) {
    keys.push(primaryKeys.replace("⌘", "cmd+"))
    keys.push(primaryKeys.replace("⌘", "command+"))
    keys.push(primaryKeys.replace("⌘", "meta+"))
  }

  if (primaryKeys.includes("⌥")) {
    keys.push(primaryKeys.replace("⌥", "alt+"))
    keys.push(primaryKeys.replace("⌥", "option+"))
    keys.push(primaryKeys.replace("⌥", "opt+"))
  }

  return { id, name, category, keys, description }
}

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // Настройки
  createMacShortcut(
    "open-user-settings",
    "Настройки пользователя",
    "settings",
    "⌥⌘.",
    "Открыть настройки пользователя",
  ),
  createMacShortcut("open-project-settings", "Настройки проекта", "settings", "⌥⌘,", "Открыть настройки проекта"),
  createMacShortcut(
    "open-keyboard-shortcuts",
    "Горячие клавиши",
    "settings",
    "⌥⌘K",
    "Открыть настройки горячих клавиш",
  ),

  // Файл
  createMacShortcut("new-project", "Новый проект", "file", "⌘N", "Создать новый проект"),
  createMacShortcut("open-project", "Открыть проект", "file", "⌘O", "Открыть существующий проект"),
  createMacShortcut("save-project", "Сохранить проект", "file", "⌘S", "Сохранить текущий проект"),
  createMacShortcut("save-project-as", "Сохранить как...", "file", "⇧⌘S", "Сохранить проект с новым именем"),
  createMacShortcut("close-project", "Закрыть проект", "file", "⌘W", "Закрыть текущий проект"),

  // Вид
  createMacShortcut("toggle-browser", "Показать/скрыть браузер", "view", "⌘B", "Переключить видимость панели браузера"),
  createMacShortcut("toggle-timeline", "Показать/скрыть таймлайн", "view", "⌘T", "Переключить видимость таймлайна"),
  createMacShortcut("toggle-options", "Показать/скрыть опции", "view", "⌘O", "Переключить видимость панели опций"),
  createMacShortcut("toggle-fullscreen", "Полноэкранный режим", "view", "⌘F", "Переключить полноэкранный режим"),
  createMacShortcut("zoom-in", "Увеличить", "view", "⌘+", "Увеличить масштаб"),
  createMacShortcut("zoom-out", "Уменьшить", "view", "⌘-", "Уменьшить масштаб"),
  createMacShortcut("fit-to-window", "По размеру окна", "view", "⌘0", "Подогнать под размер окна"),

  // Редактирование
  createMacShortcut("undo", "Отменить", "edit", "⌘Z", "Отменить последнее действие"),
  createMacShortcut("redo", "Повторить", "edit", "⇧⌘Z", "Повторить отмененное действие"),
  createMacShortcut("cut", "Вырезать", "edit", "⌘X", "Вырезать выделенное"),
  createMacShortcut("copy", "Копировать", "edit", "⌘C", "Копировать выделенное"),
  createMacShortcut("paste", "Вставить", "edit", "⌘V", "Вставить из буфера обмена"),
  createMacShortcut("delete", "Удалить", "edit", "Delete", "Удалить выделенное"),
  createMacShortcut("select-all", "Выделить все", "edit", "⌘A", "Выделить все элементы"),

  // Таймлайн
  createMacShortcut("split-clip", "Разрезать клип", "timeline", "S", "Разрезать клип в позиции курсора"),
  createMacShortcut("delete-clip", "Удалить клип", "timeline", "X", "Удалить выделенный клип"),
  createMacShortcut("ripple-delete", "Удалить со сдвигом", "timeline", "⇧X", "Удалить клип и сдвинуть остальные"),
  createMacShortcut("add-marker", "Добавить маркер", "timeline", "M", "Добавить маркер в текущей позиции"),
  createMacShortcut("snap-toggle", "Привязка", "timeline", "N", "Включить/выключить привязку"),

  // Воспроизведение
  createMacShortcut(
    "play-pause",
    "Воспроизведение/Пауза",
    "playback",
    "Space",
    "Начать или приостановить воспроизведение",
  ),
  createMacShortcut("stop", "Стоп", "playback", "K", "Остановить воспроизведение"),
  createMacShortcut("next-frame", "Следующий кадр", "playback", "→", "Перейти к следующему кадру"),
  createMacShortcut("previous-frame", "Предыдущий кадр", "playback", "←", "Перейти к предыдущему кадру"),
  createMacShortcut("go-to-start", "В начало", "playback", "Home", "Перейти в начало таймлайна"),
  createMacShortcut("go-to-end", "В конец", "playback", "End", "Перейти в конец таймлайна"),

  // Инструменты
  createMacShortcut("selection-tool", "Инструмент выделения", "tools", "V", "Активировать инструмент выделения"),
  createMacShortcut("blade-tool", "Инструмент лезвие", "tools", "B", "Активировать инструмент разрезания"),
  createMacShortcut("zoom-tool", "Инструмент масштаб", "tools", "Z", "Активировать инструмент масштабирования"),
  createMacShortcut("hand-tool", "Инструмент рука", "tools", "H", "Активировать инструмент перемещения"),

  // Экспорт
  createMacShortcut("export-video", "Экспортировать видео", "export", "⌘E", "Открыть диалог экспорта видео"),
  createMacShortcut("quick-export", "Быстрый экспорт", "export", "⇧⌘E", "Экспортировать с последними настройками"),

  // Прочее
  createMacShortcut("show-help", "Справка", "other", "⌘?", "Показать справку"),
  createMacShortcut("toggle-ai-chat", "AI Ассистент", "other", "⌘I", "Открыть/закрыть AI ассистента"),
]

// Экспортируем shortcuts по категориям для удобства
export const SHORTCUTS_BY_CATEGORY = DEFAULT_SHORTCUTS.reduce<Record<string, ShortcutDefinition[]>>(
  (acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  },
  {},
)
