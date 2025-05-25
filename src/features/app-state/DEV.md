# App State - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/app-state/
├── services/
│   ├── app-settings-machine.ts ✅
│   ├── app-settings-machine.test.ts ✅
│   ├── app-settings-provider.tsx ✅
│   ├── app-settings-provider.test.tsx ✅
│   ├── store-service.ts ✅
│   └── index.ts ✅
├── hooks/
│   ├── use-app-settings.ts ✅
│   ├── use-app-settings.test.ts ✅
│   ├── use-recent-projects.ts ✅
│   ├── use-favorites.ts ✅
│   ├── use-current-project.ts ✅
│   ├── use-media-files.ts ✅
│   └── index.ts ✅
├── types/
│   ├── types.ts ✅
│   └── index.ts ✅
├── DEV.md ✅
├── README.md ✅
└── index.ts ✅
```

## 🔧 Машина состояний

### AppSettingsMachine
**Файл**: `services/app-settings-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:
```typescript
interface AppSettingsContext {
  theme: 'light' | 'dark'
  language: string
  autoSave: boolean
  recentProjects: string[]
  preferences: UserPreferences
}
```

## 🎣 Хуки

### useAppSettings
**Файл**: `hooks/use-app-settings.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Доступ к контексту настроек приложения
- Валидация использования внутри провайдера
- TypeScript типизация

### useRecentProjects
**Файл**: `hooks/use-recent-projects.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Управление списком недавних проектов
- Добавление/удаление проектов
- Очистка списка

### useFavorites
**Файл**: `hooks/use-favorites.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Управление избранными элементами
- Добавление/удаление из избранного
- Обновление избранного

### useCurrentProject
**Файл**: `hooks/use-current-project.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Управление текущим проектом
- Создание/открытие/сохранение проектов
- Отслеживание изменений

### useMediaFiles
**Файл**: `hooks/use-media-files.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Управление медиа-файлами в состоянии
- Обновление списка файлов

## 🏗️ Архитектура

### AppSettingsProvider
**Файл**: `services/app-settings-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- React Context для состояния приложения
- Интеграция с AppSettingsMachine
- Методы для работы с проектами и настройками
- Диалог восстановления медиафайлов

### StoreService
**Файл**: `services/store-service.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Сохранение и загрузка настроек
- Работа с локальным хранилищем

## 📦 Типы данных

### AppSettings
```typescript
interface AppSettings {
  theme: 'light' | 'dark'
  language: string
  autoSave: boolean
  recentProjects: string[]
}
```
