# Media Studio - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/media-studio/
├── components/
│   ├── layout/
│   │   ├── chat-layout.tsx ✅
│   │   ├── default-layout.tsx ✅
│   │   ├── dual-layout.tsx ✅
│   │   ├── options-layout.tsx ✅
│   │   ├── vertical-layout.tsx ✅
│   │   ├── layout-previews.tsx ✅
│   │   ├── layouts-markup.tsx ✅
│   │   └── index.ts ✅
│   └── media-studio.tsx ✅
├── hooks/
│   ├── use-auto-load-user-data.ts ✅
│   └── index.ts ✅
├── services/
│   └── providers.tsx ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие
```
__tests__/
├── components/
│   ├── layout/
│   │   ├── chat-layout.test.tsx ✅
│   │   ├── default-layout.test.tsx ✅
│   │   ├── options-layout.test.tsx ✅
│   │   ├── vertical-layout.test.tsx ✅
│   │   ├── layout-previews.test.tsx ✅
│   │   └── layouts-markup.test.tsx ✅
│   └── media-studio.test.tsx ✅
├── hooks/
│   └── use-auto-load-user-data.test.ts ✅
└── services/
    └── providers.test.tsx ✅
```

## 🏗️ Архитектура компонентов

### MediaStudio (корневой компонент)
**Файл**: `components/media-studio.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Корневой компонент приложения
- Управление макетами (default, options, vertical, dual, chat)
- Интеграция TopBar и ModalContainer
- Автоматическая загрузка пользовательских данных через useAutoLoadUserData

### Providers
**Файл**: `services/providers.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Глобальные провайдеры контекста
- Обертка для всего приложения

## 🪝 Хуки (Hooks)

### useAutoLoadUserData
**Файл**: `hooks/use-auto-load-user-data.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Автоматическая загрузка медиа файлов (видео, изображения)
- Загрузка музыкальных файлов
- Сканирование директорий для ресурсов (эффекты, переходы, фильтры)
- Валидация типов файлов
- Пакетная обработка для улучшенной производительности
- Кеширование результатов сканирования
- Интеграция с хуками управления состоянием (useMediaFiles, useMusicFiles)

## 📦 Макеты

### DefaultLayout
**Файл**: `components/layout/default-layout.tsx`
**Статус**: ✅ Полностью реализован

### DualLayout
**Файл**: `components/layout/dual-layout.tsx`
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

**Функционал**:
- Интеграция AI чата рядом с медиа студией
- Использует ResizablePanelGroup для гибкого макета
- Левая сторона: Browser, VideoPlayer, Options, Timeline
- Правая сторона: AI Chat компонент
- Адаптивная видимость компонентов на основе настроек

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
{layoutMode === "dual" && <DualLayout />}
{layoutMode === "chat" && <ChatLayout />}
```

## 📋 Последние изменения

### Рефакторинг структуры (2025)
- Перемещение компонентов макетов в `components/layout/`
- Создание директории `hooks/` и перенос `use-auto-load-user-data` из `services/`
- Добавление нового `ChatLayout` для интеграции AI ассистента
- Улучшенная структура тестов с разделением по типам (components, hooks, services)

### Улучшения useAutoLoadUserData
- Поддержка загрузки медиа и музыкальных файлов
- Интеграция с хуками управления состоянием
- Сканирование директорий для различных типов ресурсов
- Механизм кеширования и пакетной обработки

### Тестовое покрытие
- Полное покрытие всех компонентов макетов
- Тесты для нового хука useAutoLoadUserData
- Реорганизация тестов в соответствии с новой структурой
