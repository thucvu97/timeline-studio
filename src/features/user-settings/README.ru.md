# User Settings - Функциональные требования

## 📋 Статус готовности

- ✅ **Компоненты**: Полностью реализованы
- ✅ **Сервисы**: Машина состояний и провайдер готовы
- ✅ **Хуки**: Хук useUserSettings вынесен и протестирован
- ✅ **Тесты**: Покрыты тестами
- ✅ **Основная логика**: Управление пользовательскими настройками

## 🎯 Основные функции

### ✅ Готово

#### Управление интерфейсом
- [x] Переключение активной вкладки браузера
- [x] Изменение макета интерфейса (default, options, vertical, dual)
- [x] Переключение видимости браузера
- [x] Горячие клавиши (Cmd+B)

#### Настройки путей
- [x] Настройка пути для сохранения скриншотов
- [x] Настройка пути для скриншотов плеера
- [x] Валидация путей

#### Настройки медиа
- [x] Регулировка громкости плеера (0-100)
- [x] Сохранение настроек громкости

#### API интеграция
- [x] Настройка API ключа OpenAI
- [x] Настройка API ключа Claude
- [x] Безопасное хранение ключей
- [x] Скрытие ключей в логах

#### Интерфейс настроек
- [x] UserSettingsModal - модальное окно настроек
- [x] Формы для всех настроек
- [x] Валидация ввода
- [x] Мгновенное применение изменений

## 🔧 Техническая реализация

### Архитектура
- **XState машина состояний** для управления настройками
- **React Context** для предоставления данных компонентам
- **Tauri Store** для персистентного хранения
- **TypeScript** для типизации

### Состояние
```typescript
interface UserSettingsContext {
  activeTab: BrowserTab           // Активная вкладка
  layoutMode: LayoutMode          // Макет интерфейса
  screenshotsPath: string         // Путь скриншотов
  playerScreenshotsPath: string   // Путь скриншотов плеера
  playerVolume: number            // Громкость плеера
  openAiApiKey: string           // API ключ OpenAI
  claudeApiKey: string           // API ключ Claude
  isBrowserVisible: boolean      // Видимость браузера
}
```

### События машины состояний
- `UPDATE_ACTIVE_TAB` - Смена активной вкладки
- `UPDATE_LAYOUT` - Смена макета
- `UPDATE_SCREENSHOTS_PATH` - Изменение пути скриншотов
- `UPDATE_PLAYER_SCREENSHOTS_PATH` - Изменение пути скриншотов плеера
- `UPDATE_PLAYER_VOLUME` - Изменение громкости
- `UPDATE_OPENAI_API_KEY` - Изменение API ключа OpenAI
- `UPDATE_CLAUDE_API_KEY` - Изменение API ключа Claude
- `TOGGLE_BROWSER_VISIBILITY` - Переключение видимости браузера

## 🎣 Использование

### Базовое использование
```typescript
import { useUserSettings } from '@/features/user-settings';

function MyComponent() {
  const {
    activeTab,
    layoutMode,
    playerVolume,
    handleTabChange,
    handleLayoutChange,
    handlePlayerVolumeChange
  } = useUserSettings();

  return (
    <div>
      <p>Активная вкладка: {activeTab}</p>
      <p>Макет: {layoutMode}</p>
      <p>Громкость: {playerVolume}</p>

      <button onClick={() => handleTabChange('media')}>
        Переключить на медиа
      </button>

      <button onClick={() => handleLayoutChange('vertical')}>
        Вертикальный макет
      </button>

      <input
        type="range"
        min="0"
        max="100"
        value={playerVolume}
        onChange={(e) => handlePlayerVolumeChange(Number(e.target.value))}
      />
    </div>
  );
}
```

### Провайдер
```typescript
import { UserSettingsProvider } from '@/features/user-settings';

function App() {
  return (
    <UserSettingsProvider>
      <MyComponent />
    </UserSettingsProvider>
  );
}
```

## 🔗 Интеграция с другими компонентами

### MediaStudio
- Использует `layoutMode` для выбора макета интерфейса
- Реагирует на изменения макета в реальном времени

### Browser
- Использует `activeTab` для отображения активной вкладки
- Использует `isBrowserVisible` для показа/скрытия

### VideoPlayer
- Использует `playerVolume` для установки громкости
- Использует `playerScreenshotsPath` для сохранения скриншотов

### AI Chat
- Использует `openAiApiKey` и `claudeApiKey` для API запросов
- Проверяет наличие ключей перед отправкой запросов

## 🧪 Тестирование

### Запуск тестов
```bash
bun test src/features/user-settings
```

### Покрытие
- Машина состояний: 100%
- Провайдер: 95%
- Хуки: 100%
- Компоненты: 90%

## 🚀 Будущие улучшения

### Планируемые функции
- [ ] Импорт/экспорт настроек
- [ ] Профили настроек
- [ ] Синхронизация между устройствами
- [ ] Темы интерфейса
- [ ] Расширенные горячие клавиши

### Оптимизации
- [ ] Дебаунс для частых изменений
- [ ] Кэширование настроек
- [ ] Валидация API ключей
- [ ] Автоматическое резервное копирование

**Версия:** 0.60.1
**Последнее обновление:** 1 августа 2025
**Разработано с ❤️ командой Timeline Studio**
