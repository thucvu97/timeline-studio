# Options - Модуль настроек

## 📋 Обзор модуля

Модуль Options служит единой панелью для:
- Отображения параметров выбранных эффектов из модуля effects
- Отображения параметров выбранных фильтров из модуля filters
- Настройки параметров аудио
- Управления скоростью воспроизведения
- Отображения информации о выбранном медиафайле

## 📊 Статус готовности

- ✅ **Компоненты**: Основные компоненты реализованы
- ❌ **Сервисы**: Не требуются (используется для отображения параметров)
- ❌ **Хуки**: Не требуются
- ⚠️ **Тесты**: Требуют улучшения (текущее покрытие: 22.27%)
- ✅ **Основная логика**: Панель для управления параметрами эффектов/фильтров

## 🎯 Реализованные функции

### ✅ Готово
- [x] Options - основной компонент с вкладками
- [x] AudioSettings - настройки аудио (sample rate, bitrate, channels, codec)
- [x] SpeedSettings - настройки скорости воспроизведения
- [x] Табы для переключения между настройками
- [x] Интеграция в OptionsLayout
- [x] Базовые тесты компонентов

### ⚠️ Частично реализовано
- [x] VideoSettings - компонент создан (требует реализации)
- [x] MediaInfo - минимальная реализация (требует доработки)

## 📁 Структура файлов

### ✅ Существующие файлы
```
src/features/options/
├── components/
│   └── options.tsx ✅
├── __tests__/
│   └── components/
│       └── options.test.tsx ✅
└── index.ts ✅
```

### ❌ Требуется создать (планируемая архитектура)
```
src/features/options/
├── components/
│   ├── options.tsx ✅
│   ├── option-panel.tsx
│   ├── option-slider.tsx
│   ├── option-color-picker.tsx
│   ├── option-dropdown.tsx
│   └── index.ts
├── services/
│   ├── options-machine.ts
│   ├── options-provider.tsx
│   └── index.ts
├── hooks/
│   ├── use-options.ts
│   ├── use-option-presets.ts
│   └── index.ts
└── types/
    ├── options.ts
    └── index.ts
```

## 🏗️ Архитектура компонентов

### Options (текущий компонент)
**Файл**: `components/options.tsx`
**Статус**: ✅ Базовая реализация

**Текущий функционал**:
- Базовая структура компонента
- Интеграция в OptionsLayout

**Требует доработки**:
- Добавление реального функционала
- Интеграция с машиной состояний
- UI элементы управления

## 🎨 UI/UX требования

### ❌ Требует реализации

#### Структура панели
- [ ] Табы для разных категорий настроек
- [ ] Сворачиваемые секции
- [ ] Поиск по настройкам
- [ ] Быстрые пресеты

#### Элементы управления
- [ ] Слайдеры для числовых значений
- [ ] Цветовые пикеры
- [ ] Выпадающие списки
- [ ] Чекбоксы и переключатели

#### Предпросмотр
- [ ] Мгновенный предпросмотр изменений
- [ ] Сравнение до/после
- [ ] Сброс к значениям по умолчанию

## 🔄 Интеграция с другими компонентами

### ✅ Реализовано
- [x] Интеграция в OptionsLayout
- [x] Отображение в правой панели
- [x] Автоматическое переключение на вкладку Info при выборе медиафайла

### ❌ Требует реализации
- [ ] VideoSettings - отображение параметров эффектов/фильтров
- [ ] MediaInfo - полная информация о медиафайле
- [ ] Синхронизация с выбранными эффектами/фильтрами
- [ ] Применение настроек к VideoPlayer

## 🔧 Планируемая архитектура

### OptionsMachine (требует создания)
**Файл**: `services/options-machine.ts` ❌

**Контекст**:
```typescript
interface OptionsContext {
  // Настройки видео
  brightness: number
  contrast: number
  saturation: number
  hue: number
  
  // Настройки аудио
  volume: number
  bass: number
  treble: number
  
  // Настройки эффектов
  activeEffects: Effect[]
  effectParameters: Record<string, any>
  
  // UI состояние
  activePanel: string
  presets: OptionPreset[]
  isPreviewEnabled: boolean
}
```

**События**:
```typescript
type OptionsEvents = 
  | { type: 'SET_VIDEO_OPTION'; option: string; value: number }
  | { type: 'SET_AUDIO_OPTION'; option: string; value: number }
  | { type: 'APPLY_EFFECT'; effect: Effect }
  | { type: 'REMOVE_EFFECT'; effectId: string }
  | { type: 'LOAD_PRESET'; presetId: string }
  | { type: 'SAVE_PRESET'; name: string }
  | { type: 'RESET_TO_DEFAULT' }
  | { type: 'TOGGLE_PREVIEW' }
```

### OptionsProvider (требует создания)
**Файл**: `services/options-provider.tsx` ❌

**Функционал**:
- React Context для состояния опций
- Интеграция с OptionsMachine
- Предоставление хуков для компонентов

## 🎣 Планируемые хуки

### useOptions (требует создания)
**Файл**: `hooks/use-options.ts` ❌

```typescript
interface UseOptionsReturn {
  // Состояние
  videoOptions: VideoOptions
  audioOptions: AudioOptions
  activeEffects: Effect[]
  activePanel: string
  isPreviewEnabled: boolean
  
  // Действия
  setVideoOption: (option: string, value: number) => void
  setAudioOption: (option: string, value: number) => void
  applyEffect: (effect: Effect) => void
  removeEffect: (effectId: string) => void
  resetToDefault: () => void
  togglePreview: () => void
}
```

### useOptionPresets (требует создания)
**Файл**: `hooks/use-option-presets.ts` ❌

```typescript
interface UseOptionPresetsReturn {
  presets: OptionPreset[]
  loadPreset: (presetId: string) => void
  savePreset: (name: string) => void
  deletePreset: (presetId: string) => void
  createCustomPreset: (options: OptionValues) => void
}
```

## 📦 Планируемые типы данных

### OptionPreset (требует создания)
```typescript
interface OptionPreset {
  id: string
  name: string
  description?: string
  videoOptions: VideoOptions
  audioOptions: AudioOptions
  effects: Effect[]
  createdAt: Date
  isDefault: boolean
}
```

### VideoOptions (требует создания)
```typescript
interface VideoOptions {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  gamma: number
  exposure: number
  highlights: number
  shadows: number
}
```

### AudioOptions (требует создания)
```typescript
interface AudioOptions {
  volume: number
  bass: number
  treble: number
  midrange: number
  compressor: number
  limiter: number
  reverb: number
  delay: number
}
```

## 🔧 Техническая реализация

### ✅ Реализовано
- [x] Компонентная архитектура без машины состояний
- [x] Использование локального состояния для UI
- [x] Интеграция с i18n для локализации

### 📝 Архитектурное решение
Модуль Options не требует собственной машины состояний, так как:
- Служит панелью отображения для параметров других модулей
- Параметры эффектов/фильтров управляются их собственными машинами
- Настройки аудио и скорости используют локальное состояние

## 🔗 Планируемые интеграции

### Timeline интеграция
- Применение настроек к выбранным клипам
- Синхронизация с активным клипом
- Отображение настроек текущего клипа

### VideoPlayer интеграция
- Мгновенный предпросмотр изменений
- Применение эффектов в реальном времени
- Сравнение до/после

### Resources интеграция
- Применение эффектов из библиотеки
- Сохранение настроек как пресеты
- Импорт/экспорт конфигураций

## 🧪 Планируемое тестирование

### Компоненты (требует создания)
- Тесты UI элементов управления
- Тесты взаимодействий пользователя
- Тесты интеграции с провайдером

### Сервисы (требует создания)
- Тесты машины состояний
- Тесты провайдера контекста
- Тесты хуков

### Интеграция (требует создания)
- Тесты синхронизации с Timeline
- Тесты предпросмотра в VideoPlayer
- E2E тесты пользовательских сценариев

## 🚀 План реализации

### Этап 1: Базовая архитектура
1. Создать OptionsMachine
2. Создать OptionsProvider
3. Создать useOptions хук
4. Обновить Options компонент

### Этап 2: UI элементы
1. Создать OptionPanel компонент
2. Создать элементы управления (слайдеры, пикеры)
3. Добавить систему табов
4. Реализовать поиск по настройкам

### Этап 3: Интеграция
1. Интегрировать с Timeline
2. Добавить предпросмотр в VideoPlayer
3. Связать с Resources
4. Реализовать систему пресетов

### Этап 4: Продвинутые функции
1. Добавить инструменты анализа
2. Реализовать кастомные элементы
3. Добавить экспорт/импорт настроек
4. Оптимизировать производительность

## 🎯 Приоритеты реализации

### Критический приоритет
1. Создание базовой архитектуры
2. Основные элементы управления
3. Интеграция с Timeline

### Высокий приоритет
1. Предпросмотр в реальном времени
2. Система пресетов
3. Цветокоррекция
4. Реализовать VideoSettings для отображения параметров эффектов/фильтров
5. Доработать MediaInfo для полного отображения метаданных
6. Интегрировать с effects/filters для получения параметров

### Средний приоритет
1. Аудио настройки
2. Продвинутые эффекты
3. Инструменты анализа
4. Добавить real-time предпросмотр изменений
5. Синхронизация с Timeline (выбранные клипы)
6. Улучшить UI/UX элементов управления

### Низкий приоритет
1. Инструменты анализа (гистограмма, векторскоп)
2. Расширенные настройки экспорта
3. Пресеты для быстрого применения настроек

## 📈 Текущее состояние тестирования

### ⚠️ Покрытие тестов (требует улучшения)
- **Общее покрытие**: 22.27%
- **Покрытие функций**: не измерено
- **Покрытие веток**: не измерено
- **Покрытие строк**: не измерено

### 📝 Существующие тесты
- `__tests__/components/options.test.tsx` - базовые тесты (2 теста)
  - Тест рендеринга компонента
  - Тест принятия props без ошибок

### 🎯 Цели по покрытию
- **Желаемое покрытие**: > 90%
- **Минимальное покрытие**: > 80%
- **Покрытие функций**: > 85%

## 📈 Метрики успеха

### Функциональные метрики
- [ ] Время отклика настроек < 100ms
- [ ] Мгновенный предпросмотр изменений
- [ ] Сохранение состояния между сессиями

### UX метрики
- [ ] Интуитивность интерфейса
- [ ] Удобство поиска настроек
- [ ] Эффективность рабочего процесса

### Метрики качества кода
- [ ] Покрытие тестов > 90%
- [ ] Отсутствие критических ошибок линтера
- [ ] Соответствие архитектурным принципам проекта
