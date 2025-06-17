# Keyboard Shortcuts - Техническая документация

## 🏗️ Архитектура модуля

### Основные компоненты

1. **ShortcutsRegistry** - Централизованный singleton для управления shortcuts
2. **ShortcutsProvider** - React контекст провайдер
3. **ShortcutHandler** - Компонент для регистрации отдельного shortcut
4. **KeyboardShortcutsModal** - UI для управления shortcuts

### Поток данных

```
DEFAULT_SHORTCUTS
      ↓
ShortcutsRegistry (singleton)
      ↓
ShortcutsProvider (context)
      ↓
ShortcutHandler (регистрация)
      ↓
react-hotkeys-hook (обработка)
```

## 📦 Типы данных

### ShortcutDefinition

```typescript
interface ShortcutDefinition {
  id: string                    // Уникальный идентификатор
  name: string                  // Локализованное название
  category: string              // Категория (file, edit, view и т.д.)
  keys: string[]                // Массив возможных комбинаций
  description?: string          // Описание действия
  action?: HotkeyCallback       // Функция-обработчик
  options?: HotkeyOptions       // Опции для react-hotkeys-hook
  enabled?: boolean             // Активность shortcut
}
```

### ShortcutCategory

```typescript
interface ShortcutCategory {
  id: string      // Идентификатор категории
  name: string    // Локализованное название
  order: number   // Порядок отображения
}
```

## 🔧 API

### ShortcutsRegistry

```typescript
class ShortcutsRegistry {
  // Singleton instance
  static getInstance(): ShortcutsRegistry
  
  // Регистрация
  register(shortcut: ShortcutDefinition): void
  registerMany(shortcuts: ShortcutDefinition[]): void
  
  // Получение данных
  get(id: string): ShortcutDefinition | undefined
  getAll(): ShortcutDefinition[]
  getByCategory(categoryId: string): ShortcutDefinition[]
  getCategories(): ShortcutCategory[]
  
  // Изменение
  updateKeys(id: string, keys: string[]): void
  toggleEnabled(id: string): void
  reset(id: string): void
  resetAll(): void
  
  // Подписка на изменения
  subscribe(listener: (shortcuts: ShortcutDefinition[]) => void): () => void
  
  // Очистка (для тестов)
  clear(): void
}
```

### useShortcuts хук

```typescript
interface ShortcutsContextType {
  shortcuts: ShortcutDefinition[]
  isEnabled: boolean
  toggleShortcuts: (enabled: boolean) => void
  updateShortcutKeys: (id: string, keys: string[]) => void
  resetShortcut: (id: string) => void
  resetAllShortcuts: () => void
}
```

## 🎯 Интеграция

### Добавление нового shortcut

1. Добавить определение в `constants/default-shortcuts.ts`:

```typescript
createMacShortcut(
  "my-new-action",              // ID
  "Мое новое действие",         // Название
  "category",                   // Категория
  "⌘K",                        // Основная комбинация
  "Описание действия"           // Описание
)
```

2. Добавить обработчик в `shortcuts-provider.tsx` или создать отдельный хук:

```typescript
case "my-new-action":
  return {
    ...shortcut,
    action: (event: KeyboardEvent) => {
      event.preventDefault()
      // Логика действия
    },
  }
```

### Использование в компоненте

```tsx
import { useShortcuts } from "@/features/keyboard-shortcuts"

function MyComponent() {
  const { shortcuts } = useShortcuts()
  
  // Найти конкретный shortcut
  const saveShortcut = shortcuts.find(s => s.id === "save-project")
  
  // Отобразить комбинацию клавиш
  return <span>{saveShortcut?.keys[0]}</span>
}
```

### Интеграция с существующими действиями

Для подключения shortcuts к существующим действиям создайте хук:

```typescript
export function useMyFeatureShortcuts() {
  const { doAction } = useMyFeature()
  
  useEffect(() => {
    const shortcut = shortcutsRegistry.get("my-action")
    if (shortcut) {
      shortcut.action = (event) => {
        event.preventDefault()
        doAction()
      }
      shortcutsRegistry.register(shortcut)
    }
  }, [doAction])
}
```

## 🐛 Известные проблемы и решения

### 1. Множественная регистрация

**Проблема**: Старый код регистрировал одну комбинацию 5 раз.

**Решение**: Используйте массив `keys` в `ShortcutDefinition`:

```typescript
keys: ["⌘S", "cmd+s", "ctrl+s", "meta+s"]
```

### 2. React hooks в циклах

**Проблема**: Нельзя вызывать `useHotkeys` в цикле.

**Решение**: Используйте компонент `ShortcutHandler` для каждого shortcut.

### 3. Конфликты клавиш

**Проблема**: Разные shortcuts могут использовать одинаковые клавиши.

**Решение**: TODO - Реализовать систему определения конфликтов.

## 🧪 Тестирование

### Актуальные тесты

#### Adobe Premiere Preset (✅ Полное покрытие)
- **Файл**: `__tests__/presets/premiere-preset.test.ts`
- **Количество тестов**: 17
- **Покрытие**: Все 119 shortcuts в 12 категориях

```bash
# Запуск тестов Adobe Premiere preset
bun test src/features/keyboard-shortcuts/__tests__/presets/premiere-preset.test.ts
```

### Требуют реализации

#### ShortcutsRegistry тесты
```typescript
describe("ShortcutsRegistry", () => {
  beforeEach(() => {
    shortcutsRegistry.clear()
  })
  
  it("should register shortcut", () => {
    const shortcut = {
      id: "test",
      name: "Test",
      category: "other",
      keys: ["t"]
    }
    
    shortcutsRegistry.register(shortcut)
    expect(shortcutsRegistry.get("test")).toEqual(shortcut)
  })
})
```

#### ShortcutsProvider тесты
```typescript
describe("ShortcutsProvider", () => {
  it("should provide shortcuts context", () => {
    const { result } = renderHook(() => useShortcuts(), {
      wrapper: ShortcutsProvider
    })
    
    expect(result.current.shortcuts).toBeDefined()
    expect(result.current.isEnabled).toBe(true)
  })
})
```

#### Timeline и Filmora Preset тесты
- Создать аналогичные тесты по образцу premiere-preset.test.ts
- Проверить уникальность shortcuts между presets
- Валидация клавиатурных комбинаций

## 🔍 Отладка

### Логирование shortcuts

```typescript
// Включить отладку в ShortcutsRegistry
const DEBUG = true

if (DEBUG) {
  console.log("Registering shortcut:", shortcut)
}
```

### Проверка активных shortcuts

```typescript
// В консоли браузера
window.__shortcuts__ = shortcutsRegistry.getAll()
console.table(window.__shortcuts__)
```

## 📈 Производительность

### Оптимизации

1. **Lazy loading** - Загружать shortcuts по требованию
2. **Мемоизация** - Кешировать результаты поиска
3. **Debounce** - Отложенное обновление при изменении клавиш

### Рекомендации

1. Не регистрировать shortcuts в рендере компонентов
2. Использовать `useEffect` для регистрации
3. Отписываться от подписок при размонтировании

## 🚀 Планы улучшений

1. **Персистентность**
   - Сохранение в localStorage
   - Синхронизация с файловой системой через Tauri

2. **Конфликты**
   - Автоматическое определение
   - UI для разрешения конфликтов

3. **Контекстность**
   - Разные shortcuts для разных режимов
   - Динамическое включение/выключение

4. **Визуализация**
   - Подсказки в tooltips
   - Cheat sheet генерация

5. **Макросы**
   - Запись последовательности действий
   - Воспроизведение по shortcut

## 🌍 Локализация

### Поддерживаемые языки

Adobe Premiere shortcuts полностью переведены на:

- ✅ **Русский (ru)** - Полная локализация
- ✅ **Английский (en)** - Базовая локализация  
- ✅ **Испанский (es)** - Полная локализация + исправлены дубли
- ✅ **Французский (fr)** - Полная локализация
- ✅ **Немецкий (de)** - Полная локализация
- ✅ **Португальский (pt)** - Локализация обновлена пользователем
- ✅ **Тайский (th)** - Содержал все необходимые переводы

### Структура переводов

Переводы находятся в `/src/i18n/locales/{lang}.json`:

```json
{
  "dialogs": {
    "keyboardShortcuts": {
      "categories": {
        "advanced-tools": "Erweiterte Werkzeuge",
        "audio": "Audio",
        "navigation": "Navigation",
        "timeline": "Timeline", 
        "markers-multicam": "Marker und Multicam",
        "miscellaneous": "Verschiedenes"
      },
      "shortcuts": {
        "archive": "Archivieren",
        "enable-disable": "Clip aktivieren/deaktivieren",
        "multicam-angle-1": "Video-Winkel 1 umschalten",
        "help": "Hilfe",
        "export": "Exportieren"
      }
    }
  }
}
```

### Добавление нового языка

1. Скопировать структуру из `en.json`
2. Перевести категории в `categories`
3. Перевести действия в `shortcuts`
4. Протестировать preset функции