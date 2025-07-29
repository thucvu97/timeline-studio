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
│   └── use-panel-shortcuts.ts   # Хук для shortcuts панелей
├── presets/
│   ├── index.ts                 # Экспорт всех preset функций
│   ├── types.ts                 # TypeScript типы для presets
│   ├── timeline-preset.ts       # Предустановка Timeline Studio
│   ├── filmora-preset.ts        # Предустановка Wondershare Filmora
│   └── premiere-preset.ts       # Предустановка Adobe Premiere Pro (119 shortcuts)
├── services/
│   ├── shortcuts-registry.ts    # Централизованный реестр shortcuts
│   ├── shortcuts-provider.tsx   # React провайдер для shortcuts
│   └── tauri-global-shortcuts.ts # Сервис для глобальных shortcuts через Tauri
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
5. **Предустановки** - Timeline Studio, Wondershare Filmora, Adobe Premiere Pro (119 shortcuts)
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

1. **preferences** - Настройки приложения
2. **file** - Файловые операции (создание, сохранение, импорт)
3. **edit** - Редактирование (отмена, копирование, вставка)
4. **tools** - Инструменты (разделение, группировка, поворот)
5. **markers** - Цветные маркеры (красный, оранжевый, желтый и т.д.)
6. **advanced-tools** - Продвинутые инструменты (трекинг, вставка, замена)
7. **audio** - Аудио функции (растяжение, избранное, составные клипы)
8. **subtitles** - Субтитры (разделение, объединение)
9. **playback** - Управление воспроизведением (воспроизведение, стоп, кадры)
10. **navigation** - Навигация (переход к маркерам, масштабирование)
11. **timeline** - Операции с таймлайном (прокрутка, направляющие)
12. **markers-multicam** - Маркеры и мультикамера (отметки, углы камер)
13. **miscellaneous** - Прочее (помощь, экспорт)

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
# Запуск всех тестов модуля
bun test src/features/keyboard-shortcuts/

# Проверка Adobe Premiere preset
bun test src/features/keyboard-shortcuts/__tests__/presets/premiere-preset.test.ts

# Запуск тестов с покрытием
bun test:coverage src/features/keyboard-shortcuts/
```

### Покрытие тестами

- ✅ **Adobe Premiere Preset** - 17 тестов, полное покрытие всех 119 shortcuts
- ❌ **Timeline Preset** - тесты отсутствуют  
- ❌ **Filmora Preset** - тесты отсутствуют
- ❌ **ShortcutsRegistry** - тесты отсутствуют
- ❌ **ShortcutsProvider** - тесты отсутствуют

## 🚀 Планы развития

1. **Сохранение настроек** в localStorage/файловой системе
2. **Контекстная активация** - разные shortcuts для разных режимов работы
3. **Визуальные индикаторы** - показ shortcuts рядом с кнопками
4. **Запись макросов** - последовательности действий на одну клавишу
5. **Профили shortcuts** - быстрое переключение между наборами
6. **Облачная синхронизация** настроек между устройствами