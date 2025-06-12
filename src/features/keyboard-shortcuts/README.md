# Keyboard Shortcuts Module

Модуль для управления клавиатурными сочетаниями в приложении Timeline Studio.

## 📁 Структура модуля

```
keyboard-shortcuts/
├── components/
│   ├── shortcut-handler.tsx      # Компонент для регистрации shortcuts
│   └── keyboard-shortcuts-modal.tsx # UI для управления shortcuts
├── constants/
│   └── default-shortcuts.ts      # Дефолтные клавиатурные сочетания
├── hooks/
│   ├── use-app-hotkeys.tsx      # Основной хук для shortcuts (deprecated)
│   └── use-panel-shortcuts.ts   # Хук для shortcuts панелей
├── presets/
│   ├── timeline-preset.ts       # Предустановка Timeline
│   ├── filmora-preset.ts        # Предустановка Filmora
│   └── premiere-preset.ts       # Предустановка Premiere
├── services/
│   ├── shortcuts-registry.ts    # Централизованный реестр shortcuts
│   └── shortcuts-provider.tsx   # React провайдер для shortcuts
└── types/
    └── shortcuts.ts             # TypeScript типы
```

## 🏗️ Архитектура

### Централизованный реестр (ShortcutsRegistry)

Singleton класс для управления всеми клавиатурными сочетаниями:

```typescript
const registry = ShortcutsRegistry.getInstance()

// Регистрация shortcut
registry.register({
  id: "save-project",
  name: "Сохранить проект",
  category: "file",
  keys: ["⌘S", "cmd+s", "ctrl+s"],
  action: (event) => { /* ... */ }
})

// Получение shortcuts
const allShortcuts = registry.getAll()
const fileShortcuts = registry.getByCategory("file")
```

### ShortcutsProvider

React провайдер для интеграции с компонентами:

```tsx
<ShortcutsProvider>
  <App />
</ShortcutsProvider>
```

### useShortcuts хук

```typescript
const {
  shortcuts,           // Все зарегистрированные shortcuts
  isEnabled,          // Глобальное состояние активности
  toggleShortcuts,    // Включить/выключить shortcuts
  updateShortcutKeys, // Изменить клавиши для shortcut
  resetShortcut,      // Сбросить к дефолтным значениям
  resetAllShortcuts   // Сбросить все shortcuts
} = useShortcuts()
```

## 🎯 Основные возможности

### ✅ Реализовано

1. **Централизованная регистрация** - Все shortcuts в одном месте
2. **Множественные комбинации** - Поддержка разных вариантов для одного действия
3. **Категоризация** - Группировка по категориям (файл, вид, таймлайн и т.д.)
4. **UI для управления** - Модальное окно для просмотра и редактирования
5. **Предустановки** - Timeline, Filmora, Premiere
6. **Поиск** - По названию или комбинации клавиш
7. **Локализация** - Поддержка i18n

### ❌ Требует реализации

1. **Персистентность** - Сохранение пользовательских настроек
2. **Конфликты** - Определение и разрешение конфликтов клавиш
3. **Экспорт/Импорт** - Сохранение и загрузка настроек
4. **Контекстные shortcuts** - Разные shortcuts для разных режимов
5. **Визуальные подсказки** - Отображение shortcuts в UI элементах

## 📝 Использование

### Регистрация нового shortcut

```typescript
// В constants/default-shortcuts.ts
export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  createMacShortcut(
    "my-action",
    "Мое действие",
    "category",
    "⌘K",
    "Описание действия"
  ),
  // ...
]

// В shortcuts-provider.tsx или отдельном хуке
case "my-action":
  return {
    ...shortcut,
    action: (event: KeyboardEvent) => {
      event.preventDefault()
      // Ваше действие
    },
  }
```

### Использование в компоненте

```tsx
function MyComponent() {
  const { shortcuts, updateShortcutKeys } = useShortcuts()
  
  const saveShortcut = shortcuts.find(s => s.id === "save-project")
  
  return (
    <div>
      <span>Сохранить: {saveShortcut?.keys[0]}</span>
      <button onClick={() => updateShortcutKeys("save-project", ["⌘S"])}>
        Изменить
      </button>
    </div>
  )
}
```

## 🔧 Категории shortcuts

1. **settings** - Настройки приложения
2. **file** - Файловые операции
3. **edit** - Редактирование
4. **view** - Управление видом
5. **timeline** - Операции с таймлайном
6. **playback** - Управление воспроизведением
7. **tools** - Инструменты
8. **markers** - Маркеры
9. **export** - Экспорт
10. **other** - Прочее

## ⚙️ Настройки

### Опции для shortcuts

```typescript
{
  enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"], // Работает в полях ввода
  preventDefault: true,                               // Предотвращать дефолтное поведение
  enabled: true,                                      // Активность shortcut
}
```

### Форматы клавиш

- macOS символы: `⌘`, `⌥`, `⇧`, `⌃`
- Текстовые: `cmd`, `command`, `meta`, `alt`, `option`, `shift`, `ctrl`
- Модификатор `mod` - автоматически `cmd` на macOS, `ctrl` на Windows/Linux

## 🧪 Тестирование

```bash
# Запуск тестов
bun test src/features/keyboard-shortcuts/

# Проверка регистрации shortcuts
bun test shortcuts-registry.test.ts

# Проверка UI компонентов
bun test keyboard-shortcuts-modal.test.tsx
```

## 🚀 Планы развития

1. **Сохранение настроек** в localStorage/файловой системе
2. **Контекстная активация** - разные shortcuts для разных режимов работы
3. **Визуальные индикаторы** - показ shortcuts рядом с кнопками
4. **Запись макросов** - последовательности действий на одну клавишу
5. **Профили shortcuts** - быстрое переключение между наборами
6. **Облачная синхронизация** настроек между устройствами