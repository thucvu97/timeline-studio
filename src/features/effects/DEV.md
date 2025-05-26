# Effects - Техническая документация

## 📁 Структура файлов

### ✅ Реализованная структура
```
src/features/effects/
├── components/
│   ├── effect-list.tsx ✅
│   ├── effect-preview.tsx ✅ (поддержка customParams)
│   ├── effect-categories.tsx ✅
│   ├── effect-detail.tsx ✅ (интерактивные контролы)
│   ├── effect-indicators.tsx ✅
│   ├── effect-presets.tsx ✅
│   └── effect-parameter-controls.tsx ✅ НОВЫЙ
├── hooks/
│   ├── use-effects.ts ✅
│   └── use-effects-import.ts ✅
├── utils/
│   ├── css-effects.ts ✅ (полное покрытие тестами)
│   └── effect-processor.ts ✅ (полное покрытие тестами)
├── tests/
│   ├── css-effects.test.ts ✅ НОВЫЙ
│   ├── effect-detail.test.tsx ✅ НОВЫЙ
│   ├── effect-indicators.test.tsx ✅
│   ├── effect-list.test.tsx ✅
│   ├── effect-parameter-controls.test.tsx ✅ НОВЫЙ
│   ├── effect-preview.test.tsx ✅
│   ├── effect-processor.test.ts ✅ НОВЫЙ
│   ├── use-effects.test.ts ✅
│   └── use-effects-import.test.ts ✅ НОВЫЙ
├── examples/
│   └── hooks-usage.md ✅
├── DEV.md ✅
├── README.md ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие: 100% ✅
**91 тест прошли успешно** (9 файлов тестов)

```
tests/
├── css-effects.test.ts ✅ (17 тестов)
├── effect-detail.test.tsx ✅ (6 тестов)
├── effect-indicators.test.tsx ✅ (8 тестов)
├── effect-list.test.tsx ✅ (10 тестов)
├── effect-parameter-controls.test.tsx ✅ (6 тестов)
├── effect-preview.test.tsx ✅ (13 тестов)
├── effect-processor.test.ts ✅ (23 теста)
├── use-effects.test.ts ✅ (3 теста)
└── use-effects-import.test.ts ✅ (5 тестов)
```

## 🏗️ Архитектура компонентов

### EffectList
**Файл**: `components/effect-list.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Основной компонент списка эффектов с поиском и фильтрацией

### EffectPreview
**Файл**: `components/effect-preview.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент предпросмотра эффекта с видео

### EffectCategories
**Файл**: `components/effect-categories.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент просмотра эффектов по категориям с расширенными фильтрами

### EffectDetail
**Файл**: `components/effect-detail.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Детальная информация об эффекте с параметрами и пресетами

### EffectIndicators
**Файл**: `components/effect-indicators.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Индикаторы сложности и тегов эффектов (простой дизайн без цветов)

### EffectPresets
**Файл**: `components/effect-presets.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент для работы с пресетами эффектов

### EffectParameterControls ✨ НОВЫЙ
**Файл**: `components/effect-parameter-controls.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Интерактивная настройка параметров эффектов в реальном времени

**Функциональность**:
- Интерактивные слайдеры для всех параметров эффекта
- Поддержка 8 типов параметров (intensity, speed, angle, radius, amount, threshold, temperature, tint)
- Сброс к значениям по умолчанию
- Сохранение пользовательских пресетов
- Tooltips с описанием каждого параметра
- Отображение текущих значений в реальном времени
- Интеграция с EffectDetail для обновления превью

## 📦 Типы данных

### VideoEffect
```typescript
interface VideoEffect {
  id: string
  name: string
  type: EffectType
  duration: number
  category: EffectCategory
  complexity: EffectComplexity
  tags: EffectTag[]
  description: {
    ru: string
    en: string
  }
  ffmpegCommand: (params: Record<string, any>) => string
  cssFilter?: (params: Record<string, any>) => string
  params?: Record<string, any>
  previewPath: string
  labels: {
    ru: string
    en: string
    es: string
    fr: string
    de: string
  }
  presets?: Record<string, EffectPreset>
}
```

### EffectCategory
```typescript
type EffectCategory =
  | "color-correction"    // Цветокоррекция
  | "artistic"           // Художественные
  | "vintage"            // Винтажные
  | "cinematic"          // Кинематографические
  | "creative"           // Креативные
  | "technical"          // Технические
  | "motion"             // Движение и скорость
  | "distortion"         // Искажения
```

### EffectComplexity
```typescript
type EffectComplexity = "basic" | "intermediate" | "advanced"
```

### EffectTag
```typescript
type EffectTag =
  | "popular"            // Популярный
  | "professional"       // Профессиональный
  | "beginner-friendly"  // Для начинающих
  | "experimental"       // Экспериментальный
  | "retro"             // Ретро
  | "modern"            // Современный
  | "dramatic"          // Драматический
  | "subtle"            // Тонкий
  | "intense"           // Интенсивный
```

## 🪝 Хуки

### useEffects()
**Файл**: `hooks/use-effects.ts`
**Описание**: Основной хук для загрузки всех эффектов из JSON
**Возвращает**: `{ effects, loading, error, reload, isReady }`

### useEffectCategories()
**Файл**: `hooks/use-effect-categories.ts`
**Описание**: Хук для загрузки категорий эффектов с переводами
**Возвращает**: `{ categories, loading, error, reload }`

### useEffectsImport()
**Файл**: `hooks/use-effects-import.ts`
**Статус**: ✅ Полностью реализован
**Описание**: Хук для импорта пользовательских эффектов
**Возвращает**: `{ importEffectsFile, importEffectFile, isImporting, progress }`

**Функционал**:
- Импорт JSON файлов с эффектами
- Импорт отдельных файлов эффектов (.cube, .3dl, .lut, .preset)
- Валидация структуры эффектов
- Обработка ошибок и отображение прогресса
- Интеграция с общим тулбаром браузера

### useEffectsSearch()
**Описание**: Хук для поиска эффектов по тексту
**Параметры**: `query: string, lang: 'ru' | 'en'`

### useEffectsByCategory()
**Описание**: Хук для получения эффектов по категории
**Параметры**: `category: EffectCategory`

### useEffectById()
**Описание**: Хук для получения эффекта по ID
**Параметры**: `id: string`

## 🛠️ Утилиты

### effect-processor.ts ✅ 100% покрытие тестами
**Функции**:
- `processEffect()` - преобразование сырых данных в VideoEffect
- `processEffects()` - обработка массива эффектов из JSON
- `validateEffect()` - валидация структуры отдельного эффекта
- `validateEffectsData()` - валидация данных эффектов с метаданными
- `createFallbackEffect()` - создание резервного эффекта при ошибках

**Особенности**:
- Создание функций из строковых шаблонов с параметрами
- Замена `{paramName}` на значения из объекта параметров
- Полная валидация обязательных полей
- Обработка ошибок с fallback данными

### css-effects.ts ✅ 100% покрытие тестами
**Функции**:
- `generateCSSFilterForEffect()` - генерация CSS-фильтров для превью
- `getPlaybackRate()` - получение скорости воспроизведения для эффектов
- `applySpecialEffectStyles()` - применение специальных CSS-стилей (виньетка, зерно)
- `resetEffectStyles()` - сброс всех CSS-стилей эффектов

**Особенности**:
- Поддержка всех типов эффектов
- Специальная обработка виньетки через box-shadow
- Автоматический расчет параметров на основе размера элемента
- Fallback для эффектов без CSS-фильтров

## 🌍 Интернационализация

### Поддерживаемые языки
- **Русский (ru)** - основной язык
- **Английский (en)** - международный
- **Испанский (es)** - дополнительный
- **Французский (fr)** - дополнительный
- **Немецкий (de)** - дополнительный

### Переводы включают
- Названия и описания эффектов
- Категории эффектов
- Сообщения об ошибках
- Элементы интерфейса
- Fallback данные

## 🔗 Интеграция

### Browser интеграция
```typescript
<TabsContent value="effects">
  <EffectCategories />
</TabsContent>
```

### Resources интеграция
- Используется в TimelineResources
- Отображение в категории эффектов
- Поддержка drag & drop (планируется)

### Timeline интеграция (планируется)
- Применение эффектов к клипам
- Настройка параметров в реальном времени
- Предпросмотр эффектов
