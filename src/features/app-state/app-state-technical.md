# App State - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/app-state/
├── app-settings-machine.ts ✅
├── app-settings-provider.tsx ✅
├── store-service.ts ✅
├── types.ts ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие
```
├── app-settings-machine.test.ts ✅
├── app-settings-provider.test.tsx ✅
```

## 🔧 Машина состояний

### AppSettingsMachine
**Файл**: `app-settings-machine.ts`
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

## 🏗️ Архитектура

### AppSettingsProvider
**Файл**: `app-settings-provider.tsx`
**Статус**: ✅ Полностью реализован

### StoreService
**Файл**: `store-service.ts`
**Статус**: ✅ Полностью реализован

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
