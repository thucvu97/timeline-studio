# Media Studio - Техническая документация

[🇷🇺 Русская версия](./DEV.ru.md) | [🇺🇸 English version](./DEV.md)

## 📁 Структура файлов

### ✅ Полная реализованная структура
```
src/features/media-studio/
├── components/
│   ├── layout/
│   │   ├── __tests__/
│   │   │   ├── chat-layout.test.tsx ✅
│   │   │   ├── default-layout.test.tsx ✅
│   │   │   ├── layout-previews.test.tsx ✅
│   │   │   ├── layouts-markup.test.tsx ✅
│   │   │   ├── options-layout.test.tsx ✅
│   │   │   └── vertical-layout.test.tsx ✅
│   │   ├── chat-layout.tsx ✅
│   │   ├── default-layout.tsx ✅
│   │   ├── options-layout.tsx ✅
│   │   ├── vertical-layout.tsx ✅
│   │   ├── layout-previews.tsx ✅
│   │   ├── layouts-markup.tsx ✅
│   │   └── index.ts ✅
│   ├── media-studio.test.tsx ✅
│   ├── media-studio.tsx ✅
│   └── index.ts ✅
├── hooks/
│   ├── __tests__/
│   │   ├── use-auto-load-user-data.test.ts ✅
│   │   ├── use-auto-load-user-data-hook.test.ts ✅
│   │   └── use-auto-load-user-data-validation.test.ts ✅
│   ├── use-auto-load-user-data.ts ✅
│   ├── use-auto-load-media.ts ✅
│   ├── use-auto-load-resources.ts ✅
│   └── index.ts ✅
├── services/
│   ├── __tests__/
│   │   └── providers.test.tsx ✅
│   ├── providers.tsx ✅
│   ├── tauri-mock-provider.tsx ✅
│   └── index.ts ✅
├── utils/
│   └── validation.ts ✅
└── index.ts ✅
```


## 🏗️ Архитектура компонентов

### MediaStudio (корневой компонент)
**Файл**: `components/media-studio.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Корневой компонент приложения
- Управление макетами (default, options, vertical, chat)
- Интеграция TopBar и ModalContainer
- Автоматическая загрузка пользовательских данных через useAutoLoadUserData

### Providers
**Файл**: `services/providers.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Глобальные провайдеры контекста
- Обертка для всего приложения

### TauriMockProvider
**Файл**: `services/tauri-mock-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Мок-реализация для Tauri API
- Позволяет разработку без Tauri runtime

## 🪝 Хуки (Hooks)

### useAutoLoadUserData
**Файл**: `hooks/use-auto-load-user-data.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Автоматическая загрузка медиа файлов (видео, изображения)
- Загрузка музыкальных файлов
- Сканирование директорий для ресурсов (эффекты, переходы, фильтры) - временно отключено
- Валидация типов файлов
- Пакетная обработка для улучшенной производительности
- Кеширование результатов сканирования
- Интеграция с хуками управления состоянием (useMediaFiles, useMusicFiles)

### useAutoLoadMedia
**Файл**: `hooks/use-auto-load-media.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Выделенная логика загрузки медиа файлов
- Интеграция с состоянием медиа файлов

### useAutoLoadResources
**Файл**: `hooks/use-auto-load-resources.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Загрузка ресурсов (эффекты, фильтры, переходы)
- Загрузка шаблонов

## 📦 Макеты

### DefaultLayout
**Файл**: `components/layout/default-layout.tsx`
**Статус**: ✅ Полностью реализован

### VerticalLayout
**Файл**: `components/layout/vertical-layout.tsx`
**Статус**: ✅ Полностью реализован

### OptionsLayout
**Файл**: `components/layout/options-layout.tsx`
**Статус**: ✅ Полностью реализован

### ChatLayout
**Файл**: `components/layout/chat-layout.tsx`
**Статус**: ✅ Полностью реализован

## 🔗 Интеграция компонентов

### Основные компоненты
- TopBar
- Browser
- Timeline
- VideoPlayer
- Options
- ModalContainer

### Система макетов
```typescript
{layoutMode === "default" && <DefaultLayout />}
{layoutMode === "options" && <OptionsLayout />}
{layoutMode === "vertical" && <VerticalLayout />}
{layoutMode === "chat" && <ChatLayout />}
```

## 📋 Последние изменения

### Рефакторинг структуры (2025)
- Перемещение компонентов макетов в `components/layout/`
- Создание директории `hooks/` и перенос `use-auto-load-user-data` из `services/`
- Добавление нового `ChatLayout` для интеграции AI ассистента
- Улучшенная структура тестов с разделением по типам (components, hooks, services)
- Добавлены утилиты в `utils/validation.ts`

### Улучшения useAutoLoadUserData
- Поддержка загрузки медиа и музыкальных файлов
- Интеграция с хуками управления состоянием
- Сканирование директорий для различных типов ресурсов (временно отключено)
- Механизм кеширования и пакетной обработки
- Разделение на несколько специализированных хуков

### Тестовое покрытие
- Полное покрытие всех компонентов макетов
- Тесты для хука useAutoLoadUserData и связанной функциональности
- Реорганизация тестов в соответствии с новой структурой
- Дополнительные тесты валидации