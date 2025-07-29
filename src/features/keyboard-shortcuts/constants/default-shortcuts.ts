/**
 * Дефолтные клавиатурные сочетания для приложения
 * Централизованное место для всех shortcuts
 */

import { ShortcutContext, ShortcutDefinition } from "../services/shortcuts-registry"

// Утилита для создания shortcuts с разными вариантами для macOS
const createMacShortcut = (
  id: string,
  name: string,
  category: string,
  primaryKeys: string,
  description?: string,
  context: ShortcutContext = "global",
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

  return { id, name, category, keys, description, context }
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
  createMacShortcut("split-clip", "Разрезать клип", "timeline", "S", "Разрезать клип в позиции курсора", "timeline"),
  createMacShortcut("delete-clip", "Удалить клип", "timeline", "X", "Удалить выделенный клип", "timeline"),
  createMacShortcut("ripple-delete", "Удалить со сдвигом", "timeline", "⇧X", "Удалить клип и сдвинуть остальные", "timeline"),
  createMacShortcut("snap-toggle", "Привязка", "timeline", "N", "Включить/выключить привязку", "timeline"),

  // Маркеры
  createMacShortcut("add-marker", "Добавить маркер", "timeline", "M", "Добавить маркер в текущей позиции", "timeline"),
  createMacShortcut("add-chapter-marker", "Добавить главу", "timeline", "⇧M", "Добавить маркер главы", "timeline"),
  createMacShortcut("add-export-marker", "Добавить маркер экспорта", "timeline", "⌘M", "Добавить маркер экспорта", "timeline"),
  createMacShortcut("delete-marker", "Удалить маркер", "timeline", "Delete", "Удалить маркер в текущей позиции", "timeline"),
  createMacShortcut("next-marker", "Следующий маркер", "timeline", "'", "Перейти к следующему маркеру", "timeline"),
  createMacShortcut("previous-marker", "Предыдущий маркер", "timeline", ";", "Перейти к предыдущему маркеру", "timeline"),
  createMacShortcut("next-chapter-marker", "Следующая глава", "timeline", "⇧'", "Перейти к следующей главе", "timeline"),
  createMacShortcut("previous-chapter-marker", "Предыдущая глава", "timeline", "⇧;", "Перейти к предыдущей главе", "timeline"),

  // Воспроизведение
  createMacShortcut(
    "play-pause",
    "Воспроизведение/Пауза",
    "playback",
    "Space",
    "Начать или приостановить воспроизведение",
    "player",
  ),
  createMacShortcut("stop", "Стоп", "playback", "K", "Остановить воспроизведение", "player"),
  createMacShortcut("next-frame", "Следующий кадр", "playback", "→", "Перейти к следующему кадру", "player"),
  createMacShortcut("previous-frame", "Предыдущий кадр", "playback", "←", "Перейти к предыдущему кадру", "player"),
  createMacShortcut("go-to-start", "В начало", "playback", "Home", "Перейти в начало таймлайна", "player"),
  createMacShortcut("go-to-end", "В конец", "playback", "End", "Перейти в конец таймлайна", "player"),

  // Мультикамера
  createMacShortcut("switch-camera-1", "Переключиться на камеру 1", "multicam", "1", "Переключиться на угол камеры 1"),
  createMacShortcut("switch-camera-2", "Переключиться на камеру 2", "multicam", "2", "Переключиться на угол камеры 2"),
  createMacShortcut("switch-camera-3", "Переключиться на камеру 3", "multicam", "3", "Переключиться на угол камеры 3"),
  createMacShortcut("switch-camera-4", "Переключиться на камеру 4", "multicam", "4", "Переключиться на угол камеры 4"),
  createMacShortcut("switch-camera-5", "Переключиться на камеру 5", "multicam", "5", "Переключиться на угол камеры 5"),
  createMacShortcut("switch-camera-6", "Переключиться на камеру 6", "multicam", "6", "Переключиться на угол камеры 6"),
  createMacShortcut("switch-camera-7", "Переключиться на камеру 7", "multicam", "7", "Переключиться на угол камеры 7"),
  createMacShortcut("switch-camera-8", "Переключиться на камеру 8", "multicam", "8", "Переключиться на угол камеры 8"),
  createMacShortcut("switch-camera-9", "Переключиться на камеру 9", "multicam", "9", "Переключиться на угол камеры 9"),

  // Инструменты
  createMacShortcut("selection-tool", "Инструмент выделения", "tools", "V", "Активировать инструмент выделения"),
  createMacShortcut("blade-tool", "Инструмент лезвие", "tools", "B", "Активировать инструмент разрезания"),
  createMacShortcut("zoom-tool", "Инструмент масштаб", "tools", "Z", "Активировать инструмент масштабирования"),
  createMacShortcut("hand-tool", "Инструмент рука", "tools", "H", "Активировать инструмент перемещения"),

  // Режимы редактирования (Edit Modes)
  createMacShortcut("edit-mode-select", "Режим выделения", "timeline", "V", "Переключить в режим выделения", "timeline"),
  createMacShortcut("edit-mode-trim", "Режим обрезки", "timeline", "T", "Переключить в режим обрезки", "timeline"),
  createMacShortcut("edit-mode-ripple", "Режим ripple", "timeline", "Q", "Переключить в режим ripple редактирования", "timeline"),
  createMacShortcut("edit-mode-roll", "Режим roll", "timeline", "W", "Переключить в режим roll редактирования", "timeline"),
  createMacShortcut("edit-mode-slip", "Режим slip", "timeline", "Y", "Переключить в режим slip редактирования", "timeline"),
  createMacShortcut("edit-mode-slide", "Режим slide", "timeline", "U", "Переключить в режим slide редактирования", "timeline"),
  createMacShortcut("edit-mode-split", "Режим разрезания", "timeline", "S", "Переключить в режим разрезания", "timeline"),
  createMacShortcut("edit-mode-rate", "Режим скорости", "timeline", "R", "Переключить в режим изменения скорости", "timeline"),
  createMacShortcut("edit-mode-escape", "Вернуться к выделению", "timeline", "Escape", "Вернуться к режиму выделения", "timeline"),

  // Speed Ramping
  createMacShortcut("enable-speed-ramping", "Включить speed ramping", "timeline", "⇧⌘R", "Включить speed ramping для выбранных клипов", "timeline"),
  createMacShortcut("reset-speed", "Сбросить скорость", "timeline", "⌥⌘R", "Сбросить скорость к нормальной", "timeline"),
  createMacShortcut("speed-half", "Скорость 0.5x", "timeline", "5", "Установить скорость 0.5x", "timeline"),
  createMacShortcut("speed-double", "Скорость 2x", "timeline", "2", "Установить скорость 2x", "timeline"),
  createMacShortcut("speed-quad", "Скорость 4x", "timeline", "4", "Установить скорость 4x", "timeline"),
  createMacShortcut("reverse-speed", "Обратная скорость", "timeline", "⌘R", "Инвертировать скорость клипа", "timeline"),

  // JL Cuts
  createMacShortcut("j-cut", "J-Cut", "timeline", "J", "Создать J-Cut (аудио начинается раньше видео)", "timeline"),
  createMacShortcut("l-cut", "L-Cut", "timeline", "L", "Создать L-Cut (аудио продолжается после видео)", "timeline"),
  createMacShortcut("j-cut-large", "J-Cut большой", "timeline", "⇧J", "Создать J-Cut с большим смещением", "timeline"),
  createMacShortcut("l-cut-large", "L-Cut большой", "timeline", "⇧L", "Создать L-Cut с большим смещением", "timeline"),
  createMacShortcut("reset-cut", "Сбросить монтаж", "timeline", "R", "Сбросить к прямому монтажу", "timeline"),
  createMacShortcut("link-clips", "Связать клипы", "timeline", "⌥⌘L", "Связать выбранные видео и аудио клипы", "timeline"),
  createMacShortcut("unlink-clips", "Разъединить клипы", "timeline", "⌥⌘U", "Разъединить связанные клипы", "timeline"),

  // Группировка
  createMacShortcut("group-clips", "Группировать клипы", "timeline", "⌘G", "Создать группу из выбранных клипов", "timeline"),
  createMacShortcut("ungroup-clips", "Разгруппировать", "timeline", "⇧⌘G", "Разгруппировать выбранные клипы", "timeline"),

  // Экспорт
  createMacShortcut("export-video", "Экспортировать видео", "export", "⌘E", "Открыть диалог экспорта видео"),
  createMacShortcut("quick-export", "Быстрый экспорт", "export", "⇧⌘E", "Экспортировать с последними настройками"),

  // Прочее
  createMacShortcut("show-help", "Справка", "other", "⌘?", "Показать справку"),
  createMacShortcut("toggle-ai-chat", "AI Ассистент", "other", "⌘I", "Открыть/закрыть AI ассистента"),
  
  // Браузер
  createMacShortcut("toggle-favorite", "Добавить в избранное", "browser", "F", "Добавить/удалить из избранного", "browser"),
  
  // AI Chat
  createMacShortcut("send-chat-message", "Отправить сообщение", "chat", "Enter", "Отправить сообщение в чат", "chat"),
]

// Экспортируем shortcuts по категориям для удобства
export const SHORTCUTS_BY_CATEGORY = DEFAULT_SHORTCUTS.reduce<Record<string, ShortcutDefinition[]>>((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = []
  }
  acc[shortcut.category].push(shortcut)
  return acc
}, {})
