# User Settings - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/user-settings/
├── services/
│   ├── user-settings-machine.ts ✅
│   ├── user-settings-machine.test.ts ✅
│   ├── user-settings-provider.tsx ✅
│   ├── user-settings-provider.test.tsx ✅
│   └── index.ts ✅
├── hooks/
│   ├── use-user-settings.ts ✅
│   ├── use-user-settings.test.ts ✅
│   └── index.ts ✅
├── components/
│   ├── user-settings-modal.tsx ✅
│   ├── user-settings-modal.test.tsx ✅
│   └── index.ts ✅
├── DEV.md ✅
├── README.md ✅
└── index.ts ✅
```

## 🔧 Машина состояний

### UserSettingsMachine
**Файл**: `services/user-settings-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:
```typescript
interface UserSettingsContext {
  activeTab: BrowserTab
  layoutMode: LayoutMode
  screenshotsPath: string
  playerScreenshotsPath: string
  playerVolume: number
  openAiApiKey: string
  claudeApiKey: string
  isBrowserVisible: boolean
}
```

**События**:
- `UPDATE_ACTIVE_TAB` - Изменение активной вкладки
- `UPDATE_LAYOUT` - Изменение макета интерфейса
- `UPDATE_SCREENSHOTS_PATH` - Изменение пути скриншотов
- `UPDATE_PLAYER_SCREENSHOTS_PATH` - Изменение пути скриншотов плеера
- `UPDATE_PLAYER_VOLUME` - Изменение громкости плеера
- `UPDATE_OPENAI_API_KEY` - Изменение API ключа OpenAI
- `UPDATE_CLAUDE_API_KEY` - Изменение API ключа Claude
- `TOGGLE_BROWSER_VISIBILITY` - Переключение видимости браузера

## 🎣 Хуки

### useUserSettings
**Файл**: `hooks/use-user-settings.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Доступ к контексту пользовательских настроек
- Валидация использования внутри провайдера
- TypeScript типизация
- Методы для изменения всех настроек

**Возвращаемые данные**:
- `activeTab` - Активная вкладка браузера
- `layoutMode` - Текущий макет интерфейса
- `screenshotsPath` - Путь для скриншотов
- `playerScreenshotsPath` - Путь для скриншотов плеера
- `playerVolume` - Громкость плеера
- `openAiApiKey` - API ключ OpenAI
- `claudeApiKey` - API ключ Claude
- `isBrowserVisible` - Видимость браузера

**Методы**:
- `handleTabChange` - Изменение активной вкладки
- `handleLayoutChange` - Изменение макета
- `handleScreenshotsPathChange` - Изменение пути скриншотов
- `handlePlayerScreenshotsPathChange` - Изменение пути скриншотов плеера
- `handlePlayerVolumeChange` - Изменение громкости
- `handleAiApiKeyChange` - Изменение API ключа OpenAI
- `handleClaudeApiKeyChange` - Изменение API ключа Claude
- `toggleBrowserVisibility` - Переключение видимости браузера

## 🏗️ Архитектура

### UserSettingsProvider
**Файл**: `services/user-settings-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- React Context для пользовательских настроек
- Интеграция с UserSettingsMachine
- Горячие клавиши (Cmd+B для переключения браузера)
- Валидация входных данных

### UserSettingsModal
**Файл**: `components/user-settings-modal.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Модальное окно настроек пользователя
- Интерфейс для изменения всех настроек
- Интеграция с useUserSettings хуком

## 🧪 Тестирование

### Покрытие тестами
- ✅ `user-settings-machine.test.ts` - Тесты машины состояний
- ✅ `user-settings-provider.test.tsx` - Тесты провайдера
- ✅ `user-settings-modal.test.tsx` - Тесты модального окна
- ✅ `use-user-settings.test.ts` - Тесты хука

## 🔗 Интеграция

### Горячие клавиши
- `Cmd+B` / `Ctrl+B` - Переключение видимости браузера

### Связанные компоненты
- `MediaStudio` - Использует layoutMode для выбора макета
- `Browser` - Использует activeTab и isBrowserVisible
- `VideoPlayer` - Использует playerVolume
- `AI Chat` - Использует API ключи
