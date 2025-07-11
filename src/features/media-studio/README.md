# Media Studio Module

## 📋 Обзор

Media Studio - это основной модуль приложения Timeline Studio, который объединяет все компоненты редактора в единый интерфейс. Модуль предоставляет корневой компонент приложения, систему макетов и провайдеры состояния.

## 🏗️ Архитектура

### Структура модуля

```
src/features/media-studio/
├── components/
│   ├── media-studio.tsx          # Корневой компонент
│   └── layout/
│       ├── default-layout.tsx    # Стандартный макет
│       ├── vertical-layout.tsx   # Вертикальный макет
│       ├── options-layout.tsx    # Макет с панелью опций
│       ├── chat-layout.tsx       # Макет с AI-чатом
│       ├── layout-previews.tsx   # Компонент выбора макетов
│       └── layouts-markup.tsx    # Визуальные превью макетов
├── hooks/
│   └── use-auto-load-user-data.ts # Автозагрузка данных
├── services/
│   └── providers.tsx             # Глобальные провайдеры
└── __tests__/                    # Тесты компонентов
```

## 🎯 Основные функции

### MediaStudio Component

Корневой компонент приложения, который:
- Инициализирует все провайдеры через `Providers`
- Рендерит выбранный макет на основе настроек пользователя
- Управляет автозагрузкой пользовательских данных
- Отображает состояние загрузки

### Система макетов (Layouts)

#### DefaultLayout
- Классический макет с браузером слева, видео в центре, таймлайном внизу
- Адаптивен к видимости панелей через `useUserSettings`

#### VerticalLayout
- Вертикальное расположение с видео справа
- Оптимизирован для работы с вертикальным контентом

#### OptionsLayout
- Включает панель опций справа
- Адаптивное скрытие/показ панели опций

#### ChatLayout
- Интегрирует AI-чат справа
- Поддерживает все комбинации видимости панелей

### Hooks

#### useAutoLoadUserData
- Автоматическая загрузка медиа файлов при старте
- Сканирование директорий проекта
- Валидация и добавление ресурсов (эффекты, фильтры, переходы)
- Поддержка работы без Tauri (веб-версия)

### Провайдеры (Providers)

Компонент `Providers` объединяет все необходимые контекст-провайдеры:
- `AppStateProvider` - глобальное состояние приложения
- `UserSettingsProvider` - пользовательские настройки
- `ModalProvider` - управление модальными окнами
- `CommandProvider` - обработка горячих клавиш
- Другие провайдеры функций

## 🔌 Интеграция

### Используемые модули
- `@/features/top-bar` - верхняя панель управления
- `@/features/browser` - браузер медиа файлов
- `@/features/timeline` - временная шкала
- `@/features/video-player` - видеоплеер
- `@/features/ai-chat` - AI ассистент
- `@/features/options` - панель опций
- `@/features/user-settings` - настройки пользователя
- `@/features/modals` - модальные окна

### API

```typescript
// Основной компонент
export function MediaStudio(): JSX.Element

// Провайдеры
export function Providers({ children }: PropsWithChildren): JSX.Element

// Хуки
export function useAutoLoadUserData(): {
  isLoading: boolean
  error: Error | null
  data: UserData | null
}
```

## 🧪 Тестирование

Модуль имеет полное покрытие тестами:
- **65 тестов** в 9 файлах
- Тесты компонентов, макетов, хуков и сервисов
- Моки для всех внешних зависимостей
- Интеграционные тесты для провайдеров

## 📝 Примеры использования

```tsx
// В корне приложения
import { MediaStudio } from '@/features/media-studio'

function App() {
  return <MediaStudio />
}
```

## 🚀 Будущие улучшения

- [ ] Кастомные макеты пользователя
- [ ] Сохранение и восстановление состояния макетов
- [ ] Анимации при переключении макетов
- [ ] Динамическая загрузка компонентов для оптимизации
- [ ] Плагинная архитектура для расширений
