# Project Settings - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/project-settings/
├── services/
│   ├── project-settings-machine.ts ✅
│   ├── project-settings-machine.test.ts ✅
│   ├── project-settings-provider.tsx ✅
│   ├── project-settings-provider.test.tsx ✅
│   └── index.ts ✅
├── hooks/
│   ├── use-project-settings.ts ✅
│   ├── use-project-settings.test.ts ✅
│   └── index.ts ✅
├── components/
│   ├── project-settings-modal.tsx ✅
│   ├── project-settings-modal.test.tsx ✅
│   └── index.ts ✅
├── utils/
│   ├── aspect-ratio-utils.ts ✅
│   ├── localization-utils.ts ✅
│   ├── settings-utils.ts ✅
│   └── index.ts ✅
├── DEV.md ✅
├── README.md ✅
└── index.ts ✅
```

## 🔧 Машина состояний

### ProjectSettingsMachine
**Файл**: `services/project-settings-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:
```typescript
interface ProjectSettingsContext {
  settings: ProjectSettings
}

interface ProjectSettings {
  name: string                    // Название проекта
  description: string             // Описание проекта
  resolution: {                   // Разрешение видео
    width: number
    height: number
  }
  frameRate: number              // Частота кадров (fps)
  duration: number               // Длительность проекта (секунды)
  audioSampleRate: number        // Частота дискретизации аудио
  audioBitrate: number           // Битрейт аудио
  videoBitrate: number           // Битрейт видео
  videoCodec: string             // Видео кодек
  audioCodec: string             // Аудио кодек
  outputFormat: string           // Формат вывода
}
```

**События**:
- `UPDATE_SETTINGS` - Обновление настроек проекта
- `RESET_SETTINGS` - Сброс настроек к значениям по умолчанию

## 🎣 Хуки

### useProjectSettings
**Файл**: `hooks/use-project-settings.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Доступ к контексту настроек проекта
- Валидация использования внутри провайдера
- TypeScript типизация
- Методы для управления настройками

**Возвращаемые данные**:
- `settings` - Текущие настройки проекта
- `updateSettings` - Функция обновления настроек
- `resetSettings` - Функция сброса настроек

**Пример использования**:
```typescript
const {
  settings,
  updateSettings,
  resetSettings
} = useProjectSettings();

// Обновление настроек
updateSettings({
  ...settings,
  name: "Новое название",
  resolution: { width: 1920, height: 1080 }
});

// Сброс к значениям по умолчанию
resetSettings();
```

## 🏗️ Архитектура

### ProjectSettingsProvider
**Файл**: `services/project-settings-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- React Context для настроек проекта
- Интеграция с ProjectSettingsMachine
- Оптимизация с useMemo
- Предоставление методов управления

**Особенности**:
- Использует `useMemo` для оптимизации производительности
- Автоматически пересоздает значение контекста только при изменениях
- Предоставляет типизированный интерфейс

### ProjectSettingsModal
**Файл**: `components/project-settings-modal.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Модальное окно настроек проекта
- Формы для всех настроек проекта
- Валидация входных данных
- Интеграция с useProjectSettings хуком

## 🧪 Тестирование

### Покрытие тестами
- ✅ `project-settings-machine.test.ts` - Тесты машины состояний
- ✅ `project-settings-provider.test.tsx` - Тесты провайдера
- ✅ `project-settings-modal.test.tsx` - Тесты модального окна
- ✅ `use-project-settings.test.ts` - Тесты хука
- ⏳ `aspect-ratio-utils.test.ts` - Тесты утилит соотношений сторон
- ⏳ `localization-utils.test.ts` - Тесты утилит локализации
- ⏳ `settings-utils.test.ts` - Тесты утилит настроек

### Тестируемые сценарии
- Создание и обновление настроек проекта
- Сброс настроек к значениям по умолчанию
- Валидация входных данных
- Корректность работы хука
- Интеграция компонентов
- Работа утилит:
  - Вычисление соотношений сторон
  - Преобразование размеров
  - Локализация текстов
  - Обновление настроек с сохранением пропорций

## 🔗 Интеграция

### Связанные компоненты
- `TopBar` - Отображает название проекта
- `Timeline` - Использует настройки разрешения и частоты кадров
- `VideoPlayer` - Использует настройки воспроизведения
- `Export` - Использует настройки кодеков и форматов

### Типы данных
- `ProjectSettings` - Основной интерфейс настроек
- `AspectRatio` - Интерфейс соотношения сторон
- `FrameRate` - Перечисление частот кадров
- `ColorSpace` - Перечисление цветовых пространств

## ⚙️ Настройки по умолчанию

```typescript
const defaultSettings: ProjectSettings = {
  name: "Новый проект",
  description: "",
  aspectRatio: {
    label: "16:9",
    textLabel: "Широкоэкранный",
    value: { width: 1920, height: 1080 }
  },
  resolution: "1920x1080",
  frameRate: "30",
  colorSpace: "rec709"
};
```

## 🔧 Конфигурация

### Поддерживаемые соотношения сторон
- 16:9 (Широкоэкранный)
- 9:16 (Портрет)
- 1:1 (Квадрат)
- 4:3 (Стандарт)
- 21:9 (Кинотеатр)
- Custom (Пользовательское)

### Поддерживаемые частоты кадров
- 24 fps (Кино)
- 25 fps (PAL)
- 30 fps (NTSC)
- 50 fps (PAL HD)
- 60 fps (NTSC HD)
- 120 fps (Высокая частота)

### Цветовые пространства
- Rec. 709 (HD)
- Rec. 2020 (4K/HDR)
- DCI-P3 (Кино)
- sRGB (Веб)
